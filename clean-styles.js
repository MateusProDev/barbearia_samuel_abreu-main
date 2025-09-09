// Script para limpar estilos de debug
console.log('🧹 Limpando estilos de debug...');

function cleanGalleryStyles() {
    console.log('🎨 Limpando estilos da galeria...');
    
    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
        // Remover estilos inline de debug
        galleryGrid.style.backgroundColor = '';
        galleryGrid.style.border = '';
        console.log('✅ Estilos do grid limpos');
        
        // Limpar estilos dos items
        const items = galleryGrid.querySelectorAll('.gallery-item');
        items.forEach((item, index) => {
            // Remover estilos de debug
            item.style.border = '';
            item.style.backgroundColor = '';
            item.style.padding = '';
            
            // Limpar estilos das imagens
            const img = item.querySelector('img');
            if (img) {
                img.style.border = '';
                img.style.display = '';
                img.style.width = '';
                img.style.height = '';
            }
            
            console.log(`✅ Item ${index + 1} limpo`);
        });
        
        console.log(`🎉 ${items.length} items da galeria limpos`);
    } else {
        console.warn('⚠️ .gallery-grid não encontrado');
    }
}

// Executar limpeza quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanGalleryStyles);
} else {
    cleanGalleryStyles();
}

// Aguardar um pouco e executar novamente para garantir
setTimeout(cleanGalleryStyles, 2000);
setTimeout(cleanGalleryStyles, 5000);

// Disponibilizar função globalmente
window.cleanGalleryStyles = cleanGalleryStyles;

console.log('✅ Script de limpeza carregado. Use cleanGalleryStyles() se necessário');
