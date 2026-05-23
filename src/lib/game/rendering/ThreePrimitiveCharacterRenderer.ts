import * as THREE from 'three'
import type { GameRenderState, PlayerRenderState } from './GameRenderState'
import type { CharacterAnimationState } from './CharacterAnimationState'
import { deriveAnimState } from './CharacterAnimationState'
import { buildXannyPrimitive }     from './three/builders/buildXannyPrimitive'
import { buildCommanderPrimitive } from './three/builders/buildCommanderPrimitive'
import { buildBJPrimitive }        from './three/builders/buildBJPrimitive'
import { buildBraePrimitive }      from './three/builders/buildBraePrimitive'
import { buildZayaPrimitive }      from './three/builders/buildZayaPrimitive'
import { buildGovernorPrimitive }  from './three/builders/buildGovernorPrimitive'

// Shared geometry builder by character ID
const BUILDERS: Record<string, () => { group: THREE.Group; rig: Rig }> = {
  xanny:     buildXannyPrimitive,
  commander: buildCommanderPrimitive,
  bj:        buildBJPrimitive,
  brae:      buildBraePrimitive,
  zaya:      buildZayaPrimitive,
  governor:  buildGovernorPrimitive,
}

// Generic rig shape (all builders expose the same public fields)
interface Rig {
  root:      THREE.Group
  head:      THREE.Mesh
  torso:     THREE.Mesh
  lUpperArm: THREE.Group
  rUpperArm: THREE.Group
  lLeg:      THREE.Group
  rLeg:      THREE.Group
}

interface CharInstance {
  rig:       Rig
  group:     THREE.Group
  charId:    string
}

// ZOOM and CANVAS constants — must match GameCanvas
const ZOOM     = 1.5
const CANVAS_W = 960
const CANVAS_H = 540
const PHYS_HALF_H = 25   // physics body half-height

export class ThreePrimitiveCharacterRenderer {
  private scene:    THREE.Scene
  private camera:   THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private light:    THREE.DirectionalLight
  private instances = new Map<string, CharInstance>()  // keyed by 'p1' | 'p2'

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene()

    // Orthographic camera matches canvas pixel space 1:1
    const hw = CANVAS_W / 2, hh = CANVAS_H / 2
    this.camera = new THREE.OrthographicCamera(-hw, hw, hh, -hh, -2000, 2000)
    this.camera.position.set(0, 0, 500)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    this.renderer.setSize(CANVAS_W, CANVAS_H, false)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000, 0)   // transparent background

    // Lighting — ambient + directional for a clean 2.5D look
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    this.scene.add(ambient)
    this.light = new THREE.DirectionalLight(0xffffff, 0.9)
    this.light.position.set(1, 2, 3)
    this.scene.add(this.light)
  }

  private getOrCreateInstance(key: 'p1' | 'p2', characterId: string): CharInstance {
    const existing = this.instances.get(key)
    if (existing && existing.charId === characterId) return existing

    // Remove old instance if character changed
    if (existing) {
      this.scene.remove(existing.group)
    }

    const builder = BUILDERS[characterId]
    if (!builder) {
      // Fallback: invisible placeholder
      const fallback = new THREE.Group()
      const fakeRig: Rig = {
        root: fallback, head: new THREE.Mesh(), torso: new THREE.Mesh(),
        lUpperArm: new THREE.Group(), rUpperArm: new THREE.Group(),
        lLeg: new THREE.Group(), rLeg: new THREE.Group(),
      }
      const inst: CharInstance = { rig: fakeRig, group: fallback, charId: characterId }
      this.instances.set(key, inst)
      this.scene.add(fallback)
      return inst
    }

    const { group, rig } = builder()
    const inst: CharInstance = { rig: rig as Rig, group, charId: characterId }
    this.instances.set(key, inst)
    this.scene.add(group)
    return inst
  }

  update(state: GameRenderState): void {
    if (state.p1) this.updatePlayer('p1', state.p1, state)
    else this.hidePlayer('p1')

    if (state.p2) this.updatePlayer('p2', state.p2, state)
    else this.hidePlayer('p2')

    this.renderer.render(this.scene, this.camera)
  }

  private updatePlayer(key: 'p1' | 'p2', p: PlayerRenderState, state: GameRenderState): void {
    const inst = this.getOrCreateInstance(key, p.characterId)
    inst.group.visible = true

    const anim = deriveAnimState({
      vx: p.vx, vy: p.vy, grounded: p.grounded,
      facing: p.facing === 1 ? 'right' : 'left',
      anim: p.anim, landSquashT: p.landSquashT,
      now: state.timestamp,
      effectType: p.effectType, effectEndsAt: p.effectEndsAt,
    })

    // ── World → Three.js position ─────────────────────────────
    // footY = world y + PHYS_HALF_H  (bottom of physics box)
    // Three.js: x right, y up, z toward viewer
    const canvasX = p.x * ZOOM - state.camX
    const canvasY = (p.y + PHYS_HALF_H) * ZOOM - state.camY

    inst.group.position.set(
      canvasX - CANVAS_W / 2,
      -(canvasY - CANVAS_H / 2),
      key === 'p1' ? 1 : 0,   // P1 in front of P2
    )

    // ── Scale & facing ────────────────────────────────────────
    inst.group.scale.set(
      anim.facing * anim.scaleX,
      anim.scaleY,
      1,
    )

    // ── Body lean ─────────────────────────────────────────────
    inst.group.rotation.z = -anim.lean * anim.facing

    // ── Limb animation ────────────────────────────────────────
    this.animateLimbs(inst.rig, anim)
  }

  private animateLimbs(rig: Rig, anim: CharacterAnimationState): void {
    const { pose, runCycle, speed } = anim
    const swing = Math.sin(runCycle) * 0.5 * Math.min(speed / 6, 1)

    if (pose === 'run') {
      // Arms and legs swing opposite
      rig.lUpperArm.rotation.x =  swing
      rig.rUpperArm.rotation.x = -swing
      rig.lLeg.rotation.x      = -swing
      rig.rLeg.rotation.x      =  swing
      // Head bob
      rig.head.position.y = 50 + Math.abs(Math.sin(runCycle)) * 3
    } else if (pose === 'jump' || pose === 'fall') {
      // Tuck: arms up, legs forward
      rig.lUpperArm.rotation.x = pose === 'jump' ? -0.5 : 0.2
      rig.rUpperArm.rotation.x = pose === 'jump' ? -0.5 : 0.2
      rig.lLeg.rotation.x      = pose === 'jump' ?  0.4 : 0.1
      rig.rLeg.rotation.x      = pose === 'jump' ?  0.4 : 0.1
      rig.head.position.y      = 50
    } else if (pose === 'land') {
      // Squash arms out
      rig.lUpperArm.rotation.x = 0.4
      rig.rUpperArm.rotation.x = 0.4
      rig.lLeg.rotation.x      = 0
      rig.rLeg.rotation.x      = 0
      rig.head.position.y      = 50
    } else {
      // Idle — gentle bob
      const t = Date.now() * 0.002
      rig.lUpperArm.rotation.x = Math.sin(t) * 0.06
      rig.rUpperArm.rotation.x = Math.sin(t + Math.PI) * 0.06
      rig.lLeg.rotation.x      = 0
      rig.rLeg.rotation.x      = 0
      rig.head.position.y      = 50 + Math.sin(t * 1.3) * 1.5
    }
  }

  private hidePlayer(key: 'p1' | 'p2'): void {
    const inst = this.instances.get(key)
    if (inst) inst.group.visible = false
  }

  dispose(): void {
    this.instances.forEach(inst => {
      inst.group.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
    })
    this.renderer.dispose()
  }
}
