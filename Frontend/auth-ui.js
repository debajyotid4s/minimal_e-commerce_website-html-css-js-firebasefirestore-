import { auth } from './config/firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

console.log('Auth UI script loaded');

// Update header based on authentication state
function updateAuthUI() {
    console.log('updateAuthUI function called');
    
    // Find the login link by its href
    const loginLinks = document.querySelectorAll('nav a[href="login_signup.html"]');
    const loginSignupLink = loginLinks.length > 0 ? loginLinks[0] : null;
    
    if (!loginSignupLink) {
        console.error('Login/Signup link not found in the page');
        return;
    }
    
    // Check authentication state
    auth.onAuthStateChanged(function(user) {
        console.log('Auth state changed. User:', user ? user.email : 'logged out');
        
        if (user) {
            // User is logged in - change to "Logout"
            loginSignupLink.textContent = 'Logout';
            loginSignupLink.href = '#';
            
            // Create new element to avoid event listener issues
            const newLink = loginSignupLink.cloneNode(true);
            loginSignupLink.parentNode.replaceChild(newLink, loginSignupLink);
            
            // Add logout functionality
            newLink.addEventListener('click', handleLogout);
        } else {
            // User is logged out - show "Login / Sign Up"
            loginSignupLink.textContent = 'Log In / Sign Up';
            loginSignupLink.href = 'login_signup.html';
        }
    });
}

// Handle logout functionality
async function handleLogout(e) {
    e.preventDefault();
    console.log('Logout clicked');
    
    try {
        await signOut(auth);
        console.log('User signed out successfully');
        
        // Clear stored auth data
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userId');
        
        // Redirect to home page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out: ' + error.message);
    }
}

// Initialize auth UI when DOM is loaded
document.addEventListener('DOMContentLoaded', updateAuthUI);