const S = { project: { name: 'My Addon', namespace: 'myaddon', description: '', items: [], blocks: [] }, tab: 'dashboard', sel: { items: -1, blocks: -1 }, vp: null };
const $ = (s) => document.querySelector(s);
const TABS = [['dashboard', '🏠 Дашборд'], ['items', '⚔ Предметы'], ['blocks', '🧱 Блоки'], ['viewport', '🎮 3D / Fitting'],
  ['armor', '🛡 Броня (скоро)', 1], ['structures', '🏰 Структуры (скоро)', 1], ['biomes', '🌍 Биомы/Измерения (скоро)', 1], ['models', '📦 Модели/Анимации (скоро)', 1]];
const status = (t) => $('#status').textContent = t;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([id, t, soon]) => `<div data-t="${id}" class="${S.tab === id ? 'on' : ''} ${soon ? 'soon' : ''}">${t}</div>`).join('');
  $('#tabs').onclick = (e) => { const t = e.target.dataset.t; if (t) go(t); };
  $('#pname').textContent = S.project.name + ' · ' + S.project.namespace;
}
function go(tab) { if (S.vp) { S.vp.dispose(); S.vp = null; } S.tab = tab; renderTabs(); ({ dashboard, items: () => editor('items'), blocks: () => editor('blocks'), viewport }[tab] || soon)(); }
function soon() { $('#view').innerHTML = '<h2>Скоро</h2><p>Этот модуль — следующие фазы разработки.</p>'; }

function dashboard() {
  const p = S.project;
  $('#view').innerHTML = `<h2>Проект</h2><div class="form">
  <label>Название аддона</label><input id="pn" value="${esc(p.name)}">
  <label>Namespace (латиница, нижний регистр)</label><input id="pns" value="${esc(p.namespace)}">
  <label>Описание</label><textarea id="pd" rows="2">${esc(p.description)}</textarea></div>
  <h2 style="margin-top:24px">Быстрый старт</h2><div class="cards">
  <div class="card" data-go="items"><b>${p.items.length}</b>Предметов и оружия</div>
  <div class="card" data-go="blocks"><b>${p.blocks.length}</b>Блоков</div>
  <div class="card" data-go="viewport"><b>3D</b>Display / Fitting редактор</div></div>`;
  $('#pn').oninput = (e) => { p.name = e.target.value; $('#pname').textContent = p.name + ' · ' + p.namespace; };
  $('#pns').oninput = (e) => { p.namespace = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'); };
  $('#pd').oninput = (e) => p.description = e.target.value;
  document.querySelectorAll('[data-go]').forEach((c) => c.onclick = () => go(c.dataset.go));
}

const FIELDS = {
  items: [['id', 'ID (a-z, 0-9, _)', 'text', 'new_item'], ['name', 'Отображаемое имя', 'text', 'New Item'], ['damage', 'Урон', 'number', 0], ['durability', 'Прочность (0 = нет)', 'number', 0], ['stack', 'Макс. стак', 'number', 64],
    ['category', 'Категория', ['equipment', 'items', 'nature', 'construction'], 'equipment'], ['color', 'Цвет заглушки текстуры', 'color', '#cccccc']],
  blocks: [['id', 'ID', 'text', 'new_block'], ['name', 'Имя', 'text', 'New Block'], ['hardness', 'Твёрдость (сек. добычи)', 'number', 1], ['resistance', 'Взрывоустойчивость', 'number', 1], ['light', 'Свет (0–15)', 'number', 0], ['color', 'Цвет заглушки текстуры', 'color', '#777777']]
};
function editor(kind) {
  const arr = S.project[kind], i = S.sel[kind], cur = arr[i];
  const field = ([k, l, t, d]) => Array.isArray(t)
    ? `<label>${l}</label><select data-k="${k}">${t.map((o) => `<option ${cur[k] === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`
    : `<label>${l}</label><input data-k="${k}" type="${t}" value="${esc(cur[k])}">`;
  $('#view').innerHTML = `<div class="split"><div><div class="list">${arr.map((x, n) => `<div data-n="${n}" class="${n === i ? 'on' : ''}">${esc(x.name || x.id)}</div>`).join('')}</div>
  <p><button id="add" class="primary">+ Добавить</button></p></div>
  <div class="form">${cur ? FIELDS[kind].map(field).join('') + '<p><button id="del" class="danger">Удалить</button></p>' : '<p>Выберите элемент или добавьте новый.</p>'}</div></div>`;
  document.querySelectorAll('.list div').forEach((d) => d.onclick = () => { S.sel[kind] = +d.dataset.n; editor(kind); });
  $('#add').onclick = () => { const o = {}; FIELDS[kind].forEach(([k, , , d]) => o[k] = d); o.id += '_' + (arr.length + 1); arr.push(o); S.sel[kind] = arr.length - 1; editor(kind); };
  if (cur) {
    document.querySelectorAll('[data-k]').forEach((el) => el.oninput = () => { cur[el.dataset.k] = el.type === 'number' ? Number(el.value) : el.value; if (el.dataset.k === 'id') cur.id = cur.id.toLowerCase().replace(/[^a-z0-9_]/g, '_'); });
    $('#del').onclick = () => { arr.splice(i, 1); S.sel[kind] = -1; editor(kind); };
  }
}

function viewport() {
  const items = S.project.items; const it = items[Math.max(0, S.sel.items)];
  if (it) it.display = it.display || {}; 
  let slot = 'fp';
  const get = () => { const d = it ? it.display : {}; return d[slot] = d[slot] || { pos: [0, 0, 0], rot: [0, 0, 0], scale: 1 }; };
  $('#view').innerHTML = `<div class="vp"><canvas id="cv"></canvas><div class="panel">
  <h3>Display Editor</h3>${it ? `<p>Предмет: <b>${esc(it.name || it.id)}</b></p>` : '<p>Создайте предмет во вкладке «Предметы».</p>'}
  <label>Слот</label><select id="slot">${Object.entries(SLOTS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><div id="sl"></div>
  <p style="color:#8a8d93;font-size:12px">Перетащите мышью по сцене для вращения камеры. Загрузка .obj/.fbx и Armor Fitting — следующие фазы.</p></div></div>`;
  S.vp = new Viewport($('#cv'));
  if (it) S.vp.setItemColor(it.color || '#cccccc');
  const draw = () => {
    const t = get(); const rows = [['Позиция X', 'pos', 0, -2, 2, .01], ['Позиция Y', 'pos', 1, -2, 2, .01], ['Позиция Z', 'pos', 2, -2, 2, .01], ['Поворот X', 'rot', 0, -180, 180, 1], ['Поворот Y', 'rot', 1, -180, 180, 1], ['Поворот Z', 'rot', 2, -180, 180, 1]];
    $('#sl').innerHTML = rows.map(([l, k, n, a, b, s]) => `<div class="row"><span>${l}</span><input type="range" min="${a}" max="${b}" step="${s}" value="${t[k][n]}" data-k="${k}" data-n="${n}"></div>`).join('') + `<div class="row"><span>Масштаб</span><input type="range" min="0.1" max="3" step="0.01" value="${t.scale}" data-k="scale"></div>`;
    $('#sl').querySelectorAll('input').forEach((el) => el.oninput = () => { if (el.dataset.k === 'scale') t.scale = +el.value; else t[el.dataset.k][+el.dataset.n] = +el.value; S.vp.applyTransform(t); });
    S.vp.applyTransform(t);
  };
  $('#slot').onchange = (e) => { slot = e.target.value; draw(); };
  draw();
}

$('#bExport').onclick = async () => {
  const r = await window.api.exportAddon(S.project);
  status(r.ok ? 'Экспортировано: ' + r.path : r.canceled ? 'Отменено' : 'Ошибка: ' + r.error);
};
$('#bSave').onclick = async () => status((await window.api.saveProject(S.project)) ? 'Проект сохранён' : 'Отменено');
$('#bOpen').onclick = async () => { const p = await window.api.openProject(); if (p) { S.project = p; S.sel = { items: -1, blocks: -1 }; go('dashboard'); status('Проект открыт'); } };
go('dashboard');
