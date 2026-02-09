import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SETTINGS } from "../config.js";
import { interpolateHexColor } from "../utils/themeTransition.js";
import {
  beginSceneThemeTransition,
  createSceneTransitionState,
  stepSceneThemeTransition
} from "../utils/sceneTransitionState.js";

function isHexColor(value) {
  return Number.isInteger(value) && value >= 0x000000 && value <= 0xffffff;
}

function setLightColor(light, fromColor, toColor, progress) {
  if (!light || !light.color || !isHexColor(fromColor) || !isHexColor(toColor)) {
    return;
  }
  light.color.setHex(interpolateHexColor(fromColor, toColor, progress));
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, "rgba(210, 180, 110, 0.3)");
  gradient.addColorStop(0.3, "rgba(180, 155, 100, 0.14)");
  gradient.addColorStop(0.6, "rgba(140, 125, 100, 0.04)");
  gradient.addColorStop(1, "rgba(100, 90, 80, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(canvas);
}

function createEnvironmentMap(renderer) {
  const envCanvas = document.createElement("canvas");
  envCanvas.width = 256;
  envCanvas.height = 128;
  const ctx = envCanvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#1a1a3e");
  grad.addColorStop(0.4, "#22224a");
  grad.addColorStop(0.6, "#181838");
  grad.addColorStop(1, "#0a0a1e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = "rgba(255, 240, 200, 0.1)";
  ctx.beginPath();
  ctx.arc(70, 35, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(200, 80, 18, 0, Math.PI * 2);
  ctx.fill();
  const envTexture = new THREE.CanvasTexture(envCanvas);
  envTexture.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromEquirectangular(envTexture).texture;
  envTexture.dispose();
  pmrem.dispose();
  return envMap;
}

export function createScene(container, theme) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(0, 0, 8.2);

  // Environment map for material reflections
  const envMap = createEnvironmentMap(renderer);
  scene.environment = envMap;

  // === Lights ===
  const ambientLight = new THREE.AmbientLight(theme.scene.ambient, 0.65);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(theme.scene.directional, 1.2);
  directionalLight.position.set(2.4, 3.8, 5);
  scene.add(directionalLight);

  const backLight = new THREE.DirectionalLight(theme.scene.ambient, 0.55);
  backLight.position.set(-3.2, -1.5, -2.8);
  scene.add(backLight);

  // Orbiting warm point light
  const pointLight = new THREE.PointLight(0xdab06b, 0.6, 14, 1.5);
  pointLight.position.set(3, 2, 3);
  scene.add(pointLight);

  // Subtle rim light from below
  const rimLight = new THREE.PointLight(0x667799, 0.3, 10, 2);
  rimLight.position.set(0, -3, 2);
  scene.add(rimLight);

  // === Starfield ===
  const starCount = SETTINGS.starfieldCount;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 30 + Math.random() * 20;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    sizeAttenuation: true
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // === Glow plane behind taiji ===
  const glowTexture = createGlowTexture();
  const glowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.85
    })
  );
  glowPlane.position.z = -1.5;
  scene.add(glowPlane);

  // === Post-processing ===
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    SETTINGS.bloomStrength,
    SETTINGS.bloomRadius,
    SETTINGS.bloomThreshold
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  let themeTransition = createSceneTransitionState();

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
  }

  function render() {
    composer.render();
  }

  function update(delta, elapsed, state, effects = {}) {
    const realElapsed = effects.realElapsed ?? elapsed;
    const realDelta = effects.realDelta ?? delta;

    // Orbit point light (always, even paused)
    const lightAngle = realElapsed * 0.18;
    pointLight.position.x = Math.cos(lightAngle) * 3.8;
    pointLight.position.y = Math.sin(lightAngle) * 2.6;
    pointLight.intensity = 0.5 + Math.sin(realElapsed * 0.4) * 0.15;

    // Slow-rotate starfield (always)
    stars.rotation.y += realDelta * 0.006;
    stars.rotation.x += realDelta * 0.002;

    // Pulse glow (always)
    glowPlane.material.opacity = 0.7 + Math.sin(realElapsed * 0.45) * 0.15;

    // Theme transition (needs game-time delta)
    if (!Number.isFinite(delta) || delta <= 0) {
      return;
    }

    const stepped = stepSceneThemeTransition(themeTransition, delta);
    themeTransition = stepped.state;

    if (!stepped.from || !stepped.to) {
      return;
    }

    setLightColor(ambientLight, stepped.from.ambient, stepped.to.ambient, stepped.progress);
    setLightColor(directionalLight, stepped.from.directional, stepped.to.directional, stepped.progress);
    setLightColor(backLight, stepped.from.back, stepped.to.back, stepped.progress);
  }

  function setTheme(nextTheme) {
    if (!nextTheme || !nextTheme.scene) {
      return;
    }

    themeTransition = beginSceneThemeTransition(themeTransition, {
      from: {
        ambient: ambientLight.color.getHex(),
        directional: directionalLight.color.getHex(),
        back: backLight.color.getHex()
      },
      to: {
        ambient: nextTheme.scene.ambient,
        directional: nextTheme.scene.directional,
        back: nextTheme.scene.ambient
      },
      duration: SETTINGS.themeTransitionDurationSeconds
    });
  }

  function dispose() {
    composer.dispose();
    renderer.dispose();
    glowTexture.dispose();
    starGeo.dispose();
    starMat.dispose();
    envMap.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  resize();

  return {
    scene,
    camera,
    renderer,
    resize,
    render,
    update,
    setTheme,
    dispose
  };
}
