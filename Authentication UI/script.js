// Sample Data
const ordersData = [
    { id: 'ORD-001', customer: 'John Doe', product: 'Laptop', amount: 1299, status: 'completed', date: '2024-01-20' },
    { id: 'ORD-002', customer: 'Jane Smith', product: 'Phone', amount: 899, status: 'pending', date: '2024-01-19' },
    { id: 'ORD-003', customer: 'Mike Johnson', product: 'Tablet', amount: 599, status: 'completed', date: '2024-01-18' },
    { id: 'ORD-004', customer: 'Sarah Wilson', product: 'Headphones', amount: 199, status: 'cancelled', date: '2024-01-17' },
    { id: 'ORD-005', customer: 'Tom Brown', product: 'Monitor', amount: 449, status: 'completed', date: '2024-01-16' },
    { id: 'ORD-006', customer: 'Emily Davis', product: 'Keyboard', amount: 129, status: 'pending', date: '2024-01-15' },
    { id: 'ORD-007', customer: 'Chris Lee', product: 'Mouse', amount: 79, status: 'completed', date: '2024-01-14' },
    { id: 'ORD-008', customer: 'Anna White', product: 'Webcam', amount: 159, status: 'completed', date: '2024-01-13' },
    { id: 'ORD-009', customer: 'David Clark', product: 'Speaker', amount: 249, status: 'pending', date: '2024-01-12' },
    { id: 'ORD-010', customer: 'Lisa Martin', product: 'Charger', amount: 49, status: 'completed', date: '2024-01-11' },
    { id: 'ORD-011', customer: 'James Taylor', product: 'Cable', amount: 29, status: 'completed', date: '2024-01-10' },
    { id: 'ORD-012', customer: 'Maria Garcia', product: 'Case', amount: 39, status: 'pending', date: '2024-01-09' }
];

let currentPage = 1;
let entriesPerPage = 10;
let filteredData = [...ordersData];

// Initialize
window.onload = () => {
    checkAuth();
    loadUserData();
    loadTheme();
    updateGreeting();
    animateStats();
    initCharts();
    renderTable();
    setInterval(updateGreeting, 60000);
};

// Check Authentication
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
    }
}

// Load User Data
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('greeting').textContent = `Hello, ${user.name.split(' ')[0]}! 👋`;
        if (user.photo) {
            document.getElementById('profileImage').src = user.photo;
        }
    }
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }
}

// Sidebar Toggle
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Greeting
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';
    else if (hour >= 18) greeting = 'Good Evening';
    document.getElementById('greeting').textContent = `${greeting}! 👋`;
}

// Notifications
function toggleNotifications() {
    const dropdown = document.getElementById('notifDropdown');
    dropdown.classList.toggle('active');
    document.getElementById('profileDropdown').classList.remove('active');
}

// Profile
function toggleProfile() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('active');
    document.getElementById('notifDropdown').classList.remove('active');
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.notification-btn') && !e.target.closest('.profile-btn')) {
        document.getElementById('notifDropdown').classList.remove('active');
        document.getElementById('profileDropdown').classList.remove('active');
    }
});

// Animate Stats
function animateStats() {
    document.querySelectorAll('.stat-value').forEach(stat => {
        const target = parseInt(stat.dataset.target);
        const isPercent = stat.textContent.includes('%');
        const isDollar = stat.textContent.includes('$');
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            let value = Math.floor(current);
            if (isDollar) value = '$' + value.toLocaleString();
            if (isPercent) value = value + '%';
            stat.textContent = value;
        }, 30);
    });
}

// Charts
let revenueChart, salesChart;

function initCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Sales Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(salesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Electronics', 'Clothing', 'Food', 'Books'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: ['#667eea', '#f093fb', '#4facfe', '#43e97b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Download Chart
function downloadChart(chartId) {
    const chart = chartId === 'revenueChart' ? revenueChart : salesChart;
    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.download = `${chartId}.png`;
    link.href = url;
    link.click();
}

// Table Functions
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const start = (currentPage - 1) * entriesPerPage;
    const end = start + entriesPerPage;
    const pageData = filteredData.slice(start, end);

    tbody.innerHTML = pageData.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.product}</td>
            <td>$${order.amount}</td>
            <td><span class="status ${order.status}">${order.status}</span></td>
            <td>${order.date}</td>
        </tr>
    `).join('');

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const pagination = document.getElementById('pagination');
    
    let html = '';
    if (currentPage > 1) {
        html += `<button onclick="changePage(${currentPage - 1})">Previous</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    if (currentPage < totalPages) {
        html += `<button onclick="changePage(${currentPage + 1})">Next</button>`;
    }
    
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderTable();
}

function changeEntries() {
    entriesPerPage = parseInt(document.getElementById('entriesSelect').value);
    currentPage = 1;
    renderTable();
}

function searchTable() {
    const search = document.getElementById('tableSearch').value.toLowerCase();
    filteredData = ordersData.filter(order => 
        order.id.toLowerCase().includes(search) ||
        order.customer.toLowerCase().includes(search) ||
        order.product.toLowerCase().includes(search) ||
        order.status.toLowerCase().includes(search)
    );
    currentPage = 1;
    renderTable();
}

function sortTable(col) {
    const keys = ['id', 'customer', 'product', 'amount', 'status', 'date'];
    const key = keys[col];
    
    filteredData.sort((a, b) => {
        if (typeof a[key] === 'number') {
            return a[key] - b[key];
        }
        return a[key].localeCompare(b[key]);
    });
    
    renderTable();
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-bar input').focus();
    }
    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
    }
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
    }
});

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// Show Section
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    document.getElementById(section + 'Section').classList.add('active');
    
    if (section === 'analytics') initAnalyticsCharts();
    if (section === 'users') renderUsers();
    if (section === 'products') renderProducts();
    if (section === 'orders') renderOrders();
}

// Profile Modal
function openProfileModal() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('profileNameInput').value = user.name || '';
    document.getElementById('profileEmailInput').value = user.email || '';
    document.getElementById('profilePhoneInput').value = user.phone || '';
    document.getElementById('profileRoleInput').value = user.role || 'Admin';
    if (user.photo) {
        document.getElementById('profilePhotoPreview').src = user.photo;
    }
    document.getElementById('profileModal').classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

function changeProfilePhoto() {
    const photos = [
        'https://i.pravatar.cc/150?img=12',
        'https://i.pravatar.cc/150?img=13',
        'https://i.pravatar.cc/150?img=14',
        'https://i.pravatar.cc/150?img=15',
        'https://i.pravatar.cc/150?img=16'
    ];
    const random = photos[Math.floor(Math.random() * photos.length)];
    document.getElementById('profilePhotoPreview').src = random;
}

function saveProfile(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    user.name = document.getElementById('profileNameInput').value;
    user.email = document.getElementById('profileEmailInput').value;
    user.phone = document.getElementById('profilePhoneInput').value;
    user.role = document.getElementById('profileRoleInput').value;
    user.photo = document.getElementById('profilePhotoPreview').src;
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Update users array
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    loadUserData();
    closeProfileModal();
    alert('Profile updated successfully!');
}

// Settings Modal
function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('active');
    document.getElementById('darkModeToggle').checked = document.body.classList.contains('dark');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

function changePassword() {
    const newPassword = prompt('Enter new password (min 8 characters):');
    if (newPassword && newPassword.length >= 8) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        user.password = newPassword;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index] = user;
            localStorage.setItem('users', JSON.stringify(users));
        }
        alert('Password changed successfully!');
    } else {
        alert('Password must be at least 8 characters!');
    }
}

function deleteAccount() {
    if (confirm('Are you sure? This action cannot be undone!')) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const filtered = users.filter(u => u.id !== user.id);
        localStorage.setItem('users', JSON.stringify(filtered));
        localStorage.removeItem('currentUser');
        alert('Account deleted!');
        window.location.href = 'login.html';
    }
}


// Analytics Charts
let trafficChart, growthChart;
function initAnalyticsCharts() {
    if (trafficChart) return;
    const trafficCtx = document.getElementById('trafficChart').getContext('2d');
    trafficChart = new Chart(trafficCtx, {
        type: 'bar',
        data: {
            labels: ['Direct', 'Social', 'Email', 'Referral', 'Organic'],
            datasets: [{
                label: 'Traffic',
                data: [4500, 3200, 2800, 1900, 5600],
                backgroundColor: ['#667eea', '#f093fb', #4facfe', '#43e97b', '#feca57']
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    const growthCtx = document.getElementById('growthChart').getContext('2d');
    growthChart = new Chart(growthCtx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Users',
                data: [1200, 1900, 3000, 5000],
                borderColor: '#667eea',
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

// Users Management
const usersData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', avatar: 'https://i.pravatar.cc/50?img=1' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active', avatar: 'https://i.pravatar.cc/50?img=2' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'User', status: 'Inactive', avatar: 'https://i.pravatar.cc/50?img=3' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Manager', status: 'Active', avatar: 'https://i.pravatar.cc/50?img=4' }
];

function renderUsers() {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = usersData.map(user => `
        <tr>
            <td><img src="${user.avatar}" style="width:40px;height:40px;border-radius:50%"></td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td><span class="status ${user.status.toLowerCase()}">${user.status}</span></td>
            <td><button class="btn-secondary" onclick="editUser(${user.id})">Edit</button> <button class="btn-danger" onclick="deleteUser(${user.id})">Delete</button></td>
        </tr>
    `).join('');
}

function addUser() {
    const name = prompt('Enter name:');
    const email = prompt('Enter email:');
    if (name && email) {
        usersData.push({ id: Date.now(), name, email, role: 'User', status: 'Active', avatar: 'https://i.pravatar.cc/50?img=' + Math.floor(Math.random() * 70) });
        renderUsers();
    }
}

function editUser(id) {
    const user = usersData.find(u => u.id === id);
    const name = prompt('Edit name:', user.name);
    if (name) {
        user.name = name;
        renderUsers();
    }
}

function deleteUser(id) {
    if (confirm('Delete this user?')) {
        const index = usersData.findIndex(u => u.id === id);
        usersData.splice(index, 1);
        renderUsers();
    }
}

// Products Management
const productsData = [
    { id: 1, name: 'Laptop Pro', price: 1299, stock: 45, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300' },
    { id: 2, name: 'Wireless Mouse', price: 29, stock: 120, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300' },
    { id: 3, name: 'Keyboard RGB', price: 89, stock: 67, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300' },
    { id: 4, name: 'Monitor 4K', price: 449, stock: 23, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300' }
];

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = productsData.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <div class="product-price">$${product.price}</div>
            <div class="product-stock">Stock: ${product.stock}</div>
            <div class="product-actions">
                <button class="btn-secondary" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function addProduct() {
    const name = prompt('Product name:');
    const price = prompt('Price:');
    if (name && price) {
        productsData.push({ id: Date.now(), name, price: parseFloat(price), stock: 0, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300' });
        renderProducts();
    }
}

function editProduct(id) {
    const product = productsData.find(p => p.id === id);
    const price = prompt('Edit price:', product.price);
    if (price) {
        product.price = parseFloat(price);
        renderProducts();
    }
}

function deleteProduct(id) {
    if (confirm('Delete this product?')) {
        const index = productsData.findIndex(p => p.id === id);
        productsData.splice(index, 1);
        renderProducts();
    }
}

// Orders Management
function renderOrders() {
    const tbody = document.getElementById('ordersTable');
    tbody.innerHTML = ordersData.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.product}</td>
            <td>$${order.amount}</td>
            <td><span class="status ${order.status}">${order.status}</span></td>
            <td>${order.date}</td>
            <td><button class="btn-secondary" onclick="updateOrderStatus('${order.id}')">Update</button></td>
        </tr>
    `).join('');
}

function updateOrderStatus(id) {
    const order = ordersData.find(o => o.id === id);
    const statuses = ['pending', 'completed', 'cancelled'];
    const currentIndex = statuses.indexOf(order.status);
    order.status = statuses[(currentIndex + 1) % statuses.length];
    renderOrders();
}
