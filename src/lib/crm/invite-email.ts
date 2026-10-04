import { Resend } from "resend"

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

/** Tells someone they were added to a business. The invitation itself is a
 *  database row matched on their confirmed email, so this message is only a
 *  nudge — if it fails, the invitation still works. */
export async function sendInviteEmail(opts: { to: string; businessName: string; role: "owner" | "staff"; loginUrl: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false

  const business = escapeHtml(opts.businessName)
  const url = escapeHtml(opts.loginUrl)
  const who = opts.role === "owner" ? "בעלי העסק" : "הצוות"

  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "נפוץ' <hello@napuch.co.il>",
      to: opts.to,
      subject: `הוזמנתם ל-CRM של ${opts.businessName}`,
      html: `
        <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
          <h1 style="font-size:22px;margin:0 0 12px">הוזמנתם אל ${business}</h1>
          <p style="font-size:15px;line-height:1.6;margin:0 0 20px">
            הוספנו אתכם ל-CRM של ${business} בתור ${who}. כל הפניות, השיחות והעסקאות של העסק במקום אחד.
          </p>
          <p style="margin:0 0 20px">
            <a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px">כניסה למערכת</a>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#6f6f6f;margin:0">
            נכנסים עם כתובת המייל הזו בדיוק: נשלח אליה קישור כניסה, בלי סיסמה.
          </p>
        </div>`,
    })
    return !error
  } catch {
    return false
  }
}
