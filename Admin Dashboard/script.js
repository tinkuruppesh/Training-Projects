console.log('Dashboard loading...');

// Sample data
const revenueData = {
  '12m': { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], revenue: [41200,53800,48500,61200,72400,65100,78300,82000,76500,91200,88700,98400], expenses: [28000,31000,29500,33000,38000,35000,41000,43000,40000,47000,46000,51000] }
};

const pieData = { labels: ['Organic', 'Direct', 'Social', 'Email', 'Referral'], values: [38,22,18,12,10], colors: ['#6EE7B7','#76E4F7','#B794F4','#F472B6','#FB923C'] };
const barData = { labels: ['Electronics','Fashion','Food','Home','Sports','Books'], values: [4200,3100,2800,1950,1600,890] };
const usersData = [{name:'Alice Morgan',email:'alice@example.com',role:'Admin',status:'Active',revenue:12400,joined:'2024-01-05'},{name:'Bob Chen',email:'bob@example.com',role:'Editor',status:'Active',revenue:8200,joined:'2024-02-14'}];

// Theme
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
let currentTheme = localStorage.getItem('apex-theme') || 'dark';
let currentAccent = localStorage.getItem('apex-accent') || '#6EE7B7';

function applyTheme(t) {
  root.setAttribute('data-theme', t);
  currentTheme = t;
  localStorage.setItem('apex-theme', t);
}

function applyAccent(color) {
  currentAccent = color;
  root.style.setProperty('--accent', color);
  localStorage.setItem('apex-accent', color);
  // Update active dot
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.color === color);
  });
  // Redraw charts with new color
  setTimeout(() => {
    if(currentPage === 'dashboard') {
      buildRevenueChart();
      buildPieChart();
      buildBarChart();
    }
  }, 50);
}

if(themeToggle) themeToggle.addEventListener('click', () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark'));
applyTheme(currentTheme);
applyAccent(currentAccent);

// Accent color selector
document.querySelectorAll('.color-dot').forEach(btn => {
  btn.addEventListener('click', () => applyAccent(btn.dataset.color));
});

// Sidebar
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');

if(sidebarToggle) sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => { sidebar.classList.add('mobile-open'); sidebarOverlay.classList.add('visible'); });
if(sidebarOverlay) sidebarOverlay.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); sidebarOverlay.classList.remove('visible'); });

// Clock
function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById('clockTime');
  const dateEl = document.getElementById('clockDate');
  if(timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  if(dateEl) dateEl.textContent = now.toLocaleDateString('en-US', {weekday:'short',month:'short',day:'numeric'});
}
updateClock();
setInterval(updateClock, 1000);

// Counter animation
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if(current >= target) { current = target; clearInterval(timer); }
    el.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
  }, 30);
}

document.querySelectorAll('.counter').forEach(c => animateCounter(c));

// Charts
let revenueChart, pieChart, barChart;

function buildRevenueChart() {
  const canvas = document.getElementById('revenueChart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const d = revenueData['12m'];
  
  if(revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [{
        label: 'Revenue',
        data: d.revenue,
        borderColor: currentAccent,
        backgroundColor: currentAccent + '20',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      },{
        label: 'Expenses',
        data: d.expenses,
        borderColor: '#FC8181',
        backgroundColor: 'rgba(252,129,129,0.1)',
        borderWidth: 2,
        borderDash: [5,5],
        tension: 0.4,
        fill: true
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function buildPieChart() {
  const canvas = document.getElementById('pieChart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  
  if(pieChart) pieChart.destroy();
  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: pieData.labels,
      datasets: [{ data: pieData.values, backgroundColor: pieData.colors }]
    },
    options: { responsive: true, maintainAspectRatio: true, cutout: '68%', plugins: { legend: { position: 'bottom' } } }
  });
}

function buildBarChart() {
  const canvas = document.getElementById('barChart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  
  if(barChart) barChart.destroy();
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: barData.labels,
      datasets: [{ label: 'Orders', data: barData.values, backgroundColor: currentAccent }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// Goals
function renderGoals() {
  const goalsList = document.getElementById('goalsList');
  if(!goalsList) return;
  const goals = [{name:'Monthly Revenue',target:100000,current:98400},{name:'New Users',target:5000,current:4291}];
  goalsList.innerHTML = goals.map(g => {
    const pct = Math.round((g.current/g.target)*100);
    return `<div class="goal-item"><div class="goal-meta"><span class="goal-name">${g.name}</span><span class="goal-pct">${pct}%</span></div><div class="goal-bar-track"><div class="goal-bar-fill" style="width:${pct}%"></div></div></div>`;
  }).join('');
}

// Activity
function renderActivity() {
  const actList = document.getElementById('activityList');
  if(!actList) return;
  const items = [{icon:'🆕',text:'<strong>New user</strong> registered',time:'2m ago'},{icon:'💰',text:'<strong>Payment</strong> received',time:'15m ago'}];
  actList.innerHTML = items.map(i => `<div class="activity-item"><div class="activity-icon" style="background:rgba(110,231,183,0.15)">${i.icon}</div><div class="activity-body"><p>${i.text}</p><div class="activity-time">${i.time}</div></div></div>`).join('');
}

// Transactions
function renderTransactions() {
  const txnList = document.getElementById('txnList');
  if(!txnList) return;
  const txns = [{icon:'🛒',name:'E-commerce Order',date:'Feb 18',amount:'+$349.00',type:'credit'},{icon:'☁️',name:'Cloud Services',date:'Feb 18',amount:'-$120.00',type:'debit'}];
  txnList.innerHTML = txns.map(t => `<div class="txn-item"><div class="txn-icon" style="background:#6EE7B722">${t.icon}</div><div class="txn-info"><div class="txn-name">${t.name}</div><div class="txn-date">${t.date}</div></div><div class="txn-amount ${t.type}">${t.amount}</div></div>`).join('');
}

// Table
function renderTable() {
  const tbody = document.getElementById('tableBody');
  if(!tbody) return;
  tbody.innerHTML = usersData.map(u => `<tr><td><div class="user-cell"><div class="user-avatar">${u.name.split(' ').map(w=>w[0]).join('')}</div><span class="user-name">${u.name}</span></div></td><td>${u.email}</td><td>${u.role}</td><td><span class="status-badge status-active">${u.status}</span></td><td>$${u.revenue.toLocaleString()}</td><td>${u.joined}</td></tr>`).join('');
}

// Page switching
let currentPage = 'dashboard';
const pageContent = document.querySelector('.page-content');
let dashboardHTML = '';

const pages = {
  analytics: `<div class="greeting-bar"><h1>📊 Analytics</h1></div><div class="stats-grid"><div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim)">📈</div><div class="stat-body"><span class="stat-label">Page Views</span><span class="stat-value">2.4M</span></div></div></div>`,
  orders: `<div class="greeting-bar"><h1>🛒 Orders</h1></div><div class="stats-grid"><div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim)">📦</div><div class="stat-body"><span class="stat-label">Total Orders</span><span class="stat-value">5,839</span></div></div></div>`,
  users: `<div class="greeting-bar"><h1>👥 Users</h1></div><div class="stats-grid"><div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim)">👤</div><div class="stat-body"><span class="stat-label">Total Users</span><span class="stat-value">84,291</span></div></div></div>`,
  revenue: `<div class="greeting-bar"><h1>💰 Revenue</h1></div><div class="stats-grid"><div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim)">💵</div><div class="stat-body"><span class="stat-label">Revenue</span><span class="stat-value">$248,670</span></div></div></div>`,
  transactions: `<div class="greeting-bar"><h1>💳 Transactions</h1></div><div class="stats-grid"><div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim)">💰</div><div class="stat-body"><span class="stat-label">Transactions</span><span class="stat-value">12,458</span></div></div></div>`,
  settings: `<div class="greeting-bar"><h1>⚙️ Settings</h1></div><div class="card" style="padding:2rem"><h3>General Settings</h3><p>Configure your preferences</p></div>`
};

function switchPage(page) {
  if(currentPage === page) return;
  
  if(!dashboardHTML) dashboardHTML = pageContent.innerHTML;
  
  currentPage = page;
  pageContent.innerHTML = page === 'dashboard' ? dashboardHTML : pages[page];
  
  if(page === 'dashboard') {
    setTimeout(() => {
      buildRevenueChart();
      buildPieChart();
      buildBarChart();
      renderGoals();
      renderActivity();
      renderTransactions();
      renderTable();
      document.querySelectorAll('.counter').forEach(c => animateCounter(c));
    }, 50);
  }
}

// Nav items
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    switchPage(item.dataset.page);
  });
});

// Initialize
setTimeout(() => {
  buildRevenueChart();
  buildPieChart();
  buildBarChart();
  renderGoals();
  renderActivity();
  renderTransactions();
  renderTable();
}, 100);

console.log('Dashboard loaded!');
