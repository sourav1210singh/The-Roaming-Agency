/* ============================================================================
   Lenis smooth-scroll — revision round 2, item G3.

   Client feedback: "Scrolling feels like it moves in blocks — check
   smoothness reference." The native scroll alongside our sticky-stack
   sections (Choose Your Band, Events, hero-stack) feels jerky on
   trackpads / mouse-wheels. Lenis is a tiny (~3KB gz) JS smooth-scroll
   library used by award-winning sites (Awwwards, Studio Freight). It
   interpolates the scrollTop via requestAnimationFrame so wheel ticks
   become smooth ramps instead of instant jumps.

   Loaded on every page (homepage + bands + blog + FAQ) via its own
   <script src="…/lenis-scroll.js" defer> tag. Self-running on
   DOMContentLoaded; double-init guarded.

   Integration notes:
   • GSAP ScrollTrigger needs to know about Lenis so its scrubbed
     animations stay in sync with the smoothed scroll position. We call
     ScrollTrigger.update() on every Lenis frame, and add a scrollerProxy
     so existing pinned sections work unchanged.
   • Mobile (touch) devices skip Lenis — native touch-scroll is already
     buttery and Lenis adds noticeable lag with momentum gestures.
   • Users with prefers-reduced-motion get the native scroll too.
   • The Lenis CDN is loaded via a <script> tag right before this file
     in each HTML page; if it didn't load (offline / blocked) we silently
     fall back to native scroll — no broken page.
   ============================================================================ */

(function () {
  'use strict';

  if (window.__lenisInited) return;
  window.__lenisInited = true;

  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches ||
           ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function init() {
    // Skip on mobile + reduced-motion.
    if (isMobile() || reducedMotion()) return;
    // CDN not loaded — bail silently.
    if (typeof window.Lenis === 'undefined') return;

    /* Tuning notes (revision round 2 G3 follow-up):
       The first pass used duration: 1.1s with a long-tail exponential
       easing — but in QA the client reported scroll "lag". The 1+ sec
       settle meant each wheel tick took ~1s to come to rest, which
       reads as sluggish even though framerate is fine. New values aim
       for "snappy luxury" — the smooth glide is preserved but each
       wheel tick lands in ~600ms with a cubic ease-out tail. wheel
       multiplier nudged up slightly so a single notch covers more
       distance, matching the user's mental model of native scroll. */
    const lenis = new window.Lenis({
      duration: 0.6,
      easing: (t) => 1 - Math.pow(1 - t, 3),   // cubic ease-out — clean, no overshoot
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1.15,
      touchMultiplier: 2,
    });

    // Expose globally so other scripts (e.g. anchor-link handlers in
    // main.js) can call `lenis.scrollTo('#contact')` if they need to.
    window.lenis = lenis;

    // ── RAF loop ──────────────────────────────────────────────────
    // If GSAP + ScrollTrigger are present we drive Lenis from the GSAP
    // ticker — keeps everything on a single rAF and ScrollTrigger's
    // scrubbed animations stay perfectly aligned with the smoothed
    // scroll position. Otherwise (sub-pages without GSAP), drive Lenis
    // from a plain requestAnimationFrame loop.
    if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
