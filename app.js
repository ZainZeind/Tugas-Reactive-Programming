// ============================================================
// REACTIVE PROGRAMMING ENGINE - JadwalinYuk!
// ============================================================
class ReactiveState {
  constructor(initialValue) {
    this._value = initialValue;
    this._subscribers = [];
  }
  get value() { return this._value; }
  set value(newVal) {
    this._value = newVal;
    this._subscribers.forEach(fn => fn(this._value));
  }
  subscribe(fn) {
    this._subscribers.push(fn);
    fn(this._value);
    return () => { this._subscribers = this._subscribers.filter(s => s !== fn); };
  }
}

function computed(deps, computeFn) {
  const result = new ReactiveState(computeFn(...deps.map(d => d.value)));
  deps.forEach(dep => dep.subscribe(() => { result.value = computeFn(...deps.map(d => d.value)); }));
  return result;
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
const profileOpen$ = new ReactiveState(false);
const notifPanelOpen$ = new ReactiveState(false);

const filteredTasks$ = computed([tasks$, searchQuery$], (tasks, query) => {
  if (!query) return tasks;
  const q = query.toLowerCase();
  return tasks.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
});
const pendingTasks$ = computed([filteredTasks$], t => t.filter(x => !x.completed));
const completedTasks$ = computed([filteredTasks$], t => t.filter(x => x.completed));
const totalCount$ = computed([tasks$], t => t.length);
const completedCount$ = computed([tasks$], t => t.filter(x => x.completed).length);
const pendingCount$ = computed([tasks$], t => t.filter(x => !x.completed).length);

tasks$.subscribe(v => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)));
trashTasks$.subscribe(v => localStorage.setItem('jadwalinyuk_trash', JSON.stringify(v)));
darkMode$.subscribe(v => { localStorage.setItem('jadwalinyuk_dark', v); document.documentElement.classList.toggle('dark', v); });

// ============================================================
// OVERDUE CHECK
// ============================================================
function isOverdue(task) {
  if (task.completed || !task.deadline) return false;
  const now = new Date();
  const deadlineStr = task.deadline + (task.time ? 'T' + task.time : 'T23:59');
  const dl = new Date(deadlineStr);
  return now > dl;
}

// ============================================================
// CRUD
// ============================================================
function addTask(title, priority, category, deadline, time) {
  if (!title.trim()) return;
  tasks$.value = [{ id: Date.now(), title: title.trim(), completed: false, priority: priority||'medium', category: category||'General', deadline: deadline||'', time: time||'', createdAt: Date.now() }, ...tasks$.value];
}

function deleteTask(id) {
  const task = tasks$.value.find(t => t.id === id);
  if (task) {
    trashTasks$.value = [task, ...trashTasks$.value];
    tasks$.value = tasks$.value.filter(t => t.id !== id);
  }
}

function toggleTask(id) {
  const task = tasks$.value.find(t => t.id === id);
  if (!task) return;
  const msg = task.completed ? 'Are you sure you want to mark this task as incomplete?' : 'Are you sure this task is completed?';
  showConfirm(msg, () => {
    tasks$.value = tasks$.value.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  });
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
  showConfirm('Are you sure you want to permanently delete all tasks in trash?', () => {
    trashTasks$.value = [];
  });
}

// ============================================================
// CONFIRM DIALOG
// ============================================================
function showConfirm(message, onYes) {
  confirmDialog$.value = { message, onYes };
  const el = document.getElementById('confirm-dialog');
  const bd = document.getElementById('confirm-backdrop');
  el.classList.remove('hidden'); bd.classList.remove('hidden');
  requestAnimationFrame(() => { el.classList.add('modal-visible'); bd.classList.add('backdrop-visible'); });
  document.getElementById('confirm-msg').textContent = message;
}
function confirmYes() {
  if (confirmDialog$.value && confirmDialog$.value.onYes) confirmDialog$.value.onYes();
  closeConfirm();
}
function closeConfirm() {
  const el = document.getElementById('confirm-dialog');
  const bd = document.getElementById('confirm-backdrop');
  el.classList.remove('modal-visible'); bd.classList.remove('backdrop-visible');
  setTimeout(() => { el.classList.add('hidden'); bd.classList.add('hidden'); }, 300);
  confirmDialog$.value = null;
}

// ============================================================
// RENDERING HELPERS
// ============================================================
function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

function priCfg(p) {
  return { high: { label:'High Priority', bg:'bg-error-container', text:'text-on-error-container', bar:'bg-error' },
    medium: { label:'Medium', bg:'bg-primary-fixed', text:'text-on-primary-fixed', bar:'bg-primary' },
    low: { label:'Low', bg:'bg-secondary-fixed', text:'text-on-secondary-fixed', bar:'bg-secondary' } }[p] || { label:'Medium', bg:'bg-primary-fixed', text:'text-on-primary-fixed', bar:'bg-primary' };
}

function formatDeadline(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); } catch(e) { return d; }
}

function formatTime(t) {
  if (!t) return '';
  try {
    const [h, m] = t.split(':');
    const hr = parseInt(h); const ampm = hr >= 12 ? 'PM' : 'AM';
    return ((hr % 12) || 12) + ':' + m + ' ' + ampm;
  } catch(e) { return t; }
}

function renderTaskCard(task, isTrash) {
  const p = priCfg(task.priority);
  const overdue = isOverdue(task);
  if (isTrash) {
    return `<div class="task-card bg-surface border border-[#E5E5E7] p-md lg:p-lg rounded-xl flex items-center gap-md group relative overflow-hidden opacity-70" data-id="${task.id}">
      <div class="flex-grow"><p class="font-body-md text-body-md text-secondary line-through">${esc(task.title)}</p>
        <div class="flex items-center gap-sm mt-xs"><span class="px-2 py-0.5 rounded-full ${p.bg} ${p.text} font-label-sm text-[10px] uppercase">${p.label}</span></div></div>
      <button onclick="restoreTask(${task.id})" class="text-primary hover:bg-primary-fixed/50 p-sm rounded-lg transition-all" title="Restore"><span class="material-symbols-outlined">restore</span></button>
      <button onclick="permanentDelete(${task.id})" class="text-error hover:bg-error-container/50 p-sm rounded-lg transition-all" title="Delete Forever"><span class="material-symbols-outlined">delete_forever</span></button></div>`;
  }
  const checked = task.completed ? 'checked' : '';
  const line = task.completed ? 'line-through text-secondary opacity-70' : 'text-on-surface';
  const cardBg = task.completed ? 'bg-surface-container-low border-transparent' : (overdue ? 'bg-error-container/20 border-error/30' : 'bg-surface border-[#E5E5E7]');
  const chkBg = task.completed ? 'peer-checked:bg-secondary peer-checked:border-secondary' : 'peer-checked:bg-primary peer-checked:border-primary';
  const dl = formatDeadline(task.deadline);
  const tm = formatTime(task.time);
  return `<div class="task-card ${cardBg} border p-md lg:p-lg rounded-xl flex items-center gap-md hover:-translate-y-[1px] hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] transition-all duration-300 group cursor-pointer relative overflow-hidden" data-id="${task.id}">
    ${!task.completed ? `<div class="absolute left-0 top-0 bottom-0 w-1 ${overdue ? 'bg-error' : p.bar} rounded-l-xl"></div>` : ''}
    <label class="flex items-center cursor-pointer relative" onclick="event.stopPropagation()">
      <input type="checkbox" class="peer sr-only" ${checked} onchange="event.preventDefault();toggleTask(${task.id})"/>
      <div class="w-6 h-6 rounded-full border-2 border-outline-variant ${chkBg} flex items-center justify-center transition-colors">
        <span class="material-symbols-outlined text-white text-[16px] opacity-0 peer-checked:opacity-100" style="font-variation-settings:'FILL' 1;">check</span></div></label>
    <div class="flex-grow" onclick="openEditModal(${task.id})">
      <p class="font-body-md text-body-md ${line}">${esc(task.title)}</p>
      ${!task.completed ? `<div class="flex items-center gap-sm mt-xs flex-wrap">
        <span class="px-2 py-0.5 rounded-full ${p.bg} ${p.text} font-label-sm text-[10px] uppercase">${p.label}</span>
        <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] uppercase">${esc(task.category)}</span>
        ${overdue ? '<span class="px-2 py-0.5 rounded-full bg-error text-on-error font-label-sm text-[10px] uppercase animate-pulse">Overdue</span>' : ''}
        ${dl ? `<span class="font-label-sm text-label-sm ${overdue ? 'text-error' : 'text-on-surface-variant'} flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">event</span>${dl}</span>` : ''}
        ${tm ? `<span class="font-label-sm text-label-sm ${overdue ? 'text-error' : 'text-on-surface-variant'} flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span>${tm}</span>` : ''}
      </div>` : ''}</div>
    <button onclick="event.stopPropagation();deleteTask(${task.id})" class="text-outline-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all p-sm rounded-lg hover:bg-error-container/50"><span class="material-symbols-outlined">delete</span></button></div>`;
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
        ? `<div class="text-center py-xl text-on-surface-variant"><span class="material-symbols-outlined text-[48px] mb-md block opacity-30">delete_sweep</span><p class="font-body-md text-body-md">Trash is empty</p></div>`
        : `<div class="flex justify-between items-center mb-md"><h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider pl-xs">Trash (${trash.length})</h3><button onclick="emptyTrash()" class="text-error font-label-md text-label-sm hover:bg-error-container/50 px-md py-xs rounded-lg transition-colors">Empty Trash</button></div>` + trash.map(t => renderTaskCard(t, true)).join('');
      return;
    }
    if (view === 'statistics') { renderStatistics(); return; }

    const pending = pendingTasks$.value;
    const done = completedTasks$.value;
    let html = '';
    if (pending.length > 0) {
      html += `<h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm pl-xs">Pending (${pending.length})</h3>`;
      html += pending.map(t => renderTaskCard(t)).join('');
    }
    if (done.length > 0) {
      html += `<h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mt-lg mb-sm pl-xs">Completed (${done.length})</h3>`;
      html += done.map(t => renderTaskCard(t)).join('');
    }
    if (!pending.length && !done.length) {
      html = `<div class="text-center py-xl text-on-surface-variant"><span class="material-symbols-outlined text-[48px] mb-md block opacity-30">task_alt</span><p class="font-body-md text-body-md">No tasks found. Add one above!</p></div>`;
    }
    taskListEl.innerHTML = html;
  }

  filteredTasks$.subscribe(renderList);
  pendingTasks$.subscribe(renderList);
  completedTasks$.subscribe(renderList);
  trashTasks$.subscribe(() => { if (currentView$.value === 'trash') renderList(); });

  totalCount$.subscribe(v => { statTotal.textContent = v; });
  completedCount$.subscribe(v => { statDone.textContent = v; });
  pendingCount$.subscribe(v => { statPending.textContent = v; sidebarCount.textContent = v + ' Active Tasks'; });

  const viewTitles = { tasks:'Tasks', trash:'Trash', statistics:'Statistics' };
  currentView$.subscribe(view => {
    headerTitle.textContent = viewTitles[view] || 'Tasks';
    document.querySelectorAll('[data-view]').forEach(el => {
      const active = el.dataset.view === view;
      el.classList.toggle('bg-secondary-fixed-dim/30', active);
      el.classList.toggle('text-primary', active);
      el.classList.toggle('border-l-4', active);
      el.classList.toggle('border-primary', active);
      el.classList.toggle('text-on-surface-variant', !active);
    });
    renderList();
  });

  searchInput.addEventListener('input', e => { searchQuery$.value = e.target.value; });
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); currentView$.value = el.dataset.view; });
  });

  // Dark mode
  darkToggle.addEventListener('click', () => { darkMode$.value = !darkMode$.value; darkIcon.textContent = darkMode$.value ? 'light_mode' : 'dark_mode'; });
  darkIcon.textContent = darkMode$.value ? 'light_mode' : 'dark_mode';

  // Add task button
  document.getElementById('add-task-btn').addEventListener('click', () => openAddModal());
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);

  // Profile dropdown
  const profileBtn = document.getElementById('profile-btn');
  const profileDropdown = document.getElementById('profile-dropdown');
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
    document.getElementById('notif-dropdown').classList.add('hidden');
  });

  // Notification dropdown
  const notifBtn = document.getElementById('notif-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('hidden');
    profileDropdown.classList.add('hidden');
    // Remove red dot
    document.getElementById('notif-dot').classList.add('hidden');
  });

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    profileDropdown.classList.add('hidden');
    notifDropdown.classList.add('hidden');
  });

  // Overdue check interval
  setInterval(() => { if (currentView$.value === 'tasks') renderList(); }, 60000);
}

// ============================================================
// MODAL (Add / Edit) with date + time
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
  const m = document.getElementById('modal-container');
  const b = document.getElementById('modal-backdrop');
  m.classList.remove('hidden'); b.classList.remove('hidden');
  requestAnimationFrame(() => { m.classList.add('modal-visible'); b.classList.add('backdrop-visible'); });
  document.getElementById('modal-task-title').focus();
}

function closeModal() {
  const m = document.getElementById('modal-container');
  const b = document.getElementById('modal-backdrop');
  m.classList.remove('modal-visible'); b.classList.remove('backdrop-visible');
  setTimeout(() => { m.classList.add('hidden'); b.classList.add('hidden'); }, 300);
}

function saveModal() {
  const title = document.getElementById('modal-task-title').value.trim();
  if (!title) return;
  const priority = document.getElementById('modal-priority').value;
  const category = document.getElementById('modal-category').value;
  const deadline = document.getElementById('modal-deadline').value;
  const time = document.getElementById('modal-time').value;
  const editId = document.getElementById('editing-task-id').value;
  if (editId) { updateTask(Number(editId), { title, priority, category, deadline, time }); }
  else { addTask(title, priority, category, deadline, time); }
  closeModal();
}

function deleteFromModal() {
  const editId = document.getElementById('editing-task-id').value;
  if (editId) { deleteTask(Number(editId)); closeModal(); }
}

// ============================================================
// STATISTICS VIEW
// ============================================================
function renderStatistics() {
  const all = tasks$.value;
  const done = all.filter(t => t.completed).length;
  const pending = all.length - done;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  const overdueCount = all.filter(t => isOverdue(t)).length;
  const cats = {}; all.forEach(t => { cats[t.category] = (cats[t.category]||0)+1; });
  const pri = { high:0, medium:0, low:0 }; all.forEach(t => { if (!t.completed) pri[t.priority]++; });

  document.getElementById('task-list').innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
      <div class="bg-surface border border-[#E5E5E7] p-lg rounded-xl">
        <h3 class="font-headline-md text-headline-md text-on-surface mb-md">Completion Rate</h3>
        <div class="flex items-center gap-lg">
          <div class="relative w-28 h-28">
            <svg viewBox="0 0 36 36" class="w-28 h-28 transform -rotate-90">
              <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#e5e7eb" stroke-width="3"/>
              <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#0058bc" stroke-width="3" stroke-dasharray="${pct},100" stroke-linecap="round"/>
            </svg>
            <span class="absolute inset-0 flex items-center justify-center font-headline-md text-headline-md text-primary">${pct}%</span>
          </div>
          <div>
            <p class="font-body-md text-body-md text-on-surface-variant">${done} of ${all.length} tasks completed</p>
            ${overdueCount > 0 ? `<p class="font-label-md text-label-md text-error mt-xs">${overdueCount} overdue task(s)</p>` : ''}
          </div>
        </div>
      </div>
      <div class="bg-surface border border-[#E5E5E7] p-lg rounded-xl">
        <h3 class="font-headline-md text-headline-md text-on-surface mb-md">By Priority</h3>
        <div class="space-y-md">
          <div><div class="flex justify-between font-label-md text-label-md mb-xs"><span class="text-error">High</span><span>${pri.high}</span></div><div class="w-full bg-surface-container-high rounded-full h-2"><div class="bg-error h-2 rounded-full" style="width:${pending?(pri.high/pending*100):0}%"></div></div></div>
          <div><div class="flex justify-between font-label-md text-label-md mb-xs"><span class="text-primary">Medium</span><span>${pri.medium}</span></div><div class="w-full bg-surface-container-high rounded-full h-2"><div class="bg-primary h-2 rounded-full" style="width:${pending?(pri.medium/pending*100):0}%"></div></div></div>
          <div><div class="flex justify-between font-label-md text-label-md mb-xs"><span class="text-secondary">Low</span><span>${pri.low}</span></div><div class="w-full bg-surface-container-high rounded-full h-2"><div class="bg-secondary h-2 rounded-full" style="width:${pending?(pri.low/pending*100):0}%"></div></div></div>
        </div>
      </div>
      <div class="bg-surface border border-[#E5E5E7] p-lg rounded-xl md:col-span-2">
        <h3 class="font-headline-md text-headline-md text-on-surface mb-md">By Category</h3>
        <div class="flex flex-wrap gap-md">${Object.entries(cats).map(([c,n]) => `<div class="flex-1 min-w-[120px] bg-surface-container-low p-md rounded-xl text-center"><p class="font-display-lg text-display-lg text-primary">${n}</p><p class="font-label-md text-label-md text-on-surface-variant mt-xs">${esc(c)}</p></div>`).join('')}</div>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', initApp);
