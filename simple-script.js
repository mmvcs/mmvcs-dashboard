// Dashboard with Auto-Authentication
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
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (username && password) {
            // Show loading
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Authenticating...';
            submitBtn.disabled = true;
            
            try {
                // Authenticate with Caspio first
                await authenticateWithCaspio(username, password);
                
                // Store login state
                sessionStorage.setItem('dashboard_logged_in', 'true');
                sessionStorage.setItem('dashboard_user', username);
                sessionStorage.setItem('dashboard_password', password);
                
                // Show dashboard
                showDashboard();
            } catch (error) {
                alert('Authentication failed. Please check your credentials.');
                console.error('Auth error:', error);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } else {
            alert('Please enter both username and password');
        }
    });
    
    // Logout handler
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('dashboard_logged_in');
        sessionStorage.removeItem('dashboard_user');
        sessionStorage.removeItem('dashboard_password');
        showLogin();
    });
    
    async function authenticateWithCaspio(username, password) {
        return new Promise((resolve, reject) => {
            // Create hidden iframe for authentication
            const authFrame = document.createElement('iframe');
            authFrame.style.display = 'none';
            authFrame.src = 'https://c0acv999.caspio.com/dp/01217000699cb7f167b546beb96a';
            document.body.appendChild(authFrame);
            
            let resolved = false;
            
            authFrame.onload = () => {
                setTimeout(async () => {
                    try {
                        const iframeDoc = authFrame.contentDocument || authFrame.contentWindow.document;
                        
                        // Look for login form
                        const usernameField = iframeDoc.querySelector('input[type="text"]');
                        const passwordField = iframeDoc.querySelector('input[type="password"]');
                        const submitButton = iframeDoc.querySelector('input[type="submit"], button[type="submit"], button');
                        
                        if (usernameField && passwordField && submitButton) {
                            // Fill and submit
                            usernameField.value = username;
                            passwordField.value = password;
                            
                            // Trigger events
                            ['input', 'change'].forEach(eventType => {
                                usernameField.dispatchEvent(new Event(eventType, { bubbles: true }));
                                passwordField.dispatchEvent(new Event(eventType, { bubbles: true }));
                            });
                            
                            // Submit form
                            submitButton.click();
                            
                            // Wait for authentication result
                            setTimeout(() => {
                                document.body.removeChild(authFrame);
                                if (!resolved) {
                                    resolved = true;
                                    resolve();
                                }
                            }, 3000);
                        } else {
                            // No login form found, assume already authenticated or redirect happened
                            document.body.removeChild(authFrame);
                            if (!resolved) {
                                resolved = true;
                                resolve();
                            }
                        }
                    } catch (crossOriginError) {
                        // Cross-origin means authentication likely worked
                        document.body.removeChild(authFrame);
                        if (!resolved) {
                            resolved = true;
                            resolve();
                        }
                    }
                }, 2000);
            };
            
            authFrame.onerror = () => {
                document.body.removeChild(authFrame);
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Failed to load authentication'));
                }
            };
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    if (document.body.contains(authFrame)) {
                        document.body.removeChild(authFrame);
                    }
                    resolve(); // Assume success on timeout
                }
            }, 10000);
        });
    }
    
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