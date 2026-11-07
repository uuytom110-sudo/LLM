/* 开场影片《格物》：WebGL 字符画渲染，沿用 Fuxi 复习站的影片引擎。
   八章都是本站内容里的现象，用方程实时绘制：声波干涉、克拉德尼共振、三棱镜色散、凸透镜会聚、雪花凝华、神经冲动、叶序生长、手拉手旋转。
   第一遍在字符网格分辨率上渲染明暗，第二遍把亮度映射到按墨量排序的字符阶梯，并加入胶片颗粒、暗角、宽银幕遮幅。
   画面只有影片本身：整部播放一遍后，“进入”按钮由同样的字符凝聚而成。全部为原创的程序化画面；不支持 WebGL 时退回 js/intro.js 的 2D 版本。 */
(function () {
  'use strict';
  var fallback = window.GEWU_INTRO;
  var FX = window.GEWU_FX || {};

  /* 章节：id 为片段着色器中的场景编号；pts 为粒子场景 */
  var CH = [
    { id: 0, no: 'I', zh: '振动', en: 'INTERFERENCE', c: '#ffc58a' },
    { id: 1, no: 'II', zh: '共振', en: 'CYMATICS', c: '#e9e1d2' },
    { id: 2, no: 'III', zh: '色散', en: 'DISPERSION', c: '#d8ccff' },
    { id: 3, no: 'IV', zh: '会聚', en: 'FOCUS', c: '#ffd6a8' },
    { id: 4, no: 'V', zh: '凝华', en: 'FROST', c: '#a9d4ff' },
    { id: 5, no: 'VI', zh: '冲动', en: 'NEURON', c: '#a8f0c4' },
    { id: 6, no: 'VII', zh: '生长', en: 'PHYLLOTAXIS', c: '#f2d4b0' },
    { id: 7, no: 'VIII', zh: '旋转', en: 'ROTATION', c: '#ffcf96' }
  ];
  var DUR = 5.5, TRANS = 1.6, REVEAL = 2.8;

  var VS = 'attribute vec2 aP; void main(){ gl_Position = vec4(aP, 0.0, 1.0); }';

  var SCENE_FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uRes; uniform vec2 uCell; uniform float uS; uniform vec2 uOff; uniform float uT; uniform float uTau; uniform float uId; uniform vec2 uM;',
    'vec2 gCell;',
    'float hash1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash1(i), hash1(i + vec2(1.0, 0.0)), f.x), mix(hash1(i + vec2(0.0, 1.0)), hash1(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }',
    'float gl1(float d, float w){ return exp(-(d * d) / (w * w)); }',
    'float fbm3(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 3; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v / 0.875; }',
    'vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }',
    'vec3 stars(vec2 q){ vec2 g = q * 28.0; vec2 id = floor(g); vec2 f = fract(g) - 0.5; vec2 o = vec2(hash1(id), hash1(id + 3.1)) - 0.5;',
    '  return vec3(0.82, 0.86, 1.0) * step(hash1(id + 7.7), 0.11) * gl1(length(f - o * 0.7), 0.08) * (0.25 + 0.75 * hash1(id + 1.1)); }',

    'float gW = 0.02;',
    'float ln(float d, float w){ return gl1(d, max(w, gW * 0.62)); }',
    'float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a; vec2 ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }',
    'vec2 sdSegH(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a; vec2 ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return vec2(length(pa - ba * h), h); }',
    'float sdLine(vec2 p, vec2 a, vec2 b){ vec2 n = normalize(vec2(a.y - b.y, b.x - a.x)); return abs(dot(p - a, n)); }',
    'vec3 hue(float x){ return clamp(abs(mod(x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }',
    'float inTri(vec2 p, vec2 a, vec2 b, vec2 c){',
    '  float d1 = (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y); float d2 = (p.x - c.x) * (b.y - c.y) - (b.x - c.x) * (p.y - c.y); float d3 = (p.x - a.x) * (c.y - a.y) - (c.x - a.x) * (p.y - a.y);',
    '  bool ng = d1 < 0.0 || d2 < 0.0 || d3 < 0.0; bool ps = d1 > 0.0 || d2 > 0.0 || d3 > 0.0; return (ng && ps) ? 0.0 : 1.0; }',

    /* I 振动：两个声源的水波 / 声波干涉，波前从声源向外推开，节线是暗的双曲线 */
    'vec3 chWaves(vec2 p, float t, float tau){',
    '  float sep = 0.3 + 0.05 * sin(t * 0.21);',
    '  vec2 s1 = vec2(-sep, -0.02); vec2 s2 = vec2(sep, -0.02);',
    '  float r1 = length(p - s1); float r2 = length(p - s2);',
    '  float front = 0.15 + tau * 0.42;',
    '  float a1 = sin(25.0 * r1 - 3.4 * t) / sqrt(0.6 + r1 * 7.0) * (1.0 - smoothstep(front - 0.3, front, r1));',
    '  float a2 = sin(25.0 * r2 - 3.4 * t) / sqrt(0.6 + r2 * 7.0) * (1.0 - smoothstep(front - 0.3, front, r2));',
    '  float h = (a1 + a2) * 1.25; float ridge = pow(abs(h), 1.4);',
    '  vec3 col = vec3(0.01, 0.014, 0.024);',
    '  col += (h > 0.0 ? vec3(1.0, 0.74, 0.45) : vec3(0.42, 0.66, 1.0)) * ridge * 0.95;',
    '  col += vec3(1.0, 0.95, 0.86) * (ln(r1, 0.022) + ln(r2, 0.022)) * (0.75 + 0.25 * sin(t * 9.0));',
    '  return col * (1.0 - smoothstep(0.9, 1.7, length(p * vec2(0.8, 1.0))));',
    '}',

    /* II 共振：圆形振板上的克拉德尼图形，换频时沙粒扬起、再沉降到节线 */
    'float chl(vec2 x, vec2 nm){ float P = 3.14159265; return cos(nm.x * P * x.x) * cos(nm.y * P * x.y) - cos(nm.y * P * x.x) * cos(nm.x * P * x.y); }',
    'vec3 chCym(vec2 p, float t, float tau){',
    '  vec2 q = rot(p, 0.06 * sin(t * 0.05)) / 0.9; float rr = length(q);',
    '  float s = t * 0.14; float k0 = floor(s); float fk = smoothstep(0.55, 1.0, fract(s));',
    '  float n0 = 1.0 + floor(hash1(vec2(k0, 1.0)) * 4.0); float n1 = 1.0 + floor(hash1(vec2(k0 + 1.0, 1.0)) * 4.0);',
    '  vec2 nm0 = vec2(n0, n0 + 2.0 + floor(hash1(vec2(k0, 2.0)) * 5.0)); vec2 nm1 = vec2(n1, n1 + 2.0 + floor(hash1(vec2(k0 + 1.0, 2.0)) * 5.0));',
    '  vec2 x = rot(q, 0.7854) * 0.5 + 0.5;',
    '  float f = mix(chl(x, nm0), chl(x, nm1), fk);',
    '  float settle = 1.0 - 4.0 * fk * (1.0 - fk);',
    '  float sand = exp(-(f * f) / mix(0.03, 0.0045, settle));',
    '  float grain = step(0.42, hash1(gCell + floor(t * 4.0) * (1.0 - settle)));',
    '  float glint = pow(hash1(gCell * 1.37 + floor(t * 5.0)), 60.0);',
    '  float plate = 1.0 - smoothstep(0.9, 1.0, rr);',
    '  vec3 col = vec3(0.028, 0.03, 0.036) * (0.45 + 0.55 * fbm(q * 2.5)) * plate;',
    '  col += vec3(1.0, 0.92, 0.8) * 0.07 * gl1(length(q - vec2(-0.5, 0.55)), 0.7) * plate;',
    '  col += vec3(0.85, 0.86, 0.9) * (gl1(rr - 1.0, 0.005) * 0.45 + gl1(rr - 1.03, 0.003) * 0.15);',
    '  col += vec3(0.98, 0.93, 0.85) * sand * (0.3 + 0.7 * grain) * plate * (0.85 + 0.9 * glint);',
    '  return col;',
    '}',

    /* III 色散：白光射入三棱镜，折射后展开成光谱（红光偏折最小，紫光最大） */
    'vec3 chPrism(vec2 p, float t, float tau){',
    '  vec2 q = rot(p - vec2(-0.14, 0.02), -0.04 * sin(t * 0.3));',
    '  vec2 V0 = vec2(-0.36, -0.3); vec2 V1 = vec2(0.0, 0.33); vec2 V2 = vec2(0.36, -0.3);',
    '  vec2 P1 = mix(V0, V1, 0.42); vec2 P2 = mix(V1, V2, 0.56); vec2 S0 = P1 + normalize(vec2(-1.0, -0.3)) * 2.4;',
    '  float ins = inTri(q, V0, V1, V2);',
    '  vec3 col = vec3(0.012, 0.012, 0.018);',
    '  float e = min(min(sdSeg(q, V0, V1), sdSeg(q, V1, V2)), sdSeg(q, V2, V0));',
    '  col += vec3(0.55, 0.65, 0.85) * ins * (0.05 + 0.08 * (q.y + 0.3));',
    '  col += vec3(0.85, 0.9, 1.0) * (ln(e, 0.004) * 0.8 + ln(e, 0.02) * 0.08);',
    '  vec2 b1 = sdSegH(q, S0, P1);',
    '  col += vec3(1.0, 0.98, 0.94) * (ln(b1.x, 0.006) * 1.1 + ln(b1.x, 0.03) * 0.18) * (0.75 + 0.7 * pow(fract(b1.y * 5.0 - t * 1.3), 8.0));',
    '  vec2 b2 = sdSegH(q, P1, P2);',
    '  col += mix(vec3(1.0, 0.96, 0.9), hue(0.35), b2.y * 0.3) * ln(b2.x, 0.007 + 0.008 * b2.y) * 0.9 * ins;',
    '  vec2 d = q - P2; float L = length(d); float a = atan(d.y, d.x);',
    '  float lam = (-0.22 - a) / 0.32;',
    '  float fan = smoothstep(0.0, 0.05, lam) * (1.0 - smoothstep(0.95, 1.0, lam)) * (1.0 - ins) * smoothstep(0.0, 0.04, L);',
    '  float bands = 0.8 + 0.2 * sin(lam * 70.0 + t * 0.5);',
    '  col += hue(clamp(lam, 0.0, 1.0) * 0.78) * fan * bands * (0.5 + 0.7 * exp(-L * 1.4)) * (0.85 + 0.35 * pow(fract(L * 3.0 - t * 1.1), 6.0));',
    '  return col;',
    '}',

    /* IV 会聚：平行光经凸透镜会聚于焦点 F，光子沿光线流动 */
    'vec3 chLens(vec2 p, float t, float tau){',
    '  float lx = -0.22; float H = 0.62; float T = 0.075; vec2 F = vec2(0.42, 0.0);',
    '  vec3 col = vec3(0.01, 0.013, 0.02);',
    '  col += vec3(0.5, 0.6, 0.7) * ln(p.y, 0.0025) * 0.3 * step(0.5, fract(p.x * 14.0));',
    '  float yy = p.y / H; float th = T * (1.0 - yy * yy); float inb = step(abs(yy), 1.0);',
    '  float inL = step(abs(p.x - lx), th) * inb;',
    '  col += vec3(0.5, 0.7, 0.9) * inL * (0.06 + 0.1 * (1.0 - abs(p.x - lx) / max(th, 0.001)));',
    '  col += vec3(0.85, 0.93, 1.0) * ln(abs(abs(p.x - lx) - th), 0.0035) * inb * 1.1;',
    '  float acc = 0.0; float pul = 0.0;',
    '  for (int i = 0; i < 7; i++){',
    '    float h = -0.48 + 0.16 * float(i);',
    '    vec2 A0 = vec2(-2.2, h); vec2 A1 = vec2(lx, h); vec2 dir = normalize(F - A1); vec2 A2 = A1 + dir * 2.6;',
    '    vec2 s1 = sdSegH(p, A0, A1); vec2 s2 = sdSegH(p, A1, A2);',
    '    float L1 = 2.2 + lx; float d = min(s1.x, s2.x); float s = s1.x < s2.x ? s1.y * L1 : L1 + s2.y * 2.6;',
    '    acc += ln(d, 0.0045) + gl1(d, 0.03) * 0.05;',
    '    pul += ln(d, 0.009) * pow(fract(s * 0.9 - t * 0.55 + float(i) * 0.137), 14.0);',
    '  }',
    '  col += vec3(1.0, 0.86, 0.58) * acc * 0.3 + vec3(1.0, 0.97, 0.9) * pul * 1.6;',
    '  float rf = length(p - F);',
    '  col += vec3(1.0, 0.85, 0.55) * (ln(rf, 0.02) * 1.2 + ln(rf, 0.09) * 0.25 * (0.6 + 0.4 * sin(t * 3.0)));',
    '  return col;',
    '}',

    /* V 凝华：水蒸气直接凝成冰晶，六重对称的雪花枝晶从中心长出 */
    'float flakeD(vec2 q, float R){',
    '  float r = length(q); float a = atan(q.y, q.x);',
    '  a = mod(a + 0.5235988, 1.0471976) - 0.5235988; a = abs(a);',
    '  vec2 u = r * vec2(cos(a), sin(a));',
    '  float d = sdSeg(u, vec2(0.0), vec2(R, 0.0));',
    '  for (int i = 0; i < 4; i++){',
    '    float fi = float(i); vec2 b0 = vec2(R * (0.3 + 0.17 * fi), 0.0); float L = R * (0.34 - 0.06 * fi);',
    '    vec2 b1 = b0 + L * vec2(0.5, 0.8660254); d = min(d, sdSeg(u, b0, b1));',
    '    if (i < 2){ vec2 c0 = mix(b0, b1, 0.55); d = min(d, sdSeg(u, c0, c0 + vec2(L * 0.3, 0.0))); }',
    '  }',
    '  d = min(d, abs(dot(u, vec2(0.8660254, 0.5)) - R * 0.14));',
    '  return d;',
    '}',
    'vec3 chFrost(vec2 p, float t, float tau){',
    '  vec3 col = vec3(0.008, 0.012, 0.022) + vec3(0.1, 0.16, 0.26) * 0.12 * fbm(p * 2.2 + t * 0.03);',
    '  vec2 g = p * 5.0 + vec2(t * 0.05, t * 0.35); vec2 id = floor(g); vec2 f = fract(g) - 0.5; float hs = hash1(id);',
    '  if (hs > 0.82){ vec2 o = (vec2(hash1(id + 2.3), hash1(id + 5.1)) - 0.5) * 0.4; col += vec3(0.6, 0.78, 1.0) * ln(flakeD(rot(f - o, t + hs * 6.0), 0.16), 0.014) * (hs - 0.82) * 1.8; }',
    '  float R = 0.04 + 0.78 * smoothstep(0.0, 4.6, tau);',
    '  vec2 q = rot(p, t * 0.06); float d = flakeD(q, R); float r = length(q);',
    '  float core = ln(d, 0.0055); float halo = gl1(d, 0.03) * 0.12; float tip = exp(-abs(r - R) * 18.0);',
    '  float glint = pow(hash1(gCell * 0.37 + floor(t * 6.0)), 40.0);',
    '  col += mix(vec3(0.55, 0.78, 1.0), vec3(1.0), core) * (core * 1.1 + halo) * (0.8 + 0.6 * tip) + vec3(1.0) * glint * core;',
    '  return col;',
    '}',

    /* VI 冲动：神经元的树突把信号向内传，胞体放电，动作电位沿有髓鞘的轴突传到末梢 */
    'float axY(float x){ return 0.04 - 0.07 * (x + 0.465) + 0.035 * sin((x + 0.465) * 5.5); }',
    'vec3 chNeuron(vec2 p, float t, float tau){',
    '  vec2 S = vec2(-0.55, 0.05); float cyc = fract(t * 0.3); float fire = exp(-cyc * 14.0);',
    '  vec3 col = vec3(0.008, 0.014, 0.012);',
    '  float fib = fbm(p * 2.5 + vec2(t * 0.02, 0.0));',
    '  col += vec3(0.25, 0.5, 0.4) * 0.07 * ln(abs(fract(fib * 7.0) - 0.5), 0.05);',
    '  float rs = length(p - S);',
    '  col += vec3(0.5, 0.95, 0.7) * (ln(rs - 0.085, 0.006) * 0.9 + (1.0 - smoothstep(0.07, 0.09, rs)) * (0.12 + 0.5 * fire));',
    '  col += vec3(0.9, 1.0, 0.85) * ln(rs, 0.03) * 0.6;',
    '  float dd = 9.0; float pul = 0.0;',
    '  for (int i = 0; i < 6; i++){',
    '    float fi = float(i); float an = 1.75 + fi * 0.62 + 0.2 * (hash1(vec2(fi, 3.0)) - 0.5);',
    '    vec2 u = vec2(cos(an), sin(an)); vec2 a0 = S + u * 0.085; vec2 a1 = a0 + u * (0.2 + 0.08 * hash1(vec2(fi, 7.0)));',
    '    vec2 h1 = sdSegH(p, a0, a1); dd = min(dd, h1.x);',
    '    pul += ln(h1.x, 0.012) * pow(fract(h1.y * 0.6 + 0.6 + t * 0.7 + fi * 0.21), 12.0) * 0.6;',
    '    for (int k = 0; k < 2; k++){',
    '      float fk = float(k) * 2.0 - 1.0; float an2 = an + fk * (0.45 + 0.15 * hash1(vec2(fi, fk)));',
    '      vec2 b1 = a1 + vec2(cos(an2), sin(an2)) * (0.12 + 0.06 * hash1(vec2(fk, fi)));',
    '      vec2 h2 = sdSegH(p, a1, b1); dd = min(dd, h2.x + 0.002);',
    '      float an3 = an2 + fk * 0.5; dd = min(dd, sdSeg(p, b1, b1 + vec2(cos(an3), sin(an3)) * 0.07) + 0.004);',
    '      pul += ln(h2.x, 0.012) * pow(fract(h2.y * 0.6 + t * 0.7 + fi * 0.21 + fk * 0.1), 12.0);',
    '    }',
    '  }',
    '  col += vec3(0.45, 0.9, 0.65) * (ln(dd, 0.005) * 0.85 + ln(dd, 0.02) * 0.15) + vec3(1.0, 0.9, 0.6) * pul * 0.9;',
    '  float x0 = -0.465; float x1 = 0.72; float ay = axY(p.x); float sl = (axY(p.x + 0.01) - axY(p.x - 0.01)) / 0.02;',
    '  float inX = step(x0, p.x) * step(p.x, x1); float dax = abs(p.y - ay) / sqrt(1.0 + sl * sl);',
    '  float sg = fract((p.x - x0) / 0.16); float my = step(0.12, sg) * step(sg, 0.88);',
    '  col += vec3(0.45, 0.9, 0.65) * inX * (ln(dax, 0.0045) * 0.9 + my * (ln(dax - 0.022, 0.003) * 0.7 + (1.0 - smoothstep(0.016, 0.022, dax)) * 0.08));',
    '  float xp = mix(x0, x1 + 0.1, cyc);',
    '  float ap = exp(-pow((p.x - xp) / 0.035, 2.0)) + 0.35 * exp(-max(xp - p.x, 0.0) * 9.0) * step(p.x, xp);',
    '  col += vec3(1.0, 0.86, 0.55) * inX * ln(dax, 0.012) * ap * 1.6;',
    '  vec2 T = vec2(x1, axY(x1)); float arrive = smoothstep(0.82, 0.92, cyc) * (1.0 - smoothstep(0.96, 1.0, cyc));',
    '  for (int j = 0; j < 4; j++){',
    '    float aj = -0.8 + 0.5 * float(j); vec2 e = T + vec2(cos(aj), sin(aj)) * (0.12 + 0.03 * hash1(vec2(float(j), 9.0)));',
    '    float bo = length(p - e);',
    '    col += vec3(0.45, 0.9, 0.65) * ln(sdSeg(p, T, e), 0.004) * 0.8 + vec3(1.0, 0.9, 0.6) * (ln(bo - 0.016, 0.004) * 0.8 + ln(bo, 0.012) * arrive * 2.0);',
    '  }',
    '  return col;',
    '}',

    /* VII 生长：叶序（沃格尔螺线），每颗种子以黄金角 137.508° 排布 */
    'vec3 chPhyllo(vec2 p, float t, float tau){',
    '  float N = 300.0; float c = 0.052; vec2 q = rot(p, -t * 0.045);',
    '  float r = length(q); float n0 = (r / c) * (r / c); float grow = N * smoothstep(0.0, 5.5, tau) + 1.0;',
    '  float best = 9.0; float bn = 0.0;',
    '  for (int i = 0; i < 64; i++){',
    '    float n = floor(n0) - 32.0 + float(i);',
    '    if (n < 0.0 || n > N || n > grow) continue;',
    '    float th = n * 2.39996323; vec2 sp = sqrt(n) * c * vec2(cos(th), sin(th));',
    '    float d = length(q - sp); if (d < best){ best = d; bn = n; }',
    '  }',
    '  vec3 col = vec3(0.03, 0.02, 0.012) * gl1(r, 0.8) + stars(p * 0.5) * 0.1;',
    '  float R = 0.028 + 0.009 * sqrt(bn / N);',
    '  if (best < R){',
    '    float h = sqrt(1.0 - (best / R) * (best / R));',
    '    float th = bn * 2.39996323; vec2 sp = sqrt(bn) * c * vec2(cos(th), sin(th)); vec2 lp = (q - sp) / R;',
    '    float dif = clamp(dot(normalize(vec3(lp, h)), normalize(vec3(-0.5, 0.6, 0.65))), 0.0, 1.0);',
    '    float wave = pow(0.5 + 0.5 * sin(sqrt(bn) * 1.1 - t * 1.4), 4.0);',
    '    float fresh = 1.0 - smoothstep(grow - 8.0, grow, bn);',
    '    vec3 base = mix(vec3(1.0, 0.86, 0.6), vec3(0.95, 0.5, 0.25), sqrt(bn / N));',
    '    col = base * (0.14 + 0.95 * dif) * (0.55 + 0.95 * wave) * (0.4 + 0.6 * fresh) + vec3(1.0, 0.95, 0.85) * pow(dif, 18.0) * 0.5;',
    '  }',
    '  return col;',
    '}',

    /* VIII 旋转：两个等边三角形共顶点 A，小三角形绕 A 转动；拉手线 BD、CE 始终相等，交点 F 处的夹角始终 60° */
    'vec3 chRotate(vec2 p, float t, float tau){',
    '  vec2 A = vec2(0.0, 0.36); vec2 B = A + 1.2 * vec2(-0.5, -0.8660254); vec2 C = A + 1.2 * vec2(0.5, -0.8660254);',
    '  float th = 4.18879 + t * 0.32 + uM.x * 0.6;',
    '  vec2 D = A + 0.52 * vec2(cos(th), sin(th)); vec2 E = A + 0.52 * vec2(cos(th + 1.0471976), sin(th + 1.0471976));',
    '  vec3 col = vec3(0.012, 0.012, 0.016) + stars(p * 0.8) * 0.12;',
    '  float rA = length(p - A); float angA = atan(p.y - A.y, p.x - A.x);',
    '  col += vec3(0.6, 0.65, 0.75) * ln(rA - 0.52, 0.0025) * step(0.5, fract(angA * 9.549)) * 0.4;',
    '  float grow = smoothstep(0.2, 2.0, tau);',
    '  col += (vec3(1.0, 0.7, 0.35) * inTri(p, A, B, D) + vec3(0.4, 0.6, 1.0) * inTri(p, A, C, E)) * 0.08 * grow;',
    '  float eb = min(min(sdSeg(p, A, B), sdSeg(p, B, C)), sdSeg(p, C, A)); float es = min(min(sdSeg(p, A, D), sdSeg(p, D, E)), sdSeg(p, E, A));',
    '  col += vec3(0.9, 0.93, 1.0) * (ln(eb, 0.004) * 0.9 + ln(eb, 0.02) * 0.1) + vec3(1.0, 0.9, 0.75) * (ln(es, 0.004) * 0.9 + ln(es, 0.02) * 0.1);',
    '  col += vec3(0.8, 0.8, 0.85) * (ln(sdLine(p, B, D), 0.0025) + ln(sdLine(p, C, E), 0.0025)) * 0.12 * grow;',
    '  vec2 h1 = sdSegH(p, B, D); vec2 h2 = sdSegH(p, C, E);',
    '  float pl = 0.6 + 0.8 * pow(fract(h1.y * 2.0 - t * 0.8), 8.0); float pr = 0.6 + 0.8 * pow(fract(h2.y * 2.0 - t * 0.8), 8.0);',
    '  col += (vec3(1.0, 0.68, 0.32) * (ln(h1.x, 0.0045) + ln(h1.x, 0.02) * 0.2) * pl + vec3(0.42, 0.68, 1.0) * (ln(h2.x, 0.0045) + ln(h2.x, 0.02) * 0.2) * pr) * grow;',
    '  vec2 r = D - B; vec2 s = E - C; float den = r.x * s.y - r.y * s.x;',
    '  if (abs(den) > 0.0001){',
    '    vec2 F = B + r * (((C.x - B.x) * s.y - (C.y - B.y) * s.x) / den); float rf = length(p - F);',
    '    col += vec3(1.0, 0.92, 0.8) * (ln(rf, 0.012) * 1.2 + ln(rf, 0.05) * 0.25 * (0.7 + 0.3 * sin(t * 4.0))) * grow;',
    '  }',
    '  col += vec3(1.0) * (ln(rA, 0.012) + ln(length(p - D), 0.01) * 0.8 + ln(length(p - E), 0.01) * 0.8);',
    '  return col;',
    '}',

    'vec3 scene(float id, vec2 p, float t, float tau){',
    '  if (id < 0.5) return chWaves(p, t, tau);',
    '  if (id < 1.5) return chCym(p, t, tau);',
    '  if (id < 2.5) return chPrism(p, t, tau);',
    '  if (id < 3.5) return chLens(p, t, tau);',
    '  if (id < 4.5) return chFrost(p, t, tau);',
    '  if (id < 5.5) return chNeuron(p, t, tau);',
    '  if (id < 6.5) return chPhyllo(p, t, tau);',
    '  return chRotate(p, t, tau);',
    '}',
    'void main(){',
    '  gCell = floor(gl_FragCoord.xy); gW = uCell.y / uS;',
    '  vec2 px = (gCell + 0.5) * uCell;',
    '  vec2 p = vec2(px.x - uRes.x * 0.5 - uOff.x, px.y - uRes.y * 0.5 + uOff.y) / uS;',
    '  p *= 1.0 - 0.075 * smoothstep(0.0, 7.0, uTau);',
    '  vec3 c = scene(uId, p, uT, uTau) * smoothstep(0.0, 1.4, uTau);',
    '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  /* 全片粒子层：不同景深的漂浮微粒，近处大而快（散景），远处细而慢；随章节着色，转场时增亮 */
  var DUST_VS = [
    'attribute vec4 aD; uniform float uT; uniform vec2 uK; uniform vec2 uC; uniform float uPs; uniform float uFade; uniform vec3 uCol; uniform float uBoost; uniform float uA;',
    'varying vec3 vC;',
    'void main(){',
    '  float z = aD.z; float par = 0.55 + 0.9 * z; float sp = 0.025 + 0.16 * z;',
    '  vec2 p = aD.xy * vec2(uA, 1.15);',
    '  p.x += uT * sp * (0.55 + 0.45 * sin(aD.w * 6.2832));',
    '  p.y += sin(uT * 0.35 + aD.w * 12.0 + p.x * 1.7) * 0.09 * (0.4 + z) + uT * 0.02 * (aD.w - 0.45);',
    '  float ax = uA / par + 0.15, ay = 1.15 / par + 0.15;',
    '  p.x = mod(p.x + ax, 2.0 * ax) - ax; p.y = mod(p.y + ay, 2.0 * ay) - ay;',
    '  gl_Position = vec4(p * par * uK + uC, 0.0, 1.0);',
    '  float tw = 0.5 + 0.5 * sin(uT * (0.8 + 3.0 * aD.w) + aD.w * 40.0);',
    '  vC = uCol * (0.05 + 0.9 * z * z) * (0.35 + 0.65 * tw) * uFade * uBoost;',
    '  gl_PointSize = uPs * (0.9 + 4.5 * z * z * z);',
    '}'
  ].join('\n');
  var PTS_FS_G = 'precision mediump float; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; gl_FragColor = vec4(vC * exp(-dot(d, d) * 12.0), 1.0); }';

  var GLYPH_FS = [
    'precision mediump float;',
    'uniform sampler2D uSa; uniform sampler2D uSb; uniform sampler2D uAtlas;',
    'uniform vec2 uGrid; uniform vec2 uCell; uniform vec2 uRes; uniform float uN; uniform float uMix; uniform float uT; uniform float uBar;',
    'uniform vec4 uBtn; uniform float uRev; uniform float uHov;',
    'float sdRB(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }',
    'float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'void main(){',
    '  vec2 fc = gl_FragCoord.xy;',
    '  if (fc.y < uBar || fc.y > uRes.y - uBar){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
    '  vec2 cell = floor(fc / uCell); vec2 lc = fract(fc / uCell); vec2 uv = (cell + 0.5) / uGrid;',
    '  vec3 ca = texture2D(uSa, uv).rgb; vec3 cb = texture2D(uSb, uv).rgb;',
    '  float h = h1(cell * 0.731 + 3.1);',
    '  vec3 c = uMix >= 1.0 ? cb : (h < uMix ? cb : ca);',
    '  if (uMix < 1.0) c += (1.0 - smoothstep(0.0, 0.045, abs(h - uMix))) * 0.55 * max(ca, cb);',
    '  if (uRev > 0.0){',
    '    vec2 d = (cell + 0.5) * uCell - uBtn.xy;',
    '    float sd = sdRB(d, uBtn.zw, uBtn.w);',
    '    float rn = length(d / (uBtn.zw * 1.8));',
    '    float thr = uRev * 1.55 - rn * 0.55;',
    '    float on = smoothstep(0.0, 0.1, thr - h);',
    '    float front = (1.0 - smoothstep(0.0, 0.05, abs(thr - h))) * step(sd, uCell.y * 2.5);',
    '    float ring = max(0.0, 1.0 - uRev * 1.7) * uCell.y * 80.0; float ring2 = max(0.0, 1.0 - uRev * 2.3) * uCell.y * 140.0;',
    '    float hf = h1(cell + floor(uT * 12.0) * 1.7);',
    '    float spark = step(abs(sd - ring), uCell.y * 2.6) * step(hf, 0.55) * step(0.001, ring) + step(abs(sd - ring2), uCell.y * 2.0) * step(hf, 0.35) * step(0.001, ring2) * 0.7;',
    '    spark += step(hf, 0.07 * (1.0 - uRev)) * step(sd, ring2 + uCell.y * 30.0) * step(uCell.y, sd) * exp(-sd / (uCell.y * 60.0)) * step(0.001, ring2 + ring);',
    '    float pulse = 0.82 + 0.18 * sin(uT * 2.1);',
    '    float outline = exp(-(sd * sd) / (uCell.y * uCell.y * 0.55));',
    '    float halo = exp(-max(sd, 0.0) / (uCell.y * 5.0)) * 0.12;',
    '    float B = (outline * 0.95 + step(sd, 0.0) * 0.07 + halo) * on * pulse * (1.0 + 0.45 * uHov) + front * 0.75 + spark * 0.8;',
    '    c *= 1.0 - 0.82 * step(sd, uCell.y * 0.5) * on;',
    '    c = max(c, vec3(1.0, 0.9, 0.76) * B);',
    '  }',
    '  float L = max(max(c.r, c.g), c.b);',
    '  float boil = (h1(cell + floor(uT * 12.0)) - 0.5) * 0.03;',
    '  float Lr = pow(clamp((L - 0.04 + boil) / 0.94, 0.0, 1.0), 0.85);',
    '  float m = texture2D(uAtlas, vec2((floor(Lr * (uN - 1.0) + 0.5) + lc.x) / uN, 1.0 - lc.y)).r;',
    '  vec3 col = (c / max(L, 0.001)) * m * (0.24 + 1.0 * Lr);',
    '  vec2 o = 1.6 / uGrid; vec2 u2 = fc / (uGrid * uCell);',
    '  vec3 bl = texture2D(uSb, u2 + vec2(o.x, 0.0)).rgb + texture2D(uSb, u2 - vec2(o.x, 0.0)).rgb + texture2D(uSb, u2 + vec2(0.0, o.y)).rgb + texture2D(uSb, u2 - vec2(0.0, o.y)).rgb;',
    '  col += bl * 0.035 * min(uMix, 1.0);',
    '  vec2 v = fc / uRes - 0.5; col *= 1.0 - 0.45 * pow(length(v * vec2(1.0, 0.85)) * 1.35, 2.4);',
    '  col += (h1(fc + fract(uT * 7.3) * 100.0) - 0.5) * 0.02;',
    '  gl_FragColor = vec4(col + vec3(0.008, 0.009, 0.011), 1.0);',
    '}'
  ].join('\n');

  function sm(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function compile(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { var log = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(log); }
    return s;
  }
  function program(gl, vs, fs, attr) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, attr); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ''); u[nm] = gl.getUniformLocation(p, nm); }
    return { p: p, u: u };
  }
  function tex(gl, filter) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  /* 字符阶梯：按实际墨量排序，均匀取 48 个 */
  var CHARS = ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
  function atlas(gw, gh) {
    var c = document.createElement('canvas'); c.width = gw; c.height = gh;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.font = '500 ' + Math.round(gh * 0.92) + 'px "SF Mono", Menlo, Consolas, "DM Mono", "Courier New", monospace';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    var list = [];
    for (var i = 0; i < CHARS.length; i++) {
      x.fillStyle = '#000'; x.fillRect(0, 0, gw, gh); x.fillStyle = '#fff'; x.fillText(CHARS[i], gw / 2, gh * 0.54);
      var d = x.getImageData(0, 0, gw, gh).data, s = 0;
      for (var k = 0; k < d.length; k += 4) s += d[k];
      list.push({ c: CHARS[i], v: s });
    }
    list.sort(function (a, b) { return a.v - b.v; });
    var N = Math.min(48, list.length), pick = [];
    for (i = 0; i < N; i++) pick.push(list[Math.round(i * (list.length - 1) / (N - 1))].c);
    var out = document.createElement('canvas'); out.width = gw * N; out.height = gh;
    var o = out.getContext('2d'); o.fillStyle = '#000'; o.fillRect(0, 0, out.width, gh);
    o.font = x.font; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#fff';
    for (i = 0; i < N; i++) o.fillText(pick[i], i * gw + gw / 2, gh * 0.54);
    return { canvas: out, n: N };
  }

  /* 粒子数据：漂浮微粒 */
  var DUST_N = 7000;
  function dustData() {
    var out = new Float32Array(DUST_N * 4);
    for (var i = 0; i < DUST_N; i++) {
      var z = Math.pow(Math.random(), 2.2);
      out[i * 4] = Math.random() * 2 - 1; out[i * 4 + 1] = Math.random() * 2 - 1; out[i * 4 + 2] = z; out[i * 4 + 3] = Math.random();
    }
    return out;
  }
  function hexRGB(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function start(force) {
    var seen = false;
    try { seen = sessionStorage.getItem('gewu-intro') === '1'; } catch (e) { /* ignore */ }
    if ((seen && !force) || FX.reduce) return;
    var el = document.createElement('div');
    el.className = 'intro intro-film';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', '开场影片：格物');
    el.innerHTML = '<canvas aria-hidden="true"></canvas>' +
      '<button type="button" class="intro-go" tabindex="-1" aria-label="进入网站"><span>进 入</span></button>';
    var cv = el.querySelector('canvas');
    var gl, P, PG, PD, vD, quad, texA, texB, fbA, fbB, atlasTex, N = 1;
    try {
      gl = cv.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('no webgl');
      P = program(gl, VS, SCENE_FS, 'aP'); PG = program(gl, VS, GLYPH_FS, 'aP');
      PD = program(gl, DUST_VS, PTS_FS_G, 'aD');
      quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      vD = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vD); gl.bufferData(gl.ARRAY_BUFFER, dustData(), gl.STATIC_DRAW);
      texA = tex(gl, gl.LINEAR); texB = tex(gl, gl.LINEAR); atlasTex = tex(gl, gl.NEAREST);
      fbA = gl.createFramebuffer(); fbB = gl.createFramebuffer();
    } catch (err) {
      if (window.console) console.warn('Gewu intro: WebGL unavailable, using 2D version.', err && err.message);
      if (fallback) fallback(force);
      return;
    }
    try { sessionStorage.setItem('gewu-intro', '1'); } catch (e) { /* ignore */ }
    document.body.appendChild(el);
    var btn = el.querySelector('.intro-go'), label = btn.querySelector('span'), btnRect = [0, 0, 1, 1];
    function measure() { var r = btn.getBoundingClientRect(); btnRect = [(r.left + r.width / 2) * dpr, (H - r.top - r.height / 2) * dpr, r.width / 2 * dpr, r.height / 2 * dpr]; }
    var W, H, dpr, gw, gh, cols, rows, S, oy0, bar = 0, q = 0, closing = false;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, [2.5, 1.6, 1.1][q]);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var ch = (W < 600 ? 5.4 : 6.8) * [1, 1.2, 1.45][q];
      gh = Math.max(6, Math.round(ch * dpr)); gw = Math.max(3, Math.round(gh * 0.6));
      cols = Math.ceil(cv.width / gw); rows = Math.ceil(cv.height / gh);
      bar = W / H > 1.3 ? Math.max(0, Math.min(H * 0.11, (H - W / 2.2) / 2)) : 0;
      S = Math.min(W / (W < 600 ? 2.0 : 2.15), (H - bar * 2) / 1.9); oy0 = W < 600 ? -0.06 * H : 0;
      el.style.setProperty('--bar', bar + 'px');
      [[texA, fbA], [texB, fbB]].forEach(function (pr) {
        gl.bindTexture(gl.TEXTURE_2D, pr[0]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, pr[1]); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pr[0], 0);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      var at = atlas(gw, gh); N = at.n;
      gl.bindTexture(gl.TEXTURE_2D, atlasTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, at.canvas);
      measure();
    }
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!closing) resize(); });

    var cur = (window.GEWU_INTRO_FROM | 0) % CH.length, prev = -1, sT = performance.now(), pT = 0, t0 = performance.now(), raf;
    var mx = 0, my = 0, tmx = 0, tmy = 0, ox = 0, oy = 0;
    function go(k) { prev = cur; pT = sT; cur = (k + CH.length) % CH.length; sT = performance.now(); }
    /* 整部影片播放一遍之后，按钮才由字符凝聚出来 */
    var revealAt = (window.GEWU_INTRO_REVEAL_AT !== undefined ? window.GEWU_INTRO_REVEAL_AT : CH.length * DUR) * 1000, rev = 0, hov = 0, hovT = 0, ready = false;
    var GLY = '.:;+=*#%@&$?!|/\\()[]{}<>~^';
    function decode() {
      var target = '进 入', st = performance.now();
      (function step(now) {
        var p = Math.min(1, (now - st) / 900), out = '';
        for (var i = 0; i < target.length; i++) out += target[i] === ' ' ? ' ' : (p * (target.length + 1) > i + 1 ? target[i] : GLY.charAt(Math.floor(Math.random() * GLY.length)));
        label.textContent = out;
        if (p < 1 && !closing) requestAnimationFrame(step); else label.textContent = target;
      })(st);
    }

    var boost = 1;
    /* 小屏上同样数量的粒子挤在更少的字符格里，按每世界单位的格数做亮度补偿 */
    function dens() { return Math.max(0.3, Math.min(1, Math.pow(S * dpr / gh / 53, 2))); }
    function drawDust(c, t, tau) {
      var u = PD.u, col = hexRGB(c.c);
      gl.useProgram(PD.p);
      gl.uniform1f(u.uT, t); gl.uniform1f(u.uA, W / 2 / S);
      gl.uniform2f(u.uK, 2 * S * dpr / (cols * gw), 2 * S * dpr / (rows * gh));
      gl.uniform2f(u.uC, (cv.width / 2 + ox * dpr * 1.6) * 2 / (cols * gw) - 1, (cv.height / 2 - oy * dpr * 1.6) * 2 / (rows * gh) - 1);
      gl.uniform1f(u.uPs, W < 600 ? 1.15 : 1.3); gl.uniform1f(u.uFade, sm(0, 1.6, tau) * dens()); gl.uniform3f(u.uCol, col[0], col[1], col[2]); gl.uniform1f(u.uBoost, boost);
      gl.bindBuffer(gl.ARRAY_BUFFER, vD); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, DUST_N);
      gl.disable(gl.BLEND);
    }
    function renderChapter(k, fb, t, tau) {
      var c = CH[k];
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, cols, rows);
      gl.useProgram(P.p); var u = P.u;
      gl.uniform2f(u.uRes, cv.width, cv.height); gl.uniform2f(u.uCell, gw, gh); gl.uniform1f(u.uS, S * dpr);
      gl.uniform2f(u.uOff, ox * dpr, oy * dpr); gl.uniform1f(u.uT, t); gl.uniform1f(u.uTau, tau); gl.uniform1f(u.uId, c.id);
      gl.uniform2f(u.uM, mx, my);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      drawDust(c, t, tau);
    }

    var fN = 0, fAcc = 0, fLast = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (fLast) { fAcc += now - fLast; fN++; }
      fLast = now;
      if (fN >= 90) { if (fAcc / fN > 38 && q < 2) { q++; resize(); } fN = 0; fAcc = 0; }
      var t = (now - t0) / 1000, tau = (now - sT) / 1000;
      if (!closing && tau > DUR) { go(cur + 1); tau = 0; }
      mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
      ox = -mx * 14; oy = oy0 - my * 10;
      var mix = prev >= 0 ? sm(0, 1, tau / TRANS) : 1;
      if (mix >= 1) prev = -1;
      boost = 1 + 1.8 * (prev >= 0 ? Math.sin(Math.PI * Math.min(1, mix)) : 0) + 0.5 * Math.sin(Math.PI * Math.min(1, rev));
      renderChapter(cur, fbB, t, tau);
      if (prev >= 0) renderChapter(prev, fbA, t, (now - pT) / 1000);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height);
      gl.useProgram(PG.p); var u = PG.u;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA); gl.uniform1i(u.uSa, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB); gl.uniform1i(u.uSb, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, atlasTex); gl.uniform1i(u.uAtlas, 2);
      gl.uniform2f(u.uGrid, cols, rows); gl.uniform2f(u.uCell, gw, gh); gl.uniform2f(u.uRes, cv.width, cv.height);
      gl.uniform1f(u.uN, N); gl.uniform1f(u.uMix, prev >= 0 ? mix : 1); gl.uniform1f(u.uT, t); gl.uniform1f(u.uBar, bar * dpr);
      rev = sm(revealAt, revealAt + REVEAL * 1000, now - t0); hov += (hovT - hov) * 0.12;
      if (rev > 0 && !btn.classList.contains('show')) { btn.classList.add('show'); measure(); }
      if (rev >= 1 && !ready) { ready = true; btn.classList.add('ready'); btn.removeAttribute('tabindex'); btn.focus({ preventScroll: true }); decode(); }
      gl.uniform4f(u.uBtn, btnRect[0], btnRect[1], btnRect[2], btnRect[3]); gl.uniform1f(u.uRev, rev); gl.uniform1f(u.uHov, hov);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    function close() {
      if (closing) return; closing = true;
      el.classList.add('out');
      setTimeout(function () { cancelAnimationFrame(raf); el.remove(); window.removeEventListener('resize', resize); document.removeEventListener('keydown', onKey); var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); }, 1100);
    }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    el.addEventListener('pointermove', function (e) { tmx = e.clientX / W - 0.5; tmy = e.clientY / H - 0.5; });
    btn.addEventListener('click', function () { if (rev > 0.6) close(); });
    btn.addEventListener('pointerenter', function () { hovT = 1; });
    btn.addEventListener('pointerleave', function () { hovT = 0; });
    window.addEventListener('resize', resize);
    document.addEventListener('keydown', onKey);
    raf = requestAnimationFrame(frame);
  }
  window.GEWU_INTRO = start;
})();
