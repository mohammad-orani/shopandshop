// General Info Loader
const API_URL = 'https://primejo-backend-demo.up.railway.app/api';

// Load general info from API
async function loadGeneralInfo() {
    try {
        const response = await fetch(`${API_URL}/general-info`, {
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ General info loaded:', data.info);
            return data.info;
        } else {
            console.error('Failed to load general info');
            return getDefaultInfo();
        }
    } catch (error) {
        console.error('Error loading general info:', error);
        return getDefaultInfo();
    }
}



// Update page with general info
async function updateGeneralInfo() {
    const info = await loadGeneralInfo();
    
    // Update all email elements
    document.querySelectorAll('.contact-email, [data-email]').forEach(el => {
        el.textContent = `📧 ${info.email_address}`;
        if (el.tagName === 'A') {
            el.href = `mailto:${info.email_address}`;
        }
    });
    
    // Update all phone elements
    document.querySelectorAll('.contact-phone, [data-phone]').forEach(el => {
        el.textContent = `📞 ${info.phone_number}`;
        if (el.tagName === 'A') {
            el.href = `tel:${info.phone_number}`;
        }
    });
    
    // Update brand name
    document.querySelectorAll('.brand-name, [data-brand]').forEach(el => {
        el.textContent = info.brand_name;
    });
}

// Load on page ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateGeneralInfo);
} else {
    updateGeneralInfo();
}