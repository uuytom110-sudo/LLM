/* 格物 · 生物 物理 手拉手模型 复习站 —— 纯前端，无需构建；进度保存在本机浏览器 localStorage。界面与特效沿用 Fuxi 复习站。 */
(function () {
  'use strict';

  var SUBJECTS = window.GEWU_SUBJECTS || [];
  var EXAM = new Date('2026-11-11T08:00:00+08:00');
  var KEY = 'gewu-v1';
  var LETTERS = 'ABCDEFGH';
  var ART = window.GEWU_ART || { svg: {}, ascii: {} };
  var FX = window.GEWU_FX || { intro: function () {}, mountHero: function () {}, unmountHero: function () {}, scramble: function () {}, mountPage: function () {}, unmountPage: function () {}, mountBg: function () {} };
  var GEO = window.GEWU_GEO || { figure: function () { return ''; }, renderLab: function () {}, renderExamples: function () {}, stop: function () {} };
  function fig(f) { if (!f) return ''; try { return '<figure class="geo">' + GEO.figure(f) + (f.cap ? '<figcaption>' + esc(f.cap) + '</figcaption>' : '') + '</figure>'; } catch (e) { return ''; } }
  var lastScrambled = '';
  function ascii(k, cls) { var a = ART.ascii[k]; return a ? '<pre class="ascii ' + (cls || '') + '" aria-hidden="true">' + esc(a.replace(/^\n/, '')) + '</pre>' : ''; }

  /* ---------- 题库索引 ---------- */
  /* 选项按题目内容固定打乱（同一道题每次顺序相同），避免答案扎堆在某个字母上；数量、度数这类有顺序的选项不打乱 */
  function ordered(opts) { return opts.every(function (o) { return /^[\d\s.°个种倍%]+$/.test(o); }) || opts.some(function (o) { return /以上|无法确定|不确定|都不/.test(o); }); }
  function mixOpts(q) {
    var h = 2166136261, str = q.q;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var idx = q.opts.map(function (_, k) { return k; });
    for (var j = idx.length - 1; j > 0; j--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; var r = h % (j + 1), t = idx[j]; idx[j] = idx[r]; idx[r] = t; }
    q.opts = idx.map(function (k) { return q.opts[k]; });
    q.a = idx.indexOf(q.a);
  }
  var SMAP = {}, QMAP = {}, CMAP = {};
  SUBJECTS.forEach(function (s) {
    SMAP[s.id] = s;
    s.chMap = {};
    s.chapters.forEach(function (c) { s.chMap[c.id] = c; });
    s.questions.forEach(function (q, i) {
      q.id = s.id + '-q' + i;
      q.subj = s.id;
      if (q.type === 'tf') { q.kind = 'tf'; q.opts = ['正确', '错误']; q.a = q.a ? 0 : 1; q.type = 'choice'; }
      else q.kind = q.type;
      if (q.kind === 'choice' && !q.keep && !ordered(q.opts)) mixOpts(q);
      QMAP[q.id] = q;
    });
    s.cards.forEach(function (c, i) { c.id = s.id + '-c' + i; c.subj = s.id; CMAP[c.id] = c; });
  });

  /* ---------- 学习计划 ---------- */
  var PLAN = [
    { date: '2026-11-07', label: '周六', title: '11月7日', tasks: [
      { id: 'p1', when: '上午', text: '物理：第一章 机械运动（单位换算、参照物、速度公式）+ 练习', link: '#physics' },
      { id: 'p2', when: '上午', text: '手拉手模型：读「模型讲解」，在「动手旋转」里把四种形态都转一遍', link: '#model' },
      { id: 'p3', when: '下午', text: '生物学：第六章 感知（眼、耳）+ 神经调节（反射弧、受损推理）', link: '#biology' },
      { id: 'p4', when: '下午', text: '物理：计算题研究 例 1—4（过桥、回声、平均速度、图像）', link: '#physics' },
      { id: 'p5', when: '晚上', text: '把今天的错题在「错题本」里重做一遍', link: '#wrong' }
    ] },
    { date: '2026-11-08', label: '周日', title: '11月8日', tasks: [
      { id: 'p6', when: '上午', text: '物理：第二章 声现象 + 第三章 物态变化（六种变化及吸放热），随机 20 题', link: '#physics' },
      { id: 'p7', when: '上午', text: '手拉手模型：题型研究 例 1—5，先遮住解答自己做', link: '#model' },
      { id: 'p8', when: '下午', text: '生物学：激素调节（激素异常对应病）+ 运动系统', link: '#biology' },
      { id: 'p9', when: '下午', text: '物理：第四章 光现象（反射定律、平面镜成像、折射）', link: '#physics' },
      { id: 'p10', when: '晚上', text: '手拉手模型：练习全部做一遍，错题弄懂', link: '#model' }
    ] },
    { date: '2026-11-09', label: '周一', title: '11月9日', tasks: [
      { id: 'p11', when: '放学后', text: '生物学：传染病与免疫（三个环节、三项措施、三道防线）', link: '#biology' },
      { id: 'p12', when: '放学后', text: '手拉手模型：题型研究 例 6—9（动点、旋转探究、构造、半角）', link: '#model' },
      { id: 'p13', when: '晚上', text: '物理：第五、六章（透镜成像规律、密度）+ 计算题 例 5—8', link: '#physics' },
      { id: 'p14', when: '晚上', text: '综合模拟 30 题，订正错题', link: '#mock' }
    ] },
    { date: '2026-11-10', label: '周二', title: '11月10日', tasks: [
      { id: 'p15', when: '放学后', text: '错题本全部重做，直到清空', link: '#wrong' },
      { id: 'p16', when: '放学后', text: '只刷「还不熟」的卡片：物理公式与单位、生物概念、手拉手结论', link: '#physics' },
      { id: 'p17', when: '晚上', text: '手拉手模型：结论卡过一遍，默写证明模板（不做新难题）', link: '#model' },
      { id: 'p18', when: '晚上', text: '准备文具：黑色签字笔、2B 铅笔、橡皮、尺规；22:00 前睡觉', link: '' }
    ] },
    { date: '2026-11-11', label: '周三', title: '考试日', tasks: [
      { id: 'p19', when: '早上', text: '吃早餐，提前 20 分钟到考场；考前翻 5 分钟卡片', link: '' },
      { id: 'p20', when: '答题', text: '先易后难；物理计算写公式、带单位；几何证明写清“在 △___ 和 △___ 中”', link: '' }
    ] }
  ];

  /* ---------- 存储 ---------- */
  function blank() { return { q: {}, wrong: {}, cards: {}, seen: {}, plan: {}, mocks: [], theme: 'auto' }; }
  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') {
        var b = blank();
        Object.keys(b).forEach(function (k) { if (raw[k] !== undefined) b[k] = raw[k]; });
        return b;
      }
    } catch (e) { /* 无痕模式等情况下忽略 */ }
    return blank();
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

  /* ---------- 工具 ---------- */
  var app = document.getElementById('app');
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function strip(html) { return String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' '); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }
  function ymd(d) { var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }

  var FULL = { '，': '', '。': '', '、': '', '；': '', '：': '', '？': '', '！': '', '“': '', '”': '', '‘': '', '’': '', '《': '', '》': '', '（': '(', '）': ')', '＝': '=', '×': '*', '·': '*', '÷': '/', '－': '-', '＋': '+', '—': '-', '／': '/' };
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[\s　]+/g, '')
      .replace(/[，。、；：？！“”‘’《》（）＝×·÷－＋—／]/g, function (c) { return FULL[c]; })
      .replace(/[０-９ａ-ｚ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 65248); })
      .replace(/[,;!?"'`]/g, '')
      .replace(/\.$/, '');
  }
  function answersOf(q) { return Array.isArray(q.a) ? q.a : [q.a]; }
  function checkFill(q, v) {
    var n = norm(v);
    if (!n) return false;
    return answersOf(q).some(function (a) { return norm(a) === n; });
  }
  function answerText(q) {
    if (q.type === 'choice') return (q.kind === 'tf' ? '' : LETTERS[q.a] + '. ') + strip(q.opts[q.a]);
    return answersOf(q)[0];
  }
  function givenText(q, v) {
    if (v === undefined || v === null || v === '') return '（未作答）';
    if (q.type === 'choice') return (q.kind === 'tf' ? '' : LETTERS[v] + '. ') + strip(q.opts[v]);
    return v;
  }
  function typeLabel(q) { return { choice: '选择题', tf: '判断题', fill: '填空题' }[q.kind] || ''; }

  /* ---------- 统计 ---------- */
  function subjStats(s) {
    var right = 0, done = 0;
    s.questions.forEach(function (q) { var r = S.q[q.id]; if (r) { done++; if (r.r) right++; } });
    var seen = s.chapters.filter(function (c) { return S.seen[s.id + '/' + c.id]; }).length;
    var known = s.cards.filter(function (c) { return S.cards[c.id]; }).length;
    return { right: right, done: done, total: s.questions.length, seen: seen, chapters: s.chapters.length, known: known, cards: s.cards.length };
  }
  function wrongIds() {
    return Object.keys(S.wrong).filter(function (id) { return QMAP[id]; }).sort(function (a, b) { return S.wrong[b] - S.wrong[a]; });
  }
  function updateBadge() {
    var n = wrongIds().length, b = document.getElementById('wrong-badge');
    b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
  }
  function record(q, ok) {
    var r = S.q[q.id] || { n: 0, r: 0 };
    r.n++; r.r = ok ? 1 : 0;
    S.q[q.id] = r;
    var removed = false;
    if (!ok) S.wrong[q.id] = Date.now();
    else if (S.wrong[q.id]) { delete S.wrong[q.id]; removed = true; }
    save(); updateBadge();
    return removed;
  }

  /* ---------- 主题 ---------- */
  function applyTheme() {
    var root = document.documentElement;
    if (S.theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', S.theme);
    var btn = document.getElementById('theme-btn');
    btn.textContent = { auto: '自动', light: '浅色', dark: '深色' }[S.theme];
    btn.title = { auto: '跟随系统', light: '浅色', dark: '深色' }[S.theme];
  }
  document.getElementById('theme-btn').addEventListener('click', function () {
    S.theme = { auto: 'light', light: 'dark', dark: 'auto' }[S.theme] || 'auto';
    save(); applyTheme();
    toast('主题：' + { auto: '跟随系统', light: '浅色', dark: '深色' }[S.theme]);
  });

  /* ---------- 状态 ---------- */
  var ui = { tab: {}, ch: {}, cardIdx: {}, cardFlip: false, cardOnlyNew: {}, cardCh: {}, planDay: null, mockSubj: null, mockN: 30, mockHot: false, search: '' };
  var session = null;

  /* ---------- 路由 ---------- */
  function go(h) { if (location.hash === '#' + h) route(); else location.hash = h; }
  function route() {
    var h = (location.hash || '#home').slice(1) || 'home';
    FX.unmountPage(); GEO.stop();
    var changed = h !== lastScrambled;
    lastScrambled = h;
    document.querySelectorAll('[data-nav]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-nav') === h); });
    if (SMAP[h]) renderSubject(SMAP[h]);
    else if (h === 'mock') renderMock();
    else if (h === 'wrong') renderWrong();
    else if (h === 'quiz') { if (session) renderQuiz(); else { location.replace('#home'); return; } }
    else renderHome();
    updateBadge();
    if (changed) {
      app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
      FX.scramble(app.querySelector('h1'));
    }
  }
  var lastRoute = '';
  window.addEventListener('hashchange', function () {
    var h = location.hash;
    route();
    if (h !== lastRoute) { window.scrollTo(0, 0); lastRoute = h; }
  });

  /* ---------- 首页 ---------- */
  function countdownHTML() {
    var ms = EXAM - Date.now();
    if (ms <= 0) {
      return '<div class="count"><div><strong>今天</strong><span>考试日</span></div></div>';
    }
    var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    return '<div class="count" aria-label="距离考试">' +
      '<div><strong>' + d + '</strong><span>天</span></div>' +
      '<div><strong>' + h + '</strong><span>小时</span></div>' +
      '<div><strong>' + m + '</strong><span>分钟</span></div></div>';
  }

  function renderHome() {
    var today = ymd(new Date());
    if (!ui.planDay) {
      var hit = PLAN.filter(function (p) { return p.date === today; })[0];
      ui.planDay = hit ? hit.date : (today < PLAN[0].date ? PLAN[0].date : PLAN[PLAN.length - 1].date);
    }
    var day = PLAN.filter(function (p) { return p.date === ui.planDay; })[0] || PLAN[0];
    var allTasks = 0, doneTasks = 0;
    PLAN.forEach(function (p) { p.tasks.forEach(function (t) { allTasks++; if (S.plan[t.id]) doneTasks++; }); });
    var wn = wrongIds().length;

    var html = '';
    html += '<section class="hero"><canvas class="hero-field" aria-hidden="true"></canvas><div class="hero-in">' +
      '<p class="eyebrow">GEWU / 八年级上册 · 生物 · 物理 · 手拉手模型</p>' +
      '<h1 class="hero-title">格物<br>致知。</h1>' +
      '<p class="sub">知识点 → 例题研究 → 练习 → 错题 → 卡片。做错的题自动进错题本，进度只保存在这台设备上。</p>' +
      '<div class="hero-cta"><a class="btn primary" href="#mock">开始综合模拟</a><a class="btn ghost" href="#wrong">错题本 · ' + wn + '</a></div></div>' +
      '<div class="hero-side"><div id="countdown">' + countdownHTML() + '</div></div></section>';

    html += '<section class="sheet stack"><div class="sec-head"><h2><span class="idx">01</span>复习计划</h2><span class="muted small mono">完成 ' + doneTasks + ' / ' + allTasks + '</span></div>' +
      '<div class="days" role="tablist">' + PLAN.map(function (p) {
        var cls = (p.date === ui.planDay ? 'on ' : '') + (p.date === today ? 'today' : '');
        var dn = p.tasks.filter(function (t) { return S.plan[t.id]; }).length;
        return '<button type="button" role="tab" class="' + cls + '" data-act="day" data-v="' + p.date + '">' + p.title +
          '<small>' + (p.date === today ? '今天 · ' : '') + p.label + ' · ' + dn + '/' + p.tasks.length + '</small></button>';
      }).join('') + '</div>' +
      '<ul class="tasks">' + day.tasks.map(function (t) {
        var on = !!S.plan[t.id];
        return '<li class="' + (on ? 'done' : '') + '"><input type="checkbox" id="task-' + t.id + '" data-act="task" data-v="' + t.id + '"' + (on ? ' checked' : '') + '>' +
          '<label for="task-' + t.id + '"><span class="when">' + t.when + '</span>' + esc(t.text) + '</label>' +
          (t.link ? '<a class="btn sm" href="' + t.link + '">去复习</a>' : '<span></span>') + '</li>';
      }).join('') + '</ul></section>';

    html += '<section class="stack"><div class="sec-head"><h2><span class="idx">02</span>三个专题</h2><span class="muted small">点进去看知识点、例题、做题、背卡片</span></div><div class="subjects">' +
      SUBJECTS.map(function (s) {
        var st = subjStats(s);
        var exN = (s.examples || []).length, exD = (s.examples || []).filter(function (e) { return S.seen['ex/' + e.id]; }).length;
        return '<a class="subj" href="#' + s.id + '" style="--c:var(--s-' + s.id + ')">' +
          '<span class="subj-bigglyph" aria-hidden="true">' + s.short + '</span><div class="subj-pic">' + (ART.svg[s.id] || '') + '</div><div class="subj-top"><span class="subj-glyph">' + s.short + '</span><div><h3>' + s.name + '</h3><div class="book">' + esc(s.book) + '</div></div></div>' +
          '<div class="bar"><i style="width:' + pct(st.right, st.total) + '%"></i></div>' +
          '<div class="subj-stats"><span>做对 <b class="mono">' + st.right + '</b>/' + st.total + ' 题</span>' + (exN ? '<span>例题 ' + exD + '/' + exN + '</span>' : '<span>复习 ' + st.seen + '/' + st.chapters + ' 章</span>') + '<span>卡片 ' + st.known + '/' + st.cards + '</span></div></a>';
      }).join('') + '</div></section>';

    html += '<section class="quick">' +
      '<a class="sheet" href="#model" data-act="jumptab" data-s="model" data-v="lab"><strong>动手旋转</strong><span>拖动小三角形，亲眼看手拉手的结论始终成立</span></a>' +
      '<a class="sheet" href="#mock"><strong>综合模拟</strong><span>三个专题混合出题，交卷后统一批改</span></a>' +
      '<a class="sheet" href="#wrong"><strong>错题本 · ' + wn + ' 题</strong><span>' + (wn ? '重做做对就会移出' : '目前没有错题') + '</span></a>' +
      '</section>';

    html += '<section class="stack search"><h2><span class="idx">03</span>查知识点</h2>' +
      '<input id="search-input" type="search" placeholder="输入关键词，如：反射弧、凝华、平面镜、手拉手、8 字型" autocomplete="off" value="' + esc(ui.search) + '">' +
      '<div id="search-results" class="results"></div></section>';

    html += '<p class="foot">生物学、物理按 2024 新版人教版八年级上册整理；手拉手模型只用八年级上册的全等三角形、角平分线、等腰三角形知识。如与你们学校的教材版本或考试范围不同，以课本和老师划的重点为准。' +
      '<br><button type="button" class="link" data-act="replay">重播开场动画</button></p>';

    app.innerHTML = html;
    renderSearch();
    FX.mountPage(app.querySelector('.hero-field'), { alpha: 0.62, wordAt: 0.9 });
  }

  function renderSearch() {
    var box = document.getElementById('search-results');
    if (!box) return;
    var q = ui.search.trim();
    if (q.length < 1) { box.innerHTML = ''; return; }
    var out = [];
    var re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    function hl(t) { return esc(t).replace(new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), function (m) { return '<mark>' + m + '</mark>'; }); }
    SUBJECTS.forEach(function (s) {
      s.chapters.forEach(function (c) {
        c.points.forEach(function (p) {
          var txt = strip(p.t + ' ' + p.d);
          re.lastIndex = 0;
          if (re.test(txt)) out.push({ s: s, where: s.name + ' · ' + c.title, title: p.t, body: strip(p.d), ch: c.id });
        });
      });
      (s.examples || []).forEach(function (ex) {
        var txt = strip(ex.title + ' ' + ex.type + ' ' + ex.q + ' ' + (ex.asks || []).join(' '));
        re.lastIndex = 0;
        if (re.test(txt)) out.push({ s: s, where: s.name + ' · ' + ((s.tabNames && s.tabNames.examples) || '题型研究'), title: ex.title, body: strip(ex.q), tab: 'examples' });
      });
      s.cards.forEach(function (c) {
        var txt = strip(c.f + ' ' + c.b);
        re.lastIndex = 0;
        if (re.test(txt)) out.push({ s: s, where: s.name + ' · 背诵卡', title: strip(c.f), body: strip(c.b) });
      });
    });
    if (!out.length) { box.innerHTML = '<p class="muted small">没找到「' + esc(q) + '」，换个关键词试试。</p>'; return; }
    box.innerHTML = '<p class="muted small">找到 ' + out.length + ' 条' + (out.length > 40 ? '，显示前 40 条' : '') + '</p>' +
      out.slice(0, 40).map(function (r) {
        var body = r.body.length > 140 ? r.body.slice(0, 140) + '…' : r.body;
        return '<a class="result" style="text-decoration:none;color:inherit" href="#' + r.s.id + '" data-act="jump" data-s="' + r.s.id + '" data-ch="' + (r.ch || '') + '" data-tab="' + (r.tab || 'learn') + '">' +
          '<div class="where">' + esc(r.where) + '</div><div><b>' + hl(r.title) + '</b></div><div class="small">' + hl(body) + '</div></a>';
      }).join('');
  }

  /* ---------- 科目页 ---------- */
  function renderSubject(s) {
    var tab = ui.tab[s.id] || 'learn';
    var st = subjStats(s);
    var html = '<section class="subj-hero band" style="--c:var(--s-' + s.id + ')"><canvas class="page-field" aria-hidden="true"></canvas><div class="subj-head"><p class="eyebrow">' + esc(s.book) + '</p><h1>' + s.name + '</h1>' +
      '<p class="muted small">做对 ' + st.right + '/' + st.total + ' 题 · 已复习 ' + st.seen + '/' + st.chapters + ' 章 · 卡片记住 ' + st.known + '/' + st.cards + '</p>' +
      '<div class="head-pic">' + (ART.svg[s.id] || '') + '</div></div>' + ascii(s.id, 'board') + '</section>';
    if (s.tip) html += '<div class="tip"><b>考前提醒：</b>' + s.tip + '</div>';
    html += '<div class="tabs" role="tablist" style="--c:var(--s-' + s.id + ')">' +
      tabsOf(s).map(function (t) {
        return '<button type="button" role="tab" data-act="tab" data-v="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>';
      }).join('') + '</div><div id="tab-body" class="stack" style="--c:var(--s-' + s.id + ')"></div>';
    app.innerHTML = html;
    var body = document.getElementById('tab-body');
    if (tab === 'learn') renderLearn(s, body);
    else if (tab === 'practice') renderPractice(s, body);
    else if (tab === 'lab') GEO.renderLab(body, s);
    else if (tab === 'examples') GEO.renderExamples(body, s, {
      isDone: function (id) { return !!S.seen['ex/' + id]; },
      toggleDone: function (id) { if (S.seen['ex/' + id]) delete S.seen['ex/' + id]; else { S.seen['ex/' + id] = Date.now(); toast('已标记为掌握'); } save(); }
    });
    else renderCards(s, body);
    FX.mountPage(app.querySelector('.page-field'), { words: subjWords(s), hotVar: '--c', alpha: 0.7, wordAt: 0.82 });
  }
  function tabsOf(s) {
    var st = subjStats(s), nm = s.tabNames || {};
    var all = { learn: nm.learn || '知识点', lab: nm.lab || '动手旋转', examples: (nm.examples || '例题') + ' ' + (s.examples || []).length, practice: (nm.practice || '练习') + ' ' + st.total, cards: (nm.cards || '背诵卡') + ' ' + st.cards };
    return (s.tabs || ['learn', 'practice', 'cards']).map(function (k) { return [k, all[k]]; });
  }
  function subjWords(s) {
    if (!s._words) s._words = s.chapters.map(function (c) { return c.points.map(function (p) { return strip(p.t); }).join(''); }).join('').replace(/[\s·（）()《》“”‘’、，。：；—\-0-9]/g, '');
    return s._words;
  }

  function renderLearn(s, el) {
    var openCh = ui.ch[s.id + ':open'];
    el.innerHTML = s.chapters.map(function (c, i) {
      var seen = !!S.seen[s.id + '/' + c.id];
      var nq = s.questions.filter(function (q) { return q.ch === c.id; }).length;
      var open = openCh ? openCh === c.id : i === 0;
      return '<details class="chapter" id="ch-' + c.id + '"' + (open ? ' open' : '') + '><summary><h3>' + esc(c.title) + '</h3>' +
        (c.hot ? '<span class="tag">期中重点</span>' : '') + (seen ? '<span class="seen">✓ 已复习</span>' : '') + '</summary>' +
        '<div class="points">' + c.points.map(function (p) {
          return '<div class="point"><h4>' + p.t + '</h4><div>' + p.d + '</div>' + (p.art ? '<pre class="diagram">' + esc(p.art) + '</pre>' : '') + fig(p.fig) + '</div>';
        }).join('') + '</div>' +
        '<div class="ch-foot">' +
        '<button type="button" class="btn sm' + (seen ? '' : ' primary') + '" data-act="seen" data-v="' + c.id + '">' + (seen ? '取消「已复习」' : '标记为已复习') + '</button>' +
        (nq ? '<button type="button" class="btn sm" data-act="chquiz" data-v="' + c.id + '">练这一章 ' + nq + ' 题</button>' : '') +
        '</div></details>';
    }).join('');
    if (openCh) { var t = document.getElementById('ch-' + openCh); if (t) setTimeout(function () { t.scrollIntoView({ block: 'start' }); }, 30); ui.ch[s.id + ':open'] = null; }
  }

  function renderPractice(s, el) {
    var sel = ui.ch[s.id] || 'all';
    var pool = s.questions.filter(function (q) { return sel === 'all' || q.ch === sel; });
    var notRight = pool.filter(function (q) { var r = S.q[q.id]; return !r || !r.r; });
    var html = '<div class="ch-list">' +
      [{ id: 'all', title: '全部章节' }].concat(s.chapters).map(function (c) {
        var qs = s.questions.filter(function (q) { return c.id === 'all' || q.ch === c.id; });
        if (!qs.length) return '';
        var right = qs.filter(function (q) { return S.q[q.id] && S.q[q.id].r; }).length;
        return '<button type="button" class="ch-row' + (sel === c.id ? ' on' : '') + '" data-act="pickch" data-v="' + c.id + '"><b>' + esc(c.title) + '</b>' +
          '<span class="mono">' + right + '/' + qs.length + '</span><div class="bar"><i style="width:' + pct(right, qs.length) + '%"></i></div></button>';
      }).join('') + '</div>';
    html += '<div class="row">' +
      '<button type="button" class="btn primary" data-act="start" data-v="order">按顺序做 ' + pool.length + ' 题</button>' +
      '<button type="button" class="btn" data-act="start" data-v="rand">随机 10 题</button>' +
      (pool.some(function (q) { return q.tag; }) ? '<button type="button" class="btn" data-act="start" data-v="hot">期中高频 ' + pool.filter(function (q) { return q.tag; }).length + ' 题</button>' : '') +
      '<button type="button" class="btn red" data-act="start" data-v="left"' + (notRight.length ? '' : ' disabled') + '>没做对/没做过的 ' + notRight.length + ' 题</button>' +
      '</div><p class="muted small">练习模式：每题答完立刻批改并给出解析；做错的题自动进入错题本。</p>';
    el.innerHTML = html;
  }

  function cardDeck(s) {
    var only = ui.cardOnlyNew[s.id], ch = ui.cardCh[s.id] || 'all';
    return s.cards.filter(function (c) { return (ch === 'all' || c.ch === ch) && (!only || !S.cards[c.id]); });
  }
  function renderCards(s, el) {
    var groups = [];
    s.cards.forEach(function (c) { if (c.ch && groups.indexOf(c.ch) < 0) groups.push(c.ch); });
    var ch = ui.cardCh[s.id] || 'all';
    var deck = cardDeck(s);
    var i = ui.cardIdx[s.id] || 0;
    if (i >= deck.length) i = 0;
    ui.cardIdx[s.id] = i;
    var known = s.cards.filter(function (c) { return S.cards[c.id]; }).length;
    var html = '<div class="chips">' +
      ['all'].concat(groups).map(function (g) {
        var label = g === 'all' ? '全部' : (s.chMap[g] ? s.chMap[g].title.replace(/^.*?·\s*/, '') : g);
        return '<button type="button" class="chip' + (ch === g ? ' on' : '') + '" data-act="cardch" data-v="' + g + '">' + esc(label) + '</button>';
      }).join('') + '</div>' +
      '<div class="row"><label class="row small" style="gap:6px"><input type="checkbox" id="only-new" data-act="onlynew"' + (ui.cardOnlyNew[s.id] ? ' checked' : '') + '> 只看「还不熟」的</label>' +
      '<span class="muted small mono">已记住 ' + known + '/' + s.cards.length + '</span>' +
      '<button type="button" class="link" data-act="cardshuffle">打乱顺序</button></div>';
    if (!deck.length) {
      html += '<div class="sheet empty"><p class="big">这一组全部记住了</p><p>取消「只看还不熟的」可以从头再过一遍。</p></div>';
      el.innerHTML = html; return;
    }
    var c = deck[i];
    var grp = c.ch && s.chMap[c.ch] ? s.chMap[c.ch].title : '';
    html += '<div class="flash-wrap"><button type="button" class="flash" data-act="flip" aria-label="翻面">' +
      (grp ? '<span class="grp">' + esc(grp) + '</span>' : '') +
      '<div class="front">' + c.f + '</div>' +
      (ui.cardFlip ? '<div class="back">' + c.b + '</div>' : '<div class="hint">先在心里说出答案，再点卡片翻面</div>') +
      '</button>' +
      '<div class="quiz-actions"><button type="button" class="btn" data-act="cardprev">← 上一张</button>' +
      '<span class="mono muted" style="align-self:center">' + (i + 1) + ' / ' + deck.length + '</span>' +
      (ui.cardFlip
        ? '<span class="row"><button type="button" class="btn red" data-act="cardmark" data-v="0">还不熟</button><button type="button" class="btn primary" data-act="cardmark" data-v="1">记住了</button></span>'
        : '<button type="button" class="btn primary" data-act="flip">翻面</button>') +
      '</div><p class="kbd">键盘：空格翻面，← → 切换，1 还不熟，2 记住了</p></div>';
    el.innerHTML = html;
  }

  /* ---------- 练习 / 模拟 ---------- */
  function startQuiz(opt) {
    if (!opt.ids.length) { toast('没有可以练习的题目'); return; }
    session = { title: opt.title, ids: opt.ids, i: 0, ans: {}, mode: opt.mode || 'practice', back: opt.back || '#home', t0: Date.now(), done: false, removed: 0, mock: opt.mock };
    go('quiz');
    window.scrollTo(0, 0);
  }

  function renderQuiz() {
    var ss = session;
    if (ss.done) return renderSummary();
    var q = QMAP[ss.ids[ss.i]], s = SMAP[q.subj], a = ss.ans[q.id] || {};
    var exam = ss.mode === 'exam', locked = !exam && a.locked;
    var ch = s.chMap[q.ch];
    var html = '<section class="stack"><div class="quiz-head"><button type="button" class="link" data-act="quit">← 退出</button>' +
      '<span class="t">' + esc(ss.title) + '</span><span class="num muted">' + (ss.i + 1) + ' / ' + ss.ids.length + '</span></div>' +
      '<div class="bar" style="--c:var(--s-' + s.id + ')"><i style="width:' + pct(ss.i + (locked ? 1 : 0), ss.ids.length) + '%"></i></div>';
    html += '<article class="qcard" style="--c:var(--s-' + s.id + ')"><div class="qmeta"><span class="chip">' + s.name + '</span>' +
      (ch ? '<span>' + esc(ch.title) + '</span>' : '') + '<span>· ' + typeLabel(q) + '</span>' + (q.tag ? '<span class="tag">期中高频</span>' : '') + '</div>' +
      '<div class="stem">' + q.q + '</div>' + fig(q.fig);
    if (q.type === 'choice') {
      html += '<div class="opts">' + q.opts.map(function (o, k) {
        var cls = 'opt', mk = '';
        if (exam) { if (a.v === k) cls += ' sel'; }
        else if (locked) {
          if (k === q.a) { cls += ' right'; mk = '✓'; }
          else if (a.v === k) { cls += ' wrong'; mk = '✗'; }
        }
        return '<button type="button" class="' + cls + '" data-act="pick" data-v="' + k + '"' + (locked ? ' disabled' : '') + '>' +
          '<span class="k">' + (q.kind === 'tf' ? (k === 0 ? '对' : '错') : LETTERS[k]) + '</span><span class="txt">' + o + '</span><span class="mk">' + mk + '</span></button>';
      }).join('') + '</div>';
    } else {
      html += '<div class="fill-row"><input class="field" id="fill-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="在这里输入答案" value="' + esc(a.v || '') + '"' + (locked ? ' disabled' : '') + '>' +
        (exam ? '' : '<button type="button" class="btn primary" data-act="fill"' + (locked ? ' disabled' : '') + '>提交</button>') + '</div>' +
        (exam ? '' : '<p class="muted small">标点、空格不影响判分；不会就直接点「提交」看答案。</p>');
    }
    if (locked) {
      html += '<div class="feedback ' + (a.ok ? 'ok' : 'no') + '"><div class="verdict">' + (a.ok ? '✓ 回答正确' : '✗ 答错了，正确答案：' + esc(answerText(q))) + '</div>' +
        (q.ex ? '<div class="ex">' + q.ex + '</div>' : '') +
        (!a.ok && q.type === 'fill' && a.v ? '<div><button type="button" class="link" data-act="override">我的写法其实也对 → 判为正确</button></div>' : '') +
        '</div>';
    }
    html += '</article>';
    if (exam) {
      html += '<div class="quiz-actions"><button type="button" class="btn" data-act="prev"' + (ss.i ? '' : ' disabled') + '>上一题</button>' +
        (ss.i < ss.ids.length - 1 ? '<button type="button" class="btn primary" data-act="next">下一题</button>' : '<button type="button" class="btn primary" data-act="submit">交卷</button>') + '</div>' +
        '<div class="sheet stack"><div class="sec-head"><h3>答题卡</h3><button type="button" class="btn sm red" data-act="submit">交卷批改</button></div><div class="sheet-dots">' +
        ss.ids.map(function (id, k) {
          var v = ss.ans[id] && ss.ans[id].v; var done = v !== undefined && v !== '';
          return '<button type="button" data-act="jumpq" data-v="' + k + '" class="' + (done ? 'done ' : '') + (k === ss.i ? 'cur' : '') + '">' + (k + 1) + '</button>';
        }).join('') + '</div></div>';
    } else {
      html += '<div class="quiz-actions">' + (locked
        ? '<span></span><button type="button" class="btn primary" data-act="next" id="next-btn">' + (ss.i < ss.ids.length - 1 ? '下一题 →' : '看结果') + '</button>'
        : '<button type="button" class="btn" data-act="skip">跳过</button><span class="kbd" style="align-self:center">键盘：A–D 选择，Enter 下一题</span>') + '</div>';
    }
    html += '</section>';
    app.innerHTML = html;
    var inp = document.getElementById('fill-input');
    if (inp && !locked && window.matchMedia('(hover: hover)').matches) inp.focus();
    if (locked) { var nb = document.getElementById('next-btn'); if (nb) nb.focus({ preventScroll: true }); }
  }

  function answerCurrent(v) {
    var ss = session, q = QMAP[ss.ids[ss.i]];
    if (ss.mode === 'exam') { ss.ans[q.id] = { v: v }; renderQuiz(); return; }
    var ok = q.type === 'choice' ? v === q.a : checkFill(q, v);
    ss.ans[q.id] = { v: v, ok: ok, locked: true };
    if (record(q, ok)) ss.removed++;
    renderQuiz();
  }

  function nextQ() {
    var ss = session;
    if (ss.i < ss.ids.length - 1) { ss.i++; renderQuiz(); window.scrollTo(0, 0); }
    else finish();
  }

  function finish() {
    var ss = session;
    if (ss.mode === 'exam') {
      ss.ids.forEach(function (id) {
        var q = QMAP[id], a = ss.ans[id] || {};
        var ok = a.v !== undefined && a.v !== '' && (q.type === 'choice' ? a.v === q.a : checkFill(q, a.v));
        ss.ans[id] = { v: a.v, ok: ok, locked: true };
        if (record(q, ok)) ss.removed++;
      });
      var right = ss.ids.filter(function (id) { return ss.ans[id].ok; }).length;
      S.mocks.unshift({ t: Date.now(), n: ss.ids.length, right: right, subj: ss.mock || '' , sec: Math.round((Date.now() - ss.t0) / 1000) });
      S.mocks = S.mocks.slice(0, 10);
      save();
    }
    ss.done = true; ss.t1 = Date.now();
    renderQuiz();
    window.scrollTo(0, 0);
  }

  function renderSummary() {
    var ss = session;
    var answered = ss.ids.filter(function (id) { return ss.ans[id] && ss.ans[id].locked; });
    var right = answered.filter(function (id) { return ss.ans[id].ok; });
    var wrong = ss.ids.filter(function (id) { return !(ss.ans[id] && ss.ans[id].ok); });
    var mins = Math.max(1, Math.round(((ss.t1 || Date.now()) - ss.t0) / 60000));
    var p = pct(right.length, ss.ids.length);
    var comment = p >= 90 ? '非常稳，保持手感就好。' : p >= 75 ? '基础不错，把错题弄懂就更稳了。' : p >= 60 ? '及格线以上，错题要逐个看解析。' : '先回到知识点再看一遍，然后重做错题。';
    var stamp = ascii(p >= 90 ? 'top' : p >= 60 ? 'good' : 'keep', 'stamp');
    var html = '<section class="sheet score"><div class="score-ring"><div><strong>' + right.length + '</strong><span>/ ' + ss.ids.length + ' 题</span></div></div>' +
      '<div class="stack" style="gap:6px"><p class="eyebrow">' + esc(ss.title) + '</p><h2>正确率 ' + p + '%</h2><p class="muted">' + comment + '</p>' +
      '<p class="muted small">用时约 ' + mins + ' 分钟' + (ss.removed ? ' · 有 ' + ss.removed + ' 道题已从错题本移出' : '') + '</p></div>' + stamp + '</section>';
    html += '<div class="row">' + (wrong.length ? '<button type="button" class="btn red" data-act="redo">重做本次错题 ' + wrong.length + ' 题</button>' : '') +
      '<a class="btn primary" href="' + ss.back + '">返回</a></div>';
    html += '<section class="stack"><h3>逐题批改</h3><div class="review">' + ss.ids.map(function (id, k) {
      var q = QMAP[id], a = ss.ans[id] || {}, ok = !!a.ok;
      var st = strip(q.q); if (st.length > 70) st = st.slice(0, 70) + '…';
      return '<details' + (ok ? '' : ' open') + '><summary><span class="mk ' + (ok ? 'ok' : 'no') + '">' + (ok ? '✓' : '✗') + '</span><span class="st"><span class="mono muted">' + (k + 1) + '. </span>' + esc(st) + '</span></summary>' +
        '<div class="body">' + (ok ? '' : '<div class="yours">你的答案：' + esc(givenText(q, a.v)) + '</div>') +
        '<div class="ans">正确答案：' + esc(answerText(q)) + '</div>' + (q.ex ? '<div>' + q.ex + '</div>' : '') + '</div></details>';
    }).join('') + '</div></section>';
    app.innerHTML = html;
    FX.scramble(app.querySelector('.score h2')); FX.scramble(app.querySelector('.score-ring strong'), 700);
  }

  /* ---------- 模拟考试页 ---------- */
  function renderMock() {
    if (!ui.mockSubj) { ui.mockSubj = {}; SUBJECTS.forEach(function (s) { ui.mockSubj[s.id] = true; }); }
    var chosen = SUBJECTS.filter(function (s) { return ui.mockSubj[s.id]; });
    var poolN = chosen.reduce(function (n, s) { return n + mockPool(s).length; }, 0);
    var html = '<section class="stack band page-band"><canvas class="page-field" aria-hidden="true"></canvas><p class="eyebrow">综合模拟</p><h1>像考试一样做一套</h1>' +
      '<p class="muted">从选中的科目里按比例随机抽题。做题时不显示对错，交卷后统一批改、给出解析，错题自动进错题本。</p></section>';
    html += '<section class="sheet stack"><h3>选择科目</h3><div class="chips">' + SUBJECTS.map(function (s) {
      return '<button type="button" class="chip' + (ui.mockSubj[s.id] ? ' on' : '') + '" style="--c:var(--s-' + s.id + ')" data-act="mocksubj" data-v="' + s.id + '">' + s.name + '</button>';
    }).join('') + '</div><h3>题量</h3><div class="chips">' + [10, 20, 30, 50].map(function (n) {
      return '<button type="button" class="chip' + (ui.mockN === n ? ' on' : '') + '" data-act="mockn" data-v="' + n + '">' + n + ' 题</button>';
    }).join('') + '</div><h3>题目范围</h3><div class="chips">' +
      '<button type="button" class="chip' + (ui.mockHot ? '' : ' on') + '" data-act="mockhot" data-v="0">全部题目</button>' +
      '<button type="button" class="chip' + (ui.mockHot ? ' on' : '') + '" data-act="mockhot" data-v="1">只抽期中高频题</button>' +
      '</div><div class="row"><button type="button" class="btn primary" data-act="mockstart"' + (poolN ? '' : ' disabled') + '>开始模拟</button>' +
      '<span class="muted small">题库共 ' + poolN + ' 题</span></div></section>';
    if (S.mocks.length) {
      html += '<section class="sheet stack"><h3>最近的成绩</h3><div class="review">' + S.mocks.map(function (m) {
        var d = new Date(m.t);
        return '<div class="row" style="justify-content:space-between;border-top:1px dashed var(--line);padding-top:8px"><span class="small">' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2) + ' · ' + esc(m.subj || '综合') + '</span>' +
          '<span class="mono"><b style="color:var(--red)">' + m.right + '</b> / ' + m.n + ' · ' + pct(m.right, m.n) + '%</span></div>';
      }).join('') + '</div></section>';
    }
    app.innerHTML = html;
    FX.mountPage(app.querySelector('.page-field'), { alpha: 0.55 });
  }

  function mockPool(s) { return ui.mockHot ? s.questions.filter(function (q) { return q.tag; }) : s.questions; }
  function buildMock() {
    var chosen = SUBJECTS.filter(function (s) { return ui.mockSubj[s.id] && mockPool(s).length; });
    var total = chosen.reduce(function (n, s) { return n + mockPool(s).length; }, 0);
    var N = Math.min(ui.mockN, total);
    var picks = [];
    var quotas = chosen.map(function (s) { return { s: s, q: mockPool(s), k: Math.floor(N * mockPool(s).length / total) }; });
    var left = N - quotas.reduce(function (n, x) { return n + x.k; }, 0);
    shuffle(quotas).forEach(function (x) { if (left > 0 && x.k < x.q.length) { x.k++; left--; } });
    quotas.forEach(function (x) { picks = picks.concat(shuffle(x.q).slice(0, x.k).map(function (q) { return q.id; })); });
    picks.sort(function (a, b) { return SUBJECTS.indexOf(SMAP[QMAP[a].subj]) - SUBJECTS.indexOf(SMAP[QMAP[b].subj]); });
    var names = (chosen.length === SUBJECTS.length ? '三科综合' : chosen.map(function (s) { return s.name; }).join('、')) + (ui.mockHot ? ' · 期中高频' : '');
    startQuiz({ title: '模拟 · ' + names, ids: picks, mode: 'exam', back: '#mock', mock: names });
  }

  /* ---------- 错题本 ---------- */
  function renderWrong() {
    var ids = wrongIds();
    var html = '<section class="stack band page-band"><canvas class="page-field" aria-hidden="true"></canvas><p class="eyebrow">错题本</p><h1>做错的题都在这里</h1><p class="muted">重做时题目顺序每次随机打乱；答对就会自动移出。考前把它清空。</p></section>';
    if (!ids.length) {
      html += '<div class="sheet empty">' + ascii('empty') + '<p class="big">错题本是空的</p><p>去做几道练习吧，做错的题会自动收进来。</p><a class="btn primary" href="#mock">做一套模拟</a></div>';
      app.innerHTML = html; FX.mountPage(app.querySelector('.page-field'), { alpha: 0.55 }); return;
    }
    html += '<div class="row"><button type="button" class="btn primary" data-act="wrongall">全部重做 ' + ids.length + ' 题</button></div>';
    SUBJECTS.forEach(function (s) {
      var mine = ids.filter(function (id) { return QMAP[id].subj === s.id; });
      if (!mine.length) return;
      html += '<section class="sheet stack" style="--c:var(--s-' + s.id + ')"><div class="sec-head"><h2 style="color:var(--c)">' + s.name + ' · ' + mine.length + ' 题</h2>' +
        '<button type="button" class="btn sm" data-act="wrongsubj" data-v="' + s.id + '">重做这些</button></div><div>' +
        mine.map(function (id) {
          var q = QMAP[id], ch = s.chMap[q.ch];
          return '<div class="wrong-item"><div class="small muted">' + (ch ? esc(ch.title) : '') + ' · ' + typeLabel(q) + '</div><div class="st">' + q.q + '</div>' + fig(q.fig) +
            '<details><summary class="link small" style="cursor:pointer">看答案和解析</summary><div class="small"><b style="color:var(--green)">答案：' + esc(answerText(q)) + '</b>' + (q.ex ? '<div>' + q.ex + '</div>' : '') + '</div></details>' +
            '<div><button type="button" class="link small" data-act="unwrong" data-v="' + id + '">已经弄懂了，移出错题本</button></div></div>';
        }).join('') + '</div></section>';
    });
    app.innerHTML = html; FX.mountPage(app.querySelector('.page-field'), { alpha: 0.55 });
  }

  /* ---------- 事件 ---------- */
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    var act = el.getAttribute('data-act'), v = el.getAttribute('data-v');
    var h = (location.hash || '#home').slice(1);
    var s = SMAP[h];
    switch (act) {
      case 'day': ui.planDay = v; renderHome(); break;
      case 'replay': FX.intro(true); break;
      case 'task': break; // 由 change 处理
      case 'jump':
        var ch = el.getAttribute('data-ch'), sid = el.getAttribute('data-s');
        ui.tab[sid] = el.getAttribute('data-tab') || 'learn'; if (ch) ui.ch[sid + ':open'] = ch;
        break;
      case 'jumptab': ui.tab[el.getAttribute('data-s')] = v; break;
      case 'tab': GEO.stop(); ui.tab[s.id] = v; ui.cardFlip = false; renderSubject(s); break;
      case 'seen':
        var k = s.id + '/' + v;
        if (S.seen[k]) delete S.seen[k]; else { S.seen[k] = Date.now(); toast('已标记为复习过'); }
        save(); ui.ch[s.id + ':open'] = v; renderSubject(s); break;
      case 'chquiz':
        startQuiz({ title: s.name + ' · ' + s.chMap[v].title, ids: s.questions.filter(function (q) { return q.ch === v; }).map(function (q) { return q.id; }), back: '#' + s.id });
        ui.tab[s.id] = 'practice'; ui.ch[s.id] = v; break;
      case 'pickch': ui.ch[s.id] = v; renderSubject(s); break;
      case 'start':
        var sel = ui.ch[s.id] || 'all';
        var pool = s.questions.filter(function (q) { return sel === 'all' || q.ch === sel; });
        var label = sel === 'all' ? '全部' : s.chMap[sel].title;
        if (v === 'rand') pool = shuffle(pool).slice(0, 10);
        if (v === 'left') pool = pool.filter(function (q) { var r = S.q[q.id]; return !r || !r.r; });
        if (v === 'hot') { pool = shuffle(pool.filter(function (q) { return q.tag; })); label += ' · 期中高频'; }
        startQuiz({ title: s.name + ' · ' + label, ids: pool.map(function (q) { return q.id; }), back: '#' + s.id });
        break;
      case 'cardch': ui.cardCh[s.id] = v; ui.cardIdx[s.id] = 0; ui.cardFlip = false; renderSubject(s); break;
      case 'onlynew': break;
      case 'cardshuffle':
        s.cards = shuffle(s.cards); ui.cardIdx[s.id] = 0; ui.cardFlip = false; renderSubject(s); toast('已打乱'); break;
      case 'flip': ui.cardFlip = !ui.cardFlip; renderSubject(s); if (ui.cardFlip) FX.scramble(app.querySelector('.flash .back'), 520); break;
      case 'cardprev': moveCard(s, -1); break;
      case 'cardmark': markCard(s, v === '1'); break;
      case 'pick': answerCurrent(+v); break;
      case 'fill': answerCurrent(document.getElementById('fill-input').value); break;
      case 'override':
        var q = QMAP[session.ids[session.i]];
        session.ans[q.id].ok = true;
        S.q[q.id] = { n: (S.q[q.id] || { n: 1 }).n, r: 1 };
        if (S.wrong[q.id]) { delete S.wrong[q.id]; }
        save(); updateBadge(); renderQuiz(); break;
      case 'next': nextQ(); break;
      case 'prev': if (session.i) { session.i--; renderQuiz(); } break;
      case 'skip': nextQ(); break;
      case 'jumpq': session.i = +v; renderQuiz(); break;
      case 'submit': confirmSubmit(el); break;
      case 'quit': confirmQuit(el); break;
      case 'redo':
        var w = session.ids.filter(function (id) { return !(session.ans[id] && session.ans[id].ok); });
        startQuiz({ title: '重做错题', ids: shuffle(w), back: session.back }); break;
      case 'mocksubj': ui.mockSubj[v] = !ui.mockSubj[v]; renderMock(); break;
      case 'mockn': ui.mockN = +v; renderMock(); break;
      case 'mockhot': ui.mockHot = v === '1'; renderMock(); break;
      case 'mockstart': buildMock(); break;
      case 'wrongall': startQuiz({ title: '错题重做', ids: shuffle(wrongIds()), back: '#wrong' }); break;
      case 'wrongsubj': startQuiz({ title: SMAP[v].name + ' · 错题重做', ids: shuffle(wrongIds().filter(function (id) { return QMAP[id].subj === v; })), back: '#wrong' }); break;
      case 'unwrong': delete S.wrong[v]; save(); updateBadge(); renderWrong(); toast('已移出错题本'); break;
    }
  });

  function confirmSubmit(el) {
    var ss = session;
    var blankN = ss.ids.filter(function (id) { var a = ss.ans[id]; return !a || a.v === undefined || a.v === ''; }).length;
    if (blankN && el.getAttribute('data-sure') !== '1') {
      el.setAttribute('data-sure', '1'); el.textContent = '还有 ' + blankN + ' 题没做，再点一次交卷';
      return;
    }
    finish();
  }
  function confirmQuit(el) {
    var ss = session;
    var any = Object.keys(ss.ans).length;
    if (ss.mode === 'exam' && any && el.getAttribute('data-sure') !== '1') {
      el.setAttribute('data-sure', '1'); el.textContent = '再点一次退出（不保存本次模拟）';
      return;
    }
    if (ss.mode !== 'exam' && any) {
      ss.ids = ss.ids.filter(function (id) { return ss.ans[id] && ss.ans[id].locked; });
      finish(); return;
    }
    var back = ss.back; session = null; location.hash = back;
  }
  function moveCard(s, d) {
    var deck = cardDeck(s); if (!deck.length) return;
    ui.cardIdx[s.id] = ((ui.cardIdx[s.id] || 0) + d + deck.length) % deck.length;
    ui.cardFlip = false; renderSubject(s);
  }
  function markCard(s, ok) {
    var deck = cardDeck(s), c = deck[ui.cardIdx[s.id] || 0];
    if (!c) return;
    if (ok) S.cards[c.id] = 1; else delete S.cards[c.id];
    save();
    ui.cardFlip = false;
    if (!ui.cardOnlyNew[s.id] || !ok) ui.cardIdx[s.id] = (ui.cardIdx[s.id] || 0) + 1;
    if (ui.cardIdx[s.id] >= cardDeck(s).length) { ui.cardIdx[s.id] = 0; toast('这一轮过完了'); }
    renderSubject(s);
  }

  app.addEventListener('change', function (e) {
    var el = e.target;
    if (el.getAttribute('data-act') === 'task') {
      var id = el.getAttribute('data-v');
      if (el.checked) S.plan[id] = 1; else delete S.plan[id];
      save(); renderHome();
      if (el.checked) toast('完成一项，继续！');
    }
    if (el.getAttribute('data-act') === 'onlynew') {
      var s = SMAP[(location.hash || '').slice(1)];
      ui.cardOnlyNew[s.id] = el.checked; ui.cardIdx[s.id] = 0; ui.cardFlip = false; renderSubject(s);
    }
  });
  app.addEventListener('input', function (e) {
    if (e.target.id === 'search-input') { ui.search = e.target.value; renderSearch(); }
    if (e.target.id === 'fill-input' && session && session.mode === 'exam') {
      session.ans[session.ids[session.i]] = { v: e.target.value };
    }
  });
  app.addEventListener('keydown', function (e) {
    if (e.target.id === 'fill-input' && e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      if (session.mode === 'exam') { if (session.i < session.ids.length - 1) nextQ(); }
      else answerCurrent(e.target.value);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    var h = (location.hash || '').slice(1);
    if (h === 'quiz' && session && !session.done) {
      var q = QMAP[session.ids[session.i]], a = session.ans[q.id];
      var locked = session.mode !== 'exam' && a && a.locked;
      var k = e.key.toUpperCase();
      if (q.type === 'choice' && !locked) {
        var idx = LETTERS.indexOf(k); if (idx < 0 && /^[1-8]$/.test(k)) idx = +k - 1;
        if (idx >= 0 && idx < q.opts.length) { e.preventDefault(); answerCurrent(idx); return; }
      }
      if (e.key === 'Enter' && (locked || session.mode === 'exam')) {
        if (tag === 'button') return; // 让按钮自己处理
        e.preventDefault(); nextQ();
      }
      if (session.mode === 'exam' && e.key === 'ArrowLeft' && session.i) { session.i--; renderQuiz(); }
      if (session.mode === 'exam' && e.key === 'ArrowRight' && session.i < session.ids.length - 1) { session.i++; renderQuiz(); }
      return;
    }
    var s = SMAP[h];
    if (s && (ui.tab[s.id] === 'cards')) {
      if (e.key === ' ') { e.preventDefault(); ui.cardFlip = !ui.cardFlip; renderSubject(s); }
      else if (e.key === 'ArrowRight') moveCard(s, 1);
      else if (e.key === 'ArrowLeft') moveCard(s, -1);
      else if (e.key === '1' && ui.cardFlip) markCard(s, false);
      else if (e.key === '2' && ui.cardFlip) markCard(s, true);
    }
  });

  setInterval(function () { var c = document.getElementById('countdown'); if (c) c.innerHTML = countdownHTML(); }, 30000);

  applyTheme();
  lastRoute = location.hash;
  route();
  FX.mountBg(document.getElementById('bg-field'));
  FX.intro();
})();
