import * as THREE from 'three'
import { CHARACTER_VISUAL_CONFIG } from '../../characterVisualConfig'

/**
 * Governor — Governor
 * Black hoodie, cap, glasses, green governor aura.
 */
export interface GovernorRig {
  root:      THREE.Group
  head:      THREE.Mesh
  torso:     THREE.Mesh
  lUpperArm: THREE.Group
  rUpperArm: THREE.Group
  lLeg:      THREE.Group
  rLeg:      THREE.Group
  cap:       THREE.Group
}

function mat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color })
}

export function buildGovernorPrimitive(): { group: THREE.Group; rig: GovernorRig } {
  const cfg  = CHARACTER_VISUAL_CONFIG.governor.three
  const root = new THREE.Group()
  root.name  = 'governor'

  // ── Shoes ─────────────────────────────────────────────────────
  const shoeGeo = new THREE.BoxGeometry(17, 8, 10)
  const lShoe   = new THREE.Mesh(shoeGeo, mat(cfg.shoeColor))
  const rShoe   = new THREE.Mesh(shoeGeo, mat(0x22c55e))
  lShoe.position.set(-9, -78, 0)
  rShoe.position.set(9, -78, 0)
  root.add(lShoe, rShoe)

  // ── Legs ──────────────────────────────────────────────────────
  function buildLeg(side: 1 | -1): THREE.Group {
    const grp   = new THREE.Group()
    grp.position.set(side * 9, -33, 0)
    const upper = new THREE.Mesh(new THREE.BoxGeometry(13, 38, 9), mat(cfg.pantsColor))
    upper.position.set(0, -19, 0)
    const lower = new THREE.Mesh(new THREE.BoxGeometry(11, 32, 8), mat(cfg.pantsColor))
    lower.position.set(0, -56, 0)
    grp.add(upper, lower)
    return grp
  }

  const lLeg = buildLeg(-1)
  const rLeg = buildLeg(1)
  root.add(lLeg, rLeg)

  // ── Torso (black hoodie) ──────────────────────────────────────
  const torso = new THREE.Mesh(new THREE.BoxGeometry(44, 52, 13), mat(cfg.shirtColor))
  torso.position.set(0, 0, 0)
  root.add(torso)

  // Green authority badge on chest
  const badge = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 1), mat(0x22c55e))
  badge.position.set(0, 8, 7)
  torso.add(badge)

  // ── Arms ──────────────────────────────────────────────────────
  function buildArm(side: 1 | -1): THREE.Group {
    const shoulder  = new THREE.Group()
    shoulder.position.set(side * 26, 17, 0)
    const upper     = new THREE.Mesh(new THREE.CylinderGeometry(7, 6.5, 33, 6), mat(cfg.shirtColor))
    upper.position.set(0, -16, 0)
    const lower     = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5, 28, 6), mat(cfg.skinColor))
    lower.position.set(0, -46, 0)
    shoulder.add(upper, lower)
    return shoulder
  }

  const lUpperArm = buildArm(-1)
  const rUpperArm = buildArm(1)
  root.add(lUpperArm, rUpperArm)

  // ── Neck ──────────────────────────────────────────────────────
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 11, 6), mat(cfg.skinColor))
  neck.position.set(0, 30, 0)
  root.add(neck)

  // ── Head ──────────────────────────────────────────────────────
  const head = new THREE.Mesh(new THREE.SphereGeometry(19, 12, 8), mat(cfg.skinColor))
  head.position.set(0, 55, 0)
  root.add(head)

  // Cap
  const cap = new THREE.Group()
  const capBrim = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 4, 12), mat(cfg.hairColor))
  const capTop  = new THREE.Mesh(new THREE.CylinderGeometry(18, 20, 12, 12), mat(cfg.hairColor))
  const capBill = new THREE.Mesh(new THREE.BoxGeometry(34, 4, 14), mat(0x1a1a1a))
  capBrim.position.set(0, 0, 0)
  capTop.position.set(0, 8, 0)
  capBill.position.set(0, -2, 14)
  cap.add(capBrim, capTop, capBill)
  cap.position.set(0, 66, 0)
  root.add(cap)

  // Glasses
  const glassGeo = new THREE.TorusGeometry(5.5, 1.1, 4, 8)
  const glassM   = mat(0x1a1a1a)
  const lGlass   = new THREE.Mesh(glassGeo, glassM)
  const rGlass   = new THREE.Mesh(glassGeo, glassM)
  lGlass.position.set(-8, 56, 19)
  rGlass.position.set(8, 56, 19)
  root.add(lGlass, rGlass)

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(2.8, 5, 5)
  const lEye   = new THREE.Mesh(eyeGeo, mat(0x1a1a1a))
  const rEye   = new THREE.Mesh(eyeGeo, mat(0x1a1a1a))
  lEye.position.set(-8, 55, 18)
  rEye.position.set(8, 55, 18)
  root.add(lEye, rEye)

  const rig: GovernorRig = { root, head, torso, lUpperArm, rUpperArm, lLeg, rLeg, cap }
  return { group: root, rig }
}
