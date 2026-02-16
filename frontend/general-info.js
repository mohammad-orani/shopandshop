// General Info Loader
const API_URL = 'http://primejo-backend-demo.up.railway.app/api';

// Cache for general info
let generalInfoCache = null;

// Load general info from API
async function loadGeneralInfo() {
    // Return cached data if available
    if (generalInfoCache) {
        return generalInfoCache;
    }
    
    try {
        const response = await fetch(`${API_URL}/general-info`);
        const data = await response.json();
        
        if (data.success) {
            generalInfoCache = data.info;
            return data.info;
        } else {
            console.error('Failed to load general info:', data.message);
            return getDefaultInfo();
        }
    } catch (error) {
        console.error('Error loading general info:', error);
        return getDefaultInfo();
    }
}

// Default fallback info
function getDefaultInfo() {
    return {
        brand_name: 'Primejo',
        phone_number: '+962 79 123 4567',
        email_address: 'support@primejo.com'
    };
}

// Update header/footer with general info
async function updateGeneralInfo() {
    const info = await loadGeneralInfo();
    
    // Update brand name
    const brandElements = document.querySelectorAll('.brand-name, .logo-text, h1.brand');
    brandElements.forEach(el => {
        el.textContent = info.brand_name;
    });
    
    // Update email
    const emailElements = document.querySelectorAll('.contact-email, a[href^="mailto:"]');
    emailElements.forEach(el => {
        if (el.tagName === 'A') {
            el.href = `mailto:${info.email_address}`;
        }
        el.textContent = `📧 ${info.email_address}`;
    });
    
    // Update phone
    const phoneElements = document.querySelectorAll('.contact-phone, a[href^="tel:"]');
    phoneElements.forEach(el => {
        if (el.tagName === 'A') {
            el.href = `tel:${info.phone_number}`;
        }
        el.textContent = `📞 ${info.phone_number}`;
    });
    
    // Update footer contact info
    const footerContact = document.querySelector('.footer-contact-info');
    if (footerContact) {
        footerContact.innerHTML = `
            <span class="contact-email">📧 ${info.email_address}</span>
            <span class="contact-phone">📞 ${info.phone_number}</span>
        `;
    }
}

// Load on page load
document.addEventListener('DOMContentLoaded', updateGeneralInfo);