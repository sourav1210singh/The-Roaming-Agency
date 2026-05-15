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

    // KEY INSIGHT: smooth-scroll interpolation (Lenis) ALWAYS adds some
    // input-to-motion delay — that's its nature. The user wants the
    // page to move EXACTLY with the wheel (zero delay) AND feel smooth.
    // Those are only compatible if NATIVE scroll runs at a solid 60fps
    // (no dropped frames = smooth, and native = zero delay + 1:1 wheel).
    //
    // So this test page now DEFAULTS TO LENIS OFF. The smoothness comes
    // purely from the performance layer in scroll-smooth-test.css
    // (content-visibility skips offscreen render, GPU compositing keeps
    // the scroll-driven transforms off the main thread). Native scroll
    // stays instant + 1:1 with the wheel — no catch-up, no section
    // overshoot. Press `l` to switch Lenis ON and A/B the two feels.
    const lenis = new window.Lenis({
      duration: 0.85,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
      lerp: 0.2,
    });
    // Start STOPPED — native scroll is the default experience.
    lenis.stop();

    window.lenis = lenis;
    window.__lenisTest = lenis; // explicit handle for the test harness

    // Drive Lenis from the GSAP ticker (only actually moves the page
    // when lenis is .start()-ed via the `l` key). ScrollTrigger.update
    // is bound to BOTH lenis scroll and the native scroll event so the
    // sticky pins stay accurate in either mode.
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
        const mode = lenis.isStopped ? 'NATIVE (instant, 0 delay)'
                                     : 'LENIS smooth (lerp ' + lenis.options.lerp + ')';
        meter.style.color = lenis.isStopped ? '#4ad' : '#0f0';
        meter.textContent =
          'FPS ' + fps + '  (min ' + minFps + ')\n' +
          'MODE: ' + mode + '\n' +
          'press  L = toggle mode';
        frames = 0; last = now;
      }
      requestAnimationFrame(fpsLoop);
    }
    requestAnimationFrame(fpsLoop);

    // Keyboard controls for live A/B tuning on the test page:
    //   f          hide / show the FPS meter
    //   l          toggle Lenis on/off (native vs smooth, same page)
    //   r          reset the min-FPS tracker
    //   ]          lerp +0.02  (snappier, less catch-up delay)
    //   [          lerp -0.02  (floatier, smoother but more delay)
    //   1 / 2 / 3  jump straight to lerp 0.12 / 0.20 / 0.30 presets
    function setLerp(v) {
      v = Math.max(0.05, Math.min(0.6, Math.round(v * 100) / 100));
      lenis.options.lerp = v;
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'f') meter.style.display = meter.style.display === 'none' ? 'block' : 'none';
      if (e.key === 'l') {
        if (lenis.isStopped) { lenis.start(); meter.style.color = '#0f0'; }
        else { lenis.stop(); meter.style.color = '#f80'; }
      }
      if (e.key === 'r') { minFps = 999; }
      if (e.key === ']') setLerp(lenis.options.lerp + 0.02);
      if (e.key === '[') setLerp(lenis.options.lerp - 0.02);
      if (e.key === '1') setLerp(0.12);
      if (e.key === '2') setLerp(0.20);
      if (e.key === '3') setLerp(0.30);
    });

    console.log('[scroll-test] Lenis active. Keys:  f=meter  l=toggle-lenis  r=reset-minFPS  [=lerp- ]=lerp+  1/2/3=lerp presets(0.12/0.20/0.30). Current lerp shown in the top-left meter.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
