// MASİS — site etkileşimleri. Header ve footer sunucu tarafında (PHP) oluşur.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const mobile = () => matchMedia('(max-width: 1240px)').matches;

// Menü: masaüstünde üst başlık sayfaya gider, mobilde alt menüyü açar
const nav = $('.nav'), toggle = $('.nav-toggle'), hdr = $('.header');
// Mobil menü header'ın o anki alt kenarından başlar (üstteki şeritler kaydırmaya göre görünür/gizli olabilir)
const placeNav = () => { if (hdr) document.documentElement.style.setProperty('--nav-top', Math.max(0, hdr.getBoundingClientRect().bottom) + 'px'); };
const setNav = open => {
  if (!nav || !toggle) return;
  if (open) placeNav();
  nav.classList.toggle('is-open', open);
  toggle.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  document.documentElement.classList.toggle('nav-locked', open);
};
toggle?.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
$$('.nav__item > button').forEach(btn => btn.addEventListener('click', () => {
  if (mobile()) btn.parentElement.classList.toggle('is-open');
  else location.href = btn.dataset.href;
}));
$$('.nav a').forEach(a => a.addEventListener('click', () => setNav(false)));
addEventListener('keydown', e => { if (e.key === 'Escape') setNav(false); });
addEventListener('resize', () => { if (!mobile()) setNav(false); else if (nav?.classList.contains('is-open')) placeNav(); });

// Kaydırınca header gölgesi + yukarı çık
const toTop = $('.to-top');
addEventListener('scroll', () => {
  hdr?.classList.toggle('is-scrolled', scrollY > 40);
  toTop?.classList.toggle('is-visible', scrollY > 600);
}, { passive: true });
toTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

// Hero ekranı tam doldurur: üst şerit ve menünün yüksekliği ölçülüp kalan ekran yüksekliği verilir
const fitHero = () => { const h = $('.slider'); if (h) document.documentElement.style.setProperty('--hero-top', Math.max(0, h.getBoundingClientRect().top + scrollY) + 'px'); };
fitHero(); addEventListener('resize', fitHero);

// Slider
$$('.slider').forEach(slider => {
  // Yazılar videoyla birlikte ilerler: video, yazı sayısı kadar eşit bölüme ayrılır; her bölümde o bölümün yazısı görünür.
  const slides = $$('.slide', slider);
  const video = $('.slider__video', slider);
  if (!slides.length) return;
  const show = i => slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
  // Telefonda videonun başındaki MASİS logosu yazıyla aynı yere düşer: yazılar logodan sonra başlar.
  // Geniş ekranda logo sağda, yazı solda; yazı en baştan görünür.
  const INTRO = matchMedia('(max-width: 767px)').matches ? 6.9 : 0;
  // Not: video normal hızda oynar (yavaşlatma 30 kare/sn videoda takılma yapar); her yazı ekranda ~6 sn kalır
  let synced = false;
  if (video) video.addEventListener('timeupdate', () => {
    if (!video.duration || video.paused) return;
    synced = true;
    // Logodan sonraki süre yazı sayısı kadar eşit bölüme ayrılır
    const t = video.currentTime - INTRO;
    if (t < 0) { show(-1); return; }
    const seg = (video.duration - INTRO) / slides.length;
    const i = Math.min(slides.length - 1, Math.floor(t / seg));
    show(i);  // boşluk yok: bir yazı giderken sıradaki gelir
  });
  // Video oynamıyorsa (yükleniyor, veri tasarrufu, hareket azaltma): yazılar zamanlayıcıyla sırayla gelir
  let i = 0;
  const tick = () => {
    if (synced) return;
    show(i); i = (i + 1) % slides.length;
    setTimeout(tick, 6500);
  };
  setTimeout(tick, 300);
});

// Arka plan videosu: sayfa (görseller, yazı tipleri) yüklendikten sonra indirilmeye başlar; o ana kadar poster görünür.
// Hareket azaltma ya da veri tasarrufu açıksa hiç indirilmez.
$$('.slider__video').forEach(v => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return;
  const start = () => {
    $$('source', v).forEach(s => { s.src = s.dataset.src; });
    v.load();
    v.play()?.catch(() => {});
  };
  document.readyState === 'complete' ? start() : addEventListener('load', start, { once: true });
});

// Kayan şeritler: içerik ekranı dolduracak kadar çoğaltılır, sonra ikilenir; -50% kayınca tur kesintisiz başa sarar.
// Süre genişliğe göre ayarlanır ki öğe sayısı değişse de hız aynı kalsın.
$$('.ticker__list, .logo-marquee__list').forEach(list => {
  const set = list.innerHTML, first = list.children.length;
  const need = Math.max(list.parentElement.clientWidth, screen.width);
  for (let n = 0; list.scrollWidth < need && n < 20; n++) list.innerHTML += set;
  list.innerHTML += list.innerHTML;
  [...list.children].slice(first).forEach(c => { c.setAttribute('aria-hidden', 'true'); c.inert = true; c.classList.add('is-clone'); });
  const speed = list.classList.contains('ticker__list') ? 30 : 48; // piksel/saniye
  list.style.animationDuration = (list.scrollWidth / 2 / speed) + 's';
});

// Yatay kaydırmalı listeler
$$('[data-carousel]').forEach(nav => {
  const track = $(nav.dataset.carousel);
  if (!track?.firstElementChild) return;
  const step = () => track.firstElementChild.getBoundingClientRect().width + 24;
  $('.js-prev', nav).addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('.js-next', nav).addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
});

// Sekmeler ve filtre çipleri: [data-cat] öğelerini süzer
$$('[data-filter-group]').forEach(group => {
  const target = $(group.dataset.filterGroup);
  const apply = f => {
    $$('[data-filter]', group).forEach(c => c.classList.toggle('is-active', c.dataset.filter === f));
    const panes = $$('[data-pane]', target);
    if (panes.length) panes.forEach(el => { el.hidden = el.dataset.pane !== f; });
    else $$('[data-cat]', target).forEach(el => { el.hidden = f !== 'all' && !el.dataset.cat.split(' ').includes(f); });
  };
  group.addEventListener('click', e => { const c = e.target.closest('[data-filter]'); if (c) apply(c.dataset.filter); });
  const hash = location.hash.slice(1);
  if (hash && $(`[data-filter="${CSS.escape(hash)}"]`, group)) apply(hash);
});

// Sayfa içi menüler: aşağı inildikçe o an okunan bölüm seçili görünür
$$('[data-spy]').forEach(menu => {
  const links = $$('a[href^="#"]', menu);
  const targets = links.map(a => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  if (!targets.length) return;
  const setActive = id => links.forEach(a => {
    const on = a.hash.slice(1) === id;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    // Yatay kayan menülerde (mobil, Üyelik) seçili öğeyi görünür tut.
    // scrollIntoView kullanılmaz: sayfayı da menüye geri kaydırıp aşağı inmeyi engelliyordu.
    if (on) {
      const box = menu.scrollWidth > menu.clientWidth ? menu : menu.querySelector('.wrap');
      if (box && box.scrollWidth > box.clientWidth) {
        const x = box.scrollLeft + a.getBoundingClientRect().left - box.getBoundingClientRect().left - (box.clientWidth - a.offsetWidth) / 2;
        box.scrollTo({ left: x, behavior: 'smooth' });
      }
    }
  });
  const update = () => {
    const line = innerHeight * 0.3;                // ekranın üst kısmındaki okuma çizgisi
    let current = targets[0];
    for (const t of targets) if (t.getBoundingClientRect().top - line <= 0) current = t;
    // Sayfanın sonuna gelindiyse son bölümü seç
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = targets.at(-1);
    setActive(current.id);
  };
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); } }, { passive: true });
  addEventListener('resize', update);
  update();
});

// Foto galeri: fotoğraf sayfanın üstünde büyük açılır, oklarla / kaydırarak geçilir
$$('[data-lightbox]').forEach(gallery => {
  const items = $$('a', gallery);
  if (!items.length) return;
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Fotoğraf görüntüleyici');
  box.innerHTML = `
    <button class="lightbox__close" aria-label="Kapat">×</button>
    <button class="lightbox__nav lightbox__nav--prev" aria-label="Önceki fotoğraf">‹</button>
    <figure class="lightbox__figure"><img alt=""><figcaption></figcaption></figure>
    <button class="lightbox__nav lightbox__nav--next" aria-label="Sonraki fotoğraf">›</button>
    <div class="lightbox__count"></div>`;
  document.body.appendChild(box);
  const img = $('img', box), cap = $('figcaption', box), count = $('.lightbox__count', box);
  let i = 0, lastFocus = null;

  const show = n => {
    i = (n + items.length) % items.length;
    const a = items[i];
    img.classList.remove('is-loaded');
    img.onload = () => img.classList.add('is-loaded');
    img.src = a.href;
    img.alt = a.dataset.caption || '';
    cap.textContent = a.dataset.caption || '';
    cap.hidden = !a.dataset.caption;
    count.textContent = `${i + 1} / ${items.length}`;
    // Bir sonrakini önceden yükle
    new Image().src = items[(i + 1) % items.length].href;
  };
  const open = n => {
    lastFocus = document.activeElement;
    show(n);
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    $('.lightbox__close', box).focus();
  };
  const close = () => {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    lastFocus?.focus();
  };

  items.forEach((a, n) => a.addEventListener('click', e => { e.preventDefault(); open(n); }));
  $('.lightbox__close', box).addEventListener('click', close);
  $('.lightbox__nav--prev', box).addEventListener('click', () => show(i - 1));
  $('.lightbox__nav--next', box).addEventListener('click', () => show(i + 1));
  box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('lightbox__figure')) close(); });
  document.addEventListener('keydown', e => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  // Dokunmatik ekranda sağa / sola kaydırma
  let x0 = null;
  box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
    x0 = null;
  });
});

// Formlar: gönderilirken buton kilitlenir (çift tıklamayla iki kez gönderilmesin)
$$('form.form').forEach(f => f.addEventListener('submit', () => {
  const b = $('button[type=submit]', f);
  if (b) setTimeout(() => { b.disabled = true; b.setAttribute('aria-busy', 'true'); }, 0);
}));

// Rakamlar bandı: maden haritalarındaki eşyükselti çizgileri gibi yavaşça akan topografik çizgiler ve nabız gibi
// atan altın renkli saha noktaları. Yalnızca görünürken çizilir; hareket azaltma açıksa sabit kalır.
$$('.stats-band__net').forEach(cv => {
  const band = cv.parentElement, ctx = cv.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Yumuşak değer gürültüsü (3 katman) — çizgilerin şekli
  const P = new Uint8Array(512);
  { const q = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; } for (let i = 0; i < 512; i++) P[i] = q[i & 255]; }
  const sm = t => t * t * (3 - 2 * t);
  const vn = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi);
    const a = P[(P[xi & 255] + yi) & 511], b = P[(P[(xi + 1) & 255] + yi) & 511], c = P[(P[xi & 255] + yi + 1) & 511], d = P[(P[(xi + 1) & 255] + yi + 1) & 511];
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) / 255;
  };
  const field = (x, y, t) => vn(x + t * .05, y + t * .03) * .6 + vn(x * 2.1 - t * .04, y * 2.1 + 3.7) * .28 + vn(x * 4.3 + 9, y * 4.3 - t * .02) * .12;
  let w = 0, h = 0, sites = [], run = false, raf = 0, last = 0;
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    w = band.clientWidth; h = band.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Saha noktaları yazıların ve rakamların üstüne düşmesin
    const box = band.getBoundingClientRect();
    const busy = $$('h2, .stats-row > div', band).map(el => { const r = el.getBoundingClientRect(); return [r.left - box.left - 28, r.top - box.top - 28, r.right - box.left + 28, r.bottom - box.top + 28]; });
    sites = [];
    for (let n = Math.max(3, Math.round(w / 300)), tries = 0; sites.length < n && tries < 400; tries++) {
      const x = Math.random() * w, y = 20 + Math.random() * (h - 40);
      if (!busy.some(([l, t, r, b]) => x > l && x < r && y > t && y < b)) sites.push({ x: x / w, y: y / h, ph: Math.random() * 6.28 });
    }
  };
  const draw = t => {
    ctx.clearRect(0, 0, w, h);
    const cell = 12, cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1, sc = 1 / 260, ts = t / 1000;
    const g = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) g[j * cols + i] = field(i * cell * sc, j * cell * sc, ts);
    const L = 16;
    for (let k = 1; k < L; k++) {
      const lv = .18 + k * (.64 / L), major = k % 4 === 0;
      ctx.beginPath();
      // Kare kare yürüyerek (marching squares) her seviyenin çizgisini bul
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
        const a = g[j * cols + i], b = g[j * cols + i + 1], c = g[(j + 1) * cols + i + 1], d = g[(j + 1) * cols + i];
        const id = (a > lv) | (b > lv) << 1 | (c > lv) << 2 | (d > lv) << 3;
        if (id === 0 || id === 15) continue;
        const x = i * cell, y = j * cell, f = (p, q) => (lv - p) / (q - p);
        const T = [x + cell * f(a, b), y], Rt = [x + cell, y + cell * f(b, c)], B = [x + cell * f(d, c), y + cell], Lf = [x, y + cell * f(a, d)];
        const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
        switch (id) {
          case 1: case 14: seg(Lf, T); break; case 2: case 13: seg(T, Rt); break; case 3: case 12: seg(Lf, Rt); break;
          case 4: case 11: seg(Rt, B); break; case 5: seg(Lf, T); seg(Rt, B); break; case 6: case 9: seg(T, B); break;
          case 7: case 8: seg(Lf, B); break; case 10: seg(T, Rt); seg(Lf, B); break;
        }
      }
      ctx.strokeStyle = `rgba(255,255,255,${major ? .22 : .10})`;
      ctx.lineWidth = major ? 1.4 : 1;
      ctx.stroke();
    }
    for (const s of sites) {
      const x = s.x * w, y = s.y * h, k = (Math.sin(ts * 1.4 + s.ph) + 1) / 2;
      ctx.fillStyle = '#d9b44a'; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 6.283); ctx.fill();
      ctx.strokeStyle = `rgba(217,180,74,${.55 * (1 - k)})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 6 + k * 16, 0, 6.283); ctx.stroke();
    }
  };
  const step = t => {
    if (t - last > 33) { draw(t); last = t; }  // ~30 kare/sn yeterli, işlemciyi yormaz
    if (run) raf = requestAnimationFrame(step);
  };
  size(); draw(0);
  new ResizeObserver(() => { size(); draw(performance.now()); }).observe(band);
  if (still) return;
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !run) { run = true; raf = requestAnimationFrame(step); }
    else if (!en.isIntersecting && run) { run = false; cancelAnimationFrame(raf); }
  }).observe(band);
});

// Rakamlar ekrana gelince sıfırdan sayarak yükselir (Türkçe biçim korunur: 15.463 · 6,4)
$$('[data-count]').forEach(el => {
  const raw = el.dataset.count.trim(), m = raw.match(/^([\d.]+)(?:,(\d+))?$/);
  if (!m || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dec = (m[2] || '').length, target = parseFloat(m[1].replace(/\./g, '') + (dec ? '.' + m[2] : ''));
  const fmt = v => v.toLocaleString('tr-TR', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: m[1].includes('.') });
  el.textContent = fmt(0);
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    const t0 = performance.now(), dur = 1600;
    const tick = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = fmt(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); else el.textContent = raw; };
    requestAnimationFrame(tick);
  }, { threshold: .4 });
  io.observe(el);
});

// Üyelerimiz bölümü: katman katman sıradağlar. Arkadaki katmanlar yavaş, öndekiler hızlı kayar (derinlik);
// en öndeki sırtta ince altın çizgi. Yalnızca görünürken çizilir; hareket azaltma açıksa sabit kalır.
$$('.members-sec__ridges').forEach(cv => {
  const sec = cv.parentElement, ctx = cv.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seed = Math.random() * 100;
  const rnd = (i, s) => { const x = Math.sin(i * 127.1 + (s + seed) * 311.7) * 43758.5453; return x - Math.floor(x); };
  const LAYERS = [
    { seg: 240, amp: .34, base: .70, sp: 4, c: 'rgba(34,60,135,.035)', s: 1 },
    { seg: 170, amp: .28, base: .78, sp: 8, c: 'rgba(34,60,135,.05)', s: 2 },
    { seg: 125, amp: .22, base: .86, sp: 14, c: 'rgba(34,60,135,.065)', s: 3 },
    { seg: 95, amp: .14, base: .95, sp: 22, c: 'rgba(34,60,135,.08)', s: 4, gold: true },
  ];
  let w = 0, h = 0, run = false, raf = 0, t0 = performance.now();
  const size = () => {
    const d = Math.min(2, devicePixelRatio || 1);
    w = sec.clientWidth; h = sec.clientHeight;
    cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  const draw = t => {
    ctx.clearRect(0, 0, w, h);
    for (const L of LAYERS) {
      // Sırtın köşe noktaları kendi konumlarıyla birlikte sola kayar (şekil bozulmadan akar)
      const off = t / 1000 * L.sp, pts = [];
      for (let i = Math.floor(off / L.seg) - 1; i * L.seg - off <= w + L.seg; i++) pts.push([i * L.seg - off, h * (L.base - L.amp * rnd(i, L.s))]);
      ctx.beginPath(); ctx.moveTo(pts[0][0], h);
      for (const [x, y] of pts) ctx.lineTo(x, y);
      ctx.lineTo(pts[pts.length - 1][0], h); ctx.closePath();
      ctx.fillStyle = L.c; ctx.fill();
      if (L.gold) {
        ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.strokeStyle = 'rgba(201,162,39,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
      }
    }
  };
  const step = t => { draw(t - t0); if (run) raf = requestAnimationFrame(step); };
  size(); draw(0);
  new ResizeObserver(() => { size(); draw(performance.now() - t0); }).observe(sec);
  if (still) return;
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !run) { run = true; raf = requestAnimationFrame(step); }
    else if (!en.isIntersecting && run) { run = false; cancelAnimationFrame(raf); }
  }).observe(sec);
});

/* Çerez onayı: seçim tarayıcıda saklanır. "Kabul et" olmadan çerez kullanan dış içerik (Google Haritalar) yüklenmez. */
(() => {
  const KEY = 'masis.cookie';
  const bar = document.querySelector('.cookie-bar');
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  const loadMaps = () => document.querySelectorAll('.map-card--off[data-map-src]').forEach(card => {
    const f = document.createElement('iframe');
    f.src = card.dataset.mapSrc; f.title = card.dataset.mapTitle || 'Harita';
    f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true; f.loading = 'lazy';
    card.classList.remove('map-card--off'); card.replaceChildren(f);
  });
  const show = () => { if (bar) bar.hidden = false; };
  if (get() === '1') loadMaps();
  else if (get() === null) show();
  if (bar) bar.querySelectorAll('[data-cookie]').forEach(b => b.addEventListener('click', () => {
    const prev = get();
    set(b.dataset.cookie); bar.hidden = true;
    if (b.dataset.cookie === '1') loadMaps();
    else if (prev === '1' && document.querySelector('.map-card iframe')) location.reload(); // önceden yüklenen harita kalksın
  }));
  document.querySelectorAll('[data-cookie-prefs]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); show(); }));
})();
