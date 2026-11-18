<!-- AUTO-GENERATED from AGENTS.md — do not edit directly.
     Run `bash scripts/sync-agent-rules.sh` to regenerate. -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Website Reverse-Engineer Template

## What This Is
A reusable template for reverse-engineering any website into a clean, modern Next.js codebase using AI coding agents. The Next.js + shadcn/ui + Tailwind v4 base is pre-scaffolded — just run `/clone-website <url1> [<url2> ...]`.

## Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Radix primitives, Tailwind CSS v4, `cn()` utility)
- **Icons:** Lucide React (default — will be replaced/supplemented by extracted SVGs)
- **Styling:** Tailwind CSS v4 with oklch design tokens
- **Deployment:** Vercel

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript check
- `npm run check` — Run lint + typecheck + build

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utility classes, no inline styles
- 2-space indentation
- Responsive: mobile-first

## Design Principles
- **Pixel-perfect emulation** — match the target's spacing, colors, typography exactly
- **No personal aesthetic changes during emulation phase** — match 1:1 first, customize later
- **Real content** — use actual text and assets from the target site, not placeholders
- **Beauty-first** — every pixel matters

## Project Structure
```
src/
  app/              # Next.js routes
  components/       # React components
    ui/             # shadcn/ui primitives
    icons.tsx       # Extracted SVG icons as React components
  lib/
    utils.ts        # cn() utility (shadcn)
  types/            # TypeScript interfaces
  hooks/            # Custom React hooks
public/
  images/           # Downloaded images from target site
  videos/           # Downloaded videos from target site
  seo/              # Favicons, OG images, webmanifest
docs/
  research/         # Inspection output (design tokens, components, layout)
  design-references/ # Screenshots and visual references
scripts/            # Asset download scripts
```

## MOST IMPORTANT NOTES
- When launching Claude Code agent teams, ALWAYS have each teammate work in their own worktree branch and merge everyone's work at the end, resolving any merge conflicts smartly since you are basically serving the orchestrator role and have full context to our goals, work given, work achieved, and desired outcomes.
- After editing `AGENTS.md`, run `bash scripts/sync-agent-rules.sh` to regenerate platform-specific instruction files.
- After editing `.claude/skills/clone-website/SKILL.md`, run `node scripts/sync-skills.mjs` to regenerate the skill for all platforms.

# Website Inspection Guide

## How to Reverse-Engineer Any Website

This guide outlines what to capture when inspecting a target website via Chrome MCP or browser DevTools.

## Phase 1: Visual Audit

### Screenshots to Capture
- [ ] Every distinct page — desktop, tablet, mobile
- [ ] Dark mode variants (if applicable)
- [ ] Light mode variants (if applicable)
- [ ] Key interaction states (hover, active, open menus, modals)
- [ ] Loading/skeleton states
- [ ] Empty states
- [ ] Error states

### Design Tokens to Extract
- [ ] **Colors** — background, text (primary/secondary/muted), accent, border, hover, error, success, warning
- [ ] **Typography** — font family, sizes (h1-h6, body, caption, label), weights, line heights, letter spacing
- [ ] **Spacing** — padding/margin patterns (look for a scale: 4px, 8px, 12px, 16px, 24px, 32px, etc.)
- [ ] **Border radius** — buttons, cards, avatars, inputs
- [ ] **Shadows/elevation** — card shadows, dropdown shadows, modal overlay
- [ ] **Breakpoints** — when does the layout shift? (inspect with DevTools responsive mode)
- [ ] **Icons** — which icon library? custom SVGs? sizes?
- [ ] **Avatars** — sizes, shapes, fallback behavior
- [ ] **Buttons** — all variants (primary, secondary, ghost, icon-only, danger)
- [ ] **Inputs** — text fields, textareas, selects, checkboxes, toggles

## Phase 2: Component Inventory

For each distinct UI component, document:
1. **Name** — what would you call this component?
2. **Structure** — what HTML elements / child components does it contain?
3. **Variants** — does it have different sizes, colors, or states?
4. **States** — default, hover, active, disabled, loading, error, empty
5. **Responsive behavior** — how does it change at different breakpoints?
6. **Interactions** — click, hover, focus, keyboard navigation
7. **Animations** — transitions, entrance/exit animations, micro-interactions

### Common Components to Look For
- Navigation (top bar, sidebar, bottom bar)
- Cards / list items
- Buttons and links
- Forms and inputs
- Modals and dialogs
- Dropdowns and menus
- Tabs and segmented controls
- Avatars and user badges
- Loading skeletons
- Toast notifications
- Tooltips and popovers

## Phase 3: Layout Architecture

- [ ] **Grid system** — CSS Grid? Flexbox? Fixed widths?
- [ ] **Column layout** — how many columns at each breakpoint?
- [ ] **Max-width** — main content area max-width
- [ ] **Sticky elements** — header, sidebar, floating buttons
- [ ] **Z-index layers** — navigation, modals, tooltips, overlays
- [ ] **Scroll behavior** — infinite scroll, pagination, virtual scrolling

## Phase 4: Technical Stack Analysis

- [ ] **Framework** — React? Vue? Angular? Check `__NEXT_DATA__`, `__NUXT__`, `ng-version`
- [ ] **CSS approach** — Tailwind (utility classes), CSS Modules, Styled Components, Emotion, vanilla CSS
- [ ] **State management** — Redux (check DevTools), React Query, Zustand, Pinia
- [ ] **API patterns** — REST, GraphQL (check network tab for `/graphql` requests)
- [ ] **Font loading** — Google Fonts, self-hosted, system fonts
- [ ] **Image strategy** — CDN, lazy loading, srcset, WebP/AVIF
- [ ] **Animation library** — Framer Motion, GSAP, CSS transitions only

## Phase 5: Documentation Output

After inspection, create these files in `docs/research/`:
1. `DESIGN_TOKENS.md` — All extracted colors, typography, spacing
2. `COMPONENT_INVENTORY.md` — Every component with structure notes
3. `LAYOUT_ARCHITECTURE.md` — Page layouts, grid system, responsive behavior
4. `INTERACTION_PATTERNS.md` — Animations, transitions, hover states
5. `TECH_STACK_ANALYSIS.md` — What the site uses and our chosen equivalents


# מצב הפרויקט וכללי עבודה

הקובץ הזה נטען אוטומטית בכל שיחה חדשה (דרך `AGENTS.md`). מי שפותח שיחה חדשה צריך לקרוא אותו לפני שהוא נוגע בקוד. **מעדכנים אותו בסוף כל עבודה משמעותית**, כדי שלא יישאר ישן.

עדכון אחרון: 18.11.2026.

## מה זה

מוצר: **נפוץ' CRM**, מערכת CRM מותגית ונוחה לנייד לעסקים קטנים, באותו מאגר של אתר השיווק (`ranweb98-code/ranagency-site`).

* `/crm/<תחום>`: הדגמה ציבורית שנוצרת מקוד (`src/lib/crm/demo-data.ts`). **חייבת להישאר שלמה.** 9 תחומים, מידע דטרמיניסטי.
* `/app`: המוצר האמיתי. התחברות עם קישור למייל (Supabase), הרשאות ברמת שורה, מספר עסקים.
* האתר נפרס מ-`master` ל-napuch.co.il ב-Vercel.
* מסד הנתונים: Supabase `napuch-crm` (`yjxeqmgehvuqcvphvakl`), פרנקפורט. פרטים מלאים ב-`docs/crm/README.md`.
* תוכנית הסוכן הקולי: `docs/crm/voice-agent-plan.md`.

## כללי עבודה עם בעל המוצר

* **שפה:** עברית, קצר וענייני. בלי מילים גבוהות. להגיד בכנות מה לא נבדק.
* **גיט:** לעשות commit ל-branch ולדחוף אותו. **לדחוף ל-`master` רק כשכותבים במפורש "תדחוף ל-master" או "תעשה push".** אל תדחפו ל-`master` מיוזמתכם, ואל תפתחו pull request בלי בקשה.
* **סודות:** אף פעם לא לקבל מפתחות, טוקנים או סיסמאות בצ'אט. את המשתנים מכניסים ב-Vercel או בהגדרות הסביבה. לעולם לא להכניס את מפתח ה-service-role של Supabase לפרויקט.
* **מראה:** פסטלי, זכוכית מט, פינות מעוגלות בצורה אחידה, כל כפתור עובד, בלי חללים ריקים, מסודר. להתאים לתמונת הייחוס.
* **לפני דחיפה ל-master:** `npx tsc --noEmit`, `npx eslint src`, `npm run build`, ובדיקת הרגרסיה על כל התעשיות והדפים (ראו למטה).
* **הטרילרים בהודעות commit** (שני שורות בסוף): `Co-Authored-By` ו-`Claude-Session`, כפי שמופיעים בהוראות של הסשן.

## איך בודקים

* **רגרסיה ויזואלית:** סקריפטי Playwright נכתבו בתיקיית העבודה של הסשן ולא נשמרו במאגר. מי שצריך אותם כותב אותם מחדש: 9 תחומים × 8 עמודים × 2 גדלי מסך, בלי גלישה אופקית.
* **מסד נתונים:** `bash supabase/tests/run-local.sh` מרים Postgres זמני, מחיל את כל המיגרציות ומריץ את `supabase/tests/rls.test.sql`. צריך שכל הבדיקות יעברו. זה לא נוגע ב-Supabase האמיתי.
* בדיקות יחידה לקבצים הטהורים ב-`src/lib/crm` נכתבו בתיקיית העבודה ולא במאגר. מי שמוסיף לוגיקה כותב בדיקות.

## מה נמצא איפה (חשוב)

* **על `master` ובאתר:** כל התכונות של ה-CRM עד הדחיפה האחרונה, כולל הדמו עם הטווחים והשיחות הארוכות.
* **רק ב-branch `claude/focused-bell-ha4zya` ולא על `master`:**
  * הפונקציה `public.ingest_voice_call` (`supabase/migrations/20261104100000_crm_voice_ingest.sql`) עם הבדיקות שלה.
  * קורא ה-webhook של ElevenLabs, `src/lib/crm/elevenlabs-call.ts`.
  * תיקון קטן למיגרציית ההתראות (`private.is_member` במקום `public.is_member`).
  * `docs/crm/voice-agent-plan.md` והקובץ הזה.
* **מיגרציות שלא הוחלו על Supabase האמיתי:** `20261008100000_crm_notifications.sql` (התראות) ו-`20261104100000_crm_voice_ingest.sql` (שיחות קוליות). החלו כל השאר עד `20261006120000`. כדי להחיל צריך חיבור פעיל ל-Supabase, או להריץ ידנית ב-SQL Editor של Supabase. לבדוק תחילה ש-`supabase/tests/run-local.sh` עובר.
* **פעמון ההתראות** נופל בחן כשאין טבלה, אבל לא עובד עד שמחילים את מיגרציית ההתראות.

## דברים פתוחים

1. **סוכן קולי:** ממתינים לתוצאות הבדיקה שלך: מספר ישראלי ב-Twilio, שיחה בעברית ב-ElevenLabs, העברת שיחות מהקו. רק אחר כך בונים את נקודת הכניסה (`/api/ingest/...`), את מסך המפתחות ב-admin ואת מעקב הדקות. פרטים מלאים בתוכנית.
2. **וואטסאפ ואינסטגרם:** מחכים לאישור Meta. נדרש תג האימות של הדומיין (`meta` tag) שבעל המוצר צריך לשלוח, ואז מוסיפים אותו לאתר. החלופה: ספק מאושר כמו 360dialog.
3. **ההזמנה של רז:** נוצרה בתפקיד `staff`, ויכול להיות שרצינו `owner`. לשאול לפני שמשנים, וכן לשאול אם להסיר את חברות המפעיל מהעסק `beit-shemis`.
4. **החלטות עסקיות פתוחות:** מחיר חודשי והקמה, התחומים הראשונים, מי מקים כל לקוח, חשבון משותף או נפרד אצל ElevenLabs ו-Twilio. בנוסף: לברר מול ElevenLabs אם מותר למכור את הסוכנים ללקוחות.
5. **לבדוק משפטית:** הודעה על הקלטה בשיחה וחוק הגנת הפרטיות, תיקון 13.
6. **לא נבדק:** כניסות אמיתיות (קישור למייל) והוספת ליד אמיתי דרך הטופס עם משתמש מחובר, כי אין גישה לכניסה בסביבת הפיתוח.

## מבנה חשוב בקוד

* `src/lib/crm/industries/*.ts`: תחומים (שלבי צינור, קטלוג, פתיחות). `src/lib/crm/faqs.ts`: שאלות ותשובות לדמו. `src/lib/crm/demo-data.ts`: יוצר את נתוני הדמו, **בלי להוסיף קריאות ל-`rand()` באמצע**, כי זה משנה את כל מה שאחריו.
* `src/lib/crm/types.ts`: הטיפוסים. `src/lib/crm/live-mapper.ts`: ממפה שורות מהמסד לטיפוסים.
* כל הכתיבה למסד עוברת עם משתמש מחובר והרשאות ברמת שורה. היוצא מן הכלל היחיד הוא `ingest_voice_call`, שמאומתת במפתח סודי של העסק.
* CSS של `.crm-*` (ב-`globals.css`) גובר על Tailwind. אין `backdrop-filter` על כותרת, תפריט או סרגל דביק, כדי שהגלילה תישאר חלקה. ה-Next.js כאן שונה ממה שמוכר, לקרוא את `node_modules/next/dist/docs/` לפני כתיבת קוד.
