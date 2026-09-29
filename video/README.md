# נפוץ' · וידאו

פרויקט ה-Remotion של המודעות. המפרט המלא (הסטוריבורד, הקופי, מערכת העיצוב והסאונד) נמצא ב-[STORYBOARD.md](STORYBOARD.md).

## הרצה

```bash
npm install
npx remotion studio                                               # תצוגה חיה בדפדפן
npx remotion still src/index.ts Ad30 out/frame.png --frame=80     # פריים בודד
npx remotion render src/index.ts Ad30 out/ad-30s.mp4              # הסרטון המלא
```

- **בדיקת אזורים בטוחים:** להוסיף `--props='{"safeZones":true}'`. הרצועות המקווקוות הן החלקים שממשק אינסטגרם מכסה במודעת Reels.
- **כשהורדת הדפדפן של Remotion חסומה** (כמו בסביבת הענן שבה הפרויקט נבנה): `REMOTION_BROWSER_EXECUTABLE=/path/to/headless_shell`.

## מבנה

- `brand/`: הלוגואים בווקטור, וזה מקור האמת. אחרי שינוי בהם מריצים `python3 scripts/build-brand-paths.py`.
- `public/fonts/`: ‏Rubik ותת-קבוצה של Noto Color Emoji. שניהם ברישיון OFL, וקובצי הרישיון לידם.
- `src/scenes/`: סצנה לכל ביט בסטוריבורד.
- `src/components/`: הטלפון, הצ'אט, ההתראות, השעון, המסך הנוזלי והמתכת.

התיקייה מוחרגת מה-tsconfig ומה-ESLint של האתר, כך שהיא לא נכנסת ל-build של האתר.
