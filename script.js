(() => {
  'use strict';

  const SLIDE_SECONDS = 7;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Header: scrolled state ---------- */
  const header = $('#header');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 40);

  /* ---------- Fullscreen menu ---------- */
  const menuBtn = $('#menuBtn');
  const gnav = $('#gnav');
  const menuLabel = $('.menu-btn__label');
  const gnavImgs = $$('.gnav__visual img');
  const gnavLinks = $$('.gnav__list a');

  const setMenu = (open) => {
    gnav.classList.toggle('is-open', open);
    header.classList.toggle('is-menu', open);
    document.body.classList.toggle('is-locked', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? 'CLOSE' : 'MENU';
  };
  menuBtn.addEventListener('click', () => setMenu(!gnav.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  const setMenuImage = (i) => {
    gnavImgs.forEach((img, n) => img.classList.toggle('is-active', n === i));
    gnavLinks.forEach((a, n) => a.classList.toggle('is-current', n === i));
  };
  gnavLinks.forEach((a, i) => {
    a.addEventListener('mouseenter', () => setMenuImage(i));
    a.addEventListener('focus', () => setMenuImage(i));
  });
  setMenuImage(0);

  /* ---------- Smooth anchor scroll ---------- */
  $$('.js-scroll').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      setMenu(false);
      const y = id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Hero slideshow (crossfade + slow zoom) ---------- */
  const slides = $$('.hero__slides img');
  const dots = $$('#heroDots button');
  let current = 0;
  let timer;
  const goSlide = (i) => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle('is-active', n === current));
    dots.forEach((d, n) => d.classList.toggle('is-active', n === current));
  };
  const startTimer = () => {
    clearInterval(timer);
    timer = setInterval(() => goSlide(current + 1), SLIDE_SECONDS * 1000);
  };
  dots.forEach((d, i) => d.addEventListener('click', () => { goSlide(i); startTimer(); }));
  startTimer();

  /* ---------- Moon phase ---------- */
  const SYN = 29.530588853;
  const REF = Date.UTC(2000, 0, 6, 18, 14);
  const NAMES = [[1.5, '新月'], [4.5, '三日月'], [6.5, '七日月'], [8.5, '上弦の月'], [11.5, '十日夜の月'], [13.5, '十三夜'], [15.5, '満月'], [16.5, '十六夜'], [17.5, '立待月'], [18.5, '居待月'], [19.5, '寝待月'], [21.5, '更待月'], [23.5, '下弦の月'], [28, '有明月'], [30, '晦']];
  const moon = (d) => {
    const age = (((d.getTime() - REF) / 86400000) % SYN + SYN) % SYN;
    return { age: age.toFixed(1), name: NAMES.find((n) => age < n[0])[1] };
  };
  const now = moon(new Date());
  $('#moonName').textContent = now.name;
  $('#moonAge').textContent = now.age;

  /* ---------- Reserve form ---------- */
  const form = $('#reserveForm');
  const resDate = $('#resDate');
  const moonOnDate = $('#moonOnDate');
  resDate.addEventListener('change', () => {
    if (!resDate.value) {
      moonOnDate.textContent = '日付を選ぶと、その夜の月をお知らせします。';
      return;
    }
    const m = moon(new Date(resDate.value + 'T20:00:00'));
    moonOnDate.textContent = `${resDate.value.replace(/-/g, '.')} の夜は「${m.name}」（月齢 ${m.age}）です。`;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = `ご到着日：${fd.get('date')}\n泊数：${fd.get('nights')}泊\n人数：${fd.get('guests')}名\n\nお名前：\nお電話番号：\nご要望：`;
    window.location.href = `mailto:info@example.jp?subject=${encodeURIComponent('灯月庵 空室のお問い合わせ')}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- Parallax ---------- */
  const parallax = $$('.js-parallax');
  const onScrollParallax = () => {
    if (reduce) return;
    const vh = window.innerHeight;
    parallax.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed || 0.1);
      el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    });
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScrollHeader(); onScrollParallax(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', onScrollParallax);
  onScrollHeader();
  onScrollParallax();

  /* ---------- Reveal on scroll ---------- */
  if (reduce || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('is-reveal-ready');

  $$('.js-hero').forEach((el) => {
    el.style.transitionDelay = `${0.5 + Number(el.dataset.i) * 0.28}s`;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-shown')));
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = `${Number(e.target.dataset.d || 0) * 0.08}s`;
      e.target.classList.add('is-shown');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.js-reveal').forEach((el) => io.observe(el));
})();
