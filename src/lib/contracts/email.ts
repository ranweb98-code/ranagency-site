import "server-only"

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { Resend } from "resend"

const FROM = "נפוץ' <hello@napuch.co.il>"

export function ownerEmail(): string {
  return process.env.CONTRACT_OWNER_EMAIL || "ranweb98@gmail.com"
}

export function baseUrl(): string {
  return (process.env.CONTRACT_BASE_URL || "https://napuch.co.il").replace(/\/+$/, "")
}

export function signingUrl(token: string): string {
  return `${baseUrl()}/sign/${token}`
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

interface Mail {
  to: string
  subject: string
  html: string
  attachment?: { filename: string; content: Buffer }
}

/** Sends through Resend. With no RESEND_API_KEY, outside production, the mail
 *  is written to .dev-outbox/ instead, so the whole flow can be tried locally
 *  without sending a real email. In production a missing key is a failure. */
async function deliver(mail: Mail): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") return false
    const dir = path.join(process.cwd(), ".dev-outbox")
    await mkdir(dir, { recursive: true })
    const stamp = `${Date.now()}-${mail.to.replace(/[^a-z0-9@.]/gi, "_")}`
    await writeFile(path.join(dir, `${stamp}.json`), JSON.stringify({ to: mail.to, subject: mail.subject, html: mail.html }, null, 2))
    if (mail.attachment) await writeFile(path.join(dir, `${stamp}-${mail.attachment.filename}`), mail.attachment.content)
    return true
  }
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      attachments: mail.attachment ? [{ filename: mail.attachment.filename, content: mail.attachment.content }] : undefined,
    })
    return !error
  } catch {
    return false
  }
}

function shell(title: string, inner: string): string {
  return `
  <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;background:#f5f5f4;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e7e7e5;">
      <div style="background:#111111;padding:22px 28px;">
        <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">${escapeHtml(title)}</p>
      </div>
      <div style="padding:24px 28px;color:#111111;font-size:15px;line-height:1.7;">${inner}</div>
    </div>
  </div>`
}

const button = (href: string, label: string) =>
  `<p style="margin:20px 0 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:12px 26px;border-radius:999px;">${escapeHtml(label)}</a></p>`

export function sendLinkEmail(to: string, contactName: string, token: string): Promise<boolean> {
  return deliver({
    to,
    subject: "הסכם השירות עם נפוץ' AI מוכן לחתימה",
    html: shell(
      "הסכם שירות מוכן לחתימה",
      `<p style="margin:0 0 8px;">שלום ${escapeHtml(contactName)},</p>
       <p style="margin:0;">ההסכם מוכן. אפשר לקרוא ולחתום מהנייד, זה לוקח פחות מ-2 דקות. הקישור אישי ובתוקף ל-14 יום.</p>
       ${button(signingUrl(token), "לקריאה ולחתימה")}`,
    ),
  })
}

export function sendOtpEmail(to: string, code: string): Promise<boolean> {
  return deliver({
    to,
    subject: `קוד האימות שלך: ${code}`,
    html: shell(
      "קוד אימות לחתימה",
      `<p style="margin:0 0 12px;">הקוד לאישור החתימה על ההסכם:</p>
       <p dir="ltr" style="margin:0;font-size:34px;font-weight:800;letter-spacing:0.3em;">${escapeHtml(code)}</p>
       <p style="margin:16px 0 0;color:#6f6f6f;font-size:13px;">הקוד תקף ל-10 דקות. אם לא ביקשתם לחתום, אפשר להתעלם מהמייל.</p>`,
    ),
  })
}

export function sendSignedCopyEmail(to: string, contactName: string, pdf: Buffer): Promise<boolean> {
  return deliver({
    to,
    subject: "ההסכם נחתם: עותק מצורף",
    html: shell(
      "ההסכם נחתם",
      `<p style="margin:0 0 8px;">שלום ${escapeHtml(contactName)},</p>
       <p style="margin:0;">תודה. מצורף עותק PDF של ההסכם החתום, לשמירה אצלכם.</p>`,
    ),
    attachment: { filename: "napuch-service-agreement.pdf", content: pdf },
  })
}

export function sendOwnerSignedEmail(opts: { businessName: string; contactName: string; adminUrl: string; pdf: Buffer }): Promise<boolean> {
  return deliver({
    to: ownerEmail(),
    subject: `נחתם הסכם: ${opts.businessName}`,
    html: shell(
      "הסכם נחתם",
      `<p style="margin:0;"><strong>${escapeHtml(opts.businessName)}</strong> (${escapeHtml(opts.contactName)}) חתמו על ההסכם. העותק החתום מצורף וגם שמור במערכת.</p>
       ${button(opts.adminUrl, "פתיחה בניהול החוזים")}`,
    ),
    attachment: { filename: "signed-agreement.pdf", content: opts.pdf },
  })
}
