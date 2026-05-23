import * as THREE from 'three'
import { CHARACTER_VISUAL_CONFIG } from '../../characterVisualConfig'

/**
 * Zaya — Gravity Dash
 * Gray sweatshirt, pink pants, blue bow, teal shoes, pink gravity phone.
 */
export interface ZayaRig {
  root:      THREE.Group
  head:      THREE.Mesh
  torso:     THREE.Mesh
  lUpperArm: THREE.Group
  rUpperArm: THREE.Group
  lLeg:      THREE.Group
  rLeg:      THREE.Group
  bow:       THREE.Group
}

function mat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color })
}

export function buildZayaPrimitive(): { group: THREE.Group; rig: ZayaRig } {
  const cfg  = CHARACTER_VISUAL_CONFIG.zaya.three
  const root = new THREE.Group()
  root.name  = 'zaya'

  // ── Shoes (teal) ──────────────────────────────────────────────
  const shoeGeo = new THREE.BoxGeometry(16, 8, 10)
  const lShoe   = new THREE.Mesh(shoeGeo, mat(cfg.shoeColor))
  const rShoe   = new THREE.Mesh(shoeGeo, mat(cfg.shoeColor))
  lShoe.position.set(-8, -74, 0)
  rShoe.position.set(8, -74, 0)
  root.add(lShoe, rShoe)

  // ── Legs (pink pants) ─────────────────────────────────────────
  function buildLeg(side: 1 | -1): THREE.Group {
    const grp   = new THREE.Group()
    grp.position.set(side * 8, -30, 0)
    const upper = new THREE.Mesh(new THREE.BoxGeometry(12, 36, 9), mat(cfg.pantsColor))
    upper.position.set(0, -18, 0)
    const lower = new THREE.Mesh(new THREE.BoxGeometry(10, 30, 8), mat(cfg.pantsColor))
    lower.position.set(0, -51, 0)
    grp.add(upper, lower)
    return grp
  }

  const lLeg = buildLeg(-1)
  const rLeg = buildLeg(1)
  root.add(lLeg, rLeg)

  // ── Torso (gray sweatshirt) ───────────────────────────────────
  const torso = new THREE.Mesh(new THREE.BoxGeometry(38, 50, 12), mat(cfg.shirtColor))
  torso.position.set(0, 0, 0)
  root.add(torso)

  // Gravity dash phone on belt
  const phoneGrp   = new THREE.Group()
  const phoneBody  = new THREE.Mesh(new THREE.BoxGeometry(9, 14, 3), mat(0xec4899))
  const phoneGlow  = new THREE.Mesh(new THREE.BoxGeometry(7, 11, 1), new THREE.MeshLambertMaterial({ color: 0xfbb6d4, emissive: 0xec4899, emissiveIntensity: 0.6 }))
  phoneGlow.position.set(0, 0, 2)
  phoneGrp.add(phoneBody, phoneGlow)
  phoneGrp.position.set(-28, -10, 0)
  root.add(phoneGrp)

  // ── Arms ──────────────────────────────────────────────────────
  function buildArm(side: 1 | -1): THREE.Group {
    const shoulder  = new THREE.Group()
    shoulder.position.set(side * 22, 15, 0)
    const upper     = new THREE.Mesh(new THREE.CylinderGeometry(6, 5.5, 30, 6), mat(cfg.shirtColor))
    upper.position.set(0, -15, 0)
    const lower     = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4, 26, 6), mat(cfg.skinColor))
    lower.position.set(0, -42, 0)
    shoulder.add(upper, lower)
    return shoulder
  }

  const lUpperArm = buildArm(-1)
  const rUpperArm = buildArm(1)
  root.add(lUpperArm, rUpperArm)

  // ── Neck ──────────────────────────────────────────────────────
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 10, 6), mat(cfg.skinColor))
  neck.position.set(0, 28, 0)
  root.add(neck)

  // ── Head ──────────────────────────────────────────────────────
  const head = new THREE.Mesh(new THREE.SphereGeometry(17, 10, 8), mat(cfg.skinColor))
  head.position.set(0, 49, 0)
  root.add(head)

  // Hair (black, pulled back)
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(18, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(0x1a1a1a))
  hairBack.position.set(0, 53, -3)
  root.add(hairBack)

  // Blue bow
  const bow = new THREE.Group()
  const leftWing  = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 3), mat(0x3b82f6))
  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 3), mat(0x3b82f6))
  const bowCenter = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 6), mat(0x2563eb))
  leftWing.position.set(-7, 0, 0)
  rightWing.position.set(7, 0, 0)
  bow.add(leftWing, rightWing, bowCenter)
  bow.position.set(14, 60, 2)
  root.add(bow)

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(3, 6, 6)
  const lEye   = new THREE.Mesh(eyeGeo, mat(0xffffff))
  const rEye   = new THREE.Mesh(eyeGeo, mat(0xffffff))
  lEye.position.set(-6, 51, 15)
  rEye.position.set(6, 51, 15)
  root.add(lEye, rEye)

  const rig: ZayaRig = { root, head, torso, lUpperArm, rUpperArm, lLeg, rLeg, bow }
  return { group: root, rig }
}
