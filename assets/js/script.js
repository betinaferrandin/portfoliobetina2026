/* ==========================================================================
   Yara Betina — Portfólio
   Scrolltelling nativo (sem dependências), player de vídeo próprio,
   lightbox, filtros e formulário que abre o WhatsApp.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var mqCinema = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
  var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cinema = false;
  var reduced = mqReduced.matches;

  /* ---------- Modo de layout ---------- */
  function setMode() {
    cinema = mqCinema.matches;
    reduced = mqReduced.matches;
    root.classList.toggle('is-cinema', cinema);
    root.classList.toggle('is-flow', !cinema);
    if (!cinema) {
      // em fluxo, nada controlado pelo scroll pode ficar escondido
      $$('[data-at]').forEach(function (el) { el.classList.add('is-in'); });
      var mot = $('.motivos');
      if (mot) mot.classList.remove('is-final', 'is-start');
      if (reduced) $$('.m-step').forEach(function (el) { el.classList.add('is-active'); });
    }
    requestTick();
  }
  if (mqCinema.addEventListener) { mqCinema.addEventListener('change', setMode); mqReduced.addEventListener('change', setMode); }
  else if (mqCinema.addListener) { mqCinema.addListener(setMode); mqReduced.addListener(setMode); }

  /* ---------- Navegação ---------- */
  var nav = $('.nav');
  var navToggle = $('.nav__toggle');
  function closeNav() { nav.classList.remove('is-open'); navToggle.setAttribute('aria-expanded', 'false'); }
  navToggle.addEventListener('click', function () {
    var open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
  $$('.nav__links a').forEach(function (a) { a.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeNav(); navToggle.focus(); } });

  // link ativo
  var navLinks = $$('.nav__links a[href^="#"]');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + en.target.id)); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(function (s) { secObs.observe(s); });
  }

  /* ---------- Revelação ao entrar na tela ---------- */
  var revealObs = null;
  if ('IntersectionObserver' in window) {
    revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        if (!en.isIntersecting) return;
        if (cinema && el.hasAttribute('data-at')) return; // controlado pelo scroll
        el.classList.add('is-in');
        revealObs.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach(function (el) { revealObs.observe(el); });

    // passos dos "motivos" no modo fluxo
    var stepObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (cinema || !en.isIntersecting) return;
        en.target.classList.add('is-active');
      });
    }, { threshold: 0.4 });
    $$('.m-step').forEach(function (el) { stepObs.observe(el); });
  } else {
    $$('[data-reveal], [data-at]').forEach(function (el) { el.classList.add('is-in'); });
    $$('.m-step').forEach(function (el) { el.classList.add('is-active'); });
  }

  /* ---------- Motor de scroll ---------- */
  var hero = $('.hero');
  var heroIntro = $('.hero__intro');
  var heroHint = $('.hero__hint');
  var roles = $$('.hero__roles li');
  var sobre = $('.sobre');
  var sobrePhoto = $('.sobre__photo');
  var sobreSteps = $$('.sobre [data-at]');
  var motivos = $('.motivos');
  var steps = $$('.m-step');
  var counter = $('.motivos__count');
  var scrubs = $$('[data-scrub]');
  var ticking = false;

  function progressOf(section) {
    var r = section.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : (r.top < 0 ? 1 : 0);
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;

    // HERO — nome cresce e some; depois as funções aparecem uma a uma
    if (hero && !reduced) {
      var p = progressOf(hero);
      var a = clamp(p / 0.32, 0, 1);
      heroIntro.style.transform = 'scale(' + (1 + a * a * 1.6).toFixed(4) + ')';
      heroIntro.style.opacity = clamp(1 - a * 1.25, 0, 1).toFixed(3);
      heroIntro.style.visibility = a >= 1 ? 'hidden' : 'visible';
      if (heroHint) heroHint.style.opacity = clamp(1 - p * 12, 0, 1).toFixed(3);
      var b = clamp((p - 0.3) / 0.6, 0, 1);
      var cur = b <= 0 ? -1 : Math.min(roles.length - 1, Math.floor(b * roles.length * 0.999));
      roles.forEach(function (li, i) {
        li.classList.toggle('is-in', i <= cur);
        li.classList.toggle('is-on', i === cur || b >= 1);
      });
    } else if (hero) {
      heroIntro.style.transform = ''; heroIntro.style.opacity = ''; heroIntro.style.visibility = '';
    }

    // ME CONHECENDO — foto fixa com zoom leve, textos em sequência
    if (sobre) {
      if (cinema) {
        var ps = progressOf(sobre);
        sobrePhoto.style.setProperty('--zoom', ps.toFixed(4));
        sobreSteps.forEach(function (el) { el.classList.toggle('is-in', ps >= parseFloat(el.getAttribute('data-at'))); });
      } else {
        sobrePhoto.style.setProperty('--zoom', '0');
      }
    }

    // MOTIVOS — um momento por vez
    if (motivos && cinema) {
      var pm = clamp(progressOf(motivos) / 0.94, 0, 1);
      var idx = Math.min(steps.length - 1, Math.floor(pm * steps.length));
      steps.forEach(function (el, i) {
        el.classList.toggle('is-active', i === idx);
        el.classList.toggle('is-past', i < idx);
      });
      motivos.classList.toggle('is-final', idx === steps.length - 1);
      motivos.classList.toggle('is-start', idx === 0);
      var reason = steps[idx].getAttribute('data-reason');
      if (counter) counter.textContent = reason ? reason + ' / 05' : '';
    }

    // elementos com progresso contínuo (máscaras de revelação)
    scrubs.forEach(function (el) {
      if (reduced) { el.style.setProperty('--p', '1'); return; }
      var r = el.getBoundingClientRect();
      el.style.setProperty('--p', clamp((vh - r.top) / (vh * 0.85), 0, 1).toFixed(4));
    });
  }
  function requestTick() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);

  /* ---------- Vídeo de bastidores (mudo, toca só quando visível) ---------- */
  $$('video[data-ambient]').forEach(function (v) {
    if (reduced || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (!v.getAttribute('src')) { v.src = v.getAttribute('data-src'); }
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        } else { v.pause(); }
      });
    }, { threshold: 0.25 }).observe(v);
  });

  /* ---------- Utilidades de modal ---------- */
  var lastFocus = null;
  function lockScroll(lock) { root.style.overflow = lock ? 'hidden' : ''; }
  function trapFocus(container, e) {
    if (e.key !== 'Tab') return;
    var f = $$('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])', container).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Player de vídeo ---------- */
  var modal = $('#player');
  var player = $('.player', modal);
  var frame = $('.player__frame', modal);
  var video = $('video', modal);
  var bigBtn = $('.player__big', modal);
  var playBtn = $('.ctrl--play', modal);
  var muteBtn = $('.ctrl--mute', modal);
  var fsBtn = $('.ctrl--fs', modal);
  var prog = $('.range--progress', modal);
  var vol = $('.range--vol', modal);
  var timeEl = $('.time', modal);
  var idleTimer = null;
  var seeking = false;

  // iOS não permite controlar o volume por script
  (function () {
    var t = document.createElement('video');
    try { t.volume = 0.5; } catch (err) { /* noop */ }
    if (t.volume !== 0.5) player.classList.add('no-volume');
  })();

  function fmt(s) { if (!isFinite(s)) return '0:00'; s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function setFill(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
  function togglePlay() { if (video.paused || video.ended) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); } else video.pause(); }
  function wake() {
    player.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { player.classList.add('is-idle'); }, 2600);
  }

  function openPlayer(card) {
    lastFocus = card;
    var ar = card.getAttribute('data-ar') || '16/9';
    var parts = ar.split('/');
    frame.style.setProperty('--ar', ar.replace('/', ' / '));
    frame.style.setProperty('--ar-num', (parseFloat(parts[0]) / parseFloat(parts[1])).toFixed(5));
    $('.player__title', modal).textContent = card.getAttribute('data-title');
    $('.player__cat', modal).textContent = card.getAttribute('data-cat') || '';
    $('.player__desc', modal).textContent = card.getAttribute('data-desc') || '';
    $('.player__desc', modal).hidden = !card.getAttribute('data-desc');
    video.poster = card.getAttribute('data-poster') || '';
    video.src = card.getAttribute('data-video'); // só agora o arquivo começa a baixar
    prog.value = 0; setFill(prog); timeEl.textContent = '0:00 / 0:00';
    modal.hidden = false;
    lockScroll(true);
    player.classList.add('is-loading');
    var pr = video.play();
    if (pr && pr.catch) pr.catch(function () { player.classList.remove('is-loading'); });
    wake();
    $('.modal__close', modal).focus();
  }
  function closePlayer() {
    if (modal.hidden) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    video.pause();
    video.removeAttribute('src');
    video.load();
    player.classList.remove('is-playing', 'is-loading', 'is-idle', 'is-fs');
    modal.hidden = true;
    lockScroll(false);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  $$('button.vcard[data-video]').forEach(function (card) { card.addEventListener('click', function () { openPlayer(card); }); });
  bigBtn.addEventListener('click', togglePlay);
  playBtn.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);
  video.addEventListener('play', function () { player.classList.add('is-playing'); playBtn.setAttribute('aria-label', 'Pausar'); wake(); });
  video.addEventListener('pause', function () { player.classList.remove('is-playing'); playBtn.setAttribute('aria-label', 'Reproduzir'); player.classList.remove('is-idle'); });
  video.addEventListener('ended', function () { player.classList.remove('is-playing', 'is-idle'); });
  video.addEventListener('waiting', function () { player.classList.add('is-loading'); });
  ['playing', 'canplay', 'pause', 'error'].forEach(function (ev) { video.addEventListener(ev, function () { player.classList.remove('is-loading'); }); });
  video.addEventListener('timeupdate', function () {
    if (!seeking && video.duration) { prog.value = Math.round(video.currentTime / video.duration * 1000); setFill(prog); }
    timeEl.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration);
  });
  video.addEventListener('loadedmetadata', function () { timeEl.textContent = fmt(0) + ' / ' + fmt(video.duration); });
  prog.addEventListener('input', function () { seeking = true; setFill(prog); if (video.duration) video.currentTime = prog.value / 1000 * video.duration; });
  prog.addEventListener('change', function () { seeking = false; });
  vol.addEventListener('input', function () { video.volume = vol.value / 100; video.muted = vol.value == 0; setFill(vol); });
  setFill(vol);
  muteBtn.addEventListener('click', function () { video.muted = !video.muted; if (!video.muted && video.volume === 0) { video.volume = 0.8; vol.value = 80; setFill(vol); } });
  video.addEventListener('volumechange', function () {
    player.classList.toggle('is-muted', video.muted || video.volume === 0);
    muteBtn.setAttribute('aria-label', video.muted ? 'Ativar som' : 'Silenciar');
  });
  fsBtn.addEventListener('click', function () {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (frame.requestFullscreen) frame.requestFullscreen().catch(function () {});
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone
  });
  document.addEventListener('fullscreenchange', function () { player.classList.toggle('is-fs', document.fullscreenElement === frame); });
  frame.addEventListener('pointermove', wake);
  frame.addEventListener('touchstart', wake, { passive: true });
  $('.modal__close', modal).addEventListener('click', closePlayer);
  $('.modal__backdrop', modal).addEventListener('click', closePlayer);
  modal.addEventListener('keydown', function (e) {
    trapFocus(modal, e);
    var tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape') { e.preventDefault(); closePlayer(); }
    else if ((e.key === ' ' || e.key === 'k') && tag !== 'button' && tag !== 'input') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'm') { video.muted = !video.muted; }
    else if (e.key === 'f') { fsBtn.click(); }
    else if (e.key === 'ArrowRight' && tag !== 'input') { video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); }
    else if (e.key === 'ArrowLeft' && tag !== 'input') { video.currentTime = Math.max(0, video.currentTime - 5); }
    wake();
  });

  /* ---------- Lightbox de imagens ---------- */
  var lb = $('#lightbox');
  var lbImg = $('.lightbox__img', lb);
  var lbCap = $('.lightbox__cap', lb);
  var lbGroup = [], lbIndex = 0;

  function lbShow(i) {
    lbIndex = (i + lbGroup.length) % lbGroup.length;
    var el = lbGroup[lbIndex];
    var thumb = $('img', el);
    lbImg.src = el.getAttribute('data-full');
    lbImg.alt = thumb ? thumb.alt : '';
    lbImg.width = parseInt(el.getAttribute('data-w'), 10) || 1200;
    lbImg.height = parseInt(el.getAttribute('data-h'), 10) || 1200;
    lbCap.innerHTML = '';
    var strong = document.createElement('strong'); strong.textContent = el.getAttribute('data-caption') || '';
    lbCap.appendChild(strong);
    if (lbGroup.length > 1) lbCap.appendChild(document.createTextNode('  ·  ' + (lbIndex + 1) + ' de ' + lbGroup.length));
    $$('.lightbox__nav', lb).forEach(function (b) { b.hidden = lbGroup.length < 2; });
    // pré-carrega vizinhas
    [1, -1].forEach(function (d) { var n = lbGroup[(lbIndex + d + lbGroup.length) % lbGroup.length]; if (n) { var im = new Image(); im.src = n.getAttribute('data-full'); } });
  }
  function lbOpen(el) {
    lastFocus = el;
    var g = el.getAttribute('data-lightbox');
    lbGroup = $$('[data-lightbox="' + g + '"]');
    lb.hidden = false; lockScroll(true);
    lbShow(lbGroup.indexOf(el));
    $('.modal__close', lb).focus();
  }
  function lbClose() { lb.hidden = true; lockScroll(false); lbImg.removeAttribute('src'); if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  $$('[data-lightbox]').forEach(function (el) { el.addEventListener('click', function () { lbOpen(el); }); });
  $('.modal__close', lb).addEventListener('click', lbClose);
  $('.modal__backdrop', lb).addEventListener('click', lbClose);
  $('.lightbox__nav--prev', lb).addEventListener('click', function () { lbShow(lbIndex - 1); });
  $('.lightbox__nav--next', lb).addEventListener('click', function () { lbShow(lbIndex + 1); });
  lb.addEventListener('keydown', function (e) {
    trapFocus(lb, e);
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    else if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
  });
  var sx = null;
  lbImg.addEventListener('pointerdown', function (e) { sx = e.clientX; });
  lbImg.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1)); });
  lbImg.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* ---------- Carrosséis ---------- */
  $$('[data-rail]').forEach(function (rail) {
    var id = rail.id;
    var prev = $('[data-rail-prev="' + id + '"]');
    var next = $('[data-rail-next="' + id + '"]');
    function sync() {
      if (!prev) return;
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
    }
    if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -rail.clientWidth * 0.8, behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { rail.scrollBy({ left: rail.clientWidth * 0.8, behavior: 'smooth' }); });
    rail.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  /* ---------- Filtros + contagens automáticas ---------- */
  var cats = $$('.cat[data-cat]');
  cats.forEach(function (c) {
    var n = $$('[data-item]', c).length;
    $$('[data-count="' + c.getAttribute('data-cat') + '"]').forEach(function (el) { el.textContent = n; });
  });
  var filters = $$('.filter');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      cats.forEach(function (c) { c.hidden = !(f === 'all' || c.getAttribute('data-cat') === f); });
      var list = $('#lista-trabalhos');
      if (list.getBoundingClientRect().top < 0) list.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      requestTick();
    });
  });

  /* ---------- Formulário → WhatsApp / e-mail (o site não tem servidor) ---------- */
  var form = $('#contact-form');
  function composeMessage() {
    var d = new FormData(form);
    var linhas = ['Oi, Betina! Vim pelo seu portfólio.', '', 'Nome: ' + d.get('name')];
    if (d.get('email')) linhas.push('E-mail: ' + d.get('email'));
    if (d.get('service')) linhas.push('Serviço: ' + d.get('service'));
    linhas.push('', d.get('message'));
    return linhas.join('\n');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    window.open(form.getAttribute('data-whatsapp') + '?text=' + encodeURIComponent(composeMessage()), '_blank', 'noopener');
  });
  $('#send-email').addEventListener('click', function () {
    if (!form.reportValidity()) return;
    var subject = 'Contato pelo portfólio — ' + (new FormData(form).get('name'));
    window.location.href = 'mailto:' + form.getAttribute('data-email') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(composeMessage());
  });

  /* ---------- Ano no rodapé ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  setMode();
  update();
})();
