// Simple Dashboard - No iframe complications
document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Check if user is logged in
    if (sessionStorage.getItem('dashboard_logged_in') === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
    
    // Login form handler
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (username && password) {
            // Store login state
            sessionStorage.setItem('dashboard_logged_in', 'true');
            sessionStorage.setItem('dashboard_user', username);
            
            // Show dashboard - Caspio widgets will handle their own authentication
            showDashboard();
        } else {
            alert('Please enter both username and password');
        }
    });
    
    // Logout handler
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('dashboard_logged_in');
        sessionStorage.removeItem('dashboard_user');
        showLogin();
    });
    
    function showLogin() {
        loginContainer.style.display = 'flex';
        dashboardContainer.style.display = 'none';
        document.getElementById('username').focus();
    }
    
    function showDashboard() {
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
    }
});