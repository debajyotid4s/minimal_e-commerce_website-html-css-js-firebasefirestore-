// Wait for DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get product ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId) {
        showErrorMessage('Product not found');
        return;
    }
    
    // Find the product in our products array (from script.js)
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showErrorMessage('Product not found');
        return;
    }
    
    // Display the product details
    displayProductDetail(product);
    
    // Update breadcrumb
    document.getElementById('product-breadcrumb').textContent = product.name;
    
    // Update page title
    document.title = `${product.name} - অনুস্বর / Anusswar`;
    
    // Update cart count
    updateCartCount();
});

// Function to display error message
function showErrorMessage(message) {
    const detailContainer = document.getElementById('product-detail');
    detailContainer.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <a href="products.html" class="btn">Browse All Products</a>
        </div>
    `;
}

// Function to convert YouTube URL to embed format
function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    
    // Handle youtu.be format
    if (url.includes('youtu.be')) {
        // Extract video ID from URL like https://youtu.be/jdlqcAAuZeA?si=kpDRZGsoTq6MI2aJ
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Handle youtube.com format
    if (url.includes('youtube.com/watch')) {
        // Extract video ID from URL like https://www.youtube.com/watch?v=jdlqcAAuZeA
        const videoId = new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // If it's already in embed format or unrecognized, return as is
    return url;
}

// Function to display product details
function displayProductDetail(product) {
    const detailContainer = document.getElementById('product-detail');
    
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
        
        videoHtml = `
            <div class="product-video">
                <iframe src="${embedUrl}" allowfullscreen></iframe>
            </div>
        `;
    }
    
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
                <div class="product-price">৳${product.price.toFixed(2)}</div>
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
                        Add to Cart
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
        this.textContent = 'Added to Cart!';
        setTimeout(() => {
            this.textContent = 'Add to Cart';
        }, 2000);
    });
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
}