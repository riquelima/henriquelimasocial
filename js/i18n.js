/* ==========================================================
   I18N · Internacionalização e Suporte a Inglês / Português
   Henrique Lima — Portfolio & Game
   ========================================================== */
(function(){
  'use strict';

  window.PV = window.PV || {};
  window.HL = window.PV;

  var IDIOMA_PADRAO = 'pt';
  var STORAGE_KEY = 'hl_idioma';
  var idiomaAtual = (function(){
    try {
      var salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo === 'en' || salvo === 'pt') return salvo;
    } catch(_) {}
    return IDIOMA_PADRAO;
  })();

  var ouvintes = [];

  /* Dicionário de interface para o DOM e Canvas */
  var TEXTOS = {
    pt: {
      // Navegação
      nav_perfil: 'Perfil',
      nav_experiencia: 'Experiência',
      nav_projetos: 'Projetos',
      nav_atuacao: 'Atuação',
      nav_skills: 'Skills',
      nav_formacao: 'Formação',
      nav_conquistas: 'Conquistas',
      nav_contato: 'Contato',
      nav_jogar: '▶ Jogar',

      // Hero (Fase 0)
      hero_cargo: 'QA Analyst &amp; Engineer • Founder @ Intelektus • AI &amp; Automation Architect',
      badge_1: '💼 10+ Anos em Tecnologia',
      badge_2: '✈️ Realocação Imediata / Visto',
      badge_3: '📡 Telecom QA (5+ Anos)',
      badge_4: '🤖 Agentes de IA Autônomos',
      badge_5: '⚡ GCP & Jenkins CI/CD',
      hero_p1: 'Mais de 10 anos de experiência traduzindo desafios operacionais e regras de negócio complexas em arquiteturas de software de alta confiabilidade. Atuo como QA Engineer na Netcracker Technology há mais de 5 anos, liderando garantia de qualidade de ponta a ponta, automação de testes e validação de releases em plataformas de telecomunicações de missão crítica para operadoras Tier-1 globais (<strong>Du Telecom Dubai</strong>, <strong>TELUS Canadá</strong> e <strong>Nuuday Dinamarca</strong>).',
      hero_p2: 'Em paralelo, como fundador da <strong>Intelektus</strong>, projeto e coloco em produção agentes autônomos de IA, orquestrações de workflows em n8n e plataformas SaaS personalizadas. Minha trajetória integra suporte técnico crítico, ciência de dados e engenharia de qualidade de software.',
      hero_btn_jogar: '▶ Jogar o Currículo',
      hero_btn_ler: 'Só quero ler ↓',
      hero_btn_cv: 'Baixar CV (PDF) ↓',
      hero_btn_wpp: 'WhatsApp Direto →',
      ctrl_anda: 'anda',
      ctrl_pula: 'pula (2× pulo duplo)',
      ctrl_desce: 'desce pelos cards / soco no ar',
      ctrl_pausa: 'ou <kbd>Esc</kbd> pausa',
      mapa_titulo: 'Mapa da Fase',
      mapa_1: '<b>1</b>Perfil &amp; Skills',
      mapa_2: '<b>2</b>Experiência',
      mapa_3: '<b>3</b>Projetos em Produção',
      mapa_4: '<b>4</b>Áreas de Atuação',
      mapa_5: '<b>5</b>Ferramentas',
      mapa_6: '<b>6</b>Formação &amp; Visto',
      mapa_7: '<b>7</b>Conquistas',
      mapa_8: '<b>8</b>Contato',
      hero_rodape_1: 'Brasil (São Paulo / Salvador) • Disponibilidade Imediata',
      hero_rodape_2: 'Telecom QA • REST APIs • n8n • Supabase • Agentes de IA • Python • SQL',

      // Fase 1: Perfil
      f1_nome: 'Início',
      f1_kicker: 'Fase 1',
      f1_titulo: 'Sobre Mim & Core Skills',
      f1_lead: 'Visão 360° em engenharia de software: empatia profunda com as dores dos usuários, rigor analítico em modelagem de dados e a disciplina de engenharia necessária para entregar sistemas que realmente funcionam em produção.',
      f1_p2: 'Graduado em Análise e Desenvolvimento de Sistemas pela <strong>FATEC-SP</strong> (equivalente a bacharelado), construí uma carreira sólida que une testes E2E, homologação de APIs REST de billing/provisioning, arquitetura de microsserviços e automações orientadas a eventos.',
      f1_local: 'São Paulo / Salvador · Brasil',
      fato_exp_t: 'Experiência',
      fato_exp_v: '10+ anos em tecnologia',
      fato_op_t: 'Operadoras Globais',
      fato_op_v: 'Du Telecom, TELUS, Nuuday',
      fato_emp_t: 'Empresas',
      fato_emp_v: 'Netcracker &amp; Intelektus',
      fato_idioma_t: 'Idiomas',
      fato_idioma_v: 'Inglês (Fluente), Português (Nativo)',
      fato_disp_t: 'Disponibilidade',
      fato_disp_v: 'Imediata (Visto / Remoto)',

      // Fase 2: Experiência
      f2_kicker: 'Fase 2',
      f2_titulo: 'Experiência Profissional',
      f2_lead: 'Trajetória completa em multinacionais de telecomunicações, empresas de tecnologia de alta escala e empreendedorismo em IA.',
      exp1_ano: 'Fev/2024 — Presente',
      exp1_sub: 'Du Telecommunications (Dubai, UAE)',
      exp1_desc: 'Liderança dos ciclos de Quality Assurance E2E para a Du Telecom em plataformas corporativas de missão crítica BSS/OSS. Validação rigorosa de REST APIs, motores de faturamento, provisionamento de ordens e releases via Jenkins.',
      exp2_ano: 'Mai/2021 — Fev/2024',
      exp2_sub: 'TELUS (Canadá) &amp; Nuuday (Dinamarca)',
      exp2_desc: 'Suporte técnico especializado L2/L3 em ambientes Google Cloud Platform (GCP) e servidores corporativos Linux. Investigação de defeitos, qualificação técnica de bugs e supervisão de hotfixes em produção.',
      exp3_ano: '2023 — Presente',
      exp3_cargo: 'Founder &amp; CEO — AI &amp; Automation',
      exp3_sub: 'Intelektus · Automação Inteligente',
      exp3_desc: 'Arquitetura e implementação de agentes autônomos de IA com LLMs, orquestração de workflows em n8n e integrações com Python, Supabase (pgvector), Webhooks e APIs de mensageria.',
      exp4_ano: 'Mai/2020 — Jan/2021',
      exp4_cargo: 'Data Science Intern · ThinkSeg',
      exp4_sub: 'São Paulo, Brasil',
      exp4_desc: 'Desenvolvimento de automações em Python e queries analíticas em SQL para mineração de dados, pipelines de ETL e dashboards gerenciais de Business Intelligence.',
      exp5_ano: 'Ago/2018 — Jun/2019',
      exp5_cargo: 'Content Analyst · Cognizant',
      exp5_sub: 'Facebook Operations',
      exp5_desc: 'Análise, classificação e moderação de conteúdo sensível em ambiente bilíngue estrito, aplicando diretrizes de segurança da comunidade e mediação de disputas.',
      exp6_ano: 'Mar/2014 — Mai/2018',
      exp6_cargo: 'Customer &amp; Critical Support Specialist',
      exp6_sub: 'Easy Taxi • Uber • Porto Seguro',
      exp6_desc: 'Resolução de incidentes de nível crítico para passageiros, motoristas e contas corporativas, reformulando fluxos operacionais de triagem técnica.',

      // Fase 3: Projetos
      f3_kicker: 'Fase 3',
      f3_titulo: 'Sistemas & Projetos em Produção',
      f3_lead: 'Aplicações reais desenvolvidas e implantadas: agentes inteligentes de IA, orquestrações de microsserviços, suítes de QA e automações de alta escala.',
      p1_tit: 'SMUG AI — Copiloto Invisível de IA em Tempo Real',
      p1_desc: 'Assistente de inteligência artificial de alta performance desenvolvido para quem precisa de respostas estratégicas e soluções de código ao vivo durante entrevistas técnicas e reuniões executivas. Opera com sobreposição invisível no sistema operacional indetectável em compartilhamentos de tela (Zoom, Meet e Teams).',
      p1_high: '⚡ Respostas instantâneas com análise de complexidade de código • Transcrição fonética ao vivo • Indetectável em chamadas.',
      p2_tit: 'Clínica Top Dent — Gestão Clínica &amp; Agendamento Autônomo',
      p2_desc: 'Plataforma completa de gestão odontológica e triagem automatizada com multiagentes inteligentes (Router Agent, Anamnese Digital e Agendamento). Atendimento e confirmação de consultas 24/7 integrado ao WhatsApp e prontuário em nuvem.',
      p2_high: '🦷 65% redução no tempo de primeira resposta • 92% agendamentos autônomos sem intervenção humana • Sincronização em tempo real.',
      p3_tit: 'OpenWorkout (OpenGym) — Plataforma Self-Hosted &amp; Mobile de Treinos',
      p3_desc: 'Aplicativo completo e independente para planejamento de treinos, histórico de séries e rastreamento de peso corporal. Arquitetura privacy-first sem rastreadores de terceiros, sincronizado entre dispositivos sob autenticação por passkey.',
      p3_high: '🏋️ Deploy em 1 clique via Docker Compose • Versão PWA instalável e aplicativo nativo mobile via Capacitor (iOS e Android).',
      p4_tit: 'Sandy Pet Shop — Agendamento, Ficha Clínica &amp; Retenção',
      p4_desc: 'Ecossistema digital para clínicas veterinárias e centros de estética pet. Histórico de atendimentos, agendamento interativo de banho e tosa, disparos automáticos de lembretes preventivos de vacinação e reativação de clientes.',
      p4_high: '🐾 +38% no retorno recorrente de tutores através de fluxos automatizados • Zero atrito no agendamento.',
      p5_tit: 'Nucleus Cleaning — Gestão Operacional &amp; Bookings',
      p5_desc: 'Plataforma corporativa para digitalização e operação em tempo real de empresas de higienização e facilities. Gestão centralizada de ordens de serviço, agendamento de equipes em rota, emissão de orçamentos dinâmicos e controle de faturamento recorrente.',
      p5_high: '🧹 Automação completa do funil de bookings • Redução de 80% no tempo administrativo de despacho • Painel executivo de contratos e clientes.',

      // Fase 4: Atuação
      f4_kicker: 'Fase 4',
      f4_titulo: 'Pilares de Atuação',
      f4_lead: 'A intersecção estratégica entre qualidade de software, integrações robustas e automação orientada a resultados de negócio.',
      f4_a_tit: 'Qualidade de Software (QA)',
      f4_a_desc: 'Desenho e execução de testes E2E, Cypress e Selenium, elaboração de cenários de teste, bug triage rigoroso no JIRA, testes de regressão, sanity e smoke gates que protegem a experiência do usuário final.',
      f4_b_tit: 'Integrações &amp; APIs REST',
      f4_b_desc: 'Automação e homologação de APIs com Postman e Python. Validação de contratos JSON/Regex, provisionamento de faturamento e integração profunda com plataformas empresariais BSS/OSS.',
      f4_c_tit: 'Automação Inteligente',
      f4_c_desc: 'Workflows escaláveis em n8n integrando Supabase (PostgreSQL), Webhooks, WhatsApp API e agentes autônomos de IA que substituem processos manuais lentos por operações em tempo real.',

      // Fase 5: Skills
      f5_kicker: 'Fase 5',
      f5_titulo: 'Ferramentas & Metodologias',
      f5_lead: 'O ecossistema completo de ferramentas e metodologias que domino e aplico no dia a dia corporativo:',
      f5_li_1: '<b>Garantia de Qualidade &amp; Testes:</b> E2E Testing, Cypress, Selenium, Postman, JIRA, Test Case Design, Defect Triage, RCA, Regressão, Sanity e Smoke Gates.',
      f5_li_2: '<b>Automação &amp; IA:</b> n8n, Supabase, LLM APIs (OpenAI), Webhooks, WhatsApp Business API, Bots e Pipelines orientados a eventos.',
      f5_li_3: '<b>Dados &amp; Backend:</b> Python, JavaScript, SQL e Modelagem de Dados, PostgreSQL, MySQL, Oracle, Validação de Payloads JSON e Regex.',
      f5_li_4: '<b>Infraestrutura &amp; DevOps:</b> Jenkins CI/CD, Google Cloud Platform (GCP), Docker, Servidores Linux, Shell Scripting e Monitoramento de SLA.',
      f5_li_5: '<b>Idiomas de Trabalho:</b> Inglês (Profissional Completo — atuação diária com clientes globais), Português (Nativo), Espanhol (Proficiência de Trabalho).',
      f5_site1_sub: 'Cobertura de testes ponta a ponta que assegura zero regressões em releases corporativas complexas.',
      f5_site1_link: 'Confiabilidade Contínua →',
      f5_site2_tit: 'Agentes de IA &amp; n8n',
      f5_site2_sub: 'Arquiteturas multiagente com RAG em bancos vetoriais e execução determinística de ferramentas.',
      f5_site2_link: 'Automação de Nova Geração →',
      f5_site3_sub: 'Experiência comprovada em plataformas de faturamento e ordens para grandes operadoras mundiais.',
      f5_site3_link: 'Sistemas Críticos →',

      // Fase 6: Formação
      f6_kicker: 'Fase 6',
      f6_titulo: 'Formação & Relocação',
      f6_lead: 'Formação técnica sólida aliada à flexibilidade logística total para novos desafios globais.',
      f6_c1_tag: 'Graduação Superior (CST)',
      f6_c1_tit: 'Análise e Desenvolvimento de Sistemas',
      f6_c1_inst: '<strong>Faculdade de Tecnologia de São Paulo (FATEC-SP)</strong> • 2018 — 2021',
      f6_c1_desc: 'Formação com foco em algoritmos, arquitetura de computadores, engenharia de software, modelagem de banco de dados e redes (equivalente a Bachelor\'s Degree internacional).',
      f6_c2_tag: 'Ensino Fundamental e Médio',
      f6_c2_tit: 'Colégio da Polícia Militar (CPM)',
      f6_c2_inst: 'Salvador, Bahia, Brasil • 2001 — 2009',
      f6_c2_desc: 'Base educacional com forte disciplina, liderança e resolução estruturada de problemas.',
      f6_c3_tag: 'Logística &amp; Visto',
      f6_c3_tit: 'Autorização de Trabalho &amp; Relocação',
      f6_c3_p1: '• <strong>Localização:</strong> Brasil (São Paulo &amp; Salvador).',
      f6_c3_p2: '• <strong>Relocação Internacional:</strong> Disponibilidade imediata para visto global e realocação presencial ou híbrida.',
      f6_c3_p3: '• <strong>Modelos:</strong> 100% Remoto ou Worldwide Relocation.',
      f6_c3_p4: '• <strong>Aviso prévio:</strong> Imediato / padrão 30 dias.',

      // Fase 7: Conquistas
      f7_kicker: 'Fase 7',
      f7_titulo: 'Reconhecimentos & Troféus',
      f7_lead: 'Colete os troféus de ouro no jogo passando por cada marco da carreira!',
      f7_p1_tit: 'Excelência em QA Telecom',
      f7_p1_desc: 'Garantia de estabilidade contínua nos ciclos de homologação para operadoras como Du Telecom (Dubai) e TELUS (Canadá).',
      f7_p2_tit: 'Zero Regressões em Produção',
      f7_p2_desc: 'Alta taxa de interceptação prévia de falhas através de suítes de sanity tests e validações automatizadas pós-deploy.',
      f7_p3_tit: 'Inovação em Agentes de IA',
      f7_p3_desc: 'Criação e implantação de plataformas ativas de agentes inteligentes de IA e workflows autônomos orientados a eventos.',
      f7_p3_equipe: 'Intelektus • Soluções Inteligentes',
      f7_citacao: 'Qualidade de software não é sobre achar bugs depois do estrago feito: é desenhar arquiteturas resilientes e esteiras de teste para que o erro sequer chegue aos olhos do usuário final.',

      // Fase 8: Contato
      f8_kicker: 'Fase 8',
      f8_titulo: 'Vamos Conversar',
      f8_lead: 'Você chegou ao final da fase! Vamos conversar sobre projetos de QA, automação com IA, posições remotas ou oportunidades globais.',
      f8_wpp_qual: 'WhatsApp Principal',

      // Rodapé
      rodape_local: 'São Paulo &amp; Salvador · Brasil',

      // Jogo / In-Game
      hud_fase: 'FASE',
      hud_prof: 'PROF.',
      game_buraco: 'o buraco é ',
      game_procura_buraco: 'procura o buraco ',
      game_pula_cartao: 'pula por baixo de um cartão!',
      game_soco_touch: 'no ar, ▼ = SOCO',
      game_soco_key: 'no ar, ↓ = SOCO',
      game_andar_touch: '◀ ▶ pra andar',
      game_andar_key: '← → pra andar',
      game_pulo_touch: '▲ pula, e no ar pula de novo',
      game_pulo_key: 'espaço pula, e no ar pula de novo',
      game_bug: 'isso é um bug. pisa nele!',
      game_skill_nova: 'Skill nova: ',
      game_aviso_touch: '◀ ▶ anda, ▲ pula, ▼ desce ou soca',
      game_aviso_key: '← → anda, espaço pula, ↓ desce ou soca, P pausa',
      menu_falas: ['bora jogar?', 'aperta ENTER', 'cuidado com os bugs'],
      menu_falas_touch: ['bora jogar?', 'toca em JOGAR', 'cuidado com os bugs'],

      // Pausa e Fim de jogo
      pausa_kicker: 'Pausa',
      pausa_titulo: 'Jogo pausado',
      pausa_sub: function(fase, nome, pts, t){ return 'Você está na fase ' + fase + (nome ? ' (' + nome + ')' : '') + ', com ' + pts + ' pontos em ' + t + '.'; },
      pausa_qualidade: 'Qualidade',
      pausa_q_auto: 'Automática',
      pausa_q_alto: 'Alta',
      pausa_q_medio: 'Média',
      pausa_q_baixo: 'Baixa',
      pausa_continuar: '▶ Continuar',
      pausa_reiniciar: '↻ Recomeçar',
      pausa_sair: 'Sair e ler',

      fim_kicker: 'Fim de jogo',
      fim_titulo: 'Você chegou ao fim',
      fim_tempo: 'Tempo',
      fim_pontos: 'Pontos',
      fim_mortes: 'Mortes',
      fim_novo_recorde: 'Novo recorde!',
      fim_recorde: 'Recorde',
      fim_sub: 'Obrigado por jogar! O botão abaixo abre um e-mail para mim.',
      fim_falar: '✉ Falar comigo',
      fim_jogar_novo: '↻ Jogar de novo',
      fim_ler_port: 'Ler o portfólio',
      fim_ranks: {
        S: ['ARQUITETO LENDÁRIO', 'Perfeição técnica, código limpo e zero regressões em produção.'],
        A: ['ENGENHEIRO SENIOR', 'Alta confiabilidade, entrega ágil e bugs neutralizados.'],
        B: ['PLENO ROBUSTO', 'Boa velocidade e visão de qualidade consistente.'],
        C: ['JÚNIOR DESTERCADOR', 'Chegou ao fim, mas deixou alguns bugs passarem.']
      }
    },

    en: {
      // Navigation
      nav_perfil: 'Profile',
      nav_experiencia: 'Experience',
      nav_projetos: 'Projects',
      nav_atuacao: 'Expertise',
      nav_skills: 'Skills',
      nav_formacao: 'Education',
      nav_conquistas: 'Awards',
      nav_contato: 'Contact',
      nav_jogar: '▶ Play',

      // Hero (Stage 0)
      hero_cargo: 'QA Analyst &amp; Engineer • Founder @ Intelektus • AI &amp; Automation Architect',
      badge_1: '💼 10+ Years in Tech',
      badge_2: '✈️ Immediate Relocation / Visa Ready',
      badge_3: '📡 Telecom QA (5+ Years)',
      badge_4: '🤖 Autonomous AI Agents',
      badge_5: '⚡ GCP & Jenkins CI/CD',
      hero_p1: 'Over 10 years of experience translating complex business rules and operational challenges into high-reliability software architectures. Working as a QA Engineer at Netcracker Technology for 5+ years, leading end-to-end quality assurance, test automation, and release certification on mission-critical telecom platforms for global Tier-1 operators (<strong>Du Telecom Dubai</strong>, <strong>TELUS Canada</strong>, and <strong>Nuuday Denmark</strong>).',
      hero_p2: 'In parallel, as the founder of <strong>Intelektus</strong>, I design and deploy autonomous AI agents, n8n workflow orchestrations, and custom SaaS platforms. My trajectory bridges critical technical support, data science, and software quality engineering.',
      hero_btn_jogar: '▶ Play Resume',
      hero_btn_ler: 'Just read ↓',
      hero_btn_cv: 'Download CV (PDF) ↓',
      hero_btn_wpp: 'Direct WhatsApp →',
      ctrl_anda: 'move',
      ctrl_pula: 'jump (2× double jump)',
      ctrl_desce: 'drop through cards / air slam',
      ctrl_pausa: 'or <kbd>Esc</kbd> pause',
      mapa_titulo: 'Stage Map',
      mapa_1: '<b>1</b>Profile &amp; Skills',
      mapa_2: '<b>2</b>Experience',
      mapa_3: '<b>3</b>Production Projects',
      mapa_4: '<b>4</b>Core Expertise',
      mapa_5: '<b>5</b>Tools &amp; Skills',
      mapa_6: '<b>6</b>Education &amp; Visa',
      mapa_7: '<b>7</b>Achievements',
      mapa_8: '<b>8</b>Contact',
      hero_rodape_1: 'Brazil (São Paulo / Salvador) • Immediate Availability',
      hero_rodape_2: 'Telecom QA • REST APIs • n8n • Supabase • AI Agents • Python • SQL',

      // Stage 1: Profile
      f1_nome: 'Profile',
      f1_kicker: 'Stage 1',
      f1_titulo: 'About Me & Core Skills',
      f1_lead: '360° software engineering vision: deep empathy for user pain points, analytical rigor in data modeling, and the engineering discipline required to deliver resilient production systems.',
      f1_p2: 'Graduated in Systems Analysis and Development from <strong>FATEC-SP</strong> (international Bachelor\'s equivalent), building a solid career spanning E2E testing, REST API certification for billing/provisioning, microservices architecture, and event-driven automations.',
      f1_local: 'São Paulo / Salvador · Brazil',
      fato_exp_t: 'Experience',
      fato_exp_v: '10+ years in technology',
      fato_op_t: 'Global Operators',
      fato_op_v: 'Du Telecom, TELUS, Nuuday',
      fato_emp_t: 'Companies',
      fato_emp_v: 'Netcracker &amp; Intelektus',
      fato_idioma_t: 'Languages',
      fato_idioma_v: 'English (Fluent), Portuguese (Native)',
      fato_disp_t: 'Availability',
      fato_disp_v: 'Immediate (Visa / Remote)',

      // Stage 2: Experience
      f2_kicker: 'Stage 2',
      f2_titulo: 'Professional Experience',
      f2_lead: 'Comprehensive career across global telecom leaders, hyper-scale technology companies, and AI-driven entrepreneurship.',
      exp1_ano: 'Feb/2024 — Present',
      exp1_sub: 'Du Telecommunications (Dubai, UAE)',
      exp1_desc: 'Leading E2E Quality Assurance cycles for Du Telecom on mission-critical BSS/OSS enterprise platforms. Rigorous validation of REST APIs, billing engines, order provisioning, and CI/CD releases via Jenkins.',
      exp2_ano: 'May/2021 — Feb/2024',
      exp2_sub: 'TELUS (Canada) &amp; Nuuday (Denmark)',
      exp2_desc: 'Specialized L2/L3 technical support across Google Cloud Platform (GCP) and enterprise Linux server environments. Defect investigation, technical bug qualification, and hotfix deployment oversight in production.',
      exp3_ano: '2023 — Present',
      exp3_cargo: 'Founder &amp; CEO — AI &amp; Automation',
      exp3_sub: 'Intelektus · Intelligent Automation',
      exp3_desc: 'Architecture and deployment of autonomous AI agents with LLMs, n8n workflow orchestration, and robust integrations with Python, Supabase (pgvector), Webhooks, and messaging APIs.',
      exp4_ano: 'May/2020 — Jan/2021',
      exp4_cargo: 'Data Science Intern · ThinkSeg',
      exp4_sub: 'São Paulo, Brazil',
      exp4_desc: 'Development of Python automations and SQL analytical queries for data mining, ETL pipelines, and executive Business Intelligence dashboards.',
      exp5_ano: 'Aug/2018 — Jun/2019',
      exp5_cargo: 'Content Analyst · Cognizant',
      exp5_sub: 'Facebook Operations',
      exp5_desc: 'Analysis, classification, and moderation of sensitive content in a strict bilingual environment, enforcing community integrity standards and dispute mediation.',
      exp6_ano: 'Mar/2014 — May/2018',
      exp6_cargo: 'Customer &amp; Critical Support Specialist',
      exp6_sub: 'Easy Taxi • Uber • Porto Seguro',
      exp6_desc: 'Resolution of critical-tier incidents for riders, drivers, and corporate accounts, restructuring technical triage workflows.',

      // Stage 3: Projects
      f3_kicker: 'Stage 3',
      f3_titulo: 'Systems & Production Projects',
      f3_lead: 'Real-world production applications deployed: intelligent AI agents, microservices orchestration, QA test suites, and high-scale automations.',
      p1_tit: 'SMUG AI — Real-Time Invisible AI Copilot',
      p1_desc: 'High-performance AI assistant built for real-time strategic insights and live code solutions during technical interviews and executive meetings. Features an invisible OS overlay undetectable on screen shares (Zoom, Google Meet, and MS Teams).',
      p1_high: '⚡ Instant responses with algorithmic complexity analysis • Live phonetic speech-to-text • Undetectable in calls.',
      p2_tit: 'Top Dent Clinic — Clinical Management &amp; Autonomous Booking',
      p2_desc: 'End-to-end dental clinic management and automated triage powered by intelligent multi-agent AI (Router Agent, Digital Anamnesis, and Scheduling). 24/7 appointment booking and confirmations integrated with WhatsApp and cloud EHR.',
      p2_high: '🦷 65% reduction in first-response time • 92% autonomous bookings without human intervention • Real-time cloud sync.',
      p3_tit: 'OpenWorkout (OpenGym) — Self-Hosted &amp; Mobile Workout Platform',
      p3_desc: 'Complete standalone app for workout programming, set tracking, and body composition analytics. Privacy-first architecture without third-party trackers, synced across devices with passkey authentication.',
      p3_high: '🏋️ 1-click Docker Compose deploy • Installable PWA and native mobile app via Capacitor (iOS and Android).',
      p4_tit: 'Sandy Pet Shop — Booking, Clinical Records &amp; Retention',
      p4_desc: 'Digital ecosystem for veterinary clinics and pet groomers. Appointment history, interactive grooming bookings, automated preventive vaccination reminders, and client reactivation workflows.',
      p4_high: '🐾 +38% increase in repeat pet-parent visits via automated flows • Frictionless booking experience.',
      p5_tit: 'Nucleus Cleaning — Operational Management &amp; Bookings SaaS',
      p5_desc: 'Enterprise platform for real-time operations of cleaning and facilities companies. Centralized work order dispatch, routing team schedules, dynamic instant estimates, and recurring revenue billing.',
      p5_high: '🧹 Full booking funnel automation • 80% reduction in administrative dispatch time • Executive dashboard for contracts and clients.',

      // Stage 4: Expertise
      f4_kicker: 'Stage 4',
      f4_titulo: 'Core Domains & Expertise',
      f4_lead: 'The strategic intersection of software quality, robust integrations, and high-impact business automation.',
      f4_a_tit: 'Software Quality Assurance (QA)',
      f4_a_desc: 'Design and execution of E2E suites with Cypress and Selenium, comprehensive test scenarios, rigorous JIRA bug triage, regression testing, and sanity/smoke release gates safeguarding end-user experience.',
      f4_b_tit: 'Integrations &amp; REST APIs',
      f4_b_desc: 'API automation and certification with Postman and Python. JSON/Regex schema contract validation, billing engine provisioning, and deep enterprise BSS/OSS platform integrations.',
      f4_c_tit: 'Intelligent Automation',
      f4_c_desc: 'Scalable n8n workflows integrating Supabase (PostgreSQL), Webhooks, WhatsApp API, and autonomous AI agents replacing slow manual operations with real-time automated workflows.',

      // Stage 5: Tools & Methodologies
      f5_kicker: 'Stage 5',
      f5_titulo: 'Tools & Methodologies',
      f5_lead: 'The complete ecosystem of tools and methodologies I leverage daily in corporate environments:',
      f5_li_1: '<b>Quality Assurance &amp; Testing:</b> E2E Testing, Cypress, Selenium, Postman, JIRA, Test Case Design, Defect Triage, RCA, Regression, Sanity &amp; Smoke Gates.',
      f5_li_2: '<b>Automation &amp; AI:</b> n8n, Supabase, LLM APIs (OpenAI), Webhooks, WhatsApp Business API, Event-Driven Bots and Pipelines.',
      f5_li_3: '<b>Data &amp; Backend:</b> Python, JavaScript, SQL &amp; Data Modeling, PostgreSQL, MySQL, Oracle, JSON &amp; Regex Payload Validation.',
      f5_li_4: '<b>Infrastructure &amp; DevOps:</b> Jenkins CI/CD, Google Cloud Platform (GCP), Docker, Linux Servers, Shell Scripting, and SLA Monitoring.',
      f5_li_5: '<b>Working Languages:</b> English (Full Professional — daily work with global clients), Portuguese (Native), Spanish (Working Proficiency).',
      f5_site1_sub: 'End-to-end test coverage ensuring zero regressions across complex enterprise releases.',
      f5_site1_link: 'Continuous Reliability →',
      f5_site2_tit: 'AI Agents &amp; n8n',
      f5_site2_sub: 'Multi-agent architectures with vector database RAG and deterministic tool execution.',
      f5_site2_link: 'Next-Gen Automation →',
      f5_site3_sub: 'Proven track record in billing and order fulfillment platforms for global tier-1 telecom operators.',
      f5_site3_link: 'Mission-Critical Systems →',

      // Stage 6: Education
      f6_kicker: 'Stage 6',
      f6_titulo: 'Education & Relocation',
      f6_lead: 'Solid technical background combined with full logistical flexibility for global career opportunities.',
      f6_c1_tag: 'Higher Education Degree (CST)',
      f6_c1_tit: 'Systems Analysis &amp; Software Development',
      f6_c1_inst: '<strong>São Paulo State Faculty of Technology (FATEC-SP)</strong> • 2018 — 2021',
      f6_c1_desc: 'Comprehensive focus on algorithms, computer architecture, software engineering, database modeling, and networking (recognized as international Bachelor\'s equivalent).',
      f6_c2_tag: 'Primary &amp; Secondary Education',
      f6_c2_tit: 'Military Police College (CPM)',
      f6_c2_inst: 'Salvador, Bahia, Brazil • 2001 — 2009',
      f6_c2_desc: 'Foundational education grounded in discipline, leadership, and structured problem-solving.',
      f6_c3_tag: 'Logistics &amp; Visa',
      f6_c3_tit: 'Work Authorization &amp; Relocation',
      f6_c3_p1: '• <strong>Location:</strong> Brazil (São Paulo &amp; Salvador).',
      f6_c3_p2: '• <strong>International Relocation:</strong> Ready for visa sponsorship and immediate worldwide on-site or hybrid relocation.',
      f6_c3_p3: '• <strong>Work Models:</strong> 100% Remote or Worldwide Relocation.',
      f6_c3_p4: '• <strong>Notice Period:</strong> Immediate / standard 30 days.',

      // Stage 7: Achievements
      f7_kicker: 'Stage 7',
      f7_titulo: 'Achievements & Awards',
      f7_lead: 'Collect golden trophies in-game as you jump through each career milestone!',
      f7_p1_tit: 'Telecom QA Excellence',
      f7_p1_desc: 'Continuous delivery stability across certification cycles for tier-1 operators including Du Telecom (Dubai) and TELUS (Canada).',
      f7_p2_tit: 'Zero Production Regressions',
      f7_p2_desc: 'High pre-release fault interception rate through robust sanity test suites and automated post-deployment smoke gates.',
      f7_p3_tit: 'AI Agent Innovation',
      f7_p3_desc: 'Architecting and launching active production platforms with intelligent AI agents and autonomous event-driven pipelines.',
      f7_p3_equipe: 'Intelektus • Intelligent Solutions',
      f7_citacao: 'Software quality isn\'t about finding bugs after the damage is done: it\'s about engineering resilient architectures and testing pipelines so flaws never reach the end user.',

      // Stage 8: Contact
      f8_kicker: 'Stage 8',
      f8_titulo: 'Let\'s Connect',
      f8_lead: 'You\'ve reached the final stage! Let\'s discuss QA projects, AI automation, remote positions, or global opportunities.',
      f8_wpp_qual: 'Main WhatsApp',

      // Footer
      rodape_local: 'São Paulo &amp; Salvador · Brazil',

      // In-Game
      hud_fase: 'STAGE',
      hud_prof: 'DEPTH',
      game_buraco: 'the gap is ',
      game_procura_buraco: 'find the gap ',
      game_pula_cartao: 'jump from underneath a card!',
      game_soco_touch: 'in air, ▼ = SLAM',
      game_soco_key: 'in air, ↓ = SLAM',
      game_andar_touch: '◀ ▶ to move',
      game_andar_key: '← → to move',
      game_pulo_touch: '▲ jumps, jump again in air',
      game_pulo_key: 'space jumps, jump again in air',
      game_bug: 'that is a bug. stomp on it!',
      game_skill_nova: 'New skill: ',
      game_aviso_touch: '◀ ▶ move, ▲ jump, ▼ drop or slam',
      game_aviso_key: '← → move, space jump, ↓ drop or slam, P pause',
      menu_falas: ['ready to play?', 'press ENTER', 'watch out for bugs'],
      menu_falas_touch: ['ready to play?', 'tap PLAY', 'watch out for bugs'],

      // Pause & Game Over
      pausa_kicker: 'Pause',
      pausa_titulo: 'Game Paused',
      pausa_sub: function(fase, nome, pts, t){ return 'You are on stage ' + fase + (nome ? ' (' + nome + ')' : '') + ', with ' + pts + ' points in ' + t + '.'; },
      pausa_qualidade: 'Quality',
      pausa_q_auto: 'Auto',
      pausa_q_alto: 'High',
      pausa_q_medio: 'Medium',
      pausa_q_baixo: 'Low',
      pausa_continuar: '▶ Resume',
      pausa_reiniciar: '↻ Restart',
      pausa_sair: 'Exit & Read',

      fim_kicker: 'Game Over',
      fim_titulo: 'You Reached The End',
      fim_tempo: 'Time',
      fim_pontos: 'Points',
      fim_mortes: 'Deaths',
      fim_novo_recorde: 'New Record!',
      fim_recorde: 'High Score',
      fim_sub: 'Thanks for playing! The button below sends me an email.',
      fim_falar: '✉ Contact Me',
      fim_jogar_novo: '↻ Play Again',
      fim_ler_port: 'Read Portfolio',
      fim_ranks: {
        S: ['LEGENDARY ARCHITECT', 'Technical perfection, clean code, and zero production regressions.'],
        A: ['SENIOR ENGINEER', 'High reliability, agile delivery, and neutralized bugs.'],
        B: ['SOLID ENGINEER', 'Strong velocity and consistent quality vision.'],
        C: ['JUNIOR DEBUGGER', 'Reached the end, but let a few bugs slip through.']
      }
    }
  };

  /* Aplicação das traduções no DOM */
  function aplicarTraducoes(lang){
    var dic = TEXTOS[lang] || TEXTOS.pt;
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';

    // 1. Atualizar botões de idioma
    document.querySelectorAll('.botao-idioma').forEach(function(btn){
      var ptTag = btn.querySelector('[data-lang="pt"]');
      var enTag = btn.querySelector('[data-lang="en"]');
      if (ptTag) ptTag.classList.toggle('ativo', lang === 'pt');
      if (enTag) enTag.classList.toggle('ativo', lang === 'en');
      btn.setAttribute('aria-label', lang === 'pt' ? 'Mudar idioma para Inglês' : 'Switch language to Portuguese');
    });

    var btnHud = document.getElementById('btnIdiomaHud');
    if (btnHud) {
      btnHud.textContent = lang === 'pt' ? 'EN' : 'PT';
      btnHud.setAttribute('aria-label', lang === 'pt' ? 'Switch to English' : 'Mudar para Português');
      btnHud.setAttribute('title', lang === 'pt' ? 'Switch to English (L)' : 'Mudar para Português (L)');
    }

    // 2. Navegação
    var linksNav = document.querySelectorAll('.nav-links a');
    if (linksNav.length >= 8) {
      linksNav[0].textContent = dic.nav_perfil;
      linksNav[1].textContent = dic.nav_experiencia;
      linksNav[2].textContent = dic.nav_projetos;
      linksNav[3].textContent = dic.nav_atuacao;
      linksNav[4].textContent = dic.nav_skills;
      linksNav[5].textContent = dic.nav_formacao;
      linksNav[6].textContent = dic.nav_conquistas;
      linksNav[7].textContent = dic.nav_contato;
    }
    document.querySelectorAll('.rotulo-jogar').forEach(function(el){
      if (el.closest('.nav')) el.textContent = dic.nav_jogar;
      else el.textContent = dic.hero_btn_jogar;
    });

    // 3. Hero (Fase 0)
    var heroTxt = document.querySelector('.heroi-texto');
    if (heroTxt) {
      var cargo = heroTxt.querySelector('.cargo');
      if (cargo) cargo.innerHTML = dic.hero_cargo;
      var badges = heroTxt.querySelectorAll('.badges-topo .badge-pill');
      if (badges.length >= 5) {
        badges[0].textContent = dic.badge_1;
        badges[1].textContent = dic.badge_2;
        badges[2].textContent = dic.badge_3;
        badges[3].textContent = dic.badge_4;
        badges[4].textContent = dic.badge_5;
      }
      var ps = heroTxt.querySelectorAll('p:not(.cargo)');
      if (ps.length >= 2) {
        ps[0].innerHTML = dic.hero_p1;
        ps[1].innerHTML = dic.hero_p2;
      }
    }
    var heroAcoes = document.querySelector('.heroi-acoes');
    if (heroAcoes) {
      var btnLer = heroAcoes.querySelector('a[href="#perfil"]');
      if (btnLer) btnLer.textContent = dic.hero_btn_ler;
      var btnCV = heroAcoes.querySelector('a[href="curriculo.pdf"]');
      if (btnCV) btnCV.textContent = dic.hero_btn_cv;
      var btnWpp = heroAcoes.querySelector('a[href*="wa.me"]');
      if (btnWpp) btnWpp.textContent = dic.hero_btn_wpp;
    }
    var ctrls = document.querySelectorAll('.controles li');
    if (ctrls.length >= 4) {
      ctrls[0].innerHTML = '<kbd>←</kbd><kbd>→</kbd> ' + dic.ctrl_anda;
      ctrls[1].innerHTML = '<kbd>espaço</kbd> ' + dic.ctrl_pula;
      ctrls[2].innerHTML = '<kbd>↓</kbd> ' + dic.ctrl_desce;
      ctrls[3].innerHTML = '<kbd>P</kbd> ' + dic.ctrl_pausa;
    }
    var mapa = document.querySelector('.mapa');
    if (mapa) {
      var mTit = mapa.querySelector('.mapa-titulo');
      if (mTit) mTit.textContent = dic.mapa_titulo;
      var mLinks = mapa.querySelectorAll('ol li a');
      if (mLinks.length >= 8) {
        mLinks[0].innerHTML = dic.mapa_1;
        mLinks[1].innerHTML = dic.mapa_2;
        mLinks[2].innerHTML = dic.mapa_3;
        mLinks[3].innerHTML = dic.mapa_4;
        mLinks[4].innerHTML = dic.mapa_5;
        mLinks[5].innerHTML = dic.mapa_6;
        mLinks[6].innerHTML = dic.mapa_7;
        mLinks[7].innerHTML = dic.mapa_8;
      }
    }
    var heroRod = document.querySelector('.heroi-rodape');
    if (heroRod) {
      var spans = heroRod.querySelectorAll('span');
      if (spans.length >= 2) {
        spans[0].textContent = dic.hero_rodape_1;
        spans[1].textContent = dic.hero_rodape_2;
      }
    }

    // 4. Seção Nomes e Fases
    var s0 = document.getElementById('topo');
    if (s0) s0.dataset.nome = lang === 'en' ? 'Start' : 'Início';
    var s1 = document.getElementById('perfil');
    if (s1) s1.dataset.nome = lang === 'en' ? 'Profile' : 'Perfil';
    var s2 = document.getElementById('experiencia');
    if (s2) s2.dataset.nome = lang === 'en' ? 'Experience' : 'Experiência';
    var s3 = document.getElementById('projetos');
    if (s3) s3.dataset.nome = lang === 'en' ? 'Projects' : 'Projetos';
    var s4 = document.getElementById('atuacao');
    if (s4) s4.dataset.nome = lang === 'en' ? 'Expertise' : 'Atuação';
    var s5 = document.getElementById('skills');
    if (s5) s5.dataset.nome = lang === 'en' ? 'Skills' : 'Skills';
    var s6 = document.getElementById('formacao');
    if (s6) s6.dataset.nome = lang === 'en' ? 'Education' : 'Formação';
    var s7 = document.getElementById('conquistas');
    if (s7) s7.dataset.nome = lang === 'en' ? 'Achievements' : 'Conquistas';
    var s8 = document.getElementById('contato');
    if (s8) s8.dataset.nome = lang === 'en' ? 'Contact' : 'Contato';

    // 5. Fase 1 · Perfil
    if (s1) {
      var k1 = s1.querySelector('.kicker'); if (k1) k1.textContent = dic.f1_kicker;
      var h2_1 = s1.querySelector('h2');
      if (h2_1) { h2_1.textContent = dic.f1_titulo; }
      var lead1 = s1.querySelector('.lead'); if (lead1) lead1.textContent = dic.f1_lead;
      var p2_1 = s1.querySelector('.col > p:not(.kicker):not(.lead)'); if (p2_1) p2_1.innerHTML = dic.f1_p2;
      var cap1 = s1.querySelector('.retrato figcaption span:nth-child(2)'); if (cap1) cap1.textContent = dic.f1_local;
      var fatos = s1.querySelectorAll('.fatos .fato');
      if (fatos.length >= 5) {
        fatos[0].querySelector('dt').textContent = dic.fato_exp_t;
        fatos[0].querySelector('dd').textContent = dic.fato_exp_v;
        fatos[1].querySelector('dt').textContent = dic.fato_op_t;
        fatos[1].querySelector('dd').textContent = dic.fato_op_v;
        fatos[2].querySelector('dt').textContent = dic.fato_emp_t;
        fatos[2].querySelector('dd').innerHTML = dic.fato_emp_v;
        fatos[3].querySelector('dt').textContent = dic.fato_idioma_t;
        fatos[3].querySelector('dd').textContent = dic.fato_idioma_v;
        fatos[4].querySelector('dt').textContent = dic.fato_disp_t;
        fatos[4].querySelector('dd').textContent = dic.fato_disp_v;
      }
    }

    // 6. Fase 2 · Experiência
    if (s2) {
      var k2 = s2.querySelector('.kicker'); if (k2) k2.textContent = dic.f2_kicker;
      var h2_2 = s2.querySelector('h2'); if (h2_2) h2_2.textContent = dic.f2_titulo;
      var p2_lead = s2.querySelector('.col > p:not(.kicker)'); if (p2_lead) p2_lead.textContent = dic.f2_lead;
      var degraus = s2.querySelectorAll('ol.escada li.degrau');
      if (degraus.length >= 6) {
        // Netcracker QA
        degraus[0].querySelector('.ano').textContent = dic.exp1_ano;
        degraus[0].querySelector('.destaque').innerHTML = dic.exp1_sub;
        degraus[0].querySelector('p:not(.destaque)').innerHTML = dic.exp1_desc;

        // Netcracker Support
        degraus[1].querySelector('.ano').textContent = dic.exp2_ano;
        degraus[1].querySelector('.destaque').innerHTML = dic.exp2_sub;
        degraus[1].querySelector('p:not(.destaque)').innerHTML = dic.exp2_desc;

        // Intelektus
        degraus[2].querySelector('.ano').textContent = dic.exp3_ano;
        degraus[2].querySelector('h3').innerHTML = dic.exp3_cargo;
        degraus[2].querySelector('.destaque').innerHTML = dic.exp3_sub;
        degraus[2].querySelector('p:not(.destaque)').innerHTML = dic.exp3_desc;

        // ThinkSeg
        degraus[3].querySelector('.ano').textContent = dic.exp4_ano;
        degraus[3].querySelector('h3').innerHTML = dic.exp4_cargo;
        degraus[3].querySelector('.destaque').innerHTML = dic.exp4_sub;
        degraus[3].querySelector('p:not(.destaque)').innerHTML = dic.exp4_desc;

        // Cognizant
        degraus[4].querySelector('.ano').textContent = dic.exp5_ano;
        degraus[4].querySelector('h3').innerHTML = dic.exp5_cargo;
        degraus[4].querySelector('.destaque').innerHTML = dic.exp5_sub;
        degraus[4].querySelector('p:not(.destaque)').innerHTML = dic.exp5_desc;

        // Support
        degraus[5].querySelector('.ano').textContent = dic.exp6_ano;
        degraus[5].querySelector('h3').innerHTML = dic.exp6_cargo;
        degraus[5].querySelector('.destaque').innerHTML = dic.exp6_sub;
        degraus[5].querySelector('p:not(.destaque)').innerHTML = dic.exp6_desc;
      }
    }

    // 7. Fase 3 · Projetos
    if (s3) {
      var k3 = s3.querySelector('.kicker'); if (k3) k3.textContent = dic.f3_kicker;
      var h2_3 = s3.querySelector('h2'); if (h2_3) h2_3.textContent = dic.f3_titulo;
      var lead3 = s3.querySelector('.lead'); if (lead3) lead3.textContent = dic.f3_lead;
      var obras = s3.querySelectorAll('article.obra');
      if (obras.length >= 5) {
        // SMUG AI
        obras[0].querySelector('h3').innerHTML = dic.p1_tit;
        var p1_ps = obras[0].querySelectorAll('.obra-texto p:not(.destaque):not(.usa)');
        if (p1_ps.length >= 2) { p1_ps[0].innerHTML = dic.p1_desc; p1_ps[1].innerHTML = dic.p1_high; }

        // Top Dent
        obras[1].querySelector('h3').innerHTML = dic.p2_tit;
        var p2_ps = obras[1].querySelectorAll('.obra-texto p:not(.destaque):not(.usa)');
        if (p2_ps.length >= 2) { p2_ps[0].innerHTML = dic.p2_desc; p2_ps[1].innerHTML = dic.p2_high; }

        // OpenWorkout
        obras[2].querySelector('h3').innerHTML = dic.p3_tit;
        var p3_ps = obras[2].querySelectorAll('.obra-texto p:not(.destaque):not(.usa)');
        if (p3_ps.length >= 2) { p3_ps[0].innerHTML = dic.p3_desc; p3_ps[1].innerHTML = dic.p3_high; }

        // Sandy Pet Shop
        obras[3].querySelector('h3').innerHTML = dic.p4_tit;
        var p4_ps = obras[3].querySelectorAll('.obra-texto p:not(.destaque):not(.usa)');
        if (p4_ps.length >= 2) { p4_ps[0].innerHTML = dic.p4_desc; p4_ps[1].innerHTML = dic.p4_high; }

        // Nucleus Cleaning
        obras[4].querySelector('h3').innerHTML = dic.p5_tit;
        var p5_ps = obras[4].querySelectorAll('.obra-texto p:not(.destaque):not(.usa)');
        if (p5_ps.length >= 2) { p5_ps[0].innerHTML = dic.p5_desc; p5_ps[1].innerHTML = dic.p5_high; }
      }
    }

    // 8. Fase 4 · Atuação
    if (s4) {
      var k4 = s4.querySelector('.kicker'); if (k4) k4.textContent = dic.f4_kicker;
      var h2_4 = s4.querySelector('h2'); if (h2_4) h2_4.textContent = dic.f4_titulo;
      var p4_lead = s4.querySelector('.col > p:not(.kicker)'); if (p4_lead) p4_lead.textContent = dic.f4_lead;
      var frentes = s4.querySelectorAll('.frentes .frente');
      if (frentes.length >= 3) {
        frentes[0].querySelector('h3').innerHTML = dic.f4_a_tit;
        frentes[0].querySelector('p').innerHTML = dic.f4_a_desc;
        frentes[1].querySelector('h3').innerHTML = dic.f4_b_tit;
        frentes[1].querySelector('p').innerHTML = dic.f4_b_desc;
        frentes[2].querySelector('h3').innerHTML = dic.f4_c_tit;
        frentes[2].querySelector('p').innerHTML = dic.f4_c_desc;
      }
    }

    // 9. Fase 5 · Ferramentas / Skills
    if (s5) {
      var k5 = s5.querySelector('.kicker'); if (k5) k5.textContent = dic.f5_kicker;
      var h2_5 = s5.querySelector('h2'); if (h2_5) h2_5.textContent = dic.f5_titulo;
      var p5_lead = s5.querySelector('.col > p:not(.kicker)'); if (p5_lead) p5_lead.textContent = dic.f5_lead;
      var lis5 = s5.querySelectorAll('ul.lista li');
      if (lis5.length >= 5) {
        lis5[0].innerHTML = dic.f5_li_1;
        lis5[1].innerHTML = dic.f5_li_2;
        lis5[2].innerHTML = dic.f5_li_3;
        lis5[3].innerHTML = dic.f5_li_4;
        lis5[4].innerHTML = dic.f5_li_5;
      }
      var sites = s5.querySelectorAll('.sites .site');
      if (sites.length >= 3) {
        sites[0].querySelector('.sobre').textContent = dic.f5_site1_sub;
        sites[0].querySelector('.end').textContent = dic.f5_site1_link;
        sites[1].querySelector('.nome').innerHTML = dic.f5_site2_tit;
        sites[1].querySelector('.sobre').textContent = dic.f5_site2_sub;
        sites[1].querySelector('.end').textContent = dic.f5_site2_link;
        sites[2].querySelector('.sobre').textContent = dic.f5_site3_sub;
        sites[2].querySelector('.end').textContent = dic.f5_site3_link;
      }
    }

    // 10. Fase 6 · Formação & Relocação
    if (s6) {
      var k6 = s6.querySelector('.kicker'); if (k6) k6.textContent = dic.f6_kicker;
      var h2_6 = s6.querySelector('h2'); if (h2_6) h2_6.textContent = dic.f6_titulo;
      var p6_lead = s6.querySelector('.col > p:not(.kicker)'); if (p6_lead) p6_lead.textContent = dic.f6_lead;
      var cards6 = s6.querySelectorAll('.cartao-projeto');
      if (cards6.length >= 3) {
        cards6[0].querySelector('.tag-tipo').innerHTML = dic.f6_c1_tag;
        cards6[0].querySelector('h3').innerHTML = dic.f6_c1_tit;
        var c1_ps = cards6[0].querySelectorAll('p');
        if (c1_ps.length >= 2) { c1_ps[0].innerHTML = dic.f6_c1_inst; c1_ps[1].innerHTML = dic.f6_c1_desc; }

        cards6[1].querySelector('.tag-tipo').innerHTML = dic.f6_c2_tag;
        cards6[1].querySelector('h3').innerHTML = dic.f6_c2_tit;
        var c2_ps = cards6[1].querySelectorAll('p');
        if (c2_ps.length >= 2) { c2_ps[0].innerHTML = dic.f6_c2_inst; c2_ps[1].innerHTML = dic.f6_c2_desc; }

        cards6[2].querySelector('.tag-tipo').innerHTML = dic.f6_c3_tag;
        cards6[2].querySelector('h3').innerHTML = dic.f6_c3_tit;
        var c3_ps = cards6[2].querySelectorAll('p');
        if (c3_ps.length >= 4) {
          c3_ps[0].innerHTML = dic.f6_c3_p1;
          c3_ps[1].innerHTML = dic.f6_c3_p2;
          c3_ps[2].innerHTML = dic.f6_c3_p3;
          c3_ps[3].innerHTML = dic.f6_c3_p4;
        }
      }
    }

    // 11. Fase 7 · Conquistas
    if (s7) {
      var k7 = s7.querySelector('.kicker'); if (k7) k7.textContent = dic.f7_kicker;
      var h2_7 = s7.querySelector('h2'); if (h2_7) h2_7.textContent = dic.f7_titulo;
      var p7_lead = s7.querySelector('.col > p:not(.kicker)'); if (p7_lead) p7_lead.textContent = dic.f7_lead;
      var premios = s7.querySelectorAll('.premios .premio');
      if (premios.length >= 3) {
        premios[0].querySelector('h3').innerHTML = dic.f7_p1_tit;
        premios[0].querySelector('p:not(.equipe)').innerHTML = dic.f7_p1_desc;

        premios[1].querySelector('h3').innerHTML = dic.f7_p2_tit;
        premios[1].querySelector('p').innerHTML = dic.f7_p2_desc;

        premios[2].querySelector('h3').innerHTML = dic.f7_p3_tit;
        premios[2].querySelector('p:not(.equipe)').innerHTML = dic.f7_p3_desc;
        var eq3 = premios[2].querySelector('.equipe'); if (eq3) eq3.innerHTML = dic.f7_p3_equipe;
      }
      var citacao = s7.querySelector('.citacao p'); if (citacao) citacao.innerHTML = dic.f7_citacao;
    }

    // 12. Fase 8 · Contato
    if (s8) {
      var k8 = s8.querySelector('.kicker'); if (k8) k8.textContent = dic.f8_kicker;
      var h2_8 = s8.querySelector('h2'); if (h2_8) h2_8.textContent = dic.f8_titulo;
      var p8_lead = s8.querySelector('.lead'); if (p8_lead) p8_lead.textContent = dic.f8_lead;
      var canais = s8.querySelectorAll('.canais .canal');
      if (canais.length >= 3) {
        var wppQual = canais[2].querySelector('.qual');
        if (wppQual) wppQual.textContent = dic.f8_wpp_qual;
      }
    }

    // 13. Rodapé
    var rodLocal = document.querySelector('.rodape span:nth-child(2)');
    if (rodLocal) rodLocal.innerHTML = dic.rodape_local;

    // Recalcular spans de letras e física do mundo
    if (PV.mundo) {
      if (PV.mundo.preparar) PV.mundo.preparar();
      if (PV.mundo.medir) PV.mundo.medir();
    }

    // Notificar ouvintes
    ouvintes.forEach(function(fn){
      try { fn(lang); } catch(e){ console.error(e); }
    });
  }

  /* API pública do i18n */
  PV.i18n = {
    obterIdioma: function(){ return idiomaAtual; },
    definirIdioma: function(lang){
      if (lang !== 'pt' && lang !== 'en') lang = 'pt';
      idiomaAtual = lang;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch(_) {}
      aplicarTraducoes(lang);
    },
    alternar: function(){
      var novo = idiomaAtual === 'pt' ? 'en' : 'pt';
      PV.i18n.definirIdioma(novo);
      return novo;
    },
    t: function(chave){
      var dic = TEXTOS[idiomaAtual] || TEXTOS.pt;
      return dic[chave] || chave;
    },
    aoMudar: function(fn){
      if (typeof fn === 'function') ouvintes.push(fn);
    }
  };

  // Inicialização na carga da página
  document.addEventListener('DOMContentLoaded', function(){
    // Registrar cliques em botões de idioma
    document.querySelectorAll('#btnIdioma, #btnIdiomaHud, [data-acao="idioma"]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.preventDefault();
        var novo = PV.i18n.alternar();
        if (PV.som && PV.som.tocar) PV.som.tocar('clique');
      });
    });

    // Se o idioma salvo for inglês, aplica imediatamente
    if (idiomaAtual === 'en') {
      aplicarTraducoes('en');
    }
  });

})();
