import type { AdaptiveLayer } from './MusicTypes'

// Manages layer activation state for adaptive music
// (actual audio elements are owned by AudioEngine)
export class AdaptiveMusicService {
  private activeLayer: AdaptiveLayer = 'base'
  private listeners: Array<(layer: AdaptiveLayer) => void> = []

  getActiveLayer(): AdaptiveLayer { return this.activeLayer }

  setLayer(layer: AdaptiveLayer): void {
    if (this.activeLayer === layer) return
    this.activeLayer = layer
    this.listeners.forEach(fn => fn(layer))
  }

  onLayerChange(fn: (layer: AdaptiveLayer) => void): () => void {
    this.listeners.push(fn)
    return () => { this.listeners = this.listeners.filter(l => l !== fn) }
  }

  // Convenience triggers from gameplay events
  triggerSpeedBoost(): void  { this.setLayer('speed') }
  triggerBoss(): void        { this.setLayer('boss') }
  triggerDanger(): void      { this.setLayer('danger') }
  triggerVictory(): void     { this.setLayer('victory') }
  triggerNormal(): void      { this.setLayer('base') }
}

export const adaptiveMusicService = new AdaptiveMusicService()
