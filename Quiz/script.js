// Faculty password
const FACULTY_PASSWORD = "admin123";

// Global variables
let currentQuestionIndex = 0;
let studentAnswers = [];
let timerInterval = null;
let timeRemaining = 0;
let totalTime = 0;

// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('themeBtn');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeBtn.textContent = '🌙 Dark Mode';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeBtn.textContent = '☀️ Light Mode';
        localStorage.setItem('theme', 'dark');
    }
}

// Load theme on page load
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeBtn').textContent = '☀️ Light Mode';
    }
});

// Screen Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Faculty Login
function facultyLogin() {
    const password = document.getElementById('facultyPassword').value;
    if (password === FACULTY_PASSWORD) {
        showScreen('facultyPanel');
        loadFacultyPanel();
    } else {
        alert('❌ Incorrect password!');
    }
}

// Load Faculty Panel
function loadFacultyPanel() {
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    if (quiz) {
        document.getElementById('roomKeyDisplay').textContent = quiz.roomKey || 'Not Generated';
    }
}

// Add Question
let questionCount = 0;
function addQuestion() {
    questionCount++;
    const container = document.getElementById('questionsContainer');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <h4>Question ${questionCount}</h4>
        <input type="text" placeholder="Question text" id="q${questionCount}text" />
        <div class="option-input">
            <input type="text" placeholder="Option A" id="q${questionCount}optA" />
            <input type="text" placeholder="Option B" id="q${questionCount}optB" />
        </div>
        <div class="option-input">
            <input type="text" placeholder="Option C" id="q${questionCount}optC" />
            <input type="text" placeholder="Option D" id="q${questionCount}optD" />
        </div>
        <select id="q${questionCount}correct">
            <option value="">Select Correct Answer</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
        </select>
        <div class="timer-input-group">
            <label>⏱️ Timer (seconds):</label>
            <input type="number" id="q${questionCount}timer" placeholder="Seconds" min="1" value="10" />
        </div>
    `;
    container.appendChild(questionDiv);
}

// Save Quiz
function saveQuiz() {
    const questions = [];
    
    for (let i = 1; i <= questionCount; i++) {
        const question = {
            text: document.getElementById(`q${i}text`).value,
            options: {
                A: document.getElementById(`q${i}optA`).value,
                B: document.getElementById(`q${i}optB`).value,
                C: document.getElementById(`q${i}optC`).value,
                D: document.getElementById(`q${i}optD`).value
            },
            correct: document.getElementById(`q${i}correct`).value,
            timer: parseInt(document.getElementById(`q${i}timer`).value) || 10
        };
        
        if (question.text && question.correct) {
            questions.push(question);
        }
    }
    
    if (questions.length === 0) {
        alert('⚠️ Please add at least one question!');
        return;
    }
    
    const quiz = {
        questions: questions,
        roomKey: localStorage.getItem('roomKey') || '',
        active: false
    };
    
    localStorage.setItem('quiz', JSON.stringify(quiz));
    alert('✅ Quiz saved successfully!');
}

// Generate Room Key
function generateRoomKey() {
    const key = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('roomKey', key);
    document.getElementById('roomKeyDisplay').textContent = key;
    
    const quiz = JSON.parse(localStorage.getItem('quiz')) || {};
    quiz.roomKey = key;
    localStorage.setItem('quiz', JSON.stringify(quiz));
    
    alert(`✅ Room Key Generated: ${key}`);
}

// Start Quiz
function startQuiz() {
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    if (!quiz || quiz.questions.length === 0) {
        alert('⚠️ Please create and save a quiz first!');
        return;
    }
    
    quiz.active = true;
    localStorage.setItem('quiz', JSON.stringify(quiz));
    alert('✅ Quiz started! Students can now enter.');
}

// Stop Quiz
function stopQuiz() {
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    if (quiz) {
        quiz.active = false;
        localStorage.setItem('quiz', JSON.stringify(quiz));
        alert('🛑 Quiz stopped!');
    }
}

// View Leaderboard
function viewLeaderboard() {
    showScreen('leaderboardScreen');
    displayLeaderboard();
}

// Logout
function logout() {
    showScreen('homeScreen');
}

// Student Entry
function enterQuiz() {
    const name = document.getElementById('studentName').value.trim();
    const key = document.getElementById('roomKey').value.trim();
    
    if (!name) {
        alert('⚠️ Please enter your name!');
        return;
    }
    
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    
    if (!quiz || key !== quiz.roomKey) {
        alert('❌ Please contact faculty for valid key.');
        return;
    }
    
    if (!quiz.active) {
        alert('⚠️ Quiz is not active yet!');
        return;
    }
    
    // Check if student already attempted
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    if (leaderboard.find(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert('⚠️ You have already attempted this quiz!');
        return;
    }
    
    localStorage.setItem('currentStudent', name);
    startQuizForStudent();
}

// Start Quiz for Student
function startQuizForStudent() {
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    const studentName = localStorage.getItem('currentStudent');
    
    document.getElementById('studentNameDisplay').textContent = studentName;
    
    currentQuestionIndex = 0;
    studentAnswers = new Array(quiz.questions.length).fill(null);
    
    // Get timer for first question
    const firstQuestion = quiz.questions[0];
    timeRemaining = firstQuestion.timer || 10;
    totalTime = timeRemaining;
    
    showScreen('quizScreen');
    displayQuestion();
    startTimer();
}

// Display Question
function displayQuestion() {
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    const question = quiz.questions[currentQuestionIndex];
    
    document.getElementById('questionText').textContent = question.text;
    document.getElementById('questionCounter').textContent = 
        `Question ${currentQuestionIndex + 1} of ${quiz.questions.length}`;
    
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    Object.entries(question.options).forEach(([key, value]) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        if (studentAnswers[currentQuestionIndex] === key) {
            optionDiv.classList.add('selected');
        }
        optionDiv.textContent = `${key}. ${value}`;
        optionDiv.onclick = () => selectOption(key);
        optionsContainer.appendChild(optionDiv);
    });
    
    updateProgress();
}

// Select Option
function selectOption(option) {
    studentAnswers[currentQuestionIndex] = option;
    displayQuestion();
}

// Navigation
function nextQuestion() {
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    if (currentQuestionIndex < quiz.questions.length - 1) {
        currentQuestionIndex++;
        clearInterval(timerInterval);
        
        const currentQuestion = quiz.questions[currentQuestionIndex];
        timeRemaining = currentQuestion.timer || 10;
        totalTime = timeRemaining;
        
        displayQuestion();
        startTimer();
    }
}

function prevQuestion() {
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        clearInterval(timerInterval);
        
        const currentQuestion = quiz.questions[currentQuestionIndex];
        timeRemaining = currentQuestion.timer || 10;
        totalTime = timeRemaining;
        
        displayQuestion();
        startTimer();
    }
}

// Update Progress
function updateProgress() {
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
}

// Timer
function startTimer() {
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    const timerDisplay = document.getElementById('timerDisplay');
    const timerCircle = document.getElementById('timerCircle');
    const circumference = 2 * Math.PI * 45;
    
    timerCircle.style.strokeDasharray = circumference;
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update circular progress
        const progress = timeRemaining / totalTime;
        const offset = circumference * (1 - progress);
        timerCircle.style.strokeDashoffset = offset;
        
        // Warning animation when less than 5 seconds
        if (timeRemaining <= 5) {
            timerCircle.classList.add('warning');
            timerDisplay.parentElement.classList.add('warning');
        } else {
            timerCircle.classList.remove('warning');
            timerDisplay.parentElement.classList.remove('warning');
        }
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            // Auto move to next question or submit
            if (currentQuestionIndex < quiz.questions.length - 1) {
                nextQuestion();
            } else {
                submitQuiz();
            }
        }
    }, 1000);
}

// Submit Quiz
function submitQuiz() {
    clearInterval(timerInterval);
    
    const quiz = JSON.parse(localStorage.getItem('quiz'));
    let score = 0;
    
    quiz.questions.forEach((q, index) => {
        if (studentAnswers[index] === q.correct) {
            score++;
        }
    });
    
    const percentage = ((score / quiz.questions.length) * 100).toFixed(2);
    const studentName = localStorage.getItem('currentStudent');
    
    // Save to leaderboard
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push({
        name: studentName,
        score: score,
        total: quiz.questions.length,
        percentage: percentage
    });
    leaderboard.sort((a, b) => b.percentage - a.percentage);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    
    // Show results
    document.getElementById('resultName').textContent = studentName;
    document.getElementById('resultScore').textContent = `${score} / ${quiz.questions.length}`;
    document.getElementById('resultPercentage').textContent = `${percentage}%`;
    
    showScreen('resultScreen');
}

// Show Leaderboard
function showLeaderboard() {
    showScreen('leaderboardScreen');
    displayLeaderboard();
}

// Display Leaderboard
function displayLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    const container = document.getElementById('leaderboardList');
    
    if (leaderboard.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">No entries yet!</p>';
        return;
    }
    
    container.innerHTML = leaderboard.map((entry, index) => `
        <div class="leaderboard-item">
            <span class="rank">#${index + 1}</span>
            <span>${entry.name}</span>
            <span>${entry.score}/${entry.total}</span>
            <span>${entry.percentage}%</span>
        </div>
    `).join('');
}
