import type { Metadata } from "next"

import { Notice, SignExperience } from "@/components/contracts/sign-experience"
import { currentCaller } from "@/lib/contracts/request"
import { contractRpc, rateLimit, type PublicContract } from "@/lib/contracts/rpc"
import { hashToken, isWellFormedToken } from "@/lib/contracts/token"
import { parseDocument } from "@/lib/contracts/text"

export const metadata: Metadata = { title: "הסכם שירות" }
export const dynamic = "force-dynamic"

const MESSAGES = {
  invalid: { title: "הקישור לא תקין", body: "לא מצאנו הסכם לקישור הזה. בדקו שהעתקתם את כולו, או בקשו מאיתנו קישור חדש." },
  expired: { title: "הקישור פג תוקף", body: "הקישור הזה כבר לא בתוקף. בקשו מאיתנו קישור חדש ונשלח אותו מיד." },
  revoked: { title: "הקישור בוטל", body: "הקישור הזה בוטל. אם זו טעות, פנו אלינו ונשלח קישור חדש." },
  busy: { title: "יותר מדי בקשות", body: "נסו שוב בעוד כמה דקות." },
  error: { title: "משהו השתבש", body: "לא הצלחנו לטעון את ההסכם. נסו לרענן בעוד רגע." },
} as const

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!isWellFormedToken(token)) return <Notice {...MESSAGES.invalid} />

  const caller = await currentCaller()
  const tokenHash = hashToken(token)
  let contract: PublicContract | "busy" | "error"
  try {
    contract = (await rateLimit(`page:ip:${caller.ip}`, 60, 600))
      ? await contractRpc<PublicContract>("contract_open", { p_token_hash: tokenHash, p_ip: caller.ip, p_ua: caller.userAgent })
      : "busy"
  } catch {
    contract = "error"
  }
  if (contract === "busy" || contract === "error") return <Notice {...MESSAGES[contract]} />

  if (contract.state === "invalid" || contract.state === "expired" || contract.state === "revoked") return <Notice {...MESSAGES[contract.state]} />

  if (contract.state === "signed") {
    const when = contract.signed_at
      ? new Intl.DateTimeFormat("he-IL", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jerusalem" }).format(new Date(contract.signed_at))
      : ""
    return <Notice title="ההסכם נחתם" body={`ההסכם של ${contract.business_name ?? ""} נחתם${when ? ` ב-${when}` : ""} ואי אפשר לשנות אותו. העותק נשלח אליכם במייל.`} />
  }

  const agreement = parseDocument(contract.agreement_snapshot ?? "")
  const privacy = parseDocument(contract.privacy_snapshot ?? "")
  return (
    <SignExperience
      token={token}
      title={agreement.title || "הסכם שירות עם נפוץ' AI"}
      businessName={contract.business_name ?? ""}
      summary={agreement.summary}
      preamble={agreement.preamble}
      sections={agreement.sections}
      privacyTitle={privacy.title || "מדיניות פרטיות"}
      privacyPreamble={privacy.preamble}
      privacySections={privacy.sections}
      defaultName=""
    />
  )
}
