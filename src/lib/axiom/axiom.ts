import { Axiom } from '@axiomhq/js'

let client: Axiom | null = null

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
