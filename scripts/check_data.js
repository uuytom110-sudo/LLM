#!/usr/bin/env node
/* 数据自检：题目答案下标、章节 id、卡片、例题字段、图形能否渲染。用法：node scripts/check_data.js */
global.window = {};
const path = require('path');
const root = path.resolve(__dirname, '..');
['js/geo.js', 'data/biology.js', 'data/physics.js', 'data/model.js'].forEach(f => require(path.join(root, f)));
const GEO = window.GEWU_GEO;
let bad = 0;
function fail(msg) { bad++; console.error('✗ ' + msg); }
function tryFig(f, where) { try { GEO.figure(f); } catch (e) { fail(where + ' 图形错误：' + e.message); } }
window.GEWU_SUBJECTS.forEach(s => {
  const ch = new Set(s.chapters.map(c => c.id));
  const seen = new Set();
  s.chapters.forEach(c => c.points.forEach(p => { if (!p.t || !p.d) fail(s.id + ' 知识点缺字段'); if (p.fig) tryFig(p.fig, s.id + '/' + c.id); }));
  s.questions.forEach((q, i) => {
    const w = s.id + ' 第 ' + (i + 1) + ' 题';
    if (!ch.has(q.ch)) fail(w + ' 章节不存在：' + q.ch);
    if (seen.has(q.q)) fail(w + ' 题干重复'); seen.add(q.q);
    if (q.type === 'choice') { if (!Array.isArray(q.opts) || q.a < 0 || q.a >= q.opts.length) fail(w + ' 答案下标越界'); if (new Set(q.opts).size !== q.opts.length) fail(w + ' 选项重复'); }
    else if (q.type === 'tf') { if (typeof q.a !== 'boolean') fail(w + ' 判断题答案应为 true/false'); }
    else if (q.type === 'fill') { if (!(Array.isArray(q.a) && q.a.length)) fail(w + ' 填空题答案应为非空数组'); }
    else fail(w + ' 未知题型 ' + q.type);
    if (!q.ex) fail(w + ' 缺少解析');
    if (q.fig) tryFig(q.fig, w);
  });
  s.cards.forEach((c, i) => { if (!ch.has(c.ch)) fail(s.id + ' 卡片 ' + (i + 1) + ' 章节不存在'); if (!c.f || !c.b) fail(s.id + ' 卡片缺字段'); });
  (s.examples || []).forEach(e => {
    ['id', 'type', 'title', 'q', 'think', 'sol'].forEach(k => { if (!e[k]) fail(s.id + ' 例题 ' + e.id + ' 缺 ' + k); });
    (e.figs || (e.fig ? [e.fig] : [])).forEach(f => tryFig(f, s.id + ' 例题 ' + e.id));
  });
  const tf = s.questions.filter(q => q.type === 'choice').map(q => q.a);
  const dist = [0, 1, 2, 3].map(k => tf.filter(a => a === k).length);
  console.log(`${s.name}：${s.chapters.length} 章，${s.chapters.reduce((n, c) => n + c.points.length, 0)} 个知识点，${s.questions.length} 题（高频 ${s.questions.filter(q => q.tag).length}），${s.cards.length} 张卡片，${(s.examples || []).length} 道例题；选择题答案分布 A/B/C/D = ${dist.join('/')}`);
});
if (bad) { console.error(bad + ' 个问题'); process.exit(1); } else console.log('✓ 数据检查通过');
