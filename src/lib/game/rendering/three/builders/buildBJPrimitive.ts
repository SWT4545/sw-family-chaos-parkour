import * as THREE from 'three'
import { CHARACTER_VISUAL_CONFIG } from '../../characterVisualConfig'

/**
 * BJ — Chaos Master
 * Red/black hoodie, black pants, red/black sneakers, chaos trigger orb.
 */
export interface BJRig {
  root:      THREE.Group
  head:      THREE.Mesh
  torso:     THREE.Mesh
  lUpperArm: THREE.Group
  rUpperArm: THREE.Group
  lLeg:      THREE.Group
  rLeg:      THREE.Group
  chaosOrb:  THREE.Mesh
}

function mat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color })
}

export function buildBJPrimitive(): { group: THREE.Group; rig: BJRig } {
  const cfg  = CHARACTER_VISUAL_CONFIG.bj.three
  const root = new THREE.Group()
  root.name  = 'bj'

  // ── Shoes ─────────────────────────────────────────────────────
  const shoeGeo = new THREE.BoxGeometry(17, 8, 10)
  const lShoe   = new THREE.Mesh(shoeGeo, mat(cfg.shoeColor))
  const rShoe   = new THREE.Mesh(shoeGeo, mat(0x111111))
  lShoe.position.set(-9, -78, 0)
  rShoe.position.set(9, -78, 0)
  root.add(lShoe, rShoe)

  // ── Legs ──────────────────────────────────────────────────────
  function buildLeg(side: 1 | -1): THREE.Group {
    const grp   = new THREE.Group()
    grp.position.set(side * 9, -32, 0)
    const upper = new THREE.Mesh(new THREE.BoxGeometry(13, 38, 9), mat(cfg.pantsColor))
    upper.position.set(0, -19, 0)
    const lower = new THREE.Mesh(new THREE.BoxGeometry(11, 32, 8), mat(cfg.pantsColor))
    lower.position.set(0, -55, 0)
    grp.add(upper, lower)
    return grp
  }

  const lLeg = buildLeg(-1)
  const rLeg = buildLeg(1)
  root.add(lLeg, rLeg)

  // ── Torso (hoodie) ────────────────────────────────────────────
  const torso = new THREE.Mesh(new THREE.BoxGeometry(44, 52, 13), mat(cfg.shirtColor))
  torso.position.set(0, 0, 0)
  root.add(torso)

  // Hoodie front pocket
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 1), mat(0x1a1a1a))
  pocket.position.set(0, -14, 7)
  torso.add(pocket)

  // ── Arms ──────────────────────────────────────────────────────
  function buildArm(side: 1 | -1): THREE.Group {
    const shoulder  = new THREE.Group()
    shoulder.position.set(side * 26, 16, 0)
    const upper     = new THREE.Mesh(new THREE.CylinderGeometry(7, 6, 32, 6), mat(cfg.shirtColor))
    upper.position.set(0, -16, 0)
    const lower     = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 28, 6), mat(cfg.shirtColor))
    lower.position.set(0, -46, 0)
    shoulder.add(upper, lower)
    return shoulder
  }

  const lUpperArm = buildArm(-1)
  const rUpperArm = buildArm(1)
  root.add(lUpperArm, rUpperArm)

  // ── Chaos Orb (held in right hand) ───────────────────────────
  const chaosOrb = new THREE.Mesh(
    new THREE.SphereGeometry(9, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xe11d48, emissive: 0x6b0020, emissiveIntensity: 0.4 }),
  )
  chaosOrb.position.set(38, -60, 0)
  root.add(chaosOrb)

  // ── Neck ──────────────────────────────────────────────────────
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 11, 6), mat(cfg.skinColor))
  neck.position.set(0, 30, 0)
  root.add(neck)

  // ── Head ──────────────────────────────────────────────────────
  const head = new THREE.Mesh(new THREE.SphereGeometry(18, 10, 8), mat(cfg.skinColor))
  head.position.set(0, 53, 0)
  root.add(head)

  // Hood (over head)
  const hoodGeo = new THREE.SphereGeometry(21, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6)
  const hood    = new THREE.Mesh(hoodGeo, mat(cfg.shirtColor))
  hood.position.set(0, 57, -4)
  root.add(hood)

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(3.5, 6, 6)
  const lEye   = new THREE.Mesh(eyeGeo, mat(0xffffff))
  const rEye   = new THREE.Mesh(eyeGeo, mat(0xffffff))
  lEye.position.set(-7, 55, 16)
  rEye.position.set(7, 55, 16)
  root.add(lEye, rEye)

  const rig: BJRig = { root, head, torso, lUpperArm, rUpperArm, lLeg, rLeg, chaosOrb }
  return { group: root, rig }
}
