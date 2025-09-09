// Sistema de Sincronização de Imagens - Site
console.log('🔄 Carregando site-image-sync.js');

// Configuração Firebase (será inicializado pelo index.html)
// const firebaseConfig = já inicializado no index.html

class SiteImageSync {
    constructor() {
        console.log('🔄 Inicializando SiteImageSync...');
        this.isFirebaseReady = false;
        this.currentImages = [];
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando sistema de sincronização...');
        await this.waitForFirebase();
        this.setupFirebaseListener();
        await this.loadImagesFromFirebase();
        
        // Configurar observer após inicialização
        setTimeout(() => {
            this.setupDOMObserver();
        }, 1000);
    }

    waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    console.log('🔥 Firebase carregado com sucesso');
                    this.isFirebaseReady = true;
                    resolve();
                } else {
                    console.log('⏳ Aguardando Firebase...');
                    setTimeout(checkFirebase, 500);
                }
            };
            checkFirebase();
        });
    }

    setupFirebaseListener() {
        if (!this.isFirebaseReady) return;
        
        console.log('👂 Configurando listener em tempo real...');
        const db = firebase.firestore();

        // Query idêntica ao dashboard
        const query = db.collection('images')
            .where('active', '!=', false)
            .orderBy('active')
            .orderBy('createdAt', 'desc');

        // Listener em tempo real
        this.unsubscribe = query.onSnapshot((snapshot) => {
            console.log(`📡 Atualização recebida: ${snapshot.size} imagens`);
            
            const images = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                images.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                });
            });

            this.currentImages = images;
            this.updateSiteImages();
            
        }, (error) => {
            console.error('❌ Erro no listener:', error);
            // Fallback - usar query sem índice
            this.loadImagesWithoutIndex();
        });
    }

    async loadImagesWithoutIndex() {
        try {
            console.log('🔄 Usando query alternativa...');
            const db = firebase.firestore();
            const snapshot = await db.collection('images').get();
            
            const images = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.active !== false) {
                    images.push({
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date()
                    });
                }
            });

            // Ordenar manualmente
            images.sort((a, b) => b.createdAt - a.createdAt);
            
            this.currentImages = images;
            this.updateSiteImages();
            
        } catch (error) {
            console.error('❌ Erro no fallback:', error);
        }
    }

    async loadImagesFromFirebase() {
        try {
            if (!this.isFirebaseReady) {
                console.warn('⚠️ Firebase não está pronto');
                return;
            }

            console.log('📥 Carregando imagens do Firebase...');
            const db = firebase.firestore();
            
            // Estratégia 1: Tentar query com índice
            try {
                console.log('🔍 Tentativa 1: Query com índice...');
                const snapshot = await db.collection('images')
                    .where('active', '!=', false)
                    .orderBy('active')
                    .orderBy('createdAt', 'desc')
                    .get();
                
                console.log('✅ Query com índice funcionou');
                this.processFirebaseSnapshot(snapshot);
                return;
                
            } catch (indexError) {
                console.warn('⚠️ Query com índice falhou:', indexError.message);
            }

            // Estratégia 2: Query simples sem índice
            try {
                console.log('🔍 Tentativa 2: Query simples...');
                const snapshot = await db.collection('images').get();
                console.log('✅ Query simples funcionou');
                this.processFirebaseSnapshot(snapshot);
                return;
                
            } catch (simpleError) {
                console.warn('⚠️ Query simples falhou:', simpleError.message);
            }

            // Estratégia 3: Tentar coleção diferente ou carregar dados locais
            console.error('❌ Todas as estratégias de carregamento falharam');

        } catch (error) {
            console.error('❌ Erro geral ao carregar imagens:', error);
            
            // Fallback: tentar carregar qualquer coisa disponível
            this.tryEmergencyLoad();
        }
    }

    tryEmergencyLoad() {
        console.log('🚨 Modo de emergência: tentando carregar dados alternativos...');
        
        // Se já temos algumas imagens, usar elas
        if (this.currentImages && this.currentImages.length > 0) {
            console.log('♻️ Usando imagens já carregadas');
            this.updateSiteImages();
            return;
        }

        // Tentar verificar localStorage
        const localImages = localStorage.getItem('firebase_images_cache');
        if (localImages) {
            try {
                const parsedImages = JSON.parse(localImages);
                console.log('💾 Imagens encontradas no cache local:', parsedImages.length);
                this.currentImages = parsedImages;
                this.updateSiteImages();
                return;
            } catch (e) {
                console.warn('⚠️ Cache local inválido');
            }
        }

        console.warn('📭 Nenhuma imagem disponível em modo de emergência');
    }

    processFirebaseSnapshot(snapshot) {
        console.log(`📊 Processando snapshot com ${snapshot.size} documentos...`);
        
        const images = [];
        let processedCount = 0;
        let activeCount = 0;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            processedCount++;
            
            console.log(`📄 Documento ${processedCount}: ${data.title || 'sem título'}`);
            console.log(`   - Ativo: ${data.active !== false ? 'SIM' : 'NÃO'}`);
            console.log(`   - Seção: ${data.section || 'não definida'}`);
            console.log(`   - URL: ${data.cloudinaryUrl || data.url || 'sem URL'}`);
            
            // Incluir apenas imagens ativas
            if (data.active !== false) {
                activeCount++;
                images.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                });
            }
        });

        console.log(`✅ Processamento concluído: ${activeCount}/${processedCount} imagens ativas`);
        
        // Ordenar manualmente se necessário
        images.sort((a, b) => b.createdAt - a.createdAt);
        
        this.currentImages = images;
        
        // Salvar cache local
        try {
            localStorage.setItem('firebase_images_cache', JSON.stringify(images));
            console.log('💾 Cache local salvo');
        } catch (e) {
            console.warn('⚠️ Não foi possível salvar cache local');
        }
        
        this.updateSiteImages();
    }

    updateSiteImages() {
        console.log('🎨 Atualizando imagens do site...');
        
        if (!this.currentImages || this.currentImages.length === 0) {
            console.warn('📭 Nenhuma imagem disponível');
            return;
        }

        // Organizar imagens por categoria
        const imagesByCategory = this.organizeImagesByCategory();
        
        // Atualizar cada seção
        this.updateHeroSection(imagesByCategory.hero);
        this.updateServicesSection(imagesByCategory.services);
        this.updateGallerySection(imagesByCategory.gallery);
        this.updateTeamSection(imagesByCategory.team);
    }

    organizeImagesByCategory() {
        const categories = {
            hero: [],
            services: [],
            gallery: [],
            team: []
        };

        this.currentImages.forEach(image => {
            // Usar o campo 'section' do Firebase se disponível
            const section = image.section || 'gallery';
            
            if (categories[section]) {
                categories[section].push(image);
            } else {
                // Fallback para galeria se seção não reconhecida
                categories.gallery.push(image);
            }
        });

        console.log('📋 Imagens organizadas por seção Firebase:', {
            hero: categories.hero.length,
            services: categories.services.length,
            gallery: categories.gallery.length,
            team: categories.team.length
        });

        // Debug detalhado
        console.log('🔍 DEBUG - Detalhes das imagens:');
        this.currentImages.forEach((image, index) => {
            console.log(`  ${index + 1}. "${image.title}" - Seção: "${image.section || 'indefinida'}" - URL: ${image.cloudinaryUrl || image.url || 'sem URL'}`);
        });

        return categories;
    }

    updateHeroSection(heroImages) {
        if (!heroImages || heroImages.length === 0) {
            console.log('🌟 Nenhuma imagem de hero encontrada');
            return;
        }

        console.log(`🌟 Atualizando hero com: ${heroImages[0].title}`);
        const heroSection = document.querySelector('.hero');
        
        if (!heroSection) {
            console.warn('⚠️ Seção .hero não encontrada');
            return;
        }

        const heroImage = heroImages[0];
        const imageUrl = heroImage.cloudinaryUrl || heroImage.url;
        
        if (imageUrl) {
            // Aplicar apenas como background, preservando o conteúdo
            heroSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${imageUrl}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
            
            console.log('✅ Background do hero atualizado');
        }
    }

    updateServicesSection(servicesImages) {
        if (!servicesImages || servicesImages.length === 0) {
            console.log('✂️ Nenhuma imagem de serviços encontrada');
            return;
        }

        console.log(`✂️ Atualizando serviços com ${servicesImages.length} imagens`);
        const serviceCards = document.querySelectorAll('.service-card img');
        
        if (serviceCards.length === 0) {
            console.warn('⚠️ Cards de serviço não encontrados');
            return;
        }

        // Mapear imagens para cards específicos baseado no título
        const serviceMapping = {
            'cabelo e barba': 0,
            'corte infantil': 1,
            'pigmentação': 2,
            'sobrancelha': 3,
            'tesoura': 4,
            'luzes': 5,
            'platinado': 6
        };

        servicesImages.forEach(image => {
            const title = (image.title || '').toLowerCase();
            const cardIndex = this.findServiceCardIndex(title, serviceMapping);
            
            if (cardIndex !== -1 && serviceCards[cardIndex]) {
                const imageUrl = image.cloudinaryUrl || image.url;
                if (imageUrl) {
                    serviceCards[cardIndex].src = imageUrl;
                    console.log(`✅ Serviço ${cardIndex} atualizado: ${image.title}`);
                }
            }
        });
    }

    findServiceCardIndex(title, mapping) {
        for (const [key, index] of Object.entries(mapping)) {
            if (title.includes(key)) {
                return index;
            }
        }
        return -1;
    }

    updateGallerySection(galleryImages) {
        console.log(`🖼️ Iniciando atualização da galeria...`);
        console.log(`📊 Imagens de galeria recebidas:`, galleryImages?.length || 0);
        
        const galleryGrid = document.querySelector('.gallery-grid');
        
        if (!galleryGrid) {
            console.error('❌ .gallery-grid não encontrado no DOM');
            return;
        }

        console.log('✅ Elemento .gallery-grid encontrado');

        // Se não há imagens específicas de galeria, usar todas as imagens disponíveis
        let imagesToShow = galleryImages;
        
        if (!galleryImages || galleryImages.length === 0) {
            console.warn('⚠️ Nenhuma imagem específica de galeria - usando todas as imagens');
            imagesToShow = this.currentImages || [];
        }

        if (imagesToShow.length === 0) {
            console.warn('📭 Nenhuma imagem disponível para mostrar');
            return;
        }

        console.log(`🔄 Atualizando galeria com ${imagesToShow.length} imagens`);

        // Limpar galeria atual
        galleryGrid.innerHTML = '';
        console.log('🧹 Galeria limpa');

        // Adicionar indicador de carregamento elegante
        const loadingElement = document.createElement('div');
        loadingElement.className = 'gallery-loading';
        loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Carregando galeria...</p>
        `;
        galleryGrid.appendChild(loadingElement);

        // Remover loading após um tempo
        setTimeout(() => {
            if (loadingElement.parentNode) {
                loadingElement.remove();
            }
        }, 1000);

        // Adicionar imagens
        imagesToShow.forEach((image, index) => {
            const imageUrl = image.cloudinaryUrl || image.url;
            if (!imageUrl) {
                console.warn(`⚠️ Imagem ${index} sem URL válida:`, image);
                return;
            }

            console.log(`➕ Adicionando imagem ${index + 1}: "${image.title}"`);
            console.log(`   URL: ${imageUrl}`);
            console.log(`   Seção: ${image.section || 'não definida'}`);
            
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item fade-in';
            galleryItem.style.opacity = '0'; // Começar invisível para animação
            galleryItem.innerHTML = `
                <img src="${imageUrl}" alt="${image.title || 'Corte'}" loading="lazy"
                     onerror="console.error('❌ ERRO ao carregar imagem:', '${image.title}', this.src); this.style.display='none';"
                     onload="this.parentElement.style.opacity='1'; console.log('✅ Imagem carregada com sucesso:', '${image.title}')">
                <div class="gallery-overlay">
                    <h3>${image.title || 'Corte Profissional'}</h3>
                    <p>${image.description || 'Estilo único e personalizado'}</p>
                    <button class="view-btn">Ver Detalhes</button>
                </div>
            `;
            
            // Adicionar evento de clique para modal
            galleryItem.addEventListener('click', () => {
                this.openImageModal(imageUrl, image.title, image.description);
            });
            
            galleryGrid.appendChild(galleryItem);
            
            // Animação de entrada com delay progressivo
            setTimeout(() => {
                galleryItem.style.opacity = '1';
                galleryItem.style.transform = 'translateY(0)';
            }, index * 100);
        });

        console.log(`✅ GALERIA TOTALMENTE ATUALIZADA: ${imagesToShow.length} imagens adicionadas`);
        
        // Forçar exibição da galeria (sem estilos de debug)
        setTimeout(() => {
            this.ensureGalleryVisible();
        }, 100);
    }

    // Método para garantir que a galeria seja visível
    ensureGalleryVisible() {
        console.log('🎯 Garantindo visibilidade da galeria...');
        
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) {
            console.error('❌ .gallery-grid não encontrado');
            return;
        }

        // Forçar exibição do grid principal (sem cores de debug)
        galleryGrid.style.display = 'grid';
        galleryGrid.style.opacity = '1';
        galleryGrid.style.visibility = 'visible';
        
        // Verificar e corrigir items da galeria
        const items = galleryGrid.children;
        console.log(`📊 Verificando ${items.length} items da galeria...`);
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // Garantir que o item seja visível (mantendo estilo original)
            item.style.display = 'block';
            item.style.opacity = '1';
            item.style.visibility = 'visible';
            
            const img = item.querySelector('img');
            if (img) {
                // Garantir que a imagem seja visível
                img.style.display = 'block';
                img.style.width = '100%';
                img.style.height = 'auto';
                
                console.log(`✅ Item ${i + 1} configurado: ${img.alt}`);
            } else {
                console.warn(`⚠️ Item ${i + 1} sem imagem`);
            }
        }
        
        console.log('✅ Visibilidade da galeria garantida');
    }

    // Configurar observador para mudanças no DOM
    setupDOMObserver() {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;

        // Observer para mudanças na galeria
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    console.log('🔍 Observer: Novos elementos adicionados à galeria');
                    setTimeout(() => {
                        this.ensureGalleryVisible();
                    }, 200);
                }
            });
        });

        observer.observe(galleryGrid, {
            childList: true,
            subtree: true
        });

        console.log('👁️ Observer da galeria configurado');
    }

    // Modal para visualizar imagens
    openImageModal(imageUrl, title, description) {
        console.log('🖼️ Abrindo modal para:', title);

        // Remover modal existente se houver
        const existingModal = document.querySelector('.image-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Criar modal
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <img src="${imageUrl}" alt="${title}" class="modal-image">
                <div class="modal-info">
                    <h3>${title || 'Corte Profissional'}</h3>
                    <p>${description || 'Estilo único e personalizado'}</p>
                    <a href="https://wa.link/19u2v4" target="_blank" class="btn btn-whatsapp">
                        📱 Agendar este corte
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Eventos do modal
        const backdrop = modal.querySelector('.modal-backdrop');
        const closeBtn = modal.querySelector('.modal-close');
        
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        };

        backdrop.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        
        // Fechar com ESC
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });

        // Animação de entrada
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    updateTeamSection(teamImages) {
        if (!teamImages || teamImages.length === 0) {
            console.log('👥 Nenhuma imagem de equipe encontrada');
            return;
        }

        console.log(`👥 Atualizando equipe com ${teamImages.length} imagens`);
        
        // Procurar pelo carrossel da equipe no site
        const teamContainer = document.querySelector('.carousel-container') || 
                             document.querySelector('.team-carousel') ||
                             document.querySelector('#equipe');
        
        if (!teamContainer) {
            console.warn('⚠️ Container da equipe não encontrado');
            return;
        }

        // Buscar imagens da equipe existentes
        const teamImages_existing = teamContainer.querySelectorAll('img');
        
        if (teamImages_existing.length > 0) {
            console.log(`🔄 Atualizando ${teamImages_existing.length} imagens da equipe`);
            
            teamImages.forEach((image, index) => {
                if (teamImages_existing[index]) {
                    const imageUrl = image.cloudinaryUrl || image.url;
                    if (imageUrl) {
                        teamImages_existing[index].src = imageUrl;
                        teamImages_existing[index].alt = image.title || 'Membro da Equipe';
                        console.log(`✅ Equipe ${index} atualizada: ${image.title}`);
                    }
                }
            });
        } else {
            console.log('ℹ️ Nenhuma estrutura de equipe encontrada para atualizar');
        }
    }

    // Método público para forçar atualização
    forceUpdate() {
        console.log('🔄 Forçando atualização...');
        this.loadImagesFromFirebase();
    }

    // Método de debug público
    debugImages() {
        console.log('🔍 DEBUG COMPLETO:');
        console.log('📊 Total de imagens:', this.currentImages?.length || 0);
        console.log('🔥 Firebase pronto:', this.isFirebaseReady);
        
        if (this.currentImages && this.currentImages.length > 0) {
            const bySection = this.organizeImagesByCategory();
            console.log('📋 Por seção:', bySection);
            
            this.currentImages.forEach((img, i) => {
                console.log(`${i + 1}. ${img.title} (${img.section || 'sem seção'}) - ${img.cloudinaryUrl || img.url || 'sem URL'}`);
            });
        } else {
            console.warn('❌ Nenhuma imagem carregada');
        }
        
        const galleryGrid = document.querySelector('.gallery-grid');
        console.log('🎯 Elemento .gallery-grid:', galleryGrid ? 'encontrado' : 'NÃO encontrado');
        
        return this.currentImages;
    }

    // Destruir listener
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            console.log('🛑 Listener desconectado');
        }
    }
}

// Inicialização automática
let siteSync = null;

function initSiteSync() {
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase não encontrado');
        setTimeout(initSiteSync, 1000);
        return;
    }

    console.log('🚀 Inicializando sincronização do site...');
    siteSync = new SiteImageSync();
    
    // Disponibilizar globalmente
    window.siteSync = siteSync;
    window.SiteImageSync = SiteImageSync;
    
    // Configurar debug automático
    setupAutoDebug();
}

function setupAutoDebug() {
    console.log('🔧 Configurando debug automático...');
    
    // Forçar atualização após carregamento
    setTimeout(() => {
        if (siteSync) {
            console.log('🔄 Debug: Forçando primeira atualização...');
            siteSync.forceUpdate();
            
            // Verificar novamente após um tempo
            setTimeout(() => {
                console.log('🔍 Debug: Verificação final...');
                siteSync.ensureGalleryVisible();
            }, 3000);
        }
    }, 2000);
    
    // Função de debug disponível globalmente
    window.forceGalleryUpdate = () => {
        if (siteSync) {
            console.log('🔄 Forçando atualização manual da galeria...');
            siteSync.forceUpdate();
            setTimeout(() => siteSync.ensureGalleryVisible(), 1000);
        }
    };
    
    console.log('✅ Debug automático configurado');
}

// Aguardar DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteSync);
} else {
    initSiteSync();
}

// Fallback
setTimeout(() => {
    if (!siteSync) {
        console.log('🔄 Tentativa tardia de inicialização...');
        initSiteSync();
    }
}, 3000);

console.log('✅ site-image-sync.js carregado');
