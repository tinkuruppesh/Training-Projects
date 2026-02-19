// Timer Configuration
let TIMER_MODES = JSON.parse(localStorage.getItem('timerSettings')) || {
  work: 25,
  short: 5,
  long: 15
};

// State
let currentMode = 'work';
let timeLeft = TIMER_MODES.work * 60;
let timerInterval = null;
let isRunning = false;
let sessionCount = parseInt(localStorage.getItem('sessionCount')) || 0;
let tasks = JSON.parse(localStorage.getItem('pomodoroTasks')) || [];

// Load stats with proper defaults
let savedStats = localStorage.getItem('pomodoroStats');
let stats = savedStats ? JSON.parse(savedStats) : null;
if (!stats || typeof stats.completedSessions === 'undefined') {
  stats = {
    completedSessions: 0,
    totalFocusTime: 0,
    completedTasks: 0
  };
  localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

// DOM Elements
const timeDisplay = document.getElementById('timeDisplay');
const currentModeEl = document.getElementById('currentMode');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const modeBtns = document.querySelectorAll('.mode-btn:not(.settings-btn)');
const sessionCountEl = document.getElementById('sessionCount');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const saveSettingsBtn = document.getElementById('saveSettings');
const closeSettingsBtn = document.getElementById('closeSettings');
const resetStatsBtn = document.getElementById('resetStats');

// Initialize
function init() {
  console.log('Initializing with stats:', stats);
  console.log('Session count:', sessionCount);
  sessionCountEl.textContent = sessionCount;
  updateDisplay();
  updateModeLabel();
  renderTasks();
  updateStats();
  
  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);
  
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });
  
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
  
  settingsBtn.addEventListener('click', openSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  resetStatsBtn.addEventListener('click', resetAllStats);
}

// Timer Functions
function startTimer() {
  if (isRunning) return;
  
  isRunning = true;
  startBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-block';
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();
    
    if (timeLeft <= 0) {
      completeSession();
    }
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  startBtn.style.display = 'inline-block';
  pauseBtn.style.display = 'none';
}

function resetTimer() {
  pauseTimer();
  timeLeft = TIMER_MODES[currentMode] * 60;
  updateDisplay();
}

function switchMode(mode) {
  if (isRunning) {
    alert('Please pause the timer before switching modes');
    return;
  }
  
  currentMode = mode;
  timeLeft = TIMER_MODES[mode] * 60;
  
  modeBtns.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  
  updateDisplay();
  updateModeLabel();
}

function completeSession() {
  pauseTimer();
  
  if (currentMode === 'work') {
    sessionCount++;
    sessionCountEl.textContent = sessionCount;
    localStorage.setItem('sessionCount', sessionCount);
    
    stats.completedSessions++;
    stats.totalFocusTime += TIMER_MODES.work;
    console.log('Work session completed. Stats:', stats);
    saveStats();
    updateStats();
    
    alert('✅ Work session completed! Time for a break.');
    switchMode('short');
  } else {
    alert('✅ Break is over! Ready to focus again?');
    switchMode('work');
  }
  
  playNotification();
}

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  document.title = `${timeDisplay.textContent} - Pomodoro`;
}

function updateModeLabel() {
  const labels = {
    work: 'Work Session',
    short: 'Short Break',
    long: 'Long Break'
  };
  currentModeEl.textContent = labels[currentMode];
}

// Settings
function openSettings() {
  document.getElementById('workDuration').value = TIMER_MODES.work;
  document.getElementById('shortDuration').value = TIMER_MODES.short;
  document.getElementById('longDuration').value = TIMER_MODES.long;
  settingsModal.style.display = 'flex';
}

function closeSettings() {
  settingsModal.style.display = 'none';
}

function saveSettings() {
  TIMER_MODES.work = parseInt(document.getElementById('workDuration').value);
  TIMER_MODES.short = parseInt(document.getElementById('shortDuration').value);
  TIMER_MODES.long = parseInt(document.getElementById('longDuration').value);
  
  localStorage.setItem('timerSettings', JSON.stringify(TIMER_MODES));
  
  timeLeft = TIMER_MODES[currentMode] * 60;
  updateDisplay();
  closeSettings();
  alert('Settings saved successfully!');
}

// Task Management
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  
  const task = {
    id: Date.now(),
    text: text,
    completed: false
  };
  
  tasks.push(task);
  saveTasks();
  renderTasks();
  taskInput.value = '';
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    
    if (task.completed) {
      stats.completedTasks++;
    } else {
      stats.completedTasks--;
    }
    
    saveStats();
    updateStats();
    saveTasks();
    renderTasks();
  }
}

function deleteTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task && task.completed) {
    stats.completedTasks--;
    saveStats();
    updateStats();
  }
  
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function renderTasks() {
  if (tasks.length === 0) {
    taskList.innerHTML = '<li style="text-align:center;color:#999;padding:20px;">No tasks yet. Add one above!</li>';
    return;
  }
  
  taskList.innerHTML = tasks.map(task => `
    <li class="task-item ${task.completed ? 'completed' : ''}">
      <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
      <span>${task.text}</span>
      <button onclick="deleteTask(${task.id})">Delete</button>
    </li>
  `).join('');
}

// Analytics
function updateStats() {
  const completedSessions = stats.completedSessions || 0;
  const totalFocusTime = stats.totalFocusTime || 0;
  const completedTasks = stats.completedTasks || 0;
  
  console.log('Stats values:', completedSessions, totalFocusTime, completedTasks);
  
  document.getElementById('completedSessions').textContent = completedSessions;
  document.getElementById('totalFocusTime').textContent = totalFocusTime;
  document.getElementById('completedTasks').textContent = completedTasks;
}

function resetAllStats() {
  if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
    stats = {
      completedSessions: 0,
      totalFocusTime: 0,
      completedTasks: 0
    };
    sessionCount = 0;
    sessionCountEl.textContent = 0;
    localStorage.setItem('sessionCount', 0);
    saveStats();
    updateStats();
    alert('All statistics have been reset.');
  }
}

// Storage
function saveTasks() {
  localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
}

function saveStats() {
  localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

// Notifications
function playNotification() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio notification failed');
  }
}

// Initialize app
init();
