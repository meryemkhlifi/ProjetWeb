document.addEventListener('DOMContentLoaded', () => {
    // Debug form elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    console.log('Login form element:', loginForm);
    console.log('Signup form element:', signupForm);
    console.log('Is loginForm a form?', loginForm instanceof HTMLFormElement);
    console.log('Is signupForm a form?', signupForm instanceof HTMLFormElement);

    const loginButton = document.querySelector('.logn-btn');
    const closeLoginBtn = document.getElementById('close-login');

    // Show/hide login form
    loginButton.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
    });
    closeLoginBtn.addEventListener('click', () => {
        loginForm.classList.add('hidden');
    });

    const joinNowBtn = document.getElementById("join-now-btn");
    const closeSignupBtn = document.getElementById("close-signup");

    // Show/hide signup form
    joinNowBtn.addEventListener("click", () => {
        signupForm.classList.remove("hidden");
    });
    closeSignupBtn.addEventListener("click", () => {
        signupForm.classList.add("hidden");
    });

    const signupLink = document.getElementById("signup-link");
    signupLink.addEventListener("click", () => {
        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");
    });

    // Card click handlers
    const cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            const link = card.getAttribute("data-link");
            if (link) window.location.href = link;
        });
    });

    // Fixed Signup Handler
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form elements directly (works better with hyphenated names)
        const formElements = signupForm.elements;
        const data = {
            name: formElements['name'].value.trim(),
            'family-name': formElements['family-name'].value.trim(),
            profession: formElements['profession'].value.trim(),
            'user-type': formElements['user-type'].value,
            dob: formElements['dob'].value,
            email: formElements['email'].value.trim(),
            password: formElements['password'].value
        };

        console.log('Submitting signup data:', data);

        try {
            const response = await fetch('/mon-projet-alzheimer/database/signup.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            // Handle non-JSON responses
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Server error');
            }

            const result = await response.json();
            console.log('Signup response:', result);
            
            if (result.success) {
                alert('Account created successfully! Please login.');
                signupForm.reset();
                signupForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            } else {
                alert(result.message || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert(`Error: ${error.message}`);
        }
    });

    // Login Handler - Updated Version
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values using reliable method
        const email = loginForm.querySelector('[name="email"]').value.trim();
        const password = loginForm.querySelector('[name="password"]').value;

        console.log('Attempting login with:', { email, password });

        try {
            const response = await fetch('/mon-projet-alzheimer/database/login.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            // Handle HTTP errors
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Login failed');
            }

            const result = await response.json();
            console.log('Login response:', result);

            if (result.success) {
                // Store user name for display
                localStorage.setItem('userName', result.user_name || 'User');
                window.location.href = result.redirect || 'home.html';
            } else {
                alert(result.message || 'Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Login error. Please try again.');
        }
    });
});
// Add this code to your buttons.js file or create a new script

document.addEventListener('DOMContentLoaded', function() {
    // Get the download app button
    const downloadAppBtn = document.querySelector('a.btn[href="*"]');
    
    if (downloadAppBtn) {
        // Add click event listener
        downloadAppBtn.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Create message element if it doesn't exist
            let messageElement = document.getElementById('app-download-message');
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = 'app-download-message';
                messageElement.style.position = 'fixed';
                messageElement.style.top = '50%';
                messageElement.style.left = '50%';
                messageElement.style.transform = 'translate(-50%, -50%)';
                messageElement.style.background = 'white';
                messageElement.style.padding = '20px';
                messageElement.style.borderRadius = '10px';
                messageElement.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
                messageElement.style.zIndex = '2000';
                messageElement.style.textAlign = 'center';
                messageElement.style.maxWidth = '90%';
                messageElement.style.width = '400px';
                messageElement.style.animation = 'fadeIn 0.3s ease-in-out';
                
                // Add message content
                const messageContent = document.createElement('div');
                messageContent.innerHTML = `
                    <h3 style="color: #333; margin-bottom: 15px;">We're Still Working On That!</h3>
                    <p style="color: #666; margin-bottom: 20px;">Our mobile app is currently under development. We're working hard to bring you the best experience possible.</p>
                    <p style="color: #666; margin-bottom: 25px;">Join our waitlist to be notified when the app is available!</p>
                    <div style="margin-bottom: 20px;">
                        <input type="email" placeholder="Enter your email" style="padding: 10px; width: 100%; border-radius: 5px; border: 1px solid #ccc; margin-bottom: 10px;">
                        <button style="background-image: linear-gradient(45deg, #df4881, #c430d7); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; width: 100%;">Join Waitlist</button>
                    </div>
                    <button id="close-app-message" style="background: none; border: none; color: #999; cursor: pointer; padding: 5px 10px;">Close</button>
                `;
                messageElement.appendChild(messageContent);
                document.body.appendChild(messageElement);
                
                // Add overlay
                const overlay = document.createElement('div');
                overlay.id = 'app-download-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                overlay.style.zIndex = '1999';
                document.body.appendChild(overlay);
                
                // Close button functionality
                document.getElementById('close-app-message').addEventListener('click', function() {
                    messageElement.remove();
                    overlay.remove();
                });
                
                // Close when clicking on overlay
                overlay.addEventListener('click', function() {
                    messageElement.remove();
                    overlay.remove();
                });
                
                // Add animation keyframes if not already in CSS
                if (!document.getElementById('fadeInAnimation')) {
                    const styleSheet = document.createElement('style');
                    styleSheet.id = 'fadeInAnimation';
                    styleSheet.textContent = `
                        @keyframes fadeIn {
                            from {
                                opacity: 0;
                                transform: translate(-50%, -60%);
                            }
                            to {
                                opacity: 1;
                                transform: translate(-50%, -50%);
                            }
                        }
                    `;
                    document.head.appendChild(styleSheet);
                }
            }
        });
    }
});