// ==================== GENERAL INFO LOADER ====================
// Note: API_URL is defined in api.js - don't redeclare it here

(function () {
    // Use the global API_URL or fallback
    const GENERAL_INFO_API = (typeof API_URL !== 'undefined')
        ? API_URL
        : 'https://primejo-backend-demo.up.railway.app/api';

    // Cache
    let generalInfoCache = null;

    // Load general info from API
    async function loadGeneralInfo() {
        if (generalInfoCache) return generalInfoCache;

        try {
            app.get('/general-info', async (req, res) => {
                try {
                    const [rows] = await pool.query(
                        'SELECT brand_name, phone_number, email_address, minimum_order_amount FROM general_info WHERE id = 1'
                    );

                    if (rows.length === 0) {
                        return res.json({
                            success: false,
                            error: 'General info not found'
                        });
                    }

                    res.json({
                        success: true,
                        info: rows[0]
                    });
                } catch (error) {
                    console.error('Error fetching general info:', error);
                    res.status(500).json({
                        success: false,
                        error: error.message
                    });
                }
            });
            return getDefaultInfo();
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
            email_address: 'Info@primejo.store'
        };
    }

    // Update page elements
    async function updateGeneralInfo() {
        const info = await loadGeneralInfo();

        // Update email elements
        document.querySelectorAll('.contact-email, [data-contact="email"]').forEach(el => {
            el.textContent = `📧 ${info.email_address}`;
        });

        // Update phone elements
        document.querySelectorAll('.contact-phone, [data-contact="phone"]').forEach(el => {
            el.textContent = `📞 ${info.phone_number}`;
        });

        // Update brand name
        document.querySelectorAll('.brand-name, [data-contact="brand"]').forEach(el => {
            el.textContent = info.brand_name;
        });

        // Update topbar specifically
        updateTopbar(info);
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