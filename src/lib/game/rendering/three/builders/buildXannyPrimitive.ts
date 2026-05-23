import * as THREE from 'three'
import { CHARACTER_VISUAL_CONFIG } from '../../characterVisualConfig'

/**
 * Xanny — Speedster
 * Blue shirt, blue jeans, red Jordans, curly dark hair, cyan speed aura.
 */
export interface XannyRig {
  root:     THREE.Group
  head:     THREE.Mesh
  torso:    THREE.Mesh
  lUpperArm: THREE.Group
  rUpperArm: THREE.Group
  lLeg:     THREE.Group
  rLeg:     THREE.Group
}

function mat(color: number, opts: Partial<THREE.MeshLambertMaterialParameters> = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts })
}

export function buildXannyPrimitive(): { group: THREE.Group; rig: XannyRig } {
  const cfg   = CHARACTER_VISUAL_CONFIG.xanny.three
  const root  = new THREE.Group()
  root.name   = 'xanny'

  // ── Shoes ─────────────────────────────────────────────────────
  const shoeGeo  = new THREE.BoxGeometry(16, 8, 10)
  const lShoe    = new THREE.Mesh(shoeGeo, mat(cfg.shoeColor))
  const rShoe    = new THREE.Mesh(shoeGeo, mat(cfg.shoeColor))
  lShoe.position.set(-9, -75, 0)
  rShoe.position.set(9, -75, 0)
  root.add(lShoe, rShoe)

  // ── Legs ──────────────────────────────────────────────────────
  const upperLegGeo = new THREE.BoxGeometry(12, 36, 9)
  const lowerLegGeo = new THREE.BoxGeometry(10, 32, 8)

  function buildLeg(side: 1 | -1): THREE.Group {
    const grp      = new THREE.Group()
    grp.position.set(side * 9, -30, 0)
    const upper    = new THREE.Mesh(upperLegGeo, mat(cfg.pantsColor))
    upper.position.set(0, -18, 0)
    const lower    = new THREE.Mesh(lowerLegGeo, mat(cfg.pantsColor))
    lower.position.set(0, -52, 0)
    grp.add(upper, lower)
    return grp
  }

  const lLeg = buildLeg(-1)
  const rLeg = buildLeg(1)
  root.add(lLeg, rLeg)

  // ── Torso ─────────────────────────────────────────────────────
  const torsoGeo  = new THREE.BoxGeometry(38, 50, 12)
  const torso     = new THREE.Mesh(torsoGeo, mat(cfg.shirtColor))
  torso.position.set(0, 0, 0)
  root.add(torso)

  // ── Arms ──────────────────────────────────────────────────────
  const upperArmGeo = new THREE.CylinderGeometry(5, 5, 30, 6)
  const lowerArmGeo = new THREE.CylinderGeometry(4, 4, 26, 6)

  function buildArm(side: 1 | -1): THREE.Group {
    const shoulder  = new THREE.Group()
    shoulder.position.set(side * 22, 16, 0)
    const upper     = new THREE.Mesh(upperArmGeo, mat(cfg.shirtColor))
    upper.position.set(0, -15, 0)
    const lower     = new THREE.Mesh(lowerArmGeo, mat(cfg.skinColor))
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
  const headGeo = new THREE.SphereGeometry(18, 10, 8)
  const head    = new THREE.Mesh(headGeo, mat(cfg.skinColor))
  head.position.set(0, 50, 0)
  root.add(head)

  // Hair — curly afro approximated with a hemisphere
  const hairGeo = new THREE.SphereGeometry(20, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55)
  const hair    = new THREE.Mesh(hairGeo, mat(cfg.hairColor))
  hair.position.set(0, 54, -2)
  root.add(hair)

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(3, 6, 6)
  const eyeM   = mat(0xffffff)
  const lEye   = new THREE.Mesh(eyeGeo, eyeM)
  const rEye   = new THREE.Mesh(eyeGeo, eyeM)
  lEye.position.set(-7, 52, 16)
  rEye.position.set(7, 52, 16)
  root.add(lEye, rEye)

  // Pupils
  const pupilGeo = new THREE.SphereGeometry(1.8, 4, 4)
  const pupilM   = mat(0x1a1a1a)
  const lPupil   = new THREE.Mesh(pupilGeo, pupilM)
  const rPupil   = new THREE.Mesh(pupilGeo, pupilM)
  lPupil.position.set(-7, 52, 18)
  rPupil.position.set(7, 52, 18)
  root.add(lPupil, rPupil)

  const rig: XannyRig = { root, head, torso, lUpperArm, rUpperArm, lLeg, rLeg }
  return { group: root, rig }
}
