import * as THREE from "three";
import { SETTINGS, resolveClockwiseAngularVelocity } from "../config.js";
import { easeOutCubic } from "../utils/intro.js";
import { interpolateHexColor } from "../utils/themeTransition.js";
import {
  drawTaijiSymbolTexture,
  getBreathScale,
  resolveOuterRingColor
} from "../utils/taijiVisual.js";

export function createTaiji(scene, theme) {
  const group = new THREE.Group();
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1024;
  textureCanvas.height = 1024;
  const textureContext = textureCanvas.getContext("2d");
  const symbolTexture = new THREE.CanvasTexture(textureCanvas);
  symbolTexture.colorSpace = THREE.SRGBColorSpace;

  const currentSymbolColors = {
    yin: theme.taiji.yin,
    yang: theme.taiji.yang
  };
  drawTaijiSymbolTexture(textureContext, textureCanvas.width, currentSymbolColors);
  symbolTexture.needsUpdate = true;
  const fixedRingColor = resolveOuterRingColor(theme);

  const materials = {
    face: new THREE.MeshStandardMaterial({
      map: symbolTexture,
      roughness: 0.35,
      metalness: 0.04,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide
    })
  };

  const plate = new THREE.Mesh(new THREE.CircleGeometry(2.2, 128), materials.face);
  group.add(plate);

  scene.add(group);

  let themeTransition = null;

  function update(delta, elapsed, state, effects = {}) {
    const speed = resolveClockwiseAngularVelocity(state);
    const introProgress = easeOutCubic(effects.introProgress ?? 1);
    const breathScale = getBreathScale(elapsed, SETTINGS.breathAmplitude, SETTINGS.breathFrequency);

    group.rotation.z += speed * delta;
    group.scale.setScalar((0.28 + introProgress * 0.72) * breathScale);
    group.position.z = -0.8 * (1 - introProgress);

    // Wobble + parallax tilt
    const wobbleX = Math.sin(elapsed * SETTINGS.wobbleFrequency) * SETTINGS.wobbleAmplitude;
    const wobbleY = Math.cos(elapsed * SETTINGS.wobbleFrequency * 0.7) * SETTINGS.wobbleAmplitude * 0.6;
    const px = (state.pointer?.y ?? 0) * SETTINGS.parallaxStrength;
    const py = (state.pointer?.x ?? 0) * SETTINGS.parallaxStrength;
    const smoothing = 1 - Math.exp(-(effects.realDelta ?? delta) * 4);
    group.rotation.x += (wobbleX + px - group.rotation.x) * smoothing;
    group.rotation.y += (wobbleY + py - group.rotation.y) * smoothing;

    materials.face.opacity = 0.15 + introProgress * 0.85;

    if (themeTransition) {
      themeTransition.elapsed += delta;
      const progress = Math.min(themeTransition.elapsed / themeTransition.duration, 1);
      const symbolColors = {
        yin: interpolateHexColor(themeTransition.fromSymbol.yin, themeTransition.toSymbol.yin, progress),
        yang: interpolateHexColor(themeTransition.fromSymbol.yang, themeTransition.toSymbol.yang, progress)
      };
      drawTaijiSymbolTexture(textureContext, textureCanvas.width, symbolColors);
      symbolTexture.needsUpdate = true;

      if (progress >= 1) {
        currentSymbolColors.yin = themeTransition.toSymbol.yin;
        currentSymbolColors.yang = themeTransition.toSymbol.yang;
        themeTransition = null;
      }
    }
  }

  function setTheme(nextTheme) {
    themeTransition = {
      elapsed: 0,
      duration: SETTINGS.themeTransitionDurationSeconds,
      fromSymbol: {
        yin: currentSymbolColors.yin,
        yang: currentSymbolColors.yang
      },
      toSymbol: {
        yin: nextTheme.taiji.yin,
        yang: nextTheme.taiji.yang
      },
    };
  }

  function dispose() {
    scene.remove(group);
    group.traverse((node) => {
      if (node.isMesh) {
        node.geometry.dispose();
      }
    });
    symbolTexture.dispose();
    materials.face.dispose();
  }

  return {
    update,
    setTheme,
    dispose
  };
}
