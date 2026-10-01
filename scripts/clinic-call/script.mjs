// The clinic call, line by line. `caps` is how each line is cut for the
// captions: short chunks that land on the beat, never a full sentence at once.
// Voices: agent = female, patient = male. Azure is the fallback; an ElevenLabs
// take dropped in public/audio/clinic/eleven/<id>.mp3 wins automatically.
export const AGENT = { azure: "he-IL-HilaNeural", eleven: "fuMEGqYpFlKTER3VqptM" }   // Michal
export const PATIENT = { azure: "he-IL-AvriNeural", eleven: "JIxTgeeS5w0UQyBxEnrl" } // Itai

const A = "agent", P = "patient"
export const LINES = [
  { id: "01", who: A, text: "שלום, מרפאת דוקטור לוי, מדברת העוזרת הדיגיטלית. מה שלומך?",
    eleven: "[warmly] שלום, מרפאת דוקטור לוי, מדברת העוזרת הדיגיטלית. [short pause] מה שלומך?",
    caps: ["שלום, מרפאת ד״ר לוי,", "מדברת העוזרת הדיגיטלית.", "מה שלומך?"] },
  { id: "02", who: P, text: "היי, אני בסדר, תודה. ואצלך?",
    eleven: "[casually] היי, אני בסדר, תודה. [short pause] ואצלך?",
    caps: ["היי, אני בסדר, תודה.", "ואצלך?"] },
  { id: "03", who: A, text: "מצוין, תודה ששאלת! במה אפשר לעזור?",
    eleven: "[warmly] מצוין, תודה ששאלת! [short pause] במה אפשר לעזור?",
    caps: ["מצוין, תודה ששאלת!", "במה אפשר לעזור?"] },
  { id: "04", who: P, text: "אני רוצה לעשות ניקוי אבנית, ושתבדקו לי שן. מתי יש תור פנוי?",
    eleven: "אני רוצה לעשות ניקוי אבנית, [short pause] ושתבדקו לי שן. [short pause] מתי יש תור פנוי?",
    caps: ["אני רוצה ניקוי אבנית,", "ושתבדקו לי שן.", "מתי יש תור פנוי?"] },
  { id: "05", who: A, text: "יש מחר בערב, בשש וחצי. או ביום חמישי בעשר בבוקר. מה נוח לך?",
    eleven: "[warmly] יש מחר בערב, בשש וחצי. [short pause] או ביום חמישי בעשר בבוקר. [short pause] מה נוח לך?",
    caps: ["יש מחר בערב, 18:30.", "או ביום חמישי ב-10:00.", "מה נוח לך?"] },
  { id: "06", who: P, text: "מחר בערב, שש וחצי.",
    eleven: "מחר בערב, [short pause] שש וחצי.",
    caps: ["מחר בערב,", "18:30."] },
  { id: "07", who: A, text: "קבעתי לך. מחר בשש וחצי, ניקוי אבנית ובדיקה אצל דוקטור לוי. שולחת לך אישור בהודעה. עוד משהו?",
    eleven: "[warmly] קבעתי לך. [short pause] מחר בשש וחצי, ניקוי אבנית ובדיקה אצל דוקטור לוי. [short pause] שולחת לך אישור בהודעה. עוד משהו?",
    caps: ["קבעתי לך.", "מחר 18:30, ניקוי אבנית ובדיקה.", "שולחת אישור בהודעה.", "עוד משהו?"] },
  { id: "08", who: P, text: "לא, זה הכול. תודה!",
    eleven: "[casually] לא, זה הכול. [short pause] תודה!",
    caps: ["לא, זה הכול.", "תודה!"] },
  { id: "09", who: A, text: "בשמחה. יום מקסים, ונתראה מחר!",
    eleven: "[warmly] בשמחה. [short pause] יום מקסים, ונתראה מחר!",
    caps: ["בשמחה.", "יום מקסים,", "ונתראה מחר!"] },
]
