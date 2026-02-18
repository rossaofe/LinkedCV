import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a CV parser. Extract structured information from a pasted LinkedIn profile text and return it as valid JSON only — no markdown, no explanation, just the JSON object.

Return this exact structure (omit optional fields if not found):
{
  "name": "Full Name",
  "headline": "Job Title / Professional Headline",
  "location": "City, Country",
  "about": "Summary/About text",
  "contact": {
    "email": "optional",
    "phone": "optional",
    "website": "optional",
    "linkedin": "optional linkedin URL or username"
  },
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 – Present",
      "location": "optional",
      "description": "optional role description"
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "field": "optional field of study",
      "school": "University/School Name",
      "years": "2015 – 2019"
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "optional issuer",
      "date": "optional date"
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { linkedinText } = body;

    if (!linkedinText || typeof linkedinText !== "string" || linkedinText.trim().length < 50) {
      return NextResponse.json(
        { error: "Please paste more LinkedIn profile text." },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Parse this LinkedIn profile:\n\n${linkedinText.slice(0, 12000)}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const parsed = JSON.parse(content.text);
    return NextResponse.json({ data: parsed });
  } catch (err) {
    const message = err instanceof SyntaxError
      ? "Could not parse the profile — try copying more of your LinkedIn page."
      : err instanceof Error
      ? err.message
      : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
