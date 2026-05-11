// ============================================================
// REACTIVE PROGRAMMING ENGINE - JadwalinYuk!
// ============================================================
class ReactiveState {
  constructor(v) { this._value = v; this._subs = []; }
  get value() { return this._value; }
  set value(v) { this._value = v; this._subs.forEach(fn => fn(v)); }
  subscribe(fn) { this._subs.push(fn); fn(this._value); }
}
function computed(deps, fn) {
  const r = new ReactiveState(fn(...deps.map(d => d.value)));
  deps.forEach(d => d.subscribe(() => { r.value = fn(...deps.map(d => d.value)); }));
  return r;
}

// ============================================================
// DATA STORE
// ============================================================
const STORAGE_KEY = 'jadwalinyuk_tasks';
function loadTasks() {
  try { const d = localStorage.getItem(STORAGE_KEY); if (d) return JSON.parse(d); } catch(e) {}
  return [
    { id: 1, title: 'Review Q3 Financial Reports with the executive team', completed: false, priority: 'high', category: 'Work', deadline: '2025-12-10', time: '14:00', createdAt: Date.now() },
    { id: 2, title: 'Finalize Design System documentation for new components', completed: false, priority: 'medium', category: 'Design', deadline: '2025-12-22', time: '09:00', createdAt: Date.now()-1000 },
    { id: 3, title: 'Prepare sprint retrospective presentation slides', completed: false, priority: 'low', category: 'Work', deadline: '2025-12-25', time: '16:00', createdAt: Date.now()-2000 },
    { id: 4, title: 'Update CI/CD pipeline configuration for staging', completed: false, priority: 'medium', category: 'Dev', deadline: '2025-12-30', time: '10:00', createdAt: Date.now()-3000 },
    { id: 5, title: 'Send weekly project updates to stakeholders', completed: true, priority: 'low', category: 'Work', deadline: '', time: '', createdAt: Date.now()-50000 },
    { id: 6, title: 'Fix critical login bug on mobile app', completed: true, priority: 'high', category: 'Dev', deadline: '', time: '', createdAt: Date.now()-60000 },
  ];
}

const tasks$ = new ReactiveState(loadTasks());
const searchQuery$ = new ReactiveState('');
const currentView$ = new ReactiveState('tasks');
const darkMode$ = new ReactiveState(localStorage.getItem('jadwalinyuk_dark') === 'true');
const trashTasks$ = new ReactiveState(JSON.parse(localStorage.getItem('jadwalinyuk_trash') || '[]'));
const confirmDialog$ = new ReactiveState(null);
const selectedDate$ = new ReactiveState((() => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })());
const weekOffset$ = new ReactiveState(0);

const filteredTasks$ = computed([tasks$, searchQuery$], (tasks, q) => {
  if (!q) return tasks;
  const lq = q.toLowerCase();
  return tasks.filter(t => t.title.toLowerCase().includes(lq) || t.category.toLowerCase().includes(lq));
});
const totalCount$ = computed([tasks$], t => t.length);
const completedCount$ = computed([tasks$], t => t.filter(x => x.completed).length);
const pendingCount$ = computed([tasks$], t => t.filter(x => !x.completed).length);

tasks$.subscribe(v => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)));
trashTasks$.subscribe(v => localStorage.setItem('jadwalinyuk_trash', JSON.stringify(v)));
darkMode$.subscribe(v => { localStorage.setItem('jadwalinyuk_dark', v); document.documentElement.classList.toggle('dark', v); });

function isOverdue(task) {
  if (task.completed || !task.deadline) return false;
  const dl = new Date(task.deadline + (task.time ? 'T' + task.time : 'T23:59'));
  return new Date() > dl;
}

// ============================================================
// CRUD - confirm on DELETE only, NO confirm on toggle
// ============================================================
function addTask(title, priority, category, deadline, time) {
  if (!title.trim()) return;
  tasks$.value = [{ id: Date.now(), title: title.trim(), completed: false, priority: priority||'medium', category: category||'General', deadline: deadline||'', time: time||'', createdAt: Date.now() }, ...tasks$.value];
}

function deleteTask(id) {
  showConfirm('Are you sure you want to delete this task?', () => {
    const task = tasks$.value.find(t => t.id === id);
    if (task) {
      trashTasks$.value = [task, ...trashTasks$.value];
      tasks$.value = tasks$.value.filter(t => t.id !== id);
    }
  });
}

// Direct toggle - no popup
function toggleTask(id) {
  tasks$.value = tasks$.value.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
}

function updateTask(id, updates) {
  tasks$.value = tasks$.value.map(t => t.id === id ? { ...t, ...updates } : t);
}

function restoreTask(id) {
  const task = trashTasks$.value.find(t => t.id === id);
  if (task) { tasks$.value = [task, ...tasks$.value]; trashTasks$.value = trashTasks$.value.filter(t => t.id !== id); }
}

function permanentDelete(id) {
  showConfirm('Are you sure you want to permanently delete this task?', () => {
    trashTasks$.value = trashTasks$.value.filter(t => t.id !== id);
  });
}

function emptyTrash() {
  showConfirm('Are you sure you want to permanently delete all tasks in trash?', () => { trashTasks$.value = []; });
}

// ============================================================
// CONFIRM DIALOG
// ============================================================
function showConfirm(message, onYes) {
  confirmDialog$.value = { message, onYes };
  const el = document.getElementById('confirm-dialog'), bd = document.getElementById('confirm-backdrop');
  el.classList.remove('hidden'); bd.classList.remove('hidden');
  requestAnimationFrame(() => { el.classList.add('modal-visible'); bd.classList.add('backdrop-visible'); });
  document.getElementById('confirm-msg').textContent = message;
}
function confirmYes() { if (confirmDialog$.value?.onYes) confirmDialog$.value.onYes(); closeConfirm(); }
function closeConfirm() {
  const el = document.getElementById('confirm-dialog'), bd = document.getElementById('confirm-backdrop');
  el.classList.remove('modal-visible'); bd.classList.remove('backdrop-visible');
  setTimeout(() => { el.classList.add('hidden'); bd.classList.add('hidden'); }, 300);
  confirmDialog$.value = null;
}

// ============================================================
// RENDER HELPERS
// ============================================================
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function priCfg(p) {
  return { high:{label:'High Priority',bg:'bg-red-100 dark:bg-red-900/30',text:'text-red-700 dark:text-red-400',bar:'bg-red-500'},
    medium:{label:'Medium',bg:'bg-blue-100 dark:bg-blue-900/30',text:'text-blue-700 dark:text-blue-400',bar:'bg-blue-500'},
    low:{label:'Low',bg:'bg-gray-100 dark:bg-gray-700/30',text:'text-gray-600 dark:text-gray-400',bar:'bg-gray-400'} }[p] || {label:'Medium',bg:'bg-blue-100',text:'text-blue-700',bar:'bg-blue-500'};
}
function formatDeadline(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); } catch(e) { return d; } }
function formatTime(t) { if (!t) return ''; try { const [h,m]=t.split(':'); const hr=parseInt(h); return ((hr%12)||12)+':'+m+(hr>=12?' PM':' AM'); } catch(e) { return t; } }

function renderTaskCard(task, isTrash) {
  const p = priCfg(task.priority);
  const overdue = isOverdue(task);
  if (isTrash) {
    return `<div class="task-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl flex items-center gap-4 group relative overflow-hidden opacity-70">
      <div class="flex-grow"><p class="text-sm text-gray-400 line-through">${esc(task.title)}</p>
        <div class="flex items-center gap-2 mt-1"><span class="px-2 py-0.5 rounded-full ${p.bg} ${p.text} text-[10px] font-semibold uppercase">${p.label}</span></div></div>
      <button onclick="restoreTask(${task.id})" class="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-lg transition-all" title="Restore"><span class="material-symbols-outlined">restore</span></button>
      <button onclick="permanentDelete(${task.id})" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-all" title="Delete Forever"><span class="material-symbols-outlined">delete_forever</span></button></div>`;
  }
  const checked = task.completed ? 'checked' : '';
  const line = task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100';
  const cardBg = task.completed ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50' : (overdue ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700');
  const dl = formatDeadline(task.deadline);
  const tm = formatTime(task.time);
  return `<div class="task-card ${cardBg} border p-4 rounded-xl flex items-center gap-4 hover:-translate-y-[1px] hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden">
    ${!task.completed ? `<div class="absolute left-0 top-0 bottom-0 w-1 ${overdue ? 'bg-red-500' : p.bar} rounded-l-xl"></div>` : ''}
    <label class="flex items-center cursor-pointer relative" onclick="event.stopPropagation()">
      <input type="checkbox" class="peer sr-only" ${checked} onchange="toggleTask(${task.id})"/>
      <div class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-colors">
        <span class="material-symbols-outlined text-white text-[16px] opacity-0 peer-checked:opacity-100" style="font-variation-settings:'FILL' 1;">check</span></div></label>
    <div class="flex-grow" onclick="openEditModal(${task.id})">
      <p class="text-sm font-medium ${line}">${esc(task.title)}</p>
      ${!task.completed ? `<div class="flex items-center gap-2 mt-1 flex-wrap">
        <span class="px-2 py-0.5 rounded-full ${p.bg} ${p.text} text-[10px] font-semibold uppercase">${p.label}</span>
        <span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-semibold uppercase">${esc(task.category)}</span>
        ${overdue ? '<span class="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-semibold uppercase animate-pulse">Overdue</span>' : ''}
        ${dl ? `<span class="text-xs ${overdue?'text-red-500':'text-gray-500 dark:text-gray-400'} flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">event</span>${dl}</span>` : ''}
        ${tm ? `<span class="text-xs ${overdue?'text-red-500':'text-gray-500 dark:text-gray-400'} flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span>${tm}</span>` : ''}
      </div>` : ''}</div>
    <button onclick="event.stopPropagation();deleteTask(${task.id})" class="text-gray-300 dark:text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"><span class="material-symbols-outlined">delete</span></button></div>`;
}

// ============================================================
// INIT APP
// ============================================================
function initApp() {
  const taskListEl = document.getElementById('task-list');
  const statTotal = document.getElementById('stat-total');
  const statDone = document.getElementById('stat-done');
  const statPending = document.getElementById('stat-pending');
  const sidebarCount = document.getElementById('sidebar-task-count');
  const headerTitle = document.getElementById('header-title');
  const searchInput = document.getElementById('search-input');
  const darkToggle = document.getElementById('dark-toggle');
  const darkIcon = document.getElementById('dark-icon');
  const statsHeader = document.getElementById('stats-header');
  const addTaskBar = document.getElementById('add-task-bar');

  function renderList() {
    const view = currentView$.value;
    statsHeader.classList.toggle('hidden', view !== 'tasks');
    addTaskBar.classList.toggle('hidden', view !== 'tasks');
    if (view === 'trash') {
      const trash = trashTasks$.value;
      taskListEl.innerHTML = trash.length === 0
        ? `<div class="text-center py-16 text-gray-400"><span class="material-symbols-outlined text-[48px] mb-4 block opacity-30">delete_sweep</span><p>Trash is empty</p></div>`
        : `<div class="flex justify-between items-center mb-4"><h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">Trash (${trash.length})</h3><button onclick="emptyTrash()" class="text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1 rounded-lg transition-colors">Empty Trash</button></div>` + trash.map(t => renderTaskCard(t, true)).join('');
      return;
    }
    if (view === 'statistics') { renderStatistics(); return; }
    if (view === 'schedule') { renderSchedule(); return; }

    // TASKS VIEW: Overdue → Pending → Completed
    const all = filteredTasks$.value;
    const overdueTasks = all.filter(t => isOverdue(t));
    const pendingNormal = all.filter(t => !t.completed && !isOverdue(t));
    const doneTasks = all.filter(t => t.completed);
    let html = '';
    if (overdueTasks.length > 0) {
      html += `<h3 class="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 pl-1 flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">warning</span>Overdue (${overdueTasks.length})</h3>`;
      html += overdueTasks.map(t => renderTaskCard(t)).join('');
    }
    if (pendingNormal.length > 0) {
      html += `<h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${overdueTasks.length?'mt-6':''}  mb-2 pl-1">Pending (${pendingNormal.length})</h3>`;
      html += pendingNormal.map(t => renderTaskCard(t)).join('');
    }
    if (doneTasks.length > 0) {
      html += `<h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6 mb-2 pl-1">Completed (${doneTasks.length})</h3>`;
      html += doneTasks.map(t => renderTaskCard(t)).join('');
    }
    if (!overdueTasks.length && !pendingNormal.length && !doneTasks.length) {
      html = `<div class="text-center py-16 text-gray-400"><span class="material-symbols-outlined text-[48px] mb-4 block opacity-30">task_alt</span><p>No tasks found. Add one above!</p></div>`;
    }
    taskListEl.innerHTML = html;
  }

  filteredTasks$.subscribe(renderList);
  trashTasks$.subscribe(() => { if (currentView$.value === 'trash') renderList(); });

  totalCount$.subscribe(v => { statTotal.textContent = v; });
  completedCount$.subscribe(v => { statDone.textContent = v; });
  pendingCount$.subscribe(v => { statPending.textContent = v; sidebarCount.textContent = v + ' Active Tasks'; });

  const viewTitles = { tasks:'Tasks', trash:'Trash', statistics:'Statistics', schedule:'Schedule' };
  currentView$.subscribe(view => {
    headerTitle.textContent = viewTitles[view] || 'Tasks';
    document.querySelectorAll('[data-view]').forEach(el => {
      const a = el.dataset.view === view;
      el.className = a
        ? 'flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg px-4 py-2 border-l-4 border-blue-600 dark:border-blue-400 cursor-pointer font-medium text-sm'
        : 'flex items-center gap-3 text-gray-500 dark:text-gray-400 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer text-sm';
    });
    renderList();
  });

  searchInput.addEventListener('input', e => { searchQuery$.value = e.target.value; });
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      if (el.dataset.view === 'schedule') {
        const d=new Date(); selectedDate$.value = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
        weekOffset$.value = 0;
      }
      currentView$.value = el.dataset.view;
    });
  });

  darkToggle.addEventListener('click', () => { darkMode$.value = !darkMode$.value; darkIcon.textContent = darkMode$.value ? 'light_mode' : 'dark_mode'; });
  darkIcon.textContent = darkMode$.value ? 'light_mode' : 'dark_mode';

  document.getElementById('add-task-btn').addEventListener('click', () => openAddModal());
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);

  // Profile & Notification dropdowns
  const profileBtn = document.getElementById('profile-btn');
  const profileDD = document.getElementById('profile-dropdown');
  const notifBtn = document.getElementById('notif-btn');
  const notifDD = document.getElementById('notif-dropdown');
  profileBtn.addEventListener('click', e => { e.stopPropagation(); profileDD.classList.toggle('hidden'); notifDD.classList.add('hidden'); });
  notifBtn.addEventListener('click', e => { e.stopPropagation(); notifDD.classList.toggle('hidden'); profileDD.classList.add('hidden'); document.getElementById('notif-dot').classList.add('hidden'); });
  document.addEventListener('click', () => { profileDD.classList.add('hidden'); notifDD.classList.add('hidden'); });

  selectedDate$.subscribe(() => { if (currentView$.value === 'schedule') renderList(); });
  weekOffset$.subscribe(() => { if (currentView$.value === 'schedule') renderList(); });
  setInterval(() => { if (currentView$.value === 'tasks' || currentView$.value === 'schedule') renderList(); }, 60000);
}

// ============================================================
// MODAL
// ============================================================
function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add New Task';
  document.getElementById('modal-task-title').value = '';
  document.getElementById('modal-priority').value = 'medium';
  document.getElementById('modal-category').value = 'General';
  document.getElementById('modal-deadline').value = '';
  document.getElementById('modal-time').value = '';
  document.getElementById('modal-delete-btn').classList.add('hidden');
  document.getElementById('modal-save-btn').textContent = 'Add Task';
  document.getElementById('editing-task-id').value = '';
  showModal();
}
function openEditModal(id) {
  const task = tasks$.value.find(t => t.id === id);
  if (!task) return;
  document.getElementById('modal-title').textContent = 'Edit Task';
  document.getElementById('modal-task-title').value = task.title;
  document.getElementById('modal-priority').value = task.priority;
  document.getElementById('modal-category').value = task.category;
  document.getElementById('modal-deadline').value = task.deadline || '';
  document.getElementById('modal-time').value = task.time || '';
  document.getElementById('modal-delete-btn').classList.remove('hidden');
  document.getElementById('modal-save-btn').textContent = 'Save Changes';
  document.getElementById('editing-task-id').value = id;
  showModal();
}
function showModal() {
  const m = document.getElementById('modal-container'), b = document.getElementById('modal-backdrop');
  m.classList.remove('hidden'); b.classList.remove('hidden');
  requestAnimationFrame(() => { m.classList.add('modal-visible'); b.classList.add('backdrop-visible'); });
  document.getElementById('modal-task-title').focus();
}
function closeModal() {
  const m = document.getElementById('modal-container'), b = document.getElementById('modal-backdrop');
  m.classList.remove('modal-visible'); b.classList.remove('backdrop-visible');
  setTimeout(() => { m.classList.add('hidden'); b.classList.add('hidden'); }, 300);
}
function saveModal() {
  // Validate all fields
  const fields = [
    { id: 'modal-task-title', label: 'Task Title' },
    { id: 'modal-priority', label: 'Priority' },
    { id: 'modal-category', label: 'Category' },
    { id: 'modal-deadline', label: 'Deadline Date' },
    { id: 'modal-time', label: 'Deadline Time' },
  ];
  let valid = true;
  // Clear previous errors
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    el.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
    const err = el.parentElement.querySelector('.field-error');
    if (err) err.remove();
  });
  // Check each field
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el.value || !el.value.trim()) {
      valid = false;
      el.classList.add('border-red-500', 'ring-2', 'ring-red-500');
      const errSpan = document.createElement('span');
      errSpan.className = 'field-error text-red-500 text-[10px] font-medium mt-0.5 block';
      errSpan.textContent = f.label + ' is required';
      el.parentElement.appendChild(errSpan);
      // Remove error on input
      el.addEventListener('input', function handler() {
        el.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
        const e = el.parentElement.querySelector('.field-error');
        if (e) e.remove();
        el.removeEventListener('input', handler);
      }, { once: true });
      el.addEventListener('change', function handler() {
        el.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
        const e = el.parentElement.querySelector('.field-error');
        if (e) e.remove();
        el.removeEventListener('change', handler);
      }, { once: true });
    }
  });
  if (!valid) return;

  const title = document.getElementById('modal-task-title').value.trim();
  const pri = document.getElementById('modal-priority').value;
  const cat = document.getElementById('modal-category').value;
  const dl = document.getElementById('modal-deadline').value;
  const tm = document.getElementById('modal-time').value;
  const eid = document.getElementById('editing-task-id').value;
  if (eid) updateTask(Number(eid), { title, priority: pri, category: cat, deadline: dl, time: tm });
  else addTask(title, pri, cat, dl, tm);
  closeModal();
}
function deleteFromModal() {
  const eid = document.getElementById('editing-task-id').value;
  if (eid) { closeModal(); deleteTask(Number(eid)); }
}

// ============================================================
// SCHEDULE VIEW
// ============================================================
function localDateStr(d) {
  const yyyy = d.getFullYear(), mm = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}
function getWeekDays(offset) {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - now.getDay() + 1 + (offset * 7));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    days.push(d);
  }
  return days;
}

function getDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00');
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((d - now) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === 2) return d.toLocaleDateString('en-US', { weekday: 'long' });
  if (diff === -1) return 'Yesterday';
  if (diff > 2 && diff <= 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  if (diff > 7 && diff <= 14) return 'Next Week';
  if (diff < 0) return 'Past';
  return 'Later';
}
function getDayDiff(dateStr) {
  const d = new Date(dateStr + 'T00:00');
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.round((d - now) / 86400000);
}

function renderSchedule() {
  const days = getWeekDays(weekOffset$.value);
  const todayStr = localDateStr(new Date());
  const sel = selectedDate$.value;
  const isDefaultView = sel === todayStr;
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const now = new Date();

  // Categorize tasks per day: pending vs overdue (incomplete only)
  const pendingByDay = {}, overdueByDay = {};
  tasks$.value.filter(t => !t.completed && t.deadline).forEach(t => {
    const dl = new Date(t.deadline + (t.time ? 'T' + t.time : 'T23:59'));
    if (now > dl) {
      overdueByDay[t.deadline] = (overdueByDay[t.deadline]||0)+1;
    } else {
      pendingByDay[t.deadline] = (pendingByDay[t.deadline]||0)+1;
    }
  });

  // Calendar strip — clickable days, selected state, red/blue dots
  let strip = `<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 flex items-center gap-2">
    <button onclick="weekOffset$.value--" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors flex-shrink-0">
      <span class="material-symbols-outlined">chevron_left</span>
    </button>
    <div class="flex gap-1 flex-1 justify-between">`;
  days.forEach(d => {
    const ds = localDateStr(d);
    const isToday = ds === todayStr;
    const isSelected = ds === sel;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const hasOverdue = overdueByDay[ds] > 0;
    const hasPending = pendingByDay[ds] > 0;
    const bg = isSelected
      ? 'bg-blue-500 text-white shadow-md'
      : (isToday ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700');
    const opacity = isWeekend && !isSelected && !isToday ? 'opacity-50' : '';
    const dotColor = hasOverdue ? 'bg-red-500' : (hasPending ? 'bg-blue-500' : '');
    strip += `<div onclick="selectedDate$.value='${ds}'" class="flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-all w-16 relative ${bg} ${opacity}">
      ${dotColor && !isSelected ? `<div class="absolute top-1.5 right-1.5 w-1.5 h-1.5 ${dotColor} rounded-full"></div>` : ''}
      <span class="text-[10px] font-semibold uppercase mb-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}">${dayNames[d.getDay()]}</span>
      <span class="text-base font-bold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'}">${d.getDate()}</span>
    </div>`;
  });
  strip += `</div>
    <button onclick="weekOffset$.value++" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors flex-shrink-0">
      <span class="material-symbols-outlined">chevron_right</span>
    </button>
  </div>`;

  // Month label
  const monthLabel = days[3].toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  let header = `<div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Schedule</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Your tasks organized by date — ${monthLabel}</p>
    </div>
    <button onclick="selectedDate$.value=localDateStr(new Date());weekOffset$.value=0" class="text-xs font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">Today</button>
  </div>`;

  let content = '';

  // Helper to render one date section
  function renderDateSection(dateStr) {
    const pending = tasks$.value.filter(t => t.deadline === dateStr && !t.completed);
    const completed = tasks$.value.filter(t => t.deadline === dateStr && t.completed);
    if (pending.length === 0 && completed.length === 0) return '';
    const label = getDateLabel(dateStr);
    const dateObj = new Date(dateStr + 'T00:00');
    const fullLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    let s = `<div class="mb-6">
      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3 flex items-center gap-2">
        <span class="${label === 'Today' ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}">${label}</span>
        <span class="text-gray-400 font-normal text-sm">— ${fullLabel}</span>
      </h3>`;
    if (pending.length > 0) {
      s += `<div class="flex flex-col gap-2">${pending.map(t => renderTaskCard(t)).join('')}</div>`;
    }
    if (completed.length > 0) {
      s += `<h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 pl-1">Completed (${completed.length})</h4>`;
      s += `<div class="flex flex-col gap-2">${completed.map(t => renderTaskCard(t)).join('')}</div>`;
    }
    s += `</div>`;
    return s;
  }

  if (isDefaultView) {
    // Default: show Today, Tomorrow, Day After Tomorrow
    const todayDate = new Date(); todayDate.setHours(0,0,0,0);
    const dates = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() + i);
      dates.push(localDateStr(d));
    }
    dates.forEach(ds => { content += renderDateSection(ds); });
    if (!content) {
      content = `<div class="text-center py-12 text-gray-400"><span class="material-symbols-outlined text-[48px] mb-3 block opacity-30">event_available</span><p class="text-sm">No tasks scheduled for the next 3 days</p></div>`;
    }
  } else {
    // Specific date: show only that date
    content = renderDateSection(sel);
    if (!content) {
      const selDate = new Date(sel + 'T00:00');
      const selLabel = selDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      content = `<div class="mb-4"><h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">${selLabel}</h3></div>
        <div class="text-center py-12 text-gray-400"><span class="material-symbols-outlined text-[48px] mb-3 block opacity-30">event_available</span><p class="text-sm">No tasks scheduled for this date</p></div>`;
    }
  }

  document.getElementById('task-list').innerHTML = header + strip + content;
}

// ============================================================
// STATISTICS
// ============================================================
function renderStatistics() {
  const all = tasks$.value, done = all.filter(t => t.completed).length, pct = all.length ? Math.round(done/all.length*100) : 0;
  const od = all.filter(t => isOverdue(t)).length;
  const cats = {}; all.forEach(t => { cats[t.category]=(cats[t.category]||0)+1; });
  const pri = {high:0,medium:0,low:0}; all.forEach(t => { if (!t.completed) pri[t.priority]++; });
  const pending = all.length - done;
  document.getElementById('task-list').innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-xl">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Completion Rate</h3>
        <div class="flex items-center gap-6">
          <div class="relative w-28 h-28">
            <svg viewBox="0 0 36 36" class="w-28 h-28 transform -rotate-90">
              <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#e5e7eb" stroke-width="3" class="dark:stroke-gray-700"/>
              <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#3b82f6" stroke-width="3" stroke-dasharray="${pct},100" stroke-linecap="round"/>
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-2xl font-bold text-blue-500">${pct}%</span>
          </div>
          <div><p class="text-sm text-gray-500 dark:text-gray-400">${done} of ${all.length} completed</p>
            ${od>0?`<p class="text-xs text-red-500 mt-1">${od} overdue task(s)</p>`:''}</div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-xl">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">By Priority</h3>
        <div class="space-y-4">
          <div><div class="flex justify-between text-xs font-medium mb-1"><span class="text-red-500">High</span><span class="text-gray-500">${pri.high}</span></div><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-red-500 h-2 rounded-full" style="width:${pending?(pri.high/pending*100):0}%"></div></div></div>
          <div><div class="flex justify-between text-xs font-medium mb-1"><span class="text-blue-500">Medium</span><span class="text-gray-500">${pri.medium}</span></div><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-blue-500 h-2 rounded-full" style="width:${pending?(pri.medium/pending*100):0}%"></div></div></div>
          <div><div class="flex justify-between text-xs font-medium mb-1"><span class="text-gray-500">Low</span><span class="text-gray-500">${pri.low}</span></div><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-gray-400 h-2 rounded-full" style="width:${pending?(pri.low/pending*100):0}%"></div></div></div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-xl md:col-span-2">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">By Category</h3>
        <div class="flex flex-wrap gap-4">${Object.entries(cats).map(([c,n])=>`<div class="flex-1 min-w-[120px] bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center"><p class="text-3xl font-bold text-blue-500">${n}</p><p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">${esc(c)}</p></div>`).join('')}</div>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', initApp);
