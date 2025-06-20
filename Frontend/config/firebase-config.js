// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3PxkxbjJX4yryvu2RRhsBXXO6_Xd3tY4",
  authDomain: "anusswar-website.firebaseapp.com",
  projectId: "anusswar-website",
  storageBucket: "anusswar-website.appspot.com", // Fixed this value
  messagingSenderId: "1001410402088",
  appId: "1:1001410402088:web:89c2dbc2dcf407bed2e21d",
  measurementId: "G-6CHQ533YN1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export the services
export { db, auth, analytics , storage };