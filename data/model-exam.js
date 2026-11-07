/* 手拉手模型 · 真题研究：近年期末、月考、中考模拟卷中的共顶点旋转全等题。
   题干按原题条件改写，来源标签照原卷标注；所有图形由代码按题目条件计算生成，答案都经过数值验证（见 scripts/check_data.js）。
   必须在 data/model.js 之后、js/app.js 之前加载。 */
(function () {
  var G = window.GEWU_G, k = Math.PI / 180;
  var S = (window.GEWU_SUBJECTS || []).filter(function (s) { return s.id === 'model'; })[0];
  if (!S) return;

  /* 直线 b→d 与以 a 为圆心、过 d 的圆的另一个交点 */
  function circleAgain(a, b, d) {
    var u = G.sub(d, b), ab = G.sub(b, a), r2 = G.dot(G.sub(d, a), G.sub(d, a));
    return G.add(b, G.mul(u, (G.dot(ab, ab) - r2) / G.dot(u, u)));
  }
  function signedAngle(o, p, q) { var a = Math.atan2(p[1] - o[1], p[0] - o[0]), b = Math.atan2(q[1] - o[1], q[0] - o[0]), d = (b - a) / k; while (d > 180) d -= 360; while (d < -180) d += 360; return d; }

  /* 1 ∠1、∠2、∠3：AB = AC，AD = AE，∠BAC = ∠DAE，B、D、E 共线；∠1 = ∠BAD，∠2 = ∠ACE，∠3 = ∠ADE */
  function figAngles(a1, a2) {
    var A = [0, 0], B = G.polar(A, 4, 232), D = G.polar(A, 4 * Math.sin(a2 * k) / Math.sin((180 - a1 - a2) * k), 232 + a1);
    var E = circleAgain(A, B, D), al = signedAngle(A, D, E), C = G.rot(B, A, al);
    return { pts: { A: A, B: B, C: C, D: D, E: E }, polys: ['ABC'], segs: ['AD', 'AE', 'BE:hl', 'CE:hl2'], cong: ['ABD:fa', 'ACE:fb'],
      ang: ['BAD:1|22', 'ACE:2|20', 'ADE:3|16'], lab: { A: 'n', D: 'sw', E: 'se' } };
  }
  var fz = figAngles(25, 30), fd = figAngles(15, 25);

  /* 2 外作等腰直角三角形：AD = AB，∠DAB = 90°；AC = AE，∠EAC = 90°；CD 与 BE 交于 F */
  var fj = (function () {
    var A = [1.2, 3], B = [0, 0], C = [4, 0], D = G.rot(B, A, -90), E = G.rot(C, A, 90), F = G.inter(C, D, B, E);
    return { pts: { A: A, B: B, C: C, D: D, E: E, F: F }, polys: ['ABC', 'ABD', 'ACE'], segs: ['CD:hl', 'BE:hl2', 'AF:dash'], cong: ['ADC:fa', 'ABE:fb'],
      right: ['DAB', 'CAE'], dots: ['F'], lab: { A: 'n', F: 's' } };
  })();

  /* 3 兰州：AB = AC，∠ABC = 62°，D 在 △ABC 外，BD 交 AC 于 O，E 在 BD 上，AE = AD，∠EAD = ∠BAC */
  var fl = (function () {
    var B = [0, 0], C = [4, 0], A = [2, 2 * Math.tan(62 * k)], ap = 56, r = 2.3;
    var phi = G.solve(function (p) { var E = G.polar(A, r, p), D = G.rot(E, A, ap); return G.cross(G.sub(E, B), G.sub(D, B)); }, 262, 330);
    var E = G.polar(A, r, phi), D = G.rot(E, A, ap), O = G.inter(B, D, A, C);
    return { pts: { A: A, B: B, C: C, D: D, E: E, O: O }, polys: ['ABC'], segs: ['BD:hl', 'CD:hl2', 'AE', 'AD'], cong: ['ABE:fa', 'ACD:fb'],
      ang: ['ABC:62°|18', 'BDC:?|16'], dots: ['O'], lab: { A: 'n', O: 'ne', E: 'nw', D: 'e' } };
  })();

  /* 4 张店：△ABC 绕点 A 旋转得 △ADE，点 D 在 BC 上，AD = CD，∠E = 26° */
  var fr = (function () {
    var B = [0, 0], C = [5.2, 0], A = G.inter(B, G.polar(B, 1, 52), C, G.polar(C, 1, 180 - 26));
    var Ft = G.foot(A, B, C), D = G.sub(G.mul(Ft, 2), B), th = signedAngle(A, B, D), E = G.rot(C, A, th);
    return { pts: { A: A, B: B, C: C, D: D, E: E }, polys: ['ABC', 'ADE:soft'], segs: [], cong: ['ABC:fa', 'ADE:fb'], ang: ['CDE:?|16', 'AED:26°|20'], lab: { A: 'n', D: 's' } };
  })();

  /* 5 长安：等边 △ABC 与 △EDC 共顶点 C，B、D、E 共线 */
  function figBDE(alpha, extraAng) {
    var C = [0, 0], B = G.polar(C, 4, 200), A = G.rot(B, C, -alpha), r = 1.9;
    var phi = G.solve(function (p) { var D = G.polar(C, r, p), E = G.rot(D, C, -alpha); return G.cross(G.sub(D, B), G.sub(E, B)); }, 120, 200);
    var D = G.polar(C, r, phi), E = G.rot(D, C, -alpha);
    return { pts: { A: A, B: B, C: C, D: D, E: E }, polys: ['ABC', 'EDC'], segs: ['BE:hl', 'AE:hl2'], cong: ['BCD:fa', 'ACE:fb'], ang: extraAng, lab: { C: 'e', D: 's', E: 'n' } };
  }
  var fc1 = figBDE(60, ['AEC:?|16']), fc3 = figBDE(36, ['EAB:?|16', 'ECB:?|22']);

  /* 6 临淄：等边 △ABC 与等边 △BDE 共顶点 B，△BDE 绕 B 旋转 α（60° < α < 180°），AD 与 CE 交于 M */
  var fq = (function () {
    var B = [0, 0], A = G.polar(B, 4, 120), C = G.polar(B, 4, 60), D = G.polar(B, 1.9, 120 + 110), E = G.rot(D, B, -60);
    var M = G.inter(A, D, C, E);
    return { pts: { A: A, B: B, C: C, D: D, E: E, M: M }, polys: ['ABC', 'BDE'], segs: ['AD:hl', 'CM:hl2', 'BM:dash'], cong: ['ABD:fa', 'CBE:fb'],
      dots: ['M'], ang: ['EMD:?|14'], lab: { M: 'w', B: 'se', A: 'n', C: 'n' } };
  })();

  /* 7 郑州八中二模 (1)：等腰直角 △ABC、△ADE，∠BAC = ∠DAE = 90°，BD 与 CE 交于 P */
  var fp = (function () {
    var A = [0, 0], B = G.polar(A, 4, 225), C = G.polar(A, 4, 315), D = G.polar(A, 1.5, 30), E = G.polar(A, 1.5, 120), P = G.inter(B, D, C, E);
    return { pts: { A: A, B: B, C: C, D: D, E: E, P: P }, polys: ['ABC', 'ADE'], segs: ['BD:hl', 'CP:hl2'], cong: ['ABD:fa', 'ACE:fb'], right: ['BAC', 'DAE'], dots: ['P'], lab: { A: 's', P: 'n' } };
  })();

  /* 8 安岳：△ABC ≌ △ADE，∠B = 28°，∠E = 95°，∠EAB = 20° */
  var fa = (function () {
    var A = [0, 0], B = G.polar(A, 4.2, 200), C = G.inter(A, G.polar(A, 1, 257), B, G.polar(B, 1, -8)), D = G.rot(B, A, -77), E = G.rot(C, A, -77);
    return { pts: { A: A, B: B, C: C, D: D, E: E }, polys: ['ABC', 'ADE:soft'], cong: ['ABC:fa', 'ADE:fb'], ang: ['EAB:20°|30', 'ABC:28°|20', 'AED:95°|14'], lab: { A: 'e' } };
  })();

  /* 例：定西模拟（A、D、E 共线；等边 / 等腰直角） */
  function figADE(alpha, rt) {
    var C = [0, 0], A = [-4, 0], B = G.rot(A, C, -alpha), r = 1.8;
    var phi = G.solve(function (p) { var D = G.polar(C, r, p), E = G.rot(D, C, -alpha); return G.cross(G.sub(D, A), G.sub(E, A)); }, 100, 175);
    var D = G.polar(C, r, phi), E = G.rot(D, C, -alpha);
    var s = { pts: { A: A, B: B, C: C, D: D, E: E }, polys: ['ACB', 'DCE'], segs: ['AE:hl', 'BE:hl2'], cong: ['ACD:fa', 'BCE:fb'], ang: ['AEB:?|16'], lab: { C: 's', D: 'n', E: 'ne', A: 'w' } };
    if (rt) { s.pts.M = G.foot(C, D, E); s.segs.push('CM:dash'); s.right = ['ACB', 'DCE', 'CMD']; s.cap = '图 2：等腰直角三角形'; s.lab.M = 'n'; }
    else s.cap = '图 1：等边三角形';
    return s;
  }
  var fx1 = figADE(60, false), fx2 = figADE(90, true);

  /* 例：重庆期末（等腰直角 △ABC、△BDE，∠ABC = ∠DBE = 90°） */
  var fy1 = (function () {
    var B = [0, 0], A = [0, 4], C = [4, 0], D = [-2, 0], E = G.rot(D, B, -90), F = G.inter(C, E, A, D);
    return { pts: { A: A, B: B, C: C, D: D, E: E, F: F }, polys: ['ABC', 'BDE'], segs: ['AD:hl', 'CF:hl2'], cong: ['ABD:fa', 'CBE:fb'], right: ['ABC', 'DBE'], dots: ['F'], lab: { F: 'nw', E: 'e' }, cap: '图 1：D、B、C 共线' };
  })();
  var fy3 = (function () {
    var B = [0, 0], A = [0, 4], C = [4, 0], dir = G.polar([0, 0], 1, 180 - 22.5);
    var s = G.solve(function (t) { var E = G.add(C, G.mul(dir, t)), D = G.rot(E, B, 90); return G.cross(G.sub(E, A), G.sub(D, A)); }, 0.5, 5.5);
    var E = G.add(C, G.mul(dir, s)), D = G.rot(E, B, 90), Gp = G.inter(C, E, A, B), H = G.foot(Gp, A, C);
    return { pts: { A: A, B: B, C: C, D: D, E: E, G: Gp, H: H }, polys: ['ABC', 'BDE'], segs: ['AD:hl', 'CE:hl2', 'GH:dash'], cong: ['ABD:fa', 'CBE:fb'], right: ['ABC', 'DBE', 'GHC'], dots: ['G'], lab: { G: 'w', H: 'ne', E: 'n', D: 'w' }, cap: '图 3：A、E、D 共线' };
  })();

  /* 例：海口期末（旋转的直角 ∠MDN） */
  var fh = (function () {
    var A = [0, 2], B = [-2, 0], C = [2, 0], D = [0, 0];
    var E = G.inter(D, G.polar(D, 1, 150), A, B), F = G.inter(D, G.polar(D, 1, 60), A, C), M = G.polar(D, 2.5, 150), N = G.polar(D, 2.5, 60);
    return { pts: { A: A, B: B, C: C, D: D, E: E, F: F, M: M, N: N }, polys: ['ABC'], segs: ['AD', 'DM', 'DN', 'BM:hl', 'AN:hl2'], cong: ['BDM:fa', 'ADN:fb'], right: ['ADB', 'MDN'], dots: ['E', 'F'], lab: { D: 's', A: 'n', E: 'sw', F: 'se' } };
  })();

  var Q = [
    { ch: 'm2', type: 'choice', src: '2022春·驻马店期末', q: '如图，AB = AC，AD = AE，∠BAC = ∠DAE，点 B、D、E 在同一条直线上。若 ∠1 = 25°，∠2 = 30°，则 ∠3 的度数是：', fig: fz, opts: ['55°', '50°', '45°', '60°'], a: 0,
      ex: '∠BAC − ∠DAC = ∠DAE − ∠DAC，即 ∠BAD = ∠CAE，又 AB = AC，AD = AE，∴ △BAD ≌ △CAE（SAS），∴ ∠ABD = ∠2 = 30°。∠3 是 △ABD 的外角，∠3 = ∠1 + ∠ABD = 25° + 30° = 55°。', tag: '高频' },
    { ch: 'm2', type: 'fill', src: '2022秋·东阿县校级月考', q: '如图，AB = AC，AD = AE，∠BAC = ∠DAE，点 B、D、E 在同一条直线上。若 ∠1 = 15°，∠2 = 25°，则 ∠3 = ______°。', fig: fd, a: ['40', '40°'],
      ex: '同上一题的思路：△BAD ≌ △CAE（SAS）得 ∠ABD = ∠2 = 25°，∠3 = ∠1 + ∠ABD = 15° + 25° = 40°。' },
    { ch: 'm3', type: 'choice', src: '2022春·吉州区期末', q: '如图，AD = AB，∠DAB = 90°，AC = AE，∠EAC = 90°，CD 与 BE 交于点 F，连接 AF。下列结论：① DC = BE；② ∠BDC = ∠BEC；③ DC ⊥ BE；④ FA 平分 ∠DFE。其中正确的有：', fig: fj, opts: ['4 个', '3 个', '2 个', '1 个'], a: 1,
      ex: '∠DAC = ∠BAE = 90° + ∠BAC，△DAC ≌ △BAE（SAS），① 正确；由 ∠ADC = ∠ABE 和“8 字型”得 ∠DFB = ∠DAB = 90°，③ 正确；A 到 DC、BE 的距离相等（对应边上的高），④ 正确；② 一般不成立。共 3 个。', tag: '高频' },
    { ch: 'm2', type: 'choice', src: '2022春·兰州期末', q: '如图，AB = AC，点 D 在 △ABC 外，BD 交 AC 于点 O，点 E 在 BD 上，AE = AD，∠EAD = ∠BAC。若 ∠ABC = 62°，则 ∠BDC 的度数为：', fig: fl, opts: ['56°', '60°', '62°', '64°'], a: 0,
      ex: '∠BAC = 180° − 2 × 62° = 56°。∠BAE = ∠CAD（都等于 ∠BAC − ∠EAC），又 AB = AC，AE = AD，∴ △ABE ≌ △ACD（SAS），∠ABE = ∠ACD。在“8 字型”△ABO 与 △DCO 中，∠AOB = ∠DOC，∴ ∠BDC = ∠BAC = 56°。' },
    { ch: 'm4', type: 'fill', src: '2022秋·张店区校级期末', q: '如图，将 △ABC 绕点 A 旋转得到 △ADE，点 B 的对应点 D 恰好落在 BC 边上，且 AD = CD。若 ∠E = 26°，则 ∠CDE = ______°。', fig: fr, a: ['76', '76°'],
      ex: '旋转前后 △ABC ≌ △ADE：∠C = ∠E = 26°，AB = AD，∠ADE = ∠B。AD = CD ⇒ ∠DAC = ∠C = 26°，∴ ∠ADB = 52°（外角）。AB = AD ⇒ ∠B = ∠ADB = 52°，∴ ∠ADE = 52°。∠CDE = 180° − 52° − 52° = 76°。' },
    { ch: 'm4', type: 'fill', src: '2022秋·长安区校级期末', q: '如图，△ABC 和 △EDC 都是等边三角形，点 B、D、E 在同一条直线上，连接 AE，则 ∠AEC = ______°。', fig: fc1, a: ['120', '120°'],
      ex: '∠BCD = ∠ACE（都等于 60° − ∠DCA），CB = CA，CD = CE，∴ △BCD ≌ △ACE（SAS），∠AEC = ∠BDC = 180° − ∠CDE = 120°。同时得 AE = BD。' },
    { ch: 'm4', type: 'fill', src: '2022秋·长安区校级期末', q: '如图，△ABC 和 △EDC 都是等腰三角形，CA = CB，CD = CE，∠ACB = ∠DCE = 36°，点 B、D、E 在同一条直线上，连接 AE，则 ∠EAB + ∠ECB = ______°。', fig: fc3, a: ['180', '180°'],
      ex: '△BCD ≌ △ACE（SAS），∠CAE = ∠CBD。∠EAB + ∠ECB = ∠CAE + ∠CAB + ∠ECD + ∠DCB = (∠CBD + ∠DCB) + 72° + 36° = ∠CDE + 108° = 72° + 108° = 180°（∠CBD + ∠DCB 是 △BCD 的外角 ∠CDE = 72°）。' },
    { ch: 'm3', type: 'fill', src: '2022秋·临淄区期末', q: '如图，△ABC 和 △BDE 都是等边三角形，将 △BDE 绕点 B 旋转到图中位置，连接 AD、CE，二者交于点 M，则 ∠EMD = ______°。', fig: fq, a: ['60', '60°'],
      ex: '∠ABD = ∠CBE（都等于 60° + ∠ABE），BA = BC，BD = BE，∴ △ABD ≌ △CBE（SAS），CE = AD，∠BAD = ∠BCE。由“8 字型”可得 AD 与 CE 所夹的角为 60°，即 ∠EMD = ∠AMC = 60°。' },
    { ch: 'm3', type: 'tf', src: '2022秋·临淄区期末', q: '同上图，△BDE 绕点 B 旋转的过程中，CE = AD 始终成立，而且 BM 平分 ∠DMC。', fig: fq, a: true,
      ex: '△ABD ≌ △CBE 在任何位置都成立，所以 CE = AD；B 到 AD、CE 的距离相等（对应边上的高），所以 BM 平分 AD、CE 所成的含点 B 的角 ∠DMC。' },
    { ch: 'm2', type: 'choice', src: '2023·郑州八中中考二模', q: '如图，△ABC 和 △ADE 都是等腰直角三角形，AB = AC，AD = AE，∠BAC = ∠DAE = 90°，BD 与 CE 交于点 P。BD 与 CE 的关系是：', fig: fp, opts: ['BD = CE 且 BD ⊥ CE', 'BD = CE，但不一定垂直', 'BD ⊥ CE，但不一定相等', '既不一定相等也不一定垂直'], a: 0,
      ex: '△ABD ≌ △ACE（SAS）⇒ BD = CE，∠ABD = ∠ACE，再用“8 字型”得 ∠BPC = ∠BAC = 90°。', tag: '高频' },
    { ch: 'm1', type: 'choice', src: '2023春·安岳县期末', q: '如图，△ABC ≌ △ADE，∠B = 28°，∠E = 95°，∠EAB = 20°，则 ∠BAD 的度数为：', fig: fa, opts: ['77°', '62°', '57°', '55°'], a: 0,
      ex: '∠D = ∠B = 28°，∠EAD = 180° − 95° − 28° = 57°，∠BAD = ∠EAB + ∠EAD = 20° + 57° = 77°。两个全等三角形共顶点 A，相当于把 △ABC 绕 A 旋转得到 △ADE。' },
    { ch: 'm4', type: 'fill', src: '2023·定西模拟', q: '如图 1，△ACB 和 △DCE 都是等边三角形，点 A、D、E 在同一条直线上，连接 BE，则 ∠AEB = ______°。', fig: fx1, a: ['60', '60°'],
      ex: '△ACD ≌ △BCE（SAS），∠BEC = ∠ADC = 180° − 60° = 120°，∠AEB = ∠BEC − ∠DEC = 120° − 60° = 60°。' },
    { ch: 'm4', type: 'fill', src: '2023·定西模拟', q: '如图 2，△ACB 和 △DCE 都是等腰直角三角形，∠ACB = ∠DCE = 90°，点 A、D、E 在同一条直线上，CM 是 △DCE 中 DE 边上的高。若 CM = 2，BE = 3，则 AE = ______。', fig: fx2, a: ['7'],
      ex: '△ACD ≌ △BCE ⇒ AD = BE = 3；等腰直角三角形斜边上的高等于斜边的一半，DE = 2CM = 4，∴ AE = AD + DE = 3 + 4 = 7。' }
  ];

  var X = [
    { id: 'z1', type: '真题 · 2023·定西模拟', level: '真题', src: '2023·定西模拟', title: 'A、D、E 共线：从 60° 类比到 90°', figs: [fx1, fx2],
      q: '(1) 如图 1，△ACB 和 △DCE 都是等边三角形，点 A、D、E 在同一条直线上，连接 BE。(2) 如图 2，△ACB 和 △DCE 都是等腰直角三角形，∠ACB = ∠DCE = 90°，点 A、D、E 在同一条直线上，CM 为 △DCE 中 DE 边上的高，连接 BE。',
      asks: ['图 1 中，∠AEB = ______°；线段 AD 与 BE 的数量关系是 ______；', '图 2 中，求 ∠AEB 的度数，并判断 CM、AE、BE 之间的数量关系，说明理由。'],
      think: ['公共顶点是 C：两组“手”是 CA = CB、CD = CE，顶角都等于 ∠ACB。', '∠ACD = ∠BCE（都等于顶角减去 ∠DCB），所以 △ACD ≌ △BCE（SAS）。', 'A、D、E 共线 → 平角：∠ADC = 180° − ∠CDE，再用全等搬到 ∠BEC。', '等腰直角三角形斜边上的高等于斜边的一半：DM = ME = CM。'],
      sol: '<p><b>(1)</b> ∵ △ACB、△DCE 都是等边三角形，∴ CA = CB，CD = CE，∠ACB = ∠DCE = 60°，∴ ∠ACD = ∠BCE。∴ △ACD ≌ △BCE（SAS），∴ <b>AD = BE</b>，∠BEC = ∠ADC = 180° − 60° = 120°，∴ <b>∠AEB</b> = 120° − 60° = <b>60°</b>。</p>' +
        '<p><b>(2)</b> 同理 △ACD ≌ △BCE（SAS），AD = BE，∠BEC = ∠ADC = 180° − 45° = 135°，∴ <b>∠AEB</b> = 135° − 45° = <b>90°</b>。</p>' +
        '<p>∵ CD = CE，CM ⊥ DE，∴ DM = ME（三线合一）；又 ∠DCE = 90°，∴ ∠MCE = 45° = ∠MEC，∴ CM = ME，∴ DE = 2CM。</p>' +
        '<p>∴ <b>AE = AD + DE = BE + 2CM</b>。</p>',
      sum: '这道题是“类比探究”的标准形态：第 (1) 问的方法原封不动搬到第 (2) 问，只把 60° 换成 90°。多出来的“高 CM”用来把 DE 换成 2CM——等腰直角三角形斜边上的高等于斜边的一半。' },
    { id: 'z2', type: '真题 · 2022秋·重庆期末', level: '真题', src: '2022秋·重庆期末', title: '等腰直角共顶点 B：垂直 + 角平分线', figs: [fy1, fy3],
      q: '△ABC 和 △BDE 都是等腰直角三角形，∠ABC = ∠DBE = 90°（AB = BC，BD = BE）。',
      asks: ['如图 1，点 D、B、C 在同一条直线上，CE 的延长线交 AD 于点 F，求证：∠CFA = 90°；', '将 △BDE 绕点 B 旋转（任意位置），CE 的延长线交 AD 于点 F，∠CFA 的度数变吗？', '如图 3，点 A、E、D 在同一条直线上（A、D 在 E 的两侧），CE 交 AB 于点 G。若 ∠BAD = ∠ACE，求证：BG + AB = AC。'],
      think: ['公共顶点 B，两组“手”：BA = BC，BD = BE；全等三角形是 △ABD 与 △CBE。', '(1)(2) 由全等得 ∠BAD = ∠BCE，再用“8 字型”。', '(3) 由全等 ∠BAD = ∠BCE，又已知 ∠BAD = ∠ACE ⇒ CE 平分 ∠ACB。', '角平分线 + 垂直 → 过 G 作 GH ⊥ AC，GB = GH；再证 CB = CH；∠A = 45° 使 AH = GH。'],
      sol: '<p><b>(1)</b> ∵ ∠ABD = ∠CBE = 90°，BA = BC，BD = BE，∴ △ABD ≌ △CBE（SAS），∴ ∠BAD = ∠BCE。</p>' +
        '<p>在 △BCE 与 △FAE 中，∠BEC = ∠FEA（对顶角），∴ ∠AFE = ∠CBE = 90°，即 <b>∠CFA = 90°</b>。</p>' +
        '<p><b>(2)</b> 不变。任意位置都有 ∠ABD = ∠CBE（等角加减同一个角），△ABD ≌ △CBE（SAS），∠BAD = ∠BCE，同样由“8 字型”得 ∠CFA = ∠ABC = <b>90°</b>。</p>' +
        '<p><b>(3)</b> 由 (2) 的全等得 ∠BAD = ∠BCE，又 ∠BAD = ∠ACE，∴ ∠BCE = ∠ACE，即 CG 平分 ∠ACB。</p>' +
        '<p>过 G 作 GH ⊥ AC 于 H。∵ GB ⊥ BC，∴ GB = GH（角平分线上的点到角两边距离相等）。</p>' +
        '<p>在 Rt△CBG 与 Rt△CHG 中，CG = CG，GB = GH，∴ Rt△CBG ≌ Rt△CHG（HL），∴ CB = CH。</p>' +
        '<p>∵ ∠BAC = 45°，∠AHG = 90°，∴ ∠AGH = 45°，AH = GH = BG。</p>' +
        '<p>∴ AC = AH + HC = BG + BC = <b>BG + AB</b>。</p>',
      sum: '前两问是手拉手的“垂直”结论；第 (3) 问的关键是把已知的 ∠BAD = ∠ACE 和全等得到的 ∠BAD = ∠BCE 合起来，发现<b>角平分线</b>，再用“角平分线 + 垂线 + HL”搬线段。全程只用八年级上册的知识。' },
    { id: 'z3', type: '真题 · 2022秋·海口期末', level: '真题', src: '2022秋·海口期末', title: '旋转的直角：藏在等腰直角三角形里的手拉手', fig: fh,
      q: '如图，在 △ABC 中，∠BAC = 90°，AB = AC，AD ⊥ BC 于点 D。∠MDN = 90°，将 ∠MDN 绕点 D 旋转，它的两边分别交 AB、AC 于点 E、F。',
      asks: ['求证：△BDE ≌ △ADF；', '若 DM = DN，连接 BM、AN，求证：BM = AN。'],
      think: ['等腰直角三角形斜边上的高：AD = BD = CD，∠B = ∠DAC = 45°，∠ADB = 90°。', '(1) ∠BDE 与 ∠ADF 都是 90° 减去 ∠ADE（同角的余角相等）→ ASA。', '(2) 以 D 为公共顶点：DB = DA，DM = DN，∠BDM = ∠ADN——这正是一个手拉手！'],
      sol: '<p><b>(1)</b> ∵ ∠BAC = 90°，AB = AC，AD ⊥ BC，∴ ∠B = ∠C = 45°，∠BAD = ∠DAC = 45°，∴ ∠B = ∠DAF，BD = AD。</p>' +
        '<p>∵ ∠BDE + ∠EDA = 90°，∠ADF + ∠EDA = 90°，∴ ∠BDE = ∠ADF。</p>' +
        '<p>在 △BDE 和 △ADF 中，∠B = ∠DAF，BD = AD，∠BDE = ∠ADF，∴ <b>△BDE ≌ △ADF（ASA）</b>。</p>' +
        '<p><b>(2)</b> ∵ ∠BDM = ∠BDE，∠ADN = ∠ADF，由 (1) 得 ∠BDM = ∠ADN。</p>' +
        '<p>在 △BDM 和 △ADN 中，BD = AD，∠BDM = ∠ADN，DM = DN，∴ △BDM ≌ △ADN（SAS），∴ <b>BM = AN</b>。</p>',
      sum: '第 (2) 问的图里没有画出两个等腰三角形，但 D 处有两组等线段 DB = DA、DM = DN，夹角都是 90°——<b>等腰直角 △DBA 与 △DMN 共顶点 D</b>，是“看不见的手拉手”。' }
  ];

  S.questions = S.questions.concat(Q);
  S.examples = S.examples.concat(X);
  S.exIntro = '前 9 道是典型题，从“认模型”到“自己造模型”；后 3 道是期末、模拟卷的真题。先遮住解答自己做，卡住了再一步一步看思路。';
})();
