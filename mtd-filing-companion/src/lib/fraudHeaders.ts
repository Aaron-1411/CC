import { getDeviceId } from '@/lib/deviceId'

/**
 * Browser-sourced fraud-prevention data for HMRC's `WEB_APP_VIA_SERVER`
 * connection method. The client gathers RAW values only; the Cloudflare Pages
 * Function is the single place that percent-encodes and assembles the final
 * `Gov-Client-*` headers (so encoding rules live in exactly one implementation).
 *
 * Spec: https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/web-app-via-server/
 */
export interface ClientFraudData {
  /** Gov-Client-Device-ID — stable UUID v4 for this browser. */
  deviceId: string
  /** Gov-Client-Timezone — pre-formatted `UTC±HH:MM` (single-value header). */
  timezone: string
  /** Gov-Client-Screens — raw values; server joins as key=value block. */
  screens: {
    width: number
    height: number
    scalingFactor: number
    colourDepth: number
  }
  /** Gov-Client-Window-Size — raw values; server joins as key=value block. */
  windowSize: {
    width: number
    height: number
  }
  /** Gov-Client-Browser-JS-User-Agent — raw navigator.userAgent, sent verbatim. */
  browserJsUserAgent: string
}

/** Collects the browser-sourced fraud-prevention data. Call in the browser. */
export function collectClientFraudData(): ClientFraudData {
  return {
    deviceId: getDeviceId(),
    timezone: formatTimezone(),
    screens: {
      width: window.screen.width,
      height: window.screen.height,
      scalingFactor: window.devicePixelRatio || 1,
      colourDepth: window.screen.colorDepth,
    },
    windowSize: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    browserJsUserAgent: navigator.userAgent,
  }
}

/**
 * Formats the local timezone as HMRC's `UTC±HH:MM`.
 *
 * `Date.getTimezoneOffset()` returns minutes and is SIGN-INVERTED relative to
 * UTC notation (e.g. UTC+1 → -60). Getting this sign wrong is a documented
 * rejection cause, so the UTC offset is the negation of the JS offset.
 */
export function formatTimezone(date: Date = new Date()): string {
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `UTC${sign}${hh}:${mm}`
}
