/* ========================================
   ANALYTICS — Dashboards e gráficos SVG
   ======================================== */

const Analytics = {

    render() {
        const data = this.computeAll();
        return `
            <div class="page-header">
                <div>
                    <h2>📈 Analytics</h2>
                    <p>Indicadores e relatórios da plataforma</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-outline-dark btn-sm" onclick="Analytics.exportReport()">
                        <span class="material-icons-round">file_download</span> Exportar relatório
                    </button>
                </div>
            </div>

            <div class="stat-grid">
                <div class="stat-card"><div class="stat-icon blue"><span class="material-icons-round">trending_up</span></div><div class="stat-info"><h4>Conclusão geral</h4><div class="stat-value">${data.overallCompletion}%</div></div></div>
                <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">check_circle</span></div><div class="stat-info"><h4>Aprovação testes</h4><div class="stat-value">${data.passRate}%</div></div></div>
                <div class="stat-card"><div class="stat-icon purple"><span class="material-icons-round">schedule</span></div><div class="stat-info"><h4>Atividades (30d)</h4><div class="stat-value">${data.last30}</div></div></div>
                <div class="stat-card"><div class="stat-icon orange"><span class="material-icons-round">workspace_premium</span></div><div class="stat-info"><h4>Certificados</h4><div class="stat-value">${data.certified}</div></div></div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><h3><span class="material-icons-round" style="font-size:18px">bar_chart</span> Progresso por Setor</h3></div>
                    <div class="card-body">${this.barChart(data.sectorProgress)}</div>
                </div>
                <div class="card">
                    <div class="card-header"><h3><span class="material-icons-round" style="font-size:18px">emoji_events</span> Ranking de Funcionários</h3></div>
                    <div class="card-body">${this.ranking(data.ranking)}</div>
                </div>
            </div>

            <div class="card" style="margin-top:var(--space-6)">
                <div class="card-header"><h3><span class="material-icons-round" style="font-size:18px">calendar_view_month</span> Atividade nos últimos 30 dias</h3></div>
                <div class="card-body">${this.heatmap(data.heatmap)}</div>
            </div>

            <div class="dashboard-grid" style="margin-top:var(--space-6)">
                <div class="card">
                    <div class="card-header"><h3><span class="material-icons-round" style="font-size:18px">menu_book</span> POPs Mais Lidos</h3></div>
                    <div class="card-body">${this.topList(data.topPops, 'popsRead', 'menu_book')}</div>
                </div>
                <div class="card">
                    <div class="card-header"><h3><span class="material-icons-round" style="font-size:18px">trending_down</span> POPs Pendentes (alerta)</h3></div>
                    <div class="card-body">${this.topList(data.pendingPops, 'pending', 'priority_high')}</div>
                </div>
            </div>
        `;
    },

    computeAll() {
        const users = DB.getUsers().filter(u => u.role !== 'admin');
        const pops = DB.getPOPs();
        const tests = DB.getTests();
        const trainings = DB.getTrainings();
        const results = DB.getTestResults();
        const records = DB.getLegalRecords();
        const progress = DB.getTrainingProgress();

        let totalItems = 0, doneItems = 0, certified = 0;
        const ranking = [];
        users.forEach(u => {
            const trail = trainings.find(t => t.role === u.role);
            if (!trail) return;
            const p = progress[u.id] || { popsRead: [], testsCompleted: [] };
            const total = trail.pops.length + trail.tests.length;
            const done = trail.pops.filter(x => p.popsRead.includes(x)).length +
                         trail.tests.filter(x => p.testsCompleted.includes(x)).length;
            totalItems += total; doneItems += done;
            if (total > 0 && done === total) certified++;
            ranking.push({
                name: u.name,
                role: DB.getRole(u.role)?.name || u.role,
                pct: total > 0 ? Math.round(done/total*100) : 0
            });
        });
        ranking.sort((a,b) => b.pct - a.pct);

        const overallCompletion = totalItems > 0 ? Math.round(doneItems/totalItems*100) : 0;
        const passRate = results.length > 0 ? Math.round(results.filter(r=>r.passed).length / results.length * 100) : 0;

        // Per sector
        const sectorProgress = DB.sectors.map(s => {
            const sectorPops = pops.filter(p => p.sector === s.id).map(p => p.id);
            if (!sectorPops.length) return null;
            let reads = 0, possible = 0;
            users.forEach(u => {
                const p = progress[u.id] || { popsRead: [] };
                possible += sectorPops.length;
                reads += sectorPops.filter(id => p.popsRead.includes(id)).length;
            });
            return {
                label: s.name,
                color: s.color,
                value: possible > 0 ? Math.round(reads/possible*100) : 0
            };
        }).filter(Boolean);

        // Last 30 days
        const now = Date.now();
        const last30 = records.filter(r => now - new Date(r.timestamp).getTime() < 30*86400000).length;

        // Heatmap (last 30 days)
        const heatmap = [];
        for (let i = 29; i >= 0; i--) {
            const day = new Date(now - i*86400000);
            const key = day.toISOString().slice(0,10);
            const count = records.filter(r => r.timestamp.slice(0,10) === key).length;
            heatmap.push({ date: key, count, label: day.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'}) });
        }

        // Top POPs lidos
        const popReadCount = {};
        Object.values(progress).forEach(p => (p.popsRead||[]).forEach(id => popReadCount[id] = (popReadCount[id]||0)+1));
        const topPops = Object.entries(popReadCount)
            .map(([id,c]) => ({ ...DB.getPOP(id), count: c }))
            .filter(p => p && p.title)
            .sort((a,b) => b.count - a.count).slice(0, 5);

        // POPs pendentes (zero leituras)
        const pendingPops = pops.filter(p => !popReadCount[p.id]).slice(0, 5).map(p => ({ ...p, count: 0 }));

        return { overallCompletion, passRate, last30, certified, sectorProgress, ranking, heatmap, topPops, pendingPops };
    },

    barChart(items) {
        if (!items.length) return '<p style="font-size:0.85rem;color:var(--text-muted)">Sem dados</p>';
        return `
            <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                ${items.map(it => `
                    <div>
                        <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:4px">
                            <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:${it.color}"></span>${it.label}</span>
                            <strong>${it.value}%</strong>
                        </div>
                        <div style="height:10px;background:var(--border-light);border-radius:var(--radius-full);overflow:hidden">
                            <div style="height:100%;width:${it.value}%;background:${it.color};border-radius:var(--radius-full);transition:width .8s"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    ranking(items) {
        if (!items.length) return '<p style="font-size:0.85rem;color:var(--text-muted)">Sem funcionários</p>';
        const medals = ['🥇','🥈','🥉'];
        return `
            <div style="display:flex;flex-direction:column;gap:var(--space-2)">
                ${items.slice(0,8).map((u,i) => `
                    <div style="display:flex;align-items:center;gap:var(--space-3);padding:8px;background:${i<3?'var(--primary-50)':'transparent'};border-radius:var(--radius-sm)">
                        <span style="font-size:1.2rem;width:24px;text-align:center">${medals[i] || (i+1)}</span>
                        <div style="flex:1;min-width:0">
                            <div style="font-weight:600;font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.name}</div>
                            <div style="font-size:0.7rem;color:var(--text-muted)">${u.role}</div>
                        </div>
                        <span class="badge ${u.pct===100?'badge-success':u.pct>=50?'badge-primary':'badge-warning'}">${u.pct}%</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    heatmap(days) {
        const max = Math.max(1, ...days.map(d => d.count));
        return `
            <div style="display:grid;grid-template-columns:repeat(30,1fr);gap:3px">
                ${days.map(d => {
                    const intensity = d.count === 0 ? 0 : Math.min(1, d.count / max);
                    const bg = d.count === 0
                        ? 'var(--border-light)'
                        : `rgba(37, 99, 235, ${0.2 + intensity*0.8})`;
                    return `<div title="${d.label}: ${d.count} atividade(s)" style="aspect-ratio:1;background:${bg};border-radius:3px;cursor:pointer"></div>`;
                }).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-muted);margin-top:6px">
                <span>${days[0].label}</span>
                <span>Hoje</span>
            </div>
        `;
    },

    topList(items, type, icon) {
        if (!items.length) return '<p style="font-size:0.85rem;color:var(--text-muted)">Sem dados</p>';
        return `
            <div style="display:flex;flex-direction:column;gap:var(--space-2)">
                ${items.map(p => `
                    <div style="display:flex;align-items:center;gap:var(--space-3);padding:8px 0;border-bottom:1px solid var(--border-light)">
                        <span class="material-icons-round" style="font-size:18px;color:var(--primary)">${icon}</span>
                        <div style="flex:1;min-width:0;font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</div>
                        <span class="badge ${type==='popsRead'?'badge-success':'badge-warning'}">${type==='popsRead'? p.count+' leituras':'0 leituras'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    exportReport() {
        const data = this.computeAll();
        const lines = [
            'RELATÓRIO ANALYTICS — Senior Academy',
            `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
            '',
            `Conclusão geral: ${data.overallCompletion}%`,
            `Taxa de aprovação: ${data.passRate}%`,
            `Funcionários certificados: ${data.certified}`,
            `Atividades nos últimos 30 dias: ${data.last30}`,
            '',
            '== Progresso por Setor ==',
            ...data.sectorProgress.map(s => `${s.label}: ${s.value}%`),
            '',
            '== Ranking ==',
            ...data.ranking.map((u,i) => `${i+1}. ${u.name} (${u.role}) — ${u.pct}%`)
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `relatorio-${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
