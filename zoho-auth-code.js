// Paste this JavaScript code into Zoho Connect to handle authentication
// This listens for the login widget and authenticates other Caspio widgets

(function() {
    console.log('MMVCS Zoho authentication handler loaded');
    
    // Listen for authentication from the login widget
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'mmvcs_auth') {
            var username = event.data.username;
            var password = event.data.password;
            
            console.log('Received authentication for user:', username);
            
            // Find all iframes (Caspio widgets) and authenticate them
            var iframes = document.querySelectorAll('iframe');
            console.log('Found', iframes.length, 'iframes to authenticate');
            
            for (var i = 0; i < iframes.length; i++) {
                (function(iframe, index) {
                    setTimeout(function() {
                        try {
                            // Send authentication to each iframe
                            iframe.contentWindow.postMessage({
                                type: 'caspio_auth',
                                username: username,
                                password: password
                            }, '*');
                            console.log('Sent auth to iframe', index);
                        } catch (e) {
                            console.log('Could not send to iframe', index, ':', e.message);
                        }
                    }, index * 500); // Stagger the attempts
                })(iframes[i], i);
            }
            
            // Also try to authenticate any direct forms on the page
            setTimeout(function() {
                authenticateForms(username, password);
            }, 2000);
        }
    });
    
    function authenticateForms(username, password) {
        var forms = document.querySelectorAll('form');
        console.log('Attempting to authenticate', forms.length, 'forms');
        
        for (var i = 0; i < forms.length; i++) {
            var form = forms[i];
            var usernameField = form.querySelector('input[type="text"], input[name*="user"], input[name*="login"]');
            var passwordField = form.querySelector('input[type="password"]');
            var submitBtn = form.querySelector('input[type="submit"], button[type="submit"], button');
            
            if (usernameField && passwordField) {
                usernameField.value = username;
                passwordField.value = password;
                
                // Trigger events
                usernameField.dispatchEvent(new Event('input', {bubbles: true}));
                passwordField.dispatchEvent(new Event('input', {bubbles: true}));
                
                if (submitBtn) {
                    setTimeout(function() {
                        submitBtn.click();
                    }, 200);
                }
                
                console.log('Authenticated form', i);
            }
        }
    }
})();