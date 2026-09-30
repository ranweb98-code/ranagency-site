# נפוץ' · וידאו

פרויקט ה-Remotion של המודעות. המפרט המלא של "23:41" (הסטוריבורד, הקופי, מערכת העיצוב והסאונד) נמצא ב-[STORYBOARD.md](STORYBOARD.md), ושל ארבע המודעות הבאות ב-[ADS.md](ADS.md).

## הרצה

```bash
npm install
python3 scripts/build-sfx-kits.py                                  # פעם אחת: מייצר את ערכות הסאונד של ארבע המודעות
npx remotion studio                                               # תצוגה חיה בדפדפן
npx remotion still src/index.ts Ad30 out/frame.png --frame=80     # פריים בודד
npx remotion render src/index.ts Ad30 out/napuch-2341-30s.mp4      # הגרסה הראשית
npx remotion render src/index.ts Ad15 out/napuch-2341-15s.mp4      # קיצור ל-15 שניות
npx remotion render src/index.ts Ad6 out/napuch-2341-6s.mp4        # באמפר של 6 שניות
npx remotion render src/index.ts PressOne out/napuch-press-one.mp4          # הקישו 1
npx remotion render src/index.ts Flood out/napuch-how-much.mp4             # כמה עולה?
npx remotion render src/index.ts Receptionist out/napuch-receptionist.mp4  # המזכירה של 19:00
npx remotion render src/index.ts HotOrCold out/napuch-hot-or-cold.mp4      # חם או קר
python3 scripts/build-sfx.py                                       # מסנתז מחדש את הסאונד של 23:41
FFMPEG=/path/to/ffmpeg python3 scripts/process-voice.py            # מעבד מחדש את קולות השיחה
node scripts/stills.mjs Flood out/stills 0 120 300                 # כמה פריימים לבדיקה, בבנדל אחד
```

- **בדיקת אזורים בטוחים:** להוסיף `--props='{"safeZones":true}'`. הרצועות המקווקוות הן החלקים שממשק אינסטגרם מכסה במודעת Reels.
- **כשהורדת הדפדפן של Remotion חסומה** (כמו בסביבת הענן שבה הפרויקט נבנה): `REMOTION_BROWSER_EXECUTABLE=/path/to/headless_shell`.

## מבנה

- `brand/`: הלוגואים בווקטור, וזה מקור האמת. אחרי שינוי בהם מריצים `python3 scripts/build-brand-paths.py`.
- `public/fonts/`: ‏Rubik ותת-קבוצה של Noto Color Emoji (שניהם OFL), ו-Cousine למסוף של "הקישו 1" (Apache 2.0). קובצי הרישיון לידם.
- `public/sfx/`: הסאונדים של 23:41 (`scripts/build-sfx.py`, קיו ב-`src/SoundTrack.tsx`), ובתיקיות `desk`, `ivr`, `flood`, `factory` הערכות של ארבע המודעות. הן לא נשמרות בגיט: `scripts/build-sfx-kits.py` מייצר אותן זהות בכל הרצה. הקיו בכל מודעה עוברים דרך `src/sound.tsx`.
- `voice-src/` ו-`public/voice/`: הטייקים של ElevenLabs והגרסאות המעובדות שלהם, לשיחה של "המזכירה של 19:00".
- `src/ads/`: ארבע המודעות, קובץ לכל אחת. `src/fx.tsx`: האפקטים המשותפים.
- `src/scenes/`: סצנה לכל ביט בסטוריבורד.
- `src/Cutdowns.tsx`: גרסאות הקיצור, שמוגדרות כמיפוי זמן על הגרסה הראשית.
- `src/components/`: הטלפון, הצ'אט, ההתראות, השעון, המסך הנוזלי והמתכת.

התיקייה מוחרגת מה-tsconfig ומה-ESLint של האתר, כך שהיא לא נכנסת ל-build של האתר.
