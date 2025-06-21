// Dashboard.js - Handles loading data for the admin dashboard

document.addEventListener('DOMContentLoaded', function() {
    // Load pending orders
    fetchPendingOrders();
    
    // Load custom instrument requests
    fetchCustomRequests();
    
    // Load learning instrument requests
    fetchLearningRequests();
});

// Function to fetch pending orders
function fetchPendingOrders() {
    const ordersContainer = document.getElementById('pending-orders');
    
    // Replace with your actual API endpoint
    fetch('/api/orders/pending')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(orders => {
            // Clear loading message
            ordersContainer.innerHTML = '';
            
            if (orders.length === 0) {
                ordersContainer.innerHTML = '<p class="no-data">No pending orders found.</p>';
                return;
            }
            
            // Display orders
            orders.forEach(order => {
                const orderCard = createOrderCard(order);
                ordersContainer.appendChild(orderCard);
            });
        })
        .catch(error => {
            ordersContainer.innerHTML = `<p class="error">Failed to load orders: ${error.message}</p>`;
            console.error('Error fetching pending orders:', error);
        });
}

// Function to fetch custom instrument requests
function fetchCustomRequests() {
    const requestsContainer = document.getElementById('custom-requests');
    
    // Replace with your actual API endpoint
    fetch('/api/requests/custom')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(requests => {
            // Clear loading message
            requestsContainer.innerHTML = '';
            
            if (requests.length === 0) {
                requestsContainer.innerHTML = '<p class="no-data">No custom instrument requests found.</p>';
                return;
            }
            
            // Display requests
            requests.forEach(request => {
                const requestCard = createRequestCard(request, 'custom');
                requestsContainer.appendChild(requestCard);
            });
        })
        .catch(error => {
            requestsContainer.innerHTML = `<p class="error">Failed to load requests: ${error.message}</p>`;
            console.error('Error fetching custom requests:', error);
        });
}

// Function to fetch learning instrument requests
function fetchLearningRequests() {
    const requestsContainer = document.getElementById('learning-requests');
    
    // Replace with your actual API endpoint
    fetch('/api/requests/learning')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(requests => {
            // Clear loading message
            requestsContainer.innerHTML = '';
            
            if (requests.length === 0) {
                requestsContainer.innerHTML = '<p class="no-data">No learning instrument requests found.</p>';
                return;
            }
            
            // Display requests
            requests.forEach(request => {
                const requestCard = createRequestCard(request, 'learning');
                requestsContainer.appendChild(requestCard);
            });
        })
        .catch(error => {
            requestsContainer.innerHTML = `<p class="error">Failed to load requests: ${error.message}</p>`;
            console.error('Error fetching learning requests:', error);
        });
}

// Helper function to create order cards
function createOrderCard(order) {
    const card = document.createElement('div');
    card.classList.add('card', 'order-card');
    
    // Create card content based on order data
    // This will be implemented by your backend
    
    return card;
}

// Helper function to create request cards
function createRequestCard(request, type) {
    const card = document.createElement('div');
    card.classList.add('card', `${type}-request-card`);
    
    // Create card content based on request data
    // This will be implemented by your backend
    
    return card;
}