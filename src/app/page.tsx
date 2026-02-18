"use client";

import { useState } from "react";
import type { CVData } from "@/types/cv";

type AppState = "idle" | "loading" | "result";
type InputMode = "url" | "paste";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [cv, setCv] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setCv(json.data);
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
    setCv(null);
    setError(null);
  }

  const canSubmit = mode === "url" ? url.trim().length > 0 : text.trim().length > 0;

  if (state === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-slate-600 text-lg font-medium">Parsing your profile…</p>
        <p className="text-slate-400 text-sm mt-2">This usually takes 5–10 seconds</p>
      </div>
    );
  }

  if (state === "result" && cv) {
    const initials = cv.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    return (
      <div className="min-h-screen bg-white">
        {/* Floating nav bar */}
        <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={handleReset}
            className="bg-white/90 backdrop-blur border border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-medium px-4 py-2 rounded-full shadow-sm transition-colors"
          >
            ← Generate Another
          </button>
        </div>

        {/* Hero */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 60%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 50%)" }}
          />
          <div className="relative max-w-5xl mx-auto px-8 py-28 flex flex-col items-center text-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-xl">
              {initials}
            </div>
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight">{cv.name}</h1>
              <p className="text-blue-300 text-xl mt-3 font-medium">{cv.headline}</p>
              {cv.location && (
                <p className="text-slate-400 mt-2 text-sm flex items-center justify-center gap-1">
                  <span>📍</span> {cv.location}
                </p>
              )}
            </div>
            {/* Contact pills */}
            {cv.contact && (
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {cv.contact.email && (
                  <a href={`mailto:${cv.contact.email}`} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    ✉ {cv.contact.email}
                  </a>
                )}
                {cv.contact.linkedin && (
                  <a href={`https://linkedin.com/in/${cv.contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    in {cv.contact.linkedin}
                  </a>
                )}
                {cv.contact.website && (
                  <a href={cv.contact.website} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    🌐 {cv.contact.website}
                  </a>
                )}
                {cv.contact.phone && (
                  <span className="bg-white/10 border border-white/20 text-white text-sm px-4 py-2 rounded-full">
                    📞 {cv.contact.phone}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 60L1440 60L1440 0C1200 50 960 60 720 40C480 20 240 0 0 30L0 60Z" fill="white"/>
            </svg>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-8 py-16 space-y-20">

          {/* About */}
          {cv.about && (
            <section className="flex flex-col md:flex-row gap-10 items-start">
              <div className="md:w-48 shrink-0">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">About</h2>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed">{cv.about}</p>
            </section>
          )}

          {/* Experience */}
          {cv.experience?.length > 0 && (
            <section className="flex flex-col md:flex-row gap-10">
              <div className="md:w-48 shrink-0">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">Experience</h2>
              </div>
              <div className="flex-1 space-y-10">
                {cv.experience.map((exp, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-slate-100">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white" />
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">{exp.title}</h3>
                      <span className="text-blue-600 font-medium">{exp.company}</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      {exp.duration}{exp.location ? ` · ${exp.location}` : ""}
                    </p>
                    {exp.description && (
                      <p className="text-slate-600 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {cv.skills?.length > 0 && (
            <section className="flex flex-col md:flex-row gap-10">
              <div className="md:w-48 shrink-0">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">Skills</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {cv.skills.map((skill, i) => (
                  <span key={i} className="bg-slate-50 border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {cv.education?.length > 0 && (
            <section className="flex flex-col md:flex-row gap-10">
              <div className="md:w-48 shrink-0">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">Education</h2>
              </div>
              <div className="flex-1 space-y-8">
                {cv.education.map((edu, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-slate-100">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-white" />
                    <h3 className="text-lg font-semibold text-slate-900">
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </h3>
                    <p className="text-indigo-600 font-medium">{edu.school}</p>
                    <p className="text-sm text-slate-400">{edu.years}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {cv.certifications && cv.certifications.length > 0 && (
            <section className="flex flex-col md:flex-row gap-10">
              <div className="md:w-48 shrink-0">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">Certifications</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {cv.certifications.map((cert, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                    <h3 className="font-semibold text-slate-900">{cert.name}</h3>
                    {(cert.issuer || cert.date) && (
                      <p className="text-sm text-slate-500 mt-1">
                        {[cert.issuer, cert.date].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
          <span className="no-print">Built with <span className="font-semibold text-slate-500">LinkedCV</span> · <button onClick={handleReset} className="underline hover:text-slate-600">Generate your own</button></span>
        </footer>
      </div>
    );
  }

  // Idle / Input state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Linked<span className="text-blue-400">CV</span>
          </h1>
          <p className="text-slate-400 mt-3 text-lg">
            Turn any LinkedIn profile into a beautiful personal landing page.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              onClick={() => setMode("url")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === "url"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              🔗 LinkedIn URL
            </button>
            <button
              onClick={() => setMode("paste")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === "paste"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              📋 Paste Profile
            </button>
          </div>

          {mode === "url" ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="https://linkedin.com/in/username"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleGenerate()}
              />
              <p className="text-xs text-slate-400 mt-2">
                Requires a Proxycurl API key configured on the server. Public profiles only.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Paste your LinkedIn profile text
              </label>
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 mb-3">
                Go to your LinkedIn profile → press <kbd className="bg-white border border-slate-200 rounded px-1 font-mono">Ctrl+A</kbd> then <kbd className="bg-white border border-slate-200 rounded px-1 font-mono">Ctrl+C</kbd> → paste below
              </div>
              <textarea
                className="w-full h-48 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Paste your LinkedIn profile text here…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!canSubmit}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-base"
          >
            Generate Landing Page →
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            Your data is never stored. Everything is processed in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
