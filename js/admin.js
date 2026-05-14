/* ========================================
   ADMIN — Gestão completa de conteúdo
   ======================================== */

const Admin = {
    activeTab: 'pops',

    render() {
        return `
            <div class="page-header">
                <div>
                    <h2>⚙️ Administração de Conteúdo</h2>
                    <p>Gerencie POPs, testes, trilhas, setores e dados do sistema</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-outline-dark btn-sm" onclick="Admin.openBackup()">
                        <span class="material-icons-round">cloud_sync</span> Backup
                    </button>
                </div>
            </div>

            <div class="tabs">
                <button class="tab ${this.activeTab==='pops'?'active':''}" data-tab="pops" onclick="Admin.switchTab('pops', this)">📋 POPs</button>
                <button class="tab ${this.activeTab==='tests'?'active':''}" data-tab="tests" onclick="Admin.switchTab('tests', this)">📝 Testes</button>
                <button class="tab ${this.activeTab==='trails'?'active':''}" data-tab="trails" onclick="Admin.switchTab('trails', this)">🎯 Trilhas</button>
                <button class="tab ${this.activeTab==='sectors'?'active':''}" data-tab="sectors" onclick="Admin.switchTab('sectors', this)">🏷️ Setores</button>
                <button class="tab ${this.activeTab==='data'?'active':''}" data-tab="data" onclick="Admin.switchTab('data', this)">💾 Dados</button>
            </div>

            <div id="admin-tab-content">${this.renderTab()}</div>
        `;
    },

    switchTab(tab, btn) {
        this.activeTab = tab;
        document.getElementById('admin-tab-content').innerHTML = this.renderTab();
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    },

    renderTab() {
        switch (this.activeTab) {
            case 'pops': return this.renderPOPsTab();
            case 'tests': return this.renderTestsTab();
            case 'trails': return this.renderTrailsTab();
            case 'sectors': return this.renderSectorsTab();
            case 'data': return this.renderDataTab();
        }
    },

    // ===== POPs =====
    renderPOPsTab() {
        const pops = DB.getPOPs();
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-5);gap:var(--space-3);flex-wrap:wrap">
                <input type="search" class="form-control" id="admin-pop-search" placeholder="Buscar POP..." style="max-width:300px" oninput="Admin.filterTable('admin-pops-table', this.value)">
                <div style="display:flex;gap:var(--space-2)">
                    <button class="btn btn-outline-dark btn-sm" onclick="Admin.bulkImportPOPs()">
                        <span class="material-icons-round">upload</span> Importar
                    </button>
                    <button class="btn btn-primary" onclick="Admin.editPOP()">
                        <span class="material-icons-round">add</span> Novo POP
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table id="admin-pops-table">
                    <thead><tr><th>Título</th><th>Setor</th><th>Etapas</th><th>Anexos</th><th>Ações</th></tr></thead>
                    <tbody>
                        ${pops.map(p => {
                            const s = DB.getSector(p.sector) || DB.getSectorsAll().find(x => x.id === p.sector) || { name: p.sector, color: '#64748b' };
                            return `
                                <tr>
                                    <td><strong>${p.title}</strong><div style="font-size:0.75rem;color:var(--text-muted)">${(p.description||'').substring(0,80)}…</div></td>
                                    <td><span class="badge" style="background:${s.color}20;color:${s.color}">${s.name}</span></td>
                                    <td>${p.steps?.length||0}</td>
                                    <td>${(p.attachments||[]).length}</td>
                                    <td>
                                        <button class="btn btn-ghost btn-sm" title="Editar" onclick="Admin.editPOP('${p.id}')"><span class="material-icons-round" style="font-size:18px">edit</span></button>
                                        <button class="btn btn-ghost btn-sm" title="Duplicar" onclick="Admin.duplicatePOP('${p.id}')"><span class="material-icons-round" style="font-size:18px">content_copy</span></button>
                                        <button class="btn btn-ghost btn-sm" title="Excluir" style="color:var(--danger)" onclick="Admin.deletePOP('${p.id}')"><span class="material-icons-round" style="font-size:18px">delete</span></button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    editPOP(id) {
        const pop = id ? DB.getPOP(id) : { sector: 'saude', title: '', description: '', duration: '', steps: [], checklist: [], risks: [], attachments: [] };
        if (!pop) return;
        this._editingPOP = JSON.parse(JSON.stringify(pop));
        const sectors = DB.getSectorsAll();
        App.openModal(
            `<h3>${id ? 'Editar POP' : 'Novo POP'}</h3>`,
            `
                <div class="form-group"><label>Título</label><input type="text" class="form-control" id="pop-title" value="${this._escape(pop.title)}"></div>
                <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:var(--space-3)">
                    <div class="form-group"><label>Setor</label>
                        <select class="form-control" id="pop-sector">
                            ${sectors.map(s => `<option value="${s.id}" ${s.id===pop.sector?'selected':''}>${s.icon||''} ${s.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><label>Duração</label><input type="text" class="form-control" id="pop-duration" value="${this._escape(pop.duration||'')}" placeholder="Ex: 15 min"></div>
                    <div class="form-group"><label>Tipo</label><input type="text" class="form-control" id="pop-type" value="${this._escape(pop.type||'procedimento')}"></div>
                </div>
                <div class="form-group"><label>Descrição</label><textarea class="form-control" id="pop-desc" rows="3">${this._escape(pop.description||'')}</textarea></div>

                <div class="form-group">
                    <label>Etapas (uma por linha)</label>
                    <textarea class="form-control" id="pop-steps" rows="6" placeholder="Passo 1&#10;Passo 2">${(pop.steps||[]).join('\n')}</textarea>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
                    <div class="form-group"><label>Checklist (uma por linha)</label><textarea class="form-control" id="pop-check" rows="5">${(pop.checklist||[]).join('\n')}</textarea></div>
                    <div class="form-group"><label>Riscos (um por linha)</label><textarea class="form-control" id="pop-risks" rows="5">${(pop.risks||[]).join('\n')}</textarea></div>
                </div>

                <div class="form-group">
                    <label>Anexos (PDF, imagem, vídeo)</label>
                    <input type="file" id="pop-attach" multiple accept="image/*,application/pdf,video/*" onchange="Admin._addAttachments(event)" class="form-control">
                    <div id="pop-attach-list" style="margin-top:var(--space-3);display:flex;flex-direction:column;gap:6px">
                        ${this._renderAttachList()}
                    </div>
                </div>
                <div class="form-group"><label>URL de vídeo (opcional)</label><input type="text" class="form-control" id="pop-video" value="${this._escape(pop.videoUrl||'')}" placeholder="https://..."></div>
            `,
            `
                <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="Admin.savePOP('${id||''}')">
                    <span class="material-icons-round">save</span> Salvar
                </button>
            `
        );
    },

    _addAttachments(e) {
        const files = [...e.target.files];
        let pending = files.length;
        if (!pending) return;
        files.forEach(f => {
            if (f.size > 4 * 1024 * 1024) {
                App.toast(`"${f.name}" excede 4MB e foi ignorado`, 'warning');
                if (--pending === 0) document.getElementById('pop-attach-list').innerHTML = this._renderAttachList();
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                this._editingPOP.attachments = this._editingPOP.attachments || [];
                this._editingPOP.attachments.push({
                    id: 'att_' + Date.now() + Math.random().toString(36).slice(2,6),
                    name: f.name, type: f.type, size: f.size, data: reader.result
                });
                if (--pending === 0) document.getElementById('pop-attach-list').innerHTML = this._renderAttachList();
            };
            reader.readAsDataURL(f);
        });
    },

    _renderAttachList() {
        const list = this._editingPOP?.attachments || [];
        if (!list.length) return '<p style="font-size:0.8rem;color:var(--text-muted)">Nenhum anexo</p>';
        return list.map(a => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg);border-radius:var(--radius-sm);font-size:0.8rem">
                <span class="material-icons-round" style="font-size:18px;color:var(--primary)">${a.type?.startsWith('image')?'image':a.type?.startsWith('video')?'movie':'picture_as_pdf'}</span>
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.name}</span>
                <span style="color:var(--text-muted)">${(a.size/1024).toFixed(0)}KB</span>
                <button class="btn btn-ghost btn-sm" onclick="Admin._removeAttach('${a.id}')" style="color:var(--danger)"><span class="material-icons-round" style="font-size:16px">close</span></button>
            </div>
        `).join('');
    },

    _removeAttach(id) {
        this._editingPOP.attachments = this._editingPOP.attachments.filter(a => a.id !== id);
        document.getElementById('pop-attach-list').innerHTML = this._renderAttachList();
    },

    savePOP(id) {
        const data = {
            title: document.getElementById('pop-title').value.trim(),
            sector: document.getElementById('pop-sector').value,
            duration: document.getElementById('pop-duration').value.trim(),
            type: document.getElementById('pop-type').value.trim() || 'procedimento',
            description: document.getElementById('pop-desc').value.trim(),
            steps: document.getElementById('pop-steps').value.split('\n').map(s=>s.trim()).filter(Boolean),
            checklist: document.getElementById('pop-check').value.split('\n').map(s=>s.trim()).filter(Boolean),
            risks: document.getElementById('pop-risks').value.split('\n').map(s=>s.trim()).filter(Boolean),
            videoUrl: document.getElementById('pop-video').value.trim(),
            attachments: this._editingPOP.attachments || []
        };
        if (!data.title) return App.toast('Informe um título', 'error');
        if (!data.steps.length) return App.toast('Informe ao menos uma etapa', 'error');
        if (id) { DB.updatePOP(id, data); App.toast('POP atualizado', 'success'); }
        else { DB.addPOP(data); App.toast('POP criado', 'success'); }
        App.closeModal();
        this._editingPOP = null;
        App.navigate('admin');
    },

    duplicatePOP(id) {
        DB.duplicatePOP(id);
        App.toast('POP duplicado', 'info');
        App.navigate('admin');
    },

    deletePOP(id) {
        if (!confirm('Excluir este POP? Referências em trilhas serão removidas.')) return;
        DB.createSnapshot('pre-delete-pop');
        DB.deletePOP(id);
        App.toast('POP excluído (backup criado)', 'info');
        App.navigate('admin');
    },

    bulkImportPOPs() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = (e) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const arr = JSON.parse(reader.result);
                    if (!Array.isArray(arr)) throw new Error('JSON deve ser array');
                    arr.forEach(p => DB.addPOP(p));
                    App.toast(`${arr.length} POPs importados`, 'success');
                    App.navigate('admin');
                } catch (err) { App.toast('Arquivo inválido: ' + err.message, 'error'); }
            };
            reader.readAsText(e.target.files[0]);
        };
        input.click();
    },

    // ===== TESTS =====
    renderTestsTab() {
        const tests = DB.getTests();
        return `
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-5)">
                <input type="search" class="form-control" placeholder="Buscar teste..." style="max-width:300px" oninput="Admin.filterTable('admin-tests-table', this.value)">
                <button class="btn btn-primary" onclick="Admin.editTest()"><span class="material-icons-round">add</span> Novo Teste</button>
            </div>
            <div class="table-container">
                <table id="admin-tests-table">
                    <thead><tr><th>Título</th><th>POP vinculado</th><th>Questões</th><th>Aprovação</th><th>Tentativas</th><th>Ações</th></tr></thead>
                    <tbody>
                        ${tests.map(t => {
                            const pop = DB.getPOP(t.popId);
                            return `
                                <tr>
                                    <td><strong>${t.title}</strong></td>
                                    <td>${pop?.title || '-'}</td>
                                    <td>${t.questions?.length||0}</td>
                                    <td>${t.passingScore||70}%</td>
                                    <td>${t.maxAttempts||3}</td>
                                    <td>
                                        <button class="btn btn-ghost btn-sm" onclick="Admin.editTest('${t.id}')"><span class="material-icons-round" style="font-size:18px">edit</span></button>
                                        <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Admin.deleteTest('${t.id}')"><span class="material-icons-round" style="font-size:18px">delete</span></button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    editTest(id) {
        const test = id ? DB.getTest(id) : { title: '', popId: '', questions: [], passingScore: 70, maxAttempts: 3 };
        if (!test) return;
        this._editingTest = JSON.parse(JSON.stringify(test));
        const pops = DB.getPOPs();
        App.openModal(
            `<h3>${id ? 'Editar Teste' : 'Novo Teste'}</h3>`,
            `
                <div class="form-group"><label>Título</label><input type="text" class="form-control" id="test-title" value="${this._escape(test.title)}"></div>
                <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:var(--space-3)">
                    <div class="form-group"><label>POP vinculado</label>
                        <select class="form-control" id="test-pop">
                            <option value="">— Nenhum —</option>
                            ${pops.map(p => `<option value="${p.id}" ${p.id===test.popId?'selected':''}>${p.title}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><label>Aprovação (%)</label><input type="number" class="form-control" id="test-passing" value="${test.passingScore||70}" min="0" max="100"></div>
                    <div class="form-group"><label>Máx. tentativas</label><input type="number" class="form-control" id="test-attempts" value="${test.maxAttempts||3}" min="1"></div>
                </div>
                <div style="margin-top:var(--space-3)">
                    <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">
                        <strong style="font-size:0.9rem">Questões</strong>
                        <button class="btn btn-outline btn-sm" onclick="Admin._addQuestion()"><span class="material-icons-round">add</span> Adicionar</button>
                    </div>
                    <div id="test-questions">${this._renderQuestions()}</div>
                </div>
            `,
            `
                <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="Admin.saveTest('${id||''}')"><span class="material-icons-round">save</span> Salvar</button>
            `
        );
    },

    _renderQuestions() {
        const qs = this._editingTest?.questions || [];
        if (!qs.length) return '<p style="font-size:0.8rem;color:var(--text-muted);padding:var(--space-3)">Nenhuma questão. Clique em "Adicionar".</p>';
        return qs.map((q, i) => `
            <div class="card" style="margin-bottom:var(--space-3)">
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">
                        <strong style="font-size:0.85rem">Q${i+1}</strong>
                        <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Admin._removeQ(${i})"><span class="material-icons-round" style="font-size:16px">delete</span></button>
                    </div>
                    <input type="text" class="form-control" placeholder="Pergunta" value="${this._escape(q.q||'')}" oninput="Admin._editingTest.questions[${i}].q=this.value" style="margin-bottom:6px">
                    ${[0,1,2,3].map(oi => `
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                            <input type="radio" name="correct-${i}" ${q.correct===oi?'checked':''} onchange="Admin._editingTest.questions[${i}].correct=${oi}">
                            <input type="text" class="form-control" placeholder="Opção ${oi+1}" value="${this._escape(q.options?.[oi]||'')}" oninput="Admin._editingTest.questions[${i}].options[${oi}]=this.value" style="flex:1">
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    _addQuestion() {
        this._editingTest.questions = this._editingTest.questions || [];
        this._editingTest.questions.push({ q: '', options: ['','','',''], correct: 0 });
        document.getElementById('test-questions').innerHTML = this._renderQuestions();
    },

    _removeQ(i) {
        this._editingTest.questions.splice(i, 1);
        document.getElementById('test-questions').innerHTML = this._renderQuestions();
    },

    saveTest(id) {
        const data = {
            title: document.getElementById('test-title').value.trim(),
            popId: document.getElementById('test-pop').value,
            passingScore: parseInt(document.getElementById('test-passing').value) || 70,
            maxAttempts: parseInt(document.getElementById('test-attempts').value) || 3,
            questions: this._editingTest.questions || []
        };
        if (!data.title) return App.toast('Informe um título', 'error');
        if (!data.questions.length) return App.toast('Adicione ao menos 1 questão', 'error');
        const bad = data.questions.findIndex(q => !q.q || q.options.some(o => !o));
        if (bad !== -1) return App.toast(`Questão ${bad+1}: preencha texto e todas as opções`, 'error');
        if (id) { DB.updateTest(id, data); App.toast('Teste atualizado', 'success'); }
        else { DB.addTest(data); App.toast('Teste criado', 'success'); }
        App.closeModal();
        App.navigate('admin');
    },

    deleteTest(id) {
        if (!confirm('Excluir este teste?')) return;
        DB.createSnapshot('pre-delete-test');
        DB.deleteTest(id);
        App.toast('Teste excluído', 'info');
        App.navigate('admin');
    },

    // ===== TRILHAS =====
    renderTrailsTab() {
        const trails = DB.getTrainings();
        const roles = DB.roles;
        return `
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-5)">
                <p style="font-size:0.85rem;color:var(--text-secondary)">Cada função pode ter sua trilha de POPs e testes.</p>
                <button class="btn btn-primary" onclick="Admin.editTrail()"><span class="material-icons-round">add</span> Nova Trilha</button>
            </div>
            <div class="dashboard-grid">
                ${trails.map(t => {
                    const role = DB.getRole(t.role);
                    return `
                        <div class="card">
                            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
                                <h3>${t.title}</h3>
                                <div>
                                    <button class="btn btn-ghost btn-sm" onclick="Admin.editTrail('${t.id}')"><span class="material-icons-round" style="font-size:18px">edit</span></button>
                                    <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Admin.deleteTrail('${t.id}')"><span class="material-icons-round" style="font-size:18px">delete</span></button>
                                </div>
                            </div>
                            <div class="card-body">
                                <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:var(--space-3)">Função: <strong>${role?.name||t.role}</strong></p>
                                <div style="font-size:0.85rem"><strong>${t.pops?.length||0}</strong> POPs · <strong>${t.tests?.length||0}</strong> Testes</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    editTrail(id) {
        const trail = id ? DB.getTrainings().find(t=>t.id===id) : { title:'', role:DB.roles[2].id, pops:[], tests:[] };
        if (!trail) return;
        const pops = DB.getPOPs();
        const tests = DB.getTests();
        App.openModal(
            `<h3>${id?'Editar':'Nova'} Trilha</h3>`,
            `
                <div class="form-group"><label>Título</label><input type="text" class="form-control" id="trail-title" value="${this._escape(trail.title)}"></div>
                <div class="form-group"><label>Função alvo</label>
                    <select class="form-control" id="trail-role">${DB.roles.map(r=>`<option value="${r.id}" ${r.id===trail.role?'selected':''}>${r.name}</option>`).join('')}</select>
                </div>
                <div class="form-group">
                    <label>POPs da trilha</label>
                    <div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);padding:var(--space-3)">
                        ${pops.map(p => `
                            <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:0.85rem;cursor:pointer">
                                <input type="checkbox" class="trail-pop-chk" value="${p.id}" ${trail.pops?.includes(p.id)?'checked':''}>
                                ${p.title}
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label>Testes da trilha</label>
                    <div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);padding:var(--space-3)">
                        ${tests.map(t => `
                            <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:0.85rem;cursor:pointer">
                                <input type="checkbox" class="trail-test-chk" value="${t.id}" ${trail.tests?.includes(t.id)?'checked':''}>
                                ${t.title}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `,
            `
                <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="Admin.saveTrail('${id||''}')"><span class="material-icons-round">save</span> Salvar</button>
            `
        );
    },

    saveTrail(id) {
        const data = {
            title: document.getElementById('trail-title').value.trim(),
            role: document.getElementById('trail-role').value,
            pops: [...document.querySelectorAll('.trail-pop-chk:checked')].map(c=>c.value),
            tests: [...document.querySelectorAll('.trail-test-chk:checked')].map(c=>c.value)
        };
        if (!data.title) return App.toast('Informe um título', 'error');
        if (id) DB.updateTraining(id, data); else DB.addTraining(data);
        App.toast('Trilha salva', 'success');
        App.closeModal();
        App.navigate('admin');
    },

    deleteTrail(id) {
        if (!confirm('Excluir esta trilha?')) return;
        DB.createSnapshot('pre-delete-trail');
        DB.deleteTraining(id);
        App.toast('Trilha excluída', 'info');
        App.navigate('admin');
    },

    // ===== SETORES =====
    renderSectorsTab() {
        const sectors = DB.getSectorsAll();
        return `
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-5)">
                <p style="font-size:0.85rem;color:var(--text-secondary)">Setores nativos não podem ser removidos. Você pode adicionar novos.</p>
                <button class="btn btn-primary" onclick="Admin.addSector()"><span class="material-icons-round">add</span> Novo Setor</button>
            </div>
            <div class="sector-grid">
                ${sectors.map(s => `
                    <div class="sector-card" style="--sector-color:${s.color}">
                        <div class="sector-icon" style="background:${s.color}15;color:${s.color}">${s.icon}</div>
                        <h4>${s.name}</h4>
                        <p>${DB.getPOPs().filter(p=>p.sector===s.id).length} POPs</p>
                    </div>
                `).join('')}
            </div>
        `;
    },

    addSector() {
        App.openModal(
            '<h3>Novo Setor</h3>',
            `
                <div class="form-group"><label>Nome</label><input type="text" class="form-control" id="sec-name"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
                    <div class="form-group"><label>Emoji/Ícone</label><input type="text" class="form-control" id="sec-icon" value="🏷️" maxlength="2"></div>
                    <div class="form-group"><label>Cor</label><input type="color" class="form-control" id="sec-color" value="#64748b"></div>
                </div>
            `,
            `
                <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="Admin.saveSector()">Criar</button>
            `
        );
    },

    saveSector() {
        const name = document.getElementById('sec-name').value.trim();
        if (!name) return App.toast('Informe o nome', 'error');
        DB.addSector({
            name,
            icon: document.getElementById('sec-icon').value.trim() || '🏷️',
            color: document.getElementById('sec-color').value
        });
        App.toast('Setor criado', 'success');
        App.closeModal();
        App.navigate('admin');
    },

    // ===== DADOS / BACKUP =====
    renderDataTab() {
        const snaps = DB.listSnapshots();
        const stats = {
            users: DB.getUsers().length,
            pops: DB.getPOPs().length,
            tests: DB.getTests().length,
            results: DB.getTestResults().length,
            records: DB.getLegalRecords().length
        };
        return `
            <div class="stat-grid" style="margin-bottom:var(--space-6)">
                <div class="stat-card"><div class="stat-icon blue"><span class="material-icons-round">group</span></div><div class="stat-info"><h4>Usuários</h4><div class="stat-value">${stats.users}</div></div></div>
                <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">description</span></div><div class="stat-info"><h4>POPs</h4><div class="stat-value">${stats.pops}</div></div></div>
                <div class="stat-card"><div class="stat-icon purple"><span class="material-icons-round">quiz</span></div><div class="stat-info"><h4>Testes</h4><div class="stat-value">${stats.tests}</div></div></div>
                <div class="stat-card"><div class="stat-icon orange"><span class="material-icons-round">article</span></div><div class="stat-info"><h4>Registros</h4><div class="stat-value">${stats.records}</div></div></div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><h3><span class="material-icons-round" style="font-size:18px">cloud_download</span> Backup & Restauração</h3></div>
                    <div class="card-body" style="display:flex;flex-direction:column;gap:var(--space-3)">
                        <p style="font-size:0.85rem;color:var(--text-secondary)">Exporte todos os dados (usuários, POPs, testes, progresso, anexos) em um único arquivo JSON.</p>
                        <button class="btn btn-primary" onclick="Admin.exportJSON()"><span class="material-icons-round">download</span> Exportar tudo (.json)</button>
                        <button class="btn btn-outline-dark" onclick="Admin.importJSON('merge')"><span class="material-icons-round">merge</span> Importar (mesclar)</button>
                        <button class="btn btn-outline-dark" onclick="Admin.importJSON('replace')"><span class="material-icons-round">restore</span> Importar (substituir)</button>
                        <button class="btn btn-outline-dark" onclick="Admin.exportCSV()"><span class="material-icons-round">table_view</span> Exportar registros (.csv)</button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header" style="display:flex;justify-content:space-between"><h3><span class="material-icons-round" style="font-size:18px">history</span> Snapshots</h3><button class="btn btn-outline btn-sm" onclick="Admin.createSnapshot()">Criar agora</button></div>
                    <div class="card-body">
                        ${snaps.length===0 ? '<p style="font-size:0.85rem;color:var(--text-muted)">Nenhum snapshot. Snapshots são criados automaticamente antes de operações destrutivas.</p>' : snaps.slice().reverse().map(s => `
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem">
                                <div>
                                    <strong>${s.label}</strong>
                                    <div style="font-size:0.75rem;color:var(--text-muted)">${new Date(s.createdAt).toLocaleString('pt-BR')}</div>
                                </div>
                                <button class="btn btn-ghost btn-sm" onclick="Admin.restoreSnapshot('${s.id}')"><span class="material-icons-round" style="font-size:18px">restore</span> Restaurar</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top:var(--space-6);border-color:var(--danger)">
                <div class="card-header"><h3 style="color:var(--danger)"><span class="material-icons-round" style="font-size:18px">warning</span> Zona de Risco</h3></div>
                <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-3)">
                    <p style="font-size:0.85rem;color:var(--text-secondary);max-width:60%">Restaurar dados padrão da plataforma. Um snapshot do estado atual é criado automaticamente antes.</p>
                    <button class="btn" style="background:var(--danger);color:white" onclick="Admin.factoryReset()"><span class="material-icons-round">restore</span> Restaurar Padrão</button>
                </div>
            </div>
        `;
    },

    exportJSON() {
        const data = DB.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `senior-academy-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        App.toast('Backup exportado', 'success');
    },

    importJSON(mode) {
        const msg = mode === 'replace'
            ? 'SUBSTITUIR todos os dados atuais? (snapshot será criado antes)'
            : 'Mesclar dados do arquivo com os atuais?';
        if (!confirm(msg)) return;
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = (e) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    DB.createSnapshot('pre-import');
                    DB.importAll(JSON.parse(reader.result), mode);
                    App.toast('Importação concluída', 'success');
                    App.navigate('admin');
                } catch (err) { App.toast('Erro: ' + err.message, 'error'); }
            };
            reader.readAsText(e.target.files[0]);
        };
        input.click();
    },

    exportCSV() {
        const records = DB.getLegalRecords();
        const rows = [['Data','Usuário','Tipo','Detalhes']];
        records.forEach(r => {
            const user = DB.getUser(r.userId);
            rows.push([
                new Date(r.timestamp).toLocaleString('pt-BR'),
                user?.name || r.userId,
                r.type,
                (r.details || '').replace(/"/g, '""')
            ]);
        });
        const csv = '﻿' + rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `registros-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },

    createSnapshot() {
        DB.createSnapshot('manual-' + new Date().toLocaleString('pt-BR'));
        App.toast('Snapshot criado', 'success');
        App.navigate('admin');
    },

    restoreSnapshot(id) {
        if (!confirm('Restaurar este snapshot? Os dados atuais serão substituídos.')) return;
        DB.createSnapshot('pre-restore');
        DB.restoreSnapshot(id);
        App.toast('Snapshot restaurado', 'success');
        App.navigate('admin');
    },

    factoryReset() {
        if (!confirm('Restaurar TODOS os dados padrão? Um snapshot do estado atual será salvo.')) return;
        DB.factoryReset();
        App.toast('Dados restaurados ao padrão', 'success');
        location.reload();
    },

    openBackup() {
        this.activeTab = 'data';
        App.navigate('admin');
    },

    // ===== HELPERS =====
    filterTable(tableId, query) {
        const q = query.toLowerCase();
        document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    },

    _escape(s) {
        return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }
};
