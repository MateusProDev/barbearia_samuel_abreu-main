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

        // Organizar imagens por categoria das seções reais do site
        const imagesByCategory = this.organizeImagesByCategory();
        
        // Atualizar cada seção do site real
        this.updateHeroSection(imagesByCategory.hero);
        this.updateServicesSection(imagesByCategory.servicos);   // #servicos
        this.updateGallerySection(imagesByCategory.cortes);      // #cortes  
        this.updateTeamSection(imagesByCategory.sobre);          // #sobre (carrossel)
        
        console.log('✅ Todas as seções do site atualizadas!');
    }

    organizeImagesByCategory() {
        const categories = {
            hero: [],
            servicos: [],  // Seção #servicos do site
            cortes: [],    // Seção #cortes do site  
            sobre: []      // Seção #sobre (carrossel) do site
        };

        this.currentImages.forEach(image => {
            // Usar o campo 'section' do Firebase se disponível, senão 'category'
            let section = image.section || image.category || 'cortes';
            
            // Mapear categorias antigas para seções do site
            if (section === 'galeria' || section === 'gallery') section = 'cortes';
            if (section === 'equipe' || section === 'team') section = 'sobre';
            if (section === 'banner') section = 'hero';
            
            if (categories[section]) {
                categories[section].push(image);
            } else {
                // Fallback inteligente baseado no título
                const title = (image.title || '').toLowerCase();
                if (title.includes('banner') || title.includes('principal')) {
                    categories.hero.push(image);
                } else if (title.includes('serviço') || title.includes('servico') || 
                         title.includes('cabelo') || title.includes('barba') ||
                         title.includes('pigment') || title.includes('sobrancelha') ||
                         title.includes('luzes') || title.includes('platinado') ||
                         title.includes('tesoura')) {
                    categories.servicos.push(image);
                } else if (title.includes('samuel') || title.includes('kaio') || 
                         title.includes('proprietario') || title.includes('barbeiro') ||
                         title.includes('samu') || title.includes('equipe')) {
                    categories.sobre.push(image);
                } else {
                    // Qualquer outra imagem vai para galeria de cortes
                    categories.cortes.push(image);
                }
            }
        });

        console.log('📋 Imagens organizadas por seções reais do site:', {
            hero: categories.hero.length,
            servicos: categories.servicos.length,
            cortes: categories.cortes.length,
            sobre: categories.sobre.length
        });

        // Debug detalhado
        console.log('🔍 DEBUG - Mapeamento das imagens:');
        Object.keys(categories).forEach(section => {
            console.log(`\n📂 Seção ${section.toUpperCase()}:`);
            categories[section].forEach((image, index) => {
                console.log(`  ${index + 1}. "${image.title}" - Original: "${image.section || image.category || 'indefinida'}" - URL: ${image.cloudinaryUrl || image.url || 'sem URL'}`);
            });
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
            // Aplicar imagem de fundo com gradientes de profundidade sobrepostos
            heroSection.style.backgroundImage = `
                linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), 
                url('${imageUrl}')
            `;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
            
            // Adicionar elementos de profundidade se não existirem
            this.addDepthElements(heroSection);
            
            console.log('✅ Background do hero atualizado com gradiente de profundidade');
        }
    }

    // Adicionar elementos de profundidade ao hero
    addDepthElements(heroSection) {
        // Verificar se já existem os elementos
        if (!heroSection.querySelector('.wave-effect')) {
            const waveEffect = document.createElement('div');
            waveEffect.className = 'wave-effect';
            heroSection.appendChild(waveEffect);
        }
        
        if (!heroSection.querySelector('.inner-shadow')) {
            const innerShadow = document.createElement('div');
            innerShadow.className = 'inner-shadow';
            heroSection.appendChild(innerShadow);
        }
        
        console.log('🌊 Elementos de profundidade adicionados ao hero');
    }

    updateServicesSection(servicesImages) {
        console.log(`✂️ Atualizando seção #servicos com ${servicesImages?.length || 0} imagens...`);
        
        const servicesGrid = document.querySelector('#servicos .services-grid');
        
        if (!servicesGrid) {
            console.warn('⚠️ Seção #servicos .services-grid não encontrada');
            return;
        }

        console.log('✅ Seção #servicos encontrada');

        let imagesToShow = servicesImages;
        
        if (!servicesImages || servicesImages.length === 0) {
            console.warn('⚠️ Nenhuma imagem específica de serviços - mantendo imagens existentes');
            return;
        }

        console.log(`🔄 Atualizando seção #servicos com ${imagesToShow.length} imagens`);

        // Atualizar apenas imagens que são diferentes das atuais
        const existingCards = servicesGrid.querySelectorAll('.service-card');
        
        // Se já tem o mesmo número de cards, verificar se precisam ser atualizados
        if (existingCards.length === imagesToShow.length) {
            let needsUpdate = false;
            existingCards.forEach((card, index) => {
                const img = card.querySelector('img');
                const currentUrl = img ? img.src : '';
                const newUrl = imagesToShow[index]?.cloudinaryUrl || imagesToShow[index]?.url || '';
                
                if (currentUrl !== newUrl) {
                    needsUpdate = true;
                }
            });
            
            if (!needsUpdate) {
                console.log('✅ Seção #servicos já está atualizada');
                return;
            }
        }

        // Limpar apenas se necessário
        servicesGrid.innerHTML = '';

        // Adicionar novas imagens
        imagesToShow.forEach((image, index) => {
            const imageUrl = image.cloudinaryUrl || image.url;
            if (!imageUrl) {
                console.warn(`⚠️ Imagem ${index} sem URL válida:`, image);
                return;
            }

            console.log(`➕ Adicionando serviço ${index + 1}: "${image.title}"`);
            
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card fade-in';
            serviceCard.innerHTML = `
                <img src="${imageUrl}" alt="${image.title || 'Serviço'}" loading="lazy"
                     onerror="console.error('❌ ERRO ao carregar imagem:', '${image.title}', this.src);"
                     onload="console.log('✅ Imagem de serviço carregada:', '${image.title}')">
                <h3>${(image.title || 'SERVIÇO PROFISSIONAL').toUpperCase()}</h3>
                <p>${image.description || 'Serviço especializado com profissionais qualificados e técnicas modernas'}</p>
            `;
            
            servicesGrid.appendChild(serviceCard);
            
            // Animação de entrada
            setTimeout(() => {
                serviceCard.style.opacity = '1';
                serviceCard.style.transform = 'translateY(0)';
            }, index * 100);
        });

        console.log(`✅ SEÇÃO #SERVICOS ATUALIZADA: ${imagesToShow.length} serviços`);
    }

    // Obter imagens padrão de serviços se não houver imagens específicas
    getDefaultServiceImages() {
        // Usar algumas imagens de outras seções como fallback
        if (!this.currentImages || this.currentImages.length === 0) {
            return [];
        }

        // Tentar encontrar imagens que possam ser de serviços pelos títulos
        const possibleServiceImages = this.currentImages.filter(img => {
            const title = (img.title || '').toLowerCase();
            return title.includes('cabelo') || 
                   title.includes('barba') || 
                   title.includes('corte') || 
                   title.includes('infantil') || 
                   title.includes('pigment') ||
                   title.includes('sobrancelha') ||
                   title.includes('tesoura') ||
                   title.includes('luzes') ||
                   title.includes('platinado') ||
                   title.includes('servico') ||
                   title.includes('fade') ||
                   title.includes('degradê');
        });

        if (possibleServiceImages.length > 0) {
            console.log(`📋 Usando ${possibleServiceImages.length} imagens como serviços por título`);
            return possibleServiceImages.slice(0, 8); // Máximo 8 serviços
        }

        // Fallback: usar as primeiras imagens disponíveis (máximo 7)
        const fallbackImages = this.currentImages.slice(0, 7);
        console.log(`📋 Usando ${fallbackImages.length} imagens como fallback para serviços`);
        return fallbackImages;
    }

    // Método para garantir que a seção de serviços seja visível
    ensureServicesVisible() {
        console.log('🎯 Garantindo visibilidade da seção de serviços...');
        
        const servicesGrid = document.querySelector('.services-grid');
        if (!servicesGrid) {
            console.error('❌ .services-grid não encontrado');
            return;
        }

        // Forçar exibição do grid principal
        servicesGrid.style.display = 'grid';
        servicesGrid.style.opacity = '1';
        servicesGrid.style.visibility = 'visible';
        
        // Verificar e corrigir cards de serviço
        const cards = servicesGrid.children;
        console.log(`📊 Verificando ${cards.length} cards de serviço...`);
        
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            
            // Garantir que o card seja visível
            card.style.display = 'block';
            card.style.opacity = '1';
            card.style.visibility = 'visible';
            
            const img = card.querySelector('img');
            if (img) {
                // Garantir que a imagem seja visível
                img.style.display = 'block';
                img.style.width = '100%';
                img.style.height = 'auto';
                
                console.log(`✅ Card ${i + 1} configurado: ${img.alt}`);
            } else {
                console.warn(`⚠️ Card ${i + 1} sem imagem`);
            }
        }
        
        console.log('✅ Visibilidade da seção de serviços garantida');
    }

    updateGallerySection(cortesImages) {
        console.log(`🖼️ Atualizando seção #cortes com ${cortesImages?.length || 0} imagens...`);
        
        const galleryGrid = document.querySelector('#cortes .gallery-grid');
        
        if (!galleryGrid) {
            console.error('❌ Seção #cortes .gallery-grid não encontrada no DOM');
            return;
        }

        console.log('✅ Seção #cortes encontrada');

        let imagesToShow = cortesImages;
        
        if (!cortesImages || cortesImages.length === 0) {
            console.warn('⚠️ Nenhuma imagem específica de cortes - mantendo imagens existentes');
            return;
        }

        console.log(`🔄 Atualizando seção #cortes com ${imagesToShow.length} imagens`);

        // Verificar se precisa atualizar
        const existingItems = galleryGrid.querySelectorAll('.gallery-item');
        if (existingItems.length === imagesToShow.length) {
            let needsUpdate = false;
            existingItems.forEach((item, index) => {
                const img = item.querySelector('img');
                const currentUrl = img ? img.src : '';
                const newUrl = imagesToShow[index]?.cloudinaryUrl || imagesToShow[index]?.url || '';
                
                if (currentUrl !== newUrl) {
                    needsUpdate = true;
                }
            });
            
            if (!needsUpdate) {
                console.log('✅ Seção #cortes já está atualizada');
                return;
            }
        }

        // Limpar galeria atual
        galleryGrid.innerHTML = '';

        // Adicionar imagens
        imagesToShow.forEach((image, index) => {
            const imageUrl = image.cloudinaryUrl || image.url;
            if (!imageUrl) {
                console.warn(`⚠️ Imagem ${index} sem URL válida:`, image);
                return;
            }

            console.log(`➕ Adicionando corte ${index + 1}: "${image.title}"`);
            
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item fade-in';
            galleryItem.innerHTML = `
                <img src="${imageUrl}" alt="${image.title || 'Corte'}" loading="lazy"
                     onerror="console.error('❌ ERRO ao carregar imagem:', '${image.title}', this.src);"
                     onload="console.log('✅ Imagem carregada:', '${image.title}')">
                <div class="gallery-overlay">
                    <h3>${image.title || 'Corte Profissional'}</h3>
                    <p>${image.description || 'Estilo único e personalizado'}</p>
                </div>
            `;
            
            galleryGrid.appendChild(galleryItem);
            
            // Animação de entrada
            setTimeout(() => {
                galleryItem.style.opacity = '1';
                galleryItem.style.transform = 'translateY(0)';
            }, index * 100);
        });

        console.log(`✅ SEÇÃO #CORTES ATUALIZADA: ${imagesToShow.length} imagens`);
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
        console.log(`👥 Iniciando atualização da seção de equipe...`);
        
        // Procurar pelo carrossel da equipe no site
        const teamContainer = document.querySelector('.carousel-container') || 
                             document.querySelector('.team-carousel') ||
                             document.querySelector('#equipe .carousel-container');
        
        if (!teamContainer) {
            console.warn('⚠️ Container da equipe não encontrado');
            return;
        }

        console.log('✅ Container da equipe encontrado');

        // Buscar o track do carrossel
        const carouselTrack = teamContainer.querySelector('.carousel-track') || 
                             teamContainer.querySelector('#carouselTrack');
        
        if (!carouselTrack) {
            console.warn('⚠️ Carousel track não encontrado');
            return;
        }

        console.log(`📊 Imagens de equipe disponíveis: ${teamImages ? teamImages.length : 0}`);

        // Se não há imagens da seção "team", usar imagens padrão ou manter as existentes
        let imagesToUse = teamImages && teamImages.length > 0 ? teamImages : this.getDefaultTeamImages();

        if (!imagesToUse || imagesToUse.length === 0) {
            console.log('⚠️ Nenhuma imagem disponível, mantendo slides existentes');
            return;
        }

        console.log(`🔄 Atualizando carrossel com ${imagesToUse.length} imagens`);

        // Limpar slides existentes
        carouselTrack.innerHTML = '';

        // Adicionar novas imagens como slides
        imagesToUse.forEach((image, index) => {
            const imageUrl = image.cloudinaryUrl || image.url;
            
            if (!imageUrl) {
                console.warn(`⚠️ Imagem ${index} sem URL válida:`, image);
                return;
            }

            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            
            // Primeiro slide ativo
            if (index === 0) {
                slide.classList.add('active');
            }
            
            slide.innerHTML = `
                <img src="${imageUrl}" alt="${image.title || 'Equipe'}" 
                     onerror="console.error('❌ Erro ao carregar imagem da equipe:', this.src)"
                     onload="console.log('✅ Imagem da equipe carregada:', '${image.title}')">
                <div class="carousel-caption">
                    <h4>${image.title || 'Membro da Equipe'}</h4>
                    <p>${image.description || 'Profissional qualificado'}</p>
                </div>
            `;
            
            carouselTrack.appendChild(slide);
            console.log(`✅ Slide ${index + 1} criado: ${image.title}`);
        });

        // Atualizar indicadores do carrossel
        this.updateCarouselIndicators(teamContainer, imagesToUse.length);

        // Reinicializar carrossel se necessário
        this.reinitializeCarousel(teamContainer);

        console.log(`🎉 Carrossel da equipe atualizado com ${imagesToUse.length} slides`);
        
        // Disparar evento para reinicializar animações
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('siteContentUpdated', { 
                detail: { section: 'team', count: imagesToUse.length } 
            }));
        }, 300);
    }

    // Obter imagens padrão da equipe se não houver imagens específicas
    getDefaultTeamImages() {
        // Usar algumas imagens de outras seções como fallback
        if (!this.currentImages || this.currentImages.length === 0) {
            return [];
        }

        // Tentar encontrar imagens que possam ser da equipe pelos títulos
        const possibleTeamImages = this.currentImages.filter(img => {
            const title = (img.title || '').toLowerCase();
            return title.includes('samuel') || 
                   title.includes('kaio') || 
                   title.includes('proprietario') || 
                   title.includes('barbeiro') || 
                   title.includes('equipe') ||
                   title.includes('mestre');
        });

        if (possibleTeamImages.length > 0) {
            console.log(`📋 Usando ${possibleTeamImages.length} imagens como equipe por título`);
            return possibleTeamImages;
        }

        // Fallback: usar as primeiras imagens disponíveis (máximo 6)
        const fallbackImages = this.currentImages.slice(0, 6);
        console.log(`📋 Usando ${fallbackImages.length} imagens como fallback para equipe`);
        return fallbackImages;
    }

    updatePortfolioSection(portfolioImages) {
        if (!portfolioImages || portfolioImages.length === 0) {
            console.log('🎨 Nenhuma imagem de portfólio encontrada');
            return;
        }

        console.log(`🎨 Atualizando portfólio com ${portfolioImages.length} imagens`);

        // Procurar seção de portfólio
        const portfolioSection = document.querySelector('#portfolio') || 
                                document.querySelector('.portfolio-section') ||
                                document.querySelector('.portfolio-grid');

        if (!portfolioSection) {
            console.warn('⚠️ Seção de portfólio não encontrada');
            return;
        }

        // Se existe uma grid específica para portfólio, atualizar
        const portfolioGrid = portfolioSection.querySelector('.portfolio-grid') || portfolioSection;
        
        if (portfolioGrid.classList.contains('gallery-grid') || portfolioGrid.classList.contains('portfolio-grid')) {
            this.updateGridSection(portfolioGrid, portfolioImages, 'portfólio');
        }
    }

    updateInstalacoesSection(instalacoesImages) {
        if (!instalacoesImages || instalacoesImages.length === 0) {
            console.log('🏪 Nenhuma imagem de instalações encontrada');
            return;
        }

        console.log(`🏪 Atualizando instalações com ${instalacoesImages.length} imagens`);

        // Procurar seção de instalações
        const instalacoesSection = document.querySelector('#instalacoes') || 
                                  document.querySelector('.instalacoes-section') ||
                                  document.querySelector('.instalacoes-grid');

        if (!instalacoesSection) {
            console.warn('⚠️ Seção de instalações não encontrada');
            return;
        }

        // Se existe uma grid específica para instalações, atualizar
        const instalacoesGrid = instalacoesSection.querySelector('.instalacoes-grid') || instalacoesSection;
        
        if (instalacoesGrid.classList.contains('gallery-grid') || instalacoesGrid.classList.contains('instalacoes-grid')) {
            this.updateGridSection(instalacoesGrid, instalacoesImages, 'instalações');
        }
    }

    updateCombinedSections(imagesByCategory) {
        // Para seções que podem aceitar múltiplos tipos de imagens
        console.log('🔄 Atualizando seções combinadas...');

        // Se a galeria principal deve mostrar todas as imagens
        const mainGallery = document.querySelector('.gallery-grid');
        if (mainGallery && (!imagesByCategory.gallery || imagesByCategory.gallery.length === 0)) {
            // Se não há imagens específicas de galeria, usar todas as outras
            const allOtherImages = [
                ...(imagesByCategory.portfolio || []),
                ...(imagesByCategory.instalacoes || []),
                ...(imagesByCategory.team || []).slice(0, 3) // Apenas algumas do team
            ];
            
            if (allOtherImages.length > 0) {
                console.log('🔄 Preenchendo galeria principal com outras imagens');
                this.updateGridSection(mainGallery, allOtherImages, 'galeria mista');
            }
        }
    }

    updateGridSection(gridContainer, images, sectionName) {
        console.log(`🎯 Atualizando grid de ${sectionName} com ${images.length} imagens`);

        // Limpar grid atual
        gridContainer.innerHTML = '';

        // Adicionar imagens
        images.forEach((image, index) => {
            const imageUrl = image.cloudinaryUrl || image.url;
            if (!imageUrl) {
                console.warn(`⚠️ Imagem ${index} de ${sectionName} sem URL válida:`, image);
                return;
            }

            const gridItem = document.createElement('div');
            gridItem.className = 'gallery-item fade-in';
            gridItem.style.opacity = '0';
            gridItem.innerHTML = `
                <img src="${imageUrl}" alt="${image.title || 'Imagem'}" loading="lazy"
                     onerror="console.error('❌ ERRO ao carregar imagem:', '${image.title}', this.src); this.style.display='none';"
                     onload="this.parentElement.style.opacity='1'; console.log('✅ Imagem carregada:', '${image.title}')">
                <div class="gallery-overlay">
                    <h3>${image.title || 'Trabalho Profissional'}</h3>
                    <p>${image.description || 'Estilo único e personalizado'}</p>
                    <button class="view-btn">Ver Detalhes</button>
                </div>
            `;
            
            // Adicionar evento de clique para modal
            gridItem.addEventListener('click', () => {
                this.openImageModal(imageUrl, image.title, image.description);
            });
            
            gridContainer.appendChild(gridItem);
            
            // Animação de entrada com delay progressivo
            setTimeout(() => {
                gridItem.style.opacity = '1';
                gridItem.style.transform = 'translateY(0)';
            }, index * 100);
        });

        console.log(`✅ Grid de ${sectionName} atualizada com ${images.length} imagens`);
    }

    updateCarouselIndicators(carouselContainer, totalSlides) {
        const indicatorsContainer = carouselContainer.querySelector('.carousel-indicators');
        if (!indicatorsContainer) {
            console.log('⚠️ Container de indicadores não encontrado');
            return;
        }

        // Limpar indicadores existentes
        indicatorsContainer.innerHTML = '';

        // Criar novos indicadores
        for (let i = 0; i < totalSlides; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'indicator';
            indicator.dataset.slide = i;
            if (i === 0) indicator.classList.add('active');
            
            indicatorsContainer.appendChild(indicator);
        }

        console.log(`✅ ${totalSlides} indicadores de carrossel atualizados`);
    }

    // Reinicializar funcionalidades do carrossel após atualização
    reinitializeCarousel(carouselContainer) {
        try {
            console.log('🔄 Reinicializando carrossel...');
            
            const track = carouselContainer.querySelector('.carousel-track');
            const slides = carouselContainer.querySelectorAll('.carousel-slide');
            const indicators = carouselContainer.querySelectorAll('.indicator');
            
            if (!track || slides.length === 0) {
                console.warn('⚠️ Elementos do carrossel não encontrados para reinicialização');
                return;
            }

            // Garantir que o primeiro slide esteja ativo
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === 0);
            });

            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === 0);
            });

            // Resetar posição do track
            track.style.transform = 'translateX(0%)';

            // Se existe uma função global de carrossel, chama ela
            if (typeof window.setupCarousel === 'function') {
                console.log('🔧 Chamando setupCarousel global...');
                window.setupCarousel();
            }

            // Disparar evento customizado para o script principal
            const carouselEvent = new CustomEvent('carouselUpdated', {
                detail: { 
                    container: carouselContainer,
                    slideCount: slides.length
                }
            });
            
            window.dispatchEvent(carouselEvent);
            
            console.log('✅ Carrossel reinicializado com sucesso');

        } catch (error) {
            console.error('❌ Erro ao reinicializar carrossel:', error);
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
        
        // Debug específico do carrossel
        this.debugCarousel();
        
        return this.currentImages;
    }

    // Debug específico para o carrossel
    debugCarousel() {
        console.log('🎠 DEBUG CARROSSEL:');
        
        const carouselContainer = document.querySelector('.carousel-container');
        const carouselTrack = document.querySelector('.carousel-track');
        const slides = document.querySelectorAll('.carousel-slide');
        const indicators = document.querySelectorAll('.indicator');
        
        console.log('📦 Container:', carouselContainer ? 'encontrado' : 'NÃO encontrado');
        console.log('🛤️ Track:', carouselTrack ? 'encontrado' : 'NÃO encontrado');
        console.log('🎞️ Slides:', slides.length, 'encontrados');
        console.log('🔘 Indicadores:', indicators.length, 'encontrados');
        
        if (slides.length === 0) {
            console.warn('⚠️ PROBLEMA: Nenhum slide encontrado no carrossel!');
            console.log('🔧 Tentando corrigir...');
            this.fixEmptyCarousel();
        }
        
        // Verificar se há slides vazios
        const emptySlides = Array.from(slides).filter(slide => {
            const img = slide.querySelector('img');
            return !img || !img.src || img.src.includes('undefined');
        });
        
        if (emptySlides.length > 0) {
            console.warn(`⚠️ PROBLEMA: ${emptySlides.length} slides vazios encontrados!`);
            console.log('🔧 Corrigindo slides vazios...');
            this.fixEmptySlides(emptySlides);
        }
    }

    // Corrigir carrossel vazio
    fixEmptyCarousel() {
        console.log('🛠️ Iniciando correção de carrossel vazio...');
        
        const imagesByCategory = this.organizeImagesByCategory();
        let teamImages = imagesByCategory.team;
        
        if (!teamImages || teamImages.length === 0) {
            console.log('📋 Nenhuma imagem de equipe específica, usando imagens padrão...');
            teamImages = this.getDefaultTeamImages();
        }
        
        if (teamImages && teamImages.length > 0) {
            console.log(`🔄 Forçando atualização do carrossel com ${teamImages.length} imagens...`);
            this.updateTeamSection(teamImages);
        } else {
            console.error('❌ Não foi possível corrigir carrossel - nenhuma imagem disponível');
        }
    }

    // Corrigir slides vazios específicos
    fixEmptySlides(emptySlides) {
        console.log(`🛠️ Corrigindo ${emptySlides.length} slides vazios...`);
        
        const availableImages = this.getDefaultTeamImages();
        
        emptySlides.forEach((slide, index) => {
            if (availableImages[index]) {
                const image = availableImages[index];
                const imageUrl = image.cloudinaryUrl || image.url;
                
                if (imageUrl) {
                    const img = slide.querySelector('img') || document.createElement('img');
                    const caption = slide.querySelector('.carousel-caption');
                    
                    img.src = imageUrl;
                    img.alt = image.title || 'Equipe';
                    
                    if (caption) {
                        const h4 = caption.querySelector('h4');
                        const p = caption.querySelector('p');
                        
                        if (h4) h4.textContent = image.title || 'Membro da Equipe';
                        if (p) p.textContent = image.description || 'Profissional qualificado';
                    }
                    
                    console.log(`✅ Slide ${index} corrigido com: ${image.title}`);
                }
            }
        });
        
        console.log('✅ Slides vazios corrigidos');
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
    
    // Verificação automática do carrossel após carregamento
    setTimeout(() => {
        console.log('🔍 Verificação automática do carrossel...');
        if (siteSync) {
            siteSync.debugCarousel();
            
            // Se não há slides, tentar corrigir
            const slides = document.querySelectorAll('.carousel-slide');
            if (slides.length === 0) {
                console.log('🛠️ Carrossel vazio detectado, iniciando correção automática...');
                siteSync.fixEmptyCarousel();
            }
        }
    }, 5000);
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
            setTimeout(() => {
                siteSync.ensureGalleryVisible();
                siteSync.ensureServicesVisible();
            }, 1000);
        }
    };

    // Função específica para debug de serviços
    window.forceServicesUpdate = () => {
        if (siteSync) {
            console.log('🔄 Forçando atualização manual dos serviços...');
            const imagesByCategory = siteSync.organizeImagesByCategory();
            siteSync.updateServicesSection(imagesByCategory.services);
            setTimeout(() => siteSync.ensureServicesVisible(), 500);
        }
    };

    // Função de debug completa
    window.debugSite = () => {
        if (siteSync) {
            console.log('🔍 DEBUG COMPLETO DO SITE:');
            siteSync.debugImages();
            
            // Verificar elementos do DOM
            const galleryGrid = document.querySelector('.gallery-grid');
            const servicesGrid = document.querySelector('.services-grid');
            const carouselTrack = document.querySelector('.carousel-track');
            
            console.log('🎯 Elementos encontrados:');
            console.log('  - Galeria:', galleryGrid ? 'SIM' : 'NÃO');
            console.log('  - Serviços:', servicesGrid ? 'SIM' : 'NÃO');
            console.log('  - Carrossel:', carouselTrack ? 'SIM' : 'NÃO');
            
            if (servicesGrid) {
                console.log(`  - Cards de serviço: ${servicesGrid.children.length}`);
            }
            
            return {
                images: siteSync.currentImages,
                elements: { galleryGrid, servicesGrid, carouselTrack }
            };
        }
    };
    
    // Função para forçar correção do carrossel
    window.fixCarousel = () => {
        if (siteSync) {
            console.log('🛠️ Forçando correção manual do carrossel...');
            siteSync.fixEmptyCarousel();
        }
    };
    
    // Debug completo
    window.debugSite = () => {
        if (siteSync) {
            console.log('🔍 Debug completo do site...');
            return siteSync.debugImages();
        }
    };
    
    console.log('✅ Debug automático configurado');
    console.log('💡 Comandos disponíveis no console:');
    console.log('   - forceGalleryUpdate() // Forçar atualização da galeria');
    console.log('   - fixCarousel() // Corrigir carrossel vazio');
    console.log('   - debugSite() // Debug completo');
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
