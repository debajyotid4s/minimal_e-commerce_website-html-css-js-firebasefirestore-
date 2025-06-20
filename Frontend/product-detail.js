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
        const detailContainer = document.getElementById('product-detail');
        if (detailContainer) {
            detailContainer.innerHTML = '<div class="loading-indicator">Loading product details...</div>';
        }
        
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
        const breadcrumb = document.getElementById('product-breadcrumb');
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
        
    } catch (error) {
        console.error('Error loading product:', error);
        showErrorMessage('Failed to load product details. Please try again later.');
    }
});

// Function to display error message
function showErrorMessage(message) {
    const detailContainer = document.getElementById('product-detail');
    if (detailContainer) {
        detailContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <a href="products.html" class="btn">Browse All Products</a>
            </div>
        `;
    }
}

// Function to display product details
function displayProductDetail(product) {
    const detailContainer = document.getElementById('product-detail');
    if (!detailContainer) return;
    
    // Create thumbnails HTML
    let thumbnailsHtml = '';
    if (product.additionalImages && product.additionalImages.length > 0) {
        thumbnailsHtml = `
            <div class="product-thumbnail active" data-index="0">
                <img src="${product.image}" alt="${product.name} - Main">
            </div>
        `;
        
        product.additionalImages.forEach((imgSrc, index) => {
            thumbnailsHtml += `
                <div class="product-thumbnail" data-index="${index + 1}">
                    <img src="${imgSrc}" alt="${product.name} - Image ${index + 1}">
                </div>
            `;
        });
    }
    
    // Collect all images for the gallery
    const allImages = [product.image];
    if (product.additionalImages) {
        allImages.push(...product.additionalImages);
    }
    
    // Check if product has features for the specifications tab
    let specificationsHtml = '';
    if (product.features && product.features.length > 0) {
        specificationsHtml = `
            <ul class="specifications-list">
                ${product.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        `;
    } else {
        specificationsHtml = '<p>No specifications available for this product.</p>';
    }
    
    // Create product video HTML if available
    let videoHtml = '';
    if (product.videoUrl) {
        // Convert YouTube URL to embed format
        const embedUrl = getYouTubeEmbedUrl(product.videoUrl);
        
        if (embedUrl) {
            videoHtml = `
                <div class="product-video">
                    <iframe src="${embedUrl}" allowfullscreen></iframe>
                </div>
            `;
        }
    }
    
    // Format price
    const formattedPrice = formatCurrency(product.price);
    
    // Check if product is in cart
    const isInCart = cart.some(item => item.id === product.id);
    
    // Build complete product detail HTML
    detailContainer.innerHTML = `
        <div class="product-detail-wrapper">
            <div class="product-gallery">
                <div class="product-main-image">
                    <img src="${product.image}" alt="${product.name}" id="main-product-image">
                </div>
                <div class="product-thumbnails">
                    ${thumbnailsHtml}
                </div>
                ${videoHtml}
            </div>
            
            <div class="product-info">
                <h1>${product.name}</h1>
                <div class="product-price">৳${formattedPrice}</div>
                <div class="product-description">${product.description}</div>
                
                <div class="product-meta">
                    <div class="product-meta-item">
                        <span class="product-meta-label">Category:</span>
                        <span>${product.category}</span>
                    </div>
                    <div class="product-meta-item">
                        <span class="product-meta-label">SKU:</span>
                        <span>${product.sku || 'N/A'}</span>
                    </div>
                    <div class="product-meta-item">
                        <span class="product-meta-label">Availability:</span>
                        <span>${product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}</span>
                    </div>
                </div>
                
                <div class="product-actions">
                    <div class="quantity-selector">
                        <label for="quantity">Quantity:</label>
                        <div class="quantity-controls">
                            <button class="quantity-btn" id="decrease-qty">-</button>
                            <input type="number" id="quantity" class="quantity-input" value="1" min="1" max="${product.stock || 10}">
                            <button class="quantity-btn" id="increase-qty">+</button>
                        </div>
                    </div>
                    
                    <button class="add-to-cart-btn" id="add-to-cart" ${product.stock <= 0 ? 'disabled' : ''}>
                        ${isInCart ? 'Update Cart' : 'Add to Cart'}
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
                ${specificationsHtml}
            </div>
        </div>
    `;
    
    // Set up thumbnail click event
    document.querySelectorAll('.product-thumbnail').forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Get the image index
            const index = parseInt(this.dataset.index);
            
            // Update main image
            document.getElementById('main-product-image').src = allImages[index];
            
            // Update active thumbnail
            document.querySelector('.product-thumbnail.active').classList.remove('active');
            this.classList.add('active');
        });
    });
    
    // Set up quantity buttons
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
    
    // Set up tab functionality
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
    
    // Set up add to cart button
    document.getElementById('add-to-cart').addEventListener('click', function() {
        const quantity = parseInt(quantityInput.value);
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
    const relatedContainer = document.getElementById('related-products');
    if (!relatedContainer || products.length === 0) return;
    
    let html = '<h2>You May Also Like</h2><div class="related-products-grid">';
    
    products.forEach(product => {
        const formattedPrice = formatCurrency(product.price);
        
        html += `
            <div class="related-product-card">
                <div class="related-product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <h3>${product.name}</h3>
                <p class="related-product-price">৳${formattedPrice}</p>
                <a href="product-detail.html?id=${product.id}" class="related-product-link">View Details</a>
            </div>
        `;
    });
    
    html += '</div>';
    relatedContainer.innerHTML = html;
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
            quantity: quantity,
            sku: product.sku
        });
    }
    
    // Save cart back to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Show notification
    showNotification(`${product.name} added to cart`);
}

// Function to update cart count in header
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
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Hide and remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}