(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- PROGRESS BAR + FUNDO DA NAV ---------- */
  var progressBar = document.getElementById('progressBar');
  var navBg = document.getElementById('navBg');
  function updateProgress() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
    if (navBg) navBg.classList.toggle('visible', scrollTop > 40);
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- LIBS (GSAP / ScrollTrigger / Lenis / SplitType via CDN) ---------- */
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var hasLenis = typeof window.Lenis !== 'undefined';
  var hasSplitType = typeof window.SplitType !== 'undefined';
  var lenis = null;

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
  }

  if (hasGSAP && hasLenis && !prefersReducedMotion) {
    lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // evita disputa entre o scroll suave do Lenis e o scroll-behavior:smooth
    // nativo do CSS ao clicar em links internos (#historia, #midia, #contato)
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var hash = link.getAttribute('href');
        if (hash.length < 2) return;
        var target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -16 });
      });
    });
  }
  // sem Lenis (reduced-motion ou CDN fora do ar): scroll nativo do navegador
  // continua funcionando normalmente, sem nenhum passo extra necessário.

  /* ---------- REVEAL ON SCROLL ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (prefersReducedMotion || !hasGSAP) {
    // reduced-motion: conteúdo aparece direto, sem animação.
    // sem GSAP (CDN indisponível): mesma saída, degradação graciosa.
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    ScrollTrigger.batch(revealEls, {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
        });
        batch.forEach(function (el) { el.classList.add('is-visible'); });
      },
    });
  }

  /* ---------- HERO: TITULO POR LINHA (SplitType, uma vez, no load) ---------- */
  if (hasGSAP && hasSplitType && !prefersReducedMotion) {
    var heroH1 = document.querySelector('.hero h1');
    if (heroH1) {
      heroH1.style.animation = 'none'; // a CSS keyframe fica só de fallback
      var split = new SplitType(heroH1, { types: 'lines' });
      gsap.set(split.lines, { opacity: 0, y: '100%' });
      gsap.to(split.lines, {
        opacity: 1,
        y: '0%',
        duration: 1,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.3,
      });
    }
  }

  /* ---------- PIN NA SECAO DE CITACAO (desktop only) ---------- */
  if (hasGSAP) {
    var quoteSection = document.querySelector('.quote-section');
    var quoteImgWrap = document.querySelector('.quote-img-wrap');
    var quoteTextEl = document.querySelector('.quote-text');
    if (quoteSection && quoteImgWrap && quoteTextEl) {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 769px)', function () {
        if (prefersReducedMotion) {
          gsap.set(quoteTextEl, { opacity: 1, y: 0 });
          return;
        }
        gsap.set(quoteTextEl, { opacity: 0, y: 24 });
        var quoteTl = gsap.timeline({
          scrollTrigger: {
            trigger: quoteSection,
            start: 'top top',
            end: '+=60%',
            scrub: 0.6,
            pin: quoteImgWrap,
          },
        });
        quoteTl.to(quoteTextEl, { opacity: 1, y: 0, ease: 'none' });
        return function () {
          gsap.set(quoteTextEl, { clearProps: 'all' });
        };
      });
    }
  }

  /* ---------- HOVER MAGNETICO NOS LINKS DO CTA FINAL ---------- */
  if (hasGSAP && !prefersReducedMotion) {
    document.querySelectorAll('.cta-links a').forEach(function (link) {
      link.addEventListener('mousemove', function (e) {
        var rect = link.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        gsap.to(link, {
          x: Math.max(-4, Math.min(4, dx * 0.04)),
          y: Math.max(-3, Math.min(3, dy * 0.25)),
          duration: 0.4,
          ease: 'power2.out',
        });
      });
      link.addEventListener('mouseleave', function () {
        gsap.to(link, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ---------- PARALLAX NO HERO ---------- */
  var heroImg = document.getElementById('heroImg');
  var hero = document.querySelector('.hero');
  var ticking = false;

  function updateParallax() {
    var rect = hero.getBoundingClientRect();
    var offset = Math.max(0, -rect.top);
    var translate = Math.min(offset * 0.15, rect.height * 0.15);
    heroImg.style.transform = 'translateY(' + translate + 'px)';
    ticking = false;
  }
  function onScrollParallax() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }
  if (!prefersReducedMotion) {
    window.addEventListener('scroll', onScrollParallax, { passive: true });
  }

  /* ---------- TRILHO DE TIMELINE (secao historia) ---------- */
  var historiaSection = document.getElementById('historia');
  var timelineFill = document.getElementById('timelineFill');
  var timelineTicking = false;

  function updateTimeline() {
    var rect = historiaSection.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = rect.height + vh;
    var progressed = vh - rect.top;
    var pct = Math.min(100, Math.max(0, (progressed / total) * 100));
    timelineFill.style.height = pct + '%';
    timelineTicking = false;
  }
  function onScrollTimeline() {
    if (!timelineTicking) {
      requestAnimationFrame(updateTimeline);
      timelineTicking = true;
    }
  }
  if (historiaSection && timelineFill && !prefersReducedMotion) {
    window.addEventListener('scroll', onScrollTimeline, { passive: true });
    updateTimeline();
  }

  /* ---------- TOUCH HOVER NOS CARDS DE MIDIA ---------- */
  var mediaCards = document.querySelectorAll('.midia-card');
  mediaCards.forEach(function (card) {
    card.addEventListener(
      'touchstart',
      function () {
        card.classList.add('touch-active');
        window.clearTimeout(card.__touchTimeout);
        card.__touchTimeout = window.setTimeout(function () {
          card.classList.remove('touch-active');
        }, 1500);
      },
      { passive: true }
    );
  });

  /* ---------- NAV MOBILE (hamburguer + drawer) ---------- */
  var navToggle = document.getElementById('navToggle');
  var navScrim = document.getElementById('navScrim');
  var navPanel = document.getElementById('navPanel');

  function closeNav() {
    document.body.classList.remove('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  function openNav() {
    document.body.classList.add('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      if (document.body.classList.contains('nav-open')) closeNav();
      else openNav();
    });
  }
  if (navScrim) navScrim.addEventListener('click', closeNav);
  if (navPanel) {
    navPanel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ---------- I18N ---------- */
  var SUPPORTED_LANGS = ['pt', 'en', 'ru', 'sr'];
  var DEFAULT_LANG = 'pt';
  var STORAGE_KEY = 'nevena_lang';
  var cache = {};

  function getNested(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : null;
    }, obj);
  }

  function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var value = getNested(dict, key);
      if (value) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      var value = getNested(dict, key);
      if (value) el.setAttribute('alt', value);
    });
    document.documentElement.lang = currentLangToHtmlLang(dict.__lang);
  }

  function currentLangToHtmlLang(lang) {
    switch (lang) {
      case 'en': return 'en';
      case 'ru': return 'ru';
      case 'sr': return 'sr';
      default: return 'pt-BR';
    }
  }

  function setActiveButton(lang) {
    document.querySelectorAll('.lang-switch button').forEach(function (btn) {
      var isActive = btn.getAttribute('data-lang') === lang;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function reRevealVisible() {
    // re-trigger reveal for elements already marked visible so translated
    // text swapped by innerHTML/textContent doesn't disappear
    revealEls.forEach(function (el) {
      if (!el.classList.contains('is-visible')) return;
      el.classList.add('is-visible');
    });
  }

  function loadLang(lang) {
    if (SUPPORTED_LANGS.indexOf(lang) === -1) lang = DEFAULT_LANG;
    var apply = function (dict) {
      dict.__lang = lang;
      applyTranslations(dict);
      setActiveButton(lang);
      reRevealVisible();
      localStorage.setItem(STORAGE_KEY, lang);
    };
    if (cache[lang]) {
      apply(cache[lang]);
      return;
    }
    fetch('i18n/' + lang + '.json')
      .then(function (res) { return res.json(); })
      .then(function (dict) {
        cache[lang] = dict;
        apply(dict);
      })
      .catch(function (err) {
        console.error('Falha ao carregar idioma', lang, err);
      });
  }

  function detectInitialLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.indexOf(stored) !== -1) return stored;
    var nav = (navigator.language || '').toLowerCase();
    if (nav.indexOf('ru') === 0) return 'ru';
    if (nav.indexOf('sr') === 0) return 'sr';
    return DEFAULT_LANG;
  }

  document.querySelectorAll('.lang-switch button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      loadLang(btn.getAttribute('data-lang'));
    });
  });

  loadLang(detectInitialLang());
})();
