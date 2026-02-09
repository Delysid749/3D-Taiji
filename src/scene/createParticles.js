import * as THREE from "three";
import { SETTINGS, SPEED_SETTINGS } from "../config.js";
import { easeOutCubic } from "../utils/intro.js";
import { interpolateHexColor } from "../utils/themeTransition.js";

function createCircleTexture(size = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function buildRingPointData(count, innerRadius, outerRadius, zRange, introOuterRadiusMin, introOuterRadiusMax) {
  const positions = new Float32Array(count * 3);
  const introPositions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = (Math.random() - 0.5) * zRange;

    const introRadius = introOuterRadiusMin + Math.random() * (introOuterRadiusMax - introOuterRadiusMin);
    const introAngle = Math.random() * Math.PI * 2;
    const ix = Math.cos(introAngle) * introRadius;
    const iy = Math.sin(introAngle) * introRadius;
    const iz = (Math.random() - 0.5) * (zRange * 3);

    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;
    introPositions[index * 3] = ix;
    introPositions[index * 3 + 1] = iy;
    introPositions[index * 3 + 2] = iz;
  }
  return { positions, introPositions };
}

function buildFogPoints(count, radius, depth) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() ** 0.5 * radius;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const z = (Math.random() - 0.5) * depth;
    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;
  }
  return positions;
}

export function createParticles(scene, theme) {
  const primaryCount = Math.floor(SETTINGS.particleCount * 0.65);
  const secondaryCount = Math.floor(SETTINGS.particleCount * 0.35);
  const primaryData = buildRingPointData(primaryCount, 2.7, 4.2, 0.8, 5.8, 8.6);
  const secondaryData = buildRingPointData(secondaryCount, 2.5, 5.1, 1.2, 6.2, 9.5);

  const primaryGeometry = new THREE.BufferGeometry();
  primaryGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(primaryData.introPositions.slice(), 3)
  );

  const secondaryGeometry = new THREE.BufferGeometry();
  secondaryGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(secondaryData.introPositions.slice(), 3)
  );

  const fogGeometry = new THREE.BufferGeometry();
  fogGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(buildFogPoints(Math.floor(SETTINGS.particleCount * 0.5), 4.8, 2.4), 3)
  );

  const circleTexture = createCircleTexture();

  const primaryMaterial = new THREE.PointsMaterial({
    color: theme.particles.main,
    map: circleTexture,
    size: 0.07,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const secondaryMaterial = new THREE.PointsMaterial({
    color: theme.particles.sub,
    map: circleTexture,
    size: 0.055,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const fogMaterial = new THREE.PointsMaterial({
    color: theme.particles.main,
    map: circleTexture,
    size: 0.16,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const primary = new THREE.Points(primaryGeometry, primaryMaterial);
  const secondary = new THREE.Points(secondaryGeometry, secondaryMaterial);
  const fog = new THREE.Points(fogGeometry, fogMaterial);

  scene.add(primary);
  scene.add(secondary);
  scene.add(fog);
  let themeTransition = null;

  function update(delta, elapsed, state, effects = {}) {
    const speed = SPEED_SETTINGS[state.speedMode].value;
    const introProgress = easeOutCubic(effects.introProgress ?? 1);
    const primaryPositions = primaryGeometry.attributes.position.array;
    const secondaryPositions = secondaryGeometry.attributes.position.array;
    for (let index = 0; index < primaryPositions.length; index += 1) {
      primaryPositions[index] =
        primaryData.introPositions[index] + (primaryData.positions[index] - primaryData.introPositions[index]) * introProgress;
    }
    for (let index = 0; index < secondaryPositions.length; index += 1) {
      secondaryPositions[index] =
        secondaryData.introPositions[index] +
        (secondaryData.positions[index] - secondaryData.introPositions[index]) * introProgress;
    }
    primaryGeometry.attributes.position.needsUpdate = true;
    secondaryGeometry.attributes.position.needsUpdate = true;

    primary.rotation.z += speed * delta * 0.26;
    secondary.rotation.z -= speed * delta * 0.16;
    secondary.rotation.x = Math.sin(elapsed * 0.15) * 0.1;
    primaryMaterial.opacity = 0.18 + introProgress * 0.62;
    secondaryMaterial.opacity = (0.13 + introProgress * 0.3) * (0.8 + Math.abs(Math.sin(elapsed * 0.35)) * 0.2);

    fog.rotation.z -= delta * 0.12;
    fog.rotation.x = Math.sin(elapsed * 0.2) * 0.12;
    fogMaterial.opacity = (1 - introProgress) * 0.4;
    fog.scale.setScalar(1 + (1 - introProgress) * 0.9);

    if (themeTransition) {
      themeTransition.elapsed += delta;
      const progress = Math.min(themeTransition.elapsed / themeTransition.duration, 1);
      primaryMaterial.color.setHex(interpolateHexColor(themeTransition.fromMain, themeTransition.toMain, progress));
      secondaryMaterial.color.setHex(interpolateHexColor(themeTransition.fromSub, themeTransition.toSub, progress));
      fogMaterial.color.setHex(interpolateHexColor(themeTransition.fromFog, themeTransition.toFog, progress));
      if (progress >= 1) {
        themeTransition = null;
      }
    }
  }

  function setTheme(nextTheme) {
    themeTransition = {
      elapsed: 0,
      duration: SETTINGS.themeTransitionDurationSeconds,
      fromMain: primaryMaterial.color.getHex(),
      toMain: nextTheme.particles.main,
      fromSub: secondaryMaterial.color.getHex(),
      toSub: nextTheme.particles.sub,
      fromFog: fogMaterial.color.getHex(),
      toFog: nextTheme.particles.main
    };
  }

  function dispose() {
    scene.remove(primary);
    scene.remove(secondary);
    scene.remove(fog);
    primaryGeometry.dispose();
    secondaryGeometry.dispose();
    fogGeometry.dispose();
    primaryMaterial.dispose();
    secondaryMaterial.dispose();
    fogMaterial.dispose();
    circleTexture.dispose();
  }

  return {
    update,
    setTheme,
    dispose
  };
}
