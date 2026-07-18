'use strict';


    const storageKey = 'taskflow.tasks.v1';


    const listConfig = {
      personal: { label: 'Personal', dotClass: 'dot-personal' },
      work:     { label: 'Work',     dotClass: 'dot-work' },
      shopping: { label: 'Shopping', dotClass: 'dot-shopping' },
    };


    const viewConfig = {
      myday:     { title: 'My Day',     emptyTitle: 'All clear!',            emptyText: 'Nothing planned for today. Add a task above.' },
      all:       { title: 'All Tasks',  emptyTitle: 'No active tasks',       emptyText: 'You\'re all caught up. Add a task above.' },
      important: { title: 'Important',  emptyTitle: 'Nothing starred',       emptyText: 'Star a task and it will show up here.' },
      completed: { title: 'Completed',  emptyTitle: 'Nothing done yet',      emptyText: 'Completed tasks will appear here.' },
      personal:  { title: 'Personal',   emptyTitle: 'No personal tasks',     emptyText: 'Add a task to your Personal list.' },
      work:      { title: 'Work',       emptyTitle: 'No work tasks',         emptyText: 'Add a task to your Work list.' },
      shopping:  { title: 'Shopping',   emptyTitle: 'Shopping list is empty', emptyText: 'Add items you need to buy.' },
    };


    const icons = {
    check: '<i class="fas fa-check"></i>',
    star: '<i class="far fa-star"></i>',
    trash: '<i class="fas fa-trash"></i>'
};


    let taskList = loadTasks();
    let currentView = 'myday';


    function loadTasks() {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {

      }


      return [
        { id: uid(), title: 'Welcome to TaskFlow — click the circle to complete me', completed: false, important: true,  priority: 'high',   list: 'personal', createdAt: Date.now() },
        { id: uid(), title: 'Star a task to pin it under Important',                 completed: false, important: false,  priority: 'medium', list: 'work',     createdAt: Date.now() },
        { id: uid(), title: 'Buy coffee beans and oat milk',                         completed: true,  important: false,  priority: 'low',    list: 'shopping', createdAt: Date.now() },
      ];
    }


    function saveTasks() {
      localStorage.setItem(storageKey, JSON.stringify(taskList));
    }


    function uid() {
      return 't-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }


    function isToday(ts) {
      const d = new Date(ts);
      const now = new Date();
      return d.getFullYear() === now.getFullYear()
          && d.getMonth() === now.getMonth()
          && d.getDate() === now.getDate();
    }



    function addTask(title, list, priority) {
      const trimmed = title.trim();
      if (!trimmed) return;
      taskList.unshift({
        id: uid(),
        title: trimmed,
        completed: false,
        important: false,
        priority,
        list,
        createdAt: Date.now(),
      });
      saveTasks();
      render();
    }
function toggleComplete(id) {
  const task = taskList.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
  if (task.completed) checkCelebration(); // <-- only here
}

    function toggleImportant(id) {
      const task = taskList.find(t => t.id === id);
      if (!task) return;
      task.important = !task.important;
      saveTasks();
      render();
    }

    function deleteTask(id) {
      taskList = taskList.filter(t => t.id !== id);
      saveTasks();
      render();
    }

    function clearCompleted() {
      taskList = taskList.filter(t => !t.completed);
      saveTasks();
      render();
    }

    // filtering 

    function tasksForView(view) {
      let filtered;
      switch (view) {
        case 'myday':     filtered = taskList.filter(t => !t.completed && isToday(t.createdAt)); break;
        case 'all':       filtered = taskList.filter(t => !t.completed); break;
        case 'important': filtered = taskList.filter(t => !t.completed && t.important); break;
        case 'completed': filtered = taskList.filter(t => t.completed); break;
        default:          filtered = taskList.filter(t => !t.completed && t.list === view);
      }
      
      return filtered.sort((a, b) => {
        if (a.important !== b.important) return a.important ? -1 : 1;
        return b.createdAt - a.createdAt;
      });
    }

    function getCounts() {
      const active = taskList.filter(t => !t.completed);
      return {
        myday:     active.filter(t => isToday(t.createdAt)).length,
        all:       active.length,
        important: active.filter(t => t.important).length,
        completed: taskList.filter(t => t.completed).length,
        personal:  active.filter(t => t.list === 'personal').length,
        work:      active.filter(t => t.list === 'work').length,
        shopping:  active.filter(t => t.list === 'shopping').length,
      };
    }

    

    const sidebar       = document.getElementById('sidebar');
    const overlay       = document.getElementById('overlay');
    const menuToggle    = document.getElementById('menuToggle');
    const navItems      = document.querySelectorAll('.nav-item');
    const titleOfPage   = document.getElementById('titleOfPage');
    const todayDate     = document.getElementById('todayDate');
    const taskForm      = document.getElementById('taskForm');
    const taskInput     = document.getElementById('taskInput');
    const listSelect    = document.getElementById('listSelect');
    const prioritySelect = document.getElementById('prioritySelect');
    const taskListEl    = document.getElementById('taskList');
    const emptyState    = document.getElementById('emptyState');
    const emptyTitle    = document.getElementById('emptyTitle');
    const emptyText     = document.getElementById('emptyText');
    const remainingText = document.getElementById('remainingText');
    const clearBtn      = document.getElementById('clearCompleted');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill  = document.getElementById('progressFill');
    const progressNote  = document.getElementById('progressNote');

    function render() {
      renderHeader();
      renderTasks();
      renderCounts();
      renderProgress();
      renderFooter();
    
    }




    function renderHeader() {
      const view = viewConfig[currentView];
      titleOfPage.textContent = view.title;
      todayDate.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      });
    }

    function renderTasks() {
      const visible = tasksForView(currentView);
      taskListEl.innerHTML = '';

      visible.forEach(task => taskListEl.appendChild(buildTaskEl(task)));

      const view = viewConfig[currentView];
      emptyState.hidden = visible.length > 0;
      emptyTitle.textContent = view.emptyTitle;
      emptyText.textContent = view.emptyText;
    }

    function buildTaskEl(task) {
      const el = document.createElement('div');
      el.className = 'task' + (task.completed ? ' completed' : '');
      el.dataset.id = task.id;

      const list = listConfig[task.list];

      el.innerHTML = `
        <button class="task-check" data-action="complete"
                aria-label="${task.completed ? 'Mark as not done' : 'Mark as done'}">${icons.check}</button>
        <div class="task-body">
          <p class="task-title"></p>
          <div class="task-meta">
            <span class="task-list-label"><span class="dot ${list.dotClass}"></span>${list.label}</span>
            <span class="pill pill-${task.priority}">${capitalize(task.priority)}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-action star${task.important ? ' starred' : ''}" data-action="star" aria-label="Toggle important">${icons.star}</button>
          <button class="icon-action delete" data-action="delete" aria-label="Delete task">${icons.trash}</button>
        </div>
      `;

  
      el.querySelector('.task-title').textContent = task.title;

      el.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'complete') toggleComplete(task.id);
        else if (action === 'star') toggleImportant(task.id);
        else if (action === 'delete') deleteTask(task.id);
      });

      return el;
    }

    function renderCounts() {
      const counts = getCounts();
      document.querySelectorAll('[data-count]').forEach(badge => {
        const n = counts[badge.dataset.count] || 0;
        badge.textContent = n > 0 ? n : '';
      });
    }

    function renderProgress() {
      const total = taskList.length;
      const done = taskList.filter(t => t.completed).length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);
      progressPercent.textContent = pct + '%';
      progressFill.style.width = pct + '%';
      progressNote.textContent = `${done} of ${total} tasks done`;
    }

    function renderFooter() {
      const remaining = taskList.filter(t => !t.completed).length;
      remainingText.textContent = `${remaining} task${remaining === 1 ? '' : 's'} remaining`;
    }

    function capitalize(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addTask(taskInput.value, listSelect.value, prioritySelect.value);
      taskInput.value = '';
      taskInput.focus();
    });

    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        currentView = item.dataset.view;
        navItems.forEach(i => i.classList.toggle('active', i === item));
        closeSidebar();
        render();
      });
    });

    
    clearBtn.addEventListener('click', clearCompleted);

    
    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
    menuToggle.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSidebar();
    });

    render();


    