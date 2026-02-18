import { NextRequest, NextResponse } from "next/server";
import { CVData } from "@/types/cv";

export async function POST(req: NextRequest) {
  try {
    const { linkedinUrl } = await req.json();

    if (!linkedinUrl || typeof linkedinUrl !== "string") {
      return NextResponse.json({ error: "A LinkedIn URL is required." }, { status: 400 });
    }

    // Normalise URL — accept just a username too
    let url = linkedinUrl.trim();
    if (!url.startsWith("http")) {
      url = `https://www.linkedin.com/in/${url.replace(/^\//, "")}`;
    }
    if (!url.includes("linkedin.com/in/")) {
      return NextResponse.json({ error: "Please enter a valid LinkedIn profile URL (linkedin.com/in/username)." }, { status: 400 });
    }

    const apiKey = process.env.PROXYCURL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Proxycurl API key not configured on server." }, { status: 500 });
    }

    const proxycurlRes = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(url)}&skills=include&extra=include`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!proxycurlRes.ok) {
      const err = await proxycurlRes.json().catch(() => ({}));
      if (proxycurlRes.status === 404) {
        return NextResponse.json({ error: "LinkedIn profile not found or is private." }, { status: 404 });
      }
      if (proxycurlRes.status === 401) {
        return NextResponse.json({ error: "Invalid Proxycurl API key." }, { status: 500 });
      }
      return NextResponse.json({ error: (err as { detail?: string }).detail || "Failed to fetch LinkedIn profile." }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p: any = await proxycurlRes.json();

    // Map Proxycurl response → CVData
    const cv: CVData = {
      name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
      headline: p.headline || p.occupation || "",
      location: [p.city, p.state, p.country_full_name].filter(Boolean).join(", ") || undefined,
      about: p.summary || undefined,
      contact: {
        email: p.personal_emails?.[0] || p.work_email || undefined,
        linkedin: url,
        website: p.personal_websites?.[0]?.url || undefined,
      },
      experience: (p.experiences || []).map((e: any) => ({
        title: e.title || "",
        company: e.company || "",
        duration: formatDateRange(e.starts_at, e.ends_at),
        location: e.location || undefined,
        description: e.description || undefined,
      })),
      education: (p.education || []).map((e: any) => ({
        degree: e.degree_name || "Degree",
        field: e.field_of_study || undefined,
        school: e.school || "",
        years: formatDateRange(e.starts_at, e.ends_at),
      })),
      skills: (p.skills || []).map((s: any) => (typeof s === "string" ? s : s.name)).filter(Boolean),
      certifications: (p.certifications || []).map((c: any) => ({
        name: c.name || "",
        issuer: c.authority || undefined,
        date: c.starts_at ? `${c.starts_at.year}` : undefined,
      })),
    };

    return NextResponse.json({ data: cv });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong." },
      { status: 500 }
    );
  }
}

function formatDateRange(
  start?: { year?: number; month?: number },
  end?: { year?: number; month?: number }
): string {
  const fmt = (d?: { year?: number; month?: number }) => {
    if (!d?.year) return null;
    if (!d.month) return `${d.year}`;
    const m = new Date(d.year, d.month - 1).toLocaleString("en", { month: "short" });
    return `${m} ${d.year}`;
  };
  const s = fmt(start);
  const e = fmt(end) ?? "Present";
  if (!s) return "";
  return `${s} – ${e}`;
}
