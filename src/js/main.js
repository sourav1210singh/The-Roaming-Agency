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
    initLogoAnimation();
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
  const hero = document.getElementById('hero');
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

  // Split text into words and wrap each in a span
  const text = subtitle.textContent.trim();
  const words = text.split(/\s+/);
  subtitle.innerHTML = words.map((word, i) =>
    `<span class="darken-word" style="opacity: 0.15; transition: opacity 0.3s ease;">${word} </span>`
  ).join('');

  const wordSpans = subtitle.querySelectorAll('.darken-word');

  ScrollTrigger.create({
    trigger: subtitle,
    start: 'top 80%',
    end: 'bottom 50%',
    onUpdate: (self) => {
      const progress = self.progress;
      const totalWords = wordSpans.length;
      wordSpans.forEach((span, i) => {
        const wordProgress = (progress - (i / totalWords)) * totalWords;
        const opacity = Math.min(Math.max(wordProgress, 0.15), 1);
        span.style.opacity = opacity;
      });
    }
  });
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
  const svgEl = document.getElementById('globeSvg');
  const cardsEl = document.getElementById('globeCards');
  if (!container || !section || !svgEl || !cardsEl) return;

  const R = 280; // Globe radius (for card projection math)
  const globeImg = document.getElementById('globeImg');

  // Cities spread across ALL zones — north, equator, south + evenly around longitude
  const cities = [
    { name: 'Miami', country: 'USA', lat: 10, lon: -80, img: 'gallery-25.jpg' },
    { name: 'London', country: 'UNITED KINGDOM', lat: 55, lon: -55, img: 'gallery-05.jpg' },
    { name: 'Barcelona', country: 'SPAIN', lat: -15, lon: -30, img: 'gallery-09.jpg' },
    { name: 'Paris', country: 'FRANCE', lat: 45, lon: -5, img: 'gallery-03.jpg' },
    { name: 'Nice', country: 'FRENCH RIVIERA', lat: -30, lon: 15, img: 'gallery-01.jpg' },
    { name: 'Cannes', country: 'FRENCH RIVIERA', lat: 20, lon: 35, img: 'gallery-19.jpg' },
    { name: 'Rome', country: 'ITALY', lat: -45, lon: 55, img: 'gallery-11.jpg' },
    { name: 'Lake Como', country: 'ITALY', lat: 55, lon: 75, img: 'gallery-13.jpg' },
    { name: 'Monaco', country: 'MONACO', lat: 0, lon: 95, img: 'gallery-07.jpg' },
    { name: 'Santorini', country: 'GREECE', lat: -35, lon: 115, img: 'gallery-15.jpg' },
    { name: 'Dubai', country: 'UAE', lat: 40, lon: 140, img: 'gallery-17.jpg' },
    { name: 'Riyadh', country: 'SAUDI ARABIA', lat: -10, lon: 165, img: 'gallery-27.jpg' },
    { name: 'St-Tropez', country: 'FRANCE', lat: -50, lon: -105, img: 'gallery-21.jpg' },
    { name: 'Corsica', country: 'FRANCE', lat: 30, lon: -130, img: 'gallery-23.jpg' },
  ];

  // Globe image already in HTML — no SVG to build

  // === BUILD CITY CARDS ===
  cities.forEach((city, i) => {
    const card = document.createElement('div');
    card.className = 'globe-card';
    card.dataset.lat = city.lat;
    card.dataset.lon = city.lon;
    card.innerHTML = `
      <div class="globe-card__icon">🎵</div>
      <div class="globe-card__info">
        <span class="globe-card__city">${city.name}</span>
        <span class="globe-card__country">${city.country}</span>
      </div>
      <div class="globe-card__photo"><img src="src/assets/images/gallery/${city.img}" alt="Performance in ${city.name}"></div>
    `;
    cardsEl.appendChild(card);
  });

  const cardEls = Array.from(cardsEl.querySelectorAll('.globe-card'));

  // === MAKE LAYOUT STICKY ===
  const layout = section.querySelector('.globe-layout');
  if (layout) layout.style.cssText = 'position: sticky; top: 60px;';

  // === 3D PROJECTION: lat/lon → screen x,y ===
  function project(lat, lon, rotY) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + rotY) * Math.PI / 180;
    const x3d = R * Math.sin(phi) * Math.cos(theta);
    const y3d = -R * Math.cos(phi);
    const z3d = R * Math.sin(phi) * Math.sin(theta);
    // Simple perspective
    const scale = 1 + z3d / (R * 3);
    return { x: x3d, y: y3d, z: z3d, scale: scale, visible: z3d > -R * 0.6 };
  }

  // === ANIMATION LOOP ===
  let currentRotY = -30;
  let targetRotY = -30;

  function updateGlobe() {
    // Smooth interpolation
    currentRotY += (targetRotY - currentRotY) * 0.12;

    // Rotate globe image on Y-axis with perspective
    if (globeImg) {
      const rotation = (currentRotY + 30) * 0.3; // subtle rotation
      globeImg.style.transform = `rotateY(${rotation}deg)`;
    }

    // Update cards
    const containerRect = container.getBoundingClientRect();
    const cw = containerRect.width;
    const ch = containerRect.height;

    cardEls.forEach(card => {
      const lat = parseFloat(card.dataset.lat);
      const lon = parseFloat(card.dataset.lon);
      const p = project(lat, lon, currentRotY);

      // Convert from SVG coords to container %
      const px = ((p.x + R) / (R * 2)) * cw;
      const py = ((p.y + R) / (R * 2)) * ch;

      // z ranges from -R (back) to +R (front)
      // Normalize to 0 (back) → 1 (front)
      const zNorm = (p.z + R) / (R * 2);

      if (p.visible && zNorm > 0.35) {
        card.style.left = px + 'px';
        card.style.top = py + 'px';

        // Front cards = full size, back cards = shrink dramatically
        const cardScale = 0.3 + zNorm * 0.8; // 0.58 to 1.1
        const cardOpacity = Math.pow(Math.max(0, (zNorm - 0.35) / 0.65), 1.5); // smooth fade

        card.style.transform = `translate(-50%, -50%) scale(${Math.min(1, cardScale)})`;
        card.style.opacity = Math.min(1, cardOpacity);
        card.style.zIndex = Math.round(p.z + R);
        card.style.pointerEvents = cardOpacity > 0.5 ? 'auto' : 'none';
        card.style.filter = `blur(${Math.max(0, (1 - zNorm) * 2)}px)`;
      } else {
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        card.style.filter = 'blur(4px)';
      }
    });

    requestAnimationFrame(updateGlobe);
  }

  // Start animation loop
  requestAnimationFrame(updateGlobe);

  // === SCROLL-DRIVEN ROTATION ===
  window.addEventListener('scroll', () => {
    const rect = section.getBoundingClientRect();
    const viewH = window.innerHeight;
    if (rect.bottom < 0 || rect.top > viewH) return;

    const totalRange = rect.height + viewH;
    const scrolled = viewH - rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / totalRange));

    // Map scroll progress to full globe rotation: -120 to +120 degrees
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
