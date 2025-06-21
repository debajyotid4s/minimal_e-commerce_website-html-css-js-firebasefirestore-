// Dashboard.js - Handles loading data from Firestore for the admin dashboard

import { db, auth } from '../Frontend/config/firebase-config.js';
import { 
    collection, query, where, getDocs, doc, getDoc, 
    orderBy, limit, Timestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log("Dashboard loading...");
    
    // Check if user is authenticated
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("User authenticated:", user.email);
            await loadAllData();
        } else {
            console.log("No user authenticated, redirecting to login");
            window.location.href = "login_signup.html";
        }
    });
});

async function loadAllData() {
    try {
        // Load all data in parallel
        await Promise.all([
            fetchPendingOrders(),
            fetchCustomRequests(),
            fetchLearningRequests()
        ]);
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

// Function to fetch pending orders from Firestore
async function fetchPendingOrders() {
    const ordersContainer = document.getElementById('pending-orders');
    
    if (!ordersContainer) {
        console.error("Orders container not found");
        return;
    }
    
    try {
        ordersContainer.innerHTML = '<div class="loading">Loading pending orders...</div>';
        
        const allOrders = [];
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        // Iterate through each user to find their orders
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const orderedItemsRef = collection(db, "users", userId, "ordered_items");
            const ordersSnapshot = await getDocs(orderedItemsRef);
            
            // Process each order for this user
            ordersSnapshot.forEach(orderDoc => {
                const orderData = orderDoc.data();
                // Add user ID and order ID to the order data for reference
                allOrders.push({
                    id: orderDoc.id,
                    userId: userId,
                    userEmail: orderData.userEmail || userDoc.data().email || "Unknown",
                    ...orderData,
                    timestamp: orderData.timestamp || orderData.date || orderData.createdAt || Timestamp.now()
                });
            });
        }
        
        // Sort orders by timestamp (newest first)
        allOrders.sort((a, b) => {
            const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : 
                          new Date(a.timestamp).getTime();
            const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : 
                          new Date(b.timestamp).getTime();
            return timeB - timeA;
        });
        
        // Display orders
        ordersContainer.innerHTML = '';
        
        if (allOrders.length === 0) {
            ordersContainer.innerHTML = '<p class="no-data">No pending orders found.</p>';
            return;
        }
        
        // Display only pending orders
        const pendingOrders = allOrders.filter(order => 
            order.status === 'pending' || order.status === 'processing' || !order.status);
        
        if (pendingOrders.length === 0) {
            ordersContainer.innerHTML = '<p class="no-data">No pending orders found.</p>';
            return;
        }
        
        pendingOrders.forEach(order => {
            const orderCard = createOrderCard(order);
            ordersContainer.appendChild(orderCard);
        });
        
        console.log(`Found ${pendingOrders.length} pending orders`);
        
    } catch (error) {
        ordersContainer.innerHTML = `<p class="error">Failed to load orders: ${error.message}</p>`;
        console.error('Error fetching pending orders:', error);
    }
}

// Function to fetch custom instrument requests from Firestore
async function fetchCustomRequests() {
    const requestsContainer = document.getElementById('custom-requests');
    
    if (!requestsContainer) {
        console.error("Custom requests container not found");
        return;
    }
    
    try {
        requestsContainer.innerHTML = '<div class="loading">Loading custom instrument requests...</div>';
        
        const allRequests = [];
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        // Iterate through each user to find their custom instrument orders
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const requestsRef = collection(db, "users", userId, "custom_instrument_orders");
            const requestsSnapshot = await getDocs(requestsRef);
            
            // Process each request for this user
            requestsSnapshot.forEach(requestDoc => {
                const requestData = requestDoc.data();
                allRequests.push({
                    id: requestDoc.id,
                    userId: userId,
                    userEmail: requestData.userEmail || userDoc.data().email || "Unknown",
                    ...requestData,
                    timestamp: requestData.timestamp || requestData.createdAt || requestData.date || Timestamp.now()
                });
            });
        }
        
        // Sort requests by timestamp (newest first)
        allRequests.sort((a, b) => {
            const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : 
                          new Date(a.timestamp).getTime();
            const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : 
                          new Date(b.timestamp).getTime();
            return timeB - timeA;
        });
        
        // Display requests
        requestsContainer.innerHTML = '';
        
        if (allRequests.length === 0) {
            requestsContainer.innerHTML = '<p class="no-data">No custom instrument requests found.</p>';
            return;
        }
        
        // Display only pending requests
        const pendingRequests = allRequests.filter(request => 
            request.status === 'pending' || request.status === 'processing' || !request.status);
        
        if (pendingRequests.length === 0) {
            requestsContainer.innerHTML = '<p class="no-data">No pending custom instrument requests found.</p>';
            return;
        }
        
        pendingRequests.forEach(request => {
            const requestCard = createRequestCard(request, 'custom');
            requestsContainer.appendChild(requestCard);
        });
        
        console.log(`Found ${pendingRequests.length} pending custom instrument requests`);
        
    } catch (error) {
        requestsContainer.innerHTML = `<p class="error">Failed to load requests: ${error.message}</p>`;
        console.error('Error fetching custom requests:', error);
    }
}

// Function to fetch learning instrument requests from Firestore
async function fetchLearningRequests() {
    const requestsContainer = document.getElementById('learning-requests');
    
    if (!requestsContainer) {
        console.error("Learning requests container not found");
        return;
    }
    
    try {
        requestsContainer.innerHTML = '<div class="loading">Loading learning requests...</div>';
        
        // Fetch learning requests from the root collection
        const learningRequestsRef = collection(db, "learning_requests");
        const requestsSnapshot = await getDocs(learningRequestsRef);
        
        const learningRequests = [];
        
        // Process each learning request
        requestsSnapshot.forEach(requestDoc => {
            const requestData = requestDoc.data();
            learningRequests.push({
                id: requestDoc.id,
                ...requestData,
                timestamp: requestData.timestamp || requestData.createdAt || requestData.date || Timestamp.now()
            });
        });
        
        // Sort learning requests by timestamp (newest first)
        learningRequests.sort((a, b) => {
            const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : 
                          new Date(a.timestamp).getTime();
            const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : 
                          new Date(b.timestamp).getTime();
            return timeB - timeA;
        });
        
        // Display learning requests
        requestsContainer.innerHTML = '';
        
        if (learningRequests.length === 0) {
            requestsContainer.innerHTML = '<p class="no-data">No learning requests found.</p>';
            return;
        }
        
        // Display only pending learning requests
        const pendingRequests = learningRequests.filter(request => 
            request.status === 'pending' || request.status === 'processing' || !request.status);
        
        if (pendingRequests.length === 0) {
            requestsContainer.innerHTML = '<p class="no-data">No pending learning requests found.</p>';
            return;
        }
        
        pendingRequests.forEach(request => {
            const requestCard = createRequestCard(request, 'learning');
            requestsContainer.appendChild(requestCard);
        });
        
        console.log(`Found ${pendingRequests.length} pending learning requests`);
        
    } catch (error) {
        requestsContainer.innerHTML = `<p class="error">Failed to load learning requests: ${error.message}</p>`;
        console.error('Error fetching learning requests:', error);
    }
}

// Helper function to create order cards
function createOrderCard(order) {
    const card = document.createElement('div');
    card.classList.add('card', 'order-card');
    
    // Format date
    const orderDate = order.timestamp instanceof Timestamp ? 
                      order.timestamp.toDate() : 
                      new Date(order.timestamp);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
    
    // Create card content
    card.innerHTML = `
        <div class="card-header">
            <h3>Order #${order.id.slice(0, 8)}</h3>
            <span class="status ${order.status || 'pending'}">${order.status || 'Pending'}</span>
        </div>
        <div class="card-body">
            <p><strong>Customer:</strong> ${order.customer?.firstName || ''} ${order.customer?.lastName || ''}</p>
            <p><strong>Email:</strong> ${order.userEmail || order.customer?.email || 'Not provided'}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Total:</strong> ৳${order.total?.toFixed(2) || '0.00'}</p>
            <p><strong>Items:</strong> ${(order.items?.length || 0)} item(s)</p>
            <div class="actions">
                <button class="view-details" data-id="${order.id}" data-user-id="${order.userId}">View Details</button>
                <button class="update-status" data-id="${order.id}" data-user-id="${order.userId}">Update Status</button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const viewButton = card.querySelector('.view-details');
    const updateButton = card.querySelector('.update-status');
    
    viewButton.addEventListener('click', () => viewOrderDetails(order.userId, order.id));
    updateButton.addEventListener('click', () => updateOrderStatus(order.userId, order.id));
    
    return card;
}

// Helper function to create request cards
function createRequestCard(request, type) {
    const card = document.createElement('div');
    card.classList.add('card', `${type}-request-card`);
    
    // Format date
    const requestDate = request.timestamp instanceof Timestamp ? 
                        request.timestamp.toDate() : 
                        new Date(request.timestamp);
    const formattedDate = requestDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
    
    // Create card content based on request type
    if (type === 'custom') {
        card.innerHTML = `
            <div class="card-header">
                <h3>Custom Instrument Request</h3>
                <span class="status ${request.status || 'pending'}">${request.status || 'Pending'}</span>
            </div>
            <div class="card-body">
                <p><strong>Customer:</strong> ${request.userEmail || 'Not provided'}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Description:</strong> ${request.description?.substring(0, 100)}${request.description?.length > 100 ? '...' : ''}</p>
                <div class="actions">
                    <button class="view-details" data-id="${request.id}" data-user-id="${request.userId}">View Details</button>
                    <button class="update-status" data-id="${request.id}" data-user-id="${request.userId}">Update Status</button>
                </div>
            </div>
        `;
    } else { // learning request
        card.innerHTML = `
            <div class="card-header">
                <h3>Learning Request</h3>
                <span class="status ${request.status || 'pending'}">${request.status || 'Pending'}</span>
            </div>
            <div class="card-body">
                <p><strong>Name:</strong> ${request.name || 'Not provided'}</p>
                <p><strong>Email:</strong> ${request.email || 'Not provided'}</p>
                <p><strong>Phone:</strong> ${request.phone || 'Not provided'}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Instrument:</strong> ${request.instrument || 'Not specified'}</p>
                <div class="actions">
                    <button class="view-details" data-id="${request.id}">View Details</button>
                    <button class="update-status" data-id="${request.id}">Update Status</button>
                </div>
            </div>
        `;
    }
    
    // Add event listeners
    const viewButton = card.querySelector('.view-details');
    const updateButton = card.querySelector('.update-status');
    
    if (type === 'custom') {
        viewButton.addEventListener('click', () => viewCustomRequestDetails(request.userId, request.id));
        updateButton.addEventListener('click', () => updateCustomRequestStatus(request.userId, request.id));
    } else {
        viewButton.addEventListener('click', () => viewLearningRequestDetails(request.id));
        updateButton.addEventListener('click', () => updateLearningRequestStatus(request.id));
    }
    
    return card;
}

// Function to view order details (to be implemented)
function viewOrderDetails(userId, orderId) {
    console.log(`Viewing details for order ${orderId} from user ${userId}`);
    // Will implement a modal or redirect to a details page
    alert(`Order details for order ${orderId} will be displayed here.`);
}

// Function to update order status (to be implemented)
function updateOrderStatus(userId, orderId) {
    console.log(`Updating status for order ${orderId} from user ${userId}`);
    // Will implement a status update dialog
    const newStatus = prompt('Enter new status (processing, shipped, delivered, cancelled):');
    if (newStatus) {
        alert(`Status for order ${orderId} will be updated to ${newStatus}.`);
        // Here you would update the Firestore document
    }
}

// Function to view custom request details (to be implemented)
function viewCustomRequestDetails(userId, requestId) {
    console.log(`Viewing details for custom request ${requestId} from user ${userId}`);
    alert(`Custom instrument request details for request ${requestId} will be displayed here.`);
}

// Function to update custom request status (to be implemented)
function updateCustomRequestStatus(userId, requestId) {
    console.log(`Updating status for custom request ${requestId} from user ${userId}`);
    const newStatus = prompt('Enter new status (processing, contacted, completed, rejected):');
    if (newStatus) {
        alert(`Status for custom request ${requestId} will be updated to ${newStatus}.`);
        // Here you would update the Firestore document
    }
}

// Function to view learning request details (to be implemented)
function viewLearningRequestDetails(requestId) {
    console.log(`Viewing details for learning request ${requestId}`);
    alert(`Learning request details for request ${requestId} will be displayed here.`);
}

// Function to update learning request status (to be implemented)
function updateLearningRequestStatus(requestId) {
    console.log(`Updating status for learning request ${requestId}`);
    const newStatus = prompt('Enter new status (processing, contacted, enrolled, completed, cancelled):');
    if (newStatus) {
        alert(`Status for learning request ${requestId} will be updated to ${newStatus}.`);
        // Here you would update the Firestore document
    }
}