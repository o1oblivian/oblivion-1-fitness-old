import Tesseract from 'tesseract.js';

/**
 * Dedicated Optical Character Recognition Telemetry Parser
 * Real-time extraction of digital watch (G-Shock, Apple Watch, Garmin, Casio, Fitbit)
 * and gym console (Treadmill, Bike, Rower, Elliptical) displays.
 */

export interface ParsedOcrTelemetry {
  deviceType: 'watch' | 'console';
  steps: number | null;
  elapsedDisplay: string;
  elapsedMinutes: number;
  distanceKm: number | null;
  caloriesBurned: number | null;
  speedKmh: number | null;
  inclinePct: number | null;
  avgHeartRateBpm: number | null;
  rawText: string;
}

export function isValidImageBuffer(buf: Buffer | Uint8Array): boolean {
  if (!buf || buf.length < 8) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // WebP: RIFF ... WEBP
  if (buf.length >= 12) {
    const isRiff = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
    const isWebp = buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
    if (isRiff && isWebp) return true;
  }
  // BMP: 42 4D
  if (buf[0] === 0x42 && buf[1] === 0x4d) return true;
  return false;
}

export async function recognizeTelemetryFromBuffer(buf: Buffer): Promise<ParsedOcrTelemetry | null> {
  if (!isValidImageBuffer(buf)) {
    return null;
  }
  try {
    const ocrResult = await Tesseract.recognize(buf, 'eng');
    if (ocrResult?.data?.text) {
      return parseTelemetryFromOcrText(ocrResult.data.text);
    }
  } catch (err) {
    console.warn('[Optical OCR] Recognition pass error:', err);
  }
  return null;
}

export function parseTelemetryFromOcrText(rawText: string): ParsedOcrTelemetry {
  if (!rawText || typeof rawText !== 'string') {
    return {
      deviceType: 'watch',
      steps: null,
      elapsedDisplay: '--',
      elapsedMinutes: 0,
      distanceKm: null,
      caloriesBurned: null,
      speedKmh: null,
      inclinePct: null,
      avgHeartRateBpm: null,
      rawText: '',
    };
  }

  // Normalize text: clean extra spaces, handle comma numbers (e.g. 6,157 -> 6157)
  const normalized = rawText
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/(\d),(\d)/g, '$1$2');

  // 1. Elapsed / Clock Time Detection
  // Matches patterns like "02:48", "31:00", "01:24:50", "15:30"
  let elapsedDisplay = '--';
  let elapsedMinutes = 0;
  const timeMatch = normalized.match(/\b([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?\b/);
  if (timeMatch) {
    const p1 = parseInt(timeMatch[1], 10);
    const p2 = parseInt(timeMatch[2], 10);
    const p3 = timeMatch[3] ? parseInt(timeMatch[3], 10) : null;

    if (p3 !== null) {
      // hh:mm:ss
      elapsedMinutes = Number((p1 * 60 + p2 + p3 / 60).toFixed(1));
      elapsedDisplay = `${p1}:${p2.toString().padStart(2, '0')}:${p3.toString().padStart(2, '0')}`;
    } else {
      // mm:ss or hh:mm
      elapsedMinutes = Number((p1 + p2 / 60).toFixed(1));
      elapsedDisplay = `${p1}:${p2.toString().padStart(2, '0')}`;
    }
  }

  // 2. Heart Rate (bpm)
  let avgHeartRateBpm: number | null = null;
  const hrRegexes = [
    /(?:hr|bpm|heart\s*rate|pulse)[\s:\-_=]*([0-9]{2,3})\b/i,
    /\b([0-9]{2,3})[\s]*(?:bpm|hr)\b/i,
  ];
  for (const rx of hrRegexes) {
    const m = normalized.match(rx);
    if (m && m[1]) {
      const hr = parseInt(m[1], 10);
      if (hr >= 45 && hr <= 220) {
        avgHeartRateBpm = hr;
        break;
      }
    }
  }

  // 3. Calories (kcal)
  let caloriesBurned: number | null = null;
  const calRegexes = [
    /(?:calories|calorie|kcal|cals?|cal)[\s:\-_=]*([0-9]{2,4})\b/i,
    /\b([0-9]{2,4})[\s]*(?:kcal|cals?|cal)\b/i,
  ];
  for (const rx of calRegexes) {
    const m = normalized.match(rx);
    if (m && m[1]) {
      const cal = parseInt(m[1], 10);
      if (cal >= 10 && cal <= 5000) {
        caloriesBurned = cal;
        break;
      }
    }
  }

  // 4. Distance (km / mi)
  let distanceKm: number | null = null;
  const distRegexes = [
    /(?:dist|distance)[\s:\-_=]*([0-9]+(?:\.[0-9]+)?)\b/i,
    /\b([0-9]+(?:\.[0-9]+)?)[\s]*(?:km|kilometers?)\b/i,
    /\b([0-9]+(?:\.[0-9]+)?)[\s]*(?:mi|miles?)\b/i,
  ];
  for (const rx of distRegexes) {
    const m = normalized.match(rx);
    if (m && m[1]) {
      const d = parseFloat(m[1]);
      if (d > 0 && d <= 100) {
        if (rx.source.includes('mi')) {
          distanceKm = Number((d * 1.60934).toFixed(2));
        } else {
          distanceKm = Number(d.toFixed(2));
        }
        break;
      }
    }
  }

  // 5. Speed (km/h or mph)
  let speedKmh: number | null = null;
  const speedMatch = normalized.match(/(?:speed|spd)[\s:\-_=]*([0-9]+(?:\.[0-9]+)?)/i) ||
                     normalized.match(/([0-9]+(?:\.[0-9]+)?)[\s]*(?:km\/h|kmh|mph)/i);
  if (speedMatch && speedMatch[1]) {
    const s = parseFloat(speedMatch[1]);
    if (s > 0 && s <= 45) {
      speedKmh = Number(s.toFixed(1));
    }
  }

  // 6. Incline (%)
  let inclinePct: number | null = null;
  const incMatch = normalized.match(/(?:incline|inc|grade)[\s:\-_=]*([0-9]+(?:\.[0-9]+)?)/i) ||
                   normalized.match(/([0-9]+(?:\.[0-9]+)?)[\s]*%/i);
  if (incMatch && incMatch[1]) {
    const inc = parseFloat(incMatch[1]);
    if (inc >= 0 && inc <= 30) {
      inclinePct = Number(inc.toFixed(1));
    }
  }

  // 7. Device classification
  const isLikelyConsole = /(?:treadmill|matrix|life\s*fitness|techno\s*gym|precor|nordic\s*track|concept\s*2|woodway|stairmaster|keiser|schwinn|incline|mph|km\/h)/i.test(normalized) ||
                          (speedKmh !== null) || (inclinePct !== null);
  const deviceType: 'watch' | 'console' = isLikelyConsole ? 'console' : 'watch';

  // 8. Steps Detection
  let detectedSteps: number | null = null;

  // 8a. Explicit step keyword (e.g., "STEPS: 6157", "6157 steps", "ST 6157", "SPD 6157")
  const explicitStepRegexes = [
    /(?:steps?|step\s*count|st|stp)[\s:\-_=]*([0-9]{3,6})\b/i,
    /\b([0-9]{3,6})[\s]*(?:steps?|st)\b/i,
    /(?:daily|today)[\s:\-_=]*([0-9]{3,6})\b/i,
  ];

  for (const rx of explicitStepRegexes) {
    const match = normalized.match(rx);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (val >= 100 && val <= 150000) {
        detectedSteps = val;
        break;
      }
    }
  }

  // 8b. If no explicit keyword and on a watch display, look for standalone 4-5 digit numbers
  if (!detectedSteps && deviceType === 'watch') {
    const allNumberMatches = [...normalized.matchAll(/\b([0-9]{3,6})\b/g)];
    const candidateNumbers: number[] = [];

    for (const m of allNumberMatches) {
      const num = parseInt(m[1], 10);
      // Skip if this number is already identified as calories or heart rate
      if (caloriesBurned !== null && num === caloriesBurned) continue;
      if (avgHeartRateBpm !== null && num === avgHeartRateBpm) continue;
      // Exclude years (2024-2030)
      if (num >= 2024 && num <= 2030) continue;
      // Step counts are typically in 500 - 99999 range
      if (num >= 500 && num <= 99999) {
        candidateNumbers.push(num);
      }
    }

    if (candidateNumbers.length > 0) {
      const fourOrFiveDigits = candidateNumbers.filter((n) => n >= 1000 && n <= 99999);
      detectedSteps = fourOrFiveDigits.length > 0 ? fourOrFiveDigits[0] : candidateNumbers[0];
    }
  }

  return {
    deviceType,
    steps: detectedSteps,
    elapsedDisplay,
    elapsedMinutes,
    distanceKm,
    caloriesBurned,
    speedKmh,
    inclinePct,
    avgHeartRateBpm,
    rawText: normalized.trim(),
  };
}
