/* ========================================
   TRAINING MODULE
   ======================================== */

const Training = {
    renderTraining() {
        const user = Auth.currentUser;
        const trainings = DB.getTrainings();
        const progress = DB.getUserProgress(user.id);

        // Admin/Supervisor see all users' progress
        if (Auth.isAdmin() || Auth.isSupervisor()) {
            return this.renderAdminTraining();
        }

        // Find user's trail
        const myTrail = trainings.find(t => t.role === user.role);
        if (!myTrail) {
            return `
                <div class="page-header">
                    <div>
                        <h2>📚 Minha Trilha de Treinamento</h2>
                        <p>Nenhuma trilha obrigatória para sua função</p>
                    </div>
                </div>
                <div class="empty-state">
                    <span class="material-icons-round">school</span>
                    <h3>Sem trilha obrigatória</h3>
                    <p>Sua função ainda não possui uma trilha de treinamento definida.</p>
                </div>
            `;
        }

        const totalPops = myTrail.pops.length;
        const readPops = myTrail.pops.filter(p => progress.popsRead.includes(p)).length;
        const totalTests = myTrail.tests.length;
        const passedTests = myTrail.tests.filter(t => progress.testsCompleted.includes(t)).length;
        const overallProgress = Math.round(((readPops + passedTests) / (totalPops + totalTests)) * 100);

        return `
            <div class="page-header">
                <div>
                    <h2>📚 Minha Trilha</h2>
                    <p>${myTrail.title}</p>
                </div>
                <div>
                    <span class="badge ${overallProgress === 100 ? 'badge-success' : 'badge-info'}" style="font-size:0.85rem;padding:8px 16px">
                        ${overallProgress}% completo
                    </span>
                </div>
            </div>

            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-icon blue"><span class="material-icons-round">description</span></div>
                    <div class="stat-info">
                        <h4>POPs Lidos</h4>
                        <div class="stat-value">${readPops}/${totalPops}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><span class="material-icons-round">quiz</span></div>
                    <div class="stat-info">
                        <h4>Testes Aprovados</h4>
                        <div class="stat-value">${passedTests}/${totalTests}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon ${overallProgress === 100 ? 'green' : 'orange'}"><span class="material-icons-round">${overallProgress === 100 ? 'verified' : 'pending'}</span></div>
                    <div class="stat-info">
                        <h4>Status</h4>
                        <div class="stat-value" style="font-size:1.1rem">${overallProgress === 100 ? 'Completo ✓' : 'Em progresso'}</div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom:var(--space-6)">
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-3)">
                        <span style="font-size:0.85rem;font-weight:600">Progresso Geral</span>
                        <span style="font-size:0.85rem;font-weight:700;color:var(--primary)">${overallProgress}%</span>
                    </div>
                    <div class="progress-bar" style="height:12px">
                        <div class="progress-fill ${overallProgress === 100 ? 'green' : ''}" style="width:${overallProgress}%"></div>
                    </div>
                </div>
            </div>

            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:var(--space-5)">Etapas da Trilha</h3>
            <div class="track-timeline">
                ${myTrail.pops.map((popId, i) => {
                    const pop = DB.getPOP(popId);
                    const isRead = progress.popsRead.includes(popId);
                    const status = isRead ? 'completed' : (i === 0 || progress.popsRead.includes(myTrail.pops[i-1]) ? 'current' : '');
                    return `
                        <div class="track-item ${status}" onclick="POPs.showPOP('${popId}')">
                            <h4>${pop.title}</h4>
                            <p>Leitura do POP • ${pop.steps.length} etapas</p>
                            <div class="track-meta">
                                <span><span class="material-icons-round" style="font-size:14px">timer</span> ${pop.duration}</span>
                                <span class="badge ${isRead ? 'badge-success' : 'badge-warning'}">${isRead ? '✓ Concluído' : 'Pendente'}</span>
                            </div>
                        </div>
                    `;
                }).join('')}

                ${myTrail.tests.map((testId, i) => {
                    const test = DB.getTest(testId);
                    const isPassed = progress.testsCompleted.includes(testId);
                    return `
                        <div class="track-item ${isPassed ? 'completed' : ''}" onclick="Tests.startTest('${testId}')">
                            <h4>📝 ${test.title}</h4>
                            <p>Teste de avaliação • ${test.questions.length} perguntas</p>
                            <div class="track-meta">
                                <span><span class="material-icons-round" style="font-size:14px">quiz</span> Múltipla escolha</span>
                                <span class="badge ${isPassed ? 'badge-success' : 'badge-info'}">${isPassed ? '✓ Aprovado' : 'Fazer teste'}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderAdminTraining() {
        const users = DB.getUsers().filter(u => u.role !== 'admin');
        const trainings = DB.getTrainings();

        return `
            <div class="page-header">
                <div>
                    <h2>📚 Trilhas de Treinamento</h2>
                    <p>Acompanhamento do progresso de todos os funcionários</p>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Funcionário</th>
                            <th>Função</th>
                            <th>Trilha</th>
                            <th>POPs Lidos</th>
                            <th>Testes</th>
                            <th>Progresso</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => {
                            const role = DB.getRole(user.role);
                            const trail = trainings.find(t => t.role === user.role);
                            const progress = DB.getUserProgress(user.id);

                            if (!trail) {
                                return `
                                    <tr>
                                        <td><strong>${user.name}</strong></td>
                                        <td>${role?.name || user.role}</td>
                                        <td><span class="badge badge-warning">Sem trilha</span></td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td><span class="badge badge-warning">N/A</span></td>
                                    </tr>
                                `;
                            }

                            const totalPops = trail.pops.length;
                            const readPops = trail.pops.filter(p => progress.popsRead.includes(p)).length;
                            const totalTests = trail.tests.length;
                            const passedTests = trail.tests.filter(t => progress.testsCompleted.includes(t)).length;
                            const pct = Math.round(((readPops + passedTests) / (totalPops + totalTests)) * 100);

                            return `
                                <tr>
                                    <td><strong>${user.name}</strong></td>
                                    <td>${role?.name || user.role}</td>
                                    <td>${trail.title}</td>
                                    <td>${readPops}/${totalPops}</td>
                                    <td>${passedTests}/${totalTests}</td>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:8px">
                                            <div class="progress-bar" style="width:80px">
                                                <div class="progress-fill ${pct === 100 ? 'green' : pct > 50 ? '' : 'orange'}" style="width:${pct}%"></div>
                                            </div>
                                            <span style="font-size:0.8rem;font-weight:700">${pct}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge ${pct === 100 ? 'badge-success' : pct > 0 ? 'badge-info' : 'badge-danger'}">
                                            ${pct === 100 ? 'Completo' : pct > 0 ? 'Em progresso' : 'Não iniciado'}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};
