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


// Hero artwork drifts slowly as the page scrolls. Skipped for reduced motion.
const heroArt = document.querySelector(".hero__bg");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (heroArt && !reduceMotion) {
  let waiting = false;

  const drift = () => {
    const offset = Math.min(window.scrollY, 720) * 0.18;
    heroArt.style.transform = `translate3d(0, ${offset}px, 0)`;
    waiting = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!waiting) {
        waiting = true;
        window.requestAnimationFrame(drift);
      }
    },
    { passive: true },
  );
}
