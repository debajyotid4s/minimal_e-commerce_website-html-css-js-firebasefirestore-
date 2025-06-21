// This is for your frontend.js or a similar file
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = itemCount;
    }
}
let slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";

  let prevButton = document.querySelector('.prev');
  let nextButton = document.querySelector('.next');
  let dotsContainer = document.querySelector('.dots-container');
  
  if (prevButton) prevButton.style.display = "block";
  if (nextButton) nextButton.style.display = "block";
  if (dotsContainer) dotsContainer.style.display = "block";
}

// Auto slide
setInterval(() => {
  plusSlides(1);
}, 4000); // Change image every 5 seconds

// Display featured products
function displayFeaturedProducts() {
    const productsContainer = document.getElementById('featured-products');
    
    if (!productsContainer) return;
    
    // Remove loader
    productsContainer.innerHTML = '';
    
    // Check if products variable exists
    if (typeof products !== 'undefined') {
        // Display products
        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product-card';
            productElement.innerHTML = `
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
            productsContainer.appendChild(productElement);
        });
        
        // Add event listeners to "Add to Cart" buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', addToCart);
        });
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    displayFeaturedProducts();
});

