// Category Configuration
const CATEGORIES = {
  Education: { icon: "🎓", bg: "#fff3e0", color: "#e67e22", bar: "#f39c12" },
  Tech: { icon: "💻", bg: "#e8eaff", color: "#5c6bc0", bar: "#7c6ff7" },
  Travel: { icon: "✈️", bg: "#e8f5e9", color: "#2e7d32", bar: "#43c4a0" },
  Food: { icon: "🍔", bg: "#fce4ec", color: "#c2185b", bar: "#f48fb1" },
  Internet: { icon: "🌐", bg: "#e3f2fd", color: "#1565c0", bar: "#5dadec" },
  Health: { icon: "🏥", bg: "#f3e5f5", color: "#6a1b9a", bar: "#ab47bc" },
  Shopping: { icon: "🛍️", bg: "#ffe8f0", color: "#e05a7b", bar: "#f78fb3" },
  Other: { icon: "📦", bg: "#eceff1", color: "#546e7a", bar: "#90a4ae" },
};

// Sample Data
function getDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

const SAMPLE_EXPENSES = [
  { id: "sample-1", title: "NPTEL Fee", amount: 2000, category: "Education", date: getDate(5), notes: "Course registration" },
  { id: "sample-2", title: "Laptop Service", amount: 3000, category: "Tech", date: getDate(10), notes: "Keyboard replacement" },
  { id: "sample-3", title: "Travel", amount: 4000, category: "Travel", date: getDate(15), notes: "Round trip" },
  { id: "sample-4", title: "Snacks", amount: 300, category: "Food", date: getDate(2), notes: "Evening snacks" },
  { id: "sample-5", title: "Internet", amount: 400, category: "Internet", date: getDate(3), notes: "Monthly recharge" },
];

let expenses = [];
let categoryChart = null;
let trendChart = null;

// Load from localStorage
function loadExpenses() {
  const saved = localStorage.getItem("spendly_expenses");
  expenses = saved ? JSON.parse(saved) : SAMPLE_EXPENSES;
  saveToStorage();
}

function saveToStorage() {
  localStorage.setItem("spendly_expenses", JSON.stringify(expenses));
}

function generateId() {
  return "exp-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
}

// Navigation
function showSection(sectionId) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById(sectionId).classList.add('active');
  event.target.closest('.nav-btn').classList.add('active');
  
  if (sectionId === 'dashboard') {
    renderDashboard();
  } else if (sectionId === 'categories') {
    renderCategories();
  }
}

// Save Expense
function saveExpense(event) {
  event.preventDefault();
  
  const id = document.getElementById("expenseId").value;
  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;
  const notes = document.getElementById("notes").value.trim();
  
  if (!title || !amount || !category || !date) {
    showToast("⚠️ Please fill all required fields");
    return;
  }
  
  if (id) {
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { id, title, amount, category, date, notes };
      showToast("✅ Expense updated!");
    }
  } else {
    expenses.unshift({ id: generateId(), title, amount, category, date, notes });
    showToast("🎉 Expense added!");
  }
  
  saveToStorage();
  resetForm();
  renderAll();
}

function resetForm() {
  document.getElementById("expenseForm").reset();
  document.getElementById("expenseId").value = "";
  document.getElementById("date").value = getDate(0);
}

// Delete Expense
function deleteExpense(id) {
  const itemEl = document.getElementById("item-" + id);
  if (itemEl) {
    itemEl.classList.add("removing");
    setTimeout(() => {
      expenses = expenses.filter(e => e.id !== id);
      saveToStorage();
      renderAll();
      showToast("🗑️ Expense deleted");
    }, 300);
  }
}

// Edit Expense
function editExpense(expense) {
  showSection('add-expense');
  document.getElementById("expenseId").value = expense.id;
  document.getElementById("title").value = expense.title;
  document.getElementById("amount").value = expense.amount;
  document.getElementById("category").value = expense.category;
  document.getElementById("date").value = expense.date;
  document.getElementById("notes").value = expense.notes || "";
  document.getElementById("saveBtn").textContent = "Update Expense";
}

// Render All
function renderAll() {
  updateSummaryCards();
  renderDashboard();
  renderCategories();
}

// Summary Cards
function updateSummaryCards() {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString("default", { month: "long" });
  
  const monthlyTotal = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);
  
  document.getElementById("totalAmount").textContent = "₹" + formatNumber(total);
  document.getElementById("monthlyAmount").textContent = "₹" + formatNumber(monthlyTotal);
  document.getElementById("totalCount").textContent = expenses.length;
  document.getElementById("currentMonthLabel").textContent = monthName;
}

function formatNumber(n) {
  return n.toLocaleString("en-IN");
}

// Dashboard
function renderDashboard() {
  renderCharts();
  renderRecentExpenses();
}

function renderCharts() {
  const totals = {};
  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  
  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6'];
  
  // Category Chart
  const ctxCategory = document.getElementById('categoryChart');
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctxCategory, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1500,
        easing: 'easeInOutQuart'
      }
    }
  });
  
  // Daily Trend Chart - Line Chart
  const dailyData = {};
  expenses.forEach(e => {
    dailyData[e.date] = (dailyData[e.date] || 0) + e.amount;
  });
  
  const sortedDates = Object.keys(dailyData).sort().slice(-10);
  const amounts = sortedDates.map(date => dailyData[date]);
  const dateLabels = sortedDates.map(date => {
    const d = new Date(date + 'T00:00:00');
    return d.getDate() + '/' + (d.getMonth() + 1);
  });
  
  const ctxTrend = document.getElementById('trendChart');
  if (trendChart) trendChart.destroy();
  
  trendChart = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: dateLabels,
      datasets: [{
        label: 'Daily Expenses',
        data: amounts,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#1e40af',
        pointHoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#2563eb',
          borderWidth: 2,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return '₹' + formatNumber(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          suggestedMax: 5000,
          ticks: {
            stepSize: 500,
            color: '#64748b',
            font: { weight: 600 },
            callback: function(value) {
              return '₹' + formatNumber(value);
            }
          },
          grid: {
            color: 'rgba(37, 99, 235, 0.1)',
            drawBorder: false
          },
          title: {
            display: true,
            text: 'Amount',
            color: '#64748b',
            font: { weight: 700, size: 12 }
          }
        },
        x: {
          ticks: {
            color: '#64748b',
            font: { weight: 600 }
          },
          grid: {
            display: false,
            drawBorder: false
          },
          title: {
            display: true,
            text: 'Date',
            color: '#64748b',
            font: { weight: 700, size: 12 }
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart'
      }
    }
  });
}

function renderRecentExpenses() {
  const container = document.getElementById('recentExpenses');
  const recent = expenses.slice(0, 5);
  
  if (recent.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;">No expenses yet</p>';
    return;
  }
  
  container.innerHTML = recent.map(e => {
    const cat = CATEGORIES[e.category] || CATEGORIES.Other;
    return `
      <div class="expense-item">
        <div class="expense-dot" style="background:${cat.bg};">${cat.icon}</div>
        <div class="expense-details">
          <div class="expense-title">${e.title}</div>
          <div class="expense-meta">${e.date}</div>
        </div>
        <div class="expense-amount">₹${formatNumber(e.amount)}</div>
      </div>
    `;
  }).join('');
}

// Categories Section
function renderCategories() {
  populateMonthFilter();
  renderCategoryBreakdown();
  renderExpenses();
}

function populateMonthFilter() {
  const select = document.getElementById("filterMonth");
  const currentValue = select.value;
  
  select.innerHTML = '<option value="all">All Time</option>';
  
  const months = new Set();
  expenses.forEach(e => months.add(e.date.substring(0, 7)));
  
  const sorted = Array.from(months).sort((a, b) => b.localeCompare(a));
  
  sorted.forEach(ym => {
    const [year, month] = ym.split("-");
    const label = new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });
    const opt = document.createElement("option");
    opt.value = ym;
    opt.textContent = label;
    select.appendChild(opt);
  });
  
  if (currentValue) select.value = currentValue;
}

function renderCategoryBreakdown() {
  const container = document.getElementById("categoryBreakdown");
  
  if (expenses.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;">No expenses yet</p>';
    return;
  }
  
  const totals = {};
  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  
  container.innerHTML = sorted.map(([catName, amount]) => {
    const cat = CATEGORIES[catName] || CATEGORIES.Other;
    const percent = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
    
    return `
      <div class="category-row">
        <div class="category-info">
          <span class="category-name">${cat.icon} ${catName}</span>
          <span class="category-amount">₹${formatNumber(amount)}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${percent}%; background:${cat.bar};"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderExpenses() {
  const list = document.getElementById("expenseList");
  const filterVal = document.getElementById("filterMonth").value;
  
  let filtered = expenses;
  if (filterVal !== "all") {
    filtered = expenses.filter(e => e.date.startsWith(filterVal));
  }
  
  if (filtered.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No expenses found</p>';
    return;
  }
  
  list.innerHTML = filtered.map(e => buildExpenseItem(e)).join('');
}

function buildExpenseItem(expense) {
  const cat = CATEGORIES[expense.category] || CATEGORIES.Other;
  const dateObj = new Date(expense.date + "T00:00:00");
  const dateStr = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  
  return `
    <div class="expense-item" id="item-${expense.id}">
      <div class="expense-dot" style="background:${cat.bg};">${cat.icon}</div>
      <div class="expense-details">
        <div class="expense-title">${expense.title}</div>
        <div class="expense-meta">📅 ${dateStr} ${expense.notes ? ` · ${expense.notes}` : ''}</div>
        <span class="badge" style="background:${cat.bg}; color:${cat.color};">${cat.icon} ${expense.category}</span>
      </div>
      <div class="expense-right">
        <span class="expense-amount">₹${formatNumber(expense.amount)}</span>
        <div class="action-btns">
          <button class="btn-icon btn-edit" onclick='editExpense(${JSON.stringify(expense)})'>✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteExpense('${expense.id}')">🗑️</button>
        </div>
      </div>
    </div>
  `;
}

// Toast
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// Initialize
function initApp() {
  loadExpenses();
  document.getElementById("date").value = getDate(0);
  renderAll();
}

initApp();
