import { auth, db } from '../Frontend/config/firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

console.log("Contact service loaded");

// This function will be called from your contact.js instead of simulating submission
window.submitLessonRequestToFirestore = async function(formValues) {
    console.log("Submitting to Firestore:", formValues);
    
    try {
        // Check if user is logged in
        const currentUser = auth.currentUser;
        console.log("Current user:", currentUser ? currentUser.email : "No user logged in");
        
        // Create request data
        const requestData = {
            name: formValues.name,
            email: formValues.email,
            phone: formValues.phone,
            instrument: formValues.instrument,
            experience: formValues.experience,
            lessonType: formValues['lesson-type'],
            message: formValues.message || "",
            userId: currentUser ? currentUser.uid : null,
            userEmail: currentUser ? currentUser.email : formValues.email,
            timestamp: serverTimestamp(),
            status: 'pending'
        };
        
        console.log("Request data prepared:", requestData);
        console.log("Adding document to collection: learning_requests");
        
        // Add document to learning_requests collection
        const docRef = await addDoc(collection(db, "learning_requests"), requestData);
        
        console.log("Document written with ID:", docRef.id);
        return { success: true, docId: docRef.id };
        
    } catch (error) {
        console.error("Error adding document:", error);
        console.error("Error details:", error.code, error.message);
        return { success: false, error: error.message };
    }
};

// Pre-fill email if user is logged in
auth.onAuthStateChanged(function(user) {
    console.log("Auth state changed:", user ? user.email : "No user");
    const emailInput = document.getElementById('email');
    if (user && emailInput) {
        emailInput.value = user.email;
        console.log("Pre-filled email field with:", user.email);
    }
});