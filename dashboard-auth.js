// Dashboard Auto-Authentication from URL Parameters
document.addEventListener('DOMContentLoaded', () => {
    // Check for authentication credentials in URL
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    
    if (authParam) {
        try {
            // Decode credentials from URL
            const decoded = atob(decodeURIComponent(authParam));
            const [username, password] = decoded.split(':');
            
            if (username && password) {
                // Store credentials for widget authentication
                sessionStorage.setItem('mmvcs_user', username);
                sessionStorage.setItem('mmvcs_password', password);
                sessionStorage.setItem('auto_auth', 'true');
                
                // Clean URL to remove credentials
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Wait for widgets to load, then authenticate
                setTimeout(() => {
                    autoAuthenticateAllWidgets(username, password);
                    
                    // Also trigger authentication for other Caspio widgets on the parent page
                    triggerParentAuthentication(username, password);
                }, 5000);
            }
        } catch (error) {
            console.error('Error processing authentication:', error);
        }
    }
});

function autoAuthenticateAllWidgets(username, password) {
    // Find all Caspio widgets that might need authentication
    const widgets = document.querySelectorAll('.widget-frame');
    let authAttempts = 0;
    const maxAttempts = 10; // Try for up to 10 seconds
    
    const attemptAuth = () => {
        let authenticatedCount = 0;
        
        widgets.forEach((widget, index) => {
            // Look for iframes or embedded content within each widget
            const iframe = widget.querySelector('iframe');
            const forms = widget.querySelectorAll('form');
            
            if (iframe) {
                // Try to authenticate iframe
                authenticateIframe(iframe, username, password);
                authenticatedCount++;
            } else if (forms.length > 0) {
                // Try to authenticate forms directly in the widget
                forms.forEach(form => {
                    authenticateForm(form, username, password);
                    authenticatedCount++;
                });
            }
        });
        
        authAttempts++;
        
        // If no authentication attempts were made and we haven't tried too many times, try again
        if (authenticatedCount === 0 && authAttempts < maxAttempts) {
            setTimeout(attemptAuth, 1000);
        }
    };
    
    attemptAuth();
}

function authenticateIframe(iframe, username, password) {
    try {
        setTimeout(() => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                
                // Look for login form in iframe
                const usernameField = iframeDoc.querySelector('input[type="text"], input[name*="user"], input[name*="login"]');
                const passwordField = iframeDoc.querySelector('input[type="password"], input[name*="pass"]');
                const submitButton = iframeDoc.querySelector('input[type="submit"], button[type="submit"], button');
                
                if (usernameField && passwordField && submitButton) {
                    // Fill credentials
                    usernameField.value = username;
                    passwordField.value = password;
                    
                    // Trigger events
                    ['input', 'change', 'keyup'].forEach(eventType => {
                        usernameField.dispatchEvent(new Event(eventType, { bubbles: true }));
                        passwordField.dispatchEvent(new Event(eventType, { bubbles: true }));
                    });
                    
                    // Submit form with multiple methods
                    setTimeout(() => {
                        // Try clicking the button
                        submitButton.click();
                        
                        // Also try submitting the form directly
                        const form = usernameField.closest('form');
                        if (form) {
                            form.submit();
                        }
                        
                        // Try pressing Enter key
                        passwordField.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            which: 13,
                            keyCode: 13,
                            bubbles: true
                        }));
                    }, 500);
                    
                    console.log(`Auto-authenticated iframe: ${iframe.name || iframe.title}`);
                }
            } catch (crossOriginError) {
                // Try postMessage for cross-origin iframes
                iframe.contentWindow.postMessage({
                    type: 'caspio_auto_auth',
                    username: username,
                    password: password
                }, '*');
                
                console.log(`Sent postMessage auth to iframe: ${iframe.name || iframe.title}`);
            }
        }, 1000);
    } catch (error) {
        console.log('Error authenticating iframe:', error);
    }
}

function authenticateForm(form, username, password) {
    try {
        // Look for login form fields
        const usernameField = form.querySelector('input[type="text"], input[name*="user"], input[name*="login"]');
        const passwordField = form.querySelector('input[type="password"], input[name*="pass"]');
        const submitButton = form.querySelector('input[type="submit"], button[type="submit"], button');
        
        if (usernameField && passwordField && submitButton) {
            // Fill credentials
            usernameField.value = username;
            passwordField.value = password;
            
            // Trigger events
            ['input', 'change', 'keyup'].forEach(eventType => {
                usernameField.dispatchEvent(new Event(eventType, { bubbles: true }));
                passwordField.dispatchEvent(new Event(eventType, { bubbles: true }));
            });
            
            // Submit form with multiple methods
            setTimeout(() => {
                // Try clicking the button
                submitButton.click();
                
                // Also try submitting the form directly
                const form = usernameField.closest('form');
                if (form) {
                    form.submit();
                }
                
                // Try pressing Enter key
                passwordField.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    which: 13,
                    keyCode: 13,
                    bubbles: true
                }));
            }, 500);
            
            console.log('Auto-authenticated form in widget');
        }
    } catch (error) {
        console.log('Error authenticating form:', error);
    }
}

// Show authentication status
setTimeout(() => {
    if (sessionStorage.getItem('auto_auth') === 'true') {
        // Show a brief success message
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #27ae60; color: white; 
            padding: 15px; border-radius: 5px; z-index: 10000; max-width: 300px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        `;
        statusDiv.innerHTML = `
            ✅ <strong>Auto-authenticated</strong><br>
            Credentials applied to all widgets
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
        `;
        document.body.appendChild(statusDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(statusDiv)) {
                document.body.removeChild(statusDiv);
            }
        }, 5000);
        
        // Clear the flag
        sessionStorage.removeItem('auto_auth');
    }
}, 4000);

function triggerParentAuthentication(username, password) {
    try {
        // Send authentication credentials to parent window (Zoho page)
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'mmvcs_auth_success',
                username: username,
                password: password,
                source: 'mmvcs_dashboard'
            }, '*');
            
            console.log('Sent authentication to parent window');
        }
    } catch (error) {
        console.log('Error sending auth to parent:', error);
    }
}

// Listen for authentication requests from parent window
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'mmvcs_auth_request') {
        const username = sessionStorage.getItem('mmvcs_user');
        const password = sessionStorage.getItem('mmvcs_password');
        
        if (username && password) {
            // Re-trigger authentication
            autoAuthenticateAllWidgets(username, password);
            
            // Send credentials back to parent
            event.source.postMessage({
                type: 'mmvcs_auth_response',
                username: username,
                password: password
            }, event.origin);
        }
    }
});