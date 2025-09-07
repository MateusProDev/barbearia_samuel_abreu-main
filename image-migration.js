// ========================================
// MIGRAÇÃO DE IMAGENS EXISTENTES
// Organiza imagens atuais por seções no Firebase
// ========================================

class ImageMigration {
    constructor() {
        this.imageMapping = {
            // SEÇÃO SERVIÇOS
            services: [
                {
                    filename: 'img/cabelo e barba.jpeg',
                    title: 'CABELO E BARBA',
                    description: 'Corte completo com acabamento perfeito da barba, deixando você com visual impecável'
                },
                {
                    filename: 'img/Corte infantil.jpeg',
                    title: 'CORTE INFANTIL',
                    description: 'Atendimento especializado para crianças com ambiente acolhedor e profissionais experientes'
                },
                {
                    filename: 'img/pigmentacao.jpeg',
                    title: 'PIGMENTAÇÃO',
                    description: 'Técnica avançada para cobertura de fios brancos e realce da cor natural'
                },
                {
                    filename: 'img/sombracelha.jpeg',
                    title: 'SOBRANCELHA',
                    description: 'Design e modelagem de sobrancelhas para valorizar o olhar masculino'
                },
                {
                    filename: 'img/classico na tesoura.jpeg',
                    title: 'CORTE NA TESOURA',
                    description: 'Técnica clássica com acabamento refinado para um visual sofisticado'
                },
                {
                    filename: 'img/luzes.jpeg',
                    title: 'LUZES',
                    description: 'Mechas e luzes para criar um visual moderno e diferenciado'
                },
                {
                    filename: 'img/platinado.jpeg',
                    title: 'PLATINADO',
                    description: 'Coloração platinada para um visual arrojado e contemporâneo'
                }
            ],

            // SEÇÃO GALERIA
            gallery: [
                {
                    filename: 'img/Corte taper fade Americano.jpeg',
                    title: 'Taper Fade Americano',
                    description: 'Estilo americano moderno com degradê apenas no início da parte de trás'
                },
                {
                    filename: 'img/Mid fade.jpeg',
                    title: 'Mid Fade',
                    description: 'Sombreado gradual visível e marcado a partir da metade da cabeça'
                },
                {
                    filename: 'img/High fadeDegradê alto.jpeg',
                    title: 'High Fade',
                    description: 'Degradê alto com transição suave e acabamento moderno'
                },
                {
                    filename: 'img/Social Clássico..jpeg',
                    title: 'Social Clássico',
                    description: 'Corte social tradicional com toque contemporâneo'
                },
                {
                    filename: 'img/corte_social.jpeg',
                    title: 'Corte Social',
                    description: 'Estilo social refinado para o dia a dia profissional'
                },
                {
                    filename: 'img/Low fadeDegradê baixo.jpeg',
                    title: 'Low Fade',
                    description: 'Degradê baixo discreto e elegante'
                },
                {
                    filename: 'img/freestyle.jpeg',
                    title: 'Freestyle',
                    description: 'Corte personalizado e criativo'
                },
                {
                    filename: 'img/Curly hair..jpeg',
                    title: 'Cabelo Cacheado',
                    description: 'Especialização em cabelos cacheados e crespos'
                }
            ],

            // SEÇÃO EQUIPE/AMBIENTE
            team: [
                {
                    filename: 'img/proprietario.jpeg',
                    title: 'Samuel Abreu',
                    description: 'Proprietário e Barbeiro Master com 11 anos de experiência'
                },
                {
                    filename: 'img/proprietario 2.jpeg',
                    title: 'Profissionalismo',
                    description: 'Dedicação e atenção aos detalhes em cada atendimento'
                },
                {
                    filename: 'img/barbearia.jpeg',
                    title: 'Nossa Barbearia',
                    description: 'Ambiente acolhedor e moderno para seu conforto'
                },
                {
                    filename: 'img/pro1.jpeg',
                    title: 'Estrutura Moderna',
                    description: 'Equipamentos de última geração para melhor resultado'
                },
                {
                    filename: 'img/pro2.jpeg',
                    title: 'Trabalho Especializado',
                    description: 'Técnicas avançadas e produtos de qualidade'
                },
                {
                    filename: 'img/pro3.jpeg',
                    title: 'Resultados Excepcionais',
                    description: 'Clientes satisfeitos e transformações incríveis'
                },
                {
                    filename: 'img/kaioUm.jpeg',
                    title: 'Kaio - Barbeiro',
                    description: 'Barbeiro profissional especializado em cortes modernos'
                },
                {
                    filename: 'img/kaioDois.jpeg',
                    title: 'Equipe Qualificada',
                    description: 'Profissionais treinados e experientes'
                },
                {
                    filename: 'img/samu.jpeg',
                    title: 'Samuel em Ação',
                    description: 'Barbeiro master demonstrando sua técnica'
                },
                {
                    filename: 'img/forcemen.jpeg',
                    title: 'Força e Estilo',
                    description: 'Combinação perfeita de masculinidade e elegância'
                }
            ],

            // SEÇÃO HERO/LOGO
            hero: [
                {
                    filename: 'img/logo_barber.png',
                    title: 'Logo Barbearia Samuel Abreu',
                    description: 'Logotipo oficial da barbearia'
                },
                {
                    filename: 'img/logo_baber_branco.png',
                    title: 'Logo Branco',
                    description: 'Versão branca do logotipo para fundos escuros'
                }
            ]
        };
    }

    // Migrar todas as imagens existentes
    async migrateAllImages() {
        if (!window.db) {
            console.error('Firebase não inicializado');
            return;
        }

        const results = {
            success: 0,
            errors: 0,
            skipped: 0
        };

        for (const [section, images] of Object.entries(this.imageMapping)) {
            console.log(`📂 Migrando seção: ${section}`);
            
            for (const imageData of images) {
                try {
                    // Verificar se a imagem já existe no Firebase
                    const exists = await this.checkImageExists(imageData.filename, section);
                    
                    if (exists) {
                        console.log(`⏭️ Imagem já existe: ${imageData.filename}`);
                        results.skipped++;
                        continue;
                    }

                    // Criar registro no Firebase (sem upload, usando URL local)
                    await this.createImageRecord(imageData, section);
                    
                    console.log(`✅ Migrada: ${imageData.title}`);
                    results.success++;
                    
                } catch (error) {
                    console.error(`❌ Erro ao migrar ${imageData.filename}:`, error);
                    results.errors++;
                }
            }
        }

        console.log('📊 Resultados da migração:', results);
        return results;
    }

    // Verificar se imagem já existe no Firebase
    async checkImageExists(filename, section) {
        const snapshot = await db.collection('images')
            .where('section', '==', section)
            .where('filename', '==', filename)
            .get();
        
        return !snapshot.empty;
    }

    // Criar registro da imagem no Firebase
    async createImageRecord(imageData, section) {
        const record = {
            title: imageData.title,
            description: imageData.description,
            section: section,
            url: imageData.filename, // URL local por enquanto
            filename: imageData.filename,
            isMigrated: true,
            needsUpload: true, // Flag para indicar que precisa fazer upload
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            migratedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: 'migration_script'
        };

        await db.collection('images').add(record);
    }

    // Converter imagem local para Cloudinary
    async uploadLocalImageToCloudinary(filename) {
        try {
            // Buscar a imagem no diretório local
            const response = await fetch(filename);
            const blob = await response.blob();
            
            // Criar File object
            const file = new File([blob], filename.split('/').pop(), { type: blob.type });
            
            // Usar o ImageManager para fazer upload
            if (window.ImageManager) {
                const manager = new ImageManager();
                return await manager.uploadImageToCloudinary(file);
            }
            
            throw new Error('ImageManager não disponível');
            
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            throw error;
        }
    }

    // Atualizar URLs locais para URLs do Cloudinary
    async upgradeLocalImages() {
        const snapshot = await db.collection('images')
            .where('needsUpload', '==', true)
            .get();

        const results = {
            upgraded: 0,
            errors: 0
        };

        for (const doc of snapshot.docs) {
            try {
                const data = doc.data();
                
                // Upload para Cloudinary
                const cloudinaryResult = await this.uploadLocalImageToCloudinary(data.filename);
                
                // Atualizar registro no Firebase
                await doc.ref.update({
                    url: cloudinaryResult.url,
                    publicId: cloudinaryResult.publicId,
                    width: cloudinaryResult.width,
                    height: cloudinaryResult.height,
                    needsUpload: false,
                    uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log(`🔄 URL atualizada: ${data.title}`);
                results.upgraded++;

            } catch (error) {
                console.error(`❌ Erro ao atualizar ${doc.data().title}:`, error);
                results.errors++;
            }
        }

        return results;
    }

    // Executar migração completa
    async runFullMigration() {
        console.log('🚀 Iniciando migração completa...');
        
        // Passo 1: Migrar estrutura
        const migrationResults = await this.migrateAllImages();
        console.log('✅ Migração de estrutura concluída:', migrationResults);
        
        // Aguardar um pouco antes do próximo passo
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Passo 2: Fazer upload das imagens (opcional)
        // const uploadResults = await this.upgradeLocalImages();
        // console.log('✅ Upload para Cloudinary concluído:', uploadResults);
        
        console.log('🎉 Migração completa finalizada!');
        
        return {
            migration: migrationResults
            // upload: uploadResults
        };
    }
}

// Função global para executar migração
window.runImageMigration = async function() {
    if (!window.db) {
        alert('❌ Firebase não inicializado. Aguarde ou recarregue a página.');
        return;
    }

    if (confirm('🔄 Deseja migrar as imagens existentes para o Firebase?\n\nIsso organizará todas as imagens por seções.')) {
        const migration = new ImageMigration();
        
        try {
            const results = await migration.runFullMigration();
            
            alert(`✅ Migração concluída!\n\n📊 Resultados:\n- Sucesso: ${results.migration.success}\n- Erros: ${results.migration.errors}\n- Ignoradas: ${results.migration.skipped}`);
            
            // Recarregar imagens no dashboard se disponível
            if (window.dashboard && window.dashboard.imageManager) {
                await window.dashboard.imageManager.loadImages();
            }
            
        } catch (error) {
            console.error('Erro na migração:', error);
            alert(`❌ Erro na migração: ${error.message}`);
        }
    }
};

// Adicionar botão de migração ao dashboard se não existir
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.location.pathname.includes('admin-dashboard')) {
            const migrationBtn = document.createElement('button');
            migrationBtn.textContent = '🔄 Migrar Imagens Existentes';
            migrationBtn.className = 'action-btn';
            migrationBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000; background: linear-gradient(45deg, #ff9800, #f57c00);';
            migrationBtn.onclick = window.runImageMigration;
            
            document.body.appendChild(migrationBtn);
        }
    }, 3000);
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ImageMigration = ImageMigration;
}
