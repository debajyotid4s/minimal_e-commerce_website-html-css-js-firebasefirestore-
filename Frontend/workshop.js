document.addEventListener('DOMContentLoaded', function() {
    const tuneinButton = document.getElementById('tunein-button');
    const descriptionField = document.getElementById('description');
    const submissionStatus = document.getElementById('submission-status');
    
    
    
    // Handle form submission
    tuneinButton.addEventListener('click', function() {
        const description = descriptionField.value.trim();
        
        // Validate inputs
        if (description === '' || description.length < 10) {
            showStatusMessage('Please provide a proper description of your instrument. Describe as much as you can.', 'error');
            return;
        }
        
        
        // Here you would normally send the data to a server
        // For demo purposes, we'll just show a success message
        
        // Create FormData for sending
        const formData = new FormData();
        formData.append('description', description);
        
        
        // Simulate form submission
        tuneinButton.disabled = true;
        tuneinButton.textContent = 'Submitting...';
        
        setTimeout(() => {
            // Simulate successful submission
            showStatusMessage('Your custom instrument request has been submitted successfully! Our team will contact you soon.', 'success');
            
            // Reset form
            descriptionField.value = '';
            selectedFiles = [];
            imagePreview.innerHTML = '';
            tuneinButton.disabled = false;
            tuneinButton.textContent = 'TuneIn';
        }, 2000);
        
        
    });
    
    // Helper function to show status messages
    function showStatusMessage(message, type) {
        submissionStatus.textContent = message;
        submissionStatus.className = 'submission-status ' + type;
        
        // Scroll to the message
        submissionStatus.scrollIntoView({ behavior: 'smooth' });
        
        // Hide the message after a while if it's a success
        if (type === 'success') {
            setTimeout(() => {
                submissionStatus.textContent = '';
                submissionStatus.className = 'submission-status';
            }, 5000);
        }
    }
});