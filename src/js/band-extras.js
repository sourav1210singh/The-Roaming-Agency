/* ============================================================================
   BAND PAGE extras (5th draft) - gallery slider + testimonials carousel.
   Loaded on band pages (which already run their own inline loader/lang/FAQ
   + GSAP reveals). Self-contained, no dependencies.
   ============================================================================ */
(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(function () {
    // ── Gallery slider (prev/next + 20s auto) ──────────────────────────
    var slider = document.getElementById('bandGallerySlider');
    if (slider) {
      var slides = Array.prototype.slice.call(slider.querySelectorAll('.gallery-slide'));
      if (slides.length >= 2) {
        var idx = 0;
        slides.forEach(function (s, n) { if (s.classList.contains('is-active')) idx = n; });
        var show = function (i) {
          idx = (i + slides.length) % slides.length;
          slides.forEach(function (s, n) { s.classList.toggle('is-active', n === idx); });
        };
        var timer = null;
        var restart = function () { clearInterval(timer); timer = setInterval(function () { show(idx + 1); }, 20000); };
        var pv = document.getElementById('bandGalleryPrev');
        var nx = document.getElementById('bandGalleryNext');
        if (nx) nx.addEventListener('click', function () { show(idx + 1); restart(); });
        if (pv) pv.addEventListener('click', function () { show(idx - 1); restart(); });
        slider.addEventListener('mouseenter', function () { clearInterval(timer); });
        slider.addEventListener('mouseleave', restart);
        show(idx); restart();
      }
    }

    // ── Testimonials carousel (arrows scroll the track) ────────────────
    var track = document.querySelector('.band-reviews .testimonials__track');
    var tPrev = document.getElementById('bandReviewsPrev');
    var tNext = document.getElementById('bandReviewsNext');
    if (track && tPrev && tNext) {
      var stepSize = function () {
        var card = track.querySelector('.testimonial-card');
        return card ? card.getBoundingClientRect().width + 24 : 320;
      };
      tNext.addEventListener('click', function () { track.scrollBy({ left: stepSize(), behavior: 'smooth' }); });
      tPrev.addEventListener('click', function () { track.scrollBy({ left: -stepSize(), behavior: 'smooth' }); });
    }

    // ── The Band's Touch - clip-reveal on scroll (homepage "Our Standards"
    //    behaviour): each cell uncovers rightward, staggered one-by-one.
    //    Plain scroll listener (reads getBoundingClientRect) - no IO, no
    //    ScrollTrigger - so it works reliably with native scroll AND Lenis,
    //    with no refresh-timing fragility. Gated so the section stays fully
    //    visible if JS / motion isn't available. ──
    var bandTouch = document.querySelector('.band-touch');
    var touchCols = bandTouch
      ? Array.prototype.slice.call(bandTouch.querySelectorAll('.band-touch__col')) : [];
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (bandTouch && touchCols.length && !reduceMotion) {
      bandTouch.classList.add('band-touch--reveal'); // hides cells + enables anim
      var ticking = false;
      var revealTouch = function () {
        ticking = false;
        var vh = window.innerHeight || document.documentElement.clientHeight;
        touchCols.forEach(function (c, i) {
          if (c.classList.contains('is-revealed')) return;
          if (c.getBoundingClientRect().top < vh * 0.9) {
            setTimeout(function () { c.classList.add('is-revealed'); }, (i % 3) * 110);
          }
        });
      };
      var onTouchScroll = function () {
        if (!ticking) { window.requestAnimationFrame(revealTouch); ticking = true; }
      };
      window.addEventListener('scroll', onTouchScroll, { passive: true });
      window.addEventListener('resize', onTouchScroll);
      if (window.lenis && typeof window.lenis.on === 'function') window.lenis.on('scroll', onTouchScroll);
      revealTouch();                                   // reveal anything already in view
      window.addEventListener('load', revealTouch, { once: true });
      // Safety net: never leave the section permanently hidden.
      setTimeout(function () {
        touchCols.forEach(function (c) { c.classList.add('is-revealed'); });
      }, 6000);
    }

    // ── Trusted By marquee - JS-driven, identical to the homepage: constant
    //    idle velocity + horizontal click-drag to accelerate. Band pages don't
    //    load main.js, so replicate it here so the drag behaviour matches. ──
    (function initBrandsMarquee() {
      var wrapper = document.querySelector('.brands-marquee');
      if (!wrapper) return;
      var tracks = wrapper.querySelectorAll('.brands-marquee__track');
      if (!tracks.length) return;
      wrapper.classList.add('brands-marquee--js-driven'); // CSS anim off (style.css)
      var states = Array.prototype.map.call(tracks, function (track) {
        var isReverse = track.closest('.brands-marquee__row--reverse') != null;
        var idle = isReverse ? 38 : 28;
        return { track: track, isReverse: isReverse, x: 0, idleVel: idle, currentVel: idle, halfWidth: 0 };
      });
      var measureAll = function () { states.forEach(function (s) { s.halfWidth = s.track.scrollWidth / 2; }); };
      measureAll();
      wrapper.querySelectorAll('img').forEach(function (img) {
        if (!img.complete) img.addEventListener('load', measureAll, { once: true });
      });
      window.addEventListener('resize', measureAll);
      // band-extras runs deferred (before full layout) and cached images never
      // fire 'load', so re-measure once everything has settled - otherwise
      // halfWidth can stay 0 and the track never moves.
      window.addEventListener('load', measureAll);
      setTimeout(measureAll, 600);
      states.forEach(function (s) { if (s.isReverse) s.x = s.halfWidth || 0; });

      var dragging = false, dragVel = 0, lastX = 0, lastT = 0;
      wrapper.style.cursor = 'grab';
      wrapper.style.touchAction = 'pan-y';
      wrapper.addEventListener('pointerdown', function (e) {
        dragging = true; dragVel = 0; lastX = e.clientX; lastT = performance.now();
        wrapper.style.cursor = 'grabbing';
        if (wrapper.setPointerCapture) { try { wrapper.setPointerCapture(e.pointerId); } catch (_) {} }
      });
      window.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var now = performance.now();
        var dt = Math.max(0.001, (now - lastT) / 1000);
        dragVel = (e.clientX - lastX) / dt;
        lastX = e.clientX; lastT = now;
      });
      var endDrag = function () { dragging = false; dragVel = 0; wrapper.style.cursor = 'grab'; };
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);

      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        states.forEach(function (s) { s.currentVel = 0; s.track.style.transform = 'translate3d(0,0,0)'; });
        return;
      }
      var last = performance.now();
      var tick = function (now) {
        var dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        states.forEach(function (s) {
          if (!s.halfWidth) return;
          var target = s.idleVel;
          if (dragging) {
            var boost = s.isReverse ? dragVel : -dragVel;
            target = s.idleVel + Math.min(Math.max(0, boost), 500);
          }
          var smooth = dragging ? 0.15 : 0.035;
          s.currentVel += (target - s.currentVel) * smooth;
          if (s.isReverse) { s.x -= s.currentVel * dt; if (s.x <= 0) s.x += s.halfWidth; }
          else { s.x += s.currentVel * dt; if (s.x >= s.halfWidth) s.x -= s.halfWidth; }
          s.track.style.transform = 'translate3d(' + (-s.x) + 'px,0,0)';
        });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    })();
  });
})();
