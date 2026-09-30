"""Synthesize the sound kits of the four follow-up ads into public/sfx/<kit>/.

Each ad has its own sound world, drawn from its story, so no two ads share a
sound:

  desk     "המזכירה של 19:00" — an analog office phone at night
  ivr      "הקישו 1"          — a digital phone menu, then soft wood
  flood    "כמה עולה?"        — a swarm of pops, silence, a rising chain
  factory  "חם או קר"         — a sorting machine: air, stamps, gates

Within a kit, a sound that plays more than once comes in variants that differ
in pitch, timing and timbre, and the cue sheets (src/sound.tsx) hand them out
in turn, so the same hit is never heard identically twice. Everything is
built from sines, noise and filters — no samples, nothing to license.

Writes src/sfx-kits.json: {kit: {sound: variant count}} for the cue sheets.
"""
import json
import math
import wave
import zlib
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "sfx"
MANIFEST = ROOT / "src" / "sfx-kits.json"

manifest: dict[str, dict[str, int]] = {}


# ── building blocks ────────────────────────────────────────────────────────

def n_of(dur):
    return int(round(dur * SR))


def t(dur):
    return np.arange(n_of(dur)) / SR


def env(n, attack=0.002, tau=0.2):
    x = np.arange(n) / SR
    return np.clip(x / max(attack, 1e-6), 0, 1) * np.exp(-x / tau)


def filt(x, kind, f, order=2):
    """Butterworth low/high/band-pass. `f` is a cutoff or a (lo, hi) pair."""
    if kind == "bp":
        sos = butter(order, [f[0], f[1]], "bandpass", fs=SR, output="sos")
    else:
        sos = butter(order, f, "lowpass" if kind == "lp" else "highpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def reso(x, f0, q):
    """Resonant band-pass (RBJ, constant peak gain) — for bodies and plates."""
    w0 = 2 * math.pi * f0 / SR
    alpha = math.sin(w0) / (2 * q)
    c = math.cos(w0)
    b = np.array([alpha, 0.0, -alpha]) / (1 + alpha)
    a = np.array([1 + alpha, -2 * c, 1 - alpha]) / (1 + alpha)
    return lfilter(b, a, x)


def sweep(x, f_start, f_end, q=1.4, block=240):
    """Band-pass whose centre glides exponentially across the sound."""
    y = np.zeros_like(x)
    for s in range(0, len(x), block):
        frac = s / max(1, len(x) - 1)
        f = f_start * (f_end / f_start) ** frac
        seg = x[max(0, s - 960): s + block]
        out = reso(seg, f, q)
        y[s: s + block] = out[-len(x[s: s + block]):]
    return y


def tone(freq, dur, tau, attack=0.002, glide_to=None, shape="sine"):
    x = t(dur)
    if glide_to is None:
        phase = 2 * math.pi * freq * x
    else:
        f = freq * (glide_to / freq) ** (x / dur)
        phase = 2 * math.pi * np.cumsum(f) / SR
    wave_ = np.sin(phase)
    if shape == "square":
        wave_ = np.tanh(4 * wave_)
    elif shape == "saw":
        wave_ = 2 * ((phase / (2 * math.pi)) % 1) - 1
    return wave_ * env(len(x), attack, tau)


def mix(*sounds):
    n = max(len(s) for s in sounds)
    out = np.zeros(n)
    for s in sounds:
        out[: len(s)] += s
    return out


def place(canvas, sound, at):
    i = int(at * SR)
    end = min(len(canvas), i + len(sound))
    if end > i:
        canvas[i:end] += sound[: end - i]


def room(x, decay=0.35, wet=0.25, tone_hz=3500, seed=0, pre=0.012):
    """A small room: convolution with a filtered, decaying noise tail."""
    r = np.random.default_rng(seed)
    n = n_of(decay * 3)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / SR / (decay / 2.3))
    ir = filt(ir, "lp", tone_hz)
    ir = np.concatenate([np.zeros(n_of(pre)), ir])
    ir /= np.sqrt(np.sum(ir**2)) + 1e-9
    tail = fftconvolve(x, ir)[: len(x) + len(ir)]
    return mix(x, wet * tail)


def write(kit, name, x, peak_db=-3.0):
    x = np.asarray(x, dtype=np.float64).copy()
    fade = n_of(0.003)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    peak = np.max(np.abs(x)) or 1.0
    x = x / peak * 10 ** (peak_db / 20)
    folder = OUT / kit
    folder.mkdir(parents=True, exist_ok=True)
    with wave.open(str(folder / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


def variants(kit, name, count, make, peak_db=-3.0):
    """`make(rng, k)` builds variant k; each variant gets its own seed."""
    for k in range(count):
        rng = np.random.default_rng(zlib.crc32(f"{kit}/{name}/{k}".encode()))
        write(kit, f"{name}-{k + 1}", make(rng, k), peak_db)
    manifest.setdefault(kit, {})[name] = count
    print(f"  {kit}/{name} ×{count}")


def single(kit, name, x, peak_db=-3.0):
    variants(kit, name, 1, lambda rng, k: x, peak_db)


def noise(rng, dur):
    return rng.standard_normal(n_of(dur))


def whoosh(rng, dur, f0, f1, q=1.1, level=1.0):
    x = noise(rng, dur)
    shape = np.sin(np.pi * np.clip(t(dur) / dur, 0, 1)) ** 1.6
    return sweep(x, f0, f1, q) * shape * level


def hit(rng, f0, f1, dur=0.6, tau=0.14, grit=0.25):
    """A deep designed hit: a falling sine, a noise crack, a little drive."""
    body = tone(f0, dur, tau, attack=0.0008, glide_to=f1)
    crack = filt(noise(rng, 0.08), "bp", (900, 5000)) * env(n_of(0.08), 0.0005, 0.012)
    return np.tanh(1.6 * mix(body, grit * crack))


# ── desk: the office phone at night ───────────────────────────────────────

def bell_ring(rng, base, dur=1.15):
    """A mechanical phone bell: a clapper striking two gongs at ~20 Hz."""
    x = t(dur)
    rate = 19 + rng.uniform(-1.2, 1.2)
    strikes = np.zeros_like(x)
    for k in range(int(dur * rate * 0.86)):
        i = int((k / rate + rng.uniform(-0.002, 0.002)) * SR)
        if 0 <= i < len(strikes):
            strikes[i] = 1.0 if k % 2 == 0 else 0.8
    gong = np.zeros_like(x)
    for ratio, amp, q in [(1.0, 1.0, 60), (2.32, 0.5, 45), (4.1, 0.25, 35), (1.06, 0.6, 60)]:
        gong += amp * reso(strikes, base * ratio, q)
    gate = np.clip((dur * 0.86 - x) / 0.05, 0, 1)
    gong = gong * (0.35 + 0.65 * gate)
    gong = filt(np.tanh(2.5 * gong / (np.max(np.abs(gong)) + 1e-9)), "hp", 250)
    return room(gong, decay=0.7, wet=0.45, seed=int(base))


def build_desk():
    kit = "desk"
    r = np.random.default_rng(31)

    # The desk lamp going off: a chunky plastic switch.
    click = filt(noise(r, 0.05), "bp", (1800, 6500)) * env(n_of(0.05), 0.0003, 0.004)
    body = tone(210, 0.12, 0.025, attack=0.0005)
    single(kit, "lamp", room(mix(click * 1.4, 0.8 * body), 0.25, 0.3, seed=1), -5)

    # A door closing far down the corridor: soft, low, mostly room.
    thump = filt(noise(r, 0.4), "lp", 180) * env(n_of(0.4), 0.004, 0.07)
    latch = filt(noise(r, 0.03), "bp", (1200, 3000)) * env(n_of(0.03), 0.0005, 0.006)
    door = mix(thump * 1.2, 0.25 * np.concatenate([np.zeros(n_of(0.09)), latch]))
    single(kit, "door", filt(room(door, 0.9, 0.9, tone_hz=1400, seed=2), "lp", 2200), -14)

    # The ring: each one a slightly different bell; the montage's are higher
    # and shorter, one ring each.
    rings = [(760, 1.15), (745, 1.15), (840, 0.6), (905, 0.6), (980, 0.6)]
    variants(kit, "ring", len(rings), lambda rng, k: bell_ring(rng, rings[k][0] + rng.uniform(-8, 8), rings[k][1]), -3)

    # The office before the lamp goes: air conditioning and a fluorescent buzz.
    d = 3.0
    air = filt(noise(r, d), "lp", 700) * 0.5 + filt(noise(r, d), "bp", (1500, 4000)) * 0.05
    buzz = sum(a * np.sin(2 * math.pi * 100 * h * t(d)) for h, a in [(1, 1), (2, 0.6), (3, 0.35), (4, 0.2)]) * 0.12
    office = air + buzz
    office[: n_of(0.15)] *= np.linspace(0, 1, n_of(0.15))
    single(kit, "office", office, -18)

    # The wall clock in the empty office: a quartz tick, each one a little off.
    def tick(rng, k):
        c = filt(noise(rng, 0.025), "bp", (2500 + rng.uniform(-300, 300), 7500)) * env(n_of(0.025), 0.0002, 0.003)
        return room(mix(c * 1.4, tone(1900 + rng.uniform(-120, 120), 0.02, 0.004, attack=0.0003) * 0.3), 0.5, 0.35, seed=k)
    variants(kit, "tick", 4, tick, -16)

    # A booking confirmed: two soft rising notes.
    def confirm(rng, k):
        out = np.zeros(n_of(1.0))
        for i, f in enumerate([880.0 * 2 ** (k * 2 / 12), 1318.5 * 2 ** (k * 2 / 12)]):
            place(out, mix(tone(f, 0.8, 0.22, attack=0.002), 0.25 * tone(f * 2.76, 0.4, 0.06)), i * 0.09)
        return room(out, 0.5, 0.3, seed=20 + k)
    variants(kit, "confirm", 2, confirm, -7)

    # Picking up: the handset leaves the cradle, then the line opens.
    lift = mix(
        filt(noise(r, 0.06), "bp", (700, 4000)) * env(n_of(0.06), 0.0004, 0.01) * 1.3,
        tone(140, 0.2, 0.05, attack=0.001),
        np.concatenate([np.zeros(n_of(0.07)), filt(noise(r, 0.25), "bp", (300, 2500)) * env(n_of(0.25), 0.02, 0.06) * 0.25]),
    )
    single(kit, "pickup", room(lift, 0.3, 0.25, seed=3), -4)
    line = mix(
        filt(noise(r, 0.02), "bp", (2000, 7000)) * env(n_of(0.02), 0.0002, 0.003) * 1.4,
        filt(noise(r, 0.5), "bp", (400, 3200)) * np.clip(t(0.5) / 0.05, 0, 1) * np.exp(-t(0.5) / 0.18) * 0.18,
    )
    single(kit, "line", line, -8)

    # Under the call: a quiet phone line — band-limited hiss and a faint hum.
    bed_dur = 26.0
    hiss = filt(noise(r, bed_dur), "bp", (350, 3400)) * 0.05
    hum = 0.012 * (np.sin(2 * math.pi * 50 * t(bed_dur)) + 0.4 * np.sin(2 * math.pi * 150 * t(bed_dur)))
    bed = hiss + hum
    bed[: n_of(0.3)] *= np.linspace(0, 1, n_of(0.3))
    bed[-n_of(0.6):] *= np.linspace(1, 0, n_of(0.6))
    single(kit, "linebed", bed, -24)

    # A slot dropping into the calendar: a felt-covered thump with a latch.
    slot = mix(
        tone(95, 0.35, 0.07, attack=0.001, glide_to=70),
        filt(noise(r, 0.05), "bp", (1500, 4500)) * env(n_of(0.05), 0.0004, 0.006) * 0.9,
        0.5 * tone(620, 0.2, 0.04, attack=0.0008),
    )
    single(kit, "slot", room(np.tanh(1.5 * slot), 0.3, 0.2, seed=4), -3)

    # The confirmation arriving: a phone buzzing twice on the wood.
    def buzz(rng, k):
        out = np.zeros(n_of(0.62))
        for i, at in enumerate([0.0, 0.26]):
            d = 0.17 + rng.uniform(-0.01, 0.01)
            f = 168 + rng.uniform(-6, 6) + 6 * i
            b = tone(f, d, 10, attack=0.01, shape="square") * np.clip((d - t(d)) / 0.02, 0, 1)
            rattle = filt(noise(rng, d), "bp", (900, 2600)) * (0.5 + 0.5 * np.sin(2 * math.pi * f * t(d))) * 0.25
            place(out, filt(b, "lp", 1400) + rattle, at)
        return room(out, 0.2, 0.2, seed=5 + k)
    variants(kit, "sms", 5, buzz, -6)

    # Whips between the montage calls: air past the ear, each a new shape.
    variants(kit, "whip", 6, lambda rng, k: whoosh(rng, 0.3 + 0.04 * k, 350 + 120 * k, 5600 - 350 * k, 1.0), -6)

    # Headline slams: a low hit, each tuned apart.
    slams = [(88, 44), (104, 50), (78, 40)]
    variants(kit, "slam", 3, lambda rng, k: room(hit(rng, *slams[k], dur=0.8, tau=0.2), 0.5, 0.3, seed=9 + k), -2)

    # Hanging up: the handset back in the cradle.
    down = mix(
        tone(120, 0.3, 0.06, attack=0.0008, glide_to=85),
        filt(noise(r, 0.05), "bp", (600, 3000)) * env(n_of(0.05), 0.0004, 0.008) * 1.1,
    )
    single(kit, "hangup", room(np.tanh(1.3 * down), 0.35, 0.3, seed=6), -4)

    # The end: a last trill of the bell softening into a shimmer.
    trill = bell_ring(r, 1175, dur=0.55)
    trill *= np.exp(-t(len(trill) / SR) / 0.5)[: len(trill)]
    shimmer = np.zeros(n_of(2.2))
    for i, semis in enumerate([0, 4, 7, 12, 16]):
        place(shimmer, tone(1568 * 2 ** (semis / 12), 1.6, 0.5, attack=0.005) * 0.25, 0.1 + i * 0.06)
    single(kit, "trill", room(mix(trill * 0.7, shimmer), 1.1, 0.5, seed=7), -4)

    # The CRM after the call: clean digital sounds, the office left behind.
    # The white curtain crossing the night: one long, airy sweep.
    single(kit, "sweep", mix(whoosh(r, 0.8, 300, 7000, 0.8, 1.0), 0.3 * whoosh(r, 0.8, 150, 1200, 0.7, 1.0)), -5)

    # The summary typing itself: small, dry keys.
    def type_key(rng, k):
        c = filt(noise(rng, 0.025), "bp", (2500 + rng.uniform(-400, 800), 8000)) * env(n_of(0.025), 0.0002, 0.002 + rng.uniform(0, 0.0015))
        return mix(c * 1.4, tone(rng.uniform(1100, 1700), 0.015, 0.003, attack=0.0003) * 0.3)
    variants(kit, "type", 24, type_key, -14)

    # Tags popping onto the card.
    variants(kit, "pop", 4, lambda rng, k: mix(
        tone(900 * 2 ** (k * 3 / 12), 0.09, 0.02, attack=0.0006, glide_to=1500 * 2 ** (k * 3 / 12)),
        filt(noise(rng, 0.012), "bp", (2000, 8000)) * env(n_of(0.012), 0.0002, 0.002) * 0.3,
    ), -9)

    # The card landing in its column.
    variants(kit, "drop", 2, lambda rng, k: room(mix(
        tone(150 - 20 * k, 0.3, 0.06, attack=0.001, glide_to=90),
        filt(noise(rng, 0.03), "bp", (1200, 4000)) * env(n_of(0.03), 0.0004, 0.005) * 0.8,
    ), 0.3, 0.2, seed=40 + k), -4)

    # Each automation ticking done, each log row arriving: soft rising blips.
    def blip(rng, k):
        f0 = 988 * 2 ** ([0, 2, 4, 7, 9, 12, 14][k % 7] / 12) * (2 if k >= 7 else 1)
        return room(mix(tone(f0, 0.35, 0.07, attack=0.0015), 0.25 * tone(f0 * 2, 0.2, 0.03, attack=0.001)), 0.3, 0.2, seed=60 + k)
    variants(kit, "blip", 14, blip, -9)

    # Flashes: a short camera-flash zap over each ring.
    variants(kit, "zap", 3, lambda rng, k: mix(
        filt(noise(rng, 0.12), "hp", 3000) * env(n_of(0.12), 0.0005, 0.03) * 0.6,
        tone(2600 + 400 * k, 0.12, 0.03, attack=0.0005, glide_to=900) * 0.4,
    ), -10)


# ── ivr: the phone menu, then soft wood ────────────────────────────────────

DTMF = {"1": (697, 1209), "2": (697, 1336), "3": (697, 1477), "4": (770, 1209), "5": (770, 1336),
        "6": (770, 1477), "7": (852, 1209), "8": (852, 1336), "9": (852, 1477), "0": (941, 1336),
        "*": (941, 1209), "#": (941, 1477)}


def marimba(freq, dur=0.9):
    """A soft wooden bar: fundamental, the 4th partial, a mallet knock."""
    return mix(
        tone(freq, dur, 0.28, attack=0.001),
        0.35 * tone(freq * 3.93, dur, 0.06, attack=0.001),
        0.15 * tone(freq * 9.2, 0.2, 0.012, attack=0.0005),
    )


def build_ivr():
    kit = "ivr"
    r = np.random.default_rng(41)

    keys = list("135792468#0*")
    def dtmf(rng, k):
        lo, hi = DTMF[keys[k]]
        d = 0.12 + rng.uniform(-0.015, 0.02)
        x = np.sin(2 * math.pi * lo * t(d)) + np.sin(2 * math.pi * hi * t(d))
        x *= np.clip(t(d) / 0.004, 0, 1) * np.clip((d - t(d)) / 0.004, 0, 1)
        return filt(x, "bp", (300, 3400)) * 0.7
    variants(kit, "dtmf", len(keys), dtmf, -8)

    # The line: mains hum and a thin buzz under the whole menu.
    bed_dur = 8.0
    x = t(bed_dur)
    hum = sum(a * np.sin(2 * math.pi * 50 * h * x) for h, a in [(1, 1), (2, 0.5), (3, 0.4), (5, 0.2), (7, 0.1)])
    buzz = filt(np.sign(np.sin(2 * math.pi * 100 * x)), "bp", (400, 2400)) * 0.08
    bed = (hum * 0.25 + buzz) * (1 + 0.1 * np.sin(2 * math.pi * 0.7 * x))
    bed[: n_of(0.2)] *= np.linspace(0, 1, n_of(0.2))
    single(kit, "hum", bed, -20)

    # Terminal keys: dry, small, never the same click twice.
    def key(rng, k):
        d = 0.03
        c = filt(noise(rng, d), "bp", (2000 + rng.uniform(-400, 900), 7000)) * env(n_of(d), 0.0002, 0.0025 + rng.uniform(0, 0.002))
        return mix(c * 1.6, tone(rng.uniform(900, 1500), 0.02, 0.004, attack=0.0003) * 0.4)
    variants(kit, "key", 30, key, -12)

    # "בחירה שגויה": an error buzzer that climbs as the loop speeds up.
    def err(rng, k):
        f = 180 * 2 ** (k * 2 / 12)
        d = 0.32 - 0.03 * k
        x = tone(f, d, 10, attack=0.003, shape="square") + 0.6 * tone(f * 1.5, d, 10, attack=0.003, shape="saw")
        x *= np.clip((d - t(d)) / 0.01, 0, 1)
        return filt(x, "bp", (250, 3400))
    variants(kit, "error", 7, err, -7)

    # The headline landing in the menu's world: a low, bit-crushed thump.
    def thump(rng, k):
        x = hit(rng, 110 - 14 * k, 45, dur=0.5, tau=0.12, grit=0.4)
        return np.repeat(np.round(x[::6] * 12) / 12, 6)[: len(x)]
    variants(kit, "thump", 2, thump, -3)

    # The break: a digital crunch — bit-crushed noise and a falling sweep.
    d = 0.5
    crunch = noise(r, d)
    crunch = np.round(crunch * 3) / 3
    crunch = np.repeat(crunch[::12], 12)[: n_of(d)]
    crunch = mix(crunch * env(n_of(d), 0.001, 0.12), tone(1800, d, 0.2, attack=0.001, glide_to=60, shape="square") * 0.6)
    single(kit, "crunch", np.tanh(2 * crunch), -2)

    # The conversation: each message a wooden note — together a small tune.
    # A major pentatonic from D5 (the customer low, the agent answering higher).
    notes = [587.3, 740.0, 659.3, 880.0, 987.8, 1174.7, 784.0, 1318.5]
    variants(kit, "wood", len(notes), lambda rng, k: room(marimba(notes[k] * (1 + rng.uniform(-0.002, 0.002))), 0.4, 0.2, seed=k), -5)

    # The white world's air: a soft, bright room under the conversation.
    d = 12.0
    air = filt(noise(r, d), "bp", (2500, 9000)) * 0.4 + filt(noise(r, d), "lp", 300) * 0.6
    air *= 1 + 0.15 * np.sin(2 * math.pi * 0.23 * t(d))
    air[: n_of(0.5)] *= np.linspace(0, 1, n_of(0.5))
    air[-n_of(0.8):] *= np.linspace(1, 0, n_of(0.8))
    single(kit, "air", air, -30)

    # "Typing…": soft taps on glass, each one different.
    def tap(rng, k):
        dd = 0.04
        c = filt(noise(rng, dd), "bp", (1200 + rng.uniform(-200, 400), 4200)) * env(n_of(dd), 0.0004, 0.006 + rng.uniform(0, 0.004))
        return mix(c, tone(rng.uniform(420, 620), 0.03, 0.008, attack=0.0005) * 0.35)
    variants(kit, "tap", 16, tap, -16)

    # The chip landing: a bright wooden pop with a glint.
    chip = mix(marimba(1568, 0.7), 0.3 * tone(3136, 0.5, 0.12, attack=0.002), 0.2 * tone(4699, 0.4, 0.08, attack=0.002))
    single(kit, "chip", room(chip, 0.6, 0.3, seed=21), -4)

    # The comparison lines: a deep wooden knock each.
    lows = [146.8, 164.8, 130.8]
    variants(kit, "knock", 3, lambda rng, k: room(np.tanh(1.4 * mix(marimba(lows[k], 1.0), 0.4 * tone(lows[k] / 2, 0.5, 0.1))), 0.5, 0.3, seed=30 + k), -3)

    # Swishes: the old menu wiped away.
    variants(kit, "swish", 3, lambda rng, k: whoosh(rng, 0.28 + 0.04 * k, 600 + 200 * k, 6500, 1.3), -8)

    # The end card: a low wooden note and a shimmer on top.
    end = np.zeros(n_of(2.4))
    place(end, marimba(196.0, 1.6) * 1.2, 0)
    for i, f in enumerate([1568, 1976, 2349, 2637, 3136]):
        place(end, tone(f, 1.4, 0.45, attack=0.004) * 0.18, 0.08 + i * 0.05)
    single(kit, "end", room(end, 1.0, 0.4, seed=40), -4)

    # Flash accents: a clean high tick of light.
    variants(kit, "glint", 3, lambda rng, k: mix(
        tone(3520 + 220 * k, 0.3, 0.07, attack=0.001), 0.4 * tone(5280 + 330 * k, 0.2, 0.04, attack=0.001),
    ), -12)


# ── flood: pops, silence, a rising chain ───────────────────────────────────

def pop(rng, f=None):
    f = f or rng.uniform(700, 2200)
    d = 0.09
    body = tone(f, d, 0.018 + rng.uniform(0, 0.012), attack=0.0006, glide_to=f * rng.uniform(1.4, 2.1))
    snap = filt(rng.standard_normal(n_of(0.012)), "bp", (2000, 8000)) * env(n_of(0.012), 0.0002, 0.002)
    return mix(body, snap * 0.35)


def build_flood():
    kit = "flood"
    r = np.random.default_rng(51)

    variants(kit, "pop", 24, lambda rng, k: pop(rng, 820 * 2 ** (k % 12 / 12) * rng.uniform(0.97, 1.03)), -8)

    # The swarm: pops doubling in density until they fuse into a wall.
    d = 5.2
    swarm = np.zeros(n_of(d + 0.3))
    tt = 0.0
    while tt < d:
        place(swarm, pop(r) * r.uniform(0.35, 1.0), tt)
        density = 3 * 2 ** (tt / d * 6.2)  # pops per second: 3 → ~220
        tt += r.exponential(1 / density)
    wall = filt(r.standard_normal(len(swarm)), "bp", (500, 5000)) * np.clip((t(len(swarm) / SR) - d * 0.55) / (d * 0.45), 0, 1) ** 2
    swarm = swarm + 0.35 * wall
    swarm[-n_of(0.02):] *= np.linspace(1, 0, n_of(0.02))  # cut hard into the silence
    single(kit, "swarm", np.tanh(1.2 * swarm / (np.max(np.abs(swarm)) + 1e-9) * 1.5), -3)

    # A hit on every doubling, each bigger than the last.
    variants(kit, "double", 4, lambda rng, k: np.tanh((1 + 0.4 * k) * mix(
        tone(220 * 2 ** (k * 3 / 12), 0.35, 0.06 + 0.02 * k, attack=0.0008, glide_to=110),
        filt(noise(rng, 0.1), "hp", 2500) * env(n_of(0.1), 0.0005, 0.02) * 0.5,
    )), -4)

    # The domino: clicks climbing a scale, then one clean bell.
    d = 2.6
    chain = np.zeros(n_of(d + 2.2))
    scale = [0, 2, 4, 7, 9]
    k, tt = 0, 0.0
    while tt < d:
        semis = scale[k % 5] + 12 * (k // 5)
        f = 440 * 2 ** (semis / 12)
        c = mix(tone(min(f, 7000), 0.06, 0.012, attack=0.0004), filt(r.standard_normal(n_of(0.01)), "hp", 4000) * env(n_of(0.01), 0.0002, 0.002) * 0.4)
        place(chain, c * (0.5 + 0.5 * tt / d), tt)
        tt += 0.095 * (1 - 0.55 * tt / d)
        k += 1
    bell = mix(tone(1760, 2.0, 0.7, attack=0.002), 0.3 * tone(1760 * 2.76, 1.2, 0.25), 0.12 * tone(1760 * 5.4, 0.6, 0.08))
    place(chain, bell * 1.1, d + 0.05)
    single(kit, "domino", room(chain, 0.8, 0.3, seed=52), -3)

    # The white page's air, under everything but the black.
    def air(rng, k):
        d = 16.0
        x = filt(noise(rng, d), "bp", (3000, 10000)) * 0.35 + filt(noise(rng, d), "lp", 250) * 0.65
        x *= 1 + 0.12 * np.sin(2 * math.pi * (0.17 + 0.05 * k) * t(d))
        x[: n_of(0.05)] *= np.linspace(0, 1, n_of(0.05))
        x[-n_of(1.0):] *= np.linspace(1, 0, n_of(1.0))
        return x
    variants(kit, "air", 2, air, -30)

    # "Typing…" in each channel: soft taps, none the same.
    def tap(rng, k):
        dd = 0.04
        c = filt(noise(rng, dd), "bp", (1500 + rng.uniform(-300, 500), 5000)) * env(n_of(dd), 0.0004, 0.005 + rng.uniform(0, 0.004))
        return mix(c, tone(rng.uniform(500, 760), 0.03, 0.007, attack=0.0005) * 0.3)
    variants(kit, "tap", 24, tap, -16)

    # Whips between the channels.
    variants(kit, "whip", 4, lambda rng, k: whoosh(rng, 0.3 + 0.04 * k, 400 + 180 * k, 6000 - 300 * k, 1.2), -6)

    # Soft pops for the answers, pitched to each channel's phone.
    variants(kit, "answer", 6, lambda rng, k: room(mix(pop(rng, 600 + 90 * k), 0.4 * tone(1200 + 180 * k, 0.25, 0.05)), 0.3, 0.2, seed=60 + k), -6)

    # Headline slams.
    variants(kit, "slam", 3, lambda rng, k: hit(rng, 96 + 12 * k, 48, dur=0.7, tau=0.16), -2)

    # The end: a last bell that rings on.
    end = mix(tone(1318.5, 3.0, 1.1, attack=0.002), 0.3 * tone(1318.5 * 2.76, 1.6, 0.35), 0.1 * tone(1318.5 * 5.4, 0.8, 0.1),
              0.5 * tone(659.3, 3.0, 1.2, attack=0.004))
    single(kit, "end", room(end, 1.4, 0.45, seed=53), -4)


# ── factory: the sorting machine ───────────────────────────────────────────

def build_factory():
    kit = "factory"
    r = np.random.default_rng(61)

    # The conveyor: a low motor, rollers clattering in rhythm.
    d = 8.0
    x = t(d)
    motor = 0.3 * np.sin(2 * math.pi * 55 * x + 0.3 * np.sin(2 * math.pi * 3 * x)) + 0.15 * np.sin(2 * math.pi * 110 * x)
    clatter = np.zeros(n_of(d))
    for i in range(int(d * 8)):
        place(clatter, filt(noise(r, 0.03), "bp", (500, 2200)) * env(n_of(0.03), 0.0005, 0.008) * r.uniform(0.3, 0.7), i / 8 + r.uniform(0, 0.01))
    bed = motor + clatter + 0.05 * filt(noise(r, d), "lp", 600)
    bed[: n_of(0.25)] *= np.linspace(0, 1, n_of(0.25))
    bed[-n_of(0.4):] *= np.linspace(1, 0, n_of(0.4))
    single(kit, "conveyor", bed, -16)

    # The same belt close up, under the press: slower rollers, more motor.
    clatter = np.zeros(n_of(d))
    for i in range(int(d * 5)):
        place(clatter, filt(noise(r, 0.04), "bp", (300, 1500)) * env(n_of(0.04), 0.0005, 0.012) * r.uniform(0.4, 0.8), i / 5 + r.uniform(0, 0.015))
    close = 0.4 * np.sin(2 * math.pi * 48 * x + 0.4 * np.sin(2 * math.pi * 2 * x)) + 0.2 * np.sin(2 * math.pi * 96 * x) + clatter
    close[: n_of(0.25)] *= np.linspace(0, 1, n_of(0.25))
    close[-n_of(0.4):] *= np.linspace(1, 0, n_of(0.4))
    single(kit, "belt", close, -17)

    # The factory floor under the dashboard: a big room, air handling.
    d = 6.0
    floor = filt(noise(r, d), "lp", 400) * 0.7 + filt(noise(r, d), "bp", (1500, 5000)) * 0.08
    floor += 0.08 * np.sin(2 * math.pi * 60 * t(d))
    floor[: n_of(0.4)] *= np.linspace(0, 1, n_of(0.4))
    floor[-n_of(0.6):] *= np.linspace(1, 0, n_of(0.6))
    single(kit, "floor", room(floor, 1.2, 0.5, tone_hz=1500, seed=66), -26)

    # A card shot out of a pipe: a pneumatic whoop.
    def whoop(rng, k):
        dd = 0.32
        air = sweep(noise(rng, dd), 300 + 60 * k, 2400 + 300 * k, 2.2) * np.sin(np.pi * np.clip(t(dd) / dd, 0, 1)) ** 0.8
        return mix(air, 0.5 * tone(160 + 30 * k, 0.12, 0.03, attack=0.001))
    variants(kit, "pipe", 5, whoop, -6)

    # The headline hits: heavy metal.
    def metal(rng, k):
        f = 72 + 10 * k
        strike = np.zeros(n_of(1.4))
        strike[0] = 1
        plate = sum(a * reso(strike, f * m, 90) for m, a in [(1, 1), (2.41, 0.6), (3.9, 0.5), (5.8, 0.3), (8.3, 0.2)])
        plate = plate / (np.max(np.abs(plate)) + 1e-9) * np.exp(-t(1.4) / 0.45)
        return room(np.tanh(2 * mix(plate, hit(rng, f * 1.2, f * 0.6, dur=0.5, tau=0.1))), 0.8, 0.35, tone_hz=2500, seed=62 + k)
    variants(kit, "metal", 4, metal, -2)

    # The scanner: a beam sweeping up a card.
    variants(kit, "scan", 5, lambda rng, k: (
        tone(420 + 40 * k, 0.45, 10, attack=0.01, glide_to=1500 + 120 * k, shape="saw")
        * np.sin(np.pi * np.clip(t(0.45) / 0.45, 0, 1)) * 0.25
        + filt(noise(rng, 0.45), "bp", (2000, 6000)) * 0.05
    ), -12)

    # The stamp: a press coming down, rubber on paper — each in its own tone.
    def stamp(rng, k):
        f = 70 + 9 * k
        press = hit(rng, f * 1.6, f, dur=0.5, tau=0.09, grit=0.5)
        slap = filt(noise(rng, 0.04), "bp", (400, 1800)) * env(n_of(0.04), 0.0004, 0.01) * 1.2
        hiss = np.concatenate([np.zeros(n_of(0.08)), filt(noise(rng, 0.35), "hp", 2500) * env(n_of(0.35), 0.02, 0.09) * 0.25])
        return room(np.tanh(1.5 * mix(press, slap, hiss)), 0.45, 0.25, seed=70 + k)
    variants(kit, "stamp", 5, stamp, -2)

    # The sorting gate: a hard mechanical clack.
    variants(kit, "gate", 12, lambda rng, k: room(mix(
        filt(noise(rng, 0.03), "bp", (1500 + 120 * k, 5000)) * env(n_of(0.03), 0.0003, 0.005) * 1.6,
        tone(280 + 30 * k, 0.1, 0.02, attack=0.0005, shape="square") * 0.4,
        np.concatenate([np.zeros(n_of(0.05)), filt(noise(rng, 0.03), "bp", (1200, 4000)) * env(n_of(0.03), 0.0003, 0.004)]) * 0.8,
    ), 0.3, 0.2, seed=80 + k), -6)

    # An appointment landing in the week: a desk bell, each a step higher.
    bells = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0]
    variants(kit, "ding", len(bells), lambda rng, k: room(mix(
        tone(bells[k], 1.2, 0.45, attack=0.001), 0.35 * tone(bells[k] * 2.76, 0.8, 0.14), 0.12 * tone(bells[k] * 5.4, 0.4, 0.05),
    ), 0.6, 0.3, seed=90 + k), -6)

    # A cold card into the tray: a soft paper slide and a drop.
    variants(kit, "tray", 3, lambda rng, k: mix(
        whoosh(rng, 0.25, 800, 2500, 0.9, 0.5),
        np.concatenate([np.zeros(n_of(0.2)), tone(140 + 20 * k, 0.2, 0.04, attack=0.001) * 0.8]),
    ), -7)

    # Air venting from the press.
    variants(kit, "air", 4, lambda rng, k: filt(noise(rng, 0.5), "bp", (2500 + 300 * k, 9000)) * np.clip(t(0.5) / 0.01, 0, 1) * np.exp(-t(0.5) / (0.1 + 0.03 * k)), -12)

    # The machine winding down into the dashboard.
    d = 1.8
    wind = tone(220, d, 10, attack=0.01, glide_to=40, shape="saw") * np.clip((d - t(d)) / d, 0, 1) ** 1.5
    single(kit, "winddown", filt(wind, "lp", 1200) + filt(noise(r, d), "lp", 400) * np.exp(-t(d) / 0.5) * 0.3, -6)

    # The last stamp: the monogram pressed onto the metal, deepest of all.
    last = room(np.tanh(1.8 * mix(hit(r, 90, 38, dur=1.0, tau=0.28, grit=0.6),
                                   filt(noise(r, 0.05), "bp", (300, 1500)) * env(n_of(0.05), 0.0004, 0.012) * 1.4)), 1.0, 0.4, seed=99)
    single(kit, "final", last, -1.5)

    # Flash accents over the stamps.
    variants(kit, "flash", 4, lambda rng, k: filt(noise(rng, 0.15), "hp", 4000 + 500 * k) * env(n_of(0.15), 0.0005, 0.03), -14)


# ── brand: the one sound every follow-up ad ends on ───────────────────────

def build_brand():
    """The sonic logo, timed to the brand end card (EndCard entry "brand"):
    a soft low impact on the flash, a note as the monogram forms (0.2s), a
    fifth above as the wordmark arrives (0.53s), and a chord that rings out.
    Unlike every other sound here it is meant to be heard identically each
    time: it is the brand's signature."""
    kit = "brand"
    r = np.random.default_rng(101)
    out = np.zeros(n_of(3.6))
    swell = filt(noise(r, 0.5), "bp", (400, 5000)) * np.sin(np.pi * np.clip(t(0.5) / 0.5, 0, 1)) ** 2 * 0.12
    place(out, swell, 0)
    place(out, hit(r, 82, 41, dur=1.4, tau=0.34, grit=0.12) * 0.9, 0)

    def chime(f0, dur=2.6, tau=0.9):
        return mix(
            tone(f0, dur, tau, attack=0.003),
            0.35 * tone(f0 * 2.0, dur * 0.7, tau * 0.45, attack=0.003),
            0.18 * tone(f0 * 3.01, dur * 0.4, tau * 0.18, attack=0.002),
            0.12 * tone(f0 * 4.2, 0.25, 0.03, attack=0.001),  # the mallet
        )

    place(out, chime(880.0) * 0.55, 0.2)
    place(out, chime(1318.5) * 0.5, 0.53)
    for i, f0 in enumerate([659.3, 880.0, 1108.7, 1318.5, 1760.0]):
        place(out, tone(f0, 2.8, 1.1, attack=0.02) * 0.12, 0.8 + i * 0.035)
    single(kit, "sting", room(out, 1.3, 0.45, tone_hz=6000, seed=102), -2)


def main():
    for build in (build_desk, build_ivr, build_flood, build_factory, build_brand):
        print(build.__name__)
        build()
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
