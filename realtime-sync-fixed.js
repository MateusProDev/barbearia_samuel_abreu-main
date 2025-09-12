// 🔄 Sistema de Sincronização em Tempo Real - Versão Corrigida
// Sincroniza mudanças do dashboard com o site instantaneamente

class RealtimeSync {
    constructor() {
        this.isInitialized = false;
        this.listeners = [];
        this.cache = new Map();
        this.init();
    }

    async init() {
        try {
            console.log('🔄 Inicializando Sistema de Sincronização em Tempo Real...');
            
            // Wait for Firebase to be ready
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase não está disponível');
            }

            this.db = firebase.firestore();
            
            // Verificar se os containers do site existem
            this.verifyContainers();
            
            // Setup real-time listeners
            this.setupImageListener();
            this.setupContentListener();
            
            // Load existing images
            await this.loadExistingImages();
            
            this.isInitialized = true;
            console.log('✅ Sistema de sincronização inicializado!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização da sincronização:', error);
        }
    }

    verifyContainers() {
        const containers = {
            'Hero/Banner': document.querySelector('.hero, #home'),
            'Serviços': document.querySelector('.services-grid'),
            'Galeria': document.querySelector('.gallery-grid'),
            'Equipe': document.querySelector('.carousel-track, #carouselTrack')
        };

        console.log('🔍 Verificando containers do site:');
        for (const [name, container] of Object.entries(containers)) {
            console.log(`  ${container ? '✅' : '❌'} ${name}: ${container ? 'Encontrado' : 'Não encontrado'}`);
        }
    }

    async loadExistingImages() {
        console.log('📥 Carregando imagens existentes...');
        
        try {
            const snapshot = await this.db.collection('images')
                .where('active', '==', true)
                .get();
            
            console.log(`📥 Encontradas ${snapshot.size} imagens ativas no Firestore`);
            
            // Debug detalhado
            const categories = {};
            snapshot.forEach((doc) => {
                const imageData = doc.data();
                const category = imageData.category || imageData.section;
                
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(imageData.title);
                
                console.log(`🖼️ Processando imagem: ${imageData.title} (categoria: ${category})`);
                this.handleImageAdded(imageData, doc.id);
            });
            
            console.log('📊 Resumo por categoria:', categories);
            console.log('✅ Imagens existentes carregadas!');
        } catch (error) {
            console.error('❌ Erro ao carregar imagens existentes:', error);
        }
    }

    setupImageListener() {
        console.log('🔄 Configurando listener de imagens...');
        
        const unsubscribe = this.db.collection('images')
            .onSnapshot((snapshot) => {
                console.log('🔄 Mudança detectada na coleção images');
                
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        console.log('➕ Nova imagem adicionada:', change.doc.id);
                        this.handleImageAdded(change.doc.data(), change.doc.id);
                    }
                    
                    if (change.type === 'modified') {
                        console.log('✏️ Imagem modificada:', change.doc.id);
                        this.handleImageModified(change.doc.data(), change.doc.id);
                    }
                    
                    if (change.type === 'removed') {
                        console.log('🗑️ Imagem removida:', change.doc.id);
                        this.handleImageRemoved(change.doc.id);
                    }
                });
                
                // Update cache
                this.updateImageCache(snapshot);
            });
        
        this.listeners.push(unsubscribe);
    }

    setupContentListener() {
        console.log('🔄 Configurando listener de conteúdo...');
        
        const unsubscribe = this.db.collection('siteContent')
            .onSnapshot((snapshot) => {
                console.log('🔄 Mudança detectada no conteúdo do site');
                this.handleContentChange(snapshot);
            });
        
        this.listeners.push(unsubscribe);
    }

    handleImageAdded(imageData, imageId) {
        const section = imageData.category || imageData.section;
        
        switch (section) {
            case 'hero':
            case 'banner':
                this.updateHeroSection(imageData);
                break;
            case 'servicos':
                this.updateServicesSection(imageData);
                break;
            case 'cortes':
            case 'galeria':
                this.updateGallerySection(imageData);
                break;
            case 'sobre':
            case 'equipe':
                this.updateAboutSection(imageData);
                break;
            case 'instalacoes':
                this.updateFacilitiesSection(imageData);
                break;
            default:
                console.log('🔄 Seção não mapeada:', section);
        }
    }

    handleImageModified(imageData, imageId) {
        // Similar to added, but update existing elements
        this.handleImageAdded(imageData, imageId);
    }

    handleImageRemoved(imageId) {
        // Remove image from all possible sections
        const imageElements = document.querySelectorAll(`[data-image-id="${imageId}"]`);
        imageElements.forEach(element => {
            element.remove();
            console.log('🗑️ Elemento removido do DOM:', imageId);
        });
    }

    updateHeroSection(imageData) {
        console.log('🌟 Atualizando background do hero/banner...');
        
        // Update ONLY the background of the hero section, keeping the logo intact
        const heroSection = document.querySelector('.hero, #home');
        if (heroSection && imageData.active) {
            heroSection.style.backgroundImage = `url('${imageData.url}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
            console.log('✅ Background do hero atualizado, logo mantida');
        }

        // DO NOT touch the hero logo - it should always stay the same
        // const heroImg = document.querySelector('.hero-logo'); // NEVER change this
    }

    updateServicesSection(imageData) {
        console.log('✂️ Atualizando seção de serviços...');
        
        const servicesContainer = document.querySelector('.services-grid, #servicos .services-grid');
        if (!servicesContainer) {
            console.warn('Container de serviços não encontrado');
            return;
        }

        // Check if image already exists
        let existingCard = document.querySelector(`[data-image-id="${imageData.id || imageData.title}"]`);
        
        if (!existingCard && imageData.active) {
            // Create new service card using dashboard structure
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card fade-in';
            serviceCard.setAttribute('data-image-id', imageData.id || imageData.title);
            serviceCard.innerHTML = `
                <img src="${imageData.url || imageData.cloudinaryUrl}" alt="${imageData.title}" loading="lazy">
                <h3>${imageData.title}</h3>
                ${imageData.description ? `<p>${imageData.description}</p>` : '<p>Serviço profissional de qualidade</p>'}
            `;
            
            servicesContainer.appendChild(serviceCard);
            console.log('✅ Novo cartão de serviço adicionado');
        } else if (existingCard) {
            // Update existing card
            const img = existingCard.querySelector('img');
            const title = existingCard.querySelector('h3');
            const desc = existingCard.querySelector('p');
            
            if (img) img.src = imageData.url || imageData.cloudinaryUrl;
            if (title) title.textContent = imageData.title;
            if (desc && imageData.description) desc.textContent = imageData.description;
            
            console.log('✅ Cartão de serviço atualizado');
        }
    }

    updateGallerySection(imageData) {
        console.log('📸 Atualizando galeria de cortes...');
        
        const galleryContainer = document.querySelector('.gallery-grid, #cortes .gallery-grid');
        if (!galleryContainer) {
            console.warn('Container da galeria não encontrado');
            return;
        }

        // Check if image already exists
        let existingImage = document.querySelector(`[data-image-id="${imageData.id || imageData.title}"]`);
        
        if (!existingImage && imageData.active) {
            // Create new gallery item using site structure
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item fade-in';
            galleryItem.setAttribute('data-image-id', imageData.id || imageData.title);
            galleryItem.innerHTML = `
                <img src="${imageData.url || imageData.cloudinaryUrl}" alt="${imageData.title}" loading="lazy">
                <div class="gallery-overlay">
                    <h3>${imageData.title}</h3>
                    ${imageData.description ? `<p>${imageData.description}</p>` : '<p>Estilo moderno e profissional</p>'}
                </div>
            `;
            
            galleryContainer.appendChild(galleryItem);
            console.log('✅ Nova imagem adicionada à galeria');
        } else if (existingImage) {
            // Update existing image
            const img = existingImage.querySelector('img');
            const title = existingImage.querySelector('h3');
            const desc = existingImage.querySelector('p');
            
            if (img) img.src = imageData.url || imageData.cloudinaryUrl;
            if (title) title.textContent = imageData.title;
            if (desc && imageData.description) desc.textContent = imageData.description;
            
            console.log('✅ Imagem da galeria atualizada');
        }
    }

    updateAboutSection(imageData) {
        console.log('👥 Atualizando seção sobre/equipe...');
        
        const aboutContainer = document.querySelector('.carousel-track, #carouselTrack, #sobre .carousel-track');
        if (!aboutContainer) {
            console.warn('Container da equipe não encontrado');
            return;
        }

        // Remove slides padrão na primeira imagem do Firebase
        const defaultSlides = aboutContainer.querySelectorAll('[data-default="true"]');
        if (defaultSlides.length > 0) {
            console.log('🔄 Removendo slides padrão...');
            defaultSlides.forEach(slide => slide.remove());
        }

        // Check if image already exists
        let existingMember = document.querySelector(`[data-image-id="${imageData.id || imageData.title}"]`);
        
        if (!existingMember && imageData.active) {
            // Remove default slides on first real image
            this.removeDefaultSlides();
            
            // Check if this is the first real slide
            const realSlides = aboutContainer.querySelectorAll('.carousel-slide:not([data-default])');
            const isFirstSlide = realSlides.length === 0;
            
            // Create new carousel slide
            const memberSlide = document.createElement('div');
            memberSlide.className = isFirstSlide ? 'carousel-slide active' : 'carousel-slide';
            memberSlide.setAttribute('data-image-id', imageData.id || imageData.title);
            memberSlide.innerHTML = `
                <img src="${imageData.url || imageData.cloudinaryUrl}" alt="${imageData.title}" loading="lazy">
                <div class="carousel-caption">
                    <h4>${imageData.title}</h4>
                    ${imageData.description ? `<p>${imageData.description}</p>` : '<p>Membro da Equipe</p>'}
                </div>
            `;
            
            aboutContainer.appendChild(memberSlide);
            console.log(`✅ Slide adicionado: ${imageData.title} com URL: ${imageData.url || imageData.cloudinaryUrl}`);
            
            // Update carousel indicators
            this.updateCarouselIndicators();
            
            console.log('✅ Novo membro da equipe adicionado ao carrossel');
        } else if (existingMember) {
            // Update existing member
            const img = existingMember.querySelector('img');
            const title = existingMember.querySelector('h4');
            const desc = existingMember.querySelector('p');
            
            if (img) img.src = imageData.url;
            if (title) title.textContent = imageData.title;
            if (desc && imageData.description) desc.textContent = imageData.description;
            
            console.log('✅ Membro da equipe atualizado');
        }
    }

    removeDefaultSlides() {
        const defaultSlides = document.querySelectorAll('.carousel-slide[data-default="true"]');
        defaultSlides.forEach(slide => {
            slide.remove();
            console.log('🗑️ Slide padrão removido');
        });
    }

    updateCarouselIndicators() {
        const indicatorsContainer = document.getElementById('carouselIndicators');
        const slides = document.querySelectorAll('#carouselTrack .carousel-slide');
        
        if (indicatorsContainer && slides.length > 0) {
            indicatorsContainer.innerHTML = '';
            slides.forEach((slide, index) => {
                const indicator = document.createElement('button');
                indicator.className = index === 0 ? 'indicator active' : 'indicator';
                indicator.setAttribute('data-slide', index);
                indicatorsContainer.appendChild(indicator);
            });
            
            // Restart carousel if there are multiple slides
            if (slides.length > 1 && typeof window.startCarouselAutoplay === 'function') {
                window.stopCarouselAutoplay();
                window.startCarouselAutoplay();
            }
        }
    }

    updateFacilitiesSection(imageData) {
        console.log('🏪 Atualizando seção de instalações...');
        
        const facilitiesContainer = document.querySelector('.facilities-grid, .instalacoes-grid');
        if (!facilitiesContainer) {
            console.warn('Container de instalações não encontrado');
            return;
        }

        // Similar logic to other sections
        let existingFacility = document.querySelector(`[data-image-id="${imageData.id || imageData.title}"]`);
        
        if (!existingFacility && imageData.active) {
            const facilityItem = document.createElement('div');
            facilityItem.className = 'facility-item';
            facilityItem.setAttribute('data-image-id', imageData.id || imageData.title);
            facilityItem.innerHTML = `
                <img src="${imageData.url}" alt="${imageData.title}" loading="lazy">
                <h4>${imageData.title}</h4>
                ${imageData.description ? `<p>${imageData.description}</p>` : ''}
            `;
            
            facilitiesContainer.appendChild(facilityItem);
            console.log('✅ Nova instalação adicionada');
        }
    }

    updateImageCache(snapshot) {
        this.cache.clear();
        snapshot.forEach(doc => {
            this.cache.set(doc.id, doc.data());
        });
        console.log(`📋 Cache atualizado com ${this.cache.size} imagens`);
    }

    handleContentChange(snapshot) {
        snapshot.forEach(doc => {
            const data = doc.data();
            const docId = doc.id;
            
            console.log(`🔄 Conteúdo alterado: ${docId}`);
            
            // Update site content based on document ID
            switch (docId) {
                case 'main':
                    this.updateMainContent(data);
                    break;
                case 'contact':
                    this.updateContactContent(data);
                    break;
                case 'schedule':
                    this.updateScheduleContent(data);
                    break;
                default:
                    console.log('Documento de conteúdo não mapeado:', docId);
            }
        });
    }

    updateMainContent(data) {
        // Update title
        const titleElement = document.querySelector('h1, .site-title, .main-title');
        if (titleElement && data.title) {
            titleElement.textContent = data.title;
        }

        // Update description
        const descElement = document.querySelector('.site-description, .main-description');
        if (descElement && data.description) {
            descElement.textContent = data.description;
        }

        console.log('✅ Conteúdo principal atualizado');
    }

    updateContactContent(data) {
        // Update contact information
        const phoneElement = document.querySelector('.phone, [data-contact="phone"]');
        if (phoneElement && data.phone) {
            phoneElement.textContent = data.phone;
        }

        const addressElement = document.querySelector('.address, [data-contact="address"]');
        if (addressElement && data.address) {
            addressElement.textContent = data.address;
        }

        console.log('✅ Informações de contato atualizadas');
    }

    updateScheduleContent(data) {
        // Update schedule information
        const scheduleElement = document.querySelector('.schedule, [data-content="schedule"]');
        if (scheduleElement && data.hours) {
            scheduleElement.innerHTML = data.hours;
        }

        console.log('✅ Horários atualizados');
    }

    destroy() {
        // Clean up listeners
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        this.listeners = [];
        this.cache.clear();
        console.log('🧹 Sistema de sincronização finalizado');
    }

    // Public method to manually trigger sync
    async manualSync() {
        console.log('🔄 Sincronização manual iniciada...');
        
        try {
            const snapshot = await this.db.collection('images').get();
            this.updateImageCache(snapshot);
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.active) {
                    this.handleImageAdded(data, doc.id);
                }
            });
            
            console.log('✅ Sincronização manual concluída');
            
        } catch (error) {
            console.error('❌ Erro na sincronização manual:', error);
        }
    }

    // Get current cache status
    getStatus() {
        return {
            initialized: this.isInitialized,
            cachedImages: this.cache.size,
            activeListeners: this.listeners.length
        };
    }
}

// Global instance
let realtimeSync;

// Auto-initialize when Firebase is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Firebase to initialize
    setTimeout(() => {
        if (typeof firebase !== 'undefined') {
            console.log('🚀 Inicializando sincronização em tempo real...');
            realtimeSync = new RealtimeSync();
            
            // Make it globally accessible
            window.realtimeSync = realtimeSync;
        } else {
            console.warn('⚠️ Firebase não disponível - sincronização não inicializada');
        }
    }, 1000);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeSync;
}