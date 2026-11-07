/* 开场影片《从原子到视界》：Fuxi 复习站原版的 WebGL 字符画影片，整体加速约 2.8 倍（全片约 19 秒）。
   每一章都是一个自然现象的方程实时绘制：氢原子轨道、克拉德尼图形、湍流、洛伦兹吸引子、朱利亚集、叶序（黄金角）、密度波星系、黑洞视界。
   第一遍在字符网格分辨率上渲染明暗（洛伦兹、叶序与星系另用粒子叠加），第二遍把亮度映射到按墨量排序的字符阶梯，并加入胶片颗粒、暗角、宽银幕遮幅。
   终章：画面里所有漂浮粒子和吸积盘上的粒子螺旋聚拢，凝成精细的字符画单词 “access”（就是进入按钮），随后在十余种语言之间轮换，背景粒子继续流动。
   不支持 WebGL 时退回 js/intro.js 的 2D 版本。 */
(function () {
  'use strict';
  var fallback = window.GEWU_INTRO;
  var FX = window.GEWU_FX || {};

  /* 章节：id 为片段着色器中的场景编号；pts 为粒子场景 */
  var CH = [
    { id: 0, no: 'I', zh: '量子', en: 'ORBITAL', eq: '|ψₙₗₘ|²', c: '#9cc7ff' },
    { id: 1, no: 'II', zh: '共振', en: 'CYMATICS', eq: 'cos nπx·cos mπy − cos mπx·cos nπy = 0', c: '#e9e1d2' },
    { id: 2, no: 'III', zh: '湍流', en: 'TURBULENCE', eq: '∂u/∂t + (u·∇)u = −∇p + ν∇²u', c: '#d9c3a0' },
    { id: 3, no: 'IV', zh: '混沌', en: 'STRANGE ATTRACTOR', eq: 'ẋ = σ(y − x)   ẏ = x(ρ − z) − y   ż = xy − βz', c: '#ffc58a', pts: 'lorenz' },
    { id: 4, no: 'V', zh: '分形', en: 'JULIA SET', eq: 'z ↦ z² + c', c: '#ffd6a8' },
    { id: 5, no: 'VI', zh: '生长', en: 'PHYLLOTAXIS', eq: '\u03b8\u2099 = n \u00b7 137.508\u00b0    r\u2099 = c\u221an', c: '#f2d4b0' },
    { id: 6, no: 'VII', zh: '星系', en: 'DENSITY WAVE', eq: 'Ωₚ = Ω(r) − κ(r)/2', c: '#a9c4ff', pts: 'galaxy' },
    { id: 7, no: 'VIII', zh: '视界', en: 'EVENT HORIZON', eq: 'rₛ = 2GM / c²', c: '#ffcf96' }
  ];
  /* SPEED：影片时间相对 Fuxi 原版的倍速；DUR、TRANS 为真实秒 */
  var SPEED = 2.8, DUR = 6.0 / SPEED, TRANS = 1.6 / SPEED, GATHER = 2.5, MORPH = 1.15, HOLD = window.GEWU_INTRO_HOLD || 1.7;

  var VS = 'attribute vec2 aP; void main(){ gl_Position = vec4(aP, 0.0, 1.0); }';

  var SCENE_FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uRes; uniform vec2 uCell; uniform float uS; uniform vec2 uOff; uniform float uT; uniform float uTau; uniform float uId; uniform vec2 uM; uniform float uDim; uniform vec3 uHole; uniform vec2 uHoleR;',
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

    /* I 量子：氢原子轨道的体积渲染（正负相位冷暖着色，轨道之间连续叠加） */
    'vec2 orb(vec3 x, vec3 w){',
    '  x *= 26.0; float r = length(x) + 0.001; float ct = x.z / r;',
    '  float R3 = r * r * exp(-r / 3.0) / 4.87; float R4 = r * r * r * exp(-r / 4.0) / 86.0;',
    '  float psi = w.x * R3 * (3.0 * ct * ct - 1.0) * 0.5 + w.y * R4 * (5.0 * ct * ct * ct - 3.0 * ct) * 0.5 + w.z * R3 * (x.x * x.y / (r * r)) * 2.0;',
    '  return vec2(psi * psi, psi); }',
    'vec3 chOrbital(vec2 p, float t, float tau){',
    '  float k = mod(t * 0.11, 3.0); float sg = floor(k); float f = smoothstep(0.62, 1.0, fract(k));',
    '  vec3 w = vec3(sg < 0.5 ? 1.0 - f : (sg > 1.5 ? f : 0.0), sg < 0.5 ? f : (sg < 1.5 ? 1.0 - f : 0.0), sg > 0.5 && sg < 1.5 ? f : (sg > 1.5 ? 1.0 - f : 0.0));',
    '  float a = t * 0.16 + uM.x * 1.6; float b = 0.45 + 0.25 * sin(t * 0.07) - uM.y * 0.8;',
    '  vec3 ro = vec3(sin(a) * cos(b), sin(b), cos(a) * cos(b)) * 2.4;',
    '  vec3 fw = normalize(-ro); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);',
    '  vec3 rd = normalize(fw * 1.7 + rt * p.x + up * p.y);',
    '  vec3 acc = vec3(0.0); float T = 1.0; float tt = 1.25;',
    '  for (int i = 0; i < 46; i++){',
    '    vec3 x = ro + rd * tt; vec2 d = orb(vec3(x.x, x.z, x.y), w);',
    '    float dens = d.x * 7.0;',
    '    vec3 c = d.y > 0.0 ? vec3(1.0, 0.72, 0.46) : vec3(0.46, 0.7, 1.0);',
    '    acc += c * dens * 0.07 * T; T *= exp(-dens * 0.035); tt += 0.052;',
    '  }',
    '  acc += vec3(0.6, 0.75, 1.0) * 0.05 * gl1(length(p), 0.12);',
    '  return acc;',
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

    /* III 湍流：多层域扭曲的流场，像大理石纹 / 墨流（马勃纹）般宽阔地缓慢翻卷 */
    'vec3 chFlow(vec2 p, float t, float tau){',
    '  vec2 q = p * 1.1;',
    '  vec2 a = vec2(fbm(q + vec2(0.0, t * 0.04)), fbm(q + vec2(5.2, 1.3) - t * 0.035));',
    '  vec2 b = vec2(fbm3(q + 3.6 * a + vec2(1.7, 9.2) + t * 0.05), fbm3(q + 3.6 * a + vec2(8.3, 2.8) - t * 0.045));',
    '  float f = fbm3(q + 3.8 * b);',
    '  float ph = f * 2.6 + b.x * 1.1 + a.y * 0.6 - t * 0.03;',
    '  float d = abs(fract(ph) - 0.5);',
    '  float ribbon = gl1(d, 0.06) * (0.55 + 0.6 * f);',
    '  float core = gl1(d, 0.018);',
    '  vec3 col = vec3(0.01, 0.016, 0.03) + vec3(0.25, 0.35, 0.6) * 0.05 * smoothstep(0.3, 0.8, f);',
    '  col += mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.95, 0.88), core) * ribbon * 0.95;',
    '  return col;',
    '}',

    /* IV 混沌：背景（吸引子由粒子绘制） */
    'vec3 chLorenzBg(vec2 p, float t, float tau){ return vec3(0.03, 0.022, 0.016) * gl1(length(p), 1.0) + stars(p * 0.6 + t * 0.002) * 0.25; }',

    /* V 分形：朱利亚集，c 沿圆周缓慢移动 */
    'vec3 chJulia(vec2 p, float t, float tau){',
    '  float ang = 2.05 + t * 0.045; vec2 c = 0.7885 * vec2(cos(ang), sin(ang));',
    '  vec2 z = rot(p, t * 0.03) * (1.1 - 0.12 * sin(t * 0.07));',
    '  float it = 0.0; float trap = 10.0; float esc = 0.0;',
    '  for (int i = 0; i < 96; i++){',
    '    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;',
    '    trap = min(trap, abs(length(z) - 0.5));',
    '    if (dot(z, z) > 256.0){ esc = 1.0; break; }',
    '    it += 1.0;',
    '  }',
    '  if (esc > 0.5){',
    '    float v = clamp((it - log2(log2(dot(z, z))) + 4.0) / 34.0, 0.0, 1.0);',
    '    return mix(vec3(0.32, 0.5, 0.9), vec3(1.0, 0.84, 0.62), smoothstep(0.2, 0.9, v)) * pow(v, 1.35) * 1.35;',
    '  }',
    '  return vec3(0.92, 0.72, 0.5) * gl1(trap, 0.03) * 0.55 + vec3(0.015);',
    '}',

    /* VI 生长：叶序（沃格尔螺线），每颗种子以黄金角 137.508° 排布 */
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

    /* VII 星系：背景（恒星由粒子绘制） */
    'vec3 chGalaxyBg(vec2 p, float t, float tau){ return stars(p * 0.7) * 0.45 + vec3(0.02, 0.025, 0.05) * fbm(p * 2.0 + 3.0) + vec3(0.06, 0.05, 0.04) * gl1(length(p), 0.5); }',

    /* VIII 视界：薄而宽的吸积盘；盘的远侧被引力弯折、越过阴影上方；光子环；靠近我们的一侧因多普勒效应更亮 */
    'float diskT(float r, float a, float t){',
    '  if (r < 0.24 || r > 2.5) return 0.0;',
    '  float om = 1.5 * pow(0.24 / r, 1.5); float aa = a - om * t;',
    '  float tx = fbm(rot(vec2(r, 0.0), aa) * 7.0 + 3.0);',
    '  float rings = 0.55 + 0.45 * sin(r * 72.0 + tx * 6.0);',
    '  return pow(0.24 / r, 0.7) * (0.35 + 1.6 * tx * tx) * rings * smoothstep(0.24, 0.3, r) * smoothstep(2.6, 0.9, r) * 2.4;',
    '}',
    'vec3 diskCol(float r){ return mix(vec3(1.0, 0.42, 0.16), vec3(1.0, 0.94, 0.84), pow(clamp(0.3 / r, 0.0, 1.0), 1.3)); }',
    'vec3 chHole(vec2 p, float t, float tau){',
    '  vec2 q = rot(p, -0.09); float r = length(q); float Rs = 0.165;',
    '  vec3 col = stars(q * (1.0 + 0.08 / max(r * r, 0.002)) + vec2(t * 0.003, 0.0)) * smoothstep(Rs, Rs * 2.2, r) * 0.7;',
    '  col += vec3(0.9, 0.5, 0.25) * gl1(r, 0.9) * 0.045;',
    '  float ang = atan(q.y, q.x);',
    '  float rl = (r - Rs * 1.05) * 5.5 + 0.26;',
    '  float up = smoothstep(-0.2, 0.6, q.y / max(r, 0.001));',
    '  float lens = diskT(rl, ang, t) * smoothstep(Rs * 1.03, Rs * 1.15, r) * mix(0.18, 1.0, up) * smoothstep(0.62, 0.3, r);',
    '  float dopL = 0.35 + 0.95 * smoothstep(0.4, -0.7, q.x / max(r, 0.001));',
    '  col += diskCol(rl) * lens * dopL * 0.95;',
    '  col *= smoothstep(Rs * 0.97, Rs * 1.02, r);',
    '  col += vec3(1.0, 0.93, 0.82) * (gl1(r - Rs * 1.035, 0.0032) * 1.7 + gl1(r - Rs * 1.04, 0.02) * 0.28);',
    '  float ci = 0.085; vec2 dq = vec2(q.x, q.y / ci); float rd = length(dq); float ad = atan(dq.y, dq.x);',
    '  float beta = 0.55 * pow(0.24 / max(rd, 0.24), 0.5);',
    '  float dop = pow(1.0 / (1.0 - beta * (-dq.x / max(rd, 0.001))), 3.0) * 0.42;',
    '  float behind = step(0.0, q.y) * (1.0 - smoothstep(Rs * 0.98, Rs * 1.06, r));',
    '  col += diskCol(rd) * diskT(rd, ad, t) * dop * (1.0 - behind) * 1.15;',
    '  col += vec3(1.0, 0.82, 0.58) * gl1(q.y, 0.005) * smoothstep(2.3, 0.3, abs(q.x)) * 0.2 * (1.0 - behind);',
    '  return col;',
    '}',

    'vec3 scene(float id, vec2 p, float t, float tau){',
    '  if (id < 0.5) return chOrbital(p, t, tau);',
    '  if (id < 1.5) return chCym(p, t, tau);',
    '  if (id < 2.5) return chFlow(p, t, tau);',
    '  if (id < 3.5) return chLorenzBg(p, t, tau);',
    '  if (id < 4.5) return chJulia(p, t, tau);',
    '  if (id < 5.5) return chPhyllo(p, t, tau);',
    '  if (id < 6.5) return chGalaxyBg(p, t, tau);',
    '  return chHole(p, t, tau);',
    '}',
    'void main(){',
    '  gCell = floor(gl_FragCoord.xy);',
    '  vec2 px = (gCell + 0.5) * uCell;',
    '  vec2 p = vec2(px.x - uRes.x * 0.5 - uOff.x, px.y - uRes.y * 0.5 + uOff.y) / uS;',
    '  p *= 1.0 - 0.075 * smoothstep(0.0, 7.0, uTau);',
    '  vec3 c = scene(uId, p, uT, uTau) * smoothstep(0.0, 1.4, uTau) * uDim;',
    '  vec2 hd = (px - uHole.xy) / uHoleR; c *= 1.0 - uHole.z * exp(-dot(hd, hd) * 1.3);',
    '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  /* 粒子：洛伦兹吸引子 / 密度波星系 */
  var LORENZ_VS = [
    'attribute vec4 aV; uniform vec3 uR0; uniform vec3 uR1; uniform vec3 uR2; uniform float uT; uniform vec2 uK; uniform vec2 uC; uniform float uPs; uniform float uFade;',
    'varying float vB;',
    'void main(){',
    '  vec3 p = mat3(uR0, uR1, uR2) * aV.xyz; float pers = 2.8 / (2.8 + p.z);',
    '  gl_Position = vec4(p.xy * pers * uK + uC, 0.0, 1.0);',
    '  float b = 0.03;',
    '  for (int k = 0; k < 5; k++){ float d = fract(fract(uT * 0.018 + float(k) * 0.2) - aV.w); b += exp(-d * 120.0) * 1.4 + exp(-d * 24.0) * 0.16; }',
    '  vB = b * pers * pers * uFade; gl_PointSize = uPs * pers;',
    '}'
  ].join('\n');
  var GALAXY_VS = [
    'attribute vec4 aG; uniform vec3 uR0; uniform vec3 uR1; uniform vec3 uR2; uniform float uT; uniform vec2 uK; uniform vec2 uC; uniform float uPs; uniform float uFade; uniform float uMode;',
    'varying vec3 vC;',
    'void main(){',
    '  if (uMode > 0.5){',
    '    float n = aG.x * 2200.0; float rr = sqrt(n) * 0.0196; float th = n * 2.39996 + uT * 0.04;',
    '    float wave = 0.5 + 0.5 * sin(rr * 18.0 - uT * 1.6); float grow = smoothstep(rr - 0.1, rr, uT * 0.22 + 0.15);',
    '    vec3 pp = mat3(uR0, uR1, uR2) * vec3(rr * cos(th), (0.55 - rr) * 0.25, rr * sin(th)); float ps = 3.0 / (3.0 + pp.z);',
    '    gl_Position = vec4(pp.xy * ps * uK + uC, 0.0, 1.0);',
    '    vC = mix(vec3(1.0, 0.86, 0.6), vec3(1.0, 0.55, 0.3), smoothstep(0.2, 0.9, rr)) * (0.3 + 0.8 * pow(wave, 3.0)) * grow * ps * uFade;',
    '    gl_PointSize = uPs * ps * (1.0 + rr * 1.1); return;',
    '  }',
    '  float r = aG.x; float th = aG.y + 0.22 / (r + 0.08) * uT; float phi = r * 5.0;',
    '  vec2 el = vec2(r * cos(th), r * 0.55 * sin(th));',
    '  vec2 pr = vec2(cos(phi) * el.x - sin(phi) * el.y, sin(phi) * el.x + cos(phi) * el.y);',
    '  vec3 p = mat3(uR0, uR1, uR2) * vec3(pr.x, aG.z * 0.05 * exp(-r * 1.5), pr.y); float pers = 3.0 / (3.0 + p.z);',
    '  gl_Position = vec4(p.xy * pers * uK + uC, 0.0, 1.0);',
    '  float giant = step(0.985, aG.w);',
    '  vC = mix(vec3(1.0, 0.8, 0.55), vec3(0.55, 0.7, 1.0), smoothstep(0.1, 0.6, r)) * ((0.06 * (0.3 + 0.7 * smoothstep(0.05, 0.5, r))) + 0.05 * exp(-r * 9.0) + 1.1 * giant) * pers * uFade;',
    '  gl_PointSize = uPs * pers * (1.0 + giant * 1.5);',
    '}'
  ].join('\n');
  var PTS_FS_L = 'precision mediump float; uniform vec3 uCol; varying float vB; void main(){ vec2 d = gl_PointCoord - 0.5; gl_FragColor = vec4(uCol * vB * exp(-dot(d, d) * 12.0), 1.0); }';
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
    'float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'void main(){',
    '  vec2 fc = gl_FragCoord.xy;',
    '  if (fc.y < uBar || fc.y > uRes.y - uBar){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
    '  vec2 cell = floor(fc / uCell); vec2 lc = fract(fc / uCell); vec2 uv = (cell + 0.5) / uGrid;',
    '  vec3 ca = texture2D(uSa, uv).rgb; vec3 cb = texture2D(uSb, uv).rgb;',
    '  float h = h1(cell * 0.731 + 3.1);',
    '  vec3 c = uMix >= 1.0 ? cb : (h < uMix ? cb : ca);',
    '  if (uMix < 1.0) c += (1.0 - smoothstep(0.0, 0.045, abs(h - uMix))) * 0.55 * max(ca, cb);',
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

  /* ---------- 终章：所有粒子螺旋聚成字符画 “access”，再轮换成多国语言 ---------- */
  var WORDS = window.GEWU_INTRO_WORDS || [['access', 'EN'], ['进入', '中文']];
  var WORD_FONT = '"Noto Serif SC", "Noto Serif", "Songti SC", "Hiragino Mincho ProN", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Serif Devanagari", "Noto Naskh Arabic", "Times New Roman", serif';
  var WCW = 1024, WCH = 300;
  /* 把一个词画到离屏画布上：返回画布（做字形遮罩纹理）和所有“有墨”的像素坐标（做粒子目标点） */
  function rasterWord(word) {
    var c = document.createElement('canvas'); c.width = WCW; c.height = WCH;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.font = '700 200px ' + WORD_FONT;
    var w = x.measureText(word).width || 1, size = Math.min(232, 200 * 930 / w);
    x.font = '700 ' + size.toFixed(1) + 'px ' + WORD_FONT;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
    x.fillText(word, WCW / 2, WCH / 2 + size * 0.04);
    var d = x.getImageData(0, 0, WCW, WCH).data, ink = [];
    for (var j = 0; j < WCH; j += 2) for (var i = 0; i < WCW; i += 2) if (d[(j * WCW + i) * 4 + 3] > 120) ink.push(i, j);
    return { canvas: c, ink: ink };
  }
  var WORD_VS = [
    'attribute vec2 aF; attribute vec2 aT; attribute vec2 aS;',
    'uniform float uP; uniform float uT; uniform vec2 uK; uniform vec2 uC; uniform vec2 uWC; uniform float uTurns; uniform float uBurst; uniform float uMode; uniform float uPs; uniform float uB; uniform float uHov;',
    'varying vec3 vC;',
    'void main(){',
    '  float e = clamp((uP - aS.x * 0.4) / 0.6, 0.0, 1.0); e = e * e * (3.0 - 2.0 * e);',
    '  vec2 f = aF - uWC; vec2 g = aT - uWC; float r0 = length(f); float r1 = length(g);',
    '  float a0 = atan(f.y, f.x); float a1 = atan(g.y, g.x); float da = a1 - a0; da -= 6.2831853 * floor((da + 3.14159265) / 6.2831853);',
    '  float fly = sin(3.14159265 * e);',
    '  vec2 p;',
    '  if (uMode < 0.5){ float ang = a0 + (da + uTurns * 6.2831853) * e; float r = mix(r0, r1, e) * (1.0 + uBurst * fly); p = uWC + r * vec2(cos(ang), sin(ang)); }',
    '  else { vec2 dl = aT - aF; p = mix(aF, aT, e) + vec2(-dl.y, dl.x) * uBurst * fly; }',
    '  float settled = smoothstep(0.92, 1.0, e);',
    '  p += settled * 0.0035 * vec2(sin(uT * 2.3 + aS.y * 40.0), cos(uT * 1.9 + aS.y * 31.0));',
    '  gl_Position = vec4(p * uK + uC, 0.0, 1.0);',
    '  float tw = 0.7 + 0.3 * sin(uT * (1.2 + 2.5 * aS.y) + aS.y * 50.0);',
    '  vC = mix(vec3(1.0, 0.72, 0.42), vec3(1.0, 0.93, 0.82), settled) * (0.16 + 0.5 * fly + 0.3 * settled * tw) * uB * (1.0 + 0.45 * uHov);',
    '  gl_PointSize = uPs * (1.0 + 0.7 * fly);',
    '}'
  ].join('\n');
  var MASK_VS = 'attribute vec2 aP; uniform vec4 uR; varying vec2 vUV; void main(){ vUV = vec2(aP.x * 0.5 + 0.5, 0.5 - aP.y * 0.5); gl_Position = vec4(mix(uR.xy, uR.zw, aP * 0.5 + 0.5), 0.0, 1.0); }';
  var MASK_FS = 'precision mediump float; uniform sampler2D uTex; uniform float uM; uniform float uT; varying vec2 vUV; void main(){ float a = texture2D(uTex, vUV).a; float sh = 0.85 + 0.15 * sin(uT * 1.7 + vUV.x * 9.0); gl_FragColor = vec4(vec3(1.0, 0.92, 0.8) * a * uM * sh, 1.0); }';

  function sm(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function compile(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { var log = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(log); }
    return s;
  }
  function program(gl, vs, fs, attr) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    (Array.isArray(attr) ? attr : [attr]).forEach(function (a, i) { gl.bindAttribLocation(p, i, a); }); gl.linkProgram(p);
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

  /* 粒子数据 */
  function lorenzData() {
    var n = 36000, out = new Float32Array(n * 4), x = 0.1, y = 0, z = 0, dt = 0.004, s = 10, r = 28, b = 8 / 3, i;
    for (i = 0; i < 1500; i++) { var dx = s * (y - x), dy = x * (r - z) - y, dz = x * y - b * z; x += dx * dt; y += dy * dt; z += dz * dt; }
    for (i = 0; i < n; i++) {
      var ax = s * (y - x), ay = x * (r - z) - y, az = x * y - b * z; x += ax * dt; y += ay * dt; z += az * dt;
      out[i * 4] = x / 24; out[i * 4 + 1] = (z - 25) / 24; out[i * 4 + 2] = y / 24; out[i * 4 + 3] = i / n;
    }
    return out;
  }
  function galaxyData() {
    var n = 80000, out = new Float32Array(n * 4);
    for (var i = 0; i < n; i++) {
      var u = Math.random(), r = i < n * 0.06 ? Math.abs(gauss()) * 0.08 : 0.05 + Math.pow(u, 0.6) * 1.15;
      out[i * 4] = Math.min(r, 1.25); out[i * 4 + 1] = Math.random() * Math.PI * 2; out[i * 4 + 2] = gauss(); out[i * 4 + 3] = Math.random();
    }
    return out;
  }
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
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function rotM(ay, ax) {
    var cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    /* R = Rx(ax) * Ry(ay)，按列存放 */
    return [[cy, sx * sy, -cx * sy], [0, cx, sx], [sy, -sx * cy, cx * cy]];
  }

  function start(force) {
    var seen = false;
    try { seen = sessionStorage.getItem('gewu-intro') === '1'; } catch (e) { /* ignore */ }
    if ((seen && !force) || FX.reduce) return;
    var el = document.createElement('div');
    el.className = 'intro intro-film';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', '开场影片：从原子到视界');
    el.innerHTML = '<canvas aria-hidden="true"></canvas>' +
      '<button type="button" class="intro-go intro-word" tabindex="-1" aria-label="进入网站（access）"><span>access</span></button>' +
      '<p class="intro-lang" aria-hidden="true"></p>';
    var cv = el.querySelector('canvas');
    var gl, P, PG, PL, PGx, PD, PW, PM, vD, quad, vL, vG, vF, vWF, vWT, vWS, texA, texB, fbA, fbB, atlasTex, texM0, texM1, N = 1, dustArr;
    try {
      gl = cv.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('no webgl');
      P = program(gl, VS, SCENE_FS, 'aP'); PG = program(gl, VS, GLYPH_FS, 'aP');
      PL = program(gl, LORENZ_VS, PTS_FS_L, 'aV'); PGx = program(gl, GALAXY_VS, PTS_FS_G, 'aG'); PD = program(gl, DUST_VS, PTS_FS_G, 'aD');
      PW = program(gl, WORD_VS, PTS_FS_G, ['aF', 'aT', 'aS']); PM = program(gl, MASK_VS, MASK_FS, 'aP');
      quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      vL = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vL); gl.bufferData(gl.ARRAY_BUFFER, lorenzData(), gl.STATIC_DRAW);
      vG = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vG); gl.bufferData(gl.ARRAY_BUFFER, galaxyData(), gl.STATIC_DRAW);
      dustArr = dustData(); vD = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vD); gl.bufferData(gl.ARRAY_BUFFER, dustArr, gl.STATIC_DRAW);
      vF = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vF); var ph = new Float32Array(2200 * 4); for (var pi = 0; pi < 2200; pi++) ph[pi * 4] = pi / 2200; gl.bufferData(gl.ARRAY_BUFFER, ph, gl.STATIC_DRAW);
      vWF = gl.createBuffer(); vWT = gl.createBuffer(); vWS = gl.createBuffer();
      texA = tex(gl, gl.LINEAR); texB = tex(gl, gl.LINEAR); atlasTex = tex(gl, gl.NEAREST); texM0 = tex(gl, gl.LINEAR); texM1 = tex(gl, gl.LINEAR);
      fbA = gl.createFramebuffer(); fbB = gl.createFramebuffer();
    } catch (err) {
      if (window.console) console.warn('Gewu intro: WebGL unavailable, using 2D version.', err && err.message);
      if (fallback) fallback(force);
      return;
    }
    try { sessionStorage.setItem('gewu-intro', '1'); } catch (e) { /* ignore */ }
    document.body.appendChild(el);
    var btn = el.querySelector('.intro-go'), lang = el.querySelector('.intro-lang');
    var W, H, dpr, gw, gh, cols, rows, S, oy0, bar = 0, q = 0, closing = false;
    var wordRect = { x: 0, y: 0, w: 1, h: 1 };
    function layoutWord() {
      var ww = Math.min(W * 0.78, 900), wh = ww * WCH / WCW, cx = W / 2, cy = H * 0.47;
      wordRect = { x: cx - ww / 2, y: cy - wh / 2, w: ww, h: wh };
      btn.style.left = wordRect.x + 'px'; btn.style.top = (cy - wh * 0.36) + 'px'; btn.style.width = ww + 'px'; btn.style.height = (wh * 0.72) + 'px';
      lang.style.top = (cy + wh * 0.4) + 'px';
    }
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
      layoutWord();
      if (fin) { morph = null; curTo = targets(word(wIdx)); maskTex(texM0, wIdx); uploadWord(curTo, curTo); wP0 = -9; if (ready) nextMorph = 0; }
    }

    var cur = (window.GEWU_INTRO_FROM | 0) % CH.length, prev = -1, sT = performance.now(), pT = 0, t0 = performance.now(), raf;
    var mx = 0, my = 0, tmx = 0, tmy = 0, ox = 0, oy = 0;
    function go(k) { prev = cur; pT = sT; cur = (k + CH.length) % CH.length; sT = performance.now(); }

    /* 终章时间线（真实秒）：影片约 15 秒后粒子开始聚拢，约 2.5 秒后聚成 “access” 并可点击；之后每隔一段时间换一种语言 */
    var finAt = window.GEWU_INTRO_REVEAL_AT !== undefined ? window.GEWU_INTRO_REVEAL_AT : CH.length * DUR - 1.2;
    var fin = false, ready = false, NW = DUST_N + 4000, raster = [], wIdx = 0, curTo = null, wP0 = 0, morph = null, nextMorph = 0, hov = 0, hovT = 0;
    function word(i) { if (!raster[i]) raster[i] = rasterWord(WORDS[i][0]); return raster[i]; }
    function targets(r) {
      var ink = r.ink, n = ink.length / 2, out = new Float32Array(NW * 2), sx = wordRect.w / WCW, sy = wordRect.h / WCH;
      for (var i = 0; i < NW; i++) {
        var k = n ? Math.floor(Math.random() * n) : 0;
        var px = wordRect.x + ((n ? ink[k * 2] : WCW / 2) + Math.random() * 2) * sx, py = wordRect.y + ((n ? ink[k * 2 + 1] : WCH / 2) + Math.random() * 2) * sy;
        out[i * 2] = (px - W / 2) / S; out[i * 2 + 1] = (H / 2 - py) / S;
      }
      return out;
    }
    function gmod(a, b) { return a - b * Math.floor(a / b); }
    /* 起点：漂浮微粒此刻的位置（与 DUST_VS 同一公式），外加吸积盘上的 4000 颗 */
    function startPositions(T) {
      var out = new Float32Array(NW * 2), uA = W / 2 / S, offx = ox * 1.6 / S, offy = -oy * 1.6 / S, i;
      for (i = 0; i < DUST_N; i++) {
        var x = dustArr[i * 4], y = dustArr[i * 4 + 1], z = dustArr[i * 4 + 2], w = dustArr[i * 4 + 3];
        var par = 0.55 + 0.9 * z, sp = 0.025 + 0.16 * z, px = x * uA, py = y * 1.15;
        px += T * sp * (0.55 + 0.45 * Math.sin(w * 6.2832));
        py += Math.sin(T * 0.35 + w * 12 + px * 1.7) * 0.09 * (0.4 + z) + T * 0.02 * (w - 0.45);
        var ax = uA / par + 0.15, ay = 1.15 / par + 0.15;
        px = gmod(px + ax, 2 * ax) - ax; py = gmod(py + ay, 2 * ay) - ay;
        out[i * 2] = px * par + offx; out[i * 2 + 1] = py * par + offy;
      }
      for (; i < NW; i++) {
        var a = Math.random() * 6.2832, r = 0.25 + Math.pow(Math.random(), 0.7) * 1.4;
        out[i * 2] = Math.cos(a) * r + ox / S; out[i * 2 + 1] = Math.sin(a) * r * 0.16 - oy / S;
      }
      return out;
    }
    function uploadWord(from, to) {
      gl.bindBuffer(gl.ARRAY_BUFFER, vWF); gl.bufferData(gl.ARRAY_BUFFER, from, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, vWT); gl.bufferData(gl.ARRAY_BUFFER, to, gl.DYNAMIC_DRAW);
    }
    function maskTex(t, i) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, word(i).canvas); }
    function setLang(i, show) {
      lang.classList.remove('on');
      setTimeout(function () { if (closing) return; lang.textContent = WORDS[i][0] + '  ·  ' + WORDS[i][1]; if (show) lang.classList.add('on'); }, show ? 120 : 0);
    }
    function beginFinale(T, tr) {
      fin = true; wP0 = tr;
      var seeds = new Float32Array(NW * 2);
      for (var i = 0; i < NW; i++) { seeds[i * 2] = Math.random(); seeds[i * 2 + 1] = Math.random(); }
      gl.bindBuffer(gl.ARRAY_BUFFER, vWS); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
      curTo = targets(word(0)); uploadWord(startPositions(T), curTo); maskTex(texM0, 0);
      btn.classList.add('show');
    }
    function startMorph(tr) {
      var ni = (wIdx + 1) % WORDS.length, to = targets(word(ni));
      uploadWord(curTo, to); maskTex(texM1, ni);
      morph = { i: ni, t0: tr, to: to, label: false };
    }
    function endMorph(tr) {
      wIdx = morph.i; curTo = morph.to; var t = texM0; texM0 = texM1; texM1 = t;
      morph = null; nextMorph = tr + HOLD; wP0 = -9;
    }

    function drawPoints(c, t, tau, dim) {
      var ph = c.pts === 'phyllo';
      var pr = c.pts === 'lorenz' ? PL : PGx, buf = c.pts === 'lorenz' ? vL : (ph ? vF : vG), count = c.pts === 'lorenz' ? 36000 : (ph ? 2200 : 80000);
      var R = c.pts === 'lorenz' ? rotM(t * 0.12 + mx * 1.5, 0.25 + my * 0.8) : (ph ? rotM(mx * 0.8, 1.35 + 0.1 * Math.sin(t * 0.15) + my * 0.5) : rotM(t * 0.05 + mx * 1.2, 0.55 + 0.1 * Math.sin(t * 0.1) + my * 0.6));
      gl.useProgram(pr.p); var u = pr.u;
      gl.uniform3f(u.uR0, R[0][0], R[0][1], R[0][2]); gl.uniform3f(u.uR1, R[1][0], R[1][1], R[1][2]); gl.uniform3f(u.uR2, R[2][0], R[2][1], R[2][2]);
      gl.uniform1f(u.uT, t);
      var sc = (c.pts === 'lorenz' ? 1.0 : 0.95) / (1 - 0.075 * sm(0, 7, tau));
      gl.uniform2f(u.uK, 2 * S * dpr * sc / (cols * gw), 2 * S * dpr * sc / (rows * gh));
      gl.uniform2f(u.uC, (cv.width / 2 + ox * dpr) * 2 / (cols * gw) - 1, (cv.height / 2 - oy * dpr) * 2 / (rows * gh) - 1);
      gl.uniform1f(u.uPs, c.pts === 'lorenz' ? 1.6 : (ph ? 2.0 : 1.25)); gl.uniform1f(u.uFade, sm(0, 1.4, tau) * dens() * dim);
      if (u.uCol) gl.uniform3f(u.uCol, 1.0, 0.78, 0.55);
      if (u.uMode) gl.uniform1f(u.uMode, ph ? 1 : 0);
      if (ph) gl.uniform1f(u.uT, tau);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.disable(gl.BLEND);
    }
    var boost = 1;
    /* 小屏上同样数量的粒子挤在更少的字符格里，按每世界单位的格数做亮度补偿 */
    function dens() { return Math.max(0.3, Math.min(1, Math.pow(S * dpr / gh / 53, 2))); }
    function drawDust(c, t, tau, mul) {
      var u = PD.u, col = hexRGB(c.c);
      gl.useProgram(PD.p);
      gl.uniform1f(u.uT, t); gl.uniform1f(u.uA, W / 2 / S);
      gl.uniform2f(u.uK, 2 * S * dpr / (cols * gw), 2 * S * dpr / (rows * gh));
      gl.uniform2f(u.uC, (cv.width / 2 + ox * dpr * 1.6) * 2 / (cols * gw) - 1, (cv.height / 2 - oy * dpr * 1.6) * 2 / (rows * gh) - 1);
      gl.uniform1f(u.uPs, W < 600 ? 1.15 : 1.3); gl.uniform1f(u.uFade, sm(0, 1.6, tau) * dens() * mul); gl.uniform3f(u.uCol, col[0], col[1], col[2]); gl.uniform1f(u.uBoost, boost);
      gl.bindBuffer(gl.ARRAY_BUFFER, vD); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, DUST_N);
      gl.disable(gl.BLEND);
    }
    var hole = 0;
    function renderChapter(k, fb, t, tau, dim, dustMul) {
      var c = CH[k];
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, cols, rows);
      gl.useProgram(P.p); var u = P.u;
      gl.uniform2f(u.uRes, cv.width, cv.height); gl.uniform2f(u.uCell, gw, gh); gl.uniform1f(u.uS, S * dpr);
      gl.uniform2f(u.uOff, ox * dpr, oy * dpr); gl.uniform1f(u.uT, t); gl.uniform1f(u.uTau, tau); gl.uniform1f(u.uId, c.id);
      gl.uniform2f(u.uM, mx, my); gl.uniform1f(u.uDim, dim);
      gl.uniform3f(u.uHole, (wordRect.x + wordRect.w / 2) * dpr, (H - wordRect.y - wordRect.h / 2) * dpr, hole); gl.uniform2f(u.uHoleR, wordRect.w * 0.62 * dpr, wordRect.h * 0.62 * dpr);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (c.pts) drawPoints(c, t, tau, dim);
      drawDust(c, t, tau, dustMul);
    }
    function clipRect() {
      var fx = 2 * dpr / (cols * gw), fy = 2 * dpr / (rows * gh);
      return [wordRect.x * fx - 1, (H - wordRect.y - wordRect.h) * fy - 1, (wordRect.x + wordRect.w) * fx - 1, (H - wordRect.y) * fy - 1];
    }
    function drawMask(t, texture, m, tm) {
      if (m <= 0.001) return;
      var u = PM.u, r = clipRect();
      gl.useProgram(PM.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture); gl.uniform1i(u.uTex, 0);
      gl.uniform4f(u.uR, r[0], r[1], r[2], r[3]); gl.uniform1f(u.uM, m); gl.uniform1f(u.uT, tm);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disable(gl.BLEND);
    }
    function drawWord(tm, p, turns, burst, bri, mode) {
      var u = PW.u;
      gl.useProgram(PW.p);
      gl.uniform1f(u.uP, p); gl.uniform1f(u.uT, tm); gl.uniform1f(u.uTurns, turns); gl.uniform1f(u.uBurst, burst); gl.uniform1f(u.uMode, mode);
      gl.uniform2f(u.uK, 2 * S * dpr / (cols * gw), 2 * S * dpr / (rows * gh));
      gl.uniform2f(u.uC, cv.width / (cols * gw) - 1, cv.height / (rows * gh) - 1);
      gl.uniform2f(u.uWC, 0, (H / 2 - (wordRect.y + wordRect.h / 2)) / S);
      gl.uniform1f(u.uPs, W < 600 ? 1.2 : 1.45); var inkCells = (wordRect.w * dpr / gw) * (wordRect.h * dpr / gh) * 0.3, crowd = Math.min(1, 3.5 * inkCells / NW);
      gl.uniform1f(u.uB, bri * Math.max(0.15, crowd)); gl.uniform1f(u.uHov, hov);
      gl.bindBuffer(gl.ARRAY_BUFFER, vWF); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, vWT); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, vWS); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, NW);
      gl.disable(gl.BLEND);
      gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
    }

    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!closing) { raster = []; resize(); } });

    var fN = 0, fAcc = 0, fLast = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (fLast) { fAcc += now - fLast; fN++; }
      fLast = now;
      if (fN >= 90) { if (fAcc / fN > 38 && q < 2) { q++; resize(); } fN = 0; fAcc = 0; }
      var tr = (now - t0) / 1000, t = tr * SPEED, tauR = (now - sT) / 1000;
      if (!closing && !fin && tauR > DUR) { go(cur + 1); tauR = 0; }
      if (!fin && tr >= finAt) beginFinale(t, tr);
      mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
      ox = -mx * 14; oy = oy0 - my * 10;
      hov += (hovT - hov) * 0.12;
      var mix = prev >= 0 ? sm(0, 1, tauR / TRANS) : 1;
      if (mix >= 1) prev = -1;
      var gp = fin ? Math.min(1, Math.max(0, (tr - wP0) / GATHER)) : 0;
      if (fin && wP0 < 0) gp = 1;
      if (fin && !ready && gp >= 1) {
        ready = true; btn.classList.add('ready'); btn.removeAttribute('tabindex'); btn.focus({ preventScroll: true }); el.classList.add('ready');
        setLang(0, true); nextMorph = tr + HOLD;
      }
      if (ready && !morph && tr >= nextMorph && !closing) startMorph(tr);
      var mp = morph ? Math.min(1, (tr - morph.t0) / MORPH) : 0;
      if (morph && mp >= 0.5 && !morph.label) { morph.label = true; setLang(morph.i, true); }
      var gpe = sm(0, 1, gp), dim = fin ? 1 - 0.45 * gpe : 1;
      hole = fin ? 0.85 * gpe : 0;
      boost = 1 + 1.8 * (prev >= 0 ? Math.sin(Math.PI * Math.min(1, mix)) : 0) + (fin && !ready ? 0.6 * Math.sin(Math.PI * gp) : 0);
      renderChapter(cur, fbB, t, tauR * SPEED, dim, fin ? 1 - gpe : 1);
      if (prev >= 0) renderChapter(prev, fbA, t, (now - pT) / 1000 * SPEED, dim, fin ? 1 - gpe : 1);
      if (fin) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbB); gl.viewport(0, 0, cols, rows);
        drawDust(CH[cur], t + 41, 9, 0.8 * sm(0.55, 1, gp));
        var M = 0.92 * (1 + 0.25 * hov);
        if (morph) {
          drawMask(t, texM0, M * (1 - sm(0, 0.25, mp)), tr);
          drawMask(t, texM1, M * sm(0.72, 1, mp), tr);
          drawWord(tr, mp, 0, 0.35, 0.85, 1);
          if (mp >= 1) endMorph(tr);
        } else {
          drawMask(t, texM0, M * sm(0.7, 1, gp), tr);
          drawWord(tr, gp, 1, 0, 1, 0);
        }
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height);
      gl.useProgram(PG.p); var u = PG.u;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA); gl.uniform1i(u.uSa, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB); gl.uniform1i(u.uSb, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, atlasTex); gl.uniform1i(u.uAtlas, 2);
      gl.uniform2f(u.uGrid, cols, rows); gl.uniform2f(u.uCell, gw, gh); gl.uniform2f(u.uRes, cv.width, cv.height);
      gl.uniform1f(u.uN, N); gl.uniform1f(u.uMix, prev >= 0 ? mix : 1); gl.uniform1f(u.uT, t); gl.uniform1f(u.uBar, bar * dpr);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.activeTexture(gl.TEXTURE0);
    }
    function close() {
      if (closing) return; closing = true;
      el.classList.add('out');
      setTimeout(function () { cancelAnimationFrame(raf); el.remove(); window.removeEventListener('resize', resize); document.removeEventListener('keydown', onKey); var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); }, 1100);
    }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    el.addEventListener('pointermove', function (e) { tmx = e.clientX / W - 0.5; tmy = e.clientY / H - 0.5; });
    el.addEventListener('click', function () { if (ready) close(); });
    btn.addEventListener('pointerenter', function () { hovT = 1; });
    btn.addEventListener('pointerleave', function () { hovT = 0; });
    btn.addEventListener('focus', function () { hovT = 0.6; });
    btn.addEventListener('blur', function () { hovT = 0; });
    window.addEventListener('resize', resize);
    document.addEventListener('keydown', onKey);
    raf = requestAnimationFrame(frame);
  }
  window.GEWU_INTRO = start;
})();
