document.addEventListener('DOMContentLoaded', function() {
    const lessonForm = document.getElementById('lesson-form');
    const formResponse = document.getElementById('form-response');
    
    if (lessonForm) {
        lessonForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(lessonForm);
            const formValues = {};
            
            for (const [key, value] of formData.entries()) {
                formValues[key] = value;
            }
            
            // Simple validation
            if (!formValues.name || !formValues.email || !formValues.phone || 
                !formValues.instrument || !formValues.experience || !formValues['lesson-type']) {
                showResponse('Please fill in all required fields.', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formValues.email)) {
                showResponse('Please enter a valid email address.', 'error');
                return;
            }
            
            // Simulate form submission
            lessonForm.querySelector('button[type="submit"]').disabled = true;
            lessonForm.querySelector('button[type="submit"]').innerHTML = 'Submitting...';
            
            setTimeout(function() {
                // In a real application, you would send the form data to your server here
                // using fetch or XMLHttpRequest
                
                showResponse('Thank you for your inquiry! We will contact you soon to discuss lesson options.', 'success');
                lessonForm.reset();
                lessonForm.querySelector('button[type="submit"]').disabled = false;
                lessonForm.querySelector('button[type="submit"]').innerHTML = 'Submit Request <i class="fas fa-arrow-right"></i>';
            }, 1500);
        });
    }
    
    function showResponse(message, type) {
        formResponse.textContent = message;
        formResponse.className = 'form-response ' + type;
        formResponse.style.display = 'block';
        
        // Scroll to response
        formResponse.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Hide after a delay if it's a success message
        if (type === 'success') {
            setTimeout(function() {
                formResponse.style.display = 'none';
            }, 5000);
        }
    }
});