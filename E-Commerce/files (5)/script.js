/* ============================================================
   SHOPWAVE - Complete Application JavaScript
   All pages, routing, cart, orders, tracking, auth
   ============================================================ */

// ============================================================
// GLOBAL STATE
// ============================================================
let PRODUCTS = [];
let currentUser = null;
let cart = [];
let wishlist = [];
let recentlyViewed = [];
let orders = [];
let currentPage = 'login';
let productFilter = { category: 'All', search: '', sort: 'featured', maxPrice: 200000, minRating: 0 };
let cartDiscount = 0;
let appliedCoupon = null;
let modalQtyValue = 1;
let modalProduct = null;

/* Valid coupon codes */
const COUPONS = {
  'SAVE10':    { type: 'percent', value: 10,  label: '10% off' },
  'FLAT500':   { type: 'flat',    value: 500, label: '₹500 off' },
  'WELCOME20': { type: 'percent', value: 20,  label: '20% off' },
  'SHOPWAVE':  { type: 'flat',    value: 200, label: '₹200 off' }
};

/* Indian cities with GPS coordinates for map tracking */
const INDIA_CITIES = {
  Mumbai:    { lat: 19.0760, lng: 72.8777 },
  Delhi:     { lat: 28.6139, lng: 77.2090 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Chennai:   { lat: 13.0827, lng: 80.2707 },
  Kolkata:   { lat: 22.5726, lng: 88.3639 },
  Pune:      { lat: 18.5204, lng: 73.8567 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Jaipur:    { lat: 26.9124, lng: 75.7873 },
  Surat:     { lat: 21.1702, lng: 72.8311 },
  Nagpur:    { lat: 21.1458, lng: 79.0882 },
  Lucknow:   { lat: 26.8467, lng: 80.9462 },
  Chandigarh:{ lat: 30.7333, lng: 76.7794 },
  Indore:    { lat: 22.7196, lng: 75.8577 },
  Patna:     { lat: 25.5941, lng: 85.1376 },
  Bhopal:    { lat: 23.2599, lng: 77.4126 },
  Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  Kochi:     { lat: 9.9312,  lng: 76.2673 }
};

// ============================================================
// APP BOOTSTRAP
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  loadState();
  buildNavbar();
  buildMobileNav();

  // Show login if no user, else home
  if (currentUser) {
    showPage('home');
    renderHome();
  } else {
    showPage('login');
    renderLogin();
  }
});

/* Load products from JSON file */
async function loadProducts() {
  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error('fetch failed');
    PRODUCTS = await res.json();
  } catch (e) {
    // Fallback inline data if fetch fails (e.g. opened as file://)
    PRODUCTS = getFallbackProducts();
  }
}

/* Load persisted state from localStorage */
function loadState() {
  currentUser    = JSON.parse(localStorage.getItem('sw_user')    || 'null');
  cart           = JSON.parse(localStorage.getItem('sw_cart')    || '[]');
  wishlist       = JSON.parse(localStorage.getItem('sw_wish')    || '[]');
  recentlyViewed = JSON.parse(localStorage.getItem('sw_recent')  || '[]');
  orders         = JSON.parse(localStorage.getItem('sw_orders')  || '[]');
}

/* Persist state */
function saveState() {
  localStorage.setItem('sw_cart',    JSON.stringify(cart));
  localStorage.setItem('sw_wish',    JSON.stringify(wishlist));
  localStorage.setItem('sw_recent',  JSON.stringify(recentlyViewed));
  localStorage.setItem('sw_orders',  JSON.stringify(orders));
}

/* Show a specific page div, hide others */
function showPage(name) {
  currentPage = name;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + name);
  if (el) { el.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  updateNavHighlight();
  updateBadges();
}

/* Navigate to a page and render it */
function goTo(page, data) {
  if (!currentUser && page !== 'login' && page !== 'register') {
    renderLogin(); showPage('login'); return;
  }
  switch (page) {
    case 'login':    renderLogin();        showPage('login');    break;
    case 'home':     renderHome();         showPage('home');     break;
    case 'products': renderProducts(data); showPage('products'); break;
    case 'cart':     renderCart();         showPage('cart');     break;
    case 'checkout': renderCheckout();     showPage('checkout'); break;
    case 'orders':   renderOrders();       showPage('orders');   break;
    case 'wishlist': renderWishlist();     showPage('wishlist'); break;
    case 'tracking': renderTracking(data); showPage('tracking'); break;
    case 'success':  renderSuccess(data);  showPage('success');  break;
    default:         renderHome();         showPage('home');
  }
}

// ============================================================
// NAVBAR
// ============================================================
function buildNavbar() {
  const nav = document.getElementById('navbar');
  nav.innerHTML = `
    <div class="nav-inner">
      <div class="nav-logo" onclick="goTo('home')">🛍️ Shop<span>Wave</span></div>
      <div class="nav-search" id="navSearchWrap" style="${currentUser ? '' : 'display:none'}">
        <div class="search-icon-wrap">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <input type="text" id="navSearch" placeholder="Search products, brands…" autocomplete="off">
        <div class="search-dropdown" id="searchDrop"></div>
      </div>
      <div class="nav-links" id="navLinks"></div>
    </div>`;
  refreshNavLinks();
  const inp = document.getElementById('navSearch');
  if (inp) {
    inp.addEventListener('input', handleSearch);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { productFilter.search = e.target.value; closeDrop(); goTo('products'); }});
    inp.addEventListener('blur', () => setTimeout(closeDrop, 200));
  }
}

function refreshNavLinks() {
  const wrap = document.getElementById('navLinks');
  if (!wrap) return;
  const sw = document.getElementById('navSearchWrap');
  if (sw) sw.style.display = currentUser ? '' : 'none';

  if (!currentUser) {
    wrap.innerHTML = '';
    return;
  }

  const cc = cart.reduce((a, i) => a + i.qty, 0);
  const wc = wishlist.length;
  const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);

  wrap.innerHTML = `
    <button class="nav-btn" id="nb-home"    onclick="goTo('home')">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
      <span>Home</span>
    </button>
    <button class="nav-btn" id="nb-wish"    onclick="goTo('wishlist')">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      <span>Wishlist</span>
      <span class="badge ${wc > 0 ? 'show' : ''}" id="nb-wish-badge">${wc}</span>
    </button>
    <button class="nav-btn" id="nb-cart"    onclick="goTo('cart')">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <span>Cart</span>
      <span class="badge ${cc > 0 ? 'show' : ''}" id="nb-cart-badge">${cc}</span>
    </button>
    <button class="nav-btn" id="nb-orders"  onclick="goTo('orders')">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      <span>Orders</span>
    </button>
    <div class="nav-user" id="navUser" onclick="toggleUserMenu()">
      <div class="user-avatar">${initials}</div>
      <span>${currentUser.name.split(' ')[0]}</span>
    </div>`;
  updateNavHighlight();
}

function buildMobileNav() {
  const mn = document.getElementById('mobile-nav');
  if (!mn) return;
  mn.innerHTML = `
    <div class="mobile-nav-inner">
      <div class="mob-nav-btn" id="mn-home"   onclick="goTo('home')">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
        Home
      </div>
      <div class="mob-nav-btn" id="mn-products" onclick="goTo('products')">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/></svg>
        Shop
      </div>
      <div class="mob-nav-btn" id="mn-cart" onclick="goTo('cart')" style="position:relative">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        Cart
        <span class="badge" id="mn-cart-badge"></span>
      </div>
      <div class="mob-nav-btn" id="mn-wish" onclick="goTo('wishlist')">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Wishlist
      </div>
      <div class="mob-nav-btn" id="mn-orders" onclick="goTo('orders')">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
        Orders
      </div>
    </div>`;
  mn.style.display = currentUser ? 'block' : 'none';
}

function updateNavHighlight() {
  const map = { home:'nb-home', wishlist:'nb-wish', cart:'nb-cart', orders:'nb-orders', products:'nb-products' };
  Object.values(map).forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('active'); });
  const active = map[currentPage];
  if (active) { const el = document.getElementById(active); if (el) el.classList.add('active'); }
  ['mn-home','mn-products','mn-cart','mn-wish','mn-orders'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const mnMap = { home:'mn-home', products:'mn-products', cart:'mn-cart', wishlist:'mn-wish', orders:'mn-orders' };
  const mnActive = mnMap[currentPage];
  if (mnActive) { const el = document.getElementById(mnActive); if (el) el.classList.add('active'); }
}

function updateBadges() {
  const cc = cart.reduce((a, i) => a + i.qty, 0);
  const wc = wishlist.length;
  ['nb-cart-badge','mn-cart-badge'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = cc; el.classList.toggle('show', cc > 0); }
  });
  const wb = document.getElementById('nb-wish-badge');
  if (wb) { wb.textContent = wc; wb.classList.toggle('show', wc > 0); }
}

function toggleUserMenu() {
  const existing = document.getElementById('userMenuDrop');
  if (existing) { existing.remove(); return; }
  const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const div = document.createElement('div');
  div.id = 'userMenuDrop';
  div.className = 'user-menu-drop';
  div.innerHTML = `
    <div class="user-menu-head">
      <div class="user-menu-name">${currentUser.name}</div>
      <div class="user-menu-email">${currentUser.email}</div>
    </div>
    <div class="user-menu-items">
      <div class="user-menu-item" onclick="goTo('orders');document.getElementById('userMenuDrop')?.remove()">📦 My Orders</div>
      <div class="user-menu-item" onclick="goTo('wishlist');document.getElementById('userMenuDrop')?.remove()">❤️ Wishlist</div>
      <div class="user-menu-item danger" onclick="logout()">🚪 Logout</div>
    </div>`;
  document.body.appendChild(div);
  setTimeout(() => document.addEventListener('click', () => div.remove(), { once: true }), 100);
}

function handleSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  const dd = document.getElementById('searchDrop');
  if (!dd) return;
  if (!q) { dd.classList.remove('show'); return; }
  const matches = PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  ).slice(0, 6);
  if (!matches.length) { dd.classList.remove('show'); return; }
  dd.innerHTML = matches.map(p => `
    <div class="search-item" onclick="openProductModal(${p.id});closeDrop()">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      ${p.title} &mdash; <strong>${fmt(p.price)}</strong>
    </div>`).join('');
  dd.classList.add('show');
}

function closeDrop() {
  const dd = document.getElementById('searchDrop');
  if (dd) dd.classList.remove('show');
  const inp = document.getElementById('navSearch');
  if (inp && productFilter.search) inp.value = '';
}

// ============================================================
// AUTH
// ============================================================
function renderLogin() {
  const pg = document.getElementById('page-login');
  pg.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">🛍️ ShopWave</div>
        <div class="auth-subtitle">Your premium shopping destination across India</div>
        <div class="auth-tabs">
          <div class="auth-tab active" id="tab-login"    onclick="switchTab('login')">Login</div>
          <div class="auth-tab"        id="tab-register" onclick="switchTab('register')">Register</div>
        </div>

        <!-- LOGIN FORM -->
        <div id="form-login">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="li-email" placeholder="you@example.com">
            <div class="form-error" id="li-email-err"></div>
          </div>
          <div class="form-group">
            <label>Password</label>
            <div class="pw-wrap">
              <input type="password" id="li-pass" placeholder="Your password">
              <button class="pw-toggle" onclick="togglePwd('li-pass',this)">👁</button>
            </div>
            <div class="form-error" id="li-pass-err"></div>
          </div>
          <button class="btn-primary" onclick="doLogin(event)">Sign In</button>
        </div>

        <!-- REGISTER FORM -->
        <div id="form-register" style="display:none">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="rg-name" placeholder="John Doe">
            <div class="form-error" id="rg-name-err"></div>
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="rg-email" placeholder="you@example.com">
            <div class="form-error" id="rg-email-err"></div>
          </div>
          <div class="form-group">
            <label>Password</label>
            <div class="pw-wrap">
              <input type="password" id="rg-pass" placeholder="Min 8 chars, include a number" oninput="checkStrength(this.value)">
              <button class="pw-toggle" onclick="togglePwd('rg-pass',this)">👁</button>
            </div>
            <div class="strength-bars">
              <div class="s-bar" id="sb1"></div><div class="s-bar" id="sb2"></div>
              <div class="s-bar" id="sb3"></div><div class="s-bar" id="sb4"></div>
            </div>
            <div class="form-error" id="rg-pass-err"></div>
          </div>
          <div class="form-group">
            <label>Confirm Password</label>
            <div class="pw-wrap">
              <input type="password" id="rg-confirm" placeholder="Re-enter password">
              <button class="pw-toggle" onclick="togglePwd('rg-confirm',this)">👁</button>
            </div>
            <div class="form-error" id="rg-confirm-err"></div>
          </div>
          <button class="btn-primary" onclick="doRegister(event)">Create Account</button>
        </div>
      </div>
    </div>`;
}

function switchTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('form-login').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
}

function doLogin(e) {
  addRipple(e);
  const email = val('li-email'), pass = val('li-pass');
  let ok = true;
  if (!isEmail(email)) { showErr('li-email-err', 'Enter a valid email'); ok = false; } else hideErr('li-email-err');
  if (pass.length < 6)  { showErr('li-pass-err',  'Password too short');  ok = false; } else hideErr('li-pass-err');
  if (!ok) return;
  const users = JSON.parse(localStorage.getItem('sw_users') || '[]');
  const user  = users.find(u => u.email === email && u.password === pass);
  if (!user) { showErr('li-pass-err', 'Invalid email or password'); return; }
  loginUser(user);
}

function doRegister(e) {
  addRipple(e);
  const name = val('rg-name'), email = val('rg-email'), pass = val('rg-pass'), confirm = val('rg-confirm');
  let ok = true;
  if (name.length < 2)    { showErr('rg-name-err',    'Enter your full name'); ok = false; }    else hideErr('rg-name-err');
  if (!isEmail(email))    { showErr('rg-email-err',   'Enter a valid email');  ok = false; }    else hideErr('rg-email-err');
  if (pass.length < 8)    { showErr('rg-pass-err',    'Min 8 characters');     ok = false; }
  else if (!/\d/.test(pass)) { showErr('rg-pass-err', 'Include at least 1 number'); ok = false; }
  else                    { hideErr('rg-pass-err'); }
  if (pass !== confirm)   { showErr('rg-confirm-err', 'Passwords do not match'); ok = false; } else hideErr('rg-confirm-err');
  if (!ok) return;
  const users = JSON.parse(localStorage.getItem('sw_users') || '[]');
  if (users.find(u => u.email === email)) { showErr('rg-email-err', 'Email already registered'); return; }
  users.push({ name, email, password: pass });
  localStorage.setItem('sw_users', JSON.stringify(users));
  loginUser({ name, email });
}

function loginUser(user) {
  currentUser = { name: user.name, email: user.email };
  localStorage.setItem('sw_user', JSON.stringify(currentUser));
  refreshNavLinks();
  buildMobileNav();
  document.getElementById('mobile-nav').style.display = 'block';
  showToast('Welcome, ' + user.name.split(' ')[0] + '! 🎉', 'success');
  renderHome(); showPage('home');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('sw_user');
  document.getElementById('userMenuDrop')?.remove();
  document.getElementById('mobile-nav').style.display = 'none';
  refreshNavLinks();
  renderLogin(); showPage('login');
  showToast('Logged out successfully', 'info');
}

function checkStrength(v) {
  ['sb1','sb2','sb3','sb4'].forEach(id => { const el = document.getElementById(id); if (el) el.className = 's-bar'; });
  if (!v) return;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  const cls = s <= 1 ? 'weak' : s <= 2 ? 'fair' : 'good';
  ['sb1','sb2','sb3','sb4'].slice(0, s).forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.add(cls);
  });
}

// ============================================================
// HOME PAGE
// ============================================================
function renderHome() {
  const featured = PRODUCTS.filter(p => p.featured).slice(0, 4);
  const categories = [...new Set(PRODUCTS.map(p => p.category))];
  const catEmojis = { Electronics:'📱', Footwear:'👟', Fashion:'👗', 'Home & Kitchen':'🏠', Sports:'⚽', Beauty:'💄' };

  document.getElementById('page-home').innerHTML = `
    <div class="content-wrap">

      <!-- HERO -->
      <div class="home-hero">
        <div class="hero-inner">
          <div>
            <div class="hero-title">Shop the <span class="highlight">Best Deals</span><br>Delivered to You</div>
            <div class="hero-subtitle">Discover thousands of premium products at unbeatable prices with fast delivery across India.</div>
            <div class="hero-ctas">
              <button class="btn-hero-primary" onclick="goTo('products')">
                Shop Now
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button class="btn-hero-secondary" onclick="document.getElementById('feat-section').scrollIntoView({behavior:'smooth'})">
                View Deals
              </button>
            </div>
            <div class="hero-stats">
              <div class="hero-stat"><div class="stat-num">50K+</div><div class="stat-label">Products</div></div>
              <div class="hero-stat"><div class="stat-num">2M+</div><div class="stat-label">Customers</div></div>
              <div class="hero-stat"><div class="stat-num">99%</div><div class="stat-label">Satisfaction</div></div>
            </div>
          </div>
          <div class="hero-img-wrap">
            <img class="hero-img-main" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80" alt="Shopping" onerror="this.style.background='#FFE0D0';this.src=''">
            <div class="hero-badge-float">
              <span class="badge-icon">🚀</span>
              <div><div class="badge-title">Free Shipping</div><div class="badge-sub">On orders over ₹999</div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- CATEGORIES -->
      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title">Shop by Category</div>
            <div class="section-subtitle">Browse your favourite collections</div>
          </div>
        </div>
        <div class="categories-grid">
          ${categories.map(c => `
            <div class="cat-card" onclick="filterByCat('${c}')">
              <div class="cat-icon">${catEmojis[c] || '🛍️'}</div>
              <div class="cat-name">${c}</div>
              <div class="cat-count">${PRODUCTS.filter(p => p.category === c).length} items</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- FEATURED PRODUCTS -->
      <div class="section" id="feat-section">
        <div class="section-header">
          <div>
            <div class="section-title">Featured Products</div>
            <div class="section-subtitle">Handpicked deals just for you</div>
          </div>
          <button class="see-all-btn" onclick="goTo('products')">
            See all <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        <div class="products-grid">${renderProductCards(featured)}</div>
      </div>

      <!-- RECENTLY VIEWED -->
      ${renderRecentlySection()}

      <!-- PROMO BANNER -->
      <div class="promo-banner">
        <div class="promo-inner">
          <div class="promo-title">🎁 Use Code WELCOME20</div>
          <div class="promo-sub">Get 20% off on your first order. Limited time offer!</div>
          <button class="btn-promo" onclick="goTo('products')">Shop Now</button>
        </div>
      </div>

      ${renderFooter()}
    </div>`;
}

function renderRecentlySection() {
  const items = recentlyViewed.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 8);
  if (!items.length) return '';
  return `
    <div class="recently-section">
      <div class="section" style="padding-top:0;padding-bottom:8px;">
        <div class="section-header"><div class="section-title">Recently Viewed</div></div>
      </div>
      <div class="recently-scroll">
        ${items.map(p => `
          <div class="recently-card" onclick="openProductModal(${p.id})">
            <img src="${p.images[0]}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/200'">
            <div class="recently-card-body">
              <div class="recently-card-title">${p.title}</div>
              <div class="recently-card-price">${fmt(p.price)}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function filterByCat(cat) { productFilter.category = cat; goTo('products'); }

// ============================================================
// PRODUCTS LISTING PAGE
// ============================================================
function renderProducts(data) {
  if (data && data.category) productFilter.category = data.category;
  const cats = ['All', ...new Set(PRODUCTS.map(p => p.category))];

  document.getElementById('page-products').innerHTML = `
    <div class="content-wrap">
      <div class="listing-layout">
        <!-- FILTER SIDEBAR -->
        <aside class="filter-sidebar">
          <div class="filter-title">Filters <button class="filter-clear" onclick="clearFilters()">Clear all</button></div>
          <div class="filter-section">
            <div class="filter-section-title">Category</div>
            ${cats.map(c => `
              <div class="filter-option">
                <input type="checkbox" id="fc-${c.replace(/\s/g,'_')}" onchange="onCatCheck('${c}',this.checked)" ${productFilter.category === c || (productFilter.category === 'All' && c === 'All') ? 'checked' : ''}>
                <label for="fc-${c.replace(/\s/g,'_')}">${c}</label>
              </div>`).join('')}
          </div>
          <div class="filter-section">
            <div class="filter-section-title">Max Price</div>
            <div class="price-range">
              <input type="range" min="0" max="200000" step="500" value="${productFilter.maxPrice}" oninput="onPriceChange(this.value)">
              <div class="price-values"><span>₹0</span><span id="price-val">${fmt(productFilter.maxPrice)}</span></div>
            </div>
          </div>
          <div class="filter-section">
            <div class="filter-section-title">Min Rating</div>
            ${[4,3,2].map(r => `
              <div class="filter-option">
                <input type="checkbox" id="fr-${r}" onchange="onRatingCheck(${r},this.checked)" ${productFilter.minRating === r ? 'checked' : ''}>
                <label for="fr-${r}">${'⭐'.repeat(r)} & above</label>
              </div>`).join('')}
          </div>
        </aside>

        <!-- MAIN CONTENT -->
        <div>
          <div class="listing-header">
            <div>
              <div class="listing-title">All Products</div>
              <div class="listing-meta" id="prod-meta">Loading…</div>
            </div>
            <select class="sort-select" onchange="productFilter.sort=this.value;refreshProductGrid()">
              <option value="featured"   ${productFilter.sort==='featured'  ?'selected':''}>Featured</option>
              <option value="price-asc"  ${productFilter.sort==='price-asc' ?'selected':''}>Price: Low → High</option>
              <option value="price-desc" ${productFilter.sort==='price-desc'?'selected':''}>Price: High → Low</option>
              <option value="rating"     ${productFilter.sort==='rating'    ?'selected':''}>Top Rated</option>
              <option value="name"       ${productFilter.sort==='name'      ?'selected':''}>Name A–Z</option>
            </select>
          </div>
          <div class="cat-pills" id="catPills">
            ${cats.map(c => `
              <div class="cat-pill ${productFilter.category === c || (productFilter.category === 'All' && c === 'All') ? 'active' : ''}" onclick="onPillClick('${c}')">${c}</div>`).join('')}
          </div>
          <div class="products-grid" id="prod-grid">
            ${renderSkeletons(8)}
          </div>
        </div>
      </div>
      ${renderFooter()}
    </div>`;

  setTimeout(refreshProductGrid, 450);
}

function refreshProductGrid() {
  let list = [...PRODUCTS];
  if (productFilter.category && productFilter.category !== 'All')
    list = list.filter(p => p.category === productFilter.category);
  if (productFilter.search)
    list = list.filter(p =>
      p.title.toLowerCase().includes(productFilter.search.toLowerCase()) ||
      p.brand.toLowerCase().includes(productFilter.search.toLowerCase()));
  if (productFilter.maxPrice)
    list = list.filter(p => p.price <= productFilter.maxPrice);
  if (productFilter.minRating)
    list = list.filter(p => p.rating >= productFilter.minRating);
  switch(productFilter.sort) {
    case 'price-asc':  list.sort((a,b)=>a.price-b.price); break;
    case 'price-desc': list.sort((a,b)=>b.price-a.price); break;
    case 'rating':     list.sort((a,b)=>b.rating-a.rating); break;
    case 'name':       list.sort((a,b)=>a.title.localeCompare(b.title)); break;
  }
  const meta = document.getElementById('prod-meta');
  if (meta) meta.textContent = `${list.length} product${list.length !== 1 ? 's' : ''} found`;
  const grid = document.getElementById('prod-grid');
  if (!grid) return;
  grid.innerHTML = list.length ? renderProductCards(list) : `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-title">No products found</div>
      <div class="empty-state-text">Try different filters or search terms.</div>
      <button class="btn-empty" onclick="clearFilters()">Clear Filters</button>
    </div>`;
}

function renderProductCards(products) {
  return products.map(p => {
    const disc = Math.round((1 - p.price / p.originalPrice) * 100);
    const stockPct = Math.min(100, Math.round((p.stock / 60) * 100));
    const stockCls = stockPct < 20 ? 'stock-critical' : stockPct < 50 ? 'stock-low' : '';
    const inWish = wishlist.includes(p.id);
    const inCart = cart.find(c => c.id === p.id);
    return `
      <div class="product-card" onclick="openProductModal(${p.id})">
        <div class="product-img-wrap">
          <img src="${p.images[0]}" alt="${p.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80'">
          ${disc > 5 ? `<div class="product-badge">-${disc}%</div>` : ''}
          ${p.stock === 0 ? `<div class="product-badge out-of-stock">Out of Stock</div>` : ''}
          <button class="wishlist-btn ${inWish ? 'wishlisted' : ''}" onclick="toggleWish(event,${p.id})" title="${inWish ? 'Remove from wishlist' : 'Add to wishlist'}">
            <svg width="14" height="14" fill="${inWish ? '#FF3B30' : 'none'}" viewBox="0 0 24 24" stroke="${inWish ? '#FF3B30' : 'currentColor'}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
        <div class="product-info">
          <div class="product-brand">${p.brand}</div>
          <div class="product-title">${p.title}</div>
          <div class="product-rating">
            <div class="stars">${buildStars(p.rating)}</div>
            <span class="rating-text">(${p.reviews.toLocaleString('en-IN')})</span>
          </div>
          <div class="product-price-row">
            <span class="product-price">${fmt(p.price)}</span>
            <span class="product-price-orig">${fmt(p.originalPrice)}</span>
            <span class="product-discount">${disc}% off</span>
          </div>
          <div class="stock-bar">
            <div class="stock-label">
              <span>${p.stock < 10 ? `Only ${p.stock} left!` : 'In Stock'}</span>
              <span>${stockPct}%</span>
            </div>
            <div class="stock-track">
              <div class="stock-fill ${stockCls}" style="width:${stockPct}%"></div>
            </div>
          </div>
          <button class="add-to-cart-btn" ${p.stock === 0 ? 'disabled' : ''} onclick="addToCart(event,${p.id})">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            ${p.stock === 0 ? 'Out of Stock' : inCart ? 'Add More' : 'Add to Cart'}
          </button>
        </div>
      </div>`;
  }).join('');
}

function renderSkeletons(n) {
  return Array(n).fill(0).map(() => `
    <div class="skel-card">
      <div class="skel-img skeleton"></div>
      <div class="skel-body">
        <div class="skel-line short skeleton"></div>
        <div class="skel-line medium skeleton"></div>
        <div class="skel-line short skeleton"></div>
        <div class="skel-line skeleton" style="height:32px;border-radius:50px;margin-top:4px;"></div>
      </div>
    </div>`).join('');
}

function onCatCheck(cat, checked) {
  productFilter.category = checked ? cat : 'All';
  document.querySelectorAll('[id^="fc-"]').forEach(cb => { cb.checked = cb.id === `fc-${cat.replace(/\s/g,'_')}` && checked; });
  if (!checked) { const el = document.getElementById('fc-All'); if (el) el.checked = true; }
  refreshProductGrid();
}

function onPillClick(cat) {
  productFilter.category = cat;
  document.querySelectorAll('.cat-pill').forEach(el => el.classList.toggle('active', el.textContent.trim() === cat));
  refreshProductGrid();
}

function onPriceChange(v) {
  productFilter.maxPrice = parseInt(v);
  const el = document.getElementById('price-val');
  if (el) el.textContent = fmt(v);
  refreshProductGrid();
}

function onRatingCheck(r, checked) {
  productFilter.minRating = checked ? r : 0;
  refreshProductGrid();
}

function clearFilters() {
  productFilter = { category: 'All', search: '', sort: 'featured', maxPrice: 200000, minRating: 0 };
  renderProducts(); showPage('products');
}

// ============================================================
// PRODUCT MODAL
// ============================================================
function openProductModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  modalProduct = p; modalQtyValue = 1;

  // Track recently viewed
  recentlyViewed = [id, ...recentlyViewed.filter(i => i !== id)].slice(0, 12);
  saveState();

  const disc    = Math.round((1 - p.price / p.originalPrice) * 100);
  const inWish  = wishlist.includes(p.id);
  const stockPct = Math.min(100, Math.round(p.stock / 60 * 100));

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'productModal';
  overlay.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="modal-inner">
        <div>
          <img class="modal-main-img" id="mMainImg" src="${p.images[0]}" alt="${p.title}" onerror="this.src='https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80'">
          <div class="modal-thumbs">
            ${p.images.map((img,i) => `<img class="modal-thumb ${i===0?'active':''}" src="${img}" onclick="switchThumb(this,'${img}',${i})" onerror="this.style.display='none'">`).join('')}
          </div>
        </div>
        <div>
          <div class="modal-brand">${p.brand}</div>
          <div class="modal-title">${p.title}</div>
          <div class="product-rating" style="margin-bottom:12px;">
            <div class="stars">${buildStars(p.rating)}</div>
            <span class="rating-text">${p.rating} · ${p.reviews.toLocaleString('en-IN')} reviews</span>
          </div>
          <div class="modal-price">${fmt(p.price)}</div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span class="modal-orig-price">${fmt(p.originalPrice)}</span>
            <span class="modal-discount-tag">${disc}% OFF</span>
          </div>
          <div class="modal-description">${p.description}</div>
          <div class="stock-bar" style="margin-bottom:14px;">
            <div class="stock-label"><span>${p.stock > 0 ? `${p.stock} units in stock` : 'Out of stock'}</span></div>
            <div class="stock-track"><div class="stock-fill ${p.stock < 10 ? 'stock-critical' : ''}" style="width:${stockPct}%"></div></div>
          </div>
          <div class="qty-control">
            <button class="qty-btn" onclick="mQty(-1)">−</button>
            <span class="qty-num" id="mQtyNum">1</span>
            <button class="qty-btn" onclick="mQty(1)">+</button>
          </div>
          <div class="modal-actions">
            <button class="btn-add-to-cart" id="mAtcBtn" onclick="addFromModal(${p.id})" ${p.stock===0?'disabled':''}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              ${p.stock===0?'Out of Stock':'Add to Cart'}
            </button>
            <button class="btn-modal-wishlist ${inWish?'active':''}" id="mWishBtn" onclick="toggleWishModal(${p.id})">
              <svg width="18" height="18" fill="${inWish?'currentColor':'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
}

function closeModal() {
  const m = document.getElementById('productModal');
  if (m) { m.classList.remove('show'); setTimeout(() => m.remove(), 300); }
}

function switchThumb(el, src, idx) {
  document.getElementById('mMainImg').src = src;
  document.querySelectorAll('.modal-thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
}

function mQty(d) {
  if (!modalProduct) return;
  modalQtyValue = Math.max(1, Math.min(modalProduct.stock, modalQtyValue + d));
  const el = document.getElementById('mQtyNum');
  if (el) el.textContent = modalQtyValue;
}

function addFromModal(id) {
  addToCartById(id, modalQtyValue);
  closeModal();
}

function toggleWishModal(id) {
  toggleWishById(id);
  const btn = document.getElementById('mWishBtn');
  if (!btn) return;
  const on = wishlist.includes(id);
  btn.classList.toggle('active', on);
  btn.querySelector('svg').setAttribute('fill', on ? 'currentColor' : 'none');
}

// ============================================================
// CART
// ============================================================
function addToCart(e, id) {
  e.stopPropagation();
  addToCartById(id, 1);
  flyToCart(e);
}

function addToCartById(id, qty = 1) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p || p.stock === 0) return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty = Math.min(p.stock, existing.qty + qty);
  else cart.push({ id, qty, price: p.price });
  saveState();
  updateBadges();
  showToast(p.title.slice(0, 28) + '… added to cart 🛒', 'success');
}

function flyToCart(e) {
  const btn = e.currentTarget || e.target;
  const srcRect = btn.getBoundingClientRect();
  const cartBtn = document.getElementById('nb-cart') || document.getElementById('mn-cart');
  if (!cartBtn) return;
  const dstRect = cartBtn.getBoundingClientRect();
  const fly = document.createElement('div');
  fly.className = 'fly-item';
  fly.textContent = '🛒';
  fly.style.cssText = `left:${srcRect.left + srcRect.width/2 - 18}px;top:${srcRect.top + srcRect.height/2 - 18}px;`;
  document.body.appendChild(fly);
  const dx = dstRect.left + dstRect.width/2 - (srcRect.left + srcRect.width/2);
  const dy = dstRect.top  + dstRect.height/2 - (srcRect.top  + srcRect.height/2);
  fly.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx}px,${dy}px) scale(0.2)`, opacity: 0 }
  ], { duration: 700, easing: 'cubic-bezier(0.4,0,0.2,1)' }).onfinish = () => fly.remove();
}

function renderCart() {
  const pg = document.getElementById('page-cart');
  if (cart.length === 0) {
    pg.innerHTML = `
      <div class="content-wrap">
        <div style="max-width:1280px;margin:0 auto;padding:32px 24px;">
          <div class="cart-header">Your Cart</div>
          <div class="empty-state">
            <div class="empty-state-icon">🛒</div>
            <div class="empty-state-title">Your cart is empty</div>
            <div class="empty-state-text">Start shopping to add items here!</div>
            <button class="btn-empty" onclick="goTo('products')">Browse Products</button>
          </div>
        </div>
      </div>`;
    return;
  }

  const items = cart.map(c => ({ ...c, p: PRODUCTS.find(x => x.id === c.id) })).filter(c => c.p);
  const sub  = items.reduce((a, c) => a + c.price * c.qty, 0);
  const ship = sub > 999 ? 0 : 99;
  const tax  = Math.round(sub * 0.18);
  const tot  = sub + ship + tax - cartDiscount;

  pg.innerHTML = `
    <div class="content-wrap">
      <div class="cart-layout">
        <div>
          <div class="cart-header">Your Cart (${cart.reduce((a,c)=>a+c.qty,0)} items)</div>
          <div class="cart-items-list">
            ${items.map(c => `
              <div class="cart-item" id="ci-${c.id}">
                <img class="cart-item-img" src="${c.p.images[0]}" alt="${c.p.title}" onclick="openProductModal(${c.id})" onerror="this.src='https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80'">
                <div>
                  <div class="cart-item-brand">${c.p.brand}</div>
                  <div class="cart-item-title">${c.p.title}</div>
                  <div style="display:flex;align-items:center;gap:12px;margin-top:8px;flex-wrap:wrap;">
                    <div class="qty-control">
                      <button class="qty-btn" onclick="changeQty(${c.id},-1)">−</button>
                      <span class="qty-num">${c.qty}</span>
                      <button class="qty-btn" onclick="changeQty(${c.id},1)">+</button>
                    </div>
                    <span class="cart-item-price">${fmt(c.price)}</span>
                  </div>
                  <button class="remove-btn" onclick="removeCartItem(${c.id})">🗑 Remove</button>
                </div>
                <div class="cart-item-total">${fmt(c.price * c.qty)}</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="cart-summary-box">
          <div class="summary-title">Order Summary</div>
          <div class="summary-row"><span class="label">Subtotal</span><span>${fmt(sub)}</span></div>
          <div class="summary-row"><span class="label">Shipping</span><span>${ship === 0 ? '🎉 FREE' : fmt(ship)}</span></div>
          <div class="summary-row"><span class="label">Tax (18% GST)</span><span>${fmt(tax)}</span></div>
          <div class="coupon-section">
            <div class="coupon-label">Have a coupon?</div>
            <div class="coupon-row">
              <input class="coupon-input" id="couponIn" placeholder="e.g. WELCOME20" oninput="this.value=this.value.toUpperCase()">
              <button class="coupon-apply-btn" onclick="applyCoupon()">Apply</button>
            </div>
            <div class="coupon-msg" id="couponMsg"></div>
          </div>
          ${cartDiscount > 0 ? `<div class="summary-row" style="color:#34C759;"><span>Discount</span><span>−${fmt(cartDiscount)}</span></div>` : ''}
          <div class="summary-row total-row"><span>Total</span><span id="cart-total">${fmt(Math.max(0,tot))}</span></div>
          <button class="checkout-btn" onclick="goTo('checkout')">
            Proceed to Checkout
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <div class="secure-note">🔒 Secure checkout · Free returns</div>
        </div>
      </div>
    </div>`;
}

function changeQty(id, d) {
  const item = cart.find(c => c.id === id);
  const p    = PRODUCTS.find(x => x.id === id);
  if (!item || !p) return;
  const nq = item.qty + d;
  if (nq <= 0) { removeCartItem(id); return; }
  item.qty = Math.min(p.stock, nq);
  saveState(); renderCart(); updateBadges();
}

function removeCartItem(id) {
  const el = document.getElementById(`ci-${id}`);
  if (el) { el.style.opacity = '0'; el.style.transform = 'translateX(-20px)'; el.style.transition = 'all 0.25s'; }
  setTimeout(() => { cart = cart.filter(c => c.id !== id); saveState(); renderCart(); updateBadges(); }, 260);
}

function applyCoupon() {
  const code   = document.getElementById('couponIn').value.trim().toUpperCase();
  const msg    = document.getElementById('couponMsg');
  const coupon = COUPONS[code];
  if (!coupon) { msg.textContent = '✗ Invalid coupon code'; msg.className = 'coupon-msg error'; return; }
  const sub = cart.map(c => ({ ...c, p: PRODUCTS.find(x => x.id === c.id) })).reduce((a, c) => a + c.price * c.qty, 0);
  cartDiscount   = coupon.type === 'percent' ? Math.round(sub * coupon.value / 100) : coupon.value;
  appliedCoupon  = code;
  msg.textContent = `✓ ${coupon.label} applied!`;
  msg.className   = 'coupon-msg success';
  renderCart(); showPage('cart');
}

// ============================================================
// CHECKOUT
// ============================================================
function renderCheckout() {
  if (!cart.length) { goTo('cart'); return; }
  const items = cart.map(c => ({ ...c, p: PRODUCTS.find(x => x.id === c.id) })).filter(c => c.p);
  const sub   = items.reduce((a, c) => a + c.price * c.qty, 0);
  const ship  = sub > 999 ? 0 : 99;
  const tax   = Math.round(sub * 0.18);
  const tot   = Math.max(0, sub + ship + tax - cartDiscount);

  document.getElementById('page-checkout').innerHTML = `
    <div class="content-wrap">
      <div class="ck-layout">
        <div>
          <div class="checkout-title">Checkout</div>

          <div class="form-section">
            <div class="form-section-title"><span class="sec-icon">📍</span> Delivery Address</div>
            <div class="form-grid">
              <div class="form-group">
                <label>Full Name *</label>
                <input type="text" id="ck-name"  value="${currentUser?.name || ''}" placeholder="Full Name">
                <div class="form-error" id="ck-name-err"></div>
              </div>
              <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" id="ck-phone" placeholder="+91 9876543210">
                <div class="form-error" id="ck-phone-err"></div>
              </div>
              <div class="form-group form-full">
                <label>Street Address *</label>
                <input type="text" id="ck-addr"  placeholder="House no., Street name, Area">
                <div class="form-error" id="ck-addr-err"></div>
              </div>
              <div class="form-group">
                <label>City *</label>
                <input type="text" id="ck-city"  placeholder="City" list="cityList">
                <datalist id="cityList">${Object.keys(INDIA_CITIES).map(c=>`<option value="${c}">`).join('')}</datalist>
                <div class="form-error" id="ck-city-err"></div>
              </div>
              <div class="form-group">
                <label>State *</label>
                <select id="ck-state">
                  <option value="">Select State</option>
                  ${['Andhra Pradesh','Assam','Bihar','Delhi','Goa','Gujarat','Haryana','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal','Jharkhand','Himachal Pradesh'].map(s=>`<option value="${s}">${s}</option>`).join('')}
                </select>
                <div class="form-error" id="ck-state-err"></div>
              </div>
              <div class="form-group">
                <label>PIN Code *</label>
                <input type="text" id="ck-pin"   placeholder="6-digit PIN" maxlength="6">
                <div class="form-error" id="ck-pin-err"></div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title"><span class="sec-icon">💳</span> Payment Method</div>
            <div class="payment-options" id="pmOpts">
              <label class="payment-option selected"><input type="radio" name="pm" value="cod" checked><span class="pm-icon">💵</span><div><div class="pm-label">Cash on Delivery</div><div class="pm-sub">Pay when you receive</div></div></label>
              <label class="payment-option"><input type="radio" name="pm" value="upi"><span class="pm-icon">📱</span><div><div class="pm-label">UPI / PhonePe / GPay</div><div class="pm-sub">Instant UPI payment</div></div></label>
              <label class="payment-option"><input type="radio" name="pm" value="card"><span class="pm-icon">💳</span><div><div class="pm-label">Credit / Debit Card</div><div class="pm-sub">Visa, Mastercard, RuPay</div></div></label>
              <label class="payment-option"><input type="radio" name="pm" value="netbanking"><span class="pm-icon">🏦</span><div><div class="pm-label">Net Banking</div><div class="pm-sub">All major banks</div></div></label>
            </div>
          </div>
        </div>

        <div class="order-summary-panel">
          <div class="summary-title">Order Summary</div>
          ${items.map(c => `
            <div class="order-mini-item">
              <img class="order-mini-img" src="${c.p.images[0]}" alt="${c.p.title}" onerror="this.src='https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&q=80'">
              <div>
                <div class="order-mini-name">${c.p.title.slice(0,28)}…</div>
                <div class="order-mini-qty">Qty: ${c.qty}</div>
              </div>
              <div class="order-mini-price">${fmt(c.price * c.qty)}</div>
            </div>`).join('')}
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);">
            <div class="summary-row"><span class="label">Subtotal</span><span>${fmt(sub)}</span></div>
            <div class="summary-row"><span class="label">Shipping</span><span>${ship===0?'FREE':fmt(ship)}</span></div>
            <div class="summary-row"><span class="label">Tax (18%)</span><span>${fmt(tax)}</span></div>
            ${cartDiscount ? `<div class="summary-row" style="color:#34C759;"><span>Discount</span><span>−${fmt(cartDiscount)}</span></div>` : ''}
            <div class="summary-row total-row"><span>Total</span><span>${fmt(tot)}</span></div>
          </div>
          <button class="place-order-btn" onclick="placeOrder()">
            Place Order — ${fmt(tot)}
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('#pmOpts input[type="radio"]').forEach(r => {
    r.addEventListener('change', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      r.closest('.payment-option').classList.add('selected');
    });
  });
}

function placeOrder() {
  const name  = val('ck-name'), phone = val('ck-phone'), addr = val('ck-addr');
  const city  = val('ck-city'), state = val('ck-state'), pin  = val('ck-pin');
  const pm    = document.querySelector('#pmOpts input[name="pm"]:checked')?.value || 'cod';
  let ok = true;
  if (!name)  { showErr('ck-name-err',  'Full name is required'); ok = false; }  else hideErr('ck-name-err');
  if (!phone || phone.replace(/\D/g,'').length < 10) { showErr('ck-phone-err','Enter a valid 10-digit number'); ok = false; } else hideErr('ck-phone-err');
  if (!addr)  { showErr('ck-addr-err',  'Address is required'); ok = false; }    else hideErr('ck-addr-err');
  if (!city)  { showErr('ck-city-err',  'City is required'); ok = false; }       else hideErr('ck-city-err');
  if (!state) { showErr('ck-state-err', 'Please select a state'); ok = false; }  else hideErr('ck-state-err');
  if (!pin || pin.length !== 6 || isNaN(pin)) { showErr('ck-pin-err','Enter a valid 6-digit PIN'); ok = false; } else hideErr('ck-pin-err');
  if (!ok) return;

  const items = cart.map(c => ({ ...c, p: PRODUCTS.find(x => x.id === c.id) })).filter(c => c.p);
  const sub   = items.reduce((a,c) => a + c.price * c.qty, 0);
  const ship  = sub > 999 ? 0 : 99;
  const tax   = Math.round(sub * 0.18);
  const tot   = Math.max(0, sub + ship + tax - cartDiscount);

  const cityKey = Object.keys(INDIA_CITIES).find(k => k.toLowerCase() === city.toLowerCase()) || 'Delhi';
  const destCoords = INDIA_CITIES[cityKey] || INDIA_CITIES['Delhi'];

  const order = {
    id: 'SWO' + Date.now(),
    date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    ts: Date.now(),
    items: cart.map(c => ({ ...c })),
    address: { name, phone, address: addr, city, state, pin },
    payment: pm,
    sub, ship, tax, discount: cartDiscount, total: tot,
    status: 'Processing',
    coupon: appliedCoupon,
    origin: { city: 'Mumbai', ...INDIA_CITIES.Mumbai },
    destination: { city: cityKey, ...destCoords }
  };

  orders.unshift(order);
  cart.forEach(c => { const p = PRODUCTS.find(x => x.id === c.id); if (p) p.stock = Math.max(0, p.stock - c.qty); });
  cart = []; cartDiscount = 0; appliedCoupon = null;
  saveState(); updateBadges();
  goTo('success', order);
}

// ============================================================
// ORDER SUCCESS
// ============================================================
function renderSuccess(order) {
  document.getElementById('page-success').innerHTML = `
    <canvas id="confetti-canvas"></canvas>
    <div class="success-page">
      <div class="success-card">
        <div class="success-icon">✅</div>
        <div class="success-title">Order Placed!</div>
        <div class="success-subtitle">Thank you for shopping with ShopWave 🎉</div>
        <div class="order-id-badge">Order #${order.id}</div>
        <div class="success-address">
          <div class="success-address-name">📍 ${order.address.name}</div>
          <div class="success-address-detail">${order.address.address}, ${order.address.city}, ${order.address.state} — ${order.address.pin}</div>
          <div class="success-address-detail" style="margin-top:4px;">📱 ${order.address.phone}</div>
          <div class="success-total">Total Paid: ${fmt(order.total)}</div>
        </div>
        <div class="success-actions">
          <button class="btn-outline" onclick="goTo('tracking','${order.id}')">🗺️ Track Order</button>
          <button class="btn-outline" onclick="downloadInvoice('${order.id}')">📄 Invoice</button>
          <button class="btn-solid"   onclick="goTo('products')">Continue Shopping</button>
        </div>
      </div>
    </div>`;
  setTimeout(startConfetti, 400);
}

// ============================================================
// MY ORDERS
// ============================================================
function renderOrders() {
  document.getElementById('page-orders').innerHTML = `
    <div class="content-wrap">
      <div class="orders-page">
        <div class="orders-title">My Orders</div>
        ${orders.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <div class="empty-state-title">No orders yet</div>
            <div class="empty-state-text">Your completed orders will appear here.</div>
            <button class="btn-empty" onclick="goTo('products')">Start Shopping</button>
          </div>` :
          orders.map(o => {
            const stCls = o.status==='Delivered'?'status-delivered':o.status==='Shipped'?'status-shipped':'status-processing';
            const thumbs = o.items.slice(0,4).map(c => {
              const p = PRODUCTS.find(x => x.id === c.id);
              return p ? `<img class="order-thumb" src="${p.images[0]}" alt="" onerror="this.style.display='none'">` : '';
            }).join('');
            return `
              <div class="order-card">
                <div class="order-card-header">
                  <div>
                    <div class="order-id-text">${o.id}</div>
                    <div class="order-date-text">${o.date}</div>
                  </div>
                  <span class="order-status-badge ${stCls}">${o.status}</span>
                </div>
                <div class="order-card-body">
                  <div class="order-thumbs">${thumbs}</div>
                  <div class="order-meta-text">${o.items.length} item${o.items.length!==1?'s':''} · ${o.address.city}, ${o.address.state}</div>
                  <div class="order-card-footer">
                    <div>
                      <div class="order-total-label">Order Total</div>
                      <div class="order-total-value">${fmt(o.total)}</div>
                    </div>
                    <div class="order-btns">
                      <button class="track-order-btn" onclick="goTo('tracking','${o.id}')">🗺️ Track</button>
                      <button class="invoice-btn"     onclick="downloadInvoice('${o.id}')">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>`;
          }).join('')}
      </div>
      ${renderFooter()}
    </div>`;
}

// ============================================================
// WISHLIST
// ============================================================
function renderWishlist() {
  const items = wishlist.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  document.getElementById('page-wishlist').innerHTML = `
    <div class="content-wrap">
      <div class="wishlist-page">
        <div class="wishlist-title">My Wishlist (${items.length})</div>
        ${items.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">❤️</div>
            <div class="empty-state-title">Your wishlist is empty</div>
            <div class="empty-state-text">Save items you love to revisit them later.</div>
            <button class="btn-empty" onclick="goTo('products')">Explore Products</button>
          </div>` :
          `<div class="products-grid">${renderProductCards(items)}</div>`}
      </div>
      ${renderFooter()}
    </div>`;
}

function toggleWish(e, id) {
  e.stopPropagation();
  toggleWishById(id);
  const btn = e.currentTarget;
  const on  = wishlist.includes(id);
  btn.classList.toggle('wishlisted', on);
  btn.querySelector('svg').setAttribute('fill',   on ? '#FF3B30' : 'none');
  btn.querySelector('svg').setAttribute('stroke', on ? '#FF3B30' : 'currentColor');
}

function toggleWishById(id) {
  const idx = wishlist.indexOf(id);
  if (idx === -1) { wishlist.push(id); showToast('Added to wishlist ❤️', 'success'); }
  else            { wishlist.splice(idx, 1); showToast('Removed from wishlist', 'info'); }
  saveState(); updateBadges();
}

// ============================================================
// ORDER TRACKING WITH REAL LEAFLET MAP
// ============================================================
function renderTracking(orderId) {
  const order = typeof orderId === 'string' ? orders.find(o => o.id === orderId) : orderId;
  if (!order) { goTo('orders'); return; }

  const steps = [
    { label: 'Order Placed',      desc: `Order #${order.id} confirmed`,         time: order.date,   done: true,  cur: false },
    { label: 'Processing',        desc: 'Your order is being prepared',           time: '24 hours',   done: order.status !== 'Processing', cur: order.status === 'Processing' },
    { label: 'Shipped',           desc: `Dispatched from ${order.origin.city}`,   time: '1–2 days',   done: ['Shipped','Delivered'].includes(order.status), cur: order.status==='Shipped' },
    { label: 'Out for Delivery',  desc: 'With your local delivery partner',       time: 'Coming soon',done: order.status === 'Delivered', cur: false },
    { label: 'Delivered',         desc: `At your doorstep in ${order.address.city}`, time: 'Pending',done: order.status === 'Delivered', cur: false }
  ];

  document.getElementById('page-tracking').innerHTML = `
    <div class="content-wrap">
      <div class="tracking-page">
        <div class="tracking-header">
          <button class="back-btn" onclick="goTo('orders')">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <div class="tracking-title">Track Order</div>
            <div class="tracking-sub">${order.id}</div>
          </div>
        </div>

        <div class="tracking-info-bar">
          <div class="t-info-item">
            <div class="t-info-label">From</div>
            <div class="t-info-value">📦 ${order.origin.city}</div>
          </div>
          <div class="t-arrow">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
          <div class="t-info-item">
            <div class="t-info-label">To</div>
            <div class="t-info-value">🏠 ${order.destination.city}</div>
          </div>
          <div class="t-info-item">
            <div class="t-info-label">Status</div>
            <div class="t-info-value" style="color:var(--primary)">${order.status}</div>
          </div>
          <div class="t-info-item">
            <div class="t-info-label">Payment</div>
            <div class="t-info-value">${order.payment.toUpperCase()}</div>
          </div>
        </div>

        <div class="tracking-map-wrap">
          <div id="trackingMap"></div>
        </div>

        <div class="tracking-steps">
          <div class="tracking-steps-title">Shipment Progress</div>
          ${steps.map((s, i) => `
            <div class="tracking-step">
              <div class="step-line-wrap">
                <div class="step-dot ${s.done ? 'done' : s.cur ? 'current' : ''}"></div>
                ${i < steps.length - 1 ? `<div class="step-connector ${s.done ? 'done' : ''}"></div>` : ''}
              </div>
              <div class="step-content">
                <div class="step-label ${!s.done && !s.cur ? 'pending' : ''}">${s.label}</div>
                <div class="step-desc">${s.desc}</div>
                <div class="step-time">${s.time}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      ${renderFooter()}
    </div>`;

  // Init map after DOM renders
  setTimeout(() => initLeafletMap(order), 350);
}

function initLeafletMap(order) {
  const mapEl = document.getElementById('trackingMap');
  if (!mapEl) return;

  // Check if Leaflet loaded
  if (typeof L === 'undefined') {
    mapEl.innerHTML = `
      <div class="map-fallback">
        <div class="map-icon">🗺️</div>
        <div style="font-weight:600;font-size:16px;">Map not available</div>
        <div style="font-size:13px;">Please open with a local server for the map to load</div>
        <div style="font-size:12px;margin-top:4px;">From: ${order.origin.city} → To: ${order.destination.city}</div>
      </div>`;
    return;
  }

  const origin = [order.origin.lat, order.origin.lng];
  const dest   = [order.destination.lat, order.destination.lng];
  const midLat = (origin[0] + dest[0]) / 2;
  const midLng = (origin[1] + dest[1]) / 2;

  // Destroy previous map if exists
  if (window._swMap) {
    try { window._swMap.remove(); } catch(e) {}
    window._swMap = null;
  }

  const map = L.map('trackingMap', { zoomControl: true, scrollWheelZoom: false });
  window._swMap = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map);

  // Warehouse icon
  const warehouseIcon = L.divIcon({
    html: '<div style="background:#FF6B35;color:#fff;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);">📦 Warehouse</div>',
    className: '', iconAnchor: [50, 10]
  });

  // Destination icon
  const destIcon = L.divIcon({
    html: '<div style="background:#34C759;color:#fff;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏠 You</div>',
    className: '', iconAnchor: [20, 10]
  });

  L.marker(origin, { icon: warehouseIcon }).addTo(map)
   .bindPopup(`<b>📦 ${order.origin.city} Warehouse</b><br>Your order starts here`);
  L.marker(dest,   { icon: destIcon   }).addTo(map)
   .bindPopup(`<b>🏠 ${order.destination.city}</b><br>Delivery address: ${order.address.address}`);

  // Route polyline with dashes
  const route = L.polyline([origin, dest], {
    color: '#FF6B35', weight: 3, opacity: 0.9, dashArray: '10, 8'
  }).addTo(map);

  // Calculate truck position based on order status
  const progress = order.status === 'Delivered' ? 1.0 : order.status === 'Shipped' ? 0.55 : order.status === 'Processing' ? 0.15 : 0.05;
  const truckLat = origin[0] + (dest[0] - origin[0]) * progress;
  const truckLng = origin[1] + (dest[1] - origin[1]) * progress;

  const truckIcon = L.divIcon({
    html: '<div style="font-size:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚚</div>',
    className: '', iconAnchor: [13, 13]
  });

  L.marker([truckLat, truckLng], { icon: truckIcon }).addTo(map)
   .bindPopup(`<b>🚚 Your Package</b><br>Status: ${order.status}<br>${Math.round(progress*100)}% of journey completed`)
   .openPopup();

  map.fitBounds(route.getBounds(), { padding: [50, 50] });
}

// ============================================================
// INVOICE DOWNLOAD
// ============================================================
function downloadInvoice(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  const items = order.items.map(c => ({ ...c, p: PRODUCTS.find(x => x.id === c.id) })).filter(c => c.p);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Invoice ${order.id}</title>
<style>
  body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#333;padding:20px}
  .logo{font-size:28px;font-weight:bold;color:#FF6B35;margin-bottom:4px}
  .inv-id{font-size:14px;color:#888;margin-bottom:20px}
  .meta{display:flex;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px}
  .meta-block label{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#888;display:block;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  th{background:#FFF5F0;padding:10px 12px;text-align:left;font-size:13px;border-bottom:2px solid #FF6B35}
  td{padding:10px 12px;border-bottom:1px solid #eee;font-size:13px}
  .tot td{font-weight:bold;background:#FFF5F0}
  .footer{font-size:12px;color:#999;text-align:center;margin-top:32px;border-top:1px solid #eee;padding-top:16px}
  hr{border:none;border-top:3px solid #FF6B35;margin-bottom:16px}
</style></head><body>
<div class="logo">🛍️ ShopWave</div>
<div class="inv-id">INVOICE · ${order.id} · ${order.date}</div>
<hr>
<div class="meta">
  <div class="meta-block">
    <label>Billed To</label>
    <strong>${order.address.name}</strong><br>
    ${order.address.address}<br>
    ${order.address.city}, ${order.address.state} — ${order.address.pin}<br>
    📱 ${order.address.phone}
  </div>
  <div class="meta-block" style="text-align:right">
    <label>Payment</label><strong>${order.payment.toUpperCase()}</strong><br>
    <label style="margin-top:10px;display:block;">Status</label><strong style="color:#34C759">${order.status}</strong>
  </div>
</div>
<table>
  <thead><tr><th>#</th><th>Product</th><th>Unit Price</th><th>Qty</th><th>Total</th></tr></thead>
  <tbody>
    ${items.map((c,i)=>`<tr><td>${i+1}</td><td>${c.p.title}</td><td>₹${c.price.toLocaleString('en-IN')}</td><td>${c.qty}</td><td>₹${(c.price*c.qty).toLocaleString('en-IN')}</td></tr>`).join('')}
    <tr><td colspan="4" style="text-align:right;font-weight:bold">Subtotal</td><td>₹${order.sub.toLocaleString('en-IN')}</td></tr>
    <tr><td colspan="4" style="text-align:right;font-weight:bold">Shipping</td><td>${order.ship===0?'FREE':'₹'+order.ship}</td></tr>
    <tr><td colspan="4" style="text-align:right;font-weight:bold">Tax (18%)</td><td>₹${order.tax.toLocaleString('en-IN')}</td></tr>
    ${order.discount?`<tr><td colspan="4" style="text-align:right;font-weight:bold;color:#34C759">Discount</td><td style="color:#34C759">−₹${order.discount.toLocaleString('en-IN')}</td></tr>`:''}
    <tr class="tot"><td colspan="4" style="text-align:right">GRAND TOTAL</td><td>₹${order.total.toLocaleString('en-IN')}</td></tr>
  </tbody>
</table>
<div class="footer">Thank you for shopping with ShopWave! 🛍️ &nbsp;|&nbsp; support@shopwave.in</div>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `ShopWave_Invoice_${order.id}.html`; a.click();
  URL.revokeObjectURL(url);
  showToast('Invoice downloaded! 📄', 'success');
}

// ============================================================
// CONFETTI
// ============================================================
function startConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx    = canvas.getContext('2d');
  const colors = ['#FF6B35','#FFD700','#34C759','#007AFF','#FF3B30','#AF52DE','#FF2D55'];
  const pieces = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    w: Math.random() * 12 + 6, h: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: Math.random() * 4 + 2,
    angle: Math.random() * 360,
    spin:  (Math.random() - 0.5) * 6,
    drift: (Math.random() - 0.5) * 2
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed; p.angle += p.spin; p.x += p.drift;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 220) requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.remove(); }
  }
  draw();
}

// ============================================================
// FOOTER
// ============================================================
function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div>
            <div class="footer-brand-logo">🛍️ ShopWave</div>
            <div class="footer-brand-text">Your trusted online shopping destination. Quality products, fast delivery, and exceptional service across India.</div>
          </div>
          <div>
            <div class="footer-col-title">Shop</div>
            <div class="footer-links">
              <a onclick="goTo('products')">All Products</a>
              <a onclick="filterByCat('Electronics')">Electronics</a>
              <a onclick="filterByCat('Fashion')">Fashion</a>
              <a onclick="filterByCat('Sports')">Sports</a>
            </div>
          </div>
          <div>
            <div class="footer-col-title">Account</div>
            <div class="footer-links">
              <a onclick="goTo('orders')">My Orders</a>
              <a onclick="goTo('wishlist')">Wishlist</a>
              <a onclick="goTo('cart')">Cart</a>
            </div>
          </div>
          <div>
            <div class="footer-col-title">Help</div>
            <div class="footer-links">
              <a>Returns & Refunds</a>
              <a>Shipping Info</a>
              <a>Privacy Policy</a>
              <a>Contact Us</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2025 ShopWave. All rights reserved.</span>
          <div class="footer-bottom-links"><a>Terms</a><a>Privacy</a><a>Cookies</a></div>
        </div>
      </div>
    </footer>`;
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 350); }, 3000);
}

// ============================================================
// UTILITY HELPERS
// ============================================================
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

function buildStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) html += `<span class="star ${i <= Math.round(rating) ? 'filled' : ''}">★</span>`;
  return html;
}

function isEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('show'); }
  const inp = document.getElementById(id.replace('-err', ''));
  if (inp) inp.classList.add('field-error');
}

function hideErr(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
  const inp = document.getElementById(id.replace('-err', ''));
  if (inp) inp.classList.remove('field-error');
}

function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

function addRipple(e) {
  const btn = e.currentTarget;
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 700);
}

// Keyboard shortcuts
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Intersection observer for scroll animations
const ioObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

setInterval(() => {
  document.querySelectorAll('.product-card:not([data-io])').forEach(el => {
    el.setAttribute('data-io', '1');
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    ioObserver.observe(el);
  });
}, 600);

// ============================================================
// FALLBACK PRODUCTS (if fetch fails when opened as file://)
// ============================================================
function getFallbackProducts() {
  return [
    { id:1, title:"Sony WH-1000XM5 Headphones", price:24999, originalPrice:34990, category:"Electronics", rating:4.8, reviews:2341, stock:15, description:"Industry-leading noise canceling. 30-hour battery. Crystal clear calls.", images:["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80","https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&q=80"], brand:"Sony", featured:true },
    { id:2, title:"Apple iPhone 15 Pro", price:129900, originalPrice:134900, category:"Electronics", rating:4.9, reviews:5621, stock:8, description:"Titanium design. A17 Pro chip. 5x optical zoom.", images:["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&q=80","https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80"], brand:"Apple", featured:true },
    { id:3, title:"Nike Air Max 270", price:12995, originalPrice:15995, category:"Footwear", rating:4.6, reviews:1892, stock:25, description:"Large Air unit for all-day comfort. Breathable mesh upper.", images:["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80","https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&q=80"], brand:"Nike", featured:true },
    { id:4, title:"Samsung 4K QLED TV 55\"", price:74999, originalPrice:89999, category:"Electronics", rating:4.7, reviews:987, stock:5, description:"Quantum Dot 4K. Smart TV with streaming apps. HDR.", images:["https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&q=80","https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500&q=80"], brand:"Samsung", featured:false },
    { id:5, title:"Leather Crossbody Bag", price:3499, originalPrice:5999, category:"Fashion", rating:4.5, reviews:764, stock:30, description:"Genuine leather. Multiple pockets. Adjustable strap.", images:["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80","https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"], brand:"Zara", featured:false },
    { id:6, title:"Yoga Mat Premium", price:1899, originalPrice:2499, category:"Sports", rating:4.4, reviews:432, stock:50, description:"Non-slip surface. 6mm thick. Eco-friendly TPE material.", images:["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80","https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80"], brand:"Decathlon", featured:false },
    { id:7, title:"MacBook Air M2", price:114900, originalPrice:119900, category:"Electronics", rating:4.9, reviews:3201, stock:12, description:"M2 chip. 13.6in Liquid Retina. 18-hour battery. MagSafe.", images:["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80","https://images.unsplash.com/photo-1611186871525-63d01ff26f28?w=500&q=80"], brand:"Apple", featured:true },
    { id:8, title:"Levi's 511 Slim Jeans", price:2999, originalPrice:3999, category:"Fashion", rating:4.3, reviews:2109, stock:40, description:"Classic slim fit. Premium denim. 5-pocket styling.", images:["https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80","https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80"], brand:"Levi's", featured:false },
    { id:9, title:"Instant Pot Duo 7-in-1", price:8999, originalPrice:11999, category:"Home & Kitchen", rating:4.7, reviews:4523, stock:20, description:"7-in-1 pressure cooker. Replaces 7 appliances. 6 Qt.", images:["https://images.unsplash.com/photo-1585515656973-35c9e0b5e947?w=500&q=80","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80"], brand:"Instant Pot", featured:false },
    { id:10, title:"Adidas Ultraboost 22", price:17999, originalPrice:21999, category:"Footwear", rating:4.7, reviews:1456, stock:18, description:"BOOST midsole energy return. Primeknit+ upper. Continental rubber.", images:["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80","https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80"], brand:"Adidas", featured:true },
    { id:11, title:"Kindle Paperwhite 11th Gen", price:13999, originalPrice:16999, category:"Electronics", rating:4.6, reviews:876, stock:35, description:"6.8in display. Warm light. 10-week battery. Waterproof.", images:["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80","https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500&q=80"], brand:"Amazon", featured:false },
    { id:12, title:"Whey Protein Isolate 2kg", price:3499, originalPrice:4299, category:"Sports", rating:4.5, reviews:2890, stock:60, description:"25g protein per serving. Low fat. Chocolate flavor.", images:["https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&q=80","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80"], brand:"MuscleBlaze", featured:false },
    { id:13, title:"Coffee Maker Machine", price:4599, originalPrice:5999, category:"Home & Kitchen", rating:4.4, reviews:654, stock:22, description:"12-cup capacity. Built-in grinder. Programmable timer.", images:["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80","https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80"], brand:"Morphy Richards", featured:false },
    { id:14, title:"Ray-Ban Aviator Sunglasses", price:9999, originalPrice:12500, category:"Fashion", rating:4.8, reviews:1203, stock:15, description:"Classic metal aviator. UV400 polarized lenses.", images:["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80","https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80"], brand:"Ray-Ban", featured:false },
    { id:15, title:"Gaming Mechanical Keyboard", price:5999, originalPrice:7999, category:"Electronics", rating:4.6, reviews:889, stock:28, description:"Cherry MX Red switches. RGB backlit. USB-C detachable.", images:["https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=500&q=80","https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80"], brand:"HyperX", featured:false },
    { id:16, title:"Plant-Based Face Moisturizer", price:1299, originalPrice:1799, category:"Beauty", rating:4.5, reviews:2341, stock:45, description:"24-hour hydration. SPF 30. Non-greasy. All skin types.", images:["https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500&q=80","https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80"], brand:"Forest Essentials", featured:false }
  ];
}
