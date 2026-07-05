# Haris Portfolio

A single-page portfolio for M. Haris Shakeel — Biztech Engineer & Salesforce Solution Architect — built with vanilla HTML/CSS/JS, [Three.js](https://threejs.org/) for the animated background, and [GSAP](https://gsap.com/) (ScrollTrigger + SplitText) for the entrance and scroll-driven animations.

## Features

- Full-viewport Three.js scene: a waving, colored particle terrain with ambient dust, parallaxing with the mouse and scroll
- GSAP hero entrance with a character-split title reveal
- Infinite marquee ticker that speeds up with scroll velocity
- Pinned horizontal scroll through the Projects section on desktop (falls back to a vertical grid on mobile)
- Custom cursor with magnetic buttons, scroll-triggered reveals, and animated stat counters
- Placeholder frame for a profile photo in the About section (swap-in instructions included as an HTML comment)

## Running locally

This is a static site with no build step — it just needs to be served over HTTP (opening `index.html` directly via `file://` will break the ES module import for Three.js).

```bash
# from the project root
python3 -m http.server 4173
```

Then open **http://localhost:4173** in your browser.

Any other static server works too, e.g.:

```bash
npx serve .
```

## Adding your photo

In [`index.html`](index.html), find the `<!-- IMAGE PLACEHOLDER -->` comment inside the `about__photo` block and replace the placeholder `div` with:

```html
<img src="your-photo.jpg" alt="M. Haris Shakeel" />
```

Drop the image file in the project root (or update the `src` path) — the surrounding CSS already sizes and frames it correctly.

## Project structure

```
index.html      # markup and content
style.css       # theme, layout, responsive styles
main.js         # Three.js scene + GSAP animations
```
