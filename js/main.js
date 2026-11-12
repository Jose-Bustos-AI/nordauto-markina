/* Nord-Auto Markina — interacción y movimiento (vanilla JS, sin dependencias) */
(() => {
  'use strict';

  const PHONE = '34631794157';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ---------- Titular: palabras que suben ---------- */
  const split = $('[data-split]');
  if (split) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.append(' '); return; }
            const outer = document.createElement('span');
            outer.className = 'split-word';
            const inner = document.createElement('span');
            inner.style.setProperty('--i', i++);
            inner.textContent = w;
            outer.append(inner);
            frag.append(outer);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(split);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-ready')));

  /* ---------- Carrusel del hero ---------- */
  const slider = $('[data-slider]');
  if (slider) {
    const slides = $$('.hero__slide', slider);
    const dots = $$('.hero__dots button');
    const caption = $('.hero__caption');
    const MS = 6500;
    document.documentElement.style.setProperty('--slide-ms', MS + 'ms');
    let cur = 0, timer;

    // carga diferida de las fotos 2 y 3 en cuanto la primera está lista
    slides.forEach((s) => { const im = $('img', s); if (im.loading === 'lazy') im.loading = 'eager'; });

    const go = (n) => {
      if (n === cur) return;
      const prev = slides[cur];
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      setTimeout(() => prev.classList.remove('is-leaving'), 1400);
      cur = (n + slides.length) % slides.length;
      const next = slides[cur];
      // reinicia el Ken Burns
      const img = $('img', next); img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
      next.classList.add('is-active');
      dots.forEach((d, k) => {
        d.setAttribute('aria-selected', k === cur);
        d.classList.toggle('is-done', k < cur);
        const bar = $('span', d); bar.style.display = 'none'; void bar.offsetWidth; bar.style.display = '';
      });
      if (caption) caption.textContent = $('figcaption', next).textContent;
      schedule();
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(() => go(cur + 1), MS); };
    dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
    schedule();
    document.addEventListener('visibilitychange', () => (document.hidden ? clearTimeout(timer) : schedule()));

    // niebla de pistola siguiendo el cursor
    const hero = $('.hero');
    if (finePointer) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
        hero.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }
  }

  /* ---------- Revelado al hacer scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  // escalonado automático entre hermanos
  $$('[data-reveal]').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    const idx = sibs.indexOf(el);
    if (idx > 0) el.style.setProperty('--d', `${Math.min(idx, 6) * 90}ms`);
    io.observe(el);
  });
  $$('.map').forEach((m) => io.observe(m));

  /* ---------- Bucle de scroll: progreso, cabecera, parallax, proceso ---------- */
  const nav = $('.nav');
  const bar = $('.scrollbar span');
  const dock = $('.dock');
  const heroEl = $('.hero');
  const parallax = $$('[data-parallax]');
  const steps = $('[data-steps]');
  const stepLine = steps && $('.steps__line', steps);
  const stepItems = steps ? $$('.step', steps) : [];
  let lastY = scrollY, ticking = false;

  const onScroll = () => {
    const y = scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;

    const heroH = heroEl ? heroEl.offsetHeight : 0;
    nav.classList.toggle('is-solid', y > heroH - 90);
    nav.classList.toggle('is-hidden', y > 300 && y > lastY && y < h - 40);
    if (dock) dock.classList.toggle('is-on', y > heroH * 0.6);
    lastY = y;

    {
      parallax.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.translate = `0 ${(-p * parseFloat(img.dataset.parallax) * 100).toFixed(2)}%`;
      });
    }

    if (steps) {
      const r = steps.getBoundingClientRect();
      const mid = innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      stepLine.style.setProperty('--p', p.toFixed(3));
      stepItems.forEach((s) => s.classList.toggle('is-lit', s.getBoundingClientRect().top < mid));
    }

    // enlace activo del menú
    let current = '';
    $$('main section[id]').forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id; });
    $$('.nav__links a').forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${current}`));

    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Contador de la nota ---------- */
  const counter = $('[data-count-to]');
  if (counter) {
    const target = parseFloat(counter.dataset.countTo);
    const cio = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      cio.disconnect();
      const t0 = performance.now(), dur = 1400;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const v = target * (1 - Math.pow(1 - k, 3));
        counter.textContent = v.toFixed(1).replace('.', ',');
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    cio.observe(counter);
  }

  /* ---------- Horario en directo (hora de Madrid) ---------- */
  const SLOTS = [[9 * 60, 13 * 60], [15 * 60, 19 * 60]];
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const madridNow = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
  };
  const isWorkday = (d) => d >= 1 && d <= 5;
  const status = () => {
    const { day, min } = madridNow();
    if (isWorkday(day)) {
      for (const [a, b] of SLOTS) {
        if (min >= a && min < b) return { open: true, short: 'Abierto', long: `Abierto ahora · cierra a las ${fmt(b)}` };
        if (min < a) return { open: false, short: 'Cerrado', long: `Cerrado · abre hoy a las ${fmt(a)}` };
      }
    }
    let d = (day + 1) % 7, n = 1;
    while (!isWorkday(d)) { d = (d + 1) % 7; n++; }
    const when = n === 1 ? 'mañana' : `el ${DAYS[d]}`;
    return { open: false, short: 'Cerrado', long: `Cerrado · abre ${when} a las ${fmt(SLOTS[0][0])}` };
  };
  const paintStatus = () => {
    const s = status();
    $$('[data-status]').forEach((el) => { el.classList.toggle('is-open', s.open); el.classList.toggle('is-closed', !s.open); $('span', el).textContent = s.short; el.title = s.long; });
    $$('[data-status-big]').forEach((el) => { el.classList.toggle('is-open', s.open); el.classList.toggle('is-closed', !s.open); $('span', el).textContent = s.long; });
    const today = madridNow().day;
    $$('.hours__table tr').forEach((tr) => tr.classList.toggle('is-today', +tr.dataset.day === today));
  };
  paintStatus();
  setInterval(paintStatus, 60_000);

  /* ---------- Parte de daños interactivo ---------- */
  const TOOLS = {
    'arañazo': { label: 'Arañazo', color: 'var(--d-scratch)', weight: 1 },
    'bollo': { label: 'Bollo', color: 'var(--d-dent)', weight: 2 },
    'golpe': { label: 'Golpe', color: 'var(--d-crash)', weight: 4 },
    'pintar': { label: 'Pintar', color: 'var(--d-paint)', weight: 1 },
  };
  const form = $('.report');
  const car = $('.car');
  if (form && car) {
    let tool = 'arañazo';
    const marks = new Map(); // pieza -> tipo
    const list = $('[data-list]', form);
    const count = $('[data-count]', form);
    const wa = $('[data-wa]', form);
    const scope = $('[data-scope]', form);
    const scopeVal = $('[data-scope-value]', form);
    const tip = $('.blueprint__tip');
    const steps = $$('.desk__steps li');
    const emptyHTML = list.innerHTML;
    let tipTimer, touchedForm = false;

    // referencia única para que el taller identifique cada parte
    const d = new Date();
    const ref = `NA-${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    $('[data-ref]').textContent = `Ref. ${ref}`;

    const setStep = () => {
      const step = !marks.size ? (tool !== 'arañazo' ? 2 : 1) : (touchedForm ? 3 : 2);
      steps.forEach((li) => {
        const n = +li.dataset.step;
        li.classList.toggle('is-on', n === step);
        li.classList.toggle('is-done', n < step);
      });
    };

    $$('.tool').forEach((b) => b.addEventListener('click', () => {
      tool = b.dataset.tool;
      $$('.tool').forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-checked', x === b); });
      setStep();
    }));

    const parts = $$('.part', car);
    parts.forEach((p) => {
      p.setAttribute('tabindex', '0');
      p.setAttribute('role', 'button');
      p.setAttribute('aria-label', p.dataset.part);
      p.setAttribute('aria-pressed', 'false');
      const toggle = () => {
        const name = p.dataset.part;
        if (marks.get(name) === tool) marks.delete(name);
        else marks.set(name, tool);
        try { if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(12); } catch (_) { /* sin vibración */ }
        showTip(name);
        render();
      };
      p.addEventListener('click', toggle);
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      if (finePointer) {
        p.addEventListener('pointerenter', () => showTip(p.dataset.part, true));
        p.addEventListener('pointerleave', () => tip.classList.remove('is-on'));
      }
    });

    const showTip = (name, hover = false) => {
      const t = marks.get(name);
      tip.innerHTML = t ? `<i style="background:${TOOLS[t].color}"></i>${name} · ${TOOLS[t].label.toLowerCase()}` : (hover ? name : `${name} · sin marcar`);
      const el = parts.find((x) => x.dataset.part === name);
      const box = el.getBBox();
      const vb = car.viewBox.baseVal;
      const cr = car.getBoundingClientRect();
      const sr = tip.parentElement.getBoundingClientRect();
      const k = cr.width / vb.width;
      tip.style.left = `${cr.left - sr.left + (box.x - vb.x + box.width / 2) * k}px`;
      tip.style.top = `${cr.top - sr.top + (box.y - vb.y) * k - 12}px`;
      tip.classList.add('is-on');
      clearTimeout(tipTimer);
      if (!hover) tipTimer = setTimeout(() => tip.classList.remove('is-on'), 1600);
    };

    const render = () => {
      parts.forEach((p) => {
        const t = marks.get(p.dataset.part);
        p.classList.toggle('is-marked', !!t);
        p.setAttribute('aria-pressed', !!t);
        p.style.setProperty('--c', t ? TOOLS[t].color : '');
        p.setAttribute('aria-label', t ? `${p.dataset.part}: ${TOOLS[t].label}` : p.dataset.part);
      });
      count.textContent = `${marks.size} ${marks.size === 1 ? 'pieza' : 'piezas'}`;

      if (!marks.size) {
        list.innerHTML = emptyHTML;
      } else {
        list.innerHTML = '';
        marks.forEach((t, name) => {
          const li = document.createElement('li');
          li.className = 'report__item';
          li.style.setProperty('--c', TOOLS[t].color);
          const b = document.createElement('b'); b.textContent = name;
          const em = document.createElement('em'); em.textContent = TOOLS[t].label;
          const x = document.createElement('button');
          x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', `Quitar ${name}`);
          x.addEventListener('click', () => { marks.delete(name); render(); });
          li.append(b, em, x);
          list.append(li);
        });
        list.scrollTop = list.scrollHeight;
      }

      // alcance orientativo (no es un precio: solo ayuda a hacerse una idea)
      const score = [...marks.values()].reduce((a, t) => a + TOOLS[t].weight, 0);
      const level = score === 0 ? 0 : score <= 3 ? 1 : score <= 8 ? 2 : 3;
      scope.dataset.level = level;
      scopeVal.textContent = ['—', 'Leve', 'Medio', 'Importante'][level];

      setStep();
      updateLink();
    };

    $('[data-reset]').addEventListener('click', () => { marks.clear(); render(); });

    const message = () => {
      const f = new FormData(form);
      const lines = [`Hola Nord-Auto, quiero pedir presupuesto (ref. ${ref}).`, ''];
      const coche = (f.get('coche') || '').trim();
      if (coche) lines.push(`🚗 Coche: ${coche}`);
      if (marks.size) {
        lines.push('🛠️ Daños:');
        marks.forEach((t, name) => lines.push(`• ${name}: ${TOOLS[t].label.toLowerCase()}`));
      } else {
        lines.push('🛠️ Daños: os los explico con fotos.');
      }
      lines.push(`📄 Seguro: ${f.get('seguro')}`);
      if (f.get('sustitucion')) lines.push('🔑 Necesitaría vehículo de sustitución.');
      const nota = (f.get('nota') || '').trim();
      if (nota) lines.push(`💬 ${nota}`);
      const nombre = (f.get('nombre') || '').trim();
      lines.push('', 'Ahora os mando las fotos.' + (nombre ? ` ${nombre}.` : ''));
      return lines.join('\n');
    };
    const updateLink = () => { wa.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(message())}`; };
    form.addEventListener('input', () => { touchedForm = true; setStep(); updateLink(); });
    form.addEventListener('submit', (e) => e.preventDefault());
    render();
  }

  /* ---------- Antes / después ---------- */
  $$('[data-compare]').forEach((box) => {
    const range = $('.compare__range', box);
    const set = (v) => { box.style.setProperty('--pos', `${v}%`); range.value = v; };
    range.addEventListener('input', () => set(range.value));
    range.addEventListener('pointerdown', () => box.classList.add('is-dragging'));
    addEventListener('pointerup', () => box.classList.remove('is-dragging'));
    // al verlo por primera vez, el tirador hace un barrido para enseñar que se puede mover
    const hint = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      hint.disconnect();
      const keys = [[0, 50], [700, 82], [1500, 18], [2300, 50]];
      const t0 = performance.now();
      let touched = false;
      range.addEventListener('pointerdown', () => { touched = true; }, { once: true });
      const tick = (t) => {
        if (touched) return;
        const el = t - t0 - 500;
        if (el < 0) return requestAnimationFrame(tick);
        let i = keys.findIndex((k) => k[0] > el);
        if (i === -1) { set(50); return; }
        const [ta, va] = keys[i - 1], [tb, vb] = keys[i];
        const k = (el - ta) / (tb - ta);
        const e2 = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        set((va + (vb - va) * e2).toFixed(1));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    hint.observe(box);
  });

  /* ---------- Galería: filtros, inclinación y visor ---------- */
  const gallery = $('[data-gallery]');
  if (gallery) {
    const shots = $$('.shot', gallery);
    $$('.filters button').forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      $$('.filters button').forEach((x) => x.setAttribute('aria-selected', x === b));
      let k = 0;
      shots.forEach((s) => {
        const show = f === 'all' || s.dataset.cat.split(' ').includes(f);
        s.classList.toggle('is-hidden', !show);
        s.classList.remove('is-entering');
        if (show) { void s.offsetWidth; s.style.setProperty('--d', `${k++ * 50}ms`); s.classList.add('is-entering'); }
      });
    }));

    if (finePointer) {
      shots.forEach((s) => {
        s.addEventListener('pointermove', (e) => {
          const r = s.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          s.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
        });
        s.addEventListener('pointerleave', () => { s.style.transform = ''; });
      });
    }

    const lb = $('.lightbox');
    const lbImg = $('img', lb), lbCap = $('figcaption', lb);
    let idx = 0;
    const visible = () => shots.filter((s) => !s.classList.contains('is-hidden'));
    const show = (i) => {
      const v = visible();
      idx = (i + v.length) % v.length;
      const s = v[idx], im = $('img', s);
      lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt;
      lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
      lbCap.textContent = $('figcaption', s).textContent;
    };
    shots.forEach((s) => $('button', s).addEventListener('click', () => { show(visible().indexOf(s)); lb.showModal(); }));
    $('.lightbox__close', lb).addEventListener('click', () => lb.close());
    $('.lightbox__nav--prev', lb).addEventListener('click', () => show(idx - 1));
    $('.lightbox__nav--next', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
    let sx = 0;
    lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); });
  }

  /* ---------- Opiniones de Google (copiadas de la ficha pública, 15/10/2026) ---------- */
  // Pon MOSTRAR_NEGATIVAS en false si el taller prefiere enseñar solo las de 4-5 estrellas.
  // La nota media y el total de la franja siguen siendo los reales de Google.
  const MOSTRAR_NEGATIVAS = true;
  const REVIEWS = [
    { n: 'Andrés E.', r: 5, d: 'nov. 2025', t: 'De categoría.\n\nEstuve valorando precios y a nivel País Vasco era de lo más barato. Chapa y pintura en todo el coche. Tenía una abolladura en el capó, el faro delantero y trasero roto y muchas ralladuras laterales. No me cobraron la mano de obra del cambio de faros y las imágenes hablan por sí solas.\n\nMuy cercanos y flexibles a la hora de dejar y recoger el coche. También en el pago.\n\nDe maravilla' },
    { n: 'Nekane A.', r: 1, d: 'may. 2026', t: 'Compra de un vehículo. Se nos dijo que el toldo interior que tapa el maletero, se nos iba a dar a la semana siguiente ya que en ese momento no lo tenía. Y mal por nuestra parte por fiarnos. Muchos meses después y de estar llamando, se desentiende. No os vayáis con el vehículo ni dando pago alguno, hasta que lo que se ofrece está correcto. Muy mala experiencia.' },
    { n: 'Jorge P.', r: 5, d: 'nov. 2025', t: 'Muy buen trabajo en Nord Auto (Markina). Me pintaron y sanearon todo el coche con muy buena calidad. Muy profesionales y atentos. ¡Totalmente recomendable!' },
    { n: 'Mila C.', r: 5, d: 'jun. 2026', t: 'Acabamos de comprar un coche. Todo perfecto. Gente atenta, trabajadora y de palabra. El coche perfecto. Gracias Zouhair!!' },
    { n: 'Silverio L.', r: 5, d: 'nov. 2025', t: 'Excelente trato y super serio, le he comprado una grúa y viajé de Barcelona a Markina a buscarla y ¡valió la pena el viaje!' },
    { n: 'Erlak K.', r: 5, d: 'nov. 2025', t: 'Buena atención y mejor servicio tanto en la venta como en la posventa.\nDe 10' },
    { n: 'Maitane D.', r: 5, d: 'nov. 2025', t: 'Todo fantástico y rápido, el chico muy atento, volveré sin duda.' },
    { n: 'Iciar G.', r: 5, d: 'nov. 2025', t: 'Les compré un coche y todo fue tal y como acordamos, muy atentos.' },
    { n: 'Mikel Z.', r: 5, d: 'nov. 2025', t: 'Zuhar y su equipo son gente muy profesional, trato cercano y transparente.\nRecomendado 💯' },
    { n: 'Iker E.', r: 5, d: 'nov. 2025', t: 'Llevé a pintar el coche y me quedé contento por cómo quedó y el trato recibido.' },
    { n: 'Jon M.', r: 5, d: 'nov. 2025', t: 'Compré una furgoneta de segunda mano y tanto el trato, el precio como la atención posventa, impecables.' },
    { n: 'Susana F.', r: 5, d: 'nov. 2025', t: 'Muy profesionales arreglando la chapa del coche y muy atentos cuando me vendieron el coche.' },
    { n: 'Usuario de Google', r: 1, d: 'oct. 2025', t: 'Estuve hace 1 año, a pintar mi coche y me estafó, se levantó la pintura por algunas partes, y pintó gomas y algún paso de rueda.' },
    { n: 'Jamal A.', r: 5, d: '2024', t: 'Muy buenos profesionales, de los pocos que quedan, ¡la verdad!…', cut: true },
    { n: 'Hugo Á.', r: 1, d: 'oct. 2025', t: 'Nada recomendable' },
    { n: 'Rubén C.', r: 1, d: 'oct. 2026', t: 'Edito por la respuesta de escaqueo, el anuncio del vehículo es vuestro, me cité con vosotros, con Moussin para ser exacto, con vuestras condiciones y en vuestro…', cut: true },
    { n: 'Garita', r: 5, d: 'nov. 2025', lang: 'Euskera', t: 'Langile profesionalak eta serioak. Lan bikaina egiten dute eta gardenak dira proposatzen dituzten arazo eta irtenbideei buruz, bezeroari erabakitzeko zer egin…', tr: 'Trabajadores profesionales y serios. Hacen un trabajo excelente y son transparentes con los problemas y las soluciones que proponen, para que el cliente decida qué hacer…', cut: true },
    { n: 'Mascha', r: 5, d: '2024', lang: 'Alemán', t: 'Vielen Dank für die super schnelle Reperatur des Autos unseres Freundes. Jungs, ihr habt super Arbeit geleistet und das noch schnell. Danke, danke, danke…', tr: 'Muchas gracias por la reparación superrápida del coche de nuestro amigo. Chicos, habéis hecho un trabajo genial y encima rápido. Gracias, gracias, gracias…', cut: true },
    { n: 'K. F.', r: 5, d: 'nov. 2025', lang: 'Euskera', t: 'Zouahir ta bere langileak demasako lana egiten ari dira. ZORIONAK!!! ta jarraitu horrela, prezio-kalitatea eusten!!!!', tr: 'Zouahir y sus trabajadores están haciendo un trabajazo. ¡¡¡ENHORABUENA!!! Y seguid así, manteniendo la relación calidad-precio.' },
    { n: 'Iñigo U.', r: 5, d: 'nov. 2025', lang: 'Euskera', t: 'Tratu oso ona, oso profesionalak, prezio ekonomiko batean.', tr: 'Muy buen trato, muy profesionales, a un precio económico.' },
    { n: 'Mari Paz Z.', r: 5, d: 'nov. 2025', lang: 'Euskera', t: 'Oso profesionalak, gertukoak eta fidagarriak.', tr: 'Muy profesionales, cercanos y de confianza.' },
    { n: 'A. L.', r: 5, d: 'nov. 2025', lang: 'Euskera', t: 'Dena ongi.', tr: 'Todo bien.' },
    { n: 'Rocío G.', r: 5, d: 'nov. 2025', t: '' },
    { n: 'Jon Kepa Z.', r: 5, d: 'oct. 2025', t: '' },
  ];

  const rvToggle = $('[data-reviews-toggle]');
  const rvPanel = $('[data-reviews-panel]');
  if (rvToggle && rvPanel) {
    const list = $('[data-rv-list]', rvPanel);
    const moreBtn = $('[data-rv-more]', rvPanel);
    const filtersBox = $('[data-rv-filters]', rvPanel);
    const label = $('[data-toggle-label]', rvToggle);
    const PAGE = 8;
    const pool = REVIEWS.filter((r) => MOSTRAR_NEGATIVAS || r.r >= 4);
    const AV = ['#2340b5', '#e3262e', '#0f766e', '#7c3aed', '#c2410c', '#0369a1', '#be185d', '#4d7c0f'];
    const avColor = (s) => AV[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-8 6.2C6.6 42.6 14.6 48 24 48z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l8-6.2z"/><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z"/></svg>';
    let filter = 'all', shown = PAGE;

    // barras de reparto (siempre con los datos completos de Google)
    $('[data-bars]', rvPanel).innerHTML = [5, 4, 3, 2, 1].map((k) => {
      const c = REVIEWS.filter((r) => r.r === k).length;
      return `<div class="rv-bar"><b>${k}★</b><span class="rv-bar__track"><i style="--w:${(c / REVIEWS.length) * 100}%"></i></span><span>${c}</span></div>`;
    }).join('');

    const FILTERS = [
      ['all', 'Todas', () => true],
      ['5', '5★', (r) => r.r === 5],
      ['text', 'Con comentario', (r) => !!r.t],
      ['eu', 'En euskera', (r) => r.lang === 'Euskera'],
    ];
    if (MOSTRAR_NEGATIVAS) FILTERS.splice(2, 0, ['1', '1★', (r) => r.r === 1]);
    filtersBox.innerHTML = FILTERS.map(([k, l, fn]) => `<button type="button" role="tab" aria-selected="${k === 'all'}" data-f="${k}">${l}<small>${pool.filter(fn).length}</small></button>`).join('');
    $$('button', filtersBox).forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.f; shown = PAGE;
      $$('button', filtersBox).forEach((x) => x.setAttribute('aria-selected', x === b));
      render();
    }));

    const card = (r, i) => `
      <article class="rv-card" style="--d:${(i % PAGE) * 45}ms">
        <div class="rv-card__head">
          <span class="rv-avatar" style="--av:${avColor(r.n)}" aria-hidden="true">${esc(r.n.replace(/^Usuario de /, '')[0])}</span>
          <span class="rv-card__who"><b>${esc(r.n)}</b><small>${r.d}${r.lang ? ' · ' + r.lang : ''}</small></span>
          <span class="rv-stars" style="--v:${r.r / 5}" aria-label="${r.r} de 5 estrellas"></span>
        </div>
        ${r.t ? `<p>${esc(r.t)}</p>` : '<p class="rv-empty">Valoración sin comentario.</p>'}
        ${r.tr ? `<div class="rv-trans"><span>Traducción</span>${esc(r.tr)}</div>` : ''}
        <div class="rv-card__src">${G}Reseña de Google${r.cut ? ' · extracto' : ''}</div>
      </article>`;

    const render = (append = false) => {
      const fn = FILTERS.find((f) => f[0] === filter)[2];
      const items = pool.filter(fn);
      const from = append ? shown - PAGE : 0;
      const html = items.slice(from, shown).map((r, i) => card(r, i)).join('');
      if (append) list.insertAdjacentHTML('beforeend', html); else list.innerHTML = html;
      moreBtn.hidden = shown >= items.length;
      moreBtn.textContent = `Mostrar más opiniones (${items.length - Math.min(shown, items.length)})`;
    };
    moreBtn.addEventListener('click', () => { shown += PAGE; render(true); });

    let closeTimer;
    const setOpen = (open) => {
      clearTimeout(closeTimer);
      rvToggle.setAttribute('aria-expanded', open);
      label.textContent = open ? 'Ocultar opiniones' : 'Ver opiniones';
      if (open) {
        if (!list.children.length) render();
        rvPanel.hidden = false;
        void rvPanel.offsetHeight; // fuerza el estado inicial para que la transición se vea
        rvPanel.classList.add('is-open');
      } else {
        rvPanel.classList.remove('is-open');
        closeTimer = setTimeout(() => { rvPanel.hidden = true; }, 700);
      }
    };
    rvToggle.addEventListener('click', () => setOpen(rvToggle.getAttribute('aria-expanded') !== 'true'));
    const jump = $('[data-reviews-jump]');
    if (jump) jump.addEventListener('click', () => {
      setOpen(true);
      $('.rv-band').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- Mapa bajo demanda (sin cookies de Google hasta que se pide) ---------- */
  const mapBtn = $('[data-map]');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      const box = mapBtn.closest('.map');
      const f = document.createElement('iframe');
      f.title = 'Mapa de Nord-Auto Markina';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.src = 'https://maps.google.com/maps?q=Nord-Auto%20Markina%2C%20Erdotza%20Hiribidea%2040%2C%2048270%20Markina-Xemein&z=16&output=embed';
      box.innerHTML = '';
      box.append(f);
    });
  }

  const yr = $('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
