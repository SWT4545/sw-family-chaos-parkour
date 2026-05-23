import * as THREE from 'three'
import { CHARACTER_VISUAL_CONFIG } from '../../characterVisualConfig'

/**
 * Commander — Leader
 * Brown skin, glasses, black shirt with red S&W logo, black pants, red/black Jordans.
 */
export interface CommanderRig {
  root:      THREE.Group
  head:      THREE.Mesh
  torso:     THREE.Mesh
  lUpperArm: THREE.Group
  rUpperArm: THREE.Group
  lLeg:      THREE.Group
  rLeg:      THREE.Group
}

function mat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color })
}

export function buildCommanderPrimitive(): { group: THREE.Group; rig: CommanderRig } {
  const cfg  = CHARACTER_VISUAL_CONFIG.commander.three
  const root = new THREE.Group()
  root.name  = 'commander'

  // ── Shoes (red/black Jordans) ─────────────────────────────────
  const shoeGeo = new THREE.BoxGeometry(18, 9, 11)
  const lShoe   = new THREE.Mesh(shoeGeo, mat(cfg.shoeColor))
  const rShoe   = new THREE.Mesh(shoeGeo, mat(0x111111))
  lShoe.position.set(-10, -80, 0)
  rShoe.position.set(10, -80, 0)
  root.add(lShoe, rShoe)

  // ── Legs (black cargo pants) ──────────────────────────────────
  const upperLegGeo = new THREE.BoxGeometry(15, 40, 10)
  const lowerLegGeo = new THREE.BoxGeometry(13, 34, 9)

  function buildLeg(side: 1 | -1): THREE.Group {
    const grp   = new THREE.Group()
    grp.position.set(side * 10, -35, 0)
    const upper = new THREE.Mesh(upperLegGeo, mat(cfg.pantsColor))
    upper.position.set(0, -20, 0)
    const lower = new THREE.Mesh(lowerLegGeo, mat(cfg.pantsColor))
    lower.position.set(0, -58, 0)
    grp.add(upper, lower)
    return grp
  }

  const lLeg = buildLeg(-1)
  const rLeg = buildLeg(1)
  root.add(lLeg, rLeg)

  // ── Torso (muscular — wider shoulders) ───────────────────────
  const torsoGeo  = new THREE.BoxGeometry(48, 55, 14)
  const torso     = new THREE.Mesh(torsoGeo, mat(cfg.shirtColor))
  torso.position.set(0, 0, 0)
  root.add(torso)

  // S&W logo patch — small red rect on chest
  const patch = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 1), mat(0xdc2626))
  patch.position.set(0, 5, 8)
  torso.add(patch)

  // ── Arms (muscular) ───────────────────────────────────────────
  function buildArm(side: 1 | -1): THREE.Group {
    const shoulder  = new THREE.Group()
    shoulder.position.set(side * 28, 18, 0)
    const upper     = new THREE.Mesh(new THREE.CylinderGeometry(8, 7, 34, 6), mat(cfg.shirtColor))
    upper.position.set(0, -17, 0)
    const lower     = new THREE.Mesh(new THREE.CylinderGeometry(6, 5, 28, 6), mat(cfg.skinColor))
    lower.position.set(0, -47, 0)
    shoulder.add(upper, lower)
    return shoulder
  }

  const lUpperArm = buildArm(-1)
  const rUpperArm = buildArm(1)
  root.add(lUpperArm, rUpperArm)

  // Crossed-arms pose indicator (static slight rotation)
  lUpperArm.rotation.z =  0.3
  rUpperArm.rotation.z = -0.3

  // ── Neck ──────────────────────────────────────────────────────
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 11, 6), mat(cfg.skinColor))
  neck.position.set(0, 31, 0)
  root.add(neck)

  // ── Head (round, bald) ────────────────────────────────────────
  const headGeo = new THREE.SphereGeometry(20, 12, 8)
  const head    = new THREE.Mesh(headGeo, mat(cfg.skinColor))
  head.position.set(0, 56, 0)
  root.add(head)

  // Beard — dark patch on lower face
  const beard = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 2), mat(0x1a1010))
  beard.position.set(0, 47, 19)
  root.add(beard)

  // Glasses — two small frames
  const glassGeo = new THREE.TorusGeometry(6, 1.2, 4, 8)
  const glassM   = mat(0x222222)
  const lGlass   = new THREE.Mesh(glassGeo, glassM)
  const rGlass   = new THREE.Mesh(glassGeo, glassM)
  lGlass.position.set(-9, 58, 20)
  rGlass.position.set(9, 58, 20)
  root.add(lGlass, rGlass)

  // Eyes (behind glasses)
  const eyeGeo = new THREE.SphereGeometry(3, 5, 5)
  const lEye   = new THREE.Mesh(eyeGeo, mat(0x1a1a1a))
  const rEye   = new THREE.Mesh(eyeGeo, mat(0x1a1a1a))
  lEye.position.set(-9, 57, 18)
  rEye.position.set(9, 57, 18)
  root.add(lEye, rEye)

  const rig: CommanderRig = { root, head, torso, lUpperArm, rUpperArm, lLeg, rLeg }
  return { group: root, rig }
}
