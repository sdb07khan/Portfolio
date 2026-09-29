/*
 * Floaters — loose keycaps that drift between sections.
 *
 * One fixed, click-through canvas covers the viewport. Each keycap is
 * anchored to the top edge of a section and moves with the page at its
 * own parallax speed, spinning with scroll distance and wobbling with
 * scroll velocity — so they seem to tumble past as you read.
 *
 * To add or move one, edit FLOATERS below:
 *   anchor  section selector it's attached to
 *   x       horizontal position, 0 (left edge) → 1 (right edge)
 *   offset  vertical offset from the anchor, in viewport heights
 *   speed   parallax: >1 moves faster than the page, <1 slower
 */

import * as THREE from "three";
import {
  PALETTE,
  IS_MOBILE,
  onReady,
  hasWebGL,
  fontsReady,
  createRenderer,
  createEnvironment,
  createKeycap,
  labelColorFor
} from "./shared.js";

const site = window.PORTFOLIO;
const state = site.state;

const FLOATERS = [
  { anchor: "#about", x: 0.9, offset: 0.1, label: "</>", color: "clay", scale: 1.15, speed: 1.3, spin: 1 },
  { anchor: "#about", x: 0.07, offset: 0.75, label: "{ }", color: "paper", scale: 0.8, speed: 0.8, spin: -1 },
  { anchor: "#skills", x: 0.93, offset: 0.05, label: "$", color: "sage", scale: 0.95, speed: 1.25, spin: 1 },
  { anchor: "#work", x: 0.05, offset: -0.05, label: "#", color: "dusk", scale: 1, speed: 0.85, spin: -1 },
  { anchor: "#services", x: 0.93, offset: 0.4, label: "px", color: "sand", scale: 0.9, speed: 1.2, spin: 1 },
  { anchor: "#contact", x: 0.88, offset: 0.05, label: "@", color: "paper", scale: 1.25, speed: 0.9, spin: -1 }
];

onReady(function () {
  const canvas = document.getElementById("floatersCanvas");
  if (!canvas || !hasWebGL() || state.reducedMotion) return;
  fontsReady().then(function () {
    init(canvas);
  });
});

function init(canvas) {
  const renderer = createRenderer(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  scene.environment = createEnvironment(renderer);
  scene.environmentIntensity = 0.7;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 20);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6b6, 1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-4, 8, 10);
  scene.add(sun);

  // On phones, keep only every other keycap and shrink them — they'd
  // otherwise cover too much of a narrow column of text.
  const config = IS_MOBILE
    ? FLOATERS.filter(function (item, index) {
        return index % 2 === 0;
      })
    : FLOATERS;

  const items = config.map(function (item) {
    const cap = createKeycap({
      color: PALETTE[item.color],
      label: item.label,
      labelColor: labelColorFor(item.color),
      fontSize: item.label.length > 1 ? 70 : 104
    });
    const scale = item.scale * (IS_MOBILE ? 0.6 : 1);
    cap.scale.setScalar(scale);
    cap.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * 0.6);
    scene.add(cap);
    return {
      config: item,
      cap: cap,
      baseRotation: cap.rotation.clone(),
      anchorY: 0,
      wobble: 0
    };
  });

  // Anchor positions change whenever ScrollTrigger adds pin spacing, so
  // they're re-measured on main.js's "portfolio:refresh" and on resize.
  function measureAnchors() {
    items.forEach(function (item) {
      const element = document.querySelector(item.config.anchor);
      item.anchorY = element ? element.getBoundingClientRect().top + window.scrollY : 0;
    });
  }

  let pxToWorld = 1;

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    pxToWorld = visibleHeight / height;
    measureAnchors();
  }
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("portfolio:refresh", measureAnchors);
  window.addEventListener("load", measureAnchors);

  const clock = new THREE.Clock();

  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    const now = clock.getElapsedTime();
    const scrollY = window.scrollY;
    const height = window.innerHeight;
    const width = window.innerWidth;
    const velocity = Math.max(-60, Math.min(60, state.scrollVelocity || 0));
    let anyVisible = false;

    items.forEach(function (item) {
      const c = item.config;
      // Lined up with its anchor when that anchor crosses mid-screen,
      // parallaxed everywhere else
      const screenY = (item.anchorY + c.offset * height - scrollY) * c.speed + (height / 2) * (1 - c.speed);
      const inView = screenY > -200 && screenY < height + 200;
      item.cap.visible = inView;
      if (!inView) return;
      anyVisible = true;

      item.cap.position.x = (c.x - 0.5) * width * pxToWorld;
      item.cap.position.y = (height / 2 - screenY) * pxToWorld + Math.sin(now * 0.9 + c.x * 10) * 0.15;

      item.wobble += (velocity * 0.012 - item.wobble) * 0.08;
      item.cap.rotation.x = item.baseRotation.x + scrollY * 0.0016 * c.spin + item.wobble;
      item.cap.rotation.y = item.baseRotation.y + scrollY * 0.0011 * c.spin + now * 0.15;
      item.cap.rotation.z = item.baseRotation.z + item.wobble * 0.5;
    });

    if (anyVisible) renderer.render(scene, camera);
    else renderer.clear();
  }
  tick();
}
