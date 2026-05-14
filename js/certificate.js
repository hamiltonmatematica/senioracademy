/* ========================================
   CERTIFICATE — Geração de certificados
   ======================================== */

const Certificate = {

    canIssue(userId) {
        const user = DB.getUser(userId);
        if (!user) return false;
        const trail = DB.getTrainings().find(t => t.role === user.role);
        if (!trail) return false;
        const p = DB.getUserProgress(userId);
        const total = trail.pops.length + trail.tests.length;
        const done = trail.pops.filter(x => p.popsRead.includes(x)).length +
                     trail.tests.filter(x => p.testsCompleted.includes(x)).length;
        return total > 0 && done === total;
    },

    issue(userId) {
        const user = DB.getUser(userId);
        if (!this.canIssue(userId)) {
            App.toast('Conclua toda a trilha para emitir o certificado', 'warning');
            return;
        }
        const trail = DB.getTrainings().find(t => t.role === user.role);
        const role = DB.getRole(user.role);
        const unit = DB.getUnits().find(u => u.id === user.unit);
        const results = DB.getTestResults().filter(r => r.userId === userId && r.passed);
        const avg = results.length ? Math.round(results.reduce((s,r)=>s+r.percentage,0)/results.length) : 0;
        const code = 'SA-' + userId.toUpperCase() + '-' + new Date().getFullYear() + '-' + (DB.get('cert_counter')||1000);
        DB.set('cert_counter', (DB.get('cert_counter')||1000) + 1);

        const w = window.open('', '_blank', 'width=1024,height=720');
        w.document.write(this._html({
            name: user.name,
            role: role?.name || user.role,
            unit: unit?.name || '—',
            trail: trail.title,
            date: new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' }),
            popsCount: trail.pops.length,
            testsCount: trail.tests.length,
            avgScore: avg,
            code
        }));
        w.document.close();
        DB.addLegalRecord(userId, 'certificado', `Certificado emitido: ${trail.title} — ${code}`);
        App.toast('Certificado gerado em nova janela', 'success');
    },

    _html(data) {
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificado — ${data.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <style>
            @page { size: A4 landscape; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; background: #f8fafc; }
            .cert {
                width: 297mm; height: 210mm; padding: 20mm;
                background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
                position: relative; overflow: hidden;
                border: 12px double #2563eb;
            }
            .cert::before, .cert::after {
                content: ''; position: absolute; width: 250px; height: 250px;
                border-radius: 50%; opacity: 0.08;
            }
            .cert::before { top: -100px; right: -100px; background: #2563eb; }
            .cert::after { bottom: -100px; left: -100px; background: #06b6d4; }
            .header { text-align: center; margin-bottom: 30px; }
            .seal { font-size: 60px; color: #2563eb; }
            .org { font-size: 12px; letter-spacing: 3px; color: #64748b; text-transform: uppercase; margin: 8px 0 4px; }
            h1 { font-family: 'Playfair Display', serif; font-size: 48px; color: #0f172a; letter-spacing: 2px; }
            .subtitle { font-size: 14px; color: #64748b; margin-top: 8px; }
            .body { text-align: center; margin-top: 30px; position: relative; z-index: 2; }
            .declares { font-size: 16px; color: #334155; }
            .name { font-family: 'Playfair Display', serif; font-size: 56px; color: #2563eb; margin: 20px 0; font-weight: 900; }
            .desc { font-size: 16px; color: #334155; line-height: 1.8; max-width: 180mm; margin: 0 auto; }
            .desc strong { color: #0f172a; }
            .meta { display: flex; justify-content: space-around; margin-top: 40px; padding: 20px; background: rgba(37,99,235,0.05); border-radius: 12px; }
            .meta-item { text-align: center; }
            .meta-val { font-size: 28px; font-weight: 700; color: #2563eb; }
            .meta-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
            .footer { position: absolute; bottom: 20mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; align-items: flex-end; }
            .sig { text-align: center; flex: 1; max-width: 200px; }
            .sig-line { border-top: 2px solid #334155; margin-bottom: 6px; }
            .sig-name { font-size: 12px; font-weight: 600; }
            .sig-role { font-size: 10px; color: #64748b; }
            .code { font-size: 10px; color: #94a3b8; font-family: monospace; }
            .print-btn {
                position: fixed; top: 20px; right: 20px;
                background: #2563eb; color: white; border: none;
                padding: 12px 20px; border-radius: 8px; font-weight: 600;
                cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.3);
                font-family: inherit;
            }
            @media print { .print-btn { display: none; } body { background: white; } }
        </style></head><body>
        <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
        <div class="cert">
            <div class="header">
                <div class="seal">🏛️</div>
                <div class="org">Senior Academy</div>
                <h1>CERTIFICADO</h1>
                <div class="subtitle">de Conclusão de Treinamento</div>
            </div>
            <div class="body">
                <p class="declares">Certificamos que</p>
                <h2 class="name">${data.name}</h2>
                <p class="desc">
                    exercendo a função de <strong>${data.role}</strong> na unidade <strong>${data.unit}</strong>,
                    concluiu com aproveitamento a trilha de treinamento <strong>"${data.trail}"</strong>,
                    composta por <strong>${data.popsCount} procedimentos operacionais padrão</strong> e
                    <strong>${data.testsCount} avaliações</strong>, em conformidade com as diretrizes de capacitação
                    e segurança operacional da instituição.
                </p>
                <div class="meta">
                    <div class="meta-item"><div class="meta-val">${data.popsCount}</div><div class="meta-lbl">POPs</div></div>
                    <div class="meta-item"><div class="meta-val">${data.testsCount}</div><div class="meta-lbl">Avaliações</div></div>
                    <div class="meta-item"><div class="meta-val">${data.avgScore}%</div><div class="meta-lbl">Aproveitamento</div></div>
                </div>
            </div>
            <div class="footer">
                <div class="sig">
                    <div class="sig-line"></div>
                    <div class="sig-name">Direção Técnica</div>
                    <div class="sig-role">Responsável Pedagógico</div>
                </div>
                <div style="text-align:center">
                    <div style="font-size:11px;color:#64748b">Emitido em</div>
                    <div style="font-size:14px;font-weight:600">${data.date}</div>
                    <div class="code" style="margin-top:8px">Cód: ${data.code}</div>
                </div>
                <div class="sig">
                    <div class="sig-line"></div>
                    <div class="sig-name">Coordenação</div>
                    <div class="sig-role">${data.unit}</div>
                </div>
            </div>
        </div>
        </body></html>`;
    }
};
