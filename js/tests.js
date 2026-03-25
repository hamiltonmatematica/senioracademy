/* ========================================
   TESTS MODULE
   ======================================== */

const Tests = {
    currentTest: null,
    currentQuestionIndex: 0,
    answers: [],
    showingResults: false,

    renderTestsList() {
        const user = Auth.currentUser;

        if (Auth.isAdmin() || Auth.isSupervisor()) {
            return this.renderAdminTests();
        }

        const trainings = DB.getTrainings();
        const myTrail = trainings.find(t => t.role === user.role);
        const progress = DB.getUserProgress(user.id);
        const results = DB.getTestResults().filter(r => r.userId === user.id);

        if (!myTrail || myTrail.tests.length === 0) {
            return `
                <div class="page-header"><div><h2>📝 Meus Testes</h2><p>Nenhum teste disponível</p></div></div>
                <div class="empty-state">
                    <span class="material-icons-round">quiz</span>
                    <h3>Sem testes disponíveis</h3>
                    <p>Sua trilha não possui testes cadastrados.</p>
                </div>
            `;
        }

        return `
            <div class="page-header">
                <div><h2>📝 Meus Testes</h2><p>Complete os testes da sua trilha de treinamento</p></div>
            </div>
            <div class="pop-grid">
                ${myTrail.tests.map(testId => {
                    const test = DB.getTest(testId);
                    const isPassed = progress.testsCompleted.includes(testId);
                    const lastResult = results.filter(r => r.testId === testId).pop();

                    return `
                        <div class="pop-card card-clickable" onclick="Tests.startTest('${testId}')">
                            <div class="pop-card-header">
                                <div class="pop-card-icon" style="background:var(--info-bg); color:var(--info)">
                                    <span class="material-icons-round">quiz</span>
                                </div>
                                <div>
                                    <h4>${test.title}</h4>
                                    <p>${test.questions.length} perguntas • Múltipla escolha</p>
                                </div>
                            </div>
                            <div class="pop-card-body">
                                ${lastResult ? `
                                    <p style="font-size:0.85rem;color:var(--text-secondary)">
                                        Última nota: <strong style="color:${lastResult.passed ? 'var(--success)' : 'var(--danger)'}">${lastResult.percentage}%</strong>
                                        (${lastResult.score}/${lastResult.total})
                                    </p>
                                ` : `<p style="font-size:0.85rem;color:var(--text-muted)">Ainda não realizado</p>`}
                            </div>
                            <div class="pop-card-footer">
                                <span>${test.questions.length} questões</span>
                                <span class="badge ${isPassed ? 'badge-success' : 'badge-info'}">
                                    ${isPassed ? '✓ Aprovado' : 'Fazer teste'}
                                </span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            ${results.length > 0 ? `
                <h3 style="font-size:1.1rem;font-weight:700;margin:var(--space-8) 0 var(--space-5)">Histórico de Resultados</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>Teste</th><th>Nota</th><th>Status</th><th>Data</th></tr>
                        </thead>
                        <tbody>
                            ${results.reverse().map(r => {
                                const test = DB.getTest(r.testId);
                                return `
                                    <tr>
                                        <td>${test?.title || r.testId}</td>
                                        <td><strong>${r.score}/${r.total}</strong> (${r.percentage}%)</td>
                                        <td><span class="badge ${r.passed ? 'badge-success' : 'badge-danger'}">${r.passed ? 'Aprovado' : 'Reprovado'}</span></td>
                                        <td>${new Date(r.timestamp).toLocaleDateString('pt-BR')} ${new Date(r.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        `;
    },

    renderAdminTests() {
        const results = DB.getTestResults();
        const users = DB.getUsers();

        return `
            <div class="page-header">
                <div><h2>📝 Resultados dos Testes</h2><p>Todos os resultados de avaliação</p></div>
            </div>
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-icon blue"><span class="material-icons-round">quiz</span></div>
                    <div class="stat-info">
                        <h4>Total de Testes</h4>
                        <div class="stat-value">${results.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><span class="material-icons-round">check_circle</span></div>
                    <div class="stat-info">
                        <h4>Aprovados</h4>
                        <div class="stat-value">${results.filter(r => r.passed).length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><span class="material-icons-round">cancel</span></div>
                    <div class="stat-info">
                        <h4>Reprovados</h4>
                        <div class="stat-value">${results.filter(r => !r.passed).length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><span class="material-icons-round">trending_up</span></div>
                    <div class="stat-info">
                        <h4>Média Geral</h4>
                        <div class="stat-value">${results.length > 0 ? Math.round(results.reduce((s,r)=>s+r.percentage,0)/results.length) : 0}%</div>
                    </div>
                </div>
            </div>
            ${results.length > 0 ? `
                <div class="table-container">
                    <table>
                        <thead><tr><th>Funcionário</th><th>Teste</th><th>Nota</th><th>Status</th><th>Data</th></tr></thead>
                        <tbody>
                            ${[...results].reverse().map(r => {
                                const user = DB.getUser(r.userId);
                                const test = DB.getTest(r.testId);
                                return `<tr>
                                    <td><strong>${user?.name || 'Desconhecido'}</strong></td>
                                    <td>${test?.title || r.testId}</td>
                                    <td><strong>${r.score}/${r.total}</strong> (${r.percentage}%)</td>
                                    <td><span class="badge ${r.passed ? 'badge-success' : 'badge-danger'}">${r.passed ? 'Aprovado' : 'Reprovado'}</span></td>
                                    <td>${new Date(r.timestamp).toLocaleDateString('pt-BR')}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `<div class="empty-state"><span class="material-icons-round">quiz</span><h3>Nenhum resultado</h3><p>Nenhum teste foi realizado ainda.</p></div>`}
        `;
    },

    startTest(testId) {
        this.currentTest = DB.getTest(testId);
        this.currentQuestionIndex = 0;
        this.answers = new Array(this.currentTest.questions.length).fill(-1);
        this.showingResults = false;
        this.renderQuestion();
    },

    renderQuestion() {
        const test = this.currentTest;
        const q = test.questions[this.currentQuestionIndex];
        const i = this.currentQuestionIndex;
        const total = test.questions.length;

        App.renderContent(`
            <div style="max-width:700px;margin:0 auto">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
                    <button class="btn btn-ghost btn-sm" onclick="App.navigate('testes')">
                        <span class="material-icons-round">close</span> Cancelar
                    </button>
                    <span style="font-size:0.85rem;font-weight:600;color:var(--text-secondary)">${test.title}</span>
                </div>

                <div class="card" style="margin-bottom:var(--space-5)">
                    <div class="card-body" style="padding:var(--space-3) var(--space-5)">
                        <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">
                            <span style="font-size:0.75rem;color:var(--text-muted)">Questão ${i+1} de ${total}</span>
                            <span style="font-size:0.75rem;font-weight:700;color:var(--primary)">${Math.round(((i+1)/total)*100)}%</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill" style="width:${((i+1)/total)*100}%"></div></div>
                    </div>
                </div>

                <div class="question-card">
                    <div class="question-number">Questão ${i+1}</div>
                    <div class="question-text">${q.q}</div>
                    <div class="question-options">
                        ${q.options.map((opt, oi) => `
                            <div class="question-option ${this.answers[i] === oi ? 'selected' : ''}" onclick="Tests.selectAnswer(${oi})">
                                <div class="option-letter">${String.fromCharCode(65 + oi)}</div>
                                <span>${opt}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="display:flex;justify-content:space-between;margin-top:var(--space-6)">
                    <button class="btn btn-outline-dark" onclick="Tests.prevQuestion()" ${i === 0 ? 'disabled style="opacity:0.4"' : ''}>
                        <span class="material-icons-round">arrow_back</span> Anterior
                    </button>
                    ${i === total - 1 ? `
                        <button class="btn btn-primary btn-lg" onclick="Tests.submitTest()">
                            <span class="material-icons-round">check</span> Finalizar
                        </button>
                    ` : `
                        <button class="btn btn-primary" onclick="Tests.nextQuestion()">
                            Próxima <span class="material-icons-round">arrow_forward</span>
                        </button>
                    `}
                </div>
            </div>
        `);
    },

    selectAnswer(optIndex) {
        this.answers[this.currentQuestionIndex] = optIndex;
        this.renderQuestion();
    },

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentTest.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        }
    },

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
        }
    },

    submitTest() {
        const test = this.currentTest;
        const unanswered = this.answers.filter(a => a === -1).length;
        if (unanswered > 0) {
            App.toast(`Você ainda tem ${unanswered} questão(ões) sem resposta!`, 'warning');
            return;
        }

        let score = 0;
        test.questions.forEach((q, i) => {
            if (this.answers[i] === q.correct) score++;
        });

        const total = test.questions.length;
        const percentage = Math.round((score / total) * 100);
        const passed = percentage >= 70;

        DB.addTestResult(Auth.currentUser.id, test.id, score, total, passed);
        if (passed) {
            DB.markTestComplete(Auth.currentUser.id, test.id);
        }

        this.renderResults(score, total, percentage, passed);
    },

    renderResults(score, total, percentage, passed) {
        const test = this.currentTest;

        App.renderContent(`
            <div style="max-width:600px;margin:0 auto;text-align:center">
                <div style="margin-bottom:var(--space-8)">
                    <span class="material-icons-round" style="font-size:80px;color:${passed ? 'var(--success)' : 'var(--danger)'}">
                        ${passed ? 'celebration' : 'sentiment_dissatisfied'}
                    </span>
                    <h2 style="font-size:1.8rem;margin-top:var(--space-4)">${passed ? 'Parabéns! Você foi aprovado!' : 'Não foi dessa vez...'}</h2>
                    <p style="color:var(--text-secondary);margin-top:var(--space-2)">
                        ${passed ? 'Continue assim!' : 'Você precisa acertar pelo menos 70% para ser aprovado. Estude o POP novamente e refaça o teste.'}
                    </p>
                </div>

                <div class="card" style="margin-bottom:var(--space-6)">
                    <div class="card-body" style="padding:var(--space-8)">
                        <div style="font-size:3rem;font-weight:800;color:${passed ? 'var(--success)' : 'var(--danger)'}">${percentage}%</div>
                        <p style="color:var(--text-secondary);margin-top:var(--space-2)">Você acertou ${score} de ${total} questões</p>
                        <div class="progress-bar" style="height:12px;margin-top:var(--space-5)">
                            <div class="progress-fill ${passed ? 'green' : 'red'}" style="width:${percentage}%"></div>
                        </div>
                    </div>
                </div>

                <h3 style="font-size:1rem;font-weight:700;margin-bottom:var(--space-5);text-align:left">Revisão das Questões</h3>
                ${test.questions.map((q, i) => {
                    const isCorrect = this.answers[i] === q.correct;
                    return `
                        <div class="question-card" style="text-align:left;margin-bottom:var(--space-4)">
                            <div class="question-number" style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}">
                                ${isCorrect ? '✓' : '✗'} Questão ${i+1}
                            </div>
                            <div class="question-text" style="font-size:0.9rem">${q.q}</div>
                            <div class="question-options">
                                ${q.options.map((opt, oi) => {
                                    let cls = '';
                                    if (oi === q.correct) cls = 'correct';
                                    else if (oi === this.answers[i] && oi !== q.correct) cls = 'wrong';
                                    return `
                                        <div class="question-option ${cls}" style="cursor:default">
                                            <div class="option-letter">${String.fromCharCode(65 + oi)}</div>
                                            <span>${opt}</span>
                                            ${oi === q.correct ? '<span class="material-icons-round" style="margin-left:auto;color:var(--success);font-size:18px">check_circle</span>' : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}

                <div style="display:flex;gap:var(--space-3);justify-content:center;margin-top:var(--space-8)">
                    ${!passed ? `
                        <button class="btn btn-primary btn-lg" onclick="Tests.startTest('${test.id}')">
                            <span class="material-icons-round">refresh</span> Refazer Teste
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-dark btn-lg" onclick="App.navigate('testes')">
                        <span class="material-icons-round">arrow_back</span> Voltar
                    </button>
                </div>
            </div>
        `);
    }
};
