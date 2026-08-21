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

  /* ---------- LIBS (GSAP / ScrollTrigger / SplitText / ScrambleText / CustomEase / Lenis via CDN) ---------- */
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var hasLenis = typeof window.Lenis !== 'undefined';
  var hasSplitText = hasGSAP && typeof window.SplitText !== 'undefined';
  var hasScramble = hasGSAP && typeof window.ScrambleTextPlugin !== 'undefined';
  var hasCustomEase = hasGSAP && typeof window.CustomEase !== 'undefined';
  var lenis = null;

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (hasSplitText) gsap.registerPlugin(SplitText);
    if (hasScramble) gsap.registerPlugin(ScrambleTextPlugin);
    if (hasCustomEase) gsap.registerPlugin(CustomEase);
  }

  // assinatura de movimento do site: desacelera com uma leve "respirada" no
  // fim em vez do ease-out genérico — usado nos reveals e no hero.
  var SIGNATURE_EASE = 'power3.out';
  if (hasCustomEase) {
    CustomEase.create('neveEase', 'M0,0 C0.16,1 0.3,1 0.52,0.99 0.72,0.98 0.86,1 1,1');
    SIGNATURE_EASE = 'neveEase';
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
          ease: SIGNATURE_EASE,
          stagger: 0.08,
        });
        batch.forEach(function (el) { el.classList.add('is-visible'); });
      },
    });
  }

  /* ---------- HERO: TITULO POR LINHA (GSAP SplitText, uma vez, no load) ---------- */
  if (hasGSAP && hasSplitText && !prefersReducedMotion) {
    var heroH1 = document.querySelector('.hero h1');
    if (heroH1) {
      heroH1.style.animation = 'none'; // a CSS keyframe fica só de fallback
      SplitText.create(heroH1, {
        type: 'lines',
        linesClass: 'line',
        onSplit: function (self) {
          gsap.set(self.lines, { opacity: 0, y: '100%' });
          return gsap.to(self.lines, {
            opacity: 1,
            y: '0%',
            duration: 1,
            ease: 'power4.out',
            stagger: 0.12,
            delay: 0.3,
          });
        },
      });
    }
  }

  /* ---------- DECODIFICACAO (ScrambleText) NOS RÓTULOS CURTOS ---------- */
  // efeito de "documento sendo revelado" nos rótulos estruturais (eyebrow do
  // hero + labels de seção) — nunca aplicado às falas/depoimento da Nevena.
  if (hasGSAP && hasScramble && !prefersReducedMotion) {
    var heroEyebrow = document.querySelector('.hero .eyebrow');
    if (heroEyebrow) {
      var eyebrowText = heroEyebrow.textContent;
      gsap.to(heroEyebrow, {
        duration: 0.9,
        delay: 0.15,
        scrambleText: { text: eyebrowText, chars: 'upperAndLowerCase', speed: 0.4 },
        ease: 'none',
      });
    }
    document.querySelectorAll('.section-label, .press-label').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          var text = el.textContent;
          gsap.to(el, {
            duration: 0.8,
            scrambleText: { text: text, chars: 'upperAndLowerCase', speed: 0.45 },
            ease: 'none',
          });
        },
      });
    });
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

  /* ---------- HOVER MAGNETICO (CTA final, nav desktop, seletor de idioma) ---------- */
  if (hasGSAP && !prefersReducedMotion && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    function magnetize(el, strengthX, strengthY) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        gsap.to(el, {
          x: Math.max(-strengthX, Math.min(strengthX, dx * 0.35)),
          y: Math.max(-strengthY, Math.min(strengthY, dy * 0.35)),
          duration: 0.4,
          ease: 'power2.out',
        });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    }
    document.querySelectorAll('.cta-links a').forEach(function (el) { magnetize(el, 4, 3); });
    document.querySelectorAll('.nav-desktop ul a').forEach(function (el) { magnetize(el, 5, 3); });
    document.querySelectorAll('.nav-desktop .lang-switch button').forEach(function (el) { magnetize(el, 3, 3); });
  }

  /* ---------- TILT 3D NOS CARDS DE MIDIA (desktop, ponteiro fino) ---------- */
  if (hasGSAP && !prefersReducedMotion && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.midia-card:not(.midia-card--pending)').forEach(function (card) {
      var rotateX = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: 'power2.out' });
      var rotateY = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: 'power2.out' });
      var lift = gsap.quickTo(card, 'y', { duration: 0.4, ease: 'power2.out' });
      gsap.set(card, { transformPerspective: 700, transformStyle: 'preserve-3d' });
      card.addEventListener('mouseenter', function () { lift(-4); });
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        rotateY(px * 10);
        rotateX(py * -10);
      });
      card.addEventListener('mouseleave', function () {
        rotateX(0);
        rotateY(0);
        lift(0);
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
