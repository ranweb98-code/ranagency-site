import { RestaurantDemo } from "@/components/restaurant/restaurant-demo"
import { themeStyle } from "@/lib/crm/theme"

export const metadata = { title: "הדגמה למסעדה" }

const BRAND = { accent: "#b4421d", accent2: "#2f6b5a", warm: "#f2c14e", ink: "#1a1411", bgFrom: "#f3d9c4", bgTo: "#e4e8d0" }

export default function RestaurantDemoPage() {
  return (
    <div className="crm-root" style={themeStyle(BRAND)}>
      <RestaurantDemo />
    </div>
  )
}
