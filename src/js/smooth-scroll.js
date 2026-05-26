/* ============================================================================
   SMOOTH SCROLL  -  site-wide premium momentum scrolling (Lenis)
   ----------------------------------------------------------------------------
   Loaded on EVERY page. Adds the weighted / momentum-based smooth scroll
   used on premium (Awwwards-style) sites, on top of the existing GSAP
   ScrollTrigger pins (Events / Choose Your Band / Gallery) - Lenis still
   drives the native window.scrollY so ScrollTrigger stays in perfect sync.

   Design choices:
   • DESKTOP ONLY (>=1025px). On phones / tablets we keep the OS-native
     scroll - mobile native scroll is already smooth and Lenis can fight
     the platform's momentum. Matches the project's existing rule of
     gating heavy desktop JS behind the same breakpoint.
   • prefers-reduced-motion: reduce  -> Lenis is skipped entirely.
   • duration 1.15 + exponential-decay easing = the "premium" weighted
     feel (fast start, soft landing). Do NOT swap the easing for linear.
   ============================================================================ */
(function () {
  'use strict';

  if (window.__smoothScrollInit) return;
  window.__smoothScrollInit = true;

  function reducedMotion() {
    return window.matchMedia &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function isDesktop() {
    return window.matchMedia &&
           window.matchMedia('(min-width: 1025px)').matches;
  }

  function init() {
    // Respect reduced-motion users + keep mobile/tablet on native scroll.
    if (reducedMotion() || !isDesktop()) return;
    if (typeof window.Lenis === 'undefined') {
      console.warn('[smooth-scroll] Lenis not loaded - native scroll only.');
      return;
    }

    var lenis = new window.Lenis({
      duration: 1.15,                                  // weighted feel
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.2,
    });
    window.lenis = lenis;

    // Drive Lenis from the GSAP ticker so ScrollTrigger (the pinned
    // Events / Choose Your Band / Gallery sections) stays frame-synced.
    // Fallback to a standalone rAF loop if GSAP isn't on the page.
    if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
