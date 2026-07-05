import * as THREE from "three";

/* ================================================================
   THREE.JS — waving particle terrain + terracotta dust
   ================================================================ */

const COLORS = {
  bg: 0x233342,
  plum: 0x4b2b31,
  maroon: 0x6f3637,
  terracotta: 0xce8054,
  rust: 0xb35340,
};

const canvas = document.getElementById("webgl");
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COLORS.bg, 0.026);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 2.2, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/* ---- particle terrain: grid displaced by layered sine waves ---- */
const COLS = 140;
const ROWS = 70;
const TERRAIN_COUNT = COLS * ROWS;
const TERRAIN_W = 64;
const TERRAIN_D = 40;

const tPositions = new Float32Array(TERRAIN_COUNT * 3);
const tColors = new Float32Array(TERRAIN_COUNT * 3);

const cNear = new THREE.Color(COLORS.terracotta);
const cMid = new THREE.Color(COLORS.rust);
const cFar = new THREE.Color(COLORS.maroon);
const tmp = new THREE.Color();

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    const x = (c / (COLS - 1) - 0.5) * TERRAIN_W;
    const z = 6 - (r / (ROWS - 1)) * TERRAIN_D;
    tPositions[i * 3] = x;
    tPositions[i * 3 + 1] = 0;
    tPositions[i * 3 + 2] = z;

    // terracotta near the camera, rust mid-field, plum-maroon at the horizon
    const depth = r / (ROWS - 1);
    if (depth < 0.5) tmp.lerpColors(cNear, cMid, depth * 2);
    else tmp.lerpColors(cMid, cFar, (depth - 0.5) * 2);
    const shade = 0.75 + Math.random() * 0.35;
    tColors[i * 3] = tmp.r * shade;
    tColors[i * 3 + 1] = tmp.g * shade;
    tColors[i * 3 + 2] = tmp.b * shade;
  }
}

const terrainGeo = new THREE.BufferGeometry();
terrainGeo.setAttribute("position", new THREE.BufferAttribute(tPositions, 3));
terrainGeo.setAttribute("color", new THREE.BufferAttribute(tColors, 3));

const terrainMat = new THREE.PointsMaterial({
  size: 0.075,
  vertexColors: true,
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const terrain = new THREE.Points(terrainGeo, terrainMat);
terrain.position.y = -3.4;
scene.add(terrain);

/* ---- ambient dust ---- */
const DUST_COUNT = 500;
const dPositions = new Float32Array(DUST_COUNT * 3);
const dSpeeds = new Float32Array(DUST_COUNT);

for (let i = 0; i < DUST_COUNT; i++) {
  dPositions[i * 3] = (Math.random() - 0.5) * 50;
  dPositions[i * 3 + 1] = Math.random() * 18 - 4;
  dPositions[i * 3 + 2] = (Math.random() - 0.5) * 34;
  dSpeeds[i] = 0.2 + Math.random() * 0.8;
}

const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dPositions, 3));

const dustMat = new THREE.PointsMaterial({
  color: COLORS.terracotta,
  size: 0.05,
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const dust = new THREE.Points(dustGeo, dustMat);
scene.add(dust);

/* ---- mouse parallax ---- */
const mouse = { x: 0, y: 0 };
window.addEventListener("pointermove", (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* ---- scroll progress drives the camera glide ---- */
let scrollProgress = 0;
const updateScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = max > 0 ? window.scrollY / max : 0;
};
window.addEventListener("scroll", updateScroll, { passive: true });
updateScroll();

/* ---- render loop ---- */
const clock = new THREE.Clock();

function tick() {
  const t = clock.getElapsedTime();

  // layered sine waves ripple the terrain
  const pos = terrainGeo.attributes.position.array;
  for (let i = 0; i < TERRAIN_COUNT; i++) {
    const x = pos[i * 3];
    const z = pos[i * 3 + 2];
    pos[i * 3 + 1] =
      Math.sin(x * 0.28 + t * 0.7) * 0.55 +
      Math.cos(z * 0.32 + t * 0.45) * 0.5 +
      Math.sin((x + z) * 0.13 + t * 0.3) * 0.9;
  }
  terrainGeo.attributes.position.needsUpdate = true;

  // scrolling glides the camera forward and down over the terrain
  terrain.rotation.y = Math.sin(scrollProgress * Math.PI) * 0.25;
  dust.rotation.y = t * 0.015 + scrollProgress * 0.5;

  camera.position.z = 10 - scrollProgress * 5.5;
  const targetY = 2.2 + scrollProgress * 1.6;

  camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.04;
  camera.position.y += (targetY - mouse.y * 0.4 - camera.position.y) * 0.04;
  camera.lookAt(0, -1.5, -8);

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/* ================================================================
   GSAP — cursor, entrance, marquee, scroll animations
   ================================================================ */

gsap.registerPlugin(ScrollTrigger, SplitText);

const finePointer = window.matchMedia("(pointer: fine)").matches;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- custom cursor: terracotta dot + lagging ring ---- */
if (finePointer && !reducedMotion) {
  document.body.classList.add("has-cursor");
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: -100, y: -100 });

  const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
  const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
  const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

  window.addEventListener("pointermove", (e) => {
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
  });

  document.querySelectorAll("a, .btn, .card").forEach((el) => {
    el.addEventListener("mouseenter", () =>
      gsap.to(ring, { scale: 1.9, opacity: 0.9, duration: 0.3 })
    );
    el.addEventListener("mouseleave", () =>
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3 })
    );
  });
}

/* ---- magnetic buttons ---- */
if (finePointer && !reducedMotion) {
  document.querySelectorAll(".btn, .nav__cta").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - r.left - r.width / 2) * 0.3,
        y: (e.clientY - r.top - r.height / 2) * 0.4,
        duration: 0.3,
        ease: "power2.out",
      });
    });
    el.addEventListener("mouseleave", () =>
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" })
    );
  });
}

/* ---- hero entrance: char-split title ---- */
const split = new SplitText(".hero__title", { type: "chars" });
const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

intro
  .from(".nav", { y: -30, opacity: 0, duration: 0.8 })
  .from(".hero__kicker", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
  .from(split.chars, {
    yPercent: 130,
    rotate: 8,
    duration: 0.9,
    stagger: 0.028,
    ease: "power4.out",
  }, "-=0.3")
  .from(".hero__sub", { y: 24, opacity: 0, duration: 0.7 }, "-=0.5")
  .from(".hero__actions .btn", { y: 20, opacity: 0, stagger: 0.1, duration: 0.5 }, "-=0.4")
  .from(".hero__scroll", { opacity: 0, duration: 0.8 }, "-=0.2");

/* ---- marquee: infinite loop, sped up by scroll velocity ---- */
const marqueeTrack = document.querySelector(".marquee__track");
if (marqueeTrack && !reducedMotion) {
  const loop = gsap.to(marqueeTrack, {
    xPercent: -50,
    ease: "none",
    duration: 26,
    repeat: -1,
  });
  ScrollTrigger.create({
    onUpdate(self) {
      const boost = gsap.utils.clamp(1, 4, 1 + Math.abs(self.getVelocity()) / 800);
      gsap.to(loop, {
        timeScale: boost,
        duration: 0.3,
        overwrite: true,
        onComplete: () => gsap.to(loop, { timeScale: 1, duration: 1.2 }),
      });
    },
  });
}

/* ---- giant watermark numbers parallax ---- */
document.querySelectorAll(".section__watermark").forEach((el) => {
  gsap.to(el, {
    yPercent: -45,
    ease: "none",
    scrollTrigger: {
      trigger: el.closest(".section"),
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
});

/* ---- section headers ---- */
document.querySelectorAll(".section__head").forEach((head) => {
  gsap.from(head, {
    scrollTrigger: { trigger: head, start: "top 85%" },
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
  });
});

/* ---- photo placeholder: clip-path wipe + frame slide ---- */
gsap.fromTo(
  ".photo-placeholder",
  { clipPath: "inset(0 100% 0 0)" },
  {
    clipPath: "inset(0 0% 0 0)",
    duration: 1.1,
    ease: "power4.inOut",
    scrollTrigger: { trigger: ".about__photo", start: "top 80%" },
  }
);
gsap.from(".about__photo-frame", {
  x: -14,
  y: -14,
  opacity: 0,
  duration: 1,
  delay: 0.35,
  ease: "power3.out",
  scrollTrigger: { trigger: ".about__photo", start: "top 80%" },
});

/* ---- generic reveals ---- */
document.querySelectorAll("[data-reveal]").forEach((el, i) => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: "top 88%" },
    y: 50,
    opacity: 0,
    duration: 0.9,
    delay: (i % 3) * 0.08,
    ease: "power3.out",
  });
});

/* ---- stat counters ---- */
document.querySelectorAll(".stat__num").forEach((el) => {
  const target = +el.dataset.count;
  gsap.to(el, {
    scrollTrigger: { trigger: el, start: "top 90%" },
    innerText: target,
    duration: 1.6,
    snap: { innerText: 1 },
    ease: "power2.out",
  });
});

/* ---- projects: pinned horizontal scroll on desktop ---- */
const mm = gsap.matchMedia();
mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
  const section = document.querySelector("#projects");
  const track = section.querySelector(".projects");
  const wrap = section.querySelector(".projects-wrap");
  track.classList.add("is-horizontal");

  const dist = () => Math.max(0, track.scrollWidth - wrap.clientWidth);

  gsap.to(track, {
    x: () => -dist(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + dist(),
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  return () => track.classList.remove("is-horizontal");
});

/* ---- hero content fades as you scroll past ---- */
gsap.to(".hero__inner", {
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "bottom 40%",
    scrub: true,
  },
  y: -80,
  opacity: 0,
  ease: "none",
});
