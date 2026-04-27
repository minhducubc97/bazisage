/**
 * True Solar Time (真太陽時) correction.
 *
 * Standard time (e.g. UTC+8 for China) is based on a reference meridian.
 * True Solar Time adjusts for the actual longitude of the birth location,
 * since the sun crosses different meridians at different clock times.
 *
 * This is what separates professional Bazi from amateur apps.
 *
 * Correction = (longitude - standardMeridian) × 4 minutes per degree
 *
 * We also apply the Equation of Time (EoT) for maximum accuracy,
 * though many classical practitioners use only the longitude correction.
 */

/** Standard meridians for common time zones (degrees East) */
export const STANDARD_MERIDIANS: Record<string, number> = {
  "UTC-11": -165, "UTC-10": -150, "UTC-9":  -135,
  "UTC-8":  -120, "UTC-7":  -105, "UTC-6":   -90,
  "UTC-5":   -75, "UTC-4":   -60, "UTC-3":   -45,
  "UTC-2":   -30, "UTC-1":   -15, "UTC+0":     0,
  "UTC+1":    15, "UTC+2":    30, "UTC+3":    45,
  "UTC+4":    60, "UTC+5":    75, "UTC+5:30":82.5,
  "UTC+6":    90, "UTC+7":   105, "UTC+8":   120,
  "UTC+9":   135, "UTC+10":  150, "UTC+11":  165,
  "UTC+12":  180,
};

/**
 * Calculate the longitude correction component of True Solar Time.
 *
 * @param longitude - Birth location longitude in decimal degrees (East = positive)
 * @param utcOffsetMinutes - UTC offset of the standard time zone in minutes
 *   e.g. UTC+7 = 420, UTC-5 = -300
 * @returns Offset in minutes to add to local clock time
 */
export function longitudeCorrection(
  longitude: number,
  utcOffsetMinutes: number
): number {
  const standardMeridian = utcOffsetMinutes / 4; // degrees
  return (longitude - standardMeridian) * 4;     // minutes
}

/**
 * Equation of Time (EoT) approximation in minutes.
 * Accounts for Earth's elliptical orbit and axial tilt.
 *
 * Uses the Spencer (1971) Fourier series approximation.
 *
 * @param dayOfYear - Day of year (1-365/366)
 * @returns EoT correction in minutes (positive = sun is ahead of clock sun)
 */
export function equationOfTime(dayOfYear: number): number {
  const B = (2 * Math.PI * (dayOfYear - 1)) / 365;
  const EoT =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(B) -
      0.032077 * Math.sin(B) -
      0.014615 * Math.cos(2 * B) -
      0.04089  * Math.sin(2 * B));
  return EoT;
}

/**
 * Compute the full True Solar Time offset in minutes.
 *
 * @param longitude - Decimal degrees East (positive) / West (negative)
 * @param utcOffsetMinutes - Timezone UTC offset in minutes (e.g., UTC+7 → 420)
 * @param dayOfYear - Day of year (1-366) for Equation of Time
 * @param applyEoT - Whether to include the Equation of Time correction
 * @returns Total correction in minutes to add to local standard time
 */
export function trueSolarTimeOffset(
  longitude: number,
  utcOffsetMinutes: number,
  dayOfYear: number,
  applyEoT = true
): number {
  const longCorrection = longitudeCorrection(longitude, utcOffsetMinutes);
  const eot = applyEoT ? equationOfTime(dayOfYear) : 0;
  return longCorrection + eot;
}

/**
 * Given a birth datetime (as UTC timestamp in ms) and birth longitude,
 * returns a new Date representing the True Solar Time.
 *
 * @param birthUtcMs - Birth datetime in UTC milliseconds
 * @param longitude - Birth longitude in decimal degrees
 * @param utcOffsetMinutes - Standard timezone UTC offset in minutes
 * @param applyEoT - Whether to apply Equation of Time (default: true)
 */
export function applyTrueSolarTime(
  birthUtcMs: number,
  longitude: number,
  utcOffsetMinutes: number,
  applyEoT = true
): { trueSolarDateMs: number; offsetMinutes: number } {
  const date = new Date(birthUtcMs);
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diffMs = birthUtcMs - startOfYear.getTime();
  const dayOfYear = Math.floor(diffMs / 86_400_000);

  const offsetMinutes = trueSolarTimeOffset(
    longitude,
    utcOffsetMinutes,
    dayOfYear,
    applyEoT
  );

  return {
    trueSolarDateMs: birthUtcMs + offsetMinutes * 60_000,
    offsetMinutes,
  };
}

/**
 * Detect UTC offset from timezone string (e.g. "Asia/Ho_Chi_Minh" → 420).
 * Falls back to 0 if timezone is not recognized.
 * For production, use a proper timezone library (luxon / dayjs-timezone).
 *
 * @param isoDatetime - ISO datetime string (e.g. "1990-05-15T11:30:00")
 * @param timezone - IANA timezone string (e.g. "Asia/Ho_Chi_Minh")
 */
export function utcOffsetFromTimezone(
  isoDatetime: string,
  timezone: string
): number {
  try {
    // Use Intl API to find the offset
    const date = new Date(isoDatetime + "Z"); // treat as UTC base
    const localStr = date.toLocaleString("en-US", { timeZone: timezone, timeZoneName: "short" });
    // Parse "GMT+7" or similar from the string
    const match = localStr.match(/GMT([+-]\d+(?::\d+)?)/);
    if (match) {
      const parts = match[1].split(":").map(Number);
      const hours = parts[0] ?? 0;
      const mins = parts[1] ?? 0;
      return hours * 60 + (hours < 0 ? -mins : mins);
    }
  } catch {
    // ignore
  }
  return 0;
}
