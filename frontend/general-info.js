// ==================== GENERAL INFO LOADER ====================
// Note: API_URL is defined in api.js - don't redeclare it here

(function () {
    // Use the global API_URL or fallback
    const GENERAL_INFO_API = (typeof API_URL !== 'undefined')
        ? API_URL
        : 'https://primejo-ecommerce-backend-demo.up.railway.app/api';

    // Cache
    let generalInfoCache = null;

    // Load general info from API
    async function loadGeneralInfo() {
        if (generalInfoCache) return generalInfoCache;

        try {
            // ✅ Make sure it's using the API, not the .js file!
            const response = await fetch(`${GENERAL_INFO_API}/general-info`);
            const data = await response.json();

            if (data.success && data.info) {
                generalInfoCache = data.info;
                return data.info;
            } else {
                console.warn('General info not found, using defaults');
                return getDefaultInfo();
            }
        } catch (error) {
            console.error('Error loading general info:', error);
            return getDefaultInfo();
        }
    }

    // Default fallback
    function getDefaultInfo() {
        return {
            brand_name: 'PrimeJo',
            phone_number: '+962788888888',
            email_address: 'Info@primejo.store',
            minimum_order_amount: 15
        };
    }

    // Update page elements
    async function updateGeneralInfo() {
        const info = await loadGeneralInfo();

        // Update email elements
        document.querySelectorAll('.contact-email, [data-email]').forEach(el => {
            el.textContent = `📧 ${info.email_address}`;
        });

        // Update phone elements
        document.querySelectorAll('.contact-phone, [data-phone]').forEach(el => {
            el.textContent = `📞 ${info.phone_number}`;
        });

        // Update brand name
        document.querySelectorAll('.brand-name, [data-brand]').forEach(el => {
            el.textContent = info.brand_name;
        });

        // ✅ Update minimum order amount in banner
        const minAmount = parseFloat(info.minimum_order_amount) || 15;
        const currentLang = localStorage.getItem('selectedLanguage') || 'en';

        document.querySelectorAll('.delivery-banner-subtitle').forEach(el => {
            const template = currentLang === 'ar'
                ? el.getAttribute('data-ar-template')
                : el.getAttribute('data-en-template');

            if (template) {
                el.textContent = template.replace('{amount}', minAmount);
            }
        });


        // Update any elements still showing "Loading..."
        document.querySelectorAll('[data-email], [data-phone]').forEach(el => {
            if (el.textContent.includes('Loading')) {
                const attr = el.getAttribute('data-email') !== null ? 'email' : 'phone';
                if (attr === 'email') {
                    el.textContent = `📧 ${info.email_address}`;
                } else {
                    el.textContent = `📞 ${info.phone_number}`;
                }
            }
        });

        // Update social media links
        var socialMap = {
            instagram: info.instagram,
            facebook:  info.facebook,
            snapchat:  info.snapchat,
            tiktok:    info.tiktok,
            youtube:   info.youtube,
            whatsapp:  info.whatsapp
        };
        Object.keys(socialMap).forEach(function(platform) {
            var url = socialMap[platform];
            document.querySelectorAll('[data-social="' + platform + '"]').forEach(function(el) {
                if (url) {
                    el.href = url;
                    el.style.display = '';
                } else {
                    el.style.display = 'none';
                }
            });
        });

        // Show delivery note on checkout page
        const noteBox  = document.getElementById('delivery-note-box');
        const noteText = document.getElementById('delivery-note-text');
        if (noteBox && noteText && info.delivery_note) {
            noteText.textContent = info.delivery_note;
            noteBox.style.display = 'block';
        }

        console.log('✅ General info loaded:', info);
        console.log('✅ Minimum order amount:', minAmount);
    }

    // Update topbar info
    function updateTopbar(info) {
        const topbarEmail = document.querySelector('.topbar-email, .top-email');
        const topbarPhone = document.querySelector('.topbar-phone, .top-phone');

        if (topbarEmail) topbarEmail.textContent = `📧 ${info.email_address}`;
        if (topbarPhone) topbarPhone.textContent = `📞 ${info.phone_number}`;

        // Also update any element showing "Loading..."
        document.querySelectorAll('*').forEach(el => {
            if (el.children.length === 0) {
                if (el.textContent.includes('Loading...')) {
                    const classes = el.className;
                    if (classes.includes('email') || classes.includes('mail')) {
                        el.textContent = `📧 ${info.email_address}`;
                    } else if (classes.includes('phone') || classes.includes('tel')) {
                        el.textContent = `📞 ${info.phone_number}`;
                    }
                }
            }
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateGeneralInfo);
    } else {
        updateGeneralInfo();
    }

})(); // Self-invoking function prevents variable conflicts