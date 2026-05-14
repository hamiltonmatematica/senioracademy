/* ========================================
   POPs MODULE — Rendering
   ======================================== */

const POPs = {
    currentSector: null,
    currentPOP: null,

    renderSectors() {
        const sectors = Auth.getUserSectors();
        return `
            <div class="page-header">
                <div>
                    <h2>📋 Setores & POPs</h2>
                    <p>Procedimentos Operacionais Padrão por setor</p>
                </div>
            </div>
            <div class="sector-grid">
                ${sectors.map(s => {
                    const pops = DB.getPOPs().filter(p => p.sector === s.id);
                    return `
                        <div class="sector-card" style="--sector-color: ${s.color}" onclick="POPs.showSector('${s.id}')">
                            <div class="sector-icon" style="background:${s.color}15; color:${s.color}">
                                ${s.icon}
                            </div>
                            <h4>${s.name}</h4>
                            <p>${pops.length} POP${pops.length !== 1 ? 's' : ''}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    showSector(sectorId) {
        this.currentSector = sectorId;
        App.renderContent(this.renderSectorPOPs(sectorId));
    },

    renderSectorPOPs(sectorId) {
        const sector = DB.getSector(sectorId);
        const pops = DB.getPOPs().filter(p => p.sector === sectorId);
        const progress = DB.getUserProgress(Auth.currentUser.id);

        return `
            <div class="page-header">
                <div>
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
                        <button class="btn btn-ghost btn-sm" onclick="App.navigate('setores')">
                            <span class="material-icons-round">arrow_back</span>
                        </button>
                        <h2>${sector.icon} ${sector.name}</h2>
                    </div>
                    <p>${pops.length} procedimentos neste setor</p>
                </div>
            </div>
            <div class="pop-grid">
                ${pops.map(pop => {
                    const isRead = progress.popsRead.includes(pop.id);
                    return `
                        <div class="pop-card card-clickable" onclick="POPs.showPOP('${pop.id}')">
                            <div class="pop-card-header">
                                <div class="pop-card-icon" style="background:${sector.color}15; color:${sector.color}">
                                    <span class="material-icons-round">description</span>
                                </div>
                                <div>
                                    <h4>${pop.title}</h4>
                                    <p>${pop.steps.length} etapas • ${pop.duration}</p>
                                </div>
                            </div>
                            <div class="pop-card-body">
                                <p class="pop-steps">${pop.description.substring(0, 100)}...</p>
                            </div>
                            <div class="pop-card-footer">
                                <span>${pop.checklist.length} itens no checklist</span>
                                <span class="badge ${isRead ? 'badge-success' : 'badge-warning'}">
                                    ${isRead ? '✓ Lido' : 'Pendente'}
                                </span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    showPOP(popId) {
        this.currentPOP = popId;
        const pop = DB.getPOP(popId);
        const sector = DB.getSector(pop.sector);
        const progress = DB.getUserProgress(Auth.currentUser.id);
        const isRead = progress.popsRead.includes(pop.id);

        App.renderContent(`
            <div class="pop-detail">
                <div class="pop-detail-header">
                    <button class="back-btn" onclick="POPs.showSector('${pop.sector}')">
                        <span class="material-icons-round">arrow_back</span>
                    </button>
                    <div>
                        <h2>${pop.title}</h2>
                    </div>
                </div>

                <div class="pop-meta">
                    <span><span class="material-icons-round" style="font-size:16px;color:${sector.color}">label</span> ${sector.name}</span>
                    <span><span class="material-icons-round" style="font-size:16px">timer</span> ${pop.duration}</span>
                    <span><span class="material-icons-round" style="font-size:16px">checklist</span> ${pop.steps.length} etapas</span>
                    <span class="badge ${isRead ? 'badge-success' : 'badge-warning'}">${isRead ? '✓ Concluído' : 'Pendente'}</span>
                </div>

                <div class="card" style="margin-bottom:var(--space-6)">
                    <div class="card-body">
                        <p style="font-size:0.95rem;line-height:1.7;color:var(--text-secondary)">${pop.description}</p>
                    </div>
                </div>

                ${pop.risks && pop.risks.length > 0 ? `
                    <div class="card" style="margin-bottom:var(--space-6);border-color:var(--danger);border-left:4px solid var(--danger)">
                        <div class="card-body">
                            <h3 style="color:var(--danger);margin-bottom:var(--space-3)">
                                <span class="material-icons-round" style="font-size:20px">warning</span> Riscos
                            </h3>
                            <ul style="list-style:disc;padding-left:20px">
                                ${pop.risks.map(r => `<li style="font-size:0.875rem;margin-bottom:4px;color:var(--text-secondary)">${r}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                ` : ''}

                ${(pop.attachments && pop.attachments.length) ? `
                    <div class="pop-section">
                        <h3><span class="material-icons-round">attach_file</span> Anexos</h3>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:var(--space-3)">
                            ${pop.attachments.map(a => {
                                const isImg = a.type?.startsWith('image');
                                const isVid = a.type?.startsWith('video');
                                return `
                                    <a href="${a.data}" target="_blank" download="${a.name}" style="display:flex;flex-direction:column;align-items:center;padding:var(--space-3);background:var(--bg);border-radius:var(--radius);text-decoration:none;color:inherit;border:1px solid var(--border-light);transition:var(--transition)">
                                        ${isImg ? `<img src="${a.data}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px">` :
                                          isVid ? `<span class="material-icons-round" style="font-size:48px;color:var(--primary)">movie</span>` :
                                          `<span class="material-icons-round" style="font-size:48px;color:var(--danger)">picture_as_pdf</span>`}
                                        <span style="font-size:0.75rem;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;margin-top:6px">${a.name}</span>
                                    </a>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                ${pop.videoUrl ? `
                    <div class="pop-section">
                        <h3><span class="material-icons-round">play_circle</span> Vídeo</h3>
                        <a href="${pop.videoUrl}" target="_blank" class="btn btn-outline-dark"><span class="material-icons-round">open_in_new</span> Abrir vídeo</a>
                    </div>
                ` : ''}

                <div class="pop-section">
                    <h3><span class="material-icons-round">format_list_numbered</span> Passo a Passo</h3>
                    ${pop.steps.map((step, i) => `
                        <div class="pop-step">
                            <div class="pop-step-num">${i + 1}</div>
                            <div class="pop-step-text">${step}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="pop-section">
                    <h3><span class="material-icons-round">check_box</span> Checklist</h3>
                    <div class="card">
                        <div class="card-body">
                            <ul class="checklist">
                                ${pop.checklist.map(item => `
                                    <li>
                                        <span class="material-icons-round">check_box_outline_blank</span>
                                        ${item}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>

                ${!isRead ? `
                    <div style="text-align:center;margin-top:var(--space-8)">
                        <button class="btn btn-primary btn-lg" onclick="POPs.markAsRead('${pop.id}')">
                            <span class="material-icons-round">check_circle</span>
                            Marcar como Lido
                        </button>
                    </div>
                ` : ''}
            </div>
        `);
    },

    markAsRead(popId) {
        DB.markPOPRead(Auth.currentUser.id, popId);
        App.toast('POP marcado como lido!', 'success');
        this.showPOP(popId);
    }
};
