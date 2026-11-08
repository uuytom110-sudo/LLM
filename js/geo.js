/* 几何：作图辅助（GEWU_G）、SVG 图形渲染、手拉手模型“动手旋转”实验台、例题（题型研究）渲染。
   坐标一律用数学坐标（y 轴向上），渲染时再翻转。必须在 data/*.js 之前加载（数据里的图形坐标用它来算）。 */
window.GEWU_G = (function () {
  'use strict';
  var D2R = Math.PI / 180;
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k]; }
  function len(a) { return Math.hypot(a[0], a[1]); }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function unit(a) { var l = len(a) || 1; return [a[0] / l, a[1] / l]; }
  function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  /* 绕 o 逆时针旋转 deg 度 */
  function rot(p, o, deg) {
    var r = deg * D2R, c = Math.cos(r), s = Math.sin(r), dx = p[0] - o[0], dy = p[1] - o[1];
    return [o[0] + c * dx - s * dy, o[1] + s * dx + c * dy];
  }
  function polar(o, r, deg) { return [o[0] + r * Math.cos(deg * D2R), o[1] + r * Math.sin(deg * D2R)]; }
  function on(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function mid(a, b) { return on(a, b, 0.5); }
  /* 直线 ab 与直线 cd 的交点（平行时返回 null） */
  function inter(a, b, c, d) {
    var r = sub(b, a), s = sub(d, c), den = cross(r, s);
    if (Math.abs(den) < 1e-9) return null;
    var t = cross(sub(c, a), s) / den;
    return add(a, mul(r, t));
  }
  /* 在线段 ab 上作等边三角形，第三个顶点与 away 位于 ab 的两侧 */
  function eqOut(a, b, away) {
    var p1 = rot(b, a, 60), p2 = rot(b, a, -60);
    return Math.sign(cross(sub(b, a), sub(p1, a))) !== Math.sign(cross(sub(b, a), sub(away, a))) ? p1 : p2;
  }
  /* 以 ab 为边向外（远离 away）作正方形，返回 [b 的邻点, a 的邻点]：正方形依次为 a、b、返回值[0]、返回值[1] */
  function sqOut(a, b, away) {
    var n = [-(b[1] - a[1]), b[0] - a[0]];
    if (Math.sign(cross(sub(b, a), n)) === Math.sign(cross(sub(b, a), sub(away, a)))) n = mul(n, -1);
    return [add(b, n), add(a, n)];
  }
  /* ∠aob 的度数（0~180） */
  function angle(a, o, b) {
    var u = sub(a, o), v = sub(b, o);
    var c = dot(u, v) / ((len(u) * len(v)) || 1);
    return Math.acos(Math.max(-1, Math.min(1, c))) / D2R;
  }
  /* 射线 a→b 上，过 b 再延长 l 的点 */
  function ext(a, b, l) { return add(b, mul(unit(sub(b, a)), l)); }
  /* 点 p 到直线 ab 的垂足 */
  function foot(p, a, b) { var r = sub(b, a), t = dot(sub(p, a), r) / (dot(r, r) || 1); return add(a, mul(r, t)); }
  /* 在 [lo, hi] 上找 f 的零点（二分 + 粗扫） */
  function solve(f, lo, hi) {
    var n = 720, prev = f(lo), x0 = lo;
    for (var i = 1; i <= n; i++) {
      var x = lo + (hi - lo) * i / n, v = f(x);
      if (prev === 0) return x0;
      if (prev * v < 0) {
        var a = x0, b = x;
        for (var k = 0; k < 60; k++) { var m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; }
        return (a + b) / 2;
      }
      prev = v; x0 = x;
    }
    return null;
  }
  return { add: add, sub: sub, mul: mul, len: len, dist: dist, unit: unit, cross: cross, dot: dot, rot: rot, polar: polar, on: on, mid: mid, inter: inter, eqOut: eqOut, sqOut: sqOut, angle: angle, ext: ext, foot: foot, solve: solve };
})();

window.GEWU_GEO = (function () {
  'use strict';
  var G = window.GEWU_G;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* 字符示意图：按“汉字和全角标点占 2 格、其余占 1 格”的网格排版（和书写时的对齐方式一致），
     每个非 ASCII 字符放进固定宽度（2ch / 1ch）的格子里，不受字体回退影响；--cols 用来在窄屏上缩小字号 */
  var WIDE = /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6\u201C\u201D\u2018\u2019]/;
  function monoPre(str, cls) {
    var cols = 0;
    var body = String(str).replace(/^\n/, '').split('\n').map(function (line) {
      var w = 0, out = '';
      Array.from(line).forEach(function (ch) {
        if (ch.charCodeAt(0) < 128) { out += esc(ch); w += 1; }
        else if (WIDE.test(ch)) { out += '<i class="w2">' + ch + '</i>'; w += 2; }
        else { out += '<i class="w1">' + esc(ch) + '</i>'; w += 1; }
      });
      cols = Math.max(cols, w);
      return out;
    }).join('\n');
    return '<pre class="' + (cls || 'diagram') + '" style="--cols:' + cols + '">' + body + '</pre>';
  }
  function f1(x) { return (Math.round(x * 10) / 10).toFixed(1); }

  /* ---------- 静态图形 ----------
     spec = {
       pts:   { A: [x, y], ... }              点（数学坐标）
       polys: ['ABC', 'ADE:soft']             多边形（:fa / :fb 为全等三角形填色，:soft 为淡填充）
       cong:  ['ABD:fa', 'ACE:fb']            全等三角形高亮（点「标出全等三角形」后才显示）
       segs:  ['BD:hl', 'CE:hl2', 'AF:dash']  线段（hl 主色，hl2 琥珀色，dash 虚线辅助线）
       ang:   ['BFC:60°']                     角的弧线标记（中间字母为顶点），冒号后为标注文字
       right: ['BFC']                         直角标记
       ticks: ['AB1', 'AC1', 'AD2']           相等线段的短线标记（数字为短线条数）
       dots:  ['F']                           实心点
       hide:  ['O']                           不标字母的点
       lab:   { F: 'n' }                      字母位置（n/s/e/w/ne/nw/se/sw）
     } */
  var DIRS = { n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0], ne: [0.71, 0.71], nw: [-0.71, 0.71], se: [0.71, -0.71], sw: [-0.71, -0.71] };
  function parse(str) { var i = str.indexOf(':'); return i < 0 ? { v: str, c: '' } : { v: str.slice(0, i), c: str.slice(i + 1) }; }

  function figure(spec, opt) {
    opt = opt || {};
    var pts = spec.pts, keys = Object.keys(pts);
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    keys.forEach(function (k) { var p = pts[k]; minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    var pad = 26, W = opt.w || 340, maxH = opt.h || 280;
    var sc = (W - 2 * pad) / Math.max(1e-6, maxX - minX);
    if ((maxY - minY) * sc + 2 * pad > maxH) { sc = (maxH - 2 * pad) / Math.max(1e-6, maxY - minY); W = (maxX - minX) * sc + 2 * pad; }
    var H = (maxY - minY) * sc + 2 * pad;
    function X(p) { return pad + (p[0] - minX) * sc; }
    function Y(p) { return pad + (maxY - p[1]) * sc; }
    function xy(p) { return X(p).toFixed(1) + ' ' + Y(p).toFixed(1); }
    function P(name) { var p = pts[name]; if (!p) throw new Error('figure: 没有点 ' + name); return p; }
    var nb = {};
    function link(a, b) { (nb[a] = nb[a] || []).push(b); (nb[b] = nb[b] || []).push(a); }
    var out = [];
    /* 全等填色（默认隐藏） */
    (spec.cong || []).forEach(function (s) {
      var o = parse(s), d = o.v.split('').map(function (n) { return xy(P(n)); });
      out.push('<path class="cong ' + (o.c || 'fa') + '" d="M' + d.join(' L') + ' Z"/>');
    });
    (spec.polys || []).forEach(function (s) {
      var o = parse(s), v = o.v.split('');
      out.push('<path class="poly ' + o.c + '" d="M' + v.map(function (n) { return xy(P(n)); }).join(' L') + ' Z"/>');
      v.forEach(function (n, i) { link(n, v[(i + 1) % v.length]); });
    });
    (spec.segs || []).forEach(function (s) {
      var o = parse(s), a = o.v[0], b = o.v[1];
      out.push('<path class="seg ' + o.c + '" d="M' + xy(P(a)) + ' L' + xy(P(b)) + '"/>');
      link(a, b);
    });
    (spec.right || []).forEach(function (s) {
      var v = parse(s).v, o = P(v[1]), u1 = G.unit(G.sub(P(v[0]), o)), u2 = G.unit(G.sub(P(v[2]), o)), k = 9 / sc;
      var a = G.add(o, G.mul(u1, k)), b = G.add(G.add(o, G.mul(u1, k)), G.mul(u2, k)), c = G.add(o, G.mul(u2, k));
      out.push('<path class="mark" d="M' + xy(a) + ' L' + xy(b) + ' L' + xy(c) + '"/>');
    });
    (spec.ang || []).forEach(function (s) {
      var o = parse(s), v = o.v, O = P(v[1]), A = P(v[0]), B = P(v[2]);
      var r = (o.c && o.c.indexOf('|') > -1 ? +o.c.split('|')[1] : 15), txt = o.c ? o.c.split('|')[0] : '';
      var a1 = Math.atan2(A[1] - O[1], A[0] - O[0]), a2 = Math.atan2(B[1] - O[1], B[0] - O[0]);
      var d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      var rr = r / sc, p1 = [O[0] + rr * Math.cos(a1), O[1] + rr * Math.sin(a1)], p2 = [O[0] + rr * Math.cos(a1 + d), O[1] + rr * Math.sin(a1 + d)];
      out.push('<path class="arc" d="M' + xy(p1) + ' A' + r + ' ' + r + ' 0 0 ' + (d > 0 ? 0 : 1) + ' ' + xy(p2) + '"/>');
      if (txt) { var am = a1 + d / 2, tp = [O[0] + (rr + 13 / sc) * Math.cos(am), O[1] + (rr + 13 / sc) * Math.sin(am)]; out.push('<text class="atxt" x="' + X(tp).toFixed(1) + '" y="' + (Y(tp) + 4).toFixed(1) + '" text-anchor="middle">' + esc(txt) + '</text>'); }
    });
    (spec.ticks || []).forEach(function (s) {
      var a = P(s[0]), b = P(s[1]), n = +s.slice(2) || 1, m = G.mid(a, b), u = G.unit(G.sub(b, a)), nr = [-u[1], u[0]];
      for (var i = 0; i < n; i++) {
        var c = G.add(m, G.mul(u, (i - (n - 1) / 2) * 4.5 / sc));
        out.push('<path class="tick" d="M' + xy(G.add(c, G.mul(nr, 5 / sc))) + ' L' + xy(G.sub(c, G.mul(nr, 5 / sc))) + '"/>');
      }
    });
    var cx = 0, cy = 0; keys.forEach(function (k) { cx += pts[k][0]; cy += pts[k][1]; }); cx /= keys.length; cy /= keys.length;
    (spec.dots || []).forEach(function (n) { out.push('<circle class="dot" cx="' + X(P(n)).toFixed(1) + '" cy="' + Y(P(n)).toFixed(1) + '" r="2.6"/>'); });
    var hide = spec.hide || [];
    keys.forEach(function (k) {
      if (hide.indexOf(k) > -1) return;
      var p = pts[k], dir;
      if (spec.lab && spec.lab[k]) dir = DIRS[spec.lab[k]];
      else {
        var sx = 0, sy = 0;
        (nb[k] || []).forEach(function (n) { if (n === k) return; var u = G.unit(G.sub(pts[n], p)); sx += u[0]; sy += u[1]; });
        if (Math.hypot(sx, sy) < 0.35) { sx = cx - p[0]; sy = cy - p[1]; }
        dir = G.unit([-sx, -sy]);
        if (!isFinite(dir[0])) dir = [0, 1];
      }
      var lx = X(p) + dir[0] * 12, ly = Y(p) - dir[1] * 12 + 5;
      out.push('<text class="pl" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle">' + esc((spec.names && spec.names[k]) || k) + '</text>');
    });
    return '<svg class="geo-svg" viewBox="0 0 ' + Math.round(W) + ' ' + Math.round(H) + '" style="max-width:' + Math.round(W) + 'px" role="img" aria-label="' + esc(opt.label || '几何图形') + '">' + out.join('') + '</svg>';
  }

  /* ---------- 动手旋转：共顶点旋转全等实验台 ---------- */
  var MODES = [
    { id: 'eq', name: '等边三角形', a: 60, LB: 2.3, LS: 1.15 },
    { id: 'rt', name: '等腰直角三角形', a: 90, LB: 2.25, LS: 1.15 },
    { id: 'sq', name: '正方形', a: 90, LB: 1.7, LS: 0.9, sq: true },
    { id: 'any', name: '任意顶角', a: 40, LB: 2.3, LS: 1.15 }
  ];
  var lab = { mode: 'eq', alpha: 40, theta: 322, show: { cong: true, ang: true, bis: false, path: false }, play: false };

  function labGeom() {
    var m = MODES.filter(function (x) { return x.id === lab.mode; })[0];
    var a = m.id === 'any' ? lab.alpha : m.a;
    var A = [0, m.sq ? 0.55 : 0.5], b0 = 270 - a / 2;
    var B = G.polar(A, m.LB, b0), C = G.polar(A, m.LB, b0 + a);
    var D = G.polar(A, m.LS, b0 + lab.theta), E = G.polar(A, m.LS, b0 + lab.theta + a);
    var g = { m: m, a: a, A: A, B: B, C: C, D: D, E: E, k: 4 / m.LB };
    if (m.sq) { g.P = G.add(B, G.sub(C, A)); g.Q = G.add(D, G.sub(E, A)); }
    g.F = G.inter(B, D, C, E);
    return g;
  }
  /* 找出被 FA 平分的那个角：一条射线取自直线 BD，另一条取自直线 CE；射线方向上若有端点就用端点命名，否则记为“延长线” */
  function bisected(g) {
    var F = g.F; if (!F || G.dist(F, g.A) < 1e-6) return null;
    function rays(P, Q, nP, nQ) {
      var u = G.unit(G.sub(Q, P)), out = [];
      [u, G.mul(u, -1)].forEach(function (d) {
        var name = null;
        [[P, nP], [Q, nQ]].forEach(function (x) { var v = G.sub(x[0], F); if (G.len(v) > 1e-4 && G.dot(v, d) > 0 && !name) name = x[1]; });
        out.push({ d: d, n: name });
      });
      return out;
    }
    var best = null, ua = G.unit(G.sub(g.A, F));
    rays(g.B, g.D, 'B', 'D').forEach(function (r1) {
      rays(g.C, g.E, 'C', 'E').forEach(function (r2) {
        function ang(u, v) { return Math.acos(Math.max(-1, Math.min(1, G.dot(u, v)))) * 180 / Math.PI; }
        var x = ang(r1.d, ua), y = ang(r2.d, ua), z = ang(r1.d, r2.d), err = Math.abs(x - y) + Math.abs(x + y - z);
        if (!best || err < best.err) best = { err: err, n1: r1.n, n2: r2.n, x: x, y: y, z: z };
      });
    });
    return best && best.err < 0.5 ? best : null;
  }
  function labSVG(g) {
    var W = 360, H = 320, sc = 68, cx = 180, cy = 168;
    function X(p) { return (cx + p[0] * sc).toFixed(1); }
    function Y(p) { return (cy - p[1] * sc).toFixed(1); }
    function xy(p) { return X(p) + ' ' + Y(p); }
    function poly(list, cls) { return '<path class="' + cls + '" d="M' + list.map(xy).join(' L') + ' Z"/>'; }
    function line(p, q, cls) { return '<path class="' + cls + '" d="M' + xy(p) + ' L' + xy(q) + '"/>'; }
    function lab1(p, txt, dir, cls) { return '<text class="pl ' + (cls || '') + '" x="' + (cx + p[0] * sc + dir[0] * 13).toFixed(1) + '" y="' + (cy - p[1] * sc - dir[1] * 13 + 5).toFixed(1) + '" text-anchor="middle">' + txt + '</text>'; }
    function away(p, from) { var u = G.unit(G.sub(p, from)); return isFinite(u[0]) ? u : [0, 1]; }
    var o = [];
    if (lab.show.path) o.push('<circle class="path" cx="' + X(g.A) + '" cy="' + Y(g.A) + '" r="' + (g.m.LS * sc).toFixed(1) + '"/>');
    if (lab.show.cong) { o.push(poly([g.A, g.B, g.D], 'cong fa on')); o.push(poly([g.A, g.C, g.E], 'cong fb on')); }
    if (g.m.sq) { o.push(poly([g.A, g.B, g.P, g.C], 'poly')); o.push(poly([g.A, g.D, g.Q, g.E], 'poly soft')); }
    else { o.push(poly([g.A, g.B, g.C], 'poly')); o.push(poly([g.A, g.D, g.E], 'poly soft')); }
    /* 拉手线：画到交点 F（若在线段外，延长部分用虚线） */
    function handLine(p, q, cls) {
      o.push(line(p, q, 'seg ' + cls));
      if (!g.F) return;
      var t = G.dot(G.sub(g.F, p), G.sub(q, p)) / G.dot(G.sub(q, p), G.sub(q, p));
      if (t > 1.001) o.push(line(q, g.F, 'seg dash ' + cls));
      else if (t < -0.001) o.push(line(p, g.F, 'seg dash ' + cls));
    }
    handLine(g.B, g.D, 'hl'); handLine(g.C, g.E, 'hl2');
    var inView = g.F && Math.abs(g.F[0]) < 2.6 && Math.abs(g.F[1] - 0.15) < 2.4;
    if (inView && lab.show.ang) {
      var r = 18, F = g.F, a1 = Math.atan2(g.B[1] - F[1], g.B[0] - F[0]), a2 = Math.atan2(g.C[1] - F[1], g.C[0] - F[0]);
      if (G.dist(g.B, F) > 1e-3 && G.dist(g.C, F) > 1e-3) {
        var d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        var p1 = [F[0] + r / sc * Math.cos(a1), F[1] + r / sc * Math.sin(a1)], p2 = [F[0] + r / sc * Math.cos(a1 + d), F[1] + r / sc * Math.sin(a1 + d)];
        o.push('<path class="arc hot" d="M' + xy(p1) + ' A' + r + ' ' + r + ' 0 0 ' + (d > 0 ? 0 : 1) + ' ' + xy(p2) + '"/>');
      }
    }
    var bi = inView && lab.show.bis ? bisected(g) : null;
    if (bi) o.push(line(g.A, g.F, 'seg dash bis'));
    /* α 弧 */
    (function () {
      var r = 22, a1 = (270 - g.a / 2) * Math.PI / 180, a2 = a1 + g.a * Math.PI / 180, A = g.A;
      var p1 = [A[0] + r / sc * Math.cos(a1), A[1] + r / sc * Math.sin(a1)], p2 = [A[0] + r / sc * Math.cos(a2), A[1] + r / sc * Math.sin(a2)];
      o.push('<path class="arc" d="M' + xy(p1) + ' A' + r + ' ' + r + ' 0 0 0 ' + xy(p2) + '"/>');
      var am = (a1 + a2) / 2, tp = [A[0] + (r + 12) / sc * Math.cos(am), A[1] + (r + 12) / sc * Math.sin(am)];
      o.push('<text class="atxt" x="' + X(tp) + '" y="' + (+Y(tp) + 4) + '" text-anchor="middle">α</text>');
    })();
    var cen = g.A, coin = '';
    if (inView) [['B', g.B], ['C', g.C], ['D', g.D], ['E', g.E]].forEach(function (x) { if (G.dist(x[1], g.F) < 1e-3) coin = x[0]; });
    function nm(n) { return n === coin ? n + '(F)' : n; }
    o.push(lab1(g.A, 'A', [0, 1]));
    o.push(lab1(g.B, nm('B'), away(g.B, G.mid(g.A, g.C))));
    o.push(lab1(g.C, nm('C'), away(g.C, G.mid(g.A, g.B))));
    o.push(lab1(g.D, nm('D'), away(g.D, G.mid(cen, g.E))));
    o.push(lab1(g.E, nm('E'), away(g.E, G.mid(cen, g.D))));
    if (g.m.sq) { o.push(lab1(g.P, 'P', away(g.P, g.A))); o.push(lab1(g.Q, 'Q', away(g.Q, g.A))); }
    if (inView) {
      o.push('<circle class="dot hot" cx="' + X(g.F) + '" cy="' + Y(g.F) + '" r="3.4"/>');
      var near = null, nd = 9;
      [g.A, g.B, g.C, g.D, g.E].forEach(function (p) { var d = G.dist(p, g.F); if (d < nd) { nd = d; near = p; } });
      var fdir = nd < 0.45 ? (nd < 1e-3 ? G.unit(G.sub(g.F, g.A)) : G.unit(G.sub(g.F, near))) : [0.7, -0.7];
      if (nd < 0.2) fdir = G.unit([fdir[0] - fdir[1] * 0.9, fdir[1] + fdir[0] * 0.9]);
      if (!coin) o.push(lab1(g.F, 'F', fdir, 'hot'));
    }
    [g.D, g.E].forEach(function (p) { o.push('<circle class="grip" cx="' + X(p) + '" cy="' + Y(p) + '" r="9"/>'); });
    return '<svg class="geo-svg lab-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="可拖动旋转的手拉手模型">' + o.join('') + '</svg>';
  }
  function labRead(g) {
    var BD = G.dist(g.B, g.D) * g.k, CE = G.dist(g.C, g.E) * g.k, rows = [];
    rows.push(['α = ∠BAC = ∠DAE', g.a.toFixed(0) + '°']);
    rows.push(['BD', f1(BD)], ['CE', f1(CE)]);
    if (g.F && G.dist(g.F, g.B) > 1e-3 && G.dist(g.F, g.C) > 1e-3) {
      var bfc = G.angle(g.B, g.F, g.C);
      rows.push(['∠BFC', f1(bfc) + '°']);
      rows.push(['BD 与 CE 所夹锐角（或直角）', f1(Math.min(bfc, 180 - bfc)) + '°']);
    }
    var bi = bisected(g);
    var html = '<dl class="readout">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd class="mono">' + r[1] + '</dd></div>'; }).join('') + '</dl>';
    html += '<ol class="concl">' +
      '<li><b>△ABD ≌ △ACE</b>（SAS）：AB = AC，AD = AE，∠BAD = ∠CAE（∠BAC 与 ∠DAE 同时加上或减去同一个角）。</li>' +
      '<li><b>BD = CE</b>：现在 BD = ' + f1(BD) + '，CE = ' + f1(CE) + '。</li>' +
      '<li><b>BD 与 CE 的夹角 = α</b>（或它的补角 180° − α），现在 α = ' + g.a.toFixed(0) + '°' + (g.m.id === 'rt' || g.m.sq ? '，所以 <b>BD ⊥ CE</b>' : '') + '。</li>' +
      (bi ? '<li><b>FA 平分' + (bi.n1 && bi.n2 ? ' ∠' + bi.n1 + 'F' + bi.n2 : '两条拉手线所成的含点 A 的角') + '</b>（' + f1(bi.z) + '°）：两边各 ' + f1(bi.x) + '°。理由：全等三角形对应边上的高相等 → A 到两条拉手线距离相等。</li>' : '<li>FA 平分两条拉手线所成的一个角（F 与 A 重合等特殊位置除外）。</li>') +
      '</ol>';
    return html;
  }
  function renderLab(el) {
    var g = labGeom();
    var html = '<section class="sheet stack lab">' +
      '<div class="sec-head"><h3>拖动小图形，看结论是否始终成立</h3><span class="muted small">在图上按住拖动，或用下方滑块</span></div>' +
      '<div class="chips">' + MODES.map(function (m) { return '<button type="button" class="chip' + (lab.mode === m.id ? ' on' : '') + '" data-g="mode" data-v="' + m.id + '">' + m.name + '</button>'; }).join('') + '</div>' +
      '<div class="lab-grid"><div class="lab-fig" id="lab-fig">' + labSVG(g) + '</div><div class="lab-side" id="lab-read">' + labRead(g) + '</div></div>' +
      '<label class="slider"><span>旋转角 θ</span><input type="range" min="0" max="360" step="1" value="' + Math.round(lab.theta) + '" data-g="theta"><b class="mono" id="theta-v">' + Math.round(lab.theta) + '°</b></label>' +
      (lab.mode === 'any' ? '<label class="slider"><span>顶角 α</span><input type="range" min="20" max="150" step="1" value="' + lab.alpha + '" data-g="alpha"><b class="mono" id="alpha-v">' + lab.alpha + '°</b></label>' : '') +
      '<div class="row">' +
      '<button type="button" class="btn sm' + (lab.play ? ' primary' : '') + '" data-g="play">' + (lab.play ? '暂停' : '自动旋转') + '</button>' +
      '<button type="button" class="btn sm" data-g="preset" data-v="0">特殊位置：D 在 AB 上</button>' +
      '<button type="button" class="btn sm" data-g="preset" data-v="line">B、D、E 共线</button>' +
      '<button type="button" class="btn sm" data-g="preset" data-v="180">D 在 BA 延长线上</button>' +
      '</div><div class="chips">' +
      [['cong', '全等三角形'], ['ang', '∠BFC'], ['bis', 'FA 平分线'], ['path', 'D、E 的轨迹']].map(function (t) {
        return '<button type="button" class="chip' + (lab.show[t[0]] ? ' on' : '') + '" data-g="show" data-v="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +
      '<p class="muted small">图中<span class="sw fa"></span>△ABD 与<span class="sw fb"></span>△ACE 始终全等：把 △ABD 绕点 A 旋转 α，正好与 △ACE 重合。</p>' +
      '</section>';
    el.innerHTML = html;
    bindLab(el);
  }
  function refresh(el) {
    var g = labGeom();
    var f = el.querySelector('#lab-fig'), r = el.querySelector('#lab-read');
    if (f) f.innerHTML = labSVG(g);
    if (r) r.innerHTML = labRead(g);
    var tv = el.querySelector('#theta-v'), ti = el.querySelector('[data-g="theta"]');
    if (tv) tv.textContent = Math.round(lab.theta) + '°';
    if (ti && document.activeElement !== ti) ti.value = Math.round(lab.theta);
  }
  var rafId = 0;
  function bindLab(el) {
    var root = el.querySelector('.lab');
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-g]'); if (!b) return;
      var k = b.getAttribute('data-g'), v = b.getAttribute('data-v');
      if (k === 'mode') { lab.mode = v; renderLab(el); }
      else if (k === 'show') { lab.show[v] = !lab.show[v]; renderLab(el); }
      else if (k === 'play') { lab.play = !lab.play; renderLab(el); if (lab.play) loop(el); }
      else if (k === 'preset') {
        lab.play = false;
        if (v === 'line') {
          var keep = lab.theta;
          var th = G.solve(function (x) { lab.theta = x; var g = labGeom(); return G.cross(G.sub(g.D, g.B), G.sub(g.E, g.B)); }, 1, 179);
          lab.theta = th === null ? keep : th;
        } else lab.theta = +v;
        renderLab(el);
      }
    });
    root.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-g');
      if (k === 'theta') { lab.theta = +e.target.value; refresh(el); }
      if (k === 'alpha') { lab.alpha = +e.target.value; var av = el.querySelector('#alpha-v'); if (av) av.textContent = lab.alpha + '°'; refresh(el); }
    });
    var fig = el.querySelector('#lab-fig'), drag = null;
    function ang(e) {
      var svg = fig.querySelector('svg'), r = svg.getBoundingClientRect(), s = r.width / 360, g = labGeom();
      var x = (e.clientX - r.left) / s, y = (e.clientY - r.top) / s;
      return Math.atan2(-(y - (168 - g.A[1] * 68)), x - (180 + g.A[0] * 68)) * 180 / Math.PI;
    }
    fig.addEventListener('pointerdown', function (e) { drag = { a: ang(e), t: lab.theta }; lab.play = false; fig.setPointerCapture(e.pointerId); e.preventDefault(); });
    fig.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var d = ang(e) - drag.a; lab.theta = ((drag.t + d) % 360 + 360) % 360; refresh(el);
    });
    function end() { if (drag) { drag = null; var pb = el.querySelector('[data-g="play"]'); if (pb) { pb.textContent = '自动旋转'; pb.classList.remove('primary'); } } }
    fig.addEventListener('pointerup', end); fig.addEventListener('pointercancel', end);
    if (lab.play) loop(el);
  }
  function loop(el) {
    cancelAnimationFrame(rafId);
    var last = performance.now();
    (function step(now) {
      if (!lab.play || !el.isConnected || !el.querySelector('.lab')) { lab.play = lab.play && el.isConnected && !!el.querySelector('.lab'); return; }
      lab.theta = (lab.theta + (now - last) * 0.03) % 360; last = now;
      refresh(el);
      rafId = requestAnimationFrame(step);
    })(last);
  }

  /* ---------- 例题（题型研究） ---------- */
  var exState = { hint: {}, sol: {}, cong: {}, vary: {}, t: {}, mode: {} };
  /* 动点题：ex.dyn = { min, max, step, start, label, unit, rate, modes: ['情形名'], marks: [{ v, label, m（只在第 m 种情形显示，可省略） }], fig(t, m) → 图形, info(t, m) → 说明 HTML }
     拖动滑块（或点“播放”）时，图形和说明随时间 t 实时更新 */
  function fmtT(x) { return String(Math.round(x * 100) / 100); }
  function dynT(ex) { var t = exState.t[ex.id]; return t === undefined ? (ex.dyn.start === undefined ? ex.dyn.min : ex.dyn.start) : t; }
  function dynM(ex) { return exState.mode[ex.id] || 0; }
  function dynFig(ex, t, cong) { return '<figure class="geo' + (cong ? ' show-cong' : '') + '">' + figure(ex.dyn.fig(t, dynM(ex)), { label: ex.title }) + '</figure>'; }
  function dynBlock(ex, cong) {
    var d = ex.dyn, t = dynT(ex);
    return '<div class="dyn" data-dyn="' + ex.id + '">' +
      (d.modes ? '<div class="chips">' + d.modes.map(function (m, k) { return '<button type="button" class="chip' + (dynM(ex) === k ? ' on' : '') + '" data-x="mode" data-v="' + ex.id + '|' + k + '">' + esc(m) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="dyn-fig">' + dynFig(ex, t, cong) + '</div>' +
      '<div class="dyn-info">' + d.info(t, dynM(ex)) + '</div>' +
      '<label class="slider"><span>' + esc(d.label || 't') + '</span><input type="range" min="' + d.min + '" max="' + d.max + '" step="' + (d.step || 0.01) + '" value="' + t + '" data-dyn-range="' + ex.id + '" aria-label="' + esc(d.label || 't') + '"><b class="mono dyn-v">' + fmtT(t) + (d.unit || '') + '</b></label>' +
      '<div class="row"><button type="button" class="btn sm" data-x="play" data-v="' + ex.id + '">▶ 播放运动过程</button>' +
      (d.marks || []).filter(function (m) { return m.m === undefined || m.m === dynM(ex); }).map(function (m) { return '<button type="button" class="btn sm" data-x="mark" data-v="' + ex.id + '|' + m.v + '">' + esc(m.label) + '</button>'; }).join('') + '</div></div>';
  }
  function dynUpdate(ex, t) {
    exState.t[ex.id] = t;
    var box = document.querySelector('[data-dyn="' + ex.id + '"]'); if (!box) return;
    var cong = !!exState.cong[ex.id];
    box.querySelector('.dyn-fig').innerHTML = dynFig(ex, t, cong);
    box.querySelector('.dyn-info').innerHTML = ex.dyn.info(t, dynM(ex));
    box.querySelector('.dyn-v').textContent = fmtT(t) + (ex.dyn.unit || '');
    var r = box.querySelector('[data-dyn-range]'); if (r && document.activeElement !== r) r.value = t;
  }
  var playing = null;
  function playDyn(ex) {
    if (playing) { cancelAnimationFrame(playing.raf); playing = null; }
    var d = ex.dyn, t0 = dynT(ex); if (t0 >= d.max - 1e-6) t0 = d.min;
    var start = performance.now(), rate = d.rate || (d.max - d.min) / 4;
    playing = { id: ex.id };
    (function step(now) {
      if (!playing || playing.id !== ex.id || !document.querySelector('[data-dyn="' + ex.id + '"]')) { playing = null; return; }
      var t = Math.min(d.max, t0 + (now - start) / 1000 * rate);
      dynUpdate(ex, t);
      if (t < d.max) playing.raf = requestAnimationFrame(step); else playing = null;
    })(start);
  }
  function exCard(ex, i, done) {
    var nh = exState.hint[ex.id] || 0, sol = !!exState.sol[ex.id], cong = !!exState.cong[ex.id];
    var figs = (ex.figs || (ex.fig ? [ex.fig] : [])).map(function (f, k) {
      return '<figure class="geo' + (cong ? ' show-cong' : '') + '">' + figure(f, { label: ex.title + ' 图' + (k + 1) }) + (f.cap ? '<figcaption>' + esc(f.cap) + '</figcaption>' : '') + '</figure>';
    }).join('');
    if (ex.dyn) figs = '';
    var hasCong = (ex.dyn ? [ex.dyn.fig(dynT(ex), dynM(ex))] : (ex.figs || [ex.fig])).some(function (f) { return f && f.cong && f.cong.length; });
    var h = '<article class="sheet stack ex" id="ex-' + ex.id + '">' +
      '<div class="qmeta"><span class="chip">' + esc(ex.type) + '</span>' + (ex.level ? '<span class="tag' + (ex.level === '基础' ? ' calm' : ex.level === '真题' ? ' src' : '') + '">' + esc(ex.level) + '</span>' : '') + (done ? '<span class="seen">✓ 已掌握</span>' : '') + '</div>' +
      '<h3><span class="idx mono">例 ' + (i + 1) + '</span>' + esc(ex.title) + '</h3>' +
      (figs ? '<div class="ex-figs">' + figs + '</div>' : '') + (ex.dyn ? dynBlock(ex, cong) : '') +
      '<div class="stem">' + ex.q + '</div>' + (ex.art ? monoPre(ex.art) : '') +
      (ex.asks ? '<ol class="asks">' + ex.asks.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ol>' : '') +
      '<div class="row">' +
      (hasCong ? '<button type="button" class="btn sm" data-x="cong" data-v="' + ex.id + '">' + (cong ? '隐藏全等三角形' : '标出全等三角形') + '</button>' : '') +
      (nh < ex.think.length ? '<button type="button" class="btn sm" data-x="hint" data-v="' + ex.id + '">' + (nh ? '下一步思路（' + nh + '/' + ex.think.length + '）' : '一步一步看思路') + '</button>' : '') +
      '<button type="button" class="btn sm' + (sol ? '' : ' primary') + '" data-x="sol" data-v="' + ex.id + '">' + (sol ? '收起解答' : '看完整解答') + '</button>' +
      '</div>';
    if (nh) h += '<ol class="think">' + ex.think.slice(0, nh).map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol>';
    if (sol) {
      h += '<div class="proof">' + ex.sol + '</div>';
      if (ex.sum) h += '<div class="tip"><b>方法小结：</b>' + ex.sum + '</div>';
      if (ex.vary && ex.vary.length) {
        h += '<div class="vary"><h4>变式练习</h4>' + ex.vary.map(function (v, k) {
          var key = ex.id + '-' + k, open = !!exState.vary[key];
          return '<div class="vary-item"><div>' + v.q + '</div>' + (open ? '<div class="vary-a">' + v.a + '</div>' : '<button type="button" class="link small" data-x="vary" data-v="' + key + '">看答案</button>') + '</div>';
        }).join('') + '</div>';
      }
      h += '<div class="row"><button type="button" class="btn sm' + (done ? '' : ' primary') + '" data-x="done" data-v="' + ex.id + '">' + (done ? '取消「已掌握」' : '这道题我会了') + '</button></div>';
    }
    return h + '</article>';
  }
  function renderExamples(el, s, api) {
    var list = s.examples || [];
    var cats = [];
    list.forEach(function (ex) { if (cats.indexOf(ex.type) < 0) cats.push(ex.type); });
    var done = list.filter(function (ex) { return api.isDone(ex.id); }).length;
    var html = '<div class="sec-head"><p class="muted small">' + (s.exIntro || '先自己想，卡住了再一步一步看思路；最后对照完整解答和方法小结。') + '</p><span class="muted small mono">已掌握 ' + done + ' / ' + list.length + '</span></div>' +
      '<nav class="ex-index" aria-label="例题目录">' + list.map(function (ex, i) {
        return '<a href="#ex-' + ex.id + '" data-x="jump" data-v="' + ex.id + '" class="' + (api.isDone(ex.id) ? 'done' : '') + '"><span class="mono">' + (i + 1) + '</span>' + esc(ex.title) + '</a>';
      }).join('') + '</nav>';
    html += list.map(function (ex, i) { return exCard(ex, i, api.isDone(ex.id)); }).join('');
    el.innerHTML = html;
    el.onclick = function (e) {
      var b = e.target.closest('[data-x]'); if (!b || !el.contains(b)) return;
      var k = b.getAttribute('data-x'), id = b.getAttribute('data-v');
      if (k === 'jump') { e.preventDefault(); var t = document.getElementById('ex-' + id); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (k === 'play' || k === 'mark' || k === 'mode') {
        var ref = k === 'play' ? [id] : id.split('|'), ex0 = list.filter(function (x) { return x.id === ref[0]; })[0];
        if (!ex0) return;
        if (k === 'play') playDyn(ex0);
        else if (k === 'mark') { playing = null; dynUpdate(ex0, +ref[1]); }
        else { exState.mode[ex0.id] = +ref[1]; var tmp0 = document.createElement('div'); tmp0.innerHTML = dynBlock(ex0, !!exState.cong[ex0.id]); b.closest('.dyn').replaceWith(tmp0.firstChild); }
        return;
      }
      if (k === 'vary') { exState.vary[id] = 1; id = id.replace(/-\d+$/, ''); }
      else if (k === 'hint') exState.hint[id] = (exState.hint[id] || 0) + 1;
      else if (k === 'sol') exState.sol[id] = !exState.sol[id];
      else if (k === 'cong') exState.cong[id] = !exState.cong[id];
      else if (k === 'done') { api.toggleDone(id); renderExamples(el, s, api); var tt = document.getElementById('ex-' + id); if (tt) tt.scrollIntoView({ block: 'nearest' }); return; }
      var idx = list.map(function (x) { return x.id; }).indexOf(id), card = document.getElementById('ex-' + id);
      if (idx < 0 || !card) return;
      var tmp = document.createElement('div'); tmp.innerHTML = exCard(list[idx], idx, api.isDone(id));
      card.replaceWith(tmp.firstChild);
      if (k === 'hint' && window.GEWU_FX) { var lis = document.querySelectorAll('#ex-' + id + ' .think li'); window.GEWU_FX.scramble(lis[lis.length - 1], 600); }
    };
    el.oninput = function (e) {
      var id = e.target.getAttribute && e.target.getAttribute('data-dyn-range'); if (!id) return;
      var ex0 = list.filter(function (x) { return x.id === id; })[0]; if (!ex0) return;
      playing = null; dynUpdate(ex0, +e.target.value);
    };
  }

  return { figure: figure, monoPre: monoPre, renderLab: renderLab, renderExamples: renderExamples, stop: function () { lab.play = false; } };
})();
