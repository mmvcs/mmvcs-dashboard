class DashboardApp {
    constructor() {
        this.loginContainer = document.getElementById('login-container');
        this.dashboardContainer = document.getElementById('dashboard-container');
        this.loginForm = document.getElementById('login-form');
        this.loginError = document.getElementById('login-error');
        this.logoutBtn = document.getElementById('logout-btn');
        this.autoLoginBtn = document.getElementById('auto-login-btn');
        
        this.init();
    }

    init() {
        // Check if user is already logged in
        if (this.isLoggedIn()) {
            this.showDashboard();
        } else {
            this.showLogin();
        }

        // Event listeners
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        if (this.autoLoginBtn) {
            this.autoLoginBtn.addEventListener('click', () => this.manuallyAuthenticateWidgets());
        }
        
        // Auto-logout after inactivity (30 minutes)
        this.setupAutoLogout();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        // Show loading state
        const submitBtn = this.loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        try {
            // Simulate MMVCS authentication
            // In a real implementation, this would make an API call to your Caspio authentication endpoint
            const isValid = await this.authenticateWithMMVCS(username, password);
            
            if (isValid) {
                // Store session including credentials for Caspio
                sessionStorage.setItem('mmvcs_authenticated', 'true');
                sessionStorage.setItem('mmvcs_user', username);
                sessionStorage.setItem('mmvcs_password', password);
                sessionStorage.setItem('mmvcs_login_time', Date.now().toString());
                
                this.hideError();
                this.showDashboard();
            } else {
                this.showError('Invalid MMVCS credentials. Please try again.');
            }
        } catch (error) {
            this.showError('Login failed. Please check your connection and try again.');
            console.error('Login error:', error);
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async authenticateWithMMVCS(username, password) {
        // For live deployment, use a simplified validation
        // The widgets will handle their own Caspio authentication
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Accept any non-empty credentials
        return username.length > 0 && password.length > 0;
    }

    handleLogout() {
        // Clear only our session data, leave Caspio authentication intact
        sessionStorage.removeItem('mmvcs_authenticated');
        sessionStorage.removeItem('mmvcs_user');
        sessionStorage.removeItem('mmvcs_password');
        sessionStorage.removeItem('mmvcs_login_time');
        sessionStorage.removeItem('mmvcs_token');
        
        // Reset form
        this.loginForm.reset();
        this.hideError();
        
        // Show login screen
        this.showLogin();
    }

    showLogin() {
        this.loginContainer.style.display = 'flex';
        this.dashboardContainer.style.display = 'none';
        document.getElementById('username').focus();
    }

    showDashboard() {
        this.loginContainer.style.display = 'none';
        this.dashboardContainer.style.display = 'block';
        
        // Load widgets with authentication
        this.loadWidgets();
    }

    loadWidgets() {
        const iframes = document.querySelectorAll('.widget-frame iframe');
        const username = sessionStorage.getItem('mmvcs_user');
        const password = sessionStorage.getItem('mmvcs_password');
        
        iframes.forEach((iframe, index) => {
            // Add loading indicator
            this.addLoadingIndicator(iframe.parentElement);
            
            // Set up load event listener
            iframe.addEventListener('load', () => {
                this.removeLoadingIndicator(iframe.parentElement);
                
                // Try to authenticate each widget individually
                setTimeout(() => {
                    this.authenticateWidget(iframe, username, password);
                }, 2000);
            });
            
            // Set up error handling
            iframe.addEventListener('error', () => {
                this.handleWidgetError(iframe.parentElement, iframe.title);
            });
        });
    }

    authenticateWidget(iframe, username, password) {
        try {
            setTimeout(() => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    
                    // Look for login form in the widget
                    const usernameField = iframeDoc.querySelector('input[type="text"]');
                    const passwordField = iframeDoc.querySelector('input[type="password"]');
                    const submitButton = iframeDoc.querySelector('input[type="submit"], button[type="submit"], button');
                    
                    if (usernameField && passwordField) {
                        // Fill credentials
                        usernameField.value = username;
                        passwordField.value = password;
                        
                        // Trigger events to ensure the form recognizes the input
                        const events = ['input', 'change', 'keyup', 'blur'];
                        events.forEach(eventType => {
                            usernameField.dispatchEvent(new Event(eventType, { bubbles: true }));
                            passwordField.dispatchEvent(new Event(eventType, { bubbles: true }));
                        });
                        
                        // Submit with multiple attempts
                        if (submitButton) {
                            setTimeout(() => {
                                submitButton.click();
                                
                                // Backup submit attempts
                                setTimeout(() => {
                                    const form = iframeDoc.querySelector('form');
                                    if (form) form.submit();
                                }, 250);
                                
                                setTimeout(() => {
                                    // Try pressing Enter key
                                    passwordField.dispatchEvent(new KeyboardEvent('keydown', {
                                        key: 'Enter',
                                        code: 'Enter',
                                        which: 13,
                                        keyCode: 13,
                                        bubbles: true
                                    }));
                                }, 500);
                            }, 500);
                        }
                        
                        console.log(`Authenticated widget: ${iframe.title}`);
                    } else {
                        console.log(`No login form in widget: ${iframe.title} - might already be authenticated`);
                        // Remove loading indicator even if no form found
                        this.removeLoadingIndicator(iframe.parentElement.parentElement);
                    }
                } catch (crossOriginError) {
                    console.log(`Cross-origin restriction for widget: ${iframe.title}`);
                    // Try postMessage as fallback
                    iframe.contentWindow.postMessage({
                        type: 'caspio_login',
                        username: username,
                        password: password
                    }, '*');
                    
                    // Remove loading indicator after attempt
                    setTimeout(() => {
                        this.removeLoadingIndicator(iframe.parentElement.parentElement);
                    }, 2000);
                }
            }, 1500); // Increased delay for HTTPS
        } catch (error) {
            console.log('Widget authentication error:', error);
        }
    }

    manuallyAuthenticateWidgets() {
        const username = sessionStorage.getItem('mmvcs_user');
        const password = sessionStorage.getItem('mmvcs_password');
        const iframes = document.querySelectorAll('.widget-frame iframe');
        
        if (this.autoLoginBtn) {
            this.autoLoginBtn.textContent = 'Authenticating...';
            this.autoLoginBtn.disabled = true;
        }
        
        iframes.forEach((iframe, index) => {
            setTimeout(() => {
                this.authenticateWidget(iframe, username, password);
            }, index * 1000);
        });
        
        setTimeout(() => {
            if (this.autoLoginBtn) {
                this.autoLoginBtn.textContent = 'Auto-Login All Widgets';
                this.autoLoginBtn.disabled = false;
            }
        }, iframes.length * 1000 + 3000);
    }

    addLoadingIndicator(container) {
        if (container.querySelector('.loading-indicator')) return;
        
        const loading = document.createElement('div');
        loading.className = 'loading-indicator';
        loading.innerHTML = `
            <div class="spinner"></div>
            <p>Loading widget...</p>
        `;
        container.appendChild(loading);
        
        // Add CSS for loading indicator
        if (!document.querySelector('#loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                .loading-indicator {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.9);
                    z-index: 10;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 10px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .error-indicator {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.95);
                    color: #e74c3c;
                    z-index: 10;
                }
            `;
            document.head.appendChild(style);
        }
    }

    removeLoadingIndicator(container) {
        const loading = container.querySelector('.loading-indicator');
        if (loading) {
            loading.remove();
        }
    }

    handleWidgetError(container, widgetTitle) {
        this.removeLoadingIndicator(container);
        
        const error = document.createElement('div');
        error.className = 'error-indicator';
        error.innerHTML = `
            <div style="text-align: center;">
                <h4>Unable to load widget</h4>
                <p>${widgetTitle}</p>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px;">Retry</button>
            </div>
        `;
        container.appendChild(error);
    }

    showError(message) {
        this.loginError.textContent = message;
        this.loginError.style.display = 'block';
    }

    hideError() {
        this.loginError.style.display = 'none';
    }

    isLoggedIn() {
        const authenticated = sessionStorage.getItem('mmvcs_authenticated');
        const loginTime = sessionStorage.getItem('mmvcs_login_time');
        
        if (!authenticated || !loginTime) {
            return false;
        }
        
        // Check if session has expired (30 minutes)
        const sessionAge = Date.now() - parseInt(loginTime);
        const maxAge = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        if (sessionAge > maxAge) {
            this.handleLogout();
            return false;
        }
        
        return true;
    }

    setupAutoLogout() {
        // Auto-logout after 30 minutes of inactivity
        let inactivityTimer;
        
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            if (this.isLoggedIn()) {
                inactivityTimer = setTimeout(() => {
                    alert('Session expired due to inactivity. Please log in again.');
                    this.handleLogout();
                }, 30 * 60 * 1000); // 30 minutes
            }
        };
        
        // Reset timer on user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        resetTimer(); // Initialize timer
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DashboardApp();
});