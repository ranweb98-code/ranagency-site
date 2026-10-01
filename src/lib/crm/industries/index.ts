import type { IndustryId, IndustryPack, Tenant } from "../types"
import { bridal } from "./bridal"
import { chef } from "./chef"
import { contractor } from "./contractor"
import { dental } from "./dental"
import { fitness } from "./fitness"
import { generic } from "./generic"
import { makeup } from "./makeup"
import { nails } from "./nails"
import { realestate } from "./realestate"

export const PACKS: Record<IndustryId, IndustryPack> = {
  dental,
  chef,
  makeup,
  nails,
  bridal,
  realestate,
  fitness,
  contractor,
  generic,
}

/** Showcase tenants — one per pack — until real clients exist. */
export const DEMO_TENANTS: Tenant[] = [
  { slug: "dental", businessName: "מרפאת שיניים אור", ownerName: "ד״ר נועם אור", industry: "dental", tagline: "רפואת שיניים מדויקת, בלי לחכות", city: "תל אביב", planMonthly: 1490, agents: ["whatsapp", "instagram", "voice"] },
  { slug: "chef", businessName: "שף אלון · שולחן פרטי", ownerName: "אלון מזרחי", industry: "chef", tagline: "ארוחות שף אצלכם בבית", city: "השרון", planMonthly: 890, agents: ["whatsapp", "instagram"] },
  { slug: "makeup", businessName: "ליאן · סטודיו לאיפור", ownerName: "ליאן כהן", industry: "makeup", tagline: "איפור כלות וערב", city: "ירושלים", planMonthly: 890, agents: ["instagram", "whatsapp"] },
  { slug: "nails", businessName: "גל נייל סטודיו", ownerName: "גל לוי", industry: "nails", tagline: "ג׳ל, בנייה ועיצוב", city: "חיפה", planMonthly: 890, agents: ["whatsapp", "instagram"] },
  { slug: "bridal", businessName: "מיה · בוטיק שמלות כלה", ownerName: "מיה אברהם", industry: "bridal", tagline: "השמלה שלך מחכה", city: "רמת גן", planMonthly: 890, agents: ["instagram", "whatsapp"] },
  { slug: "realestate", businessName: "מרום נדל״ן", ownerName: "יובל מרום", industry: "realestate", tagline: "הבית הבא שלכם", city: "גוש דן", planMonthly: 1490, agents: ["whatsapp", "instagram", "voice"] },
  { slug: "fitness", businessName: "פיט־לאב סטודיו", ownerName: "דנה פרידמן", industry: "fitness", tagline: "אימונים שמתאימים לחיים", city: "נתניה", planMonthly: 890, agents: ["whatsapp", "instagram"] },
  { slug: "contractor", businessName: "הדר שיפוצים", ownerName: "אבי הדר", industry: "contractor", tagline: "שיפוץ מסודר, בזמן", city: "ראשון לציון", planMonthly: 1490, agents: ["whatsapp", "voice"] },
  { slug: "generic", businessName: "העסק שלי", ownerName: "בעל/ת העסק", industry: "generic", tagline: "כל הפניות במקום אחד", city: "ישראל", planMonthly: 1490, agents: ["whatsapp", "instagram", "voice"] },
]
