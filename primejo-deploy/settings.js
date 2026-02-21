/**
 * General Settings Management
 * Brand name, contact info, copyright, etc.
 */

// Get general settings from localStorage
function getGeneralSettings() {
    const settingsData = localStorage.getItem('generalSettings');
    if (settingsData) {
        return JSON.parse(settingsData);
    }
    
    // Default settings
    const defaultSettings = {
        brandName: 'PRIMEJO',
        brandNameAr: 'بريميجو',
        contactPhone: '+962 79 123 4567',
        contactEmail: 'support@primejo.com',
        copyrightYear: '2024',
        location: 'Amman, Jordan',
        locationAr: 'عمان، الأردن',
        tagline: 'Premium Automotive Accessories',
        taglineAr: 'إكسسوارات سيارات مميزة',
        description: 'Your trusted partner for premium automotive accessories. We deliver quality, style, and performance.',
        descriptionAr: 'شريكك الموثوق للإكسسوارات السيارات المميزة. نقدم الجودة والأناقة والأداء.'
    };
    
    localStorage.setItem('generalSettings', JSON.stringify(defaultSettings));
    return defaultSettings;
}

// Save general settings
function saveGeneralSettings(settings) {
    localStorage.setItem('generalSettings', JSON.stringify(settings));
    return true;
}

// Apply settings to page - RUNS ON EVERY PAGE
function applyGeneralSettings() {
    const settings = getGeneralSettings();
    
    // Update brand name
    const brandElements = document.querySelectorAll('.topbaic-logo, .brand-name');
    brandElements.forEach(el => {
        if (el.hasAttribute('data-en')) {
            el.setAttribute('data-en', settings.brandName);
            el.setAttribute('data-ar', settings.brandNameAr);
            if (currentLanguage === 'ar') {
                el.textContent = settings.brandNameAr;
            } else {
                el.textContent = settings.brandName;
            }
        } else {
            el.textContent = settings.brandName;
        }
    });
    
    // Update contact email
    document.querySelectorAll('[href^="mailto:"]').forEach(el => {
        if (el.textContent.includes('@')) {
            el.href = `mailto:${settings.contactEmail}`;
            el.textContent = settings.contactEmail;
        }
    });
    
    // Update phone numbers
    document.querySelectorAll('a[href^="tel:"], span').forEach(el => {
        if (el.textContent.includes('+962') || el.textContent.includes('📞')) {
            const text = el.textContent.replace(/\+\d+\s*\d+\s*\d+\s*\d+/, settings.contactPhone);
            el.textContent = text;
            if (el.tagName === 'A') {
                el.href = `tel:${settings.contactPhone.replace(/\s/g, '')}`;
            }
        }
    });
    
    // Update copyright year
    document.querySelectorAll('.footer-bottom p, .copyright').forEach(el => {
        el.textContent = el.textContent.replace(/\d{4}/, settings.copyrightYear);
    });
    
    // Update location
    document.querySelectorAll('.location, [data-en*="Amman"]').forEach(el => {
        if (el.hasAttribute('data-en')) {
            el.setAttribute('data-en', settings.location);
            el.setAttribute('data-ar', settings.locationAr);
            if (currentLanguage === 'ar') {
                el.textContent = settings.locationAr;
            } else {
                el.textContent = settings.location;
            }
        }
    });
}

// Auto-apply settings when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGeneralSettings);
} else {
    applyGeneralSettings();
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.getGeneralSettings = getGeneralSettings;
    window.saveGeneralSettings = saveGeneralSettings;
    window.applyGeneralSettings = applyGeneralSettings;
}
