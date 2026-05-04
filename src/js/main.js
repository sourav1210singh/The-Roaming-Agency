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
    initGlobeAnimation();
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
  initDoorPortal();
  initCustomCursor();
  initStatsCounter();
  initBrandsMarquee();
  initEventsScroll();
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
function initBrandsMarquee() {
  let scrollIdleTimer = null;
  const onScroll = () => {
    if (!document.body.classList.contains('is-scrolling')) {
      document.body.classList.add('is-scrolling');
    }
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(() => {
      document.body.classList.remove('is-scrolling');
    }, 250);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
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

  const update = () => {
    raf = 0;
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const progress = Math.max(0, Math.min(1, -rect.top / total));

    // Active category — split runway evenly between N stops.
    const idx = Math.max(0, Math.min(N - 1, Math.floor(progress * N)));

    // Progress line — fills 0→100% over the whole section.
    if (progressFill) {
      progressFill.style.setProperty('--events-progress', progress.toFixed(4));
    }

    if (idx !== lastIdx) {
      lastIdx = idx;
      cats.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      photoSets.forEach((p, i) => p.classList.toggle('is-active', i === idx));
      // Negative bg swap on odd indexes.
      sticky.classList.toggle('is-negative', idx % 2 === 1);
      // Restart the decorative-stripes keyframe by removing the
      // class, forcing a reflow, then re-adding it — without the
      // reflow the browser collapses both class mutations into one
      // tick and the keyframe never re-fires.
      sticky.classList.remove('is-stripes-active');
      void sticky.offsetWidth;
      sticky.classList.add('is-stripes-active');
    }
  };

  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}


/* ──────────────────────────────────────────────
   DOOR PORTAL — pre-hero cinematic intro
   Sequence (all driven by scroll-progress through #doorPortal):
     0.00 → 0.12  LEFT side text lifts up + fades out FIRST
     0.13 → 0.25  RIGHT side text lifts up + fades out SECOND
     0.27 → 0.92  Door rotates 0 → -85° GRADUALLY (linear, OUTWARD)
                  Negative rotateY = swing toward camera, hinge on left.
     0.65 → 0.97  Door zooms larger from CENTRE (scale 1 → 4×)
     0.88 → 0.96  Door fades out (we're "through" it)
     0.94 → 0.99  White-out flash (emerging into daylight)
     0.00 → 1.00  Sky parallax + cloud drift + spotlight intensify
   ────────────────────────────────────────────── */
function initDoorPortal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  const section = document.getElementById('doorPortal');
  const sky     = document.getElementById('doorSky');
  const clouds  = document.getElementById('doorCloudsDrift');
  const zoom    = document.getElementById('doorZoom');
  const door    = document.getElementById('doorPanel');
  const left    = document.getElementById('doorTextLeft');
  const right   = document.getElementById('doorTextRight');
  const spot    = document.getElementById('doorSpotlight');
  const flash   = document.getElementById('doorFlash');
  if (!section || !door) return;

  gsap.set(door,  { rotateY: 0, transformOrigin: 'left center' });
  gsap.set(zoom,  { scale: 1, transformOrigin: 'center center' });
  gsap.set([left, right], { opacity: 1, y: 0 });
  gsap.set(flash, { opacity: 0 });

  const tl = gsap.timeline({
    defaults: { duration: 1, ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
    }
  });

  // ── Sky parallax (whole runway) ──────────────────────────────────
  if (sky) {
    tl.fromTo(sky,
      { scale: 1.0,  yPercent: 0,  xPercent: 0 },
      { scale: 1.15, yPercent: -8, xPercent: -2, duration: 1 },
      0
    );
  }
  if (clouds) {
    tl.fromTo(clouds,
      { xPercent: 0, yPercent: 0 },
      { xPercent: 4, yPercent: -3, duration: 1 },
      0
    );
  }

  // ── LEFT text lifts FIRST (0.00 → 0.12) ──────────────────────────
  if (left) {
    tl.fromTo(left,
      { opacity: 1, y: 0 },
      { opacity: 0, y: -60, duration: 0.12, ease: 'power2.in' },
      0
    );
  }

  // ── RIGHT text lifts SECOND, only after left is gone (0.13 → 0.25)
  if (right) {
    tl.fromTo(right,
      { opacity: 1, y: 0 },
      { opacity: 0, y: -60, duration: 0.12, ease: 'power2.in' },
      0.13
    );
  }

  // ── Door rotation 0 → -85° (0.27 → 0.92, duration 0.65, LINEAR) ──
  // Negative rotateY: door swings OUTWARD (toward camera). Hinge stays
  // on the left edge per `transformOrigin: 'left center'`. Capped at
  // -85° so the panel never goes fully edge-on (knob detachment).
  // Starts at 0.27 so the right text has fully cleared at 0.25 with a
  // tiny 0.02 buffer — nothing competes for the user's attention.
  tl.fromTo(door,
    { rotateY: 0 },
    { rotateY: -85, duration: 0.65, ease: 'none' },
    0.27
  );

  // ── Door zoom from centre (0.65 → 0.97, duration 0.32) ───────────
  if (zoom) {
    tl.fromTo(zoom,
      { scale: 1 },
      { scale: 4, duration: 0.32, ease: 'power2.in' },
      0.65
    );
  }

  // ── Door fades out 0.88 → 0.96 ───────────────────────────────────
  tl.to(door,
    { opacity: 0, duration: 0.08 },
    0.88
  );

  // ── Spotlight intensifies 0 → 0.6 ────────────────────────────────
  if (spot) {
    tl.fromTo(spot,
      { opacity: 0.4 },
      { opacity: 1.0, duration: 0.6 },
      0
    );
  }

  // ── White-out flash 0.94 → 0.99 ──────────────────────────────────
  if (flash) {
    tl.to(flash, { opacity: 1, duration: 0.03, ease: 'power2.in'  }, 0.94);
    tl.to(flash, { opacity: 0, duration: 0.05, ease: 'power2.out' }, 0.96);
  }
}


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

  // Individual-card slideshow — each card has its OWN lifecycle (pop-in, hold,
   // pop-out) staggered against the others. At any given moment ~MAX_VISIBLE cards
   // are on screen, but they appear/disappear one-by-one in a continuous, alive
   // rhythm — never all-at-once. Cities drawn from a shuffled queue so every one
   // gets its turn without repetition in a cycle.
  const MAX_VISIBLE = 5;
  const CARD_VISIBLE_MS = 2500; // base hold duration per card
  const STAGGER_MS = 600;       // delay between each initial pop-in
  const FADE_OUT_MS = 700;      // matches CSS transition — wait for fade before replacing
  let activeIndices = new Set();
  let cityQueue = [];
  let slideshowRunning = false;
  let pendingTimers = new Set();
  let dwellTimer = null;

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function refillQueue() {
    // Fresh shuffled list of all city indices
    cityQueue = shuffleArray(Array.from({ length: cardEls.length }, (_, i) => i));
  }

  function addTimer(cb, ms) {
    const t = setTimeout(() => { pendingTimers.delete(t); cb(); }, ms);
    pendingTimers.add(t);
    return t;
  }

  function clearAllTimers() {
    for (const t of pendingTimers) clearTimeout(t);
    pendingTimers.clear();
  }

  // Front-hemisphere zones — LEFT-BIASED because the globe container is shifted
   // right (width 160%, margin-left 12%) and its right edge gets clipped by the
   // section overflow. So we keep right-side zones small/mild (close to center)
   // and put most zones on the left + center columns with nice vertical spread.
   // lonOffset sign: POSITIVE = LEFT on screen, NEGATIVE = RIGHT on screen.
  const FRONT_ZONES = [
    // Mild right (small lonOffset so they stay in visible area, no extremes)
    { lat:  24, lonOffset: -14 },  // upper-right (mild)
    { lat: -24, lonOffset: -14 },  // lower-right (mild)

    // Center column — vertical variety (top, upper-mid, lower-mid, bottom)
    { lat:  34, lonOffset:   3 },  // top-center (slight left bias)
    { lat:  12, lonOffset:   5 },  // upper-center
    { lat: -12, lonOffset:   5 },  // lower-center
    { lat: -34, lonOffset:   3 },  // bottom-center

    // Left column — more zones, wider lonOffset (visible side of globe)
    { lat:  28, lonOffset:  26 },  // upper-left
    { lat:   0, lonOffset:  34 },  // mid-left (far)
    { lat: -28, lonOffset:  26 },  // lower-left
    { lat:  15, lonOffset:  18 },  // upper-left-inner
    { lat: -15, lonOffset:  18 },  // lower-left-inner
  ];

  function assignFrontPositionForIdx(idx) {
    // 1) Prefer a zone no currently-active card occupies.
    const usedZones = new Set();
    for (const activeIdx of activeIndices) {
      const c = cardEls[activeIdx];
      if (c.dataset.zoneIndex !== undefined && c.dataset.zoneIndex !== '') {
        usedZones.add(parseInt(c.dataset.zoneIndex, 10));
      }
    }
    const availableZoneIndices = FRONT_ZONES
      .map((_, i) => i)
      .filter((z) => !usedZones.has(z));
    const pickFrom = availableZoneIndices.length > 0 ? availableZoneIndices : FRONT_ZONES.map((_, i) => i);

    const frontLon = 90 - currentRotY;
    const card = cardEls[idx];

    // 2) Collision rejection — try up to 5 (zone, jitter) combos, take the one
    //    with the LARGEST minimum 3D distance to any currently-active card.
    //    Accept early once we clear MIN_SQ_DIST. Some mild overlap is OK if
    //    no better spot exists, but we always pick the best of the samples.
    const MIN_SQ_DIST = 0.13; // squared distance in R units — ≈ 0.36·R (~140px at 400px sphere)
    let best = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const zoneIdx = pickFrom[Math.floor(Math.random() * pickFrom.length)];
      const zone = FRONT_ZONES[zoneIdx];
      const jitLat = (Math.random() - 0.5) * 10; // ±5°
      const jitLon = (Math.random() - 0.5) * 12; // ±6°
      const lat = zone.lat + jitLat;
      const lon = frontLon + zone.lonOffset + jitLon;
      const p = project(lat, lon, currentRotY);

      // Find min squared distance to any active card's projected 3D position
      let minSq = Infinity;
      for (const activeIdx of activeIndices) {
        if (activeIdx === idx) continue;
        const ac = cardEls[activeIdx];
        const alat = parseFloat(ac.dataset.lat);
        const alon = parseFloat(ac.dataset.lon);
        if (Number.isNaN(alat) || Number.isNaN(alon)) continue;
        const ap = project(alat, alon, currentRotY);
        const dx = (p.x - ap.x) / R;
        const dy = (p.y - ap.y) / R;
        const sq = dx * dx + dy * dy;
        if (sq < minSq) minSq = sq;
      }
      if (minSq === Infinity) minSq = 10; // no active cards — any spot is fine

      if (!best || minSq > best.minSq) {
        best = { lat, lon, zoneIdx, minSq };
      }
      if (minSq >= MIN_SQ_DIST) break; // comfortable spacing — stop searching
    }

    card.dataset.lat = best.lat;
    card.dataset.lon = best.lon;
    card.dataset.zoneIndex = String(best.zoneIdx);
  }

  function activateOneCard() {
    if (!slideshowRunning) return;

    // Pull next city from queue that isn't currently active
    if (cityQueue.length === 0) refillQueue();
    let idx = null;
    for (let i = 0; i < cityQueue.length; i++) {
      if (!activeIndices.has(cityQueue[i])) {
        idx = cityQueue.splice(i, 1)[0];
        break;
      }
    }
    if (idx == null) {
      refillQueue();
      idx = cityQueue.shift();
      if (idx == null || activeIndices.has(idx)) return;
    }

    // Place on an unused front zone and mark active — CSS transition handles fade-in
    assignFrontPositionForIdx(idx);
    activeIndices.add(idx);

    // Schedule this card's individual fade-out after its hold duration.
    // Random +0-800ms jitter so cards don't re-sync over time.
    const hold = CARD_VISIBLE_MS + Math.random() * 800;
    addTimer(() => {
      if (!slideshowRunning) return;
      activeIndices.delete(idx);
      const card = cardEls[idx];
      if (card) card.dataset.zoneIndex = '';
      // After its fade-out completes, pop a NEW card to replace it — keeps
      // total visible ≈ MAX_VISIBLE at all times, but transitions are
      // individual (one fades out, one fades in — never a whole group flip).
      addTimer(() => {
        if (slideshowRunning) activateOneCard();
      }, FADE_OUT_MS);
    }, hold);
  }

  function startSlideshow() {
    stopSlideshow(); // defensive cleanup
    slideshowRunning = true;
    refillQueue();
    // Stagger MAX_VISIBLE cards in one at a time — each pops with its own fade.
    for (let i = 0; i < MAX_VISIBLE; i++) {
      addTimer(() => activateOneCard(), i * STAGGER_MS);
    }
  }

  function stopSlideshow() {
    slideshowRunning = false;
    clearAllTimers();
    activeIndices = new Set();
    cardEls.forEach((c) => { c.dataset.zoneIndex = ''; });
  }

  // Start slideshow only after user dwells on globe section for >1s.
  // Pause + clear when section leaves viewport.
  const globeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const inView = entry.isIntersecting && entry.intersectionRatio > 0.25;
      if (inView) {
        if (!dwellTimer && !slideshowRunning) {
          dwellTimer = setTimeout(() => {
            startSlideshow();
            dwellTimer = null;
          }, 1000);
        }
      } else {
        if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
        stopSlideshow();
      }
    });
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  globeObserver.observe(section);

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

    cardEls.forEach((card, idx) => {
      const lat = parseFloat(card.dataset.lat);
      const lon = parseFloat(card.dataset.lon);
      const p = project(lat, lon, currentRotY);

      // Position card center relative to sphere center, scaled to actual sphere px radius
      const px = centerX + (p.x / R) * sphereRadiusPx;
      const py = centerY + (p.y / R) * sphereRadiusPx;
      const zNorm = (p.z + R) / (R * 2);

      // Normalized distance from sphere center in sphere-radius units (0=center, 1=edge)
      const distFromCenter = Math.sqrt(p.x * p.x + p.y * p.y) / R;

      const isActive = activeIndices.has(idx);

      if (!isActive || !p.visible || zNorm <= 0.35) {
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        return;
      }

      // EDGE FADE — only kicks in when cards approach the globe silhouette.
      // Start at 75% radius (well beyond normal front zones) so front cards stay
      // crisp at full strength. Fully hidden by 92% — smooth 2.5x shrink at edge.
      const edgeStart = 0.75;
      const edgeEnd = 0.92;
      const edgeFactor = distFromCenter < edgeStart
        ? 1
        : Math.max(0, 1 - (distFromCenter - edgeStart) / (edgeEnd - edgeStart));
      // Smooth ease-out for the fade so it doesn't feel linear
      const edgeEase = edgeFactor * edgeFactor * (3 - 2 * edgeFactor);

      // Depth-based scale (far back = smaller, front = bigger) combined with
      // edge-based shrink. Front-facing cards pop at ~1.65x (amra.com style
      // prominent badges) so they read clearly without scroll.
      const depthScale = 0.7 + zNorm * 0.95; // 0.7 at back → 1.65 at front
      const edgeScale = 0.4 + 0.6 * edgeEase; // 1.0 at center, 0.4 at edge
      const cardScale = depthScale * edgeScale;

      // Opacity: front cards (zNorm > 0.6) are FULLY opaque, only back-side cards
      // fade out. Multiplied by edge-fade for cards near the sphere rim.
      const depthOpacity = zNorm >= 0.6
        ? 1
        : Math.max(0, (zNorm - 0.35) / 0.25);
      const cardOpacity = depthOpacity * edgeEase;

      card.style.left = px + 'px';
      card.style.top = py + 'px';
      card.style.transform = `translate(-50%, -50%) scale(${cardScale})`;
      card.style.opacity = cardOpacity;
      card.style.zIndex = Math.round(p.z + R);
      card.style.pointerEvents = cardOpacity > 0.5 ? 'auto' : 'none';
      // Blur ONLY for cards on the back side (zNorm < 0.7). Front cards stay sharp.
      card.style.filter = zNorm >= 0.7 ? 'none' : `blur(${(0.7 - zNorm) * 4}px)`;
    });

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  window.addEventListener('scroll', () => {
    const rect = section.getBoundingClientRect();
    const viewH = window.innerHeight;
    if (rect.bottom < 0 || rect.top > viewH) return;

    const totalRange = rect.height + viewH;
    const scrolled = viewH - rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / totalRange));
    targetRotY = -120 + progress * 240;
  }, { passive: true });
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
  requestAnimationFrame(animate);

  // === SCROLL LISTENER — maps scrollY across the heroIntro height ===
  // 0 = top of page, 1 = scrolled one full heroIntro height. Past that,
  // the logo is docked and `body.intro-complete` is set so other parts
  // of the site (smart-header, etc.) know the intro is over.
  window.addEventListener('scroll', () => {
    // Use the .hero-stack wrapper (which is 2vh tall — pin period) so the
    // animation completes exactly when the video has finished sliding up
    // and fully covered the black panel. Falls back to the inner section
    // if the wrapper isn't present.
    const tracker = stack || section;
    const rect = tracker.getBoundingClientRect();
    const trackable = (tracker.offsetHeight || window.innerHeight * 2) - window.innerHeight;
    const scrolled = -rect.top;
    const rawProgress = Math.max(0, Math.min(1, scrolled / trackable));
    targetRaw = rawProgress;

    if (rawProgress > 0.6) document.body.classList.add('intro-complete');
    else document.body.classList.remove('intro-complete');
    // Tagline opacity + drift handled in the animate() loop above.
  }, { passive: true });
}


function initStandardsScroll() {
  const section = document.getElementById('standards');
  const track = document.getElementById('standardsTrack');
  const bgImgs = document.querySelectorAll('.standards-scroll__bg-img');
  if (!section || !track || typeof gsap === 'undefined') return;

  const cards = track.querySelectorAll('.standards-scroll__card');
  const totalCards = cards.length;

  // Calculate how far the track needs to move
  const getMaxShift = () => {
    const trackWidth = totalCards * (380 + 48); // card width + gap
    return Math.max(0, trackWidth - window.innerWidth + 100);
  };

  // GSAP ScrollTrigger with pin — section stays pinned until all cards scroll through
  gsap.to(track, {
    x: () => -getMaxShift(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => '+=' + getMaxShift(),
      pin: true,
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Update background image
        const activeIndex = Math.min(Math.floor(self.progress * totalCards), totalCards - 1);
        bgImgs.forEach((img, i) => {
          img.classList.toggle('active', i === activeIndex);
        });
      }
    }
  });
}


/* ──────────────────────────────────────────────
   11. CUSTOM LUXURY CURSOR
   Outer ring elastic-follows, inner dot instant-follows,
   auto-invert via mix-blend-mode, premium hover states
   ────────────────────────────────────────────── */
function initCustomCursor() {
  // Skip on touch devices
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  const dot = document.getElementById('cursorDot');
  const label = document.getElementById('cursorLabel');
  if (!cursor || !ring || !dot) return;

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  let dotX = 0, dotY = 0;

  // Track mouse position
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth animation loop — dot follows instant, ring follows with lag
  function animateCursor() {
    // Dot follows immediately
    dotX += (mouseX - dotX) * 0.6;
    dotY += (mouseY - dotY) * 0.6;
    dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;

    // Ring follows with elastic lag
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

    // Label follows ring position
    if (label) {
      label.style.transform = `translate(${ringX}px, ${ringY}px)`;
    }

    requestAnimationFrame(animateCursor);
  }
  requestAnimationFrame(animateCursor);

  // === HOVER STATE: clickable elements (gold ring + dot grows) ===
  const clickableSelector = 'a, button, .band-selector__item, [role="button"], .globe-card, .standards-scroll__card, .standard-card, .faq__question, .lang-toggle, .nav__band-link, .whatsapp-btn';

  // Text/image selectors — dot grows but stays white (neutral)
  const contentSelector = 'h1, h2, h3, h4, h5, h6, p, span, li, blockquote, img, figure, .section__title, .section__subtitle, .section__label';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(clickableSelector)) {
      cursor.classList.add('is-hovering');
      cursor.classList.remove('is-over-content');
    } else if (e.target.matches(contentSelector) || e.target.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote')) {
      cursor.classList.add('is-over-content');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(clickableSelector)) {
      cursor.classList.remove('is-hovering');
    }
    if (e.target.matches(contentSelector) || e.target.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote')) {
      cursor.classList.remove('is-over-content');
    }
  });

  // === CLICK state (quick pulse) ===
  // On mousedown we snap the ring to the current pointer position so the
  // elastic lag can't be "frozen" visible while the user holds the button.
  // Without this the human micro-movement during a physical click leaves the
  // ring a handful of pixels behind the dot, and it stays visibly offset
  // because mousemove briefly pauses while the click is processed.
  document.addEventListener('mousedown', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    ringX = mouseX;
    ringY = mouseY;
    dotX = mouseX;
    dotY = mouseY;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
    cursor.classList.add('is-clicking');
  });
  document.addEventListener('mouseup', () => {
    cursor.classList.remove('is-clicking');
  });

  // Hide cursor when mouse leaves window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  });
}


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
