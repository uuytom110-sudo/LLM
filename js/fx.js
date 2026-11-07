/* 字符流动效果：开场、全站背景字符场、页面头部字符场、文字解码、液态玻璃高光。纯 Canvas / CSS，无依赖。 */
window.GEWU_FX = (function () {
  'use strict';
  var RAMP = ' .·:;-=+*%#';
  var WORDS = '机械运动参照物速度声音振动音调响度音色超声波次声波熔化凝固汽化液化升华凝华晶体沸点' +
    '光的反射平面镜折射色散凸透镜焦距实像虚像质量密度天平量筒' +
    '反射弧神经元感受器效应器激素胰岛素甲状腺传染源抗体免疫生态系统食物链生物圈' +
    '共顶点手拉手旋转全等等边三角形等腰直角夹角平分线截长补短半角' + 'GEWUROTATIONSOUNDLIGHTLENSNEURON';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }

  function smooth(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function cssVar(el, name) { return getComputedStyle(el || document.documentElement).getPropertyValue(name).trim(); }

  /* 字符场：叠加的波决定每个格子的亮度；亮处显示汉字/字母，暗处显示 ASCII 符号 */
  function Field(canvas, opt) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.opt = opt || {};
    this.cell = this.opt.cell || 14;
    this.words = this.opt.words || WORDS;
    this.px = 0.62; this.py = 0.4; this.tx = 0.62; this.ty = 0.4;
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
    this.px += (this.tx - this.px) * 0.05; this.py += (this.ty - this.py) * 0.05;
    var ox = this.px * cols, oy = this.py * rows;
    if (o.bg) { ctx.globalAlpha = 1; ctx.fillStyle = o.bg; ctx.fillRect(0, 0, this.w, this.h); } else ctx.clearRect(0, 0, this.w, this.h);
    ctx.font = '500 ' + (cw - 1) + 'px "DM Mono", ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var base = o.alpha || 1, fade = o.fade === undefined ? 1 : o.fade;
    var lo = o.lo === undefined ? -0.9 : o.lo, hi = o.hi === undefined ? 2.4 : o.hi, wordAt = o.wordAt || 0.8;
    var words = this.words, wl = words.length;
    var ink = o.ink || '#e8ece9', hot = o.hot || ink, sp = o.speed || 1;
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var dx = i - ox, dy = (j - oy) * 1.5, d = Math.sqrt(dx * dx + dy * dy);
        var v = Math.sin(i * 0.11 + t * 0.8 * sp) * 0.6 + Math.sin(j * 0.19 - t * 0.55 * sp) * 0.6 +
          Math.sin((i * 0.6 + j) * 0.085 + t * 0.35 * sp) + Math.sin(d * 0.3 - t * 2.0 * sp) * 0.85;
        var n = smooth(lo, hi, v) * fade;
        if (n < 0.1) continue;
        var chr;
        if (n > wordAt) { chr = words.charAt((i * 7 + j * 13 + Math.floor(t * 4)) % wl); ctx.fillStyle = hot; }
        else { chr = RAMP.charAt(Math.min(RAMP.length - 1, Math.floor(n * RAMP.length))); ctx.fillStyle = ink; }
        ctx.globalAlpha = Math.min(1, n * base);
        ctx.fillText(chr, i * cw + cw / 2, j * ch + ch / 2);
      }
    }
    ctx.globalAlpha = 1;
  };
  Field.prototype.point = function (cx, cy) {
    var r = this.c.getBoundingClientRect();
    this.tx = (cx - r.left) / r.width; this.ty = (cy - r.top) / r.height;
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
