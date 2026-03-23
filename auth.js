/**
 * 4D Plastics - Complete Authentication System
 * Temporary LocalStorage Implementation
 */

// Simple string hashing function for demo purposes
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        let char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

// Ensure base user structure exists
function initAuth() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
}

// Check logged in user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Register User
function registerUser(name, email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Check if email exists
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email is already registered.' };
    }

    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: hashPassword(password)
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Auto login after registration
    localStorage.setItem('currentUser', JSON.stringify({ id: newUser.id, name: newUser.name, email: newUser.email }));

    return { success: true, message: 'Registration successful!' };
}

// Login User
function loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const hashedPassword = hashPassword(password);

    const user = users.find(u => u.email === email && u.password === hashedPassword);

    if (user) {
        localStorage.setItem('currentUser', JSON.stringify({ id: user.id, name: user.name, email: user.email }));
        return { success: true, message: 'Login successful!' };
    }

    return { success: false, message: 'Invalid email or password.' };
}

// Logout User
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Route Protection
function checkAuth(requireLogin = false) {
    const user = getCurrentUser();
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') || currentPath.includes('signup.html');

    if (requireLogin && !user) {
        // Redirect to login if unauthenticated on protected route
        window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPath);
        return false;
    }

    if (isAuthPage && user) {
        // Redirect to home if already logged in and trying to access login/signup
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

// Navbar UI Update
function updateNavbar() {
    const user = getCurrentUser();
    const navLinks = document.querySelector('.nav-links');

    // Remove existing auth links if they exist
    const existingAuthItems = document.querySelectorAll('.auth-nav-item');
    existingAuthItems.forEach(item => item.remove());

    if (!navLinks) return; // If no navbar on this page

    if (user) {
        // Logged in View (Account Dropdown)
        const accountHtml = `
            <li class="auth-nav-item dropdown-container">
                <a href="#" class="nav-btn account-btn">
                    <span class="user-avatar">${user.name.charAt(0).toUpperCase()}</span>
                    Hi, ${user.name.split(' ')[0]}
                </a>
                <ul class="dropdown-menu">
                    <li><a href="#" style="opacity:0.5; cursor:not-allowed;">🛍️ My Orders</a></li>
                    <li><a href="#" style="opacity:0.5; cursor:not-allowed;">⚙️ Settings</a></li>
                    <li><hr></li>
                    <li><a href="#" onclick="logoutUser(); return false;">🚪 Logout</a></li>
                </ul>
            </li>
        `;
        navLinks.insertAdjacentHTML('beforeend', accountHtml);
    } else {
        // Logged out View (Login / Signup Buttons)
        const loginHtml = `
            <li class="auth-nav-item"><a href="login.html" class="nav-btn login-btn">Login</a></li>
        `;
        navLinks.insertAdjacentHTML('beforeend', loginHtml);
    }
}

// Initialization on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    updateNavbar();

    // Add page transition class
    document.body.classList.add('page-transition-enter');
    setTimeout(() => {
        document.body.classList.add('page-transition-enter-active');
    }, 10);
});
