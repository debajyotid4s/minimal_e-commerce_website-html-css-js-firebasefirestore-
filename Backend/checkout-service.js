// checkout-service.js - Handles order processing and Firestore interactions

import { db, auth } from '../Frontend/config/firebase-config.js';
import { 
    collection, addDoc, doc, getDoc, updateDoc, increment, 
    serverTimestamp, runTransaction, deleteDoc, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async function() {
    console.log("Checkout service loaded");
    
    // Get checkout form element
    const checkoutForm = document.getElementById('checkoutForm');
    
    if (!checkoutForm) {
        console.error("Checkout form not found");
        return;
    }
    
    // Add event listener for form submission
    checkoutForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        console.log("Form submitted");
        
        // Show processing indicator
        showProcessingOverlay();
        
        try {
            // Check if user is logged in
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("You must be logged in to place an order");
            }
            
            // Get cart items
            const CART_STORAGE_KEY = 'cart';
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            const cart = savedCart ? JSON.parse(savedCart) : [];
            
            if (cart.length === 0) {
                throw new Error("Your cart is empty");
            }
            
            // Check if all products are available in the requested quantities
            const availabilityCheck = await checkProductAvailability(cart);
            if (!availabilityCheck.success) {
                throw new Error(availabilityCheck.message);
            }
            
            // Create order object
            const order = createOrderObject(currentUser);
            
            // Process the order
            const orderResult = await processOrder(order, cart);
            
            if (orderResult.success) {
                // Clear cart in localStorage
                localStorage.removeItem(CART_STORAGE_KEY);
                
                // Also clear cart in Firestore if exists
                await clearFirestoreCart(currentUser.uid);
                
                // Show success message or redirect
                console.log("Order placed successfully:", orderResult.orderId);
                
                // Display order ID in the success modal if it exists
                const orderNumberElement = document.getElementById('orderNumber');
                if (orderNumberElement) {
                    orderNumberElement.textContent = orderResult.orderId;
                }
                
                // Show success modal if it exists, otherwise redirect
                const orderSuccessModal = document.getElementById('orderSuccessModal');
                if (orderSuccessModal) {
                    orderSuccessModal.style.display = 'block';
                } else {
                    window.location.href = `thankyou.html?orderId=${orderResult.orderId}`;
                }
            } else {
                throw new Error(orderResult.message || "Failed to process order");
            }
        } catch (error) {
            console.error("Error processing order:", error);
            
            // Show error message to user
            alert(`Error: ${error.message}`);
            
            // Hide processing overlay
            hideProcessingOverlay();
        }
    });
    
    // Close modal button event listener
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            const orderSuccessModal = document.getElementById('orderSuccessModal');
            if (orderSuccessModal) {
                orderSuccessModal.style.display = 'none';
            }
        });
    }
    
    // Continue shopping button event listener
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', function() {
            window.location.href = 'products.html';
        });
    }
});

// Create order object from form data
function createOrderObject(currentUser) {
    const deliveryFee = 200; // Taka
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Calculate totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Check for any applied discount from input
    const couponInput = document.getElementById('coupon');
    const couponCode = couponInput ? couponInput.value.trim().toUpperCase() : '';
    
    // Calculate discount if a coupon is applied
    let discountAmount = 0;
    if (couponCode) {
        const validCoupons = {
            'WELCOME10': 10,
            'SUMMER20': 20,
            'MUSIC15': 15
        };
        
        if (validCoupons[couponCode]) {
            discountAmount = (subtotal * validCoupons[couponCode]) / 100;
        }
    }
    
    // Check delivery method
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
    const currentDeliveryFee = deliveryMethod === 'home' ? deliveryFee : 0;
    
    // Calculate total amount
    const totalAmount = subtotal + currentDeliveryFee - discountAmount;
    
    // Create order object
    return {
        id: generateOrderId(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        customer: {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            mobile: document.getElementById('mobile').value.trim(),
            address: document.getElementById('address').value.trim(),
            city: document.getElementById('city').value.trim(),
            zone: document.getElementById('zone').value
        },
        deliveryMethod: deliveryMethod,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        transactionId: document.getElementById('transactionId') ? document.getElementById('transactionId').value.trim() : '',
        items: cart,
        subtotal: subtotal,
        deliveryFee: currentDeliveryFee,
        discount: discountAmount,
        couponCode: couponCode,
        total: totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
}

// Check if all products are available in the requested quantities
async function checkProductAvailability(cartItems) {
    try {
        // Check each product in the cart
        for (const item of cartItems) {
            const productRef = doc(db, "products", item.id.toString());
            const productSnap = await getDoc(productRef);
            
            if (!productSnap.exists()) {
                return {
                    success: false,
                    message: `Product "${item.name}" is no longer available.`
                };
            }
            
            const productData = productSnap.data();
            const availableStock = productData.stock || 0;
            
            if (availableStock < item.quantity) {
                return {
                    success: false,
                    message: `Only ${availableStock} units of "${item.name}" are available.`
                };
            }
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error checking product availability:", error);
        return {
            success: false,
            message: "Failed to check product availability. Please try again."
        };
    }
}

// Process the order
async function processOrder(order, cartItems) {
    try {
        // Use a transaction to ensure data consistency
        await runTransaction(db, async (transaction) => {
            // Update product quantities
            for (const item of cartItems) {
                const productRef = doc(db, "products", item.id.toString());
                const productSnap = await transaction.get(productRef);
                
                if (!productSnap.exists()) {
                    throw new Error(`Product "${item.name}" is no longer available.`);
                }
                
                const productData = productSnap.data();
                const newStock = productData.stock - item.quantity;
                
                if (newStock < 0) {
                    throw new Error(`Not enough stock for "${item.name}".`);
                }
                
                transaction.update(productRef, { stock: newStock });
            }
        });
        
        // Add order to user's orders collection
        const userOrdersRef = collection(db, "users", order.userId, "ordered_items");
        const orderDocRef = await addDoc(userOrdersRef, {
            ...order,
            createdAt: serverTimestamp() // Use server timestamp for accuracy
        });
        
        // Add to global orders collection for easier admin management (optional)
        const globalOrdersRef = collection(db, "orders");
        await addDoc(globalOrdersRef, {
            ...order,
            orderId: orderDocRef.id,
            createdAt: serverTimestamp()
        });
        
        return {
            success: true,
            orderId: order.id
        };
    } catch (error) {
        console.error("Error processing order:", error);
        return {
            success: false,
            message: error.message || "Failed to process order"
        };
    }
}

// Clear user's cart in Firestore
async function clearFirestoreCart(userId) {
    try {
        const cartRef = collection(db, "users", userId, "cart_items");
        const cartSnapshot = await getDocs(cartRef);
        
        // Delete each cart item
        const deletePromises = [];
        cartSnapshot.forEach(cartDoc => {
            deletePromises.push(deleteDoc(doc(db, "users", userId, "cart_items", cartDoc.id)));
        });
        
        await Promise.all(deletePromises);
        console.log("Firestore cart cleared successfully");
    } catch (error) {
        console.error("Error clearing Firestore cart:", error);
    }
}

// Generate a unique order ID
function generateOrderId() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ANS-${timestamp}${random}`;
}

// Show processing overlay
function showProcessingOverlay() {
    // Check if overlay already exists
    let overlay = document.getElementById('processing-overlay');
    
    if (!overlay) {
        // Create overlay if it doesn't exist
        overlay = document.createElement('div');
        overlay.id = 'processing-overlay';
        overlay.innerHTML = `
            <div class="processing-content">
                <div class="spinner"></div>
                <p>Processing your order...</p>
            </div>
        `;
        
        // Add styles for the overlay
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        
        // Spinner and content styles
        const content = overlay.querySelector('.processing-content');
        content.style.backgroundColor = 'white';
        content.style.padding = '30px';
        content.style.borderRadius = '8px';
        content.style.textAlign = 'center';
        content.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        
        const spinner = overlay.querySelector('.spinner');
        spinner.style.border = '6px solid #f3f3f3';
        spinner.style.borderTop = '6px solid var(--primary-color, #E0B0FF)';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '50px';
        spinner.style.height = '50px';
        spinner.style.margin = '0 auto 20px';
        spinner.style.animation = 'spin 1s linear infinite';
        
        // Add the animation
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Add to document
        document.body.appendChild(overlay);
    } else {
        // Show existing overlay
        overlay.style.display = 'flex';
    }
}

// Hide processing overlay
function hideProcessingOverlay() {
    const overlay = document.getElementById('processing-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}


// Load cart items for checkout
async function loadCartItems() {
    const CART_STORAGE_KEY = 'cart';
    const cartItemsContainer = document.getElementById('cartItems');
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('totalAmount');
    
    try {
        let cartItems = [];
        
        // Check if user is logged in
        const user = auth.currentUser;
        
        if (user) {
            // Load cart from Firestore for logged in users
            console.log("Loading cart from Firestore for user:", user.email);
            const userCartRef = collection(db, `users/${user.uid}/cart`);
            const snapshot = await getDocs(userCartRef);
            
            if (snapshot.empty) {
                console.log("No items in Firestore cart");
            } else {
                snapshot.forEach(doc => {
                    const item = doc.data();
                    cartItems.push(item);
                });
                console.log("Loaded cart from Firestore:", cartItems);
            }
        } else {
            // Load cart from localStorage for guests
            console.log("Loading cart from localStorage");
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                cartItems = JSON.parse(savedCart);
                console.log("Loaded cart from localStorage:", cartItems);
            }
        }
        
        // Display cart items on the checkout page
        if (!cartItems || cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            subtotalElement.textContent = '৳0.00';
            totalElement.textContent = '৳200.00'; // Just delivery fee
            return;
        }
        
        // Display cart items
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        
        cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>৳${item.price.toLocaleString()} × ${item.quantity}</p>
                </div>
                <div class="item-total">৳${itemTotal.toLocaleString()}</div>
            `;
            
            cartItemsContainer.appendChild(itemElement);
        });
        
        // Update subtotal and total
        const deliveryFee = 200; // Fixed delivery fee
        const total = subtotal + deliveryFee;
        
        subtotalElement.textContent = `৳${subtotal.toLocaleString()}`;
        totalElement.textContent = `৳${total.toLocaleString()}`;
        
    } catch (error) {
        console.error("Error loading cart items:", error);
        cartItemsContainer.innerHTML = '<p class="error">Error loading cart items</p>';
    }
}