"""Synthesize the ad's sound design into public/sfx/*.wav.

Every sound is built from sines, noise and filters — no sample libraries, so
nothing to license. Re-run after changing a sound; the cue sheet that places
them lives in src/SoundTrack.tsx.
"""
import math
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"
rng = np.random.default_rng(7)


def t(dur):
    return np.arange(int(dur * SR)) / SR


def env(n, attack=0.002, tau=0.2):
    x = np.arange(n) / SR
    a = np.clip(x / max(attack, 1e-6), 0, 1)
    return a * np.exp(-x / tau)


def biquad(x, kind, f0, q=0.707):
    """RBJ cookbook biquad (lowpass / highpass / bandpass)."""
    w0 = 2 * math.pi * f0 / SR
    alpha = math.sin(w0) / (2 * q)
    c = math.cos(w0)
    if kind == "lp":
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == "hp":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else:  # band-pass, constant peak gain
        b = [alpha, 0.0, -alpha]
    a = [1 + alpha, -2 * c, 1 - alpha]
    b = [v / a[0] for v in b]
    a1, a2 = a[1] / a[0], a[2] / a[0]
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i, xi in enumerate(x):
        yi = b[0] * xi + b[1] * x1 + b[2] * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, xi, y1, yi
        y[i] = yi
    return y


def sweep_bp(x, f_start, f_end, q=1.2, block=256):
    """Band-pass whose centre glides — filtered block by block."""
    y = np.zeros_like(x)
    n = len(x)
    for s in range(0, n, block):
        frac = s / max(1, n - 1)
        f = f_start * (f_end / f_start) ** frac
        seg = x[max(0, s - 512): s + block]
        out = biquad(seg, "bp", f, q)
        y[s: s + block] = out[-len(x[s: s + block]):]
    return y


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def tone(freq, dur, tau, attack=0.002, glide_to=None):
    x = t(dur)
    if glide_to is None:
        phase = 2 * math.pi * freq * x
    else:
        f = freq * (glide_to / freq) ** (x / dur)
        phase = 2 * math.pi * np.cumsum(f) / SR
    return np.sin(phase) * env(len(x), attack, tau)


def bell(freq, dur=0.7, tau=0.32):
    # A soft bell: a fundamental plus two inharmonic partials that die fast.
    return (
        tone(freq, dur, tau)
        + 0.32 * tone(freq * 2.76, dur, tau * 0.35)
        + 0.12 * tone(freq * 5.40, dur, tau * 0.15)
    )


def click(dur=0.03, f=3200, body=None, body_tau=0.012, level=1.0):
    burst = biquad(noise(dur), "bp", f, 1.4) * env(int(dur * SR), 0.0005, 0.004)
    out = burst * 1.8
    if body:
        out = out + 0.6 * tone(body, dur, body_tau, attack=0.0005)
    return out * level


def mix(*sounds):
    """Sum sounds of different lengths, padding each to the longest."""
    n = max(len(x) for x in sounds)
    out = np.zeros(n)
    for x in sounds:
        out[: len(x)] += x
    return out


def place(canvas, sound, at):
    i = int(at * SR)
    end = min(len(canvas), i + len(sound))
    canvas[i:end] += sound[: end - i]


# Level of the whole kit: the first mix peaked at -7.5 dBFS, soft for an ad.
GAIN_DB = 3.0


def write(name, x, peak_db=-3.0):
    x = np.asarray(x, dtype=np.float64)
    # 3 ms fades so nothing clicks at the edges.
    fade = int(0.003 * SR)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    peak = np.max(np.abs(x)) or 1.0
    x = x / peak * (10 ** (min(-0.5, peak_db + GAIN_DB) / 20))
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())
    print(f"{name:10s} {len(x) / SR:5.2f}s")


def main():
    # The phone waking in the dark: a small tick over a breath of air.
    air = biquad(noise(0.6), "lp", 420) * np.sin(np.pi * np.clip(t(0.6) / 0.6, 0, 1)) * 0.5
    wake = np.zeros(int(0.6 * SR))
    place(wake, air, 0)
    place(wake, click(0.02, 2600, body=900, level=0.9), 0.0)
    write("wake", wake, -6)

    # Notification pings, climbing: D6, E6, F#6, A6.
    for i, semis in enumerate([0, 2, 4, 7], start=1):
        write(f"ping-{i}", bell(1174.7 * 2 ** (semis / 12)), -4)

    # The clock rolling to morning: mechanical ticks that speed up, then slow
    # into a heavier clunk as it lands on 08:40 (the ease-in-out of the roll).
    roll = np.zeros(int(1.75 * SR))
    pos, times = 0.0, []
    while pos < 1.6:
        times.append(pos)
        speed = math.sin(math.pi * min(1.0, pos / 1.6))  # 0 → 1 → 0
        pos += 0.13 - 0.105 * speed
    for k, at in enumerate(times):
        place(roll, click(0.02, 2400 + 300 * (k % 3), body=1600, level=0.55), at)
    place(roll, click(0.05, 1300, body=420, body_tau=0.05, level=1.2), 1.6)
    write("roll", roll, -5)

    # Muted thuds for the "too late" replies.
    thud = tone(120, 0.4, 0.09, attack=0.001, glide_to=70) + 0.25 * biquad(noise(0.4), "lp", 300) * env(int(0.4 * SR), 0.001, 0.05)
    write("thud", thud, -5)

    # The rewind: noise sucked backwards (rising band, rising level), with a
    # thin tape chirp inside it, cut off hard as it lands.
    n = noise(0.9)
    rise = np.clip(t(0.9) / 0.9, 0, 1) ** 2.2
    chirp = np.sin(2 * math.pi * np.cumsum(220 * (1400 / 220) ** (t(0.9) / 0.9) * (1 + 0.02 * np.sin(2 * math.pi * 23 * t(0.9)))) / SR)
    rewind = sweep_bp(n, 300, 3800, 0.9) * rise * 1.4 + 0.16 * chirp * rise
    write("rewind", rewind, -5)

    # The liquid curtain passing: a broad, soft whoosh.
    bellshape = np.sin(np.pi * np.clip(t(0.85) / 0.85, 0, 1)) ** 1.6
    write("curtain", sweep_bp(noise(0.85), 900, 380, 0.8) * bellshape, -6)

    # A lighter swish for the carousel moving one phone over.
    write("swish", sweep_bp(noise(0.4), 2200, 700, 1.0) * np.sin(np.pi * np.clip(t(0.4) / 0.4, 0, 1)) ** 2, -9)

    # Landing click on 23:41.
    write("land", click(0.12, 2200, body=880, body_tau=0.03, level=1.0), -5)

    # Soft typing: five key clicks at uneven spacing.
    typing = np.zeros(int(0.55 * SR))
    at = 0.0
    for _ in range(5):
        place(typing, click(0.03, 4200, body=190, body_tau=0.01, level=0.8 + 0.3 * rng.random()), at)
        at += 0.07 + 0.05 * rng.random()
    write("typing", typing, -8)

    # Bubble pop.
    write("pop", mix(tone(900, 0.12, 0.05, attack=0.0008, glide_to=420), 0.2 * click(0.01, 5000)), -6)

    # Success: a click and a bright two-note ding (G6 then D7).
    succ = np.zeros(int(0.8 * SR))
    place(succ, click(0.02, 3000, level=0.7), 0)
    place(succ, 0.8 * bell(1568.0, 0.7, 0.28), 0.0)
    place(succ, 0.7 * bell(2349.3, 0.7, 0.32), 0.07)
    write("success", succ, -5)

    # An incoming call: two soft rings, each a warbling pair of tones.
    ring = np.zeros(int(1.2 * SR))
    for start in (0.0, 0.55):
        x = t(0.36)
        warble = np.where(np.sin(2 * math.pi * 18 * x) > 0, 880.0, 987.8)
        body = np.sin(2 * math.pi * np.cumsum(warble) / SR) + 0.15 * np.sin(2 * math.pi * np.cumsum(warble * 3) / SR)
        place(ring, body * env(len(x), 0.01, 0.25) * 0.8, start)
    write("ring", ring, -9)

    # Morning air: a pale swell.
    swell = np.clip(t(1.1) / 0.45, 0, 1) * np.exp(-np.clip(t(1.1) - 0.45, 0, None) / 0.35)
    write("air", biquad(noise(1.1), "lp", 2400) * swell + 0.04 * tone(2637, 1.1, 0.5, attack=0.3), -12)

    # UI tick for dashboard rows landing.
    write("tick", click(0.08, 3000, body=1400, body_tau=0.012, level=1.0), -8)

    # A deep hit under each of the two big lines.
    hit = mix(
        tone(90, 0.7, 0.28, attack=0.001, glide_to=48) * 1.2,
        click(0.03, 1800, level=0.6),
        0.2 * biquad(noise(0.7), "lp", 500) * env(int(0.7 * SR), 0.001, 0.08),
    )
    write("hit", hit, -3)

    # A crisp key for each letter of the wordmark.
    write("key", click(0.08, 3600, body=520, body_tau=0.02, level=1.1), -6)

    # The founding meter filling: ticks rising in pitch.
    meter = np.zeros(int(1.2 * SR))
    for k in range(12):
        place(meter, click(0.03, 1400 + k * 120, body=900 + k * 90, level=0.6 + 0.03 * k), k * 0.075)
    write("meter", meter, -8)

    # End card: a low, soft thump, then light glinting across the metal.
    end = np.zeros(int(2.0 * SR))
    place(end, 0.9 * tone(70, 0.9, 0.35, attack=0.002, glide_to=45), 0)
    sparkle = np.zeros(int(1.6 * SR))
    for _ in range(26):
        f = 3000 + 3500 * rng.random()
        place(sparkle, 0.12 * tone(f, 0.4, 0.12, attack=0.003), 0.1 + 1.2 * rng.random())
    shimmer = sweep_bp(noise(1.6), 5000, 9000, 1.2) * np.sin(np.pi * np.clip(t(1.6) / 1.6, 0, 1)) * 0.35
    place(end, sparkle + shimmer, 0.12)
    write("end", end, -4)


if __name__ == "__main__":
    main()
