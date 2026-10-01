"""Prepare the ElevenLabs call lines for the receptionist ad.

voice-src/<line>.mp3 (the ElevenLabs takes, eleven_v3) becomes
public/voice/<line>.wav: silence trimmed, levelled for an ad, and the caller
put on a phone line (band-limited, lightly driven) while the agent stays
clean. Decoding needs an ffmpeg: $FFMPEG, or `ffmpeg` on the PATH.
Also writes src/voice/lines.json with each line's duration and a per-frame
loudness envelope (30 fps), which drives the on-screen waveform.
"""
import json
import os
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
FPS = 30
ROOT = Path(__file__).resolve().parent.parent
# `process-voice.py` levels the ElevenLabs takes; `process-voice.py azure`
# levels the Azure ones (scripts/azure-voice.py) into their own folder.
AZURE = len(sys.argv) > 1 and sys.argv[1] == "azure"
SRC = ROOT / ("voice-src-azure" if AZURE else "voice-src")
VOICE = ROOT / "public" / ("voice-azure" if AZURE else "voice")
LINES_JSON = ROOT / "src" / "voice" / ("lines-azure.json" if AZURE else "lines.json")
VOICE.mkdir(parents=True, exist_ok=True)
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")

# Speaker per line: "agent" is Michal (the clinic's AI receptionist), "caller" is Itai.
LINES = {
    "a1-answer": "agent",
    "c1-ask": "caller",
    "a2-offer": "agent",
    "c2-pick": "caller",
    "c4-thanks": "caller",
    "a5-bye": "agent",
}


def read(mp3):
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "line.wav"
        subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(mp3), "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", str(wav)], check=True)
        with wave.open(str(wav)) as w:
            return np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32767


def write(p, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def trim(x, thresh_db=-42, pad=0.04):
    hop = SR // 100
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x), hop)])
    voiced = np.where(20 * np.log10(rms + 1e-9) > thresh_db)[0]
    a = max(0, voiced[0] * hop - int(pad * SR))
    b = min(len(x), (voiced[-1] + 1) * hop + int(pad * SR))
    y = x[a:b].copy()
    f = int(0.01 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def phone(x):
    y = sosfilt(butter(4, [300, 3400], btype="band", fs=SR, output="sos"), x)
    return np.tanh(y * 2.2) / np.tanh(2.2)


def clean(x):
    return sosfilt(butter(2, 90, btype="high", fs=SR, output="sos"), x)


out = {}
for name, who in LINES.items():
    x = trim(read(next(SRC.glob(f"{name}.*"))))
    # The ElevenLabs caller is put on a phone line; the Azure voices are
    # already distinct (Avri and Hila) and clearer left clean.
    x = phone(x) if who == "caller" and not AZURE else clean(x)
    # Level for an ad: RMS at -16 dB, the loudest syllables rounded off by a
    # soft limiter, peaks under -1 dBFS.
    x *= 10 ** (-16 / 20) / (np.sqrt(np.mean(x ** 2)) + 1e-9)
    knee = 10 ** (-4 / 20)
    x = np.where(np.abs(x) > knee, np.sign(x) * (knee + (1 - knee) * np.tanh((np.abs(x) - knee) / (1 - knee))), x)
    x *= min(1.0, 10 ** (-1 / 20) / (np.max(np.abs(x)) + 1e-9))
    write(VOICE / f"{name}.wav", x)
    hop = SR // FPS
    env = [float(np.sqrt(np.mean(x[i:i + hop] ** 2))) for i in range(0, len(x), hop)]
    peak = max(env) or 1.0
    out[name] = {
        "speaker": who,
        "frames": int(np.ceil(len(x) / hop)),
        "envelope": [round(v / peak, 3) for v in env],
    }
    print(f"{name:10s} {who:6s} {len(x) / SR:5.2f}s")

VOICE.mkdir(parents=True, exist_ok=True)
LINES_JSON.parent.mkdir(parents=True, exist_ok=True)
LINES_JSON.write_text(json.dumps(out))
