/* 字符流动效果：全站背景与页面头部的“湖面涡旋”字符场、文字解码、液态玻璃高光。纯 Canvas / CSS，无依赖。 */
window.GEWU_FX = (function () {
  'use strict';
  var RAMP = ' .·:;-=+*%#';
  var WORDS = '机械运动参照物速度声音振动音调响度音色超声波次声波熔化凝固汽化液化升华凝华晶体沸点' +
    '光的反射平面镜折射色散凸透镜焦距实像虚像质量密度天平量筒' +
    '反射弧神经元感受器效应器激素胰岛素甲状腺传染源抗体免疫生态系统食物链生物圈' +
    '共顶点手拉手旋转全等等边三角形等腰直角夹角平分线截长补短半角' +
    '动点运动时间速度分类讨论将军饮马对称最短路径垂线段' +
    '疆域人口民族三级阶梯秦岭淮河季风长江黄河青海湖水资源南水北调' + 'GEWUROTATIONSOUNDLIGHTLENSNEURON';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }

  function smooth(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function cssVar(el, name) { return getComputedStyle(el || document.documentElement).getPropertyValue(name).trim(); }

  /* 字符场（湖面涡旋）：几个缓慢漂移的涡旋加一股微弱的水流构成速度场；用 flow map（流动贴图）让噪声纹理沿速度场流动，
     两层纹理交替淡入淡出，看起来像湖面的水纹被一圈圈卷进涡旋里；再叠上细密的波纹和偶尔落下的“雨点”涟漪。
     指针划过时会搅起一个小涡旋和一圈涟漪。亮处显示汉字，中等亮度按水流方向显示 ~ - / \ | 等符号，暗处只有细小的点。 */
  function hash2(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function Field(canvas, opt) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.opt = opt || {};
    this.cell = this.opt.cell || 14;
    this.words = this.opt.words || WORDS;
    this.px = 0.62; this.py = 0.4; this.tx = 0.62; this.ty = 0.4;
    this.energy = 0; this.drops = []; this.lastDrop = 0; this.seed = Math.random() * 50; this.now = 0;
    this.resize();
  }
  Field.prototype.resize = function () {
    var r = this.c.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cw = this.cell; this.ch = Math.round(this.cell * 1.18);
    this.cols = Math.ceil(this.w / this.cw); this.rows = Math.ceil(this.h / this.ch);
  };
  Field.prototype.draw = function (t) {
    var ctx = this.ctx, o = this.opt, cols = this.cols, rows = this.rows, cw = this.cw, ch = this.ch;
    this.now = t;
    this.px += (this.tx - this.px) * 0.08; this.py += (this.ty - this.py) * 0.08;
    this.energy *= 0.965;
    if (o.bg) { ctx.globalAlpha = 1; ctx.fillStyle = o.bg; ctx.fillRect(0, 0, this.w, this.h); } else ctx.clearRect(0, 0, this.w, this.h);
    ctx.font = '500 ' + (cw - 1) + 'px "DM Mono", ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var base = o.alpha || 1, wordAt = o.wordAt || 0.8, words = this.words, wl = words.length;
    var ink = o.ink || '#e8ece9', hot = o.hot || ink, T = t * (o.speed || 1), L = Math.min(this.w, this.h) || 1, aw = this.w / L, ah = this.h / L, sd = this.seed;
    /* 涡旋：[x, y, 环量]，正负交替，缓慢漂移 */
    var V = [
      [aw * (0.26 + 0.07 * Math.sin(T * 0.05 + sd)), ah * (0.36 + 0.1 * Math.cos(T * 0.043 + sd)), 0.16],
      [aw * (0.72 + 0.07 * Math.cos(T * 0.037 + 1.3)), ah * (0.64 + 0.08 * Math.sin(T * 0.05 + 2)), -0.13],
      [aw * (0.5 + 0.12 * Math.sin(T * 0.029 + 4)), ah * (0.1 + 0.06 * Math.cos(T * 0.06)), 0.09]
    ];
    if (this.energy > 0.03) V.push([this.px * aw, this.py * ah, 0.12 * this.energy]);
    /* 雨点涟漪 */
    if (t - this.lastDrop > 1.7 + 1.5 * hash2(Math.floor(t), sd)) { this.lastDrop = t; this.drops.push([Math.random() * aw, Math.random() * ah, t]); }
    this.drops = this.drops.filter(function (d) { return t - d[2] < 3.2; });
    var ph = T * 0.085, f1 = ph - Math.floor(ph), f2 = ph + 0.5 - Math.floor(ph + 0.5), wB = Math.abs(1 - 2 * f1), wA = 1 - wB, DSP = 0.55, NS = 6.5;
    var drops = this.drops, nd = drops.length, nv = V.length;
    for (var j = 0; j < rows; j++) {
      var y = (j + 0.5) * ch / L;
      for (var i = 0; i < cols; i++) {
        var x = (i + 0.5) * cw / L, vx = 0.07, vy = 0.004, core = 0, tdx = 1, tdy = 0, sg = 1, rr = 1;
        for (var q = 0; q < nv; q++) {
          var dx = x - V[q][0], dy = y - V[q][1], r2 = dx * dx + dy * dy, fall = Math.exp(-r2 * 9), g = V[q][2] / (r2 + 0.004) * fall;
          vx -= dy * g; vy += dx * g;
          if (fall > core) { core = fall; tdx = dx; tdy = dy; sg = V[q][2] > 0 ? 1 : -1; rr = Math.sqrt(r2); }
        }
        var sp = Math.sqrt(vx * vx + vy * vy), k2 = 1 / (1 + sp); vx *= k2; vy *= k2;
        /* 水面：横向拉长的噪声，沿流场流动（两层交替） */
        var ax = x - vx * DSP * f1, ay = y - vy * DSP * f1, bx = x - vx * DSP * f2, by = y - vy * DSP * f2;
        var nA = vnoise(ax * NS * 0.55 + sd, ay * NS * 2.4) * 0.7 + vnoise(ax * NS * 1.3 + 5.2, ay * NS * 4.8 + sd) * 0.3;
        var nB = vnoise(bx * NS * 0.55 + 17.3, by * NS * 2.4 + sd) * 0.7 + vnoise(bx * NS * 1.3 + sd, by * NS * 4.8 + 9.1) * 0.3;
        var n = (nA * wA + nB * wB - 0.5) * 1.9 + 0.5, glint = smooth(0.5, 0.95, n);
        /* 涡旋：靠近涡心处出现旋转的螺旋臂 */
        var arm = core > 0.06 ? core * Math.max(0, Math.cos(2 * Math.atan2(tdy, tdx) * sg + 24 * rr - T * 1.3)) : 0;
        var v = glint * 0.9 + arm * 0.6, ring = 0, rx0 = 0, ry0 = 0, rbest = 0;
        for (var m = 0; m < nd; m++) {
          var age = t - drops[m][2], R = age * 0.17, ddx = x - drops[m][0], ddy = (y - drops[m][1]) * 1.6, dd = Math.sqrt(ddx * ddx + ddy * ddy) - R;
          if (dd > -0.08 && dd < 0.04) { var rv = 0.6 * Math.exp(-dd * dd / 0.0003) * Math.exp(-age * 0.85) + 0.2 * Math.max(0, Math.sin(dd * 140)) * Math.exp(-age * 1.1) * (dd < 0 ? 1 : 0); ring += rv; if (rv > rbest) { rbest = rv; rx0 = ddx; ry0 = ddy; } }
        }
        v += ring;
        var a = v * (o.fade === undefined ? 1 : o.fade);
        if (a < 0.16) continue;
        var chr;
        if (a > wordAt && hash2(i * 1.7 + Math.floor(t * 0.7), j * 2.3) < 0.32) { chr = words.charAt((i * 7 + j * 13 + Math.floor(t * 3)) % wl); ctx.fillStyle = hot; }
        else if (arm * 0.6 > glint * 0.7 && core > 0.12 || ring > 0.3) {
          /* 涡旋臂和涟漪：沿切线方向的笔画 */
          var tg = ((Math.atan2(ring > 0.3 ? ry0 : tdy, ring > 0.3 ? rx0 : tdx) * 180 / Math.PI) + 90 + 360) % 180;
          chr = tg < 22.5 || tg >= 157.5 ? '-' : tg < 67.5 ? '\\' : tg < 112.5 ? '|' : '/';
          ctx.fillStyle = ink;
        } else { chr = a < 0.3 ? '.' : a < 0.5 ? '-' : a < 0.82 ? '~' : '='; ctx.fillStyle = ink; }
        ctx.globalAlpha = Math.min(1, a * base);
        ctx.fillText(chr, i * cw + cw / 2, j * ch + ch / 2);
      }
    }
    ctx.globalAlpha = 1;
  };
  Field.prototype.point = function (cx, cy) {
    var r = this.c.getBoundingClientRect();
    var nx = (cx - r.left) / r.width, ny = (cy - r.top) / r.height;
    if (Math.abs(nx - this.tx) + Math.abs(ny - this.ty) > 0.004) {
      this.energy = Math.min(1, this.energy + 0.25);
      var L = Math.min(this.w, this.h) || 1;
      if (this.now - this.lastDrop > 0.45 && nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) { this.lastDrop = this.now; this.drops.push([nx * this.w / L, ny * this.h / L, this.now]); }
    }
    this.tx = nx; this.ty = ny;
  };

  /* 通用动画循环：限帧、离屏/后台暂停、减少动态效果时只画一帧 */
  function runner(field, fps, colorsFn, el) {
    var raf = 0, last = 0, t0 = performance.now(), frames = 0, visible = true, obs = null;
    if (colorsFn) colorsFn();
    if ('IntersectionObserver' in window && el) {
      obs = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; });
      obs.observe(el);
    }
    if (reduce) { field.draw(3); return { stop: function () { if (obs) obs.disconnect(); } }; }
    (function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden || now - last < 1000 / fps) return;
      last = now;
      if (colorsFn && ++frames % 45 === 0) colorsFn();
      field.draw((now - t0) / 1000);
    })(t0);
    return { stop: function () { cancelAnimationFrame(raf); if (obs) obs.disconnect(); } };
  }

  /* ---------- 开场：由 js/intro-gl.js 提供（WebGL 字符影片），不支持时用 js/intro.js 的 2D 版 ---------- */
  function intro(force) { if (window.GEWU_INTRO) window.GEWU_INTRO(force); }

  /* ---------- 全站背景字符场 ---------- */
  var bg = null;
  function mountBg(canvas) {
    if (!canvas) return;
    var f = new Field(canvas, { cell: window.innerWidth < 600 ? 15 : 17, alpha: 0.34, lo: -1.2, hi: 2.6, wordAt: 0.94, speed: 0.6 });
    bg = f;
    window.addEventListener('pointermove', function (e) { f.point(e.clientX, e.clientY); }, { passive: true });
    runner(f, 20, function () { f.opt.ink = cssVar(null, '--field-ink') || '#666'; f.opt.hot = cssVar(null, '--field-hot') || '#aaa'; });
  }

  /* ---------- 页面头部字符场（一次只有一个） ---------- */
  var page = null;
  function mountPage(canvas, opts) {
    unmountPage();
    if (!canvas) return;
    opts = opts || {};
    var f = new Field(canvas, { cell: window.innerWidth < 600 ? 12 : 14, alpha: opts.alpha || 0.62, lo: -1.7, hi: 2.2, wordAt: opts.wordAt || 0.88, words: opts.words });
    var host = canvas.parentElement;
    host.addEventListener('pointermove', function (e) { f.point(e.clientX, e.clientY); });
    var r = runner(f, 30, function () {
      f.opt.ink = cssVar(null, '--muted') || '#888';
      f.opt.hot = (opts.hotVar && cssVar(host, opts.hotVar)) || cssVar(null, '--ink') || '#ddd';
    }, canvas);
    page = { f: f, r: r };
  }
  function unmountPage() { if (page) { page.r.stop(); page = null; } }
  window.addEventListener('resize', function () { if (page) page.f.resize(); if (bg) bg.resize(); });

  /* ---------- 文字解码：保留 HTML 结构，只打乱文本节点 ---------- */
  function scramble(el, dur) {
    if (!el || reduce) return;
    var nodes = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push({ n: walker.currentNode, v: walker.currentNode.nodeValue });
    var total = nodes.reduce(function (s, x) { return s + x.v.length; }, 0);
    if (!total) return;
    var start = performance.now(), D = dur || Math.min(1100, 420 + total * 40);
    (function step(now) {
      if (!el.isConnected) return;
      var p = Math.min(1, (now - start) / D), shown = Math.floor(p * (total + 3)), k = 0;
      nodes.forEach(function (x) {
        var out = '';
        for (var i = 0; i < x.v.length; i++, k++) {
          var c = x.v[i];
          out += (k < shown || c === ' ' || c === '\n') ? c : WORDS.charAt(Math.floor(Math.random() * WORDS.length));
        }
        x.n.nodeValue = out;
      });
      if (p < 1) requestAnimationFrame(step); else nodes.forEach(function (x) { x.n.nodeValue = x.v; });
    })(start);
  }

  /* ---------- 液态玻璃：指针位置驱动的高光 ---------- */
  var GLASS = '.glass, .sheet, .subj, details.chapter, .qcard, .flash, .tip, .ch-row, .opt, .result, .count > div, .btn, .board, .ex-index a';
  var pending = null;
  document.addEventListener('pointermove', function (e) {
    var g = e.target.closest && e.target.closest(GLASS);
    if (!g) return;
    var queued = !!pending;
    pending = { g: g, x: e.clientX, y: e.clientY };
    if (queued) return;
    requestAnimationFrame(function () {
      if (!pending) return;
      var r = pending.g.getBoundingClientRect();
      pending.g.style.setProperty('--mx', (pending.x - r.left) + 'px');
      pending.g.style.setProperty('--my', (pending.y - r.top) + 'px');
      pending = null;
    });
  }, { passive: true });

  return { intro: intro, mountBg: mountBg, mountPage: mountPage, unmountPage: unmountPage, mountHero: function (c) { mountPage(c, { alpha: 0.62, wordAt: 0.9 }); }, unmountHero: unmountPage, scramble: scramble, reduce: reduce };
})();
