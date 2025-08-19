// Zoho Page Authentication Listener
// Add this script to your Zoho page to receive authentication from the dashboard widget

window.addEventListener('message', function(event) {
    // Check if message is from our dashboard
    if (event.data && event.data.type === 'mmvcs_auth_success' && event.data.source === 'mmvcs_dashboard') {
        const username = event.data.username;
        const password = event.data.password;
        
        console.log('Received authentication from dashboard widget');
        
        // Authenticate all Caspio widgets on the Zoho page
        authenticateZohoCaspioWidgets(username, password);
    }
});

function authenticateZohoCaspioWidgets(username, password) {
    // Find all iframes and embedded content that might be Caspio widgets
    const iframes = document.querySelectorAll('iframe');
    const forms = document.querySelectorAll('form');
    
    console.log(`Found ${iframes.length} iframes and ${forms.length} forms to authenticate`);
    
    // Authenticate iframes
    iframes.forEach((iframe, index) => {
        // Skip the dashboard iframe
        if (iframe.src && iframe.src.includes('dashboard.mmvcs-sales.com')) {
            return;
        }
        
        setTimeout(() => {
            authenticateIframe(iframe, username, password);
        }, index * 1000);
    });
    
    // Authenticate direct forms
    forms.forEach((form, index) => {
        setTimeout(() => {
            authenticateForm(form, username, password);
        }, (iframes.length + index) * 1000);
    });
}

function authenticateIframe(iframe, username, password) {
    try {
        setTimeout(() => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                
                // Look for login form
                const usernameField = iframeDoc.querySelector('input[type="text"], input[name*="user"], input[name*="login"]');
                const passwordField = iframeDoc.querySelector('input[type="password"], input[name*="pass"]');
                const submitButton = iframeDoc.querySelector('input[type="submit"], button[type="submit"], button');
                
                if (usernameField && passwordField && submitButton) {
                    // Fill credentials
                    usernameField.value = username;
                    passwordField.value = password;
                    
                    // Trigger events
                    ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
                        usernameField.dispatchEvent(new Event(eventType, { bubbles: true }));
                        passwordField.dispatchEvent(new Event(eventType, { bubbles: true }));
                    });
                    
                    // Submit form
                    setTimeout(() => {
                        submitButton.click();
                        
                        // Try multiple submission methods
                        const form = usernameField.closest('form');
                        if (form) {
                            form.submit();
                        }
                        
                        passwordField.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            which: 13,
                            keyCode: 13,
                            bubbles: true
                        }));
                    }, 500);
                    
                    console.log(`Authenticated Zoho iframe: ${iframe.src}`);
                }
            } catch (crossOriginError) {
                // Try postMessage for cross-origin iframes
                iframe.contentWindow.postMessage({
                    type: 'caspio_auto_auth',
                    username: username,
                    password: password
                }, '*');
                
                console.log(`Sent postMessage to Zoho iframe: ${iframe.src}`);
            }
        }, 1000);
    } catch (error) {
        console.log('Error authenticating Zoho iframe:', error);
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
            ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
                usernameField.dispatchEvent(new Event(eventType, { bubbles: true }));
                passwordField.dispatchEvent(new Event(eventType, { bubbles: true }));
            });
            
            // Submit form
            setTimeout(() => {
                submitButton.click();
                form.submit();
                
                passwordField.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    which: 13,
                    keyCode: 13,
                    bubbles: true
                }));
            }, 500);
            
            console.log('Authenticated Zoho form');
        }
    } catch (error) {
        console.log('Error authenticating Zoho form:', error);
    }
}

console.log('Zoho authentication listener loaded');