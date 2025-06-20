import { getAllProducts, getProductsByCategory, sortProducts } from '../Backend/product-service.js';

// Global variables
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, fetching products from backend service...');
    
    try {
        // Show loader
        const productsContainer = document.getElementById('products-container') || 
                                 document.getElementById('products-grid') || 
                                 document.querySelector('.products-grid');
        
        if (productsContainer) {
            productsContainer.innerHTML = '<div class="product-loader">Loading products...</div>';
        } else {
            console.error('Products container not found');
        }
        
        // Get URL parameters for filtering
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        
        // Fetch products from backend service
        if (categoryParam && categoryParam !== 'all') {
            console.log(`Fetching products with category: ${categoryParam}`);
            products = await getProductsByCategory(categoryParam);
            
            // Update category select to match the URL parameter
            const categorySelect = document.getElementById('category');
            if (categorySelect) {
                for (let i = 0; i < categorySelect.options.length; i++) {
                    if (categorySelect.options[i].value.toLowerCase() === categoryParam.toLowerCase()) {
                        categorySelect.selectedIndex = i;
                        break;
                    }
                }
            }
        } else {
            console.log('Fetching all products');
            products = await getAllProducts();
        }
        
        console.log(`Loaded ${products.length} products successfully`);
        
        // Display products after fetching
        displayProducts();
        
        // Add event listeners for filtering and sorting after products are displayed
        setupEventListeners();
        
        // Update cart count
        updateCartCount();
        
    } catch (error) {
        console.error('Error loading products:', error);
        const productsContainer = document.getElementById('products-container') || 
                                 document.getElementById('products-grid') || 
                                 document.querySelector('.products-grid');
        if (productsContainer) {
            productsContainer.innerHTML = 
                `<div class="error-message">Unable to load products: ${error.message}</div>`;
        }
    }
});

// Setup event listeners separately to ensure they're attached after elements are created
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Category filter
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.addEventListener('change', async function() {
            const category = this.value;
            console.log(`Category changed to: ${category}`);
            
            try {
                // Show loading indicator
                const productsContainer = document.getElementById('products-container') || 
                                         document.getElementById('products-grid') || 
                                         document.querySelector('.products-grid');
                
                if (productsContainer) {
                    productsContainer.innerHTML = '<div class="product-loader">Loading products...</div>';
                }
                
                // Fetch products by selected category
                if (category === 'all') {
                    products = await getAllProducts();
                } else {
                    products = await getProductsByCategory(category);
                }
                
                // Display updated products
                displayProducts();
            } catch (error) {
                console.error('Error updating products by category:', error);
            }
        });
    } else {
        console.warn('Category select element not found');
    }
    
    // Sort filter
    const sortSelect = document.getElementById('sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            console.log(`Sort changed to: ${this.value}`);
            displayProducts();
        });
    } else {
        console.warn('Sort select element not found');
    }
    
    // Product card event listeners
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent any default behavior
            
            const productId = this.getAttribute('data-id');
            console.log(`View button clicked for product ID: ${productId}`);
            window.location.href = `product-detail.html?id=${productId}`;
        });
    });
    
    document.querySelectorAll('.btn-add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent any default behavior
            
            const productId = this.getAttribute('data-id');
            console.log(`Add to cart button clicked for product ID: ${productId}`);
            
            if (this.hasAttribute('disabled')) {
                return;
            }
            
            if (!this.hasAttribute('data-in-cart')) {
                addToCart(productId);
                this.textContent = 'In Cart';
                this.setAttribute('data-in-cart', '');
            } else {
                window.location.href = 'cart.html';
            }
        });
    });
    
    console.log('Event listeners setup complete');
}

function displayProducts() {
    console.log('Displaying products, count:', products.length);
    const productsContainer = document.getElementById('products-container') || 
                             document.getElementById('products-grid') || 
                             document.querySelector('.products-grid');
    
    if (!productsContainer) {
        console.error('Products container not found');
        return;
    }
    
    // Clear any existing content
    productsContainer.innerHTML = '';
    
    // Get sort value
    const sortSelect = document.getElementById('sort');
    const sortOption = sortSelect ? sortSelect.value : 'default';
    
    // Sort products
    let displayedProducts = sortProducts(products, sortOption);
    
    // Display the products
    if (displayedProducts.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">No products found in this category</div>';
    } else {
        displayedProducts.forEach(product => {
            try {
                const productCard = createProductCard(product);
                productsContainer.appendChild(productCard);
            } catch (error) {
                console.error('Error creating product card for:', product, error);
            }
        });
        
        // IMPORTANT: Re-attach event listeners after creating product cards
        setupEventListeners();
    }
}

function createProductCard(product) {
    console.log('Creating card for product:', product.name);
    
    const productDiv = document.createElement('div');
    productDiv.className = 'product-card';
    productDiv.setAttribute('data-product-id', product.id);
    
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
    
    return productDiv;
}

function addToCart(productId) {
    console.log(`Adding product ID ${productId} to cart`);
    
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