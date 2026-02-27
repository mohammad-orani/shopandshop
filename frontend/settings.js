// ==================== GENERAL SETTINGS MANAGEMENT ====================
// Hybrid system: Uses database via general-info.js, localStorage as fallback

// ==================== GET GENERAL SETTINGS ====================

async function getGeneralSettings() {
    // Try to get from API first (via general-info.js or api.js)
    if (typeof window.loadGeneralInfo === 'function') {
        try {
            const info = await window.loadGeneralInfo();
            if (info) {
                return {
                    brandName: info.brand_name || 'PRIMEJO',
                    brandNameAr: info.brand_name_ar || 'بريميجو',
                    contactPhone: info.phone_number || '+962777777777',
                    contactEmail: info.email_address || 'Info@primejo.store',
                    copyrightYear: new Date().getFullYear().toString(),
                    location: 'Amman, Jordan',
                    locationAr: 'عمان، الأردن',
                    minimumOrderAmount: info.minimum_order_amount || 25
                };
            }
        } catch (error) {
            console.warn('API unavailable, using defaults:', error);
        }
    }

    // Fallback to localStorage
    const settingsData = localStorage.getItem('generalSettings');
    if (settingsData) {
        return JSON.parse(settingsData);
    }

    // Ultimate fallback: Default settings
    return {
        brandName: 'PRIMEJO',
        brandNameAr: 'بريميجو',
        contactPhone: '+962777777777',
        contactEmail: 'Info@primejo.store',
        copyrightYear: new Date().getFullYear().toString(),
        location: 'Amman, Jordan',
        locationAr: 'عمان، الأردن',
        minimumOrderAmount: 25
    };
}

// ==================== SAVE GENERAL SETTINGS ====================

function saveGeneralSettings(settings) {
    localStorage.setItem('generalSettings', JSON.stringify(settings));
    return true;
}

// ==================== APPLY SETTINGS TO PAGE ====================

async function applyGeneralSettings() {
    try {
        const settings = await getGeneralSettings();
        const currentLang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'en';

        // Update brand name
        const brandElements = document.querySelectorAll('.topbaic-logo, .brand-name, [data-brand]');
        brandElements.forEach(el => {
            if (el.hasAttribute('data-en')) {
                el.setAttribute('data-en', settings.brandName);
                el.setAttribute('data-ar', settings.brandNameAr || settings.brandName);
                el.textContent = currentLang === 'ar' ? (settings.brandNameAr || settings.brandName) : settings.brandName;
            } else {
                el.textContent = settings.brandName;
            }
        });

        // Update copyright year
        document.querySelectorAll('.footer-bottom p, .copyright').forEach(el => {
            if (el.textContent.includes('©') || el.textContent.includes('2026') ) {
                el.textContent = `© ${settings.copyrightYear} ${settings.brandName}. All rights reserved.`;
            }
        });

        // Update location
        document.querySelectorAll('.location').forEach(el => {
            if (el.hasAttribute('data-en')) {
                el.setAttribute('data-en', settings.location);
                el.setAttribute('data-ar', settings.locationAr);
                el.textContent = currentLang === 'ar' ? settings.locationAr : settings.location;
            } else {
                el.textContent = settings.location;
            }
        });

        console.log('✅ General settings applied');

    } catch (error) {
        console.error('Error applying general settings:', error);
    }
}

// ==================== AUTO-APPLY ON PAGE LOAD ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGeneralSettings);
} else {
    applyGeneralSettings();
}

// ==================== EXPORT FUNCTIONS ====================

if (typeof window !== 'undefined') {
    window.getGeneralSettings = getGeneralSettings;
    window.saveGeneralSettings = saveGeneralSettings;
    window.applyGeneralSettings = applyGeneralSettings;
}

console.log('✅ settings.js loaded - Using database via general-info.js');