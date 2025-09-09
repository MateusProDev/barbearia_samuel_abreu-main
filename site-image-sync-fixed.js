// ========================================
// SISTEMA DE SINCRONIZAÇÃO AUTOMÁTICA
// Vincula Dashboard ↔ Site em Tempo Real
// ========================================

class SiteImageSync {
    constructor() {
        this.firebaseReady = false;
        this.init(); 
    }

    init() {
        console.log('🔄 Inicializando Sistema de Sincronização de Imagens...');
        this.waitForFirebase();
    }

    // Aguardar Firebase estar pronto
    waitForFirebase() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            console.log('🔥 Firebase detectado! Configurando sincronização...');
            this.firebaseReady = true;
            this.setupFirebaseListeners();
            this.loadImagesFromFirebase();
        } else {
            console.log('⏳ Aguardando Firebase carregar...');
            setTimeout(() => this.waitForFirebase(), 500);
        }
    }

    // Configurar listeners em tempo real do Firebase
    setupFirebaseListeners() {
        if (!this.firebaseReady) return;

        const db = firebase.firestore();

        // Listener para mudanças nas imagens com detalhes
        db.collection('images').onSnapshot((snapshot) => {
            console.log('📡 Mudanças detectadas no Firebase - atualizando site...');
            
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data();
                const docId = change.doc.id;
                
                if (change.type === 'added') {
                    console.log('➕ Nova imagem detectada no site:', data.title);
                }
                if (change.type === 'modified') {
                    console.log('✏️ Imagem modificada no site:', data.title);
                }
                if (change.type === 'removed') {
                    console.log('🗑️ Imagem removida no site:', docId);
                }
            });
            
            // Atualizar site com pequeno delay para evitar updates múltiplos
            this.debounceUpdate();
        }, (error) => {
            console.error('❌ Erro no listener Firebase (site):', error);
        });

        // Listener para mudanças via localStorage (comunicação com dashboard)
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebase_images_updated') {
                console.log('🔄 Sincronização solicitada via localStorage');
                this.updateSiteImages();
            }
        });

        // Listener para eventos customizados
        window.addEventListener('firebaseImagesUpdated', (e) => {
            console.log('🔄 Evento customizado de sincronização recebido');
            this.updateSiteImages();
        });
    }

    // Debounce para evitar updates excessivos
    debounceUpdate() {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            this.updateSiteImages();
        }, 1000);
    }

    // Método público para atualizar imagens
    updateSiteImages() {
        this.loadImagesFromFirebase();
    }

    // Carregar e aplicar imagens do Firebase no site
    async loadImagesFromFirebase() {
        try {
            if (!this.firebaseReady) {
                console.warn('⚠️ Firebase não está pronto ainda');
                return;
            }

            console.log('📥 Carregando imagens do Firebase para o site...');
            const db = firebase.firestore();
            
            let snapshot;
            try {
                // Tentar query idêntica ao dashboard primeiro
                console.log('🔍 Usando query com índice (idêntica ao dashboard)...');
                snapshot = await db.collection('images')
                    .where('active', '!=', false)
                    .orderBy('active')
                    .orderBy('createdAt', 'desc')
                    .get();
                console.log('✅ Query com índice funcionou!');
            } catch (indexError) {
                console.warn('⚠️ Query com índice falhou, usando alternativa:', indexError.message);
                snapshot = await db.collection('images')
                    .orderBy('createdAt', 'desc')
                    .get();
            }

            const imagesBySection = {
                hero: [],
                services: [],
                gallery: [],
                team: []
            };

            let totalImages = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                const isActive = data.active !== false;
                
                if (isActive) {
                    const section = data.section || 'gallery';
                    
                    if (imagesBySection[section]) {
                        imagesBySection[section].push({
                            id: doc.id,
                            ...data
                        });
                        totalImages++;
                        console.log(`📸 Carregada: ${data.title} (${section})`);
                    }
                }
            });

            console.log(`📊 Total de imagens carregadas: ${totalImages}`);
            console.log('📋 Distribuição por seção:', {
                hero: imagesBySection.hero.length,
                services: imagesBySection.services.length,
                gallery: imagesBySection.gallery.length,
                team: imagesBySection.team.length
            });

            if (totalImages === 0) {
                console.warn('⚠️ Nenhuma imagem ativa encontrada no Firebase!');
                return;
            }

            // Aplicar imagens nas seções do site
            console.log('🎨 Aplicando imagens no site...');
            this.applyImagesToSite(imagesBySection);

        } catch (error) {
            console.error('❌ Erro ao carregar imagens do Firebase:', error);
        }
    }

    // Aplicar imagens nas seções específicas do site
    applyImagesToSite(imagesBySection) {
        // Atualizar Hero/Banner
        if (imagesBySection.hero && imagesBySection.hero.length > 0) {
            this.updateHeroSection(imagesBySection.hero[0]);
        }

        // Atualizar Seção de Serviços
        if (imagesBySection.services && imagesBySection.services.length > 0) {
            this.updateServicesSection(imagesBySection.services);
        }

        // Atualizar Galeria de Cortes
        if (imagesBySection.gallery && imagesBySection.gallery.length > 0) {
            this.updateGallerySection(imagesBySection.gallery);
        }

        // Atualizar Carrossel da Equipe
        if (imagesBySection.team && imagesBySection.team.length > 0) {
            this.updateTeamCarousel(imagesBySection.team);
        }

        console.log('✅ Imagens do site atualizadas com sucesso!');
    }

    // Atualizar seção Hero/Banner
    updateHeroSection(heroImage) {
        console.log(`🌟 Atualizando seção Hero com: ${heroImage.title}`);
        
        const heroSection = document.querySelector('.hero');
        
        if (!heroSection) {
            console.warn('⚠️ Seção .hero não encontrada!');
            return;
        }
        
        if (heroImage.url) {
            // SEMPRE aplicar como background da seção hero (nunca trocar a logo)
            console.log('🎨 Aplicando imagem como background do banner principal');
            heroSection.style.backgroundImage = `url('${heroImage.url}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
            heroSection.style.backgroundAttachment = 'scroll';
            
            // Adicionar overlay escuro para melhor legibilidade do texto
            heroSection.style.position = 'relative';
            
            // Criar overlay se não existir
            let overlay = heroSection.querySelector('.hero-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'hero-overlay';
                overlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    z-index: 1;
                `;
                heroSection.insertBefore(overlay, heroSection.firstChild);
            }
            
            // Garantir que o conteúdo fique acima do overlay
            const heroContent = heroSection.querySelector('.hero-content');
            if (heroContent) {
                heroContent.style.position = 'relative';
                heroContent.style.zIndex = '2';
            }
            
            console.log('✅ Background do banner principal atualizado');
        }
    }

    // Atualizar seção de serviços
    updateServicesSection(servicesImages) {
        console.log(`✂️ Atualizando serviços com ${servicesImages.length} imagens`);
        
        const serviceCards = document.querySelectorAll('.service-card img');
        console.log(`🔍 Encontrados ${serviceCards.length} cards de serviço no site`);
        
        if (serviceCards.length === 0) {
            console.warn('⚠️ Nenhum card de serviço encontrado no site!');
            return;
        }
        
        // Atualizar cards existentes com imagens do Firebase
        serviceCards.forEach((img, index) => {
            if (servicesImages[index]) {
                const imageData = servicesImages[index];
                console.log(`🔄 Atualizando card ${index + 1}: ${imageData.title}`);
                
                img.src = imageData.url;
                img.alt = imageData.title || img.alt;
                
                // Atualizar título do serviço se fornecido
                const cardTitle = img.parentElement.querySelector('h3');
                if (cardTitle && imageData.title) {
                    cardTitle.textContent = imageData.title.toUpperCase();
                }

                // Atualizar descrição se fornecida
                const cardDesc = img.parentElement.querySelector('p');
                if (cardDesc && imageData.description) {
                    cardDesc.textContent = imageData.description;
                }
            }
        });
        
        console.log('✅ Seção de serviços atualizada');
    }

    // Atualizar galeria de cortes
    updateGallerySection(galleryImages) {
        console.log(`🖼️ ATUALIZANDO GALERIA - Recebidas ${galleryImages.length} imagens`);
        
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) {
            console.error('❌ Elemento .gallery-grid NÃO ENCONTRADO no DOM!');
            return;
        }

        // SEMPRE substituir se há imagens do Firebase
        if (galleryImages && galleryImages.length > 0) {
            console.log(`🔄 SUBSTITUINDO galeria com ${galleryImages.length} imagens do Firebase...`);
            
            // Limpar galeria atual
            galleryGrid.innerHTML = '';
            console.log('🧹 Galeria limpa');

            // Adicionar novas imagens do Firebase
            galleryImages.forEach((imageData, index) => {
                console.log(`➕ ADICIONANDO imagem ${index + 1}: "${imageData.title}"`);
                console.log(`   URL: ${imageData.url}`);
                
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item fade-in';
                galleryItem.innerHTML = `
                    <img src="${imageData.url}" alt="${imageData.title}" loading="lazy" 
                         onerror="console.error('❌ ERRO ao carregar imagem:', '${imageData.title}', this.src)"
                         onload="console.log('✅ Imagem carregada:', '${imageData.title}')">
                    <div class="gallery-overlay">
                        <h3>${imageData.title || 'Corte Profissional'}</h3>
                        <p>${imageData.description || 'Estilo único e personalizado'}</p>
                    </div>
                `;
                
                // Adicionar evento de clique para modal
                galleryItem.addEventListener('click', () => {
                    console.log(`🖱️ Clique na imagem: ${imageData.title}`);
                    this.openImageModal(imageData.url, imageData.title);
                });
                
                galleryGrid.appendChild(galleryItem);
            });
            
            console.log(`✅ GALERIA ATUALIZADA COM SUCESSO: ${galleryImages.length} imagens do Firebase`);
            
        } else {
            console.warn('⚠️ Nenhuma imagem da galeria encontrada no Firebase');
            console.log('📭 Mantendo conteúdo original da galeria');
        }
    }

    // Atualizar carrossel da equipe
    updateTeamCarousel(teamImages) {
        console.log(`👨‍💼 Atualizando equipe com ${teamImages.length} imagens`);
        
        // Implementar atualização da equipe se necessário
        const teamSection = document.querySelector('.team-carousel, .team-grid, .equipe');
        if (teamSection) {
            console.log('✅ Seção de equipe encontrada - implementar se necessário');
        }
    }

    // Abrir modal de imagem
    openImageModal(imageUrl, title) {
        let modal = document.getElementById('imageModal');
        
        if (!modal) {
            // Criar modal se não existir
            modal = document.createElement('div');
            modal.id = 'imageModal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <img id="modalImage" src="">
                    <div id="modalTitle"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Adicionar estilos se não existirem
            if (!document.getElementById('imageModalStyles')) {
                const style = document.createElement('style');
                style.id = 'imageModalStyles';
                style.textContent = `
                    #imageModal {
                        display: none;
                        position: fixed;
                        z-index: 1000;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0,0,0,0.9);
                    }
                    #imageModal .modal-content {
                        margin: 5% auto;
                        display: block;
                        width: 80%;
                        max-width: 700px;
                    }
                    #imageModal img {
                        width: 100%;
                        height: auto;
                    }
                    #imageModal .close {
                        position: absolute;
                        top: 15px;
                        right: 35px;
                        color: #f1f1f1;
                        font-size: 40px;
                        font-weight: bold;
                        cursor: pointer;
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Adicionar evento de fechar
            modal.querySelector('.close').onclick = () => {
                modal.style.display = 'none';
            };
            
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            };
        }

        // Atualizar conteúdo do modal
        document.getElementById('modalImage').src = imageUrl;
        document.getElementById('modalTitle').textContent = title || '';
        modal.style.display = 'block';
    }
}

// Inicializar automaticamente quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const initSync = () => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            window.siteImageSync = new SiteImageSync();
            console.log('🔄 Sistema de sincronização de imagens iniciado');
        } else {
            setTimeout(initSync, 500);
        }
    };
    
    initSync();
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SiteImageSync = SiteImageSync;
}
