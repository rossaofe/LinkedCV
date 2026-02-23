"use client";

import { useState, useEffect, useRef } from "react";
import type { CVData } from "@/types/cv";

/* ─────────────────────────────────────────────
   Scroll-animation hook
───────────────────────────────────────────── */
function useScrollAnimations(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("in-view");
      }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ready]);
}

/* ─────────────────────────────────────────────
   Interactive CV Landing Page
───────────────────────────────────────────── */
function CVPage({ cv, onReset }: { cv: CVData; onReset: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [expandedExp, setExpandedExp] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);

  useScrollAnimations(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = cv.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const skillColors = [
    "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
    "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
    "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
    "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
  ];

  const navLinks = [
    { id: "about", label: "About" },
    { id: "experience", label: "Experience" },
    { id: "skills", label: "Skills" },
    { id: "education", label: "Education" },
    { id: "contact", label: "Contact" },
  ].filter(({ id }) => {
    if (id === "about") return !!cv.about;
    if (id === "experience") return cv.experience?.length > 0;
    if (id === "skills") return cv.skills?.length > 0;
    if (id === "education") return cv.education?.length > 0;
    if (id === "contact") return !!cv.contact;
    return true;
  });

  return (
    <div className="bg-white">

      {/* ── Sticky Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-slate-900/95 backdrop-blur-md shadow-xl border-b border-white/10"
          : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => scrollTo("hero")}
            className="text-white font-bold text-lg tracking-tight hover:text-blue-400 transition-colors"
          >
            {cv.name.split(" ")[0]}
            <span className="text-blue-400">.</span>
          </button>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors hover:text-blue-400"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-blue-500 px-3 py-1.5 rounded-full transition-all"
          >
            ← Generate Another
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        id="hero"
        ref={heroRef}
        className="hero-gradient min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden"
      >
        {/* Floating orbs */}
        <div className="orb-1 absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-2 absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-1 absolute top-1/2 right-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Avatar */}
          <div className="mx-auto mb-8 w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-4xl font-black shadow-2xl ring-4 ring-white/10">
            {initials}
          </div>

          {/* Name */}
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-none">
            {cv.name}
          </h1>

          {/* Headline */}
          <p className="text-xl md:text-2xl text-blue-300 font-light mb-4 max-w-2xl mx-auto">
            {cv.headline}
          </p>

          {/* Location */}
          {cv.location && (
            <p className="text-slate-400 text-sm mb-8 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              {cv.location}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {cv.contact?.email && (
              <a
                href={`mailto:${cv.contact.email}`}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Get in Touch
              </a>
            )}
            {cv.contact?.linkedin && (
              <a
                href={cv.contact.linkedin.startsWith("http") ? cv.contact.linkedin : `https://linkedin.com/in/${cv.contact.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full font-medium transition-all hover:-translate-y-0.5 backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}
            {cv.contact?.website && (
              <a
                href={cv.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full font-medium transition-all hover:-translate-y-0.5 backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
                </svg>
                Website
              </a>
            )}
            <button
              onClick={() => scrollTo("about")}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full font-medium transition-all hover:-translate-y-0.5 backdrop-blur-sm"
            >
              View Profile ↓
            </button>
          </div>

          {/* Scroll indicator */}
          <div className="bounce-down text-slate-500">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      {cv.about && (
        <section id="about" className="py-32 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div data-animate className="mb-4">
              <span className="text-blue-600 text-sm font-bold uppercase tracking-widest">About Me</span>
            </div>
            <h2 data-animate data-delay="100" className="text-4xl md:text-5xl font-black text-slate-900 mb-12 leading-tight">
              A little about<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">who I am.</span>
            </h2>
            <p data-animate data-delay="200" className="text-xl text-slate-600 leading-relaxed">
              {cv.about}
            </p>
          </div>
        </section>
      )}

      {/* ── Experience ── */}
      {cv.experience?.length > 0 && (
        <section id="experience" className="py-32 px-6 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <div data-animate className="mb-4">
              <span className="text-blue-600 text-sm font-bold uppercase tracking-widest">Career</span>
            </div>
            <h2 data-animate data-delay="100" className="text-4xl md:text-5xl font-black text-slate-900 mb-16">
              Experience
            </h2>

            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-200" />

              <div className="space-y-4">
                {cv.experience.map((exp, i) => (
                  <div
                    key={i}
                    data-animate
                    data-delay={String(Math.min(i * 100, 500))}
                    className="relative pl-16"
                  >
                    {/* Dot */}
                    <div className={`absolute left-4 top-6 w-4 h-4 rounded-full border-2 border-white ring-2 transition-all duration-300 ${
                      expandedExp === i ? "bg-blue-600 ring-blue-400 scale-125" : "bg-slate-300 ring-slate-200"
                    }`} />

                    {/* Card */}
                    <button
                      onClick={() => setExpandedExp(expandedExp === i ? null : i)}
                      className="w-full text-left bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {exp.title}
                            </h3>
                            <span className="text-blue-600 font-semibold">{exp.company}</span>
                          </div>
                          <p className="text-sm text-slate-400">
                            {exp.duration}{exp.location ? ` · ${exp.location}` : ""}
                          </p>
                        </div>
                        {exp.description && (
                          <svg
                            className={`w-5 h-5 text-slate-400 shrink-0 mt-1 transition-transform duration-300 ${expandedExp === i ? "rotate-180 text-blue-500" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                          </svg>
                        )}
                      </div>

                      {/* Expandable description */}
                      {exp.description && (
                        <div className={`overflow-hidden transition-all duration-500 ${
                          expandedExp === i ? "max-h-96 mt-4 opacity-100" : "max-h-0 opacity-0"
                        }`}>
                          <p className="text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                            {exp.description}
                          </p>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Skills ── */}
      {cv.skills?.length > 0 && (
        <section id="skills" className="py-32 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div data-animate className="mb-4">
              <span className="text-blue-600 text-sm font-bold uppercase tracking-widest">Expertise</span>
            </div>
            <h2 data-animate data-delay="100" className="text-4xl md:text-5xl font-black text-slate-900 mb-16">
              Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {cv.skills.map((skill, i) => (
                <span
                  key={i}
                  data-animate
                  data-delay={String(Math.min((i % 8) * 60, 500))}
                  className={`skill-pill border px-5 py-2.5 rounded-xl font-semibold text-sm cursor-default ${
                    skillColors[i % skillColors.length]
                  }`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Education ── */}
      {cv.education?.length > 0 && (
        <section id="education" className="py-32 px-6 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <div data-animate className="mb-4">
              <span className="text-blue-600 text-sm font-bold uppercase tracking-widest">Background</span>
            </div>
            <h2 data-animate data-delay="100" className="text-4xl md:text-5xl font-black text-slate-900 mb-16">
              Education
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {cv.education.map((edu, i) => (
                <div
                  key={i}
                  data-animate
                  data-delay={String(i * 150)}
                  className="relative bg-white rounded-2xl p-8 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
                >
                  {/* Gradient accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-3">{edu.years}</p>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  </h3>
                  <p className="text-slate-500 font-medium">{edu.school}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Certifications ── */}
      {cv.certifications && cv.certifications.length > 0 && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div data-animate className="mb-4">
              <span className="text-blue-600 text-sm font-bold uppercase tracking-widest">Achievements</span>
            </div>
            <h2 data-animate data-delay="100" className="text-4xl font-black text-slate-900 mb-12">
              Certifications
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {cv.certifications.map((cert, i) => (
                <div
                  key={i}
                  data-animate
                  data-delay={String(i * 100)}
                  className="bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 rounded-xl p-5 hover:border-blue-300 transition-colors"
                >
                  <div className="text-2xl mb-3">🏆</div>
                  <h3 className="font-bold text-slate-900 text-sm">{cert.name}</h3>
                  {(cert.issuer || cert.date) && (
                    <p className="text-xs text-slate-500 mt-1">
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
      <section id="contact" className="py-32 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="orb-1 absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-2 absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div data-animate className="mb-4">
            <span className="text-blue-400 text-sm font-bold uppercase tracking-widest">Let's talk</span>
          </div>
          <h2 data-animate data-delay="100" className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">touch.</span>
          </h2>
          <p data-animate data-delay="200" className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">
            Open to new opportunities, collaborations, or just a conversation.
          </p>
          <div data-animate data-delay="300" className="flex flex-wrap justify-center gap-4">
            {cv.contact?.email && (
              <a
                href={`mailto:${cv.contact.email}`}
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {cv.contact.email}
              </a>
            )}
            {cv.contact?.linkedin && (
              <a
                href={cv.contact.linkedin.startsWith("http") ? cv.contact.linkedin : `https://linkedin.com/in/${cv.contact.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:-translate-y-1 backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}
          </div>

          <div data-animate data-delay="400" className="mt-20 pt-8 border-t border-white/10 text-slate-500 text-sm">
            Built with <span className="text-slate-300 font-semibold">LinkedCV</span>
            {" · "}
            <button onClick={onReset} className="underline hover:text-slate-300 transition-colors">
              Generate your own
            </button>
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

  /* Loading */
  if (state === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center hero-gradient">
        <div className="w-14 h-14 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-white text-xl font-semibold">Building your landing page…</p>
        <p className="text-blue-300 text-sm mt-2">This usually takes 5–10 seconds</p>
      </div>
    );
  }

  /* Result */
  if (state === "result" && cv) {
    return <CVPage cv={cv} onReset={handleReset} />;
  }

  /* Idle — input form */
  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl relative z-10">
        {/* Orbs */}
        <div className="orb-1 absolute -top-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-2 absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-10 relative">
          <h1 className="text-6xl font-black text-white tracking-tight mb-3">
            Linked<span className="text-blue-400">CV</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Turn any LinkedIn profile into a stunning personal landing page.
          </p>
        </div>

        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative">
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-black/20 p-1 mb-6 border border-white/10">
            <button
              onClick={() => setMode("url")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === "url"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🔗 LinkedIn URL
            </button>
            <button
              onClick={() => setMode("paste")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === "paste"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📋 Paste Profile
            </button>
          </div>

          {mode === "url" ? (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="https://linkedin.com/in/username"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleGenerate()}
              />
              <p className="text-xs text-slate-500 mt-2">
                Requires a Proxycurl API key. Public profiles only.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Paste your LinkedIn profile text
              </label>
              <div className="text-xs text-slate-500 bg-black/20 rounded-lg p-3 mb-3 border border-white/5">
                Go to your LinkedIn profile → <kbd className="bg-white/10 rounded px-1 font-mono">Ctrl+A</kbd> → <kbd className="bg-white/10 rounded px-1 font-mono">Ctrl+C</kbd> → paste below
              </div>
              <textarea
                className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-48"
                placeholder="Paste your LinkedIn profile text here…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-400 bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!canSubmit}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all text-base hover:shadow-xl hover:shadow-blue-500/30"
          >
            Generate Landing Page →
          </button>

          <p className="text-center text-xs text-slate-500 mt-4">
            Your data is never stored. Processed in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
