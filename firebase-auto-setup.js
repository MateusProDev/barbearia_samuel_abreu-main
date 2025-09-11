// Sistema de Configuração Automática Firebase
console.log('🚀 Firebase Auto Setup carregando...');

class FirebaseAutoSetup {
    constructor() {
        this.isSetupComplete = false;
        this.init();
    }

    async init() {
        console.log('🔥 Iniciando configuração automática do Firebase...');
        await this.waitForFirebase();
        await this.setupInitialData();
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    console.log('✅ Firebase carregado');
                    resolve();
                } else {
                    setTimeout(checkFirebase, 500);
                }
            };
            checkFirebase();
        });
    }

    async setupInitialData() {
        try {
            const db = firebase.firestore();

            // Verificar se já existe configuração
            const mainDoc = await db.collection('siteContent').doc('main').get();
            
            if (!mainDoc.exists) {
                console.log('📝 Criando configuração inicial...');
                await this.createInitialContent();
            } else {
                console.log('✅ Configuração já existe');
            }

            // Verificar e criar imagens exemplo se necessário
            await this.createExampleImages();

            this.isSetupComplete = true;
            console.log('🎉 Configuração automática concluída!');

        } catch (error) {
            console.error('❌ Erro na configuração automática:', error);
        }
    }

    async createInitialContent() {
        const db = firebase.firestore();
        
        try {
            // Conteúdo Principal
            await db.collection('siteContent').doc('main').set({
                title: "Barbearia Samuel Abreu",
                description: "11 anos renovando autoestimas com profissionais qualificados e produtos de qualidade. Venha viver essa experiência conosco.",
                mission: "Oferecer a nossos clientes através de um ambiente agradável, um bom atendimento com um serviço de qualidade, a fim de proporcionar o aumento da autoestima, em uma experiência única e pessoal.",
                keywords: "barbearia, cortes de cabelo, barba, Fortaleza, Samuel Abreu, fade, degradê, barbeiro profissional",
                metaDescription: "Barbearia Samuel Abreu - 11 anos renovando autoestimas com profissionais qualificados. Cortes modernos, barba, pigmentação e muito mais.",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Horários de Funcionamento
            await db.collection('siteContent').doc('schedule').set({
                weekdayMorning: "08:00 às 12:00",
                weekdayAfternoon: "14:00 às 18:50",
                saturdayMorning: "08:00 às 12:00",
                saturdayAfternoon: "14:00 às 17:30",
                sunday: "Fechado",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Informações de Contato
            await db.collection('siteContent').doc('contact').set({
                address: "R. Marieta Barreira, 810\nSabiaguaba, Fortaleza - CE",
                phone: "(85) 8505-3792",
                email: "contato@barbeariasamuelabreu.com",
                whatsapp: "https://wa.link/19u2v4",
                instagram: "@barbearia_samuel_abreu",
                facebook: "https://www.facebook.com/profile.php?id=100009466104944",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Conteúdo inicial criado');

        } catch (error) {
            console.error('❌ Erro ao criar conteúdo inicial:', error);
            throw error;
        }
    }

    async createExampleImages() {
        const db = firebase.firestore();
        
        try {
            // Verificar se já existem imagens
            const imagesSnapshot = await db.collection('images').limit(1).get();
            
            if (!imagesSnapshot.empty) {
                console.log('✅ Imagens já existem no sistema');
                return;
            }

            console.log('📸 Criando estrutura de imagens exemplo...');

            // Imagens exemplo usando as imagens locais existentes
            const exampleImages = [
                // Banner/Hero
                {
                    title: "Banner Principal",
                    description: "Imagem principal da barbearia",
                    section: "hero",
                    url: "img/barbearia.jpeg",
                    active: true
                },
                
                // Serviços
                {
                    title: "Cabelo e Barba",
                    description: "Corte completo com acabamento perfeito da barba",
                    section: "services",
                    url: "img/cabelo e barba.jpeg",
                    active: true
                },
                {
                    title: "Corte Infantil",
                    description: "Atendimento especializado para crianças",
                    section: "services",
                    url: "img/Corte infantil.jpeg",
                    active: true
                },
                {
                    title: "Pigmentação",
                    description: "Técnica avançada para cobertura de fios brancos",
                    section: "services",
                    url: "img/pigmentacao.jpeg",
                    active: true
                },
                {
                    title: "Sobrancelha",
                    description: "Design e modelagem de sobrancelhas masculinas",
                    section: "services",
                    url: "img/sombracelha.jpeg",
                    active: true
                },
                {
                    title: "Corte na Tesoura",
                    description: "Técnica clássica com acabamento refinado",
                    section: "services",
                    url: "img/classico na tesoura.jpeg",
                    active: true
                },
                {
                    title: "Luzes",
                    description: "Mechas e luzes para visual moderno",
                    section: "services",
                    url: "img/luzes.jpeg",
                    active: true
                },
                {
                    title: "Platinado",
                    description: "Coloração platinada para visual arrojado",
                    section: "services",
                    url: "img/platinado.jpeg",
                    active: true
                },

                // Galeria de Cortes
                {
                    title: "Taper Fade Americano",
                    description: "Estilo americano moderno com degradê",
                    section: "gallery",
                    url: "img/Corte taper fade Americano.jpeg",
                    active: true
                },
                {
                    title: "Mid Fade",
                    description: "Sombreado gradual a partir da metade da cabeça",
                    section: "gallery",
                    url: "img/Mid fade.jpeg",
                    active: true
                },
                {
                    title: "High Fade",
                    description: "Acabamentos versáteis: régua, freestyle, disfarçado",
                    section: "gallery",
                    url: "img/High fadeDegradê alto.jpeg",
                    active: true
                },
                {
                    title: "Social Clássico",
                    description: "Elegância atemporal com linhas limpas",
                    section: "gallery",
                    url: "img/Social Clássico..jpeg",
                    active: true
                },
                {
                    title: "Corte Social",
                    description: "Modelo tradicional para todas as ocasiões",
                    section: "gallery",
                    url: "img/corte_social.jpeg",
                    active: true
                },

                // Equipe
                {
                    title: "Samuel Abreu",
                    description: "Proprietário e Barbeiro Master",
                    section: "team",
                    url: "img/proprietario.jpeg",
                    active: true
                },
                {
                    title: "Nossa Barbearia",
                    description: "Ambiente acolhedor e moderno",
                    section: "team",
                    url: "img/barbearia.jpeg",
                    active: true
                },
                {
                    title: "Samuel Abreu Trabalhando",
                    description: "Profissionalismo em ação - 11 anos de experiência",
                    section: "team",
                    url: "img/proprietario 2.jpeg",
                    active: true
                },
                {
                    title: "Estrutura da Barbearia",
                    description: "Equipamentos modernos e ambiente profissional",
                    section: "team",
                    url: "img/pro1.jpeg",
                    active: true
                },
                {
                    title: "Dedicação ao Trabalho",
                    description: "Atenção aos detalhes em cada corte",
                    section: "team",
                    url: "img/pro2.jpeg",
                    active: true
                },
                {
                    title: "Resultados Satisfatórios",
                    description: "Clientes satisfeitos com o trabalho",
                    section: "team",
                    url: "img/pro3.jpeg",
                    active: true
                },
                {
                    title: "Kaio",
                    description: "Barbeiro Profissional da equipe",
                    section: "team",
                    url: "img/kaioUm.jpeg",
                    active: true
                },
                {
                    title: "Kaio em Ação",
                    description: "Experiência e talento em cada atendimento",
                    section: "team",
                    url: "img/kaioDois.jpeg",
                    active: true
                },
                {
                    title: "Mestre Samuel",
                    description: "Arte e precisão em todos os trabalhos",
                    section: "team",
                    url: "img/samu.jpeg",
                    active: true
                },

                // Instalações
                {
                    title: "Ambiente da Barbearia",
                    description: "Estrutura moderna e acolhedora",
                    section: "instalacoes",
                    url: "img/pro1.jpeg",
                    active: true
                },
                {
                    title: "Trabalho em Andamento",
                    description: "Dedicação e atenção aos detalhes",
                    section: "instalacoes",
                    url: "img/pro2.jpeg",
                    active: true
                },
                {
                    title: "Cliente Satisfeito",
                    description: "Resultados que falam por si",
                    section: "instalacoes",
                    url: "img/pro3.jpeg",
                    active: true
                }
            ];

            // Adicionar imagens ao Firebase
            const batch = db.batch();
            
            exampleImages.forEach((imageData) => {
                const docRef = db.collection('images').doc();
                batch.set(docRef, {
                    ...imageData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: 'auto-setup'
                });
            });

            await batch.commit();
            console.log(`✅ ${exampleImages.length} imagens exemplo criadas`);

        } catch (error) {
            console.error('❌ Erro ao criar imagens exemplo:', error);
        }
    }

    // Função pública para resetar dados (cuidado!)
    async resetAllData() {
        if (!confirm('⚠️ ATENÇÃO: Isso vai APAGAR TODOS os dados do Firebase. Tem certeza?')) {
            return false;
        }

        if (!confirm('🚨 CONFIRMAÇÃO FINAL: Todos os dados serão perdidos permanentemente!')) {
            return false;
        }

        try {
            const db = firebase.firestore();

            console.log('🗑️ Removendo dados existentes...');

            // Remover conteúdo
            const contentDocs = ['main', 'schedule', 'contact'];
            const contentPromises = contentDocs.map(doc => 
                db.collection('siteContent').doc(doc).delete()
            );
            await Promise.all(contentPromises);

            // Remover todas as imagens
            const imagesSnapshot = await db.collection('images').get();
            const imagePromises = imagesSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(imagePromises);

            console.log('🔄 Recriando dados iniciais...');
            await this.createInitialContent();
            await this.createExampleImages();

            console.log('✅ Reset completo concluído!');
            return true;

        } catch (error) {
            console.error('❌ Erro no reset:', error);
            throw error;
        }
    }

    // Função para inicializar dados mesmo se já existirem (forçar)
    async forceInitialization() {
        try {
            console.log('🔄 Forçando inicialização de dados...');
            await this.createInitialContent();
            await this.createExampleImages();
            console.log('✅ Inicialização forçada concluída!');
        } catch (error) {
            console.error('❌ Erro na inicialização forçada:', error);
            throw error;
        }
    }
}

// Função para inicialização automática
function initializeFirebaseAutoSetup() {
    console.log('🚀 Iniciando Firebase Auto Setup...');
    
    if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase não encontrado, tentando novamente em 2s...');
        setTimeout(initializeFirebaseAutoSetup, 2000);
        return;
    }

    window.firebaseAutoSetup = new FirebaseAutoSetup();
}

// Funcões globais para uso no dashboard
window.initializeFirebaseData = async () => {
    if (window.firebaseAutoSetup) {
        await window.firebaseAutoSetup.forceInitialization();
        alert('✅ Dados inicializados com sucesso!');
        window.location.reload();
    } else {
        alert('❌ Sistema não está pronto. Tente novamente.');
    }
};

window.resetFirebaseData = async () => {
    if (window.firebaseAutoSetup) {
        const success = await window.firebaseAutoSetup.resetAllData();
        if (success) {
            alert('✅ Reset concluído com sucesso!');
            window.location.reload();
        }
    } else {
        alert('❌ Sistema não está pronto. Tente novamente.');
    }
};

// Iniciar automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebaseAutoSetup);
} else {
    initializeFirebaseAutoSetup();
}

console.log('✅ Firebase Auto Setup carregado');
