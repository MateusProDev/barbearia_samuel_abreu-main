// ========================================
// INICIALIZADOR DE DADOS FIREBASE
// Popula collections com dados padrão da Barbearia Samuel Abreu
// ========================================

class FirebaseDataInitializer {
    constructor() {
        this.defaultData = {
            // Conteúdo Principal
            main: {
                title: "Barbearia Samuel Abreu",
                description: "11 anos renovando autoestimas com profissionais qualificados e produtos de qualidade. Venha viver essa experiência conosco.",
                mission: "Oferecer a nossos clientes através de um ambiente agradável, um bom atendimento com um serviço de qualidade, a fim de proporcionar o aumento da autoestima, em uma experiência única e pessoal.",
                keywords: "barbearia, cortes de cabelo, barba, Fortaleza, Samuel Abreu, fade, degradê, barbeiro profissional, pigmentação, sobrancelha",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: "system_initializer"
            },

            // Horários de Funcionamento
            schedule: {
                weekdayMorning: "08:00 às 12:00",
                weekdayAfternoon: "14:00 às 18:30",
                saturdayMorning: "08:00 às 12:00", 
                saturdayAfternoon: "14:00 às 18:30",
                sunday: "Fechado",
                specialNotes: "Horários podem variar em feriados",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: "system_initializer"
            },

            // Informações de Contato
            contact: {
                address: "R. Marieta Barreira, 810",
                neighborhood: "Centro",
                city: "Fortaleza",
                state: "CE",
                cep: "60000-000",
                phone: "(85) 98505-3792",
                whatsapp: "(85) 98505-3792",
                email: "contato@barbeariasamuelabreu.com",
                instagram: "https://www.instagram.com/barbearia_samuel_abreu/",
                facebook: "",
                website: "https://barbeariasamuelabreu.com",
                googleMaps: "https://maps.google.com/?q=R.+Marieta+Barreira,+810,+Fortaleza,+CE",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: "system_initializer"
            }
        };

        this.adminUsers = [
            {
                email: "admin@barbeariasamuelabreu.com",
                name: "Administrador",
                role: "admin",
                isAdmin: true,
                permissions: ["read", "write", "delete", "manage_users"],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: "system_initializer"
            },
            {
                email: "samuel@barbeariasamuelabreu.com", 
                name: "Samuel Abreu",
                role: "owner",
                isAdmin: true,
                permissions: ["read", "write", "delete", "manage_users", "owner"],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: "system_initializer"
            }
        ];

        this.servicesData = [
            {
                name: "CABELO E BARBA",
                description: "Corte completo com acabamento perfeito da barba, deixando você com visual impecável",
                price: "R$ 35,00",
                duration: "45 min",
                category: "combo",
                isActive: true
            },
            {
                name: "CORTE INFANTIL", 
                description: "Atendimento especializado para crianças com ambiente acolhedor e profissionais experientes",
                price: "R$ 20,00",
                duration: "30 min", 
                category: "infantil",
                isActive: true
            },
            {
                name: "PIGMENTAÇÃO",
                description: "Técnica avançada para cobertura de fios brancos e realce da cor natural",
                price: "R$ 40,00",
                duration: "60 min",
                category: "coloracao",
                isActive: true
            },
            {
                name: "SOBRANCELHA",
                description: "Design e modelagem de sobrancelhas para valorizar o olhar masculino", 
                price: "R$ 15,00",
                duration: "20 min",
                category: "design",
                isActive: true
            },
            {
                name: "CORTE NA TESOURA",
                description: "Técnica clássica com acabamento refinado para um visual sofisticado",
                price: "R$ 25,00", 
                duration: "40 min",
                category: "corte",
                isActive: true
            },
            {
                name: "LUZES",
                description: "Mechas e luzes para criar um visual moderno e diferenciado",
                price: "R$ 60,00",
                duration: "90 min",
                category: "coloracao", 
                isActive: true
            },
            {
                name: "PLATINADO",
                description: "Coloração platinada para um visual arrojado e contemporâneo",
                price: "R$ 80,00",
                duration: "120 min",
                category: "coloracao",
                isActive: true
            }
        ];
    }

    // Inicializar todos os dados
    async initializeAllData() {
        if (!window.db) {
            throw new Error('Firebase não inicializado');
        }

        console.log('🚀 Iniciando inicialização dos dados...');

        const results = {
            content: { created: 0, skipped: 0, errors: 0 },
            users: { created: 0, skipped: 0, errors: 0 },
            services: { created: 0, skipped: 0, errors: 0 }
        };

        try {
            // Inicializar conteúdo do site
            await this.initializeSiteContent(results.content);
            
            // Inicializar usuários admin
            await this.initializeAdminUsers(results.users);
            
            // Inicializar serviços
            await this.initializeServices(results.services);

            console.log('✅ Inicialização completa:', results);
            return results;

        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            throw error;
        }
    }

    // Inicializar conteúdo do site
    async initializeSiteContent(results) {
        console.log('📝 Inicializando conteúdo do site...');

        for (const [docId, data] of Object.entries(this.defaultData)) {
            try {
                // Verificar se já existe
                const doc = await db.collection('siteContent').doc(docId).get();
                
                if (doc.exists) {
                    console.log(`⏭️ Conteúdo já existe: ${docId}`);
                    results.skipped++;
                    continue;
                }

                // Criar documento
                await db.collection('siteContent').doc(docId).set(data);
                console.log(`✅ Criado: ${docId}`);
                results.created++;

            } catch (error) {
                console.error(`❌ Erro ao criar ${docId}:`, error);
                results.errors++;
            }
        }
    }

    // Inicializar usuários admin
    async initializeAdminUsers(results) {
        console.log('👤 Inicializando usuários admin...');

        for (const userData of this.adminUsers) {
            try {
                // Verificar se usuário já existe
                const existingUser = await db.collection('users')
                    .where('email', '==', userData.email)
                    .get();

                if (!existingUser.empty) {
                    console.log(`⏭️ Usuário já existe: ${userData.email}`);
                    results.skipped++;
                    continue;
                }

                // Criar usuário
                await db.collection('users').add(userData);
                console.log(`✅ Usuário criado: ${userData.email}`);
                results.created++;

            } catch (error) {
                console.error(`❌ Erro ao criar usuário ${userData.email}:`, error);
                results.errors++;
            }
        }
    }

    // Inicializar serviços
    async initializeServices(results) {
        console.log('✂️ Inicializando serviços...');

        for (const serviceData of this.servicesData) {
            try {
                // Verificar se serviço já existe
                const existingService = await db.collection('services')
                    .where('name', '==', serviceData.name)
                    .get();

                if (!existingService.empty) {
                    console.log(`⏭️ Serviço já existe: ${serviceData.name}`);
                    results.skipped++;
                    continue;
                }

                // Adicionar timestamps
                const serviceWithTimestamp = {
                    ...serviceData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: "system_initializer"
                };

                // Criar serviço
                await db.collection('services').add(serviceWithTimestamp);
                console.log(`✅ Serviço criado: ${serviceData.name}`);
                results.created++;

            } catch (error) {
                console.error(`❌ Erro ao criar serviço ${serviceData.name}:`, error);
                results.errors++;
            }
        }
    }

    // Verificar se inicialização é necessária
    async checkIfInitializationNeeded() {
        try {
            // Verificar se existe conteúdo principal
            const mainDoc = await db.collection('siteContent').doc('main').get();
            
            if (mainDoc.exists) {
                console.log('✅ Dados já inicializados');
                return false;
            }

            console.log('⚠️ Inicialização necessária');
            return true;

        } catch (error) {
            console.error('Erro ao verificar inicialização:', error);
            return true;
        }
    }

    // Executar inicialização completa
    async runFullInitialization() {
        try {
            const needsInit = await this.checkIfInitializationNeeded();
            
            if (!needsInit) {
                return { 
                    status: 'skipped', 
                    message: 'Dados já inicializados' 
                };
            }

            const results = await this.initializeAllData();
            
            return {
                status: 'success',
                message: 'Inicialização completa',
                details: results
            };

        } catch (error) {
            return {
                status: 'error',
                message: error.message,
                error: error
            };
        }
    }

    // Resetar dados (cuidado - apaga tudo!)
    async resetAllData() {
        if (!confirm('⚠️ ATENÇÃO: Isso apagará TODOS os dados!\n\nTem certeza?')) {
            return;
        }

        try {
            // Apagar conteúdo do site
            const contentDocs = await db.collection('siteContent').get();
            const contentBatch = db.batch();
            contentDocs.forEach(doc => contentBatch.delete(doc.ref));
            await contentBatch.commit();

            // Apagar usuários
            const userDocs = await db.collection('users').get();
            const userBatch = db.batch();
            userDocs.forEach(doc => userBatch.delete(doc.ref));
            await userBatch.commit();

            // Apagar serviços
            const serviceDocs = await db.collection('services').get();
            const serviceBatch = db.batch();
            serviceDocs.forEach(doc => serviceBatch.delete(doc.ref));
            await serviceBatch.commit();

            console.log('🗑️ Todos os dados foram removidos');
            
            // Reinicializar
            return await this.runFullInitialization();

        } catch (error) {
            console.error('Erro ao resetar dados:', error);
            throw error;
        }
    }
}

// Função global para inicializar dados
window.initializeFirebaseData = async function() {
    if (!window.db) {
        alert('❌ Firebase não inicializado. Aguarde ou recarregue a página.');
        return;
    }

    try {
        const initializer = new FirebaseDataInitializer();
        const result = await initializer.runFullInitialization();
        
        if (result.status === 'success') {
            const details = result.details;
            let message = '✅ Dados inicializados com sucesso!\n\n';
            message += `📝 Conteúdo: ${details.content.created} criados, ${details.content.skipped} já existiam\n`;
            message += `👤 Usuários: ${details.users.created} criados, ${details.users.skipped} já existiam\n`;
            message += `✂️ Serviços: ${details.services.created} criados, ${details.services.skipped} já existiam`;
            
            alert(message);
            
            // Recarregar dashboard se disponível
            if (window.dashboard) {
                window.location.reload();
            }
        } else if (result.status === 'skipped') {
            alert('ℹ️ ' + result.message);
        } else {
            alert('❌ Erro: ' + result.message);
        }

    } catch (error) {
        console.error('Erro na inicialização:', error);
        alert(`❌ Erro na inicialização: ${error.message}`);
    }
};

// Função para resetar dados
window.resetFirebaseData = async function() {
    if (!window.db) {
        alert('❌ Firebase não inicializado.');
        return;
    }

    try {
        const initializer = new FirebaseDataInitializer();
        const result = await initializer.resetAllData();
        
        alert('✅ Dados resetados e reinicializados!');
        window.location.reload();
        
    } catch (error) {
        console.error('Erro no reset:', error);
        alert(`❌ Erro no reset: ${error.message}`);
    }
};

// Auto-inicialização na primeira carga
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar Firebase carregar
    const autoInit = async () => {
        if (typeof firebase !== 'undefined' && firebase.firestore && window.db) {
            try {
                const initializer = new FirebaseDataInitializer();
                const needsInit = await initializer.checkIfInitializationNeeded();
                
                if (needsInit && window.location.pathname.includes('admin-dashboard')) {
                    console.log('🔄 Auto-inicialização detectada');
                    
                    // Mostrar botão de inicialização
                    setTimeout(() => {
                        const initBtn = document.createElement('button');
                        initBtn.textContent = '🚀 Inicializar Dados Firebase';
                        initBtn.className = 'action-btn';
                        initBtn.style.cssText = 'position: fixed; bottom: 80px; right: 20px; z-index: 1000; background: linear-gradient(45deg, #4CAF50, #45a049);';
                        initBtn.onclick = window.initializeFirebaseData;
                        
                        document.body.appendChild(initBtn);
                    }, 2000);
                }
            } catch (error) {
                console.error('Erro na verificação de inicialização:', error);
            }
        } else {
            setTimeout(autoInit, 1000);
        }
    };
    
    autoInit();
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.FirebaseDataInitializer = FirebaseDataInitializer;
}
