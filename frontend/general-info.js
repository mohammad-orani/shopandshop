// ==================== GENERAL INFO LOADER ====================
// Note: API_URL is defined in api.js - don't redeclare it here

(function () {
    // Use the global API_URL set in config.js
    const GENERAL_INFO_API = window.API_URL || 'https://primejo-ecommerce-backend-demo.up.railway.app/api';

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

        // Inject floating WhatsApp chat button
        injectWhatsAppButton(info);
    }

    function injectWhatsAppButton(info) {
        if (document.getElementById('wa-float-wrapper')) return;

        let waLink = info.whatsapp || '';
        if (waLink && !waLink.startsWith('http')) {
            // Field contains a raw number, not a full URL — build wa.me link
            const digits = waLink.replace(/\D/g, '');
            waLink = `https://wa.me/${digits}`;
        } else if (!waLink && info.phone_number) {
            const digits = info.phone_number.replace(/\D/g, '');
            waLink = `https://wa.me/${digits}`;
        }
        if (!waLink) return;

        // Inject pulse animation once
        if (!document.getElementById('wa-label-style')) {
            const s = document.createElement('style');
            s.id = 'wa-label-style';
            s.textContent = `
                @keyframes wa-label-pulse {
                    0%,100% { opacity:1; transform:translateY(0); }
                    50%      { opacity:0.85; transform:translateY(-2px); }
                }
            `;
            document.head.appendChild(s);
        }

        // Label bubble — independently fixed, right-aligned next to the button
        // button is 56px wide + 1.5rem from right, so label sits at right: calc(1.5rem + 56px + 10px)
        const label = document.createElement('div');
        label.id = 'wa-float-label';
        label.textContent = 'بانتظار رسالتك للطلب';
        label.style.cssText = [
            'position:fixed',
            'bottom:calc(1.5rem + 8px)',   /* vertically centered with 56px button */
            'right:calc(1.5rem + 56px + 10px)',
            'z-index:9999',
            'background:#fff', 'color:#111',
            'font-size:0.82rem', 'font-weight:700',
            'padding:8px 14px', 'border-radius:20px',
            'box-shadow:0 2px 12px rgba(0,0,0,0.15)',
            'white-space:nowrap', 'direction:rtl',
            'font-family:inherit',
            'animation:wa-label-pulse 2.5s ease-in-out infinite',
            'pointer-events:none'
        ].join(';');

        // WhatsApp icon button — fixed independently
        const btn = document.createElement('a');
        btn.id        = 'wa-float-btn';
        btn.href      = waLink;
        btn.target    = '_blank';
        btn.rel       = 'noopener noreferrer';
        btn.setAttribute('aria-label', 'Chat on WhatsApp');
        btn.style.cssText = [
            'position:fixed', 'bottom:1.5rem', 'right:1.5rem', 'z-index:9999',
            'width:56px', 'height:56px', 'background:#25d366', 'border-radius:50%',
            'display:flex', 'align-items:center', 'justify-content:center',
            'box-shadow:0 4px 16px rgba(37,211,102,0.45)',
            'transition:transform 0.2s ease,box-shadow 0.2s ease',
            'text-decoration:none', 'cursor:pointer'
        ].join(';');
        btn.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;
        btn.addEventListener('mouseover', function () {
            this.style.transform = 'scale(1.1)';
            this.style.boxShadow = '0 6px 22px rgba(37,211,102,0.6)';
        });
        btn.addEventListener('mouseout', function () {
            this.style.transform = '';
            this.style.boxShadow = '0 4px 16px rgba(37,211,102,0.45)';
        });

        // Keep wrapper div for the guard check only
        const wrapper = document.createElement('div');
        wrapper.id = 'wa-float-wrapper';
        wrapper.style.cssText = 'display:none';
        document.body.appendChild(wrapper);
        document.body.appendChild(label);
        document.body.appendChild(btn);
    }

    // Update topbar info
    function updateTopbar(info) {
        const topbarEmail = document.querySelector('.topbar-email, .top-email');
        const topbarPhone = document.querySelector('.topbar-phone, .top-phone');

        if (topbarEmail) topbarEmail.textContent = `📧 ${info.email_address}`;
        if (topbarPhone) topbarPhone.textContent = `📞 ${info.phone_number}`;

        // Update any loading placeholders using targeted class selectors
        document.querySelectorAll('.email, .mail, [class*="email"], [class*="mail"]').forEach(el => {
            if (el.children.length === 0 && el.textContent.includes('Loading...')) {
                el.textContent = `📧 ${info.email_address}`;
            }
        });
        document.querySelectorAll('.phone, .tel, [class*="phone"], [class*="tel"]').forEach(el => {
            if (el.children.length === 0 && el.textContent.includes('Loading...')) {
                el.textContent = `📞 ${info.phone_number}`;
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