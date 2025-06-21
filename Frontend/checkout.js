document.addEventListener('DOMContentLoaded', function() {
    // Variables
    const deliveryFee = 200; // Taka
    let discountAmount = 0;
    let subtotalAmount = 0;
    let totalAmount = 0;
    
    // Get elements
    const checkoutForm = document.getElementById('checkoutForm');
    const cartItemsContainer = document.getElementById('cartItems');
    const subtotalElement = document.getElementById('subtotal');
    const deliveryFeeElement = document.getElementById('deliveryFee');
    const discountRowElement = document.getElementById('discountRow');
    const discountAmountElement = document.getElementById('discountAmount');
    const totalAmountElement = document.getElementById('totalAmount');
    const applyCouponBtn = document.getElementById('applyCoupon');
    const couponInput = document.getElementById('coupon');
    const couponMessage = document.getElementById('couponMessage');
    const orderSuccessModal = document.getElementById('orderSuccessModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');
    const orderNumberElement = document.getElementById('orderNumber');
    const onlinePayment = document.getElementById('online');
    const codPayment = document.getElementById('cod');
    const transactionIdContainer = document.getElementById('transactionIdContainer');
    
    // Load cart items and update summary
    loadCartItems();
    
    // Delivery method change event
    document.querySelectorAll('input[name="deliveryMethod"]').forEach(input => {
        input.addEventListener('change', function() {
            updateTotalAmount();
        });
    });
    
    // Payment method change event
    onlinePayment.addEventListener('change', function() {
        if(this.checked) {
            transactionIdContainer.style.display = 'block';
        }
    });
    
    codPayment.addEventListener('change', function() {
        if(this.checked) {
            transactionIdContainer.style.display = 'none';
            document.getElementById('transactionId').value = ''; // Clear the field
        }
    });
    
    // Apply coupon button click
    applyCouponBtn.addEventListener('click', function() {
        const couponCode = couponInput.value.trim().toUpperCase();
        
        if (!couponCode) {
            showCouponMessage('Please enter a coupon code', 'error');
            return;
        }
        
        // Check if coupon is valid (example coupons)
        const validCoupons = {
            'WELCOME10': 10,
            'SUMMER20': 20,
            'MUSIC15': 15
        };
        
        if (validCoupons[couponCode]) {
            // Calculate discount (percentage of subtotal)
            const discountPercentage = validCoupons[couponCode];
            discountAmount = (subtotalAmount * discountPercentage) / 100;
            
            // Show discount in the UI
            discountRowElement.style.display = 'flex';
            discountAmountElement.textContent = `-৳${discountAmount.toFixed(2)}`;
            
            // Update total amount
            updateTotalAmount();
            
            // Show success message
            showCouponMessage(`${discountPercentage}% discount applied successfully!`, 'success');
        } else {
            // Invalid coupon
            showCouponMessage('Invalid coupon code', 'error');
            
            // Reset discount
            discountAmount = 0;
            discountRowElement.style.display = 'none';
            
            // Update total amount
            updateTotalAmount();
        }
    });
    
   // Form submission
    checkoutForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Validate form fields
    if (!validateForm()) {
        return;
    }
    
    // Create order object
    const order = {
        id: generateOrderId(),
        customer: {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            mobile: document.getElementById('mobile').value.trim(),
            address: document.getElementById('address').value.trim(),
            city: document.getElementById('city').value.trim(),
            zone: document.getElementById('zone').value
        },
        deliveryMethod: document.querySelector('input[name="deliveryMethod"]:checked').value,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        transactionId: document.getElementById('transactionId').value.trim(),
        items: JSON.parse(localStorage.getItem('cart')) || [],
        subtotal: subtotalAmount,
        deliveryFee: document.querySelector('input[name="deliveryMethod"]:checked').value === 'home' ? deliveryFee : 0,
        discount: discountAmount,
        total: totalAmount,
        coupon: couponInput.value.trim(),
        date: new Date().toISOString()
    };
    
    // In a real application, you would send this order to your server
    console.log('Order placed:', order);
    
    // For demo purposes, just show success message
    // showOrderSuccess(order.id);
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Redirect to thank you page
    window.location.href = 'thankyou.html';
    });
    
    // Close modal events
    closeModalBtn.addEventListener('click', function() {
        orderSuccessModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === orderSuccessModal) {
            orderSuccessModal.style.display = 'none';
        }
    });
    
    continueShoppingBtn.addEventListener('click', function() {
        window.location.href = 'products.html';
    });
    
    // Function to load cart items
    function loadCartItems() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
            updateCartSummary(0);
            return;
        }
        
        let html = '';
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            html += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-info">
                        <p class="cart-item-name">${item.name}</p>
                        <div class="cart-item-price">
                            <span class="quantity">${item.quantity}x</span>
                            <span>৳${item.price.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        cartItemsContainer.innerHTML = html;
        updateCartSummary(subtotal);
    }
    
    // Function to update cart summary
    function updateCartSummary(subtotal) {
        subtotalAmount = subtotal;
        subtotalElement.textContent = `৳${subtotalAmount.toFixed(2)}`;
        updateTotalAmount();
    }
    
    // Function to update total amount
    function updateTotalAmount() {
        const isHomeDelivery = document.getElementById('homeDelivery').checked;
        const currentDeliveryFee = isHomeDelivery ? deliveryFee : 0;
        
        deliveryFeeElement.textContent = `৳${currentDeliveryFee.toFixed(2)}`;
        totalAmount = subtotalAmount + currentDeliveryFee - discountAmount;
        totalAmountElement.textContent = `৳${totalAmount.toFixed(2)}`;
    }
    
    // Function to validate form
    function validateForm() {
        let isValid = true;
        
        // Remove previous error messages
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        
        // Validate required fields
        const requiredFields = [
            'firstName', 'lastName', 'email', 'mobile', 
            'address', 'city', 'zone'
        ];
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field);
            if (!input.value.trim()) {
                addErrorMessage(input, 'This field is required');
                isValid = false;
            }
        });
        
        // Validate transaction ID if online payment is selected
        if (onlinePayment.checked) {
            const transactionIdInput = document.getElementById('transactionId');
            if (!transactionIdInput.value.trim()) {
                addErrorMessage(transactionIdInput, 'Transaction ID is required for online payment');
                isValid = false;
            }
        }
        
        // Validate email format
        const email = document.getElementById('email');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.value.trim() && !emailPattern.test(email.value.trim())) {
            addErrorMessage(email, 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate Bangladeshi mobile number
        const mobile = document.getElementById('mobile');
        const mobilePattern = /^01[3-9]\d{8}$/;
        if (mobile.value.trim() && !mobilePattern.test(mobile.value.trim())) {
            addErrorMessage(mobile, 'Please enter a valid Bangladeshi mobile number (e.g., 01XXXXXXXXX)');
            isValid = false;
        }
        
        // Check terms agreement
        const termsAgree = document.getElementById('termsAgree');
        if (!termsAgree.checked) {
            addErrorMessage(termsAgree, 'You must agree to the terms and policies');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Function to add error message to a field
    function addErrorMessage(input, message) {
        input.classList.add('error');
        const errorMessage = document.createElement('p');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        input.parentNode.appendChild(errorMessage);
    }
    
    // Function to show coupon message
    function showCouponMessage(message, type) {
        couponMessage.textContent = message;
        couponMessage.className = `coupon-message ${type}`;
    }
    
    // Function to generate a random order ID
    function generateOrderId() {
        return 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    }
    
    // Function to show order success modal
    function showOrderSuccess(orderId) {
        orderNumberElement.textContent = orderId;
        orderSuccessModal.style.display = 'block';
    }
    
    // Update cart count in navigation
    updateCartCount();
});