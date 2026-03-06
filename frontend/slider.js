// ===== Hero Slider - Loads from API =====

let currentSlide = 0;
let autoplayInterval;
const autoplayDelay = 7000;

async function loadBanners() {
    try {
        const API_URL = window.API_URL || 'https://primejo-ecommerce-backend-demo.up.railway.app/api';
        const res = await fetch(`${API_URL}/banners`);
        const data = await res.json();
        const banners = data.banners || [];

        const container = document.querySelector('.slider-container');
        if (!container || !banners.length) return;

        container.innerHTML = banners.map((b, i) => {
            const bg = b.image_url
                ? `background: url('${b.image_url}') center/cover no-repeat;`
                : `background: ${b.bg_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};`;

            const lang = document.documentElement.lang || 'en';
            const title = (lang === 'ar' && b.title_ar) ? b.title_ar : (b.title_en || b.title || '');
            const subtitle = (lang === 'ar' && b.subtitle_ar) ? b.subtitle_ar : (b.subtitle_en || b.subtitle || '');
            const btnText = (lang === 'ar' && b.btn_text_ar) ? b.btn_text_ar : (b.btn_text_en || b.btn_text || 'SHOP NOW');
            const btnLink = b.btn_link || '#';
            const imageLink = b.image_link || btnLink;

            // If banner has a destination link, make the whole slide clickable
            const slideInner = `
                <div class="slide-content">
                    ${title ? `<h1>${title}</h1>` : ''}
                    ${subtitle ? `<p>${subtitle}</p>` : ''}
                   
                </div>`;

            if (imageLink && imageLink !== '#') {
                return `<div class="slide ${i === 0 ? 'active' : ''}" style="${bg}">
                    <a href="${imageLink}" class="slide-link" style="position:absolute;inset:0;z-index:1;" aria-label="${title}"></a>
                    ${slideInner}
                </div>`;
            }

            return `<div class="slide ${i === 0 ? 'active' : ''}" style="${bg}">
                ${slideInner}
            </div>`;
        }).join('');

        window._sliderInitialized = false;
        initSlider();
    } catch (err) {
        console.warn('Banners load failed, using static slides', err);
        initSlider();
    }
}

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
    document.addEventListener('DOMContentLoaded', loadBanners);
} else {
    loadBanners();
}

window.changeSlide = changeSlide;
window.goToSlide = goToSlide;