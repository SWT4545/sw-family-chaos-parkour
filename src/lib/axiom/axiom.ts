import { Axiom } from '@axiomhq/js'

let client: Axiom | null = null
let _sessionStart = Date.now()

function getClient(): Axiom | null {
  if (typeof window === 'undefined') return null
  const token = process.env.NEXT_PUBLIC_AXIOM_TOKEN
  if (!token) return null
  if (!client) client = new Axiom({ token })
  return client
}

export function trackEvent(event: string, data: Record<string, unknown> = {}): void {
  const c = getClient()
  if (!c) return
  const dataset = process.env.NEXT_PUBLIC_AXIOM_DATASET ?? 'swFamilyChaosParkour'
  try { c.ingest(dataset, [{ _time: new Date().toISOString(), event, ...data }]) } catch {}
}

// ── Typed event helpers ─────────────────────────────────────────────
export const Analytics = {
  sessionStart:       ()                           => trackEvent('session_start',        { ts: Date.now() }),
  sessionEnd:         ()                           => trackEvent('session_end',          { duration_s: Math.round((Date.now() - _sessionStart) / 1000) }),
  matchStarted:       (p: Record<string, unknown>) => trackEvent('match_started',        p),
  matchAbandoned:     (p: Record<string, unknown>) => trackEvent('match_abandon',        p),
  soloCompleted:      (p: Record<string, unknown>) => trackEvent('solo_completion',      p),
  roomCreated:        (code: string)               => trackEvent('room_created',         { code }),
  roomJoined:         (code: string)               => trackEvent('room_joined',          { code }),
  cosmeticEquipped:   (id: string)                 => trackEvent('cosmetic_equipped',    { id }),
  cosmeticPurchased:  (id: string, cost: number)   => trackEvent('cosmetic_purchased',   { id, cost }),
  musicChanged:       (track: string)              => trackEvent('music_changed',        { track }),
  settingsChanged:    (p: Record<string, unknown>) => trackEvent('settings_changed',     p),
}
