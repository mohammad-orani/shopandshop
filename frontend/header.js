/**
 * ============================================================
 *  PRIMEJO - SHARED HEADER COMPONENT
 *  File: header.js
 *
 *  HOW TO USE ON EVERY PAGE:
 *  1. Delete entire <header>...</header> from your HTML
 *  2. Add <div id="site-header"></div> where header was
 *  3. Add <script src="header.js"></script> as FIRST script
 *
 *  TO UPDATE HEADER SITEWIDE:
 *  → Edit ONLY this file → changes apply to ALL pages
 * ============================================================
 */

(function () {

    const headerHTML = `
    <header class="topbaic-header">
        <!-- Top Bar -->
        <div class="header-top">
            <div class="header-top-content">
                <div class="contact-info">
                    <span class="contact-email" data-email>📧 Loading...</span>
                    <span class="contact-phone" data-phone>📞 Loading...</span>
                </div>
                <div>
                    <!-- <a href="#" data-en="Track Order" data-ar="تتبع الطلب">Track Order</a>
                    <a href="#" data-en="Help" data-ar="مساعدة">Help</a> -->
                    <!-- Language & Currency Controls -->
                    <div class="lang-toggle" style="display: inline-block;">
                        <button onclick="switchLanguage('en')" class="lang-btn active" id="lang-en"
                            style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 4px 12px; cursor: pointer; margin: 0 4px;">EN</button>
                        <button onclick="switchLanguage('ar')" class="lang-btn" id="lang-ar"
                            style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 4px 12px; cursor: pointer;">ع</button>
                    </div>
                    <select id="currencySelector" onchange="changeCurrency(this.value)">
                        <option value="USD" data-en="$ USD" data-ar="دولار $">$ USD</option>
                        <option value="JOD" data-en="JOD دينار" data-ar="دينار JOD">JOD دينار</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Main Header -->
        <div class="header-main">
            <a href="index.html" class="topbaic-logo">PRIMEJO</a>

            <nav class="topbaic-nav">
                <a href="index.html" data-en="Home" data-ar="الرئيسية">Home</a>

                <!-- Categories Dropdown -->
                <div class="nav-item">
                    <!-- <a href="category.html"> -->
                    <span data-en="Categories" data-ar="الفئات">Categories</span>
                    <span class="dropdown-arrow">▼</span>
                    <!-- </a> -->
                    <div class="categories-dropdown" id="categoriesDropdown">
                        <!-- Categories loaded dynamically from database -->
                    </div>
                </div>

                <a href="about.html" data-en="About" data-ar="من نحن">About</a>
                <a href="contact.html" data-en="Contact" data-ar="اتصل بنا">Contact</a>
            </nav>

            <div class="header-icons">
                <!-- <button class="icon-btn" onclick="window.location.href='#'" title="Search">
                    🔍
                </button> -->
                <button class="icon-btn" onclick="window.location.href='favorites.html'" title="Favorites">
                    ❤️
                </button>
                <button class="icon-btn" onclick="window.location.href='cart.html'" title="Cart">
                    🛒
                    <span class="icon-badge" id="cartCount">0</span>
                </button>
            </div>
        </div>
    </header>`;

    // Inject header
    const placeholder = document.getElementById('site-header');
    if (placeholder) {
        placeholder.outerHTML = headerHTML;
    } else {
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }

    // Attach currency listener after DOM ready
    document.addEventListener('DOMContentLoaded', function () {
        const sel = document.getElementById('currencySelector');
        if (!sel) return;
        const saved = localStorage.getItem('preferredCurrency') || 'USD';
        sel.value = saved;
        sel.addEventListener('change', function () {
            if (typeof changeCurrency === 'function') changeCurrency(this.value);
        });
    });

    console.log('✅ Header loaded');
})();