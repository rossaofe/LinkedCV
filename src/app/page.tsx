"use client";

import { useState } from "react";

interface Experience {
  title: string;
  company: string;
  duration: string;
  location?: string;
  description?: string;
}

interface Education {
  degree: string;
  field?: string;
  school: string;
  years: string;
}

interface Certification {
  name: string;
  issuer?: string;
  date?: string;
}

interface CVData {
  name: string;
  headline: string;
  location?: string;
  about?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    linkedin?: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications?: Certification[];
}

type AppState = "idle" | "loading" | "result";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [text, setText] = useState("");
  const [cv, setCv] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!text.trim()) return;
    setState("loading");
    setError(null);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinText: text }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to parse profile.");
      }
      setCv(json.data);
      setState("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  }

  function handleReset() {
    setState("idle");
    setText("");
    setCv(null);
    setError(null);
  }

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
    return (
      <div className="min-h-screen bg-slate-100 py-8 px-4">
        {/* Action bar — hidden on print */}
        <div className="no-print max-w-3xl mx-auto flex gap-3 mb-6">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Save / Print PDF
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium px-5 py-2.5 rounded-lg border border-slate-300 transition-colors"
          >
            ← Start Over
          </button>
        </div>

        {/* CV Document */}
        <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none">
          {/* Header */}
          <div className="bg-slate-800 text-white px-10 py-10">
            <h1 className="text-4xl font-bold tracking-tight">{cv.name}</h1>
            <p className="text-blue-300 text-xl mt-1">{cv.headline}</p>
            {cv.location && (
              <p className="text-slate-400 mt-1 text-sm">{cv.location}</p>
            )}
            {cv.contact && (
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-300">
                {cv.contact.email && <span>{cv.contact.email}</span>}
                {cv.contact.phone && <span>{cv.contact.phone}</span>}
                {cv.contact.website && <span>{cv.contact.website}</span>}
                {cv.contact.linkedin && <span>linkedin.com/in/{cv.contact.linkedin}</span>}
              </div>
            )}
          </div>

          <div className="px-10 py-8 space-y-8">
            {/* About */}
            {cv.about && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">About</h2>
                <p className="text-slate-700 leading-relaxed">{cv.about}</p>
              </section>
            )}

            {/* Experience */}
            {cv.experience?.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Experience</h2>
                <div className="space-y-6">
                  {cv.experience.map((exp, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      <div>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-600">{exp.company}</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-0.5">
                          {exp.duration}{exp.location ? ` · ${exp.location}` : ""}
                        </p>
                        {exp.description && (
                          <p className="text-slate-600 text-sm mt-2 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {cv.education?.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Education</h2>
                <div className="space-y-4">
                  {cv.education.map((edu, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {edu.degree}{edu.field ? ` · ${edu.field}` : ""}
                        </h3>
                        <p className="text-slate-600">{edu.school}</p>
                        <p className="text-sm text-slate-400">{edu.years}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {cv.skills?.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {cv.skills.map((skill, i) => (
                    <span key={i} className="bg-slate-100 text-slate-700 text-sm px-3 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {cv.certifications && cv.certifications.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Certifications</h2>
                <div className="space-y-3">
                  {cv.certifications.map((cert, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-slate-900">{cert.name}</h3>
                        {(cert.issuer || cert.date) && (
                          <p className="text-sm text-slate-500">
                            {[cert.issuer, cert.date].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="no-print px-10 py-4 border-t border-slate-100 text-center text-xs text-slate-400">
            Generated by <span className="font-semibold text-slate-500">LinkedCV</span>
          </div>
        </div>
      </div>
    );
  }

  // Idle / Input state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Linked<span className="text-blue-400">CV</span>
          </h1>
          <p className="text-slate-400 mt-3 text-lg">
            Paste your LinkedIn profile. Get a clean, printable CV in seconds.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Steps */}
          <div className="flex items-start gap-6 mb-6 text-sm text-slate-500 bg-slate-50 rounded-xl p-4">
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-slate-700 mb-1">How to copy your LinkedIn profile:</p>
              <p>1. Go to <span className="font-mono text-blue-600">linkedin.com/in/your-name</span></p>
              <p>2. Press <kbd className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-xs">Ctrl+A</kbd> to select all, then <kbd className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-xs">Ctrl+C</kbd> to copy</p>
              <p>3. Paste below and click Generate</p>
            </div>
          </div>

          <textarea
            className="w-full h-56 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Paste your LinkedIn profile text here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {error && (
            <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!text.trim()}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-base"
          >
            Generate My CV →
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            Your data is never stored. Everything is processed in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
