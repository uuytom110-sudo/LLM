/* 数学专题：共顶点旋转全等模型（手拉手模型）。图形坐标用 js/geo.js 中的 GEWU_G 计算，保证每张图都“量得准”。
   只用到八年级上册的知识：三角形内角和与外角、全等三角形（SSS/SAS/ASA/AAS/HL）、角平分线的性质与判定、等腰与等边三角形。 */
window.GEWU_SUBJECTS = window.GEWU_SUBJECTS || [];
(function () {
  var G = window.GEWU_G;

  /* ---------- 图形 ---------- */
  /* 例 1：等边三角形，B、C、E 共线 */
  var f1 = (function () {
    var B = [0, 0], C = [4, 0], E = [7, 0], A = G.rot(C, B, 60), D = G.rot(E, C, 60);
    var F = G.inter(A, E, B, D), M = G.inter(B, D, A, C), N = G.inter(A, E, C, D);
    return { pts: { A: A, B: B, C: C, D: D, E: E, F: F, M: M, N: N }, polys: ['ABC', 'DCE'], segs: ['AE:hl', 'BD:hl2', 'CF:dash', 'MN:dash'],
      cong: ['BCD:fa', 'ACE:fb'], dots: ['F', 'M', 'N'], ang: ['AFB:?'], lab: { F: 'n', M: 'w', N: 'e', C: 's' } };
  })();
  /* 例 1 的简图（练习题用） */
  var f1s = { pts: f1.pts, polys: f1.polys, segs: ['AE:hl', 'BD:hl2'], dots: ['F'], hide: ['M', 'N'], lab: { F: 'n', C: 's' } };

  /* 例 2：等腰直角三角形，非共线 */
  var f2 = (function () {
    var A = [0, 0], B = G.polar(A, 4, 225), C = G.polar(A, 4, 315), D = G.polar(A, 2, 170), E = G.polar(A, 2, 260);
    var F = G.inter(B, D, C, E), H = G.inter(C, E, A, B);
    return { pts: { A: A, B: B, C: C, D: D, E: E, F: F, G: H }, polys: ['ABC', 'ADE'], segs: ['BD:hl', 'CF:hl2', 'AF:dash'],
      cong: ['ABD:fa', 'ACE:fb'], right: ['BAC', 'DAE'], dots: ['F', 'G'], lab: { F: 'w', G: 'se', A: 'n', E: 's' } };
  })();

  /* 例 3：以 AB、AC 为边向外作正方形 */
  var f3 = (function () {
    var A = [1.2, 3], B = [0, 0], C = [4, 0];
    var s1 = G.sqOut(A, B, C), s2 = G.sqOut(A, C, B), D = s1[0], E = s1[1], F = s2[0], Gp = s2[1];
    var O = G.inter(B, Gp, C, E), N = G.inter(C, E, A, B);
    return { pts: { A: A, B: B, C: C, D: D, E: E, F: F, G: Gp, O: O, N: N }, polys: ['ABC', 'ABDE', 'ACFG'], segs: ['BG:hl', 'CE:hl2'],
      cong: ['ABG:fa', 'AEC:fb'], dots: ['O', 'N'], lab: { O: 'n', N: 'w', A: 'n' } };
  })();

  /* 例 4：以 AB、AC 为边向外作等边三角形 */
  var f4 = (function () {
    var A = [1.4, 3], B = [0, 0], C = [4.6, 0];
    var D = G.eqOut(A, B, C), E = G.eqOut(A, C, B), O = G.inter(C, D, B, E), M = G.inter(C, D, A, B);
    return { pts: { A: A, B: B, C: C, D: D, E: E, O: O, M: M }, polys: ['ABC', 'ABD', 'ACE'], segs: ['CD:hl', 'BE:hl2', 'AO:dash'],
      cong: ['ADC:fa', 'ABE:fb'], dots: ['O', 'M'], ang: ['BOC:?'], lab: { O: 's', M: 'w', A: 'n' } };
  })();

  /* 例 5：一般顶角 α（这里画 α = 50°） */
  var f5 = (function () {
    var A = [0, 0], B = G.polar(A, 4, 245), C = G.polar(A, 4, 295), D = G.polar(A, 2, 305), E = G.polar(A, 2, 355);
    var F = G.inter(B, D, C, E), M = G.inter(B, D, A, C);
    return { pts: { A: A, B: B, C: C, D: D, E: E, F: F, M: M }, polys: ['ABC', 'ADE'], segs: ['BF:hl', 'CE:hl2'],
      cong: ['ABD:fa', 'ACE:fb'], dots: ['F', 'M'], ang: ['BAC:α|20', 'BFC:?|14'], lab: { A: 'n', M: 'w', F: 'e', D: 'n' } };
  })();

  /* 例 6：动点 D 在直线 BC 上，以 AD 为腰作等腰直角三角形 ADE */
  function f6(dx, cap) {
    var A = [0, 3], B = [-3, 0], C = [3, 0], D = [dx, 0], E = G.rot(D, A, 90);
    var segs = ['CE:hl2', 'BD:hl'];
    var pts = { A: A, B: B, C: C, D: D, E: E };
    var polys = ['ABC', 'ADE'];
    return { pts: pts, polys: polys, segs: segs, cong: ['ABD:fa', 'ACE:fb'], right: ['BAC', 'DAE'], lab: { A: 'n', D: 's' }, cap: cap };
  }
  var f6a = f6(-1, '图 1：D 在线段 BC 上'), f6b = f6(-4.2, '图 2：D 在 CB 的延长线上');

  /* 例 7：等边三角形绕公共顶点旋转（一般位置 / B、D、E 共线） */
  function f7(th, cap, extra) {
    var A = [0, 0], B = G.polar(A, 4, 240), C = G.polar(A, 4, 300), D = G.polar(A, 2, 240 + th), E = G.polar(A, 2, 300 + th);
    var s = { pts: { A: A, B: B, C: C, D: D, E: E }, polys: ['ABC', 'ADE'], segs: ['BD:hl', 'CE:hl2'], cong: ['ABD:fa', 'ACE:fb'], lab: { A: 'n' }, cap: cap };
    if (extra) extra(s);
    return s;
  }
  var th7 = G.solve(function (th) {
    var A = [0, 0], B = G.polar(A, 4, 240), D = G.polar(A, 2, 240 + th), E = G.polar(A, 2, 300 + th);
    return G.cross(G.sub(D, B), G.sub(E, B));
  }, 5, 175);
  var f7a = f7(-38, '图 1：一般位置'), f7b = f7(th7, '图 2：B、D、E 三点共线', function (s) { s.segs = ['BE:hl', 'CE:hl2']; s.ang = ['BEC:?']; s.lab.E = 'e'; s.lab.D = 'nw'; });

  /* 例 8：截长补短，构造手拉手 */
  var f8 = (function () {
    var B = [0, 0], C = [4, 0], A = G.rot(C, B, 60), O = [2, 2 / Math.sqrt(3)], R = 4 / Math.sqrt(3);
    var P = G.polar(O, R, -70), E = G.ext(P, C, G.dist(P, B));
    return { pts: { A: A, B: B, C: C, P: P, E: E }, polys: ['ABC'], segs: ['PB', 'PC', 'AP:hl', 'CE:dash', 'AE:dash'], cong: ['ABP:fa', 'ACE:fb'],
      ang: ['BPC:120°|13'], lab: { P: 's', E: 'e' } };
  })();

  /* 例 9：半角模型（正方形中 ∠EAF = 45°） */
  var f9 = (function () {
    var A = [0, 4], B = [0, 0], C = [4, 0], D = [4, 4], k = Math.PI / 180;
    var E = [4 * Math.tan(20 * k), 0], F = [4, 4 - 4 * Math.tan(25 * k)], Gp = [-(4 - F[1]), 0];
    return { pts: { A: A, B: B, C: C, D: D, E: E, F: F, G: Gp }, polys: ['ABCD'], segs: ['AE:hl', 'AF:hl', 'EF:hl2', 'GB:dash', 'AG:dash'], cong: ['ADF:fa', 'ABG:fb'],
      ang: ['EAF:45°|26'], lab: { A: 'nw', D: 'ne', B: 's', C: 'se', E: 's', G: 's', F: 'e' } };
  })();

  /* 练习用：等边三角形动点 */
  var fq1 = (function () {
    var B = [0, 0], C = [6, 0], A = G.rot(C, B, 60), D = [2, 0], E = G.rot(D, A, -60);
    return { pts: { A: A, B: B, C: C, D: D, E: E }, polys: ['ABC', 'ADE'], segs: ['CE:hl2'], lab: { A: 'n', D: 's' } };
  })();

  window.GEWU_SUBJECTS.push({
    id: 'model', name: '手拉手模型', short: '旋', book: '数学 · 八年级上册 · 全等三角形专题',
    tabs: ['learn', 'lab', 'examples', 'practice', 'cards'],
    tabNames: { learn: '模型讲解', lab: '动手旋转', examples: '题型研究', cards: '结论卡' },
    exIntro: '9 道典型题，从“认模型”到“自己造模型”。先遮住解答自己做，卡住了再一步一步看思路。',
    tip: '见到<b>共顶点 + 两组等线段 + 顶角相等</b>，立刻想到 SAS 证全等；角的关系写成“<b>等角加（减）同一个角</b>”；拉手线夹角用“<b>8 字型</b>”求，等于顶角（或它的补角）。',
    chapters: [
      { id: 'm1', title: '一 · 认识模型：什么是“手拉手”', hot: true, points: [
        { t: '模型长什么样', d: '两个<b>顶角相等</b>的等腰三角形（等边三角形、等腰直角三角形、正方形的一半都算）<b>共用顶角的顶点</b>。把顶点 A 看成“头”，两条腰看成“两只手”：大三角形 ABC 的手是 AB、AC，小三角形 ADE 的手是 AD、AE。<b>左手拉左手、右手拉右手</b>——连接 BD、CE，就得到一对全等三角形 △ABD 和 △ACE。', fig: f7a },
        { t: '三要素（缺一不可）', d: '① <b>共顶点</b>：A 是两个三角形的公共顶点；② <b>两组等线段</b>：AB = AC，AD = AE；③ <b>顶角相等</b>：∠BAC = ∠DAE。满足这三条，不管小三角形转到哪里，都有 △ABD ≌ △ACE。' },
        { t: '怎样才算“拉对了手”', d: '从 AB 转到 AC 的方向，要与从 AD 转到 AE 的方向<b>相同</b>（都是逆时针或都是顺时针）。按这个对应连线：B 连 D、C 连 E。如果连成 BE、CD，一般<b>不</b>全等——这是最常见的错误。' },
        { t: '为什么叫“旋转全等”', d: '把 △ABD 绕点 A 旋转 ∠BAC 的度数，B 正好落到 C、D 正好落到 E，于是 △ABD 和 △ACE 完全重合。旋转是九年级才系统学的，八年级上册的考试里一律用 <b>SAS 证全等</b>来说明。' },
        { t: '证明模板（背下来）', d: '∵ ∠BAC = ∠DAE，<br>∴ ∠BAC <em>+ ∠CAD</em> = ∠DAE <em>+ ∠CAD</em>（或同时<em>减去</em>，看图决定），即 ∠BAD = ∠CAE。<br>在 △ABD 和 △ACE 中，AB = AC，∠BAD = ∠CAE，AD = AE，<br>∴ △ABD ≌ △ACE（<b>SAS</b>），∴ BD = CE，∠ABD = ∠ACE，∠ADB = ∠AEC。', art: '  ∠BAC = ∠DAE\n      ↓ 加上（或减去）同一个角 ∠CAD\n  ∠BAD = ∠CAE   ← 这就是 SAS 里的“夹角”\n  AB = AC，AD = AE ← 两组“手”\n      ↓\n  △ABD ≌ △ACE（SAS）' }
      ] },
      { id: 'm2', title: '二 · 核心结论：四个“一定成立”', hot: true, points: [
        { t: '结论 ①：一对全等三角形', d: '<b>△ABD ≌ △ACE</b>（SAS）。后面所有结论都从它推出来。' },
        { t: '结论 ②：拉手线相等', d: '<b>BD = CE</b>（全等三角形的对应边相等）。' },
        { t: '结论 ③：拉手线的夹角等于顶角', d: '设 BD、CE 交于 F，BD 交 AC 于 M。由全等得 ∠ABD = ∠ACE。在“8 字型”△ABM 与 △FCM 中，∠ABM = ∠FCM，∠AMB = ∠FMC（对顶角），所以 <b>∠MFC = ∠MAB = α</b>。也就是说，<b>BD 与 CE 所夹的角等于顶角 α</b>（另一个角是 180° − α）。等边三角形 → 60°；等腰直角三角形、正方形 → 90°，即 <b>BD ⊥ CE</b>。', fig: f5 },
        { t: '结论 ④：顶点与交点的连线平分夹角', d: '连接 AF，则 <b>FA 平分 BD、CE 所成的一个角</b>（含点 A 的那个）。证法：过 A 作 AG ⊥ BD、AH ⊥ CE，因为 △ABD ≌ △ACE，<b>全等三角形对应边上的高相等</b>，所以 AG = AH（也可以用面积相等：½·BD·AG = ½·CE·AH），再由<b>角平分线的判定</b>（角的内部到角两边距离相等的点在角平分线上）得出结论。' },
        { t: '等边共线时的额外结论', d: '当 B、C、E 共线、△ABC 和 △DCE 都是等边三角形时（例 1 的图）：AE = BD；∠AFB = 60°；BD 交 AC 于 M、AE 交 CD 于 N，则 <b>△CMN 是等边三角形</b>，<b>MN ∥ BE</b>；<b>CF 平分 ∠BFE</b>；还有 <b>BF = AF + CF</b>（截长补短可证）。', fig: f1 }
      ] },
      { id: 'm3', title: '三 · 常见形态：一张表看全', points: [
        { t: '按图形分', d: '<div class="tbl"><table><tr><th>形态</th><th>顶角 α</th><th>拉手线</th><th>夹角</th></tr><tr><td>两个等边三角形</td><td>60°</td><td>相等</td><td>60°（或 120°）</td></tr><tr><td>两个等腰直角三角形</td><td>90°</td><td>相等</td><td>90°，互相垂直</td></tr><tr><td>两个正方形（共顶点）</td><td>90°</td><td>相等</td><td>90°，互相垂直</td></tr><tr><td>两个顶角都为 α 的等腰三角形</td><td>α</td><td>相等</td><td>α（或 180° − α）</td></tr></table></div>' },
        { t: '按位置分', d: '<b>共线型</b>：三个顶点在一条直线上（例 1）；<b>非共线型</b>：小三角形转到任意位置（例 2、例 7）；<b>外作型</b>：以 △ABC 的两边为边向外作等边三角形或正方形（例 3、例 4）——这时公共顶点是 A，“手”分别是 AB 与 AD、AC 与 AE。' },
        { t: '外作等边三角形', d: '以 △ABC 的边 AB、AC 为边向外作等边三角形 ABD、ACE，则 <b>CD = BE</b>，CD 与 BE 所夹锐角为 <b>60°</b>，交点 O 满足 <b>∠BOC = 120°</b>，并且 <b>OA 平分 ∠DOE</b>。', fig: f4 },
        { t: '外作正方形', d: '以 △ABC 的边 AB、AC 为边向外作正方形 ABDE、ACFG，则 <b>BG = CE</b> 且 <b>BG ⊥ CE</b>。全等三角形是 △ABG 与 △AEC，夹角 ∠BAG = ∠EAC = 90° + ∠BAC（等角<b>加</b>同一个角）。', fig: f3 }
      ] },
      { id: 'm4', title: '四 · 进阶：看不见的手拉手', hot: true, points: [
        { t: '动点型：D 在直线 BC 上运动', d: '等腰直角 △ABC（∠BAC = 90°）中，点 D 在直线 BC 上，以 AD 为腰作等腰直角 △ADE（∠DAE = 90°），连接 CE。始终有 △ABD ≌ △ACE，<b>BD = CE</b>，∠ACE = ∠B = 45°，所以 <b>CE ⊥ BC</b>。线段关系要<b>分三种位置讨论</b>：D 在线段 BC 上 → <b>BC = CD + CE</b>；D 在 CB 延长线上 → <b>BC = CD − CE</b>；D 在 BC 延长线上 → <b>BC = CE − CD</b>。', fig: f6a },
        { t: '旋转到三点共线', d: '等边 △ABC 与 △ADE 共顶点 A，当 B、D、E 三点共线时：∠ADB = 180° − 60° = 120°，由全等 ∠AEC = ∠ADB = 120°，所以 <b>∠BEC = 60°</b>，且 <b>BE = AE + CE</b>（BE = DE + BD = AE + CE）。等腰直角三角形时 ∠BEC = 90°。', fig: f7b },
        { t: '构造手拉手：截长补短', d: '题目只给一个等边三角形（或等腰三角形）和一个点，要证 <b>a = b + c</b> 型的结论时，常以公共顶点为顶点<b>补出另一个等边三角形</b>，把分散的线段“搬”到一条线上。例：P 在等边 △ABC 外，∠BPC = 120°，延长 PC 到 E 使 CE = PB，则 △ABP ≌ △ACE，△APE 是等边三角形，于是 <b>PA = PB + PC</b>。', fig: f8 },
        { t: '同源模型：半角模型', d: '正方形 ABCD 中，E、F 分别在 BC、CD 上，∠EAF = 45°（大角 90° 的一半）。延长 CB 到 G 使 BG = DF，先证 △ABG ≌ △ADF（SAS），再证 △AEG ≌ △AEF（SAS），得 <b>EF = BE + DF</b>，△CEF 的周长等于正方形边长的 2 倍。本质也是“绕公共顶点 A 转一转”。', fig: f9 },
        { t: '什么时候想到它', d: '① 图中有<b>两个共顶点的等边三角形 / 等腰直角三角形 / 正方形</b>；② 题目给了 60° 或 90° 且有一组邻边相等；③ 要证的线段分散在两处，需要“搬到一起”；④ 题目有“旋转”“绕点 A 转动”等字样。' }
      ] },
      { id: 'm5', title: '五 · 命题规律与易错点', points: [
        { t: '期中试卷怎么考', d: '<b>选择 / 填空</b>：求拉手线夹角的度数、判断“下列结论正确的有几个”；<b>解答题</b>常见三问递进：(1) 证全等或线段相等；(2) 求夹角或证垂直；(3) 小三角形旋转到新位置，判断结论是否仍成立、或三点共线时求角度 / 线段关系；<b>压轴题</b>常做“类比探究”：等边 → 等腰直角 → 一般等腰，结论里的 60°、90° 换成 α。' },
        { t: '易错 1：角的加减方向', d: '∠BAD = ∠CAE 是“同时加上 ∠CAD”还是“同时减去 ∠CAD”，<b>要看图</b>：射线 AD 在 ∠BAC 外面就“加”，在里面就“减”。旋转探究题中图形变了，这一步的写法也要跟着变。' },
        { t: '易错 2：对应点连错', d: '手拉手必须“对应端点”相连，连错了不全等。写全等式时<b>对应顶点写在对应位置</b>：△ABD ≌ △ACE，A↔A，B↔C，D↔E。' },
        { t: '易错 3：夹角是 α 还是 180° − α', d: '两条直线相交成两对角，一对等于 α，另一对等于 180° − α。求 ∠BFC 时，一定要在图上找“8 字型”确认是哪一个；例 4 中拉手线夹锐角 60°，而 ∠BOC = 120°。' },
        { t: '易错 4：动点题漏情况', d: '“点 D 在<b>直线</b> BC 上”要分 D 在线段上、在两侧延长线上三种情况；“在<b>射线</b>上”是两种；“在<b>线段</b>上”只有一种。每种情况线段的和差关系都不一样。' },
        { t: '答题规范', d: '写清“在 △___ 和 △___ 中”，三个条件按 <b>边、角、边</b> 的顺序列出并注明理由，最后写“∴ △___ ≌ △___（SAS）”。证角平分线时说明“到角两边的距离相等”，不要直接说“因为全等所以平分”。' }
      ] }
    ],

    examples: [
      { id: 'e1', type: '题型一 · 等边共线', level: '基础', title: '经典图：两个等边三角形“并排”', fig: f1,
        q: '如图，点 B、C、E 在同一条直线上，△ABC 和 △DCE 都是等边三角形（A、D 在 BE 同侧）。连接 AE、BD，AE 与 BD 交于点 F，AE 交 CD 于点 N，BD 交 AC 于点 M，连接 CF、MN。',
        asks: ['求证：AE = BD；', '求 ∠AFB 的度数；', '求证：△CMN 是等边三角形，且 MN ∥ BE；', '求证：CF 平分 ∠BFE。'],
        think: [
          '<b>找公共顶点</b>：C 同时是两个等边三角形的顶点 → 手拉手。两组“手”：CB = CA，CD = CE。',
          '<b>找夹角</b>：∠BCD 与 ∠ACE 都等于 60° + ∠ACD（等角加同一个角）→ △BCD ≌ △ACE（SAS）。',
          '<b>求角</b>：由全等得 ∠CBD = ∠CAE。∠AFB 是 △BFE 的外角，∠ACB 是 △ACE 的外角，把两个外角联系起来。',
          '<b>再找一对全等</b>：∠ACD = 180° − 60° − 60° = 60°，于是 △BCM ≌ △ACN（ASA）→ CM = CN。',
          '<b>证平分</b>：过 C 作两条拉手线的垂线，全等三角形对应边上的高相等，再用角平分线的判定。'
        ],
        sol: '<p><b>(1)</b> ∵ △ABC、△DCE 都是等边三角形，∴ CB = CA，CD = CE，∠ACB = ∠DCE = 60°。</p>' +
          '<p>∴ ∠ACB + ∠ACD = ∠DCE + ∠ACD，即 ∠BCD = ∠ACE。</p>' +
          '<p>在 △BCD 和 △ACE 中，CB = CA，∠BCD = ∠ACE，CD = CE，∴ △BCD ≌ △ACE（SAS），∴ <b>AE = BD</b>。</p>' +
          '<p><b>(2)</b> 由 (1) 得 ∠CBD = ∠CAE。∵ ∠AFB 是 △BFE 的外角，∴ ∠AFB = ∠FBE + ∠FEB = ∠CAE + ∠AEC。</p>' +
          '<p>又 ∵ ∠ACB 是 △ACE 的外角，∴ ∠CAE + ∠AEC = ∠ACB = 60°，∴ <b>∠AFB = 60°</b>。</p>' +
          '<p><b>(3)</b> ∵ B、C、E 共线，∴ ∠ACD = 180° − ∠ACB − ∠DCE = 60°，即 ∠BCM = ∠ACN = 60°。</p>' +
          '<p>在 △BCM 和 △ACN 中，∠CBM = ∠CAN，CB = CA，∠BCM = ∠ACN，∴ △BCM ≌ △ACN（ASA），∴ CM = CN。</p>' +
          '<p>又 ∠MCN = 60°，∴ <b>△CMN 是等边三角形</b>（有一个角是 60° 的等腰三角形是等边三角形）。</p>' +
          '<p>∴ ∠NMC = 60° = ∠BCM，∴ <b>MN ∥ BE</b>（内错角相等，两直线平行）。</p>' +
          '<p><b>(4)</b> 过点 C 作 CG ⊥ BD 于 G，CH ⊥ AE 于 H。∵ △BCD ≌ △ACE，∴ 它们的面积相等，且 BD = AE。</p>' +
          '<p>∴ ½·BD·CG = ½·AE·CH，∴ CG = CH。∴ 点 C 在 ∠BFE 的平分线上，即 <b>CF 平分 ∠BFE</b>。</p>',
        sum: '手拉手三步：<b>找共顶点 → 找两组等线段 → 等角加（减）同一个角得夹角</b>，然后 SAS。求拉手线夹角用外角或“8 字型”，结果等于顶角 60°。证“顶点与交点的连线平分角”用<b>全等三角形对应边上的高相等 + 角平分线的判定</b>。',
        vary: [
          { q: '变式 1：把 △DCE 绕点 C 旋转一个角度（B、C、E 不再共线），AE = BD 还成立吗？AE 与 BD 所夹的锐角是多少？', a: '仍成立。∠BCD 与 ∠ACE 都等于 60° ± ∠ACD，△BCD ≌ △ACE（SAS）照样成立，AE = BD；用“8 字型”可得 AE 与 BD 所夹锐角仍为 <b>60°</b>。' },
          { q: '变式 2：在原图中，求证 BF = AF + CF。', a: '由 (2)(4) 得 ∠BFE = 120°，CF 平分它，∴ ∠BFC = 60°。在 BF 上截取 FG = FC，则 △FCG 是等边三角形，CG = CF，∠GCF = 60° = ∠BCA，∴ ∠BCG = ∠ACF。又 CB = CA，∴ △BCG ≌ △ACF（SAS），BG = AF，∴ BF = BG + GF = AF + CF。' }
        ] },

      { id: 'e2', type: '题型二 · 等腰直角', level: '基础', title: '拉手线相等且垂直', fig: f2,
        q: '如图，△ABC 和 △ADE 都是等腰直角三角形，∠BAC = ∠DAE = 90°。连接 BD、CE，CE 的延长线交 BD 于点 F、交 AB 于点 G，连接 AF。',
        asks: ['求证：BD = CE；', '求证：BD ⊥ CE；', '求 ∠AFC 的度数。'],
        think: [
          '公共顶点 A，两组“手”：AB = AC，AD = AE；顶角都是 90°。',
          '<b>看清角的位置</b>：射线 AE 在 ∠BAC 内部，射线 AB 在 ∠DAE 内部，两个直角的<b>公共部分是 ∠BAE</b>。同时减去 ∠BAE，得 ∠BAD = ∠CAE → △ABD ≌ △ACE（SAS）。',
          '求垂直：由全等得 ∠ABD = ∠ACE。在“8 字型”△AGC 与 △FGB 中，∠ACG = ∠FBG，∠AGC = ∠FGB（对顶角），所以 ∠GFB = ∠GAC = 90°。',
          '求 ∠AFC：A 到 BD、CE 的距离相等（对应边上的高），所以 FA 平分 ∠DFC。'
        ],
        sol: '<p><b>(1)</b> ∵ △ABC、△ADE 都是等腰直角三角形，∴ AB = AC，AD = AE，∠BAC = ∠DAE = 90°。</p>' +
          '<p>由图可知 ∠BAE 是两个直角的公共部分，∴ ∠DAE − ∠BAE = ∠BAC − ∠BAE，即 <b>∠BAD = ∠CAE</b>。</p>' +
          '<p>在 △ABD 和 △ACE 中，AB = AC，∠BAD = ∠CAE，AD = AE，∴ △ABD ≌ △ACE（SAS），∴ <b>BD = CE</b>。</p>' +
          '<p><b>(2)</b> 由 (1) 得 ∠ABD = ∠ACE，即 ∠FBG = ∠ACG。</p>' +
          '<p>在 △FBG 和 △ACG 中，∠FGB = ∠AGC（对顶角相等），∴ ∠BFG = 180° − ∠FBG − ∠FGB = 180° − ∠ACG − ∠AGC = ∠GAC = 90°。∴ <b>BD ⊥ CE</b>。</p>' +
          '<p><b>(3)</b> 过点 A 作 AM ⊥ BD 于 M，AN ⊥ CE 于 N。∵ △ABD ≌ △ACE，∴ BD = CE，且面积相等，∴ ½·BD·AM = ½·CE·AN，∴ AM = AN。</p>' +
          '<p>∴ 点 A 在 ∠DFC 的平分线上，∠AFC = ½∠DFC = ½ × 90° = <b>45°</b>。</p>',
        sum: '等腰直角手拉手的标准结论：<b>BD = CE，BD ⊥ CE</b>，顶点与交点的连线平分直角，得 45°。证“∠BAD = ∠CAE”时<b>先看清哪个角是公共部分</b>：本图中射线 AE、AB 交错，公共部分是 ∠BAE，所以用“同时减去 ∠BAE”。',
        vary: [
          { q: '变式：若把题中“等腰直角三角形”换成“正方形 ABPC 和正方形 ADQE”（AB、AC 为一个正方形的邻边，AD、AE 为另一个正方形的邻边），BD 与 CE 的关系还成立吗？', a: '成立。正方形的邻边相等、夹角 90°，△ABD ≌ △ACE 照样用 SAS 证明，所以 BD = CE 且 BD ⊥ CE。可以在「动手旋转」里切到“正方形”验证。' }
        ] },

      { id: 'e3', type: '题型三 · 外作正方形', level: '中档', title: '向外作两个正方形', fig: f3,
        q: '如图，以 △ABC 的边 AB、AC 为边分别向外作正方形 ABDE 和正方形 ACFG，连接 BG、CE，BG 与 CE 交于点 O，CE 与 AB 交于点 N。',
        asks: ['求证：BG = CE；', '求证：BG ⊥ CE。'],
        think: [
          '公共顶点是 A。两组“手”：<b>AE = AB</b>（正方形 ABDE 的邻边），<b>AC = AG</b>（正方形 ACFG 的邻边）。',
          '夹角：∠EAC = ∠EAB + ∠BAC = 90° + ∠BAC，∠BAG = ∠GAC + ∠BAC = 90° + ∠BAC → 相等（等角<b>加</b>同一个角 ∠BAC）。',
          '全等三角形是 △AEC 与 △ABG（不是 △ABC！）。',
          '求垂直：∠AEC = ∠ABG，再用“8 字型”：△AEN 与 △OBN 有对顶角 ∠ANE = ∠ONB。'
        ],
        sol: '<p><b>(1)</b> ∵ 四边形 ABDE、ACFG 都是正方形，∴ AE = AB，AC = AG，∠EAB = ∠GAC = 90°。</p>' +
          '<p>∴ ∠EAB + ∠BAC = ∠GAC + ∠BAC，即 ∠EAC = ∠BAG。</p>' +
          '<p>在 △AEC 和 △ABG 中，AE = AB，∠EAC = ∠BAG，AC = AG，∴ △AEC ≌ △ABG（SAS），∴ <b>CE = BG</b>。</p>' +
          '<p><b>(2)</b> 由 (1) 得 ∠AEC = ∠ABG，即 ∠AEN = ∠OBN。</p>' +
          '<p>又 ∠ANE = ∠ONB（对顶角相等），∴ ∠BON = 180° − ∠OBN − ∠ONB = 180° − ∠AEN − ∠ANE = ∠EAN = 90°。∴ <b>BG ⊥ CE</b>。</p>',
        sum: '外作型手拉手的关键是<b>认清两组“手”分别属于哪两个图形</b>：AE、AB 是同一个正方形的邻边，AC、AG 是另一个正方形的邻边。顶角 90°，所以拉手线互相垂直。',
        vary: [
          { q: '变式：连接 AO，AO 平分哪个角？', a: '△AEC ≌ △ABG，A 到 CE、BG 的距离相等，所以 AO 平分 ∠EOG（含点 A 的那个角，∠EOG = 90°），∠AOE = ∠AOG = 45°。' }
        ] },

      { id: 'e4', type: '题型四 · 外作等边三角形', level: '中档', title: '夹角是 60° 还是 120°', fig: f4,
        q: '如图，以 △ABC 的边 AB、AC 为边分别向外作等边三角形 ABD 和等边三角形 ACE，连接 CD、BE，CD 与 BE 交于点 O，CD 交 AB 于点 M，连接 AO。',
        asks: ['求证：CD = BE；', '求 ∠BOC 的度数；', '求证：OA 平分 ∠DOE。'],
        think: [
          '两组“手”：AD = AB（等边 △ABD），AC = AE（等边 △ACE）；∠DAC = ∠BAE = 60° + ∠BAC。',
          '全等三角形：△ADC ≌ △ABE，得 ∠ADC = ∠ABE。',
          '在“8 字型”△ADM 与 △OBM 中求出 ∠BOM = ∠DAM = 60°，再用邻补角求 ∠BOC。',
          'A 到 CD、BE 的距离相等 → OA 平分含点 A 的那个角，即 ∠DOE。'
        ],
        sol: '<p><b>(1)</b> ∵ △ABD、△ACE 都是等边三角形，∴ AD = AB，AC = AE，∠DAB = ∠CAE = 60°。</p>' +
          '<p>∴ ∠DAB + ∠BAC = ∠CAE + ∠BAC，即 ∠DAC = ∠BAE。</p>' +
          '<p>在 △ADC 和 △ABE 中，AD = AB，∠DAC = ∠BAE，AC = AE，∴ △ADC ≌ △ABE（SAS），∴ <b>CD = BE</b>。</p>' +
          '<p><b>(2)</b> 由 (1) 得 ∠ADC = ∠ABE，即 ∠ADM = ∠OBM。又 ∠AMD = ∠OMB（对顶角相等），</p>' +
          '<p>∴ ∠BOM = ∠DAM = 60°，∴ <b>∠BOC = 180° − ∠BOM = 120°</b>。</p>' +
          '<p><b>(3)</b> 过 A 作 AP ⊥ CD 于 P，AQ ⊥ BE 于 Q。∵ △ADC ≌ △ABE，∴ CD = BE，面积相等，∴ AP = AQ，</p>' +
          '<p>∴ 点 A 在 ∠DOE 的平分线上，即 <b>OA 平分 ∠DOE</b>（∠AOD = ∠AOE = 60°）。</p>',
        sum: '两条拉手线所夹的<b>锐角</b>是 60°，但题目问的 ∠BOC 是它的<b>邻补角</b> 120°——一定要在图上看清问的是哪一个角。点 O 到三个顶点的连线两两成 120°。',
        vary: [
          { q: '变式：若 ∠BAC = 70°，求 ∠BEA + ∠ADC 的度数？（提示：先求 ∠BAE）', a: '∠BAE = 60° + 70° = 130°。由全等 ∠ADC = ∠ABE，∴ ∠BEA + ∠ADC = ∠BEA + ∠ABE = 180° − ∠BAE = <b>50°</b>。' }
        ] },

      { id: 'e5', type: '题型五 · 一般顶角 α', level: '中档', title: '类比探究：把 60°、90° 换成 α', fig: f5,
        q: '如图，在 △ABC 和 △ADE 中，AB = AC，AD = AE，∠BAC = ∠DAE = α，连接 BD、CE，BD 的延长线交 CE 于点 F，BD 交 AC 于点 M。',
        asks: ['求证：BD = CE；', '若 α = 60°，∠BFC = ______；若 α = 90°，∠BFC = ______；', '用含 α 的式子表示 ∠BFC，并说明理由。'],
        think: [
          '<b>看清角的位置</b>：射线 AC 在 ∠BAD 内部，射线 AD 在 ∠CAE 内部，所以 ∠BAD = α + ∠CAD，∠CAE = α + ∠CAD（同时<b>加上</b> ∠CAD）→ △ABD ≌ △ACE（SAS）。',
          '由全等得 ∠ABD = ∠ACE。',
          '“8 字型”：△ABM 与 △FCM，对顶角 ∠AMB = ∠FMC → ∠MFC = ∠MAB = α。',
          '注意点 M 在 B、F 之间，所以 ∠BFC 就是 ∠MFC。'
        ],
        sol: '<p><b>(1)</b> ∵ ∠BAC = ∠DAE = α，∴ ∠BAC + ∠CAD = ∠DAE + ∠CAD，即 ∠BAD = ∠CAE。</p>' +
          '<p>在 △ABD 和 △ACE 中，AB = AC，∠BAD = ∠CAE，AD = AE，∴ △ABD ≌ △ACE（SAS），∴ <b>BD = CE</b>。</p>' +
          '<p><b>(2)</b> 60°；90°。</p>' +
          '<p><b>(3)</b> <b>∠BFC = α</b>。理由：由 (1) 得 ∠ABD = ∠ACE，即 ∠ABM = ∠FCM。</p>' +
          '<p>又 ∵ ∠AMB = ∠FMC（对顶角相等），∴ ∠MFC = 180° − ∠FCM − ∠FMC = 180° − ∠ABM − ∠AMB = ∠BAM = α，即 ∠BFC = α。</p>',
        sum: '类比探究题的套路：<b>特殊情况先算数（60°、90°），再把数换成字母</b>；证明过程完全一样——“全等 + 8 字型”。若图形位置改变使 F 跑到另一侧，∠BFC 可能变成 180° − α，要重新看图。',
        vary: [
          { q: '变式：在本题中，若 α = 40°，求 BD 与 CE 所夹的锐角；若 α = 140° 呢？', a: 'α = 40° 时夹锐角 40°；α = 140° 时两直线成 140° 与 40° 两种角，所夹锐角为 <b>40°</b>。' }
        ] },

      { id: 'e6', type: '题型六 · 动点构造', level: '中档', title: 'D 在直线 BC 上：三种位置', figs: [f6a, f6b],
        q: '在 △ABC 中，∠BAC = 90°，AB = AC。点 D 是直线 BC 上一动点，以 AD 为腰在 AD 右侧作等腰直角三角形 ADE，∠DAE = 90°，连接 CE。',
        asks: ['如图 1，当 D 在线段 BC 上时，求证：CE ⊥ BC，且 BC = CD + CE；', '如图 2，当 D 在 CB 的延长线上时，BC、CD、CE 之间有怎样的数量关系？请证明；', '当 D 在 BC 的延长线上时，直接写出 BC、CD、CE 之间的数量关系。'],
        think: [
          '把 △ABC 和 △ADE 看成以 A 为公共顶点的两个等腰直角三角形 → 手拉手，全等三角形是 △ABD 与 △ACE。',
          '由全等得 BD = CE，∠ACE = ∠B = 45°，所以 ∠BCE = ∠ACB + ∠ACE = 90°。',
          '数量关系就是把 BC 用 BD、CD 表示，再把 BD 换成 CE。',
          '图 2 中 ∠BAD 与 ∠CAE 都等于 ∠DAC − 90°（同时<b>减去</b>直角）。'
        ],
        sol: '<p><b>(1)</b> ∵ ∠BAC = ∠DAE = 90°，∴ ∠BAC − ∠DAC = ∠DAE − ∠DAC，即 ∠BAD = ∠CAE。</p>' +
          '<p>又 AB = AC，AD = AE，∴ △ABD ≌ △ACE（SAS），∴ BD = CE，∠ACE = ∠B = 45°。</p>' +
          '<p>∴ ∠BCE = ∠ACB + ∠ACE = 45° + 45° = 90°，即 <b>CE ⊥ BC</b>。</p>' +
          '<p>∴ BC = BD + CD = <b>CE + CD</b>。</p>' +
          '<p><b>(2)</b> <b>BC = CD − CE</b>。证明：∵ ∠BAD = ∠DAC − ∠BAC，∠CAE = ∠DAC − ∠DAE，且 ∠BAC = ∠DAE = 90°，∴ ∠BAD = ∠CAE。</p>' +
          '<p>又 AB = AC，AD = AE，∴ △ABD ≌ △ACE（SAS），∴ BD = CE，∴ BC = CD − BD = CD − CE。</p>' +
          '<p><b>(3)</b> <b>BC = CE − CD</b>（此时 BD = BC + CD = CE）。</p>',
        sum: '动点题<b>先找不变的全等</b>（△ABD ≌ △ACE 在任何位置都成立），再按点的位置写线段和差。<b>“直线”上的动点要分三种情况</b>。',
        vary: [
          { q: '变式：把“等腰直角三角形”都换成“等边三角形”（∠BAC = ∠DAE = 60°），D 在线段 BC 上，CE 与 AB 有什么位置关系？BC、CD、CE 呢？', a: '△ABD ≌ △ACE，∠ACE = ∠B = 60° = ∠BAC，∴ <b>CE ∥ AB</b>（内错角相等）；BC = BD + CD = <b>CE + CD</b>。' }
        ] },

      { id: 'e7', type: '题型七 · 旋转探究', level: '压轴', title: '转一转：结论还成立吗？', figs: [f7a, f7b],
        q: '△ABC 和 △ADE 都是等边三角形，AB > AD。开始时点 D 在 AB 上、点 E 在 AC 上。将 △ADE 绕点 A 旋转，连接 BD、CE。',
        asks: ['开始时，BD 与 CE 有什么数量关系？', '如图 1，旋转到一般位置时，(1) 中的结论还成立吗？请证明；', '如图 2，当 B、D、E 三点共线时，求 ∠BEC 的度数，并探究 BE、AE、CE 之间的数量关系。'],
        think: [
          '(1) 特殊位置不需要全等：BD = AB − AD，CE = AC − AE。',
          '(2) 一般位置就是标准手拉手：∠BAD 与 ∠CAE 是同一个旋转角。',
          '(3) 三点共线 → 平角 180°，∠ADB = 180° − ∠ADE = 120°；由全等搬到 ∠AEC。',
          '(3) 线段：BE = BD + DE，而 BD = CE、DE = AE。'
        ],
        sol: '<p><b>(1)</b> BD = AB − AD，CE = AC − AE，又 AB = AC，AD = AE，∴ <b>BD = CE</b>。</p>' +
          '<p><b>(2)</b> 仍成立。如图 1，∵ ∠BAC = ∠DAE = 60°，∠BAE 是它们的公共部分，∴ ∠BAC − ∠BAE = ∠DAE − ∠BAE，即 ∠CAE = ∠BAD。（旋转到别的位置时，可能变成“同时加上”某个角，写法跟着图走。）</p>' +
          '<p>又 AB = AC，AD = AE，∴ △ABD ≌ △ACE（SAS），∴ <b>BD = CE</b>。</p>' +
          '<p><b>(3)</b> ∵ B、D、E 共线，∠ADE = 60°，∴ ∠ADB = 180° − 60° = 120°。</p>' +
          '<p>由 (2) 知 △ABD ≌ △ACE，∴ ∠AEC = ∠ADB = 120°，∴ <b>∠BEC = ∠AEC − ∠AED = 120° − 60° = 60°</b>。</p>' +
          '<p>∵ BE = BD + DE，BD = CE，DE = AE，∴ <b>BE = AE + CE</b>。</p>',
        sum: '旋转探究三问：<b>特殊位置（直接相减）→ 一般位置（手拉手全等）→ 共线位置（平角 + 全等转移角）</b>。若换成等腰直角三角形，三点共线时 ∠ADB = 135°，∠BEC = 135° − 45° = 90°，BE = DE + CE。',
        vary: [
          { q: '变式：若 △ABC 与 △ADE 都是等腰直角三角形（∠BAC = ∠DAE = 90°），B、D、E 共线时 ∠BEC = ？', a: '∠ADB = 180° − 45° = 135° = ∠AEC，∠BEC = 135° − 45° = <b>90°</b>，即 BE ⊥ CE。' }
        ] },

      { id: 'e8', type: '题型八 · 构造手拉手', level: '压轴', title: '截长补短：PA = PB + PC', fig: f8,
        q: '如图，△ABC 是等边三角形，点 P 在 △ABC 外，且与点 A 分别在直线 BC 的两侧，∠BPC = 120°。',
        asks: ['求证：PA = PB + PC。'],
        think: [
          '要证“一条线段 = 两条线段之和”→ <b>截长补短</b>。',
          '图中只有一个等边三角形，缺另一只“手”——以 A 为顶点<b>补</b>一个等边三角形 APE，使 PE = PB + PC。',
          '做法：延长 PC 到 E，使 CE = PB，连接 AE，目标是证 △ABP ≌ △ACE。',
          '角的条件：四边形 ABPC 的内角和为 360°，∠ABP + ∠ACP = 360° − 60° − 120° = 180°，而 ∠ACE + ∠ACP = 180°，所以 ∠ABP = ∠ACE。'
        ],
        sol: '<p>延长 PC 到点 E，使 CE = PB，连接 AE。</p>' +
          '<p>在四边形 ABPC 中，∠BAC = 60°，∠BPC = 120°，∴ ∠ABP + ∠ACP = 360° − 60° − 120° = 180°。</p>' +
          '<p>又 ∠ACE + ∠ACP = 180°，∴ ∠ABP = ∠ACE。</p>' +
          '<p>在 △ABP 和 △ACE 中，AB = AC，∠ABP = ∠ACE，BP = CE，∴ △ABP ≌ △ACE（SAS）。</p>' +
          '<p>∴ AP = AE，∠BAP = ∠CAE，∴ ∠PAE = ∠PAC + ∠CAE = ∠PAC + ∠BAP = ∠BAC = 60°。</p>' +
          '<p>∴ △APE 是等边三角形，∴ PA = PE = PC + CE = <b>PC + PB</b>。</p>',
        sum: '没有现成的“第二个等边三角形”时，要<b>自己构造</b>：以公共顶点为中心，把 △ABP“转”到 △ACE 的位置，60° 的旋转角让 △APE 成为等边三角形，分散的 PB、PC 被拼到一条线段 PE 上。（四边形内角和 360°：连一条对角线分成两个三角形即可得到。）',
        vary: [
          { q: '变式：也可以“截长”：在 PA 上截取 PM = PB，你能证明 △PBM 是等边三角形吗？需要什么条件？', a: '需要先知道 ∠BPA = 60°。这要用到“同弧所对的圆周角相等”（九年级）或先证全等，比较麻烦，所以本题用“补短”更简便。' }
        ] },

      { id: 'e9', type: '拓展 · 半角模型', level: '拓展', title: '正方形里的 45°', fig: f9,
        q: '如图，在正方形 ABCD 中，点 E、F 分别在边 BC、CD 上，∠EAF = 45°。延长 CB 到点 G，使 BG = DF，连接 AG。',
        asks: ['求证：EF = BE + DF；', '若正方形的边长为 6，求 △CEF 的周长。'],
        think: [
          '45° 恰好是直角 ∠BAD 的一半 → 把 △ADF 绕 A“转”到 △ABG 的位置，使分散的 BE、DF 拼成 GE。',
          '先证 △ABG ≌ △ADF（SAS）：AB = AD，∠ABG = ∠D = 90°，BG = DF。',
          '再证 ∠GAE = 45° = ∠EAF，于是 △AEG ≌ △AEF（SAS）。'
        ],
        sol: '<p><b>(1)</b> ∵ 四边形 ABCD 是正方形，∴ AB = AD，∠ABC = ∠D = ∠BAD = 90°，∴ ∠ABG = 90° = ∠D。</p>' +
          '<p>在 △ABG 和 △ADF 中，AB = AD，∠ABG = ∠D，BG = DF，∴ △ABG ≌ △ADF（SAS），∴ AG = AF，∠BAG = ∠DAF。</p>' +
          '<p>∴ ∠GAE = ∠BAG + ∠BAE = ∠DAF + ∠BAE = 90° − ∠EAF = 45° = ∠EAF。</p>' +
          '<p>在 △AEG 和 △AEF 中，AG = AF，∠GAE = ∠FAE，AE = AE，∴ △AEG ≌ △AEF（SAS），∴ EF = EG = BE + BG = <b>BE + DF</b>。</p>' +
          '<p><b>(2)</b> △CEF 的周长 = CE + CF + EF = CE + CF + BE + DF = (CE + BE) + (CF + DF) = BC + CD = <b>12</b>。</p>',
        sum: '半角模型 = <b>旋转（补短）+ 两次全等</b>：第一次全等把线段“搬过去”，第二次全等把角“对上”。结论：EF = BE + DF，△CEF 的周长等于正方形边长的 2 倍。',
        vary: [
          { q: '变式：在等腰直角 △ABC 中，∠BAC = 90°，D、E 在 BC 上，∠DAE = 45°。把 △ABD 绕点 A 转 90° 后，BD、DE、EC 能组成什么三角形？', a: '能组成<b>直角三角形</b>（∠ACB + 45° = 90°）。这一结论要到八年级下册学勾股定理后才能写成 BD² + EC² = DE²。' }
        ] }
    ],

    questions: [
      { ch: 'm1', type: 'choice', q: '在手拉手模型中，证明两个三角形全等最常用的判定方法是：', opts: ['SSS', 'SAS', 'ASA', 'HL'], a: 1, ex: '两组“手”是两组边，夹角由“等角加减同一个角”得到，正好是 SAS。', tag: '高频' },
      { ch: 'm1', type: 'choice', q: '已知 AB = AC，AD = AE，∠BAC = ∠DAE，且从 AB 到 AC 与从 AD 到 AE 的旋转方向相同。下列三角形中一定与 △ABD 全等的是：', opts: ['△ADE', '△ACE', '△ABC', '△ACD'], a: 1, ex: 'B 与 C 对应、D 与 E 对应，所以 △ABD ≌ △ACE。' },
      { ch: 'm1', type: 'choice', q: '∠BAC = ∠DAE，射线 AD 在 ∠BAC 的内部，射线 AC 在 ∠DAE 的内部，得到 ∠BAD = ∠CAE 的依据是：', opts: ['两边同时减去 ∠DAC', '两边同时加上 ∠DAC', '对顶角相等', '同角的余角相等'], a: 0, ex: '∠DAC 是两个顶角的公共部分：∠BAD = ∠BAC − ∠DAC，∠CAE = ∠DAE − ∠DAC。' },
      { ch: 'm1', type: 'choice', q: '已知 AB = AC，∠BAD = ∠CAE，要用 SAS 证明 △ABD ≌ △ACE，还需要添加的条件是：', opts: ['BD = CE', 'AD = AE', '∠B = ∠C', '∠D = ∠E'], a: 1, ex: 'SAS 要求“两边及其夹角”，∠BAD 的两边是 AB、AD，∠CAE 的两边是 AC、AE，所以补 AD = AE。补 ∠B = ∠C 或 ∠D = ∠E 是用 ASA / AAS，不符合题目指定的 SAS；补 BD = CE 是 SSA，不能判定。', tag: '高频' },
      { ch: 'm1', type: 'tf', q: '只要两个等腰三角形有公共顶点，连接对应端点就一定能得到全等三角形。', a: false, ex: '还需要两个顶角相等（∠BAC = ∠DAE），并且按相同的旋转方向对应连线。' },
      { ch: 'm1', type: 'tf', q: '在手拉手模型中，若连接的是 BE、CD（而不是 BD、CE），一般不能得到 BE = CD。', a: true, ex: '对应点连错了，三角形不全等，BE 与 CD 一般不相等。' },
      { ch: 'm2', type: 'fill', q: '如图，B、C、E 在同一直线上，△ABC 和 △DCE 都是等边三角形，AE 与 BD 交于点 F，则 ∠AFB = ______°。', fig: f1s, a: ['60', '60°'], ex: '∠AFB = ∠FBE + ∠FEB = ∠CAE + ∠AEC = ∠ACB = 60°。', tag: '高频' },
      { ch: 'm2', type: 'fill', q: '同上图，∠BFE = ______°。', fig: f1s, a: ['120', '120°'], ex: '∠BFE 与 ∠AFB 互补：180° − 60° = 120°。' },
      { ch: 'm2', type: 'fill', q: '同上图，连接 CF，则 ∠BFC = ______°。', fig: f1s, a: ['60', '60°'], ex: 'CF 平分 ∠BFE（C 到 BD、AE 的距离相等），∠BFC = ½ × 120° = 60°。' },
      { ch: 'm2', type: 'fill', q: '同上图，若 AF = 3，CF = 2，则 BF = ______。', fig: f1s, a: ['5'], ex: '结论 BF = AF + CF（在 BF 上截取 FG = FC，证 △BCG ≌ △ACF）。BF = 3 + 2 = 5。' },
      { ch: 'm2', type: 'choice', q: '如图（同上），下列结论：① AE = BD；② ∠AFB = 60°；③ CF 平分 ∠BFE；④ AC ⊥ BD。正确的有：', fig: f1s, opts: ['1 个', '2 个', '3 个', '4 个'], a: 2, ex: '①②③ 正确；AC 与 BD 一般不垂直，④ 错误。“结论个数”题要逐条验证。', tag: '高频' },
      { ch: 'm2', type: 'fill', q: '△ABC 和 △ADE 都是等腰直角三角形，∠BAC = ∠DAE = 90°，连接 BD、CE，则 BD 与 CE 所在直线的夹角为 ______°。', a: ['90', '90°'], ex: '拉手线的夹角等于顶角 90°，即 BD ⊥ CE。', tag: '高频' },
      { ch: 'm2', type: 'fill', q: 'AB = AC，AD = AE，∠BAC = ∠DAE = 40°，连接 BD、CE，则 BD 与 CE 所夹的锐角为 ______°。', a: ['40', '40°'], ex: '夹角等于顶角 α = 40°。' },
      { ch: 'm2', type: 'fill', q: 'AB = AC，AD = AE，∠BAC = ∠DAE = 130°，连接 BD、CE，则 BD 与 CE 所夹的锐角为 ______°。', a: ['50', '50°'], ex: '两直线的夹角一个是 130°，另一个是 180° − 130° = 50°，锐角为 50°。' },
      { ch: 'm2', type: 'tf', q: '在手拉手模型中，两条拉手线所夹的锐角总是 60°。', a: false, ex: '只有顶角为 60°（等边三角形）时才是 60°；一般等于顶角 α 或 180° − α。' },
      { ch: 'm2', type: 'choice', q: '证明“FA 平分 ∠BFE”（A 为公共顶点，F 为两条拉手线的交点）时，最后一步的依据是：', opts: ['角平分线的性质', '角的内部到角两边距离相等的点在角的平分线上', '等腰三角形三线合一', 'SAS'], a: 1, ex: '先证 A 到两条拉手线的距离相等，再用角平分线的<b>判定</b>。注意不要写成“性质”。' },
      { ch: 'm2', type: 'choice', q: '在上一题中，证明 A 到 BD、CE 距离相等的理由是：', opts: ['全等三角形对应边上的高相等', '等腰三角形底边上的高相等', '平行线间的距离相等', '角平分线上的点到角两边距离相等'], a: 0, ex: '△ABD ≌ △ACE，BD 与 CE 是对应边，对应边上的高相等（或用面积法）。' },
      { ch: 'm3', type: 'choice', q: '以 △ABC 的边 AB、AC 为边向外作正方形 ABDE 和 ACFG，连接 BG、CE，则 BG 与 CE：', fig: { pts: f3.pts, polys: f3.polys, segs: f3.segs, hide: ['O', 'N'] }, opts: ['相等且垂直', '相等但不一定垂直', '垂直但不一定相等', '既不一定相等也不一定垂直'], a: 0, ex: '△AEC ≌ △ABG（SAS），CE = BG；顶角 90°，所以 BG ⊥ CE。', tag: '高频' },
      { ch: 'm3', type: 'fill', q: '以 △ABC 的边 AB、AC 为边向外作等边三角形 ABD、ACE，CD 与 BE 交于点 O，则 ∠BOC = ______°。', fig: { pts: f4.pts, polys: f4.polys, segs: ['CD:hl', 'BE:hl2'], dots: ['O'], hide: ['M'], lab: { O: 's', A: 'n' } }, a: ['120', '120°'], ex: '拉手线所夹锐角 ∠BOD = 60°，∠BOC 是它的邻补角，等于 120°。', tag: '高频' },
      { ch: 'm3', type: 'tf', q: '以 △ABC 的两边 AB、AC 为边向外作等边三角形 ABD、ACE，则一定有 CD = BE。', a: true, ex: '△ADC ≌ △ABE（SAS）。' },
      { ch: 'm3', type: 'choice', q: '如图，△ABC 和 △ADE 都是等腰直角三角形，∠BAC = ∠DAE = 90°，CE 的延长线交 BD 于 F，连接 AF，则 ∠AFC 等于：', fig: { pts: f2.pts, polys: f2.polys, segs: f2.segs, dots: ['F'], hide: ['G'], right: f2.right, lab: f2.lab }, opts: ['30°', '45°', '60°', '90°'], a: 1, ex: 'BD ⊥ CE，FA 平分 ∠DFC（直角），∠AFC = 45°。' },
      { ch: 'm3', type: 'choice', q: '下列情况中，不能直接构成手拉手模型的是：', opts: ['两个共顶点的等边三角形', '两个共直角顶点的等腰直角三角形', '两个共顶点但顶角不相等的等腰三角形', '两个共顶点的正方形'], a: 2, ex: '顶角不相等，就得不到 ∠BAD = ∠CAE。' },
      { ch: 'm4', type: 'fill', q: '在 △ABC 中，∠BAC = 90°，AB = AC，D 在 BC 上，以 AD 为腰作等腰直角 △ADE（∠DAE = 90°，E 在 AD 右侧），连接 CE。若 BC = 7，BD = 2，则 CE = ______。', fig: f6a, a: ['2'], ex: '△ABD ≌ △ACE，CE = BD = 2（BC 的长是干扰条件）。' },
      { ch: 'm4', type: 'fill', q: '同上题，∠BCE = ______°。', fig: f6a, a: ['90', '90°'], ex: '∠ACE = ∠B = 45°，∠BCE = 45° + 45° = 90°。', tag: '高频' },
      { ch: 'm4', type: 'choice', q: '同上题的条件，若点 D 在 CB 的延长线上，则 BC、CD、CE 的关系是：', fig: f6b, opts: ['BC = CD + CE', 'BC = CD − CE', 'BC = CE − CD', 'BC = CD = CE'], a: 1, ex: 'BD = CE，BC = CD − BD = CD − CE。', tag: '高频' },
      { ch: 'm4', type: 'fill', q: '如图，△ABC 是等边三角形，D 在 BC 上，以 AD 为边作等边 △ADE，连接 CE。若 BC = 6，BD = 2，则 CE = ______。', fig: fq1, a: ['2'], ex: '△ABD ≌ △ACE（SAS），CE = BD = 2。' },
      { ch: 'm4', type: 'fill', q: '同上图，∠ACE = ______°。', fig: fq1, a: ['60', '60°'], ex: '∠ACE = ∠ABD = 60°，所以 CE ∥ AB。' },
      { ch: 'm4', type: 'fill', q: '等边 △ABC 与等边 △ADE 共顶点 A，旋转 △ADE 使 B、D、E 三点共线，则 ∠BEC = ______°。', fig: f7b, a: ['60', '60°'], ex: '∠ADB = 120° = ∠AEC，∠BEC = 120° − 60° = 60°。', tag: '高频' },
      { ch: 'm4', type: 'fill', q: '同上题，若 AE = 2，CE = 3，则 BE = ______。', fig: f7b, a: ['5'], ex: 'BE = BD + DE = CE + AE = 5。' },
      { ch: 'm4', type: 'fill', q: '等腰直角 △ABC 与 △ADE 共直角顶点 A（∠BAC = ∠DAE = 90°），当 B、D、E 三点共线时，∠BEC = ______°。', a: ['90', '90°'], ex: '∠ADB = 180° − 45° = 135° = ∠AEC，∠BEC = 135° − 45° = 90°。' },
      { ch: 'm4', type: 'fill', q: '△ABC 是等边三角形，点 P 在 BC 下方，∠BPC = 120°，PB = 2，PC = 3，则 PA = ______。', fig: { pts: f8.pts, polys: f8.polys, segs: ['PB', 'PC', 'AP:hl'], hide: ['E'], lab: f8.lab }, a: ['5'], ex: '构造手拉手可证 PA = PB + PC = 5。' },
      { ch: 'm4', type: 'fill', q: '正方形 ABCD 中，E 在 BC 上，F 在 CD 上，∠EAF = 45°。若 BE = 2，DF = 3，则 EF = ______。', a: ['5'], ex: '半角模型：EF = BE + DF = 5。' },
      { ch: 'm4', type: 'fill', q: '正方形 ABCD 的边长为 6，E 在 BC 上，F 在 CD 上，∠EAF = 45°，则 △CEF 的周长为 ______。', a: ['12'], ex: 'EF = BE + DF，周长 = CE + CF + BE + DF = BC + CD = 12。' },
      { ch: 'm4', type: 'tf', q: '点 D 在直线 BC 上运动时（例 6 的条件），无论 D 在哪里，BD = CE 都成立。', a: true, ex: '△ABD ≌ △ACE 在三种位置都成立，变化的只是 BC、CD、CE 的和差关系。' },
      { ch: 'm5', type: 'choice', q: '“点 D 在直线 BC 上”的动点题，一般需要讨论几种位置？', opts: ['1 种', '2 种', '3 种', '4 种'], a: 2, ex: '线段 BC 上、CB 延长线上、BC 延长线上，共 3 种。' },
      { ch: 'm5', type: 'choice', q: '两条直线相交，其中一个角等于 α（α < 90°），则这两条直线所成的四个角中：', opts: ['都等于 α', '两个等于 α，两个等于 180° − α', '两个等于 α，两个等于 90° − α', '一个等于 α，三个等于 180° − α'], a: 1, ex: '对顶角相等、邻补角互补。求 ∠BFC 时要看清是 α 还是 180° − α。' }
    ],

    cards: [
      { ch: 'm1', f: '手拉手模型的三要素', b: '① 共顶点；② 两组等线段（AB = AC，AD = AE）；③ 顶角相等（∠BAC = ∠DAE）' },
      { ch: 'm1', f: '怎样连线才全等？', b: '按相同的旋转方向对应：B 连 D、C 连 E（左手拉左手，右手拉右手）' },
      { ch: 'm1', f: '∠BAD = ∠CAE 怎么得到？', b: '∠BAC = ∠DAE 两边同时加上（或减去）同一个角 ∠CAD——看图决定加还是减' },
      { ch: 'm1', f: '手拉手证全等用哪个判定？', b: 'SAS：AB = AC，∠BAD = ∠CAE，AD = AE' },
      { ch: 'm2', f: '手拉手的四个结论', b: '① △ABD ≌ △ACE；② BD = CE；③ BD 与 CE 夹角 = 顶角 α；④ FA 平分夹角（含 A 的那个）' },
      { ch: 'm2', f: '“8 字型”求角', b: '两个三角形各有一个角相等（由全等得来），对顶角相等 → 第三个角相等' },
      { ch: 'm2', f: '证“顶点与交点连线平分角”', b: '全等三角形对应边上的高相等（或面积法）→ 到角两边距离相等 → 角平分线的判定' },
      { ch: 'm2', f: '等边共线图：B、C、E 共线，AE 交 BD 于 F', b: 'AE = BD；∠AFB = 60°；△CMN 等边，MN ∥ BE；CF 平分 ∠BFE；BF = AF + CF' },
      { ch: 'm3', f: '等边 / 等腰直角 / 正方形手拉手的夹角', b: '60° / 90°（垂直）/ 90°（垂直）' },
      { ch: 'm3', f: '外作等边三角形 ABD、ACE，CD 交 BE 于 O', b: 'CD = BE；所夹锐角 60°；∠BOC = 120°；OA 平分 ∠DOE' },
      { ch: 'm3', f: '外作正方形 ABDE、ACFG', b: 'BG = CE，BG ⊥ CE；全等三角形 △ABG ≌ △AEC' },
      { ch: 'm4', f: '动点 D 在直线 BC 上（等腰直角版）', b: 'CE ⊥ BC；D 在线段上：BC = CD + CE；在 CB 延长线上：BC = CD − CE；在 BC 延长线上：BC = CE − CD' },
      { ch: 'm4', f: '等边手拉手旋转到 B、D、E 共线', b: '∠BEC = 60°，BE = AE + CE（等腰直角版：∠BEC = 90°，BE = DE + CE）' },
      { ch: 'm4', f: '等边 △ABC 外一点 P，∠BPC = 120°', b: 'PA = PB + PC（延长 PC 到 E 使 CE = PB，构造等边 △APE）' },
      { ch: 'm4', f: '半角模型（正方形中 ∠EAF = 45°）', b: 'EF = BE + DF；△CEF 周长 = 2 × 边长；方法：旋转补短 + 两次全等' },
      { ch: 'm5', f: '动点在“直线 / 射线 / 线段”上分几种情况？', b: '直线：3 种；射线：2 种；线段：1 种' }
    ]
  });
})();
