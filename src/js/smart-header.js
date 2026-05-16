/* ============================================================================
   Smart Header — hide on scroll-down, reveal on scroll-up.

   Loaded on EVERY page (homepage + 11 band sub-pages) via its own
   `<script src="…/smart-header.js" defer>` tag. Self-running on
   DOMContentLoaded; double-init guarded so accidentally including the
   file twice won't attach two scroll listeners.

   Conflict notes:
   • The homepage intro-zoom drives `header.style.transform` to fade
     the bar in during the saxophone phase. This module deliberately
     uses the separate CSS `translate` property (via `.is-hidden`
     class) so the two animations compose without fighting.
   • While the `#introZoom` section is still on-screen we do NOT
     toggle hide/show — the intro animation owns the bar there.
   ============================================================================ */

(function () {
  if (window.__smartHeaderInit) return;
  window.__smartHeaderInit = true;

  function init() {
    const header = document.getElementById('mainHeader');
    if (!header) return;

    const TOP_SHOW_THRESHOLD = 100; // always visible within the first 100px
    const DELTA_MIN = 6;            // ignore micro-scrolls
    // 3rd draft: don't pop the bar back on the FIRST small up-scroll —
    // only after a deliberate amount of upward scrolling (~2 notches),
    // so a quick up-correction to re-read something doesn't cover it.
    const REVEAL_AFTER = 150;       // px of cumulative up-scroll to reveal
    let upAccum = 0;
    // Homepage hero is a stack (sticky black panel + video that slides up).
    // We track the OUTER wrapper so smart-header stays dormant during the
    // entire intro pin period. Fallbacks for older markup names.
    const heroIntro =
      document.getElementById('heroStack') ||
      document.getElementById('heroIntro') ||
      document.getElementById('introZoom');

    let lastY = window.scrollY;
    let ticking = false;

    // Helper — toggle hide on BOTH the header element and the document body
    // so CSS rules can target sibling elements (e.g. the homepage
    // hero-center-title overlay logo, which lives outside the <header>).
    const setHidden = (hide) => {
      header.classList.toggle('is-hidden', hide);
      document.body.classList.toggle('is-header-hidden', hide);
    };

    function update() {
      ticking = false;
      const currentY = window.scrollY;
      const diff = currentY - lastY;

      // Always reveal in the top zone
      if (currentY < TOP_SHOW_THRESHOLD) {
        upAccum = 0;
        setHidden(false);
        lastY = currentY;
        return;
      }

      // Defer to the hero intro animation while its section is on screen
      if (heroIntro) {
        const rect = heroIntro.getBoundingClientRect();
        if (rect.bottom > 0) {
          upAccum = 0;
          setHidden(false);
          lastY = currentY;
          return;
        }
      }

      // Ignore tiny deltas (prevents flicker on trackpad)
      if (Math.abs(diff) < DELTA_MIN) return;

      if (diff > 0) {
        // Scrolling DOWN → hide. Reset the accumulator so a later
        // small up-correction doesn't instantly re-show the bar.
        upAccum = 0;
        setHidden(true);
      } else {
        // Scrolling UP → only reveal after a deliberate amount of
        // upward scroll. Small corrective ups keep the bar hidden.
        upAccum += -diff;
        if (upAccum >= REVEAL_AFTER) setHidden(false);
      }
      lastY = currentY;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    initMobileNav();
  }

  /* ── Shared mobile nav for the SUB-PAGES ─────────────────────────────
     The homepage ships its own `#hamburger` button + initMobileMenu()
     in main.js. The 11 band pages + faq/blog/dj only load this file
     and have NO hamburger and a hardcoded `nav--visible` on the nav —
     so at ≤768 the off-canvas drawer was stuck open with no trigger.

     This injects the same hamburger the homepage uses and wires the
     drawer + dropdown-accordion, but ONLY when the page doesn't
     already have a `#hamburger` (i.e. skip the homepage entirely).
     Pure additive: desktop is untouched because the off-canvas /
     hamburger CSS only exists inside the ≤768 media block, and on
     desktop band-page.css already forces the nav visible. */
  function initMobileNav() {
    if (document.getElementById('hamburger')) return; // homepage handles itself
    const headerInner = document.querySelector('.header__inner');
    const nav = document.getElementById('mainNav');
    if (!headerInner || !nav) return;

    // Hardcoded `nav--visible` would pin the ≤768 drawer open. Drop it;
    // desktop stays visible via band-page.css (opacity:1).
    nav.classList.remove('nav--visible');

    const btn = document.createElement('button');
    btn.className = 'nav__hamburger';
    btn.id = 'hamburger';
    btn.setAttribute('aria-label', 'Open menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    const langToggle = headerInner.querySelector('.lang-toggle');
    headerInner.insertBefore(btn, langToggle || null);

    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

    const closeDrawer = () => {
      nav.classList.remove('nav--visible');
      btn.classList.remove('open');
      btn.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
    };

    btn.addEventListener('click', () => {
      const open = nav.classList.contains('nav--visible');
      if (open) {
        closeDrawer();
      } else {
        nav.classList.add('nav--visible');
        btn.classList.add('open');
        btn.setAttribute('aria-label', 'Close menu');
        document.body.style.overflow = 'hidden';
      }
    });

    // Dropdown items (Bands / Events): on mobile a tap should expand
    // the accordion instead of navigating to the section anchor.
    nav.querySelectorAll('.nav__item--has-dropdown > .nav__link').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (!isMobile()) return;
        e.preventDefault();
        const item = link.parentElement;
        const wasOpen = item.classList.contains('is-open');
        nav.querySelectorAll('.nav__item--has-dropdown').forEach((i) => i.classList.remove('is-open'));
        if (!wasOpen) item.classList.add('is-open');
      });
    });

    // Tapping any real destination link closes the drawer.
    nav.querySelectorAll('a[href]').forEach((a) => {
      a.addEventListener('click', () => {
        if (a.closest('.nav__item--has-dropdown') &&
            a.classList.contains('nav__link')) return; // accordion toggle, not nav
        if (isMobile()) closeDrawer();
      });
    });

    // If the viewport grows back to desktop, make sure nothing is stuck.
    window.addEventListener('resize', () => {
      if (!isMobile()) closeDrawer();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
