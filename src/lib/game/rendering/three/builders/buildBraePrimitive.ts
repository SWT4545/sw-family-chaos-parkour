import * as THREE from 'three'
import { CHARACTER_VISUAL_CONFIG } from '../../characterVisualConfig'

/**
 * Brae — Trickster
 * Black hoodie, purple phone prop, purple shoes, trickster purple glow.
 */
export interface BraeRig {
  root:      THREE.Group
  head:      THREE.Mesh
  torso:     THREE.Mesh
  lUpperArm: THREE.Group
  rUpperArm: THREE.Group
  lLeg:      THREE.Group
  rLeg:      THREE.Group
  phone:     THREE.Group
}

function mat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color })
}

export function buildBraePrimitive(): { group: THREE.Group; rig: BraeRig } {
  const cfg  = CHARACTER_VISUAL_CONFIG.brae.three
  const root = new THREE.Group()
  root.name  = 'brae'

  // ── Shoes (purple) ────────────────────────────────────────────
  const shoeGeo = new THREE.BoxGeometry(17, 8, 10)
  const lShoe   = new THREE.Mesh(shoeGeo, mat(cfg.shoeColor))
  const rShoe   = new THREE.Mesh(shoeGeo, mat(cfg.shoeColor))
  lShoe.position.set(-9, -77, 0)
  rShoe.position.set(9, -77, 0)
  root.add(lShoe, rShoe)

  // ── Legs ──────────────────────────────────────────────────────
  function buildLeg(side: 1 | -1): THREE.Group {
    const grp   = new THREE.Group()
    grp.position.set(side * 9, -32, 0)
    const upper = new THREE.Mesh(new THREE.BoxGeometry(13, 37, 9), mat(cfg.pantsColor))
    upper.position.set(0, -18, 0)
    const lower = new THREE.Mesh(new THREE.BoxGeometry(11, 32, 8), mat(cfg.pantsColor))
    lower.position.set(0, -53, 0)
    grp.add(upper, lower)
    return grp
  }

  const lLeg = buildLeg(-1)
  const rLeg = buildLeg(1)
  root.add(lLeg, rLeg)

  // ── Torso (black hoodie) ──────────────────────────────────────
  const torso = new THREE.Mesh(new THREE.BoxGeometry(42, 52, 13), mat(cfg.shirtColor))
  torso.position.set(0, 0, 0)
  root.add(torso)

  // Purple accent stripe on hoodie
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(4, 52, 1), mat(0x7c3aed))
  stripe.position.set(0, 0, 7)
  torso.add(stripe)

  // ── Arms ──────────────────────────────────────────────────────
  function buildArm(side: 1 | -1): THREE.Group {
    const shoulder  = new THREE.Group()
    shoulder.position.set(side * 25, 16, 0)
    const upper     = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6, 31, 6), mat(cfg.shirtColor))
    upper.position.set(0, -15, 0)
    const lower     = new THREE.Mesh(new THREE.CylinderGeometry(5, 4.5, 27, 6), mat(cfg.skinColor))
    lower.position.set(0, -44, 0)
    shoulder.add(upper, lower)
    return shoulder
  }

  const lUpperArm = buildArm(-1)
  const rUpperArm = buildArm(1)
  root.add(lUpperArm, rUpperArm)

  // ── Purple Phone ──────────────────────────────────────────────
  const phone = new THREE.Group()
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(10, 16, 3), mat(0x7c3aed))
  const phoneScreen = new THREE.Mesh(new THREE.BoxGeometry(8, 13, 1), new THREE.MeshLambertMaterial({ color: 0xa78bfa, emissive: 0x8b5cf6, emissiveIntensity: 0.5 }))
  phoneScreen.position.set(0, 0, 2)
  // Lightning bolt icon on screen
  const bolt = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 1), new THREE.MeshLambertMaterial({ color: 0xfbbf24 }))
  bolt.position.set(0, 0, 1)
  phoneScreen.add(bolt)
  phone.add(phoneBody, phoneScreen)
  phone.position.set(-32, -50, 0)
  phone.rotation.z = 0.2
  root.add(phone)

  // ── Neck ──────────────────────────────────────────────────────
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 10, 6), mat(cfg.skinColor))
  neck.position.set(0, 30, 0)
  root.add(neck)

  // ── Head ──────────────────────────────────────────────────────
  const head = new THREE.Mesh(new THREE.SphereGeometry(18, 10, 8), mat(cfg.skinColor))
  head.position.set(0, 52, 0)
  root.add(head)

  // Hood
  const hoodGeo = new THREE.SphereGeometry(20, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58)
  const hood    = new THREE.Mesh(hoodGeo, mat(cfg.bodyColor))
  hood.position.set(0, 56, -4)
  root.add(hood)

  // Eyes + smirk
  const eyeGeo = new THREE.SphereGeometry(3.2, 6, 6)
  const lEye   = new THREE.Mesh(eyeGeo, mat(0xffffff))
  const rEye   = new THREE.Mesh(eyeGeo, mat(0xffffff))
  lEye.position.set(-7, 54, 16)
  rEye.position.set(7, 54, 16)
  root.add(lEye, rEye)

  const rig: BraeRig = { root, head, torso, lUpperArm, rUpperArm, lLeg, rLeg, phone }
  return { group: root, rig }
}
