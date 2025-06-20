import { db } from '../Frontend/config/firebase-config.js';
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Product service functions
export async function getAllProducts() {
    try {
        const productsRef = collection(db, "products");
        const querySnapshot = await getDocs(productsRef);
        
        if (querySnapshot.empty) {
            return [];
        }
        
        const products = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            products.push({
                id: doc.id,
                name: data.name || 'Unnamed Product',
                price: data.price || 0,
                category: data.category || 'Uncategorized',
                description: data.description || '',
                image: data.image || (data.additionalImages && data.additionalImages.length > 0 
                    ? data.additionalImages[0] : 'assets/placeholder.jpg'),
                additionalImages: data.additionalImages || [],
                stock: data.stock || 1,
                features: data.features || [],
                sku: data.sku || doc.id
            });
        });
        
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

export async function getProductsByCategory(category) {
    try {
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("category", "==", category));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return [];
        }
        
        const products = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            products.push({
                id: doc.id,
                name: data.name || 'Unnamed Product',
                price: data.price || 0,
                category: data.category || 'Uncategorized',
                description: data.description || '',
                image: data.image || (data.additionalImages && data.additionalImages.length > 0 
                    ? data.additionalImages[0] : 'assets/placeholder.jpg'),
                additionalImages: data.additionalImages || [],
                stock: data.stock || 1,
                features: data.features || [],
                sku: data.sku || doc.id
            });
        });
        
        return products;
    } catch (error) {
        console.error('Error fetching products by category:', error);
        throw error;
    }
}

export async function getProductById(productId) {
    try {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
            throw new Error('Product not found');
        }
        
        const data = productSnap.data();
        return {
            id: productSnap.id,
            name: data.name || 'Unnamed Product',
            price: data.price || 0,
            category: data.category || 'Uncategorized',
            description: data.description || '',
            image: data.image || (data.additionalImages && data.additionalImages.length > 0 
                ? data.additionalImages[0] : 'assets/placeholder.jpg'),
            additionalImages: data.additionalImages || [],
            stock: data.stock || 1,
            features: data.features || [],
            sku: data.sku || productSnap.id
        };
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        throw error;
    }
}

// Additional service functions as needed
export function searchProducts(products, searchTerm) {
    if (!searchTerm) return products;
    
    const lowercaseTerm = searchTerm.toLowerCase();
    return products.filter(product => 
        product.name.toLowerCase().includes(lowercaseTerm) || 
        (product.description && product.description.toLowerCase().includes(lowercaseTerm))
    );
}

export function filterProductsByPriceRange(products, minPrice, maxPrice) {
    return products.filter(product => 
        product.price >= minPrice && product.price <= maxPrice
    );
}

export function sortProducts(products, sortOption) {
    const sortedProducts = [...products];
    
    switch (sortOption) {
        case 'price-low':
        case 'price-low-high':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
        case 'price-high-low':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-a-z':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-z-a':
            sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        // Default: no sorting
    }
    
    return sortedProducts;
}