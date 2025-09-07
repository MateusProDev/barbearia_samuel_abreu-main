// ========================================
// SISTEMA DE SINCRONIZAÇÃO AUTOMÁTICA
// Vincula Dashboard ↔ Site em Tempo Real
// ========================================

class SiteImageSync {
    constructor() {
        this.init(); 
    }

    init() {
        this.setupFirebaseListeners();
        this.loadImagesFromFirebase();
    }

    // Configurar listeners em tempo real do Firebase
    setupFirebaseListeners() {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.warn('Firebase não carregado ainda, tentando novamente...');
            setTimeout(() => this.setupFirebaseListeners(), 1000);
            return;
        }

        const db = firebase.firestore();

        // Listener para mudanças nas imagens
        db.collection('images').onSnapshot((snapshot) => {
            console.log('🔄 Imagens atualizadas no Firebase');
            this.updateSiteImages();
        });
    }

    // Carregar e aplicar imagens do Firebase no site
    async loadImagesFromFirebase() {
        try {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.warn('Firebase não disponível');
                return;
            }

            const db = firebase.firestore();
            const snapshot = await db.collection('images')
                .orderBy('createdAt', 'desc')
                .get();

            const imagesBySection = {};

            snapshot.forEach(doc => {
                const data = doc.data();
                const section = data.section || 'gallery';
                
                if (!imagesBySection[section]) {
                    imagesBySection[section] = [];
                }
                
                imagesBySection[section].push({
                    id: doc.id,
                    ...data
                });
            });

            // Aplicar imagens nas seções do site
            this.applyImagesToSite(imagesBySection);

        } catch (error) {
            console.error('Erro ao carregar imagens do Firebase:', error);
        }
    }

    // Aplicar imagens nas seções específicas do site
    applyImagesToSite(imagesBySection) {
        // Atualizar Hero/Banner
        if (imagesBySection.hero && imagesBySection.hero.length > 0) {
            this.updateHeroSection(imagesBySection.hero[0]);
        }

        // Atualizar Seção de Serviços
        if (imagesBySection.services) {
            this.updateServicesSection(imagesBySection.services);
        }

        // Atualizar Galeria de Cortes
        if (imagesBySection.gallery) {
            this.updateGallerySection(imagesBySection.gallery);
        }

        // Atualizar Carrossel da Equipe
        if (imagesBySection.team) {
            this.updateTeamCarousel(imagesBySection.team);
        }

        console.log('✅ Imagens do site atualizadas com sucesso!');
    }

    // Atualizar seção Hero/Banner
    updateHeroSection(heroImage) {
        const heroSection = document.querySelector('.hero');
        const heroLogo = document.querySelector('.hero-logo');
        
        if (heroSection && heroImage.url) {
            // Pode ser usado como background ou logo
            if (heroImage.title && heroImage.title.toLowerCase().includes('logo')) {
                if (heroLogo) {
                    heroLogo.src = heroImage.url;
                    heroLogo.alt = heroImage.title;
                }
            } else {
                // Usar como background da seção hero
                heroSection.style.backgroundImage = `url('${heroImage.url}')`;
                heroSection.style.backgroundSize = 'cover';
                heroSection.style.backgroundPosition = 'center';
            }
        }
    }

    // Atualizar seção de serviços
    updateServicesSection(servicesImages) {
        const serviceCards = document.querySelectorAll('.service-card img');
        
        serviceCards.forEach((img, index) => {
            if (servicesImages[index]) {
                const imageData = servicesImages[index];
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
    }

    // Atualizar galeria de cortes
    updateGallerySection(galleryImages) {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;

        // Limpar galeria atual
        galleryGrid.innerHTML = '';

        // Adicionar novas imagens
        galleryImages.forEach(imageData => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item fade-in';
            galleryItem.innerHTML = `
                <img src="${imageData.url}" alt="${imageData.title}" loading="lazy">
                <div class="gallery-overlay">
                    <h3>${imageData.title || 'Corte Profissional'}</h3>
                    <p>${imageData.description || 'Estilo único e personalizado'}</p>
                </div>
            `;
            
            // Adicionar evento de clique para modal
            galleryItem.addEventListener('click', () => {
                this.openImageModal(imageData.url, imageData.title);
            });

            galleryGrid.appendChild(galleryItem);
        });
    }

    // Atualizar carrossel da equipe
    updateTeamCarousel(teamImages) {
        const carouselTrack = document.getElementById('carouselTrack');
        if (!carouselTrack) return;

        // Manter os primeiros slides se existirem, adicionar novos
        const existingSlides = carouselTrack.querySelectorAll('.carousel-slide');
        
        teamImages.forEach(imageData => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.innerHTML = `
                <img src="${imageData.url}" alt="${imageData.title}">
                <div class="carousel-caption">
                    <h4>${imageData.title || 'Equipe'}</h4>
                    <p>${imageData.description || 'Profissional qualificado'}</p>
                </div>
            `;
            carouselTrack.appendChild(slide);
        });

        // Reinicializar carrossel se necessário
        if (typeof initCarousel === 'function') {
            initCarousel();
        }
    }

    // Abrir modal de imagem (se existir)
    openImageModal(imageUrl, title) {
        // Verificar se existe modal no site
        let modal = document.getElementById('imageModal');
        
        if (!modal) {
            // Criar modal se não existir
            modal = document.createElement('div');
            modal.id = 'imageModal';
            modal.className = 'image-modal';
            modal.innerHTML = `
                <div class="modal-overlay" onclick="this.parentElement.style.display='none'">
                    <div class="modal-image-container">
                        <img id="modalImage" src="" alt="">
                        <div class="modal-title" id="modalTitle"></div>
                        <button class="modal-close" onclick="this.closest('.image-modal').style.display='none'">&times;</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Adicionar estilos se não existirem
            if (!document.getElementById('modalStyles')) {
                const style = document.createElement('style');
                style.id = 'modalStyles';
                style.textContent = `
                    .image-modal {
                        display: none;
                        position: fixed;
                        z-index: 10000;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                    }
                    .modal-overlay {
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.9);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .modal-image-container {
                        position: relative;
                        max-width: 90%;
                        max-height: 90%;
                    }
                    .modal-image-container img {
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                    }
                    .modal-title {
                        position: absolute;
                        bottom: -40px;
                        left: 0;
                        right: 0;
                        text-align: center;
                        color: white;
                        font-size: 1.2rem;
                        font-weight: bold;
                    }
                    .modal-close {
                        position: absolute;
                        top: -40px;
                        right: 0;
                        background: none;
                        border: none;
                        color: white;
                        font-size: 2rem;
                        cursor: pointer;
                    }
                `;
                document.head.appendChild(style);
            }
        }

        // Atualizar conteúdo do modal
        document.getElementById('modalImage').src = imageUrl;
        document.getElementById('modalTitle').textContent = title || '';
        modal.style.display = 'block';
    }

    // Função para atualizar imagens (chamada pelo dashboard)
    async updateSiteImages() {
        await this.loadImagesFromFirebase();
    }

    // Mapear seções antigas para novas
    mapLegacyImages() {
        const imageMapping = {
            // Serviços
            'img/cabelo e barba.jpeg': 'services',
            'img/Corte infantil.jpeg': 'services',
            'img/pigmentacao.jpeg': 'services',
            'img/sombracelha.jpeg': 'services',
            'img/classico na tesoura.jpeg': 'services',
            'img/luzes.jpeg': 'services',
            'img/platinado.jpeg': 'services',
            
            // Galeria
            'img/Corte taper fade Americano.jpeg': 'gallery',
            'img/Mid fade.jpeg': 'gallery',
            'img/High fadeDegradê alto.jpeg': 'gallery',
            'img/Social Clássico..jpeg': 'gallery',
            'img/corte_social.jpeg': 'gallery',
            
            // Equipe/Ambiente
            'img/proprietario.jpeg': 'team',
            'img/barbearia.jpeg': 'team',
            'img/proprietario 2.jpeg': 'team',
            'img/pro1.jpeg': 'team',
            'img/pro2.jpeg': 'team',
            'img/pro3.jpeg': 'team',
            'img/kaioUm.jpeg': 'team',
            'img/kaioDois.jpeg': 'team',
            
            // Hero/Logo
            'img/logo_barber.png': 'hero',
            'img/logo_baber_branco.png': 'hero'
        };

        return imageMapping;
    }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar Firebase carregar
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
