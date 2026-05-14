/* ============================================
   THE ROAMING AGENCY — Main JavaScript
   GSAP ScrollTrigger + Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ── Page Loader ──
  const loader = document.getElementById('pageLoader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('loaded'), 500);
  });
  // Fallback: hide loader after 3s max
  setTimeout(() => loader.classList.add('loaded'), 3000);

  // ── Init GSAP ──
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    // initLogoAnimation() replaced by the scroll-driven dock logic in
    // initIntroZoom() — kept in file for reference but no longer invoked.
    initNavigation();
    initScrollReveals();
    initTextDarkening();
    initBandSelector();
    initGlobeLazy();
  } else {
    // Fallback: show everything without animation
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    document.getElementById('mainLogo')?.classList.replace('logo--hero', 'logo--scrolled');
    document.getElementById('mainNav')?.classList.add('nav--visible');
  }

  initFAQ();
  initLanguageSwitcher();
  initMobileMenu();
  initContactForm();
  initStandardsScroll();
  initHeroIntro();
  // initDoorPortal() removed in revision round 2 — the pre-hero door
  // intro section was dropped per client direction. See item 1.1.
  initStatsCounter();
  initBrandsMarquee();
  initEventsScroll();
  initTestimonialsCarousel();
  initNavDropdowns();
  initGalleryReveal();
  // Smart-header (hide on scroll-down, show on scroll-up) lives in its own
  // standalone file `src/js/smart-header.js` so band sub-pages can load it
  // without pulling in the rest of main.js. It self-initialises on DOM ready.
});


/* ──────────────────────────────────────────────
   BRANDS MARQUEE — scroll-active speed mode
   While the page is actively scrolling, the body gets `.is-scrolling`
   so CSS can switch the marquee tracks to their faster duration. Idle
   removes the class after 250ms — short enough that intermittent wheel
   ticks chain into one continuous "fast" stretch, long enough that
   mouse-rest doesn't blink the speed change.
   ----------
   The logo backgrounds were previously cleaned at runtime via canvas
   sampling + CSS filter chains. That code was removed once the source
   PNGs were pre-processed offline (process-logos.ps1) — the cleaned
   PNGs in v2-clean/ are already pure-black on transparent, so no
   runtime treatment is needed.
   ────────────────────────────────────────────── */


/* ──────────────────────────────────────────────
   GALLERY REVEAL — scroll-driven internal gallery scroll + panel reveal
   Per client request (Option D of the gallery-cutoff fix):
   • The gallery contains 12 masonry photos and is naturally TALLER
     than the viewport. Plain sticky-top:0 would pin the gallery before
     the user could see the bottom photos, hiding them behind the
     incoming contact panel.
   • Fix: keep the section sticky 100vh tall with overflow:hidden, but
     wrap the gallery content in a `.gallery-track` element that we
     translate UPWARD as the user scrolls. The outer `.gallery-pin-stack`
     gets a tall computed height = (gallery content height + 1 viewport)
     so the sticky has enough scroll runway for two phases:
       Phase 1: translateY goes from 0 -> -(galleryHeight - 100vh).
                User sees ALL 12 photos pass by inside the sticky frame.
       Phase 2: translateY stays at its max. Gallery holds at "last
                frame". Contact (margin-top: -100vh + z-index:2) rises
                over the pinned gallery from the viewport bottom to top.
   ────────────────────────────────────────────── */
function initGalleryReveal() {
  const stack    = document.getElementById('galleryPinStack');
  const section  = document.querySelector('.gallery-section');
  const track    = document.getElementById('galleryTrack');
  const masonry  = track && track.querySelector('.gallery');
  if (!stack || !section || !track || !masonry) return;

  let vh, contentHeight, internalScroll, pinDuration, raf = 0;

  function measure() {
    vh = window.innerHeight;
    // Measure the masonry's own content height + the section's vertical
    // padding so the track has room to fully expose the last photo row.
    const cs = getComputedStyle(section);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    contentHeight = masonry.scrollHeight + padY;
    // How many px we need to translate to fully expose the bottom.
    // If the gallery already fits in 1 viewport, internalScroll = 0
    // and Phase 1 collapses to nothing — Phase 2 (panel reveal) is
    // the only phase. Either way, the contract is the same.
    internalScroll = Math.max(0, contentHeight - vh);
    // Pin runs for: internal scroll + 1 viewport (the panel reveal).
    pinDuration = internalScroll + vh;
    // Sticky's pin range = stack.offsetHeight - vh. We want that to
    // equal pinDuration, so stack.offsetHeight = pinDuration + vh.
    stack.style.height = (pinDuration + vh) + 'px';
  }

  function update() {
    raf = 0;
    const rect = stack.getBoundingClientRect();
    const max  = stack.offsetHeight - vh;
    if (max <= 0) return;
    // How far through the pin range we are (0 to 1).
    const progress = Math.max(0, Math.min(1, -rect.top / max));
    // Phase 1 ends at internalScroll / pinDuration of the progress.
    const phase1End = internalScroll / pinDuration;
    let translateY;
    if (phase1End <= 0 || progress >= phase1End) {
      translateY = internalScroll;     // Phase 2 — hold at last frame
    } else {
      const p1 = progress / phase1End; // 0 to 1 within Phase 1
      translateY = p1 * internalScroll;
    }
    track.style.transform = 'translate3d(0, ' + (-translateY) + 'px, 0)';
  }

  function onScroll() {
    if (!raf) raf = requestAnimationFrame(update);
  }

  measure();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); update(); });
  // Re-measure once each lazy image lands — masonry height can grow.
  masonry.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', () => { measure(); update(); }, { once: true });
  });
}


function initBrandsMarquee() {
  /* Revision round 2 follow-up: the previous CSS-keyframe approach
     drove the marquee with `animation-duration: var(--marquee-speed-…)`,
     and toggled the duration on row hover (60s -> 110s) and on
     body.is-scrolling (60s -> 22s). Problem: when CSS animation duration
     changes mid-animation, the browser RESNAPS the track's transform to
     a position based on the new duration percentage — producing a
     ~2000px visible JUMP on hover-in / hover-out. The hovered logo
     would literally vanish and a different logo would appear in its
     place. Fix: take the marquee off CSS animation entirely and drive
     it with a JS RAF loop that interpolates VELOCITY between target
     speeds — duration changes become smooth glides, no jump. */
  const wrapper = document.querySelector('.brands-marquee');
  if (!wrapper) return;
  const tracks = wrapper.querySelectorAll('.brands-marquee__track');
  if (!tracks.length) return;

  // Tell CSS to disable its keyframe animation on this element. The
  // matching rule .brands-marquee--js-driven .brands-marquee__track
  // sets `animation: none` so the JS-driven transform has no
  // competing source of truth.
  wrapper.classList.add('brands-marquee--js-driven');

  // Per-track state. Each track has its own scroll position + velocity.
  // halfWidth is the width of one duplicate set; the loop wraps when
  // x exceeds it, producing a seamless infinite scroll.
  const states = Array.from(tracks).map((track, idx) => {
    const isReverse = track.closest('.brands-marquee__row--reverse') != null;
    return {
      track,
      isReverse,
      x: 0,
      // Velocities in pixels per second. Row 2 (reverse) defaults a
      // bit faster to roughly match the visual pace of row 1 (its track
      // is shorter so a higher px/s keeps the perceived speed even).
      // Idle (default), hover (slowed), scrolling (sped up).
      idleVel:     isReverse ? 38 : 28,
      hoverVel:    isReverse ? 14 : 10,
      scrollVel:   isReverse ? 130 : 95,
      currentVel:  isReverse ? 38 : 28,
      targetVel:   isReverse ? 38 : 28,
      halfWidth:   0,
      hovered:     false,
    };
  });

  // Measure halfWidth on every track. The track contains duplicated
  // logo content (set A + set A again), so the loop wraps at
  // scrollWidth / 2 to seamlessly restart. Recompute on resize.
  const measureAll = () => {
    states.forEach(s => {
      s.halfWidth = s.track.scrollWidth / 2;
    });
  };
  measureAll();
  // First measurement may catch the row before logos finish loading.
  // Re-measure after each img loads.
  wrapper.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', measureAll, { once: true });
  });
  window.addEventListener('resize', measureAll);

  // Reverse rows start with track translated by -halfWidth so the
  // first wrap takes them to 0 — keeps the perceived scroll direction
  // consistent for both rows.
  states.forEach(s => {
    if (s.isReverse) s.x = s.halfWidth || 0;
  });

  // Hover handlers per row. On mouseenter, target velocity drops to
  // hoverVel; on mouseleave it goes back. The currentVel lerp below
  // smooths the transition so no instant snap is ever visible.
  states.forEach(s => {
    const row = s.track.closest('.brands-marquee__row');
    if (!row) return;
    row.addEventListener('mouseenter', () => {
      s.hovered = true;
      s.targetVel = s.hoverVel;
    });
    row.addEventListener('mouseleave', () => {
      s.hovered = false;
      // Don't override scrolling state — picked up next frame.
      s.targetVel = isPageScrolling ? s.scrollVel : s.idleVel;
    });
  });

  // Page-scroll state mirrors the old body.is-scrolling concept but
  // here we just set a boolean that the RAF loop reads. Idle timer
  // matches the original 250ms idle to keep the same feel.
  let isPageScrolling = false;
  let scrollIdleTimer = null;
  window.addEventListener('scroll', () => {
    isPageScrolling = true;
    states.forEach(s => {
      if (!s.hovered) s.targetVel = s.scrollVel;
    });
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(() => {
      isPageScrolling = false;
      states.forEach(s => {
        if (!s.hovered) s.targetVel = s.idleVel;
      });
    }, 250);
  }, { passive: true });

  // Reduced-motion: don't auto-scroll. Park each track at x=0.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    states.forEach(s => {
      s.targetVel = 0;
      s.currentVel = 0;
      s.track.style.transform = 'translate3d(0, 0, 0)';
    });
    return;
  }

  // RAF loop. dt converted to seconds so velocity stays in px/sec.
  // Velocity-smoothing lerp factor 0.035 settles in roughly ~600ms
  // (enough to feel deliberate but not laggy).
  let last = performance.now();
  const SMOOTHING = 0.035;
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); // clamp huge dt after tab-switch
    last = now;
    for (const s of states) {
      if (!s.halfWidth) continue;
      s.currentVel += (s.targetVel - s.currentVel) * SMOOTHING;
      if (s.isReverse) {
        s.x -= s.currentVel * dt;
        if (s.x <= 0) s.x += s.halfWidth;
      } else {
        s.x += s.currentVel * dt;
        if (s.x >= s.halfWidth) s.x -= s.halfWidth;
      }
      s.track.style.transform = `translate3d(${-s.x}px, 0, 0)`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}


/* ──────────────────────────────────────────────
   EVENTS WE SERVE — sticky-stack scroll engine
   • Outer .events provides ~400vh of scroll runway. We map progress
     0→1 across the 4 categories (Weddings, Corporate, Private,
     Artistic Direction).
   • activeIdx = floor(progress * N), clamped — flips category content
     and matching photo set.
   • Even indexes (0, 2)  → light theme (white bg, dark text).
     Odd indexes  (1, 3)  → "negative" dark theme (black bg, white text).
     The CSS handles the actual colour transition; JS just toggles
     `.is-negative` on .events__sticky.
   • Vertical line on the left fills 0→100% smoothly via CSS variable
     `--events-progress` set on .events__progress-fill.
   ────────────────────────────────────────────── */
function initEventsScroll() {
  const section = document.getElementById('events');
  if (!section) return;
  const sticky    = section.querySelector('.events__sticky');
  const cats      = section.querySelectorAll('.events__cat');
  const photoSets = section.querySelectorAll('.events__photo-set');
  const progressFill = document.getElementById('eventsProgressFill');
  if (!sticky || !cats.length) return;

  const N = cats.length; // 4 categories
  let lastIdx = -1;
  let raf = 0;
  // Client tweak: track scroll direction so the curtain reveal goes
  // in the same direction the user is scrolling. Default 'down' on
  // first activation (no direction info yet).
  let lastScrollY = window.scrollY;
  let scrollDir = 'down';

  const update = () => {
    raf = 0;
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const progress = Math.max(0, Math.min(1, -rect.top / total));

    // Detect scroll direction. Small dead zone (0.5px) so noise from
    // touchpad / lenis doesn't keep flipping the value on stillness.
    const currentY = window.scrollY;
    if (currentY > lastScrollY + 0.5) scrollDir = 'down';
    else if (currentY < lastScrollY - 0.5) scrollDir = 'up';
    lastScrollY = currentY;

    // Active category — split runway evenly between N stops.
    const idx = Math.max(0, Math.min(N - 1, Math.floor(progress * N)));

    // Progress line — fills 0→100% over the whole section.
    if (progressFill) {
      progressFill.style.setProperty('--events-progress', progress.toFixed(4));
    }

    if (idx !== lastIdx) {
      lastIdx = idx;
      cats.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      // Photo sets: apply the direction class FIRST (with a forced
      // reflow to ensure CSS animations re-trigger), then `.is-active`.
      // This way the curtain keyframe selected (down vs up) is correct
      // on the very first frame the animation runs — no wrong-direction
      // flash. Sets that aren't active strip all classes.
      photoSets.forEach((p, i) => {
        if (i === idx) {
          // Remove old state, force reflow, set new direction + active.
          p.classList.remove('is-active',
                             'events__photo-set--reveal-up',
                             'events__photo-set--reveal-down');
          void p.offsetWidth; // reflow so the keyframe can re-fire
          p.classList.add(scrollDir === 'up'
            ? 'events__photo-set--reveal-up'
            : 'events__photo-set--reveal-down');
          p.classList.add('is-active');
        } else {
          p.classList.remove('is-active',
                             'events__photo-set--reveal-up',
                             'events__photo-set--reveal-down');
        }
      });
      // Negative bg swap on odd indexes.
      sticky.classList.toggle('is-negative', idx % 2 === 1);
      // Decorative stripes (is-stripes-active class trigger) removed
      // per client — see corresponding CSS deletion. The reveal effect
      // is now driven entirely by the photo curtain animation.
    }
  };

  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* Client tweak (Option A): cursor-follow parallax on the active photo
     pair. Scroll still drives WHICH category is active (scroll-driven
     cycling above). On top of that, while the cursor moves within the
     events section, both photos drift gently in the cursor's direction
     to make the imagery feel alive. Front photo drifts more than back
     (foreground gets more parallax = depth illusion). Lerp toward
     target offset each rAF tick for smooth motion; idle when settled
     so the RAF loop bails when there's no work. */
  const photoStack = sticky.querySelector('.events__photo-stack');
  if (photoStack) {
    let cursorRaf = 0;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    const MAX_OFFSET = 18;
    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.08);
      currentY = lerp(currentY, targetY, 0.08);
      photoStack.style.setProperty('--cursor-x', currentX.toFixed(2) + 'px');
      photoStack.style.setProperty('--cursor-y', currentY.toFixed(2) + 'px');
      if (Math.abs(currentX - targetX) > 0.05 || Math.abs(currentY - targetY) > 0.05) {
        cursorRaf = requestAnimationFrame(tick);
      } else {
        cursorRaf = 0;
      }
    };

    sticky.addEventListener('mousemove', (e) => {
      const rect = sticky.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1; // -1..+1
      const ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1; // -1..+1
      targetX = nx * MAX_OFFSET;
      targetY = ny * MAX_OFFSET;
      if (!cursorRaf) cursorRaf = requestAnimationFrame(tick);
    });

    sticky.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
      if (!cursorRaf) cursorRaf = requestAnimationFrame(tick);
    });
  }
}


/* ──────────────────────────────────────────────
   DOOR PORTAL — pre-hero cinematic intro (REMOVED)
   Revision round 2, item 1.1 — client asked for the pre-hero door
   intro to be removed entirely. The section, its CSS (~500 lines),
   the hero-door-bg.jpg / door-reveal.mp4 assets, and this function
   have all been deleted so the page starts directly on the hero stack.
   ────────────────────────────────────────────── */



/* ──────────────────────────────────────────────
   STATS COUNTER
   Counts each `.stat__number` from 0 to its `data-count` value when the
   element first scrolls into view. Optional `data-prefix` ("+") and
   `data-suffix` ("+") wrap the rendered number so we can render +10 vs
   600+ without two different code paths.
   ────────────────────────────────────────────── */
function initStatsCounter() {
  const numbers = document.querySelectorAll('.stat__number');
  if (!numbers.length) return;

  const animateCount = (el) => {
    const target = parseInt(el.dataset.count || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1700;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // ease-out-cubic

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const value = Math.round(target * ease(t));
      el.textContent = `${prefix}${value}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.6 },
  );

  numbers.forEach((el) => io.observe(el));
}


/* ──────────────────────────────────────────────
   1. LOGO ANIMATION
   Logo starts centered on hero → shrinks to top-left on scroll
   ────────────────────────────────────────────── */
function initLogoAnimation() {
  const logo = document.getElementById('mainLogo');
  const logoText = logo?.querySelector('.logo__text');
  const logoTagline = logo?.querySelector('.logo__tagline');
  const nav = document.getElementById('mainNav');
  // Use intro-zoom section as the "hero" trigger since old hero was removed
  const hero = document.getElementById('introZoom') || document.getElementById('hero');
  const header = document.getElementById('mainHeader');
  const hamburger = document.getElementById('hamburger');
  if (!logo || !hero || !logoText) return;

  let isScrolled = false;
  const isMobile = () => window.innerWidth <= 768;

  // Set initial hero state
  if (window.scrollY < 100) {
    logo.classList.add('logo--hero');
    logo.classList.remove('logo--scrolled');
    nav.classList.remove('nav--visible');
    // On mobile, always show hamburger even in hero state
    if (hamburger) hamburger.style.display = isMobile() ? '' : 'none';
  }

  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => {
      const progress = self.progress;

      if (progress > 0.15 && !isScrolled) {
        isScrolled = true;

        // Smooth transition: logo shrinks and moves to top-left
        logo.classList.remove('logo--hero');
        logo.classList.add('logo--scrolled');

        gsap.fromTo(logoText,
          { opacity: 0.5, scale: 1.3 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
        );

        // Nav fades in smoothly
        gsap.to(nav, {
          opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
          onStart: () => { nav.classList.add('nav--visible'); }
        });

        // Header background fades in
        if (header) header.classList.add('header--scrolled');
        if (hamburger) hamburger.style.display = '';

      } else if (progress <= 0.15 && isScrolled) {
        isScrolled = false;

        // Smooth transition: logo grows and returns to center
        gsap.to(nav, {
          opacity: 0, y: -10, duration: 0.3, ease: 'power2.in',
          onComplete: () => { nav.classList.remove('nav--visible'); }
        });

        // Small delay then switch logo back
        gsap.delayedCall(0.15, () => {
          logo.classList.add('logo--hero');
          logo.classList.remove('logo--scrolled');

          gsap.fromTo(logoText,
            { opacity: 0.5, scale: 0.7 },
            { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }
          );

          if (logoTagline) {
            gsap.fromTo(logoTagline,
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' }
            );
          }
        });

        if (header) header.classList.remove('header--scrolled');
        if (hamburger) hamburger.style.display = isMobile() ? '' : 'none';
      }
    }
  });
}


/* ──────────────────────────────────────────────
   2. NAVIGATION
   Horizontal band nav with smooth scroll
   ────────────────────────────────────────────── */
function initNavigation() {
  const navList = document.getElementById('bandNavList');
  if (!navList) return;

  // Smooth horizontal scroll with mouse wheel (lerp-based)
  let targetScroll = navList.scrollLeft;
  let currentScroll = navList.scrollLeft;
  let scrolling = false;

  function smoothScroll() {
    currentScroll += (targetScroll - currentScroll) * 0.4;
    navList.scrollLeft = currentScroll;
    if (Math.abs(targetScroll - currentScroll) > 0.5) {
      requestAnimationFrame(smoothScroll);
    } else {
      scrolling = false;
      navList.scrollLeft = targetScroll;
    }
  }

  navList.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetScroll = Math.max(0, Math.min(
      navList.scrollWidth - navList.clientWidth,
      targetScroll + e.deltaY * 1.5
    ));
    if (!scrolling) {
      scrolling = true;
      currentScroll = navList.scrollLeft;
      requestAnimationFrame(smoothScroll);
    }
  }, { passive: false });

  // Smooth drag scroll
  let isDown = false;
  let startX, dragScrollLeft;

  navList.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - navList.offsetLeft;
    dragScrollLeft = navList.scrollLeft;
  });

  navList.addEventListener('mouseleave', () => isDown = false);
  navList.addEventListener('mouseup', () => isDown = false);
  navList.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - navList.offsetLeft;
    const walk = (x - startX) * 1.5;
    navList.scrollLeft = dragScrollLeft - walk;
    targetScroll = navList.scrollLeft;
    currentScroll = navList.scrollLeft;
  });
}


/* ──────────────────────────────────────────────
   3. SCROLL REVEAL ANIMATIONS
   Elements with .reveal class animate in on scroll
   ────────────────────────────────────────────── */
function initScrollReveals() {
  const reveals = document.querySelectorAll('.reveal');

  reveals.forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // Stagger standard cards within each .standards container
  document.querySelectorAll('.standards').forEach(grid => {
    const cards = grid.querySelectorAll('.standard-card');
    gsap.fromTo(cards,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: grid,
          start: 'top 80%',
        }
      }
    );
  });
}


/* ──────────────────────────────────────────────
   3b. TEXT DARKENING (travelnextlvl.de style)
   Text starts light/transparent, darkens as user scrolls
   ────────────────────────────────────────────── */
function initTextDarkening() {
  const section = document.getElementById('whoWeAre');
  if (!section) return;

  const subtitle = section.querySelector('.section__subtitle');
  if (!subtitle) return;

  // Split text into words and wrap each in a span. Each word starts at a
  // dim opacity then brightens to full as the user scrolls through the
  // section (scroll-scrubbed cascade with a 3-word feather).
  // We let CSS `currentColor` drive the tint — that way the same effect
  // works on BOTH dark-bg sections (light text) and light-bg sections
  // (dark text), without hard-coding any rgba() values in JS.
  const text = subtitle.textContent.trim();
  const words = text.split(/\s+/);
  subtitle.innerHTML = words.map((word) =>
    `<span class="darken-word" style="opacity: 0.18; transition: opacity 0.35s ease-out;">${word} </span>`
  ).join('');

  const wordSpans = subtitle.querySelectorAll('.darken-word');

  ScrollTrigger.create({
    trigger: subtitle,
    start: 'top 85%',
    end: 'bottom 55%',
    scrub: 0.4,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const progress = self.progress;
      const totalWords = wordSpans.length;
      const reveal = progress * (totalWords + 3);
      wordSpans.forEach((span, i) => {
        const wordProgress = Math.max(0, Math.min(1, (reveal - i) / 3));
        // 0.18 (dim) → 1.0 (full). Colour comes from the parent via
        // `currentColor` so the wrapping section's `color` rule decides
        // whether words read as cream-on-dark or grey-on-light.
        span.style.opacity = String(0.18 + wordProgress * 0.82);
      });
    },
  });

  // Force ScrollTrigger to recalculate positions once the rest of the page
  // (intro-zoom 600vh section, fonts, etc.) has settled. Fixes cases where
  // the trigger starts/end were measured against an incomplete layout and
  // the animation never fires when the section scrolls into view.
  setTimeout(() => {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }, 400);
}


/* ──────────────────────────────────────────────
   4. BAND SELECTOR
   "Choose Your Band" — dynamic background + text
   ────────────────────────────────────────────── */
function initBandSelector() {
  const items = document.querySelectorAll('.band-selector__item');
  const bgImages = document.querySelectorAll('.band-selector__bg-image');
  const descEl = document.getElementById('bandDesc');
  if (!items.length) return;

  // Band descriptions from content
  const bandDescriptions = {
    brotherockers: {
      en: 'Based on the French Riviera, available worldwide. Composed of international musicians fluent in French, English, Italian, Spanish, and Portuguese, The Brotherockers transform your drinks and dinners into unforgettable memories.',
      fr: 'Basés sur la Côte d\'Azur, disponibles dans le monde entier. Composés de musiciens internationaux, les Brotherockers transforment vos cocktails et dîners en souvenirs inoubliables.'
    },
    kingsmen: {
      en: 'A quintet featuring lead singers who play instruments plus a distinctive saxophone player. Stunning vocals, live instruments, and powerful energy to events worldwide.',
      fr: 'Un quintette avec des chanteurs qui jouent des instruments et un saxophoniste distinctif. Des voix magnifiques et une énergie puissante pour vos événements.'
    },
    peppermints: {
      en: 'The Peppermints combine British pop/rock, French classics, Latin rhythms, and Irish folk in a refreshing cocktail. A breath of fresh air for your events.',
      fr: 'Les Peppermints combinent pop/rock britannique, classiques français, rythmes latins et folk irlandais dans un cocktail rafraîchissant.'
    },
    gentlemen: {
      en: 'Composed of musicians from France and Latin America, The Gentlemen blend diverse musical styles. They perform in five languages with flexible lineup options.',
      fr: 'Composés de musiciens de France et d\'Amérique latine, les Gentlemen mélangent des styles musicaux divers en cinq langues.'
    },
    serenades: {
      en: 'A talented blend of Italian and French musicians delivering timeless Italian charm mixed with international hits, jazz, bossa nova, and piano elegance.',
      fr: 'Un mélange talentueux de musiciens italiens et français offrant un charme italien intemporel mêlé de hits internationaux, jazz et bossa nova.'
    },
    supersonics: {
      en: 'A powerful roaming band blending UK vocals with French musical talent. British-American pop rock hits with timeless French, Italian, and Spanish classics.',
      fr: 'Un groupe itinérant puissant mélangeant des voix britanniques avec le talent musical français. Pop rock anglo-américain avec des classiques intemporels.'
    },
    rendezvous: {
      en: 'Specializing in 60s and 70s hits with sharp style, breathtaking vocal harmonies, and legendary guitar solos. Over 10 years of experience.',
      fr: 'Spécialisé dans les hits des années 60 et 70 avec un style pointu, des harmonies vocales à couper le souffle et des solos de guitare légendaires.'
    },
    cafecreme: {
      en: 'Paris, mon amour. Café Crème brings a distinguished touch — soul, neo soul, pop, and jazz. The reference for strolling music based in Paris.',
      fr: 'Paris, mon amour. Café Crème apporte une touche distinguée — soul, neo soul, pop et jazz. La référence de la musique itinérante basée à Paris.'
    },
    whysoserious: {
      en: 'An extraordinary experience awaits. Details coming soon.',
      fr: 'Une expérience extraordinaire vous attend. Détails à venir.'
    },
    blackjacks: {
      en: 'An extraordinary experience awaits. Details coming soon.',
      fr: 'Une expérience extraordinaire vous attend. Détails à venir.'
    },
    dj: {
      en: 'Johnny Molotov — The Party Engineer. The only man performing live with a roaming band before switching to an unbelievable DJ set.',
      fr: 'Johnny Molotov — L\'ingénieur de la fête. Le seul homme à se produire en live avec un groupe itinérant avant de passer à un set DJ incroyable.'
    }
  };

  const currentLang = () => document.documentElement.getAttribute('data-lang') || 'en';

  const list = document.getElementById('bandList');
  const viewport = document.querySelector('.band-selector__viewport');
  const section = document.getElementById('chooseBand');
  const sticky = document.querySelector('.band-selector__sticky');

  /* setActive(idx) — single source of truth for which band is "current".
     Centring trick: translate the list by `-itemIndex × itemHeight` so the
     active row sits at the centre of the viewport's mask window. The
     description crossfades only when the band actually changes (avoids
     flicker every scroll tick). */
  let currentBand = null;
  function setActive(idx) {
    idx = Math.max(0, Math.min(idx, items.length - 1));
    const item = items[idx];
    if (!item) return;
    const band = item.dataset.band;

    // Translate the list so the active item centres in the viewport.
    if (list && viewport) {
      const itemHeight = item.offsetHeight;
      const viewportHeight = viewport.clientHeight;
      const offset = (viewportHeight / 2) - (itemHeight / 2) - (idx * itemHeight);
      list.style.transform = `translateY(${offset}px)`;
    }

    // Active class — gold colour, no line.
    items.forEach(i => i.classList.remove('is-active', 'active'));
    item.classList.add('is-active');

    // Crossfade matching B&W image.
    bgImages.forEach(bg => {
      const match = bg.dataset.band === band;
      bg.classList.toggle('is-active', match);
      bg.classList.toggle('active', match);
    });

    // Description swap — only on real band change.
    if (band !== currentBand) {
      currentBand = band;
      if (descEl && bandDescriptions[band]) {
        const lang = currentLang();
        const text = bandDescriptions[band][lang] || bandDescriptions[band].en;
        gsap.to(descEl, {
          opacity: 0,
          y: 10,
          duration: 0.2,
          onComplete: () => {
            descEl.textContent = text;
            gsap.to(descEl, { opacity: 1, y: 0, duration: 0.3 });
          }
        });
      }
    }
  }

  // Click on a band name jumps to it AND lets the anchor navigate to the
  // band's page. We hold default for a tiny beat so the gold flash is
  // visible before the page transition kicks in.
  items.forEach((item, idx) => {
    item.addEventListener('click', (e) => {
      // Allow default link navigation — no preventDefault.
      setActive(idx);
    });
  });

  /* Scroll-driven active band — reads progress through the OUTER tall
     section (which provides 500vh of scroll runway). The sticky inner
     stays pinned for that whole stretch; we map progress 0→1 across the
     11 bands. We use a plain rAF + scroll listener instead of ScrollTrigger
     here so it survives even if GSAP fails to load. */
  if (section && sticky) {
    let raf = 0;
    const updateFromScroll = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      // How far through the pinned runway we are (0 at first reveal, 1 at exit).
      const progress = Math.max(0, Math.min(1, -rect.top / total));
      // Map progress across N bands. Slight interior bias so the first and
      // last bands aren't only briefly visible at the extremes.
      const idx = Math.round(progress * (items.length - 1));
      if (!items[idx].classList.contains('is-active')) setActive(idx);
    };
    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(updateFromScroll);
    }, { passive: true });
    window.addEventListener('resize', updateFromScroll);
    // Initialise — place the list correctly on load.
    setActive(0);
    updateFromScroll();
  } else {
    setActive(0);
  }
}


/* ──────────────────────────────────────────────
   4b. GLOBE — LAZY-LOAD WRAPPER
   Three.js (~150 KB minified) is NOT loaded eagerly. We watch the
   #worldwide section with an IntersectionObserver tuned to a 600px
   "approaching" rootMargin — once the user scrolls within 600px of
   the globe, we dynamically inject the Three.js <script> tag and
   call the original initGlobeAnimation() once it loads.
   Result: every other page (band sub-pages, blog, FAQ-only browsers
   on the homepage) skips the 150 KB JS download entirely.
   ────────────────────────────────────────────── */
function initGlobeLazy() {
  const section = document.getElementById('worldwide');
  if (!section) return;

  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    const tag = document.createElement('script');
    tag.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    tag.onload = () => {
      // Three.js is now available globally; run the original setup.
      if (typeof initGlobeAnimation === 'function') initGlobeAnimation();
    };
    document.head.appendChild(tag);
  };

  // Approaching trigger — fire 600px before the section enters viewport
  // so Three.js has time to download + parse before the user sees the globe.
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      load();
      io.disconnect();
    }
  }, { rootMargin: '600px 0px' });
  io.observe(section);
}


/* ──────────────────────────────────────────────
   4c. GLOBE ANIMATION (amra.com style)
   Cards stagger-reveal on scroll, globe spins
   ────────────────────────────────────────────── */
function initGlobeAnimation() {
  const section = document.getElementById('worldwide');
  const container = document.getElementById('globeContainer');
  const cardsEl = document.getElementById('globeCards');
  const canvas = document.getElementById('globeCanvas');
  if (!container || !section || !cardsEl || !canvas) return;
  if (typeof THREE === 'undefined') { console.warn('THREE.js not loaded'); return; }

  // === THREE.JS SETUP ===
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 3.2;

  // Solid white inner sphere — hides back-side lines
  const solidGeo = new THREE.SphereGeometry(0.99, 64, 32);
  const solidMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const solidSphere = new THREE.Mesh(solidGeo, solidMat);

  // Globe group — rotate both together
  const globe = new THREE.Group();
  globe.add(solidSphere);

  // Latitude rings — every 15°
  const latMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
  for (let lat = -75; lat <= 75; lat += 15) {
    const phi = (90 - lat) * Math.PI / 180;
    const r = Math.sin(phi);
    const y = Math.cos(phi);
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    globe.add(new THREE.Line(lineGeo, latMat));
  }

  // Longitude rings — every 15°
  const lonMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
  for (let lon = 0; lon < 360; lon += 15) {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const phi = (i / 64) * Math.PI;
      const theta = lon * Math.PI / 180;
      pts.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    globe.add(new THREE.Line(lineGeo, lonMat));
  }

  scene.add(globe);

  function resizeRenderer() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  // === CITY CARDS ===
  const R = 280;
  // Each city carries its own music-themed icon + brand-palette colour, so
  // every card that pops on the globe feels distinct — amra.com-style variety
  // without using external platform logos. Colours are hand-picked from a
  // luxury palette that complements the gold brand accent.
  const cities = [
    { name: 'Miami',     country: 'USA',             lat:  10, lon:  -80, img: 'gallery-25.jpg', icon: '🎷', color: '#c7853d' },
    { name: 'London',    country: 'UNITED KINGDOM',  lat:  55, lon:  -55, img: 'gallery-05.jpg', icon: '🎸', color: '#8b2635' },
    { name: 'Barcelona', country: 'SPAIN',           lat: -15, lon:  -30, img: 'gallery-09.jpg', icon: '🎺', color: '#d4a843' },
    { name: 'Paris',     country: 'FRANCE',          lat:  45, lon:   -5, img: 'gallery-03.jpg', icon: '🎻', color: '#6b4423' },
    { name: 'Nice',      country: 'FRENCH RIVIERA',  lat: -30, lon:   15, img: 'gallery-01.jpg', icon: '🎹', color: '#1e3a5f' },
    { name: 'Cannes',    country: 'FRENCH RIVIERA',  lat:  20, lon:   35, img: 'gallery-19.jpg', icon: '🎵', color: '#b28220' },
    { name: 'Rome',      country: 'ITALY',           lat: -45, lon:   55, img: 'gallery-11.jpg', icon: '🎤', color: '#5d3a8e' },
    { name: 'Lake Como', country: 'ITALY',           lat:  55, lon:   75, img: 'gallery-13.jpg', icon: '🎶', color: '#2e7d4a' },
    { name: 'Monaco',    country: 'MONACO',          lat:   0, lon:   95, img: 'gallery-07.jpg', icon: '🎧', color: '#722f37' },
    { name: 'Santorini', country: 'GREECE',          lat: -35, lon:  115, img: 'gallery-15.jpg', icon: '🥁', color: '#1a6b6b' },
    { name: 'Dubai',     country: 'UAE',             lat:  40, lon:  140, img: 'gallery-17.jpg', icon: '🎙️', color: '#c77d6b' },
    { name: 'Riyadh',    country: 'SAUDI ARABIA',    lat: -10, lon:  165, img: 'gallery-27.jpg', icon: '🎼', color: '#a88c4c' },
    { name: 'St-Tropez', country: 'FRANCE',          lat: -50, lon: -105, img: 'gallery-21.jpg', icon: '📯', color: '#8e4c3a' },
    { name: 'Corsica',   country: 'FRANCE',          lat:  30, lon: -130, img: 'gallery-23.jpg', icon: '🎚️', color: '#3d5a5f' },
  ];

  // Per client revision: every card uses the SAME black map-pin icon and
  // shows ONE line of text only (the place name). The previous per-city
  // emoji + country-subtitle layout was dropped — kept the data fields in
  // the city objects above so future iterations can resurrect them without
  // re-hand-crafting the lat/lon table.
  const PIN_SVG = `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>`;

  cities.forEach((city) => {
    const card = document.createElement('div');
    card.className = 'globe-card';
    card.dataset.lat = city.lat;
    card.dataset.lon = city.lon;
    card.innerHTML = `
      <div class="globe-card__icon">${PIN_SVG}</div>
      <div class="globe-card__info">
        <span class="globe-card__city">${city.name}</span>
      </div>
      <div class="globe-card__photo"><img src="src/assets/images/gallery/${city.img}" alt="Performance in ${city.name}"></div>
    `;
    cardsEl.appendChild(card);
  });

  const cardEls = Array.from(cardsEl.querySelectorAll('.globe-card'));
  const layout = section.querySelector('.globe-layout');
  if (layout) layout.style.cssText = 'position: sticky; top: 60px;';

  // Per client revision: cards no longer cycle in/out. All 14 stay at
  // their actual lat/lon (set when the card was created from the cities
  // array) and are visible whenever they're on the FRONT hemisphere of
  // the rotating globe. The animate() loop below maps each card's 3D
  // projection to a screen position every frame and only fades a card
  // when it crosses to the back of the globe. The transcript was
  // explicit: "locations should remain fixed (not disappear)" — so the
  // staggered queue / FRONT_ZONES / activate-one-card lifecycle that
  // was here before has been removed entirely.

  function project(lat, lon, rotY) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + rotY) * Math.PI / 180;
    const x3d = R * Math.sin(phi) * Math.cos(theta);
    const y3d = -R * Math.cos(phi);
    const z3d = R * Math.sin(phi) * Math.sin(theta);
    return { x: x3d, y: y3d, z: z3d, visible: z3d > -R * 0.6 };
  }

  let currentRotY = -30;
  let targetRotY = -30;

  function animate() {
    currentRotY += (targetRotY - currentRotY) * 0.12;
    globe.rotation.y = currentRotY * Math.PI / 180;

    resizeRenderer();
    renderer.render(scene, camera);

    const containerRect = container.getBoundingClientRect();
    const cw = containerRect.width;
    const ch = containerRect.height;

    // Sphere occupies ~81% of canvas width (derived from Three.js camera at z=3,
    // FOV=45°, sphere radius=1). We scale card placement to the actual sphere
    // silhouette so cards never drift off into empty canvas area.
    const SPHERE_SCREEN_RATIO = 0.81;
    const sphereRadiusPx = (Math.min(cw, ch) / 2) * SPHERE_SCREEN_RATIO;
    const centerX = cw / 2;
    const centerY = ch / 2;

    cardEls.forEach((card) => {
      const lat = parseFloat(card.dataset.lat);
      const lon = parseFloat(card.dataset.lon);
      const p = project(lat, lon, currentRotY);

      // Position card center relative to sphere center, scaled to actual
      // sphere px radius.
      const px = centerX + (p.x / R) * sphereRadiusPx;
      const py = centerY + (p.y / R) * sphereRadiusPx;
      const zNorm = (p.z + R) / (R * 2);  // 0 = back of globe, 1 = front

      // Normalized distance from sphere center in sphere-radius units
      // (0 = centre, 1 = silhouette edge).
      const distFromCenter = Math.sqrt(p.x * p.x + p.y * p.y) / R;

      // EDGE FADE — soften cards near the sphere rim so they don't read
      // as "floating outside" the globe.
      const edgeStart = 0.78;
      const edgeEnd   = 0.94;
      const edgeFactor = distFromCenter < edgeStart
        ? 1
        : Math.max(0, 1 - (distFromCenter - edgeStart) / (edgeEnd - edgeStart));
      const edgeEase = edgeFactor * edgeFactor * (3 - 2 * edgeFactor);

      // FRONT/BACK OPACITY — cards on the front hemisphere stay fully
      // visible; back-of-globe cards fade out smoothly. The transition
      // band (0.45 → 0.55) sits right at the silhouette so a city
      // rotating to the back fades, not snaps. Multiplied by edge fade
      // for rim softening.
      const frontOpacity =
        zNorm >= 0.55 ? 1 :
        zNorm <= 0.45 ? 0 :
        (zNorm - 0.45) / 0.10;
      const cardOpacity = frontOpacity * edgeEase;

      // Depth-based scale — front cards larger, back cards a touch
      // smaller. Subtle (1.0 base, +0.25 at full front) so we don't
      // pulse the cards as the globe spins.
      const cardScale = 0.85 + zNorm * 0.30;

      card.style.left = px + 'px';
      card.style.top = py + 'px';
      card.style.transform = `translate(-50%, -50%) scale(${cardScale})`;
      card.style.opacity = cardOpacity;
      card.style.zIndex = Math.round(p.z + R);
      card.style.pointerEvents = cardOpacity > 0.5 ? 'auto' : 'none';
      // Light blur on cards still rotating off the front side — front
      // cards stay sharp, no blur applied at all when zNorm >= 0.7.
      card.style.filter = zNorm >= 0.7
        ? 'none'
        : `blur(${(0.7 - zNorm) * 3}px)`;
    });

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  /* Revision round 2 M2+M3: previously the globe rotation was driven
     by SCROLL (scroll progress mapped to -120° → +120°), which made
     the markers drift across the screen as the user scrolled past
     this section — visually noisy. Per client direction we removed
     that scroll listener entirely; rotation is now driven by HOVER:
     the cursor X position over the globe container linearly maps to
     -75° → +75° rotation. When the cursor leaves, the globe eases
     back to its idle angle (-30°) so it never sits at a frozen
     awkward orientation. */
  const IDLE_ROT = -30;
  const HOVER_RANGE = 75; // ± degrees from idle as cursor sweeps L↔R

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    // Normalise cursor X to [-1, 1] across the container.
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    targetRotY = IDLE_ROT + nx * HOVER_RANGE;
  });

  container.addEventListener('mouseleave', () => {
    targetRotY = IDLE_ROT;
  });
}


/* ──────────────────────────────────────────────
   5. FAQ ACCORDION
   ────────────────────────────────────────────── */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq__item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq__question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      faqItems.forEach(i => i.classList.remove('open'));

      // Toggle current
      if (!isOpen) item.classList.add('open');
    });
  });
}


/* ──────────────────────────────────────────────
   6. LANGUAGE SWITCHER (EN/FR)
   ────────────────────────────────────────────── */
function initLanguageSwitcher() {
  const toggles = [
    document.getElementById('langToggle'),
    document.getElementById('langToggleFixed')
  ].filter(Boolean);
  if (!toggles.length) return;

  const switchLang = () => {
    const html = document.documentElement;
    const currentLang = html.getAttribute('data-lang');
    const newLang = currentLang === 'en' ? 'fr' : 'en';

    html.setAttribute('data-lang', newLang);
    html.setAttribute('lang', newLang);

    // Update ALL toggle buttons
    toggles.forEach(t => t.textContent = newLang === 'en' ? 'FR' : 'EN');

    // Update all [data-en] / [data-fr] elements
    document.querySelectorAll('[data-en][data-fr]').forEach(el => {
      const text = el.getAttribute(`data-${newLang}`);
      if (text) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else {
          // Preserve child elements (like .faq__icon)
          const children = Array.from(el.children);
          el.textContent = text;
          children.forEach(child => el.appendChild(child));
        }
      }
    });

    // Update band selector description
    const descEl = document.getElementById('bandDesc');
    const activeBand = document.querySelector('.band-selector__item.is-active, .band-selector__item.active');
    if (descEl && activeBand) {
      activeBand.click();
    }

    // Re-apply text darkening if active
    const whoSection = document.getElementById('whoWeAre');
    if (whoSection) {
      const subtitle = whoSection.querySelector('.section__subtitle');
      if (subtitle) {
        const newText = subtitle.getAttribute('data-' + newLang) || subtitle.textContent;
        const words = newText.trim().split(/\s+/);
        subtitle.innerHTML = words.map(word =>
          `<span class="darken-word" style="opacity: 1; transition: opacity 0.3s ease;">${word} </span>`
        ).join('');
      }
    }
  };

  // Attach to ALL toggle buttons
  toggles.forEach(t => t.addEventListener('click', switchLang));
}


/* ──────────────────────────────────────────────
   7. MOBILE MENU
   ────────────────────────────────────────────── */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('mainNav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.contains('nav--visible');

    if (isOpen) {
      nav.classList.remove('nav--visible');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
    } else {
      nav.classList.add('nav--visible');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-label', 'Close menu');
      document.body.style.overflow = 'hidden';
    }
  });

  // Close menu when clicking a link
  nav.querySelectorAll('.nav__band-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav--visible');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}


/* ──────────────────────────────────────────────
   8. CONTACT FORM
   ────────────────────────────────────────────── */
/* ──────────────────────────────────────────────
   9. STANDARDS HORIZONTAL SCROLL (icebergdoc style)
   Scroll down → cards move left-to-right, background changes
   ────────────────────────────────────────────── */
/* ──────────────────────────────────────────────
   10. HERO INTRO (logo + tagline on black, scroll → logo docks to header)
   Replaces the old saxophone-zoom intro.
   ────────────────────────────────────────────── */
function initHeroIntro() {
  // Scroll progress is driven by the OUTER stack wrapper (which is twice
  // the viewport height now that the video is layered over the sticky
  // black panel). The inner #heroIntro is sticky inside that stack.
  const stack = document.getElementById('heroStack');
  const section = document.getElementById('heroIntro');
  const tagline = document.getElementById('heroTagline');
  const header = document.getElementById('mainHeader');
  const heroCenterTitle = document.getElementById('heroCenterTitle');
  if (!section || !heroCenterTitle) return;

  // Re-export under the legacy name so any external callers still work.
  // Everything below is the simplified flow — no saxophone, no white panel,
  // no music notes, no side panels. Just: logo travels, tagline fades, header
  // chrome reveals, all driven by scroll progress through the hero section.

  // Lerped scroll-progress through the hero-intro section. 0 = at top of
  // the page (logo + tagline at rest), 1 = scrolled past one full hero
  // height (logo docked in header, tagline gone).
  let targetRaw = 0;
  let currentRaw = 0;

  // Pixel target of the docked logo in the header. Re-measured on
  // resize and after fonts load so the landing spot always matches the
  // real header layout.
  let logoTarget = { x: 160, y: 34, fontSizePx: 20, dockedWidth: 220 };

  function measureLogoTarget() {
    const headerEl = document.getElementById('mainHeader');
    if (!headerEl) return;
    const headerInner = headerEl.querySelector('.header__inner');
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const dockedFontPx = rootFontSize * 1.25;
    const approxTextWidth = dockedFontPx * 10.0;
    const innerRect = headerInner
      ? headerInner.getBoundingClientRect()
      : { left: 40, top: 0 };
    const headerH = headerEl.offsetHeight || 56;
    logoTarget = {
      x: innerRect.left + approxTextWidth / 2,
      y: headerH / 2,
      fontSizePx: dockedFontPx,
      dockedWidth: approxTextWidth,
    };
  }
  measureLogoTarget();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measureLogoTarget).catch(() => {});
  }
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(measureLogoTarget, 150);
  });

  // === MAIN ANIMATION LOOP — single rAF, lerped scroll values ===
  function animate() {
    currentRaw += (targetRaw - currentRaw) * 0.1;

    // ── Hero-stack visibility window ───────────────────────────────
    // The door portal sits BEFORE the hero stack on the page. While the
    // user is still on the door portal, the hero-only chrome (logo,
    // tagline) must stay hidden — they belong to the hero, not the door.
    // As the user approaches the hero stack we fade them in over a
    // short lead-in window so the entrance feels intentional, not abrupt.
    const heroStartTop = stack ? stack.offsetTop : 0;
    const leadIn = window.innerHeight * 0.4; // start fading in 40vh before hero
    const heroVisibility = Math.max(0, Math.min(1,
      (window.scrollY - (heroStartTop - leadIn)) / leadIn
    ));

    // ── Logo travel ────────────────────────────────────────────────
    // Start: centred horizontally, ~22% from the top of the viewport
    // (above the tagline, which sits at 50%).
    // End:   header logo slot.
    const travel = Math.max(0, Math.min(1, currentRaw));
    const travelEase = 1 - Math.pow(1 - travel, 3); // ease-out-cubic
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight * 0.22;
    const x = startX + (logoTarget.x - startX) * travelEase;
    const y = startY + (logoTarget.y - startY) * travelEase;
    const baseFontPx = Math.max(28, Math.min(48, window.innerWidth * 0.035));
    const fontPx = baseFontPx + (logoTarget.fontSizePx - baseFontPx) * travelEase;

    heroCenterTitle.style.opacity = String(heroVisibility);
    heroCenterTitle.style.top = y + 'px';
    heroCenterTitle.style.left = x + 'px';
    heroCenterTitle.style.transform = 'translate(-50%, -50%)';
    heroCenterTitle.style.fontSize = fontPx + 'px';
    heroCenterTitle.style.pointerEvents = heroVisibility > 0.5 ? 'auto' : 'none';

    // ── Tagline pin → travel-with-video ────────────────────────────
    // Phase A (scroll heroStart → heroStart + pinEnd): tagline pinned
    //   at viewport centre while the video slides up to cover the black
    //   panel beneath it.
    // Phase B (scroll past pinEnd): tagline travels UPWARD at the
    //   exact same rate as the page scroll, so it leaves the viewport
    //   together with the rising video.
    // PLUS the new pre-hero window: tagline opacity is gated on
    // heroVisibility so it doesn't bleed over the door portal.
    if (tagline && stack) {
      const pinEnd = heroStartTop + stack.offsetHeight - window.innerHeight;
      const drift = Math.max(0, window.scrollY - pinEnd);
      tagline.style.opacity = String(heroVisibility);
      tagline.style.transform = `translate(-50%, calc(-50% - ${drift}px))`;
    }

    // ── Header chrome reveal ───────────────────────────────────────
    // Header fades in over the second half of the travel (raw 0.5-0.85).
    if (header) {
      const headerFade = Math.max(0, Math.min(1, (currentRaw - 0.5) / 0.35));
      header.style.opacity = String(headerFade);
      header.style.transform = `translateY(${(1 - headerFade) * -18}px)`;
      if (headerFade > 0.05) header.classList.add('header--scrolled');
      else header.classList.remove('header--scrolled');
    }

    // ── Nav reveal + push-right (room for docking logo) ───────────
    const nav = document.getElementById('mainNav');
    if (nav) {
      if (currentRaw > 0.5) nav.classList.add('nav--visible');
      else nav.classList.remove('nav--visible');
      const pushPx = travelEase * (logoTarget.dockedWidth + 32);
      nav.style.paddingLeft = pushPx + 'px';
    }

    requestAnimationFrame(animate);
  }

  // === scroll-progress computer (shared init + scroll handler) ===
  // Computes the 0→1 progress through the hero stack and returns it.
  // Used to seed targetRaw + currentRaw on PAGE LOAD (so a refresh at
  // deep scroll doesn't show the center-logo flash for a few frames
  // before the lerp catches up), and to update targetRaw on every
  // subsequent scroll event.
  function computeProgress() {
    const tracker = stack || section;
    const rect = tracker.getBoundingClientRect();
    const trackable = (tracker.offsetHeight || window.innerHeight * 2) - window.innerHeight;
    const scrolled = -rect.top;
    return Math.max(0, Math.min(1, scrolled / trackable));
  }

  // Seed both raw values from the CURRENT scroll position before
  // kicking off the RAF loop. On a refresh-at-deep-scroll, this puts
  // the hero-center-title directly at its docked position on the very
  // first frame — no centre flash, no lerp animation from 0.
  targetRaw  = computeProgress();
  currentRaw = targetRaw;
  if (targetRaw > 0.6) document.body.classList.add('intro-complete');

  requestAnimationFrame(animate);

  // === SCROLL LISTENER — maps scrollY across the heroIntro height ===
  // 0 = top of page, 1 = scrolled one full heroIntro height. Past that,
  // the logo is docked and `body.intro-complete` is set so other parts
  // of the site (smart-header, etc.) know the intro is over.
  window.addEventListener('scroll', () => {
    targetRaw = computeProgress();
    if (targetRaw > 0.6) document.body.classList.add('intro-complete');
    else document.body.classList.remove('intro-complete');
    // Tagline opacity + drift handled in the animate() loop above.
  }, { passive: true });
}


/* ──────────────────────────────────────────────
   NAV DROPDOWNS — Events ▾ + Bands ▾
   • Desktop hover is handled by CSS (:hover on .nav__item--has-dropdown).
     This JS only adds CLICK / TAP / KEYBOARD support so the dropdowns
     work on mobile + for keyboard users.
   • Click / tap on a parent link with .nav__item--has-dropdown toggles
     `.is-open` on the parent <li>. When open, hovering away or
     clicking outside closes it.
   • On viewports ≤ 768px the parent's link click is intercepted to
     toggle the accordion instead of navigating — once the user picks
     a sub-link inside the dropdown it navigates normally.
   • Esc closes any open dropdown.
   ────────────────────────────────────────────── */
function initNavDropdowns() {
  const items = document.querySelectorAll('.nav__item--has-dropdown');
  if (!items.length) return;

  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  // Per-item hover-out timers — revision round 2 N5. The dropdown used
  // to close the instant the cursor left the parent <li>, which made it
  // very easy for the user to lose the panel while moving toward an item.
  // We now arm a 220ms timer on mouseleave; if the cursor re-enters the
  // item (parent OR dropdown) before it fires, we cancel. This gives a
  // generous grace period without making the panel feel sticky.
  const closeTimers = new WeakMap();
  const CLOSE_DELAY = 220;

  const closeAll = (except) => {
    items.forEach((it) => { if (it !== except) it.classList.remove('is-open'); });
  };

  const armClose = (item) => {
    // Hover-driven close — only fires on desktop. Mobile uses tap-toggle.
    if (isMobile()) return;
    cancelClose(item);
    const t = setTimeout(() => {
      item.classList.remove('is-open');
      closeTimers.delete(item);
    }, CLOSE_DELAY);
    closeTimers.set(item, t);
  };

  const cancelClose = (item) => {
    const t = closeTimers.get(item);
    if (t) { clearTimeout(t); closeTimers.delete(item); }
  };

  items.forEach((item) => {
    const link = item.querySelector(':scope > .nav__link');
    if (!link) return;

    link.addEventListener('click', (e) => {
      // On mobile (or when user hasn't already opened it on desktop),
      // intercept the click so we toggle instead of navigate. This lets
      // touch users see the dropdown contents — they can then tap a
      // specific sub-link to navigate.
      const open = item.classList.contains('is-open');
      if (isMobile() || !open) {
        e.preventDefault();
        closeAll(item);
        item.classList.toggle('is-open');
      }
    });

    // Desktop hover behaviour. Opening is still driven by the CSS :hover
    // selector (so non-JS users get the dropdown too), but JS adds the
    // `is-open` class on enter so the `is-open > .nav__link::before`
    // selector keeps the underline expanded while the panel is showing.
    item.addEventListener('mouseenter', () => {
      if (isMobile()) return;
      cancelClose(item);
      closeAll(item);
      item.classList.add('is-open');
    });

    item.addEventListener('mouseleave', () => {
      armClose(item);
    });

    // Keyboard: ArrowDown opens dropdown + focuses first item.
    link.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        closeAll(item);
        item.classList.add('is-open');
        const first = item.querySelector('.nav__dropdown a');
        if (first) first.focus();
      }
    });
  });

  // Click outside any open dropdown closes everything.
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav__item--has-dropdown')) closeAll();
  });

  // Escape closes everything.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}


/* ──────────────────────────────────────────────
   TESTIMONIALS — chevron nav for the horizontal carousel
   • Click prev/next → scroll the track by exactly one card width
     (card + gap), with the browser's native smooth-scroll handling
     the easing.
   • Disable each button at the corresponding edge (so the user gets
     visual feedback when they can't scroll further).
   • Free wins: native scroll-snap, touch drag, keyboard arrows when
     the track is focused — all built-in.
   ────────────────────────────────────────────── */
function initTestimonialsCarousel() {
  const track = document.getElementById('testimonialsTrack');
  const prev  = document.getElementById('testimonialsPrev');
  const next  = document.getElementById('testimonialsNext');
  if (!track || !prev || !next) return;

  // Step = first card's width + gap. Re-measured each click in case
  // the layout has reflowed (resize, font-load, etc).
  const step = () => {
    const card = track.querySelector('.testimonial-card');
    if (!card) return 320;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    return card.offsetWidth + gap;
  };

  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= max;
  };

  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left:  step(), behavior: 'smooth' }));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  // Initial state.
  update();
}


/* ──────────────────────────────────────────────
   OUR STANDARDS — clip-reveal observer
   No images, no horizontal scroll. As each .standard enters the
   viewport, IntersectionObserver adds `.is-revealed` and the CSS
   clip-path animates the title + description out from behind the
   thin vertical line on the left, sliding rightward. One-and-done
   per item — once revealed, it stays revealed even if the user
   scrolls back up.
   ────────────────────────────────────────────── */
function initStandardsScroll() {
  const items = document.querySelectorAll('.standards .standard');
  if (!items.length) return;

  // Reduced-motion users — short-circuit to "everything visible" so
  // they don't see a blank section. The CSS rule for prefers-reduced-
  // motion already cancels the clip animation; this just makes sure
  // the .is-revealed class is on for any styling that depends on it.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((it) => it.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      // Tiny stagger by item index so a row of items doesn't reveal
      // perfectly synchronized — adds a more natural "one-by-one"
      // cadence even when several items enter the viewport together.
      const idx = parseInt(entry.target.dataset.idx || '0', 10);
      const delay = (idx % 3) * 110;
      setTimeout(() => entry.target.classList.add('is-revealed'), delay);
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.30,
    rootMargin: '0px 0px -8% 0px',
  });

  items.forEach((it, i) => {
    it.dataset.idx = String(i);
    observer.observe(it);
  });
}


/* Custom-luxury-cursor removed in revision round 2 per client:
   "I'd personally remove the custom cursor and keep a normal one
   so it feels smoother." The browser's native cursor now handles
   all hover states — buttons + links get the natural pointer-hand
   cursor via the browser's defaults, no JS overhead. */


function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Build mailto link with form data
    const subject = encodeURIComponent(`Event Inquiry — ${data.eventType || 'General'}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\n` +
      `Email: ${data.email}\n` +
      `Event Date: ${data.eventDate || 'Not specified'}\n` +
      `Event Type: ${data.eventType || 'Not specified'}\n` +
      `Budget: ${data.budget || 'Not specified'}\n\n` +
      `Message:\n${data.message || 'No message'}`
    );

    window.open(`mailto:contact@theroamingagency.com?subject=${subject}&body=${body}`, '_blank');

    // Show success feedback
    const btn = form.querySelector('.btn--primary');
    const originalText = btn.textContent;
    btn.textContent = '✓ Sent!';
    btn.style.background = '#25D366';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      form.reset();
    }, 3000);
  });
}
