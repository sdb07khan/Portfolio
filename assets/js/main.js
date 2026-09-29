/*
 * Portfolio — page behaviour.
 * Handles: smooth scroll (Lenis) + ScrollTrigger, preloader, hero
 * intro + terminal, header, custom cursor, magnetic buttons, text
 * reveals, marquee, the pinned stack section's steps, the skills
 * physics box (Matter.js), the work gallery, score rings and contact.
 *
 * Content comes from window.PORTFOLIO (assets/js/data.js). The 3D
 * scenes (assets/js/three/) read the shared `state` object and listen
 * for the "portfolio:*" events dispatched here.
 */

document.addEventListener("DOMContentLoaded", function () {
  const site = window.PORTFOLIO;
  const state = site.state;
  const reducedMotion = state.reducedMotion;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  if (typeof gsap === "undefined") {
    // CDN failed — show the page as plain content rather than a stuck preloader
    document.documentElement.classList.remove("is-loading");
    const preloaderEl = document.getElementById("preloader");
    if (preloaderEl) preloaderEl.remove();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail }));
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  // Smooth scroll ------------------------------------------------------------
  let lenis = null;
  if (!reducedMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    lenis.on("scroll", function (event) {
      state.scrollVelocity = event.velocity;
      ScrollTrigger.update();
    });
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  site.scrollTo = function (target) {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    if (!element) return;
    if (lenis) lenis.scrollTo(element, { duration: 1.6 });
    else element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  // The 3D floaters re-measure their anchors after every refresh
  ScrollTrigger.addEventListener("refresh", function () {
    emit("portfolio:refresh");
  });

  // Word splitting ------------------------------------------------------------
  // Wraps each word in <span class="{name}"><span class="{name}__inner">,
  // keeping inline elements like <em> intact around their words.
  function splitWords(root, className) {
    const words = [];

    function walk(node, parent) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            parent.appendChild(document.createTextNode(" "));
            return;
          }
          const outer = document.createElement("span");
          outer.className = className;
          const inner = document.createElement("span");
          inner.className = className + "__inner";
          inner.textContent = part;
          outer.appendChild(inner);
          parent.appendChild(outer);
          words.push(inner);
        });
      } else if (node.nodeType === 1) {
        const clone = node.cloneNode(false);
        parent.appendChild(clone);
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          walk(child, clone);
        });
      }
    }

    const children = Array.prototype.slice.call(root.childNodes);
    root.textContent = "";
    children.forEach(function (child) {
      walk(child, root);
    });
    return words;
  }

  // Render data-driven sections ---------------------------------------------
  // (done before any ScrollTrigger is created, so pins measure real sizes)

  // Stack steps: intro, one per layer, outro
  const stackSteps = document.getElementById("stackSteps");
  const stackCount = document.getElementById("stackCount");
  const stackBar = document.getElementById("stackBar");
  const stackTotal = document.getElementById("stackTotal");
  const layers = site.stackLayers;
  const stepElements = [];

  function addStep(eyebrow, title, text, tags, color) {
    const step = document.createElement("article");
    step.className = "stackStep";
    if (color) step.style.setProperty("--layer-color", color);
    step.innerHTML =
      '<p class="stackStep__eyebrow"></p><h3 class="stackStep__title"></h3><p class="stackStep__text"></p>' +
      (tags && tags.length ? '<ul class="stackStep__tags"></ul>' : "");
    step.querySelector(".stackStep__eyebrow").textContent = eyebrow;
    step.querySelector(".stackStep__title").textContent = title;
    step.querySelector(".stackStep__text").textContent = text;
    if (tags) {
      const list = step.querySelector(".stackStep__tags");
      tags.forEach(function (tag) {
        const item = document.createElement("li");
        item.textContent = tag;
        list.appendChild(item);
      });
    }
    stackSteps.appendChild(step);
    stepElements.push(step);
  }

  if (stackSteps) {
    addStep("Scroll", "Every website is a stack.", "Most developers own one or two layers. Keep scrolling to take one apart.", null, "#d5c3a3");
    layers.forEach(function (layer, index) {
      addStep(pad(index + 1) + " — " + layer.label, layer.title, layer.text, layer.tags, layer.color);
    });
    addStep("All together", "Fewer hand-offs. Fewer surprises.", "One person who understands every layer means faster fixes and no finger-pointing when something breaks.", null, "#b4654a");
    stackTotal.textContent = pad(layers.length);
    stepElements[0].classList.add("is-active");
  }

  // Skills: chips, legend and a screen-reader list
  const skillsBox = document.getElementById("skillsBox");
  const skillsLegend = document.getElementById("skillsLegend");
  const skillsList = document.getElementById("skillsList");
  const chips = [];

  site.skills.forEach(function (skill) {
    const chip = document.createElement("span");
    chip.className = "skillChip skillChip--" + skill.group + (skill.size === "lg" ? " skillChip--lg" : "");
    chip.textContent = skill.name;
    skillsBox.appendChild(chip);
    chips.push({ el: chip, skill: skill });

    const item = document.createElement("li");
    item.textContent = skill.name;
    skillsList.appendChild(item);
  });

  site.skillGroups.forEach(function (group) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "skillsLegend__btn skillsLegend__btn--" + group.id;
    button.textContent = group.label;
    button.addEventListener("click", function () {
      shakeGroup(group.id);
    });
    button.addEventListener("pointerenter", function () {
      highlightGroup(group.id);
    });
    button.addEventListener("pointerleave", function () {
      highlightGroup(null);
    });
    skillsLegend.appendChild(button);
  });

  function highlightGroup(groupId) {
    chips.forEach(function (chip) {
      chip.el.classList.toggle("is-dim", !!groupId && chip.skill.group !== groupId);
    });
  }

  // Work cards
  const workTrack = document.getElementById("workTrack");
  const workCount = document.getElementById("workCount");

  site.projects.forEach(function (project, index) {
    const card = document.createElement("article");
    card.className = "workCard";
    const external = project.url && project.url !== "#";
    card.innerHTML =
      '<a class="workCard__link" data-cursor="view">' +
      '<div class="workCard__media"><img class="workCard__image" loading="lazy" alt="" /><span class="workCard__view">View project ↗</span></div>' +
      '<div class="workCard__info">' +
      '<span class="workCard__index"></span><h3 class="workCard__title"></h3><span class="workCard__year"></span>' +
      '<p class="workCard__desc"></p><ul class="workCard__tags"></ul>' +
      "</div></a>";

    const link = card.querySelector(".workCard__link");
    link.href = project.url || "#";
    if (external) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    const image = card.querySelector(".workCard__image");
    image.src = project.image;
    image.alt = project.title + " — " + project.type;
    card.querySelector(".workCard__index").textContent = pad(index + 1);
    card.querySelector(".workCard__title").textContent = project.title;
    card.querySelector(".workCard__year").textContent = project.year;
    card.querySelector(".workCard__desc").textContent = project.type + " — " + project.description;
    const tags = card.querySelector(".workCard__tags");
    project.stack.forEach(function (tag) {
      const item = document.createElement("li");
      item.textContent = tag;
      tags.appendChild(item);
    });
    workTrack.appendChild(card);
  });

  const nextCard = document.createElement("article");
  nextCard.className = "workCard workCard--next";
  nextCard.innerHTML =
    '<a class="workCard__link" href="#contact" data-cursor="hello"><div class="workCard__media">' +
    '<p class="workCard__nextTitle">Your project <em>could be next.</em></p>' +
    '<span class="workCard__nextCta">Start a conversation →</span>' +
    "</div></a>";
  workTrack.appendChild(nextCard);
  workCount.textContent = pad(site.projects.length) + " projects — more on the way";

  // Anchor links ----------------------------------------------------------------
  const mobileMenu = document.getElementById("mobileMenu");
  const menuToggle = document.getElementById("menuToggle");
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "Close" : "Menu";
    header.classList.toggle("is-menuOpen", open);
    if (open) {
      mobileMenu.hidden = false;
      requestAnimationFrame(function () {
        mobileMenu.classList.add("is-open");
      });
      if (lenis) lenis.stop();
    } else {
      mobileMenu.classList.remove("is-open");
      window.setTimeout(function () {
        if (!menuOpen) mobileMenu.hidden = true;
      }, 800);
      if (lenis) lenis.start();
    }
  }

  menuToggle.addEventListener("click", function () {
    setMenu(!menuOpen);
  });

  document.addEventListener("click", function (event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    if (hash === "#") return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    if (menuOpen) setMenu(false);
    site.scrollTo(target);
  });

  // Header: hide on scroll down, show on scroll up ---------------------------
  const header = document.getElementById("siteHeader");
  let lastScroll = 0;

  function onScroll(y) {
    header.classList.toggle("is-hidden", y > lastScroll && y > 240 && !menuOpen);
    header.classList.toggle("is-scrolled", y > 40);
    lastScroll = y;
  }

  // Liquid glass: SVG refraction only where backdrop-filter: url() is
  // actually rendered (Chromium); the sheen follows the pointer.
  if (navigator.userAgentData && navigator.userAgentData.brands.some(function (b) { return /Chromium/.test(b.brand); })) {
    document.documentElement.classList.add("has-liquid");
  }
  const headerGlass = document.getElementById("headerGlass");
  header.addEventListener("pointermove", function (event) {
    const rect = headerGlass.getBoundingClientRect();
    headerGlass.style.setProperty("--glass-x", ((event.clientX - rect.left) / rect.width) * 100 + "%");
  });
  if (lenis) {
    lenis.on("scroll", function (event) {
      onScroll(event.scroll);
    });
  } else {
    window.addEventListener("scroll", function () {
      onScroll(window.scrollY);
    }, { passive: true });
  }

  // Custom cursor ----------------------------------------------------------------
  if (finePointer) {
    const cursor = document.getElementById("cursor");
    const cursorLabel = cursor.querySelector(".cursor__label");
    document.documentElement.classList.add("has-cursor");
    const moveX = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const moveY = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });

    window.addEventListener("pointermove", function (event) {
      moveX(event.clientX);
      moveY(event.clientY);
    });

    document.addEventListener("pointerover", function (event) {
      const labelled = event.target.closest("[data-cursor]");
      const interactive = event.target.closest("a, button, input, .skillsLegend__btn");
      const label = labelled ? labelled.getAttribute("data-cursor") : "";
      cursorLabel.textContent = label;
      cursor.classList.toggle("is-label", !!label);
      cursor.classList.toggle("is-big", label === "view" || label === "hello");
      cursor.classList.toggle("is-hover", !label && !!interactive);
    });

    document.addEventListener("pointerleave", function () {
      cursor.classList.remove("is-label", "is-big", "is-hover");
    });

    // Magnetic buttons
    document.querySelectorAll(".magnetic").forEach(function (element) {
      const toX = gsap.quickTo(element, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const toY = gsap.quickTo(element, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      element.addEventListener("pointermove", function (event) {
        const rect = element.getBoundingClientRect();
        toX((event.clientX - rect.left - rect.width / 2) * 0.25);
        toY((event.clientY - rect.top - rect.height / 2) * 0.35);
      });
      element.addEventListener("pointerleave", function () {
        toX(0);
        toY(0);
      });
    });
  }

  // Terminal -----------------------------------------------------------------------
  const terminalInput = document.getElementById("terminalInput");
  const terminalOutput = document.getElementById("terminalOutput");
  const heroSection = document.getElementById("top");
  let ghostTimer = null;
  let visitorTyped = false;

  function print(text, type) {
    const line = document.createElement("p");
    line.className = "terminal__line" + (type ? " terminal__line--" + type : "");
    line.textContent = text;
    terminalOutput.appendChild(line);
    while (terminalOutput.children.length > 3) terminalOutput.removeChild(terminalOutput.firstChild);
  }

  function goTo(selector, delay) {
    window.setTimeout(function () {
      site.scrollTo(selector);
    }, delay || 500);
  }

  const COMMANDS = {
    help: function () {
      return ["about  skills  work  stack  contact", "psst — the clay keys spell a command."];
    },
    about: function () {
      return [site.owner.name + " — " + site.owner.tagline];
    },
    skills: function () {
      goTo("#skills", 900);
      return [site.skills.slice(0, 8).map(function (s) { return s.name; }).join(" · ") + " …"];
    },
    work: function () {
      goTo("#work");
      return ["opening selected work…"];
    },
    stack: function () {
      goTo("#stack");
      return ["taking a website apart…"];
    },
    contact: function () {
      goTo("#contact", 700);
      return [site.owner.email];
    },
    hire: function () {
      goTo("#contact", 1100);
      return ["great choice. let's talk →"];
    },
    hello: function () {
      return ["hey — thanks for stopping by."];
    },
    hi: function () {
      return ["hey — thanks for stopping by."];
    },
    sudo: function () {
      return ["nice try — permission denied."];
    },
    ls: function () {
      return ["about/  stack/  skills/  work/  contact/"];
    },
    clear: function () {
      terminalOutput.textContent = "";
      return [];
    }
  };

  function runCommand(raw) {
    const command = raw.trim().toLowerCase();
    if (!command) return;
    print("$ " + command, "cmd");
    const handler = COMMANDS[command];
    const output = handler ? handler() : ["command not found: " + command + " — try help"];
    output.forEach(function (line, index) {
      print(line, command === "hire" || (index === 1 && command === "help") ? "accent" : null);
    });
    emit("portfolio:command", { command: command, known: !!handler });
  }

  function stopGhost() {
    visitorTyped = true;
    if (ghostTimer) {
      window.clearTimeout(ghostTimer);
      ghostTimer = null;
    }
  }

  // Typing into the input directly
  terminalInput.addEventListener("keydown", function (event) {
    stopGhost();
    if (event.key === "Enter") {
      runCommand(terminalInput.value);
      terminalInput.value = "";
    }
  });

  // Clicks / taps on 3D keys type into the input without focusing it
  // (so phones don't pop open their own keyboard)
  window.addEventListener("portfolio:keypress", function (event) {
    if (event.detail.source !== "3d") return;
    stopGhost();
    const key = event.detail.key;
    if (key === "ENTER") {
      runCommand(terminalInput.value);
      terminalInput.value = "";
    } else if (key === "BACKSPACE") {
      terminalInput.value = terminalInput.value.slice(0, -1);
    } else if (key === "SPACE") {
      terminalInput.value += " ";
    } else if (terminalInput.value.length < 32) {
      terminalInput.value += key.toLowerCase();
    }
  });

  // Physical keyboard presses the matching 3D keys while the hero is on
  // screen, and letters jump straight into the terminal.
  new IntersectionObserver(function (entries) {
    state.heroVisible = entries[0].isIntersecting;
  }, { threshold: 0.25 }).observe(heroSection);

  document.addEventListener("keydown", function (event) {
    if (!state.heroVisible || event.metaKey || event.ctrlKey || event.altKey) return;
    let id = null;
    if (/^[a-z]$/i.test(event.key)) id = event.key.toUpperCase();
    else if (event.key === "Enter") id = "ENTER";
    else if (event.key === "Backspace") id = "BACKSPACE";
    else if (event.key === " ") id = "SPACE";
    if (!id) return;

    emit("portfolio:keypress", { key: id, source: "keyboard" });

    const typingElsewhere = event.target.matches && event.target.matches("input, textarea, select, button") && event.target !== terminalInput;
    // Not focused yet: take focus and add the letter ourselves (browsers
    // disagree on whether a keystroke follows focus moved mid-keydown)
    if (!typingElsewhere && document.activeElement !== terminalInput && id.length === 1) {
      event.preventDefault();
      stopGhost();
      terminalInput.focus({ preventScroll: true });
      if (terminalInput.value.length < 32) terminalInput.value += event.key.toLowerCase();
    }
  });

  // After the intro, the keyboard types "help" by itself to show off
  function ghostType(word, done) {
    let index = 0;
    function next() {
      if (index < word.length) {
        const letter = word.charAt(index).toUpperCase();
        emit("portfolio:keypress", { key: letter, source: "ghost" });
        terminalInput.value += word.charAt(index);
        index += 1;
        ghostTimer = window.setTimeout(next, 170);
      } else {
        ghostTimer = window.setTimeout(function () {
          emit("portfolio:keypress", { key: "ENTER", source: "ghost" });
          terminalInput.value = "";
          ghostTimer = null;
          done();
        }, 260);
      }
    }
    next();
  }

  // Preloader + intro -----------------------------------------------------------
  const preloader = document.getElementById("preloader");
  const preloaderCount = document.getElementById("preloaderCount");
  const preloaderLines = document.querySelectorAll("#preloaderLog li");
  const load = { value: 0 };
  let fontsLoaded = false;
  let forced = false;

  if (lenis) lenis.stop();
  document.fonts.ready.then(function () {
    fontsLoaded = true;
  });
  window.setTimeout(function () {
    forced = true;
  }, 6000);

  function renderLoad() {
    const value = Math.round(load.value);
    preloaderCount.textContent = value;
    preloaderLines.forEach(function (line, index) {
      line.classList.toggle("is-visible", value >= index * 22);
    });
  }

  gsap.to(load, {
    value: 88,
    duration: reducedMotion ? 0.3 : 1.8,
    ease: "power2.inOut",
    onUpdate: renderLoad,
    onComplete: waitForAssets
  });

  function waitForAssets() {
    if ((state.heroReady && fontsLoaded) || forced) {
      gsap.to(load, { value: 100, duration: 0.4, ease: "power2.out", onUpdate: renderLoad, onComplete: revealPage });
    } else {
      window.setTimeout(waitForAssets, 120);
    }
  }

  const heroLines = document.querySelectorAll(".heroSection__lineInner");
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set([".heroSection__eyebrow", ".terminal", ".heroSection__aside", ".siteHeader"], { autoAlpha: 0, y: 20 });

  function revealPage() {
    const timeline = gsap.timeline({
      onComplete: function () {
        preloader.remove();
        document.documentElement.classList.remove("is-loading");
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    });
    timeline
      .to(".preloader__log, .preloader__count, .preloader__corner", { autoAlpha: 0, y: -20, duration: 0.5, ease: "power2.in", stagger: 0.02 })
      .to(preloader, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=0.1")
      .add(function () {
        state.introPlayed = true;
        emit("portfolio:intro");
      }, "-=0.7")
      .to(heroLines, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.09 }, "-=0.55")
      .to([".siteHeader", ".heroSection__eyebrow"], { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out" }, "-=1.1")
      .to([".terminal", ".heroSection__aside"], { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.1 }, "-=0.9")
      .add(function () {
        print("hi, I'm " + site.owner.name.split(" ")[0] + ". this keyboard works — try it.", "accent");
        if (!reducedMotion && !visitorTyped) {
          ghostTimer = window.setTimeout(function () {
            if (visitorTyped) return;
            ghostType("help", function () {
              runCommand("help");
            });
          }, 1400);
        }
      });
  }

  // Scroll animations ------------------------------------------------------------

  // Headings: words slide up
  document.querySelectorAll(".js-split").forEach(function (heading) {
    const words = splitWords(heading, "splitWord");
    if (reducedMotion) return;
    gsap.from(words, {
      yPercent: 110,
      duration: 1.2,
      ease: "expo.out",
      stagger: 0.05,
      scrollTrigger: { trigger: heading, start: "top 85%" }
    });
  });

  // About statement: words fade from faint to full as you read
  document.querySelectorAll(".js-fill").forEach(function (paragraph) {
    const words = splitWords(paragraph, "fillWord");
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1,
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: paragraph, start: "top 80%", end: "bottom 45%", scrub: true }
    });
  });

  // Generic fade-up
  if (!reducedMotion) {
    gsap.utils.toArray(".reveal").forEach(function (element) {
      gsap.from(element, {
        autoAlpha: 0,
        y: 50,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: element, start: "top 90%" }
      });
    });
  }

  // Marquee: constant drift that speeds up with scroll velocity
  const marqueeTrack = document.querySelector(".marquee__track");
  if (marqueeTrack && !reducedMotion) {
    const marquee = gsap.to(marqueeTrack, { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
    gsap.ticker.add(function () {
      const boost = 1 + Math.min(Math.abs(state.scrollVelocity || 0) * 0.12, 5);
      marquee.timeScale(marquee.timeScale() + (boost - marquee.timeScale()) * 0.1);
    });
  }

  // Stack: pinned, scrubbed through its steps
  function stepFor(progress) {
    const INTRO_END = 0.12;
    const OUTRO_START = 0.9;
    if (progress < INTRO_END) return 0;
    if (progress >= OUTRO_START) return layers.length + 1;
    return 1 + Math.min(layers.length - 1, Math.floor(((progress - INTRO_END) / (OUTRO_START - INTRO_END)) * layers.length));
  }

  if (stackSteps) {
    ScrollTrigger.create({
      trigger: "#stack",
      start: "top top",
      end: function () {
        return "+=" + window.innerHeight * (layers.length + 1);
      },
      pin: true,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        state.stackProgress = self.progress;
        const step = stepFor(self.progress);
        stackBar.style.transform = "scaleX(" + self.progress + ")";
        if (step !== state.stackStep) {
          state.stackStep = step;
          stepElements.forEach(function (element, index) {
            element.classList.toggle("is-active", index === step);
          });
          stackCount.textContent = pad(Math.min(step, layers.length));
        }
      }
    });
  }

  // Header turns light while it's over a dark section. Created after
  // the stack pin, so the stack is measured by its pin-spacer (which
  // includes the pinned scroll distance).
  // Light if ANY dark section is under it — recomputed from all of
  // them on every toggle, so a long jump (nav link, back to top) that
  // skips past a section can't leave the class stuck on.
  const darkZones = [];
  function updateHeaderTone() {
    header.classList.toggle("is-light", darkZones.some(function (zone) {
      return zone.isActive;
    }));
  }
  document.querySelectorAll(".stackSection, .contactSection").forEach(function (section) {
    const parent = section.parentElement;
    darkZones.push(ScrollTrigger.create({
      trigger: parent.classList.contains("pin-spacer") ? parent : section,
      start: "top 4%",
      end: "bottom 4%",
      // Measured after every pin (incl. the work gallery further down)
      refreshPriority: -1,
      onToggle: updateHeaderTone,
      onRefresh: updateHeaderTone
    }));
  });

  // Work: horizontal gallery on desktop, stacked cards below 992px
  const media = gsap.matchMedia();
  media.add("(min-width: 992px)", function () {
    const distance = function () {
      return Math.max(0, workTrack.scrollWidth - window.innerWidth);
    };
    const slide = gsap.to(workTrack, {
      x: function () {
        return -distance();
      },
      ease: "none",
      scrollTrigger: {
        trigger: "#work",
        start: "top top",
        end: function () {
          return "+=" + distance();
        },
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
    workTrack.querySelectorAll(".workCard__image").forEach(function (image) {
      gsap.fromTo(image, { xPercent: -6 }, {
        xPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: image.parentNode, containerAnimation: slide, start: "left right", end: "right left", scrub: true }
      });
    });
  });
  media.add("(max-width: 991px)", function () {
    if (reducedMotion) return;
    workTrack.querySelectorAll(".workCard").forEach(function (card) {
      gsap.from(card, { autoAlpha: 0, y: 60, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 88%" } });
    });
  });

  // Score rings count up to 100
  document.querySelectorAll(".scoreRing").forEach(function (ring, index) {
    const circle = ring.querySelector(".scoreRing__progress");
    const value = ring.querySelector(".scoreRing__value");
    const length = 2 * Math.PI * 44;
    circle.style.strokeDasharray = length;
    circle.style.strokeDashoffset = length;
    ScrollTrigger.create({
      trigger: ring,
      start: "top 88%",
      once: true,
      onEnter: function () {
        const counter = { v: 0 };
        gsap.to(circle, { strokeDashoffset: 0, duration: 2, delay: index * 0.12, ease: "expo.out" });
        gsap.to(counter, {
          v: 100,
          duration: 2,
          delay: index * 0.12,
          ease: "expo.out",
          onUpdate: function () {
            value.textContent = Math.round(counter.v);
          }
        });
      }
    });
  });

  // Skills physics ------------------------------------------------------------
  let shakeGroup = function () {};

  if (typeof Matter === "undefined" || reducedMotion) {
    skillsBox.classList.add("skillsBox--static");
  } else {
    const M = Matter;
    const engine = M.Engine.create();
    engine.gravity.y = 1.1;
    const runner = M.Runner.create();
    const WALL = 400;
    let boxWidth = skillsBox.clientWidth;
    let boxHeight = skillsBox.clientHeight;
    let running = false;
    let dropped = false;

    const floor = M.Bodies.rectangle(boxWidth / 2, boxHeight + WALL / 2, 20000, WALL, { isStatic: true });
    const leftWall = M.Bodies.rectangle(-WALL / 2, boxHeight / 2 - 1500, WALL, boxHeight + 3000, { isStatic: true });
    const rightWall = M.Bodies.rectangle(boxWidth + WALL / 2, boxHeight / 2 - 1500, WALL, boxHeight + 3000, { isStatic: true });
    M.Composite.add(engine.world, [floor, leftWall, rightWall]);

    function drop() {
      dropped = true;
      chips.forEach(function (chip, index) {
        chip.w = chip.el.offsetWidth;
        chip.h = chip.el.offsetHeight;
        const x = chip.w / 2 + Math.random() * Math.max(1, boxWidth - chip.w);
        const y = -chip.h - Math.random() * boxHeight * 0.6 - index * 26;
        chip.body = M.Bodies.rectangle(x, y, chip.w, chip.h, {
          chamfer: { radius: chip.h * 0.48 },
          restitution: 0.35,
          friction: 0.25,
          frictionAir: 0.012,
          density: 0.0016
        });
        chip.body.chip = chip;
        M.Body.setAngle(chip.body, (Math.random() - 0.5) * 0.8);
        M.Composite.add(engine.world, chip.body);
        chip.el.classList.add("is-ready");
      });
    }

    M.Events.on(engine, "afterUpdate", function () {
      chips.forEach(function (chip) {
        if (!chip.body) return;
        const p = chip.body.position;
        chip.el.style.transform =
          "translate(" + (p.x - chip.w / 2) + "px," + (p.y - chip.h / 2) + "px) rotate(" + chip.body.angle + "rad)";
      });
    });

    // Mouse dragging (desktop). Matter's own wheel/touch listeners would
    // block page scrolling over the box, so they're removed; on touch,
    // a tap flicks the chip instead of dragging it.
    const mouse = M.Mouse.create(skillsBox);
    mouse.element.removeEventListener("wheel", mouse.mousewheel);
    mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
    mouse.element.removeEventListener("touchstart", mouse.mousedown);
    mouse.element.removeEventListener("touchmove", mouse.mousemove);
    mouse.element.removeEventListener("touchend", mouse.mouseup);
    const mouseConstraint = M.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.18, damping: 0.1, render: { visible: false } }
    });
    M.Composite.add(engine.world, mouseConstraint);
    window.addEventListener("mouseup", function () {
      mouse.button = -1;
    });

    function flick(body, strength) {
      M.Body.setVelocity(body, { x: (Math.random() - 0.5) * 12, y: -(strength || 14) - Math.random() * 6 });
      M.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);
    }

    skillsBox.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" || !dropped) return;
      const rect = skillsBox.getBoundingClientRect();
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const bodies = chips.map(function (chip) { return chip.body; });
      M.Query.point(bodies, point).forEach(function (body) {
        flick(body, 16);
      });
    });

    shakeGroup = function (groupId) {
      if (!dropped) return;
      chips.forEach(function (chip, index) {
        if (chip.skill.group !== groupId) return;
        window.setTimeout(function () {
          flick(chip.body, 18);
        }, (index % 6) * 40);
      });
    };

    function start() {
      if (running) return;
      running = true;
      M.Runner.run(runner, engine);
    }

    function stop() {
      if (!running) return;
      running = false;
      M.Runner.stop(runner);
    }

    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (!dropped) drop();
        start();
      } else {
        stop();
      }
    }, { threshold: 0.2 }).observe(skillsBox);

    window.addEventListener("resize", function () {
      boxWidth = skillsBox.clientWidth;
      boxHeight = skillsBox.clientHeight;
      M.Body.setPosition(floor, { x: boxWidth / 2, y: boxHeight + WALL / 2 });
      M.Body.setPosition(leftWall, { x: -WALL / 2, y: boxHeight / 2 - 1500 });
      M.Body.setPosition(rightWall, { x: boxWidth + WALL / 2, y: boxHeight / 2 - 1500 });
      chips.forEach(function (chip) {
        if (!chip.body) return;
        const x = Math.min(Math.max(chip.body.position.x, chip.w / 2), boxWidth - chip.w / 2);
        M.Body.setPosition(chip.body, { x: x, y: Math.min(chip.body.position.y, boxHeight - chip.h) });
      });
    });
  }

  // Contact ---------------------------------------------------------------------
  const copyEmail = document.getElementById("copyEmail");
  const emailText = document.getElementById("emailText");
  const emailHint = document.getElementById("emailHint");
  emailText.textContent = site.owner.email;

  copyEmail.addEventListener("click", function () {
    function done(message) {
      emailHint.textContent = message;
      copyEmail.classList.add("is-copied");
      window.setTimeout(function () {
        emailHint.textContent = "Click to copy";
        copyEmail.classList.remove("is-copied");
      }, 2200);
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(site.owner.email).then(function () {
        done("Copied ✓");
      }, function () {
        window.location.href = "mailto:" + site.owner.email;
      });
    } else {
      window.location.href = "mailto:" + site.owner.email;
    }
  });

  const localTime = document.getElementById("localTime");
  const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: site.owner.timezone, hour: "2-digit", minute: "2-digit" });
  function updateClock() {
    localTime.textContent = timeFormat.format(new Date()) + " " + site.owner.timezoneLabel;
  }
  updateClock();
  window.setInterval(updateClock, 30000);
  document.getElementById("year").textContent = new Date().getFullYear();

  // Late layout changes (fonts, images) shift pin positions
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
});
