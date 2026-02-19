// API Configuration
const API_BASE = 'https://api.coingecko.com/api/v3';
const UPDATE_INTERVAL = 10000; // 10 seconds
let cryptoData = [];
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
let selectedCoin = null;
let priceChart = null;
let updateTimer = null;

// Initialize
window.onload = () => {
    fetchCryptoData();
    renderWatchlist();
    renderPortfolio();
    startAutoUpdate();
    setupSearch();
    setupKeyboardShortcuts();
};

// Fetch Crypto Data
async function fetchCryptoData() {
    try {
        const response = await fetch(`${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        cryptoData = data;
        renderCryptoList(data);
        updateTopMovers(data);
        updateLastUpdate();
        
        if (selectedCoin) {
            const coin = data.find(c => c.id === selectedCoin);
            if (coin) updateChart(coin);
        }
    } catch (error) {
        showAlert('Failed to fetch data. Using cached data.', 'error');
        loadOfflineData();
    }
}

// Render Crypto List
function renderCryptoList(data) {
    const grid = document.getElementById('cryptoGrid');
    grid.innerHTML = data.map(coin => `
        <div class="crypto-card" onclick="selectCoin('${coin.id}')">
            <div class="crypto-info">
                <img src="${coin.image}" alt="${coin.name}" class="crypto-icon">
                <div>
                    <div class="crypto-name">${coin.name}</div>
                    <div class="crypto-symbol">${coin.symbol.toUpperCase()}</div>
                </div>
            </div>
            <canvas class="sparkline" id="spark-${coin.id}"></canvas>
            <div class="crypto-price">
                <div class="price">$${formatPrice(coin.current_price)}</div>
                <div class="change ${coin.price_change_percentage_24h >= 0 ? 'up' : 'down'}">
                    ${coin.price_change_percentage_24h >= 0 ? '↑' : '↓'} ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </div>
            </div>
            <button class="watchlist-btn" onclick="event.stopPropagation(); toggleWatchlist('${coin.id}')">
                ${watchlist.includes(coin.id) ? '⭐' : '☆'}
            </button>
        </div>
    `).join('');
    
    // Draw sparklines
    setTimeout(() => {
        data.forEach(coin => drawSparkline(coin));
    }, 100);
    
    // Save to localStorage for offline
    localStorage.setItem('cryptoData', JSON.stringify(data));
}

// Draw Sparkline
function drawSparkline(coin) {
    const canvas = document.getElementById(`spark-${coin.id}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const prices = coin.sparkline_in_7d.price.slice(-24);
    const width = canvas.width = 80;
    const height = canvas.height = 30;
    
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;
    
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = coin.price_change_percentage_24h >= 0 ? '#00ff88' : '#ff4757';
    ctx.lineWidth = 2;
    
    prices.forEach((price, i) => {
        const x = (i / (prices.length - 1)) * width;
        const y = height - ((price - min) / range) * height;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    
    ctx.stroke();
}

// Select Coin & Update Chart
async function selectCoin(coinId) {
    selectedCoin = coinId;
    const coin = cryptoData.find(c => c.id === coinId);
    if (!coin) return;
    
    document.getElementById('chartTitle').textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
    await fetchChartData(coinId, 1);
}

// Fetch Chart Data
async function fetchChartData(coinId, hours) {
    try {
        const days = hours === 1 ? 1 : hours === 24 ? 1 : 7;
        const response = await fetch(`${API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        let prices = data.prices.map(p => ({ x: p[0], y: p[1] }));
        
        // Filter based on hours
        if (hours === 1) {
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            prices = prices.filter(p => p.x >= oneHourAgo);
        } else if (hours === 24) {
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            prices = prices.filter(p => p.x >= oneDayAgo);
        }
        
        renderChart(prices);
        calculateIndicators(prices);
    } catch (error) {
        console.error('Chart error:', error);
        showAlert('Failed to load chart data', 'error');
    }
}

// Render Chart
function renderChart(prices) {
    const canvas = document.getElementById('priceChart');
    const ctx = canvas.getContext('2d');
    
    if (priceChart) priceChart.destroy();
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Price (USD)',
                data: prices,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#00d4ff'
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
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#00d4ff',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => '$' + context.parsed.y.toFixed(2)
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
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9fa8da' }
                },
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#9fa8da',
                        callback: (value) => '$' + value.toFixed(2)
                    }
                }
            }
        }
    });
}

// Calculate Indicators
function calculateIndicators(prices) {
    const values = prices.map(p => p.y);
    const movingAvg = values.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const trend = values[values.length - 1] > values[0] ? 'Uptrend ↗' : 'Downtrend ↘';
    const momentum = ((values[values.length - 1] - values[0]) / values[0]) * 100;
    
    document.getElementById('movingAvg').textContent = '$' + movingAvg.toFixed(2);
    document.getElementById('trendIndicator').textContent = trend;
    document.getElementById('trendIndicator').style.color = trend.includes('Up') ? '#00ff88' : '#ff4757';
    
    const momentumFill = document.getElementById('momentumFill');
    momentumFill.style.width = Math.min(Math.abs(momentum) * 10, 100) + '%';
    momentumFill.style.background = momentum > 0 ? '#00ff88' : '#ff4757';
}

// Time Filter Buttons
document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (selectedCoin) fetchChartData(selectedCoin, parseInt(btn.dataset.time));
    });
});

// Top Movers
function updateTopMovers(data) {
    const sorted = [...data].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    const gainer = sorted[0];
    const loser = sorted[sorted.length - 1];
    
    document.getElementById('topGainer').innerHTML = `
        <div>${gainer.name}</div>
        <div style="color: #00ff88; font-size: 20px;">+${gainer.price_change_percentage_24h.toFixed(2)}%</div>
    `;
    
    document.getElementById('topLoser').innerHTML = `
        <div>${loser.name}</div>
        <div style="color: #ff4757; font-size: 20px;">${loser.price_change_percentage_24h.toFixed(2)}%</div>
    `;
}

// Watchlist
function toggleWatchlist(coinId) {
    if (watchlist.includes(coinId)) {
        watchlist = watchlist.filter(id => id !== coinId);
    } else {
        watchlist.push(coinId);
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderWatchlist();
    renderCryptoList(cryptoData);
}

function renderWatchlist() {
    const grid = document.getElementById('watchlistGrid');
    document.getElementById('watchlistCount').textContent = watchlist.length;
    
    if (watchlist.length === 0) {
        grid.innerHTML = '<p class="empty-state">Add coins to your watchlist</p>';
        return;
    }
    
    const coins = cryptoData.filter(c => watchlist.includes(c.id));
    grid.innerHTML = coins.map(coin => `
        <div class="crypto-card" onclick="selectCoin('${coin.id}')">
            <div class="crypto-info">
                <img src="${coin.image}" alt="${coin.name}" class="crypto-icon" style="width:30px;height:30px">
                <div>
                    <div class="crypto-name" style="font-size:14px">${coin.name}</div>
                    <div class="crypto-symbol">${coin.symbol.toUpperCase()}</div>
                </div>
            </div>
            <div class="crypto-price">
                <div class="price" style="font-size:16px">$${formatPrice(coin.current_price)}</div>
                <div class="change ${coin.price_change_percentage_24h >= 0 ? 'up' : 'down'}">
                    ${coin.price_change_percentage_24h >= 0 ? '↑' : '↓'} ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </div>
            </div>
        </div>
    `).join('');
}

// Portfolio
function openPortfolioModal() {
    const modal = document.getElementById('portfolioModal');
    const select = document.getElementById('coinSelect');
    select.innerHTML = cryptoData.map(c => `<option value="${c.id}">${c.name} (${c.symbol.toUpperCase()})</option>`).join('');
    modal.classList.add('active');
}

function closePortfolioModal() {
    document.getElementById('portfolioModal').classList.remove('active');
}

function addToPortfolio(e) {
    e.preventDefault();
    const coinId = document.getElementById('coinSelect').value;
    const amount = parseFloat(document.getElementById('amountInput').value);
    
    portfolio.push({ coinId, amount });
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    renderPortfolio();
    closePortfolioModal();
    showAlert('Added to portfolio!', 'success');
}

function renderPortfolio() {
    const list = document.getElementById('portfolioList');
    let total = 0;
    
    list.innerHTML = portfolio.map((item, idx) => {
        const coin = cryptoData.find(c => c.id === item.coinId);
        if (!coin) return '';
        const value = coin.current_price * item.amount;
        total += value;
        return `
            <div class="portfolio-item">
                <div>
                    <div>${coin.name}</div>
                    <div style="font-size:12px;color:#9fa8da">${item.amount} ${coin.symbol.toUpperCase()}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-weight:700">$${value.toFixed(2)}</div>
                    <button onclick="removeFromPortfolio(${idx})" style="background:transparent;border:none;color:#ff4757;cursor:pointer">✕</button>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('portfolioTotal').textContent = '$' + total.toFixed(2);
}

function removeFromPortfolio(idx) {
    portfolio.splice(idx, 1);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    renderPortfolio();
}

// Search
function setupSearch() {
    const input = document.getElementById('searchInput');
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = cryptoData.filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.symbol.toLowerCase().includes(query)
        );
        renderCryptoList(filtered);
    });
}

// Auto Update
function startAutoUpdate() {
    updateTimer = setInterval(fetchCryptoData, UPDATE_INTERVAL);
}

function updateLastUpdate() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
}

// Intensity Toggle
let intensity = 1;
function toggleIntensity() {
    intensity = intensity === 1 ? 0.7 : 1;
    document.documentElement.style.setProperty('--intensity', intensity);
}

// Fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    });
}

// Alert
function showAlert(message, type) {
    const popup = document.getElementById('alertPopup');
    popup.textContent = message;
    popup.style.borderLeft = `4px solid ${type === 'success' ? '#00ff88' : '#ff4757'}`;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 3000);
}

// Offline Data
function loadOfflineData() {
    const cached = localStorage.getItem('cryptoData');
    if (cached) {
        cryptoData = JSON.parse(cached);
        renderCryptoList(cryptoData);
        updateTopMovers(cryptoData);
    }
}

// Utilities
function formatPrice(price) {
    return price >= 1 ? price.toFixed(2) : price.toFixed(6);
}
