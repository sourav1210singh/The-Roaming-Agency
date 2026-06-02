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
  });
})();
