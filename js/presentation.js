/* ========================================
   PRESENTATION — Full-screen POP stepper
   ======================================== */

const Presentation = {
    currentPOP: null,
    currentStep: 0,

    start(popId) {
        this.currentPOP = DB.getPOP(popId);
        if (!this.currentPOP) return;
        this.currentStep = 0;
        this._mount();
        document.addEventListener('keydown', this._keyHandler);
    },

    exit() {
        document.removeEventListener('keydown', this._keyHandler);
        document.getElementById('presentation-overlay')?.remove();
    },

    _keyHandler: (e) => {
        if (e.key === 'Escape') Presentation.exit();
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); Presentation.next(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); Presentation.prev(); }
    },

    next() {
        const total = this.currentPOP.steps.length + 1;
        if (this.currentStep < total - 1) {
            this.currentStep++;
            this._render();
        }
    },

    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this._render();
        }
    },

    goto(i) {
        this.currentStep = i;
        this._render();
    },

    _mount() {
        const overlay = document.createElement('div');
        overlay.id = 'presentation-overlay';
        overlay.className = 'presentation-overlay';
        document.body.appendChild(overlay);
        this._render();
    },

    _render() {
        const overlay = document.getElementById('presentation-overlay');
        if (!overlay) return;
        const p = this.currentPOP;
        const sector = DB.getSector(p.sector) || DB.getSectorsAll().find(s => s.id === p.sector) || { name: p.sector, color: '#2563eb' };
        const total = p.steps.length;
        const isCover = this.currentStep === 0;
        const isChecklist = this.currentStep === total + 1;
        const stepIdx = this.currentStep - 1;
        const pct = Math.round((this.currentStep / (total + 1)) * 100);

        overlay.innerHTML = `
            <div class="present-bar">
                <div class="present-bar-fill" style="width:${pct}%;background:${sector.color}"></div>
            </div>
            <button class="present-close" onclick="Presentation.exit()">
                <span class="material-icons-round">close</span>
            </button>
            <div class="present-header">
                <span class="present-sector" style="background:${sector.color}20;color:${sector.color}">${sector.icon||''} ${sector.name}</span>
                <span class="present-counter">${this.currentStep === 0 ? 'Início' : (isChecklist ? 'Checklist Final' : `Etapa ${stepIdx+1} de ${total}`)}</span>
            </div>

            <div class="present-content">
                ${isCover ? this._renderCover(p, sector) : (isChecklist ? this._renderChecklist(p) : this._renderStep(p, stepIdx))}
            </div>

            <div class="present-footer">
                <button class="present-btn ghost" onclick="Presentation.prev()" ${this.currentStep===0?'disabled':''}>
                    <span class="material-icons-round">arrow_back</span> Voltar
                </button>
                <div class="present-dots">
                    ${Array.from({length: total + 2}).map((_,i) => `<span class="present-dot ${i===this.currentStep?'active':''}" onclick="Presentation.goto(${i})"></span>`).join('')}
                </div>
                <button class="present-btn primary" onclick="Presentation.next()" ${this.currentStep>=total+1?'style=\"visibility:hidden\"':''}>
                    Próximo <span class="material-icons-round">arrow_forward</span>
                </button>
            </div>

            <div class="present-shortcuts">
                <kbd>←</kbd><kbd>→</kbd> navegar · <kbd>ESC</kbd> sair
            </div>
        `;
    },

    _renderCover(p, sector) {
        return `
            <div class="present-cover">
                <div class="present-cover-icon" style="background:${sector.color}15;color:${sector.color}">
                    <span class="material-icons-round" style="font-size:96px">description</span>
                </div>
                <h1>${p.title}</h1>
                <p class="present-desc">${p.description}</p>
                <div class="present-meta-row">
                    <div class="present-meta-item"><span class="material-icons-round">format_list_numbered</span> ${p.steps.length} etapas</div>
                    <div class="present-meta-item"><span class="material-icons-round">timer</span> ${p.duration||'—'}</div>
                    <div class="present-meta-item"><span class="material-icons-round">checklist</span> ${p.checklist?.length||0} checklist</div>
                </div>
                ${p.risks?.length ? `
                    <div class="present-risks">
                        <strong><span class="material-icons-round">warning</span> Riscos:</strong>
                        <ul>${p.risks.map(r => `<li>${r}</li>`).join('')}</ul>
                    </div>
                ` : ''}
            </div>
        `;
    },

    _renderStep(p, idx) {
        return `
            <div class="present-step">
                <div class="present-step-num">${idx + 1}</div>
                <div class="present-step-text">${p.steps[idx]}</div>
                ${idx < p.steps.length - 1 ? '<div class="present-step-next">Próximo: ' + p.steps[idx+1].substring(0,80) + '…</div>' : ''}
            </div>
        `;
    },

    _renderChecklist(p) {
        const userId = Auth.currentUser?.id;
        const isRead = userId ? DB.getUserProgress(userId).popsRead.includes(p.id) : false;
        return `
            <div class="present-checklist">
                <h2>✅ Checklist Final</h2>
                <p style="color:var(--text-secondary);font-size:1rem;margin-bottom:var(--space-6)">Antes de concluir, confirme:</p>
                <ul>
                    ${p.checklist.map((item, i) => `
                        <li><label><input type="checkbox" id="pres-chk-${i}"> <span>${item}</span></label></li>
                    `).join('')}
                </ul>
                ${!isRead && userId ? `
                    <button class="present-btn primary big" onclick="Presentation.finish()">
                        <span class="material-icons-round">check_circle</span> Marcar POP como concluído
                    </button>
                ` : `
                    <p style="color:var(--success);font-size:1rem;margin-top:var(--space-6)"><span class="material-icons-round" style="vertical-align:middle">verified</span> POP já registrado como lido</p>
                `}
            </div>
        `;
    },

    finish() {
        DB.markPOPRead(Auth.currentUser.id, this.currentPOP.id);
        App.toast('POP concluído! Pontos creditados ⭐', 'success');
        this.exit();
        // Refresh current view
        App.navigate(App.currentPage);
    }
};
