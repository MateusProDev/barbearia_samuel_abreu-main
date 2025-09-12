// ========================================
// GERENCIADOR DE IMAGENS
// Sistema completo de upload e gerenciamento
// ========================================

class ImageManager {
    constructor() {
        this.sections = ['hero', 'services', 'servicos', 'gallery', 'galeria', 'cortes', 'team', 'equipe', 'sobre', 'portfolio', 'instalacoes'];
        this.currentSection = null;
        this.editingImageId = null;
        this.init();
    }

    init() {
        console.log('🖼️ Inicializando ImageManager...');
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    // Configurar eventos
    setupEventListeners() {
        // Evento para formulário de upload
        const uploadForm = document.getElementById('imageUploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleImageUpload(e));
        }

        // Evento para formulário de edição
        const editForm = document.getElementById('imageEditForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleImageEdit(e));
        }

        // Evento para seleção de arquivo
        const imageInput = document.getElementById('imageInput');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }
    }

    // Configurar drag and drop
    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection({ target: { files } });
            }
        });
    }

    // Lidar com seleção de arquivo
    handleFileSelection(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar arquivo
        if (!this.validateFile(file)) return;

        // Mostrar preview
        this.showImagePreview(file);
    }

    // Validar arquivo
    validateFile(file) {
        // Verificar tipo
        if (!file.type.startsWith('image/')) {
            this.showNotification('Arquivo deve ser uma imagem', 'error');
            return false;
        }

        // Verificar tamanho (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Imagem deve ter no máximo 5MB', 'error');
            return false;
        }

        return true;
    }

    // Mostrar preview da imagem
    showImagePreview(file) {
        const previewContainer = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const previewFileName = document.getElementById('previewFileName');
        const previewFileSize = document.getElementById('previewFileSize');

        if (!previewContainer || !previewImg) return;

        // Criar URL para preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
            
            if (previewFileName) {
                previewFileName.textContent = file.name;
            }
            
            if (previewFileSize) {
                previewFileSize.textContent = this.formatFileSize(file.size);
            }
        };
        
        reader.readAsDataURL(file);
    }

    // Formatar tamanho do arquivo
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Lidar com upload de imagem
    async handleImageUpload(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const file = document.getElementById('imageInput').files[0];
        
        if (!file) {
            this.showNotification('Selecione uma imagem', 'error');
            return;
        }

        const title = formData.get('title') || document.getElementById('imageTitle').value;
        const description = formData.get('description') || document.getElementById('imageDescription').value;
        
        if (!title.trim()) {
            this.showNotification('Digite um título para a imagem', 'error');
            return;
        }

        try {
            this.showUploadProgress(0);
            
            // Upload para Cloudinary
            const imageUrl = await this.uploadToCloudinary(file);
            
            this.showUploadProgress(50);
            
            // Salvar no Firebase
            const imageData = {
                title: title.trim(),
                description: description.trim() || '',
                section: this.currentSection,
                url: imageUrl,
                cloudinaryUrl: imageUrl,
                filename: file.name,
                fileSize: file.size,
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: localStorage.getItem('adminEmail') || 'admin'
            };

            await this.saveToFirebase(imageData);
            
            this.showUploadProgress(100);
            
            this.showNotification('✅ Imagem enviada com sucesso!', 'success');
            
            // Limpar formulário e fechar modal
            this.resetForm();
            this.closeImageUploadModal();
            
            // Recarregar imagens
            await this.loadImages();
            
            // Disparar sincronização
            this.triggerSiteSync();
            
        } catch (error) {
            console.error('Erro no upload:', error);
            this.showNotification('❌ Erro ao enviar imagem: ' + error.message, 'error');
            this.hideUploadProgress();
        }
    }

    // Upload para Cloudinary
    async uploadToCloudinary(file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "qc7tkpck");
        formData.append("cloud_name", "doeiv6m4h");

        const response = await fetch(
            "https://api.cloudinary.com/v1_1/doeiv6m4h/image/upload",
            {
                method: "POST",
                body: formData,
                timeout: 30000 // 30 segundos timeout
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Erro ao fazer upload da imagem.");
        }

        const data = await response.json();
        return data.secure_url;
    }

    // Salvar no Firebase
    async saveToFirebase(imageData) {
        if (!window.db) {
            throw new Error('Firebase não inicializado');
        }

        await window.db.collection('images').add(imageData);
    }

    // Mostrar progresso de upload
    showUploadProgress(percent) {
        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        if (progressFill) {
            progressFill.style.width = percent + '%';
        }
        
        if (progressText) {
            progressText.textContent = percent + '%';
        }
    }

    // Esconder progresso de upload
    hideUploadProgress() {
        const progressContainer = document.getElementById('uploadProgress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }

    // Carregar imagens do Firebase
    async loadImages() {
        try {
            if (!window.db) {
                console.warn('Firebase não inicializado');
                return;
            }

            const snapshot = await window.db.collection('images')
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

            this.renderImages(imagesBySection);
            this.updateImageStats(snapshot.size);
            
        } catch (error) {
            console.error('Erro ao carregar imagens:', error);
            this.showNotification('Erro ao carregar imagens', 'error');
        }
    }

    // Renderizar imagens na interface
    renderImages(imagesBySection) {
        this.sections.forEach(section => {
            const container = document.getElementById(`${section}-images`);
            if (!container) return;

            const images = imagesBySection[section] || [];
            
            container.innerHTML = images.map(image => this.createImageCard(image, section)).join('');
        });
    }

    // Criar card de imagem
    createImageCard(image, section) {
        const imageUrl = image.cloudinaryUrl || image.url || '';
        const isActive = image.active !== false;
        const createdDate = image.createdAt ? new Date(image.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Data não disponível';
        
        return `
            <div class="image-item ${isActive ? 'active' : 'inactive'}" data-image-id="${image.id}">
                <div class="image-preview-container">
                    <img src="${imageUrl}" alt="${image.title}" class="image-preview" 
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22100%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23ddd%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22>Erro ao carregar</text></svg>'">
                    ${!isActive ? '<div class="inactive-overlay">Inativa</div>' : ''}
                </div>
                
                <div class="image-info">
                    <h4 class="image-title">${image.title || 'Sem título'}</h4>
                    <p class="image-description">${image.description || 'Sem descrição'}</p>
                    <p class="image-meta">
                        <small>Seção: ${section}</small><br>
                        <small>Criado: ${createdDate}</small>
                    </p>
                </div>
                
                <div class="image-actions">
                    <button class="btn-small btn-edit" onclick="window.imageManager.editImage('${image.id}')" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-small btn-toggle ${isActive ? 'btn-active' : 'btn-inactive'}" 
                            onclick="window.imageManager.toggleImageStatus('${image.id}')" 
                            title="${isActive ? 'Desativar' : 'Ativar'}">
                        ${isActive ? '👁️' : '🚫'}
                    </button>
                    <button class="btn-small btn-delete" onclick="window.imageManager.deleteImage('${image.id}')" title="Excluir">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    // Editar imagem
    async editImage(imageId) {
        try {
            const doc = await window.db.collection('images').doc(imageId).get();
            
            if (!doc.exists) {
                this.showNotification('Imagem não encontrada', 'error');
                return;
            }

            const data = doc.data();
            
            // Preencher modal de edição
            this.fillEditModal(data);
            
            // Salvar ID para edição
            this.editingImageId = imageId;
            
            // Mostrar modal de edição
            this.openImageEditModal();
            
        } catch (error) {
            console.error('Erro ao carregar imagem para edição:', error);
            this.showNotification('Erro ao carregar imagem para edição', 'error');
        }
    }

    // Preencher modal de edição
    fillEditModal(data) {
        const editImagePreview = document.getElementById('editImagePreview');
        const editImageTitle = document.getElementById('editImageTitle');
        const editImageDescription = document.getElementById('editImageDescription');

        if (editImagePreview) {
            editImagePreview.src = data.cloudinaryUrl || data.url || '';
            editImagePreview.alt = data.title || '';
        }
        
        if (editImageTitle) {
            editImageTitle.value = data.title || '';
        }
        
        if (editImageDescription) {
            editImageDescription.value = data.description || '';
        }
    }

    // Lidar com edição de imagem
    async handleImageEdit(event) {
        event.preventDefault();
        
        if (!this.editingImageId) {
            this.showNotification('Erro: Nenhuma imagem selecionada para edição', 'error');
            return;
        }

        const formData = new FormData(event.target);
        const title = formData.get('title') || document.getElementById('editImageTitle').value;
        const description = formData.get('description') || document.getElementById('editImageDescription').value;
        
        if (!title.trim()) {
            this.showNotification('Digite um título para a imagem', 'error');
            return;
        }

        try {
            const updateData = {
                title: title.trim(),
                description: description.trim() || '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: localStorage.getItem('adminEmail') || 'admin'
            };

            await window.db.collection('images').doc(this.editingImageId).update(updateData);
            
            this.showNotification('✅ Imagem atualizada com sucesso!', 'success');
            
            // Limpar edição e fechar modal
            this.editingImageId = null;
            this.closeImageEditModal();
            
            // Recarregar imagens
            await this.loadImages();
            
            // Disparar sincronização
            this.triggerSiteSync();
            
        } catch (error) {
            console.error('Erro ao editar imagem:', error);
            this.showNotification('❌ Erro ao editar imagem: ' + error.message, 'error');
        }
    }

    // Alternar status da imagem
    async toggleImageStatus(imageId) {
        try {
            const doc = await window.db.collection('images').doc(imageId).get();
            
            if (!doc.exists) {
                this.showNotification('Imagem não encontrada', 'error');
                return;
            }

            const currentStatus = doc.data().active !== false; // default true
            
            await window.db.collection('images').doc(imageId).update({
                active: !currentStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showNotification(`Imagem ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`, 'success');
            
            // Recarregar imagens
            await this.loadImages();
            
            // Disparar sincronização
            this.triggerSiteSync();
            
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            this.showNotification('Erro ao alterar status da imagem', 'error');
        }
    }

    // Deletar imagem
    async deleteImage(imageId) {
        if (!confirm('⚠️ Tem certeza que deseja deletar esta imagem?\n\nEsta ação não pode ser desfeita.')) {
            return;
        }

        try {
            await window.db.collection('images').doc(imageId).delete();
            
            this.showNotification('✅ Imagem deletada com sucesso!', 'success');
            
            // Recarregar imagens
            await this.loadImages();
            
            // Disparar sincronização
            this.triggerSiteSync();
            
        } catch (error) {
            console.error('Erro ao deletar imagem:', error);
            this.showNotification('❌ Erro ao deletar imagem: ' + error.message, 'error');
        }
    }

    // Atualizar estatísticas de imagens
    updateImageStats(totalImages) {
        const totalElement = document.getElementById('totalImages');
        const lastUpdateElement = document.getElementById('lastImageUpdate');
        
        if (totalElement) {
            totalElement.textContent = totalImages;
        }
        
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleString('pt-BR');
        }
    }

    // Disparar sincronização com o site
    triggerSiteSync() {
        try {
            // Criar evento customizado
            const syncEvent = new CustomEvent('imagesUpdated', {
                detail: { 
                    timestamp: Date.now(),
                    source: 'dashboard'
                }
            });
            
            window.dispatchEvent(syncEvent);
            
            console.log('🔄 Sincronização disparada para o site');
            
            // Se há uma instância do site sync, forçar atualização
            if (window.siteSync) {
                setTimeout(() => {
                    window.siteSync.forceUpdate();
                }, 1000);
            }
            
        } catch (error) {
            console.log('⚠️ Site não está disponível para sincronização:', error);
        }
    }

    // Abrir modal de upload
    openImageUpload(section) {
        this.currentSection = section;
        
        // Atualizar título do modal
        const modalTitle = document.getElementById('uploadModalTitle');
        if (modalTitle) {
            const sectionNames = {
                'hero': 'Banner Principal',
                'services': 'Serviços',
                'servicos': 'Serviços', 
                'gallery': 'Galeria',
                'galeria': 'Galeria',
                'cortes': 'Cortes',
                'team': 'Equipe',
                'equipe': 'Equipe',
                'sobre': 'Sobre',
                'portfolio': 'Portfólio',
                'instalacoes': 'Instalações'
            };
            
            modalTitle.textContent = `📤 Adicionar Imagem - ${sectionNames[section] || section}`;
        }
        
        // Resetar formulário
        this.resetForm();
        
        // Mostrar modal
        this.showImageUploadModal();
    }

    // Mostrar modal de upload
    showImageUploadModal() {
        const modal = document.getElementById('imageUploadModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevenir scroll
        }
    }

    // Fechar modal de upload
    closeImageUploadModal() {
        const modal = document.getElementById('imageUploadModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restaurar scroll
        }
        
        this.resetForm();
        this.currentSection = null;
    }

    // Mostrar modal de edição
    openImageEditModal() {
        const modal = document.getElementById('imageEditModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    // Fechar modal de edição
    closeImageEditModal() {
        const modal = document.getElementById('imageEditModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        this.editingImageId = null;
    }

    // Resetar formulário
    resetForm() {
        const forms = ['imageUploadForm', 'imageEditForm'];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.reset();
            }
        });
        
        // Esconder preview
        const previewContainer = document.getElementById('imagePreview');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        
        // Esconder progresso
        this.hideUploadProgress();
    }

    // Mostrar notificação
    showNotification(message, type = 'info') {
        // Remover notificações existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 1.2rem; cursor: pointer; margin-left: 10px;">&times;</button>
        `;
        
        // Estilos inline
        const colors = {
            success: '#25D366',
            error: '#ff4444',
            warning: '#ff9800',
            info: '#2196F3'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Adicionar animação CSS se não existir
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // Obter estatísticas das imagens
    async getImageStats() {
        try {
            const snapshot = await window.db.collection('images').get();
            return {
                total: snapshot.size,
                active: snapshot.docs.filter(doc => doc.data().active !== false).length,
                inactive: snapshot.docs.filter(doc => doc.data().active === false).length
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return { total: 0, active: 0, inactive: 0 };
        }
    }

    // Método público para carregar imagens do Firebase (para compatibilidade)
    async loadImagesFromFirebase() {
        try {
            const snapshot = await window.db.collection('images').get();
            const images = [];
            
            snapshot.forEach(doc => {
                images.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return images;
        } catch (error) {
            console.error('Erro ao carregar imagens do Firebase:', error);
            return [];
        }
    }
}

// Funções globais para compatibilidade com o HTML
window.openImageUpload = function(section) {
    if (window.imageManager) {
        window.imageManager.openImageUpload(section);
    }
};

window.closeImageUploadModal = function() {
    if (window.imageManager) {
        window.imageManager.closeImageUploadModal();
    }
};

window.closeImageEditModal = function() {
    if (window.imageManager) {
        window.imageManager.closeImageEditModal();
    }
};

window.deleteImage = function(imageId) {
    if (window.imageManager) {
        window.imageManager.deleteImage(imageId);
    }
};

// Função para mostrar categoria de imagens
window.showImageCategory = function(category) {
    // Esconder todas as categorias
    const allCategories = document.querySelectorAll('.image-category-content');
    allCategories.forEach(cat => {
        cat.classList.remove('active');
        cat.style.display = 'none';
    });
    
    // Mostrar categoria selecionada
    const selectedCategory = document.getElementById(category);
    if (selectedCategory) {
        selectedCategory.classList.add('active');
        selectedCategory.style.display = 'block';
    }
    
    // Atualizar botões de categoria
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[onclick="showImageCategory('${category}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar Firebase estar disponível
    const initImageManager = () => {
        if (typeof firebase !== 'undefined' && window.db) {
            window.imageManager = new ImageManager();
            console.log('✅ ImageManager inicializado com sucesso');
        } else {
            console.log('⏳ Aguardando Firebase... tentando novamente em 500ms');
            setTimeout(initImageManager, 500);
        }
    };
    
    initImageManager();
});

// Exportar classe para uso modular se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageManager;
}