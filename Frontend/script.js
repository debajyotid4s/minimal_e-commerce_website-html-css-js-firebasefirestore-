// This is for your frontend.js or a similar file
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = itemCount;
    }
}

// Display featured products
function displayFeaturedProducts() {
    const productsContainer = document.getElementById('featured-products');
    
    if (!productsContainer) return;
    
    // Remove loader
    productsContainer.innerHTML = '';
    
    // Check if products variable exists
    if (typeof products !== 'undefined') {
        // Display products
        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product-card';
            productElement.innerHTML = `
                <div class="product-image">
                    <a href="product-detail.html?id=${product.id}">
                        <img src="${product.image}" alt="${product.name}">
                    </a>
                </div>
                <div class="product-info">
                    <a href="product-detail.html?id=${product.id}">
                        <h3 class="product-title">${product.name}</h3>
                    </a>
                    <div class="product-price">৳${product.price.toFixed(2)}</div>
                    <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                </div>
            `;
            productsContainer.appendChild(productElement);
        });
        
        // Add event listeners to "Add to Cart" buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', addToCart);
        });
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    displayFeaturedProducts();
});