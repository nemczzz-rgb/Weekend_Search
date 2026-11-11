
/* Weekend Search — фон с Шуховской башней.
   Настоящая 3D-решётка: шесть гиперболоидных секций из прямых ног двух направлений и кольца.
   Рисуется на Canvas 2D с перспективой; балки сортируются по глубине, передние перекрывают задние.
   Единственное, что меняется, — угол поворота вокруг вертикальной оси. */
const root = window;

  var DEG = Math.PI / 180;
  var PAPER = [245, 244, 241];                 // #f5f4f1
  var INK = [23, 22, 29], BLUE = [59, 47, 198];

  var SECTIONS = [
    { y0: 0,   h: 25, rb: 20.25, rt: 16.25, n: 24, phi: 37.5, rings: 4, w: 0.21 },
    { y0: 25,  h: 25, rb: 16.25, rt: 12.5,  n: 24, phi: 37.5, rings: 4, w: 0.21 },
    { y0: 50,  h: 25, rb: 12.5,  rt: 9.0,   n: 24, phi: 45,   rings: 7, w: 0.17 },
    { y0: 75,  h: 25, rb: 9.0,   rt: 6.0,   n: 24, phi: 45,   rings: 9, w: 0.15 },
    { y0: 100, h: 25, rb: 6.0,   rt: 3.75,  n: 12, phi: 45,   rings: 9, w: 0.14 },
    { y0: 125, h: 20, rb: 3.75,  rt: 2.5,   n: 12, phi: 45,   rings: 9, w: 0.13 }
  ];

  // Слои от оси наружу: 0 — промежуточные кольца, 1 — внутренние ноги (синие),
  // 2 — внешние ноги (чёрные), 3 — опорные кольца. Порядок нужен для перекрытия в узлах.
  var LAYER_COLOR = [INK, BLUE, INK, INK], LAYER_GAIN = [0.62, 1, 1, 1], LAYER_BIAS = [-1.3, -0.3, 0.3, 1.3];

  function build() {
    var S = [], L = [];
    function seg(a, b, w, layer) { S.push(a[0], a[1], a[2], b[0], b[1], b[2], w); L.push(layer); }
    function pt(r, aDeg, y) { return [r * Math.cos(aDeg * DEG), y, r * Math.sin(aDeg * DEG)]; }
    function ring(y, r, w, layer, n) { for (var i = 0; i < n; i++) seg(pt(r, 360 * i / n, y), pt(r, 360 * (i + 1) / n, y), w, layer); }

    ring(0, 20.25, 0.36, 3, 120);
    var phase = 0;
    SECTIONS.forEach(function (s) {
      var step = 360 / s.n, SUB = 16, i, k, d;
      for (i = 0; i < s.n; i++) {
        for (d = 1; d >= -1; d -= 2) {
          var off = d > 0 ? -0.1 : 0.1;
          var a0 = phase + i * step, a1 = a0 + d * s.phi;
          var p0 = pt(s.rb + off, a0, s.y0), p1 = pt(s.rt + off, a1, s.y0 + s.h);
          for (k = 0; k < SUB; k++) {
            var t0 = k / SUB, t1 = (k + 1) / SUB;
            seg([p0[0] + (p1[0] - p0[0]) * t0, p0[1] + (p1[1] - p0[1]) * t0, p0[2] + (p1[2] - p0[2]) * t0],
                [p0[0] + (p1[0] - p0[0]) * t1, p0[1] + (p1[1] - p0[1]) * t1, p0[2] + (p1[2] - p0[2]) * t1], s.w, d > 0 ? 1 : 2);
          }
        }
      }
      var q0 = pt(s.rb, 0, 0), q1 = pt(s.rt, s.phi, 0);
      for (k = 1; k <= s.rings; k++) {
        var t = k / (s.rings + 1);
        var r = Math.hypot(q0[0] + (q1[0] - q0[0]) * t, q0[2] + (q1[2] - q0[2]) * t);
        ring(s.y0 + s.h * t, r - 0.2, 0.11, 0, s.rb > 8 ? 120 : 60);
      }
      var yt = s.y0 + s.h;
      ring(yt - 0.5, s.rt + 0.2, 0.24, 3, s.rt > 8 ? 120 : 60);
      ring(yt, s.rt + 0.2, 0.28, 3, s.rt > 8 ? 120 : 60);
      phase += s.phi;
    });
    // площадки под вершиной
    [[125, 3.75], [145, 2.5]].forEach(function (d) {
      ring(d[0], d[1] * 0.45, 0.07, 0, 36);
      for (var i = 0; i < 12; i++) seg(pt(d[1] * 0.45, i * 30, d[0]), pt(d[1], i * 30, d[0]), 0.07, 0);
      ring(d[0] + 1.1, d[1] - 0.25, 0.06, 0, 48);
      for (i = 0; i < 24; i++) seg(pt(d[1] - 0.25, i * 15, d[0]), pt(d[1] - 0.25, i * 15, d[0] + 1.1), 0.05, 0);
    });
    // навершие: решётчатая мачта, две траверсы с оттяжками, флагшток до 160 м
    var m = 0.5, yb = 145, ym = 151.5, c = [[m, m], [m, -m], [-m, -m], [-m, m]], yy;
    for (var j = 0; j < 4; j++) {
      var u = c[j], v = c[(j + 1) % 4];
      seg([u[0], yb, u[1]], [u[0] * 0.5, ym, u[1] * 0.5], 0.10, 2);
      for (yy = 0; yy < 4; yy++) {
        var f0 = 1 - 0.5 * yy / 4, f1 = 1 - 0.5 * (yy + 1) / 4, ya = yb + (ym - yb) * yy / 4, yc = yb + (ym - yb) * (yy + 1) / 4;
        seg([u[0] * f0, ya, u[1] * f0], [v[0] * f1, yc, v[1] * f1], 0.06, 2);
        seg([u[0] * f1, yc, u[1] * f1], [v[0] * f1, yc, v[1] * f1], 0.06, 2);
      }
    }
    function traverse(y, half, depth) {
      var nn = Math.round(half * 2), x0, x1, q, PIECES = 8;
      for (q = 0; q < PIECES; q++) seg([-half + 2 * half * q / PIECES, y, 0], [-half + 2 * half * (q + 1) / PIECES, y, 0], 0.11, 2);
      seg([-half + 0.8, y + depth, 0], [0, y + depth, 0], 0.08, 2); seg([0, y + depth, 0], [half - 0.8, y + depth, 0], 0.08, 2);
      seg([-half, y, 0], [-half + 0.8, y + depth, 0], 0.08, 2); seg([half, y, 0], [half - 0.8, y + depth, 0], 0.08, 2);
      for (q = 1; q < nn - 1; q++) {
        x0 = -half + 0.8 + (half * 2 - 1.6) * (q - 1) / (nn - 2); x1 = -half + 0.8 + (half * 2 - 1.6) * q / (nn - 2);
        seg([x0, y + (q % 2 ? depth : 0), 0], [x1, y + (q % 2 ? 0 : depth), 0], 0.05, 2);
      }
      seg([-half, y, 0], [-half / 2, y + 1.6, 0], 0.04, 2); seg([-half / 2, y + 1.6, 0], [0, y + 3.2, 0], 0.04, 2);
      seg([half, y, 0], [half / 2, y + 1.6, 0], 0.04, 2); seg([half / 2, y + 1.6, 0], [0, y + 3.2, 0], 0.04, 2);
    }
    traverse(146.9, 5.2, 0.55);
    traverse(149.6, 3.6, 0.5);
    seg([0, ym, 0], [0, 156, 0], 0.11, 2); seg([0, 156, 0], [0, 160, 0], 0.09, 2);

    var widths = [], n = L.length, style = new Uint8Array(n), styles = [];
    for (var e = 0; e < n; e++) {
      var key = L[e] * 100 + Math.round(S[e * 7 + 6] * 100), idx = widths.indexOf(key);
      if (idx < 0) { idx = widths.length; widths.push(key); styles.push({ layer: L[e], w: S[e * 7 + 6] }); }
      style[e] = idx;
    }
    // стили упорядочены от оси наружу
    var order = styles.map(function (_, i) { return i; }).sort(function (a, b) { return styles[a].layer - styles[b].layer; });
    return { segs: new Float32Array(S), count: n, style: style, styles: styles, order: order };
  }

  var M = null, B = null, NZ = 36, NF = 8, ZMAX = 21;
  function setup() {
    M = build(); B = [];
    for (var i = 0; i < NZ * NF * M.styles.length; i++) B.push([]);
  }

  /* Кадрирование для экрана vw×vh (CSS-пиксели): башня крупно, справа, частично за краем.
     travel 0…1 — ход камеры вдоль оси башни: 0 — у вершины, 1 — у основания.
     travel == null — статичный кадр (нижние секции). */
  var TOP = 165, GROUND = -4;
  function layout(vw, vh, travel) {
    var mobile = vw < 760, R = 19.3, pxm, win, yBottom, lay;
    if (mobile) {
      // телефон: ось башни на правой кромке, видна левая половина
      pxm = vh / 112; win = 112;
      yBottom = travel == null ? GROUND + 2 : (TOP - win) + (GROUND + 2 - (TOP - win)) * travel;
      lay = { pxm: pxm, cx: vw + pxm, camDist: 320, camH: yBottom + win * 0.3, strength: 0.6 };
    } else {
      pxm = Math.min(vh / 52, 0.24 * vw / R); win = vh / pxm;
      yBottom = travel == null ? 6 : (TOP - win) + (GROUND - (TOP - win)) * travel;
      lay = { pxm: pxm, cx: vw - 0.82 * R * pxm, camDist: 170, camH: yBottom + win * 0.25, strength: 1 };
    }
    lay.yBottom = yBottom;
    lay.baseY = vh + yBottom * pxm;   // экранная координата отметки 0 м
    return lay;
  }

  /* draw(ctx, pw, ph, vw, vh, angle, travel): pw×ph — размер холста в пикселях, vw×vh — экран, под который кадрируем. */
  function draw(ctx, pw, ph, vw, vh, angle, travel) {
    if (!M) setup();
    var lay = layout(vw, vh, travel), k = pw / vw;
    var pxm = lay.pxm * k, cx = lay.cx * k, D = lay.camDist, camH = lay.camH;
    var f = pxm * D, hy = lay.baseY * k - pxm * camH;
    var ca = Math.cos(angle), sa = Math.sin(angle);
    var S = M.segs, n = M.count, NS = M.styles.length, i, j;
    var pad = 8 * k;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgb(' + PAPER.join(',') + ')';
    ctx.fillRect(0, 0, pw, ph);
    for (i = 0; i < B.length; i++) B[i].length = 0;

    for (i = 0; i < n; i++) {
      var q = i * 7;
      var x1 = S[q] * ca + S[q + 2] * sa, z1 = -S[q] * sa + S[q + 2] * ca;
      var x2 = S[q + 3] * ca + S[q + 5] * sa, z2 = -S[q + 3] * sa + S[q + 5] * ca;
      var s1 = f / (D - z1), s2 = f / (D - z2);
      var X1 = cx + x1 * s1, Y1 = hy - (S[q + 1] - camH) * s1, X2 = cx + x2 * s2, Y2 = hy - (S[q + 4] - camH) * s2;
      if ((X1 < -pad && X2 < -pad) || (X1 > pw + pad && X2 > pw + pad) || (Y1 < -pad && Y2 < -pad) || (Y1 > ph + pad && Y2 > ph + pad)) continue;
      var xm = (x1 + x2) / 2, zm = (z1 + z2) / 2, rr = Math.hypot(xm, zm);
      var nz = rr < 1.4 ? 0.6 : zm / rr, front = 0.5 + 0.5 * nz;
      // элементы, лежащие дальше от оси, спереди ближе к зрителю, сзади — дальше
      var zi = ((zm + LAYER_BIAS[M.styles[M.style[i]].layer] * nz + ZMAX) / (2 * ZMAX) * NZ) | 0; if (zi < 0) zi = 0; else if (zi >= NZ) zi = NZ - 1;
      var fi = (front * NF) | 0; if (fi >= NF) fi = NF - 1;
      B[(zi * NF + fi) * NS + M.style[i]].push(X1, Y1, X2, Y2);
    }

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var paper = 'rgb(' + PAPER.join(',') + ')', gap = 1.7 * k;
    for (var zi2 = 0; zi2 < NZ; zi2++) {
      for (var fi2 = 0; fi2 < NF; fi2++) {
        var fr = (fi2 + 0.5) / NF, frontHalf = fr > 0.5;
        var kk = (0.14 + 0.80 * Math.pow(fr, 1.5)) * lay.strength;
        for (var o = 0; o < NS; o++) {
          // спереди внешние элементы рисуются последними, сзади — наоборот
          var si = M.order[frontHalf ? o : NS - 1 - o], arr = B[(zi2 * NF + fi2) * NS + si];
          if (!arr.length) continue;
          var st = M.styles[si], col = LAYER_COLOR[st.layer], a = Math.min(1, kk * LAYER_GAIN[st.layer]);
          var px = Math.max(st.w * pxm * 1.18, 0.8 * k);
          ctx.beginPath();
          for (j = 0; j < arr.length; j += 4) { ctx.moveTo(arr[j], arr[j + 1]); ctx.lineTo(arr[j + 2], arr[j + 3]); }
          if (frontHalf) { ctx.strokeStyle = paper; ctx.lineWidth = px + gap * 2 * (fr - 0.5) * 2; ctx.lineCap = 'butt'; ctx.stroke(); ctx.lineCap = 'round'; }
          ctx.strokeStyle = 'rgb(' + ((PAPER[0] + (col[0] - PAPER[0]) * a) | 0) + ',' + ((PAPER[1] + (col[1] - PAPER[1]) * a) | 0) + ',' + ((PAPER[2] + (col[2] - PAPER[2]) * a) | 0) + ')';
          ctx.lineWidth = px;
          ctx.stroke();
        }
      }
    }
  }

  /* mount(canvas): фон на весь экран, поворот = прогресс прокрутки страницы × 360°. */
  function mount(canvas) {
    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return function () {};
    var still = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)');
    var raf = 0, vw = 0, vh = 0, last = -2;
    function progress() {
      if (still && still.matches) return -1;              // статичная башня
      var max = document.documentElement.scrollHeight - root.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, root.scrollY / max)) : 0;
    }
    function paint() {
      raf = 0;
      var p = progress();
      if (p === last) return;
      last = p;
      var a = p < 0 ? 0 : p, t = p < 0 ? null : p;
      canvas.dataset.angle = (a * 360).toFixed(2);
      canvas.dataset.camera = layout(vw, vh, t).camH.toFixed(2);
      draw(ctx, canvas.width, canvas.height, vw, vh, a * Math.PI * 2, t);
    }
    function kick() { if (!raf) raf = root.requestAnimationFrame(paint); }
    function redraw() { last = -2; kick(); }
    function resize() {
      var dpr = Math.min(root.devicePixelRatio || 1, 2);
      vw = document.documentElement.clientWidth; vh = root.innerHeight;
      canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
      last = -2; kick();
    }
    root.addEventListener('scroll', kick, { passive: true });
    root.addEventListener('resize', resize);
    if (still) still.addEventListener('change', redraw);
    var observer = new ResizeObserver(redraw);
    observer.observe(document.body);
    resize();
    return function () {
      root.cancelAnimationFrame(raf);
      root.removeEventListener('scroll', kick);
      root.removeEventListener('resize', resize);
      if (still) still.removeEventListener('change', redraw);
      observer.disconnect();
    };
  }

export { mount };



