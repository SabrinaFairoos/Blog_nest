/**
 * Blog_nest - Authentication & Dynamic Navigation Module
 * 
 * Handles user session validation, header state synchronization,
 * login/register form submissions, logout actions, and toast alerts.
 */

// Global App Configuration
const API_BASE = window.location.pathname.includes('/public/')
  ? '../backend/api'
  : 'backend/api';

/**
 * Toast Notification Utility
 * @param {string} message 
 * @param {'success'|'error'|'info'} type 
 * @param {number} duration 
 */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Theme Controller (Warm Latte <-> Dark Mocha)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('blog_nest_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('blog_nest_theme', next);
      updateThemeIcon(next);
    });
  }
}

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light Latte' : 'Switch to Dark Mocha');
  }
}

/**
 * Check current authentication state via backend API
 * @returns {Promise<{authenticated: boolean, user: Object|null}>}
 */
async function checkAuthStatus() {
  try {
    const res = await fetch(`${API_BASE}/auth_status.php`, { credentials: 'same-origin' });
    const json = await res.json();
    if (json.status && json.data) {
      return json.data;
    }
    return { authenticated: false, user: null };
  } catch (err) {
    console.error('Failed to verify auth status:', err);
    return { authenticated: false, user: null };
  }
}

/**
 * Render Header Navigation based on authentication status and setup auth guards
 */
async function updateNavigation() {
  const authData = await checkAuthStatus();
  const navActions = document.getElementById('nav-actions');

  // If user is already authenticated and visits login.html or register.html, redirect them to index
  const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html');
  if (authData.authenticated && isAuthPage) {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    window.location.href = redirect ? redirect : 'index.html';
    return;
  }

  if (navActions) {
    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('Blog_nest');
    const homeLinkHtml = !isHomePage ? `<a href="index.html" class="nav-link">Home</a>` : '';

    if (authData.authenticated && authData.user) {
      const user = authData.user;
      const initial = user.username.charAt(0).toUpperCase();

      navActions.innerHTML = `
        ${homeLinkHtml}
        <a href="editor.html" class="btn btn-primary btn-sm">
          <span>✏️</span>
          <span class="nav-text">Write Post</span>
        </a>
        <div class="user-menu">
          <div class="user-badge" title="Logged in as ${user.username}">
            <div class="avatar-circle">${initial}</div>
            <span>${user.username}</span>
          </div>
          <button id="logout-btn" class="btn btn-outline btn-sm" title="Log Out">
            <span>🚪</span>
            <span class="nav-text">Logout</span>
          </button>
        </div>
        <button id="theme-toggle-btn" class="theme-toggle-btn" aria-label="Toggle theme">🌙</button>
      `;

      // Attach logout event
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
      }
    } else {
      navActions.innerHTML = `
        ${homeLinkHtml}
        <a href="login.html" class="nav-link">Sign In</a>
        <a href="register.html" class="btn btn-primary btn-sm">Get Started</a>
        <button id="theme-toggle-btn" class="theme-toggle-btn" aria-label="Toggle theme">🌙</button>
      `;
    }

    // Re-attach theme toggle listener
    const savedTheme = localStorage.getItem('blog_nest_theme') || 'dark';
    updateThemeIcon(savedTheme);
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('blog_nest_theme', next);
        updateThemeIcon(next);
      });
    }
  }

  // Intercept any "Write an Article" links on the page if user is not authenticated
  if (!authData.authenticated) {
    document.querySelectorAll('a[href="editor.html"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login.html?redirect=editor.html';
      });
    });
  }

  // Forward redirect query parameter to all auth cross-links (e.g. Sign In <-> Register)
  syncAuthLinks();
}

/**
 * Synchronize redirect query parameter across auth navigation links
 */
function syncAuthLinks() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (!redirect) return;

  document.querySelectorAll('a[href^="register.html"], a[href^="login.html"]').forEach(link => {
    const currentHref = link.getAttribute('href');
    if (!currentHref.includes('redirect=')) {
      const separator = currentHref.includes('?') ? '&' : '?';
      link.setAttribute('href', `${currentHref}${separator}redirect=${encodeURIComponent(redirect)}`);
    }
  });
}

/**
 * Handle Logout request
 */
async function handleLogout() {
  try {
    const res = await fetch(`${API_BASE}/logout.php`, {
      method: 'POST',
      credentials: 'same-origin'
    });
    const json = await res.json();
    if (json.status) {
      showToast('Logged out successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 700);
    } else {
      showToast(json.message || 'Logout failed', 'error');
    }
  } catch (err) {
    console.error('Logout error:', err);
    showToast('Network error during logout.', 'error');
  }
}

/**
 * Handle Login Form Submission
 */
function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  const alertContainer = document.getElementById('auth-alert');
  const submitBtn = document.getElementById('login-submit-btn');

  // Check URL params for post-registration notice and username prefill
  const params = new URLSearchParams(window.location.search);
  if (params.get('registered') === '1' || params.get('registered') === 'true') {
    if (alertContainer) {
      alertContainer.innerHTML = `<div class="alert-box alert-success">Account created successfully! Please enter your password to sign in.</div>`;
    }
    const usernameInput = document.getElementById('identifier');
    const registeredUser = params.get('username');
    if (usernameInput && registeredUser) {
      usernameInput.value = registeredUser;
      const pwdInput = document.getElementById('password');
      if (pwdInput) pwdInput.focus();
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertContainer) alertContainer.innerHTML = '';

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;

    if (!identifier || !password) {
      if (alertContainer) {
        alertContainer.innerHTML = `<div class="alert-box alert-danger">Please fill in all fields.</div>`;
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Signing In...</span>';
    }

    try {
      const res = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        credentials: 'same-origin'
      });

      const json = await res.json();

      if (json.status) {
        showToast('Login successful! Redirecting...', 'success');
        if (alertContainer) {
          alertContainer.innerHTML = `<div class="alert-box alert-success">Login successful! Redirecting...</div>`;
        }
        
        // Redirect to target or editor
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        setTimeout(() => {
          window.location.href = redirect ? redirect : 'editor.html';
        }, 700);
      } else {
        if (alertContainer) {
          alertContainer.innerHTML = `<div class="alert-box alert-danger">${json.message || 'Invalid credentials.'}</div>`;
        }
        showToast(json.message || 'Login failed', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (alertContainer) {
        alertContainer.innerHTML = `<div class="alert-box alert-danger">Network error. Please try again.</div>`;
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In</span>';
      }
    }
  });
}

/**
 * Handle Registration Form Submission
 */
function initRegisterForm() {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;

  const alertContainer = document.getElementById('auth-alert');
  const submitBtn = document.getElementById('register-submit-btn');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertContainer) alertContainer.innerHTML = '';

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    if (password !== confirmPassword) {
      if (alertContainer) {
        alertContainer.innerHTML = `<div class="alert-box alert-danger">Passwords do not match.</div>`;
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Creating Account...</span>';
    }

    try {
      const res = await fetch(`${API_BASE}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        credentials: 'same-origin'
      });

      const json = await res.json();

      if (json.status) {
        showToast('Registration successful! Welcome to Blog_nest.', 'success');
        if (alertContainer) {
          alertContainer.innerHTML = `<div class="alert-box alert-success">Registration successful! Redirecting to Home...</div>`;
        }
        
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect');
          let nextUrl = `login.html?registered=1&username=${encodeURIComponent(username)}`;
          if (redirect) {
            nextUrl += `&redirect=${encodeURIComponent(redirect)}`;
          }
          window.location.href = nextUrl;
        }, 800);
      } else {
        const errorMsg = json.data?.errors 
          ? Object.values(json.data.errors).filter(Boolean).join('<br>')
          : json.message;
        if (alertContainer) {
          alertContainer.innerHTML = `<div class="alert-box alert-danger">${errorMsg || 'Registration failed.'}</div>`;
        }
        showToast(json.message || 'Registration failed', 'error');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (alertContainer) {
        alertContainer.innerHTML = `<div class="alert-box alert-danger">Network error. Please try again.</div>`;
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span>';
      }
    }
  });
}

/**
 * Setup Password Visibility Toggles
 */
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁️';
      }
    });
  });
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateNavigation();
  initLoginForm();
  initRegisterForm();
  initPasswordToggles();
});
