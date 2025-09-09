// Script de teste para debug da galeria
console.log('🔧 Iniciando script de debug da galeria...');

// Função para forçar exibição da galeria
function forceShowGallery() {
    console.log('🎯 Forçando exibição da galeria...');
    
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) {
        console.error('❌ .gallery-grid não encontrado');
        return;
    }

    console.log('✅ .gallery-grid encontrado');
    
    // Forçar estilos de exibição
    galleryGrid.style.display = 'grid';
    galleryGrid.style.opacity = '1';
    galleryGrid.style.visibility = 'visible';
    galleryGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    galleryGrid.style.gap = '20px';
    galleryGrid.style.minHeight = '200px';
    galleryGrid.style.backgroundColor = 'rgba(255,0,0,0.1)'; // Debug visual
    
    console.log('🎨 Estilos de debug aplicados');
    
    // Verificar filhos
    const items = galleryGrid.children;
    console.log(`📊 Items na galeria: ${items.length}`);
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`   Item ${i + 1}:`, item);
        
        // Forçar estilos nos items
        item.style.display = 'block';
        item.style.opacity = '1';
        item.style.visibility = 'visible';
        item.style.minHeight = '200px';
        item.style.border = '2px solid red'; // Debug visual
        
        const img = item.querySelector('img');
        if (img) {
            console.log(`     - Imagem encontrada: ${img.src}`);
            img.style.display = 'block';
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.border = '1px solid blue';
        } else {
            console.warn(`     - Nenhuma imagem encontrada no item ${i + 1}`);
        }
    }
}

// Função para criar galeria de teste
function createTestGallery() {
    console.log('🧪 Criando galeria de teste...');
    
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) {
        console.error('❌ .gallery-grid não encontrado');
        return;
    }

    // Limpar galeria
    galleryGrid.innerHTML = '';
    
    // Criar items de teste
    const testImages = [
        { title: 'Teste 1', url: 'https://via.placeholder.com/300x200/ff0000/ffffff?text=Teste+1' },
        { title: 'Teste 2', url: 'https://via.placeholder.com/300x200/00ff00/ffffff?text=Teste+2' },
        { title: 'Teste 3', url: 'https://via.placeholder.com/300x200/0000ff/ffffff?text=Teste+3' }
    ];
    
    testImages.forEach((testImg, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.style.border = '2px solid orange';
        item.style.padding = '10px';
        item.style.backgroundColor = 'rgba(0,0,0,0.1)';
        
        item.innerHTML = `
            <img src="${testImg.url}" alt="${testImg.title}" style="width: 100%; height: auto; display: block;">
            <div class="gallery-overlay">
                <h3>${testImg.title}</h3>
                <p>Imagem de teste ${index + 1}</p>
            </div>
        `;
        
        galleryGrid.appendChild(item);
        console.log(`✅ Item de teste ${index + 1} adicionado`);
    });
    
    forceShowGallery();
}

// Aguardar o site carregar
setTimeout(() => {
    console.log('🔍 Verificando estado atual...');
    
    // Verificar se siteSync existe
    if (window.siteSync) {
        console.log('✅ siteSync encontrado');
        
        // Executar debug
        const images = window.siteSync.debugImages();
        
        setTimeout(() => {
            console.log('🔄 Forçando atualização da galeria...');
            window.siteSync.forceUpdate();
            
            setTimeout(() => {
                console.log('🎯 Forçando exibição visual...');
                forceShowGallery();
            }, 2000);
        }, 2000);
        
    } else {
        console.warn('❌ siteSync não encontrado');
        
        setTimeout(() => {
            console.log('🧪 Criando galeria de teste...');
            createTestGallery();
        }, 1000);
    }
    
}, 3000);

// Disponibilizar funções globalmente para teste manual
window.forceShowGallery = forceShowGallery;
window.createTestGallery = createTestGallery;

console.log('✅ Script de debug configurado');
console.log('🛠️ Funções disponíveis: forceShowGallery(), createTestGallery()');
