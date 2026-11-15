/* Nord-Auto · capa nueva (va después de main.js) */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lim = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const suave = t => { t = lim(t); return t * t * (3 - 2 * t); };
  const tramo = (t, a, b) => suave((t - a) / (b - a));

  /* =========== 1. Coche que se pinta al bajar =========== */
  const N = 120, cv = $('#coche'), ctx = cv.getContext('2d');
  const imgs = new Array(N); let cargadas = 0, actual = -1;
  const ruta = i => `coche/f${String(i + 1).padStart(3, '0')}.webp`;
  const carga = $('#carga');
  const orden = [0]; for (const p of [8, 4, 2, 1]) for (let i = 0; i < N; i += p) if (!orden.includes(i)) orden.push(i);
  orden.forEach(i => { const im = new Image(); im.decoding = 'async'; im.src = ruta(i);
    im.onload = () => { imgs[i] = im; cargadas++; carga.textContent = `PREPARANDO CABINA · ${Math.round(cargadas / N * 100)} %`;
      if (cargadas > 10) carga.style.opacity = 0; if (actual < 0 || i === 0) pintar(true); }; });
  const cerca = i => { for (let d = 0; d < N; d++) { if (imgs[i - d]) return imgs[i - d]; if (imgs[i + d]) return imgs[i + d]; } return null; };

  // colores de muestra (renders del mismo coche con cada pintura)
  const COLORES = [['rojo', 'Rojo', '#b3121c'], ['azul', 'Azul', '#1a3a9c'], ['blanco', 'Blanco', '#e8e8e4'], ['negro', 'Negro', '#121212'],
                   ['gris', 'Gris', '#6b6f75'], ['amarillo', 'Amarillo', '#e3a512'], ['verde', 'Verde', '#14502c']];
  const cImgs = {}; let color = 'rojo', mezclaT = 1, anterior = null;
  const caja = $('#colores');
  caja.innerHTML = COLORES.map(([k, n, c]) => `<button type="button" role="radio" aria-checked="${k === 'rojo'}" aria-label="${n}" data-c="${k}" style="--c:${c}"><span>${n}</span></button>`).join('');
  caja.insertAdjacentHTML('afterend', '');
  let pedidos = false;
  const pedirColores = () => { if (pedidos) return; pedidos = true;
    COLORES.forEach(([k]) => { const im = new Image(); im.src = `coche/color-${k}.webp`; im.onload = () => { cImgs[k] = im; }; }); };
  $$('button', caja).forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.c; if (k === color) return;
    anterior = cImgs[color] || cerca(N - 1); color = k; mezclaT = 0;
    $$('button', caja).forEach(x => x.setAttribute('aria-checked', x === b));
    document.documentElement.style.setProperty('--tinte', COLORES.find(c => c[0] === k)[2]);
    if (navigator.vibrate) navigator.vibrate(12);
  }));

  const escena = $('#escena'), eBarra = $('#eBarra'), niebla = $('#niebla');
  const fases = $$('[data-fase]').map(el => { const [a, b] = el.dataset.fase.split(',').map(Number); return { el, a, b }; });
  let objetivo = 0, mostrado = 0;
  const progreso = () => { const r = escena.getBoundingClientRect(); return lim(-r.top / (r.height - innerHeight)); };
  function pintar(forzar) {
    const f = Math.round(mostrado * (N - 1));
    const final = f >= N - 2 && cImgs[color];
    if (f === actual && !forzar && !(final && mezclaT < 1)) return;
    const im = final ? cImgs[color] : cerca(f); if (!im) return;
    actual = f; ctx.clearRect(0, 0, cv.width, cv.height);
    if (final && mezclaT < 1 && anterior) {
      mezclaT = Math.min(1, mezclaT + 0.07);
      ctx.globalAlpha = 1; ctx.drawImage(anterior, 0, 0, cv.width, cv.height);
      ctx.globalAlpha = mezclaT; ctx.drawImage(im, 0, 0, cv.width, cv.height); ctx.globalAlpha = 1;
    } else ctx.drawImage(im, 0, 0, cv.width, cv.height);
  }

  // etiquetas de cinta que señalan cada zona (posiciones sacadas de Blender, una por fotograma)
  const ETIQ = [['Parabrisas', 'Cristales con papel', 24, 46], ['Faro', 'Faros tapados', 27, 46],
                ['Capó', 'Primera mano', 52, 68], ['Puerta', 'Color igualado', 62, 84], ['Aleta trasera', 'Barniz', 90, 112]];
  const capaL = $('#lineas'), capaE = $('#etiquetas'); let puntos = null, piezas = [];
  fetch('coche/puntos.json').then(r => r.json()).then(j => {
    puntos = j; const ns = 'http://www.w3.org/2000/svg';
    piezas = ETIQ.map(([p, txt, a, b]) => {
      const e = document.createElement('div'); e.className = 'etiqueta'; e.textContent = txt; e.style.opacity = 0; capaE.appendChild(e);
      const l = document.createElementNS(ns, 'line'), c = document.createElementNS(ns, 'circle'), h = document.createElementNS(ns, 'circle');
      c.setAttribute('r', 3); h.setAttribute('r', 8); h.setAttribute('class', 'halo');
      [l, c, h].forEach(n => { n.style.opacity = 0; capaL.appendChild(n); });
      return { p, e, l, c, h, a, b };
    });
  }).catch(() => {});
  function etiquetas(fr) {
    if (!puntos) return;
    const r = cv.getBoundingClientRect(), W = innerWidth, M = 14;
    for (const q of piezas) {
      const o = fr < q.a || fr > q.b ? 0 : Math.min(1, (fr - q.a) / 4, (q.b - fr) / 4);
      const [x, y] = puntos[q.p][lim(fr, 0, N - 1)];
      const px = r.left + x * r.width, py = r.top + y * r.height, w = q.e.offsetWidth;
      const izq = px < W / 2, ey = py - (izq ? 64 : 76);
      const ex = izq ? Math.max(M, px - w - 10) : Math.min(W - M - w, px + 10);
      const ax = izq ? ex + w : ex;
      q.e.style.left = ex + 'px'; q.e.style.top = ey + 'px'; q.e.style.opacity = o;
      q.l.setAttribute('x1', ax); q.l.setAttribute('y1', ey + 8); q.l.setAttribute('x2', px); q.l.setAttribute('y2', py);
      q.c.setAttribute('cx', px); q.c.setAttribute('cy', py); q.h.setAttribute('cx', px); q.h.setAttribute('cy', py);
      q.l.style.opacity = o; q.c.style.opacity = o; q.h.style.opacity = o * (0.35 + 0.35 * Math.sin(performance.now() / 280));
    }
  }
  function nieblaPintura(t, fr) {
    const k = tramo(t, 0.40, 0.70), o = k > 0 && k < 1 ? Math.sin(Math.PI * k) : 0;
    niebla.style.opacity = (o * 0.85).toFixed(2);
    if (!puntos || !o) return;
    const r = cv.getBoundingClientRect(), a = puntos['Faro'][fr], b = puntos['Aleta trasera'][fr];
    const x = r.left + (a[0] + (b[0] - a[0]) * k) * r.width;
    niebla.style.setProperty('--nx', (x - innerWidth / 2) + 'px');
  }
  function bucle() {
    objetivo = progreso();
    mostrado += (objetivo - mostrado) * 0.16;
    if (Math.abs(objetivo - mostrado) < 0.0005) mostrado = objetivo;
    const fr = Math.round(mostrado * (N - 1));
    if (mostrado > 0.8) pedirColores();
    pintar(false); etiquetas(fr); nieblaPintura(mostrado, fr);
    eBarra.style.height = (objetivo * 100) + '%';
    document.documentElement.style.setProperty('--brillo', (0.25 + 0.55 * tramo(mostrado, 0.4, 0.9)).toFixed(2));
    for (const { el, a, b } of fases) el.classList.toggle('oculto', !(objetivo >= a && objetivo < b));
    requestAnimationFrame(bucle);
  }
  requestAnimationFrame(bucle);

  /* =========== 2. Cartas de servicios =========== */
  const cartas = $$('.carta');
  const ioC = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('ok');
    e.target.classList.remove('brilla'); void e.target.offsetWidth; e.target.classList.add('brilla'); } }), { threshold: .5 });
  cartas.forEach(c => ioC.observe(c));
  $$('.carta__btn').forEach(b => b.addEventListener('click', () => {
    const nota = $('textarea[name="nota"]');
    if (nota) { nota.value = `Servicio: ${b.dataset.serv}. ` + nota.value.replace(/^Servicio: [^.]*\. /, ''); nota.dispatchEvent(new Event('input', { bubbles: true })); }
    $('#presupuesto').scrollIntoView({ behavior: 'smooth' });
  }));

  /* =========== 3. Cifras que suben =========== */
  $$('[data-cuenta]').forEach(el => {
    const fin = +el.dataset.cuenta, dec = +(el.dataset.dec || 0);
    el.textContent = dec ? (0).toFixed(dec).replace('.', ',') : 0;
    new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect(); const t0 = performance.now();
      (function p(t) { const k = Math.min(1, (t - t0) / 1800), v = fin * (1 - Math.pow(1 - k, 4));
        el.textContent = dec ? v.toFixed(dec).replace('.', ',') : Math.round(v); if (k < 1) requestAnimationFrame(p); })(t0);
    }, { threshold: .6 }).observe(el);
  });

  /* =========== 4. Galería fijada + visor =========== */
  const FOTOS = [['Renault 8 recién salido de cabina', 'renault8-cabina'], ['Enmascarado antes de pintar', 'pintura-rojo-enmascarado'],
    ['Mercedes GLC · frontal en reparación', 'mercedes-glc-chapa'], ['Clásico en plena restauración', 'clasico-restauracion'],
    ['Mercedes 190', 'mercedes-190'], ['Golpe trasero · al llegar al taller', 'dacia-golpe-trasero'], ['Cabina de camión', 'camion-cabina'],
    ['Llantas recién pintadas', 'llantas-pintura'], ['Furgoneta lista para pintar', 'furgoneta-enmascarada'], ['Nord Auto · Erdotza 40', 'fachada-nord-auto']];
  const sec = $('#trabajos'), pista = $('#gPista'), barraG = $('#gBarra'), num = $('#gNum');
  pista.innerHTML = FOTOS.map(([t, c], i) => `<figure class="g-foto" data-i="${i}"><div class="g-marco"><img src="img/${c}.jpg" alt="${t} · Nord-Auto Markina" loading="lazy" decoding="async"></div><figcaption><small>${String(i + 1).padStart(2, '0')}</small>${t}</figcaption></figure>`).join('');
  $('#gTot').textContent = String(FOTOS.length).padStart(2, '0');
  const gfotos = $$('.g-foto');
  const altoGaleria = () => { sec.style.height = (innerHeight + Math.max(0, pista.scrollWidth - innerWidth) * 1.1) + 'px'; };
  altoGaleria(); addEventListener('resize', altoGaleria); addEventListener('load', altoGaleria);

  document.body.insertAdjacentHTML('beforeend', '<div class="visor" id="visor" aria-hidden="true"><button class="v-cerrar" id="vCerrar" aria-label="Cerrar">✕</button><button class="v-ant" id="vAnt" aria-label="Anterior">‹</button><figure><img id="vImg" alt=""><figcaption id="vTxt"></figcaption></figure><button class="v-sig" id="vSig" aria-label="Siguiente">›</button></div>');
  const visor = $('#visor'), vImg = $('#vImg'), vTxt = $('#vTxt'); let act = 0;
  const mostrar = i => { act = (i + FOTOS.length) % FOTOS.length; vImg.src = `img/${FOTOS[act][1]}.jpg`; vImg.alt = FOTOS[act][0]; vTxt.textContent = `${FOTOS[act][0]} · ${act + 1} / ${FOTOS.length}`; };
  const abrirV = i => { mostrar(i); visor.classList.add('on'); visor.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
  const cerrarV = () => { visor.classList.remove('on'); visor.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
  gfotos.forEach(f => f.addEventListener('click', () => abrirV(+f.dataset.i)));
  $('#vCerrar').addEventListener('click', cerrarV); $('#vAnt').addEventListener('click', () => mostrar(act - 1)); $('#vSig').addEventListener('click', () => mostrar(act + 1));
  visor.addEventListener('click', e => { if (e.target === visor) cerrarV(); });
  addEventListener('keydown', e => { if (!visor.classList.contains('on')) return; if (e.key === 'Escape') cerrarV(); if (e.key === 'ArrowRight') mostrar(act + 1); if (e.key === 'ArrowLeft') mostrar(act - 1); });
  let x0 = null;
  visor.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) mostrar(act + (dx < 0 ? 1 : -1)); x0 = null; });

  /* =========== 5. Antes/después: pasada de pistola =========== */
  $$('[data-compare]').forEach(box => {
    const range = $('.compare__range', box);
    const set = v => { box.style.setProperty('--pos', `${v}%`); range.value = v; };
    let tocado = false; range.addEventListener('pointerdown', () => { tocado = true; box.classList.remove('pintando'); });
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      const t0 = performance.now() + 400; set(100);
      (function paso(t) {
        if (tocado) return;
        const k = (t - t0) / 1900;
        if (k < 0) return requestAnimationFrame(paso);
        if (k <= 1) { box.classList.add('pintando'); set((100 - 100 * suave(k)).toFixed(1)); return requestAnimationFrame(paso); }
        box.classList.remove('pintando');
        const k2 = lim((k - 1.25) / 0.5); set((50 * suave(k2)).toFixed(1));
        if (k2 < 1) requestAnimationFrame(paso);
      })(performance.now());
    }, { threshold: .55 }).observe(box);
  });

  /* =========== 6. Todo lo que va con el scroll =========== */
  const cFondo = $('#cFondo'), cif = $('#cifras'), rot1 = $('#rot1'), rot2 = $('#rot2');
  [rot1, rot2].forEach(r => { r.textContent = r.textContent.repeat(4); });
  let pend = false;
  function cuadro() {
    pend = false;
    const y = scrollY, H = innerHeight;
    const rc = cif.getBoundingClientRect();
    if (rc.bottom > 0 && rc.top < H) cFondo.style.transform = `translateY(${(rc.top + rc.height / 2 - H / 2) * -0.25}px)`;
    const w1 = rot1.scrollWidth / 4, w2 = rot2.scrollWidth / 4;
    rot1.style.transform = `translateX(${-((y * 0.5) % w1)}px)`;
    rot2.style.transform = `translateX(${-w2 + ((y * 0.35) % w2)}px)`;
    // cartas: la de debajo se hunde cuando llega la siguiente
    for (let i = 0; i < cartas.length - 1; i++) {
      const a = cartas[i].getBoundingClientRect(), b = cartas[i + 1].getBoundingClientRect();
      const k = lim(1 - (b.top - a.top) / a.height);
      cartas[i].style.transform = k > 0 ? `scale(${(1 - k * 0.07).toFixed(4)})` : '';
      cartas[i].style.filter = k > 0 ? `brightness(${(1 - k * 0.45).toFixed(3)})` : '';
    }
    // galería
    const rs = sec.getBoundingClientRect(), recorrido = sec.offsetHeight - H;
    if (rs.bottom > 0 && rs.top < H) {
      const p = lim(-rs.top / Math.max(1, recorrido));
      const mover = Math.max(0, pista.scrollWidth - innerWidth);
      pista.style.transform = `translateX(${-p * mover}px)`;
      barraG.style.transform = `scaleX(${p})`;
      let c = 0, dmin = 1e9;
      gfotos.forEach((f, i) => {
        const r = f.getBoundingClientRect(), d = (r.left + r.width / 2 - innerWidth / 2) / innerWidth;
        if (Math.abs(d) < dmin) { dmin = Math.abs(d); c = i; }
        f.firstElementChild.firstElementChild.style.transform = `scale(${1.2 - Math.min(.15, Math.abs(d) * .2)}) translateX(${d * -40}px)`;
        f.firstElementChild.style.transform = `rotateY(${lim(d * -22, -18, 18)}deg)`;
      });
      num.textContent = String(c + 1).padStart(2, '0');
    }
  }
  const pedir = () => { if (!pend) { pend = true; requestAnimationFrame(cuadro); } };
  addEventListener('scroll', pedir, { passive: true }); addEventListener('resize', pedir); cuadro();
})();
