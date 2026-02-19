// Toggle between login and register
function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// Toggle password visibility
function togglePassword(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Password strength checker
document.getElementById('registerPassword')?.addEventListener('input', (e) => {
    const password = e.target.value;
    const strength = document.getElementById('passwordStrength');
    
    if (password.length === 0) {
        strength.className = 'password-strength';
        return;
    }
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    if (score <= 2) {
        strength.className = 'password-strength weak';
    } else if (score === 3) {
        strength.className = 'password-strength medium';
    } else {
        strength.className = 'password-strength strong';
    }
});

// Validation functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

function validateName(name) {
    return name.trim().length >= 2;
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    let isValid = true;
    
    // Clear previous errors
    document.getElementById('loginEmailError').textContent = '';
    document.getElementById('loginPasswordError').textContent = '';
    
    // Validate email
    if (!validateEmail(email)) {
        document.getElementById('loginEmailError').textContent = 'Please enter a valid email';
        isValid = false;
    }
    
    // Validate password
    if (!validatePassword(password)) {
        document.getElementById('loginPasswordError').textContent = 'Password must be at least 8 characters';
        isValid = false;
    }
    
    if (isValid) {
        // Check credentials
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            window.location.href = 'index.html';
        } else {
            document.getElementById('loginPasswordError').textContent = 'Invalid email or password';
        }
    }
}

// Handle Register
function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    let isValid = true;
    
    // Clear previous errors
    document.getElementById('registerNameError').textContent = '';
    document.getElementById('registerEmailError').textContent = '';
    document.getElementById('registerPasswordError').textContent = '';
    document.getElementById('confirmPasswordError').textContent = '';
    
    // Validate name
    if (!validateName(name)) {
        document.getElementById('registerNameError').textContent = 'Name must be at least 2 characters';
        isValid = false;
    }
    
    // Validate email
    if (!validateEmail(email)) {
        document.getElementById('registerEmailError').textContent = 'Please enter a valid email';
        isValid = false;
    }
    
    // Validate password
    if (!validatePassword(password)) {
        document.getElementById('registerPasswordError').textContent = 'Password must be at least 8 characters';
        isValid = false;
    }
    
    // Validate confirm password
    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
        isValid = false;
    }
    
    // Check terms
    if (!agreeTerms) {
        alert('Please agree to the Terms & Conditions');
        isValid = false;
    }
    
    if (isValid) {
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
            document.getElementById('registerEmailError').textContent = 'Email already registered';
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        alert('Account created successfully!');
        window.location.href = 'index.html';
    }
}

// Check if user is already logged in
window.onload = () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    }
};
