import { auth, db } from './config/firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import { 
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginToggle = document.getElementById('login-toggle');
    const signupToggle = document.getElementById('signup-toggle');
    const gotoLogin = document.getElementById('goto-login');
    const gotoSignup = document.getElementById('goto-signup');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const forgotPassword = document.querySelector('.forgot-password');
    
    // Get all password fields and toggle buttons
    const passwordFields = document.querySelectorAll('input[type="password"]');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    
    // Password strength elements
    const signupPassword = document.getElementById('signup-password');
    const strengthMeter = document.querySelector('.strength-meter');
    const strengthText = document.querySelector('.strength-text');

    // Toggle between login and signup forms
    function showLoginForm() {
        if (loginForm) loginForm.classList.add('active');
        if (signupForm) signupForm.classList.remove('active');
        if (loginToggle) loginToggle.classList.add('active');
        if (signupToggle) signupToggle.classList.remove('active');
    }

    function showSignupForm() {
        if (signupForm) signupForm.classList.add('active');
        if (loginForm) loginForm.classList.remove('active');
        if (signupToggle) signupToggle.classList.add('active');
        if (loginToggle) loginToggle.classList.remove('active');
    }

    // Event listeners for form toggle
    if (loginToggle) {
        loginToggle.addEventListener('click', showLoginForm);
    }
    
    if (signupToggle) {
        signupToggle.addEventListener('click', showSignupForm);
    }
    
    if (gotoLogin) {
        gotoLogin.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    if (gotoSignup) {
        gotoSignup.addEventListener('click', function(e) {
            e.preventDefault();
            showSignupForm();
        });
    }

    // Toggle password visibility
    togglePasswordButtons.forEach(function(button, index) {
        if (button) {
            button.addEventListener('click', function() {
                const passwordField = passwordFields[index];
                if (passwordField) {
                    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordField.setAttribute('type', type);
                    
                    // Change eye icon based on password visibility
                    const eyeIcon = button.querySelector('.eye-icon');
                    if (eyeIcon) {
                        if (type === 'text') {
                            eyeIcon.src = "assets/unhide.png";
                        } else {
                            eyeIcon.src = "assets/eye.png";
                        }
                    }
                }
            });
        }
    });

    // Password strength checker
    if (signupPassword) {
        signupPassword.addEventListener('input', function() {
            const password = signupPassword.value;
            const strength = checkPasswordStrength(password);
            
            // Remove all classes first
            if (strengthMeter) {
                strengthMeter.classList.remove('weak', 'medium', 'strong', 'very-strong');
                
                // Add the appropriate class based on password strength
                if (strength.className) {
                    strengthMeter.classList.add(strength.className);
                }
            }
            
            // Update the text
            if (strengthText) {
                strengthText.textContent = strength.text;
            }
        });
    }

    function checkPasswordStrength(password) {
        // Password strength criteria
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const length = password.length;
        
        let score = 0;
        if (length > 0) score++;
        if (length >= 8) score++;
        if (hasLowerCase && hasUpperCase) score++;
        if (hasNumbers) score++;
        if (hasSpecial) score++;
        
        if (length === 0) {
            return { text: 'Password strength', className: '' };
        } else if (score <= 2) {
            return { text: 'Weak', className: 'weak' };
        } else if (score === 3) {
            return { text: 'Medium', className: 'medium' };
        } else if (score === 4) {
            return { text: 'Strong', className: 'strong' };
        } else {
            return { text: 'Very Strong', className: 'very-strong' };
        }
    }

    // Form validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function showError(inputElement, message) {
        if (!inputElement) return;
        
        const errorId = `${inputElement.id}-error`;
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
        }
        inputElement.classList.add('error');
    }

    function clearError(inputElement) {
        if (!inputElement) return;
        
        const errorId = `${inputElement.id}-error`;
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
        }
        inputElement.classList.remove('error');
    }

    // Login form validation and submission
    if (loginBtn) {
        loginBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email');
            const password = document.getElementById('login-password');
            const rememberMeCheckbox = document.getElementById('remember-me');
            
            if (!email || !password) return;
            
            const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
            
            let isValid = true;
            
            // Validate email
            if (!email.value.trim()) {
                showError(email, 'Email is required');
                isValid = false;
            } else if (!validateEmail(email.value.trim())) {
                showError(email, 'Please enter a valid email address');
                isValid = false;
            } else {
                clearError(email);
            }
            
            // Validate password
            if (!password.value.trim()) {
                showError(password, 'Password is required');
                isValid = false;
            } else {
                clearError(password);
            }
            
            if (isValid) {
                // Store original button text and disable button
                const originalText = loginBtn.textContent;
                loginBtn.disabled = true;
                loginBtn.textContent = 'Logging in...';
                
                try {
                    // Attempt to sign in using Firebase
                    const userCredential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
                    const user = userCredential.user;
                    
                    // Store login status if "Remember me" is checked
                    if (rememberMe) {
                        localStorage.setItem('rememberedEmail', email.value.trim());
                    } else {
                        localStorage.removeItem('rememberedEmail');
                    }
                    
                    // Set login status in localStorage
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userId', user.uid);
                    
                    console.log('Login successful');
                    
                    // Redirect to home page
                    window.location.href = 'index.html';
                    
                } catch (error) {
                    console.error('Login error:', error);
                    
                    // Display appropriate error message
                    let errorMessage = 'Login failed. Please check your credentials.';
                    
                    if (error.code === 'auth/user-not-found') {
                        errorMessage = 'No user found with this email address';
                    } else if (error.code === 'auth/wrong-password') {
                        errorMessage = 'Incorrect password';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'Invalid email address';
                    } else if (error.code === 'auth/too-many-requests') {
                        errorMessage = 'Too many failed login attempts. Try again later';
                    }
                    
                    showError(email, errorMessage);
                    
                } finally {
                    // Restore button state
                    loginBtn.disabled = false;
                    loginBtn.textContent = originalText;
                }
            }
        });
    }

    // Signup form validation and submission
    if (signupBtn) {
        signupBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('full-name');
            const email = document.getElementById('signup-email');
            const password = document.getElementById('signup-password');
            const confirmPasswordField = document.getElementById('confirm-password');
            const terms = document.getElementById('terms');
            
            if (!fullName || !email || !password || !confirmPasswordField || !terms) return;
            
            let isValid = true;
            
            // Validate full name
            if (!fullName.value.trim()) {
                showError(fullName, 'Full name is required');
                isValid = false;
            } else {
                clearError(fullName);
            }
            
            // Validate email
            if (!email.value.trim()) {
                showError(email, 'Email is required');
                isValid = false;
            } else if (!validateEmail(email.value.trim())) {
                showError(email, 'Please enter a valid email address');
                isValid = false;
            } else {
                clearError(email);
            }
            
            // Validate password
            if (!password.value.trim()) {
                showError(password, 'Password is required');
                isValid = false;
            } else if (password.value.length < 6) {
                showError(password, 'Password must be at least 6 characters');
                isValid = false;
            } else {
                clearError(password);
            }
            
            // Validate confirm password
            if (!confirmPasswordField.value.trim()) {
                showError(confirmPasswordField, 'Please confirm your password');
                isValid = false;
            } else if (confirmPasswordField.value !== password.value) {
                showError(confirmPasswordField, 'Passwords do not match');
                isValid = false;
            } else {
                clearError(confirmPasswordField);
            }
            
            // Validate terms
            if (!terms.checked) {
                const termsError = document.getElementById('terms-error');
                if (termsError) {
                    termsError.textContent = 'You must agree to the Terms & Conditions';
                }
                isValid = false;
            } else {
                const termsError = document.getElementById('terms-error');
                if (termsError) {
                    termsError.textContent = '';
                }
            }
            
            if (isValid) {
                // Store original button text and disable button
                const originalText = signupBtn.textContent;
                signupBtn.disabled = true;
                signupBtn.textContent = 'Creating Account...';
                
                try {
                    // Register user with Firebase
                    const userCredential = await createUserWithEmailAndPassword(
                        auth,
                        email.value.trim(),
                        password.value
                    );
                    
                    const user = userCredential.user;
                    
                    // Update profile with display name
                    await updateProfile(user, {
                        displayName: fullName.value.trim()
                    });
                    
                    // Store additional user data in Firestore
                    await setDoc(doc(db, "users", user.uid), {
                        uid: user.uid,
                        fullName: fullName.value.trim(),
                        email: email.value.trim(),
                        createdAt: new Date()
                    });
                    
                    console.log('Signup successful');
                    
                    // Show success message
                    alert('Account created successfully! You can now log in.');
                    
                    // Reset form
                    signupForm.reset();
                    
                    // Switch to login form
                    showLoginForm();
                    
                } catch (error) {
                    console.error('Signup error:', error);
                    
                    // Display appropriate error message
                    let errorMessage = 'Failed to create account. Please try again.';
                    
                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = 'This email address is already in use';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'Invalid email address';
                    } else if (error.code === 'auth/weak-password') {
                        errorMessage = 'Password is too weak. Use at least 6 characters';
                    }
                    
                    showError(email, errorMessage);
                    
                } finally {
                    // Restore button state
                    signupBtn.disabled = false;
                    signupBtn.textContent = originalText;
                }
            }
        });
    }

    // Handle forgot password
    if (forgotPassword) {
        forgotPassword.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email');
            
            if (!email || !email.value.trim()) {
                showError(email, 'Please enter your email address first');
                return;
            }
            
            if (!validateEmail(email.value.trim())) {
                showError(email, 'Please enter a valid email address');
                return;
            }
            
            try {
                // Send password reset email
                await sendPasswordResetEmail(auth, email.value.trim());
                alert(`Password reset email sent to ${email.value.trim()}. Please check your inbox.`);
            } catch (error) {
                console.error('Forgot password error:', error);
                let errorMessage = 'Failed to send reset email. Please try again.';
                
                if (error.code === 'auth/user-not-found') {
                    errorMessage = 'No account found with this email address';
                }
                
                showError(email, errorMessage);
            }
        });
    }

    // Check if "Remember me" was checked previously
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const emailField = document.getElementById('login-email');
    const rememberMeCheckbox = document.getElementById('remember-me');
    
    if (rememberedEmail && emailField && rememberMeCheckbox) {
        emailField.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
    }
    
    // Check if user is already logged in
    if (auth.currentUser) {
        // If on login page, redirect to home
        if (window.location.pathname.includes('login_signup.html')) {
            window.location.href = 'index.html';
        }
    }
});