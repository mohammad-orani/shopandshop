// ===== Hero Slider Functionality =====
// Single initialization - do NOT call initSlider from app.js

let currentSlide = 0;
let autoplayInterval;
const autoplayDelay = 5000;

function createDots() {
    const dotsContainer = document.querySelector('.slider-dots');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    const slides = document.querySelectorAll('.slide');
    slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('slider-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => { goToSlide(i); resetAutoplay(); });
        dotsContainer.appendChild(dot);
    });
}

function showSlide(n) {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    slides.forEach(s => s.classList.remove('active'));
    if (n >= slides.length) currentSlide = 0;
    else if (n < 0) currentSlide = slides.length - 1;
    else currentSlide = n;
    slides[currentSlide].classList.add('active');
    updateDots();
}

function updateDots() {
    document.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

function changeSlide(direction) { showSlide(currentSlide + direction); }
function goToSlide(n) { showSlide(n); }

function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(() => changeSlide(1), autoplayDelay);
}

function stopAutoplay() {
    if (autoplayInterval) { clearInterval(autoplayInterval); autoplayInterval = null; }
}

function resetAutoplay() { stopAutoplay(); startAutoplay(); }

function initSlider() {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;

    // Prevent double init
    if (window._sliderInitialized) return;
    window._sliderInitialized = true;

    createDots();
    showSlide(0);
    startAutoplay();

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => { changeSlide(-1); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { changeSlide(1); resetAutoplay(); });

    const sliderEl = document.querySelector('.hero-slider');
    if (sliderEl) {
        sliderEl.addEventListener('mouseenter', stopAutoplay);
        sliderEl.addEventListener('mouseleave', startAutoplay);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { changeSlide(-1); resetAutoplay(); }
        else if (e.key === 'ArrowRight') { changeSlide(1); resetAutoplay(); }
    });

    console.log('✅ Slider initialized with', slides.length, 'slides');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlider);
} else {
    initSlider();
}

window.changeSlide = changeSlide;
window.goToSlide = goToSlide;