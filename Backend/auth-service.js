import { auth, db } from '../Frontend/config/firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import { 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/**
 * Authentication Service - Handles user authentication with Firebase
 */
const AuthService = {
    /**
     * Register a new user with email and password
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {string} fullName - User's full name
     * @returns {Promise<Object>} User data object
     */
    signUp: async function(email, password, fullName) {
        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update user profile with displayName
            await updateProfile(user, {
                displayName: fullName
            });
            
            // Store user data in Firestore "users" collection
            const userDocRef = doc(db, "users", user.uid);
            
            await setDoc(userDocRef, {
                uid: user.uid,
                email: email,
                fullName: fullName,
                createdAt: new Date(),
                lastLogin: new Date()
            });
            
            return {
                uid: user.uid,
                email: user.email,
                fullName: fullName
            };
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    },
    
    /**
     * Sign in an existing user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<Object>} User data object
     */
    signIn: async function(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Get user data from Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                return {
                    uid: user.uid,
                    email: user.email,
                    fullName: userDoc.data().fullName
                };
            } else {
                return {
                    uid: user.uid,
                    email: user.email
                };
            }
        } catch (error) {
            console.error("Error signing in:", error);
            throw error;
        }
    },
    
    /**
     * Sign out the current user
     * @returns {Promise<boolean>}
     */
    signOut: async function() {
        try {
            await signOut(auth);
            return true;
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    },
    
    /**
     * Send password reset email
     * @param {string} email - User's email address
     * @returns {Promise<boolean>}
     */
    resetPassword: async function(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error) {
            console.error("Error sending password reset email:", error);
            throw error;
        }
    },
    
    /**
     * Get current authenticated user
     * @returns {Promise<Object|null>} User data or null if not authenticated
     */
    getCurrentUser: function() {
        return new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, 
                (user) => {
                    unsubscribe();
                    resolve(user);
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }
};

export default AuthService;