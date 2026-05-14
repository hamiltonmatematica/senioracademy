/* ========================================
   ENGAGEMENT — Announcements, Notifications, Gamification, Tour, Calendar
   ======================================== */

const Engagement = {

    // ===== ANNOUNCEMENTS =====
    renderAnnouncementsPage() {
        const list = DB.getAnnouncements();
        const isAdmin = Auth.isAdmin() || Auth.isSupervisor();
        return `
            <div class="page-header">
                <div>
                    <h2>📢 Mural de Avisos</h2>
                    <p>Comunicados oficiais da gestão</p>
                </div>
                ${isAdmin ? `
                    <div class="page-actions">
                        <button class="btn btn-primary" onclick="Engagement.newAnnouncementModal()">
                            <span class="material-icons-round">campaign</span> Novo Comunicado
                        </button>
                    </div>
                ` : ''}
            </div>

            ${list.length === 0 ? `
                <div class="empty-state">
                    <span class="material-icons-round">campaign</span>
                    <h3>Nenhum comunicado ainda</h3>
                    <p>Quando a gestão publicar avisos, eles aparecerão aqui.</p>
                </div>
            ` : `
                <div style="display:flex;flex-direction:column;gap:var(--space-4)">
                    ${list.map(a => {
                        const author = DB.getUser(a.authorId);
                        const isUnread = !a.readBy.includes(Auth.currentUser.id);
                        const priority = { info:'#3b82f6', alert:'#f59e0b', critical:'#ef4444' }[a.priority||'info'];
                        return `
                            <div class="card announcement-card ${isUnread?'unread':''}" style="border-left:4px solid ${priority}">
                                <div class="card-body">
                                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-3);margin-bottom:var(--space-3)">
                                        <div style="flex:1">
                                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                                                <span class="badge" style="background:${priority}20;color:${priority}">${({info:'Informativo',alert:'Alerta',critical:'Crítico'})[a.priority||'info']}</span>
                                                ${isUnread?'<span class="badge badge-primary">NOVO</span>':''}
                                            </div>
                                            <h3 style="font-size:1.1rem;margin-bottom:4px">${a.title}</h3>
                                            <p style="font-size:0.8rem;color:var(--text-muted)">${author?.name || '—'} · ${new Date(a.createdAt).toLocaleString('pt-BR')}</p>
                                        </div>
                                        ${isAdmin ? `<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Engagement.deleteAnnouncement('${a.id}')"><span class="material-icons-round" style="font-size:18px">delete</span></button>` : ''}
                                    </div>
                                    <p style="white-space:pre-wrap;line-height:1.7;font-size:0.9rem">${a.body}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `}
        `;
    },

    newAnnouncementModal() {
        App.openModal(
            '<h3>📢 Novo Comunicado</h3>',
            `
                <div class="form-group"><label>Título</label><input type="text" class="form-control" id="ann-title" placeholder="Ex: Mudança no horário de medicamentos"></div>
                <div class="form-group"><label>Prioridade</label>
                    <select class="form-control" id="ann-prio">
                        <option value="info">Informativo</option>
                        <option value="alert">Alerta</option>
                        <option value="critical">Crítico</option>
                    </select>
                </div>
                <div class="form-group"><label>Mensagem</label><textarea class="form-control" id="ann-body" rows="6" placeholder="Conteúdo do comunicado..."></textarea></div>
            `,
            `
                <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="Engagement.saveAnnouncement()">Publicar</button>
            `
        );
    },

    saveAnnouncement() {
        const title = document.getElementById('ann-title').value.trim();
        const body = document.getElementById('ann-body').value.trim();
        const priority = document.getElementById('ann-prio').value;
        if (!title || !body) return App.toast('Preencha título e mensagem', 'error');
        DB.addAnnouncement({ title, body, priority, authorId: Auth.currentUser.id });
        App.toast('Comunicado publicado e notificado a todos', 'success');
        App.closeModal();
        App.navigate('avisos');
    },

    deleteAnnouncement(id) {
        if (!confirm('Excluir este comunicado?')) return;
        DB.deleteAnnouncement(id);
        App.toast('Comunicado excluído', 'info');
        App.navigate('avisos');
    },

    // ===== NOTIFICATIONS =====
    renderBell() {
        if (!Auth.currentUser) return '';
        const count = DB.countUnreadNotifications(Auth.currentUser.id);
        return `
            <button class="topbar-bell" onclick="Engagement.toggleNotifications()" id="topbar-bell" title="Notificações">
                <span class="material-icons-round">notifications</span>
                ${count > 0 ? `<span class="bell-badge">${count>9?'9+':count}</span>` : ''}
            </button>
        `;
    },

    refreshBell() {
        const el = document.getElementById('topbar-bell-wrap');
        if (el) el.innerHTML = this.renderBell();
    },

    toggleNotifications() {
        const existing = document.getElementById('notif-panel');
        if (existing) { existing.remove(); return; }
        const list = DB.getNotifications(Auth.currentUser.id);
        const panel = document.createElement('div');
        panel.id = 'notif-panel';
        panel.className = 'notif-panel';
        panel.innerHTML = `
            <div class="notif-header">
                <strong>Notificações</strong>
                ${list.length ? `<button class="btn btn-ghost btn-sm" onclick="Engagement.markAllRead()">Marcar todas como lidas</button>` : ''}
            </div>
            <div class="notif-list">
                ${list.length===0 ? '<p style="text-align:center;color:var(--text-muted);padding:var(--space-6)">Sem notificações</p>' : list.slice(0,15).map(n => `
                    <div class="notif-item ${n.read?'':'unread'}" onclick="Engagement.openNotification('${n.id}','${n.type}','${n.ref||''}')">
                        <span class="material-icons-round notif-icon" style="color:${this._notifColor(n.type)}">${this._notifIcon(n.type)}</span>
                        <div style="flex:1;min-width:0">
                            <div style="font-weight:${n.read?'500':'700'};font-size:0.85rem">${n.title}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis">${n.body||''}</div>
                            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">${App.timeAgo(n.createdAt)}</div>
                        </div>
                        ${!n.read?'<span class="notif-dot"></span>':''}
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(panel);
        setTimeout(() => {
            document.addEventListener('click', this._closeNotifOnOutside = (e) => {
                if (!panel.contains(e.target) && !e.target.closest('.topbar-bell')) {
                    panel.remove();
                    document.removeEventListener('click', this._closeNotifOnOutside);
                }
            });
        }, 50);
    },

    _notifIcon(type) {
        return ({ announcement:'campaign', badge:'workspace_premium', event:'event', test:'quiz', training:'school' })[type] || 'info';
    },
    _notifColor(type) {
        return ({ announcement:'var(--info)', badge:'#f59e0b', event:'var(--success)', test:'var(--info)', training:'var(--primary)' })[type] || 'var(--primary)';
    },

    openNotification(id, type, ref) {
        DB.markNotificationRead(Auth.currentUser.id, id);
        document.getElementById('notif-panel')?.remove();
        if (type === 'announcement') App.navigate('avisos');
        else if (type === 'event') App.navigate('agenda');
        else if (type === 'badge') App.navigate('conquistas');
        this.refreshBell();
    },

    markAllRead() {
        DB.markAllNotificationsRead(Auth.currentUser.id);
        this.refreshBell();
        document.getElementById('notif-panel')?.remove();
    },

    // ===== GAMIFICATION =====
    renderAchievements() {
        const user = Auth.currentUser;
        const myPoints = DB.getPoints(user.id);
        const myBadges = DB.getBadges(user.id);
        const myBadgeIds = new Set(myBadges.map(b => b.id));
        const allBadges = DB.BADGE_DEFS;

        const allUsers = DB.getUsers().filter(u => u.role !== 'admin');
        const leaderboard = allUsers.map(u => ({
            name: u.name, role: DB.getRole(u.role)?.name || u.role,
            pts: DB.getPoints(u.id), badges: DB.getBadges(u.id).length, me: u.id === user.id
        })).sort((a,b) => b.pts - a.pts);

        const myRank = leaderboard.findIndex(l => l.me) + 1;
        const nextBadge = allBadges.find(b => !myBadgeIds.has(b.id));

        return `
            <div class="page-header">
                <div>
                    <h2>🏆 Conquistas</h2>
                    <p>Pontos, medalhas e ranking</p>
                </div>
            </div>

            <div class="stat-grid">
                <div class="stat-card"><div class="stat-icon orange"><span class="material-icons-round">stars</span></div><div class="stat-info"><h4>Meus pontos</h4><div class="stat-value">${myPoints}</div></div></div>
                <div class="stat-card"><div class="stat-icon purple"><span class="material-icons-round">workspace_premium</span></div><div class="stat-info"><h4>Conquistas</h4><div class="stat-value">${myBadges.length}/${allBadges.length}</div></div></div>
                <div class="stat-card"><div class="stat-icon blue"><span class="material-icons-round">leaderboard</span></div><div class="stat-info"><h4>Posição no ranking</h4><div class="stat-value">${myRank>0?'#'+myRank:'—'}</div></div></div>
                <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">trending_up</span></div><div class="stat-info"><h4>Próxima medalha</h4><div class="stat-value" style="font-size:1.5rem">${nextBadge?nextBadge.icon:'✓'}</div></div></div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><h3>🎖️ Suas Medalhas</h3></div>
                    <div class="card-body">
                        <div class="badge-grid">
                            ${allBadges.map(b => {
                                const got = myBadgeIds.has(b.id);
                                return `
                                    <div class="badge-tile ${got?'earned':'locked'}" title="${b.desc}">
                                        <div class="badge-icon">${got?b.icon:'🔒'}</div>
                                        <div class="badge-name">${b.name}</div>
                                        <div class="badge-pts">${b.pts} pts</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>🏅 Ranking Geral</h3></div>
                    <div class="card-body">
                        ${leaderboard.slice(0,10).map((l,i) => `
                            <div class="rank-row ${l.me?'me':''}">
                                <span class="rank-pos">${['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
                                <div style="flex:1;min-width:0">
                                    <div style="font-weight:600;font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.name}${l.me?' (você)':''}</div>
                                    <div style="font-size:0.7rem;color:var(--text-muted)">${l.role}</div>
                                </div>
                                <span class="rank-pts"><strong>${l.pts}</strong> pts</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // ===== CALENDAR =====
    renderCalendar() {
        const events = DB.getEvents().sort((a,b)=>new Date(a.date)-new Date(b.date));
        const isAdmin = Auth.isAdmin() || Auth.isSupervisor();
        const now = new Date();
        const upcoming = events.filter(e => new Date(e.date) >= now);
        const past = events.filter(e => new Date(e.date) < now);

        return `
            <div class="page-header">
                <div>
                    <h2>📅 Agenda de Treinamentos</h2>
                    <p>Calendário de eventos e capacitações</p>
                </div>
                ${isAdmin ? `
                    <div class="page-actions">
                        <button class="btn btn-primary" onclick="Engagement.newEventModal()">
                            <span class="material-icons-round">event</span> Novo Evento
                        </button>
                    </div>
                ` : ''}
            </div>

            <h3 style="margin-bottom:var(--space-4);font-size:1rem">📌 Próximos (${upcoming.length})</h3>
            ${upcoming.length === 0 ? '<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:var(--space-6)">Nenhum evento agendado.</p>' : `
                <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-bottom:var(--space-8)">
                    ${upcoming.map(e => this._renderEventCard(e, isAdmin, true)).join('')}
                </div>
            `}

            <h3 style="margin-bottom:var(--space-4);font-size:1rem;color:var(--text-secondary)">📁 Realizados (${past.length})</h3>
            <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                ${past.slice(-10).reverse().map(e => this._renderEventCard(e, isAdmin, false)).join('')}
            </div>
        `;
    },

    _renderEventCard(e, isAdmin, upcoming) {
        const d = new Date(e.date);
        const day = d.getDate().toString().padStart(2,'0');
        const month = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.','');
        return `
            <div class="event-card ${upcoming?'':'past'}">
                <div class="event-date">
                    <span class="event-day">${day}</span>
                    <span class="event-month">${month}</span>
                </div>
                <div class="event-body">
                    <h4>${e.title}</h4>
                    <p style="font-size:0.85rem;color:var(--text-secondary);margin:4px 0">${e.description||''}</p>
                    <div style="display:flex;gap:var(--space-3);font-size:0.75rem;color:var(--text-muted);flex-wrap:wrap">
                        <span><span class="material-icons-round" style="font-size:14px;vertical-align:middle">schedule</span> ${e.time||'-'}</span>
                        <span><span class="material-icons-round" style="font-size:14px;vertical-align:middle">place</span> ${e.location||'Local a definir'}</span>
                        ${e.instructor?`<span><span class="material-icons-round" style="font-size:14px;vertical-align:middle">person</span> ${e.instructor}</span>`:''}
                    </div>
                </div>
                ${isAdmin?`<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Engagement.deleteEvent('${e.id}')"><span class="material-icons-round" style="font-size:18px">delete</span></button>`:''}
            </div>
        `;
    },

    newEventModal() {
        App.openModal(
            '<h3>📅 Novo Evento</h3>',
            `
                <div class="form-group"><label>Título</label><input type="text" class="form-control" id="evt-title" placeholder="Ex: Treinamento de RCP"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
                    <div class="form-group"><label>Data</label><input type="date" class="form-control" id="evt-date"></div>
                    <div class="form-group"><label>Horário</label><input type="time" class="form-control" id="evt-time"></div>
                </div>
                <div class="form-group"><label>Local</label><input type="text" class="form-control" id="evt-place" placeholder="Sala de treinamento"></div>
                <div class="form-group"><label>Instrutor</label><input type="text" class="form-control" id="evt-instructor"></div>
                <div class="form-group"><label>Descrição</label><textarea class="form-control" id="evt-desc" rows="3"></textarea></div>
            `,
            `
                <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="Engagement.saveEvent()">Agendar</button>
            `
        );
    },

    saveEvent() {
        const title = document.getElementById('evt-title').value.trim();
        const date = document.getElementById('evt-date').value;
        if (!title || !date) return App.toast('Informe título e data', 'error');
        DB.addEvent({
            title, date,
            time: document.getElementById('evt-time').value,
            location: document.getElementById('evt-place').value.trim(),
            instructor: document.getElementById('evt-instructor').value.trim(),
            description: document.getElementById('evt-desc').value.trim()
        });
        App.toast('Evento agendado e equipe notificada', 'success');
        App.closeModal();
        App.navigate('agenda');
    },

    deleteEvent(id) {
        if (!confirm('Excluir este evento?')) return;
        DB.deleteEvent(id);
        App.toast('Evento removido', 'info');
        App.navigate('agenda');
    },

    // ===== TOUR =====
    maybeStartTour() {
        if (localStorage.getItem('sa_tour_done')) return;
        setTimeout(() => this.startTour(), 800);
    },

    startTour() {
        const steps = [
            { sel: '.sidebar-logo', title: '👋 Bem-vindo ao Senior Academy', body: 'Plataforma completa de treinamento e gestão para residenciais sênior. Vamos fazer um tour rápido (1 min).' },
            { sel: '[data-page="dashboard"]', title: '📊 Dashboard', body: 'Visão geral em tempo real: funcionários, treinamentos, alertas e indicadores.' },
            { sel: '[data-page="setores"]', title: '📋 POPs por Setor', body: 'Procedimentos Operacionais Padrão organizados por setor com etapas, checklists, riscos e anexos.' },
            { sel: '[data-page="trilhas"]', title: '🎓 Trilhas de Treinamento', body: 'Trilhas personalizadas por função, com acompanhamento de progresso.' },
            { sel: '[data-page="chat"]', title: '🤖 Chat IA', body: 'Consulta inteligente: o funcionário pergunta e a IA responde com base nos POPs.' },
            { sel: '[data-page="admin"]', title: '⚙️ Gestão de Conteúdo', body: 'Painel administrativo: crie POPs, testes, trilhas, faça backup, importe e exporte dados.', adminOnly: true },
            { sel: 'body', title: '🚀 Pronto!', body: 'Pressione <kbd>⌘K</kbd> (Ctrl+K) a qualquer momento para a busca rápida. Bom uso!', center: true }
        ];
        this._tourSteps = steps.filter(s => !s.adminOnly || Auth.isAdmin());
        this._tourIdx = 0;
        this._renderTourStep();
    },

    _renderTourStep() {
        document.querySelectorAll('.tour-overlay, .tour-spotlight').forEach(e => e.remove());
        if (this._tourIdx >= this._tourSteps.length) {
            localStorage.setItem('sa_tour_done', '1');
            return;
        }
        const step = this._tourSteps[this._tourIdx];
        const target = document.querySelector(step.sel);
        const overlay = document.createElement('div');
        overlay.className = 'tour-overlay';
        const isLast = this._tourIdx === this._tourSteps.length - 1;
        overlay.innerHTML = `
            <div class="tour-card ${step.center?'center':''}">
                <div class="tour-progress">${this._tourIdx + 1} / ${this._tourSteps.length}</div>
                <h3>${step.title}</h3>
                <p>${step.body}</p>
                <div class="tour-actions">
                    <button class="btn btn-ghost btn-sm" onclick="Engagement.skipTour()">Pular tour</button>
                    <div style="display:flex;gap:var(--space-2)">
                        ${this._tourIdx>0?'<button class="btn btn-outline btn-sm" onclick="Engagement.prevTour()">Voltar</button>':''}
                        <button class="btn btn-primary btn-sm" onclick="Engagement.nextTour()">${isLast?'Finalizar':'Próximo'} <span class="material-icons-round">arrow_forward</span></button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        if (target && !step.center) {
            const rect = target.getBoundingClientRect();
            const spot = document.createElement('div');
            spot.className = 'tour-spotlight';
            spot.style.cssText = `top:${rect.top-8}px;left:${rect.left-8}px;width:${rect.width+16}px;height:${rect.height+16}px`;
            document.body.appendChild(spot);
            const card = overlay.querySelector('.tour-card');
            // Position card near target
            const top = Math.min(window.innerHeight - 220, rect.bottom + 16);
            const left = Math.min(window.innerWidth - 380, Math.max(16, rect.left));
            card.style.position = 'fixed';
            card.style.top = top + 'px';
            card.style.left = left + 'px';
        }
    },

    nextTour() { this._tourIdx++; this._renderTourStep(); },
    prevTour() { this._tourIdx = Math.max(0, this._tourIdx - 1); this._renderTourStep(); },
    skipTour() {
        document.querySelectorAll('.tour-overlay, .tour-spotlight').forEach(e => e.remove());
        localStorage.setItem('sa_tour_done', '1');
    },
    replayTour() {
        localStorage.removeItem('sa_tour_done');
        this.startTour();
    },

    // ===== ABOUT PAGE =====
    renderAbout() {
        return `
            <div class="about-hero">
                <div class="about-hero-bg"></div>
                <div class="about-hero-content">
                    <h1>Senior Academy</h1>
                    <p class="about-tagline">A plataforma completa de treinamento, consulta e gestão para residenciais sênior</p>
                    <div class="about-badges">
                        <span class="about-badge">🏥 Compliance NR-32</span>
                        <span class="about-badge">🛡️ LGPD</span>
                        <span class="about-badge">📱 Mobile-first</span>
                        <span class="about-badge">📊 Analytics</span>
                    </div>
                </div>
            </div>

            <h3 style="font-size:1.3rem;margin:var(--space-8) 0 var(--space-5)">🎯 Tudo que sua equipe precisa em um só lugar</h3>
            <div class="features-grid">
                ${[
                    { icon:'description', title:'POPs Estruturados', desc:'Procedimentos padronizados com etapas, checklists, riscos e anexos (PDF/imagem/vídeo).' },
                    { icon:'school', title:'Trilhas por Função', desc:'Cada cargo recebe sua trilha de treinamento personalizada com acompanhamento individual.' },
                    { icon:'quiz', title:'Avaliações Inteligentes', desc:'Testes com aprovação configurável, limite de tentativas e revisão pós-prova.' },
                    { icon:'medical_services', title:'Modo Plantão', desc:'Acesso imediato a procedimentos críticos: queda, engasgo, parada cardíaca, alergia.' },
                    { icon:'workspace_premium', title:'Certificação Digital', desc:'Certificados imprimíveis com código único e registro auditável.' },
                    { icon:'gavel', title:'Compliance Legal', desc:'Registro completo de cada leitura, teste e acesso — pronto para auditoria.' },
                    { icon:'campaign', title:'Comunicação', desc:'Mural de avisos, notificações e calendário de treinamentos sincronizados.' },
                    { icon:'emoji_events', title:'Gamificação', desc:'Pontos, medalhas e ranking — engaja a equipe no aprendizado contínuo.' },
                    { icon:'insights', title:'Analytics', desc:'Dashboard com KPIs, ranking, heatmap de atividade e relatórios exportáveis.' },
                    { icon:'smart_toy', title:'Chat IA', desc:'Consulta inteligente: pergunte em linguagem natural sobre qualquer procedimento.' },
                    { icon:'tv', title:'Modo TV', desc:'Painel digital para áreas comuns com rotação automática de POPs.' },
                    { icon:'business', title:'Multi-Unidade', desc:'Sistema de franquias para gerenciar várias unidades em uma plataforma.' }
                ].map(f => `
                    <div class="feature-card">
                        <span class="material-icons-round feature-icon">${f.icon}</span>
                        <h4>${f.title}</h4>
                        <p>${f.desc}</p>
                    </div>
                `).join('')}
            </div>

            <div class="card" style="margin-top:var(--space-8)">
                <div class="card-body" style="text-align:center;padding:var(--space-10)">
                    <h3 style="font-size:1.5rem;margin-bottom:var(--space-3)">📈 Resultados que importam</h3>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--space-5);margin-top:var(--space-6)">
                        <div><div style="font-size:2.5rem;font-weight:800;color:var(--primary)">+85%</div><div style="font-size:0.85rem;color:var(--text-secondary)">Aderência ao treinamento</div></div>
                        <div><div style="font-size:2.5rem;font-weight:800;color:var(--success)">-60%</div><div style="font-size:0.85rem;color:var(--text-secondary)">Tempo de onboarding</div></div>
                        <div><div style="font-size:2.5rem;font-weight:800;color:var(--info)">+40%</div><div style="font-size:0.85rem;color:var(--text-secondary)">Conformidade auditável</div></div>
                        <div><div style="font-size:2.5rem;font-weight:800;color:#f59e0b">100%</div><div style="font-size:0.85rem;color:var(--text-secondary)">Rastreabilidade legal</div></div>
                    </div>
                </div>
            </div>

            <div style="margin-top:var(--space-8);text-align:center">
                <button class="btn btn-outline-dark" onclick="Engagement.replayTour()">
                    <span class="material-icons-round">play_circle</span> Refazer Tour Guiado
                </button>
            </div>
        `;
    }
};
