// State
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let habitLogs = JSON.parse(localStorage.getItem('habitLogs')) || {};

// DOM Elements
const habitInput = document.getElementById('habitInput');
const addHabitBtn = document.getElementById('addHabitBtn');
const habitsList = document.getElementById('habitsList');
const todayDate = document.getElementById('todayDate');
const habitSelect = document.getElementById('habitSelect');
const heatmapContainer = document.getElementById('heatmapContainer');
const editModal = document.getElementById('editModal');
const editHabitInput = document.getElementById('editHabitInput');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

let editingHabitId = null;

// Initialize
function init() {
  displayTodayDate();
  renderHabits();
  updateHabitSelect();
  updateInsights();
  
  addHabitBtn.addEventListener('click', addHabit);
  habitInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addHabit();
  });
  
  habitSelect.addEventListener('change', renderHeatmap);
  saveEditBtn.addEventListener('click', saveEdit);
  cancelEditBtn.addEventListener('click', closeModal);
}

// Display Today's Date
function displayTodayDate() {
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  todayDate.textContent = today.toLocaleDateString('en-US', options);
}

// Get Today's Date String
function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Add Habit
function addHabit() {
  const name = habitInput.value.trim();
  if (!name) return;
  
  const habit = {
    id: Date.now(),
    name: name,
    createdAt: getTodayString()
  };
  
  habits.push(habit);
  saveHabits();
  renderHabits();
  updateHabitSelect();
  habitInput.value = '';
}

// Edit Habit
function editHabit(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  
  editingHabitId = id;
  editHabitInput.value = habit.name;
  editModal.classList.add('active');
}

// Save Edit
function saveEdit() {
  const newName = editHabitInput.value.trim();
  if (!newName) return;
  
  const habit = habits.find(h => h.id === editingHabitId);
  if (habit) {
    habit.name = newName;
    saveHabits();
    renderHabits();
    updateHabitSelect();
  }
  
  closeModal();
}

// Close Modal
function closeModal() {
  editModal.classList.remove('active');
  editingHabitId = null;
  editHabitInput.value = '';
}

// Delete Habit
function deleteHabit(id) {
  if (!confirm('Are you sure you want to delete this habit?')) return;
  
  habits = habits.filter(h => h.id !== id);
  delete habitLogs[id];
  saveHabits();
  saveLogs();
  renderHabits();
  updateHabitSelect();
  updateInsights();
  renderHeatmap();
}

// Toggle Habit
function toggleHabit(id) {
  const today = getTodayString();
  
  if (!habitLogs[id]) {
    habitLogs[id] = [];
  }
  
  const index = habitLogs[id].indexOf(today);
  
  if (index > -1) {
    habitLogs[id].splice(index, 1);
  } else {
    habitLogs[id].push(today);
  }
  
  saveLogs();
  renderHabits();
  updateInsights();
  renderHeatmap();
}

// Render Habits
function renderHabits() {
  if (habits.length === 0) {
    habitsList.innerHTML = '<div class="empty-state"><p>No habits yet. Add one above to get started!</p></div>';
    return;
  }
  
  const today = getTodayString();
  
  habitsList.innerHTML = habits.map(habit => {
    const isCompleted = habitLogs[habit.id] && habitLogs[habit.id].includes(today);
    
    return `
      <div class="habit-item ${isCompleted ? 'completed' : ''}">
        <div class="habit-left">
          <input type="checkbox" class="habit-checkbox" ${isCompleted ? 'checked' : ''} 
                 onchange="toggleHabit(${habit.id})">
          <span class="habit-name">${habit.name}</span>
        </div>
        <div class="habit-actions">
          <button class="btn-edit" onclick="editHabit(${habit.id})">Edit</button>
          <button class="btn-delete" onclick="deleteHabit(${habit.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// Update Habit Select
function updateHabitSelect() {
  habitSelect.innerHTML = '<option value="">Select a habit to view</option>' +
    habits.map(habit => `<option value="${habit.id}">${habit.name}</option>`).join('');
}

// Render Heatmap
function renderHeatmap() {
  const selectedId = habitSelect.value;
  
  if (!selectedId) {
    heatmapContainer.innerHTML = '<div class="empty-state"><p>Select a habit to view its activity heatmap</p></div>';
    return;
  }
  
  const logs = habitLogs[selectedId] || [];
  const days = 90; // Show last 90 days
  const cells = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    const isCompleted = logs.includes(dateString);
    
    cells.push(`
      <div class="heatmap-cell ${isCompleted ? 'level-4' : ''}" 
           title="${dateString}${isCompleted ? ' - Completed' : ''}">
      </div>
    `);
  }
  
  heatmapContainer.innerHTML = `
    <div class="heatmap-grid">
      ${cells.join('')}
    </div>
    <div class="heatmap-legend">
      <span>Less</span>
      <div class="legend-item">
        <div class="legend-box" style="background: #ebedf0;"></div>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #c6e48b;"></div>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #7bc96f;"></div>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #239a3b;"></div>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #196127;"></div>
      </div>
      <span>More</span>
    </div>
  `;
  
  updateInsights();
}

// Update Insights
function updateInsights() {
  const selectedId = habitSelect.value;
  
  if (!selectedId) {
    document.getElementById('totalDays').textContent = '0';
    document.getElementById('currentStreak').textContent = '0';
    document.getElementById('longestStreak').textContent = '0';
    return;
  }
  
  const logs = habitLogs[selectedId] || [];
  const sortedLogs = logs.sort();
  
  // Total Days
  document.getElementById('totalDays').textContent = logs.length;
  
  // Current Streak
  let currentStreak = 0;
  const today = new Date();
  
  for (let i = 0; i <= 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    if (logs.includes(dateString)) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  document.getElementById('currentStreak').textContent = currentStreak;
  
  // Longest Streak
  let longestStreak = 0;
  let tempStreak = 0;
  
  if (sortedLogs.length > 0) {
    tempStreak = 1;
    
    for (let i = 1; i < sortedLogs.length; i++) {
      const prevDate = new Date(sortedLogs[i - 1]);
      const currDate = new Date(sortedLogs[i]);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
  }
  
  document.getElementById('longestStreak').textContent = longestStreak;
}

// Storage
function saveHabits() {
  localStorage.setItem('habits', JSON.stringify(habits));
}

function saveLogs() {
  localStorage.setItem('habitLogs', JSON.stringify(habitLogs));
}

// Initialize app
init();
