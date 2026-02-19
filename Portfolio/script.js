/* ===== PORTFOLIO JAVASCRIPT ===== */

// ===== LOADER =====
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => { loader.classList.add('hidden'); }, 700);
  }
});

// ===== SCROLL PROGRESS BAR =====
function updateScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const scrollTop = document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  bar.style.width = progress + '%';
}

// ===== NAVBAR SCROLL =====
function updateNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  if (window.scrollY > 60) { nav.classList.add('scrolled'); }
  else { nav.classList.remove('scrolled'); }
}

// ===== SCROLL TO TOP BUTTON =====
function updateScrollTopBtn() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  if (window.scrollY > 400) { btn.classList.add('show'); }
  else { btn.classList.remove('show'); }
}

const scrollTopBtn = document.getElementById('scroll-top');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

window.addEventListener('scroll', () => {
  updateScrollProgress();
  updateNavbar();
  updateScrollTopBtn();
  revealOnScroll();
  animateSkillBars();
  animateCounters();
});

// ===== MOBILE MENU =====
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const menuOverlay = document.querySelector('.menu-overlay');

function toggleMenu(open) {
  if (!hamburger || !mobileMenu) return;
  hamburger.classList.toggle('active', open);
  mobileMenu.classList.toggle('open', open);
  if (menuOverlay) menuOverlay.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

if (hamburger) {
  hamburger.addEventListener('click', () => toggleMenu(!mobileMenu.classList.contains('open')));
}
if (menuOverlay) {
  menuOverlay.addEventListener('click', () => toggleMenu(false));
}
document.querySelectorAll('.mobile-menu a').forEach(link => {
  link.addEventListener('click', () => toggleMenu(false));
});

// ===== ACTIVE NAV LINK =====
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === path || (path === '' && href === 'index.html'));
  });
}
setActiveNav();

// ===== TYPING EFFECT =====
const words = ['Full Stack Developer', 'Problem Solver', 'Innovator', 'Java Enthusiast'];
let wordIndex = 0, charIndex = 0, isDeleting = false;
const typingEl = document.querySelector('.typing-text');

function type() {
  if (!typingEl) return;
  const current = words[wordIndex];
  if (isDeleting) {
    typingEl.textContent = current.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typingEl.textContent = current.substring(0, charIndex + 1);
    charIndex++;
  }
  let speed = isDeleting ? 60 : 100;
  if (!isDeleting && charIndex === current.length) {
    speed = 2000;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    wordIndex = (wordIndex + 1) % words.length;
    speed = 400;
  }
  setTimeout(type, speed);
}
if (typingEl) setTimeout(type, 1200);

// ===== ANIMATED COUNTERS =====
let countersAnimated = false;
function animateCounters() {
  if (countersAnimated) return;
  const counters = document.querySelectorAll('.stat-num[data-target]');
  if (!counters.length) return;
  const firstCounter = counters[0];
  const rect = firstCounter.getBoundingClientRect();
  if (rect.top > window.innerHeight) return;
  countersAnimated = true;
  counters.forEach(counter => {
    const target = parseFloat(counter.dataset.target);
    const isDecimal = String(target).includes('.');
    const duration = 1800;
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const value = target * ease;
      counter.textContent = isDecimal ? value.toFixed(2) : Math.floor(value);
      if (progress < 1) requestAnimationFrame(update);
      else counter.textContent = isDecimal ? target.toFixed(2) : target;
    }
    requestAnimationFrame(update);
  });
}

// ===== SCROLL REVEAL =====
function revealOnScroll() {
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      el.classList.add('visible');
    }
  });
}
// Run once on page load
setTimeout(revealOnScroll, 100);

// ===== SKILL BARS =====
let skillBarsAnimated = false;
function animateSkillBars() {
  if (skillBarsAnimated) return;
  const bars = document.querySelectorAll('.skill-bar-fill');
  if (!bars.length) return;
  const first = bars[0];
  const rect = first.getBoundingClientRect();
  if (rect.top > window.innerHeight) return;
  skillBarsAnimated = true;
  bars.forEach(bar => {
    const target = bar.dataset.width || '0';
    setTimeout(() => { bar.style.width = target + '%'; }, 200);
  });
}

// ===== CONTACT FORM VALIDATION =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    let valid = true;

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const msgInput = document.getElementById('message');

    // Clear previous errors
    document.querySelectorAll('.error-msg').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.form-group input, .form-group textarea').forEach(i => i.classList.remove('error'));

    // Validate name
    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      showError(nameInput, 'nameError', 'Please enter your full name (min 2 characters).');
      valid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      showError(emailInput, 'emailError', 'Please enter a valid email address.');
      valid = false;
    }

    // Validate message
    if (!msgInput.value.trim() || msgInput.value.trim().length < 10) {
      showError(msgInput, 'messageError', 'Message must be at least 10 characters.');
      valid = false;
    }

    if (valid) {
      const btn = contactForm.querySelector('.form-btn');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.disabled = false;
        contactForm.reset();
        const success = document.querySelector('.success-message');
        if (success) {
          success.classList.add('show');
          setTimeout(() => success.classList.remove('show'), 5000);
        }
      }, 1500);
    }
  });
}

function showError(input, errorId, message) {
  input.classList.add('error');
  const err = document.getElementById(errorId);
  if (err) { err.textContent = message; err.classList.add('show'); }
}

// ===== RIPPLE EFFECT =====
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,0.4);transform:scale(0);animation:rippleAnim 0.6s linear;left:${x}px;top:${y}px;width:10px;height:10px;margin:-5px 0 0 -5px;pointer-events:none;`;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
});

// Ripple keyframes
const style = document.createElement('style');
style.textContent = '@keyframes rippleAnim { to { transform: scale(30); opacity: 0; } }';
document.head.appendChild(style);

// Initial calls
updateNavbar();
updateScrollProgress();
animateCounters();
