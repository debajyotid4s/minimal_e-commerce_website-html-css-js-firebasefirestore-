// Import the Firebase modules
import { db } from '../Frontend/config/firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

console.log("Products service loaded");

// Function to fetch products from Firestore
async function fetchFeaturedProducts(maxProducts = 4) {
    try {
        console.log("Fetching products from Firestore");
        
        // Get a reference to the products collection
        const productsRef = collection(db, "products");
        
        // Get all documents in the collection
        const querySnapshot = await getDocs(productsRef);
        const products = [];
        
        querySnapshot.forEach((doc) => {
            // Get the document data and add the document ID
            const productData = doc.data();
            console.log("Found product:", doc.id);
            
            // Extract product data with fallbacks for missing fields
            products.push({
                id: doc.id,
                name: productData.name || 'Unnamed Product',
                price: typeof productData.price === 'number' ? productData.price : 
                       (parseFloat(productData.price) || 0),
                image: productData.imageUrl || productData.image || 'assets/placeholder.jpg',
                description: productData.description || ''
            });
        });
        
        // Limit to the requested number of products
        const displayProducts = products.slice(0, maxProducts);
        
        console.log(`Fetched ${displayProducts.length} products`);
        
        // Make products available globally for the frontend to use
        window.products = displayProducts;
        
        // Update the UI if the featured products container exists
        const featuredProductsContainer = document.getElementById('featured-products');
        if (featuredProductsContainer) {
            if (displayProducts.length === 0) {
                featuredProductsContainer.innerHTML = '<div class="no-products">No products found</div>';
            } else {
                // Clear loading message
                featuredProductsContainer.innerHTML = '';
                
                // Add products to the container
                displayProducts.forEach(product => {
                    const productEl = document.createElement('div');
                    productEl.className = 'product-card';
                    productEl.innerHTML = `
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
                    featuredProductsContainer.appendChild(productEl);
                });
                
                // Add event listeners to add-to-cart buttons
                document.querySelectorAll('.add-to-cart').forEach(button => {
                    button.addEventListener('click', function() {
                        const productId = this.getAttribute('data-id');
                        // Find the product in the products array
                        const product = displayProducts.find(p => p.id === productId);
                        if (product) {
                            // Check if cart exists in localStorage
                            const cart = JSON.parse(localStorage.getItem('cart')) || [];
                            
                            // Check if product already in cart
                            const existingItem = cart.find(item => item.id === productId);
                            
                            if (existingItem) {
                                existingItem.quantity += 1;
                            } else {
                                cart.push({
                                    id: product.id,
                                    name: product.name,
                                    price: product.price,
                                    image: product.image,
                                    quantity: 1
                                });
                            }
                            
                            // Update localStorage
                            localStorage.setItem('cart', JSON.stringify(cart));
                            
                            // Update cart count in navigation
                            updateCartCount();
                            
                            // Show confirmation to user
                            alert(`Added ${product.name} to your cart!`);
                        }
                    });
                });
            }
        }
        
        return displayProducts;
    } catch (error) {
        console.error("Error fetching products:", error);
        
        // Update UI on error
        const featuredProductsContainer = document.getElementById('featured-products');
        if (featuredProductsContainer) {
            featuredProductsContainer.innerHTML = '<div class="error">Error loading products. Please try again later.</div>';
        }
        
        return [];
    }
}

// Helper function to update cart count in the navigation
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = itemCount;
    }
}

// Initialize products when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded in products service");
    
    // Check if we're on a page that needs featured products
    const featuredProductsContainer = document.getElementById('featured-products');
    if (featuredProductsContainer) {
        console.log("Featured products container found, fetching products");
        featuredProductsContainer.innerHTML = '<div class="loading">Loading products...</div>';
        fetchFeaturedProducts();
    }
});

// Export the function for use in other scripts if needed
export { fetchFeaturedProducts };