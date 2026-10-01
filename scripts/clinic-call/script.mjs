// The clinic call, line by line. `caps` is how each line is cut for the
// captions: short chunks that land on the beat, never a full sentence at once.
export const LINES = [
  { id: "01", who: "patient", voice: "he-IL-AvriNeural", rate: "+8%",
    text: "שלום, סליחה שזה מאוחר. אפשר לקבוע תור?",
    caps: ["שלום, סליחה שזה מאוחר.", "אפשר לקבוע תור?"] },
  { id: "02", who: "agent", voice: "he-IL-HilaNeural", rate: "+8%",
    text: "בטח, אני כאן. מה קרה?",
    caps: ["בטח, אני כאן.", "מה קרה?"] },
  { id: "03", who: "patient", voice: "he-IL-AvriNeural", rate: "+8%",
    text: "כאב שן. כבר יומיים.",
    caps: ["כאב שן.", "כבר יומיים."] },
  { id: "04", who: "agent", voice: "he-IL-HilaNeural", rate: "+8%",
    text: "אוי, זה לא כיף. מחר בתשע וחצי אצל דוקטור לוי, או בארבע וחצי. מה נוח?",
    caps: ["אוי, זה לא כיף.", "מחר ב-9:30 אצל ד״ר לוי,", "או ב-16:30.", "מה נוח?"] },
  { id: "05", who: "patient", voice: "he-IL-AvriNeural", rate: "+8%",
    text: "תשע וחצי.",
    caps: ["9:30."] },
  { id: "06", who: "agent", voice: "he-IL-HilaNeural", rate: "+8%",
    text: "סגור. שלחתי לך אישור בהודעה. לילה טוב, ושיכאב פחות.",
    caps: ["סגור.", "שלחתי לך אישור.", "לילה טוב,", "ושיכאב פחות."] },
]

// Voice A/B samples: the agent's opening line, every Hebrew-capable candidate.
export const SAMPLE_TEXT = "בטח, אני כאן. מה קרה?"
export const SAMPLE_VOICES = [
  "he-IL-HilaNeural", "he-IL-AvriNeural",
  "en-US-AvaMultilingualNeural", "en-US-NovaTurboMultilingualNeural",
  "fr-FR-VivienneMultilingualNeural", "en-GB-AdaMultilingualNeural",
  "en-US-AndrewMultilingualNeural", "en-US-OnyxTurboMultilingualNeural",
]
