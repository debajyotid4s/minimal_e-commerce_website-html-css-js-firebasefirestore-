let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, fetching products...');
    
    // Show loader
    document.getElementById('products-container').innerHTML = 
        '<div class="product-loader">Loading products...</div>';
    
    fetch('script.js')
        .then(response => {
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return response.text().then(text => {
                console.log('Raw response text:', text.substring(0, 100) + '...');
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                    throw new Error('Invalid JSON response from server');
                }
            });
        })
        .then(data => {
            console.log('Data structure received:', data);
            
            // Check if we have a proper response structure
            if (data && data.success && data.products) {
                products = data.products;
                console.log(`Loaded ${products.length} products successfully`);
                displayProducts();
            } else if (Array.isArray(data)) {
                // Direct array of products
                products = data;
                console.log(`Loaded ${products.length} products (array format)`);
                displayProducts();
            } else {
                console.error('Unexpected data format:', data);
                document.getElementById('products-container').innerHTML = 
                    '<div class="error-message">Invalid data format received from server</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            document.getElementById('products-container').innerHTML = 
                `<div class="error-message">Unable to load products: ${error.message}</div>`;
        });

    // Add event listeners for filtering and sorting
    document.getElementById('category').addEventListener('change', displayProducts);
    document.getElementById('sort').addEventListener('change', displayProducts);
    
    // Update cart count
    updateCartCount();
});

function displayProducts() {
    console.log('Displaying products, count:', products.length);
    const productsContainer = document.getElementById('products-container');
    
    // Clear any existing content
    productsContainer.innerHTML = '';
    
    // Get filter and sort values
    const categoryFilter = document.getElementById('category').value;
    const sortOption = document.getElementById('sort').value;
    
    console.log('Filter:', categoryFilter, 'Sort:', sortOption);
    
    // Filter products by category
    let filteredProducts = products;
    if (categoryFilter !== 'all') {
        filteredProducts = products.filter(product => 
            product.category && product.category.toLowerCase() === categoryFilter.toLowerCase()
        );
    }
    
    console.log('Filtered products count:', filteredProducts.length);
    
    // Sort products
    if (sortOption === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }
    
    // Display the products
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">No products found in this category</div>';
    } else {
        filteredProducts.forEach(product => {
            try {
                const productCard = createProductCard(product);
                productsContainer.appendChild(productCard);
            } catch (error) {
                console.error('Error creating product card for:', product, error);
            }
        });
    }
}

function createProductCard(product) {
    console.log('Creating card for product:', product.name);
    
    const productDiv = document.createElement('div');
    productDiv.className = 'product-card';
    
    const isInCart = cart.some(item => item.id === product.id);
    
    // Format price to Bengali currency format
    const formattedPrice = formatCurrency(product.price);
    
    // Check if product has required fields
    if (!product.name || !product.price) {
        console.error('Product missing required fields:', product);
        return productDiv; // Return empty div
    }
    
    // Create safe image URL (use default if missing)
    const imageUrl = product.image || 'assets/placeholder.jpg';
    
    productDiv.innerHTML = `
        <div class="product-image">
            <img src="${imageUrl}" alt="${product.name}" onerror="this.src='assets/placeholder.jpg'">
            ${product.video_url ? '<span class="video-badge">Video</span>' : ''}
        </div>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description ? product.description.substring(0, 60) + (product.description.length > 60 ? '...' : '') : ''}</p>
        <p class="product-price">৳${formattedPrice}</p>
        <div class="product-actions">
            <button class="btn-view" data-id="${product.id}">View Details</button>
            <button class="btn-add-to-cart" data-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''} ${isInCart ? 'data-in-cart' : ''}>
                ${isInCart ? 'In Cart' : 'Add to Cart'}
            </button>
        </div>
    `;
    
    // Add event listeners
    const viewButton = productDiv.querySelector('.btn-view');
    viewButton.addEventListener('click', function() {
        window.location.href = `product-details.html?id=${product.id}`;
    });
    
    const addToCartButton = productDiv.querySelector('.btn-add-to-cart');
    addToCartButton.addEventListener('click', function() {
        if (product.stock <= 0) return;
        
        const productId = this.getAttribute('data-id');
        
        if (!this.hasAttribute('data-in-cart')) {
            addToCart(productId);
            this.textContent = 'In Cart';
            this.setAttribute('data-in-cart', '');
        } else {
            window.location.href = 'cart.html';
        }
    });
    
    return productDiv;
}

function addToCart(productId) {
    const product = products.find(p => p.id == productId);
    
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    // Check if product is already in cart
    const existingItem = cart.find(item => item.id == productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
            sku: product.sku
        });
    }
    
    // Save cart to local storage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Show notification
    showNotification(`${product.name} added to cart`);
}

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        // Make the cart count visible if items exist
        if (totalItems > 0) {
            cartCount.style.display = 'inline-block';
        } else {
            cartCount.style.display = 'none';
        }
    }
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show and then hide after delay
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatCurrency(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}