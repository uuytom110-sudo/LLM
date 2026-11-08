/* 数学专题：八年级上册的动点问题。每道例题的图形都是时间 t 的函数（ex.dyn.fig），拖动滑块就能看点怎么动、量怎么变。
   只用八年级上册的知识：三角形、全等（SSS/SAS/ASA/AAS/HL）、等腰与等边三角形、含 30° 角的直角三角形、轴对称与最短路径。 */
window.GEWU_SUBJECTS = window.GEWU_SUBJECTS || [];
(function () {
  var G = window.GEWU_G, k = Math.PI / 180;
  function f2(x) { return (Math.round(x * 100) / 100).toString(); }
  function near(a, b) { return Math.abs(a - b) < 0.03; }
  function ok(c, txt) { return '<li class="' + (c ? 'hit' : '') + '">' + (c ? '✓ ' : '') + txt + '</li>'; }
  function rows(list) { return '<dl class="readout">' + list.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd class="mono">' + r[1] + '</dd></div>'; }).join('') + '</dl>'; }

  /* 例 1：AB = AC = 10，BC = 8，D 为 AB 中点；P 以 3 cm/s 从 B 向 C，Q 从 C 向 A */
  var V1 = [3, 15 / 4];
  function fig1(t, m) {
    var B = [0, 0], C = [8, 0], A = [4, Math.sqrt(84)], D = G.mid(A, B), v = V1[m || 0];
    var P = [Math.min(8, 3 * t), 0], Q = G.on(C, A, Math.min(1, v * t / 10));
    return { pts: { A: A, B: B, C: C, D: D, P: P, Q: Q }, polys: ['ABC'], segs: ['DP:hl', 'PQ:hl2'], cong: ['BPD:fa', 'CQP:fb'], dots: ['D', 'P', 'Q'], ticks: ['AD1', 'DB1'], lab: { A: 'n', P: 's', Q: 'e', D: 'w' } };
  }
  function info1(t, m) {
    var v = V1[m || 0], BP = 3 * t, PC = 8 - 3 * t, CQ = v * t;
    return rows([['BP = 3t', f2(BP) + ' cm'], ['PC = 8 − 3t', f2(PC) + ' cm'], ['CQ = ' + (m ? '15/4·t' : '3t'), f2(CQ) + ' cm'], ['BD', '5 cm']]) +
      '<ul class="dyn-checks">' + ok(near(BP, CQ) && near(PC, 5), '△BPD ≌ △CQP（BP = CQ，∠B = ∠C，BD = PC）') + ok(near(BP, PC) && near(CQ, 5), '△BPD ≌ △CPQ（BP = CP，∠B = ∠C，BD = CQ）') + '</ul>';
  }

  /* 例 2：AB = AC，∠B = ∠C = 40°，D 在 BC 上运动 */
  var h2 = 3 * Math.tan(40 * k), AC2 = Math.hypot(3, h2);
  var M2 = { daDC: (27 - h2 * h2) / 6, caCD: 6 - AC2, daDB: (h2 * h2 + 9) / 6, baBD: AC2 };
  function fig2(x) {
    var B = [0, 0], C = [6, 0], A = [3, h2], D = [x, 0];
    return { pts: { A: A, B: B, C: C, D: D }, polys: ['ABC'], segs: ['AD:hl'], dots: ['D'], ang: ['ABC:40°|16', 'ACB:40°|16'], lab: { A: 'n', D: 's' } };
  }
  function info2(x) {
    var A = [3, h2], B = [0, 0], C = [6, 0], D = [x, 0], DA = G.dist(D, A), DC = 6 - x, DB = x;
    var bad = G.angle(B, A, D), dac = G.angle(D, A, C), adc = G.angle(A, D, C);
    return rows([['∠BAD', f2(bad) + '°'], ['∠DAC', f2(dac) + '°'], ['∠ADC', f2(adc) + '°'], ['DA', f2(DA)], ['DC', f2(DC)], ['CA', f2(AC2)]]) +
      '<ul class="dyn-checks">' + ok(near(DA, DC), '△ADC 等腰（DA = DC），∠BAD = 60°') + ok(near(DC, AC2), '△ADC 等腰（CA = CD），∠BAD = 30°') +
      ok(near(DA, DB), '△ABD 等腰（DA = DB），∠BAD = 40°') + ok(near(DB, AC2), '△ABD 等腰（BA = BD），∠BAD = 70°') + '</ul>';
  }

  /* 例 3：将军饮马。A、B 在直线 l 同侧，P 在 l 上，求 PA + PB 最小 */
  var A3 = [1, 2], B3 = [5, 3.5], A3s = [1, -2], X3 = G.inter(A3s, B3, [0, 0], [1, 0])[0];
  function fig3(x) {
    var P = [x, 0];
    return { pts: { L: [-0.6, 0], R: [7.4, 0], A: A3, B: B3, C: A3s, P: P, H: [1, 0] }, names: { C: 'A′', R: 'l' }, segs: ['LR', 'AP:hl', 'PB:hl', 'CP:dash', 'AC:dash', 'CB:dash'], dots: ['A', 'B', 'C', 'P'], right: ['AHR'], hide: ['L', 'H'], lab: { A: 'n', B: 'n', C: 's', P: 's', R: 'e' } };
  }
  function info3(x) {
    var P = [x, 0], s = G.dist(P, A3) + G.dist(P, B3), mn = G.dist(A3s, B3);
    return rows([['PA + PB', f2(s)], ['最小值 A′B', f2(mn)]]) + '<ul class="dyn-checks">' + ok(Math.abs(s - mn) < 0.01, 'P 在 A′B 与 l 的交点上：PA + PB = PA′ + PB = A′B 最小') + '</ul>';
  }

  /* 例 4：∠AOB = 30°，OP = 6，M、N 分别在 OA、OB 上，求 △PMN 周长最小值 */
  var O4 = [0, 0], P4 = G.polar(O4, 6, 18), E4 = G.polar(O4, 6, 42), F4 = G.polar(O4, 6, -18);
  var Ms4 = G.inter(E4, F4, O4, G.polar(O4, 1, 30)), best4 = G.len(Ms4);
  function fig4(d) {
    var M = G.polar(O4, d, 30), N = G.inter(M, F4, O4, [1, 0]) || [d, 0];
    return { pts: { O: O4, A: G.polar(O4, 9.5, 30), B: [9.5, 0], P: P4, M: M, N: N, E: E4, F: F4 }, names: { E: 'P₁', F: 'P₂' }, segs: ['OA', 'OB', 'PM:hl', 'MN:hl', 'NP:hl', 'EM:dash', 'NF:dash', 'PE:dash', 'PF:dash'], dots: ['P', 'M', 'N', 'E', 'F'], ang: ['BOA:30°|30'], lab: { O: 'w', M: 'n', N: 's', E: 'n', F: 's', P: 'e' } };
  }
  function info4(d) {
    var M = G.polar(O4, d, 30), N = G.inter(M, F4, O4, [1, 0]), per = G.dist(P4, M) + G.dist(M, N) + G.dist(N, P4);
    return rows([['△PMN 的周长', f2(per)], ['最小值 P₁P₂', f2(G.dist(E4, F4))]]) + '<ul class="dyn-checks">' + ok(Math.abs(per - 6) < 0.02, 'M、N 在 P₁P₂ 上：周长 = P₁M + MN + NP₂ = P₁P₂ = 6') + '</ul>';
  }

  /* 例 5：A(0, 4)，B(−2, 0)，C(4, 0)，P 从 B 出发沿 x 轴以每秒 1 个单位向右运动 */
  function fig5(t) {
    var P = [-2 + t, 0];
    return { pts: { O: [0, 0], A: [0, 4], B: [-2, 0], C: [4, 0], P: P, X: [5, 0], Y: [0, 5], W: [-3, 0] }, names: { X: 'x', Y: 'y' }, polys: ['ABP:soft', 'ABC'], segs: ['WX', 'OY', 'AP:hl'], dots: ['P'], hide: ['W'], lab: { O: 'sw', A: 'w', B: 's', C: 's', P: 's', X: 'e', Y: 'n' } };
  }
  function info5(t) {
    return rows([['BP', f2(t)], ['S△ABP = ½ · BP · 4', f2(2 * t)], ['S△ACP', f2(12 - 2 * t)]]) + '<ul class="dyn-checks">' + ok(near(t, 3), 'P 是 BC 中点：S△ABP = S△ACP = 6（中线平分面积）') + '</ul>';
  }

  /* 例 6：Rt△ABC，∠C = 90°，AC = 10，BC = 5，AX ⊥ AC，PQ = AB，P 在 AC 上，Q 在 AX 上 */
  var AB6 = Math.sqrt(125);
  function fig6(s) {
    var C = [0, 0], A = [0, 10], B = [5, 0], P = [0, 10 - s], Q = [Math.sqrt(Math.max(0, 125 - s * s)), 10];
    return { pts: { A: A, B: B, C: C, P: P, Q: Q, X: [12, 10] }, polys: ['ABC'], segs: ['AX', 'PQ:hl', 'AQ:hl2'], cong: ['ABC:fa', 'QPA:fb'], right: ['ACB', 'PAX'], dots: ['P', 'Q'], lab: { A: 'nw', P: 'w', Q: 'n', X: 'e' } };
  }
  function info6(s) {
    var AQ = Math.sqrt(Math.max(0, 125 - s * s));
    return rows([['AP', f2(s)], ['AQ', f2(AQ)], ['PQ = AB', f2(AB6)]]) +
      '<ul class="dyn-checks">' + ok(near(s, 5), 'AP = BC = 5：Rt△QAP ≌ Rt△ACB（HL：PQ = AB，AP = CB）') + ok(near(s, 10), 'AP = AC = 10（P 与 C 重合）：Rt△PAQ ≌ Rt△ACB（HL：PQ = AB，AP = AC）') + '</ul>';
  }

  /* 例 7：等边 △ABC 边长 6，P 从 A 向 B、Q 从 B 向 C，速度都是 1 cm/s */
  function fig7(t) {
    var B = [0, 0], C = [6, 0], A = [3, 3 * Math.sqrt(3)], P = G.on(A, B, t / 6), Q = [t, 0];
    var s = { pts: { A: A, B: B, C: C, P: P, Q: Q }, polys: ['ABC'], segs: ['PQ:hl'], dots: ['P', 'Q'], ang: ['QBP:60°|16'], lab: { A: 'n', P: 'nw', Q: 's' } };
    if (t > 0.05 && t < 5.95) { if (Math.abs(G.angle(B, Q, P) - 90) < 0.6) s.right = ['BQP']; if (Math.abs(G.angle(B, P, Q) - 90) < 0.6) s.right = ['BPQ']; }
    return s;
  }
  function info7(t) {
    var B = [0, 0], A = [3, 3 * Math.sqrt(3)], P = G.on(A, B, t / 6), Q = [t, 0], bpq = t > 0 && t < 6 ? G.angle(B, P, Q) : NaN, bqp = t > 0 && t < 6 ? G.angle(B, Q, P) : NaN;
    return rows([['BP = 6 − t', f2(6 - t)], ['BQ = t', f2(t)], ['∠BPQ', isNaN(bpq) ? '—' : f2(bpq) + '°'], ['∠BQP', isNaN(bqp) ? '—' : f2(bqp) + '°']]) +
      '<ul class="dyn-checks">' + ok(near(t, 2), '∠BQP = 90°：BP = 2BQ，6 − t = 2t，t = 2') + ok(near(t, 3), 'BP = BQ：△PBQ 是等边三角形，t = 3') + ok(near(t, 4), '∠BPQ = 90°：BQ = 2BP，t = 2(6 − t)，t = 4') + '</ul>';
  }

  window.GEWU_SUBJECTS.push({
    id: 'motion', name: '动点问题', short: '动', book: '数学 · 八年级上册 · 动点专题',
    tabs: ['learn', 'examples', 'practice', 'cards'],
    tabNames: { learn: '方法讲解', examples: '动态例题', cards: '方法卡' },
    exIntro: '7 道八年级上册最常考的动点题。每道题的图都能拖动时间 t，点「播放运动过程」看点怎么走，点下面的按钮直接跳到答案对应的时刻。',
    tip: '动点题的核心是<b>化动为静</b>：先用含 t 的式子表示线段，再按题目要求（全等、等腰、直角、最短、面积）<b>分类讨论</b>列方程，最后<b>检验 t 是否在运动范围内</b>。',
    chapters: [
      { id: 'd1', title: '一 · 总思路：化动为静四步法', hot: true, points: [
        { t: '四步法', d: '① <b>表示</b>：路程 = 速度 × 时间，用含 t 的式子表示每条动线段（如 BP = 3t，PC = 8 − 3t）；② <b>找关系</b>：根据题目要求（全等、等腰、直角、面积、最短）找等量关系；③ <b>列方程</b>求 t；④ <b>检验</b>：t 要在运动时间范围内，图形要真实存在。' },
        { t: '先算运动范围', d: '点 P 在线段上运动时，<b>0 ≤ t ≤ 线段长 ÷ 速度</b>。两个点同时出发、一个到达终点另一个也停止时，取<b>较小</b>的那个时间。求出的 t 超出范围要舍去。' },
        { t: '画“快照”', d: '在草稿上画出某一时刻的图，把含 t 的式子标在线段旁边——动态问题就变成了一个普通的几何计算题。' }
      ] },
      { id: 'd2', title: '二 · 动点与全等：对应关系要分类', hot: true, points: [
        { t: '为什么要分类', d: '题目只告诉“两个三角形全等”而没写“△BPD ≌ △CQP”时，对应顶点不确定，要把<b>所有可能的对应关系</b>都列出来，每种情况分别列方程。' },
        { t: '常见情形', d: '等腰三角形底边上的动点：∠B = ∠C 是确定的那组角，剩下两组边有两种配对：<b>BP = CQ 且 BD = PC</b>，或 <b>BP = PC 且 BD = CQ</b>。“速度不同”就排除了 BP = CQ（同时间内走的路程不同）。', fig: fig1(4 / 3, 1) },
        { t: '直角三角形里的 HL', d: '两个直角三角形有一组斜边相等时，只要再有一组<b>直角边</b>相等就全等。动点在直角边上运动时，让它等于另一个三角形的<b>两条直角边之一</b>，往往有两个答案。' }
      ] },
      { id: 'd3', title: '三 · 动点与等腰三角形：按顶角顶点分类', hot: true, points: [
        { t: '三类情况', d: '△ABC 中哪两边相等不确定时，分 <b>AB = AC、BA = BC、CA = CB</b> 三类（即顶角顶点分别是 A、B、C）。每一类用“等边对等角”或长度相等列方程，最后检查是否退化（点重合、三角形不存在）。' },
        { t: '角度型', d: '已知底角，动点在底边上：用“等边对等角”和三角形内角和、外角求角度。例：AB = AC，∠B = 40°，D 在 BC 上，△ADC 等腰时 ∠BAD = 60° 或 30°（AD = AC 时 D 与 B 重合，舍去）。', fig: fig2(M2.daDC) },
        { t: '“两圆一线”找点', d: '已知线段 PQ，求使 △PQR 为等腰三角形的点 R：以 P 为圆心、PQ 为半径画圆；以 Q 为圆心、PQ 为半径画圆；作 PQ 的垂直平分线。三者与所给直线（或坐标轴）的交点都要考虑，再去掉三点共线的情况。' }
      ] },
      { id: 'd4', title: '四 · 动点与直角三角形：按直角顶点分类', points: [
        { t: '按直角顶点分类', d: '“△PBQ 是直角三角形”没说哪个角是直角时，分 <b>∠B、∠P、∠Q</b> 为直角讨论；已知 ∠B = 60° 的，∠B 不可能是直角，只剩两类。' },
        { t: '30° 角的直角三角形', d: '直角三角形中 30° 角所对的直角边等于斜边的一半。在等边三角形（60°）里出现直角时，另一个锐角就是 30°，立刻得到“一边是另一边的 2 倍”，列方程。', fig: fig7(2) }
      ] },
      { id: 'd5', title: '五 · 动点与最值：最短路径', hot: true, points: [
        { t: '将军饮马', d: 'A、B 在直线 l 同侧，在 l 上找点 P 使 PA + PB 最小：作 A 关于 l 的对称点 A′，连接 A′B 交 l 于 P。依据：<b>两点之间线段最短</b>（PA = PA′）。', fig: fig3(X3) },
        { t: '周长最小：两次对称', d: '点 P 在 ∠AOB 内，在 OA、OB 上分别找 M、N 使 △PMN 周长最小：作 P 关于 OA、OB 的对称点 P₁、P₂，连接 P₁P₂ 分别交 OA、OB 于 M、N。若 ∠AOB = 30°，则 ∠P₁OP₂ = 60°，△OP₁P₂ 是等边三角形，最小周长 = OP。', fig: fig4(best4) },
        { t: '垂线段最短', d: '直线外一点与直线上各点连接的线段中，<b>垂线段最短</b>。常和角平分线一起考：角平分线上的点 D 到角一边上的动点 P 的距离，最小值就是 D 到这边的距离（等于 D 到另一边的距离）。' }
      ] },
      { id: 'd6', title: '六 · 动点与面积、坐标', points: [
        { t: '面积问题', d: '三角形面积 = ½ × 底 × 高。动点在底边上时高不变，面积与底成正比；<b>中线把三角形分成面积相等的两部分</b>。', fig: fig5(3) },
        { t: '坐标中的动点', d: '点在 x 轴上 → 纵坐标为 0；在 y 轴上 → 横坐标为 0；关于 x 轴对称 → 横坐标不变、纵坐标互为相反数；关于 y 轴对称 → 纵坐标不变、横坐标互为相反数。用这些条件列关于 t 的方程。' }
      ] },
      { id: 'd7', title: '七 · 易错清单', points: [
        { t: '漏解', d: '全等没确定对应关系、等腰没确定顶角顶点、直角没确定直角顶点、点在“直线”上没考虑两侧延长线——都会漏解。' },
        { t: '不检验', d: '求出的 t 要满足 0 ≤ t ≤ 最长运动时间；点重合、三角形不存在的情况要舍去。' },
        { t: '单位和速度', d: '速度单位（cm/s）与长度单位一致；两点速度不同、同时出发，用同一个 t 表示两条线段。' }
      ] }
    ],

    examples: [
      { id: 'k1', type: '动点 · 全等', level: '经典', title: '等腰三角形中两点运动，何时全等',
        dyn: { min: 0, max: 8 / 3, step: 0.01, start: 1, label: '时间 t', unit: ' s', rate: 0.6, fig: fig1, info: info1, modes: ['第(1)问：Q 的速度 3 cm/s', '第(2)问：Q 的速度 15/4 cm/s'], marks: [{ v: 1, label: 't = 1', m: 0 }, { v: 4 / 3, label: 't = 4/3', m: 1 }] },
        q: '如图，在 △ABC 中，AB = AC = 10 cm，BC = 8 cm，点 D 为 AB 的中点。点 P 在线段 BC 上以 3 cm/s 的速度由点 B 向点 C 运动，同时点 Q 在线段 CA 上由点 C 向点 A 运动。',
        asks: ['若点 Q 的运动速度与点 P 相同，经过 1 s 后，△BPD 与 △CQP 是否全等？请说明理由；', '若点 Q 的运动速度与点 P 不同，当点 Q 的运动速度为多少时，能够使 △BPD 与 △CQP 全等？'],
        think: ['先表示：BP = 3t，PC = 8 − 3t，BD = 5；已知的角是 ∠B = ∠C（等边对等角）。', '(1) t = 1：BP = 3，PC = 5，CQ = 3。看看哪两组边相等。', '(2) 速度不同 ⇒ BP ≠ CQ，所以只能是另一种对应：BP = PC 且 CQ = BD。', '由 BP = PC 求出 t，再由 CQ = 5 求速度。'],
        sol: '<p><b>(1)</b> 全等。t = 1 时，BP = CQ = 3 cm，PC = 8 − 3 = 5 cm = BD。</p>' +
          '<p>∵ AB = AC，∴ ∠B = ∠C。在 △BPD 和 △CQP 中，BP = CQ，∠B = ∠C，BD = CP，∴ <b>△BPD ≌ △CQP（SAS）</b>。</p>' +
          '<p><b>(2)</b> ∵ v<sub>Q</sub> ≠ v<sub>P</sub>，∴ BP ≠ CQ。要使两三角形全等，只能 BP = PC，CQ = BD = 5。</p>' +
          '<p>由 BP = PC 得 3t = 8 − 3t，t = 4/3 s；∴ v<sub>Q</sub> = CQ ÷ t = 5 ÷ 4/3 = <b>15/4 cm/s</b>。此时 △BPD ≌ △CPQ。</p>',
        sum: '动点 + 全等的关键：<b>先找确定的那组角（或边），再把剩下的边按两种对应分别列方程</b>。“速度不同”这个条件用来排除其中一种对应。' },
      { id: 'k2', type: '动点 · 等腰', level: '经典', title: '底边上的动点：△ADC 何时等腰',
        dyn: { min: 0.2, max: 5.8, step: 0.005, start: 1.2, label: 'BD 的长', unit: '', rate: 1.2, fig: fig2, info: info2, marks: [{ v: M2.caCD, label: 'CA = CD' }, { v: M2.daDC, label: 'DA = DC' }, { v: M2.daDB, label: 'DA = DB' }, { v: M2.baBD, label: 'BA = BD' }] },
        q: '如图，在 △ABC 中，AB = AC，∠B = 40°，点 D 在线段 BC 上运动（不与 B、C 重合），连接 AD。',
        asks: ['当 △ADC 是等腰三角形时，求 ∠BAD 的度数；', '当 △ABD 是等腰三角形时，求 ∠BAD 的度数。'],
        think: ['先求出所有固定的角：∠C = ∠B = 40°，∠BAC = 100°。', '△ADC 等腰没说哪两边相等 → 按顶角顶点分三类：D、C、A。', '每一类用“等边对等角”求 ∠DAC，再用 ∠BAD = 100° − ∠DAC。', '检查：AD = AC 时 ∠ADC = ∠C = 40°，∠DAC = 100°，D 与 B 重合，舍去。'],
        sol: '<p>∵ AB = AC，∠B = 40°，∴ ∠C = 40°，∠BAC = 100°。</p>' +
          '<p><b>(1)</b> ① DA = DC：∠DAC = ∠C = 40°，∠BAD = 100° − 40° = <b>60°</b>；</p>' +
          '<p>② CA = CD：∠CAD = ∠CDA = (180° − 40°) ÷ 2 = 70°，∠BAD = 100° − 70° = <b>30°</b>；</p>' +
          '<p>③ AD = AC：∠ADC = ∠C = 40°，∠DAC = 100° = ∠BAC，此时 D 与 B 重合，舍去。</p>' +
          '<p>∴ ∠BAD = 60° 或 30°。</p>' +
          '<p><b>(2)</b> ① DA = DB：∠BAD = ∠B = <b>40°</b>；② BA = BD：∠BAD = ∠BDA = (180° − 40°) ÷ 2 = <b>70°</b>；③ AB = AD：∠ADB = ∠B = 40°，∠BAD = 100°，D 与 C 重合，舍去。∴ ∠BAD = 40° 或 70°。</p>',
        sum: '等腰三角形的动点题<b>一定按顶角顶点分三类</b>，每类求完都要看点是否落在允许的范围内（这里 D 不能与 B、C 重合）。' },
      { id: 'k3', type: '动点 · 最短路径', level: '基础', title: '将军饮马：PA + PB 最小',
        dyn: { min: 0, max: 7, step: 0.01, start: 5.5, label: '点 P 的位置 x', unit: '', rate: 1.6, fig: fig3, info: info3, marks: [{ v: X3, label: '最小时的位置' }] },
        q: '如图，A、B 两点在直线 l 的同侧，点 P 在直线 l 上运动。',
        asks: ['在 l 上作出点 P，使 PA + PB 最小；', '说明你这样作的理由。'],
        think: ['拖动 P 观察：PA + PB 在某个位置最小，那里有什么特点？', '把“同侧”变成“异侧”：作 A 关于 l 的对称点 A′，则 PA = PA′。', 'PA + PB = PA′ + PB ≥ A′B，当 P 在线段 A′B 上时取等号。'],
        sol: '<p><b>(1)</b> 作点 A 关于直线 l 的对称点 A′，连接 A′B 交 l 于点 P，点 P 即为所求。</p>' +
          '<p><b>(2)</b> ∵ l 是 AA′ 的垂直平分线，∴ PA = PA′，PA + PB = PA′ + PB = A′B。</p>' +
          '<p>在 l 上任取另一点 P′，P′A + P′B = P′A′ + P′B ≥ A′B（三角形两边之和大于第三边，<b>两点之间线段最短</b>），∴ 点 P 使 PA + PB 最小。</p>',
        sum: '同侧两点 → 作其中一点的对称点 → 连线与直线的交点。理由写“两点之间线段最短”，并说明对称带来的 PA = PA′。' },
      { id: 'k4', type: '动点 · 最短路径', level: '中档', title: '两次对称：△PMN 周长最小',
        dyn: { min: 1.6, max: 9, step: 0.01, start: 7.5, label: 'OM 的长', unit: '', rate: 1.8, fig: fig4, info: info4, marks: [{ v: best4, label: '周长最小时' }] },
        q: '如图，∠AOB = 30°，点 P 在 ∠AOB 内部，OP = 6，点 M、N 分别是射线 OA、OB 上的动点。',
        asks: ['作出使 △PMN 周长最小的点 M、N；', '求 △PMN 周长的最小值。'],
        think: ['周长 = PM + MN + NP，三段折线，想办法“拉直”。', '作 P 关于 OA 的对称点 P₁、关于 OB 的对称点 P₂：PM = P₁M，PN = P₂N。', '周长 = P₁M + MN + NP₂ ≥ P₁P₂。', 'OP₁ = OP = OP₂，∠P₁OP₂ = 2∠AOB = 60° → 等边三角形。'],
        sol: '<p><b>(1)</b> 分别作点 P 关于 OA、OB 的对称点 P₁、P₂，连接 P₁P₂，交 OA 于 M，交 OB 于 N，则 M、N 即为所求。</p>' +
          '<p><b>(2)</b> 由轴对称得 PM = P₁M，PN = P₂N，OP₁ = OP = OP₂ = 6，∠P₁OA = ∠AOP，∠P₂OB = ∠BOP，</p>' +
          '<p>∴ ∠P₁OP₂ = 2∠AOB = 60°，∴ △OP₁P₂ 是等边三角形，P₁P₂ = 6。</p>' +
          '<p>△PMN 的周长 = PM + MN + NP = P₁M + MN + NP₂ = P₁P₂ = <b>6</b>，这就是最小值。</p>',
        sum: '周长最小 = 两次对称把三段“拉直”成一条线段。30° 的角对称后得到 60°，配合 OP₁ = OP₂ 得到等边三角形，最小周长 = OP。' },
      { id: 'k5', type: '动点 · 面积', level: '基础', title: '坐标系中的动点与面积',
        dyn: { min: 0, max: 6, step: 0.01, start: 1, label: '时间 t', unit: ' s', rate: 1.2, fig: fig5, info: info5, marks: [{ v: 3, label: 't = 3' }] },
        q: '如图，在平面直角坐标系中，A(0, 4)，B(−2, 0)，C(4, 0)。点 P 从点 B 出发，沿 x 轴以每秒 1 个单位长度的速度向点 C 运动，到达 C 点停止，运动时间为 t 秒。',
        asks: ['用含 t 的式子表示 △ABP 的面积 S；', '当 △ABP 的面积等于 △ABC 面积的一半时，求 t 的值和点 P 的坐标。'],
        think: ['底是 BP = t，高是点 A 到 x 轴的距离 OA = 4。', 'S△ABC = ½ × 6 × 4 = 12。', '面积等于一半 → 2t = 6；或者直接想到“中线平分面积”：P 是 BC 中点。'],
        sol: '<p><b>(1)</b> BP = t，高 OA = 4，∴ <b>S = ½ · t · 4 = 2t</b>（0 ≤ t ≤ 6）。</p>' +
          '<p><b>(2)</b> S△ABC = ½ × BC × OA = ½ × 6 × 4 = 12。由 2t = 6 得 <b>t = 3</b>，此时 BP = 3，P 的横坐标为 −2 + 3 = 1，∴ <b>P(1, 0)</b>，恰好是 BC 的中点。</p>',
        sum: '动点在底边上时，高不变，面积就是底的一次式；“面积平分”往往就是“中线”。别忘了写 t 的取值范围。' },
      { id: 'k6', type: '动点 · 全等（HL）', level: '经典', title: '斜边相等的两个直角三角形',
        dyn: { min: 0.5, max: 10, step: 0.01, start: 2.5, label: 'AP 的长', unit: '', rate: 2, fig: fig6, info: info6, marks: [{ v: 5, label: 'AP = 5' }, { v: 10, label: 'AP = 10' }] },
        q: '如图，在 Rt△ABC 中，∠C = 90°，AC = 10，BC = 5，AX ⊥ AC 于点 A。线段 PQ = AB，P、Q 两点分别在 AC 和射线 AX 上运动。',
        asks: ['当 AP 为多少时，△ABC 与 △APQ 全等？'],
        think: ['两个直角三角形：∠C = ∠PAQ = 90°，斜边 PQ = AB。', 'HL 还差一组直角边相等：AP 可以等于 BC，也可以等于 AC。', '两种情况都要写，注意对应关系不同。'],
        sol: '<p>∵ ∠C = ∠PAQ = 90°，PQ = AB，</p>' +
          '<p>① 当 AP = BC = <b>5</b> 时，在 Rt△ACB 和 Rt△QAP 中，AB = QP，BC = PA，∴ Rt△ACB ≌ Rt△QAP（HL）；</p>' +
          '<p>② 当 AP = AC = <b>10</b> 时（点 P 与 C 重合），在 Rt△ACB 和 Rt△PAQ 中，AB = PQ，AC = PA，∴ Rt△ACB ≌ Rt△PAQ（HL）。</p>' +
          '<p>∴ AP = 5 或 AP = 10。</p>',
        sum: '直角三角形 + 斜边相等 → HL，动的直角边可以对应另一个三角形的<b>两条直角边中的任意一条</b>，所以常有两解。' },
      { id: 'k7', type: '动点 · 直角', level: '中档', title: '等边三角形中，何时出现直角',
        dyn: { min: 0, max: 6, step: 0.01, start: 1, label: '时间 t', unit: ' s', rate: 1, fig: fig7, info: info7, marks: [{ v: 2, label: 't = 2' }, { v: 3, label: 't = 3' }, { v: 4, label: 't = 4' }] },
        q: '如图，等边 △ABC 的边长为 6 cm，点 P 从点 A 出发沿 AB 向点 B 运动，点 Q 从点 B 出发沿 BC 向点 C 运动，两点速度都是 1 cm/s，同时出发，设运动时间为 t s（0 < t < 6）。',
        asks: ['当 t 为何值时，△PBQ 是等边三角形？', '当 t 为何值时，△PBQ 是直角三角形？'],
        think: ['BP = 6 − t，BQ = t，∠B = 60°。', '等边：有一个角是 60° 的等腰三角形就是等边三角形 → BP = BQ。', '直角：∠B = 60° 不可能是直角，按 ∠BQP = 90° 和 ∠BPQ = 90° 分两类。', '另一个锐角是 30°，用“30° 所对的直角边是斜边的一半”。'],
        sol: '<p>BP = (6 − t) cm，BQ = t cm，∠B = 60°。</p>' +
          '<p><b>(1)</b> 当 BP = BQ 时 △PBQ 是等边三角形：6 − t = t，<b>t = 3</b>。</p>' +
          '<p><b>(2)</b> ① 若 ∠BQP = 90°，则 ∠BPQ = 30°，BQ = ½BP：t = ½(6 − t)，<b>t = 2</b>；</p>' +
          '<p>② 若 ∠BPQ = 90°，则 ∠BQP = 30°，BP = ½BQ：6 − t = ½t，<b>t = 4</b>。</p>' +
          '<p>∴ t = 2 或 t = 4 时，△PBQ 是直角三角形。</p>',
        sum: '直角三角形按直角顶点分类；在 60° 的图里出现直角，另一个角就是 30°，用“30° 角所对直角边是斜边一半”列方程。' }
    ],

    questions: [
      { ch: 'd1', type: 'fill', q: '线段 AB = 10 cm，点 P 从 A 出发以 2 cm/s 的速度沿 AB 向 B 运动，t s 后 PB = ______ cm（用含 t 的式子表示）。', a: ['10-2t', '10−2t'], ex: 'AP = 2t，PB = AB − AP = 10 − 2t（0 ≤ t ≤ 5）。' },
      { ch: 'd1', type: 'choice', q: '上题中，t 的取值范围是：', opts: ['0 ≤ t ≤ 10', '0 ≤ t ≤ 5', '0 ≤ t ≤ 2', 't ≥ 0'], a: 1, ex: 'P 到达 B 用时 10 ÷ 2 = 5 s。' },
      { ch: 'd1', type: 'choice', q: '点 P 以 3 cm/s 在长 12 cm 的线段上运动，点 Q 以 2 cm/s 在长 6 cm 的线段上运动，两点同时出发，一点到达终点时另一点也停止，则运动时间 t 的范围是：', opts: ['0 ≤ t ≤ 4', '0 ≤ t ≤ 3', '0 ≤ t ≤ 6', '3 ≤ t ≤ 4'], a: 1, ex: 'P 需 4 s，Q 需 3 s，取较小的 3 s。' },
      { ch: 'd2', type: 'fill', q: '如图，AB = AC = 10 cm，BC = 8 cm，D 为 AB 中点，P 以 3 cm/s 从 B 向 C 运动，Q 以相同速度从 C 向 A 运动，则 t = ______ s 时 △BPD ≌ △CQP。', fig: fig1(1, 0), a: ['1'], ex: '速度相同 ⇒ BP = CQ，还需 PC = BD = 5：8 − 3t = 5，t = 1。' },
      { ch: 'd2', type: 'fill', q: '在 △ABC 中，AB = AC = 12 cm，BC = 10 cm，D 为 AB 中点。点 P 以 2 cm/s 从 B 向 C 运动，点 Q 从 C 向 A 运动。若 Q 的速度与 P 不同，则当 Q 的速度为 ______ cm/s 时，△BPD 与 △CQP 全等。', a: ['2.4', '12/5'], ex: '速度不同 ⇒ BP = PC = 5，t = 2.5 s；CQ = BD = 6，v = 6 ÷ 2.5 = 2.4 cm/s。' },
      { ch: 'd2', type: 'fill', q: '同上题，若 Q 的速度与 P 相同，则 t = ______ s 时 △BPD ≌ △CQP。', a: ['2'], ex: 'BP = CQ，还需 PC = BD = 6：10 − 2t = 6，t = 2。' },
      { ch: 'd2', type: 'choice', q: '如图，Rt△ABC 中 ∠C = 90°，AC = 10，BC = 5，AX ⊥ AC，PQ = AB，P、Q 分别在 AC、AX 上运动。使 △ABC 与 △APQ 全等的 AP 的值是：', fig: fig6(5), opts: ['5', '10', '5 或 10', '7.5'], a: 2, ex: 'HL：AP 可以等于 BC = 5，也可以等于 AC = 10。' },
      { ch: 'd2', type: 'tf', q: '两个三角形全等但没有写明对应顶点时，要按不同的对应关系分类讨论。', a: true, ex: '“△ABC 与 △DEF 全等”和“△ABC ≌ △DEF”意义不同，前者对应关系不确定。' },
      { ch: 'd3', type: 'choice', q: '如图，AB = AC，∠B = 40°，D 在 BC 上运动（不与 B、C 重合），当 △ADC 为等腰三角形时，∠BAD 的度数为：', fig: fig2(M2.daDC), opts: ['60°', '30°', '60° 或 30°', '60°、30° 或 100°'], a: 2, ex: 'DA = DC → 60°；CA = CD → 30°；AD = AC 时 D 与 B 重合，舍去。' },
      { ch: 'd3', type: 'choice', q: '同上题条件，当 △ABD 为等腰三角形时，∠BAD 的度数为：', fig: fig2(M2.daDB), opts: ['40°', '70°', '40° 或 70°', '40°、70° 或 100°'], a: 2, ex: 'DA = DB → 40°；BA = BD → 70°；AB = AD 时 D 与 C 重合，舍去。' },
      { ch: 'd3', type: 'choice', q: '∠AOB = 40°，点 P 在射线 OA 上（P ≠ O），点 Q 在射线 OB 上运动。使 △OPQ 为等腰三角形的点 Q 有：', opts: ['1 个', '2 个', '3 个', '4 个'], a: 2, ex: 'OP = OQ 一个；PO = PQ 一个（40° 是锐角，圆与射线另有一个交点）；QO = QP 一个（OP 的垂直平分线与 OB 的交点）。共 3 个。' },
      { ch: 'd3', type: 'fill', q: '等腰三角形的一个角是 70°，则它的顶角是 ______°（有两个答案时用“或”连接，如 70或40）。', a: ['70或40', '40或70', '70°或40°', '40°或70°'], ex: '70° 是顶角：顶角 70°；70° 是底角：顶角 180° − 140° = 40°。' },
      { ch: 'd4', type: 'fill', q: '如图，等边 △ABC 的边长为 6 cm，P 从 A 沿 AB、Q 从 B 沿 BC 同时出发，速度都是 1 cm/s。当 ∠BQP = 90° 时，t = ______ s。', fig: fig7(2), a: ['2'], ex: '∠BPQ = 30°，BQ = ½BP：t = ½(6 − t)，t = 2。' },
      { ch: 'd4', type: 'fill', q: '同上题，当 ∠BPQ = 90° 时，t = ______ s。', fig: fig7(4), a: ['4'], ex: '∠BQP = 30°，BP = ½BQ：6 − t = ½t，t = 4。' },
      { ch: 'd4', type: 'fill', q: '同上题，当 △PBQ 是等边三角形时，t = ______ s。', fig: fig7(3), a: ['3'], ex: 'BP = BQ：6 − t = t，t = 3。' },
      { ch: 'd4', type: 'fill', q: '在 Rt△ABC 中，∠ACB = 90°，∠B = 60°，BC = 4 cm，点 P 从 B 出发以 1 cm/s 沿 BA 运动，当 CP ⊥ AB 时，t = ______ s。', a: ['2'], ex: 'CP ⊥ AB 时，在 Rt△BPC 中 ∠BCP = 30°，BP = ½BC = 2，t = 2。' },
      { ch: 'd5', type: 'choice', q: '“将军饮马”问题中，作对称点后连线得到最短路径，依据是：', fig: fig3(X3), opts: ['两点之间线段最短', '垂线段最短', '三角形的稳定性', '等边对等角'], a: 0, ex: '把同侧两点转化为异侧两点，再用两点之间线段最短。' },
      { ch: 'd5', type: 'fill', q: '如图，∠AOB = 30°，P 在角内，OP = 8，M、N 分别在 OA、OB 上运动，则 △PMN 周长的最小值为 ______。', fig: fig4(best4), a: ['8'], ex: '两次对称后 △OP₁P₂ 是等边三角形，最小周长 = P₁P₂ = OP = 8。' },
      { ch: 'd5', type: 'fill', q: '在 Rt△ABC 中，∠C = 90°，AD 平分 ∠BAC 交 BC 于 D，CD = 3，点 P 在 AB 上运动，则 DP 的最小值为 ______。', a: ['3'], ex: '垂线段最短：DP ⊥ AB 时最小；角平分线上的点到角两边距离相等，最小值 = CD = 3。' },
      { ch: 'd5', type: 'tf', q: '直线外一点与直线上各点的连线中，垂线段最短。', a: true, ex: '这是“垂线段最短”的性质，动点到直线的最小距离就是垂线段。' },
      { ch: 'd6', type: 'fill', q: '如图，A(0, 4)，B(−2, 0)，C(4, 0)，P 从 B 出发沿 x 轴以每秒 1 个单位向右运动，当 S△ABP = S△ACP 时，t = ______。', fig: fig5(3), a: ['3'], ex: '中线平分面积：P 为 BC 中点，BP = 3，t = 3。' },
      { ch: 'd6', type: 'fill', q: '点 P(2t − 4, 3) 在 y 轴上，则 t = ______。', a: ['2'], ex: 'y 轴上的点横坐标为 0：2t − 4 = 0，t = 2。' },
      { ch: 'd6', type: 'fill', q: '点 M(t + 1, 2) 与点 N(3, 2) 关于 y 轴对称，则 t = ______。', a: ['-4', '−4'], ex: '关于 y 轴对称，横坐标互为相反数：t + 1 = −3，t = −4。' },
      { ch: 'd6', type: 'choice', q: '△ABC 中，D 在 BC 上运动，当 AD 是中线时，下列结论一定成立的是：', opts: ['S△ABD = S△ACD', 'AD ⊥ BC', '∠BAD = ∠CAD', 'AB = AC'], a: 0, ex: '中线把三角形分成面积相等的两部分（等底同高）；其余三项只有等腰三角形才一定成立。' },
      { ch: 'd7', type: 'choice', q: '解动点问题时，求出 t 的值后还必须：', opts: ['检验 t 是否在运动时间范围内', '把 t 代入面积公式', '画出所有可能的图', '把 t 化成整数'], a: 0, ex: '超出范围或使点重合、三角形不存在的解要舍去。' },
      { ch: 'd7', type: 'choice', q: '点 D 在“直线” BC 上运动时，D 的位置一般要分几种情况？', opts: ['1 种', '2 种', '3 种', '4 种'], a: 2, ex: '线段 BC 上、CB 的延长线上、BC 的延长线上，共 3 种。' }
    ],

    cards: [
      { ch: 'd1', f: '动点问题四步法', b: '表示（含 t 的式子）→ 找关系 → 列方程 → 检验 t 的范围' },
      { ch: 'd1', f: '两点同时出发、一点到终点另一点也停，t 的范围怎么取？', b: '取两个到达时间中较小的那个' },
      { ch: 'd2', f: '“两三角形全等”没写对应顶点', b: '按所有可能的对应关系分类讨论' },
      { ch: 'd2', f: '等腰三角形底边上两点运动的全等题', b: '∠B = ∠C 已知；分 BP = CQ 且 BD = PC，或 BP = PC 且 BD = CQ 两类' },
      { ch: 'd2', f: '直角三角形斜边相等，动点在直角边上', b: 'HL：动的直角边可以等于另一个三角形两条直角边中的任意一条 → 常有两解' },
      { ch: 'd3', f: '动点使三角形成为等腰三角形', b: '按顶角顶点分三类，每类求完检查是否退化（点重合）' },
      { ch: 'd3', f: '“两圆一线”', b: '以两端点为圆心、线段长为半径各画圆 + 作垂直平分线，找出所有等腰三角形的第三个顶点' },
      { ch: 'd4', f: '动点使三角形成为直角三角形', b: '按直角顶点分类；有 60° 时另一锐角是 30°，用“30° 所对直角边是斜边的一半”' },
      { ch: 'd5', f: '将军饮马（同侧两点到直线上一点距离和最小）', b: '作一点关于直线的对称点，连线交直线于所求点；依据：两点之间线段最短' },
      { ch: 'd5', f: '角内一点，在两边上找 M、N 使 △PMN 周长最小', b: '作 P 关于两边的对称点 P₁、P₂，连 P₁P₂；∠AOB = 30° 时最小周长 = OP' },
      { ch: 'd5', f: '点到直线上动点的最短距离', b: '垂线段最短；常与“角平分线上的点到两边距离相等”结合' },
      { ch: 'd6', f: '动点在底边上时三角形的面积', b: '高不变，面积 = ½ × 底 × 高；中线平分面积' }
    ]
  });
})();
