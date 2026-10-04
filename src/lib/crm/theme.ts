import type { CSSProperties } from "react"

import type { BrandTheme } from "./types"

/** The only place a tenant's brand becomes CSS: every colour in the CRM reads
 *  these variables, so a client's identity is data, not code. */
export function themeStyle(brand: BrandTheme): CSSProperties {
  return {
    "--crm-accent": brand.accent,
    "--crm-accent-2": brand.accent2,
    "--crm-warm": brand.warm,
    "--crm-ink": brand.ink,
    "--crm-bg-from": brand.bgFrom,
    "--crm-bg-to": brand.bgTo,
  } as CSSProperties
}
