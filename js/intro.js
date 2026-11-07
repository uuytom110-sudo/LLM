/* 开场（2D 备用版）：本站主题的动态字符画轮播（2D 字符网格渲染），沿用 Fuxi 复习站的绘制方法。全部为原创构图。 */
(function () {
  'use strict';
  var FX = window.GEWU_FX || {};
  var reduce = !!FX.reduce;
  var GL = '声音振动音调响度熔化凝华光的反射平面镜凸透镜焦点密度反射弧神经元激素免疫生态系统共顶点手拉手旋转全等';
  var RAMP = ' .:-=+*#%@';
  function sm(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function fr(x) { return x - Math.floor(x); }
  function hash(n) { return fr(Math.sin(n * 127.1 + 311.7) * 43758.5453); }
  function wide(c) { return !!c && c.charCodeAt(0) > 0x2e7f; }
  function rc(v) { return RAMP.charAt(Math.max(1, Math.min(9, Math.floor(v * 10)))); }
  function lineChar(dx, dy) {
    var a = Math.atan2(dy, dx) * 180 / Math.PI; if (a < 0) a += 180;
    if (a < 22.5 || a >= 157.5) return '-'; if (a < 67.5) return '/'; if (a < 112.5) return '|'; return '\\';
  }

  /* ---------- 字符缓冲区 ---------- */
  function Buf(cols, rows) {
    this.cols = cols; this.rows = rows; var n = cols * rows;
    this.ch = new Array(n); this.a = new Float32Array(n); this.c = new Uint8Array(n); this.w = new Uint8Array(n);
  }
  Buf.prototype.clear = function () { this.a.fill(0); this.w.fill(0); };

  /* ---------- 绘图工具：世界坐标（y 向上）→ 字符格 ---------- */
  function Pen(buf, V) { this.b = buf; this.V = V; this.cwW = V.cw / V.s; this.lh = V.chh / V.s; }
  Pen.prototype.put = function (i, j, ch, a, c, force) {
    var b = this.b; if (i < 0 || j < 0 || i >= b.cols || j >= b.rows || !(a > 0)) return;
    var k = j * b.cols + i;
    if (force || a >= b.a[k]) {
      b.a[k] = a; b.ch[k] = ch; b.c[k] = c; b.w[k] = 0;
      if (wide(ch) && i + 1 < b.cols) { b.w[k] = 1; if (a >= b.a[k + 1] || force) { b.a[k + 1] = a; b.ch[k + 1] = ''; } }
    }
  };
  Pen.prototype.dot = function (x, y, ch, a, c, force) {
    var V = this.V; this.put(Math.floor((V.cx + x * V.s) / V.cw), Math.floor((V.cy - y * V.s) / V.chh), ch, a, c, force);
  };
  Pen.prototype.seg = function (x1, y1, x2, y2, a, c, ch, frac) {
    var f = frac === undefined ? 1 : frac; if (f <= 0) return;
    var V = this.V, di = Math.abs((x2 - x1) * V.s / V.cw), dj = Math.abs((y2 - y1) * V.s / V.chh);
    var n = Math.max(1, Math.ceil(Math.max(di, dj) * 2)), m = Math.ceil(n * Math.min(1, f));
    var cc = ch || lineChar(x2 - x1, y2 - y1);
    for (var k = 0; k <= m; k++) { var t = k / n; this.dot(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, cc, a, c); }
  };
  Pen.prototype.poly = function (pts, closed, a, c, frac, ch) {
    var segs = [], tot = 0, i;
    for (i = 0; i < pts.length - (closed ? 0 : 1); i++) {
      var p = pts[i], q = pts[(i + 1) % pts.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
      segs.push([p, q, l]); tot += l;
    }
    var left = tot * (frac === undefined ? 1 : frac);
    for (i = 0; i < segs.length && left > 0; i++) {
      var s = segs[i]; this.seg(s[0][0], s[0][1], s[1][0], s[1][1], a, c, ch, Math.min(1, left / s[2])); left -= s[2];
    }
  };
  Pen.prototype.circle = function (x, y, r, a, c, frac, ch) {
    var pts = []; for (var k = 0; k < 48; k++) { var an = k / 48 * Math.PI * 2; pts.push([x + Math.cos(an) * r, y + Math.sin(an) * r]); }
    this.poly(pts, true, a, c, frac, ch);
  };
  Pen.prototype.fill = function (x0, y0, x1, y1, c, fn) {
    var V = this.V, b = this.b;
    var i0 = Math.max(0, Math.floor((V.cx + x0 * V.s) / V.cw)), i1 = Math.min(b.cols - 1, Math.floor((V.cx + x1 * V.s) / V.cw));
    var j0 = Math.max(0, Math.floor((V.cy - y1 * V.s) / V.chh)), j1 = Math.min(b.rows - 1, Math.floor((V.cy - y0 * V.s) / V.chh));
    for (var j = j0; j <= j1; j++) {
      var y = (V.cy - (j + 0.5) * V.chh) / V.s;
      for (var i = i0; i <= i1; i++) {
        var x = ((i + 0.5) * V.cw - V.cx) / V.s, v = fn(x, y, i, j);
        if (!v) continue;
        if (typeof v === 'number') { if (v > 0.02) this.put(i, j, rc(v), v, c); }
        else if (v.v > 0.02) this.put(i, j, v.ch || rc(v.v), v.v, v.c === undefined ? c : v.c, v.f);
      }
    }
  };
  Pen.prototype.width = function (str) { var w = 0; for (var k = 0; k < str.length; k++) w += wide(str[k]) ? 2 : 1; return w; };
  Pen.prototype.text = function (x, y, str, a, c, align, force) {
    var V = this.V, i = Math.floor((V.cx + x * V.s) / V.cw), j = Math.floor((V.cy - y * V.s) / V.chh);
    if (align === 'c') i -= Math.floor(this.width(str) / 2);
    for (var k = 0; k < str.length; k++) {
      var ch = str[k]; if (ch !== ' ') this.put(i, j, ch, a, c, force === undefined ? true : force);
      i += wide(ch) ? 2 : 1;
    }
  };
  Pen.prototype.textV = function (x, y, str, a, c) { for (var k = 0; k < str.length; k++) this.text(x, y - k * this.lh * 1.05, str[k], a, c, 'c'); };
  Pen.prototype.parts = function (y, parts) {
    var tot = 0, k; for (k = 0; k < parts.length; k++) tot += this.width(parts[k][0]);
    var x = -tot / 2 * this.cwW;
    for (k = 0; k < parts.length; k++) { this.text(x, y, parts[k][0], parts[k][1], parts[k][2], 'l'); x += this.width(parts[k][0]) * this.cwW; }
  };
  function inTri(x, y, P) {
    function s(a, b) { return (x - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (y - b[1]); }
    var d1 = s(P[0], P[1]), d2 = s(P[1], P[2]), d3 = s(P[2], P[0]);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }

  /* ---------- 八个场景 ---------- */
  var SCENES = [];

  /* 物理 · 声波干涉 */
  SCENES.push({ id: 'sound', name: '物理', title: '声现象 · 两个声源的干涉', pal: ['#5d6a6f', '#ffc58a', '#eef2f0', '#8ab4e8'], draw: function (d, t, tau, A) {
    var r = sm(0, 1.2, tau), sep = 0.32, front = 0.15 + tau * 0.45;
    d.fill(-A, -1, A, 1, 1, function (x, y) {
      var r1 = Math.hypot(x + sep, y), r2 = Math.hypot(x - sep, y);
      var a1 = Math.sin(24 * r1 - 3.4 * t) / Math.sqrt(0.6 + r1 * 7) * (r1 < front ? 1 : 0);
      var a2 = Math.sin(24 * r2 - 3.4 * t) / Math.sqrt(0.6 + r2 * 7) * (r2 < front ? 1 : 0);
      var h = (a1 + a2) * 1.3, v = Math.min(1, Math.abs(h)) * r;
      if (v < 0.12) return 0;
      return { v: v, c: h > 0 ? 1 : 3 };
    });
    d.text(-sep, 0, '@', r, 2, 'c', true); d.text(sep, 0, '@', r, 2, 'c', true);
    d.text(0, -0.86, '声音由振动产生 · 传播需要介质 · v空气 = 340 m/s', 0.85 * sm(1.4, 2.4, tau), 0, 'c');
  } });


  /* 物理 · 凸透镜 */
  SCENES.push({ id: 'physics', name: '物理', title: '透镜 · 平行光会聚于焦点', pal: ['#5d6a6f', '#7fd4f0', '#eef4f6', '#ffd27a'], draw: function (d, t, tau, A) {
    var r = sm(0, 1.2, tau), F = 0.55, k;
    for (var x = -A; x <= A; x += 0.05) d.dot(x, 0, '-', 0.35 * r, 0);
    d.text(F, -0.08, 'F', 0.85 * r, 2, 'c'); d.text(-F, -0.08, 'F', 0.85 * r, 2, 'c');
    d.text(2 * F, -0.08, '2F', 0.7 * r, 0, 'c'); d.text(-2 * F, -0.08, '2F', 0.7 * r, 0, 'c'); d.text(0.05, -0.08, 'O', 0.7 * r, 0, 'l');
    var H = 0.62, T = 0.065;
    d.fill(-0.1, -H, 0.1, H, 1, function (x, y) { return Math.abs(x) < T * (1 - (y / H) * (y / H)) ? { v: 0.3 * r, ch: ':' } : 0; });
    var L = [], R = [];
    for (k = 0; k <= 24; k++) { var y = -H + 2 * H * k / 24, w = T * (1 - (y / H) * (y / H)); L.push([-w, y]); R.push([w, y]); }
    d.poly(L, false, 0.9, 1, r); d.poly(R, false, 0.9, 1, r);
    d.text(0, H + 0.05, '^', 0.9 * r, 1, 'c'); d.text(0, -H - 0.05, 'v', 0.9 * r, 1, 'c');
    var step = 0.5 * d.cwW;
    [-0.45, -0.3, -0.15, 0.15, 0.3, 0.45].forEach(function (h, k) {
      var x0 = -A - 0.1, dx = F, dy = -h, dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
      var s2 = (A + 0.1) / dx, rr = sm(0.3 + k * 0.1, 1.3 + k * 0.1, tau), L1 = -x0, tot = L1 + s2, cdir = lineChar(dx, dy);
      d.seg(x0, h, 0, h, 0.26, 3, null, rr); d.seg(0, h, dx * s2, h + dy * s2, 0.26, 3, null, rr);
      for (var sd = 0; sd < tot * rr; sd += step) {
        var ph = fr((sd - t * 0.55) / 0.42 + k * 0.13); if (ph >= 0.12) continue;
        if (sd < L1) d.dot(x0 + sd, h, '-', 0.95 - ph * 3, 3, true);
        else { var q = sd - L1; d.dot(dx * q, h + dy * q, cdir, 0.95 - ph * 3, 3, true); }
      }
    });
    var pu = 0.5 + 0.5 * Math.sin(t * 3);
    d.dot(F, 0, '*', r, 2, true);
    for (k = 0; k < 8; k++) { var an = k * Math.PI / 4; d.dot(F + Math.cos(an) * (0.05 + 0.03 * pu), Math.sin(an) * (0.05 + 0.03 * pu), '+', 0.65 * pu * r, 3, true); }
    d.text(0, -0.82, '平行光  →  凸透镜  →  会聚于焦点 F', 0.85 * sm(1.5, 2.5, tau), 1, 'c');
  } });

  /* 生物学 · 神经冲动 */
  var SX = -0.6, SY = 0.12, SR = 0.16, AX0 = SX + SR, AX1 = 0.72;
  var DEN = (function () {
    var out = [];
    [100, 140, 175, 210, 245, 72].forEach(function (a, k) {
      var an = a * Math.PI / 180, x0 = SX + Math.cos(an) * SR, y0 = SY + Math.sin(an) * SR, l1 = 0.2 + 0.08 * hash(k + 1);
      var x1 = x0 + Math.cos(an) * l1, y1 = y0 + Math.sin(an) * l1; out.push([x0, y0, x1, y1]);
      [-0.5, 0.45].forEach(function (da, m) { var a2 = an + da + 0.2 * (hash(k * 5 + m) - 0.5), l2 = 0.12 + 0.06 * hash(k * 3 + m + 7); out.push([x1, y1, x1 + Math.cos(a2) * l2, y1 + Math.sin(a2) * l2]); });
    });
    return out;
  })();
  function axonY(x) { return SY + (x - SX) * (-0.12) + 0.05 * Math.sin((x - SX) * 5.2); }
  SCENES.push({ id: 'biology', name: '生物', title: '神经调节 · 冲动的传导', pal: ['#6c7a6a', '#a4d46a', '#f1f4ec', '#ffe39a'], draw: function (d, t, tau) {
    var r = sm(0, 1.3, tau), step = 0.5 * d.cwW, k, x, y;
    d.fill(SX - SR, SY - SR, SX + SR, SY + SR, 1, function (x, y, i, j) {
      var q = Math.hypot(x - SX, y - SY) / SR; if (q > 1) return 0;
      if (q < 0.38) return { v: 0.95 * r, ch: q < 0.2 ? '@' : 'O', c: 2 };
      return { v: (0.4 + 0.4 * (1 - q)) * r, ch: '#%*+'.charAt(Math.floor(hash(i * 7 + j * 13) * 4)) };
    });
    d.circle(SX, SY, SR, 0.9, 1, r);
    DEN.forEach(function (s, k) { d.seg(s[0], s[1], s[2], s[3], 0.8, 1, null, sm(0.1 + k * 0.03, 0.9 + k * 0.03, tau)); });
    for (x = AX0; x <= AX1; x += step) { if ((x - AX0) / (AX1 - AX0) > r * 1.1) break; y = axonY(x); d.dot(x, y, lineChar(step, axonY(x + step) - y), 0.65, 0); }
    for (k = 0; k < 5; k++) {
      var m0 = AX0 + 0.06 + k * 0.21, m1 = m0 + 0.15; if (m1 > AX1 - 0.05) break;
      for (x = m0; x < m1; x += step) { y = axonY(x); d.dot(x, y + 0.035, '_', 0.55 * r, 1); d.dot(x, y - 0.03, '-', 0.55 * r, 1); }
      d.dot(m0, axonY(m0), '(', 0.6 * r, 1); d.dot(m1, axonY(m1), ')', 0.6 * r, 1);
    }
    var EY = axonY(AX1), KN = [];
    [-45, -18, 12, 40].forEach(function (a, k) { var an = a * Math.PI / 180, l = 0.13 + 0.03 * hash(k + 20), kx = AX1 + Math.cos(an) * l, ky = EY + Math.sin(an) * l; d.seg(AX1, EY, kx, ky, 0.75, 1, null, r); d.dot(kx, ky, 'o', 0.95 * r, 1, true); KN.push([kx, ky]); });
    [[1.02, EY + 0.02, 1.25, EY + 0.16], [1.02, EY - 0.02, 1.22, EY - 0.18], [1.02, EY, 1.3, EY + 0.01]].forEach(function (s) { d.seg(s[0], s[1], s[2], s[3], 0.4 * r, 0); });
    var p = fr(t * 0.38), PX = AX0 + (AX1 - AX0) * p;
    for (x = Math.max(AX0, PX - 0.3); x <= Math.min(AX1, PX + 0.05); x += step) {
      var dd = PX - x, a = Math.max(0, dd < 0 ? 1 + dd / 0.05 : 1 - dd / 0.3);
      d.dot(x, axonY(x), a > 0.75 ? '#' : (a > 0.4 ? '*' : '+'), a * r, 3, true);
    }
    var bp = sm(0.86, 1, p);
    if (bp > 0) KN.forEach(function (kn, k) { for (var q = 0; q < 4; q++) { var an = (hash(k * 9 + q) - 0.5) * 1.2; d.dot(kn[0] + Math.cos(an) * bp * 0.14 + 0.02, kn[1] + Math.sin(an) * bp * 0.14, '\u00b7', 1.2 - bp, 3, true); } });
    var st = ['感受器', '传入神经', '神经中枢', '传出神经', '效应器'], si = Math.min(4, Math.floor(p * 5)), parts = [], ra = sm(1.2, 2.2, tau);
    for (k = 0; k < st.length; k++) { parts.push([st[k], (k === si ? 0.98 : 0.45) * ra, k === si ? 3 : 0]); if (k < 4) parts.push([' → ', 0.4 * ra, 0]); }
    d.parts(-0.8, parts);
  } });

  /* 数学 · 手拉手：共顶点旋转全等 */
  SCENES.push({ id: 'model', name: '数学', title: '手拉手 · 共顶点旋转', pal: ['#5f6b68', '#f0b46a', '#eef2f0', '#8ab4e8'], draw: function (d, t, tau) {
    var r = sm(0, 1.2, tau), A = [0, 0.4], L1 = 1.1, L2 = 0.48, k;
    var B = [A[0] - L1 * 0.5, A[1] - L1 * 0.866], C = [A[0] + L1 * 0.5, A[1] - L1 * 0.866];
    var th = 4.18879 + t * 0.35, D = [A[0] + L2 * Math.cos(th), A[1] + L2 * Math.sin(th)], E = [A[0] + L2 * Math.cos(th + 1.0472), A[1] + L2 * Math.sin(th + 1.0472)];
    for (k = 0; k < 72; k += 2) { var an = k / 72 * Math.PI * 2; d.dot(A[0] + Math.cos(an) * L2, A[1] + Math.sin(an) * L2, '.', 0.3 * r, 0); }
    d.fill(-1, -0.6, 1, 1.2, 1, function (x, y) { return inTri(x, y, [A, B, D]) ? { v: 0.18 * r, ch: '.' } : 0; });
    d.fill(-1, -0.6, 1, 1.2, 3, function (x, y) { return inTri(x, y, [A, C, E]) ? { v: 0.18 * r, ch: '.' } : 0; });
    d.poly([A, B, C], true, 0.9, 2, r);
    d.poly([A, D, E], true, 0.9, 2, r);
    d.seg(B[0], B[1], D[0], D[1], 0.95, 1, null, r);
    d.seg(C[0], C[1], E[0], E[1], 0.95, 3, null, r);
    [[A, 'A', 0, 0.07], [B, 'B', -0.06, -0.04], [C, 'C', 0.06, -0.04], [D, 'D', 0, 0], [E, 'E', 0, 0]].forEach(function (q) {
      var ox = q[2], oy = q[3];
      if (q[1] === 'D' || q[1] === 'E') { var u = Math.hypot(q[0][0] - A[0], q[0][1] - A[1]) || 1; ox = (q[0][0] - A[0]) / u * 0.07; oy = (q[0][1] - A[1]) / u * 0.07; }
      d.text(q[0][0] + ox, q[0][1] + oy, q[1], 0.95 * r, 2, 'c');
    });
    d.text(0, -0.86, 'AB = AC，AD = AE，∠BAC = ∠DAE  →  BD = CE', 0.85 * sm(1.4, 2.4, tau), 0, 'c');
  } });

  /* ---------- 播放器 ---------- */
  var DUR = 6.5, TRANS = 0.9;
  function start(force) {
    var seen = false;
    try { seen = sessionStorage.getItem('gewu-intro') === '1'; } catch (e) { /* ignore */ }
    if ((seen && !force) || reduce) return;
    try { sessionStorage.setItem('gewu-intro', '1'); } catch (e) { /* ignore */ }
    var el = document.createElement('div');
    el.className = 'intro intro-2d';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', '开场动画：格物');
    el.innerHTML = '<canvas aria-hidden="true"></canvas><div class="intro-vig" aria-hidden="true"></div>' +
      '<button type="button" class="intro-go" tabindex="-1" aria-label="进入网站"><span>进 入</span></button>';
    document.body.appendChild(el);
    var cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), btn = el.querySelector('.intro-go'), label = btn.querySelector('span');
    var W, H, cols, rows, V, bufA, bufB, rnd, font, chh, cw;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      chh = W < 600 ? 10 : 15; cw = Math.round(chh * 0.6 * 10) / 10;
      cols = Math.ceil(W / cw); rows = Math.ceil(H / chh);
      bufA = new Buf(cols, rows); bufB = new Buf(cols, rows);
      rnd = new Float32Array(cols * rows); for (var k = 0; k < rnd.length; k++) rnd[k] = Math.random();
      font = '500 ' + (chh * 0.92).toFixed(1) + 'px "DM Mono", ui-monospace, Menlo, Consolas, monospace';
      var s = Math.min(W / 2.15, H / 1.95);
      V = { s: s, cw: cw, chh: chh, cx0: W / 2, cy0: H * (W < 600 ? 0.42 : 0.5), cx: W / 2, cy: H / 2 };
    }
    resize();
    var cur = (window.GEWU_INTRO_FROM | 0) % SCENES.length, prev = -1, sT = performance.now(), pT = 0, mx = 0, my = 0, tmx = 0, tmy = 0, raf, closing = false, t0 = performance.now();
    function go(k) { prev = cur; pT = sT; cur = (k + SCENES.length) % SCENES.length; sT = performance.now(); }
    var revealAt = (window.GEWU_INTRO_REVEAL_AT !== undefined ? window.GEWU_INTRO_REVEAL_AT : SCENES.length * DUR) * 1000, shown = false;
    function reveal() {
      shown = true; btn.classList.add('show');
      setTimeout(function () {
        if (closing) return;
        btn.classList.add('ready'); btn.removeAttribute('tabindex'); btn.focus({ preventScroll: true });
        var target = '进 入', st = performance.now(), G = '.:;+=*#%@&$?!|/()[]{}<>~^';
        (function step(now) {
          var p = Math.min(1, (now - st) / 900), out = '';
          for (var i = 0; i < target.length; i++) out += target[i] === ' ' ? ' ' : (p * (target.length + 1) > i + 1 ? target[i] : G.charAt(Math.floor(Math.random() * G.length)));
          label.textContent = out;
          if (p < 1 && !closing) requestAnimationFrame(step); else label.textContent = target;
        })(st);
      }, 2400);
    }

    function renderScene(sc, buf, tau, t) {
      buf.clear();
      var d = new Pen(buf, V); sc.draw(d, t, tau, V.cx / V.s);
    }
    function paint(buf, pal, pick) {
      var n = buf.cols, a = buf.a, ch = buf.ch, c = buf.c, w = buf.w;
      for (var col = 0; col < pal.length; col++) {
        ctx.fillStyle = pal[col];
        for (var k = 0; k < a.length; k++) {
          if (a[k] < 0.03 || c[k] !== col || !ch[k] || (pick && !pick(k))) continue;
          ctx.globalAlpha = a[k] > 1 ? 1 : a[k];
          ctx.fillText(ch[k], ((k % n) + (w[k] ? 1 : 0.5)) * cw, ((k / n | 0) + 0.55) * chh);
        }
      }
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var t = (now - t0) / 1000, tau = (now - sT) / 1000;
      if (!closing && tau > DUR) { go(cur + 1); tau = 0; }
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      V.cx = V.cx0 - mx * 18; V.cy = V.cy0 - my * 12;
      ctx.globalAlpha = 1; ctx.fillStyle = '#07080a'; ctx.fillRect(0, 0, W, H);
      ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var prog = prev >= 0 ? sm(0, 1, tau / TRANS) : 1;
      renderScene(SCENES[cur], bufB, tau, t);
      if (prog < 1) {
        renderScene(SCENES[prev], bufA, (now - pT) / 1000, t);
        paint(bufA, SCENES[prev].pal, function (k) { return rnd[k] >= prog + 0.05; });
        paint(bufB, SCENES[cur].pal, function (k) { return rnd[k] < prog - 0.05; });
        ctx.fillStyle = SCENES[cur].pal[1];
        var GA = '#%*+=:', gf = Math.floor(t * 18);
        for (var k = 0; k < rnd.length; k++) {
          var gd = Math.abs(rnd[k] - prog), ga = Math.max(bufA.a[k], bufB.a[k]);
          if (gd > 0.03 || ga < 0.08) continue;
          ctx.globalAlpha = Math.min(1, ga) * 0.75 * (1 - gd / 0.03);
          var cjk = rnd[k] * 997 % 1 < 0.12;
          ctx.fillText(cjk ? GL.charAt((k * 7 + gf) % GL.length) : GA.charAt((k + gf) % GA.length), ((k % cols) + (cjk ? 1 : 0.5)) * cw, ((k / cols | 0) + 0.55) * chh);
        }
      } else { prev = -1; paint(bufB, SCENES[cur].pal); }
      ctx.fillStyle = '#5c6663';
      var ep = Math.floor(t / 2.2), tw = Math.sin(Math.PI * fr(t / 2.2));
      for (var q = 0; q < 46; q++) {
        var ii = Math.floor(hash(q * 1.3 + ep * 7.7) * cols), jj = Math.floor(hash(q * 2.9 + ep * 3.1) * rows);
        if (bufB.a[jj * cols + ii] > 0.03) continue;
        ctx.globalAlpha = 0.22 * tw * hash(q + 0.5);
        ctx.fillText(GL.charAt((q * 11 + ep) % GL.length), (ii + 1) * cw, (jj + 0.55) * chh);
      }
      ctx.globalAlpha = 1;
      if (!shown && now - t0 > revealAt) reveal();
    }
    function close() {
      if (closing) return; closing = true;
      el.classList.add('out');
      setTimeout(function () { cancelAnimationFrame(raf); el.remove(); window.removeEventListener('resize', resize); document.removeEventListener('keydown', onKey); }, 1100);
    }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    el.addEventListener('pointermove', function (e) { tmx = e.clientX / W - 0.5; tmy = e.clientY / H - 0.5; });
    btn.addEventListener('click', function () { if (btn.classList.contains('ready')) close(); });
    window.addEventListener('resize', resize);
    document.addEventListener('keydown', onKey);
    raf = requestAnimationFrame(frame);
  }
  window.GEWU_INTRO = start;
  window.GEWU_INTRO_SCENES = SCENES;
})();
