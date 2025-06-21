// Checkout page functionality

import { db, auth } from './config/firebase-config.js';
import { 
    collection, 
    addDoc,
    getDocs,
    deleteDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log("Checkout page initialized");
    loadCartItems();
    setupEventListeners();
});

// Load cart items from localStorage
function loadCartItems() {
    console.log("Loading cart items for checkout page");
    const cartItemsContainer = document.getElementById('cartItems');
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('totalAmount');
    
    if (!cartItemsContainer) {
        console.error("Cart items container not found on checkout page");
        return;
    }
    
    try {
        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart');
        console.log("Raw cart data from localStorage:", savedCart);
        
        if (!savedCart) {
            console.warn("No cart found in localStorage");
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            subtotalElement.textContent = '৳0';
            totalElement.textContent = '৳200'; // Just delivery fee
            return;
        }
        
        const cart = JSON.parse(savedCart);
        console.log("Parsed cart data:", cart);
        
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            console.warn("Cart is empty or invalid");
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            subtotalElement.textContent = '৳0';
            totalElement.textContent = '৳200'; // Just delivery fee
            return;
        }
        
        // Display cart items
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        
        cart.forEach(item => {
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

// Set up event listeners
function setupEventListeners() {
    // Payment method change
    const onlinePayment = document.getElementById('online');
    const codPayment = document.getElementById('cod');
    const transactionIdContainer = document.getElementById('transactionIdContainer');
    
    if (onlinePayment && transactionIdContainer) {
        onlinePayment.addEventListener('change', function() {
            transactionIdContainer.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    if (codPayment) {
        codPayment.addEventListener('change', function() {
            if (transactionIdContainer) {
                transactionIdContainer.style.display = 'none';
            }
        });
    }
    
    // Delivery method change
    const homeDelivery = document.getElementById('homeDelivery');
    const pickup = document.getElementById('pickup');
    const deliveryFeeElement = document.getElementById('deliveryFee');
    
    if (homeDelivery && pickup && deliveryFeeElement) {
        homeDelivery.addEventListener('change', function() {
            deliveryFeeElement.textContent = '৳200';
            updateTotal();
        });
        
        pickup.addEventListener('change', function() {
            deliveryFeeElement.textContent = '৳0';
            updateTotal();
        });
    }
    
    // Apply coupon button
    const applyCouponBtn = document.getElementById('applyCoupon');
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', applyCoupon);
    }
    
    // Order form submission
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleOrderSubmission);
    }
    
    // Modal close button
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            document.getElementById('orderSuccessModal').style.display = 'none';
        });
    }
    
    // Continue shopping button in modal
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', function() {
            document.getElementById('orderSuccessModal').style.display = 'none';
            
            // Set a successful order flag in sessionStorage
            sessionStorage.setItem('orderCompleted', 'true');
            
            // Navigate to products page
            window.location.href = 'products.html';
        });
    }
}

// Update total when delivery method or discount changes
function updateTotal() {
    const subtotalText = document.getElementById('subtotal').textContent;
    const deliveryFeeText = document.getElementById('deliveryFee').textContent;
    
    // Extract numeric values
    const subtotal = parseFloat(subtotalText.replace('৳', '').replace(/,/g, ''));
    const deliveryFee = parseFloat(deliveryFeeText.replace('৳', '').replace(/,/g, ''));
    
    // Get discount if any
    let discount = 0;
    const discountRow = document.getElementById('discountRow');
    if (discountRow && discountRow.style.display !== 'none') {
        const discountText = document.getElementById('discountAmount').textContent;
        discount = parseFloat(discountText.replace('-৳', '').replace(/,/g, ''));
    }
    
    // Calculate new total
    const total = subtotal + deliveryFee - discount;
    document.getElementById('totalAmount').textContent = `৳${total.toLocaleString()}`;
}

// Apply coupon code
function applyCoupon() {
    const couponInput = document.getElementById('coupon');
    const couponMessage = document.getElementById('couponMessage');
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    
    const couponCode = couponInput.value.trim().toUpperCase();
    if (!couponCode) {
        couponMessage.textContent = 'Please enter a coupon code';
        couponMessage.className = 'coupon-message error';
        return;
    }
    
    // Hard-coded coupon for testing (replace with actual coupon validation)
    const validCoupons = {
        'ANUSSWAR10': { discount: 0.1, maxDiscount: 1000 },
        'WELCOME15': { discount: 0.15, maxDiscount: 1500 }
    };
    
    if (validCoupons[couponCode]) {
        // Get subtotal
        const subtotalText = document.getElementById('subtotal').textContent;
        const subtotal = parseFloat(subtotalText.replace('৳', '').replace(/,/g, ''));
        
        // Calculate discount
        const couponDetails = validCoupons[couponCode];
        let calculatedDiscount = subtotal * couponDetails.discount;
        
        // Apply max discount if needed
        if (calculatedDiscount > couponDetails.maxDiscount) {
            calculatedDiscount = couponDetails.maxDiscount;
        }
        
        // Update UI
        discountRow.style.display = 'flex';
        discountAmount.textContent = `-৳${calculatedDiscount.toLocaleString()}`;
        
        // Show success message
        couponMessage.textContent = `Coupon applied! You saved ৳${calculatedDiscount.toLocaleString()}`;
        couponMessage.className = 'coupon-message success';
        
        // Update total
        updateTotal();
    } else {
        // Invalid coupon
        couponMessage.textContent = 'Invalid coupon code';
        couponMessage.className = 'coupon-message error';
        
        // Reset discount if any
        discountRow.style.display = 'none';
        updateTotal();
    }
}

// Handle order submission
async function handleOrderSubmission(event) {
    event.preventDefault();
    
    try {
        // Show loading state
        const orderButton = document.getElementById('placeOrder');
        const originalButtonText = orderButton.textContent;
        orderButton.textContent = 'Processing...';
        orderButton.disabled = true;
        
        // Get form data
        const formData = new FormData(event.target);
        const orderData = Object.fromEntries(formData.entries());
        
        // Get cart items
        const savedCart = localStorage.getItem('cart');
        if (!savedCart) {
            alert('Your cart is empty. Please add items before checkout.');
            orderButton.textContent = originalButtonText;
            orderButton.disabled = false;
            return;
        }
        
        const cartItems = JSON.parse(savedCart);
        if (!cartItems || cartItems.length === 0) {
            alert('Your cart is empty. Please add items before checkout.');
            orderButton.textContent = originalButtonText;
            orderButton.disabled = false;
            return;
        }
        
        // Calculate totals
        const subtotalText = document.getElementById('subtotal').textContent;
        const deliveryFeeText = document.getElementById('deliveryFee').textContent;
        const totalText = document.getElementById('totalAmount').textContent;
        
        const subtotal = parseFloat(subtotalText.replace('৳', '').replace(/,/g, ''));
        const deliveryFee = parseFloat(deliveryFeeText.replace('৳', '').replace(/,/g, ''));
        const total = parseFloat(totalText.replace('৳', '').replace(/,/g, ''));
        
        // Get current user or guest info
        let userId = 'guest';
        let userEmail = orderData.email;
        let isLoggedIn = false;
        
        if (auth.currentUser) {
            userId = auth.currentUser.uid;
            userEmail = auth.currentUser.email;
            isLoggedIn = true;
        }
        
        // Build complete order object
        const order = {
            customer: {
                firstName: orderData.firstName,
                lastName: orderData.lastName,
                email: userEmail,
                mobile: orderData.mobile,
                userId: userId
            },
            shipping: {
                address: orderData.address,
                city: orderData.city,
                zone: orderData.zone
            },
            payment: {
                method: orderData.paymentMethod,
                transactionId: orderData.paymentMethod === 'online' ? orderData.transactionId : null,
                status: orderData.paymentMethod === 'cod' ? 'pending' : 'paid'
            },
            delivery: {
                method: orderData.deliveryMethod,
                fee: deliveryFee
            },
            items: cartItems,
            pricing: {
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                discount: subtotal + deliveryFee - total, // Calculate discount from total difference
                total: total
            },
            status: 'pending',
            createdAt: serverTimestamp(),
            couponCode: orderData.coupon || null
        };
        
        console.log("Placing order:", order);
        
        // Save order to Firestore
        let orderRef;
        
        if (isLoggedIn) {
            // For logged in users, save to their ordered_items collection
            orderRef = collection(db, `users/${userId}/ordered_items`);
        } else {
            // For guests, save to a general orders collection
            orderRef = collection(db, 'orders');
        }
        
        const docRef = await addDoc(orderRef, order);
        console.log("Order placed with ID:", docRef.id);
        
        // CLEAR CART AFTER SUCCESSFUL ORDER
        await clearCartAfterOrder(isLoggedIn, userId);
        
        // Show success modal
        const orderNumber = docRef.id.slice(-6).toUpperCase();
        document.getElementById('orderNumber').textContent = orderNumber;
        document.getElementById('orderSuccessModal').style.display = 'block';
        
        // Reset form
        event.target.reset();
        
        // Reset button state
        orderButton.textContent = originalButtonText;
        orderButton.disabled = false;
        
    } catch (error) {
        console.error("Error processing order:", error);
        alert('There was an error processing your order. Please try again.');
        
        // Reset button state
        const orderButton = document.getElementById('placeOrder');
        orderButton.textContent = 'Place Order';
        orderButton.disabled = false;
    }
}

// Clear cart function
async function clearCartAfterOrder(isLoggedIn, userId) {
    console.log("Clearing cart after successful order");
    
    // Clear cart from localStorage first (this works for all users)
    localStorage.removeItem('cart');
    console.log("Cart cleared from localStorage");
    
    // Update cart count in UI 
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = '0';
    }
    
    // If user is logged in, also clear from Firebase
    if (isLoggedIn && userId) {
        try {
            // Clear Firestore cart collection
            const userCartRef = collection(db, `users/${userId}/cart`);
            const snapshot = await getDocs(userCartRef);
            
            const deletePromises = [];
            snapshot.forEach(doc => {
                deletePromises.push(deleteDoc(doc.ref));
            });
            
            // Wait for all delete operations to complete
            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
                console.log(`Deleted ${deletePromises.length} items from Firestore cart`);
            } else {
                console.log("No items to delete from Firestore cart");
            }
        } catch (error) {
            console.error("Error clearing cart from Firestore:", error);
            // Continue even if Firestore clearing fails - localStorage is cleared anyway
        }
    }
    
    // Dispatch a custom event that other parts of the app can listen for
    const clearCartEvent = new CustomEvent('cartCleared');
    document.dispatchEvent(clearCartEvent);
    
    return true;
}

// Add this debug function

function verifyCartCleared() {
    console.log("Verifying cart was cleared:");
    
    // Check localStorage
    const localStorageCart = localStorage.getItem('cart');
    console.log("localStorage cart exists:", !!localStorageCart);
    
    // Check cart count element
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        console.log("Cart count in UI:", cartCount.textContent);
    }
    
    // If user is logged in, we could check Firestore but we'll skip that for simplicity
}