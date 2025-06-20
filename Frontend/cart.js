// Display cart items
function displayCart() {
    const cartContainer = document.getElementById('cart-container');
    
    if (!cartContainer) return;
    
    // Remove loader
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
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;
    
    // Build cart HTML
    const cartHTML = `
        <div class="cart-items">
            ${cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    </div>
                    <div class="cart-quantity">
                        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                        <button class="quantity-btn increase" data-id="${item.id}">+</button>
                    </div>
                    <div class="cart-item-total">
                        $${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button class="remove-btn" data-id="${item.id}">×</button>
                </div>
            `).join('')}
        </div>
        <div class="cart-summary">
            <h2>Order Summary</h2>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <a href="checkout.html"><button class="checkout-btn" id="checkout-btn">Proceed to Checkout</button></a>
            <a href="products.html" class="continue-shopping">Continue Shopping</a>
        </div>
    `;
    
    cartContainer.innerHTML = cartHTML;
    
    // Add event listeners
    document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
        button.addEventListener('click', decreaseQuantity);
    });
    
    document.querySelectorAll('.quantity-btn.increase').forEach(button => {
        button.addEventListener('click', increaseQuantity);
    });
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', updateQuantity);
    });
    
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', removeItem);
    });
    
    document.getElementById('checkout-btn').addEventListener('click', checkout);
}

// Decrease item quantity
function decreaseQuantity(event) {
    const itemId = parseInt(event.target.dataset.id);
    const item = cart.find(item => item.id === itemId);
    
    if (item && item.quantity > 1) {
        item.quantity--;
        saveCart();
        displayCart();
        updateCartCount();
    }
}

// Increase item quantity
function increaseQuantity(event) {
    const itemId = parseInt(event.target.dataset.id);
    const item = cart.find(item => item.id === itemId);
    
    if (item) {
        item.quantity++;
        saveCart();
        displayCart();
        updateCartCount();
    }
}

// Update item quantity
function updateQuantity(event) {
    const itemId = parseInt(event.target.dataset.id);
    const item = cart.find(item => item.id === itemId);
    const newQuantity = parseInt(event.target.value);
    
    if (item && newQuantity > 0) {
        item.quantity = newQuantity;
        saveCart();
        displayCart();
        updateCartCount();
    } else {
        displayCart(); // Reset display if invalid input
    }
}

// Remove item from cart
function removeItem(event) {
    const itemId = parseInt(event.target.dataset.id);
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    displayCart();
    updateCartCount();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Checkout process
function checkout() {
    // In a real application, this would redirect to a checkout page
    alert('Thank you for your order! In a real application, you would be redirected to a checkout page.');
    
    // Clear cart
    cart = [];
    saveCart();
    displayCart();
    updateCartCount();
}

// Initialize the cart page
document.addEventListener('DOMContentLoaded', () => {
    displayCart();
    updateCartCount();
});