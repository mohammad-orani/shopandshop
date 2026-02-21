// ============================================
// MODERN ANIMATIONS HELPER SCRIPT
// Add this to your page or create animations.js
// ============================================

/**
 * Initialize all modern animations and effects
 * Call this function when page loads
 */
function initModernAnimations() {
    // 1. Image lazy loading with fade-in
    initImageLoading();
    
    // 2. Scroll reveal animations
    initScrollReveal();
    
    // 3. Navbar scroll effect
    initNavbarScroll();
    
    // 4. Cart badge animation
    initCartBadgeAnimation();
    
    // 5. Smooth anchor scrolling
    initSmoothScroll();
    
    // 6. Button ripple effect
    initButtonRipple();
    
    // 7. Parallax effect (optional)
    initParallax();
}

// ============================================
// 1. IMAGE LAZY LOADING WITH FADE-IN
// ============================================
function initImageLoading() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        // Add loading class
        img.classList.add('image-loading');
        
        // When image loads
        img.addEventListener('load', function() {
            this.classList.remove('image-loading');
            this.classList.add('loaded');
        });
        
        // If image is already cached
        if (img.complete) {
            img.classList.remove('image-loading');
            img.classList.add('loaded');
        }
    });
}

// ============================================
// 2. SCROLL REVEAL ANIMATIONS
// ============================================
function initScrollReveal() {
    const reveals = document.querySelectorAll('.scroll-reveal');
    
    const revealOnScroll = () => {
        reveals.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('revealed');
            }
        });
    };
    
    // Check on load
    revealOnScroll();
    
    // Check on scroll (throttled)
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                revealOnScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
}

// ============================================
// 3. NAVBAR SCROLL EFFECT
// ============================================
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add scrolled class when scrolled down
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// ============================================
// 4. CART BADGE ANIMATION
// ============================================
function initCartBadgeAnimation() {
    // Override the updateCartCount function
    const originalUpdateCartCount = window.updateCartCount;
    
    window.updateCartCount = function() {
        // Call original function
        if (originalUpdateCartCount) {
            originalUpdateCartCount();
        }
        
        // Animate the badge
        const cartBadge = document.getElementById('cartCount');
        if (cartBadge) {
            cartBadge.classList.add('updated');
            setTimeout(() => {
                cartBadge.classList.remove('updated');
            }, 300);
        }
    };
}

// ============================================
// 5. SMOOTH ANCHOR SCROLLING
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// 6. BUTTON RIPPLE EFFECT (Enhanced)
// ============================================
function initButtonRipple() {
    const buttons = document.querySelectorAll('button, .btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            // Position ripple
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.6)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple-animation 0.6s ease-out';
            
            this.appendChild(ripple);
            
            // Remove after animation
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add ripple animation to CSS if not exists
    if (!document.querySelector('#ripple-animation-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation-style';
        style.textContent = `
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================
// 7. PARALLAX EFFECT (Optional - Subtle)
// ============================================
function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax');
    if (parallaxElements.length === 0) return;
    
    // Only on desktop
    if (window.innerWidth < 768) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.parallaxSpeed || 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// ============================================
// 8. ADD TO CART ANIMATION ENHANCEMENT
// ============================================
function animateAddToCart(button) {
    // Scale animation
    button.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        button.style.transform = 'scale(1.1)';
    }, 100);
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 200);
    
    // Success feedback
    const originalText = button.textContent;
    button.textContent = '✓ Added!';
    button.style.background = '#10b981';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 1500);
}

// ============================================
// 9. TOAST NOTIFICATION SYSTEM
// ============================================
function showToast(message, type = 'success') {
    // Create toast container if doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        font-weight: 500;
    `;
    
    const icon = type === 'success' ? '✓' : '✕';
    toast.innerHTML = `<span style="font-size: 20px;">${icon}</span> ${message}`;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// 10. LOADING SPINNER
// ============================================
function showLoadingSpinner(container) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.cssText = `
        margin: 40px auto;
        display: block;
    `;
    container.appendChild(spinner);
    return spinner;
}

function hideLoadingSpinner(spinner) {
    if (spinner && spinner.parentNode) {
        spinner.remove();
    }
}

// ============================================
// 11. SKELETON LOADING FOR PRODUCTS
// ============================================
function showProductSkeleton(container, count = 4) {
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'product-card skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton skeleton-image"></div>
            <div style="padding: 16px;">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text" style="width: 40%;"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
            </div>
        `;
        container.appendChild(skeleton);
    }
}

// ============================================
// 12. PRICE UPDATE ANIMATION
// ============================================
function animatePriceUpdate(priceElement, newPrice) {
    priceElement.classList.add('updating');
    
    setTimeout(() => {
        priceElement.textContent = newPrice;
        priceElement.classList.remove('updating');
    }, 250);
}

// ============================================
// 13. MODAL ANIMATIONS
// ============================================
function openModal(modalElement) {
    modalElement.style.display = 'block';
    modalElement.classList.add('modal');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Close on outside click
    modalElement.addEventListener('click', function(e) {
        if (e.target === modalElement) {
            closeModal(modalElement);
        }
    });
}

function closeModal(modalElement) {
    modalElement.style.opacity = '0';
    
    setTimeout(() => {
        modalElement.style.display = 'none';
        modalElement.style.opacity = '';
        document.body.style.overflow = '';
    }, 300);
}

// ============================================
// 14. INTERSECTION OBSERVER FOR LAZY LOADING
// ============================================
function initIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// INITIALIZE EVERYTHING ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initModernAnimations();
    console.log('✓ Modern animations initialized!');
});

// ============================================
// EXPORT FUNCTIONS FOR USE IN OTHER SCRIPTS
// ============================================
window.ModernAnimations = {
    showToast,
    animateAddToCart,
    showLoadingSpinner,
    hideLoadingSpinner,
    showProductSkeleton,
    animatePriceUpdate,
    openModal,
    closeModal
};
