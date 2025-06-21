// Simple bridge between product pages and cart manager

import { addToCart } from './cart-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log("Product-cart bridge initialized");
    
    // Find all "Add to Cart" buttons on the page
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    if (addToCartButtons.length > 0) {
        console.log(`Found ${addToCartButtons.length} "Add to Cart" buttons`);
        
        // Add click event listeners to all Add to Cart buttons
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                
                // Get the product card parent
                const productCard = this.closest('.product-card');
                if (!productCard) {
                    console.error('Could not find parent product card');
                    return;
                }
                
                // Extract product details from the card
                const productId = productCard.dataset.id;
                const productName = productCard.querySelector('.product-name').textContent;
                const productPriceText = productCard.querySelector('.product-price').textContent;
                const productPrice = parseFloat(productPriceText.replace('৳', '').replace(',', ''));
                
                // Get product image if available
                let productImage = '';
                const imageElement = productCard.querySelector('.product-image img');
                if (imageElement) {
                    productImage = imageElement.src;
                }
                
                // Create product object
                const product = {
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage
                };
                
                console.log('Adding product to cart:', product);
                
                // Add to cart and show message
                const success = addToCart(product);
                if (success) {
                    showMessage(productCard, 'Added to cart!');
                }
            });
        });
    }
});

// Show a message on the product card
function showMessage(productCard, message, type = 'success') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `cart-message ${type}`;
    messageEl.textContent = message;
    
    // Add message to product card
    productCard.appendChild(messageEl);
    
    // Remove message after 2 seconds
    setTimeout(() => {
        messageEl.classList.add('fade-out');
        setTimeout(() => {
            if (messageEl.parentNode === productCard) {
                productCard.removeChild(messageEl);
            }
        }, 500);
    }, 1500);
}