"use server"

import { Resend } from "resend"

const LEAD_EMAIL = "ranweb98@gmail.com"

export interface LeadPayload {
  name: string
  phone: string
  answers: { question: string; answer: string }[]
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export async function sendLeadEmail(lead: LeadPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set — skipping lead email")
    return { ok: false as const }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const name = escapeHtml(lead.name)
  const phone = escapeHtml(lead.phone)

  const rows = lead.answers
    .map(
      (a) => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #eef0f5;color:#5b5f6d;font-size:14px;white-space:nowrap;vertical-align:top;">
            ${escapeHtml(a.question)}
          </td>
          <td style="padding:10px 16px;border-bottom:1px solid #eef0f5;color:#14141a;font-size:14px;font-weight:600;">
            ${escapeHtml(a.answer) || "—"}
          </td>
        </tr>`
    )
    .join("")

  try {
    await resend.emails.send({
      from: "RanAgency <onboarding@resend.dev>",
      to: LEAD_EMAIL,
      subject: `🎯 ליד חדש מהאתר: ${name}`,
      html: `
      <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;background:#f7f8fb;padding:32px 16px;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #eef0f5;">
          <div style="background:linear-gradient(135deg,#3d6bfb,#8b5cf6);padding:24px 28px;">
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;letter-spacing:0.02em;">RanAgency · ליד חדש</p>
            <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:800;">${name}</p>
          </div>
          <div style="padding:24px 28px;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
              <tr>
                <td style="padding:10px 16px;border-bottom:1px solid #eef0f5;color:#5b5f6d;font-size:14px;white-space:nowrap;">טלפון</td>
                <td style="padding:10px 16px;border-bottom:1px solid #eef0f5;color:#14141a;font-size:14px;font-weight:700;">
                  <a href="tel:${phone}" style="color:#3d6bfb;text-decoration:none;">${phone}</a>
                </td>
              </tr>
              ${rows}
            </table>
            <a
              href="https://wa.me/${phone.replace(/\D/g, "")}"
              style="display:inline-block;margin-top:12px;background:linear-gradient(135deg,#3d6bfb,#8b5cf6);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:10px 20px;border-radius:999px;"
            >
              פתח שיחת וואטסאפ עם ${name}
            </a>
          </div>
        </div>
      </div>
      `,
    })
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to send lead email", error)
    return { ok: false as const }
  }
}
