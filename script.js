"use strict";

const sectionLinks = [...document.querySelectorAll('.navlinks a[href^="#"]')];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function setCurrentSection(sectionId) {
  sectionLinks.forEach((link) => {
    const isCurrent = link.getAttribute("href") === `#${sectionId}`;
    if (isCurrent) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

if ("IntersectionObserver" in window && sections.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleSection) {
        setCurrentSection(visibleSection.target.id);
      }
    },
    { rootMargin: "-25% 0px -55%", threshold: [0, 0.25, 0.5] },
  );

  sections.forEach((section) => observer.observe(section));
}


// Fallback scroll motion for browsers without CSS scroll-driven animations
// (those get the pure-CSS version in style.css). index.html sets <html class="motion"> only when
// IntersectionObserver exists and the visitor has not asked for reduced motion.
if (document.documentElement.classList.contains("motion") && !document.documentElement.classList.contains("sdl")) {
  // 1. Scroll-linked hero: --hp runs 0 -> 1 while the hero scrolls out of view.
  const hero = document.querySelector(".hero");
  const heroArt = document.querySelector(".hero__bg");
  let waiting = false;

  const update = () => {
    waiting = false;
    const y = window.scrollY;
    if (hero) {
      const progress = Math.min(Math.max(y / (hero.offsetHeight * 0.75), 0), 1);
      hero.style.setProperty("--hp", progress.toFixed(4));
    }
    if (heroArt) {
      const shift = Math.min(y, 720) * 0.18;
      const zoom = 1 + Math.min(y / 2400, 0.12);
      heroArt.style.transform = `translate3d(0, ${shift}px, 0) scale(${zoom})`;
    }
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!waiting) {
        waiting = true;
        window.requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();

  // 2. Reveal on enter, with a short stagger inside each row of cards.
  const twoColumns = window.matchMedia("(min-width: 700px)").matches;
  const targets = [];
  const mark = (selector, variant, step) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.setAttribute("data-reveal", variant);
      el.style.setProperty("--d", `${step ? (twoColumns ? i % 2 : 0) * step : 0}ms`);
      targets.push(el);
    });
  };

  mark(".section__head h2", "head", 0);
  document.querySelectorAll(".section__head .section__copy").forEach((el) => {
    el.setAttribute("data-reveal", "head");
    el.style.setProperty("--d", "110ms");
    targets.push(el);
  });
  mark(".grid > li", "", 140);
  mark(".card--featured", "zoom", 0);
  mark(".skill-group", "", 110);
  mark(".site-footer__inner", "head", 0);

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        reveal.unobserve(el);
        el.classList.add("is-in");
        // Once settled, drop the reveal hooks so hover transitions behave normally.
        window.setTimeout(() => {
          el.removeAttribute("data-reveal");
          el.classList.remove("is-in");
          el.style.removeProperty("--d");
        }, 1500);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );

  targets.forEach((el) => reveal.observe(el));
}
