/* ========================================
   TV MODE MODULE
   ======================================== */

const TVMode = {
    slideIndex: 0,
    timer: null,
    clockTimer: null,
    SLIDE_INTERVAL: 12000, // 12 seconds

    start() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.remove('active');
        document.getElementById('tv-mode-screen').classList.add('active');

        this.buildSlides();
        this.startClock();
        this.startRotation();
    },

    exit() {
        clearInterval(this.timer);
        clearInterval(this.clockTimer);
        document.getElementById('tv-mode-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
    },

    buildSlides() {
        const pops = DB.getPOPs();
        const container = document.getElementById('tv-content');
        const progress = document.getElementById('tv-progress');

        container.innerHTML = pops.map((pop, i) => {
            const sector = DB.getSector(pop.sector);
            return `
                <div class="tv-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
                    <div class="tv-slide-header">
                        <div class="tv-slide-icon" style="background:${sector.color}25; color:${sector.color}">
                            ${sector.icon}
                        </div>
                        <div>
                            <div class="tv-slide-sector">${sector.name}</div>
                            <div class="tv-slide-title">${pop.title}</div>
                        </div>
                    </div>
                    <div class="tv-steps">
                        ${pop.steps.slice(0, 6).map((step, si) => `
                            <div class="tv-step">
                                <div class="tv-step-num">${si + 1}</div>
                                <div class="tv-step-text">${step}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        progress.innerHTML = pops.map((_, i) => `
            <div class="tv-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
        `).join('');
    },

    startRotation() {
        this.timer = setInterval(() => {
            this.nextSlide();
        }, this.SLIDE_INTERVAL);
    },

    nextSlide() {
        const slides = document.querySelectorAll('.tv-slide');
        const dots = document.querySelectorAll('.tv-dot');
        if (slides.length === 0) return;

        slides[this.slideIndex].classList.remove('active');
        dots[this.slideIndex].classList.remove('active');

        this.slideIndex = (this.slideIndex + 1) % slides.length;

        slides[this.slideIndex].classList.add('active');
        dots[this.slideIndex].classList.add('active');
    },

    startClock() {
        const updateClock = () => {
            const now = new Date();
            document.getElementById('tv-clock').textContent =
                now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        };
        updateClock();
        this.clockTimer = setInterval(updateClock, 1000);
    }
};
