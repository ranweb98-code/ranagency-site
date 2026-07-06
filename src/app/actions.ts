"use server"

import { Resend } from "resend"

const LEAD_EMAIL = "ranweb98@gmail.com"

export interface LeadPayload {
  name: string
  phone: string
  answers: { question: string; answer: string }[]
}

export async function sendLeadEmail(lead: LeadPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set — skipping lead email")
    return { ok: false as const }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const summaryHtml = lead.answers
    .map((a) => `<p><strong>${a.question}</strong><br/>${a.answer}</p>`)
    .join("")

  try {
    await resend.emails.send({
      from: "RanAgency <onboarding@resend.dev>",
      to: LEAD_EMAIL,
      subject: `ליד חדש מהאתר: ${lead.name}`,
      html: `
        <h2>ליד חדש מטופס הייעוץ</h2>
        <p><strong>שם:</strong> ${lead.name}</p>
        <p><strong>טלפון:</strong> ${lead.phone}</p>
        ${summaryHtml}
      `,
    })
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to send lead email", error)
    return { ok: false as const }
  }
}
