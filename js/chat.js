/* ========================================
   CHAT AI MODULE (RAG-simulated)
   ======================================== */

const Chat = {
    messages: [],

    renderChat() {
        const user = Auth.currentUser;
        const role = DB.getRole(user.role);
        const sectorName = role?.sector ? DB.getSector(role.sector)?.name : 'Todos os setores';

        return `
            <div class="page-header">
                <div>
                    <h2>🤖 Assistente de Treinamento</h2>
                    <p>Chat inteligente baseado nos POPs • ${sectorName}</p>
                </div>
            </div>
            <div class="chat-container">
                <div class="chat-header">
                    <div class="chat-status"></div>
                    <div>
                        <strong style="font-size:0.9rem">Assistente Senior Academy</strong>
                        <p style="font-size:0.7rem;color:var(--text-muted)">Online • Respostas baseadas nos POPs de ${sectorName}</p>
                    </div>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="chat-msg bot">
                        Olá, <strong>${user.name}</strong>! 👋<br><br>
                        Sou o assistente de treinamento da Senior Academy. Posso ajudar com dúvidas sobre os procedimentos (POPs) da sua função.<br><br>
                        <strong>Exemplos de perguntas:</strong><br>
                        • Como higienizar as mãos corretamente?<br>
                        • Quais são os riscos de escaras?<br>
                        • Qual a temperatura correta do banho?<br><br>
                        <em style="font-size:0.8rem;color:var(--text-muted)">Minhas respostas são baseadas exclusivamente nos POPs internos.</em>
                    </div>
                </div>
                <div class="chat-input-bar">
                    <input type="text" id="chat-input" placeholder="Digite sua pergunta..." onkeypress="if(event.key==='Enter')Chat.send()">
                    <button onclick="Chat.send()">
                        <span class="material-icons-round">send</span>
                    </button>
                </div>
            </div>
        `;
    },

    send() {
        const input = document.getElementById('chat-input');
        const question = input.value.trim();
        if (!question) return;
        input.value = '';

        // Add user message
        this.addMessage(question, 'user');

        // Show typing
        this.showTyping();

        // Simulate RAG
        setTimeout(() => {
            this.removeTyping();
            const response = this.generateResponse(question);
            this.addMessage(response.answer, 'bot', response.source);

            // Log
            DB.addChatLog(Auth.currentUser.id, question, response.answer);
        }, 800 + Math.random() * 1200);
    },

    addMessage(text, type, source) {
        const container = document.getElementById('chat-messages');
        const msg = document.createElement('div');
        msg.className = `chat-msg ${type}`;
        msg.innerHTML = text.replace(/\n/g, '<br>');
        if (source && type === 'bot') {
            msg.innerHTML += `<div class="msg-source">📋 Fonte: ${source}</div>`;
        }
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    },

    showTyping() {
        const container = document.getElementById('chat-messages');
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.id = 'typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    },

    removeTyping() {
        const el = document.getElementById('typing');
        if (el) el.remove();
    },

    // RAG-simulated response
    generateResponse(question) {
        const user = Auth.currentUser;
        const role = DB.getRole(user.role);
        const userSector = role?.sector;

        // Get relevant POPs
        let pops = DB.getPOPs();
        if (userSector && !Auth.isAdmin() && !Auth.isSupervisor()) {
            pops = pops.filter(p => p.sector === userSector);
        }

        // Simple keyword matching (RAG simulation)
        const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let bestPop = null;
        let bestScore = 0;

        const keywords = {
            'mao': ['pop1'], 'maos': ['pop1'], 'higieniz': ['pop1'], 'lavar': ['pop1'], 'sabonete': ['pop1'],
            'medicament': ['pop2'], 'remedio': ['pop2'], 'dose': ['pop2'], 'prescricao': ['pop2'],
            'sinais vitais': ['pop3'], 'pressao': ['pop3'], 'temperatura': ['pop3', 'pop8', 'pop11'], 'pulso': ['pop3'], 'saturacao': ['pop3'], 'oximetro': ['pop3'],
            'escara': ['pop4'], 'lesao': ['pop4'], 'pressao pele': ['pop4'], 'decubito': ['pop4'],
            'limpeza': ['pop5'], 'desinfec': ['pop5'], 'superficie': ['pop5'],
            'varredura': ['pop6'], 'mop': ['pop6'], 'piso': ['pop6', 'pop12'],
            'epi': ['pop7'], 'luva': ['pop7'], 'mascara': ['pop7'], 'equipamento protecao': ['pop7'],
            'refeicao': ['pop8'], 'comida': ['pop8'], 'dieta': ['pop8', 'pop13'], 'cardapio': ['pop8'],
            'estoque': ['pop9'], 'validade': ['pop9'],
            'cozinha': ['pop10'], 'bancada': ['pop10'], 'utensilios': ['pop10'],
            'banho': ['pop11'], 'higiene idoso': ['pop11'], 'chuveiro': ['pop11'],
            'queda': ['pop12'], 'cair': ['pop12'], 'grade': ['pop12'], 'calcado': ['pop12'],
            'alimentacao assistida': ['pop13'], 'engasgo': ['pop13'], 'engolir': ['pop13'], 'degluti': ['pop13']
        };

        let matchedPopIds = [];
        for (const [keyword, popIds] of Object.entries(keywords)) {
            if (q.includes(keyword)) {
                matchedPopIds.push(...popIds);
            }
        }

        // Find best matching POP
        if (matchedPopIds.length > 0) {
            const countMap = {};
            matchedPopIds.forEach(id => { countMap[id] = (countMap[id] || 0) + 1; });
            const sortedIds = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
            const topPopId = sortedIds[0][0];

            // Check if pop is available for this user
            const pop = pops.find(p => p.id === topPopId);
            if (pop) {
                bestPop = pop;
            } else {
                // Try to find in all pops for context
                bestPop = DB.getPOP(topPopId);
                if (bestPop && userSector && bestPop.sector !== userSector) {
                    return {
                        answer: `Essa pergunta está relacionada ao setor de <strong>${DB.getSector(bestPop.sector)?.name}</strong>, que não faz parte das suas atribuições.\n\nPor favor, consulte o responsável do setor para orientações.`,
                        source: null
                    };
                }
            }
        }

        if (bestPop) {
            return this.buildResponse(bestPop, q);
        }

        // No match found
        return {
            answer: `Desculpe, não encontrei um procedimento específico sobre isso nos POPs disponíveis para a sua função.\n\n🔹 <strong>Sugestão:</strong> Procure o seu supervisor ou responsável do setor para orientações.\n\n⚠️ <strong>Importante:</strong> Nunca execute procedimentos sem a devida orientação e treinamento.`,
            source: null
        };
    },

    buildResponse(pop, query) {
        const sector = DB.getSector(pop.sector);

        // Determine what kind of info to return
        let answer = '';

        if (query.includes('risco') || query.includes('perigo') || query.includes('cuidado')) {
            answer = `⚠️ <strong>Riscos - ${pop.title}</strong>\n\n`;
            if (pop.risks && pop.risks.length > 0) {
                pop.risks.forEach(r => { answer += `🔴 ${r}\n`; });
            }
            answer += `\n<strong>Atenção:</strong> Siga rigorosamente o POP para minimizar esses riscos.`;
        } else if (query.includes('checklist') || query.includes('verificar') || query.includes('conferir')) {
            answer = `✅ <strong>Checklist - ${pop.title}</strong>\n\n`;
            pop.checklist.forEach(item => { answer += `☐ ${item}\n`; });
        } else if (query.includes('passo') || query.includes('como') || query.includes('etapa') || query.includes('procedimento') || query.includes('fazer') || query.includes('correta')) {
            answer = `📋 <strong>${pop.title}</strong>\n\n${pop.description}\n\n<strong>Passo a passo:</strong>\n\n`;
            pop.steps.forEach((step, i) => {
                answer += `<strong>${i+1}.</strong> ${step}\n`;
            });
            if (pop.duration) {
                answer += `\n⏱️ Tempo estimado: ${pop.duration}`;
            }
        } else if (query.includes('tempo') || query.includes('duracao') || query.includes('quanto tempo') || query.includes('demora')) {
            answer = `⏱️ <strong>${pop.title}</strong>\n\nTempo estimado: <strong>${pop.duration}</strong>\n\nEtapas: ${pop.steps.length}`;
        } else {
            // General response
            answer = `📋 <strong>${pop.title}</strong>\n\n${pop.description}\n\n`;
            answer += `<strong>Resumo do procedimento:</strong>\n`;
            pop.steps.slice(0, 5).forEach((step, i) => {
                answer += `${i+1}. ${step}\n`;
            });
            if (pop.steps.length > 5) {
                answer += `... e mais ${pop.steps.length - 5} etapas.\n`;
            }
            if (pop.risks && pop.risks.length > 0) {
                answer += `\n⚠️ <strong>Riscos:</strong> ${pop.risks.join(', ')}`;
            }
            answer += `\n\n💡 Pergunte sobre "passo a passo", "checklist" ou "riscos" para mais detalhes.`;
        }

        return {
            answer,
            source: `POP: ${pop.title} — Setor: ${sector?.name}`
        };
    }
};
