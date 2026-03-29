/**
 * 4D Plastics - Live Authentication System (Backend Integrated)
 */

async function checkAuth(requireLogin = false) {
    try {
        const response = await fetch('/api/me');
        const data = await response.json();
        const user = data.logged_in ? data.user : null;
        
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('/login') || currentPath.includes('/signup');

        if (requireLogin && !user) {
            window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
            return false;
        }

        if (isAuthPage && user) {
            window.location.href = '/';
            return false;
        }

        updateNavbar(user);
        return true;
    } catch (err) {
        console.error("Auth check failed:", err);
        return false;
    }
}

function updateNavbar(user) {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Remove existing auth links
    document.querySelectorAll('.auth-nav-item').forEach(item => item.remove());

    if (user) {
        const userName = user.name || user.username || 'User';
        const accountHtml = `
            <li class="auth-nav-item" style="display:flex; align-items:center; gap:20px; margin-left:15px;">
                <a href="/cart" class="cart-nav" style="display: flex; align-items: center; gap: 5px; text-decoration: none; color: white;">
                    🛒 <span id="cart-count">0</span>
                </a>
                <a href="/dashboard" style="color: #ffd36b; font-weight: 600; text-decoration: none;">Dashboard</a>
                <span style="color:#ffd36b; font-weight:600; font-size:1.1rem; text-transform:capitalize;">Hi, ${userName.split(' ')[0]}</span>
                <a href="/logout" class="nav-btn login-btn" style="background:#dc3545; color:white; border:none; padding:8px 16px; border-radius:30px; font-weight:600; text-transform:uppercase; font-size:0.9rem;">Logout 🚪</a>
            </li>
        `;
        navLinks.insertAdjacentHTML('beforeend', accountHtml);
        updateCartCount(); // Fetch count if logged in
    } else {
        const loginHtml = `
            <li class="auth-nav-item" style="margin-left:15px;"><a href="/login" class="nav-btn login-btn">Login</a></li>
        `;
        navLinks.insertAdjacentHTML('beforeend', loginHtml);
    }
}

async function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (!countEl) return;
    
    try {
        const response = await fetch('/api/cart/count');
        const data = await response.json();
        countEl.textContent = data.count || 0;
    } catch (err) {
        console.error("Failed to fetch cart count:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Page Transitions
    document.body.classList.add('page-transition-enter');
    setTimeout(() => {
        document.body.classList.add('page-transition-enter-active');
    }, 10);
});
