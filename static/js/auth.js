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
        const accountHtml = `
            <li class="auth-nav-item dropdown-container">
                <a href="#" class="nav-btn account-btn">
                    <span class="user-avatar">${user.username.charAt(0).toUpperCase()}</span>
                    Hi, ${user.username.split(' ')[0]}
                </a>
                <ul class="dropdown-menu">
                    <li><a href="/cart">🛒 My Cart</a></li>
                    <li><hr></li>
                    <li><a href="/logout">🚪 Logout</a></li>
                </ul>
            </li>
        `;
        navLinks.insertAdjacentHTML('beforeend', accountHtml);
    } else {
        const loginHtml = `
            <li class="auth-nav-item"><a href="/login" class="nav-btn login-btn">Login</a></li>
        `;
        navLinks.insertAdjacentHTML('beforeend', loginHtml);
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
