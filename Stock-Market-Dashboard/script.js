/* ===== STOCK MARKET DASHBOARD - MAIN JAVASCRIPT ===== */

// ===== Configuration =====
const API_KEY = 'demo'; // Using demo key - replace with your own from twelvedata.com
const API_BASE = 'https://api.twelvedata.com';
const UPDATE_INTERVAL = 60000; // Update every 60 seconds
const POPULAR_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META'];

// ===== Global State =====
let watchlist = JSON.parse(localStorage.getItem('stockWatchlist')) || [];
let selectedStock = null;
let stockChart = null;
let updateTimer = null;

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  startAutoUpdate();
});

// ===== Initialize Application =====
function initializeApp() {
  loadPopularStocks();
  renderWatchlist();
  updateLastUpdateTime();
}

// ===== Setup Event Listeners =====
function setupEventListeners() {
  // Search functionality
  document.getElementById('searchBtn').addEventListener('click', handleSearch);
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Time filter buttons
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (selectedStock) {
        loadStockChart(selectedStock, btn.dataset.period);
      }
    });
  });
}

// ===== Load Popular Stocks =====
async function loadPopularStocks() {
  const grid = document.getElementById('stocksGrid');
  grid.innerHTML = '<div class="skeleton-card"></div>'.repeat(6);

  try {
    const stocksData = await Promise.all(
      POPULAR_STOCKS.map(symbol => fetchStockData(symbol))
    );
    
    grid.innerHTML = stocksData
      .filter(stock => stock !== null)
      .map(stock => createStockCard(stock))
      .join('');
  } catch (error) {
    console.error('Error loading stocks:', error);
    grid.innerHTML = '<div class="empty-state">Failed to load stocks. Please try again.</div>';
  }
}

// ===== Fetch Stock Data from API =====
async function fetchStockData(symbol) {
  try {
    // Fetch current price
    const priceResponse = await fetch(
      `${API_BASE}/price?symbol=${symbol}&apikey=${API_KEY}`
    );
    const priceData = await priceResponse.json();

    // Fetch quote data for additional info
    const quoteResponse = await fetch(
      `${API_BASE}/quote?symbol=${symbol}&apikey=${API_KEY}`
    );
    const quoteData = await quoteResponse.json();

    // Handle API errors
    if (priceData.status === 'error' || quoteData.status === 'error') {
      console.warn(`API error for ${symbol}, using fallback data`);
      return getFallbackData(symbol);
    }

    return {
      symbol: symbol,
      name: quoteData.name || symbol,
      price: parseFloat(priceData.price || quoteData.close),
      change: parseFloat(quoteData.change || 0),
      changePercent: parseFloat(quoteData.percent_change || 0)
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return getFallbackData(symbol);
  }
}

// ===== Fallback Data (when API fails) =====
function getFallbackData(symbol) {
  const fallbackData = {
    'AAPL': { name: 'Apple Inc.', price: 178.50, change: 2.35, changePercent: 1.33 },
    'GOOGL': { name: 'Alphabet Inc.', price: 142.80, change: -1.20, changePercent: -0.83 },
    'MSFT': { name: 'Microsoft Corp.', price: 378.90, change: 4.50, changePercent: 1.20 },
    'AMZN': { name: 'Amazon.com Inc.', price: 156.30, change: 1.80, changePercent: 1.16 },
    'TSLA': { name: 'Tesla Inc.', price: 242.80, change: -3.20, changePercent: -1.30 },
    'META': { name: 'Meta Platforms', price: 485.20, change: 5.60, changePercent: 1.17 }
  };

  const data = fallbackData[symbol] || { 
    name: symbol, 
    price: 100 + Math.random() * 100, 
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 5
  };

  return { symbol, ...data };
}

// ===== Create Stock Card HTML =====
function createStockCard(stock) {
  const isUp = stock.change >= 0;
  const inWatchlist = watchlist.includes(stock.symbol);
  
  return `
    <div class="stock-card" onclick="selectStock('${stock.symbol}')">
      <div class="stock-header">
        <div class="stock-info">
          <h3>${stock.name}</h3>
          <span class="stock-symbol">${stock.symbol}</span>
        </div>
        <button class="watchlist-btn" onclick="event.stopPropagation(); toggleWatchlist('${stock.symbol}')">
          ${inWatchlist ? '⭐' : '☆'}
        </button>
      </div>
      <div class="stock-price">$${stock.price.toFixed(2)}</div>
      <div class="stock-change ${isUp ? 'up' : 'down'}">
        ${isUp ? '▲' : '▼'} ${Math.abs(stock.change).toFixed(2)} (${Math.abs(stock.changePercent).toFixed(2)}%)
      </div>
    </div>
  `;
}

// ===== Toggle Watchlist =====
function toggleWatchlist(symbol) {
  const index = watchlist.indexOf(symbol);
  
  if (index === -1) {
    watchlist.push(symbol);
  } else {
    watchlist.splice(index, 1);
  }
  
  // Save to localStorage
  localStorage.setItem('stockWatchlist', JSON.stringify(watchlist));
  
  // Re-render
  loadPopularStocks();
  renderWatchlist();
}

// ===== Render Watchlist =====
async function renderWatchlist() {
  const grid = document.getElementById('watchlistGrid');
  const count = document.getElementById('watchlistCount');
  
  count.textContent = `${watchlist.length} stock${watchlist.length !== 1 ? 's' : ''}`;
  
  if (watchlist.length === 0) {
    grid.innerHTML = '<div class="empty-state">Add stocks to your watchlist</div>';
    return;
  }
  
  grid.innerHTML = '<div class="skeleton-card"></div>'.repeat(watchlist.length);
  
  try {
    const stocksData = await Promise.all(
      watchlist.map(symbol => fetchStockData(symbol))
    );
    
    grid.innerHTML = stocksData
      .filter(stock => stock !== null)
      .map(stock => createStockCard(stock))
      .join('');
  } catch (error) {
    console.error('Error loading watchlist:', error);
    grid.innerHTML = '<div class="empty-state">Failed to load watchlist</div>';
  }
}

// ===== Handle Search =====
async function handleSearch() {
  const input = document.getElementById('searchInput');
  const symbol = input.value.trim().toUpperCase();
  
  if (!symbol) return;
  
  try {
    const stock = await fetchStockData(symbol);
    
    if (stock) {
      // Add to popular stocks temporarily
      const grid = document.getElementById('stocksGrid');
      grid.insertAdjacentHTML('afterbegin', createStockCard(stock));
      
      // Select the stock
      selectStock(symbol);
      
      // Clear search
      input.value = '';
    }
  } catch (error) {
    alert('Stock not found. Please try another symbol.');
  }
}

// ===== Select Stock and Load Chart =====
async function selectStock(symbol) {
  selectedStock = symbol;
  const period = document.querySelector('.time-btn.active').dataset.period;
  
  // Update chart title
  document.getElementById('chartTitle').textContent = `${symbol} Stock Chart`;
  
  // Load chart data
  await loadStockChart(symbol, period);
}

// ===== Load Stock Chart =====
async function loadStockChart(symbol, period) {
  try {
    // Map period to API interval
    const intervalMap = {
      '1D': { interval: '5min', outputsize: 78 },
      '1W': { interval: '1h', outputsize: 168 },
      '1M': { interval: '1day', outputsize: 30 }
    };
    
    const { interval, outputsize } = intervalMap[period];
    
    // Fetch time series data
    const response = await fetch(
      `${API_BASE}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`
    );
    const data = await response.json();
    
    // Handle API errors - use fallback data
    if (data.status === 'error' || !data.values) {
      console.warn('API error, using fallback chart data');
      renderChart(generateFallbackChartData(period));
      return;
    }
    
    // Process data for chart
    const chartData = data.values.reverse().map(item => ({
      x: new Date(item.datetime),
      y: parseFloat(item.close)
    }));
    
    renderChart(chartData);
  } catch (error) {
    console.error('Error loading chart:', error);
    renderChart(generateFallbackChartData(period));
  }
}

// ===== Generate Fallback Chart Data =====
function generateFallbackChartData(period) {
  const now = new Date();
  const data = [];
  let points, interval;
  
  switch(period) {
    case '1D':
      points = 78;
      interval = 5 * 60 * 1000; // 5 minutes
      break;
    case '1W':
      points = 168;
      interval = 60 * 60 * 1000; // 1 hour
      break;
    case '1M':
      points = 30;
      interval = 24 * 60 * 60 * 1000; // 1 day
      break;
  }
  
  let basePrice = 150;
  
  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now - (i * interval));
    basePrice += (Math.random() - 0.5) * 5;
    data.push({ x: time, y: basePrice });
  }
  
  return data;
}

// ===== Render Chart =====
function renderChart(data) {
  const ctx = document.getElementById('stockChart').getContext('2d');
  
  // Destroy existing chart
  if (stockChart) {
    stockChart.destroy();
  }
  
  // Create new chart
  stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Price',
        data: data,
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#4F46E5'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleColor: '#fff',
          bodyColor: '#fff',
          callbacks: {
            label: (context) => `$${context.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'hour',
            displayFormats: {
              hour: 'HH:mm',
              day: 'MMM dd'
            }
          },
          grid: {
            display: false
          },
          ticks: {
            color: '#6B7280'
          }
        },
        y: {
          grid: {
            color: '#E5E7EB'
          },
          ticks: {
            color: '#6B7280',
            callback: (value) => `$${value.toFixed(0)}`
          }
        }
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      }
    }
  });
}

// ===== Update Last Update Time =====
function updateLastUpdateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
  document.getElementById('lastUpdate').textContent = timeString;
}

// ===== Auto Update =====
function startAutoUpdate() {
  updateTimer = setInterval(() => {
    loadPopularStocks();
    renderWatchlist();
    updateLastUpdateTime();
    
    // Reload chart if stock is selected
    if (selectedStock) {
      const period = document.querySelector('.time-btn.active').dataset.period;
      loadStockChart(selectedStock, period);
    }
  }, UPDATE_INTERVAL);
}

// ===== Cleanup on page unload =====
window.addEventListener('beforeunload', () => {
  if (updateTimer) {
    clearInterval(updateTimer);
  }
});
