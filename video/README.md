# נפוץ' · וידאו

פרויקט ה-Remotion של המודעות. המפרט המלא (הסטוריבורד, הקופי, מערכת העיצוב והסאונד) נמצא ב-[STORYBOARD.md](STORYBOARD.md).

## הרצה

```bash
npm install
npx remotion studio                                               # תצוגה חיה בדפדפן
npx remotion still src/index.ts Ad30 out/frame.png --frame=80     # פריים בודד
npx remotion render src/index.ts Ad30 out/napuch-2341-30s.mp4      # הגרסה הראשית
npx remotion render src/index.ts Ad15 out/napuch-2341-15s.mp4      # קיצור ל-15 שניות
npx remotion render src/index.ts Ad6 out/napuch-2341-6s.mp4        # באמפר של 6 שניות
python3 scripts/build-sfx.py                                       # מסנתז מחדש את הסאונד
```

- **בדיקת אזורים בטוחים:** להוסיף `--props='{"safeZones":true}'`. הרצועות המקווקוות הן החלקים שממשק אינסטגרם מכסה במודעת Reels.
- **כשהורדת הדפדפן של Remotion חסומה** (כמו בסביבת הענן שבה הפרויקט נבנה): `REMOTION_BROWSER_EXECUTABLE=/path/to/headless_shell`.

## מבנה

- `brand/`: הלוגואים בווקטור, וזה מקור האמת. אחרי שינוי בהם מריצים `python3 scripts/build-brand-paths.py`.
- `public/fonts/`: ‏Rubik ותת-קבוצה של Noto Color Emoji. שניהם ברישיון OFL, וקובצי הרישיון לידם.
- `public/sfx/`: הסאונדים, שמסונתזים ב-`scripts/build-sfx.py`. הקיו מוצמדים לפריימים ב-`src/SoundTrack.tsx`.
- `src/scenes/`: סצנה לכל ביט בסטוריבורד.
- `src/Cutdowns.tsx`: גרסאות הקיצור, שמוגדרות כמיפוי זמן על הגרסה הראשית.
- `src/components/`: הטלפון, הצ'אט, ההתראות, השעון, המסך הנוזלי והמתכת.

התיקייה מוחרגת מה-tsconfig ומה-ESLint של האתר, כך שהיא לא נכנסת ל-build של האתר.
