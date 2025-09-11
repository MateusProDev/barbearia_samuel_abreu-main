// Sistema de Animações de Scroll - Barbearia
console.log('🎬 Carregando sistema de animações...');

class ScrollAnimations {
    constructor() {
        this.observer = null;
        this.animatedElements = new Set();
        this.init();
    }

    init() {
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        console.log('🚀 Iniciando sistema de animações de scroll...');
        
        // PRIMEIRO: Garantir que o hero seja sempre visível
        this.ensureHeroVisibility();
        
        // Configurar Intersection Observer
        this.setupObserver();
        
        // Adicionar classes de animação aos elementos
        this.addAnimationClasses();
        
        // Observar elementos
        this.observeElements();
        
        // Animar header na inicialização
        setTimeout(() => this.animateHeader(), 100);
        
        console.log('✅ Sistema de animações configurado');
    }

    ensureHeroVisibility() {
        // Garantir que todos elementos do hero sejam sempre visíveis
        const heroElements = document.querySelectorAll('.hero, .hero *, .hero-content, .hero-content *, .hero-logo, .hero h1, .hero p, .hero .btn');
        heroElements.forEach(element => {
            element.style.opacity = '1';
            element.style.transform = 'none';
            element.style.visibility = 'visible';
            element.style.animation = 'none';
        });
        
        console.log('✅ Hero elements forced to be visible');
    }

    setupObserver() {
        const options = {
            root: null,
            rootMargin: '-50px 0px -50px 0px', // Trigger quando 50px visível
            threshold: [0, 0.1, 0.3, 0.5, 0.7, 1]
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                const elementId = element.dataset.animationId || element.className;

                if (entry.isIntersecting) {
                    // Elemento entrando na viewport
                    if (!this.animatedElements.has(elementId)) {
                        this.triggerAnimation(element, entry.intersectionRatio);
                        this.animatedElements.add(elementId);
                    }
                }
            });
        }, options);
    }

    addAnimationClasses() {
        // Títulos de seções
        const sectionTitles = document.querySelectorAll('.section-title');
        sectionTitles.forEach((title, index) => {
            title.dataset.animationId = `title-${index}`;
        });

        // Subtítulos
        const sectionSubtitles = document.querySelectorAll('.section-subtitle');
        sectionSubtitles.forEach((subtitle, index) => {
            subtitle.dataset.animationId = `subtitle-${index}`;
        });

        // Cards de serviço
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach((card, index) => {
            card.dataset.animationId = `service-${index}`;
        });

        // Items da galeria
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach((item, index) => {
            item.dataset.animationId = `gallery-${index}`;
        });

        // Carrossel
        const carousel = document.querySelector('.carousel-container');
        if (carousel) {
            carousel.dataset.animationId = 'carousel';
        }

        // Sobre nós
        const aboutText = document.querySelector('.about-text');
        const aboutImage = document.querySelector('.about-image');
        if (aboutText) aboutText.dataset.animationId = 'about-text';
        if (aboutImage) aboutImage.dataset.animationId = 'about-image';

        // Horários
        const horariosContainer = document.querySelector('.horarios-container');
        if (horariosContainer) {
            horariosContainer.dataset.animationId = 'horarios';
        }

        // Footer sections
        const footerSections = document.querySelectorAll('.footer-section');
        footerSections.forEach((section, index) => {
            section.dataset.animationId = `footer-${index}`;
        });
    }

    observeElements() {
        // Observar todos os elementos com animação (EXCETO hero)
        const elementsToAnimate = [
            '.section-title',
            '.section-subtitle', 
            '.service-card',
            '.gallery-item',
            '.carousel-container',
            '.about-text',
            '.about-image',
            '.horarios-container',
            '.footer-section'
        ];

        elementsToAnimate.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Não animar elementos dentro do hero
                if (!element.closest('.hero') && this.observer) {
                    this.observer.observe(element);
                }
            });
        });
    }

    triggerAnimation(element, ratio) {
        const delay = this.getAnimationDelay(element);
        
        setTimeout(() => {
            element.classList.add('visible');
            
            // Log para debug
            const elementType = element.className.split(' ')[0];
            console.log(`✨ Animando: ${elementType} (ratio: ${ratio.toFixed(2)})`);
            
            // Efeitos especiais por tipo
            this.addSpecialEffects(element);
            
        }, delay);
    }

    getAnimationDelay(element) {
        // Cards de serviço com delay escalonado
        if (element.classList.contains('service-card')) {
            const index = Array.from(element.parentNode.children).indexOf(element);
            return index * 100; // 100ms delay entre cada card
        }
        
        // Items da galeria com delay escalonado
        if (element.classList.contains('gallery-item')) {
            const index = Array.from(element.parentNode.children).indexOf(element);
            return index * 150; // 150ms delay entre cada item
        }
        
        // Footer sections
        if (element.classList.contains('footer-section')) {
            const index = Array.from(element.parentNode.children).indexOf(element);
            return index * 200; // 200ms delay entre cada seção
        }
        
        // Delay padrão baseado no tipo
        if (element.classList.contains('section-subtitle')) return 200;
        if (element.classList.contains('about-image')) return 300;
        
        return 0; // Sem delay
    }

    addSpecialEffects(element) {
        // Efeito especial para cards de serviço
        if (element.classList.contains('service-card')) {
            const img = element.querySelector('img');
            if (img) {
                setTimeout(() => {
                    img.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        img.style.transform = 'scale(1)';
                    }, 200);
                }, 300);
            }
        }
        
        // Efeito para galeria
        if (element.classList.contains('gallery-item')) {
            setTimeout(() => {
                element.style.transform += ' scale(1.02)';
                setTimeout(() => {
                    element.style.transform = element.style.transform.replace('scale(1.02)', '');
                }, 300);
            }, 400);
        }
        
        // Efeito para carrossel
        if (element.classList.contains('carousel-container')) {
            setTimeout(() => {
                this.startCarouselEntryAnimation();
            }, 500);
        }
    }

    startCarouselEntryAnimation() {
        const slides = document.querySelectorAll('.carousel-slide');
        slides.forEach((slide, index) => {
            slide.style.opacity = '0';
            slide.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                slide.style.transition = 'all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)';
                slide.style.opacity = '1';
                slide.style.transform = 'translateX(0)';
            }, index * 200);
        });
    }

    animateHeader() {
        const logo = document.querySelector('.logo img');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        // Animar logo
        if (logo) {
            logo.style.opacity = '0';
            logo.style.transform = 'scale(0.8) rotate(-5deg)';
            
            setTimeout(() => {
                logo.style.transition = 'all 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)';
                logo.style.opacity = '1';
                logo.style.transform = 'scale(1) rotate(0deg)';
            }, 200);
        }
        
        // Animar links de navegação
        navLinks.forEach((link, index) => {
            link.style.opacity = '0';
            link.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                link.style.transition = 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)';
                link.style.opacity = '1';
                link.style.transform = 'translateY(0)';
            }, 300 + (index * 100));
        });
    }

    // Método público para forçar animação de um elemento
    forceAnimate(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (!element.classList.contains('visible')) {
                this.triggerAnimation(element, 1);
            }
        });
    }

    // Método para reinicializar animações (útil para conteúdo dinâmico)
    reinitialize() {
        console.log('🔄 Reinicializando animações...');
        this.animatedElements.clear();
        
        // Re-observar novos elementos
        this.addAnimationClasses();
        this.observeElements();
    }

    // Método para parar todas as animações
    pause() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    // Método para retomar animações
    resume() {
        this.setupObserver();
        this.observeElements();
    }
}

// Auto-inicialização
let scrollAnimations = null;

function initScrollAnimations() {
    if (!scrollAnimations) {
        scrollAnimations = new ScrollAnimations();
        
        // Disponibilizar globalmente para debug
        window.scrollAnimations = scrollAnimations;
    }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}

// Reinicializar quando novo conteúdo for adicionado dinamicamente
window.addEventListener('siteContentUpdated', () => {
    if (scrollAnimations) {
        setTimeout(() => {
            scrollAnimations.reinitialize();
        }, 100);
    }
});

// Funções utilitárias globais
window.forceAnimateElements = (selector) => {
    if (scrollAnimations) {
        scrollAnimations.forceAnimate(selector);
    }
};

window.reinitializeAnimations = () => {
    if (scrollAnimations) {
        scrollAnimations.reinitialize();
    }
};

console.log('✅ scroll-animations.js carregado');
console.log('💡 Comandos disponíveis:');
console.log('   - forceAnimateElements(".service-card") // Força animação');
console.log('   - reinitializeAnimations() // Reinicia sistema');
