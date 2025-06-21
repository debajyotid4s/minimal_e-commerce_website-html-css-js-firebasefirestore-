// cart-manager.js - Updated version with fixes for the "NaN" item ID issue

import { db, auth } from './config/firebase-config.js';
import { 
    collection, doc, setDoc, getDocs, deleteDoc, 
    query, where, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ============================
// CART STATE MANAGEMENT
// ============================
let cart = [];
let currentUser = null;
let isCartSyncing = false;
let firestoreUnsubscribe = null;

// ============================
// INITIALIZATION
// ============================
function initCart() {
    console.log("🛒 Initializing cart manager");
    
    // First load cart from localStorage
    loadCartFromLocalStorage();
    
    // Set up auth state change listener
    auth.onAuthStateChanged(async (user) => {
        if (currentUser && !user) {
            // User logged out
            console.log("User logged out, unsubscribing from Firestore");
            if (firestoreUnsubscribe) {
                firestoreUnsubscribe();
                firestoreUnsubscribe = null;
            }
        }
        
        // Update current user
        currentUser = user;
        
        if (user) {
            console.log(`User logged in: ${user.email}`);
            
            try {
                // Merge local cart with Firestore cart
                await syncWithFirestore();
                
                // Listen for remote changes
                subscribeToFirestore();
            } catch (error) {
                console.error("Error during cart initialization:", error);
            }
        }
        
        // Display cart (whether logged in or not)
        renderCart();
        updateCartBadge();
    });
}

// ============================
// STORAGE FUNCTIONS
// ============================

// Load cart from localStorage
function loadCartFromLocalStorage() {
    try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart).map(item => ({
                ...item,
                id: parseInt(item.id),
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity)
            }));
            console.log(`Loaded ${cart.length} items from localStorage`);
        }
    } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        cart = [];
    }
}

// Save cart to localStorage
function saveCartToLocalStorage() {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
        console.error("Error saving cart to localStorage:", error);
    }
}

// ============================
// FIRESTORE SYNC FUNCTIONS
// ============================

// Subscribe to Firestore changes
function subscribeToFirestore() {
    if (!currentUser || firestoreUnsubscribe) return;
    
    const userCartRef = collection(db, "users", currentUser.uid, "cart_items");
    
    firestoreUnsubscribe = onSnapshot(userCartRef, (snapshot) => {
        // Skip if we're currently syncing to avoid infinite loop
        if (isCartSyncing) return;
        
        console.log("Remote cart updated in Firestore, refreshing local cart");
        isCartSyncing = true;
        
        try {
            const firestoreCart = [];
            snapshot.forEach((doc) => {
                const item = doc.data();
                firestoreCart.push({
                    id: parseInt(item.id),
                    name: item.name,
                    price: parseFloat(item.price),
                    image: item.image,
                    quantity: parseInt(item.quantity)
                });
            });
            
            // Only update if there's an actual difference
            const currentCartJSON = JSON.stringify(cart.sort((a, b) => a.id - b.id));
            const firestoreCartJSON = JSON.stringify(firestoreCart.sort((a, b) => a.id - b.id));
            
            if (currentCartJSON !== firestoreCartJSON) {
                console.log("Cart changed in Firestore, updating local cart");
                cart = firestoreCart;
                saveCartToLocalStorage();
                renderCart();
                updateCartBadge();
            }
        } catch (error) {
            console.error("Error handling Firestore cart update:", error);
        } finally {
            isCartSyncing = false;
        }
    }, (error) => {
        console.error("Error listening to Firestore cart changes:", error);
        isCartSyncing = false;
    });
}

// Sync local cart with Firestore
async function syncWithFirestore() {
    if (!currentUser || isCartSyncing) return;
    
    try {
        isCartSyncing = true;
        console.log("Syncing cart with Firestore...");
        
        // Fetch Firestore cart
        const userCartRef = collection(db, "users", currentUser.uid, "cart_items");
        const snapshot = await getDocs(userCartRef);
        
        const firestoreCart = [];
        snapshot.forEach((doc) => {
            const item = doc.data();
            firestoreCart.push({
                id: parseInt(item.id),
                name: item.name,
                price: parseFloat(item.price),
                image: item.image,
                quantity: parseInt(item.quantity)
            });
        });
        
        // Merge local and Firestore carts
        const localCart = [...cart];
        const mergedCart = [];
        const processedIds = new Set();
        
        // First process Firestore items
        firestoreCart.forEach(firestoreItem => {
            const localItem = localCart.find(item => item.id === firestoreItem.id);
            if (localItem) {
                // Item exists in both carts, use the higher quantity
                mergedCart.push({
                    ...firestoreItem,
                    quantity: Math.max(firestoreItem.quantity, localItem.quantity)
                });
            } else {
                // Item only in Firestore
                mergedCart.push(firestoreItem);
            }
            processedIds.add(firestoreItem.id);
        });
        
        // Then add local items that aren't in Firestore
        localCart.forEach(localItem => {
            if (!processedIds.has(localItem.id)) {
                mergedCart.push(localItem);
            }
        });
        
        // Update cart
        cart = mergedCart;
        
        // Save to localStorage
        saveCartToLocalStorage();
        
        // Update Firestore with merged cart
        await updateFirestore();
        
        console.log("Cart sync completed successfully");
    } catch (error) {
        console.error("Error syncing cart with Firestore:", error);
    } finally {
        isCartSyncing = false;
    }
}

// Update Firestore with current cart
async function updateFirestore() {
    if (!currentUser || isCartSyncing) return;
    
    try {
        isCartSyncing = true;
        
        // Get reference to user's cart collection
        const userCartRef = collection(db, "users", currentUser.uid, "cart_items");
        
        // Get existing cart items
        const snapshot = await getDocs(userCartRef);
        const existingIds = new Set();
        snapshot.forEach(doc => existingIds.add(doc.id));
        
        // Current cart IDs
        const currentIds = new Set(cart.map(item => item.id.toString()));
        
        // Delete items no longer in cart
        for (const existingId of existingIds) {
            if (!currentIds.has(existingId)) {
                await deleteDoc(doc(db, "users", currentUser.uid, "cart_items", existingId));
                console.log(`Deleted item ${existingId} from Firestore`);
            }
        }
        
        // Add or update current items
        for (const item of cart) {
            const itemId = item.id.toString();
            await setDoc(doc(db, "users", currentUser.uid, "cart_items", itemId), {
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                updatedAt: new Date().toISOString()
            });
        }
        
        console.log(`Updated Firestore with ${cart.length} items`);
    } catch (error) {
        console.error("Error updating Firestore:", error);
    } finally {
        isCartSyncing = false;
    }
}

// ============================
// CART OPERATIONS
// ============================

// Save and sync cart
async function saveAndSyncCart() {
    // Save to localStorage
    saveCartToLocalStorage();
    
    // Update Firestore if logged in
    if (currentUser && !isCartSyncing) {
        await updateFirestore();
    }
}

// Add item to cart
async function addToCart(item) {
    console.log(`Adding item to cart:`, item);
    
    if (!item || !item.id) {
        console.error("Invalid item:", item);
        return cart;
    }
    
    // Find if item already exists
    const existingIndex = cart.findIndex(cartItem => cartItem.id === parseInt(item.id));
    
    if (existingIndex >= 0) {
        // Update quantity if item exists
        cart[existingIndex].quantity += item.quantity || 1;
    } else {
        // Add new item
        cart.push({
            id: parseInt(item.id),
            name: item.name,
            price: parseFloat(item.price),
            image: item.image,
            quantity: item.quantity || 1
        });
    }
    
    // Save cart
    await saveAndSyncCart();
    
    // Update UI
    renderCart();
    updateCartBadge();
    
    return cart;
}

// Decrease item quantity
async function decreaseQuantity(itemId) {
    console.log(`Decreasing quantity for item ${itemId}`);
    
    // Convert to number if it's a string
    itemId = parseInt(itemId);
    
    if (isNaN(itemId)) {
        console.error("Invalid item ID (not a number):", itemId);
        return;
    }
    
    const index = cart.findIndex(item => item.id === itemId);
    
    if (index === -1) {
        console.error(`Item ${itemId} not found in cart`);
        return;
    }
    
    // Decrease quantity if greater than 1
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
        await saveAndSyncCart();
        renderCart();
        updateCartBadge();
    } else {
        console.log(`Can't decrease quantity below 1 for item ${itemId}`);
    }
}

// Increase item quantity
async function increaseQuantity(itemId) {
    console.log(`Increasing quantity for item ${itemId}`);
    
    // Convert to number if it's a string
    itemId = parseInt(itemId);
    
    if (isNaN(itemId)) {
        console.error("Invalid item ID (not a number):", itemId);
        return;
    }
    
    const index = cart.findIndex(item => item.id === itemId);
    
    if (index === -1) {
        console.error(`Item ${itemId} not found in cart`);
        return;
    }
    
    cart[index].quantity++;
    await saveAndSyncCart();
    renderCart();
    updateCartBadge();
}

// Update item quantity
async function updateQuantity(itemId, newQuantity) {
    console.log(`Updating quantity for item ${itemId} to ${newQuantity}`);
    
    // Convert to number if it's a string
    itemId = parseInt(itemId);
    newQuantity = parseInt(newQuantity);
    
    if (isNaN(itemId)) {
        console.error("Invalid item ID (not a number):", itemId);
        return;
    }
    
    if (isNaN(newQuantity) || newQuantity < 1) {
        console.error(`Invalid quantity: ${newQuantity}`);
        renderCart(); // Reset display
        return;
    }
    
    const index = cart.findIndex(item => item.id === itemId);
    
    if (index === -1) {
        console.error(`Item ${itemId} not found in cart`);
        return;
    }
    
    cart[index].quantity = newQuantity;
    await saveAndSyncCart();
    renderCart();
    updateCartBadge();
}

// Remove item from cart
async function removeItem(itemId) {
    console.log(`Removing item ${itemId} from cart`);
    
    // Convert to number if it's a string
    itemId = parseInt(itemId);
    
    if (isNaN(itemId)) {
        console.error("Invalid item ID (not a number):", itemId);
        return;
    }
    
    const initialLength = cart.length;
    cart = cart.filter(item => item.id !== itemId);
    
    if (cart.length === initialLength) {
        console.error(`Item ${itemId} not found in cart`);
        return;
    }
    
    await saveAndSyncCart();
    renderCart();
    updateCartBadge();
}

// Clear the entire cart
async function clearCart() {
    console.log("Clearing cart");
    
    cart = [];
    await saveAndSyncCart();
    renderCart();
    updateCartBadge();
}

// ============================
// UI FUNCTIONS
// ============================

// Render cart UI
function renderCart() {
    const cartContainer = document.getElementById('cart-container');
    if (!cartContainer) return; // Not on cart page
    
    // Clear container
    cartContainer.innerHTML = '';
    
    // Check if cart is empty
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Your cart is empty.</p>
                <a href="products.html" class="shop-now-btn">Shop Now</a>
            </div>
        `;
        return;
    }
    
    // Calculate totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 3000 ? 0 : 200; // Free shipping over 3000 ৳, otherwise 200 ৳
    const total = subtotal + shipping;
    
    // Build cart HTML - Make sure IDs are numbers
    const cartHTML = `
        <div class="cart-items">
            ${cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <div class="cart-item-price">৳${parseFloat(item.price).toFixed(2)}</div>
                    </div>
                    <div class="cart-quantity">
                        <button type="button" class="quantity-btn decrease" data-action="decrease" data-id="${parseInt(item.id)}">-</button>
                        <input type="number" class="quantity-input" value="${parseInt(item.quantity)}" min="1" data-id="${parseInt(item.id)}">
                        <button type="button" class="quantity-btn increase" data-action="increase" data-id="${parseInt(item.id)}">+</button>
                    </div>
                    <div class="cart-item-total">
                        ৳${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}
                    </div>
                    <button type="button" class="remove-btn" data-action="remove" data-id="${parseInt(item.id)}">×</button>
                </div>
            `).join('')}
        </div>
        <div class="cart-summary">
            <h2>Order Summary</h2>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>৳${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'Free' : '৳' + shipping.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>৳${total.toFixed(2)}</span>
            </div>
            <a href="checkout.html"><button type="button" class="checkout-btn">Proceed to Checkout</button></a>
            <a href="products.html" class="continue-shopping">Continue Shopping</a>
        </div>
    `;
    
    // Update container
    cartContainer.innerHTML = cartHTML;
    
    // Use a single event listener with delegation for better performance
    cartContainer.addEventListener('click', handleCartClick);
    
    // Add input change handler for quantity inputs
    const quantityInputs = cartContainer.querySelectorAll('.quantity-input');
    quantityInputs.forEach(input => {
        input.addEventListener('change', handleQuantityChange);
    });
}

// Handle all cart click events using delegation
function handleCartClick(event) {
    const target = event.target;
    
    // Check if it's a button with an action
    if (target.tagName === 'BUTTON' && target.dataset.action) {
        event.preventDefault();
        
        const action = target.dataset.action;
        const itemId = target.dataset.id;
        
        // Ensure itemId is valid before proceeding
        if (!itemId) {
            console.error("No item ID found on button:", target);
            return;
        }
        
        // Convert to number for consistency
        const numericId = parseInt(itemId);
        
        // Perform the appropriate action
        switch (action) {
            case 'decrease':
                decreaseQuantity(numericId);
                break;
                
            case 'increase':
                increaseQuantity(numericId);
                break;
                
            case 'remove':
                removeItem(numericId);
                break;
        }
    }
}

// Handle quantity input changes
function handleQuantityChange(event) {
    const input = event.target;
    const itemId = input.dataset.id;
    const newQuantity = parseInt(input.value);
    
    // Validate inputs
    if (!itemId) {
        console.error("No item ID found on input:", input);
        return;
    }
    
    const numericId = parseInt(itemId);
    
    if (isNaN(numericId)) {
        console.error("Invalid item ID (not a number):", itemId);
        return;
    }
    
    if (isNaN(newQuantity) || newQuantity < 1) {
        console.error("Invalid quantity:", input.value);
        renderCart(); // Reset display
        return;
    }
    
    updateQuantity(numericId, newQuantity);
}

// Update cart count badge in header
function updateCartBadge() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const itemCount = cart.reduce((total, item) => total + parseInt(item.quantity), 0);
        cartCountElement.textContent = itemCount;
    }
}

// ============================
// INITIALIZATION ON PAGE LOAD
// ============================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Page loaded, initializing cart");
    initCart();
});

// ============================
// EXPORTS
// ============================
export {
    initCart,
    addToCart,
    decreaseQuantity,
    increaseQuantity,
    updateQuantity,
    removeItem,
    clearCart,
    cart
};