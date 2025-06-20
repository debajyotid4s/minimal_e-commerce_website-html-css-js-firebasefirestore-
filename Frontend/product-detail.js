import { getProductById, getRelatedProducts, getYouTubeEmbedUrl, formatCurrency } from '../Backend/product-detail-service.js';

// Cart management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Wait for DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Product detail page loaded');
    
    // Get product ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        showErrorMessage('Product ID not found in URL');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('loading-indicator').style.display = 'block';
        
        // Hide error message initially
        document.getElementById('error-message').style.display = 'none';
        
        // Fetch product from Firestore
        const product = await getProductById(productId);
        
        if (!product) {
            showErrorMessage('Product not found');
            return;
        }
        
        console.log('Product loaded:', product.name);
        
        // Display the product details
        displayProductDetail(product);
        
        // Update breadcrumb
        const breadcrumb = document.querySelector('.breadcrumb span');
        if (breadcrumb) {
            breadcrumb.textContent = product.name;
        }
        
        // Update page title
        document.title = `${product.name} - অনুস্বর / Anusswar`;
        
        // Fetch related products
        if (product.category) {
            try {
                const relatedProducts = await getRelatedProducts(productId, product.category);
                displayRelatedProducts(relatedProducts);
            } catch (error) {
                console.error('Error fetching related products:', error);
            }
        }
        
        // Update cart count
        updateCartCount();
        
        // Hide loading indicator
        document.getElementById('loading-indicator').style.display = 'none';
        
    } catch (error) {
        console.error('Error loading product:', error);
        showErrorMessage('Failed to load product details. Please try again later.');
    }
});

// Function to display error message
function showErrorMessage(message) {
    // Hide loading indicator
    document.getElementById('loading-indicator').style.display = 'none';
    
    // Show error message
    const errorElement = document.getElementById('error-message');
    errorElement.innerHTML = `
        <p>${message}</p>
        <a href="products.html" class="btn">Browse All Products</a>
    `;
    errorElement.style.display = 'block';
}

// Function to display product details
function displayProductDetail(product) {
    // Create the product detail wrapper
    const productDetailContainer = document.querySelector('.container');
    
    // Clear any existing error message
    document.getElementById('error-message').style.display = 'none';
    
    // Create product detail HTML structure
    const productDetailHTML = `
        <div class="product-detail-wrapper">
            <div class="product-gallery">
                <div class="product-main-image">
                    <img src="${product.image}" alt="${product.name}" id="main-product-image">
                </div>
                <div class="product-thumbnails">
                    ${createThumbnailsHTML(product)}
                </div>
                ${product.videoUrl ? createVideoHTML(product.videoUrl) : ''}
            </div>
            
            <div class="product-info">
                <h1>${product.name}</h1>
                <div class="product-price">৳${formatCurrency(product.price)}</div>
                <div class="product-description">${product.description}</div>
                
                <div class="product-meta">
                    <div class="product-meta-item">
                        <span class="product-meta-label">Category:</span>
                        <span>${product.category || 'Uncategorized'}</span>
                    </div>
                    <div class="product-meta-item">
                        <span class="product-meta-label">SKU:</span>
                        <span>${product.sku || 'N/A'}</span>
                    </div>
                    <div class="product-meta-item">
                        <span class="product-meta-label">Availability:</span>
                        <span class="${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                            ${product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                        </span>
                    </div>
                </div>
                
                <div class="product-actions">
                    <div class="quantity-selector">
                        <label for="quantity">Quantity:</label>
                        <div class="quantity-controls">
                            <button class="quantity-btn" id="decrease-qty">-</button>
                            <input type="number" id="quantity" class="quantity-input" value="1" min="1" max="${product.stock || 1}">
                            <button class="quantity-btn" id="increase-qty">+</button>
                        </div>
                    </div>
                    
                    <button class="add-to-cart-btn" id="add-to-cart" ${product.stock <= 0 ? 'disabled' : ''}>
                        ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart!'}
                    </button>
                </div>
            </div>
        </div>
        
        <div class="product-tabs">
            <div class="tabs-header">
                <button class="tab-button active" data-tab="description">Description</button>
                <button class="tab-button" data-tab="specifications">Specifications</button>
            </div>
            
            <div id="description" class="tab-content active">
                <p>${product.description}</p>
            </div>
            
            <div id="specifications" class="tab-content">
                ${createSpecificationsHTML(product)}
            </div>
        </div>
    `;
    
    // Insert the product detail HTML
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.insertAdjacentHTML('afterend', productDetailHTML);
    
    // Set up thumbnail click event
    setupThumbnailEvents();
    
    // Set up tab functionality
    setupTabEvents();
    
    // Set up quantity buttons
    setupQuantityEvents();
    
    // Set up add to cart button
    setupAddToCartEvent(product);
}

// Function to create thumbnails HTML
function createThumbnailsHTML(product) {
    // Start with the main image
    let thumbnailsHTML = `
        <div class="product-thumbnail active" data-index="0">
            <img src="${product.image}" alt="${product.name} - Main">
        </div>
    `;
    
    // Add additional images if available
    if (product.additionalImages && product.additionalImages.length > 0) {
        product.additionalImages.forEach((imgSrc, index) => {
            thumbnailsHTML += `
                <div class="product-thumbnail" data-index="${index + 1}">
                    <img src="${imgSrc}" alt="${product.name} - Image ${index + 1}">
                </div>
            `;
        });
    }
    
    return thumbnailsHTML;
}

// Function to create video HTML
function createVideoHTML(videoUrl) {
    const embedUrl = getYouTubeEmbedUrl(videoUrl);
    if (!embedUrl) return '';
    
    return `
        <div class="product-video">
            <iframe src="${embedUrl}" allowfullscreen></iframe>
        </div>
    `;
}

// Function to create specifications HTML
function createSpecificationsHTML(product) {
    if (!product.features || product.features.length === 0) {
        return '<p>No specifications available for this product.</p>';
    }
    
    let featuresHTML = '<ul class="specifications-list">';
    product.features.forEach(feature => {
        featuresHTML += `<li>${feature}</li>`;
    });
    featuresHTML += '</ul>';
    
    return featuresHTML;
}

// Function to set up thumbnail click events
function setupThumbnailEvents() {
    document.querySelectorAll('.product-thumbnail').forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Get the image index
            const index = parseInt(this.dataset.index);
            
            // Get all thumbnails
            const thumbnails = document.querySelectorAll('.product-thumbnail');
            
            // Get the image url from the clicked thumbnail
            const imgSrc = this.querySelector('img').src;
            
            // Update main image
            document.getElementById('main-product-image').src = imgSrc;
            
            // Update active thumbnail
            document.querySelector('.product-thumbnail.active').classList.remove('active');
            this.classList.add('active');
        });
    });
}

// Function to set up tab functionality
function setupTabEvents() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            // Get the target tab
            const tabId = this.dataset.tab;
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked tab and its content
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Function to set up quantity buttons
function setupQuantityEvents() {
    const quantityInput = document.getElementById('quantity');
    
    document.getElementById('decrease-qty').addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });
    
    document.getElementById('increase-qty').addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        const maxValue = parseInt(quantityInput.max);
        if (currentValue < maxValue) {
            quantityInput.value = currentValue + 1;
        }
    });
}

// Function to set up add to cart button
function setupAddToCartEvent(product) {
    document.getElementById('add-to-cart').addEventListener('click', function() {
        if (this.disabled) return;
        
        const quantity = parseInt(document.getElementById('quantity').value);
        addToCart(product, quantity);
        
        // Visual feedback
        const originalText = this.textContent;
        this.textContent = 'Added to Cart!';
        setTimeout(() => {
            this.textContent = originalText;
        }, 2000);
    });
}

// Function to display related products
function displayRelatedProducts(products) {
    if (!products || products.length === 0) return;
    
    // Create related products container if it doesn't exist
    let relatedProductsContainer = document.querySelector('.related-products');
    if (!relatedProductsContainer) {
        relatedProductsContainer = document.createElement('div');
        relatedProductsContainer.className = 'related-products';
        document.querySelector('.container').appendChild(relatedProductsContainer);
    }
    
    // Create HTML for related products
    let relatedProductsHTML = `
        <h2>You May Also Like</h2>
        <div class="related-products-grid">
    `;
    
    // Add each related product
    products.forEach(product => {
        relatedProductsHTML += `
            <div class="related-product-card">
                <div class="related-product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <h3>${product.name}</h3>
                <p class="related-product-price">৳${formatCurrency(product.price)}</p>
                <a href="product-detail.html?id=${product.id}" class="related-product-link">View Details</a>
            </div>
        `;
    });
    
    relatedProductsHTML += '</div>';
    relatedProductsContainer.innerHTML = relatedProductsHTML;
}

// Function to add product to cart
function addToCart(product, quantity = 1) {
    // Get existing cart or create new one
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already in cart
    const existingProduct = cart.find(item => item.id === product.id);
    
    if (existingProduct) {
        // Update quantity if product already in cart
        existingProduct.quantity += quantity;
    } else {
        // Add new product to cart
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }
    
    // Save cart back to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Show notification
    showNotification(`${product.name} added to cart`);
}

// Function to update cart count
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (!cartCountElement) return;
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCountElement.textContent = totalItems;
    
    if (totalItems > 0) {
        cartCountElement.style.display = 'inline-block';
    } else {
        cartCountElement.style.display = 'none';
    }
}

// Function to show notification
function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set message and show
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after delay
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}