/**
 * AuthManager — Frontend authentication module for Loom Saga.
 *
 * Handles:
 *  • Login via /api/auth/login (JWT-based)
 *  • Registration via /api/auth/register
 *  • Forgot-password via /api/auth/forgot-password
 *  • JWT token storage and auto-refresh
 *  • Session persistence in localStorage
 *  • Header UI updates (account icon → "My Account" when logged in)
 *
 * Usage:
 *   import { AuthManager } from './modules/AuthManager.js';
 *   AuthManager.init();
 */

const STORAGE_KEY = 'loom_saga_user';
const TOKEN_KEY = 'loom_jwt_token';
const TOKEN_EXPIRES_KEY = 'loom_jwt_expires';

// ─── Session helpers ────────────────────────────────────────────────────────

function saveSession(user, token, expiresAt) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        if (token) localStorage.setItem(TOKEN_KEY, token);
        if (expiresAt) localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString());
    } catch (_) { /* quota exceeded – ignore */ }
}

function getSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || null;
    } catch (_) {
        return null;
    }
}

function getTokenExpiration() {
    try {
        const exp = localStorage.getItem(TOKEN_EXPIRES_KEY);
        return exp ? parseInt(exp, 10) : null;
    } catch (_) {
        return null;
    }
}

function clearSession() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRES_KEY);
    } catch (_) { /* ignore */ }
}

function isLoggedIn() {
    return !!getSession() && !!getToken();
}

function isTokenExpired() {
    const expiresAt = getTokenExpiration();
    if (!expiresAt) return true;
    // Consider expired if less than 5 minutes remaining
    return Date.now() >= (expiresAt - 5 * 60 * 1000);
}

// ─── API helpers ────────────────────────────────────────────────────────────

async function apiRequest(endpoint, body, includeAuth = false) {
    const headers = { 'Content-Type': 'application/json' };

    if (includeAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    return { ok: response.ok, status: response.status, data };
}

// ─── Token refresh ──────────────────────────────────────────────────────────

async function refreshToken() {
    const token = getToken();
    if (!token) return false;

    try {
        const { ok, data } = await apiRequest('/api/auth/refresh-token', { token });

        if (ok && data.success && data.token) {
            const user = getSession();
            saveSession(user, data.token, data.expiresAt);
            return true;
        }

        // Refresh failed — clear session
        clearSession();
        return false;
    } catch (err) {
        console.error('Token refresh failed:', err);
        clearSession();
        return false;
    }
}

// ─── Public API ─────────────────────────────────────────────────────────────

async function login(email, password) {
    const { ok, data } = await apiRequest('/api/auth/login', { email, password });

    if (ok && data.success) {
        saveSession(data.user, data.token, data.expiresAt);
        return { success: true, user: data.user };
    }

    return { success: false, error: data.error || 'Login failed. Please try again.' };
}

async function register({ email, password, firstName, lastName }) {
    const { ok, status, data } = await apiRequest('/api/auth/register', {
        email,
        password,
        firstName,
        lastName,
    });

    if (ok && data.success) {
        // Auto-login if JWT token was returned
        if (data.token) {
            saveSession(data.user, data.token, data.expiresAt);
        }
        return { success: true, user: data.user, autoLoggedIn: !!data.token };
    }

    return {
        success: false,
        error: data.error || 'Registration failed. Please try again.',
        isDuplicate: status === 409,
    };
}

async function forgotPassword(email) {
    const { ok, data } = await apiRequest('/api/auth/forgot-password', { email });

    return {
        success: true,
        message:
            data.message ||
            'If an account exists with this email, you will receive a password reset link shortly.',
    };
}

function logout() {
    clearSession();
    // Dispatch event so other modules can react
    window.dispatchEvent(new CustomEvent('loom:auth:logout'));
}

// ─── Header UI integration ──────────────────────────────────────────────────

function updateHeaderUI() {
    const user = getSession();
    const accountBtn = document.getElementById('accountBtn');
    const mobileLoginLink = document.querySelector('.mobile-menu__secondary-link[href="login.html"]');

    if (user) {
        // Desktop header
        if (accountBtn) {
            accountBtn.href = 'my-account.html';
            accountBtn.setAttribute('aria-label', `Account: ${user.displayName}`);
        }
        // Mobile menu
        if (mobileLoginLink) {
            mobileLoginLink.href = 'my-account.html';
            const label = mobileLoginLink.querySelector('span');
            if (label) label.textContent = 'MY ACCOUNT';
        }
    } else {
        if (accountBtn) {
            accountBtn.href = 'login.html';
            accountBtn.setAttribute('aria-label', 'Account');
        }
        if (mobileLoginLink) {
            mobileLoginLink.href = 'login.html';
            const label = mobileLoginLink.querySelector('span');
            if (label) label.textContent = 'LOG IN';
        }
    }
}

// ─── Init ────────────────────────────────────────────────────────────────────

async function init() {
    // Check if token needs refresh
    if (isLoggedIn() && isTokenExpired()) {
        const refreshed = await refreshToken();
        if (!refreshed) {
            // Token refresh failed — user needs to log in again
            clearSession();
        }
    }

    updateHeaderUI();

    // Redirect logged-in users away from login/register pages
    const currentPage = window.location.pathname.split('/').pop() || '';
    const authPages = ['login.html', 'register.html'];

    if (isLoggedIn() && authPages.includes(currentPage)) {
        // User is already logged in — redirect to account page
        window.location.href = 'my-account.html';
        return;
    }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const AuthManager = {
    init,
    login,
    register,
    forgotPassword,
    logout,
    getSession,
    getToken,
    isLoggedIn,
    clearSession,
    updateHeaderUI,
    refreshToken,
};
