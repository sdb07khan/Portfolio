/*
 * Site content + shared runtime state.
 *
 * Everything the page renders from data lives here — add a project,
 * a skill or change the stack layers by editing these arrays only; no
 * HTML or SCSS needs to change. Loaded as a plain (non-deferred)
 * script in <head> so both main.js and the Three.js modules can rely
 * on window.PORTFOLIO existing the moment they run.
 */

window.PORTFOLIO = {

  // Shared state — written by main.js (scroll, pins, intro), read every
  // frame by the 3D scenes in assets/js/three/.
  state: {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    heroReady: false,
    introPlayed: false,
    heroVisible: true,
    scrollVelocity: 0,
    stackProgress: 0,
    stackStep: 0
  },

  // ---- Owner details (PLACEHOLDERS — replace with your own) -----------
  owner: {
    name: "Saddab Khan",
    role: "Front-end developer",
    email: "hello@yourname.dev",
    timezone: "Asia/Kolkata",
    timezoneLabel: "IST",
    tagline: "front-end developer from India who also handles the back end, hosting, DNS and the long tail of maintenance."
  },

  // ---- Skills: add one line per skill. `group` must match an id below;
  // `size: "lg"` makes the physics chip bigger. ----------------------
  skillGroups: [
    { id: "build", label: "Front end" },
    { id: "motion", label: "Motion & 3D" },
    { id: "cms", label: "CMS & back end" },
    { id: "server", label: "Hosting & care" },
    { id: "design", label: "Design" }
  ],

  skills: [
    { name: "HTML", group: "build", size: "lg" },
    { name: "CSS", group: "build", size: "lg" },
    { name: "Sass", group: "build" },
    { name: "JavaScript", group: "build", size: "lg" },
    { name: "React", group: "build", size: "lg" },
    { name: "Responsive", group: "build" },
    { name: "Accessibility", group: "build" },
    { name: "Three.js", group: "motion", size: "lg" },
    { name: "GSAP", group: "motion" },
    { name: "WebGL", group: "motion" },
    { name: "Micro-interactions", group: "motion" },
    { name: "WordPress", group: "cms", size: "lg" },
    { name: "Webflow", group: "cms", size: "lg" },
    { name: "PHP", group: "cms" },
    { name: "MySQL", group: "cms" },
    { name: "Custom blocks", group: "cms" },
    { name: "Hosting", group: "server" },
    { name: "DNS", group: "server" },
    { name: "SSL", group: "server" },
    { name: "cPanel", group: "server" },
    { name: "Git", group: "server" },
    { name: "Performance", group: "server", size: "lg" },
    { name: "SEO", group: "server" },
    { name: "Maintenance", group: "server" },
    { name: "Figma", group: "design", size: "lg" }
  ],

  // ---- Projects: add an object to add a card. Images are placeholders
  // in assets/images/projects/ — swap the files or the paths. ---------
  projects: [
    {
      title: "World of Waste",
      type: "Data platform",
      year: "2026",
      description: "Interactive trade map and country data pages tracking global textile waste, built as editable WordPress blocks.",
      stack: ["WordPress", "Lazy Blocks", "Sass", "JavaScript"],
      image: "assets/images/projects/project-01.svg",
      url: "https://worldofwaste.co"
    },
    {
      title: "Asar",
      type: "Brand website",
      year: "2025",
      description: "A motion-led marketing site with scroll-triggered storytelling, sliders and Lottie animation.",
      stack: ["HTML", "Sass", "GSAP", "ScrollTrigger"],
      image: "assets/images/projects/project-02.svg",
      url: "#"
    },
    {
      title: "Project three",
      type: "E-commerce",
      year: "2025",
      description: "Placeholder — a WooCommerce store with a custom theme, fast checkout and hosting set up end to end.",
      stack: ["WordPress", "WooCommerce", "PHP"],
      image: "assets/images/projects/project-03.svg",
      url: "#"
    },
    {
      title: "Project four",
      type: "Web app",
      year: "2024",
      description: "Placeholder — a React dashboard with live data, charts and a component library.",
      stack: ["React", "JavaScript", "Sass"],
      image: "assets/images/projects/project-04.svg",
      url: "#"
    },
    {
      title: "Project five",
      type: "Marketing site",
      year: "2024",
      description: "Placeholder — a Webflow build with custom code, CMS collections and Three.js hero.",
      stack: ["Webflow", "Three.js", "GSAP"],
      image: "assets/images/projects/project-05.svg",
      url: "#"
    }
  ],

  // ---- The six layers of the pinned "anatomy" section, top → bottom.
  // `kind` picks the drawing on the slab's top face (see stackScene.js).
  stackLayers: [
    {
      kind: "interaction",
      label: "Interaction",
      title: "Motion that earns its place",
      text: "JavaScript, React, GSAP and Three.js — interactions that feel good without costing a frame.",
      tags: ["JavaScript", "React", "GSAP", "Three.js"],
      color: "#b4654a"
    },
    {
      kind: "style",
      label: "Style",
      title: "Pixel-true, responsive by default",
      text: "Design systems in CSS custom properties and Sass. Layouts that hold up from 320px to ultrawide.",
      tags: ["CSS", "Sass", "Figma"],
      color: "#d5c3a3"
    },
    {
      kind: "structure",
      label: "Structure",
      title: "Markup that means something",
      text: "Semantic, accessible HTML that screen readers, search engines and future developers all understand.",
      tags: ["HTML", "Accessibility", "SEO"],
      color: "#e9e4da"
    },
    {
      kind: "backend",
      label: "Back end & CMS",
      title: "Content editors actually enjoy",
      text: "WordPress themes, custom blocks, PHP and MySQL — or Webflow when it fits. Editable without breaking.",
      tags: ["WordPress", "Webflow", "PHP", "MySQL"],
      color: "#7b8a6d"
    },
    {
      kind: "server",
      label: "Server & hosting",
      title: "Deployed, backed up, monitored",
      text: "cPanel, VPS and managed hosting, deployments, backups and the performance work that keeps it fast.",
      tags: ["Hosting", "cPanel", "Git", "Performance"],
      color: "#5d7086"
    },
    {
      kind: "domain",
      label: "Domain & DNS",
      title: "Launch day, made boring",
      text: "Domains, DNS records, SSL and email set up properly — so going live is the least stressful part.",
      tags: ["DNS", "SSL", "Domains"],
      color: "#34332f"
    }
  ]
};
