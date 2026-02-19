// State Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editingTaskId = null;

// DOM Elements
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const taskForm = document.getElementById('taskForm');
const tasksList = document.getElementById('tasksList');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const overdueNotifications = document.getElementById('overdueNotifications');

// Chart instances
let completionChart = null;
let statusChart = null;

// Initialize
function init() {
  renderTasks();
  updateDashboard();
  initCharts();
  checkOverdueTasks();
  
  // Event Listeners
  addTaskBtn.addEventListener('click', openAddModal);
  closeModal.addEventListener('click', closeTaskModal);
  cancelBtn.addEventListener('click', closeTaskModal);
  taskForm.addEventListener('submit', handleTaskSubmit);
  searchInput.addEventListener('input', renderTasks);
  statusFilter.addEventListener('change', renderTasks);
  priorityFilter.addEventListener('change', renderTasks);
  clearFiltersBtn.addEventListener('click', clearFilters);
  
  // Close modal on outside click
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
  });
}

// Modal Functions
function openAddModal() {
  editingTaskId = null;
  document.getElementById('modalTitle').textContent = 'Add New Task';
  taskForm.reset();
  taskModal.classList.add('active');
}

function openEditModal(taskId) {
  editingTaskId = taskId;
  const task = tasks.find(t => t.id === taskId);
  
  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDescription').value = task.description;
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('taskStatus').value = task.status;
  document.getElementById('taskDueDate').value = task.dueDate;
  
  taskModal.classList.add('active');
}

function closeTaskModal() {
  taskModal.classList.remove('active');
  taskForm.reset();
  editingTaskId = null;
}

// Task CRUD Operations
function handleTaskSubmit(e) {
  e.preventDefault();
  
  const taskData = {
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDescription').value,
    priority: document.getElementById('taskPriority').value,
    status: document.getElementById('taskStatus').value,
    dueDate: document.getElementById('taskDueDate').value,
  };
  
  if (editingTaskId) {
    updateTask(editingTaskId, taskData);
  } else {
    addTask(taskData);
  }
  
  closeTaskModal();
}

function addTask(taskData) {
  const task = {
    id: Date.now(),
    ...taskData,
    createdAt: new Date().toISOString()
  };
  
  tasks.push(task);
  saveTasks();
  renderTasks();
  updateDashboard();
  updateCharts();
}

function updateTask(taskId, taskData) {
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...taskData };
    saveTasks();
    renderTasks();
    updateDashboard();
    updateCharts();
  }
}

function deleteTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    updateDashboard();
    updateCharts();
  }
}

function toggleTaskComplete(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = task.status === 'completed' ? 'todo' : 'completed';
    saveTasks();
    renderTasks();
    updateDashboard();
    updateCharts();
  }
}

// Render Tasks
function renderTasks() {
  const searchTerm = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value;
  const priorityValue = priorityFilter.value;
  
  let filtered = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                         task.description.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusValue || task.status === statusValue;
    const matchesPriority = !priorityValue || task.priority === priorityValue;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });
  
  // Sort by due date
  filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
  if (filtered.length === 0) {
    tasksList.innerHTML = `
      <div class="empty-state">
        <h3>No tasks found</h3>
        <p>Add a new task to get started!</p>
      </div>
    `;
    return;
  }
  
  tasksList.innerHTML = filtered.map(task => {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    return `
      <div class="task-item ${task.status === 'completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
        <div class="task-header">
          <div class="task-title">${task.title}</div>
          <div class="task-actions">
            <button class="task-btn btn-complete" onclick="toggleTaskComplete(${task.id})">
              ${task.status === 'completed' ? '↩️' : '✓'}
            </button>
            <button class="task-btn btn-edit" onclick="openEditModal(${task.id})">Edit</button>
            <button class="task-btn btn-delete" onclick="deleteTask(${task.id})">Delete</button>
          </div>
        </div>
        <div class="task-description">${task.description || 'No description'}</div>
        <div class="task-meta">
          <span class="task-badge priority-${task.priority}">
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
          </span>
          <span class="task-badge status-${task.status}">
            ${task.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </span>
          <span class="task-due">📅 Due: ${dueDate}</span>
          ${isOverdue ? '<span class="task-badge priority-high">⚠️ Overdue</span>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Dashboard Updates
function updateDashboard() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = total - completed;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  document.getElementById('totalTasks').textContent = total;
  document.getElementById('completedTasks').textContent = completed;
  document.getElementById('pendingTasks').textContent = pending;
  document.getElementById('progressPercent').textContent = progress + '%';
}

// Charts
function initCharts() {
  // Completion Trend Chart
  const completionCtx = document.getElementById('completionChart').getContext('2d');
  completionChart = new Chart(completionCtx, {
    type: 'line',
    data: {
      labels: getLast7Days(),
      datasets: [{
        label: 'Tasks Completed',
        data: getCompletionData(),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
  
  // Status Distribution Chart
  const statusCtx = document.getElementById('statusChart').getContext('2d');
  statusChart = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: ['To Do', 'In Progress', 'Completed'],
      datasets: [{
        data: getStatusData(),
        backgroundColor: ['#3498db', '#f39c12', '#27ae60']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function updateCharts() {
  if (completionChart) {
    completionChart.data.datasets[0].data = getCompletionData();
    completionChart.update();
  }
  
  if (statusChart) {
    statusChart.data.datasets[0].data = getStatusData();
    statusChart.update();
  }
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return days;
}

function getCompletionData() {
  const data = [0, 0, 0, 0, 0, 0, 0];
  const today = new Date();
  
  tasks.forEach(task => {
    if (task.status === 'completed') {
      const createdDate = new Date(task.createdAt);
      const diffDays = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays < 7) {
        data[6 - diffDays]++;
      }
    }
  });
  
  return data;
}

function getStatusData() {
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  
  return [todo, inProgress, completed];
}

// Overdue Tasks Notification
function checkOverdueTasks() {
  const overdue = tasks.filter(task => {
    return new Date(task.dueDate) < new Date() && task.status !== 'completed';
  });
  
  if (overdue.length > 0) {
    overdueNotifications.innerHTML = `
      <div class="notification">
        <span>⚠️ You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}!</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
      </div>
    `;
  }
}

// Filters
function clearFilters() {
  searchInput.value = '';
  statusFilter.value = '';
  priorityFilter.value = '';
  renderTasks();
}

// Storage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Initialize App
init();
