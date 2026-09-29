/*
 * Hero — a floating 3D keyboard.
 *
 * - Hover a key: it dips. Click / tap: it presses and types into the
 *   hero terminal (main.js listens for "portfolio:keypress").
 * - Physical keyboard: main.js dispatches the same event, so real
 *   keystrokes press the matching 3D keys.
 * - Drag sideways to spin it; it drifts back when let go.
 * - Terminal commands like "hire" trigger a wave (see "portfolio:command").
 * - On the intro ("portfolio:intro") every key rains down into place.
 */

import * as THREE from "three";
import {
  PALETTE,
  IS_MOBILE,
  IS_TOUCH,
  onReady,
  hasWebGL,
  fontsReady,
  createRenderer,
  createEnvironment,
  createKeycap,
  labelColorFor,
  watchVisibility,
  clamp
} from "./shared.js";

const site = window.PORTFOLIO;
const state = site.state;

function markReady() {
  state.heroReady = true;
  window.dispatchEvent(new CustomEvent("portfolio:heroready"));
}

onReady(function () {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas || !hasWebGL()) {
    document.documentElement.classList.add("no-webgl");
    markReady();
    return;
  }
  fontsReady().then(function () {
    try {
      init(canvas);
    } catch (error) {
      console.error(error);
      document.documentElement.classList.add("no-webgl");
      markReady();
    }
  });
});

function init(canvas) {
  const renderer = createRenderer(canvas, { shadows: !IS_MOBILE });
  const scene = new THREE.Scene();
  scene.environment = createEnvironment(renderer);
  scene.environmentIntensity = 0.6;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);

  // Lighting ---------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6cdbd, 0.9));

  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(-5, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // Invisible floor that only catches the keyboard's shadow
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ opacity: 0.13 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.8;
  ground.receiveShadow = true;
  scene.add(ground);

  // Keyboard layout ---------------------------------------------------------
  // rig: pointer tilt / float / scroll   board: drag spin
  const rig = new THREE.Group();
  const board = new THREE.Group();
  rig.add(board);
  scene.add(rig);

  const UNIT = 1;
  const GAP = 0.14;
  const PITCH = UNIT + GAP;
  const ROWS = [
    { offset: 0, keys: "QWERTYUIOP" },
    { offset: 0.3, keys: "ASDFGHJKL", extra: { id: "ENTER", label: "enter", width: 1.72 } },
    { offset: 0.72, keys: "ZXCVBNM", extra: { id: "BACKSPACE", label: "delete", width: 2.2 } },
    { offset: 2.62, space: true }
  ];
  // The clay keys spell H-I-R-E — the terminal hints at it
  const ACCENT = { H: "clay", I: "clay", R: "clay", E: "clay" };

  const keys = [];
  const keyMap = {};
  const bodies = [];

  ROWS.forEach(function (row, rowIndex) {
    let x = row.offset;
    const z = rowIndex * PITCH;

    function addKey(id, label, width, colorName) {
      const cap = createKeycap({
        width: width,
        depth: UNIT,
        color: PALETTE[colorName],
        label: label,
        labelColor: labelColorFor(colorName),
        fontSize: label.length > 1 ? 58 : 104
      });
      cap.position.set(x + width / 2, 0, z);
      board.add(cap);

      const key = {
        id: id,
        cap: cap,
        pos: 0,
        vel: 0,
        pressUntil: 0,
        hover: false,
        startAt: 0,
        popAt: 0
      };
      cap.userData.body.userData.key = key;
      bodies.push(cap.userData.body);
      keys.push(key);
      keyMap[id] = key;
      x += width + GAP;
    }

    if (row.space) {
      addKey("SPACE", "space", 5.8, "sand");
      return;
    }
    row.keys.split("").forEach(function (letter) {
      addKey(letter, letter, UNIT, ACCENT[letter] || "paper");
    });
    if (row.extra) addKey(row.extra.id, row.extra.label, row.extra.width, "ink");
  });

  // Center the board on its own origin so it spins in place
  const bounds = new THREE.Box3().setFromObject(board);
  const center = bounds.getCenter(new THREE.Vector3());
  board.children.forEach(function (child) {
    child.position.x -= center.x;
    child.position.z -= center.z;
  });
  const boardWidth = bounds.max.x - bounds.min.x;

  // Corners of the resting board, for measuring its on-screen height
  const corners = [];
  [bounds.min.x - center.x, bounds.max.x - center.x].forEach(function (x) {
    [-0.3, 0.3].forEach(function (y) {
      [bounds.min.z - center.z, bounds.max.z - center.z].forEach(function (z) {
        corners.push(new THREE.Vector3(x, y, z));
      });
    });
  });

  // Camera fit --------------------------------------------------------------
  // Frames the board into the free band between the headline and the
  // bottom of the hero (measured from the DOM), capped by a fraction of
  // the viewport width, then shifts the projection with setViewOffset
  // so it sits in that band instead of dead center.
  const lookTarget = new THREE.Vector3(0, 0, 0);
  const title = document.querySelector(".heroSection__title");
  const terminal = document.getElementById("terminal");
  const projected = new THREE.Vector3();

  function placeCamera(direction, distance) {
    camera.position.copy(direction).multiplyScalar(distance).add(lookTarget);
    camera.lookAt(lookTarget);
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function screenHeight(height) {
    let top = Infinity;
    let bottom = -Infinity;
    corners.forEach(function (corner) {
      projected.copy(corner).project(camera);
      const y = (1 - projected.y) / 2 * height;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    });
    return bottom - top;
  }

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;

    const isWide = width >= 992;
    const isNarrow = width < 770;
    const direction = new THREE.Vector3(0, isNarrow ? 1.45 : 1.05, 1).normalize();
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

    // Free vertical band: below the headline, above the terminal on
    // phones (on desktop the terminal sits bottom-left, beside it)
    const canvasTop = canvas.getBoundingClientRect().top;
    const bandTop = title ? title.getBoundingClientRect().bottom - canvasTop + height * 0.03 : height * 0.35;
    const bandBottom = !isWide && terminal ? terminal.getBoundingClientRect().top - canvasTop - height * 0.02 : height * 0.97;
    const band = Math.max(bandBottom - bandTop, height * 0.2);

    // 1) fit by width, 2) shrink further if taller than the band
    const fraction = isNarrow ? 0.96 : width < 1200 ? 0.66 : 0.58;
    let distance = (boardWidth * 1.06) / (fraction * 2 * tanHalf * camera.aspect);
    placeCamera(direction, distance);
    const fill = screenHeight(height) / (band * 0.86);
    if (fill > 1) {
      distance *= fill;
      placeCamera(direction, distance);
    }

    const centerY = bandTop + band / 2;
    const centerX = isWide ? width * 0.64 : width / 2;
    camera.setViewOffset(width, height, width / 2 - centerX, height / 2 - centerY, width, height);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // Key animation -----------------------------------------------------------
  const clock = new THREE.Clock();

  function press(id) {
    const key = keyMap[id];
    if (!key) return;
    key.pressUntil = clock.elapsedTime + 0.14;
    key.vel -= 0.05;
  }

  // Keys pop up in a ripple spreading out from the origin key
  function wave(originId) {
    const origin = keyMap[originId] || keyMap.H;
    const now = clock.elapsedTime;
    keys.forEach(function (key) {
      const distance = key.cap.position.distanceTo(origin.cap.position);
      key.popAt = now + distance * 0.05;
    });
  }

  function dropIn() {
    const now = clock.elapsedTime;
    keys.forEach(function (key, index) {
      key.pos = 8 + Math.random() * 4;
      key.vel = 0;
      key.startAt = now + 0.1 + index * 0.02 + Math.random() * 0.25;
    });
  }

  // Keys are hidden (well above frame) until the intro drops them in
  keys.forEach(function (key) {
    key.pos = 14;
    key.startAt = Infinity;
  });

  function updateKey(key, now) {
    if (now < key.startAt) {
      key.cap.position.y = key.pos;
      return;
    }
    if (key.popAt && now >= key.popAt) {
      key.vel += 0.42;
      key.popAt = 0;
    }
    const target = now < key.pressUntil ? -0.26 : key.hover ? -0.1 : 0;
    // Damped spring: a little bounce on landing / release
    key.vel += (target - key.pos) * 0.16;
    key.vel *= 0.78;
    key.pos += key.vel;
    key.cap.position.y = key.pos;
  }

  // Pointer: hover, click, drag-to-spin -------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let pointerInside = false;
  let hovered = null;
  let spin = 0;
  let spinVelocity = 0;
  const drag = { active: false, lastX: 0, moved: 0 };

  function setPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(bodies, false);
    return hits.length ? hits[0].object.userData.key : null;
  }

  function setHover(key) {
    if (hovered === key) return;
    if (hovered) hovered.hover = false;
    hovered = key;
    if (hovered) hovered.hover = true;
  }

  function emitPress(key) {
    window.dispatchEvent(new CustomEvent("portfolio:keypress", { detail: { key: key.id, source: "3d" } }));
  }

  canvas.addEventListener("pointermove", function (event) {
    setPointer(event);
    pointerInside = true;
    if (drag.active) {
      const dx = event.clientX - drag.lastX;
      drag.lastX = event.clientX;
      drag.moved += Math.abs(dx);
      spin += dx * 0.005;
      spinVelocity = dx * 0.005;
    }
  });

  canvas.addEventListener("pointerleave", function () {
    pointerInside = false;
    setHover(null);
  });

  canvas.addEventListener("pointerdown", function (event) {
    setPointer(event);
    drag.active = true;
    drag.lastX = event.clientX;
    drag.moved = 0;
    // Touch presses immediately — there's no hover state to rely on
    if (event.pointerType !== "mouse") {
      const key = pick();
      if (key) emitPress(key);
    }
  });

  function endDrag(event) {
    if (!drag.active) return;
    drag.active = false;
    if (event.pointerType === "mouse" && drag.moved < 6 && hovered) emitPress(hovered);
  }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", function () {
    drag.active = false;
  });

  window.addEventListener("pointermove", function (event) {
    tilt.tx = (event.clientX / window.innerWidth) * 2 - 1;
    tilt.ty = (event.clientY / window.innerHeight) * 2 - 1;
  });

  // Events from main.js -----------------------------------------------------
  window.addEventListener("portfolio:keypress", function (event) {
    press(event.detail.key);
  });

  window.addEventListener("portfolio:command", function (event) {
    const command = event.detail.command;
    if (["hire", "contact", "hello", "hi", "wave"].indexOf(command) !== -1) wave("H");
    else if (!event.detail.known) wave(command.charAt(0).toUpperCase());
  });

  if (state.introPlayed) dropIn();
  window.addEventListener("portfolio:intro", dropIn);

  // Render loop -------------------------------------------------------------
  let visible = true;
  watchVisibility(canvas, function (isVisible) {
    visible = isVisible;
  });

  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const now = clock.getElapsedTime();

    if (pointerInside && !IS_TOUCH && !drag.active) setHover(pick());
    canvas.classList.toggle("is-pointing", !!hovered);

    keys.forEach(function (key) {
      updateKey(key, now);
    });

    // Spin with inertia, easing back to its resting angle
    if (!drag.active) {
      spin += spinVelocity;
      spinVelocity *= 0.93;
      spin *= 0.975;
    }
    board.rotation.y = spin;

    tilt.x += (tilt.tx - tilt.x) * 0.05;
    tilt.y += (tilt.ty - tilt.y) * 0.05;

    const scroll = clamp(window.scrollY / window.innerHeight, 0, 1.2);
    rig.rotation.y = tilt.x * 0.14;
    rig.rotation.x = tilt.y * 0.08 + scroll * 0.55;
    rig.rotation.z = Math.sin(now * 0.5) * 0.015;
    rig.position.y = Math.sin(now * 0.8) * 0.12 + scroll * 2.6;

    renderer.render(scene, camera);
  }

  renderer.render(scene, camera);
  markReady();
  tick();
}
