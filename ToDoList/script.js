// Get elements
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCounter = document.getElementById('taskCounter');

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Initialize app
renderTasks();

// Add task event listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// Add new task
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') return;

    const task = {
        id: Date.now(),
        text: taskText,
        completed: false
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    taskInput.value = '';
}

// Render all tasks
function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">No tasks yet. Add one above!</div>';
        updateCounter();
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${task.id})">
            <span class="task-text">${task.text}</span>
            <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
        `;

        taskList.appendChild(li);
    });

    updateCounter();
}

// Toggle task completion
function toggleTask(id) {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks();
    renderTasks();
}

// Delete task with animation
function deleteTask(id) {
    const taskElement = event.target.closest('.task-item');
    taskElement.classList.add('removing');

    setTimeout(() => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }, 400);
}

// Update task counter
function updateCounter() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    taskCounter.textContent = `${total} task${total !== 1 ? 's' : ''} (${completed} completed)`;
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
