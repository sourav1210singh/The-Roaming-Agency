/* ============================================================================
   BLOG + ARTICLE page behaviour (5th draft)
   ----------------------------------------------------------------------------
   Self-contained (no GSAP / main.js needed). Handles:
     1. Page-loader dismiss
     2. Bilingual EN/FR toggle
     3. Scroll-reveal via IntersectionObserver - adds `.is-visible` to any
        `.reveal` element as it scrolls into view (reuses the .reveal /
        .is-visible CSS already in style.css). Featured banners on the blog
        and images on the article page use this for the joshuas.io /
        Auwa-journal "reveal on scroll" feel.
   ============================================================================ */
(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  onReady(function () {
    // 1. Loader auto-dismiss
    var loader = document.getElementById('pageLoader');
    if (loader) {
      window.addEventListener('load', function () {
        setTimeout(function () { loader.classList.add('loaded'); }, 300);
      });
      setTimeout(function () { loader.classList.add('loaded'); }, 2000);
    }

    // 2. Bilingual EN/FR toggle
    var toggle = document.getElementById('langToggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var root = document.documentElement;
        var next = root.getAttribute('data-lang') === 'fr' ? 'en' : 'fr';
        root.setAttribute('data-lang', next);
        toggle.textContent = next === 'fr' ? 'EN' : 'FR';
        document.querySelectorAll('[data-en][data-fr]').forEach(function (el) {
          el.textContent = el.getAttribute('data-' + next);
        });
      });
    }

    // 3. Article hero — the ONE brand logo is "stuck" and flips from light
    //    (negative, sitting over the photo) to dark the moment the page
    //    scrolls to its white background. The nav still hides on scroll-down
    //    and returns on scroll-up, but the logo never leaves.
    var articleHero = document.querySelector('main.article .article-hero');
    if (articleHero) {
      var logoEl = document.querySelector('.header .logo');
      var flipPoint = 40;
      var measure = function () {
        if (logoEl) {
          var r = logoEl.getBoundingClientRect();
          flipPoint = (r.top + r.bottom) / 2; // the logo's vertical centre
        }
      };
      var wasPast = null;
      var flipLogo = function () {
        var isPast = articleHero.getBoundingClientRect().bottom <= flipPoint;
        if (isPast !== wasPast) {
          wasPast = isPast;
          document.body.classList.toggle('is-past-hero', isPast);
        }
      };
      measure();
      flipLogo();
      window.addEventListener('scroll', flipLogo, { passive: true });
      window.addEventListener('resize', function () { measure(); flipLogo(); }, { passive: true });
    }

    // 4. Scroll-reveal
    var revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    if (!('IntersectionObserver' in window)) {
      // No IO support -> just show everything.
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  });
})();
