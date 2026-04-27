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
 * Detect UTC offset (in minutes) for a given local datetime in an IANA timezone.
 *
 * Uses Intl.DateTimeFormat with `timeZoneName: "longOffset"` which returns
 * normalized strings like "GMT+07:00" / "GMT−05:00" for ALL IANA zones —
 * including ones that previously returned abbreviations like PST/EDT/JST
 * which the old regex silently dropped to 0.
 *
 * Throws on unknown timezone (instead of silently returning 0) so the caller
 * can surface the error to the user during onboarding rather than computing
 * a wrong chart.
 *
 * @param isoDatetime - ISO datetime string in the target tz, e.g. "1990-05-15T11:30:00"
 * @param timezone - IANA timezone string, e.g. "Asia/Ho_Chi_Minh"
 * @returns Offset in minutes (e.g. UTC+7 → 420, UTC-5 → -300)
 */
export function utcOffsetFromTimezone(
  isoDatetime: string,
  timezone: string
): number {
  // Treat the local datetime as if it were UTC, then ask Intl what offset
  // applies in `timezone` at that moment. This is correct for the purpose
  // of solar-time computation because we need the standard-offset that
  // applies to the wall-clock instant, including DST.
  const probe = new Date(isoDatetime + "Z");
  if (Number.isNaN(probe.getTime())) {
    throw new Error(`Invalid ISO datetime: ${isoDatetime}`);
  }

  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  });

  const parts = fmt.formatToParts(probe);
  const tzPart = parts.find(p => p.type === "timeZoneName")?.value;
  if (!tzPart) {
    throw new Error(`Could not resolve UTC offset for timezone: ${timezone}`);
  }

  // Normalize Unicode minus (U+2212) to ASCII hyphen.
  const normalized = tzPart.replace(/\u2212/g, "-");

  // Match "GMT+07:00", "GMT-5", "GMT+5:30", or bare "GMT"/"UTC" (= 0).
  const match = normalized.match(/^(?:GMT|UTC)([+-]\d{1,2})(?::(\d{2}))?$/);
  if (!match) {
    if (/^(?:GMT|UTC)$/.test(normalized)) return 0;
    throw new Error(`Unparseable timezone offset string: ${tzPart}`);
  }

  const hours = Number(match[1]);
  const mins = match[2] ? Number(match[2]) : 0;
  const sign = hours < 0 ? -1 : 1;
  return hours * 60 + sign * mins;
}
