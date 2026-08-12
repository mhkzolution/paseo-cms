/**
 * @deprecated Runtime tracking is gated by category consent helpers
 * (`canLoadAnalytics` / `canLoadMarketing`). Do not use for script injection.
 */
export function canLoadTracking(): boolean {
  return true;
}
