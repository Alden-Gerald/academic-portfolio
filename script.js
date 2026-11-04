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
  mark(".tile__text", "head", 0);
  mark(".gallery", "zoom", 0);
  mark(".tile .facts", "head", 0);
  mark(".tile .stack", "head", 0);
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


// Horizontal galleries: arrow buttons, keyboard arrows, mouse drag, and a position counter.
const noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll(".gallery").forEach((gallery) => {
  const track = gallery.querySelector(".gallery__track");
  const slides = [...track.querySelectorAll(".slide")];
  const [prev, next] = gallery.querySelectorAll(".gallery__btn");
  const count = gallery.querySelector(".gallery__count");
  if (!track || slides.length === 0) return;

  const nearest = () => {
    const middle = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    slides.forEach((slide, i) => {
      const center = slide.offsetLeft + slide.offsetWidth / 2;
      if (Math.abs(center - middle) < Math.abs(slides[best].offsetLeft + slides[best].offsetWidth / 2 - middle)) best = i;
    });
    return best;
  };

  const goTo = (index) => {
    const slide = slides[Math.max(0, Math.min(slides.length - 1, index))];
    const left = slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2;
    track.scrollTo({ left, behavior: noMotion ? "auto" : "smooth" });
  };

  let waiting = false;
  const update = () => {
    waiting = false;
    const i = nearest();
    count.textContent = `${i + 1} / ${slides.length}`;
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
  };
  track.addEventListener("scroll", () => {
    if (!waiting) {
      waiting = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });

  prev.addEventListener("click", () => goTo(nearest() - 1));
  next.addEventListener("click", () => goTo(nearest() + 1));
  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") { event.preventDefault(); goTo(nearest() + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); goTo(nearest() - 1); }
  });

  // Mouse drag (touch and trackpads already scroll natively)
  let startX = 0, startLeft = 0, dragging = false;
  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragging = true;
    startX = event.clientX;
    startLeft = track.scrollLeft;
    track.classList.add("is-dragging");
  });
  window.addEventListener("pointermove", (event) => {
    if (dragging) track.scrollLeft = startLeft - (event.clientX - startX);
  });
  window.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    goTo(nearest());
  });

  update();
});
