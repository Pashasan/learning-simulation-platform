// ============================================================
// SPRITES — Three.js robot geometry builders for RoboVault
// ============================================================

const THREE = window.THREE;

/**
 * Build a robot mesh group based on product config.
 * @param {object} config - { function, personality, form, autonomy }
 * @returns {THREE.Group} Robot mesh group
 */
export function buildRobot(config) {
  const group = new THREE.Group();

  const formScale = getFormScale(config.form);
  const colors = getPersonalityColors(config.personality);

  // Body
  const bodyGeo = new THREE.BoxGeometry(
    1.0 * formScale.bodyW,
    1.4 * formScale.bodyH,
    0.6 * formScale.bodyD
  );
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    metalness: 0.6,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.2;
  group.add(body);

  // Head
  const headSize = config.form === 'robotic' ? 0.35 : 0.4;
  const headGeo = config.form === 'humanoid'
    ? new THREE.SphereGeometry(headSize, 16, 16)
    : new THREE.BoxGeometry(headSize * 1.8, headSize * 1.5, headSize * 1.5);
  const headMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    metalness: 0.5,
    roughness: 0.35,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 2.2 * formScale.bodyH;
  group.add(head);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: colors.eyes,
    emissive: colors.eyes,
    emissiveIntensity: 0.8,
  });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeSpread = config.form === 'humanoid' ? 0.12 : 0.18;
  eyeL.position.set(-eyeSpread, 2.2 * formScale.bodyH, headSize * 0.7);
  eyeR.position.set(eyeSpread, 2.2 * formScale.bodyH, headSize * 0.7);
  group.add(eyeL);
  group.add(eyeR);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
  const armMat = new THREE.MeshStandardMaterial({
    color: colors.limbs,
    metalness: 0.7,
    roughness: 0.3,
  });
  const armL = new THREE.Mesh(armGeo, armMat);
  const armR = new THREE.Mesh(armGeo, armMat);
  const armX = 0.6 * formScale.bodyW;
  armL.position.set(-armX, 1.2, 0);
  armR.position.set(armX, 1.2, 0);
  if (config.form === 'humanoid') {
    armL.rotation.z = 0.15;
    armR.rotation.z = -0.15;
  }
  group.add(armL);
  group.add(armR);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
  const legMat = armMat.clone();
  const legL = new THREE.Mesh(legGeo, legMat);
  const legR = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.2, 0.4, 0);
  legR.position.set(0.2, 0.4, 0);
  group.add(legL);
  group.add(legR);

  // Antenna (autonomy indicator)
  if (config.autonomy === 'fully_autonomous' || config.autonomy === 'semi_autonomous') {
    const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
    const antennaMat = new THREE.MeshStandardMaterial({
      color: config.autonomy === 'fully_autonomous' ? 0x58A6FF : 0x8B949E,
      metalness: 0.8,
    });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.y = 2.5 * formScale.bodyH;
    group.add(antenna);

    // Antenna tip
    const tipGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const tipMat = new THREE.MeshStandardMaterial({
      color: config.autonomy === 'fully_autonomous' ? 0x58A6FF : 0x8B949E,
      emissive: config.autonomy === 'fully_autonomous' ? 0x58A6FF : 0x484F58,
      emissiveIntensity: 0.6,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 2.7 * formScale.bodyH;
    group.add(tip);
  }

  // Function badge (small colored plate on chest)
  const badgeGeo = new THREE.BoxGeometry(0.2, 0.15, 0.05);
  const badgeMat = new THREE.MeshStandardMaterial({
    color: getFunctionColor(config.function),
    emissive: getFunctionColor(config.function),
    emissiveIntensity: 0.3,
  });
  const badge = new THREE.Mesh(badgeGeo, badgeMat);
  badge.position.set(0, 1.5, 0.35 * formScale.bodyD);
  group.add(badge);

  return group;
}

function getFormScale(form) {
  switch (form) {
    case 'robotic':
      return { bodyW: 1.2, bodyH: 0.85, bodyD: 1.1 };
    case 'semi_humanoid':
      return { bodyW: 1.0, bodyH: 1.0, bodyD: 1.0 };
    case 'humanoid':
      return { bodyW: 0.85, bodyH: 1.1, bodyD: 0.85 };
    default:
      return { bodyW: 1.0, bodyH: 1.0, bodyD: 1.0 };
  }
}

function getPersonalityColors(personality) {
  switch (personality) {
    case 'warm':
      return { body: 0xE8D5B7, limbs: 0xC9A87A, eyes: 0xF0883E };
    case 'efficient':
      return { body: 0x8899AA, limbs: 0x667788, eyes: 0x58A6FF };
    case 'playful':
      return { body: 0xB8D4E3, limbs: 0x88AACC, eyes: 0x3FB950 };
    default:
      return { body: 0x888888, limbs: 0x666666, eyes: 0x58A6FF };
  }
}

function getFunctionColor(func) {
  switch (func) {
    case 'household': return 0x3FB950;
    case 'elderly_care': return 0x58A6FF;
    case 'child_education': return 0xF0883E;
    case 'security': return 0xF85149;
    default: return 0x8B949E;
  }
}
