import { Resend } from "resend"

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

/** The email twin of a bell notification. Like the invitation email it is a
 *  nudge, never the only copy: the notification itself lives in the CRM, so a
 *  failed send returns `false` and loses nothing. */
export async function sendNotificationEmail(opts: { to: string; businessName: string; title: string; body: string; urgent: boolean; url: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false

  const title = escapeHtml(opts.title)
  const body = escapeHtml(opts.body)
  const business = escapeHtml(opts.businessName)
  const url = escapeHtml(opts.url)

  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "נפוץ' <hello@napuch.co.il>",
      to: opts.to,
      subject: `${opts.urgent ? "דחוף: " : ""}${opts.title}`,
      html: `
        <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
          <p style="font-size:13px;margin:0 0 8px;color:#6f6f6f">${business}</p>
          <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
          ${body ? `<p style="font-size:15px;line-height:1.6;margin:0 0 20px">${body}</p>` : ""}
          <p style="margin:0 0 20px">
            <a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px">פתיחה במערכת</a>
          </p>
        </div>`,
    })
    return !error
  } catch {
    return false
  }
}
