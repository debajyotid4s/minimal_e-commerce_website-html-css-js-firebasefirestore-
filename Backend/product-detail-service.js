import { db } from '../Frontend/config/firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/**
 * Get a product from Firestore by its ID
 * @param {string} productId - The ID of the product to retrieve
 * @returns {Promise<Object|null>} - The product data or null if not found
 */
export async function getProductById(productId) {
    try {
        console.log(`Getting product with ID: ${productId}`);
        
        // Handle string or number IDs
        const id = productId.toString();
        
        // Reference to the product document
        const productRef = doc(db, "products", id);
        
        // Get the document
        const docSnap = await getDoc(productRef);
        
        if (!docSnap.exists()) {
            console.log(`No product found with ID: ${id}`);
            return null;
        }
        
        // Get the data and add the ID to it
        const data = docSnap.data();
        
        // Create a properly formatted product object
        const product = {
            id: docSnap.id,
            name: data.name || 'Unnamed Product',
            price: data.price || 0,
            description: data.description || 'No description available',
            category: data.category || 'Uncategorized',
            stock: data.stock || 0,
            sku: data.sku || docSnap.id,
            image: data.image || '../Frontend/assets/placeholder.jpg',
            additionalImages: data.additionalImages || [],
            features: data.features || [],
            videoUrl: data.videoUrl || null
        };
        
        console.log('Product retrieved successfully:', product.name);
        return product;
        
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        throw error;
    }
}

/**
 * Get related products in the same category
 * @param {string} productId - The ID of the current product
 * @param {string} category - The category to match
 * @param {number} limit - Maximum number of related products to return
 * @returns {Promise<Array>} - Array of related products
 */
export async function getRelatedProducts(productId, category, limit = 4) {
    try {
        console.log(`Getting related products for category: ${category}, excluding ID: ${productId}`);
        
        // Create a query for products in the same category, excluding current product
        const productsQuery = query(
            collection(db, "products"),
            where("category", "==", category)
        );
        
        const querySnapshot = await getDocs(productsQuery);
        
        if (querySnapshot.empty) {
            console.log(`No related products found in category: ${category}`);
            return [];
        }
        
        // Process results and exclude current product
        const relatedProducts = [];
        querySnapshot.forEach(doc => {
            // Skip the current product
            if (doc.id === productId.toString()) return;
            
            const data = doc.data();
            relatedProducts.push({
                id: doc.id,
                name: data.name || 'Unnamed Product',
                price: data.price || 0,
                category: data.category || 'Uncategorized',
                image: data.image || '../Frontend/assets/placeholder.jpg',
                stock: data.stock || 0
            });
        });
        
        // Limit the number of related products returned
        const limitedResults = relatedProducts.slice(0, limit);
        console.log(`Found ${limitedResults.length} related products`);
        
        return limitedResults;
        
    } catch (error) {
        console.error('Error fetching related products:', error);
        return [];
    }
}

/**
 * Convert YouTube URL to embed format
 * @param {string} url - YouTube URL
 * @returns {string|null} - Embed URL or null if invalid
 */
export function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    
    try {
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
    } catch (error) {
        console.error('Error converting YouTube URL:', error);
        return null;
    }
}

/**
 * Add a product view record (for analytics)
 * @param {string} productId - The ID of the product viewed
 * @param {Object} userData - Optional user data for analytics
 */
export async function recordProductView(productId, userData = null) {
    // This is a placeholder function that you can implement later
    // for tracking product views in Firestore
    console.log(`Product view recorded for ID: ${productId}`);
    
    // Example implementation (commented out):
    /*
    try {
        const viewsRef = collection(db, "product_views");
        await addDoc(viewsRef, {
            productId: productId,
            timestamp: new Date(),
            userId: userData?.userId || null,
            userAgent: navigator.userAgent,
            referrer: document.referrer
        });
    } catch (error) {
        console.error('Error recording product view:', error);
    }
    */
}

/**
 * Format price with Bengali currency symbol
 * @param {number} price - The price to format
 * @returns {string} - Formatted price string
 */
export function formatCurrency(price) {
    if (typeof price !== 'number') {
        return '0';
    }
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Check if a product is available
 * @param {Object} product - The product to check
 * @returns {boolean} - Whether the product is available
 */
export function isProductAvailable(product) {
    return product && product.stock > 0;
}