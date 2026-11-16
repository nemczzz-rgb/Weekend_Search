window.WS = (function () {
  var DEG = Math.PI / 180, cache = null;

  /* ---------- данные: дословно из базы знаний ---------- */
  var ideas = [
    { id: 'roman-pizza', kind: 'Дома · одному, вдвоём', title: 'Римская пицца под киновечер', summary: 'Готовим пиццу и выбираем фильм. Тесто выдерживается 48–72 часа: этот вечер нужно запланировать заранее.', time: 'Около 5 ч', needs: 'Мука, Вода комнатной температуры, Оливковое масло extra virgin и ещё 7', ok: false, lead: true, reason: 'Тесто 48–72 ч в холодильнике' },
    { id: 'zaryadye-and-pizza', kind: 'Дома и в городе · одному, вдвоём', title: '«Зарядье» и римская пицца дома', summary: 'Сначала гуляем в парке, затем готовим пиццу дома. Тесто требует 48–72 часов в холодильнике заранее.', time: 'Около 3 ч 55 мин', needs: 'Одежда по погоде, Проверьте условия доступа перед выходом, Мука и ещё 7', ok: false, lead: true, reason: 'Тесто 48–72 ч в холодильнике' },
    { id: 'gardens-and-boulevard', kind: 'В городе · одному, вдвоём', title: 'Сад, бульвар и пруды', summary: 'Соединяем сад «Эрмитаж», Тверской бульвар и Патриаршие пруды в спокойный городской день.', time: 'Около 2 ч 5 мин', needs: 'Одежда по погоде, Проверьте условия доступа перед выходом', lead: false, ok: true },
    { id: 'fruit-and-drawn-story', kind: 'Дома · одному, вдвоём', title: 'Фруктовый салат и история в картинках', summary: 'Готовим лёгкое угощение и рисуем свою короткую историю, поодиночке или вместе.', time: 'Около 1 ч 15 мин', needs: 'Киви, Манго, Ананас и ещё 8', lead: false, ok: true }
  ];
  var routes = [
    { id: 'breakfast', theme: 'Еда', days: '1 день', title: 'Начать день с завтрака', sub: 'Завтрак в Nothing Fancy, затем прогулка в саду «Эрмитаж»', places: 'Nothing Fancy · Сад «Эрмитаж»', meta: 'Москва · 2 места' },
    { id: 'cinema', theme: 'Кино', days: '1 день', title: 'Кино с необычным комфортом', sub: 'Выбрать фильм и устроиться в зале с кроватями или диванами', places: 'Колибри', meta: 'Москва · 1 место' },
    { id: 'animals', theme: 'Животные', days: '1 день', title: 'День с альпаками', sub: 'Познакомиться с животными на Воробьёвской набережной', places: 'Парк Альпак Симба', meta: 'Москва · 1 место' },
    { id: 'pizza-ponds', theme: 'С друзьями', days: '1 день', title: 'Пицца и прогулка у прудов', sub: 'Пообедать в Mátes и выбрать время для Новодевичьих прудов', places: 'Mátes Пицца · Парк Новодевичьи Пруды', meta: 'Москва · 2 места' },
    { id: 'quiet', theme: 'Спокойно', days: '1 день', title: 'Медленный день', sub: 'Сад, бульвар и прогулка без плана', places: 'Патриаршие пруды · Тверской бульвар · Сад «Эрмитаж» · Чистые пруды', meta: 'Центр · 4 места' },
    { id: 'weekend', theme: 'Два дня', days: '2 дня', title: 'Большие выходные', sub: 'Два разных настроения за два дня', places: 'Патриаршие пруды · Музей русского импрессионизма · Сад «Эрмитаж» · Третьяковская галерея · Музеон · Парк Горького', meta: 'Разные районы · 6 мест' }
  ];
  function P(o) { o.hasFacts = !!(o.hours || o.price); o.hours = o.hours || 'Уточнить перед визитом'; o.price = o.price || ''; o.factsCls = o.price ? 'facts' : 'facts one'; return o; }
  var places = {
    zaryadye: P({ kind: 'Парк', area: 'Тверской', title: 'Парк «Зарядье»', note: 'Виды на центр и реку', addr: 'ул. Варварка, 6, стр. 1', hours: 'Территория круглосуточно; павильоны по графику', price: 'Вход в парк свободный; павильоны отдельно', src: true, checked: 'Проверено 10 ноября 2026', dur: 'Около 55 мин' }),
    hermitage: P({ kind: 'Сад', area: 'Тверской', title: 'Сад «Эрмитаж»', note: 'Пауза среди деревьев', addr: 'ул. Каретный Ряд, 3', hours: 'Круглосуточно', price: 'Вход в сад свободный; события отдельно', src: true, checked: 'Проверено 10 ноября 2026', dur: 'Около 45 мин' }),
    ermolova: P({ kind: 'Бульвар', area: 'Тверской', title: 'Тверской бульвар', note: 'Зелёный путь по центру', pub: true, dur: 'Около 35 мин' }),
    patriarch: P({ kind: 'Прогулка', area: 'Пресненский', title: 'Патриаршие пруды', note: 'Пруд и переулки вокруг', pub: true, dur: 'Около 45 мин' }),
    mates: P({ kind: 'Ресторан', area: 'Москва', title: 'Mátes Пицца', note: 'Пицца, салаты, паста, мясные блюда и десерты. Можно собраться за общим столом и поделиться пиццей.', addr: 'Усачёва ул., 11А', hours: 'Пн–пт 09:00–22:00; сб–вс 10:00–23:00', price: 'Без входного билета, заказ по меню', src: true, checked: 'Проверено 10 ноября 2026', dur: 'Около 1 ч' }),
    ponds: P({ kind: 'Парк', area: 'Москва', title: 'Парк Новодевичьи Пруды', note: 'Парк рядом с Новодевичьим монастырём: аллеи, пруды и мостик из белого камня. Идея для неспешной прогулки.', addr: 'Новодевичий проезд · парк у прудов', hours: 'Круглосуточно по справочнику', price: 'Прогулка без билета', src: true, checked: 'Проверено 10 ноября 2026', dur: 'Около 1 ч' }),
    kolibri: P({ kind: 'Кинотеатр', area: 'Москва', title: 'Колибри', note: 'Кинотеатр с двумя форматами залов: с кроватями и с кожаными диванами. Идея для необычного похода в кино.', addr: 'Севастопольский просп., 11Е', hours: 'По сеансам · ТЦ указывает 09:00–02:00', price: '450–800 ₽ по проверенной афише', src: true, more: true, checked: 'Проверено 10 ноября 2026', dur: 'Около 2 ч' }),
    izmailovo: P({ kind: 'Парк', area: 'Москва', title: 'Измайловский парк культуры и отдыха', note: 'Большой парк для прогулок на свежем воздухе. Можно устроить спокойный день среди деревьев или выбрать развлечения на месте.', addr: 'Московский просп., 2 · главный вход', hours: 'Территория круглосуточно', price: 'Вход свободный; аттракционы отдельно', src: true, checked: 'Проверено 10 ноября 2026', dur: 'Около 2 ч' }),
    impression: P({ kind: 'Музей', area: 'Беговой', title: 'Музей русского импрессионизма', note: 'Искусство в бывшем фабричном здании', addr: 'Ленинградский просп., 15, стр. 11', hours: 'Ср–чт 12:00–21:00; остальные дни 11:00–20:00', price: 'Стандартный билет от 700 ₽ по афише музея', src: true, checked: 'Проверено 10 ноября 2026', dur: 'Около 1 ч 25 мин' }),
    tretyakov: P({ kind: 'Музей', area: 'Замоскворечье', title: 'Третьяковская галерея', note: 'Большая коллекция русского искусства', addr: 'Лаврушинский пер., 10', hours: 'Вт–вс 10:00–21:00, вход до 20:00; пн закрыто', price: 'Ориентир 700 ₽ за основную экспозицию', src: true, checked: 'Проверено 10 ноября 2026', dur: 'Около 1 ч 40 мин' }),
    muzeon: P({ kind: 'Парк', area: 'Якиманка', title: 'Музеон', note: 'Скульптуры и дорожки у реки', addr: 'Крымская набережная · парк искусств «Музеон»', price: 'Прогулка без билета', src: true, checked: 'Проверено 10 ноября 2026', dur: 'Около 1 ч' }),
    gorky: P({ kind: 'Парк', area: 'Якиманка', title: 'Парк Горького', note: 'Длинная прогулка вдоль Москвы-реки', addr: 'ул. Крымский Вал, 9 · главный вход', hours: 'Круглосуточно, возможны закрытия из-за погоды', price: 'Вход в парк свободный; услуги отдельно', src: true, checked: 'Проверено 10 ноября 2026', dur: 'Около 1 ч 20 мин' })
  };
  function list(ids, from) { return ids.map(function (id, i) { var o = Object.assign({}, places[id]); o.n = ('0' + (i + (from || 1))).slice(-2); return o; }); }

  /* ---------- модель башни: геометрия из shukhov-background.js ---------- */
  var SECTIONS = [
    { y0: 0, h: 25, rb: 20.25, rt: 16.25, n: 24, phi: 37.5, rings: 4, w: 0.21 },
    { y0: 25, h: 25, rb: 16.25, rt: 12.5, n: 24, phi: 37.5, rings: 4, w: 0.21 },
    { y0: 50, h: 25, rb: 12.5, rt: 9.0, n: 24, phi: 45, rings: 7, w: 0.17 },
    { y0: 75, h: 25, rb: 9.0, rt: 6.0, n: 24, phi: 45, rings: 9, w: 0.15 },
    { y0: 100, h: 25, rb: 6.0, rt: 3.75, n: 12, phi: 45, rings: 9, w: 0.14 },
    { y0: 125, h: 20, rb: 3.75, rt: 2.5, n: 12, phi: 45, rings: 9, w: 0.13 }
  ];
  function build() {
    var S = [], L = [], RMAX = 72, SUB = 2;
    function seg(a, b, w, layer) { S.push(a[0], a[1], a[2], b[0], b[1], b[2], w); L.push(layer); }
    function pt(r, aDeg, y) { return [r * Math.cos(aDeg * DEG), y, r * Math.sin(aDeg * DEG)]; }
    function ring(y, r, w, layer, n) { n = Math.min(n, RMAX); for (var i = 0; i < n; i++) seg(pt(r, 360 * i / n, y), pt(r, 360 * (i + 1) / n, y), w, layer); }
    ring(0, 20.25, 0.36, 3, 120);
    var phase = 0;
    SECTIONS.forEach(function (s) {
      var step = 360 / s.n, i, k, d;
      for (i = 0; i < s.n; i++) {
        for (d = 1; d >= -1; d -= 2) {
          var off = d > 0 ? -0.1 : 0.1, a0 = phase + i * step, a1 = a0 + d * s.phi;
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
        var t = k / (s.rings + 1), r = Math.hypot(q0[0] + (q1[0] - q0[0]) * t, q0[2] + (q1[2] - q0[2]) * t);
        ring(s.y0 + s.h * t, r - 0.2, 0.11, 0, s.rb > 8 ? 120 : 60);
      }
      var yt = s.y0 + s.h;
      ring(yt - 0.5, s.rt + 0.2, 0.24, 3, s.rt > 8 ? 120 : 60);
      ring(yt, s.rt + 0.2, 0.28, 3, s.rt > 8 ? 120 : 60);
      phase += s.phi;
    });
    [[125, 3.75], [145, 2.5]].forEach(function (d) {
      ring(d[0], d[1] * 0.45, 0.07, 0, 36);
      for (var i = 0; i < 12; i++) seg(pt(d[1] * 0.45, i * 30, d[0]), pt(d[1], i * 30, d[0]), 0.07, 0);
      ring(d[0] + 1.1, d[1] - 0.25, 0.06, 0, 48);
      for (i = 0; i < 24; i++) seg(pt(d[1] - 0.25, i * 15, d[0]), pt(d[1] - 0.25, i * 15, d[0] + 1.1), 0.05, 0);
    });
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
      seg([-half + 0.8, y + depth, 0], [half - 0.8, y + depth, 0], 0.08, 2);
      seg([-half, y, 0], [-half + 0.8, y + depth, 0], 0.08, 2); seg([half, y, 0], [half - 0.8, y + depth, 0], 0.08, 2);
      for (q = 1; q < nn - 1; q++) {
        x0 = -half + 0.8 + (half * 2 - 1.6) * (q - 1) / (nn - 2); x1 = -half + 0.8 + (half * 2 - 1.6) * q / (nn - 2);
        seg([x0, y + (q % 2 ? depth : 0), 0], [x1, y + (q % 2 ? 0 : depth), 0], 0.05, 2);
      }
      seg([-half, y, 0], [-half / 2, y + 1.6, 0], 0.04, 2); seg([-half / 2, y + 1.6, 0], [0, y + 3.2, 0], 0.04, 2);
      seg([half, y, 0], [half / 2, y + 1.6, 0], 0.04, 2); seg([half / 2, y + 1.6, 0], [0, y + 3.2, 0], 0.04, 2);
    }
    traverse(146.9, 5.2, 0.55); traverse(149.6, 3.6, 0.5);
    seg([0, ym, 0], [0, 156, 0], 0.11, 2); seg([0, 156, 0], [0, 160, 0], 0.09, 2);
    return { S: S, L: L };
  }
  var TOP = 165, GROUND = -4;
  function layout(vw, vh, t, mobile) {
    var R = 19.3, pxm, win, yB, lay;
    if (mobile) {
      pxm = vh / 112; win = 112; yB = (TOP - win) + (GROUND + 2 - (TOP - win)) * t;
      lay = { pxm: pxm, cx: vw + pxm, D: 320, camH: yB + win * 0.3, strength: 0.6 };
    } else {
      pxm = Math.min(vh / 52, 0.24 * vw / R); win = vh / pxm; yB = (TOP - win) + (GROUND - (TOP - win)) * t;
      lay = { pxm: pxm, cx: vw - 0.82 * R * pxm, D: 170, camH: yB + win * 0.25, strength: 1 };
    }
    lay.baseY = vh + yB * lay.pxm;
    return lay;
  }
  function paint(M, o) {
    var PAPER = [245, 244, 241], INK = [25, 24, 33], BLUE = [57, 50, 189];
    var COL = [INK, BLUE, INK, INK], GAIN = [0.34, 1, 1, 1];
    var f = o.pxm * o.D, hy = o.baseY - o.pxm * o.camH, ca = Math.cos(o.angle), sa = Math.sin(o.angle);
    var NF = 4, B = {}, S = M.S, n = M.L.length, pad = 12;
    for (var i = 0; i < n; i++) {
      var q = i * 7;
      var x1 = S[q] * ca + S[q + 2] * sa, z1 = -S[q] * sa + S[q + 2] * ca;
      var x2 = S[q + 3] * ca + S[q + 5] * sa, z2 = -S[q + 3] * sa + S[q + 5] * ca;
      var s1 = f / (o.D - z1), s2 = f / (o.D - z2);
      var X1 = o.cx + x1 * s1, Y1 = hy - (S[q + 1] - o.camH) * s1, X2 = o.cx + x2 * s2, Y2 = hy - (S[q + 4] - o.camH) * s2;
      if ((Y1 < -pad && Y2 < -pad) || (Y1 > o.vh + pad && Y2 > o.vh + pad) || (X1 < -pad && X2 < -pad) || (X1 > o.vw + pad && X2 > o.vw + pad)) continue;
      var xm = (x1 + x2) / 2, zm = (z1 + z2) / 2, rr = Math.hypot(xm, zm);
      var nz = rr < 1.4 ? 0.6 : zm / rr, front = 0.5 + 0.5 * nz, fi = Math.min(NF - 1, (front * NF) | 0);
      var key = fi + '|' + M.L[i] + '|' + S[q + 6];
      B[key] = (B[key] || '') + 'M' + X1.toFixed(1) + ' ' + Y1.toFixed(1) + 'L' + X2.toFixed(1) + ' ' + Y2.toFixed(1);
    }
    var out = [], keys = Object.keys(B);
    for (var fi2 = 0; fi2 < NF; fi2++) {
      var fr = (fi2 + 0.5) / NF, fh = fr > 0.5, kk = (0.14 + 0.80 * Math.pow(fr, 1.5)) * o.strength;
      var order = fh ? [0, 1, 2, 3] : [3, 2, 1, 0];
      for (var oi = 0; oi < 4; oi++) {
        var layer = order[oi];
        for (var ki = 0; ki < keys.length; ki++) {
          var p = keys[ki].split('|');
          if (+p[0] !== fi2 || +p[1] !== layer) continue;
          var a = Math.min(1, kk * GAIN[layer]) * (fh ? 1 : 0.55);
          if (a < 0.03) continue;
          var col = COL[layer], px = Math.max(+p[2] * o.pxm * 1.18, 0.8);
          if (fh) out.push({ d: B[keys[ki]], c: 'rgb(245,244,241)', w: (px + 1.7 * 4 * (fr - 0.5)).toFixed(2), cap: 'butt' });
          out.push({ d: B[keys[ki]], c: 'rgb(' + col.map(function (v, ix) { return Math.round(PAPER[ix] + (v - PAPER[ix]) * a); }).join(',') + ')', w: px.toFixed(2), cap: 'round' });
        }
      }
    }
    return out;
  }
  function tower(vw, vh, t, mobile) {
    if (!cache) cache = build();
    var lay = layout(vw, vh, t, mobile), a = 0.35;
    var layers = paint(cache, { pxm: lay.pxm, cx: lay.cx, D: lay.D, camH: lay.camH, baseY: lay.baseY, angle: a, strength: lay.strength, vw: vw, vh: vh });
    var lampY = lay.baseY - lay.pxm * lay.camH - (157 - lay.camH) * lay.pxm;
    return { layers: layers, lampX: lay.cx, lampY: lampY, lampOn: lampY > 6 && lampY < vh - 6, r: Math.max(18, lay.pxm * 3.2) };
  }

  /* ---------- логотип: башня сверху, три яруса через один ---------- */
  function logoPaths() {
    var SEC = [[20.25, 16.25, 24, 37.5], [16.25, 12.5, 24, 37.5], [12.5, 9, 24, 45], [9, 6, 24, 45], [6, 3.75, 12, 45], [3.75, 2.5, 12, 45]], use = [0, 2, 4];
    function circle(r) { return 'M' + r + ' 0A' + r + ' ' + r + ' 0 1 0 ' + (-r) + ' 0A' + r + ' ' + r + ' 0 1 0 ' + r + ' 0'; }
    function p(r, a) { return (r * Math.cos(a * DEG)).toFixed(2) + ' ' + (r * Math.sin(a * DEG)).toFixed(2); }
    var ink = '', acc = '', ring = circle(20.25), phase = 0;
    SEC.forEach(function (s, ix) {
      if (use.indexOf(ix) >= 0) {
        var cnt = s[2] / 2, step = 360 / cnt;
        for (var i = 0; i < cnt; i++) { var a0 = phase + i * step; acc += 'M' + p(s[0], a0) + 'L' + p(s[1], a0 + s[3]); ink += 'M' + p(s[0], a0) + 'L' + p(s[1], a0 - s[3]); }
        ring += circle(s[0]) + circle(s[1]);
      }
      phase += s[3];
    });
    return { ink: ink, acc: acc, ring: ring };
  }
  var PAL = ['#3932bd', '#0047bb', '#0072ce', '#00b140', '#fe5000', '#e4002b', '#da1884', '#753bbd', '#191821'];
  function common(mobile, t) {
    var vw = mobile ? 390 : 1280, vh = mobile ? 844 : 820, tw = tower(vw, vh, t, !!mobile);
    return {
      mobile: !!mobile, cls: mobile ? 'pg m' : 'pg', w: vw, vh: vh,
      layers: tw.layers, lampX: tw.lampX, lampY: tw.lampY, lampOn: tw.lampOn, lampR: tw.r, lampR2: tw.r * 0.09 + 2,
      logo: logoPaths(), pal: PAL.map(function (c, i) { return { c: c, h: i === 0 ? '22px' : '8px', on: i === 0 ? 'true' : 'false' }; }),
      ideas: ideas, routes: routes
    };
  }
  return { common: common, ideas: ideas, routes: routes, places: places, list: list, tower: tower };
})();
