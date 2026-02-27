"use client";

import { useState, useEffect } from "react";
import type { CVData } from "@/types/cv";

/* ─────────────────────────────────────────────
   Parse raw LinkedIn "about" blob into parts
───────────────────────────────────────────── */
function parseAbout(text: string): { intro: string; highlights: string[]; closing: string } {
  const hasBullets = /[•·]/.test(text);

  if (!hasBullets) {
    // No bullets — split into paragraphs by double-newline or long sentences
    const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const intro = paras.slice(0, -1).join("\n\n") || paras[0] || text;
    const closing = paras.length > 1 ? paras[paras.length - 1] : "";
    return { intro, highlights: [], closing };
  }

  const firstBullet = text.indexOf("•") !== -1 ? text.indexOf("•") : text.indexOf("·");
  const intro = text.slice(0, firstBullet).trim();
  const rest = text.slice(firstBullet);

  // Each bullet is the text between one bullet char and the next
  const bulletMatches = rest.match(/[•·][^•·]+/g) ?? [];
  const bullets = bulletMatches.map((b) => b.replace(/^[•·]\s*/, "").trim()).filter(Boolean);

  // If the last "bullet" is long with multiple sentences it's probably a closing paragraph
  let highlights = bullets;
  let closing = "";
  if (bullets.length > 0) {
    const last = bullets[bullets.length - 1];
    if ((last.match(/\.\s/g) ?? []).length >= 2 || last.length > 150) {
      highlights = bullets.slice(0, -1);
      closing = last;
    }
  }

  return { intro, highlights, closing };
}

/* ─────────────────────────────────────────────
   Derive trait buzzwords from CV data
───────────────────────────────────────────── */
function deriveTraits(cv: CVData): string[] {
  const traits: string[] = [];

  const allText = [
    cv.about ?? "",
    cv.headline ?? "",
    ...(cv.experience ?? []).flatMap(e => [e.title ?? "", e.description ?? ""]),
    cv.personalInfo ?? "",
  ].join(" ").toLowerCase();

  const titles = (cv.experience ?? []).map(e => (e.title ?? "").toLowerCase());

  if (titles.some(t => /\b(lead|manager|head of|director|vp |chief|president|senior)\b/.test(t)))
    traits.push("Natural Leader");
  if (titles.some(t => /\b(strateg|head of|director|vp |chief|principal)\b/.test(t)) ||
    /\b(strateg|vision|roadmap|executive)\b/.test(allText))
    traits.push("Strategic Thinker");
  if (/\b(\d+%|\d+x|revenue|growth|delivered|impact|results|targets|exceeded)\b/.test(allText))
    traits.push("Results-Driven");
  if (/\b(team|collaborat|cross.functional|stakeholder|partner)\b/.test(allText))
    traits.push("Team Player");
  if (/\b(communicat|present|client|customer|relations|stakeholder)\b/.test(allText))
    traits.push("Strong Communicator");
  if ((cv.skills ?? []).length >= 6 || /\b(engineer|developer|architect|software|technical)\b/.test(allText))
    traits.push("Technically Fluent");
  if (/\b(founder|co.founder|entrepreneur|startup|self.employ)\b/.test(allText))
    traits.push("Entrepreneurial");
  if (/\b(data|analytic|insight|research|metrics|kpi|dashboard)\b/.test(allText))
    traits.push("Data-Driven");
  if ((cv.certifications ?? []).length >= 1 || /\b(certif|upskill|course)\b/.test(allText))
    traits.push("Continuous Learner");
  if ((cv.experience ?? []).length >= 4 || /\b(adapt|resilien|pivot|transiti|versatil)\b/.test(allText))
    traits.push("Resilient");
  if (/\b(passion|driven|motivat|commit|dedic|enthusias|ambiti)\b/.test(allText))
    traits.push("Driven");
  if (/\b(marathon|sport|run|football|cricket|gym|fitness|athlet|swim|cycl|hik|climb|compet)\b/.test(allText))
    traits.push("High Performer");
  if (/\b(coach|mentor|teach|train|guide|volunteer)\b/.test(allText))
    traits.push("Mentor & Coach");
  if (/\b(creativ|design|brand|market|storytell|content|innovat)\b/.test(allText))
    traits.push("Creative");
  if (/\b(global|international|multinational|cross.border|worldwide)\b/.test(allText))
    traits.push("Global Mindset");
  if (/\b(problem.solv|solution|complex|troubleshoot|optimi)\b/.test(allText))
    traits.push("Problem Solver");

  // Ensure at least a few traits
  if (!traits.includes("Driven")) traits.push("Driven");
  if (traits.length < 3 && !traits.includes("Resilient")) traits.push("Resilient");
  if (traits.length < 4 && !traits.includes("Team Player")) traits.push("Team Player");

  return [...new Set(traits)].slice(0, 8);
}

/* ─────────────────────────────────────────────
   Extract key stats/figures from a job description
───────────────────────────────────────────── */
function extractStats(desc: string): { value: string; label: string }[] {
  const results: { value: string; label: string }[] = [];
  const seen = new Set<string>();

  function add(value: string, label: string) {
    if (!seen.has(value) && results.length < 4) { seen.add(value); results.push({ value, label }); }
  }

  // Currency with M/K/B suffix — highest impact so check first
  for (const m of desc.matchAll(/([£$€])(\d+(?:\.\d+)?)([MKBmkb])\b/g)) {
    const ctx = (desc.slice(Math.max(0, m.index! - 35), m.index!) + desc.slice(m.index! + m[0].length, m.index! + m[0].length + 35)).toLowerCase();
    const label = /sav/.test(ctx) ? "Savings" : /revenue|sales/.test(ctx) ? "Revenue" : /fund/.test(ctx) ? "Funding" : /contract|deal/.test(ctx) ? "Contracts" : /budget/.test(ctx) ? "Budget" : "Value";
    add(`${m[1]}${m[2]}${m[3].toUpperCase()}`, label);
  }

  // Percentages with context
  for (const m of desc.matchAll(/(\d+(?:\.\d+)?)%/g)) {
    const ctx = (desc.slice(Math.max(0, m.index! - 45), m.index!) + desc.slice(m.index! + m[0].length, m.index! + m[0].length + 35)).toLowerCase();
    const label = /revenue|sales|grow/.test(ctx) ? "Revenue Growth" : /cost|spend|budget/.test(ctx) ? "Cost Reduction" : /efficien/.test(ctx) ? "Efficiency Gain" : /retention|churn/.test(ctx) ? "Retention" : /conversion/.test(ctx) ? "Conversion" : /reduc|decreas|cut/.test(ctx) ? "Reduction" : "Improvement";
    add(`${m[1]}%`, label);
  }

  // Team size
  const teamM = desc.match(/(?:lead|led|manag|oversee|oversaw|supervis)[^.]{0,25}?(\d{1,3})\s*(?:people|person|staff|engineer|dev|member|report|direct|head)/i) || desc.match(/team of (\d{1,3})/i);
  if (teamM) add(teamM[1], "Team Size");

  // Clients/users
  const clientM = desc.match(/(\d+)\s*\+?\s*(?:client|customer|user|account)\b/i);
  if (clientM) add(`${clientM[1]}+`, "Clients");

  // Projects/products
  const projM = desc.match(/(\d+)\s*\+?\s*(?:project|product|initiative|programme)\b/i);
  if (projM) add(projM[1], "Projects");

  // Countries/markets
  const mktM = desc.match(/(\d+)\s*\+?\s*(?:countr|market|region|office|site)\b/i);
  if (mktM) add(`${mktM[1]}+`, "Markets");

  return results;
}

/* ─────────────────────────────────────────────
   Compute headline figures from CV data
───────────────────────────────────────────── */
function computeStats(cv: CVData): { value: string; label: string }[] {
  const stats: { value: string; label: string }[] = [];

  // Years of experience — find earliest start year across all roles
  const startYears: number[] = [];
  for (const exp of cv.experience ?? []) {
    const m = exp.duration?.match(/\b(19|20)\d{2}\b/);
    if (m) startYears.push(parseInt(m[0]));
  }
  if (startYears.length > 0) {
    const earliest = Math.min(...startYears);
    const yrs = new Date().getFullYear() - earliest;
    if (yrs >= 1 && yrs <= 50) stats.push({ value: `${yrs}+`, label: "Years Experience" });
  }

  // Unique companies
  const companies = new Set((cv.experience ?? []).map(e => e.company).filter(Boolean));
  if (companies.size >= 2) stats.push({ value: `${companies.size}`, label: "Companies" });

  // Skills count
  if ((cv.skills ?? []).length > 0)
    stats.push({ value: `${cv.skills.length}+`, label: "Skills" });

  // Certifications
  if ((cv.certifications ?? []).length > 0)
    stats.push({ value: `${cv.certifications!.length}`, label: "Certifications" });

  return stats;
}

/* ─────────────────────────────────────────────
   Avatar — shows photo or initials fallback
───────────────────────────────────────────── */
function Avatar({ photoUrl, name, size = "lg" }: { photoUrl?: string; name: string; size?: "sm" | "lg" }) {
  const [err, setErr] = useState(false);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const dim = size === "lg" ? "w-36 h-36 text-4xl" : "w-10 h-10 text-base";

  if (photoUrl && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        onError={() => setErr(true)}
        className={`${dim} rounded-full object-cover ring-4 ring-white/20 shadow-2xl`}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center font-black text-white shadow-2xl ring-4 ring-white/10`}>
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Scroll animations hook
───────────────────────────────────────────── */
function useScrollAnimations() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─────────────────────────────────────────────
   CV Landing Page
───────────────────────────────────────────── */
function CVPage({ cv, onReset }: { cv: CVData; onReset: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [expandedExp, setExpandedExp] = useState<number | null>(null);

  useScrollAnimations();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const navLinks = [
    { id: "about", label: "About", show: !!cv.about },
    { id: "experience", label: "Experience", show: cv.experience?.length > 0 },
    { id: "skills", label: "Skills", show: cv.skills?.length > 0 },
    { id: "education", label: "Education", show: cv.education?.length > 0 },
    { id: "contact", label: "Contact", show: true },
  ].filter((l) => l.show);

  const pillColors = [
    "bg-indigo-950 text-indigo-300 border-indigo-800 hover:bg-indigo-900",
    "bg-violet-950 text-violet-300 border-violet-800 hover:bg-violet-900",
    "bg-purple-950 text-purple-300 border-purple-800 hover:bg-purple-900",
    "bg-blue-950 text-blue-300 border-blue-800 hover:bg-blue-900",
    "bg-fuchsia-950 text-fuchsia-300 border-fuchsia-800 hover:bg-fuchsia-900",
  ];

  return (
    <div className="bg-black text-white" style={{ fontFamily: "var(--font-nunito), Nunito, sans-serif" }}>

      {/* ── Sticky Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-black/90 backdrop-blur-xl border-b border-white/5 shadow-2xl" : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => scrollTo("hero")} className="text-white font-black text-xl tracking-tight hover:text-indigo-400 transition-colors">
            {cv.name.split(" ")[0]}<span className="text-indigo-400">.</span>
          </button>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-zinc-400 hover:text-white text-sm font-semibold transition-colors">
                {label}
              </button>
            ))}
          </div>
          <button onClick={onReset} className="text-xs text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-full transition-all">
            ← New CV
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section id="hero" className="hero-bg min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden px-6">
        {/* Subtle coloured orbs — not too bright */}
        <div className="orb-1 absolute top-1/4 left-1/5 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="orb-2 absolute bottom-1/4 right-1/5 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="orb-1 absolute top-3/4 left-1/2 w-72 h-72 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Photo */}
          <div className="mx-auto mb-8 flex justify-center">
            <Avatar photoUrl={cv.photoUrl} name={cv.name} size="lg" />
          </div>

          {/* Name — white on black, maximum contrast */}
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white mb-4 leading-none">
            {cv.name}
          </h1>

          {/* Headline — soft but readable */}
          <p className="text-xl md:text-2xl text-zinc-300 font-semibold mb-3 max-w-2xl mx-auto">
            {cv.headline}
          </p>

          {/* Location */}
          {cv.location && (
            <p className="text-zinc-500 text-sm mb-10 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              {cv.location}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {cv.contact?.email && (
              <a href={`mailto:${cv.contact.email}`}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Email Me
              </a>
            )}
            {cv.contact?.linkedin && (
              <a href={cv.contact.linkedin.startsWith("http") ? cv.contact.linkedin : `https://linkedin.com/in/${cv.contact.linkedin}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:-translate-y-0.5 backdrop-blur-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}
            {cv.contact?.website && (
              <a href={cv.contact.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:-translate-y-0.5 backdrop-blur-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
                </svg>
                Website
              </a>
            )}
            <button onClick={() => scrollTo("about")}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:-translate-y-0.5 backdrop-blur-sm">
              View Profile ↓
            </button>
          </div>

          <div className="bounce-down text-zinc-600">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      {(() => {
        const parsed = cv.about ? parseAbout(cv.about) : null;
        const traits = deriveTraits(cv);
        const stats = computeStats(cv);
        return (
          <section id="about" className="py-24 px-6 bg-zinc-950">
            <div className="max-w-5xl mx-auto">

              {/* ── Two-column: narrative + quick facts ── */}
              {cv.about && <div className="grid md:grid-cols-3 gap-10 mb-14">

                {/* Left — narrative (2 cols) */}
                <div className="md:col-span-2">
                  <span data-animate className="inline-block text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">
                    About
                  </span>
                  <h2 data-animate data-delay="100" className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-6 leading-tight">
                    Who I am.
                  </h2>
                  {parsed?.intro && (
                    <p data-animate data-delay="200" className="text-lg text-zinc-300 leading-relaxed max-w-2xl mb-5">
                      {parsed.intro}
                    </p>
                  )}
                  {parsed?.closing && (
                    <p data-animate data-delay="300" className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                      {parsed.closing}
                    </p>
                  )}
                </div>

                {/* Right — quick facts card */}
                <div data-animate data-delay="200">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4 md:sticky md:top-24">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 pb-1 border-b border-zinc-800">
                      Quick facts
                    </p>

                    {cv.location && (
                      <div className="flex items-start gap-3">
                        <svg className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <div>
                          <p className="text-xs text-zinc-600 font-medium">Location</p>
                          <p className="text-sm text-zinc-200 font-semibold">{cv.location}</p>
                        </div>
                      </div>
                    )}

                    {cv.headline && (
                      <div className="flex items-start gap-3">
                        <svg className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        <div>
                          <p className="text-xs text-zinc-600 font-medium">Role</p>
                          <p className="text-sm text-zinc-200 font-semibold leading-snug">{cv.headline}</p>
                        </div>
                      </div>
                    )}

                    {cv.contact?.email && (
                      <div className="flex items-start gap-3">
                        <svg className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        <div>
                          <p className="text-xs text-zinc-600 font-medium">Email</p>
                          <a href={`mailto:${cv.contact.email}`} className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                            {cv.contact.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {cv.contact?.linkedin && (
                      <div className="flex items-start gap-3">
                        <svg className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <div>
                          <p className="text-xs text-zinc-600 font-medium">LinkedIn</p>
                          <a
                            href={cv.contact.linkedin.startsWith("http") ? cv.contact.linkedin : `https://linkedin.com/in/${cv.contact.linkedin}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                          >
                            View profile →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>}

              {/* ── Snapshot row: current role · education · personal ── */}
              {(cv.experience?.[0] || cv.education?.[0] || cv.personalInfo) && (
                <div data-animate data-delay="300" className="grid sm:grid-cols-3 gap-4 mb-10">
                  {cv.experience?.[0] && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">Currently</p>
                      <p className="text-sm font-bold text-white leading-snug">{cv.experience[0].title}</p>
                      <p className="text-xs text-indigo-400 font-semibold mt-0.5">{cv.experience[0].company}</p>
                    </div>
                  )}
                  {cv.education?.[0] && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">Education</p>
                      <p className="text-sm font-bold text-white leading-snug">
                        {cv.education[0].degree}{cv.education[0].field ? ` in ${cv.education[0].field}` : ""}
                      </p>
                      <p className="text-xs text-zinc-400 font-semibold mt-0.5">{cv.education[0].school}</p>
                    </div>
                  )}
                  {cv.personalInfo && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">Beyond work</p>
                      <p className="text-sm text-zinc-300 font-semibold leading-relaxed">{cv.personalInfo}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Stats strip ── */}
              {stats.length > 0 && (
                <div data-animate data-delay="350" className={`grid gap-4 mb-10 ${stats.length <= 2 ? "grid-cols-2" : stats.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
                  {stats.map((s, i) => (
                    <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 text-center">
                      <p className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tight">{s.value}</p>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Focus area traits (derived from experience + personal info) ── */}
              {traits.length > 0 && (
                <div data-animate data-delay="400">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Focus areas</p>
                  <div className="flex flex-wrap gap-2.5">
                    {traits.map((t, i) => (
                      <span key={i}
                        className="px-4 py-2 rounded-full border border-indigo-800/50 bg-indigo-950/50 text-indigo-200 text-sm font-bold hover:border-indigo-500/60 hover:bg-indigo-900/40 transition-colors cursor-default">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CTA ── */}
              {cv.contact?.email && (
                <div data-animate data-delay="400" className="mt-12 pt-8 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-zinc-500 font-semibold">Open to connecting — always happy to have a conversation.</p>
                  <a href={`mailto:${cv.contact.email}`} className="text-sm text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                    Get in touch →
                  </a>
                </div>
              )}

            </div>
          </section>
        );
      })()}

      {/* ── Experience ── */}
      {cv.experience?.length > 0 && (
        <section id="experience" className="py-32 px-6 bg-black">
          <div className="max-w-4xl mx-auto">
            <span data-animate className="inline-block text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4">Career</span>
            <h2 data-animate data-delay="100" className="text-4xl md:text-5xl font-black text-white mb-16">Experience</h2>
            <div className="relative">
              <div className="absolute left-5 top-2 bottom-2 w-px bg-zinc-800" />
              <div className="space-y-4">
                {cv.experience.map((exp, i) => (
                  <div key={i} data-animate data-delay={String(Math.min(i * 100, 500))} className="relative pl-14">
                    <div className={`absolute left-[14px] top-6 w-[22px] h-[22px] rounded-full border-2 border-black transition-all duration-300 ${
                      expandedExp === i ? "bg-indigo-500 ring-4 ring-indigo-500/30 scale-110" : "bg-zinc-700 ring-2 ring-zinc-800"
                    }`} />
                    <div className={`bg-zinc-900 rounded-2xl border transition-all duration-300 ${expandedExp === i ? "border-indigo-500/40 shadow-xl shadow-indigo-950/30" : "border-zinc-800 hover:border-zinc-700"}`}>
                      {/* Card header — always visible, click to toggle */}
                      <button
                        onClick={() => setExpandedExp(expandedExp === i ? null : i)}
                        className="w-full text-left p-6 group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
                              <h3 className="text-lg font-extrabold text-white group-hover:text-indigo-300 transition-colors">{exp.title}</h3>
                              <span className="text-indigo-400 font-bold text-sm">{exp.company}</span>
                            </div>
                            <p className="text-sm text-zinc-500 font-medium">
                              {exp.duration}{exp.location ? ` · ${exp.location}` : ""}
                            </p>
                          </div>
                          {exp.description && (
                            <svg className={`w-5 h-5 shrink-0 mt-1 transition-transform duration-300 ${expandedExp === i ? "rotate-180 text-indigo-400" : "text-zinc-600"}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                            </svg>
                          )}
                        </div>
                      </button>

                      {/* Expanded body */}
                      {exp.description && (
                        <div className={`overflow-hidden transition-all duration-500 ${expandedExp === i ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
                          <div className="px-6 pb-6 border-t border-zinc-800/80">
                            {/* Stats extracted from description */}
                            {(() => {
                              const s = extractStats(exp.description);
                              if (s.length === 0) return null;
                              return (
                                <div className={`grid gap-3 pt-5 mb-5 ${s.length === 1 ? "grid-cols-1" : s.length === 2 ? "grid-cols-2" : s.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
                                  {s.map((stat, j) => (
                                    <div key={j} className="rounded-xl bg-indigo-950/50 border border-indigo-900/50 p-3 text-center">
                                      <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                            {/* Description body */}
                            <div className={extractStats(exp.description).length > 0 ? "" : "pt-5"}>
                              {exp.description.split(/\n|[•·]\s*/).map(s => s.trim()).filter(Boolean).length > 1 ? (
                                <ul className="space-y-2">
                                  {exp.description.split(/\n|[•·]\s*/).map(s => s.trim()).filter(Boolean).map((line, j) => (
                                    <li key={j} className="flex gap-2.5 text-sm text-zinc-400 font-medium leading-relaxed">
                                      <span className="text-indigo-500 mt-1 shrink-0">▸</span>
                                      <span>{line}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-zinc-400 leading-relaxed font-medium">{exp.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Skills ── */}
      {cv.skills?.length > 0 && (
        <section id="skills" className="py-32 px-6 bg-zinc-950">
          <div className="max-w-4xl mx-auto">
            <span data-animate className="inline-block text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4">Expertise</span>
            <h2 data-animate data-delay="100" className="text-4xl md:text-5xl font-black text-white mb-16">Skills</h2>
            <div className="flex flex-wrap gap-3">
              {cv.skills.map((skill, i) => (
                <span key={i} data-animate data-delay={String(Math.min((i % 8) * 60, 500))}
                  className={`skill-pill border px-5 py-2.5 rounded-2xl font-bold text-sm cursor-default ${pillColors[i % pillColors.length]}`}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Education ── */}
      {cv.education?.length > 0 && (
        <section id="education" className="py-32 px-6 bg-black">
          <div className="max-w-4xl mx-auto">
            <span data-animate className="inline-block text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4">Background</span>
            <h2 data-animate data-delay="100" className="text-4xl md:text-5xl font-black text-white mb-16">Education</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {cv.education.map((edu, i) => (
                <div key={i} data-animate data-delay={String(i * 150)}
                  className="relative bg-zinc-900 rounded-2xl p-8 border border-zinc-800 overflow-hidden group hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest mb-3">{edu.years}</p>
                  <h3 className="text-xl font-extrabold text-white mb-1">
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  </h3>
                  <p className="text-zinc-400 font-semibold">{edu.school}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Certifications ── */}
      {cv.certifications && cv.certifications.length > 0 && (
        <section className="py-20 px-6 bg-zinc-950">
          <div className="max-w-4xl mx-auto">
            <span data-animate className="inline-block text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4">Achievements</span>
            <h2 data-animate data-delay="100" className="text-4xl font-black text-white mb-12">Certifications</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {cv.certifications.map((cert, i) => (
                <div key={i} data-animate data-delay={String(i * 100)}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-colors">
                  <div className="text-2xl mb-3">🏆</div>
                  <h3 className="font-extrabold text-white text-sm">{cert.name}</h3>
                  {(cert.issuer || cert.date) && (
                    <p className="text-xs text-zinc-500 mt-1 font-medium">
                      {[cert.issuer, cert.date].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Contact ── */}
      <section id="contact" className="py-32 px-6 bg-black relative overflow-hidden">
        <div className="orb-1 absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-2 absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span data-animate className="inline-block text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4">Let&apos;s talk</span>
          <h2 data-animate data-delay="100" className="text-5xl md:text-7xl font-black mb-6 leading-tight text-white">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">touch.</span>
          </h2>
          <p data-animate data-delay="200" className="text-zinc-400 text-lg mb-12 max-w-xl mx-auto font-semibold">
            Open to new opportunities, collaborations, or just a conversation.
          </p>
          <div data-animate data-delay="300" className="flex flex-wrap justify-center gap-4">
            {cv.contact?.email && (
              <a href={`mailto:${cv.contact.email}`}
                className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-extrabold text-lg transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {cv.contact.email}
              </a>
            )}
            {cv.contact?.linkedin && (
              <a href={cv.contact.linkedin.startsWith("http") ? cv.contact.linkedin : `https://linkedin.com/in/${cv.contact.linkedin}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-indigo-500/50 text-white px-8 py-4 rounded-2xl font-extrabold text-lg transition-all hover:-translate-y-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}
          </div>
          <div data-animate data-delay="400" className="mt-20 pt-8 border-t border-zinc-900 text-zinc-600 text-sm font-semibold">
            Built with <span className="text-zinc-400">LinkedCV</span>
            {" · "}
            <button onClick={onReset} className="underline hover:text-zinc-300 transition-colors">Generate your own</button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main App
───────────────────────────────────────────── */
type AppState = "idle" | "loading" | "result";
type InputMode = "url" | "paste";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [personalInfo, setPersonalInfo] = useState("");
  const [showPersonal, setShowPersonal] = useState(false);
  const [cv, setCv] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Listen for image pastes anywhere on the page (idle state only)
  useEffect(() => {
    if (state !== "idle") return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setPhotoPreview(dataUrl);
            setPhotoUrl(dataUrl);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [state]);

  async function handleGenerate() {
    setState("loading");
    setError(null);
    try {
      let res: Response;
      if (mode === "url") {
        if (!url.trim()) return;
        res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkedinUrl: url }),
        });
      } else {
        if (!text.trim()) return;
        res = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkedinText: text }),
        });
      }
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to generate CV.");
      // Merge manually-entered photo URL for paste mode
      const data: CVData = {
        ...json.data,
        photoUrl: json.data.photoUrl || (photoUrl.trim() || undefined),
        personalInfo: personalInfo.trim() || undefined,
      };
      setCv(data);
      setState("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  }

  function handleReset() {
    setState("idle");
    setUrl("");
    setText("");
    setPhotoUrl("");
    setPhotoPreview("");
    setPersonalInfo("");
    setShowPersonal(false);
    setCv(null);
    setError(null);
  }

  const canSubmit = mode === "url" ? url.trim().length > 0 : text.trim().length > 0;

  if (state === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black" style={{ fontFamily: "var(--font-nunito), Nunito, sans-serif" }}>
        <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-white text-xl font-extrabold">Building your landing page…</p>
        <p className="text-zinc-500 text-sm mt-2 font-semibold">This usually takes 5–10 seconds</p>
      </div>
    );
  }

  if (state === "result" && cv) {
    return <CVPage cv={cv} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ fontFamily: "var(--font-nunito), Nunito, sans-serif" }}>
      {/* orbs */}
      <div className="orb-1 absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="orb-2 absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black text-white tracking-tight mb-3">
            Linked<span className="text-indigo-400">CV</span>
          </h1>
          <p className="text-zinc-400 text-lg font-semibold">
            Turn any LinkedIn profile into a stunning personal landing page.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex rounded-2xl bg-black p-1 mb-6 border border-zinc-800">
            <button onClick={() => setMode("url")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                mode === "url" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500 hover:text-white"
              }`}>
              🔗 LinkedIn URL
            </button>
            <button onClick={() => setMode("paste")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                mode === "paste" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500 hover:text-white"
              }`}>
              📋 Paste Profile
            </button>
          </div>

          {mode === "url" ? (
            <div>
              <label className="block text-sm font-bold text-zinc-300 mb-2">LinkedIn Profile URL</label>
              <input type="url"
                className="w-full bg-black border border-zinc-700 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-semibold transition-colors"
                placeholder="https://linkedin.com/in/username"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleGenerate()}
              />
              <p className="text-xs text-zinc-600 mt-2 font-semibold">Requires a Proxycurl API key. Public profiles only.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Paste your LinkedIn profile text</label>
                <div className="text-xs text-zinc-600 bg-black rounded-xl p-3 mb-3 border border-zinc-800 font-semibold">
                  Go to your LinkedIn profile → <kbd className="bg-zinc-800 rounded px-1.5 py-0.5 font-mono">Ctrl+A</kbd> → <kbd className="bg-zinc-800 rounded px-1.5 py-0.5 font-mono">Ctrl+C</kbd> → paste below
                </div>
                <textarea
                  className="w-full bg-black border border-zinc-700 focus:border-indigo-500 rounded-2xl p-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none h-44 font-medium transition-colors"
                  placeholder="Paste your LinkedIn profile text here…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">
                  Profile photo <span className="text-zinc-600 font-semibold">(optional)</span>
                </label>
                {photoPreview ? (
                  <div className="flex items-center gap-4 bg-black border border-zinc-700 rounded-2xl p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Preview" className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/40" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">Photo added ✓</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Paste a new image to replace it</p>
                    </div>
                    <button
                      onClick={() => { setPhotoPreview(""); setPhotoUrl(""); }}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-950/30"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 bg-black border border-dashed border-zinc-700 hover:border-indigo-500/50 rounded-2xl px-4 py-5 text-zinc-500 transition-colors cursor-default">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span className="text-sm font-semibold">
                      Copy your photo then press <kbd className="bg-zinc-800 text-zinc-300 rounded px-1.5 py-0.5 font-mono text-xs">Ctrl+V</kbd> anywhere
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personal details — expandable */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowPersonal(!showPersonal)}
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 font-bold transition-colors"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showPersonal ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
              Add personal details <span className="text-zinc-700">(hobbies, sports, interests — optional)</span>
            </button>
            {showPersonal && (
              <textarea
                className="mt-3 w-full bg-black border border-zinc-700 focus:border-indigo-500 rounded-2xl p-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none h-24 font-medium transition-colors"
                placeholder="e.g. I run marathons, coach youth football, and am learning to cook Italian food…"
                value={personalInfo}
                onChange={(e) => setPersonalInfo(e.target.value)}
              />
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 font-semibold">
              {error}
            </p>
          )}

          <button onClick={handleGenerate} disabled={!canSubmit}
            className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-2xl transition-all text-base hover:shadow-2xl hover:shadow-indigo-500/25">
            Generate Landing Page →
          </button>

          <p className="text-center text-xs text-zinc-600 mt-4 font-semibold">
            Your data is never stored. Processed in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
