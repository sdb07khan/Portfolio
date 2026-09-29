/*
 * Shared Three.js helpers for the three scenes (hero keyboard, stack
 * anatomy, floating keycaps): renderer setup, lighting environment,
 * the keycap factory and canvas-drawn label textures.
 */

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// Mirrors the CSS tokens in sass/abstracts/_variables.scss
export const PALETTE = {
  paper: "#e9e4da",
  ink: "#2b2a27",
  clay: "#b4654a",
  sage: "#7b8a6d",
  dusk: "#5d7086",
  sand: "#d5c3a3",
  inkText: "#1c1c1a",
  paperText: "#f1ede6"
};

export const IS_MOBILE = window.matchMedia("(max-width: 769px)").matches;
export const IS_TOUCH = window.matchMedia("(hover: none)").matches;

export function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

export function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

// Canvas text needs the web font actually loaded, or labels render in
// the fallback face. Resolves either way so a font failure never
// blocks the scene.
export function fontsReady() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.all([
    document.fonts.load('500 100px "Geist Mono"'),
    document.fonts.load('500 100px "Geist"')
  ]).catch(function () {});
}

export function createRenderer(canvas, options) {
  const opts = options || {};
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral keeps the sober palette's hues true (ACES would warm them)
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  if (opts.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  return renderer;
}

// Soft studio reflections without shipping an HDR file
export function createEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

// Pause rendering while a canvas is off screen
export function watchVisibility(element, callback) {
  const observer = new IntersectionObserver(function (entries) {
    callback(entries[0].isIntersecting);
  }, { rootMargin: "100px" });
  observer.observe(element);
}

// ---- Keycaps -------------------------------------------------------------

export const KEY_HEIGHT = 0.56;
const geometryCache = {};

function capGeometry(width, depth) {
  const id = width + "x" + depth;
  if (!geometryCache[id]) {
    geometryCache[id] = new RoundedBoxGeometry(width, KEY_HEIGHT, depth, 4, 0.16);
  }
  return geometryCache[id];
}

export function makeLabelTexture(text, options) {
  const opts = options || {};
  const ratio = (opts.width || 1) / (opts.depth || 1);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(size * ratio);
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = opts.color || PALETTE.inkText;
  ctx.font = (opts.weight || 500) + " " + (opts.fontSize || 104) + 'px "Geist Mono", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, size / 2 + 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/*
 * One keycap = a rounded box body + a transparent label plane resting
 * on its top face. Returns a Group whose userData.body is the mesh to
 * raycast against.
 */
export function createKeycap(options) {
  const width = options.width || 1;
  const depth = options.depth || 1;
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    capGeometry(width, depth),
    new THREE.MeshPhysicalMaterial({
      color: options.color,
      roughness: 0.52,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.55
    })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  if (options.label) {
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.9, depth * 0.9),
      new THREE.MeshStandardMaterial({
        map: makeLabelTexture(options.label, {
          width: width,
          depth: depth,
          color: options.labelColor,
          fontSize: options.fontSize
        }),
        transparent: true,
        roughness: 0.6,
        depthWrite: false
      })
    );
    label.rotation.x = -Math.PI / 2;
    label.position.y = KEY_HEIGHT / 2 + 0.003;
    group.add(label);
  }

  group.userData.body = body;
  return group;
}

export function labelColorFor(colorName) {
  return colorName === "paper" || colorName === "sand" ? PALETTE.inkText : PALETTE.paperText;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
