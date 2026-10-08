/* ──────────────────────────────────────────────
   TESTIMONIAL QUOTES - five-line cap + Read more
   ──────────────────────────────────────────────

   The quotes are real Google reviews, so they come in whatever length the
   guest wrote. Left alone, a six-line quote and a four-line one in the same
   row pushed their author blocks to different heights and the row looked
   ragged - the cards are all stretched to the tallest one, but the inner
   column only reserved its own content height, so the short card's name,
   "Google Review" line and "See all reviews" link floated 21px high.

   Two halves to the fix. style.css caps every quote at five lines and makes
   the inner column fill the card, which lands all the author blocks on one
   line. This file adds a Read more toggle to the cards that are actually
   cut off - and only those, so a short quote never gets a pointless button.

   Whether a quote overflows depends on the rendered card width and on the
   font that is in use at the time, so it is measured here rather than
   guessed, then measured again once Nohemi has loaded and on resize. */
(function () {
  'use strict';

  var LABEL = {
    en: { more: 'Read more', less: 'Read less' },
    fr: { more: 'Lire la suite', less: 'Réduire' }
  };

  /* Each language has its own URL (/weddings and /fr/weddings), so the page
     is already in one language and never switches in place. The data-en /
     data-fr pair still goes on the button to match every other string. */
  function lang() {
    var el = document.documentElement;
    var l = el.getAttribute('data-lang') || el.getAttribute('lang') || 'en';
    return LABEL[l] ? l : 'en';
  }

  function label(card, btn) {
    var open = card.classList.contains('is-expanded');
    var key = open ? 'less' : 'more';
    btn.setAttribute('data-en', LABEL.en[key]);
    btn.setAttribute('data-fr', LABEL.fr[key]);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = LABEL[lang()][key];
  }

  function button(card) {
    var btn = card.querySelector('.testimonial-card__more');
    if (btn) return btn;

    var text = card.querySelector('.testimonial-card__text');
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'testimonial-card__more';
    label(card, btn);
    btn.addEventListener('click', function () {
      card.classList.toggle('is-expanded');
      label(card, btn);
    });
    text.insertAdjacentElement('afterend', btn);
    return btn;
  }

  function measure() {
    var cards = document.querySelectorAll('.testimonial-card');
    Array.prototype.forEach.call(cards, function (card) {
      var text = card.querySelector('.testimonial-card__text');
      if (!text) return;

      /* Overflow is only meaningful against the capped box, so collapse
         first and put the card back the way the reader left it. Nothing
         paints in between. */
      var open = card.classList.contains('is-expanded');
      if (open) card.classList.remove('is-expanded');
      var clipped = text.scrollHeight - text.clientHeight > 1;
      if (open) card.classList.add('is-expanded');

      if (clipped) {
        button(card).hidden = false;
        return;
      }
      /* It fits now - a wider window, say. Drop the button and any
         expansion so the card goes back to its plain state. */
      var btn = card.querySelector('.testimonial-card__more');
      if (btn) btn.hidden = true;
      if (open) {
        card.classList.remove('is-expanded');
        if (btn) label(card, btn);
      }
    });
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  var timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(measure, 150);
  }

  ready(function () {
    var texts = document.querySelectorAll('.testimonial-card__text');
    if (!texts.length) return;

    measure();

    /* Nohemi is self-hosted and can arrive after the first paint, which
       moves every line break. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(function () {});
    }

    /* A card is clamp(198px, 16.5vw, 253px) wide, so where a quote wraps
       changes with the window. Watch the quote boxes themselves rather
       than listening for resize: it catches a zoom or a rotation too, and
       it is the width that actually decides the wrap.

       Only a width change is acted on. Expanding a card changes the
       quote's height, and reacting to that would be a loop. */
    if (typeof ResizeObserver === 'function') {
      var seen = new WeakMap();
      var ro = new ResizeObserver(function (entries) {
        var moved = false;
        entries.forEach(function (entry) {
          var w = Math.round(entry.contentRect.width);
          if (seen.get(entry.target) !== w) {
            seen.set(entry.target, w);
            moved = true;
          }
        });
        if (moved) schedule();
      });
      Array.prototype.forEach.call(texts, function (t) { ro.observe(t); });
    } else {
      window.addEventListener('resize', schedule);
    }
  });
})();
