// Zoho Widget Authentication Receiver
// Include this script in your Caspio widgets or Zoho page to receive authentication

(function() {
    'use strict';
    
    let debugMode = true;
    let authAttempts = 0;
    let maxAttempts = 30;
    
    function log(message) {
        if (debugMode) {
            console.log('[MMVCS Auth Receiver]', message);
        }
    }
    
    log('Authentication receiver initialized');
    
    // Listen for authentication messages
    window.addEventListener('message', function(event) {
        log(`Received message type: ${event.data?.type}`);
        
        if (event.data && isAuthMessage(event.data)) {
            const { username, password } = event.data;
            log(`Received credentials for user: ${username}`);
            
            // Try to authenticate immediately
            authenticateCurrentWidget(username, password);
            
            // Also store for later use
            storeCredentials(username, password);
        }
    });
    
    function isAuthMessage(data) {
        const authTypes = [
            'mmvcs_auth_success',
            'mmvcs_auth_broadcast',
            'caspio_auto_auth',
            'auto_authenticate',
            'login_credentials',
            'caspio_login',
            'widget_auth',
            'zoho_widget_auth',
            'caspio_global_auth'
        ];
        
        return authTypes.includes(data.type) && data.username && data.password;
    }
    
    function authenticateCurrentWidget(username, password) {
        log('Attempting to authenticate current widget');
        
        // Method 1: Find and fill login forms
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
            setTimeout(() => {
                authenticateForm(form, username, password, index);
            }, index * 200);
        });
        
        // Method 2: Look for common input patterns
        setTimeout(() => {
            authenticateInputFields(username, password);
        }, 500);
        
        // Method 3: Try iframe content if applicable
        setTimeout(() => {
            authenticateIframes(username, password);
        }, 1000);
    }
    
    function authenticateForm(form, username, password, formIndex) {
        try {
            const usernameField = findUsernameField(form);
            const passwordField = findPasswordField(form);
            const submitButton = findSubmitButton(form);
            
            if (usernameField && passwordField) {
                log(`Authenticating form ${formIndex}`);
                
                // Clear existing values
                usernameField.value = '';
                passwordField.value = '';
                
                // Set new values
                usernameField.value = username;
                passwordField.value = password;
                
                // Trigger various events
                const events = ['input', 'change', 'keyup', 'blur', 'focus'];
                events.forEach(eventType => {
                    usernameField.dispatchEvent(new Event(eventType, { bubbles: true }));
                    passwordField.dispatchEvent(new Event(eventType, { bubbles: true }));
                });
                
                // Wait a moment then submit
                setTimeout(() => {
                    submitForm(form, submitButton, usernameField, passwordField);
                }, 300);
                
                log(`Form ${formIndex} credentials filled`);
            }
        } catch (error) {
            log(`Error authenticating form ${formIndex}: ${error.message}`);
        }
    }
    
    function findUsernameField(container) {
        const selectors = [
            'input[type="text"]',
            'input[name*="user"]',
            'input[name*="login"]',
            'input[name*="email"]',
            'input[id*="user"]',
            'input[id*="login"]',
            'input[placeholder*="user"]',
            'input[placeholder*="login"]'
        ];
        
        for (let selector of selectors) {
            const field = container.querySelector(selector);
            if (field) return field;
        }
        return null;
    }
    
    function findPasswordField(container) {
        const selectors = [
            'input[type="password"]',
            'input[name*="pass"]',
            'input[id*="pass"]',
            'input[placeholder*="pass"]'
        ];
        
        for (let selector of selectors) {
            const field = container.querySelector(selector);
            if (field) return field;
        }
        return null;
    }
    
    function findSubmitButton(container) {
        const selectors = [
            'input[type="submit"]',
            'button[type="submit"]',
            'button',
            'input[value*="login"]',
            'input[value*="sign"]',
            'button[class*="submit"]',
            'button[class*="login"]'
        ];
        
        for (let selector of selectors) {
            const button = container.querySelector(selector);
            if (button) return button;
        }
        return null;
    }
    
    function submitForm(form, submitButton, usernameField, passwordField) {
        try {
            // Method 1: Click submit button
            if (submitButton) {
                submitButton.click();
                log('Clicked submit button');
            }
            
            // Method 2: Submit form directly
            setTimeout(() => {
                if (form.submit) {
                    form.submit();
                    log('Called form.submit()');
                }
            }, 100);
            
            // Method 3: Enter key on password field
            setTimeout(() => {
                passwordField.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    which: 13,
                    keyCode: 13,
                    bubbles: true
                }));
                log('Sent Enter key to password field');
            }, 200);
            
            // Method 4: Try common submit functions
            setTimeout(() => {
                if (window.submitLogin) window.submitLogin();
                if (window.doLogin) window.doLogin();
                if (window.authenticate) window.authenticate();
                log('Tried common submit functions');
            }, 300);
            
        } catch (error) {
            log(`Error submitting form: ${error.message}`);
        }
    }
    
    function authenticateInputFields(username, password) {
        try {
            log('Scanning for loose input fields');
            
            const usernameField = findUsernameField(document);
            const passwordField = findPasswordField(document);
            
            if (usernameField && passwordField) {
                usernameField.value = username;
                passwordField.value = password;
                
                ['input', 'change', 'blur'].forEach(eventType => {
                    usernameField.dispatchEvent(new Event(eventType, { bubbles: true }));
                    passwordField.dispatchEvent(new Event(eventType, { bubbles: true }));
                });
                
                log('Filled loose input fields');
            }
        } catch (error) {
            log(`Error with input fields: ${error.message}`);
        }
    }
    
    function authenticateIframes(username, password) {
        try {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach((iframe, index) => {
                setTimeout(() => {
                    try {
                        // Try to access iframe content
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (iframeDoc) {
                            const forms = iframeDoc.querySelectorAll('form');
                            forms.forEach((form, formIndex) => {
                                authenticateForm(form, username, password, `iframe-${index}-form-${formIndex}`);
                            });
                        }
                    } catch (crossOriginError) {
                        // Try postMessage for cross-origin iframes
                        iframe.contentWindow.postMessage({
                            type: 'caspio_auto_auth',
                            username: username,
                            password: password
                        }, '*');
                        log(`Sent postMessage to iframe ${index}`);
                    }
                }, index * 200);
            });
        } catch (error) {
            log(`Error with iframes: ${error.message}`);
        }
    }
    
    function storeCredentials(username, password) {
        try {
            // Store in various locations for persistence
            sessionStorage.setItem('mmvcs_username', username);
            sessionStorage.setItem('mmvcs_password', password);
            
            // Also create global variables
            window.mmvcs_credentials = { username, password };
            
            log('Credentials stored for future use');
        } catch (error) {
            log(`Error storing credentials: ${error.message}`);
        }
    }
    
    function requestAuthentication() {
        authAttempts++;
        if (authAttempts > maxAttempts) {
            log('Max authentication attempts reached');
            return;
        }
        
        log(`Requesting authentication (attempt ${authAttempts})`);
        
        // Request credentials from parent
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'auth_request',
                source: 'widget'
            }, '*');
        }
        
        // Check for stored credentials
        const storedUsername = sessionStorage.getItem('mmvcs_username');
        const storedPassword = sessionStorage.getItem('mmvcs_password');
        if (storedUsername && storedPassword) {
            log('Found stored credentials, attempting authentication');
            authenticateCurrentWidget(storedUsername, storedPassword);
        }
        
        // Check parent storage
        try {
            const parentData = window.parent.localStorage.getItem('mmvcs_auth_data');
            if (parentData) {
                const { username, password } = JSON.parse(parentData);
                if (username && password) {
                    log('Found parent stored credentials');
                    authenticateCurrentWidget(username, password);
                }
            }
        } catch (e) {
            // Silent fail
        }
        
        // Check parent window property
        try {
            if (window.parent.mmvcs_auth_credentials) {
                const { username, password } = window.parent.mmvcs_auth_credentials;
                if (username && password) {
                    log('Found parent window credentials');
                    authenticateCurrentWidget(username, password);
                }
            }
        } catch (e) {
            // Silent fail
        }
    }
    
    // Auto-request authentication on load
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(requestAuthentication, 500);
    });
    
    // Also request immediately if DOM is already loaded
    if (document.readyState === 'loading') {
        // Wait for DOMContentLoaded
    } else {
        setTimeout(requestAuthentication, 500);
    }
    
    // Periodic authentication attempts for late-loading widgets
    setInterval(() => {
        if (authAttempts < maxAttempts) {
            requestAuthentication();
        }
    }, 2000);
    
    log('Zoho widget authentication receiver ready');
    
})();