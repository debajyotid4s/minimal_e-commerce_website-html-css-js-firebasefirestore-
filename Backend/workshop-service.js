// Import Firebase services from your config file
import { db, auth } from '../Frontend/config/firebase-config.js';
import { collection, addDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

console.log("Workshop service loaded");

document.addEventListener('DOMContentLoaded', function() {
    console.log("Workshop service DOM loaded");
    
    // Get elements
    const tuneinButton = document.getElementById('tunein-button');
    const descriptionField = document.getElementById('description');
    const submissionStatus = document.getElementById('submission-status');
    
    // Only proceed if we found the button
    if (!tuneinButton) {
        console.error("TuneIn button not found");
        return;
    }
    
    console.log("TuneIn button found, adding listener");
    
    // Create a new submit handler for the TuneIn button
    tuneinButton.addEventListener('click', async function(e) {
        console.log("TuneIn button clicked in service");
        
        // Get form values
        const description = descriptionField.value.trim();
        
        // Validate inputs
        if (description === '') {
            showStatusMessage('Please provide a description of your instrument.', 'error');
            return;
        }
        
        // Check if user is logged in
        const currentUser = auth.currentUser;
        if (!currentUser) {
            showStatusMessage('Please log in to submit a custom instrument request.', 'error');
            return;
        }
        
        console.log("Current user:", currentUser.email);
        
        // Show loading state
        tuneinButton.disabled = true;
        tuneinButton.textContent = 'Submitting...';
        
        try {
            // Create order data (without image URLs)
            const orderData = {
                description: description,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                status: 'pending',
                createdAt: new Date().toISOString(),
                lastUpdatedAt: new Date().toISOString()
            };
            
            // Save to Firestore
            const userDocRef = doc(db, "users", currentUser.uid);
            const orderCollectionRef = collection(userDocRef, "custom_instrument_orders");
            const newOrderRef = await addDoc(orderCollectionRef, orderData);
            
            console.log("Order saved with ID:", newOrderRef.id);
            
            // Show success message and reset form
            showStatusMessage('Your custom instrument request has been submitted successfully! Our team will contact you soon.', 'success');
            descriptionField.value = '';
            
        } catch (error) {
            console.error("Error submitting order:", error);
            showStatusMessage(`Error: ${error.message}. Please try again.`, 'error');
        } finally {
            // Re-enable button
            tuneinButton.disabled = false;
            tuneinButton.textContent = 'TuneIn';
        }
    });
    
    // Helper function to show status messages
    function showStatusMessage(message, type) {
        submissionStatus.textContent = message;
        submissionStatus.className = 'submission-status ' + type;
        
        // Scroll to the message
        submissionStatus.scrollIntoView({ behavior: 'smooth' });
        
        // Hide the message after a while if it's a success
        if (type === 'success') {
            setTimeout(() => {
                submissionStatus.textContent = '';
                submissionStatus.className = 'submission-status';
            }, 5000);
        }
    }
});