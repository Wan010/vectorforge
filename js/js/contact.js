// Contact Form Handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                service: document.getElementById('service').value,
                budget: document.getElementById('budget').value,
                message: document.getElementById('message').value
            };
            
            // Validate form
            if (validateForm(formData)) {
                // Show loading state
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = 'Sending...';
                submitBtn.disabled = true;
                
                // Simulate form submission
                setTimeout(() => {
                    // Here you would typically send the data to a server
                    console.log('Form submitted:', formData);
                    
                    // Show success message
                    showFormMessage('Thank you for your message! We will get back to you within 24 hours.', 'success');
                    
                    // Reset form
                    contactForm.reset();
                    
                    // Reset button
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 2000);
            }
        });
    }
    
    function validateForm(data) {
        // Basic validation
        if (!data.name.trim()) {
            showFormMessage('Please enter your name.', 'error');
            return false;
        }
        
        if (!data.email.trim()) {
            showFormMessage('Please enter your email address.', 'error');
            return false;
        }
        
        if (!isValidEmail(data.email)) {
            showFormMessage('Please enter a valid email address.', 'error');
            return false;
        }
        
        if (!data.message.trim()) {
            showFormMessage('Please enter your project details.', 'error');
            return false;
        }
        
        return true;
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showFormMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = message;
        
        // Style the message
        messageDiv.style.cssText = `
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            background: ${type === 'success' ? '#d1fae5' : '#fee2e2'};
            color: ${type === 'success' ? '#065f46' : '#991b1b'};
            border: 1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'};
        `;
        
        // Insert message
        const form = document.getElementById('contactForm');
        form.insertBefore(messageDiv, form.firstChild);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
    
    // Add real-time validation
    const formInputs = document.querySelectorAll('#contactForm input, #contactForm textarea, #contactForm select');
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
    
    function validateField(field) {
        const value = field.value.trim();
        
        switch(field.type) {
            case 'email':
                if (value && !isValidEmail(value)) {
                    field.style.borderColor = '#ef4444';
                } else {
                    field.style.borderColor = '#10b981';
                }
                break;
            case 'text':
            case 'textarea':
                if (value) {
                    field.style.borderColor = '#10b981';
                } else {
                    field.style.borderColor = '#e5e7eb';
                }
                break;
        }
    }
});
