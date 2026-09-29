# Portfolio — "Keystrokes"

A single-page interactive portfolio. Static HTML + Sass + vanilla JS, with
GSAP/ScrollTrigger, Lenis, Matter.js and Three.js loaded from CDNs.

## Run it

```bash
npm install
npm start          # http://localhost:8123 + Sass watcher
npm run build      # compile → autoprefix → minify into assets/css/main.css
```

## Where things live

| What | File |
| --- | --- |
| Projects, skills, stack layers, name/email/timezone | `assets/js/data.js` |
| Page behaviour (scroll, terminal, pins, physics, cursor) | `assets/js/main.js` |
| Hero 3D keyboard | `assets/js/three/heroScene.js` |
| Pinned 3D "anatomy of a website" | `assets/js/three/stackScene.js` |
| Keycaps drifting between sections | `assets/js/three/floaters.js` (edit `FLOATERS`) |
| Shared keycap factory, palette, renderer | `assets/js/three/shared.js` |
| Colours, fonts, sizes | `sass/abstracts/_variables.scss` (+ `PALETTE` in `shared.js`) |
| Section styles | `sass/pages/_home.scss` |

### Add a project
Add an object to `projects` in `data.js` and drop its image in
`assets/images/projects/`. The card, counter and horizontal scroll length
all update on their own.

### Add a skill
Add `{ name: "Vue", group: "build" }` to `skills` in `data.js`
(`size: "lg"` makes it a bigger chip). New groups go in `skillGroups`.

### Terminal commands
`COMMANDS` in `main.js`. Hidden: typing `hire` (the clay keys) scrolls to
contact and makes the keyboard wave.

## Still placeholder
- Email `hello@yourname.dev`, social links (`#`)
- `assets/documents/resume.pdf` (not included yet)
- Project images 01–05 and projects three–five
- Asar project year/description
- Domain shown on the stack's DNS slab (`yourname.dev`, in `stackScene.js`)
