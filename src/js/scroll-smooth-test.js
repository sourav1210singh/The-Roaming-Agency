/* ============================================================================
   SCROLL-SMOOTHNESS TEST LAYER  —  loaded ONLY by scroll-test.html
   ----------------------------------------------------------------------------
   Adds a properly-tuned Lenis smooth-scroll on top of the existing page.
   The earlier site-wide Lenis attempt was reverted because duration:1.1
   with a long-tail exponential ease felt laggy. This config is tuned
   for "responsive smooth": short settle, snappy lerp, GSAP-ticker
   driven so ScrollTrigger (Choose Your Band / Events / Gallery pins)
   stays perfectly in sync.

   index.html does NOT load this file — it's isolated to the test page.
   ============================================================================ */
(function () {
  'use strict';

  if (window.__smoothTestInited) return;
  window.__smoothTestInited = true;

  function isTouch() {
    return ('ontouchstart' in window) && navigator.maxTouchPoints > 0
        && window.matchMedia('(max-width: 768px)').matches;
  }
  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function init() {
    if (isTouch() || reducedMotion()) return;
    if (typeof window.Lenis === 'undefined') {
      console.warn('[scroll-test] Lenis CDN not loaded — native scroll only.');
      return;
    }

    const lenis = new window.Lenis({
      // 0.85s settle — long enough to feel smooth, short enough to feel
      // responsive (the 1.1s in the reverted attempt felt sluggish).
      duration: 0.85,
      // Cubic ease-out: quick start, gentle stop, NO long tail.
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      // Never smooth touch — native momentum scroll is already great
      // and Lenis-on-touch introduces lag.
      syncTouch: false,
      wheelMultiplier: 1.0,
      // lerp is the per-frame interpolation factor. 0.12 is a good
      // middle: lower = floatier, higher = snappier. We expose it on
      // window so it can be live-tuned from the console during testing.
      lerp: 0.12,
    });

    window.lenis = lenis;
    window.__lenisTest = lenis; // explicit handle for the test harness

    // Drive Lenis from the GSAP ticker so there's ONE rAF for the whole
    // page and ScrollTrigger.update() runs in lockstep with the smoothed
    // scroll position — keeps the sticky pins (Choose Your Band, Events,
    // Gallery panel-reveal) accurate.
    if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }

    // ── Live FPS meter (test page only) ──────────────────────────────
    // A tiny on-screen readout so we can SEE the frame rate while
    // scrolling and compare against the live homepage. Toggle with the
    // `f` key.
    const meter = document.createElement('div');
    meter.style.cssText =
      'position:fixed;top:8px;left:8px;z-index:99999;font:600 12px/1.4 monospace;' +
      'background:rgba(0,0,0,.8);color:#0f0;padding:6px 10px;border-radius:6px;' +
      'pointer-events:none;white-space:pre';
    meter.textContent = 'FPS —';
    document.body.appendChild(meter);

    let frames = 0, last = performance.now(), fps = 0, minFps = 999;
    function fpsLoop(now) {
      frames++;
      if (now - last >= 500) {
        fps = Math.round((frames * 1000) / (now - last));
        if (fps < minFps) minFps = fps;
        meter.textContent =
          'FPS ' + fps + '  (min ' + minFps + ')\n' +
          'Lenis ' + (lenis ? 'ON' : 'off') + '  lerp ' + lenis.options.lerp;
        frames = 0; last = now;
      }
      requestAnimationFrame(fpsLoop);
    }
    requestAnimationFrame(fpsLoop);

    // Press `f` to hide/show the meter; `l` to toggle Lenis on/off so
    // you can A/B the smooth vs native feel on the same page.
    window.addEventListener('keydown', (e) => {
      if (e.key === 'f') meter.style.display = meter.style.display === 'none' ? 'block' : 'none';
      if (e.key === 'l') {
        if (lenis.isStopped) { lenis.start(); meter.style.color = '#0f0'; }
        else { lenis.stop(); meter.style.color = '#f80'; }
      }
      if (e.key === 'r') { minFps = 999; } // reset the min-FPS tracker
    });

    console.log('[scroll-test] Lenis smooth-scroll active. Keys: f=meter l=toggle-lenis r=reset-minFPS');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
