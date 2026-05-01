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
        setHidden(false);
        lastY = currentY;
        return;
      }

      // Defer to the hero intro animation while its section is on screen
      if (heroIntro) {
        const rect = heroIntro.getBoundingClientRect();
        if (rect.bottom > 0) {
          setHidden(false);
          lastY = currentY;
          return;
        }
      }

      // Ignore tiny deltas (prevents flicker on trackpad)
      if (Math.abs(diff) < DELTA_MIN) return;

      if (diff > 0) {
        // Scrolling DOWN → hide both header + body-tied overlays
        setHidden(true);
      } else {
        // Scrolling UP → show
        setHidden(false);
      }
      lastY = currentY;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
