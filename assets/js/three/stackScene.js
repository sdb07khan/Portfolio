/*
 * Stack — "Anatomy of a website".
 *
 * Six slabs (PORTFOLIO.stackLayers, top → bottom) start as one compact
 * block, separate as the pinned section scrolls, then each one slides
 * forward in turn while main.js cross-fades the matching text step.
 * At the end they close back into a single block. Drag to spin.
 *
 * Reads state.stackProgress (0–1) and state.stackStep, both written by
 * the ScrollTrigger in main.js.
 */

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  PALETTE,
  IS_MOBILE,
  onReady,
  hasWebGL,
  fontsReady,
  createRenderer,
  createEnvironment,
  watchVisibility,
  smoothstep,
} from "./shared.js";

const site = window.PORTFOLIO;
const state = site.state;

onReady(function () {
  const canvas = document.getElementById("stackCanvas");
  if (!canvas || !hasWebGL()) return;
  fontsReady().then(function () {
    init(canvas);
  });
});

// ---- Top-face drawings, one per layer kind --------------------------------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const DRAW = {
  interaction: function (ctx, w, h, ink) {
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = 5;
    const nodes = [
      [200, 460],
      [440, 240],
      [680, 420],
      [860, 200],
    ];
    ctx.beginPath();
    ctx.moveTo(nodes[0][0], nodes[0][1]);
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const node = nodes[i];
      ctx.bezierCurveTo(
        prev[0] + 120,
        prev[1],
        node[0] - 120,
        node[1],
        node[0],
        node[1],
      );
    }
    ctx.stroke();
    nodes.forEach(function (node) {
      ctx.beginPath();
      ctx.arc(node[0], node[1], 18, 0, Math.PI * 2);
      ctx.fill();
    });
    // Cursor arrow
    ctx.beginPath();
    ctx.moveTo(600, 470);
    ctx.lineTo(600, 580);
    ctx.lineTo(628, 552);
    ctx.lineTo(650, 600);
    ctx.lineTo(668, 592);
    ctx.lineTo(646, 546);
    ctx.lineTo(686, 546);
    ctx.closePath();
    ctx.fill();
    ctx.font = '500 44px "Geist Mono"';
    ctx.fillText("onClick()", 90, 130);
  },
  style: function (ctx, w, h, ink) {
    const swatches = [
      PALETTE.ink,
      PALETTE.clay,
      PALETTE.sage,
      PALETTE.dusk,
      PALETTE.paper,
    ];
    swatches.forEach(function (color, i) {
      ctx.fillStyle = color;
      roundRect(ctx, 90 + i * 124, 380, 100, 180, 20);
      ctx.fill();
    });
    ctx.fillStyle = ink;
    ctx.font = 'italic 220px "Instrument Serif"';
    ctx.fillText("Aa", 90, 290);
    ctx.font = '500 40px "Geist Mono"';
    ctx.fillText("--color-clay", 620, 150);
    ctx.fillText("gap: 2.4rem", 620, 220);
  },
  structure: function (ctx, w, h, ink) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    roundRect(ctx, 80, 70, w - 160, 70, 14);
    ctx.stroke();
    roundRect(ctx, 80, 170, w - 160, 200, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(80, 170);
    ctx.lineTo(w - 80, 370);
    ctx.moveTo(w - 80, 170);
    ctx.lineTo(80, 370);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      roundRect(ctx, 80 + i * 296, 400, 272, 190, 14);
      ctx.stroke();
    }
    ctx.fillStyle = ink;
    ctx.font = '500 38px "Geist Mono"';
    ctx.fillText("<main>", 104, 120);
  },
  backend: function (ctx, w, h, ink) {
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = 5;
    // Database cylinder
    ctx.beginPath();
    ctx.ellipse(220, 200, 120, 40, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(100, 200);
    ctx.lineTo(100, 460);
    ctx.ellipse(220, 460, 120, 40, 0, Math.PI, 0, true);
    ctx.lineTo(340, 200);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(220, 330, 120, 40, 0, 0, Math.PI);
    ctx.stroke();
    // Table rows
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = i === 0 ? 1 : 0.55;
      roundRect(ctx, 440, 150 + i * 82, 500, 52, 10);
      i === 0 ? ctx.fill() : ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.font = '500 44px "Geist Mono"';
    ctx.fillText("<?php", 100, 600);
  },
  server: function (ctx, w, h, ink) {
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      const y = 90 + i * 150;
      roundRect(ctx, 90, y, w - 180, 120, 16);
      ctx.stroke();
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.arc(150 + j * 44, y + 60, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let j = 0; j < 6; j++) {
        ctx.fillRect(560 + j * 56, y + 34, 26, 52);
      }
    }
    ctx.font = '500 44px "Geist Mono"';
    ctx.fillText("200 OK", 90, 620);
  },
  domain: function (ctx, w, h, ink) {
    ctx.fillStyle = ink;
    ctx.font = '500 84px "Geist Mono"';
    ctx.fillText("ksaddab@gmail.com", 90, 190);
    ctx.font = '400 38px "Geist Mono"';
    const records = [
      "A      @    76.76.21.21",
      "CNAME  www  ksaddab@gmail.com",
      "MX     @    mail.host",
      "TXT    @    v=spf1 …",
    ];
    records.forEach(function (record, i) {
      ctx.globalAlpha = 0.75;
      ctx.fillText(record, 90, 300 + i * 70);
    });
    ctx.globalAlpha = 1;
    // Padlock (SSL)
    ctx.strokeStyle = ink;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(890, 120, 34, Math.PI, 0);
    ctx.stroke();
    roundRect(ctx, 840, 120, 100, 80, 12);
    ctx.fill();
  },
};

function makeTopTexture(layer, width, depth) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = Math.round(1024 * (depth / width));
  const ctx = canvas.getContext("2d");
  // Light slabs get dark drawings and vice versa
  const lightSlabs = ["style", "structure"];
  const ink =
    lightSlabs.indexOf(layer.kind) !== -1 ? PALETTE.inkText : PALETTE.paperText;
  ctx.globalAlpha = 1;
  (DRAW[layer.kind] || function () {})(ctx, canvas.width, canvas.height, ink);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// ---- Scene ---------------------------------------------------------------

function init(canvas) {
  const layers = site.stackLayers;
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = createEnvironment(renderer);
  scene.environmentIntensity = 0.7;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3935, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(5, 10, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd5c3a3, 1.2);
  rim.position.set(-8, 2, -6);
  scene.add(rim);

  const SLAB = { width: 6.2, height: 0.34, depth: 4 };
  const geometry = new RoundedBoxGeometry(
    SLAB.width,
    SLAB.height,
    SLAB.depth,
    4,
    0.1,
  );
  const topGeometry = new THREE.PlaneGeometry(
    SLAB.width * 0.96,
    SLAB.depth * 0.96,
  );

  const rig = new THREE.Group();
  scene.add(rig);

  const dim = new THREE.Color("#141413");
  const slabs = layers.map(function (layer) {
    const group = new THREE.Group();
    const baseColor = new THREE.Color(layer.color);
    const material = new THREE.MeshPhysicalMaterial({
      color: baseColor.clone(),
      roughness: 0.5,
      clearcoat: 0.4,
      clearcoatRoughness: 0.5,
    });
    group.add(new THREE.Mesh(geometry, material));

    const topMaterial = new THREE.MeshStandardMaterial({
      map: makeTopTexture(layer, SLAB.width, SLAB.depth),
      transparent: true,
      roughness: 0.6,
      depthWrite: false,
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.rotation.x = -Math.PI / 2;
    top.position.y = SLAB.height / 2 + 0.004;
    group.add(top);

    rig.add(group);
    return {
      group: group,
      material: material,
      topMaterial: topMaterial,
      baseColor: baseColor,
      offset: new THREE.Vector3(),
      dim: 0,
    };
  });

  // Camera fit --------------------------------------------------------------
  let narrow = false;

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    narrow = width < 992;

    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // Fit the fully exploded stack's height, and its diagonal width
    const explodedHeight =
      layers.length * (SLAB.height + (narrow ? 0.9 : 1.15)) + 1.6;
    const fitHeight = explodedHeight / ((narrow ? 0.42 : 0.8) * 2 * tanHalf);
    const fitWidth =
      (SLAB.width * 1.25) /
      ((narrow ? 0.9 : 0.5) * 2 * tanHalf * camera.aspect);
    const distance = Math.max(fitHeight, fitWidth);

    camera.position.set(0, distance * 0.36, distance);
    camera.lookAt(0, 0, 0);

    if (narrow) {
      // Centered in the free band between the heading and the steps
      const canvasTop = canvas.getBoundingClientRect().top;
      const head = document.querySelector(".stackSection__head");
      const bottom = document.querySelector(".stackSection__bottom");
      const bandTop = head
        ? head.getBoundingClientRect().bottom - canvasTop
        : height * 0.2;
      const bandBottom = bottom
        ? bottom.getBoundingClientRect().top - canvasTop
        : height * 0.6;
      camera.setViewOffset(
        width,
        height,
        0,
        height / 2 - (bandTop + bandBottom) / 2,
        width,
        height,
      );
    } else {
      camera.setViewOffset(width, height, -width * 0.2, 0, width, height);
    }
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // Drag to spin ------------------------------------------------------------
  let spin = 0;
  let spinVelocity = 0;
  const drag = { active: false, lastX: 0 };

  canvas.addEventListener("pointerdown", function (event) {
    drag.active = true;
    drag.lastX = event.clientX;
  });
  window.addEventListener("pointermove", function (event) {
    if (!drag.active) return;
    const dx = event.clientX - drag.lastX;
    drag.lastX = event.clientX;
    spin += dx * 0.006;
    spinVelocity = dx * 0.006;
  });
  window.addEventListener("pointerup", function () {
    drag.active = false;
  });
  window.addEventListener("pointercancel", function () {
    drag.active = false;
  });

  // Render loop -------------------------------------------------------------
  let visible = false;
  watchVisibility(canvas, function (isVisible) {
    visible = isVisible;
  });

  const clock = new THREE.Clock();
  const inverse = new THREE.Quaternion();
  const forward = new THREE.Vector3();
  let progress = 0;

  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const now = clock.getElapsedTime();

    progress += (state.stackProgress - progress) * 0.08;

    // Separate between 2–14% of the pin, close again after 90%
    const explode =
      smoothstep(0.02, 0.14, progress) * (1 - smoothstep(0.9, 0.99, progress));
    const gap = SLAB.height + 0.06 + explode * (narrow ? 0.9 : 1.15);
    const activeIndex =
      state.stackStep >= 1 && state.stackStep <= layers.length
        ? state.stackStep - 1
        : -1;

    if (!drag.active) {
      spin += spinVelocity;
      spinVelocity *= 0.94;
    }
    rig.rotation.y =
      -0.7 + progress * Math.PI * 1.15 + spin + Math.sin(now * 0.4) * 0.04;
    rig.rotation.x = 0.12 + Math.sin(now * 0.3) * 0.02;
    rig.position.y = Math.sin(now * 0.7) * 0.08;

    // "Towards the camera" in the rig's local space, so the active slab
    // always slides out at the viewer whatever angle the stack is at
    inverse.copy(rig.quaternion).invert();
    forward.set(0, 0.25, narrow ? 1.5 : 2.4).applyQuaternion(inverse);

    slabs.forEach(function (slab, index) {
      const isActive = index === activeIndex;
      const targetY = ((layers.length - 1) / 2 - index) * gap;
      const out = isActive ? 1 : 0;

      slab.offset.x += (forward.x * out - slab.offset.x) * 0.08;
      slab.offset.z += (forward.z * out - slab.offset.z) * 0.08;
      slab.group.position.x = slab.offset.x;
      slab.group.position.z = slab.offset.z;
      slab.group.position.y +=
        (targetY + forward.y * out - slab.group.position.y) * 0.1;

      // Dim the slabs that aren't being talked about
      const targetDim = activeIndex !== -1 && !isActive ? 0.55 : 0;
      slab.dim += (targetDim - slab.dim) * 0.08;
      slab.material.color.copy(slab.baseColor).lerp(dim, slab.dim);
      slab.topMaterial.opacity = 1 - slab.dim * 0.8;
    });

    renderer.render(scene, camera);
  }

  tick();
}
