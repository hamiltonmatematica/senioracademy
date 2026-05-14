/* ========================================
   QUICK ACCESS — Search, Favorites, Recents, Emergency
   ======================================== */

const QuickAccess = {

    // ===== GLOBAL SEARCH ⌘K =====
    openSearch() {
        if (document.getElementById('qa-search-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'qa-search-overlay';
        overlay.className = 'qa-search-overlay';
        overlay.innerHTML = `
            <div class="qa-search-modal" onclick="event.stopPropagation()">
                <div class="qa-search-header">
                    <span class="material-icons-round">search</span>
                    <input type="text" id="qa-search-input" placeholder="Buscar POPs, testes, setores, funcionários..." autocomplete="off">
                    <kbd>ESC</kbd>
                </div>
                <div class="qa-search-results" id="qa-search-results"></div>
                <div class="qa-search-footer">
                    <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
                    <span><kbd>↵</kbd> abrir</span>
                    <span><kbd>⌘K</kbd> abrir busca</span>
                </div>
            </div>
        `;
        overlay.addEventListener('click', () => this.closeSearch());
        document.body.appendChild(overlay);
        const input = document.getElementById('qa-search-input');
        input.addEventListener('input', () => this.runSearch(input.value));
        input.addEventListener('keydown', (e) => this._navKeys(e));
        this.runSearch('');
        setTimeout(() => input.focus(), 50);
    },

    closeSearch() {
        const o = document.getElementById('qa-search-overlay');
        if (o) o.remove();
    },

    runSearch(query) {
        const q = (query || '').toLowerCase().trim();
        const pops = DB.getPOPs();
        const tests = DB.getTests();
        const sectors = DB.getSectorsAll();
        const users = DB.getUsers();

        const filter = (txt) => !q || (txt || '').toLowerCase().includes(q);
        const perms = Auth.getPermissions();

        const results = [];

        pops.filter(p => filter(p.title) || filter(p.description) || (p.steps||[]).some(filter))
            .slice(0, 8).forEach(p => {
                const s = DB.getSector(p.sector) || sectors.find(x => x.id === p.sector) || { name: p.sector, color: '#64748b', icon: '📄' };
                results.push({
                    icon: 'description',
                    title: p.title,
                    sub: `POP · ${s.name} · ${p.steps?.length||0} etapas`,
                    color: s.color,
                    action: () => POPs.showPOP(p.id)
                });
            });

        if (perms.tests) {
            tests.filter(t => filter(t.title)).slice(0, 5).forEach(t => {
                results.push({
                    icon: 'quiz',
                    title: t.title,
                    sub: `Teste · ${t.questions?.length||0} questões`,
                    color: 'var(--info)',
                    action: () => Tests.startTest(t.id)
                });
            });
        }

        sectors.filter(s => filter(s.name)).slice(0, 5).forEach(s => {
            results.push({
                icon: 'category',
                title: s.name,
                sub: `Setor · ${pops.filter(p=>p.sector===s.id).length} POPs`,
                color: s.color,
                action: () => POPs.showSector(s.id)
            });
        });

        if (perms.users) {
            users.filter(u => filter(u.name) || filter(u.email)).slice(0, 5).forEach(u => {
                results.push({
                    icon: 'person',
                    title: u.name,
                    sub: `Funcionário · ${DB.getRole(u.role)?.name || u.role}`,
                    color: 'var(--primary)',
                    action: () => { App.navigate('usuarios'); setTimeout(() => App.showUserHistory(u.id), 100); }
                });
            });
        }

        // Quick commands
        const commands = [
            { match: /tema|dark|escuro|claro/i, title: 'Alternar tema claro/escuro', icon: 'contrast', action: () => App.toggleTheme() },
            { match: /tv|televis/i, title: 'Iniciar Modo TV', icon: 'tv', action: () => App.navigate('tv') },
            { match: /export|backup/i, title: 'Exportar backup completo', icon: 'cloud_download', action: () => { App.navigate('admin'); setTimeout(()=>{Admin.activeTab='data'; Admin.switchTab('data');},150); } },
            { match: /plantao|plantão|urgenc|emerg/i, title: 'Modo Plantão (emergências)', icon: 'medical_services', action: () => App.navigate('plantao') },
            { match: /chat|ia|ajuda/i, title: 'Abrir Chat IA', icon: 'smart_toy', action: () => App.navigate('chat') }
        ];
        commands.forEach(c => {
            if (q && c.match.test(q)) results.unshift({ icon: c.icon, title: c.title, sub: 'Atalho', color: 'var(--primary)', action: c.action });
        });

        this._currentResults = results;
        this._selectedIndex = 0;
        this._renderResults();
    },

    _renderResults() {
        const cont = document.getElementById('qa-search-results');
        if (!this._currentResults.length) {
            cont.innerHTML = `
                <div class="qa-search-empty">
                    <span class="material-icons-round">search_off</span>
                    <p>Nenhum resultado</p>
                    <small>Tente outro termo ou comando: "plantão", "tema", "backup"</small>
                </div>
            `;
            return;
        }
        cont.innerHTML = this._currentResults.map((r, i) => `
            <button class="qa-result ${i===this._selectedIndex?'selected':''}" data-idx="${i}" onclick="QuickAccess._pick(${i})">
                <span class="qa-result-icon" style="background:${r.color}20;color:${r.color}"><span class="material-icons-round">${r.icon}</span></span>
                <div class="qa-result-info">
                    <div class="qa-result-title">${r.title}</div>
                    <div class="qa-result-sub">${r.sub}</div>
                </div>
                <span class="material-icons-round qa-result-arrow">arrow_forward</span>
            </button>
        `).join('');
    },

    _navKeys(e) {
        if (e.key === 'Escape') { this.closeSearch(); return; }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this._selectedIndex = Math.min(this._currentResults.length - 1, this._selectedIndex + 1);
            this._renderResults();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this._selectedIndex = Math.max(0, this._selectedIndex - 1);
            this._renderResults();
        }
        if (e.key === 'Enter' && this._currentResults[this._selectedIndex]) {
            e.preventDefault();
            this._pick(this._selectedIndex);
        }
    },

    _pick(i) {
        const r = this._currentResults[i];
        this.closeSearch();
        if (r && r.action) r.action();
    },

    // ===== FAVORITES & RECENTS RENDERS =====
    renderFavoritesWidget(userId) {
        const favIds = DB.getFavorites(userId);
        if (!favIds.length) return '';
        const pops = favIds.map(id => DB.getPOP(id)).filter(Boolean).slice(0, 6);
        return `
            <div class="card">
                <div class="card-header"><h3><span class="material-icons-round" style="font-size:18px;color:#f59e0b">star</span> Favoritos</h3></div>
                <div class="card-body" style="display:flex;flex-direction:column;gap:6px">
                    ${pops.map(p => {
                        const s = DB.getSector(p.sector) || { color: '#64748b', name: '-' };
                        return `
                            <div class="qa-recent-item" onclick="POPs.showPOP('${p.id}')">
                                <span class="material-icons-round" style="color:${s.color}">bookmark</span>
                                <div style="flex:1;min-width:0">
                                    <div style="font-size:0.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</div>
                                    <div style="font-size:0.7rem;color:var(--text-muted)">${s.name}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderRecentsWidget(userId) {
        const ids = DB.getRecents(userId);
        if (!ids.length) return '';
        const pops = ids.map(id => DB.getPOP(id)).filter(Boolean).slice(0, 6);
        return `
            <div class="card">
                <div class="card-header"><h3><span class="material-icons-round" style="font-size:18px;color:var(--primary)">history</span> Consultados Recentemente</h3></div>
                <div class="card-body" style="display:flex;flex-direction:column;gap:6px">
                    ${pops.map(p => {
                        const s = DB.getSector(p.sector) || { color: '#64748b', name: '-' };
                        return `
                            <div class="qa-recent-item" onclick="POPs.showPOP('${p.id}')">
                                <span class="material-icons-round" style="color:${s.color}">menu_book</span>
                                <div style="flex:1;min-width:0">
                                    <div style="font-size:0.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</div>
                                    <div style="font-size:0.7rem;color:var(--text-muted)">${s.name}</div>
                                </div>
                                <span class="material-icons-round" style="font-size:16px;color:var(--text-muted)">arrow_forward_ios</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    // ===== EMERGENCY MODE =====
    renderEmergency() {
        const ids = DB.getEmergencyPOPs();
        const pops = ids.map(id => DB.getPOP(id)).filter(Boolean);
        const palette = [
            { bg:'#ef4444', icon:'health_and_safety', label:'CRÍTICO' },
            { bg:'#f97316', icon:'warning_amber', label:'URGENTE' },
            { bg:'#f59e0b', icon:'priority_high', label:'ATENÇÃO' },
            { bg:'#dc2626', icon:'emergency', label:'EMERGÊNCIA' }
        ];
        return `
            <div class="page-header">
                <div>
                    <h2>🚨 Modo Plantão</h2>
                    <p>Procedimentos críticos de acesso rápido — toque para abrir em modo apresentação</p>
                </div>
                <div class="page-actions">
                    ${Auth.isAdmin() ? `
                        <button class="btn btn-outline-dark btn-sm" onclick="QuickAccess.configureEmergency()">
                            <span class="material-icons-round">tune</span> Configurar
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="emergency-grid">
                ${pops.length === 0 ? '<p style="grid-column:1/-1;color:var(--text-muted)">Nenhum POP definido como crítico. Admin pode configurar.</p>' : ''}
                ${pops.map((p,i) => {
                    const c = palette[i % palette.length];
                    return `
                        <button class="emergency-card" style="--em-color:${c.bg}" onclick="Presentation.start('${p.id}')">
                            <div class="emergency-badge">${c.label}</div>
                            <span class="material-icons-round emergency-icon">${c.icon}</span>
                            <h3>${p.title}</h3>
                            <p>${(p.description||'').substring(0,90)}…</p>
                            <div class="emergency-meta">
                                <span>${p.steps?.length||0} etapas</span>
                                <span>${p.duration||'—'}</span>
                            </div>
                            <div class="emergency-cta">
                                <span class="material-icons-round">play_circle</span> Abrir
                            </div>
                        </button>
                    `;
                }).join('')}
            </div>

            <div class="card" style="margin-top:var(--space-6)">
                <div class="card-header"><h3><span class="material-icons-round" style="font-size:18px;color:var(--danger)">phone_in_talk</span> Contatos de Emergência</h3></div>
                <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--space-3)">
                    <div class="emergency-contact"><strong>SAMU</strong><span style="font-size:1.5rem;font-weight:800;color:var(--danger)">192</span></div>
                    <div class="emergency-contact"><strong>Bombeiros</strong><span style="font-size:1.5rem;font-weight:800;color:var(--danger)">193</span></div>
                    <div class="emergency-contact"><strong>Polícia</strong><span style="font-size:1.5rem;font-weight:800;color:var(--danger)">190</span></div>
                    <div class="emergency-contact"><strong>Defesa Civil</strong><span style="font-size:1.5rem;font-weight:800;color:var(--danger)">199</span></div>
                </div>
            </div>
        `;
    },

    configureEmergency() {
        const all = DB.getPOPs();
        const current = new Set(DB.getEmergencyPOPs());
        App.openModal(
            '<h3>Configurar POPs Críticos</h3>',
            `
                <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:var(--space-3)">Marque os POPs que devem aparecer no Modo Plantão.</p>
                <div style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);padding:var(--space-3)">
                    ${all.map(p => `
                        <label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:0.85rem;cursor:pointer;border-bottom:1px solid var(--border-light)">
                            <input type="checkbox" class="qa-em-chk" value="${p.id}" ${current.has(p.id)?'checked':''}>
                            <strong>${p.title}</strong>
                            <span style="color:var(--text-muted);font-size:0.75rem">${(p.description||'').substring(0,50)}</span>
                        </label>
                    `).join('')}
                </div>
            `,
            `
                <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="QuickAccess.saveEmergency()">Salvar</button>
            `
        );
    },

    saveEmergency() {
        const ids = [...document.querySelectorAll('.qa-em-chk:checked')].map(c => c.value);
        DB.setEmergencyPOPs(ids);
        App.toast('POPs de emergência atualizados', 'success');
        App.closeModal();
        App.navigate('plantao');
    },

    // ===== KEYBOARD SHORTCUT =====
    bindShortcut() {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (document.getElementById('qa-search-overlay')) this.closeSearch();
                else this.openSearch();
            }
            if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                this.openSearch();
            }
        });
    }
};
