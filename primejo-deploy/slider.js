// ===== Hero Slider Functionality =====

let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

// Create dots
function createDots() {
    const dotsContainer = document.querySelector('.slider-dots');
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';

    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.classList.add('slider-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
}

// Show specific slide
function showSlide(n) {
    slides.forEach(slide => slide.classList.remove('active'));

    if (n >= totalSlides) {
        currentSlide = 0;
    } else if (n < 0) {
        currentSlide = totalSlides - 1;
    } else {
        currentSlide = n;
    }

    slides[currentSlide].classList.add('active');
    updateDots();
}

// Update active dot
function updateDots() {
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Change slide
function changeSlide(direction) {
    showSlide(currentSlide + direction);
}

// Go to specific slide
function goToSlide(n) {
    showSlide(n);
}

// Auto-play slider
let autoplayInterval;

function startAutoplay() {
    autoplayInterval = setInterval(() => {
        changeSlide(1);
    }, 5000); // Change slide every 5 seconds
}

function stopAutoplay() {
    clearInterval(autoplayInterval);
}

// Initialize slider
function initSlider() {
    if (slides.length > 0) {
        createDots();
        showSlide(0);
        startAutoplay();

        // Pause autoplay on hover
        const sliderContainer = document.querySelector('.hero-slider');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', stopAutoplay);
            sliderContainer.addEventListener('mouseleave', startAutoplay);
        }
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlider);
} else {
    initSlider();
}

// Make functions globally available
window.changeSlide = changeSlide;
window.goToSlide = goToSlide;