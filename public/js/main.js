document.addEventListener('DOMContentLoaded', () => {
    // Fix white line flash by setting loaded class
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
    
    // Initialize contact form with delay to ensure it overrides other handlers
    setTimeout(() => {
        initializeContactForm();
    }, 500);
    // --- Translation System ---
    const translations = {
        en: {
            // Navigation
            navHome: 'Home',
            navAbout: 'About',
            navServices: 'Services',
            navQuality: 'Quality Control',
            navLocations: 'Locations',
            navTeam: 'Our Team',
            navLeadership: 'Leadership',
            navBrazil: 'Brazil',
            navAAABrazil: 'AAA Brazil',
            navColombia: 'Colombia',
            navGuatemala: 'Guatemala',

            navContact: 'Contact',
            searchPlaceholder: 'Search our services, locations, or team members...',
            
            // Hero
            heroTitle: 'Coffee Trading Excellence Since 1949',
            heroSubtitle: 'Trusted partners in green coffee sourcing, quality control, and sustainable trading across Latin America',
            ctaButton: 'Get in Touch',
            
            // About
            aboutTitle: 'Our Heritage',
            aboutText1: 'It all started back in 1949 with John-Aage Bendz Erreboe Wolthers, known more commonly as John Wolthers. What began as a young food purchase Junior Buyer\'s opportunity to move to Brazil and become the green coffee buyer for the Coop Group has evolved into a multi-generational legacy of excellence in coffee trading.',
            aboutText2: 'From John Wolthers Sr.\'s pioneering work in Santos, Brazil, to Christian Wolthers\' expansion into specialty coffee markets, and now under Rasmus Wolthers\' leadership as CEO, we have built lasting relationships with producers, exporters, and buyers worldwide.',
            aboutText3: 'Today, Wolthers & Associates is responsible for over 4 million bags exported yearly, as well as over 1 million bags of Quality Control, maintaining our commitment to responsibility, transparency, relationships, and connectivity in the modern coffee industry.',
            cuppingExpertise: 'Coffee Cupping Expertise',
            yearsExcellence: 'Years of Excellence',
            bagsExported: 'Bags Exported Yearly',
            qualityControlBags: 'Quality Control Bags',
            
            // Services
            servicesTitle: 'Our Services',
            fobBrokerage: 'FOB Brokerage',
            fobDescription: 'Managing on average 3.5 million bags annually with dedicated logistics and price fixation support, connecting buyers and roasters directly to farms and coops.',
            qualityControlService: 'Quality Control',
            qualityControlDescription: 'State-of-the-art laboratories in Santos/Brazil, Buenaventura/Colombia, and Guatemala City with qualified Q Graders ensuring top quality for major brands.',
            sustainableTrading: 'Sustainable Trading',
            sustainableDescription: 'Farm cluster management ensuring great workspaces and incentivizing regenerative production practices across our network.',
            globalConnections: 'Global Connections',
            globalDescription: 'Bridging producers, coops, and exporters to buyers across Europe, Asia, North America, and Australia with comprehensive logistics support.',
            internalMarket: 'Internal Market',
            internalDescription: 'Direct involvement with farms and cooperatives, providing market insights and connecting supply with demand.',
            originServices: 'Origin Services',
            originDescription: 'Hosting trips to origin, special farm events, vessel booking assistance, and dedicated sampling request support.',
            
            // Quality Control
            qualityTitle: 'Quality Assurance Excellence',
            serviceComparison: 'Service Comparison: PSS vs SS',
            processStep: 'Process Step',
            pssHeader: 'PSS',
            ssHeader: 'SS',
            tooltipPSS: 'Pre-Shipment Sample Service',
            tooltipSS: 'Shipment Sample Service - Full Quality Assurance',
            tooltipSampleReceived: 'Initial reception and cataloging of coffee samples',
            sampleReceived: 'Sample received and registered',
            tooltipInitialAnalysis: 'Complete quality assessment including visual inspection and taste evaluation',
            initialAnalysis: 'Initial analysis, grading and cupping',
            tooltipReportClient: 'Detailed quality report delivered to client',
            reportClient: 'Report to client',
            tooltipThirdPartyCollection: 'Independent sample collection directly from shipping containers',
            thirdPartyCollection: 'Third-party sample collection at port',
            tooltipSampleComparison: 'Verification that shipped coffee matches approved pre-shipment sample',
            sampleComparison: 'Sample comparison with approved PSS',
            tooltipFinalApproval: 'Final quality verification with option to reject if standards not met',
            finalApproval: 'Final approval, or reject and restart process',
            tooltipSSStorage: 'Secure sample storage for future reference and disputes',
            ssStorage: 'SS Storage for 6 months',
            tooltipHighestReliability: 'Confidence level in quality upon arrival at destination',
            highestReliability: 'Highest reliability on arrival quality',
            tooltipLowerCost: 'Cost-effective quality control solutions',
            lowerCost: 'Lower cost',
            tooltipCertificates: 'Comprehensive documentation and regular reporting',
            certificates: 'Certificates and monthly reports',
            riskReduction: 'Risk Reduction',
            riskDescription: 'Helps reduce business risks and avoids costly rejections through comprehensive quality assurance.',
            fastLogistics: 'Fast Logistics',
            logisticsDescription: 'Quick sample logistics resulting in faster shipments and improved supply chain efficiency.',
            trustBuilding: 'Trust Building',
            trustDescription: 'Builds long-term trust with buyers and roasters through consistent quality and reliability.',
            
            // Locations
            globalPresenceTitle: 'Global Presence',
            strategicLocations: 'Our Strategic Locations Across Latin America',
            mapOfLocations: 'Map of Our Locations',
            santosBrazil: 'Santos, Brazil',
            buenaventuraColombia: 'Buenaventura, Colombia',
            guatemalaCity: 'Guatemala City, Guatemala',
            
            // Journal
            journalTitle: 'Coffee Journal',
            journalSubtitle: 'Discover the experiences and insights from our coffee origin trips, shared by travelers and coffee enthusiasts',
            devNotice: 'This Coffee Journal section is currently being developed. Check back soon for travel stories and experiences!',
            
            // Contact
            contactTitle: 'Contact Us',
            contactFormTitle: 'Send Us a Message',
            contactFormInstructions: 'Please fill out the form below and we\'ll get back to you shortly.',
            formName: 'Name',
            formNamePlaceholder: 'Name',
            formEmail: 'Email',
            formEmailPlaceholder: 'Email',
            formDepartment: 'Department',
            formSelectDepartment: 'Select Department',
            formTradingInquiries: 'Trading Inquiries',
            formLogisticsSupport: 'Logistics Support',
            formQualityControl: 'Quality Control Services',
            formSubject: 'Subject',
            formSubjectPlaceholder: 'Subject',
            formMessage: 'Message',
            formMessagePlaceholder: 'Message',
            formSendButton: 'Send Message',
            ourContactDetails: 'Our Contact Details',
            tradingInquiries: 'Trading Inquiries',
            tradingDesc: 'For all trading and brokerage related questions, quality control services, and new business opportunities.',
            logisticsSupport: 'Logistics Support',
            logisticsDesc: 'For shipping coordination, sample requests, vessel booking, and logistics assistance.',
            headquarters: 'Headquarters',
            rasmusDescription: 'Leads major negotiations and structures office operations. Guiding the company\'s growth in modern coffee trading.',
            christianDescription: 'Founded W&A in 1990, provides strategic guidance.',
            danielDescription: 'COO overseeing operations and trading. Nespresso Cluster Administrator.',
            svennDescription: 'Oversees Guatemala and Colombia labs, supports marketing across Latin America.',
            
            // Common
            tel: 'Tel',
            address: 'Address',
            email: 'Email',
            
            // Footer
            footerSearch: 'Search',
            footerSearchPlaceholder: 'Search...',
            footerServices: 'Our Services',
            footerFOB: 'FOB Brokerage',
            footerQuality: 'Quality Control',
            footerSustainable: 'Sustainable Trading',
            footerOrigin: 'Origin Services',
            footerLocations: 'Our Locations',
            footerSantos: 'Santos, Brazil',
            footerBuenaventura: 'Buenaventura, Colombia',
            footerGuatemala: 'Guatemala City, Guatemala',
            footerCompany: 'Company',
            footerAbout: 'About Us',
            footerTeam: 'Our Team',
            footerSustainability: 'Sustainability',
            footerContact: 'Contact',
            footerCopyright: '© 2024 Wolthers & Associates. Building coffee relationships since 1949.'
        },
        pt: {
            // Navigation
            navHome: 'Início',
            navAbout: 'Sobre',
            navServices: 'Serviços',
            navQuality: 'Controle de Qualidade',
            navLocations: 'Localizações',
            navTeam: 'Nossa Equipe',
            navLeadership: 'Liderança',
            navBrazil: 'Brasil',
            navAAABrazil: 'AAA Brasil',
            navColombia: 'Colômbia',
            navGuatemala: 'Guatemala',
            navContact: 'Contato',
            searchPlaceholder: 'Pesquise nossos serviços, locais ou membros da equipe...',
            
            // Hero
            heroTitle: 'Excelência em Comércio de Café Desde 1949',
            heroSubtitle: 'Parceiros confiáveis em fornecimento de café verde, controle de qualidade e comércio sustentável em toda a América Latina',
            ctaButton: 'Entre em Contato',
            
            // About
            aboutTitle: 'Nossa Herança',
            aboutText1: 'Tudo começou em 1949 com John-Aage Bendz Erreboe Wolthers, conhecido mais comumente como John Wolthers. O que começou como uma oportunidade de um jovem comprador júnior de alimentos de se mudar para o Brasil e se tornar o comprador de café verde do Grupo Coop evoluiu para um legado multigeracional de excelência no comércio de café.',
            aboutText2: 'Do trabalho pioneiro de John Wolthers Sr. em Santos, Brasil, à expansão de Christian Wolthers para mercados de café especial, e agora sob a liderança de Rasmus Wolthers como CEO, construímos relacionamentos duradouros com produtores, exportadores e compradores em todo o mundo.',
            aboutText3: 'Hoje, a Wolthers & Associates é responsável por mais de 4 milhões de sacas exportadas anualmente, bem como mais de 1 milhão de sacas de Controle de Qualidade, mantendo nosso compromisso com responsabilidade, transparência, relacionamentos e conectividade na indústria moderna de café.',
            cuppingExpertise: 'Expertise em Prova de Café',
            yearsExcellence: 'Anos de Excelência',
            bagsExported: 'Sacas Exportadas Anualmente',
            qualityControlBags: 'Sacas de Controle de Qualidade',
            
            // Services
            servicesTitle: 'Nossos Serviços',
            fobBrokerage: 'Corretagem FOB',
            fobDescription: 'Gerenciando em média 3,5 milhões de sacas anualmente com suporte dedicado de logística e fixação de preços, conectando compradores e torrefadores diretamente a fazendas e cooperativas.',
            qualityControlService: 'Controle de Qualidade',
            qualityControlDescription: 'Laboratórios de última geração em Santos/Brasil, Buenaventura/Colômbia e Cidade da Guatemala com Q Graders qualificados garantindo qualidade superior para grandes marcas.',
            sustainableTrading: 'Comércio Sustentável',
            sustainableDescription: 'Gestão de clusters de fazendas garantindo ótimos espaços de trabalho e incentivando práticas de produção regenerativa em toda nossa rede.',
            globalConnections: 'Conexões Globais',
            globalDescription: 'Conectando produtores, cooperativas e exportadores a compradores em toda Europa, Ásia, América do Norte e Austrália com suporte logístico abrangente.',
            internalMarket: 'Mercado Interno',
            internalDescription: 'Envolvimento direto com fazendas e cooperativas, fornecendo insights de mercado e conectando oferta com demanda.',
            originServices: 'Serviços de Origem',
            originDescription: 'Hospedando viagens à origem, eventos especiais em fazendas, assistência para reserva de navios e suporte dedicado para solicitações de amostras.',
            
            // Quality Control
            qualityTitle: 'Excelência em Garantia de Qualidade',
            serviceComparison: 'Comparação de Serviços: PSS vs SS',
            processStep: 'Etapa do Processo',
            pssHeader: 'PSS',
            ssHeader: 'SS',
            tooltipPSS: 'Serviço de Amostra Pré-Embarque',
            tooltipSS: 'Serviço de Amostra de Embarque - Garantia de Qualidade Total',
            tooltipSampleReceived: 'Recepção inicial e catalogação de amostras de café',
            sampleReceived: 'Amostra recebida e registrada',
            tooltipInitialAnalysis: 'Avaliação completa da qualidade, incluindo inspeção visual e avaliação de sabor',
            initialAnalysis: 'Análise inicial, classificação e cupping',
            tooltipReportClient: 'Relatório de qualidade detalhado entregue ao cliente',
            reportClient: 'Relatório ao cliente',
            tooltipThirdPartyCollection: 'Coleta independente de amostras diretamente dos contêineres de transporte',
            thirdPartyCollection: 'Coleta de amostra por terceiros no porto',
            tooltipSampleComparison: 'Verificação de que o café enviado corresponde à amostra pré-embarque aprovada',
            sampleComparison: 'Comparação de amostra com PSS aprovado',
            tooltipFinalApproval: 'Verificação final da qualidade com opção de rejeitar se os padrões não forem atendidos',
            finalApproval: 'Aprovação final, ou rejeitar e reiniciar processo',
            tooltipSSStorage: 'Armazenamento seguro de amostras para referência futura e disputas',
            ssStorage: 'Armazenamento SS por 6 meses',
            tooltipHighestReliability: 'Nível de confiança na qualidade na chegada ao destino',
            highestReliability: 'Maior confiabilidade na qualidade de chegada',
            tooltipLowerCost: 'Soluções de controle de qualidade econômicas',
            lowerCost: 'Menor custo',
            tooltipCertificates: 'Documentação abrangente e relatórios mensais',
            certificates: 'Certificados e relatórios mensais',
            riskReduction: 'Redução de Riscos',
            riskDescription: 'Ajuda a reduzir riscos comerciais e evita rejeições custosas através de garantia de qualidade abrangente.',
            fastLogistics: 'Logística Rápida',
            logisticsDescription: 'Logística rápida de amostras resultando em envios mais rápidos e melhor eficiência da cadeia de suprimentos.',
            trustBuilding: 'Construção de Confiança',
            trustDescription: 'Constrói confiança de longo prazo com compradores e torrefadores através de qualidade e confiabilidade consistentes.',
            
            // Locations
            globalPresenceTitle: 'Presença Global',
            strategicLocations: 'Nossas Localizações Estratégicas na América Latina',
            mapOfLocations: 'Mapa de Nossas Localizações',
            santosBrazil: 'Santos, Brasil',
            buenaventuraColombia: 'Buenaventura, Colômbia',
            guatemalaCity: 'Cidade da Guatemala, Guatemala',
            
            // Journal
            journalTitle: 'Viagens',
            journalSubtitle: 'Descubra as experiências e insights de nossas viagens às origens do café, compartilhadas por viajantes e entusiastas do café',
            devNotice: 'Esta seção de Viagens está atualmente em desenvolvimento. Volte em breve para histórias e experiências de viagem!',
            
            // Contact
            contactTitle: 'Entre em Contato',
            contactFormTitle: 'Envie-nos uma Mensagem',
            contactFormInstructions: 'Preencha o formulário abaixo e entraremos em contato em breve.',
            formName: 'Nome',
            formNamePlaceholder: 'Nome',
            formEmail: 'E-mail',
            formEmailPlaceholder: 'E-mail',
            formDepartment: 'Departamento',
            formSelectDepartment: 'Selecionar Departamento',
            formTradingInquiries: 'Consultas de Trading',
            formLogisticsSupport: 'Suporte Logístico',
            formQualityControl: 'Serviços de Controle de Qualidade',
            formSubject: 'Assunto',
            formSubjectPlaceholder: 'Assunto',
            formMessage: 'Mensagem',
            formMessagePlaceholder: 'Mensagem',
            formSendButton: 'Enviar Mensagem',
            ourContactDetails: 'Nossos Detalhes de Contato',
            tradingInquiries: 'Consultas de Trading',
            tradingDesc: 'Para todas as questões relacionadas ao comércio e corretagem, serviços de controle de qualidade e novas oportunidades de negócios.',
            logisticsSupport: 'Suporte Logístico',
            logisticsDesc: 'Para coordenação de transporte, solicitações de amostras, reserva de navios e assistência logística.',
            headquarters: 'Sede',
            rasmusDescription: 'Lidera grandes negociações e estrutura operações do escritório. Orientando o crescimento da empresa no comércio moderno de café.',
            christianDescription: 'Fundou a W&A em 1990, fornece orientação estratégica.',
            danielDescription: 'COO supervisionando operações e negociação. Administrador do Cluster Nespresso.',
            svennDescription: 'Supervisiona laboratórios da Guatemala e Colômbia, apoia marketing em toda a América Latina.',
            
            // Common
            tel: 'Tel',
            address: 'Endereço',
            email: 'E-mail',
            
            // Footer
            footerSearch: 'Buscar',
            footerSearchPlaceholder: 'Buscar...',
            footerServices: 'Nossos Serviços',
            footerFOB: 'Corretagem FOB',
            footerQuality: 'Controle de Qualidade',
            footerSustainable: 'Trading Sustentável',
            footerOrigin: 'Serviços de Origem',
            footerLocations: 'Nossas Localizações',
            footerSantos: 'Santos, Brasil',
            footerBuenaventura: 'Buenaventura, Colômbia',
            footerGuatemala: 'Cidade da Guatemala, Guatemala',
            footerCompany: 'Empresa',
            footerAbout: 'Sobre Nós',
            footerTeam: 'Nossa Equipe',
            footerSustainability: 'Sustentabilidade',
            footerContact: 'Contato',
            footerCopyright: '© 2024 Wolthers & Associates. Construindo relacionamentos de café desde 1949.'
        },
        es: {
            // Navigation
            navHome: 'Inicio',
            navAbout: 'Acerca de',
            navServices: 'Servicios',
            navQuality: 'Control de Calidad',
            navLocations: 'Ubicaciones',
            navTeam: 'Nuestro Equipo',
            navLeadership: 'Liderazgo',
            navBrazil: 'Brasil',
            navAAABrazil: 'AAA Brasil',
            navColombia: 'Colombia',
            navGuatemala: 'Guatemala',
            navContact: 'Contacto',
            searchPlaceholder: 'Buscar nuestros servicios, ubicaciones o miembros del equipo...',
            
            // Hero
            heroTitle: 'Excelencia en Comercio de Café Desde 1949',
            heroSubtitle: 'Socios confiables en abastecimiento de café verde, control de calidad y comercio sostenible en toda América Latina',
            ctaButton: 'Contáctanos',
            
            // About
            aboutTitle: 'Nuestra Herencia',
            aboutText1: 'Todo comenzó en 1949 con John-Aage Bendz Erreboe Wolthers, conocido más comúnmente como John Wolthers. Lo que comenzó como una oportunidad para un joven comprador junior de alimentos de mudarse a Brasil y convertirse en el comprador de café verde del Grupo Coop ha evolucionado en un legado multigeneracional de excelencia en el comercio del café.',
            aboutText2: 'Desde el trabajo pionero de John Wolthers Sr. en Santos, Brasil, hasta la expansión de Christian Wolthers en los mercados de café especial, y ahora bajo el liderazgo de Rasmus Wolthers como CEO, hemos construido relaciones duraderas con productores, exportadores y compradores en todo el mundo.',
            aboutText3: 'Hoy, Wolthers & Associates es responsable de más de 4 millones de sacos exportados anualmente, así como más de 1 millón de sacos de Control de Calidad, manteniendo nuestro compromiso con la responsabilidad, transparencia, relaciones y conectividad en la industria moderna del café.',
            cuppingExpertise: 'Experiencia en Catación de Café',
            yearsExcellence: 'Años de Excelencia',
            bagsExported: 'Sacos Exportados Anualmente',
            qualityControlBags: 'Sacos de Control de Calidad',
            
            // Services
            servicesTitle: 'Nuestros Servicios',
            fobBrokerage: 'Corretaje FOB',
            fobDescription: 'Gestionando en promedio 3.5 millones de sacos anualmente con soporte dedicado de logística y fijación de precios, conectando compradores y tostadores directamente con fincas y cooperativas.',
            qualityControlService: 'Control de Calidad',
            qualityControlDescription: 'Laboratorios de última generación en Santos/Brasil, Buenaventura/Colombia y Ciudad de Guatemala con Q Graders calificados asegurando la mejor calidad para grandes marcas.',
            sustainableTrading: 'Comercio Sostenible',
            sustainableDescription: 'Gestión de clusters de fincas asegurando excelentes espacios de trabajo e incentivando prácticas de producción regenerativa en toda nuestra red.',
            globalConnections: 'Conexiones Globales',
            globalDescription: 'Conectando productores, cooperativas y exportadores con compradores en toda Europa, Asia, América del Norte y Australia con soporte logístico integral.',
            internalMarket: 'Mercado Interno',
            internalDescription: 'Participación directa con fincas y cooperativas, proporcionando información del mercado y conectando la oferta con la demanda.',
            originServices: 'Servicios de Origen',
            originDescription: 'Organizando viajes al origen, eventos especiales en fincas, asistencia para reserva de buques y soporte dedicado para solicitudes de muestras.',
            
            // Quality Control
            qualityTitle: 'Excelencia en Garantía de Calidad',
            serviceComparison: 'Comparación de Servicios: PSS vs SS',
            processStep: 'Paso del Proceso',
            pssHeader: 'PSS',
            ssHeader: 'SS',
            tooltipPSS: 'Servicio de Muestra Pre-Envío',
            tooltipSS: 'Servicio de Muestra de Envío - Garantía de Calidad Completa',
            tooltipSampleReceived: 'Recepción inicial y catalogación de muestras de café',
            sampleReceived: 'Muestra recibida y registrada',
            tooltipInitialAnalysis: 'Evaluación completa de la calidad, incluida la inspección visual y la evaluación del sabor',
            initialAnalysis: 'Análisis inicial, clasificación y catación',
            tooltipReportClient: 'Informe de calidad detallado entregado al cliente',
            reportClient: 'Informe al cliente',
            tooltipThirdPartyCollection: 'Recolección independiente de muestras directamente de los contenedores de envío',
            thirdPartyCollection: 'Recolección de muestra por terceros en puerto',
            tooltipSampleComparison: 'Verificación de que el café enviado coincide con la muestra pre-envío aprobada',
            sampleComparison: 'Comparación de muestra con PSS aprobado',
            tooltipFinalApproval: 'Verificación final de la calidad con opción de rechazar si no se cumplen los estándares',
            finalApproval: 'Aprobación final, o rechazar y reiniciar proceso',
            tooltipSSStorage: 'Almacenamiento seguro de muestras para futuras referencias y disputas',
            ssStorage: 'Almacenamiento SS por 6 meses',
            tooltipHighestReliability: 'Nivel de confianza en la calidad al llegar al destino',
            highestReliability: 'Mayor fiabilidad en la calidad de llegada',
            tooltipLowerCost: 'Soluciones rentables de control de calidad',
            lowerCost: 'Menor costo',
            tooltipCertificates: 'Documentación completa e informes mensuales',
            certificates: 'Certificados e informes mensuales',
            riskReduction: 'Reducción de Riesgos',
            riskDescription: 'Ayuda a reducir los riesgos comerciales y evita costosos rechazos mediante una garantía de calidad integral.',
            fastLogistics: 'Logística Rápida',
            logisticsDescription: 'Logística rápida de muestras que resulta en envíos más rápidos y una mayor eficiencia de la cadena de suministro.',
            trustBuilding: 'Construcción de Confianza',
            trustDescription: 'Construye confianza a largo plazo con compradores y tostadores a través de una calidad y fiabilidad constantes.',
            
            // Locations
            globalPresenceTitle: 'Presencia Global',
            strategicLocations: 'Nuestras Ubicaciones Estratégicas en América Latina',
            mapOfLocations: 'Mapa de Nuestras Ubicaciones',
            santosBrazil: 'Santos, Brasil',
            buenaventuraColombia: 'Buenaventura, Colombia',
            guatemalaCity: 'Ciudad de Guatemala, Guatemala',
            
            // Journal
            journalTitle: 'Viajes',
            journalSubtitle: 'Descubre las experiencias e insights de nuestros viajes a los orígenes del café, compartidos por viajeros y entusiastas del café',
            devNotice: 'Esta sección de Viajes está actualmente en desarrollo. ¡Vuelve pronto para historias y experiencias de viaje!',
            
            // Contact
            contactTitle: 'Contáctanos',
            contactFormTitle: 'Envíanos un Mensaje',
            contactFormInstructions: 'Por favor, rellena el formulario a continuación y nos pondremos en contacto contigo en breve.',
            formName: 'Nombre',
            formNamePlaceholder: 'Nombre',
            formEmail: 'Correo',
            formEmailPlaceholder: 'Correo',
            formDepartment: 'Departamento',
            formSelectDepartment: 'Seleccionar Departamento',
            formTradingInquiries: 'Consultas de Trading',
            formLogisticsSupport: 'Soporte Logístico',
            formQualityControl: 'Servicios de Control de Calidad',
            formSubject: 'Asunto',
            formSubjectPlaceholder: 'Asunto',
            formMessage: 'Mensaje',
            formMessagePlaceholder: 'Mensaje',
            formSendButton: 'Enviar Mensaje',
            ourContactDetails: 'Nuestros Datos de Contacto',
            tradingInquiries: 'Consultas de Trading',
            tradingDesc: 'Para todas las consultas relacionadas con comercio y corretaje, servicios de control de calidad y nuevas oportunidades de negocio.',
            logisticsSupport: 'Soporte Logístico',
            logisticsDesc: 'Para coordinación de envíos, solicitudes de muestras, reserva de buques y asistencia logística.',
            headquarters: 'Sede Central',
            rasmusDescription: 'Lidera grandes negociaciones y estructura las operaciones de la oficina. Guiando el crecimiento de la empresa en el comercio moderno de café.',
            christianDescription: 'Fundó W&A en 1990, proporciona orientación estratégica.',
            danielDescription: 'COO supervisando operaciones y comercio. Administrador del Cluster Nespresso.',
            svennDescription: 'Supervisa laboratorios de Guatemala y Colombia, apoya marketing en toda América Latina.',
            
            // Common
            tel: 'Tel',
            address: 'Dirección',
            email: 'Correo electrónico',
            
            // Footer
            footerSearch: 'Buscar',
            footerSearchPlaceholder: 'Buscar...',
            footerServices: 'Nuestros Servicios',
            footerFOB: 'Corretaje FOB',
            footerQuality: 'Control de Calidad',
            footerSustainable: 'Comercio Sostenible',
            footerOrigin: 'Servicios de Origen',
            footerLocations: 'Nuestras Ubicaciones',
            footerSantos: 'Santos, Brasil',
            footerBuenaventura: 'Buenaventura, Colombia',
            footerGuatemala: 'Ciudad de Guatemala, Guatemala',
            footerCompany: 'Empresa',
            footerAbout: 'Acerca de Nosotros',
            footerTeam: 'Nuestro Equipo',
            footerSustainability: 'Sostenibilidad',
            footerContact: 'Contacto',
            footerCopyright: '© 2024 Wolthers & Associates. Construyendo relaciones de café desde 1949.'
        }
    };

    let currentLang = localStorage.getItem('lang') || 'en';

    /**
     * Applies translations to elements with data-lang-key attributes.
     */
    const applyTranslations = () => {
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (translations[currentLang] && translations[currentLang][key]) {
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', translations[currentLang][key]);
                } else if (element.tagName === 'TEXTAREA' && element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', translations[currentLang][key]);
                } else if (element.hasAttribute('data-tooltip')) {
                    element.setAttribute('data-tooltip', translations[currentLang][key]);
                } else {
                    element.textContent = translations[currentLang][key];
                }
            }
        });

        // Handle tooltip translations for interactive elements
        document.querySelectorAll('[data-tooltip-key]').forEach(element => {
            const tooltipKey = element.getAttribute('data-tooltip-key');
            if (translations[currentLang] && translations[currentLang][tooltipKey]) {
                element.setAttribute('data-tooltip', translations[currentLang][tooltipKey]);
            }
        });

        // Update active language button in top header
        document.querySelectorAll('.top-header .lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-lang') === currentLang) {
                btn.classList.add('active');
            }
        });

        // Update current language display in footer
        const currentLangSpan = document.getElementById('current-lang');
        if (currentLangSpan) {
            currentLangSpan.textContent = currentLang.toUpperCase();
        }
    };

    /**
     * Switches the website language.
     * @param {string} lang - The language code (e.g., 'en', 'pt', 'es').
     */
    const switchLanguage = (lang) => {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        applyTranslations();
        setupTooltips();
    };

    // Event listeners for top header language buttons
    document.querySelectorAll('.top-header .lang-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            switchLanguage(event.target.getAttribute('data-lang'));
        });
    });

    // Event listeners for footer language dropdown
    document.querySelectorAll('.footer-language-dropdown-content a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            switchLanguage(event.target.getAttribute('data-lang'));
            const dropdownContent = event.target.closest('.footer-language-dropdown-content');
            if (dropdownContent) {
                dropdownContent.style.display = 'none';
            }
        });
    });

    // Apply translations on initial load
    applyTranslations();

    // --- Interactive Tooltips ---
    const setupTooltips = () => {
        // Initialize tooltips for all interactive elements
        document.querySelectorAll('.interactive-tooltip').forEach(element => {
            // Set initial tooltip content from data-tooltip-key if available
            const tooltipKey = element.getAttribute('data-tooltip-key');
            if (tooltipKey && translations[currentLang] && translations[currentLang][tooltipKey]) {
                element.setAttribute('data-tooltip', translations[currentLang][tooltipKey]);
            }
        });
    };

    // Setup tooltips on initial load
    setupTooltips();

    // --- Header Visibility on Scroll ---
    const topHeader = document.querySelector('.top-header');
    const mainHeader = document.querySelector('header');
    const mainContent = document.querySelector('.main-content');
    let lastScrollY = window.scrollY;
    let topHeaderHeight = topHeader.offsetHeight;
    let mainHeaderHeight = mainHeader.offsetHeight;

    const adjustMainContentMargin = () => {
        if (topHeader.classList.contains('hidden')) {
            mainContent.style.marginTop = `${mainHeaderHeight}px`;
        } else {
            mainContent.style.marginTop = `${topHeaderHeight + mainHeaderHeight}px`;
        }
    };

    window.addEventListener('scroll', () => {
        topHeaderHeight = topHeader.offsetHeight;
        mainHeaderHeight = mainHeader.offsetHeight;

        if (window.scrollY > lastScrollY && window.scrollY > topHeaderHeight) {
            topHeader.classList.add('hidden');
            mainHeader.style.top = '0';
        } else if (window.scrollY < lastScrollY || window.scrollY <= topHeaderHeight) {
            topHeader.classList.remove('hidden');
            mainHeader.style.top = `${topHeaderHeight}px`;
        }
        lastScrollY = window.scrollY;
        adjustMainContentMargin();
    });

    // Initial adjustment on load
    window.addEventListener('load', () => {
        topHeaderHeight = topHeader.offsetHeight;
        mainHeaderHeight = mainHeader.offsetHeight;
        adjustMainContentMargin();
    });

    window.addEventListener('resize', () => {
        topHeaderHeight = topHeader.offsetHeight;
        mainHeaderHeight = mainHeader.offsetHeight;
        adjustMainContentMargin();
    });

    // --- Mobile Navigation (Hamburger Menu) ---
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');

    hamburgerMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburgerMenu.classList.toggle('active');
        
        if (navLinks.classList.contains('active')) {
            const headerHeight = document.querySelector('header').offsetHeight;
            navLinks.style.paddingTop = `${headerHeight + 20}px`;
            setTimeout(() => {
                navLinks.classList.add('open');
            }, 10);
        } else {
            navLinks.classList.remove('open');
        }
    });

    // Close mobile menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('open');
                hamburgerMenu.classList.remove('active');
                setTimeout(() => {
                    navLinks.classList.remove('active');
                }, 400);
            }
        });
    });

    // --- Image Fallback ---
    const logoImg = document.querySelector('.logo-img');
    const logoText = document.querySelector('.logo-text');

    if (logoImg) {
        logoImg.addEventListener('error', () => {
            logoImg.style.display = 'none';
            if (logoText) {
                logoText.style.display = 'block';
            }
        });
    }

    // Generic image fallback for other images with an adjacent placeholder
    document.querySelectorAll('img.lazyload').forEach(img => {
        img.addEventListener('error', () => {
            img.style.display = 'none';
            const placeholder = img.nextElementSibling;
            if (placeholder && placeholder.classList.contains('image-placeholder')) {
                placeholder.style.display = 'flex';
            }
        });
    });

    // --- Lazy Loading Images ---
    const lazyImages = document.querySelectorAll('img.lazyload');

    const lazyLoad = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                img.classList.remove('lazyload');
                observer.unobserve(img);
            }
        });
    };

    if ('IntersectionObserver' in window) {
        const lazyLoadObserver = new IntersectionObserver(lazyLoad, {
            rootMargin: '0px 0px 100px 0px',
            threshold: 0.01
        });

        lazyImages.forEach(img => {
            if (img.dataset.src) {
                lazyLoadObserver.observe(img);
            }
        });
    } else {
        lazyImages.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            img.classList.remove('lazyload');
        });
    }

    // --- Fade-in on Scroll for Sections ---
    const fadeInSections = document.querySelectorAll('.fade-in');

    const fadeInObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    });

    fadeInSections.forEach(section => {
        fadeInObserver.observe(section);
    });

    // --- Dropdown Accessibility ---
    document.querySelectorAll('.dropdown > a').forEach(dropdownToggle => {
        dropdownToggle.addEventListener('focus', () => {
            dropdownToggle.parentElement.classList.add('show-dropdown');
        });
        dropdownToggle.addEventListener('blur', (event) => {
            if (!dropdownToggle.parentElement.contains(event.relatedTarget)) {
                dropdownToggle.parentElement.classList.remove('show-dropdown');
            }
        });
    });

    document.querySelectorAll('.dropdown-content a').forEach(dropdownLink => {
        dropdownLink.addEventListener('blur', (event) => {
            const parentDropdown = dropdownLink.closest('.dropdown');
            if (parentDropdown && !parentDropdown.contains(event.relatedTarget)) {
                parentDropdown.classList.remove('show-dropdown');
            }
        });
    });

    // Contact form will be initialized separately with delay
    
    /**
     * Shows form success/error messages
     * @param {string} message - The message to display
     * @param {string} type - 'success' or 'error'
     */
    function showFormMessage(message, type) {
        // Remove any existing messages
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = message;
        
        // Style the message
        messageDiv.style.cssText = `
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 500;
            ${type === 'success' 
                ? 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;' 
                : 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
            }
        `;
        
        // Insert message after form
        const contactFormElement = document.getElementById('contactForm');
        if (contactFormElement) {
            contactFormElement.parentNode.insertBefore(messageDiv, contactFormElement.nextSibling);
            
            // Auto-remove message after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
            
            // Scroll to message
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // --- Global Cross-Site Search Functionality ---
    const createGlobalSearch = () => {
        // Define all searchable pages with their content structure
        const sitePages = [
            {
                url: 'index.html',
                title: 'Home - Wolthers & Associates',
                sections: [
                    { type: 'hero', selector: '#home h1, #home p' },
                    { type: 'about', selector: '#about h2, #about p' },
                    { type: 'services', selector: '#services h2, #services h3, #services p' },
                    { type: 'quality', selector: '#quality-control h2, #quality-control h3, #quality-control p, #quality-control td' },
                    { type: 'locations', selector: '#locations h2, #locations h3, #locations p, #locations address' },
                    { type: 'contact', selector: '#contact h2, #contact h3, #contact p' }
                ]
            },
            {
                url: 'team.html',
                title: 'Our Team - Wolthers & Associates',
                sections: [
                    { type: 'team', selector: '.hero h1, .hero p' },
                    { type: 'leadership', selector: '#leadership h2, #leadership .team-name, #leadership .team-position, #leadership .team-description' },
                    { type: 'brazil', selector: '#brazil-santos h2, #brazil-santos .team-name, #brazil-santos .team-position, #brazil-santos .team-description' },
                    { type: 'aaa-team', selector: '#brazil-aaa h2, #brazil-aaa .team-name, #brazil-aaa .team-position, #brazil-aaa .team-description' },
                    { type: 'colombia', selector: '#buenaventura-colombia h2, #buenaventura-colombia .team-name, #buenaventura-colombia .team-position, #buenaventura-colombia .team-description' },
                    { type: 'guatemala', selector: '#guatemala-city h2, #guatemala-city .team-name, #guatemala-city .team-position, #guatemala-city .team-description' }
                ]
            },
            {
                url: 'journal.html',
                title: 'Coffee Journal - Wolthers & Associates',
                sections: [
                    { type: 'journal', selector: 'h1, h2, h3, p, .article-title, .article-content' }
                ]
            },
            {
                url: 'trips/index.html',
                title: 'Coffee Origin Trips - Wolthers & Associates',
                sections: [
                    { type: 'trips', selector: 'h1, h2, h3, p, .trip-card h3, .trip-card p' }
                ]
            },
            {
                url: 'trips/accounts.html',
                title: 'Accounts - Coffee Origin Trips',
                sections: [
                    { type: 'accounts', selector: 'h1, h2, h3, p' }
                ]
            },
            {
                url: 'trips/trip-pages/brazil-coffee-origins-tour.html',
                title: 'Brazil Coffee Origins Tour',
                sections: [
                    { type: 'trip-details', selector: 'h1, h2, h3, p, .itinerary-item h4, .itinerary-item p' }
                ]
            }
        ];

        // Create search index from current page
        const createSearchIndex = () => {
            const searchIndex = [];
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            
            sitePages.forEach(page => {
                const isCurrentPage = page.url.endsWith(currentPage) || 
                    (currentPage === '' && page.url === 'index.html') ||
                    (window.location.pathname.includes('trips/') && page.url.includes('trips/'));
                
                if (isCurrentPage) {
                    // Index current page content
                    page.sections.forEach(section => {
                        const elements = document.querySelectorAll(section.selector);
                        elements.forEach(element => {
                            const text = element.textContent.trim();
                            if (text) {
                                searchIndex.push({
                                    url: page.url,
                                    pageTitle: page.title,
                                    sectionType: section.type,
                                    content: text,
                                    element: element,
                                    isCurrentPage: true
                                });
                            }
                        });
                    });
                } else {
                    // For other pages, we'll need to fetch content or provide static content
                    // For now, add basic page info that can be searched
                    searchIndex.push({
                        url: page.url,
                        pageTitle: page.title,
                        sectionType: 'page',
                        content: page.title,
                        element: null,
                        isCurrentPage: false
                    });
                }
            });
            
            return searchIndex;
        };

        // Enhanced search index with static content for cross-page search
        const staticSearchContent = {
            'index.html': [
                { type: 'hero', content: 'Coffee Trading Excellence Since 1949 Wolthers Associates' },
                { type: 'about', content: 'John Wolthers Christian Wolthers Rasmus Wolthers heritage coffee trading Brazil Santos' },
                { type: 'services', content: 'FOB Brokerage Quality Control Sustainable Trading Global Connections Internal Market Origin Services' },
                { type: 'locations', content: 'Santos Brazil Buenaventura Colombia Guatemala City Central America' },
                { type: 'quality', content: 'PSS SS Quality Control Laboratory Q Graders testing analysis' }
            ],
            'team.html': [
                { type: 'leadership', content: 'Rasmus Wolthers CEO Christian Wolthers Chairman Daniel Wolthers COO leadership team' },
                { type: 'brazil', content: 'Svenn Wolthers Tom Sullivan Edgar Gomes Anderson Nunes Boeri Ferrari Santos Brazil team' },
                { type: 'aaa-team', content: 'Rhafael Gonçalves Caio Diniz Yara Melo Luciano Corsi Gabriel Oliveira Nespresso AAA sustainable' },
                { type: 'colombia', content: 'Hector Posada Sandra Bonilla Arishay Pulgarin Ana Molina Diana Saavedra Colombia Buenaventura' },
                { type: 'guatemala', content: 'Edgar Guillen Wilson Larias Hector Subuyuj Guatemala Central America quality control' }
            ],
            'journal.html': [
                { type: 'journal', content: 'coffee journal articles blog news updates specialty coffee industry insights' }
            ],
            'trips/index.html': [
                { type: 'trips', content: 'coffee origin trips Brazil Colombia Guatemala travel experiences farm visits' }
            ],
            'trips/accounts.html': [
                { type: 'accounts', content: 'accounts login partner access trip bookings travel arrangements' }
            ],
            'trips/trip-pages/brazil-coffee-origins-tour.html': [
                { type: 'trip-details', content: 'Brazil coffee origins tour farm visits Santos Sao Paulo coffee production experience' }
            ]
        };

        const performGlobalSearch = (query) => {
            if (!query || query.length < 2) return [];
            
            const searchIndex = createSearchIndex();
            const results = [];
            const queryLower = query.toLowerCase();
            
            // Search current page content (detailed)
            searchIndex.forEach(item => {
                if (item.content.toLowerCase().includes(queryLower)) {
                    results.push({
                        ...item,
                        relevance: item.isCurrentPage ? 100 : 50,
                        matchType: 'exact'
                    });
                }
            });

            // Search static content for other pages
            Object.entries(staticSearchContent).forEach(([pageUrl, sections]) => {
                const page = sitePages.find(p => p.url === pageUrl);
                if (!page) return;
                
                const isCurrentPage = window.location.pathname.includes(pageUrl.replace('.html', '')) || 
                    (pageUrl === 'index.html' && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')));
                
                if (!isCurrentPage) {
                    sections.forEach(section => {
                        if (section.content.toLowerCase().includes(queryLower)) {
                            results.push({
                                url: pageUrl,
                                pageTitle: page.title,
                                sectionType: section.type,
                                content: section.content,
                                element: null,
                                isCurrentPage: false,
                                relevance: 25,
                                matchType: 'static'
                            });
                        }
                    });
                }
            });

            // Sort by relevance
            return results.sort((a, b) => b.relevance - a.relevance);
        };

        const displaySearchResults = (results, query) => {
            // Remove existing search results
            document.querySelectorAll('.search-results-overlay').forEach(el => el.remove());
            
            if (results.length === 0) {
                showSearchMessage(`No results found for "${query}"`);
                return;
            }

            // Create results overlay
            const overlay = document.createElement('div');
            overlay.className = 'search-results-overlay';
            overlay.innerHTML = `
                <div class="search-results-container">
                    <div class="search-results-header">
                        <h3>Search Results for "${query}" (${results.length} found)</h3>
                        <button class="close-search-results">&times;</button>
                    </div>
                    <div class="search-results-list">
                        ${results.slice(0, 10).map(result => `
                            <div class="search-result-item ${result.isCurrentPage ? 'current-page' : 'other-page'}">
                                <div class="result-page-title">${result.pageTitle}</div>
                                <div class="result-content">${highlightQuery(result.content, query)}</div>
                                <div class="result-actions">
                                    ${result.isCurrentPage ? 
                                        `<button class="scroll-to-result" data-section="${result.sectionType}">View on this page</button>` :
                                        `<a href="${result.url}" class="visit-page">Visit page</a>`
                                    }
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Add event listeners
            overlay.querySelector('.close-search-results').addEventListener('click', () => {
                overlay.remove();
                clearSearchHighlights();
            });

            // Handle scroll to result for current page
            overlay.querySelectorAll('.scroll-to-result').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const sectionType = e.target.dataset.section;
                    const result = results.find(r => r.sectionType === sectionType && r.isCurrentPage);
                    if (result && result.element) {
                        clearSearchHighlights();
                        result.element.classList.add('search-highlight');
                        result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        overlay.remove();
                    }
                });
            });

            // Close overlay when clicking outside
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    clearSearchHighlights();
                }
            });
        };

        const highlightQuery = (text, query) => {
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        };

        const clearSearchHighlights = () => {
            document.querySelectorAll('.search-highlight').forEach(el => {
                el.classList.remove('search-highlight');
            });
        };

        const showSearchMessage = (message) => {
            // Create temporary message overlay
            const messageEl = document.createElement('div');
            messageEl.className = 'search-message';
            messageEl.textContent = message;
            messageEl.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: #2c5530;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            `;
            
            document.body.appendChild(messageEl);
            
            setTimeout(() => {
                messageEl.remove();
            }, 3000);
        };

        return { performGlobalSearch, displaySearchResults, clearSearchHighlights };
    };

    // Initialize global search
    const globalSearch = createGlobalSearch();

    const setupSearch = (searchInput, searchBtn) => {
        if (!searchInput || !searchBtn) return;
        
        const performSearch = () => {
            const query = searchInput.value.trim();
            if (!query || query.length < 2) {
                globalSearch.clearSearchHighlights();
                return;
            }
            
            const results = globalSearch.performGlobalSearch(query);
            globalSearch.displaySearchResults(results, query);
        };
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Add real-time search with debounce
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = searchInput.value.trim();
                if (query.length >= 3) {
                    const results = globalSearch.performGlobalSearch(query);
                    if (results.length > 0) {
                        // Show subtle indicator that results are available
                        searchInput.style.borderColor = '#d4af37';
                    } else {
                        searchInput.style.borderColor = '';
                    }
                } else {
                    searchInput.style.borderColor = '';
                    globalSearch.clearSearchHighlights();
                }
            }, 300);
        });
    };

    // Setup search for both header and footer
    setupSearch(
        document.querySelector('.search-input'),
        document.querySelector('.search-btn')
    );

    setupSearch(
        document.querySelector('.footer-search-input'),
        document.querySelector('.footer-search-btn')
    );

    // Add CSS for search functionality
    const searchStyle = document.createElement('style');
    searchStyle.textContent = `
        .search-highlight {
            background-color: rgba(212, 175, 55, 0.3) !important;
            padding: 2px 4px;
            border-radius: 3px;
            transition: background-color 0.3s ease;
        }

        .search-results-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding-top: 100px;
            overflow-y: auto;
        }

        .search-results-container {
            background: white;
            border-radius: 10px;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .search-results-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #2c5530;
            color: white;
            border-radius: 10px 10px 0 0;
        }

        .search-results-header h3 {
            margin: 0;
            font-size: 1.2rem;
        }

        .close-search-results {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }

        .close-search-results:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .search-results-list {
            padding: 0;
        }

        .search-result-item {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            transition: background-color 0.2s ease;
        }

        .search-result-item:hover {
            background-color: #f8f9fa;
        }

        .search-result-item.current-page {
            border-left: 4px solid #d4af37;
        }

        .search-result-item.other-page {
            border-left: 4px solid #2c5530;
        }

        .result-page-title {
            font-weight: bold;
            color: #2c5530;
            font-size: 0.9rem;
            margin-bottom: 5px;
        }

        .result-content {
            color: #333;
            line-height: 1.4;
            margin-bottom: 10px;
        }

        .result-content mark {
            background-color: rgba(212, 175, 55, 0.4);
            padding: 1px 2px;
            border-radius: 2px;
        }

        .result-actions {
            display: flex;
            gap: 10px;
        }

        .scroll-to-result,
        .visit-page {
            background: #2c5530;
            color: white;
            border: none;
            padding: 5px 12px;
            border-radius: 5px;
            text-decoration: none;
            font-size: 0.85rem;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .scroll-to-result:hover,
        .visit-page:hover {
            background: #1a3d1e;
        }

        .visit-page {
            display: inline-block;
        }

        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }

        @media (max-width: 768px) {
            .search-results-overlay {
                padding-top: 80px;
            }
            
            .search-results-container {
                width: 95%;
                max-height: 85vh;
            }
            
            .search-results-header {
                padding: 15px;
            }
            
            .search-result-item {
                padding: 12px 15px;
            }
        }
    `;
    document.head.appendChild(searchStyle);

    console.log('Wolthers & Associates website initialized successfully');
});

// --- Contact Form Initialization (Separate to override conflicts) ---
function initializeContactForm() {
    console.log('Initializing contact form...');
    
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) {
        console.error('Contact form not found');
        return;
    }
    
    // Remove any existing event listeners that might conflict
    contactForm.removeAttribute('action');
    contactForm.removeAttribute('method');
    contactForm.removeAttribute('data-netlify');
    contactForm.removeAttribute('netlify-honeypot');
    
    // Remove all existing submit event listeners
    const newForm = contactForm.cloneNode(true);
    contactForm.parentNode.replaceChild(newForm, contactForm);
    
    console.log('Contact form cleaned, adding JSON handler...');
    
    // Add our JSON handler with highest priority
    newForm.addEventListener('submit', async function(e) {
        console.log('Form submit event triggered');
        e.preventDefault(); // Prevent default form submission
        e.stopPropagation(); // Stop any bubbling that might trigger default behavior
        e.stopImmediatePropagation(); // Stop all other event handlers
        
        // Get form data
        const formData = new FormData(this);
        
        // Convert FormData to plain object, then to JSON
        const jsonData = {
            name: formData.get('name')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            department: formData.get('department') || '',
            subject: formData.get('subject')?.trim() || '',
            message: formData.get('message')?.trim() || ''
        };
        
        // Debug logging
        console.log('Form submission - JSON data:', jsonData);
        
        // Validate required fields on frontend
        if (!jsonData.name || !jsonData.email || !jsonData.department || !jsonData.subject || !jsonData.message) {
            showFormMessage('Please fill in all required fields.', 'error');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(jsonData.email)) {
            showFormMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            // Send JSON data to PHP
            console.log('Sending to PHP:', JSON.stringify(jsonData));
            
            const response = await fetch('./contact.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));
            
            const result = await response.json();
            console.log('Response data:', result);
            
            if (result.success) {
                showFormMessage(result.message, 'success');
                newForm.reset(); // Clear form on success
            } else {
                showFormMessage(result.message || 'An error occurred. Please try again.', 'error');
            }
            
        } catch (error) {
            console.error('Contact form error:', error);
            showFormMessage('Network error. Please check your connection and try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
    
    console.log('Contact form JSON handler attached successfully');
}