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
  initIntroZoom();
  initCustomCursor();
});


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

  // Split text into words and wrap each in a span — every word starts nearly
  // invisible and brightens as the user scrolls through the section (scrub).
  const text = subtitle.textContent.trim();
  const words = text.split(/\s+/);
  subtitle.innerHTML = words.map((word) =>
    `<span class="darken-word" style="opacity: 0.12; transition: opacity 0.4s ease-out, color 0.4s ease-out; color: rgba(235, 220, 190, 0.35);">${word} </span>`
  ).join('');

  const wordSpans = subtitle.querySelectorAll('.darken-word');

  ScrollTrigger.create({
    trigger: subtitle,
    start: 'top 85%',
    end: 'bottom 55%',
    scrub: 0.4,           // smooth scroll-scrubbed progress — matches scroll speed
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const progress = self.progress;
      const totalWords = wordSpans.length;
      // Each word "catches up" to the scroll position with a cascade — words
      // early in the text brighten first, later ones follow. Feathered by a
      // 3-word window so the reveal feels like a soft sweep, not a step.
      const reveal = progress * (totalWords + 3);
      wordSpans.forEach((span, i) => {
        const wordProgress = Math.max(0, Math.min(1, (reveal - i) / 3));
        const opacity = 0.12 + wordProgress * 0.88; // 0.12 → 1.0
        span.style.opacity = opacity;
        // Tint also shifts from muted beige to warm white for a visible colour change
        const r = Math.round(235 + (245 - 235) * wordProgress);
        const g = Math.round(220 + (238 - 220) * wordProgress);
        const b = Math.round(190 + (222 - 190) * wordProgress);
        const a = 0.35 + wordProgress * 0.6; // 0.35 → 0.95
        span.style.color = `rgba(${r}, ${g}, ${b}, ${a})`;
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

  items.forEach(item => {
    item.addEventListener('click', () => {
      const band = item.dataset.band;

      // Update active state
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Update background
      bgImages.forEach(bg => {
        bg.classList.toggle('active', bg.dataset.band === band);
      });

      // Update description
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
    });

    // Double-click or enter to navigate to band page
    item.addEventListener('dblclick', () => {
      const href = item.dataset.href;
      if (href) window.location.href = href;
    });
  });

  // GSAP scroll-driven band switching
  const section = document.getElementById('chooseBand');
  if (section) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onUpdate: (self) => {
        const progress = self.progress;
        const bandCount = items.length;
        const activeIndex = Math.min(Math.floor(progress * bandCount), bandCount - 1);

        if (items[activeIndex] && !items[activeIndex].classList.contains('active')) {
          items[activeIndex].click();
        }
      }
    });
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

  cities.forEach((city) => {
    const card = document.createElement('div');
    card.className = 'globe-card';
    card.dataset.lat = city.lat;
    card.dataset.lon = city.lon;
    card.innerHTML = `
      <div class="globe-card__icon">${city.icon}</div>
      <div class="globe-card__info">
        <span class="globe-card__city">${city.name}</span>
        <span class="globe-card__country">${city.country}</span>
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
    const activeBand = document.querySelector('.band-selector__item.active');
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
   10. INTRO ZOOM (saxophone zooms in, reveals hero video)
   travelnextlvl.de style door animation
   ────────────────────────────────────────────── */
function initIntroZoom() {
  const section = document.getElementById('introZoom');
  const sax = document.getElementById('introSax');
  const white = document.getElementById('introWhite');
  const text = document.getElementById('introText');
  const notesContainer = document.getElementById('introNotes');
  const bg = document.getElementById('introBg');
  const sideLeft = document.getElementById('introSideLeft');
  const sideRight = document.getElementById('introSideRight');
  const header = document.getElementById('mainHeader');
  const heroCenterTitle = document.getElementById('heroCenterTitle');
  if (!section || !sax || !white) return;

  let targetProgress = 0;   // where scroll wants us to be (zoom 0-1)
  let currentProgress = 0;  // smoothly interpolated zoom value
  let targetRaw = 0;        // raw scroll position within section (0-1)
  let currentRaw = 0;       // smoothly interpolated raw scroll
  let scrollProgress = 0;   // for spawn checks (uses current)

  // === Target pixel position for the docked-logo state.
  //     Computed from the header's actual rendered layout: .header__inner's
  //     left edge (which already accounts for auto margins + container max
  //     width) plus a small inset + half the approximate text width at the
  //     docked font size. More reliable than relying on a hidden measurement
  //     element whose layout may be affected by font-loading timing. */
  let logoTarget = { x: 160, y: 34, fontSizePx: 20, dockedWidth: 220 };

  function measureLogoTarget() {
    const headerEl = document.getElementById('mainHeader');
    if (!headerEl) return;
    const headerInner = headerEl.querySelector('.header__inner');
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    // Docked logo font size — matches .logo__text default (var(--text-xl) ≈ 1.25rem)
    const dockedFontPx = rootFontSize * 1.25;
    // Approximate "The Roaming Agency" width at this font-size with the
    // heading font (Cormorant Garamond-ish) → avg char ratio ≈ 0.5.
    // 18 chars including spaces * 0.55 * fontPx ≈ 10 * fontPx.
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
  // Re-measure after fonts settle (heading font may load late and change width)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measureLogoTarget).catch(() => {});
  }
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(measureLogoTarget, 150);
  });

  // === MAIN ANIMATION LOOP ===
  // Smoothly interpolates between target and current values every frame
  function animate(t) {
    // Lerp: each frame, move 8% closer to target (smooth easing)
    currentProgress += (targetProgress - currentProgress) * 0.08;
    currentRaw += (targetRaw - currentRaw) * 0.08;
    scrollProgress = currentProgress;

    // === COMBINED IDLE FLOAT + ZOOM (smooth blend, no jerk) ===
    // Idle drift weight fades out smoothly as zoom progress increases
    // At progress 0 = full idle float, at progress 0.15+ = no idle drift
    const idleWeight = Math.max(0, 1 - currentProgress / 0.15);
    const driftX = (Math.sin(t * 0.0008) * 8 + Math.sin(t * 0.0013) * 4) * idleWeight;
    const driftY = (Math.cos(t * 0.0009) * 10 + Math.sin(t * 0.0015) * 5) * idleWeight;
    const tilt = Math.sin(t * 0.0007) * 1.5 * idleWeight;

    // Scale always uses currentProgress (starts at 1, smoothly increases)
    const scale = 1 + currentProgress * 25;

    sax.style.transform = `translate(calc(-52% + ${driftX}px), calc(-57% + ${driftY}px)) scale(${scale}) rotate(${tilt}deg)`;

    // === BACKGROUND + SIDE PANELS FADE (fade out as zoom starts) ===
    // Progress 0 = full bg + sides visible, 0.15 = fully faded
    const bgFade = Math.max(0, 1 - currentProgress / 0.15);
    if (bg) bg.style.opacity = bgFade;
    if (sideLeft) {
      sideLeft.style.opacity = bgFade;
      sideLeft.style.transform = `translateY(-50%) translateX(${(1 - bgFade) * -30}px)`;
    }
    if (sideRight) {
      sideRight.style.opacity = bgFade;
      sideRight.style.transform = `translateY(-50%) translateX(${(1 - bgFade) * 30}px)`;
    }

    // === WHITE PANEL — stays solid until 95%, then fades out fast ===
    // Video behind stays hidden during entire zoom
    let whiteOpacity = 1;
    if (currentProgress < 0.15) {
      // Fade in white as we scroll (replacing background)
      whiteOpacity = currentProgress / 0.15;
    } else if (currentProgress > 0.95) {
      // Only fade out white at very end (revealing video)
      whiteOpacity = 1 - (currentProgress - 0.95) / 0.05;
    }
    white.style.opacity = whiteOpacity;

    // Saxophone fades at 90%+ (just before white reveals video)
    if (currentProgress > 0.9) {
      const fadeProgress = (currentProgress - 0.9) / 0.1;
      sax.style.opacity = 1 - fadeProgress;
      if (notesContainer) notesContainer.style.opacity = 1 - fadeProgress;
    } else {
      sax.style.opacity = 1;
      if (notesContainer) notesContainer.style.opacity = 1;
    }

    // Hide notes container when zooming
    if (notesContainer) {
      notesContainer.style.visibility = currentProgress > 0.1 ? 'hidden' : 'visible';
    }

    // Text — premium fade + drift up as user scrolls
    if (text) {
      const textFade = Math.max(0, 1 - currentProgress * 4);
      const driftUp = currentProgress * 80; // moves up to 80px as it fades
      text.style.opacity = textFade;
      text.style.transform = `translateX(-50%) translateY(-${driftUp}px)`;
    }

    // =========================================================================
    //  NEW INTRO PHASES (scroll-driven, after saxophone zoom completes at 50%)
    //  Phase 1  (raw 0.50-0.62) → Hero center title "The Roaming Agency" fades
    //                              in, sits big/gold at viewport center.
    //  Phase 2  (raw 0.66-0.78) → Header (band nav + FR toggle only) fades in
    //                              from translateY(-20) and opacity 0.
    //  Phase 3  (raw 0.78-1.00) → Center title travels to header top-left slot
    //                              (interpolate x,y,font-size). At 0.99+ we
    //                              toggle body.logo-docked so the real header
    //                              .logo takes over — zero visual jump because
    //                              the inline styles matched its position.
    // =========================================================================

    // Hero title / logo — single element handles BOTH states.
    //  - Below raw 0.5: invisible (saxophone zoom phase)
    //  - Raw 0.50-0.62: fade in at center-lower (big, shimmering gold)
    //  - Raw 0.62-0.78: stays put (fully visible, waiting)
    //  - Raw 0.78-1.00: travels to header top-left, shrinks to logo size
    //  - Raw >= 1.00: stays docked as the header logo (clickable)
    if (heroCenterTitle) {
      const titleFade = Math.max(0, Math.min(1, (currentRaw - 0.50) / 0.12));
      const travel = Math.max(0, Math.min(1, (currentRaw - 0.78) / 0.22));

      // Ease-out-cubic for organic travel motion
      const travelEase = 1 - Math.pow(1 - travel, 3);

      // Start position: horizontally centered, vertically at 62%
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight * 0.62;
      const x = startX + (logoTarget.x - startX) * travelEase;
      const y = startY + (logoTarget.y - startY) * travelEase;

      // Font-size interpolates from CSS clamp base (32-64px) down to docked size
      const baseFontPx = Math.max(32, Math.min(64, window.innerWidth * 0.045));
      const fontPx = baseFontPx + (logoTarget.fontSizePx - baseFontPx) * travelEase;

      heroCenterTitle.style.opacity = String(titleFade);
      heroCenterTitle.style.top = y + 'px';
      heroCenterTitle.style.left = x + 'px';
      heroCenterTitle.style.transform = 'translate(-50%, -50%)';
      heroCenterTitle.style.fontSize = fontPx + 'px';
      // Clickable once visible (fade > 50%), inert while hidden
      heroCenterTitle.style.pointerEvents = titleFade > 0.5 ? 'auto' : 'none';
    }

    // Header fade in — band nav + FR toggle become visible (no logo yet).
    // Also adds .header--scrolled so the dark blurred background returns
    // (previously driven by initLogoAnimation, which the new flow replaces).
    if (header) {
      const headerFade = Math.max(0, Math.min(1, (currentRaw - 0.66) / 0.12));
      header.style.opacity = String(headerFade);
      header.style.transform = `translateY(${(1 - headerFade) * -18}px)`;
      if (headerFade > 0.05) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    }

    // Nav visibility tracks the header fade — inside .header, .nav has its own
    // opacity/transform driven by the .nav--visible class toggle.
    // Also interpolate padding-left so band buttons shift right as the logo
    // docks — making physical space for the incoming logo at top-left.
    const nav = document.getElementById('mainNav');
    if (nav) {
      if (currentRaw > 0.66) {
        nav.classList.add('nav--visible');
      } else {
        nav.classList.remove('nav--visible');
      }
      // travel is 0 when logo is at center (no space needed in header),
      // 1 when logo docks at top-left (need room = logo width + gap).
      const travelForNav = Math.max(0, Math.min(1, (currentRaw - 0.78) / 0.22));
      const eased = 1 - Math.pow(1 - travelForNav, 3);
      const gap = 32;
      const pushPx = eased * (logoTarget.dockedWidth + gap);
      nav.style.paddingLeft = pushPx + 'px';
    }

    // No dock-swap needed any more — the hero-center-title IS the logo at all
    // positions. Same element, smooth scroll-scrubbed travel + reverse.

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // === MUSIC NOTES SPAWNING ===
  // Notes emerge from bell hole and float upward with random drift
  const noteSymbols = ['🎵', '🎶', '♪', '♫', '♬', '𝄞'];

  function spawnNote() {
    if (scrollProgress > 0.1) return; // Only spawn during idle (not scrolling)

    const note = document.createElement('div');
    note.className = 'intro-zoom__note';
    note.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];

    // Bell hole is at viewport center (50%, 50%) thanks to translate(-52%, -57%)
    // Spawn slightly inside the hole (small random offset)
    const startX = 50 + (Math.random() - 0.5) * 3; // ±1.5% from center horizontal
    const startY = 50 + (Math.random() - 0.5) * 2; // around bell hole vertical

    // Random drift values for variety
    const driftX1 = (Math.random() - 0.5) * 60; // initial drift
    const driftX2 = (Math.random() - 0.5) * 200; // final drift
    const rotate1 = (Math.random() - 0.5) * 30;
    const rotate2 = (Math.random() - 0.5) * 90;
    const fontSize = 24 + Math.random() * 24; // 24-48px
    const duration = 3 + Math.random() * 2; // 3-5 seconds

    note.style.left = startX + '%';
    note.style.top = startY + '%';
    note.style.fontSize = fontSize + 'px';
    note.style.setProperty('--drift-x-1', driftX1 + 'px');
    note.style.setProperty('--drift-x-2', driftX2 + 'px');
    note.style.setProperty('--rotate-1', rotate1 + 'deg');
    note.style.setProperty('--rotate-2', rotate2 + 'deg');
    note.style.animation = `noteFloat ${duration}s ease-out forwards`;

    notesContainer.appendChild(note);

    // Cleanup after animation
    setTimeout(() => note.remove(), duration * 1000);
  }

  // Spawn notes at intervals (premium pacing — not too frequent)
  setInterval(spawnNote, 700);
  // Spawn an initial burst
  for (let i = 0; i < 3; i++) {
    setTimeout(spawnNote, i * 300);
  }

  // === SCROLL LISTENER — only updates targets, animation loop smoothly interpolates ===
  // Section is 600vh tall. rawProgress 0-1 maps across the whole section.
  //  0.00-0.50 → saxophone zoom                     (zoom target 0 → 1)
  //  0.50-0.66 → hold + hero-center-title fades in  (zoom stays at 1)
  //  0.66-0.78 → header fades in from top           (zoom stays at 1)
  //  0.78-1.00 → center title travels to top-left   (docks at 1.0)
  //  >1.00     → unpinned, body has intro-complete + logo-docked — normal scroll
  window.addEventListener('scroll', () => {
    const rect = section.getBoundingClientRect();
    const sectionH = section.offsetHeight;
    const viewH = window.innerHeight;

    if (rect.bottom < 0) {
      // Past section — everything settled
      document.body.classList.add('intro-complete');
      targetRaw = 1;
      targetProgress = 1;
      return;
    }
    if (rect.top > viewH) {
      // Not reached yet — stay at initial state
      return;
    }

    const scrolled = -rect.top;
    const totalScrollable = sectionH - viewH;
    const rawProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
    targetRaw = rawProgress;

    // Zoom target: 0 → 1 over the first 50% of the section, then held at 1
    if (rawProgress <= 0.5) {
      targetProgress = rawProgress / 0.5;
    } else {
      targetProgress = 1;
    }

    // intro-complete flips at the moment the header starts fading in (phase 2).
    // Kept as a separate flag in case other components listen for it.
    if (rawProgress > 0.66) {
      document.body.classList.add('intro-complete');
    } else {
      document.body.classList.remove('intro-complete');
    }
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
  document.addEventListener('mousedown', () => {
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
