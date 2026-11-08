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
  /* 进入按钮的多国语言（WebGL 版 js/intro-gl.js 也用这一份） */
  var WORDS = window.GEWU_INTRO_WORDS = [
    ['access', 'EN'], ['进入', '中文'], ['アクセス', '日本語'], ['접속', '한국어'], ['accès', 'FRANÇAIS'], ['Zugang', 'DEUTSCH'],
    ['acceso', 'ESPAÑOL'], ['доступ', 'РУССКИЙ'], ['accesso', 'ITALIANO'], ['πρόσβαση', 'ΕΛΛΗΝΙΚΑ'], ['دخول', 'العربية'], ['प्रवेश', 'हिन्दी']
  ];
  var WORD_FONT = '"Noto Serif SC", "Noto Serif", "Songti SC", "Hiragino Mincho ProN", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Serif Devanagari", "Noto Naskh Arabic", "Times New Roman", serif';
  /* SPEED：相对原来的倍速；DUR、TRANS 为真实秒。四个场景约 15 秒，之后字符螺旋聚成 “access” */
  var SPEED = 1.7, DUR = 6.5 / SPEED, TRANS = 0.9 / SPEED, GATHER = 2.5, MORPH = 1.1, HOLD = 1.7;
  function start(force) {
    if (document.querySelector('.intro')) return;
    var el = document.createElement('div');
    el.className = 'intro intro-2d';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', '开场动画：格物');
    el.innerHTML = '<canvas aria-hidden="true"></canvas><div class="intro-vig" aria-hidden="true"></div>' +
      '<button type="button" class="intro-go intro-word" tabindex="-1" aria-label="进入网站（access）"><span>access</span></button>';
    document.body.appendChild(el);
    if (FX.hold) FX.hold(true);
    var cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), btn = el.querySelector('.intro-go');
    var W, H, cols, rows, V, bufA, bufB, rnd, font, chh, cw, wr = { x: 0, y: 0, w: 1, h: 1 };
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var box = el.getBoundingClientRect();
      W = Math.round(box.width) || window.innerWidth; H = Math.round(box.height) || window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      chh = W < 600 ? 10 : 15; cw = Math.round(chh * 0.6 * 10) / 10;
      cols = Math.ceil(W / cw); rows = Math.ceil(H / chh);
      bufA = new Buf(cols, rows); bufB = new Buf(cols, rows);
      rnd = new Float32Array(cols * rows); for (var k = 0; k < rnd.length; k++) rnd[k] = Math.random();
      font = '500 ' + (chh * 0.92).toFixed(1) + 'px "DM Mono", ui-monospace, Menlo, Consolas, monospace';
      var s = H > W * 1.3 ? Math.min(W / 1.75, H / 1.95) : Math.min(W / 2.15, H / 1.95);
      V = { s: s, cw: cw, chh: chh, cx0: W / 2, cy0: H * 0.5, cx: W / 2, cy: H / 2 };
      var ww = Math.min(W * (W < 600 ? 0.92 : 0.78), 900), wh = ww * 300 / 1024, cy = Math.min(H, window.innerHeight || H) * 0.47;
      wr = { x: W / 2 - ww / 2, y: cy - wh / 2, w: ww, h: wh };
      btn.style.left = wr.x + 'px'; btn.style.top = (cy - wh * 0.36) + 'px'; btn.style.width = ww + 'px'; btn.style.height = (wh * 0.72) + 'px';
      cells = []; if (fin) { pts = cellsOf(wIdx).map(function (c) { return { fx: c.x, fy: c.y, tx: c.x, ty: c.y, v: c.v, nv: c.v, d: 0, ch: '', col: '' }; }); wP0 = -9; morph = null; }
    }
    /* 把一个词画进按钮区域，按字符格统计覆盖率：每个有墨的格子就是一个粒子的终点 */
    var cells = [];
    function cellsOf(i) {
      if (cells[i]) return cells[i];
      var c = document.createElement('canvas'), w = Math.max(1, Math.round(wr.w)), h = Math.max(1, Math.round(wr.h));
      c.width = w; c.height = h;
      var x = c.getContext('2d', { willReadFrequently: true });
      x.font = '700 200px ' + WORD_FONT;
      var size = Math.min(h * 0.77, 200 * w * 0.91 / (x.measureText(WORDS[i][0]).width || 1));
      x.font = '700 ' + size.toFixed(1) + 'px ' + WORD_FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
      x.fillText(WORDS[i][0], w / 2, h / 2 + size * 0.04);
      var d = x.getImageData(0, 0, w, h).data, out = [];
      var i0 = Math.floor(wr.x / cw), i1 = Math.ceil((wr.x + wr.w) / cw), j0 = Math.floor(wr.y / chh), j1 = Math.ceil((wr.y + wr.h) / chh);
      for (var j = j0; j <= j1; j++) for (var ii = i0; ii <= i1; ii++) {
        var sum = 0;
        for (var sy = 0; sy < 3; sy++) for (var sx = 0; sx < 3; sx++) {
          var px = Math.floor(ii * cw + (sx + 0.5) * cw / 3 - wr.x), py = Math.floor(j * chh + (sy + 0.5) * chh / 3 - wr.y);
          if (px >= 0 && py >= 0 && px < w && py < h) sum += d[(py * w + px) * 4 + 3] / 255;
        }
        if (sum / 9 > 0.12) out.push({ x: (ii + 0.5) * cw, y: (j + 0.55) * chh, v: sum / 9 });
      }
      cells[i] = out; return out;
    }
    var fin = false, ready = false, pts = [], wIdx = 0, wP0 = 0, morph = null, nextMorph = 0;
    resize();
    var cur = (window.GEWU_INTRO_FROM | 0) % SCENES.length, prev = -1, sT = performance.now(), pT = 0, mx = 0, my = 0, tmx = 0, tmy = 0, raf, closing = false, t0 = performance.now();
    function go(k) { prev = cur; pT = sT; cur = (k + SCENES.length) % SCENES.length; sT = performance.now(); }
    var finAt = window.GEWU_INTRO_REVEAL_AT !== undefined ? window.GEWU_INTRO_REVEAL_AT : SCENES.length * DUR - 0.8;
    /* 终章开始：此刻画面上每个亮着的字符都变成一颗粒子（保留原来的字符、颜色和位置），再螺旋聚成单词 */
    function beginFinale(tr) {
      fin = true; wP0 = tr; prev = -1; btn.classList.add('show');
      var pal = SCENES[cur].pal, tc = cellsOf(0), b = bufB, cx = W / 2, cy = wr.y + wr.h / 2, md = Math.hypot(cx, cy) || 1;
      pts = [];
      for (var k = 0; k < b.a.length; k++) {
        if (b.a[k] < 0.03 || !b.ch[k]) continue;
        var x = ((k % b.cols) + (b.w[k] ? 1 : 0.5)) * cw, y = ((k / b.cols | 0) + 0.55) * chh, c = tc[Math.floor(Math.random() * tc.length)];
        pts.push({ fx: x, fy: y, tx: c.x, ty: c.y, v: Math.min(1, b.a[k]), nv: c.v, d: 0.3 * Math.random() + 0.7 * Math.hypot(x - cx, y - cy) / md, ch: b.ch[k], col: pal[b.c[k]] || pal[0] });
      }
      tc.forEach(function (c) { pts.push({ fx: c.x, fy: c.y, tx: c.x, ty: c.y, v: 0, nv: c.v, d: 0.9 + 0.1 * Math.random(), ch: '', col: '' }); });
    }
    function startMorph(tr) {
      var ni = (wIdx + 1) % WORDS.length, nc = cellsOf(ni), n = Math.max(pts.length, nc.length), out = [];
      for (var i = 0; i < n; i++) {
        var o = pts[i % pts.length], c = nc[i % nc.length];
        out.push({ fx: o.tx, fy: o.ty, tx: c.x, ty: c.y, v: o.nv, nv: i < nc.length ? c.v : 0, d: Math.random(), ch: '', col: '' });
      }
      pts = out; morph = { i: ni, t0: tr };
    }
    function drawWord(p, spiral, tr) {
      var cx = W / 2, cy = wr.y + wr.h / 2, RAMP2 = '.:-=+*#%@';
      ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var i = 0; i < pts.length; i++) {
        var q = pts[i], e = Math.max(0, Math.min(1, (p - q.d * 0.4) / 0.6)); e = e * e * (3 - 2 * e);
        var x, y;
        if (spiral) {
          var a0 = Math.atan2(q.fy - cy, q.fx - cx), a1 = Math.atan2(q.ty - cy, q.tx - cx), r0 = Math.hypot(q.fx - cx, q.fy - cy), r1 = Math.hypot(q.tx - cx, q.ty - cy);
          var da = a1 - a0; da -= Math.PI * 2 * Math.floor((da + Math.PI) / (Math.PI * 2));
          var an = a0 + (da + Math.PI * 2) * e, rr = r0 + (r1 - r0) * e;
          x = cx + Math.cos(an) * rr; y = cy + Math.sin(an) * rr;
        } else {
          var fl = Math.sin(Math.PI * e), dx = q.tx - q.fx, dy = q.ty - q.fy;
          x = q.fx + dx * e - dy * 0.35 * fl; y = q.fy + dy * e + dx * 0.35 * fl;
        }
        var v = q.v + (q.nv - q.v) * e;
        if (e >= 1) { if (v < 0.05) continue; ctx.fillStyle = '#f3e7d6'; ctx.globalAlpha = Math.min(1, 0.35 + v * 0.75); ctx.fillText(RAMP2.charAt(Math.min(8, Math.floor(v * 9))), x, y); }
        else if (q.ch && e < 0.55) { ctx.fillStyle = q.col; ctx.globalAlpha = Math.min(1, q.v * (1 - e) + 0.5 * Math.sin(Math.PI * e)); ctx.fillText(q.ch, x, y); }
        else { if (e <= 0) continue; ctx.fillStyle = '#ffcf96'; ctx.globalAlpha = 0.3 + 0.6 * Math.sin(Math.PI * e); ctx.fillText(e < 0.75 ? '*' : '+', x, y); }
      }
      ctx.globalAlpha = 1;
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
      var tr = (now - t0) / 1000, t = tr * SPEED, tau = (now - sT) / 1000;
      if (!closing && !fin && tau > DUR) { go(cur + 1); tau = 0; }
      if (!fin && tr >= finAt && !closing) beginFinale(tr);
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      V.cx = V.cx0 - mx * 18; V.cy = V.cy0 - my * 12;
      ctx.globalAlpha = 1; ctx.fillStyle = '#07080a'; ctx.fillRect(0, 0, W, H);
      ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var prog = prev >= 0 ? sm(0, 1, tau / TRANS) : 1;
      if (!fin) renderScene(SCENES[cur], bufB, tau * SPEED, t);
      if (fin) { /* 画面已经化成粒子 */ }
      else if (prog < 1) {
        renderScene(SCENES[prev], bufA, (now - pT) / 1000 * SPEED, t);
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
      if (fin) {
        var gp = wP0 < 0 ? 1 : Math.min(1, Math.max(0, (tr - wP0) / GATHER));
        if (!ready && gp >= 1) { ready = true; btn.classList.add('ready'); btn.removeAttribute('tabindex'); btn.focus({ preventScroll: true }); el.classList.add('ready'); nextMorph = tr + HOLD; }
        if (ready && !morph && tr >= nextMorph && !closing) startMorph(tr);
        if (morph) {
          var mp = Math.min(1, (tr - morph.t0) / MORPH);
          drawWord(mp, false, tr);
          if (mp >= 1) { wIdx = morph.i; pts = pts.filter(function (p) { return p.nv > 0; }).map(function (p) { return { fx: p.tx, fy: p.ty, tx: p.tx, ty: p.ty, v: p.nv, nv: p.nv, d: 0, ch: '', col: '' }; }); morph = null; nextMorph = tr + HOLD; }
        } else drawWord(gp, true, tr);
      }
    }
    function close() {
      if (closing) return; closing = true;
      if (FX.hold) FX.hold(false);
      el.classList.add('out');
      setTimeout(function () { cancelAnimationFrame(raf); el.remove(); window.removeEventListener('resize', resize); document.removeEventListener('keydown', onKey); }, 1100);
    }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    el.addEventListener('pointermove', function (e) { tmx = e.clientX / W - 0.5; tmy = e.clientY / H - 0.5; });
    el.addEventListener('click', function () { if (ready || reduce) close(); });
    window.addEventListener('resize', resize);
    document.addEventListener('keydown', onKey);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!closing) resize(); });
    raf = requestAnimationFrame(frame);
  }
  window.GEWU_INTRO = start;
  window.GEWU_INTRO_SCENES = SCENES;
})();
