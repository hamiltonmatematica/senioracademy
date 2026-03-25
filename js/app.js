/* ========================================
   MAIN APP — Navigation & Rendering
   ======================================== */

const App = {
    currentPage: 'dashboard',

    // ===== INIT =====
    init() {
        DB.init();

        // Try to restore session
        const user = Auth.restore();
        if (user) {
            this.showApp();
        }

        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const user = Auth.login(email, password);
            if (user) {
                this.showApp();
            } else {
                this.toast('E-mail ou senha incorretos', 'error');
            }
        });
    },

    // ===== DEMO LOGIN =====
    demoLogin(type) {
        const user = Auth.demoLogin(type);
        if (user) {
            this.showApp();
        }
    },

    // ===== SHOW APP =====
    showApp() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');

        document.getElementById('user-name').textContent = Auth.currentUser.name;
        const role = DB.getRole(Auth.currentUser.role);
        document.getElementById('user-role').textContent = role?.name || Auth.currentUser.role;

        this.buildMenu();
        this.navigate('dashboard');
    },

    // ===== LOGOUT =====
    logout() {
        Auth.logout();
        document.getElementById('main-app').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    },

    // ===== SIDEBAR =====
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    },

    openMobileSidebar() {
        document.getElementById('sidebar').classList.add('mobile-open');
        document.getElementById('sidebar-overlay').classList.add('active');
    },

    closeMobileSidebar() {
        document.getElementById('sidebar').classList.remove('mobile-open');
        document.getElementById('sidebar-overlay').classList.remove('active');
    },

    // ===== BUILD MENU =====
    buildMenu() {
        const perms = Auth.getPermissions();
        const nav = document.getElementById('sidebar-nav');

        let menuItems = [
            { section: 'Principal', items: [
                { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', show: perms.dashboard },
            ]},
            { section: 'Treinamento', items: [
                { id: 'setores', icon: 'category', label: 'Setores & POPs', show: perms.pops },
                { id: 'trilhas', icon: 'school', label: 'Trilhas', show: perms.training },
                { id: 'testes', icon: 'quiz', label: 'Testes', show: perms.tests },
            ]},
            { section: 'Gestão', items: [
                { id: 'usuarios', icon: 'group', label: 'Usuários', show: perms.users },
                { id: 'juridico', icon: 'gavel', label: 'Registro Jurídico', show: perms.legal },
                { id: 'franquias', icon: 'business', label: 'Franquias', show: perms.franchise },
            ]},
            { section: 'Ferramentas', items: [
                { id: 'comercial', icon: 'storefront', label: 'Comercial', show: perms.commercial },
                { id: 'chat', icon: 'smart_toy', label: 'Chat IA', show: perms.chat },
                { id: 'tv', icon: 'tv', label: 'Modo TV', show: perms.tv },
            ]}
        ];

        nav.innerHTML = menuItems.map(section => {
            const visibleItems = section.items.filter(i => i.show);
            if (visibleItems.length === 0) return '';
            return `
                <div class="nav-section">
                    <div class="nav-section-title">${section.section}</div>
                    ${visibleItems.map(item => `
                        <a href="#" data-page="${item.id}" onclick="App.navigate('${item.id}'); event.preventDefault();">
                            <span class="material-icons-round">${item.icon}</span>
                            <span class="nav-label">${item.label}</span>
                        </a>
                    `).join('')}
                </div>
            `;
        }).join('');
    },

    // ===== NAVIGATE =====
    navigate(page) {
        this.currentPage = page;

        // Update active nav
        document.querySelectorAll('.sidebar-nav a').forEach(a => {
            a.classList.toggle('active', a.dataset.page === page);
        });

        // Close mobile sidebar
        this.closeMobileSidebar();

        // Update bottom nav
        document.querySelectorAll('.bottom-nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Special: TV Mode
        if (page === 'tv') {
            TVMode.start();
            return;
        }

        // Render page content
        const content = this.getPageContent(page);
        this.renderContent(content);
    },

    // ===== RENDER CONTENT =====
    renderContent(html) {
        const content = document.getElementById('content');
        content.innerHTML = html;
        content.scrollTop = 0;
    },

    // ===== GET PAGE CONTENT =====
    getPageContent(page) {
        switch (page) {
            case 'dashboard': return this.renderDashboard();
            case 'setores': return POPs.renderSectors();
            case 'trilhas': return Training.renderTraining();
            case 'testes': return Tests.renderTestsList();
            case 'usuarios': return this.renderUsers();
            case 'juridico': return this.renderLegal();
            case 'franquias': return this.renderFranchises();
            case 'comercial': return this.renderCommercial();
            case 'chat': return Chat.renderChat();
            default: return '<div class="empty-state"><span class="material-icons-round">construction</span><h3>Em construção</h3></div>';
        }
    },

    // ===== DASHBOARD =====
    renderDashboard() {
        if (Auth.isAdmin() || Auth.isSupervisor()) {
            return this.renderAdminDashboard();
        }
        return this.renderEmployeeDashboard();
    },

    renderAdminDashboard() {
        const users = DB.getUsers();
        const totalUsers = users.filter(u => u.role !== 'admin').length;
        const trainings = DB.getTrainings();
        const results = DB.getTestResults();
        const records = DB.getLegalRecords();

        // Calculate trained vs pending
        let trained = 0;
        let pending = 0;
        users.filter(u => u.role !== 'admin').forEach(u => {
            const trail = trainings.find(t => t.role === u.role);
            if (!trail) return;
            const progress = DB.getUserProgress(u.id);
            const totalItems = trail.pops.length + trail.tests.length;
            const doneItems = trail.pops.filter(p => progress.popsRead.includes(p)).length +
                              trail.tests.filter(t => progress.testsCompleted.includes(t)).length;
            if (doneItems === totalItems) trained++;
            else pending++;
        });

        // Avg test score
        const avgScore = results.length > 0 ? Math.round(results.reduce((s,r)=>s+r.percentage,0)/results.length) : 0;

        // Alerts
        const pendingUsers = users.filter(u => {
            if (u.role === 'admin') return false;
            const trail = trainings.find(t => t.role === u.role);
            if (!trail) return false;
            const progress = DB.getUserProgress(u.id);
            return trail.pops.filter(p => progress.popsRead.includes(p)).length === 0;
        });

        const failedResults = results.filter(r => !r.passed);

        return `
            <div class="page-header">
                <div>
                    <h2>📊 Dashboard</h2>
                    <p>Visão geral da plataforma</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-outline-dark btn-sm" onclick="App.navigate('tv')">
                        <span class="material-icons-round">tv</span> Modo TV
                    </button>
                </div>
            </div>

            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-icon blue"><span class="material-icons-round">group</span></div>
                    <div class="stat-info">
                        <h4>Funcionários</h4>
                        <div class="stat-value">${totalUsers}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><span class="material-icons-round">verified</span></div>
                    <div class="stat-info">
                        <h4>Treinados</h4>
                        <div class="stat-value">${trained}</div>
                        <div class="stat-change">✓ Completos</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange"><span class="material-icons-round">pending</span></div>
                    <div class="stat-info">
                        <h4>Pendentes</h4>
                        <div class="stat-value">${pending}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><span class="material-icons-round">analytics</span></div>
                    <div class="stat-info">
                        <h4>Média Testes</h4>
                        <div class="stat-value">${avgScore}%</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <h3><span class="material-icons-round" style="font-size:18px">history</span> Atividade Recente</h3>
                    </div>
                    <div class="activity-list">
                        ${records.length > 0 ? [...records].reverse().slice(0, 8).map(r => {
                            const user = DB.getUser(r.userId);
                            const icons = { acesso: 'login', treinamento: 'school', teste: 'quiz' };
                            const colors = { acesso: 'var(--info-bg)', treinamento: 'var(--success-bg)', teste: 'var(--warning-bg)' };
                            const iconColors = { acesso: 'var(--info)', treinamento: 'var(--success)', teste: 'var(--warning)' };
                            return `
                                <div class="activity-item">
                                    <div class="activity-icon" style="background:${colors[r.type] || 'var(--primary-50)'}; color:${iconColors[r.type] || 'var(--primary)'}">
                                        <span class="material-icons-round" style="font-size:18px">${icons[r.type] || 'info'}</span>
                                    </div>
                                    <div class="activity-info">
                                        <h5>${user?.name || 'Desconhecido'}</h5>
                                        <p>${r.details}</p>
                                    </div>
                                    <div class="activity-time">${this.timeAgo(r.timestamp)}</div>
                                </div>
                            `;
                        }).join('') : `
                            <div class="empty-state" style="padding:var(--space-6)">
                                <p style="color:var(--text-muted);font-size:0.85rem">Nenhuma atividade registrada</p>
                            </div>
                        `}
                    </div>
                </div>

                <div>
                    <div class="card" style="margin-bottom:var(--space-5)">
                        <div class="card-header">
                            <h3><span class="material-icons-round" style="font-size:18px;color:var(--danger)">warning</span> Alertas</h3>
                        </div>
                        <div class="card-body">
                            <div class="alert-list">
                                ${pendingUsers.length > 0 ? pendingUsers.map(u => `
                                    <div class="alert-item warning">
                                        <span class="material-icons-round">schedule</span>
                                        <span><strong>${u.name}</strong> não iniciou treinamento</span>
                                    </div>
                                `).join('') : ''}
                                ${failedResults.length > 0 ? `
                                    <div class="alert-item danger">
                                        <span class="material-icons-round">error</span>
                                        <span>${failedResults.length} reprovação(ões) em testes</span>
                                    </div>
                                ` : ''}
                                ${pendingUsers.length === 0 && failedResults.length === 0 ? `
                                    <div class="alert-item" style="background:var(--success-bg);color:#065f46">
                                        <span class="material-icons-round">check_circle</span>
                                        <span>Tudo em ordem! Sem alertas.</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3><span class="material-icons-round" style="font-size:18px">category</span> POPs por Setor</h3>
                        </div>
                        <div class="card-body">
                            ${DB.sectors.map(s => {
                                const count = DB.getPOPs().filter(p => p.sector === s.id).length;
                                if (count === 0) return '';
                                return `
                                    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)">
                                        <span style="display:flex;align-items:center;gap:8px;font-size:0.85rem">
                                            <span style="width:8px;height:8px;border-radius:50%;background:${s.color}"></span>
                                            ${s.name}
                                        </span>
                                        <span style="font-weight:700;font-size:0.85rem">${count}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderEmployeeDashboard() {
        const user = Auth.currentUser;
        const trainings = DB.getTrainings();
        const trail = trainings.find(t => t.role === user.role);
        const progress = DB.getUserProgress(user.id);
        const results = DB.getTestResults().filter(r => r.userId === user.id);

        let popsRead = 0, totalPops = 0, testsPassed = 0, totalTests = 0, overallPct = 0;
        if (trail) {
            totalPops = trail.pops.length;
            popsRead = trail.pops.filter(p => progress.popsRead.includes(p)).length;
            totalTests = trail.tests.length;
            testsPassed = trail.tests.filter(t => progress.testsCompleted.includes(t)).length;
            overallPct = Math.round(((popsRead + testsPassed) / (totalPops + totalTests)) * 100);
        }

        return `
            <div class="page-header">
                <div>
                    <h2>👋 Olá, ${user.name.split(' ')[0]}!</h2>
                    <p>Seu painel de treinamento</p>
                </div>
            </div>

            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-icon blue"><span class="material-icons-round">school</span></div>
                    <div class="stat-info">
                        <h4>Progresso</h4>
                        <div class="stat-value">${overallPct}%</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><span class="material-icons-round">description</span></div>
                    <div class="stat-info">
                        <h4>POPs Lidos</h4>
                        <div class="stat-value">${popsRead}/${totalPops}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><span class="material-icons-round">quiz</span></div>
                    <div class="stat-info">
                        <h4>Testes</h4>
                        <div class="stat-value">${testsPassed}/${totalTests}</div>
                    </div>
                </div>
            </div>

            ${trail ? `
                <div class="card" style="margin-bottom:var(--space-6)">
                    <div class="card-body">
                        <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-3)">
                            <span style="font-size:0.85rem;font-weight:600">${trail.title}</span>
                            <span style="font-size:0.85rem;font-weight:700;color:var(--primary)">${overallPct}%</span>
                        </div>
                        <div class="progress-bar" style="height:12px">
                            <div class="progress-fill ${overallPct === 100 ? 'green' : ''}" style="width:${overallPct}%"></div>
                        </div>
                    </div>
                </div>

                <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:var(--space-5)">Próximas Etapas</h3>
                <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                    ${trail.pops.filter(p => !progress.popsRead.includes(p)).slice(0, 3).map(popId => {
                        const pop = DB.getPOP(popId);
                        return `
                            <div class="card card-clickable" onclick="POPs.showPOP('${popId}')">
                                <div class="card-body" style="display:flex;align-items:center;gap:var(--space-4)">
                                    <span class="material-icons-round" style="font-size:24px;color:var(--warning)">menu_book</span>
                                    <div style="flex:1">
                                        <strong style="font-size:0.9rem">${pop.title}</strong>
                                        <p style="font-size:0.75rem;color:var(--text-muted)">${pop.steps.length} etapas • ${pop.duration}</p>
                                    </div>
                                    <span class="badge badge-warning">Pendente</span>
                                </div>
                            </div>
                        `;
                    }).join('')}

                    ${trail.tests.filter(t => !progress.testsCompleted.includes(t)).slice(0, 2).map(testId => {
                        const test = DB.getTest(testId);
                        return `
                            <div class="card card-clickable" onclick="Tests.startTest('${testId}')">
                                <div class="card-body" style="display:flex;align-items:center;gap:var(--space-4)">
                                    <span class="material-icons-round" style="font-size:24px;color:var(--info)">quiz</span>
                                    <div style="flex:1">
                                        <strong style="font-size:0.9rem">${test.title}</strong>
                                        <p style="font-size:0.75rem;color:var(--text-muted)">${test.questions.length} perguntas</p>
                                    </div>
                                    <span class="badge badge-info">Fazer teste</span>
                                </div>
                            </div>
                        `;
                    }).join('')}

                    ${overallPct === 100 ? `
                        <div class="card" style="border-color:var(--success)">
                            <div class="card-body" style="text-align:center;padding:var(--space-8)">
                                <span class="material-icons-round" style="font-size:48px;color:var(--success)">workspace_premium</span>
                                <h3 style="margin-top:var(--space-3);color:var(--success)">Trilha Completa!</h3>
                                <p style="color:var(--text-secondary);font-size:0.9rem">Parabéns! Você concluiu toda a trilha de treinamento.</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : `
                <div class="empty-state">
                    <span class="material-icons-round">info</span>
                    <h3>Sem trilha atribuída</h3>
                    <p>Fale com seu supervisor para ser incluído em uma trilha de treinamento.</p>
                </div>
            `}
        `;
    },

    // ===== USERS =====
    renderUsers() {
        const users = DB.getUsers();
        return `
            <div class="page-header">
                <div>
                    <h2>👥 Gestão de Usuários</h2>
                    <p>${users.length} usuários cadastrados</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="App.showAddUserModal()">
                        <span class="material-icons-round">person_add</span> Novo Usuário
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Função</th>
                            <th>Setor</th>
                            <th>Data Entrada</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => {
                            const role = DB.getRole(user.role);
                            const sector = user.sector ? DB.getSector(user.sector) : null;
                            return `
                                <tr>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:10px">
                                            <div class="user-card-avatar" style="width:32px;height:32px;font-size:0.75rem">
                                                ${user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                            </div>
                                            <strong>${user.name}</strong>
                                        </div>
                                    </td>
                                    <td>${user.email}</td>
                                    <td><span class="badge badge-primary">${role?.name || user.role}</span></td>
                                    <td>${sector ? `<span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:${sector.color}"></span>${sector.name}</span>` : '-'}</td>
                                    <td>${new Date(user.hireDate).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <div style="display:flex;gap:4px">
                                            <button class="btn btn-ghost btn-sm" onclick="App.showUserHistory('${user.id}')" title="Histórico">
                                                <span class="material-icons-round" style="font-size:18px">history</span>
                                            </button>
                                            ${user.id !== Auth.currentUser.id ? `
                                                <button class="btn btn-ghost btn-sm" onclick="App.deleteUser('${user.id}')" title="Excluir" style="color:var(--danger)">
                                                    <span class="material-icons-round" style="font-size:18px">delete</span>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    showAddUserModal() {
        this.openModal(
            '<h3>Novo Usuário</h3>',
            `
                <div class="form-group">
                    <label>Nome completo</label>
                    <input type="text" class="form-control" id="new-user-name" placeholder="Nome do funcionário" required>
                </div>
                <div class="form-group">
                    <label>E-mail</label>
                    <input type="email" class="form-control" id="new-user-email" placeholder="email@exemplo.com" required>
                </div>
                <div class="form-group">
                    <label>Senha</label>
                    <input type="password" class="form-control" id="new-user-pass" placeholder="Senha" value="func123">
                </div>
                <div class="form-group">
                    <label>Função</label>
                    <select class="form-control" id="new-user-role">
                        ${DB.roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Unidade</label>
                    <select class="form-control" id="new-user-unit">
                        ${DB.getUnits().map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                    </select>
                </div>
            `,
            `
                <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="App.addUser()">
                    <span class="material-icons-round">person_add</span> Cadastrar
                </button>
            `
        );
    },

    addUser() {
        const name = document.getElementById('new-user-name').value.trim();
        const email = document.getElementById('new-user-email').value.trim();
        const password = document.getElementById('new-user-pass').value.trim();
        const role = document.getElementById('new-user-role').value;
        const unit = document.getElementById('new-user-unit').value;

        if (!name || !email || !password) {
            this.toast('Preencha todos os campos', 'error');
            return;
        }

        const roleObj = DB.getRole(role);
        DB.addUser({
            name, email, password, role,
            sector: roleObj?.sector || null,
            unit,
            hireDate: new Date().toISOString().split('T')[0]
        });

        this.closeModal();
        this.toast('Usuário cadastrado com sucesso!', 'success');
        this.navigate('usuarios');
    },

    deleteUser(userId) {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            DB.deleteUser(userId);
            this.toast('Usuário excluído', 'info');
            this.navigate('usuarios');
        }
    },

    showUserHistory(userId) {
        const user = DB.getUser(userId);
        const records = DB.getLegalRecords().filter(r => r.userId === userId);
        const results = DB.getTestResults().filter(r => r.userId === userId);

        this.openModal(
            `<h3>Histórico — ${user.name}</h3>`,
            `
                <div style="margin-bottom:var(--space-5)">
                    <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:var(--space-3)">Mudanças de Função</h4>
                    ${user.roleHistory.map(rh => `
                        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:0.8rem">
                            <span class="material-icons-round" style="font-size:16px;color:var(--primary)">swap_horiz</span>
                            <span><strong>${DB.getRole(rh.role)?.name || rh.role}</strong> — ${new Date(rh.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-bottom:var(--space-5)">
                    <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:var(--space-3)">Resultados de Testes</h4>
                    ${results.length > 0 ? results.map(r => {
                        const test = DB.getTest(r.testId);
                        return `
                            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:0.8rem;border-bottom:1px solid var(--border-light)">
                                <span>${test?.title || r.testId}</span>
                                <span class="badge ${r.passed ? 'badge-success' : 'badge-danger'}">${r.percentage}%</span>
                            </div>
                        `;
                    }).join('') : '<p style="font-size:0.8rem;color:var(--text-muted)">Nenhum teste realizado</p>'}
                </div>

                <div>
                    <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:var(--space-3)">Registros (últimos 10)</h4>
                    ${records.length > 0 ? [...records].reverse().slice(0, 10).map(r => `
                        <div style="padding:6px 0;font-size:0.8rem;border-bottom:1px solid var(--border-light)">
                            <span style="color:var(--text-muted)">${new Date(r.timestamp).toLocaleDateString('pt-BR')} ${new Date(r.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                            — ${r.details}
                        </div>
                    `).join('') : '<p style="font-size:0.8rem;color:var(--text-muted)">Nenhum registro</p>'}
                </div>
            `,
            '<button class="btn btn-primary" onclick="App.closeModal()">Fechar</button>'
        );
    },

    // ===== LEGAL RECORDS =====
    renderLegal() {
        const records = DB.getLegalRecords();
        const users = DB.getUsers();

        return `
            <div class="page-header">
                <div>
                    <h2>⚖️ Registro Jurídico</h2>
                    <p>Histórico completo de atividades e treinamentos</p>
                </div>
            </div>

            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-icon blue"><span class="material-icons-round">article</span></div>
                    <div class="stat-info">
                        <h4>Total de Registros</h4>
                        <div class="stat-value">${records.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><span class="material-icons-round">school</span></div>
                    <div class="stat-info">
                        <h4>Treinamentos</h4>
                        <div class="stat-value">${records.filter(r => r.type === 'treinamento').length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><span class="material-icons-round">quiz</span></div>
                    <div class="stat-info">
                        <h4>Testes</h4>
                        <div class="stat-value">${records.filter(r => r.type === 'teste').length}</div>
                    </div>
                </div>
            </div>

            ${records.length > 0 ? `
                <div class="filter-bar">
                    <button class="filter-chip active" onclick="App.filterLegal(this, 'all')">Todos</button>
                    <button class="filter-chip" onclick="App.filterLegal(this, 'treinamento')">Treinamentos</button>
                    <button class="filter-chip" onclick="App.filterLegal(this, 'teste')">Testes</button>
                    <button class="filter-chip" onclick="App.filterLegal(this, 'acesso')">Acessos</button>
                </div>
                <div class="table-container" id="legal-table">
                    <table>
                        <thead>
                            <tr><th>Data/Hora</th><th>Funcionário</th><th>Tipo</th><th>Detalhes</th></tr>
                        </thead>
                        <tbody>
                            ${[...records].reverse().map(r => {
                                const user = DB.getUser(r.userId);
                                const typeLabels = { acesso: 'Acesso', treinamento: 'Treinamento', teste: 'Teste' };
                                const typeColors = { acesso: 'badge-info', treinamento: 'badge-success', teste: 'badge-primary' };
                                return `
                                    <tr data-type="${r.type}">
                                        <td style="white-space:nowrap">${new Date(r.timestamp).toLocaleDateString('pt-BR')} ${new Date(r.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                        <td><strong>${user?.name || 'Desconhecido'}</strong></td>
                                        <td><span class="badge ${typeColors[r.type] || 'badge-info'}">${typeLabels[r.type] || r.type}</span></td>
                                        <td>${r.details}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="empty-state">
                    <span class="material-icons-round">gavel</span>
                    <h3>Nenhum registro</h3>
                    <p>Os registros jurídicos aparecerão conforme os funcionários utilizarem o sistema.</p>
                </div>
            `}
        `;
    },

    filterLegal(btn, type) {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('#legal-table tbody tr').forEach(row => {
            if (type === 'all' || row.dataset.type === type) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    },

    // ===== FRANCHISES =====
    renderFranchises() {
        const units = DB.getUnits();
        const users = DB.getUsers();

        return `
            <div class="page-header">
                <div>
                    <h2>🏢 Franquias</h2>
                    <p>Sistema multi-unidade</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="App.showAddUnitModal()">
                        <span class="material-icons-round">add_business</span> Nova Unidade
                    </button>
                </div>
            </div>

            <div class="franchise-grid">
                ${units.map(unit => {
                    const unitUsers = users.filter(u => u.unit === unit.id).length;
                    const unitPops = DB.getPOPs().length;
                    return `
                        <div class="franchise-card">
                            <div style="display:flex;align-items:center;gap:12px;margin-bottom:var(--space-4)">
                                <div style="width:44px;height:44px;border-radius:var(--radius);background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;color:white">
                                    <span class="material-icons-round">business</span>
                                </div>
                                <div>
                                    <h4>${unit.name}</h4>
                                    <p style="margin:0">${unit.city}</p>
                                </div>
                            </div>
                            <p><span class="material-icons-round" style="font-size:14px;vertical-align:middle">location_on</span> ${unit.address}</p>
                            <div class="franchise-stats" style="margin-top:var(--space-4)">
                                <div class="franchise-stat">
                                    <div class="val">${unitUsers}</div>
                                    <div class="lbl">Usuários</div>
                                </div>
                                <div class="franchise-stat">
                                    <div class="val">${unitPops}</div>
                                    <div class="lbl">POPs</div>
                                </div>
                                <div class="franchise-stat">
                                    <div class="val"><span class="badge ${unit.status === 'active' ? 'badge-success' : 'badge-warning'}">${unit.status === 'active' ? 'Ativa' : 'Setup'}</span></div>
                                    <div class="lbl">Status</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    showAddUnitModal() {
        this.openModal(
            '<h3>Nova Unidade</h3>',
            `
                <div class="form-group">
                    <label>Nome da unidade</label>
                    <input type="text" class="form-control" id="new-unit-name" placeholder="Ex: Residencial Bela Vista">
                </div>
                <div class="form-group">
                    <label>Cidade</label>
                    <input type="text" class="form-control" id="new-unit-city" placeholder="Ex: São Paulo - SP">
                </div>
                <div class="form-group">
                    <label>Endereço</label>
                    <input type="text" class="form-control" id="new-unit-address" placeholder="Endereço completo">
                </div>
            `,
            `
                <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="App.addUnit()">
                    <span class="material-icons-round">add_business</span> Criar
                </button>
            `
        );
    },

    addUnit() {
        const name = document.getElementById('new-unit-name').value.trim();
        const city = document.getElementById('new-unit-city').value.trim();
        const address = document.getElementById('new-unit-address').value.trim();

        if (!name || !city) {
            this.toast('Preencha nome e cidade', 'error');
            return;
        }

        const units = DB.getUnits();
        units.push({
            id: 'unit' + (units.length + 1),
            name, city, address,
            status: 'setup',
            createdAt: new Date().toISOString().split('T')[0]
        });
        DB.set('units', units);

        this.closeModal();
        this.toast('Unidade criada com sucesso!', 'success');
        this.navigate('franquias');
    },

    // ===== COMMERCIAL =====
    renderCommercial() {
        return `
            <div class="page-header">
                <div><h2>🤝 Módulo Comercial</h2><p>Scripts e treinamento para abordagem com famílias</p></div>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="App.showCommercialTab(this, 'scripts')">Scripts</button>
                <button class="tab" onclick="App.showCommercialTab(this, 'simulacoes')">Simulações</button>
                <button class="tab" onclick="App.showCommercialTab(this, 'dicas')">Dicas</button>
            </div>

            <div id="commercial-content">
                ${this.getCommercialScripts()}
            </div>
        `;
    },

    showCommercialTab(btn, tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        const content = document.getElementById('commercial-content');
        switch (tab) {
            case 'scripts':
                content.innerHTML = this.getCommercialScripts();
                break;
            case 'simulacoes':
                content.innerHTML = this.getSimulations();
                break;
            case 'dicas':
                content.innerHTML = this.getTips();
                break;
        }
    },

    getCommercialScripts() {
        return `
            <div class="script-card">
                <h4><span class="material-icons-round" style="color:var(--primary)">record_voice_over</span> Primeiro Contato com a Família</h4>
                <div class="script-text">
                    "Bom dia/Boa tarde! Seja muito bem-vindo(a) ao [nome do residencial]. Meu nome é [seu nome] e estou aqui para ajudar vocês nesse momento tão importante. Entendo que buscar um cuidado especializado para seu familiar é uma decisão que exige confiança, e quero que se sinta à vontade para conhecer nosso espaço e tirar todas as suas dúvidas."
                </div>
            </div>
            <div class="script-card">
                <h4><span class="material-icons-round" style="color:var(--primary)">favorite</span> Abordagem Humanizada — Entendendo a Necessidade</h4>
                <div class="script-text">
                    "Conte-me um pouco sobre o seu familiar. Como está a rotina dele(a) hoje? Quais são as principais necessidades de cuidado? Aqui, cada residente recebe um plano de cuidados personalizado, porque entendemos que cada pessoa é única e merece atenção individual."
                </div>
            </div>
            <div class="script-card">
                <h4><span class="material-icons-round" style="color:var(--primary)">verified_user</span> Apresentando Diferenciais</h4>
                <div class="script-text">
                    "Nosso diferencial está na equipe qualificada e no treinamento contínuo. Todos os nossos profissionais passam por uma trilha de capacitação com procedimentos padronizados, testes de avaliação e monitoramento constante de qualidade. Isso garante que seu familiar receberá o melhor cuidado possível."
                </div>
            </div>
            <div class="script-card">
                <h4><span class="material-icons-round" style="color:var(--primary)">handshake</span> Fechamento com Empatia</h4>
                <div class="script-text">
                    "Sei que essa é uma decisão importante e que vocês precisam de tempo. Fique à vontade para voltar quantas vezes quiser, conversar com nossa equipe e ver nossos residentes em atividade. Estamos aqui para cuidar do seu familiar como se fosse da nossa família."
                </div>
            </div>
        `;
    },

    getSimulations() {
        return `
            <div class="card" style="margin-bottom:var(--space-5)">
                <div class="card-header"><h3>Simulação 1: Família Preocupada com Segurança</h3></div>
                <div class="card-body">
                    <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:var(--space-4)"><strong>Cenário:</strong> A família demonstra medo de maus-tratos e negligência.</p>
                    <p style="font-size:0.875rem;color:var(--text-secondary)"><strong>Resposta ideal:</strong> "Entendo perfeitamente essa preocupação. É por isso que temos um sistema completo de controle: cada funcionário é treinado e avaliado, todos os procedimentos são documentados e temos câmeras com acesso remoto. A segurança do seu familiar é nossa prioridade número um."</p>
                </div>
            </div>
            <div class="card" style="margin-bottom:var(--space-5)">
                <div class="card-header"><h3>Simulação 2: Questionamento sobre Preços</h3></div>
                <div class="card-body">
                    <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:var(--space-4)"><strong>Cenário:</strong> A família acha o valor alto.</p>
                    <p style="font-size:0.875rem;color:var(--text-secondary)"><strong>Resposta ideal:</strong> "Nosso valor reflete a qualidade do cuidado que oferecemos: equipe treinada 24h, alimentação personalizada, atividades terapêuticas diárias e monitoramento de saúde contínuo. Vamos conhecer juntos tudo que está incluído?"</p>
                </div>
            </div>
        `;
    },

    getTips() {
        return `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:var(--space-5)">
                ${[
                    { icon: 'hearing', title: 'Escuta Ativa', desc: 'Ouça mais do que fale. Entenda as necessidades reais antes de apresentar soluções.' },
                    { icon: 'sentiment_satisfied', title: 'Empatia Genuína', desc: 'Coloque-se no lugar da família. Essa é uma decisão difícil e emocional.' },
                    { icon: 'visibility', title: 'Mostre na Prática', desc: 'Tour pelo residencial vale mais que mil palavras. Mostre os cuidados em ação.' },
                    { icon: 'group', title: 'Apresente a Equipe', desc: 'Famílias confiam mais quando conhecem quem vai cuidar de seus entes queridos.' },
                    { icon: 'phone_callback', title: 'Follow-up', desc: 'Entre em contato após a visita. Pergunte se ficou alguma dúvida.' },
                    { icon: 'auto_stories', title: 'Conte Histórias', desc: 'Compartilhe histórias positivas de outros residentes (com autorização) para gerar confiança.' }
                ].map(tip => `
                    <div class="card card-body" style="text-align:center">
                        <span class="material-icons-round" style="font-size:36px;color:var(--primary);margin-bottom:var(--space-3)">${tip.icon}</span>
                        <h4 style="font-size:0.95rem;margin-bottom:var(--space-2)">${tip.title}</h4>
                        <p style="font-size:0.8rem;color:var(--text-secondary)">${tip.desc}</p>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // ===== TV MODE EXIT =====
    exitTvMode() {
        TVMode.exit();
    },

    // ===== MODAL =====
    openModal(header, body, footer) {
        document.getElementById('modal-header').innerHTML = header;
        document.getElementById('modal-body').innerHTML = body;
        document.getElementById('modal-footer').innerHTML = footer;
        document.getElementById('modal-overlay').classList.add('active');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    // ===== TOAST =====
    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const icons = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="material-icons-round" style="font-size:20px">${icons[type]}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
    },

    // ===== TIME AGO =====
    timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
        if (seconds < 60) return 'Agora';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    }
};

// ===== INIT ON LOAD =====
document.addEventListener('DOMContentLoaded', () => App.init());
