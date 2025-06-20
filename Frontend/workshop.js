document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const tuneinButton = document.getElementById('tunein-button');
    const descriptionField = document.getElementById('description');
    const submissionStatus = document.getElementById('submission-status');
    
    // Track selected files
    let selectedFiles = [];
    
    // Handle image selection
    imageUpload.addEventListener('change', function(e) {
        const files = e.target.files;
        
        if (files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Check if it's an image
                if (!file.type.match('image.*')) {
                    continue;
                }
                
                // Add to selected files array
                selectedFiles.push(file);
                
                // Create preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'image-preview';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Preview Image';
                    
                    const removeButton = document.createElement('span');
                    removeButton.className = 'remove-image';
                    removeButton.innerHTML = '×';
                    removeButton.dataset.index = selectedFiles.length - 1;
                    
                    // Add remove functionality
                    removeButton.addEventListener('click', function() {
                        const index = parseInt(this.dataset.index);
                        selectedFiles.splice(index, 1);
                        previewDiv.remove();
                        
                        // Update indices for remaining buttons
                        const remainingButtons = document.querySelectorAll('.remove-image');
                        remainingButtons.forEach((button, idx) => {
                            if (parseInt(button.dataset.index) > index) {
                                button.dataset.index = parseInt(button.dataset.index) - 1;
                            }
                        });
                    });
                    
                    previewDiv.appendChild(img);
                    previewDiv.appendChild(removeButton);
                    imagePreview.appendChild(previewDiv);
                };
                
                reader.readAsDataURL(file);
            }
        }
    });
    
    // Handle form submission
    tuneinButton.addEventListener('click', function() {
        const description = descriptionField.value.trim();
        
        // Validate inputs
        if (description === '') {
            showStatusMessage('Please provide a description of your instrument.', 'error');
            return;
        }
        
        if (selectedFiles.length === 0) {
            showStatusMessage('Please select at least one reference image.', 'error');
            return;
        }
        
        // Here you would normally send the data to a server
        // For demo purposes, we'll just show a success message
        
        // Create FormData for sending
        const formData = new FormData();
        formData.append('description', description);
        
        selectedFiles.forEach((file, index) => {
            formData.append(`image-${index}`, file);
        });
        
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
        
        // In a real implementation, you would use fetch or XMLHttpRequest to send the data:
        /*
        fetch('/api/submit-workshop-request', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showStatusMessage('Your custom instrument request has been submitted successfully! Our team will contact you soon.', 'success');
                // Reset form
                descriptionField.value = '';
                selectedFiles = [];
                imagePreview.innerHTML = '';
            } else {
                showStatusMessage('Error: ' + data.message, 'error');
            }
            tuneinButton.disabled = false;
            tuneinButton.textContent = 'TuneIn';
        })
        .catch(error => {
            showStatusMessage('Error: ' + error.message, 'error');
            tuneinButton.disabled = false;
            tuneinButton.textContent = 'TuneIn';
        });
        */
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