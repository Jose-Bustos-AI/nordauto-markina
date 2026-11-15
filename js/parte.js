/* Nord-Auto · parte de daños: tocas el punto exacto en cualquiera de las cinco vistas del coche */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const form = $('.report'), lienzo = $('#lienzo');
  if (!form || !lienzo) return;
  const PHONE = '34631794157';

  const TIPOS = {
    'arañazo': { txt: 'Arañazo', c: '#f2b316', p: 1 },
    'bollo':   { txt: 'Bollo', c: '#2f6bff', p: 2 },
    'golpe':   { txt: 'Golpe o rotura', c: '#e3262e', p: 4 },
    'pintar':  { txt: 'Pintura', c: '#11a88a', p: 1 },
  };
  const GRAV = { leve: 1, media: 1.6, grave: 2.6 };
  const NOMBRE_VISTA = { izquierda: 'lateral izquierdo', arriba: 'vista superior', derecha: 'lateral derecho', delante: 'frontal', detras: 'trasera' };
  const EJE = { izquierda: '← Delante · lado izquierdo · Detrás →', derecha: '← Detrás · lado derecho · Delante →', arriba: '← Delante · desde arriba · Detrás →', delante: 'Frontal', detras: 'Trasera' };

  // zonas en metros sobre el coche real (morro hacia -Y, lado izquierdo hacia +X); la primera que encaja da el nombre
  const lado = (izq) => [
    { n: 'Llanta delantera', c: [-1.15, 0.36], r: 0.37 }, { n: 'Llanta trasera', c: [1.5, 0.36], r: 0.37 },
    { n: 'Retrovisor', a: [-0.62, -0.28], b: [0.8, 1.06] },
    { n: 'Paragolpes delantero', a: [-9, -1.9], b: [-9, 9] }, { n: 'Paragolpes trasero', a: [1.97, 9], b: [-9, 9] },
    { n: 'Estribo', a: [-0.72, 1.0], b: [-9, 0.3] },
    { n: 'Aleta delantera', a: [-1.9, -0.72], b: [-9, 9] }, { n: 'Puerta', a: [-0.72, 0.55], b: [-9, 9] },
    { n: 'Aleta trasera', a: [0.55, 1.97], b: [-9, 9] },
  ].map(z => ({ ...z, n: z.n.startsWith('Paragolpes') ? z.n : `${z.n} ${izq ? 'izquierd' : 'derech'}${/Llanta|Puerta|Aleta/.test(z.n) ? 'a' : 'o'}` }));
  const ZONAS = {
    izquierda: lado(true), derecha: lado(false),
    arriba: [
      { n: 'Retrovisor izquierdo', a: [-0.65, -0.25], b: [0.98, 9] }, { n: 'Retrovisor derecho', a: [-0.65, -0.25], b: [-9, -0.98] },
      { n: 'Paragolpes delantero', a: [-9, -1.95], b: [-9, 9] }, { n: 'Paragolpes trasero', a: [1.97, 9], b: [-9, 9] },
      { n: 'Capó', a: [-1.95, -0.95], b: [-0.72, 0.72] }, { n: 'Parabrisas', a: [-0.95, -0.25], b: [-0.75, 0.75] },
      { n: 'Habitáculo / capota', a: [-0.25, 0.5], b: [-0.8, 0.8] }, { n: 'Tapa del motor', a: [0.5, 1.97], b: [-0.7, 0.7] },
      { n: 'Aleta delantera izquierda', a: [-1.95, -0.72], b: [0, 9] }, { n: 'Aleta delantera derecha', a: [-1.95, -0.72], b: [-9, 0] },
      { n: 'Puerta izquierda', a: [-0.72, 0.55], b: [0, 9] }, { n: 'Puerta derecha', a: [-0.72, 0.55], b: [-9, 0] },
      { n: 'Aleta trasera izquierda', a: [0.55, 1.97], b: [0, 9] }, { n: 'Aleta trasera derecha', a: [0.55, 1.97], b: [-9, 0] },
    ],
    delante: [
      { n: 'Retrovisor izquierdo', a: [0.95, 9], b: [0.8, 9] }, { n: 'Retrovisor derecho', a: [-9, -0.95], b: [0.8, 9] },
      { n: 'Rueda delantera izquierda', a: [0.7, 9], b: [-9, 0.45] }, { n: 'Rueda delantera derecha', a: [-9, -0.7], b: [-9, 0.45] },
      { n: 'Paragolpes delantero', a: [-9, 9], b: [-9, 0.55] },
      { n: 'Faro izquierdo', a: [0.42, 9], b: [0.55, 0.8] }, { n: 'Faro derecho', a: [-9, -0.42], b: [0.55, 0.8] },
      { n: 'Parabrisas', a: [-0.8, 0.8], b: [0.93, 9] }, { n: 'Capó', a: [-9, 9], b: [-9, 9] },
    ],
    detras: [
      { n: 'Retrovisor izquierdo', a: [0.95, 9], b: [0.8, 9] }, { n: 'Retrovisor derecho', a: [-9, -0.95], b: [0.8, 9] },
      { n: 'Rueda trasera izquierda', a: [0.7, 9], b: [-9, 0.45] }, { n: 'Rueda trasera derecha', a: [-9, -0.7], b: [-9, 0.45] },
      { n: 'Paragolpes trasero', a: [-9, 9], b: [-9, 0.62] },
      { n: 'Piloto trasero izquierdo', a: [0.4, 9], b: [0.62, 1.0] }, { n: 'Piloto trasero derecho', a: [-9, -0.4], b: [0.62, 1.0] },
      { n: 'Tapa del motor', a: [-9, 9], b: [-9, 9] },
    ],
  };
  const EJES = { izquierda: ['y', 'z'], derecha: ['y', 'z'], arriba: ['y', 'x'], delante: ['x', 'z'], detras: ['x', 'z'] };

  let META = null, vista = 'izquierda', pendiente = null, editando = null, tipo = null, grav = 'media', tocado = false;
  const marcas = [];   // { id, vista, u, v, zona, tipo, grav }
  let sig = 1;
  const img = $('#lzImg'), coche = $('#lzCoche'), zonaSvg = $('#lzZona'), pines = $('#lzPines'), mira = $('#lzMira'), zTxt = $('#lzZonaTxt'), eje = $('#lzEje');
  const pop = $('#pop'), popZona = $('#popZona'), popOk = $('#popOk'), popBorrar = $('#popBorrar');
  const list = $('[data-list]', form), count = $('[data-count]', form), wa = $('[data-wa]', form);
  const scope = $('[data-scope]', form), scopeVal = $('[data-scope-value]', form);
  const emptyHTML = list.innerHTML.replace('Empieza tocando una pieza en el plano.', 'Toca en el coche el punto exacto del daño.');
  list.innerHTML = emptyHTML;
  const h3 = $('.report__title h3', form); if (h3) h3.textContent = 'Daños marcados';

  const d = new Date();
  const ref = `NA-${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
  $('[data-ref]').textContent = `Ref. ${ref}`;

  // máscaras de cada vista para saber si el dedo cae sobre el coche
  const alfa = {};
  const cargarAlfa = (k) => new Promise(res => {
    if (alfa[k]) return res();
    const im = new Image(); im.src = `parte/${k}.webp`;
    im.onload = () => { const w = 280, h = Math.round(w * im.height / im.width), c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, w, h); alfa[k] = { w, h, d: x.getImageData(0, 0, w, h).data }; res(); };
  });
  const sobreCoche = (k, u, v) => { const a = alfa[k]; if (!a) return true; const px = Math.min(a.w - 1, Math.round(u * a.w)), py = Math.min(a.h - 1, Math.round(v * a.h)); return a.d[(py * a.w + px) * 4 + 3] > 90; };

  // de fracción de imagen a metros y al revés
  const aMetros = (k, u, v) => { const m = META[k], [H, V] = EJES[k]; return [(u - m.o[0]) / (m[H][0] - m.o[0]), (v - m.o[1]) / (m[V][1] - m.o[1])]; };
  const aFrac = (k, a, b) => { const m = META[k], [H, V] = EJES[k]; return [m.o[0] + a * (m[H][0] - m.o[0]), m.o[1] + b * (m[V][1] - m.o[1])]; };
  const zonaDe = (k, u, v) => {
    const [a, b] = aMetros(k, u, v);
    return ZONAS[k].find(z => z.c ? Math.hypot(a - z.c[0], b - z.c[1]) < z.r : a >= z.a[0] && a < z.a[1] && b >= z.b[0] && b < z.b[1]) || { n: 'Carrocería' };
  };
  function dibujarZonas() {
    const m = META[vista]; zonaSvg.setAttribute('viewBox', `0 0 ${m.w} ${m.h}`);
    zonaSvg.style.webkitMaskImage = zonaSvg.style.maskImage = `url(parte/${vista}.webp)`;
    zonaSvg.innerHTML = ZONAS[vista].map((z, i) => {
      if (z.c) { const [cu, cv] = aFrac(vista, z.c[0], z.c[1]), [ru] = aFrac(vista, z.c[0] + z.r, z.c[1]), [, rv] = aFrac(vista, z.c[0], z.c[1] + z.r);
        return `<ellipse data-i="${i}" cx="${cu * m.w}" cy="${cv * m.h}" rx="${Math.abs(ru - cu) * m.w}" ry="${Math.abs(rv - cv) * m.h}"/>`; }
      const [u0, v0] = aFrac(vista, Math.max(-3, z.a[0]), Math.max(-3, z.b[0])), [u1, v1] = aFrac(vista, Math.min(3, z.a[1]), Math.min(3, z.b[1]));
      return `<rect data-i="${i}" x="${Math.min(u0, u1) * m.w}" y="${Math.min(v0, v1) * m.h}" width="${Math.abs(u1 - u0) * m.w}" height="${Math.abs(v1 - v0) * m.h}"/>`;
    }).join('');
  }
  const resaltar = (k, zona) => $$('[data-i]', zonaSvg).forEach(el => el.classList.toggle('ver', ZONAS[k][+el.dataset.i]?.n === zona));

  function ponerVista(k) {
    if (!META) return;
    vista = k; cerrarPop();
    $$('.vistas button').forEach(b => b.setAttribute('aria-selected', b.dataset.v === k));
    coche.classList.add('cambia');
    setTimeout(() => {
      img.src = `parte/${k}.webp`; img.alt = `Coche visto: ${NOMBRE_VISTA[k]}`;
      coche.classList.toggle('estrecho', k === 'delante' || k === 'detras');
      eje.textContent = EJE[k]; dibujarZonas(); pintarPines();
      img.onload = () => coche.classList.remove('cambia'); if (img.complete) coche.classList.remove('cambia');
    }, 180);
    cargarAlfa(k);
  }
  $$('.vistas button').forEach(b => b.addEventListener('click', () => ponerVista(b.dataset.v)));

  // tocar el coche
  const frac = (e) => { const r = coche.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  coche.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !META || !pop.hidden) return;
    const [u, v] = frac(e); const en = sobreCoche(vista, u, v);
    if (en) { const z = zonaDe(vista, u, v); resaltar(vista, z.n); zTxt.innerHTML = `<b>${z.n}</b> · toca para marcar`; }
    else { resaltar(vista, null); zTxt.textContent = 'Toca justo donde está el daño'; }
  });
  coche.addEventListener('pointerleave', () => { if (pop.hidden) { resaltar(vista, null); zTxt.textContent = 'Toca justo donde está el daño'; } });
  coche.addEventListener('click', (e) => {
    if (!META || e.target.classList.contains('pin')) return;
    const [u, v] = frac(e);
    if (!sobreCoche(vista, u, v)) { zTxt.innerHTML = '<b>Fuera del coche</b> · toca sobre la carrocería'; return; }
    const z = zonaDe(vista, u, v);
    pendiente = { vista, u, v, zona: z.n }; editando = null;
    mira.style.left = (u * 100) + '%'; mira.style.top = (v * 100) + '%'; mira.classList.add('on');
    abrirPop(z.n, null, 'media');
  });

  function abrirPop(zona, t, g) {
    popZona.textContent = zona; tipo = t; grav = g;
    $$('#popTipos button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    $$('#popGrav button').forEach(b => b.classList.toggle('on', b.dataset.g === g));
    popOk.disabled = !t; popOk.textContent = editando ? 'Guardar' : 'Marcar daño'; popBorrar.hidden = !editando;
    pop.hidden = false; resaltar(vista, zona); zTxt.innerHTML = `<b>${zona}</b>`;
  }
  function cerrarPop() { pop.hidden = true; mira.classList.remove('on'); resaltar(vista, null); pendiente = editando = null; zTxt.textContent = 'Toca justo donde está el daño'; }
  $$('#popTipos button').forEach(b => { b.style.setProperty('--c', TIPOS[b.dataset.t].c);
    b.addEventListener('click', () => { tipo = b.dataset.t; $$('#popTipos button').forEach(x => x.classList.toggle('on', x === b)); popOk.disabled = false; }); });
  $$('#popGrav button').forEach(b => b.addEventListener('click', () => { grav = b.dataset.g; $$('#popGrav button').forEach(x => x.classList.toggle('on', x === b)); }));
  $('#popX').addEventListener('click', cerrarPop);
  popOk.addEventListener('click', () => {
    if (!tipo) return;
    if (editando) { Object.assign(editando, { tipo, grav }); }
    else if (pendiente) { marcas.push({ id: sig++, ...pendiente, tipo, grav }); try { if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(15); } catch (_) {} }
    cerrarPop(); pintarPines(); render();
  });
  popBorrar.addEventListener('click', () => { if (editando) marcas.splice(marcas.indexOf(editando), 1); cerrarPop(); pintarPines(); render(); });

  function pintarPines() {
    pines.innerHTML = '';
    marcas.filter(m => m.vista === vista).forEach(m => {
      const p = document.createElement('button'); p.type = 'button'; p.className = 'pin'; p.textContent = String(m.id).padStart(2, '0');
      p.style.left = (m.u * 100) + '%'; p.style.top = (m.v * 100) + '%'; p.style.setProperty('--c', TIPOS[m.tipo].c);
      p.setAttribute('aria-label', `${m.zona}: ${TIPOS[m.tipo].txt.toLowerCase()} ${m.grav}. Toca para cambiarlo`);
      p.addEventListener('click', (e) => { e.stopPropagation(); editando = m; pendiente = null; mira.classList.remove('on'); abrirPop(m.zona, m.tipo, m.grav); });
      pines.appendChild(p);
    });
    $$('.vistas i').forEach(i => { const n = marcas.filter(m => m.vista === i.dataset.n).length; i.textContent = n; i.classList.toggle('on', n > 0); });
  }

  function setStep() {
    const step = !marcas.length ? 1 : (tocado ? 3 : 2);
    $$('.peri__pasos li').forEach(li => { const n = +li.dataset.step; li.classList.toggle('is-on', n === step); li.classList.toggle('is-done', n < step); });
  }
  function render() {
    count.textContent = `${marcas.length} ${marcas.length === 1 ? 'daño' : 'daños'}`;
    if (!marcas.length) list.innerHTML = emptyHTML;
    else {
      list.innerHTML = '';
      marcas.forEach(m => {
        const li = document.createElement('li'); li.className = 'report__item'; li.style.setProperty('--c', TIPOS[m.tipo].c);
        li.innerHTML = `<span class="n">${String(m.id).padStart(2, '0')}</span><div><b></b><small></small></div><em></em><button type="button" aria-label="Quitar">×</button>`;
        $('b', li).textContent = m.zona; $('small', li).textContent = NOMBRE_VISTA[m.vista];
        $('em', li).textContent = `${TIPOS[m.tipo].txt} · ${m.grav}`;
        $('button', li).addEventListener('click', () => { marcas.splice(marcas.indexOf(m), 1); pintarPines(); render(); });
        li.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON' && m.vista !== vista) ponerVista(m.vista); });
        list.append(li);
      });
      list.scrollTop = list.scrollHeight;
    }
    const pts = marcas.reduce((s, m) => s + TIPOS[m.tipo].p * GRAV[m.grav], 0);
    const nivel = pts === 0 ? 0 : pts <= 3 ? 1 : pts <= 9 ? 2 : 3;
    scope.dataset.level = nivel; scopeVal.textContent = ['—', 'Leve', 'Medio', 'Importante'][nivel];
    setStep(); enlace();
  }
  $('[data-reset]').addEventListener('click', () => { marcas.length = 0; sig = 1; cerrarPop(); pintarPines(); render(); });

  const mensaje = () => {
    const f = new FormData(form);
    const l = [`Hola Nord-Auto, quiero pedir presupuesto (ref. ${ref}).`, ''];
    const c = (f.get('coche') || '').trim(); if (c) l.push(`🚗 Coche: ${c}`);
    if (marcas.length) { l.push('🛠️ Daños:'); marcas.forEach(m => l.push(`${String(m.id).padStart(2, '0')}. ${m.zona} (${NOMBRE_VISTA[m.vista]}): ${TIPOS[m.tipo].txt.toLowerCase()}, ${m.grav}`)); }
    else l.push('🛠️ Daños: os los explico con fotos.');
    l.push(`📄 Seguro: ${f.get('seguro')}`);
    if (f.get('sustitucion')) l.push('🔑 Necesitaría vehículo de sustitución.');
    const n = (f.get('nota') || '').trim(); if (n) l.push(`💬 ${n}`);
    const nom = (f.get('nombre') || '').trim();
    l.push('', 'Ahora os mando las fotos.' + (nom ? ` ${nom}.` : ''));
    return l.join('\n');
  };
  const enlace = () => { wa.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(mensaje())}`; };
  form.addEventListener('input', () => { tocado = true; setStep(); enlace(); });
  form.addEventListener('submit', (e) => e.preventDefault());

  fetch('parte/vistas.json').then(r => r.json()).then(j => { META = j; eje.textContent = EJE[vista]; dibujarZonas(); cargarAlfa(vista); render(); });
  ['arriba', 'derecha', 'delante', 'detras'].forEach(k => { const im = new Image(); im.src = `parte/${k}.webp`; });
})();
