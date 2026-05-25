// Handles smooth crossfade between two audio elements
const FADE_DURATION_MS = 600

export class CrossfadeService {
  private fadeInterval: ReturnType<typeof setInterval> | null = null

  crossfade(
    from: HTMLAudioElement | null,
    to: HTMLAudioElement,
    targetVolume: number,
    durationMs = FADE_DURATION_MS,
  ): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval)
      this.fadeInterval = null
    }

    const steps    = 20
    const stepMs   = durationMs / steps
    const volStep  = targetVolume / steps

    to.volume = 0
    to.play().catch(() => {})

    let step = 0
    this.fadeInterval = setInterval(() => {
      step++
      to.volume = Math.min(targetVolume, step * volStep)
      if (from) from.volume = Math.max(0, (steps - step) * (from.volume / steps || 0.01))

      if (step >= steps) {
        clearInterval(this.fadeInterval!)
        this.fadeInterval = null
        if (from) { from.pause(); from.currentTime = 0 }
      }
    }, stepMs)
  }

  fadeOut(el: HTMLAudioElement, durationMs = FADE_DURATION_MS): void {
    if (this.fadeInterval) clearInterval(this.fadeInterval)
    const startVol = el.volume
    const steps    = 15
    const stepMs   = durationMs / steps
    let step       = 0

    this.fadeInterval = setInterval(() => {
      step++
      el.volume = Math.max(0, startVol * (1 - step / steps))
      if (step >= steps) {
        clearInterval(this.fadeInterval!)
        this.fadeInterval = null
        el.pause()
        el.currentTime = 0
        el.volume = startVol
      }
    }, stepMs)
  }

  stop(): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval)
      this.fadeInterval = null
    }
  }
}
