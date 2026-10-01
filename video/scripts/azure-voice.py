"""Synthesize the receptionist call with Azure Speech (he-IL Hila and Avri).

Reads AZURE_SPEECH_KEY and AZURE_SPEECH_REGION from the environment and
writes voice-src-azure/<line>.wav (48 kHz mono). scripts/process-voice.py
azure then levels them for the ad. Same lines as the ElevenLabs take.
"""
import os
import sys
import urllib.request
from pathlib import Path

KEY = os.environ["AZURE_SPEECH_KEY"]
REGION = os.environ.get("AZURE_SPEECH_REGION", "northeurope")
OUT = Path(__file__).resolve().parent.parent / "voice-src-azure"

AGENT, CALLER = "he-IL-HilaNeural", "he-IL-AvriNeural"
LINES = {
    "a1-answer": (AGENT, "מרפאת השיניים, ערב טוב! איך אפשר לעזור?"),
    "c1-ask": (CALLER, "היי, ערב טוב. אני צריך לקבוע בדיקה וניקוי אבנית. יש משהו מחר?"),
    "a2-offer": (AGENT, "בטח. מחר יש לי פנוי בעשר וחצי בבוקר, או בארבע אחר הצהריים. מה נוח לך?"),
    "c2-pick": (CALLER, "עשר וחצי, מעולה."),
    "c4-thanks": (CALLER, "וואו, מושלם. תודה רבה!"),
    "a5-bye": (AGENT, "בשמחה! ערב טוב."),
}

OUT.mkdir(exist_ok=True)
for name, (voice, text) in LINES.items():
    ssml = (
        f"<speak version='1.0' xml:lang='he-IL' xmlns='http://www.w3.org/2001/10/synthesis'>"
        f"<voice name='{voice}'><prosody rate='+14%'>{text}</prosody></voice></speak>"
    )
    req = urllib.request.Request(
        f"https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1",
        data=ssml.encode("utf-8"),
        headers={
            "Ocp-Apim-Subscription-Key": KEY,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "riff-48khz-16bit-mono-pcm",
            "User-Agent": "napuch-video",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            (OUT / f"{name}.wav").write_bytes(r.read())
        print("ok", name, voice)
    except Exception as e:  # never echo the key
        print("FAILED", name, type(e).__name__, getattr(e, "code", ""), file=sys.stderr)
        sys.exit(1)
