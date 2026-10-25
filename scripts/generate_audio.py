from pathlib import Path
import shutil
import struct
import subprocess
import wave

import numpy as np

SAMPLE_RATE = 22050
ATTRIBUTION = "诗意江山程序化生成"
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "audio"


def convert_to_m4a(wav_path):
    # 站点引用的是 .m4a（aac），生成 WAV 后需转码；优先 afconvert（macOS 自带），其次 ffmpeg
    m4a_path = wav_path.with_suffix(".m4a")
    if shutil.which("afconvert"):
        subprocess.run(
            ["afconvert", "-f", "m4af", "-d", "aac", "-s", "3", str(wav_path), str(m4a_path)],
            check=True,
        )
    elif shutil.which("ffmpeg"):
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(wav_path), "-c:a", "aac", "-b:a", "128k", str(m4a_path)],
            check=True,
        )
    else:
        print(f"警告：未找到 afconvert 或 ffmpeg，{wav_path.name} 未转码为 .m4a")
        return False
    wav_path.unlink()
    return True


def midi_frequency(note):
    return 440.0 * 2.0 ** ((note - 69) / 12.0)


def add_circular(track, sound, start_seconds, sample_rate):
    start = int(round(start_seconds * sample_rate)) % len(track)
    end = start + len(sound)
    if end <= len(track):
        track[start:end] += sound
    else:
        first = len(track) - start
        track[start:] += sound[:first]
        track[: end - len(track)] += sound[first:]


def note_envelope(length, sample_rate, attack, release):
    envelope = np.ones(length)
    attack_length = min(length, int(attack * sample_rate))
    release_length = min(length, int(release * sample_rate))
    if attack_length > 1:
        envelope[:attack_length] = np.sin(
            np.linspace(0.0, np.pi / 2.0, attack_length)
        ) ** 2
    if release_length > 1:
        envelope[-release_length:] *= np.cos(
            np.linspace(0.0, np.pi / 2.0, release_length)
        ) ** 2
    return envelope


def pluck(note, duration, sample_rate, rng):
    frequency = midi_frequency(note)
    length = int(round(duration * sample_rate))
    period = max(2, int(round(sample_rate / frequency)))
    line = rng.uniform(-1.0, 1.0, period)
    for _ in range(3 if frequency < 500.0 else 2):
        line = (line + np.roll(line, 1) + np.roll(line, -1)) / 3.0
    line /= np.max(np.abs(line)) + 1e-12

    output = np.empty(length)
    damping = np.exp(-(1.0 + frequency / 900.0) / frequency)
    index = 0
    for i in range(length):
        current = line[index]
        output[i] = current
        following = line[(index + 1) % period]
        line[index] = damping * 0.5 * (current + following)
        index = (index + 1) % period

    output /= np.max(np.abs(output)) + 1e-12
    t = np.arange(length) / sample_rate
    body = 0.055 * np.sin(2.0 * np.pi * frequency * t) * np.exp(-2.2 * t)
    envelope = note_envelope(length, sample_rate, 0.008, min(0.85, duration * 0.3))
    return (output + body) * envelope


def harmonic(note, duration, sample_rate, rng):
    frequency = midi_frequency(note)
    length = int(round(duration * sample_rate))
    t = np.arange(length) / sample_rate
    phase_offset = rng.uniform(0.0, 2.0 * np.pi)
    phase = 2.0 * np.pi * frequency * t
    tone = (
        np.sin(phase + phase_offset)
        + 0.16 * np.sin(2.0 * phase + 0.3)
        + 0.035 * np.sin(3.0 * phase + 0.7)
    )
    tone *= np.exp(-(1.1 + frequency / 1400.0) * t)
    envelope = note_envelope(length, sample_rate, 0.025, min(1.0, duration * 0.3))
    return tone * envelope * 0.7


def colored_noise(length, sample_rate, rng, low, high):
    source = rng.standard_normal(length)
    spectrum = np.fft.rfft(source)
    frequencies = np.fft.rfftfreq(length, 1.0 / sample_rate)
    low_shape = 1.0 - np.exp(-((frequencies / max(low, 1.0)) ** 4))
    high_shape = np.exp(-((frequencies / high) ** 4))
    spectrum *= low_shape * high_shape
    noise = np.fft.irfft(spectrum, n=length)
    noise /= np.std(noise) + 1e-12
    return noise


def xiao(note, duration, sample_rate, rng):
    frequency = midi_frequency(note)
    length = int(round(duration * sample_rate))
    t = np.arange(length) / sample_rate
    vibrato_rate = rng.uniform(4.1, 5.2)
    vibrato_phase = rng.uniform(0.0, 2.0 * np.pi)
    vibrato = (
        0.045
        * np.sin(2.0 * np.pi * vibrato_rate * t + vibrato_phase)
        * (1.0 - np.exp(-t / 1.1))
    )
    phase = 2.0 * np.pi * frequency * t + vibrato
    tone = (
        np.sin(phase)
        + 0.17 * np.sin(2.0 * phase + 0.15)
        + 0.065 * np.sin(3.0 * phase + 0.45)
        + 0.02 * np.sin(4.0 * phase + 0.8)
    ) / 1.2
    breath = colored_noise(
        length,
        sample_rate,
        rng,
        max(80.0, frequency * 0.65),
        min(4800.0, frequency * 5.0),
    )
    envelope = note_envelope(
        length,
        sample_rate,
        min(0.65, duration * 0.18),
        min(1.35, duration * 0.28),
    )
    envelope *= 1.0 + 0.035 * np.sin(2.0 * np.pi * 0.55 * t + vibrato_phase)
    return (tone + 0.026 * breath) * envelope * 0.72


def droplet(frequency, duration, sample_rate):
    length = int(round(duration * sample_rate))
    t = np.arange(length) / sample_rate
    phase = 2.0 * np.pi * frequency * t + 0.7 * np.exp(-28.0 * t)
    tone = np.sin(phase) + 0.1 * np.sin(2.0 * phase + 0.2)
    envelope = note_envelope(length, sample_rate, 0.006, min(0.08, duration * 0.4))
    return tone * np.exp(-18.0 * t) * envelope


def ambient_bed(kind, duration, sample_rate, rng):
    length = int(round(duration * sample_rate))
    t = np.arange(length) / sample_rate
    phase = rng.uniform(0.0, 2.0 * np.pi)
    modulation = (
        0.76
        + 0.15 * np.sin(2.0 * np.pi * 3.0 * t / duration + phase)
        + 0.09 * np.sin(2.0 * np.pi * 7.0 * t / duration + phase * 0.7)
    )

    if kind == "moon":
        bed = 0.0060 * colored_noise(length, sample_rate, rng, 120.0, 2600.0)
        bed += 0.0025 * colored_noise(length, sample_rate, rng, 45.0, 420.0)
    elif kind == "rain":
        bed = 0.0080 * colored_noise(length, sample_rate, rng, 180.0, 4300.0)
        bed += 0.0030 * colored_noise(length, sample_rate, rng, 60.0, 900.0)
    elif kind == "river":
        bed = 0.0100 * colored_noise(length, sample_rate, rng, 35.0, 900.0)
        bed += 0.0025 * colored_noise(length, sample_rate, rng, 100.0, 2200.0)
        modulation = (
            0.68
            + 0.22 * np.sin(2.0 * np.pi * 5.0 * t / duration + phase)
            + 0.10 * np.sin(2.0 * np.pi * 11.0 * t / duration + phase * 1.3)
        )
    else:
        bed = 0.0070 * colored_noise(length, sample_rate, rng, 250.0, 4800.0)
        bed += 0.0025 * colored_noise(length, sample_rate, rng, 80.0, 1200.0)
        modulation = (
            0.70
            + 0.20 * np.sin(2.0 * np.pi * 4.0 * t / duration + phase)
            + 0.10 * np.sin(2.0 * np.pi * 9.0 * t / duration + phase * 0.6)
        )

    bed *= modulation
    if kind == "rain":
        for _ in range(int(duration * 2.3)):
            sound = droplet(
                rng.uniform(420.0, 1250.0), rng.uniform(0.09, 0.24), sample_rate
            )
            add_circular(
                bed,
                sound * rng.uniform(0.002, 0.006),
                rng.uniform(0.0, duration),
                sample_rate,
            )
    elif kind == "river":
        for _ in range(int(duration * 0.4)):
            sound = droplet(
                rng.uniform(170.0, 390.0), rng.uniform(0.16, 0.32), sample_rate
            )
            add_circular(
                bed,
                sound * rng.uniform(0.0015, 0.0035),
                rng.uniform(0.0, duration),
                sample_rate,
            )
    return bed


def add_note(track, sample_rate, rng, start, note, duration, amplitude, instrument="pluck"):
    if instrument == "xiao":
        sound = xiao(note, duration, sample_rate, rng)
    elif instrument == "harmonic":
        sound = harmonic(note, duration, sample_rate, rng)
    else:
        sound = pluck(note, duration, sample_rate, rng)
    add_circular(track, sound * amplitude, start, sample_rate)


def add_phrase(
    track,
    sample_rate,
    rng,
    start,
    scale,
    motif,
    spacing,
    duration_range,
    amplitude_range,
    harmonic_chance=0.0,
):
    cursor = start
    for degree in motif:
        duration = rng.uniform(*duration_range)
        amplitude = rng.uniform(*amplitude_range)
        instrument = "harmonic" if rng.random() < harmonic_chance else "pluck"
        add_note(
            track,
            sample_rate,
            rng,
            cursor + rng.uniform(-0.09, 0.09),
            scale[degree],
            duration,
            amplitude,
            instrument,
        )
        cursor += spacing * rng.uniform(0.82, 1.22)


def circular_reverb(track, sample_rate, rng, seconds, wet_mix):
    length = len(track)
    tail_length = int(seconds * sample_rate)
    t = np.arange(tail_length) / sample_rate
    diffuse = colored_noise(tail_length, sample_rate, rng, 70.0, 4600.0)
    diffuse *= np.exp(-t / (seconds * 0.29))
    diffuse *= 1.0 - np.exp(-t / 0.025)
    diffuse *= 0.018
    for delay, gain in ((0.071, 0.3), (0.127, 0.23), (0.193, 0.17), (0.293, 0.12)):
        index = int(delay * sample_rate)
        if index < tail_length:
            diffuse[index] += gain

    impulse = np.zeros(length)
    impulse[:tail_length] = diffuse
    wet = np.fft.irfft(
        np.fft.rfft(track) * np.fft.rfft(impulse),
        n=length,
    )
    dry_rms = np.sqrt(np.mean(track**2))
    wet_rms = np.sqrt(np.mean(wet**2))
    if wet_rms > 1e-12:
        wet *= dry_rms / wet_rms
    return track * (1.0 - wet_mix) + wet * wet_mix


def master(track, sample_rate, rng, reverb_seconds, wet_mix, cutoff, peak):
    track = circular_reverb(track, sample_rate, rng, reverb_seconds, wet_mix)
    spectrum = np.fft.rfft(track)
    frequencies = np.fft.rfftfreq(len(track), 1.0 / sample_rate)
    spectrum *= 1.0 / np.sqrt(1.0 + (frequencies / cutoff) ** 8)
    track = np.fft.irfft(spectrum, n=len(track))
    track -= np.mean(track)
    track *= peak / (np.max(np.abs(track)) + 1e-12)
    return track


def moonlight(duration, sample_rate, rng):
    track = ambient_bed("moon", duration, sample_rate, rng)
    events = (
        (0.4, 50, 4.8, 0.25, "pluck"),
        (2.8, 74, 4.2, 0.17, "harmonic"),
        (5.4, 69, 3.8, 0.14, "pluck"),
        (8.9, 66, 4.4, 0.15, "pluck"),
        (12.2, 45, 5.2, 0.23, "pluck"),
        (14.5, 71, 4.0, 0.14, "harmonic"),
        (18.1, 76, 4.5, 0.12, "harmonic"),
        (21.4, 62, 4.4, 0.16, "pluck"),
        (25.8, 38, 5.8, 0.24, "pluck"),
        (28.0, 69, 4.0, 0.13, "pluck"),
        (31.7, 78, 4.7, 0.11, "harmonic"),
        (34.2, 64, 4.1, 0.15, "pluck"),
        (38.9, 57, 5.0, 0.20, "pluck"),
        (41.3, 74, 4.2, 0.14, "harmonic"),
        (44.7, 71, 3.7, 0.13, "pluck"),
        (47.6, 66, 4.5, 0.14, "pluck"),
        (50.6, 45, 5.3, 0.21, "pluck"),
        (54.3, 62, 4.6, 0.19, "pluck"),
    )
    for start, note, note_duration, amplitude, instrument in events:
        add_note(
            track,
            sample_rate,
            rng,
            start + rng.uniform(-0.12, 0.12),
            note,
            note_duration,
            amplitude * rng.uniform(0.91, 1.08),
            instrument,
        )
    for start, note, note_duration, amplitude in (
        (7.1, 62, 6.2, 0.105),
        (20.0, 69, 6.8, 0.09),
        (35.2, 64, 7.0, 0.095),
        (50.0, 57, 8.2, 0.10),
    ):
        add_note(track, sample_rate, rng, start, note, note_duration, amplitude, "xiao")
    return master(track, sample_rate, rng, 3.4, 0.22, 5400.0, 0.55)


def mountain_rain(duration, sample_rate, rng):
    track = ambient_bed("rain", duration, sample_rate, rng)
    scale = (55, 57, 59, 62, 64, 67, 69, 71, 74)
    motifs = (
        (0, 2, 3, 2, 1),
        (1, 3, 4, 5, 3),
        (2, 4, 6, 5, 3, 2),
        (4, 3, 1, 0, 2),
        (0, 1, 3, 5, 4, 2),
    )
    starts = (0.7, 7.5, 14.8, 22.6, 30.2, 37.8, 45.4, 51.7)
    for index, start in enumerate(starts):
        add_phrase(
            track,
            sample_rate,
            rng,
            start,
            scale,
            motifs[index % len(motifs)] if index < 2 else motifs[rng.integers(len(motifs))],
            rng.uniform(0.72, 1.02),
            (3.0, 4.7),
            (0.10, 0.16),
        )
        add_note(
            track,
            sample_rate,
            rng,
            start - 0.25,
            (43, 47, 50, 43)[index % 4],
            rng.uniform(4.5, 5.8),
            rng.uniform(0.14, 0.19),
        )
    for start, note, note_duration, amplitude in (
        (4.0, 62, 7.0, 0.09),
        (18.2, 64, 7.5, 0.095),
        (33.0, 59, 8.0, 0.10),
        (47.2, 62, 9.0, 0.09),
    ):
        add_note(track, sample_rate, rng, start, note, note_duration, amplitude, "xiao")
    add_note(track, sample_rate, rng, 56.5, 55, 4.5, 0.16)
    return master(track, sample_rate, rng, 3.0, 0.20, 4800.0, 0.57)


def river_night(duration, sample_rate, rng):
    track = ambient_bed("river", duration, sample_rate, rng)
    events = (
        (0.5, 33, 6.0, 0.26, "pluck"),
        (4.3, 45, 5.5, 0.21, "pluck"),
        (8.9, 52, 5.0, 0.15, "pluck"),
        (13.2, 48, 5.4, 0.17, "pluck"),
        (17.8, 55, 5.2, 0.15, "pluck"),
        (21.1, 40, 6.1, 0.24, "pluck"),
        (25.7, 57, 5.0, 0.16, "pluck"),
        (29.6, 60, 4.8, 0.12, "harmonic"),
        (33.8, 50, 5.8, 0.18, "pluck"),
        (37.1, 45, 6.0, 0.22, "pluck"),
        (41.9, 52, 5.2, 0.15, "pluck"),
        (45.4, 62, 4.8, 0.12, "harmonic"),
        (48.8, 48, 5.7, 0.17, "pluck"),
        (52.2, 45, 5.8, 0.20, "pluck"),
        (55.0, 52, 5.0, 0.14, "pluck"),
        (58.1, 40, 5.5, 0.22, "pluck"),
    )
    for start, note, note_duration, amplitude, instrument in events:
        add_note(
            track,
            sample_rate,
            rng,
            start + rng.uniform(-0.18, 0.18),
            note,
            note_duration,
            amplitude * rng.uniform(0.9, 1.07),
            instrument,
        )
    for start, note, note_duration, amplitude in (
        (6.8, 52, 8.4, 0.085),
        (23.0, 55, 9.0, 0.08),
        (39.4, 50, 9.2, 0.085),
        (53.0, 45, 10.0, 0.075),
    ):
        add_note(track, sample_rate, rng, start, note, note_duration, amplitude, "xiao")
    return master(track, sample_rate, rng, 3.8, 0.24, 3400.0, 0.55)


def wind_and_blossom(duration, sample_rate, rng):
    track = ambient_bed("wind", duration, sample_rate, rng)
    scale = (60, 62, 64, 67, 69, 72, 74, 76, 79)
    motifs = (
        (0, 2, 4, 5, 4, 2),
        (3, 5, 6, 5, 3, 1),
        (2, 4, 7, 5, 4, 1),
        (1, 3, 4, 6, 5, 2),
        (4, 5, 7, 6, 4, 2, 0),
    )
    starts = (0.4, 6.0, 12.7, 19.2, 25.8, 32.8, 39.3, 45.7, 50.4)
    for index, start in enumerate(starts):
        add_phrase(
            track,
            sample_rate,
            rng,
            start,
            scale,
            motifs[rng.integers(len(motifs))],
            rng.uniform(0.52, 0.78),
            (2.1, 3.4),
            (0.075, 0.125),
            harmonic_chance=0.22,
        )
        if index % 2 == 0:
            add_note(
                track,
                sample_rate,
                rng,
                start - 0.18,
                (48, 55, 52, 48)[(index // 2) % 4],
                rng.uniform(3.8, 4.8),
                rng.uniform(0.10, 0.14),
            )
    for start, note, note_duration, amplitude in (
        (3.4, 67, 5.2, 0.072),
        (16.0, 76, 5.8, 0.06),
        (29.7, 69, 6.2, 0.068),
        (42.5, 67, 6.4, 0.07),
        (50.1, 72, 5.6, 0.065),
    ):
        add_note(track, sample_rate, rng, start, note, note_duration, amplitude, "xiao")
    add_note(track, sample_rate, rng, 52.5, 60, 3.8, 0.12)
    return master(track, sample_rate, rng, 2.6, 0.18, 5800.0, 0.54)


def info_subchunk(identifier, data):
    padding = b"\x00" if len(data) % 2 else b""
    return identifier + struct.pack("<I", len(data)) + data + padding


def write_pcm16(path, samples, sample_rate, rng):
    dither = (rng.random(len(samples)) - rng.random(len(samples))) / 32768.0
    pcm = np.round(np.clip(samples + dither, -1.0, 1.0) * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate)
        output.writeframes(pcm.tobytes())

    comment = ATTRIBUTION.encode("utf-8") + b"\x00"
    info = b"INFO" + info_subchunk(b"ICMT", comment)
    list_chunk = b"LIST" + struct.pack("<I", len(info)) + info
    if len(info) % 2:
        list_chunk += b"\x00"
    with path.open("r+b") as output:
        output.seek(0, 2)
        output.write(list_chunk)
        file_size = output.tell()
        output.seek(4)
        output.write(struct.pack("<I", file_size - 8))


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pieces = (
        ("moonlight.m4a", 56.0, 20250301, moonlight),
        ("mountain-rain.m4a", 58.0, 20250302, mountain_rain),
        ("river-night.m4a", 60.0, 20250303, river_night),
        ("wind-and-blossom.m4a", 54.0, 20250304, wind_and_blossom),
    )
    total_duration = 0.0
    total_bytes = 0
    for filename, duration, seed, builder in pieces:
        rng = np.random.default_rng(seed)
        samples = builder(duration, SAMPLE_RATE, rng)
        path = OUTPUT_DIR / filename
        wav_path = path.with_suffix(".wav")
        write_pcm16(wav_path, samples, SAMPLE_RATE, rng)
        convert_to_m4a(wav_path)
        size = path.stat().st_size
        total_duration += len(samples) / SAMPLE_RATE
        total_bytes += size
        print(
            f"{filename}: {len(samples) / SAMPLE_RATE:.2f} s, "
            f"{size / (1024 * 1024):.2f} MiB, mono {SAMPLE_RATE} Hz PCM16, "
            f"peak {np.max(np.abs(samples)):.3f}"
        )
    print(
        f"Total: {total_duration:.2f} s, {total_bytes / (1024 * 1024):.2f} MiB; "
        f"{ATTRIBUTION}"
    )


if __name__ == "__main__":
    main()
