/* ========================================
   DATABASE — LocalStorage-based
   ======================================== */

const DB = {
    // ===== STORAGE =====
    get(key) {
        try {
            return JSON.parse(localStorage.getItem(`sa_${key}`)) || null;
        } catch { return null; }
    },
    set(key, value) {
        localStorage.setItem(`sa_${key}`, JSON.stringify(value));
    },
    remove(key) {
        localStorage.removeItem(`sa_${key}`);
    },

    // ===== INITIALIZATION =====
    init() {
        if (!this.get('initialized')) {
            this.seedUsers();
            this.seedPOPs();
            this.seedTests();
            this.seedTrainings();
            this.seedUnits();
            this.set('initialized', true);
        }
    },

    // ===== SECTORS =====
    sectors: [
        { id: 'saude', name: 'Saúde', icon: '🏥', color: '#ef4444', materialIcon: 'health_and_safety' },
        { id: 'assistencial', name: 'Assistencial', icon: '🤝', color: '#f59e0b', materialIcon: 'volunteer_activism' },
        { id: 'alimentacao', name: 'Alimentação', icon: '🍽️', color: '#10b981', materialIcon: 'restaurant' },
        { id: 'limpeza', name: 'Limpeza', icon: '🧹', color: '#06b6d4', materialIcon: 'cleaning_services' },
        { id: 'administrativo', name: 'Administrativo', icon: '📋', color: '#6366f1', materialIcon: 'business_center' },
        { id: 'comercial', name: 'Comercial', icon: '🤝', color: '#ec4899', materialIcon: 'storefront' },
        { id: 'gestao', name: 'Gestão', icon: '📊', color: '#8b5cf6', materialIcon: 'analytics' }
    ],

    // ===== ROLES =====
    roles: [
        { id: 'admin', name: 'Diretor/Admin', level: 3 },
        { id: 'supervisor', name: 'Supervisor/Líder', level: 2 },
        { id: 'tec_enfermagem', name: 'Técnico de Enfermagem', level: 1, sector: 'saude' },
        { id: 'cuidador', name: 'Cuidador', level: 1, sector: 'assistencial' },
        { id: 'cozinheiro', name: 'Cozinheiro(a)', level: 1, sector: 'alimentacao' },
        { id: 'zelador', name: 'Zelador(a)', level: 1, sector: 'limpeza' },
        { id: 'recepcionista', name: 'Recepcionista', level: 1, sector: 'administrativo' },
        { id: 'comercial', name: 'Consultor Comercial', level: 1, sector: 'comercial' }
    ],

    // ===== SEED USERS =====
    seedUsers() {
        const users = [
            {
                id: 'u1', name: 'Dr. Carlos Silva', email: 'admin@senior.com', password: 'admin123',
                role: 'admin', sector: null, unit: 'unit1', hireDate: '2024-01-15',
                roleHistory: [{ role: 'admin', date: '2024-01-15' }]
            },
            {
                id: 'u2', name: 'Ana Supervisora', email: 'supervisor@senior.com', password: 'super123',
                role: 'supervisor', sector: null, unit: 'unit1', hireDate: '2024-02-01',
                roleHistory: [{ role: 'supervisor', date: '2024-02-01' }]
            },
            {
                id: 'u3', name: 'Maria Enfermeira', email: 'maria@senior.com', password: 'func123',
                role: 'tec_enfermagem', sector: 'saude', unit: 'unit1', hireDate: '2024-03-10',
                roleHistory: [{ role: 'tec_enfermagem', date: '2024-03-10' }]
            },
            {
                id: 'u4', name: 'João Cuidador', email: 'joao@senior.com', password: 'func123',
                role: 'cuidador', sector: 'assistencial', unit: 'unit1', hireDate: '2024-04-05',
                roleHistory: [{ role: 'cuidador', date: '2024-04-05' }]
            },
            {
                id: 'u5', name: 'Rosa Cozinheira', email: 'rosa@senior.com', password: 'func123',
                role: 'cozinheiro', sector: 'alimentacao', unit: 'unit1', hireDate: '2024-05-20',
                roleHistory: [{ role: 'cozinheiro', date: '2024-05-20' }]
            },
            {
                id: 'u6', name: 'Pedro Zelador', email: 'pedro@senior.com', password: 'func123',
                role: 'zelador', sector: 'limpeza', unit: 'unit1', hireDate: '2024-06-01',
                roleHistory: [{ role: 'zelador', date: '2024-06-01' }]
            }
        ];
        this.set('users', users);
    },

    // ===== SEED POPs =====
    seedPOPs() {
        const pops = [
            // SAÚDE
            {
                id: 'pop1', sector: 'saude', title: 'Higienização das Mãos',
                description: 'Procedimento padrão de higienização das mãos conforme normas de biossegurança. Duração: 40 a 60 segundos.',
                steps: [
                    'Molhe as mãos com água corrente',
                    'Aplique sabonete líquido na palma da mão',
                    'Ensaboe as palmas das mãos friccionando uma contra a outra',
                    'Esfregue a palma direita sobre o dorso esquerdo com os dedos entrelaçados e vice-versa',
                    'Entrelace os dedos e friccione os espaços interdigitais',
                    'Esfregue as polpas digitais e unhas contra a palma da mão oposta',
                    'Friccione os polegares com movimentos circulares',
                    'Esfregue os punhos com movimentos circulares',
                    'Enxágue bem sob água corrente',
                    'Seque com papel toalha descartável',
                    'Use o papel toalha para fechar a torneira'
                ],
                checklist: ['Sabonete líquido disponível', 'Papel toalha disponível', 'Lixeira com pedal próxima', 'Cartaz de orientação fixado'],
                type: 'procedimento', risks: ['Contaminação cruzada', 'Infecção hospitalar'],
                duration: '40-60 seg', videoUrl: ''
            },
            {
                id: 'pop2', sector: 'saude', title: 'Administração de Medicamentos',
                description: 'Procedimento seguro para administração de medicamentos conforme prescrição médica.',
                steps: [
                    'Conferir a prescrição médica (nome do paciente, medicamento, dose, via, horário)',
                    'Verificar os 9 certos: paciente, medicamento, dose, via, hora, documentação, ação, forma, resposta',
                    'Higienizar as mãos conforme POP de higienização',
                    'Separar o medicamento conferindo rótulo e validade',
                    'Identificar o residente (perguntar nome completo e data de nascimento)',
                    'Posicionar o residente adequadamente',
                    'Administrar o medicamento pela via prescrita',
                    'Descartar materiais no local adequado',
                    'Registrar a administração no prontuário',
                    'Observar possíveis reações adversas nos próximos 30 minutos'
                ],
                checklist: ['Prescrição atualizada', 'Pulseira de identificação conferida', 'Via de administração correta', 'Horário conferido', 'Prontuário atualizado'],
                type: 'procedimento', risks: ['Erro de medicação', 'Reação alérgica', 'Subdose ou superdose'],
                duration: '10-15 min', videoUrl: ''
            },
            {
                id: 'pop3', sector: 'saude', title: 'Monitoramento de Sinais Vitais',
                description: 'Aferição periódica dos sinais vitais dos residentes para monitoramento contínuo.',
                steps: [
                    'Lavar as mãos conforme protocolo',
                    'Identificar o residente e explicar o procedimento',
                    'Verificar pressão arterial com esfigmomanômetro calibrado',
                    'Aferir temperatura axilar (manter termômetro por 3-5 minutos)',
                    'Contar frequência cardíaca (pulso radial por 60 segundos)',
                    'Contar frequência respiratória (por 60 segundos, sem que o residente perceba)',
                    'Verificar saturação de oxigênio com oxímetro',
                    'Avaliar nível de dor (escala de 0 a 10)',
                    'Registrar todos os valores no prontuário',
                    'Comunicar alterações ao enfermeiro responsável imediatamente'
                ],
                checklist: ['Esfigmomanômetro calibrado', 'Termômetro funcionando', 'Oxímetro com bateria', 'Planilha de registro disponível'],
                type: 'procedimento', risks: ['Não identificar sinais de alerta', 'Registro incorreto'],
                duration: '10-15 min', videoUrl: ''
            },
            {
                id: 'pop4', sector: 'saude', title: 'Prevenção de Escaras',
                description: 'Protocolo de prevenção de lesões por pressão em residentes acamados ou com mobilidade reduzida.',
                steps: [
                    'Avaliar risco de escara usando escala de Braden na admissão',
                    'Realizar mudança de decúbito a cada 2 horas',
                    'Utilizar coxins e travesseiros para aliviar pontos de pressão',
                    'Manter lençóis esticados e sem dobras',
                    'Hidratar a pele do residente com creme hidratante após banho',
                    'Inspecionar diariamente a pele em áreas vulneráveis (sacro, calcâneos, cotovelos)',
                    'Manter o residente seco e limpo',
                    'Garantir nutrição adequada (proteínas e vitaminas)',
                    'Registrar alterações na pele no prontuário',
                    'Comunicar ao enfermeiro qualquer vermelhidão persistente'
                ],
                checklist: ['Escala de Braden preenchida', 'Cronograma de mudança de decúbito', 'Creme hidratante disponível', 'Coxins em bom estado'],
                type: 'procedimento', risks: ['Lesão por pressão', 'Infecção secundária'],
                duration: 'Contínuo', videoUrl: ''
            },

            // LIMPEZA
            {
                id: 'pop5', sector: 'limpeza', title: 'Limpeza e Desinfecção de Superfícies',
                description: 'Procedimento padrão de limpeza e desinfecção de superfícies em ambientes de saúde.',
                steps: [
                    'Colocar EPIs: luvas de borracha, avental, máscara',
                    'Remover sujidade visível com pano úmido e detergente neutro',
                    'Preparar solução desinfetante conforme diluição indicada',
                    'Aplicar desinfetante na superfície com pano limpo',
                    'Seguir técnica unidirecional (do mais limpo para o mais sujo)',
                    'Deixar o desinfetante agir pelo tempo indicado (mínimo 10 minutos)',
                    'Secar com pano limpo se necessário',
                    'Descartar luvas e lavar as mãos',
                    'Registrar a limpeza no checklist do setor'
                ],
                checklist: ['EPIs disponíveis', 'Solução desinfetante preparada', 'Panos limpos separados', 'Checklist do setor atualizado'],
                type: 'procedimento', risks: ['Contaminação de superfícies', 'Reação a produtos químicos'],
                duration: '15-30 min', videoUrl: ''
            },
            {
                id: 'pop6', sector: 'limpeza', title: 'Técnica de Varredura Úmida',
                description: 'Método correto de varredura úmida para evitar dispersão de partículas e microrganismos.',
                steps: [
                    'Colocar EPIs adequados',
                    'Umedecer o mop/pano com água e detergente',
                    'Iniciar a varredura dos cantos para o centro',
                    'Usar movimentos em "S" (zigue-zague) sem levantar o mop',
                    'Nunca varrer a seco em ambientes de saúde',
                    'Trocar a água quando estiver visivelmente suja',
                    'Sinalizar o piso molhado para evitar quedas',
                    'Após secar, recolher a sinalização'
                ],
                checklist: ['Mop e balde limpos', 'Placa de sinalização de piso molhado', 'Detergente neutro', 'EPIs vestidos'],
                type: 'procedimento', risks: ['Queda de residentes', 'Dispersão de microrganismos'],
                duration: '20-40 min', videoUrl: ''
            },
            {
                id: 'pop7', sector: 'limpeza', title: 'Uso Correto de EPIs',
                description: 'Orientações sobre uso adequado de Equipamentos de Proteção Individual na limpeza.',
                steps: [
                    'Identificar os EPIs necessários para a atividade',
                    'Vestir o avental ou jaleco',
                    'Calçar as luvas de borracha (verificar integridade)',
                    'Colocar a máscara PFF2 quando necessário',
                    'Usar óculos de proteção ao manusear produtos químicos',
                    'Calçar botas de borracha em áreas molhadas',
                    'Ao finalizar: retirar na ordem inversa (luvas por último)',
                    'Higienizar as mãos após retirar os EPIs',
                    'Armazenar EPIs limpos em local adequado'
                ],
                checklist: ['Todos os EPIs disponíveis', 'EPIs em bom estado de conservação', 'Tamanhos adequados para cada funcionário'],
                type: 'procedimento', risks: ['Exposição a agentes químicos', 'Contaminação'],
                duration: '5 min', videoUrl: ''
            },

            // ALIMENTAÇÃO
            {
                id: 'pop8', sector: 'alimentacao', title: 'Preparo de Refeições Adaptadas',
                description: 'Preparação de refeições respeitando restrições alimentares e consistência adequada para idosos.',
                steps: [
                    'Verificar o cardápio do dia e as restrições alimentares de cada residente',
                    'Consultar fichas de dietas especiais (diabéticos, hipertensos, disfágicos)',
                    'Higienizar vegetais com solução clorada (1 colher de sopa para 1 litro, 15 min)',
                    'Preparar as refeições conforme as consistências prescritas (normal, pastosa, líquida)',
                    'Temperar com pouco sal e sem pimenta',
                    'Verificar a temperatura dos alimentos antes de servir (acima de 60°C quentes, abaixo de 10°C frios)',
                    'Identificar pratos com restrições especiais',
                    'Servir em louça adequada e com talheres adaptados quando necessário',
                    'Registrar sobras e o aceite alimentar dos residentes'
                ],
                checklist: ['Cardápio do dia conferido', 'Fichas de dietas verificadas', 'Vegetais higienizados', 'Temperaturas aferidas'],
                type: 'procedimento', risks: ['Engasgo por consistência inadequada', 'Reação alérgica', 'Desnutrição'],
                duration: '60-90 min', videoUrl: ''
            },
            {
                id: 'pop9', sector: 'alimentacao', title: 'Controle de Estoque',
                description: 'Gerenciamento de estoque de alimentos garantindo qualidade e segurança.',
                steps: [
                    'Verificar estoque diariamente',
                    'Registrar entradas e saídas de produtos',
                    'Conferir datas de validade de todos os itens',
                    'Aplicar sistema PVPS (Primeiro que Vence, Primeiro que Sai)',
                    'Armazenar alimentos conforme temperatura adequada',
                    'Separar alimentos por categoria (carnes, laticínios, secos, frutas)',
                    'Manter registro de temperatura de geladeiras e freezers (2x ao dia)',
                    'Solicitar reposição quando o estoque mínimo for atingido',
                    'Descartar imediatamente qualquer alimento fora da validade'
                ],
                checklist: ['Planilha de estoque atualizada', 'Temperaturas registradas', 'Datas de validade conferidas', 'Pedido de reposição feito se necessário'],
                type: 'procedimento', risks: ['Alimento vencido', 'Contaminação por armazenamento incorreto'],
                duration: '30 min', videoUrl: ''
            },
            {
                id: 'pop10', sector: 'alimentacao', title: 'Higiene da Cozinha',
                description: 'Protocolo de higienização e limpeza da cozinha conforme normas sanitárias.',
                steps: [
                    'Limpar e desinfetar todas as bancadas antes e depois do preparo',
                    'Lavar utensílios com detergente e água quente',
                    'Higienizar tábuas de corte separadas para carnes e vegetais',
                    'Limpar equipamentos (fogão, forno, micro-ondas) após cada uso',
                    'Lavar pisos com detergente e desinfetante ao final do turno',
                    'Limpar ralos e grelhas semanalmente',
                    'Controlar pragas com telas nas janelas e portas',
                    'Descartar lixo orgânico em lixeira com pedal e tampa',
                    'Manter uniformes limpos e cabelos protegidos com touca'
                ],
                checklist: ['Bancadas desinfetadas', 'Tábuas higienizadas', 'Pisos lavados', 'Lixo descartado adequadamente', 'Uniformes limpos'],
                type: 'procedimento', risks: ['Contaminação alimentar', 'Infestação de pragas'],
                duration: '30-45 min', videoUrl: ''
            },

            // ASSISTENCIAL
            {
                id: 'pop11', sector: 'assistencial', title: 'Higiene do Idoso',
                description: 'Protocolo de banho e higiene pessoal do residente com dignidade e segurança.',
                steps: [
                    'Verificar sinais vitais antes do banho',
                    'Preparar os materiais (toalha, sabonete, shampoo, roupas limpas)',
                    'Ajustar a temperatura da água (37-38°C)',
                    'Auxiliar o residente na locomoção até o banheiro',
                    'Usar cadeira de banho se necessário',
                    'Lavar o corpo de cima para baixo, das áreas mais limpas para as mais sujas',
                    'Secar bem, especialmente entre os dedos e dobras de pele',
                    'Aplicar hidratante corporal',
                    'Vestir roupas limpas e confortáveis',
                    'Pentear cabelos e verificar unhas',
                    'Aplicar fralda geriátrica se necessário',
                    'Registrar o banho no prontuário'
                ],
                checklist: ['Materiais separados', 'Água na temperatura adequada', 'Cadeira de banho limpa', 'Barras de apoio firmes', 'Piso antiderrapante'],
                type: 'procedimento', risks: ['Queda no banheiro', 'Hipotermia', 'Lesões de pele'],
                duration: '30-45 min', videoUrl: ''
            },
            {
                id: 'pop12', sector: 'assistencial', title: 'Prevenção de Quedas',
                description: 'Protocolo de prevenção de quedas para segurança dos residentes.',
                steps: [
                    'Avaliar risco de queda na admissão (Escala de Morse)',
                    'Identificar residentes com alto risco com pulseira colorida',
                    'Manter cama na posição mais baixa com grades laterais',
                    'Garantir iluminação adequada em todos os ambientes, especialmente à noite',
                    'Instalar barras de apoio nos banheiros e corredores',
                    'Manter pisos secos e sem obstáculos',
                    'Usar calçados antiderrapantes nos residentes',
                    'Acompanhar residentes com instabilidade durante locomoção',
                    'Orientar uso de campainha/sinalizador na cama',
                    'Registrar qualquer queda no prontuário e comunicar imediatamente'
                ],
                checklist: ['Escala de Morse preenchida', 'Grades da cama levantadas', 'Barras de apoio firmes', 'Pisos secos', 'Calçados adequados'],
                type: 'procedimento', risks: ['Fratura', 'Traumatismo craniano', 'Perda de mobilidade'],
                duration: 'Contínuo', videoUrl: ''
            },
            {
                id: 'pop13', sector: 'assistencial', title: 'Alimentação Assistida',
                description: 'Assistência na alimentação de residentes com dificuldade de alimentação independente.',
                steps: [
                    'Lavar as mãos antes de iniciar',
                    'Posicionar o residente sentado a 90° ou elevação mínima de 45°',
                    'Verificar se a consistência da dieta é a prescrita',
                    'Oferecer pequenas porções por vez',
                    'Respeitar o ritmo do residente, sem apressá-lo',
                    'Verificar se o residente engoliu antes de oferecer a próxima porção',
                    'Oferecer líquidos entre as porções',
                    'Higienizar a boca após a refeição',
                    'Manter o residente sentado por 30 minutos após a refeição',
                    'Registrar o aceite alimentar e quantidade ingerida'
                ],
                checklist: ['Dieta na consistência correta', 'Residente posicionado corretamente', 'Utensílios adaptados disponíveis', 'Registro de aceite pronto'],
                type: 'procedimento', risks: ['Engasgo', 'Aspiração pulmonar', 'Desnutrição'],
                duration: '30-45 min', videoUrl: ''
            }
        ];
        this.set('pops', pops);
    },

    // ===== SEED TESTS =====
    seedTests() {
        const tests = [
            {
                id: 'test1', popId: 'pop1', title: 'Teste: Higienização das Mãos',
                questions: [
                    { q: 'Qual o tempo mínimo recomendado para higienização das mãos?', options: ['10 segundos', '20 segundos', '40 segundos', '2 minutos'], correct: 2 },
                    { q: 'Qual produto deve ser usado na higienização?', options: ['Sabonete em barra', 'Sabonete líquido', 'Álcool em gel apenas', 'Água sanitária'], correct: 1 },
                    { q: 'Qual a primeira etapa da higienização?', options: ['Aplicar sabonete', 'Molhar as mãos', 'Esfregar os dedos', 'Secar com papel'], correct: 1 },
                    { q: 'Como deve ser fechada a torneira após a higienização?', options: ['Com as mãos limpas', 'Com o cotovelo', 'Com papel toalha', 'Não precisa fechar'], correct: 2 },
                    { q: 'Quando NÃO é necessário lavar as mãos?', options: ['Antes de administrar medicamentos', 'Após usar luvas', 'Ao chegar ao trabalho', 'Sempre é necessário'], correct: 3 },
                    { q: 'Que tipo de papel toalha deve ser usado?', options: ['Reutilizável', 'Descartável', 'De pano', 'Qualquer um'], correct: 1 },
                    { q: 'As unhas devem estar:', options: ['Longas e pintadas', 'Curtas e limpas', 'Com esmalte escuro', 'Não importa'], correct: 1 },
                    { q: 'O álcool em gel substitui a lavagem das mãos quando:', options: ['Sempre', 'Quando não há sujidade visível', 'Nunca', 'Apenas ao sair do quarto'], correct: 1 },
                    { q: 'Qual área das mãos é mais esquecida na higienização?', options: ['Palmas', 'Dorso', 'Pontas dos dedos e unhas', 'Punhos'], correct: 2 },
                    { q: 'O que deve estar disponível próximo à pia?', options: ['Toalha de rosto', 'Papel toalha e sabonete líquido', 'Sabão em pedra', 'Nada especial'], correct: 1 }
                ]
            },
            {
                id: 'test2', popId: 'pop2', title: 'Teste: Administração de Medicamentos',
                questions: [
                    { q: 'Quantos "certos" devemos verificar na administração de medicamentos?', options: ['5', '7', '9', '3'], correct: 2 },
                    { q: 'Qual é o primeiro passo antes de administrar um medicamento?', options: ['Preparar o medicamento', 'Conferir a prescrição médica', 'Chamar o paciente', 'Lavar as mãos'], correct: 1 },
                    { q: 'Como devemos identificar o residente?', options: ['Pelo número do quarto', 'Pelo nome completo e data de nascimento', 'Pela aparência', 'Pelo leito'], correct: 1 },
                    { q: 'O que verificar no rótulo do medicamento?', options: ['Somente o nome', 'Nome, dose e validade', 'Apenas a validade', 'A cor do comprimido'], correct: 1 },
                    { q: 'Após administrar, deve-se observar o residente por:', options: ['5 minutos', '15 minutos', '30 minutos', '1 hora'], correct: 2 },
                    { q: 'Onde registrar a administração?', options: ['Em um caderno pessoal', 'No prontuário', 'No quadro branco', 'Não precisa registrar'], correct: 1 },
                    { q: 'Se o residente recusar o medicamento, o que fazer?', options: ['Forçar a tomar', 'Colocar na comida escondido', 'Registrar e comunicar ao enfermeiro', 'Ignorar'], correct: 2 },
                    { q: 'Via oral significa administrar por:', options: ['Injeção', 'Boca', 'Nariz', 'Pele'], correct: 1 },
                    { q: 'O que significa verificar a "via" do medicamento?', options: ['O caminho até a farmácia', 'O método de administração', 'A cidade de fabricação', 'O horário'], correct: 1 },
                    { q: 'Medicamento com validade vencida deve ser:', options: ['Usado normalmente', 'Devolvido à farmácia e descartado', 'Guardado para emergência', 'Dado em dose menor'], correct: 1 }
                ]
            },
            {
                id: 'test3', popId: 'pop3', title: 'Teste: Monitoramento de Sinais Vitais',
                questions: [
                    { q: 'Por quanto tempo deve-se contar o pulso radial?', options: ['15 segundos', '30 segundos', '60 segundos', '10 segundos'], correct: 2 },
                    { q: 'Qual é a faixa normal de pressão arterial para idosos?', options: ['80/40 mmHg', '120/80 a 140/90 mmHg', '200/120 mmHg', '90/50 mmHg'], correct: 1 },
                    { q: 'A temperatura axilar normal é em torno de:', options: ['34°C', '36-37°C', '39°C', '40°C'], correct: 1 },
                    { q: 'O oxímetro mede:', options: ['Pressão arterial', 'Temperatura', 'Saturação de oxigênio', 'Glicemia'], correct: 2 },
                    { q: 'Como contar a frequência respiratória?', options: ['Pedir ao residente contar', 'Observar sem que ele perceba', 'Usar estetoscópio apenas', 'Não é possível'], correct: 1 },
                    { q: 'Alterações nos sinais vitais devem ser comunicadas a:', options: ['Família primeiro', 'Enfermeiro responsável imediatamente', 'No dia seguinte', 'Apenas no prontuário'], correct: 1 },
                    { q: 'A escala de dor vai de:', options: ['1 a 5', '0 a 100', '0 a 10', 'A a F'], correct: 2 },
                    { q: 'O esfigmomanômetro deve estar:', options: ['Calibrado', 'Sem calibração', 'Antigo', 'De pulso apenas'], correct: 0 },
                    { q: 'Quantas vezes ao dia devem ser verificados os sinais vitais em residentes estáveis?', options: ['1 vez', '2-3 vezes conforme prescrição', 'A cada hora', 'Semanalmente'], correct: 1 },
                    { q: 'Saturação de oxigênio abaixo de quanto é preocupante?', options: ['98%', '95%', '90%', '85%'], correct: 2 }
                ]
            },
            {
                id: 'test4', popId: 'pop5', title: 'Teste: Limpeza e Desinfecção',
                questions: [
                    { q: 'Qual a ordem correta da limpeza?', options: ['Do sujo para o limpo', 'Do limpo para o sujo', 'Tanto faz', 'Do centro para as bordas'], correct: 1 },
                    { q: 'Qual EPI é obrigatório na limpeza?', options: ['Apenas luvas', 'Luvas, avental e máscara', 'Somente avental', 'Nenhum'], correct: 1 },
                    { q: 'A técnica unidirecional significa:', options: ['Limpar em círculos', 'Limpar em uma direção, do limpo para o sujo', 'Limpar de qualquer forma', 'Limpar de baixo para cima'], correct: 1 },
                    { q: 'Tempo mínimo de ação do desinfetante:', options: ['1 minuto', '5 minutos', '10 minutos', '30 minutos'], correct: 2 },
                    { q: 'O que fazer primeiro ao limpar uma superfície?', options: ['Aplicar desinfetante', 'Remover sujidade visível', 'Secar', 'Enxaguar com água'], correct: 1 },
                    { q: 'Após terminar a limpeza, deve-se:', options: ['Guardar os EPIs usados', 'Descartar luvas e lavar as mãos', 'Ir embora', 'Nada'], correct: 1 },
                    { q: 'A diluição do desinfetante deve seguir:', options: ['Sua preferência', 'A indicação do fabricante', 'Sempre em dobro', 'A menor concentração'], correct: 1 },
                    { q: 'Os panos de limpeza devem ser:', options: ['Reutilizados sem lavar', 'Limpos e separados por área', 'Todos iguais', 'Secos'], correct: 1 },
                    { q: 'A desinfecção deve ser feita:', options: ['Semanalmente', 'Antes e após cada uso', 'Mensalmente', 'Somente se visível sujeira'], correct: 1 },
                    { q: 'O checklist de limpeza serve para:', options: ['Decoração', 'Registrar e garantir que tudo foi feito', 'Punir funcionários', 'Nada importante'], correct: 1 }
                ]
            },
            {
                id: 'test5', popId: 'pop11', title: 'Teste: Higiene do Idoso',
                questions: [
                    { q: 'Qual deve ser a temperatura da água do banho?', options: ['30-32°C', '37-38°C', '42-45°C', 'Tanto faz'], correct: 1 },
                    { q: 'O que verificar antes do banho?', options: ['Horóscopo', 'Sinais vitais', 'O cardápio', 'Nada'], correct: 1 },
                    { q: 'A lavagem do corpo deve ser feita:', options: ['De baixo para cima', 'De cima para baixo', 'Aleatoriamente', 'Só na frente'], correct: 1 },
                    { q: 'Após o banho, é importante:', options: ['Deixar secando ao ar', 'Secar bem, especialmente entre dedos e dobras', 'Usar ventilador', 'Não secar'], correct: 1 },
                    { q: 'A cadeira de banho deve ser usada quando:', options: ['Sempre', 'Quando o residente tem instabilidade', 'Nunca', 'Somente homens'], correct: 1 },
                    { q: 'O banho deve ser registrado em:', options: ['Caderno pessoal', 'Prontuário', 'Não precisa registrar', 'WhatsApp'], correct: 1 },
                    { q: 'O piso do banheiro deve ser:', options: ['Encerado', 'Antiderrapante', 'De madeira', 'Tanto faz'], correct: 1 },
                    { q: 'O hidratante deve ser aplicado:', options: ['Nunca', 'Antes do banho', 'Após o banho', 'Somente nos pés'], correct: 2 },
                    { q: 'A privacidade do residente durante o banho:', options: ['Não importa', 'Deve ser sempre respeitada', 'É exagero', 'Depende da idade'], correct: 1 },
                    { q: 'Barras de apoio no banheiro devem ser:', options: ['Decorativas', 'Firmes e resistentes', 'De plástico', 'Removíveis'], correct: 1 }
                ]
            },
            {
                id: 'test6', popId: 'pop12', title: 'Teste: Prevenção de Quedas',
                questions: [
                    { q: 'Qual escala avalia risco de queda?', options: ['Braden', 'Morse', 'Glasgow', 'Norton'], correct: 1 },
                    { q: 'A cama deve ficar em que posição?', options: ['Alta', 'Mais baixa possível', 'Inclinada', 'Tanto faz'], correct: 1 },
                    { q: 'Calçados dos residentes devem ser:', options: ['De salto', 'Antiderrapantes', 'Abertos', 'Sem meias'], correct: 1 },
                    { q: 'Iluminação noturna deve ser:', options: ['Apagada', 'Adequada e com luz de sentinela', 'Muito forte', 'Somente no corredor'], correct: 1 },
                    { q: 'Ao identificar piso molhado, deve-se:', options: ['Ignorar', 'Sinalizar e secar imediatamente', 'Esperar secar sozinho', 'Avisar depois'], correct: 1 },
                    { q: 'As grades laterais da cama devem estar:', options: ['Abaixadas', 'Levantadas quando o residente está deitado', 'Removidas', 'Decorativas'], correct: 1 },
                    { q: 'Após uma queda, a primeira ação é:', options: ['Levantar o residente', 'Avaliar e não mover sem avaliação', 'Dar água', 'Ignorar'], correct: 1 },
                    { q: 'Objetos no chão do corredor devem ser:', options: ['Ignorados', 'Retirados imediatamente', 'Sinalizados', 'Empurrados para o canto'], correct: 1 },
                    { q: 'Residentes com alto risco devem usar:', options: ['Pulseira colorida de identificação', 'Nada diferente', 'Capacete', 'Não sair do quarto'], correct: 0 },
                    { q: 'Toda queda deve ser:', options: ['Escondida', 'Registrada no prontuário e comunicada', 'Comentada no almoço', 'Esquecida'], correct: 1 }
                ]
            },
            {
                id: 'test7', popId: 'pop8', title: 'Teste: Preparo de Refeições Adaptadas',
                questions: [
                    { q: 'Antes de preparar, deve-se verificar:', options: ['O tempo lá fora', 'Cardápio e restrições alimentares', 'O preço dos ingredientes', 'Nada'], correct: 1 },
                    { q: 'Vegetais devem ser higienizados com:', options: ['Água da torneira', 'Solução clorada', 'Detergente', 'Álcool'], correct: 1 },
                    { q: 'Alimentos quentes devem ser servidos acima de:', options: ['40°C', '50°C', '60°C', '70°C'], correct: 2 },
                    { q: 'Dieta pastosa é indicada para:', options: ['Todos', 'Residentes com dificuldade de mastigação/deglutição', 'Apenas bebês', 'Funcionários'], correct: 1 },
                    { q: 'Temperos fortes como pimenta:', options: ['São recomendados', 'Devem ser evitados', 'Podem ser usados à vontade', 'Somente no jantar'], correct: 1 },
                    { q: 'O aceite alimentar deve ser:', options: ['Ignorado', 'Registrado', 'Não importa', 'Apenas comentado'], correct: 1 },
                    { q: 'Talheres adaptados são usados quando:', options: ['Sempre', 'Quando o residente tem dificuldade motora', 'Nunca', 'Para decorar'], correct: 1 },
                    { q: 'Residente diabético não deve receber:', options: ['Proteínas', 'Açúcar em excesso', 'Água', 'Legumes'], correct: 1 },
                    { q: 'Sobras de alimentos devem ser:', options: ['Reaproveitadas sempre', 'Descartadas conforme protocolo', 'Guardadas sem data', 'Misturadas'], correct: 1 },
                    { q: 'Pratos com restrições devem ser:', options: ['Iguais aos demais', 'Identificados', 'Servidos por último', 'Escondidos'], correct: 1 }
                ]
            },
            {
                id: 'test8', popId: 'pop13', title: 'Teste: Alimentação Assistida',
                questions: [
                    { q: 'O residente deve estar posicionado a:', options: ['Deitado', '90° (sentado) ou 45° mínimo', 'Em pé', 'De lado'], correct: 1 },
                    { q: 'As porções devem ser:', options: ['Grandes para acabar rápido', 'Pequenas, respeitando o ritmo', 'Inteiras', 'Líquidas apenas'], correct: 1 },
                    { q: 'Antes de oferecer mais comida, verificar:', options: ['Se acabou no prato', 'Se o residente engoliu', 'O relógio', 'Nada'], correct: 1 },
                    { q: 'Após a refeição, o residente deve permanecer sentado por:', options: ['5 minutos', '15 minutos', '30 minutos', '1 hora'], correct: 2 },
                    { q: 'O que fazer se o residente engasgar?', options: ['Dar água', 'Aplicar manobra de Heimlich e chamar ajuda', 'Esperar passar', 'Dar tapas nas costas'], correct: 1 },
                    { q: 'Líquidos devem ser oferecidos:', options: ['Somente após a refeição', 'Entre as porções', 'Nunca durante a refeição', 'Somente água'], correct: 1 },
                    { q: 'A higiene oral após a refeição é:', options: ['Desnecessária', 'Obrigatória', 'Somente à noite', 'Opcional'], correct: 1 },
                    { q: 'O apetite do residente deve ser:', options: ['Ignorado', 'Respeitado e registrado', 'Forçado', 'Não importa'], correct: 1 },
                    { q: 'Aspiração pulmonar pode ocorrer quando:', options: ['Come devagar', 'Residente está deitado durante alimentação', 'Come sentado', 'Bebe água'], correct: 1 },
                    { q: 'O registro da alimentação assistida inclui:', options: ['Somente o horário', 'Quantidade aceita, recusa e observações', 'Nada', 'Nome da comida'], correct: 1 }
                ]
            }
        ];
        this.set('tests', tests);
        this.set('test_results', []);
    },

    // ===== SEED TRAININGS =====
    seedTrainings() {
        const trainings = [
            {
                id: 'trail1', role: 'tec_enfermagem', title: 'Trilha: Técnico de Enfermagem',
                pops: ['pop1', 'pop2', 'pop3', 'pop4'],
                tests: ['test1', 'test2', 'test3']
            },
            {
                id: 'trail2', role: 'cuidador', title: 'Trilha: Cuidador',
                pops: ['pop1', 'pop11', 'pop12', 'pop13'],
                tests: ['test1', 'test5', 'test6', 'test8']
            },
            {
                id: 'trail3', role: 'cozinheiro', title: 'Trilha: Cozinheiro(a)',
                pops: ['pop1', 'pop8', 'pop9', 'pop10'],
                tests: ['test1', 'test7']
            },
            {
                id: 'trail4', role: 'zelador', title: 'Trilha: Zelador(a)',
                pops: ['pop1', 'pop5', 'pop6', 'pop7'],
                tests: ['test1', 'test4']
            }
        ];
        this.set('trainings', trainings);
        this.set('training_progress', {});
    },

    // ===== SEED UNITS =====
    seedUnits() {
        const units = [
            { id: 'unit1', name: 'Residencial Primavera', city: 'São Paulo - SP', address: 'Rua das Flores, 123', status: 'active', createdAt: '2024-01-01' },
            { id: 'unit2', name: 'Residencial Sol Nascente', city: 'Campinas - SP', address: 'Av. Central, 456', status: 'active', createdAt: '2024-06-01' },
            { id: 'unit3', name: 'Residencial Vida Plena', city: 'Belo Horizonte - MG', address: 'Rua da Harmonia, 789', status: 'setup', createdAt: '2025-01-15' }
        ];
        this.set('units', units);
    },

    // ===== HELPERS =====
    getUsers() { return this.get('users') || []; },
    getPOPs() { return this.get('pops') || []; },
    getTests() { return this.get('tests') || []; },
    getTestResults() { return this.get('test_results') || []; },
    getTrainings() { return this.get('trainings') || []; },
    getTrainingProgress() { return this.get('training_progress') || {}; },
    getUnits() { return this.get('units') || []; },
    getChatLogs() { return this.get('chat_logs') || []; },
    getLegalRecords() { return this.get('legal_records') || []; },
    getSector(id) { return this.sectors.find(s => s.id === id); },
    getRole(id) { return this.roles.find(r => r.id === id); },
    getPOP(id) { return this.getPOPs().find(p => p.id === id); },
    getTest(id) { return this.getTests().find(t => t.id === id); },
    getUser(id) { return this.getUsers().find(u => u.id === id); },

    // Save legal record
    addLegalRecord(userId, type, details) {
        const records = this.getLegalRecords();
        records.push({
            id: 'rec_' + Date.now(),
            userId,
            type,
            details,
            timestamp: new Date().toISOString()
        });
        this.set('legal_records', records);
    },

    // Save test result
    addTestResult(userId, testId, score, total, passed) {
        const results = this.getTestResults();
        results.push({
            id: 'tr_' + Date.now(),
            userId,
            testId,
            score,
            total,
            passed,
            percentage: Math.round((score / total) * 100),
            timestamp: new Date().toISOString()
        });
        this.set('test_results', results);

        // Legal record
        this.addLegalRecord(userId, 'teste', `Teste "${this.getTest(testId)?.title}" — Nota: ${score}/${total} (${passed ? 'Aprovado' : 'Reprovado'})`);
    },

    // Save chat log
    addChatLog(userId, question, answer) {
        const logs = this.getChatLogs();
        logs.push({
            id: 'chat_' + Date.now(),
            userId,
            question,
            answer,
            timestamp: new Date().toISOString()
        });
        this.set('chat_logs', logs);
    },

    // Mark POP as read
    markPOPRead(userId, popId) {
        const progress = this.getTrainingProgress();
        if (!progress[userId]) progress[userId] = { popsRead: [], testsCompleted: [] };
        if (!progress[userId].popsRead.includes(popId)) {
            progress[userId].popsRead.push(popId);
            this.set('training_progress', progress);
            this.addLegalRecord(userId, 'treinamento', `POP lido: "${this.getPOP(popId)?.title}"`);
        }
    },

    // Mark test complete
    markTestComplete(userId, testId) {
        const progress = this.getTrainingProgress();
        if (!progress[userId]) progress[userId] = { popsRead: [], testsCompleted: [] };
        if (!progress[userId].testsCompleted.includes(testId)) {
            progress[userId].testsCompleted.push(testId);
            this.set('training_progress', progress);
        }
    },

    // Get user progress
    getUserProgress(userId) {
        const progress = this.getTrainingProgress();
        return progress[userId] || { popsRead: [], testsCompleted: [] };
    },

    // Add user
    addUser(user) {
        const users = this.getUsers();
        user.id = 'u' + (users.length + 1);
        user.roleHistory = [{ role: user.role, date: new Date().toISOString().split('T')[0] }];
        users.push(user);
        this.set('users', users);
        return user;
    },

    // Update user
    updateUser(userId, updates) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            if (updates.role && updates.role !== users[idx].role) {
                users[idx].roleHistory.push({ role: updates.role, date: new Date().toISOString().split('T')[0] });
            }
            Object.assign(users[idx], updates);
            this.set('users', users);
        }
    },

    // Delete user
    deleteUser(userId) {
        const users = this.getUsers().filter(u => u.id !== userId);
        this.set('users', users);
    }
};
