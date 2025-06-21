// Add Firestore imports at the top
import { db, auth } from './config/firebase-config.js';
import { 
    doc, 
    collection, 
    setDoc, 
    onSnapshot, 
    updateDoc, 
    deleteDoc,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Define constants
const CART_STORAGE_KEY = 'cart';
let cart = [];
let currentUser = null;
let isCartSyncing = false;
let firestoreUnsubscribe = null;

// Initialize cart
function initCart() {
    console.log("🔧 Initializing cart manager");
    
    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is signed in:", user.email);
            currentUser = user;
            // Switch to Firestore cart when user logs in
            switchToFirestoreCart();
        } else {
            console.log("User is signed out");
            currentUser = null;
            // Unsubscribe from Firestore listener if exists
            if (firestoreUnsubscribe) {
                firestoreUnsubscribe();
                firestoreUnsubscribe = null;
            }
            // Load cart from localStorage when user is not logged in
            loadCartFromLocalStorage();
            renderCart();
            updateCartCount();
        }
    });
    
    // Initialize cart from localStorage if on the cart page
    if (window.location.pathname.includes('cart.html')) {
        loadCartFromLocalStorage();
        renderCart();
        setupCartEventListeners();
    }
    
    updateCartCount();
}

// Load cart from localStorage
function loadCartFromLocalStorage() {
    console.log(`Loading cart from localStorage using key "${CART_STORAGE_KEY}"`);
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            console.log(`Loaded ${cart.length} items from localStorage:`, cart);
        } catch (e) {
            console.error("Error parsing cart from localStorage:", e);
            cart = [];
        }
    } else {
        console.log(`No cart found in localStorage with key "${CART_STORAGE_KEY}"`);
        cart = [];
    }
}

// Save cart to localStorage
function saveCartToLocalStorage() {
    console.log(`Saving cart to localStorage with key "${CART_STORAGE_KEY}":`, cart);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// Switch to Firestore cart when user logs in
function switchToFirestoreCart() {
    isCartSyncing = true;
    
    // Load local cart first to merge with Firestore
    const localCart = [...cart];
    
    // Set up listener for Firestore cart
    const userCartRef = collection(db, `users/${currentUser.uid}/cart`);
    
    firestoreUnsubscribe = onSnapshot(userCartRef, (snapshot) => {
        console.log("Firestore cart snapshot received");
        
        if (!isCartSyncing) {
            // Load cart items from Firestore
            const firestoreCart = [];
            snapshot.forEach(doc => {
                const item = doc.data();
                item.id = doc.id;
                firestoreCart.push(item);
            });
            
            cart = firestoreCart;
            console.log("Cart updated from Firestore:", cart);
            
            // Update localStorage with Firestore cart
            saveCartToLocalStorage();
            
            // Update the UI
            renderCart();
            updateCartCount();
        }
    }, (error) => {
        console.error("Error listening to Firestore cart:", error);
    });
    
    // Merge local cart with Firestore
    mergeLocalCartWithFirestore(localCart);
}

// Merge local cart with Firestore
async function mergeLocalCartWithFirestore(localCart) {
    try {
        if (localCart.length === 0) {
            console.log("No local cart items to merge");
            isCartSyncing = false;
            return;
        }
        
        console.log("Merging local cart with Firestore:", localCart);
        
        for (const item of localCart) {
            const cartItemRef = doc(db, `users/${currentUser.uid}/cart/${item.id}`);
            await setDoc(cartItemRef, {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                updatedAt: serverTimestamp()
            });
        }
        
        console.log("Local cart merged with Firestore");
    } catch (error) {
        console.error("Error merging cart with Firestore:", error);
    }
    
    isCartSyncing = false;
}

// Add item to cart
async function addToCart(product) {
    console.log("Adding product to cart:", product);
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
        // Increase quantity if item exists
        cart[existingItemIndex].quantity += 1;
        console.log("Increased quantity for existing item");
    } else {
        // Add new item
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
        });
        console.log("Added new item to cart");
    }
    
    // Save cart
    if (currentUser) {
        await saveCartItemToFirestore(existingItemIndex >= 0 ? cart[existingItemIndex] : cart[cart.length - 1]);
    } else {
        saveCartToLocalStorage();
    }
    
    updateCartCount();
    return true;
}

// Save cart item to Firestore
async function saveCartItemToFirestore(item) {
    try {
        const cartItemRef = doc(db, `users/${currentUser.uid}/cart/${item.id}`);
        await setDoc(cartItemRef, {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            updatedAt: serverTimestamp()
        });
        console.log("Saved item to Firestore:", item);
    } catch (error) {
        console.error("Error saving item to Firestore:", error);
    }
}

// Update quantity
async function updateQuantity(itemId, newQuantity) {
    console.log(`Updating quantity for item ${itemId} to ${newQuantity}`);
    
    if (newQuantity <= 0) {
        return removeItem(itemId);
    }
    
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
        cart[itemIndex].quantity = newQuantity;
        
        if (currentUser) {
            await updateItemInFirestore(cart[itemIndex]);
        } else {
            saveCartToLocalStorage();
        }
        
        renderCart();
        updateCartCount();
    }
}

// Update item in Firestore
async function updateItemInFirestore(item) {
    try {
        const cartItemRef = doc(db, `users/${currentUser.uid}/cart/${item.id}`);
        await updateDoc(cartItemRef, {
            quantity: item.quantity,
            updatedAt: serverTimestamp()
        });
        console.log("Updated item in Firestore:", item);
    } catch (error) {
        console.error("Error updating item in Firestore:", error);
    }
}

// Increase quantity
async function increaseQuantity(itemId) {
    console.log(`Increasing quantity for item ${itemId}`);
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
        cart[itemIndex].quantity += 1;
        
        if (currentUser) {
            await updateItemInFirestore(cart[itemIndex]);
        } else {
            saveCartToLocalStorage();
        }
        
        renderCart();
        updateCartCount();
    }
}

// Decrease quantity
async function decreaseQuantity(itemId) {
    console.log(`Decreasing quantity for item ${itemId}`);
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
            
            if (currentUser) {
                await updateItemInFirestore(cart[itemIndex]);
            } else {
                saveCartToLocalStorage();
            }
        } else {
            return removeItem(itemId);
        }
        
        renderCart();
        updateCartCount();
    }
}

// Remove item from cart
async function removeItem(itemId) {
    console.log(`Removing item ${itemId} from cart`);
    cart = cart.filter(item => item.id !== itemId);
    
    if (currentUser) {
        await removeItemFromFirestore(itemId);
    } else {
        saveCartToLocalStorage();
    }
    
    renderCart();
    updateCartCount();
}

// Remove item from Firestore
async function removeItemFromFirestore(itemId) {
    try {
        const cartItemRef = doc(db, `users/${currentUser.uid}/cart/${itemId}`);
        await deleteDoc(cartItemRef);
        console.log("Removed item from Firestore:", itemId);
    } catch (error) {
        console.error("Error removing item from Firestore:", error);
    }
}

// Clear cart
async function clearCart() {
    console.log("Clearing cart");
    cart = [];
    
    if (currentUser) {
        await clearFirestoreCart();
    } else {
        saveCartToLocalStorage();
    }
    
    renderCart();
    updateCartCount();
}

// Clear Firestore cart
async function clearFirestoreCart() {
    try {
        const userCartRef = collection(db, `users/${currentUser.uid}/cart`);
        const querySnapshot = await getDocs(userCartRef);
        
        const deletePromises = [];
        querySnapshot.forEach(doc => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        console.log("Cleared Firestore cart");
    } catch (error) {
        console.error("Error clearing Firestore cart:", error);
    }
}

// Render cart contents
function renderCart() {
    console.log("Rendering cart:", cart);
    
    // Only run on cart page
    if (!window.location.pathname.includes('cart.html')) {
        return;
    }
    
    const cartContainer = document.getElementById('cart-container');
    const cartEmptyMessage = document.getElementById('cart-empty-message');
    const cartSummary = document.getElementById('cart-summary');
    
    if (!cartContainer) {
        console.error("Cart container not found");
        return;
    }
    
    // Clear loading message
    cartContainer.innerHTML = '';
    
    if (cart.length === 0) {
        // Show empty cart message
        cartEmptyMessage.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        return;
    }
    
    // Hide empty cart message and show summary
    cartEmptyMessage.classList.add('hidden');
    cartSummary.classList.remove('hidden');
    
    // Calculate totals
    let subtotal = 0;
    
    // Render each cart item
    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.dataset.id = item.id;
        
        cartItemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image || 'assets/product-placeholder.jpg'}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p class="price">৳${item.price.toLocaleString()}</p>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-id="${item.id}">
                <button class="quantity-btn increase" data-id="${item.id}">+</button>
            </div>
            <div class="cart-item-subtotal">
                <p>৳${itemSubtotal.toLocaleString()}</p>
            </div>
            <button class="remove-btn" data-id="${item.id}">&times;</button>
        `;
        
        cartContainer.appendChild(cartItemElement);
    });
    
    // Update summary
    const shipping = 200; // Fixed shipping cost
    const total = subtotal + shipping;
    
    document.getElementById('subtotal').textContent = `৳${subtotal.toLocaleString()}`;
    document.getElementById('shipping').textContent = `৳${shipping.toLocaleString()}`;
    document.getElementById('total').textContent = `৳${total.toLocaleString()}`;
}

// Update cart count in navigation
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cart-count');
    
    // Calculate total quantity
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    cartCountElements.forEach(element => {
        element.textContent = totalQuantity;
    });
}

// Set up cart event listeners
function setupCartEventListeners() {
    console.log("Setting up cart event listeners");
    
    const cartContainer = document.getElementById('cart-container');
    const checkoutBtn = document.getElementById('checkout-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    
    if (!cartContainer) {
        console.error("Cart container not found for event listeners");
        return;
    }
    
    // Delegate events for cart items
    cartContainer.addEventListener('click', function(event) {
        // Handle decrease button
        if (event.target.classList.contains('decrease')) {
            const itemId = event.target.dataset.id;
            decreaseQuantity(itemId);
        }
        
        // Handle increase button
        if (event.target.classList.contains('increase')) {
            const itemId = event.target.dataset.id;
            increaseQuantity(itemId);
        }
        
        // Handle remove button
        if (event.target.classList.contains('remove-btn')) {
            const itemId = event.target.dataset.id;
            removeItem(itemId);
        }
    });
    
    // Handle quantity input changes
    cartContainer.addEventListener('change', function(event) {
        if (event.target.classList.contains('quantity-input')) {
            const itemId = event.target.dataset.id;
            const newQuantity = parseInt(event.target.value, 10);
            
            if (newQuantity > 0) {
                updateQuantity(itemId, newQuantity);
            } else {
                event.target.value = 1;
                updateQuantity(itemId, 1);
            }
        }
    });
    
    // Handle checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            // Check if cart has items
            if (cart.length === 0) {
                alert("Your cart is empty. Please add items before checkout.");
                return;
            }
            
            // Navigate to checkout page
            window.location.href = 'checkout.html';
        });
    }
    
    // Handle clear cart button
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your cart?')) {
                clearCart();
            }
        });
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing cart");
    initCart();
});

// Listen for cart cleared events from other parts of the app (e.g., after checkout)
document.addEventListener('cartCleared', function() {
    console.log("Received cartCleared event");
    cart = [];
    updateCartCount();
    
    // If we're on the cart page, re-render it
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }
});

// Export functions for use in other modules
export {
    cart,
    addToCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart
};