class AssetorApp {
  constructor() {
    this.currentImage = null;
    this.cropper = null;
    this.editorMode = null;
    this.shapeProfiles = {};
    this.customShapes = [];
    this.customStyles = ['realistic', 'cartoon', 'abstract', 'fantasy'];
    this.apiKey = '';
    this.username = '';
    this.rotation = 0;
    this.flipHorizontal = false;
    this.flipVertical = false;
    this.initApp();
  }

  async initApp() {
    await this.initTheme();
    this.initNavigation();
    this.initApiTest();
    this.initImageGeneration();
    this.initGallery();
    this.initTemplates();
    this.initUpload();
    this.initAITools();
    this.initSettings();
    this.initImageEditor();
    this.initSearch();
    this.initImageViewer();
    this.initModalCloseButtons();
    this.loadGalleryImages();
    this.initImageActionButtons();
    this.initCustomStyle();
    this.initHelpModal();
  }

  async safeFetch(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...(options.headers || {})
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      this.showNotification(`API error: ${error.message}`, 'error');
      return null;
    }
  }

  initHelpModal() {
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelp = document.getElementById('closeHelp');
    
    if (!helpBtn || !helpModal || !closeHelp) return;
    
    helpBtn.addEventListener('click', () => {
      helpModal.style.display = 'block';
    });
    
    closeHelp.addEventListener('click', () => {
      helpModal.style.display = 'none';
    });
    
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.style.display = 'none';
      }
    });
  }

  async initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      themeToggle.innerHTML = isDark ? 
        '<i class="fas fa-sun"></i><span>Light Mode</span>' : 
        '<i class="fas fa-moon"></i><span>Dark Mode</span>';
      
      this.saveSetting('darkMode', isDark);
    });

    const settings = await window.electronAPI.getSettings();
    const isDark = settings.darkMode || false;
    
    if (isDark) {
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    }
    
    this.apiKey = settings.shapesApiKey || '';
    this.username = settings.shapesUsername || '';
    this.customShapes = settings.customShapes || [];
    this.customStyles = settings.customStyles || this.customStyles;
    this.updateShapeDropdown();
    this.updateStyleDropdown();
    
    if (settings.accentColor) {
      this.applyAccentColor(settings.accentColor);
    }
    
    if (settings.fontFamily) {
      document.body.style.fontFamily = settings.fontFamily;
      if (document.getElementById('fontSelect')) {
        document.getElementById('fontSelect').value = settings.fontFamily;
      }
    }
  }

  applyAccentColor(color) {
    document.documentElement.style.setProperty('--primary', color);
    const darker = this.darkenColor(color, 20);
    document.documentElement.style.setProperty('--primary-dark', darker);
  }

  darkenColor(hex, percent) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const newR = Math.max(0, r * (100 - percent) / 100);
    const newG = Math.max(0, g * (100 - percent) / 100);
    const newB = Math.max(0, b * (100 - percent) / 100);
    
    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
  }

  initImageActionButtons() {
    document.getElementById('cropBtn').addEventListener('click', () => {
      if (!this.currentImage) {
        this.showNotification('Please generate or select an image first', 'error');
        return;
      }
      this.openEditor('crop');
    });

    document.getElementById('adjustBtn').addEventListener('click', () => {
      if (!this.currentImage) {
        this.showNotification('Please generate or select an image first', 'error');
        return;
      }
      this.openEditor('adjust');
    });

    document.getElementById('enhanceBtn').addEventListener('click', () => {
      if (!this.currentImage) {
        this.showNotification('Please generate or select an image first', 'error');
        return;
      }
      this.enhanceImage();
    });
  }

  updateShapeDropdown() {
    const shapeSelect = document.getElementById('shapeSelect');
    shapeSelect.innerHTML = '';
    
    const defaultShapes = ['tenshi', 'einstein', 'maverick'];
    const allShapes = [...defaultShapes, ...this.customShapes];
    
    allShapes.forEach(shape => {
      const option = document.createElement('option');
      option.value = shape;
      option.textContent = shape;
      shapeSelect.appendChild(option);
    });
    
    this.renderCustomShapesList();
  }
  
  renderCustomShapesList() {
    const container = document.getElementById('customShapesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.customShapes.forEach(shape => {
      const tag = document.createElement('div');
      tag.className = 'shape-tag';
      tag.innerHTML = `
        ${shape}
        <span class="remove" data-shape="${shape}">&times;</span>
      `;
      container.appendChild(tag);
    });
    
    document.querySelectorAll('.shape-tag .remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const shape = btn.dataset.shape;
        this.customShapes = this.customShapes.filter(s => s !== shape);
        this.saveSetting('customShapes', this.customShapes);
        this.updateShapeDropdown();
      });
    });
  }

  initCustomStyle() {
    const addStyleBtn = document.getElementById('addCustomStyleBtn');
    if (!addStyleBtn) return;
    
    addStyleBtn.addEventListener('click', () => {
      const newStyle = document.getElementById('customStyleInput').value.trim();
      if (newStyle && !this.customStyles.includes(newStyle)) {
        this.customStyles.push(newStyle);
        this.updateStyleDropdown();
        this.saveSetting('customStyles', this.customStyles);
        document.getElementById('customStyleInput').value = '';
      }
    });
  }

  updateStyleDropdown() {
    const styleSelect = document.getElementById('styleSelect');
    styleSelect.innerHTML = '';
    
    this.customStyles.forEach(style => {
      const option = document.createElement('option');
      option.value = style;
      option.textContent = style.charAt(0).toUpperCase() + style.slice(1);
      styleSelect.appendChild(option);
    });
  }

  initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentPages = document.querySelectorAll('.content-page');
    const pageTitle = document.getElementById('pageTitle');
    
    navItems.forEach(item => {
      item.addEventListener('click', function() {
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        const pageId = this.getAttribute('data-page');
        contentPages.forEach(page => {
          page.classList.remove('active');
          if(page.id === pageId) {
            page.classList.add('active');
            const pageName = this.querySelector('span').textContent;
            pageTitle.textContent = pageName;
            
            if (pageId === 'gallery') {
              this.loadGalleryImages();
            }
          }
        });
      });
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      document.querySelector('.nav-item[data-page="settings"]').classList.add('active');
      contentPages.forEach(page => page.classList.remove('active'));
      document.getElementById('settings').classList.add('active');
      pageTitle.textContent = 'Settings';
    });
  }

  initSearch() {
    const searchInput = document.getElementById('shapeSearchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;
    
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      searchResults.innerHTML = '';
      searchResults.style.display = 'none';
      
      if (query.length < 3) return;
      
      try {
        const response = await this.safeFetch(`https://api.shapes.inc/shapes/public/${query}`);
        if (!response) return;
        
        const data = response;
        this.shapeProfiles[data.username] = data;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
          <div class="result-header">
            <img src="${data.avatar_url}" alt="${data.name}" class="result-avatar">
            <div>
              <div class="result-name">${data.name}</div>
              <div class="result-username">@${data.username}</div>
            </div>
          </div>
          <div class="result-desc">${data.search_description}</div>
          <div class="result-stats">
            <span><i class="fas fa-users"></i> ${data.user_count?.toLocaleString() || 'N/A'}</span>
            <span><i class="fas fa-comment"></i> ${data.message_count?.toLocaleString() || 'N/A'}</span>
          </div>
        `;
        
        resultItem.addEventListener('click', () => {
          if (!this.customShapes.includes(data.username)) {
            this.customShapes.push(data.username);
            this.updateShapeDropdown();
            this.saveSetting('customShapes', this.customShapes);
          }
          
          document.getElementById('shapeSelect').value = data.username;
          searchInput.value = '';
          searchResults.innerHTML = '';
          searchResults.style.display = 'none';
        });
        
        searchResults.appendChild(resultItem);
        searchResults.style.display = 'block';
      } catch (error) {
        searchResults.innerHTML = `<div class="search-result-item error">${error.message}</div>`;
        searchResults.style.display = 'block';
      }
    });
  }

  initApiTest() {
    const testButton = document.getElementById('testApiConnection');
    if (!testButton) return;
    
    testButton.addEventListener('click', async () => {
      this.apiKey = document.getElementById('shapesApiKey').value;
      this.username = document.getElementById('shapesUsername').value;
      
      if (!this.apiKey || !this.username) {
        this.showNotification('API Key and Username required', 'error');
        return;
      }
      
      const apiStatus = document.getElementById('apiStatus');
      apiStatus.className = 'api-status';
      apiStatus.innerHTML = '<i class="fas fa-sync fa-spin"></i> Testing Connection...';
      
      try {
        const response = await this.safeFetch(`https://api.shapes.inc/v1/models`);
        
        if (!response) return;
        
        apiStatus.className = 'api-status connected';
        apiStatus.innerHTML = '<i class="fas fa-check-circle"></i> Connected to Shapes API';
        
        await this.saveSetting('shapesApiKey', this.apiKey);
        await this.saveSetting('shapesUsername', this.username);
        
        this.showNotification('API connection successful!');
        
      } catch (error) {
        apiStatus.className = 'api-status disconnected';
        apiStatus.innerHTML = `<i class="fas fa-times-circle"></i> ${error.message}`;
        this.showNotification('API connection failed', 'error');
      }
    });
  }

  initImageGeneration() {
    const generateBtn = document.getElementById('generateBtn');
    const imageContainer = document.getElementById('imageContainer');
    const generatedImage = document.getElementById('generatedImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const describeBtn = document.getElementById('describeBtn');
    const imageName = document.getElementById('imageName');
    const imageSize = document.getElementById('imageSize');
    
    if (generateBtn) {
      generateBtn.addEventListener('click', async () => {
        const positivePrompt = document.getElementById('positivePrompt').value.trim();
        if (!positivePrompt) {
          this.showNotification('Please enter a positive prompt', 'error');
          return;
        }
        
        const negativePrompt = document.getElementById('negativePrompt').value.trim();
        const shape = document.getElementById('shapeSelect').value;
        const style = document.getElementById('styleSelect').value;
        
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;
        
        try {
          const fullPrompt = `!imagine ${positivePrompt}${negativePrompt ? ` --negative ${negativePrompt}` : ''}`;
          const imageUrl = await this.generateImage(fullPrompt, shape, style);
          
          if (!imageUrl) return;
          
          generatedImage.src = imageUrl;
          generatedImage.style.display = 'block';
          imageContainer.querySelector('.image-placeholder').style.display = 'none';
          this.currentImage = imageUrl;
          
          const savedImage = await this.saveImageToGallery(imageUrl, `shape-${Date.now()}.jpg`, true);
          imageName.textContent = savedImage.name;
          imageSize.textContent = savedImage.size;
          
          this.showNotification('Image generated successfully!');
          
        } catch (error) {
          console.error('Image generation error:', error);
          this.showNotification(error.message || 'Failed to generate image', 'error');
        } finally {
          generateBtn.innerHTML = '<i class="fas fa-sparkles"></i> Generate Image';
          generateBtn.disabled = false;
        }
      });
    }
    
    if (downloadBtn) {
      downloadBtn.addEventListener('click', async () => {
        if (this.currentImage) {
          try {
            const response = await fetch(this.currentImage);
            const blob = await response.blob();
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `assetor-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification('Image downloaded successfully!');
          } catch (error) {
            this.showNotification('Download failed: ' + error.message, 'error');
          }
        } else {
          this.showNotification('No image to download', 'error');
        }
      });
    }
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (generateBtn) generateBtn.click();
      });
    }
    
    if (describeBtn) {
      describeBtn.addEventListener('click', () => {
        if (!this.currentImage) {
          this.showNotification('No image to describe', 'error');
          return;
        }
        this.describeImage(this.currentImage);
      });
    }
  }

  async generateImage(prompt, shape, style) {
    try {
      const response = await this.safeFetch('https://api.shapes.inc/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: `shapesinc/${shape}`,
          messages: [{ role: "user", content: prompt }]
        })
      });
      
      if (!response) return null;
      
      const message = response.choices[0]?.message?.content || '';
      const urlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif))/i;
      const match = message.match(urlRegex);
      const imageUrl = match ? match[0] : null;
      
      if (!imageUrl) throw new Error('No image URL found in response');
      
      return imageUrl;
    } catch (error) {
      throw new Error(`Shapes API error: ${error.message}`);
    }
  }

  async describeImage(imageUrl) {
    try {
      this.showNotification('Describing image...');
      
      const response = await this.safeFetch('https://api.shapes.inc/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: `shapesinc/${this.username}`,
          messages: [
            {
              "role": "user",
              "content": [
                { "type": "text", "text": "Describe this image in detail" },
                { "type": "image_url", "image_url": { "url": imageUrl } }
              ]
            }
          ]
        })
      });
      
      if (!response) return;
      
      const description = response.choices[0]?.message?.content || 'No description available';
      document.getElementById('descriptionResult').textContent = description;
      document.getElementById('descriptionModal').style.display = 'block';
      
    } catch (error) {
      this.showNotification(`Description failed: ${error.message}`, 'error');
    }
  }

  initGallery() {
    const galleryItem = document.querySelector('.nav-item[data-page="gallery"]');
    if (!galleryItem) return;
    
    galleryItem.addEventListener('click', () => {
      this.loadGalleryImages();
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadGalleryImages(btn.textContent.toLowerCase());
      });
    });
  }

  loadGalleryImages(filter = 'all') {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '';
    
    const images = JSON.parse(localStorage.getItem('galleryImages') || '[]');
    
    images.forEach(img => {
      if (filter === 'generated' && !img.isGenerated) return;
      if (filter === 'uploaded' && img.isGenerated) return;
      
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      galleryItem.dataset.id = img.id;
      
      galleryItem.innerHTML = `
        <img src="${img.dataUrl}" alt="${img.name}">
        <div class="overlay">
          ${img.name}
          <div class="gallery-actions">
            <button class="gallery-action view-btn" title="View">
              <i class="fas fa-eye"></i>
            </button>
            <button class="gallery-action edit-btn" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="gallery-action download-btn" title="Download">
              <i class="fas fa-download"></i>
            </button>
            <button class="gallery-action delete-btn" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
      
      galleryGrid.appendChild(galleryItem);
      
      galleryItem.querySelector('.view-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.viewImage(img.dataUrl);
      });
      
      galleryItem.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.editGalleryImage(img);
      });
      
      galleryItem.querySelector('.download-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadImage(img.dataUrl, img.name);
      });
      
      galleryItem.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteGalleryImage(img.id);
      });
    });
  }

  async saveImageToGallery(dataUrl, name, isGenerated = true) {
    return new Promise((resolve) => {
      const images = JSON.parse(localStorage.getItem('galleryImages') || '[]');
      const size = this.calculateImageSize(dataUrl);
      
      const imageData = {
        id: Date.now(),
        name: name,
        dataUrl: dataUrl,
        createdAt: new Date().toISOString(),
        size: size,
        isGenerated: isGenerated
      };
      
      images.push(imageData);
      localStorage.setItem('galleryImages', JSON.stringify(images));
      
      resolve({
        name: name,
        size: size
      });
    });
  }

  calculateImageSize(dataUrl) {
    const sizeInBytes = Math.floor(dataUrl.length * 0.75);
    return (sizeInBytes / (1024 * 1024)).toFixed(1) + 'MB';
  }

  useGalleryImage(dataUrl, name, size) {
    const generatedImage = document.getElementById('generatedImage');
    const imageContainer = document.getElementById('imageContainer');
    const imageName = document.getElementById('imageName');
    const imageSize = document.getElementById('imageSize');
    
    if (!generatedImage || !imageContainer || !imageName || !imageSize) return;
    
    generatedImage.src = dataUrl;
    generatedImage.style.display = 'block';
    imageContainer.querySelector('.image-placeholder').style.display = 'none';
    imageName.textContent = name;
    imageSize.textContent = size;
    this.currentImage = dataUrl;
    
    document.querySelector('.nav-item[data-page="image-generate"]').click();
  }

  viewImage(dataUrl) {
    const viewer = document.getElementById('imageViewer');
    if (!viewer) return;
    
    viewer.src = dataUrl;
    document.getElementById('imageViewerModal').style.display = 'block';
  }
  
  editGalleryImage(img) {
    this.currentImage = img.dataUrl;
    this.useGalleryImage(img.dataUrl, img.name, img.size);
    document.getElementById('adjustBtn').click();
  }
  
  downloadImage(dataUrl, name) {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = name || `assetor-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showNotification('Image downloaded successfully!');
    } catch (error) {
      this.showNotification('Download failed: ' + error.message, 'error');
    }
  }

  deleteGalleryImage(id) {
    if (confirm('Are you sure you want to delete this image?')) {
      const images = JSON.parse(localStorage.getItem('galleryImages') || '[]');
      const updatedImages = images.filter(img => img.id !== id);
      localStorage.setItem('galleryImages', JSON.stringify(updatedImages));
      this.loadGalleryImages();
      this.showNotification('Image deleted successfully');
    }
  }

  initTemplates() {
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
      card.addEventListener('click', () => {
        if (!this.currentImage) {
          this.showNotification('Please select an image first', 'error');
          return;
        }
        
        const aspect = card.dataset.aspect;
        this.openEditor('crop', aspect);
      });
    });
  }

  initUpload() {
    const actualUpload = document.getElementById('actual-upload');
    const uploadArea = document.getElementById('uploadArea');
    const uploadPreview = document.getElementById('uploadPreview');
    const confirmUpload = document.getElementById('confirmUpload');
    
    if (!uploadArea || !confirmUpload) return;
    
    uploadArea.addEventListener('click', () => {
      actualUpload.click();
    });
    
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
      
      if (e.dataTransfer.files.length) {
        actualUpload.files = e.dataTransfer.files;
        this.handleFileUpload(e.dataTransfer.files[0]);
      }
    });
    
    actualUpload.addEventListener('change', (e) => {
      if (e.target.files.length) {
        this.handleFileUpload(e.target.files[0]);
      }
    });
    
    confirmUpload.addEventListener('click', async () => {
      const file = actualUpload.files[0];
      if (!file) return;
      
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const dataUrl = event.target.result;
          const savedImage = await this.saveImageToGallery(dataUrl, file.name, false);
          
          this.showNotification('Image uploaded successfully!');
          this.useGalleryImage(dataUrl, savedImage.name, savedImage.size);
          
          if (uploadPreview) uploadPreview.innerHTML = '';
          actualUpload.value = '';
        };
        reader.readAsDataURL(file);
      } catch (error) {
        this.showNotification('Upload failed: ' + error.message, 'error');
      }
    });
  }

  handleFileUpload(file) {
    if (!file.type.match('image.*')) {
      this.showNotification('Please select an image file', 'error');
      return;
    }
    
    const uploadPreview = document.getElementById('uploadPreview');
    if (!uploadPreview) return;
    
    uploadPreview.innerHTML = '';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'upload-preview-img';
      uploadPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  initAITools() {
    const toolCards = document.querySelectorAll('.tool-card');
    
    toolCards.forEach(card => {
      card.addEventListener('click', () => {
        const tool = card.dataset.tool;
        this.showImageSelectionModal(tool);
      });
    });
  }

  showImageSelectionModal(tool) {
    const modal = document.getElementById('imageSelectionModal');
    const galleryGrid = document.getElementById('selectionGalleryGrid');
    const modalTitle = document.getElementById('selectionModalTitle');
    
    if (!modal || !galleryGrid) return;
    
    if (tool === 'describe') {
        modalTitle.textContent = 'Select Image to Describe';
    } else if (tool === 'variations') {
        modalTitle.textContent = 'Select Image for Variations';
    } else if (tool === 'remove-bg') {
        modalTitle.textContent = 'Select Image to Remove Background';
    } else if (tool === 'upscale') {
        modalTitle.textContent = 'Select Image to Upscale';
    } else if (tool === 'enhance') {
        modalTitle.textContent = 'Select Image to Enhance';
    } else if (tool === 'grayscale') {
        modalTitle.textContent = 'Select Image to Convert to Grayscale';
    }
    
    galleryGrid.innerHTML = '';
    
    const images = JSON.parse(localStorage.getItem('galleryImages') || '[]');
    
    images.forEach(img => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.dataset.id = img.id;
        
        galleryItem.innerHTML = `
            <img src="${img.dataUrl}" alt="${img.name}">
            <div class="overlay">
                ${img.name}
            </div>
        `;
        
        galleryItem.addEventListener('click', () => {
            modal.style.display = 'none';
            
            switch(tool) {
                case 'describe':
                    this.describeImage(img.dataUrl);
                    break;
                case 'variations':
                    this.createVariations(img.dataUrl);
                    break;
                case 'remove-bg':
                    this.removeBackground(img.dataUrl);
                    break;
                case 'upscale':
                    this.upscaleImage(img.dataUrl);
                    break;
                case 'enhance':
                    this.enhanceImage(img.dataUrl);
                    break;
                case 'grayscale':
                    this.convertToGrayscale(img.dataUrl);
                    break;
            }
        });
        
        galleryGrid.appendChild(galleryItem);
    });
    
    modal.style.display = 'block';
  }

  createVariations(dataUrl) {
    this.currentImage = dataUrl;
    const positivePrompt = document.getElementById('positivePrompt').value.trim();
    const negativePrompt = document.getElementById('negativePrompt').value.trim();
    
    if (positivePrompt) {
      const fullPrompt = `!imagine ${positivePrompt}${negativePrompt ? ` --negative ${negativePrompt}` : ''}`;
      document.getElementById('positivePrompt').value = fullPrompt;
      document.getElementById('generateBtn').click();
    } else {
      this.showNotification('Please enter a prompt first', 'error');
    }
  }

  async removeBackground(dataUrl) {
    try {
      this.showNotification('Removing background...');
      
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            
            const whiteDiff = Math.abs(r-255) + Math.abs(g-255) + Math.abs(b-255);
            
            if (whiteDiff < 150) {
              data[i+3] = 0;
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          const newDataUrl = canvas.toDataURL('image/png');
          this.updateCurrentImage(newDataUrl, 'no-bg.png');
          this.showNotification('Background removed successfully!');
          resolve();
        };
      });
      
    } catch (error) {
      this.showNotification('Background removal failed: ' + error.message, 'error');
    }
  }

  async upscaleImage(dataUrl) {
    try {
      this.showNotification('Upscaling image...');
      
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width * 2;
          canvas.height = img.height * 2;
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const newDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          this.updateCurrentImage(newDataUrl, 'upscaled.jpg');
          this.showNotification('Image upscaled successfully!');
          resolve();
        };
      });
      
    } catch (error) {
      this.showNotification('Upscaling failed: ' + error.message, 'error');
    }
  }
  
  async enhanceImage(dataUrl) {
    try {
      this.showNotification('Enhancing image...');
      
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          
          ctx.filter = 'contrast(120%) saturate(120%) brightness(105%)';
          ctx.drawImage(img, 0, 0);
          
          const newDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          this.updateCurrentImage(newDataUrl, 'enhanced.jpg');
          this.showNotification('Image enhanced successfully!');
          resolve();
        };
      });
      
    } catch (error) {
      this.showNotification('Enhancement failed: ' + error.message, 'error');
    }
  }
  
  async convertToGrayscale(dataUrl) {
    try {
      this.showNotification('Converting to grayscale...');
      
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            data[i] = gray;
            data[i+1] = gray;
            data[i+2] = gray;
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          const newDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          this.updateCurrentImage(newDataUrl, 'grayscale.jpg');
          this.showNotification('Converted to grayscale successfully!');
          resolve();
        };
      });
      
    } catch (error) {
      this.showNotification('Conversion failed: ' + error.message, 'error');
    }
  }

  initImageEditor() {
    const modal = document.getElementById('imageEditorModal');
    const closeBtn = document.getElementById('closeEditor');
    const applyBtn = document.getElementById('applyEdit');
    const cancelBtn = document.getElementById('cancelEdit');
    
    if (!modal || !closeBtn || !applyBtn || !cancelBtn) return;
    
    [closeBtn, cancelBtn].forEach(btn => {
      btn.addEventListener('click', () => {
        modal.style.display = 'none';
        this.destroyCropper();
      });
    });
    
    applyBtn.addEventListener('click', async () => {
      try {
        applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
        applyBtn.disabled = true;
        
        if (this.editorMode === 'crop' && this.cropper) {
          const cropData = this.cropper.getData();
          const croppedImage = await this.cropImage(this.currentImage, cropData);
          this.updateCurrentImage(croppedImage, 'cropped.jpg');
        } 
        else if (this.editorMode === 'adjust') {
          const adjustments = {
            brightness: parseInt(document.getElementById('brightnessSlider').value),
            contrast: parseInt(document.getElementById('contrastSlider').value),
            saturation: parseInt(document.getElementById('saturationSlider').value),
            blur: parseFloat(document.getElementById('blurSlider').value),
            hue: parseInt(document.getElementById('hueSlider').value),
            vignette: parseInt(document.getElementById('vignetteSlider').value),
            rotation: this.rotation,
            flipHorizontal: this.flipHorizontal,
            flipVertical: this.flipVertical
          };
          
          const adjustedImage = await this.adjustImage(this.currentImage, adjustments);
          this.updateCurrentImage(adjustedImage, 'adjusted.jpg');
        }
        
        modal.style.display = 'none';
        this.destroyCropper();
        this.showNotification('Changes applied successfully!');
        
      } catch (error) {
        this.showNotification('Failed to apply changes: ' + error.message, 'error');
      } finally {
        applyBtn.innerHTML = 'Apply Changes';
        applyBtn.disabled = false;
      }
    });
    
    ['brightness', 'contrast', 'saturation', 'blur', 'hue', 'vignette'].forEach(adjustment => {
      const slider = document.getElementById(`${adjustment}Slider`);
      const valueDisplay = document.getElementById(`${adjustment}Value`);
      
      if (!slider || !valueDisplay) return;
      
      slider.addEventListener('input', () => {
        if (adjustment === 'blur') {
          valueDisplay.textContent = `${slider.value}px`;
        } else if (adjustment === 'hue') {
          valueDisplay.textContent = `${slider.value}°`;
        } else if (adjustment === 'vignette') {
          valueDisplay.textContent = `${slider.value}%`;
        } else {
          valueDisplay.textContent = `${slider.value}%`;
        }
        this.previewAdjustment();
      });
    });
    
    document.getElementById('resetAdjustments')?.addEventListener('click', () => {
      ['brightness', 'contrast', 'saturation', 'blur', 'hue', 'vignette'].forEach(adj => {
        const slider = document.getElementById(`${adj}Slider`);
        const valueDisplay = document.getElementById(`${adj}Value`);
        if (slider && valueDisplay) {
          slider.value = 0;
          
          if (adj === 'blur') valueDisplay.textContent = '0px';
          else if (adj === 'hue') valueDisplay.textContent = '0°';
          else if (adj === 'vignette') valueDisplay.textContent = '0%';
          else valueDisplay.textContent = '0%';
        }
      });
      this.rotation = 0;
      this.flipHorizontal = false;
      this.flipVertical = false;
      this.previewAdjustment();
    });

    document.getElementById('rotateLeftBtn')?.addEventListener('click', () => {
      this.rotation = (this.rotation - 90) % 360;
      this.previewAdjustment();
    });
    
    document.getElementById('rotateRightBtn')?.addEventListener('click', () => {
      this.rotation = (this.rotation + 90) % 360;
      this.previewAdjustment();
    });
    
    document.getElementById('flipHorizontalBtn')?.addEventListener('click', () => {
      this.flipHorizontal = !this.flipHorizontal;
      this.previewAdjustment();
    });
    
    document.getElementById('flipVerticalBtn')?.addEventListener('click', () => {
      this.flipVertical = !this.flipVertical;
      this.previewAdjustment();
    });
  }
  
  initImageViewer() {
    const viewerModal = document.getElementById('imageViewerModal');
    const closeBtn = document.getElementById('closeViewer');
    
    if (!viewerModal || !closeBtn) return;
    
    closeBtn.addEventListener('click', () => {
      viewerModal.style.display = 'none';
    });
    
    viewerModal.addEventListener('click', (e) => {
      if (e.target === viewerModal) {
        viewerModal.style.display = 'none';
      }
    });
  }
  
  initModalCloseButtons() {
    const closeDescription = document.getElementById('closeDescription');
    const closeDescriptionBtn = document.getElementById('closeDescriptionBtn');
    
    if (closeDescription && closeDescriptionBtn) {
      [closeDescription, closeDescriptionBtn].forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('descriptionModal').style.display = 'none';
        });
      });
    }
    
    const descModal = document.getElementById('descriptionModal');
    if (descModal) {
      descModal.addEventListener('click', (e) => {
        if (e.target === descModal) {
          descModal.style.display = 'none';
        }
      });
    }
    
    const closeSelection = document.getElementById('closeSelection');
    const cancelSelection = document.getElementById('cancelSelection');
    
    if (closeSelection && cancelSelection) {
      [closeSelection, cancelSelection].forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('imageSelectionModal').style.display = 'none';
        });
      });
    }
  }

  async cropImage(imageSrc, cropData) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageSrc;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = cropData.width;
        canvas.height = cropData.height;
        
        ctx.drawImage(
          img,
          cropData.x,
          cropData.y,
          cropData.width,
          cropData.height,
          0,
          0,
          cropData.width,
          cropData.height
        );
        
        resolve(canvas.toDataURL('image/jpeg'));
      };
    });
  }

  async adjustImage(imageSrc, adjustments) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageSrc;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (adjustments.rotation % 180 !== 0) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(adjustments.rotation * Math.PI / 180);
        
        const scaleX = adjustments.flipHorizontal ? -1 : 1;
        const scaleY = adjustments.flipVertical ? -1 : 1;
        ctx.scale(scaleX, scaleY);
        
        ctx.drawImage(
          img, 
          -img.width / 2, 
          -img.height / 2, 
          img.width, 
          img.height
        );
        
        ctx.filter = `
          brightness(${100 + adjustments.brightness}%)
          contrast(${100 + adjustments.contrast}%)
          saturate(${100 + adjustments.saturation}%)
          blur(${adjustments.blur}px)
          hue-rotate(${adjustments.hue}deg)
        `;
        
        if (adjustments.vignette > 0) {
          const vignette = adjustments.vignette / 100;
          ctx.globalCompositeOperation = 'multiply';
          
          const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2
          );
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(1 - vignette, 'transparent');
          gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';
        }
        
        resolve(canvas.toDataURL('image/jpeg'));
      };
    });
  }

  previewAdjustment() {
    if (!this.originalImageData) return;
    
    const adjustments = {
      brightness: parseInt(document.getElementById('brightnessSlider').value),
      contrast: parseInt(document.getElementById('contrastSlider').value),
      saturation: parseInt(document.getElementById('saturationSlider').value),
      blur: parseFloat(document.getElementById('blurSlider').value),
      hue: parseInt(document.getElementById('hueSlider').value),
      vignette: parseInt(document.getElementById('vignetteSlider').value),
      rotation: this.rotation,
      flipHorizontal: this.flipHorizontal,
      flipVertical: this.flipVertical
    };
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
  
      if (adjustments.rotation % 180 !== 0) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(adjustments.rotation * Math.PI / 180);
      
      const scaleX = adjustments.flipHorizontal ? -1 : 1;
      const scaleY = adjustments.flipVertical ? -1 : 1;
      ctx.scale(scaleX, scaleY);
      
      ctx.drawImage(
        img, 
        -img.width / 2, 
        -img.height / 2, 
        img.width, 
        img.height
      );
  
      ctx.filter = `
        brightness(${100 + adjustments.brightness}%)
        contrast(${100 + adjustments.contrast}%)
        saturate(${100 + adjustments.saturation}%)
        blur(${adjustments.blur}px)
        hue-rotate(${adjustments.hue}deg)
      `;
      
      if (adjustments.vignette > 0) {
        const vignette = adjustments.vignette / 100;
        ctx.globalCompositeOperation = 'multiply';
        
        const gradient = ctx.createRadialGradient(
          canvas.width/2, canvas.height/2, 0,
          canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1 - vignette, 'transparent');
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }
      
      document.getElementById('imageToEdit').src = canvas.toDataURL('image/jpeg');
    };
    
    img.src = this.originalImageData;
  }

  openEditor(mode, aspectRatio = null) {
    if (!this.currentImage) {
      this.showNotification('Please select an image first', 'error');
      return;
    }
    
    const modal = document.getElementById('imageEditorModal');
    const editorTitle = document.getElementById('editorTitle');
    const imageToEdit = document.getElementById('imageToEdit');
    const adjustmentControls = document.getElementById('adjustmentControls');
    
    if (!modal || !editorTitle || !imageToEdit || !adjustmentControls) return;
    
    this.editorMode = mode;
    editorTitle.textContent = mode === 'crop' ? 'Crop Image' : 'Adjust Image';
    this.originalImageData = this.currentImage;
    this.rotation = 0;
    this.flipHorizontal = false;
    this.flipVertical = false;
    
    imageToEdit.src = this.currentImage;
    
    if (mode === 'crop') {
      adjustmentControls.classList.add('hidden');
    } else {
      adjustmentControls.classList.remove('hidden');
      ['brightness', 'contrast', 'saturation', 'blur', 'hue', 'vignette'].forEach(adj => {
        const slider = document.getElementById(`${adj}Slider`);
        const valueDisplay = document.getElementById(`${adj}Value`);
        if (slider && valueDisplay) {
          slider.value = 0;
          
          if (adj === 'blur') valueDisplay.textContent = '0px';
          else if (adj === 'hue') valueDisplay.textContent = '0°';
          else if (adj === 'vignette') valueDisplay.textContent = '0%';
          else valueDisplay.textContent = '0%';
        }
      });
    }
    
    modal.style.display = 'block';
    
    imageToEdit.onload = () => {
      if (mode === 'crop') {
        setTimeout(() => {
          const options = {
            viewMode: 1,
            autoCropArea: 0.8,
            movable: true,
            rotatable: true,
            scalable: true,
            zoomable: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            minCanvasWidth: 100,
            minCanvasHeight: 100,
            minCropBoxWidth: 50,
            minCropBoxHeight: 50
          };
          
          if (aspectRatio) {
            const [width, height] = aspectRatio.split(':').map(Number);
            options.aspectRatio = width / height;
          }
          
          this.cropper = new Cropper(imageToEdit, options);
        }, 100);
      }
    };
  }

  destroyCropper() {
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
  }

  updateCurrentImage(dataUrl, name = 'edited.jpg') {
    const generatedImage = document.getElementById('generatedImage');
    if (!generatedImage) return;
    
    generatedImage.src = dataUrl;
    this.currentImage = dataUrl;
    
    document.getElementById('imageName').textContent = name;
    document.getElementById('imageSize').textContent = this.calculateImageSize(dataUrl);
    
    this.saveImageToGallery(dataUrl, name);
  }

  initSettings() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('change', () => {
        this.saveSetting('darkMode', darkModeToggle.checked);
      });
    }
    
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', () => {
        const color = option.dataset.color;
        this.applyAccentColor(color);
      });
    });
    
    const customColorPicker = document.getElementById('customColorPicker');
    if (customColorPicker) {
      customColorPicker.addEventListener('input', (e) => {
        this.applyAccentColor(e.target.value);
      });
    }
    
    document.getElementById('addShapeBtn').addEventListener('click', () => {
      const newShape = document.getElementById('newShapeInput').value.trim();
      if (newShape && !this.customShapes.includes(newShape)) {
        this.customShapes.push(newShape);
        this.updateShapeDropdown();
        this.saveSetting('customShapes', this.customShapes);
        document.getElementById('newShapeInput').value = '';
        this.showNotification(`Shape "${newShape}" added`);
      }
    });
    
    document.getElementById('saveThemeBtn').addEventListener('click', () => {
      const accentColor = document.documentElement.style.getPropertyValue('--primary');
      const fontFamily = document.getElementById('fontSelect').value;
      
      this.saveSetting('accentColor', accentColor);
      this.saveSetting('fontFamily', fontFamily);
      
      document.body.style.fontFamily = fontFamily;
      this.showNotification('Theme saved successfully!');
    });
    
    this.loadSettings();
  }

  async loadSettings() {
    const settings = await window.electronAPI.getSettings();
    
    if (settings.shapesApiKey && document.getElementById('shapesApiKey')) {
      document.getElementById('shapesApiKey').value = settings.shapesApiKey;
    }
    
    if (settings.shapesUsername && document.getElementById('shapesUsername')) {
      document.getElementById('shapesUsername').value = settings.shapesUsername;
    }
    
    if (settings.customShapes) {
      this.customShapes = settings.customShapes;
      this.updateShapeDropdown();
    }
    
    if (settings.customStyles) {
      this.customStyles = settings.customStyles;
      this.updateStyleDropdown();
    }
    
    if (settings.darkMode && document.getElementById('darkModeToggle')) {
      document.getElementById('darkModeToggle').checked = settings.darkMode;
    }
    
    if (settings.accentColor) {
      this.applyAccentColor(settings.accentColor);
    }
    
    if (settings.fontFamily && document.getElementById('fontSelect')) {
      document.getElementById('fontSelect').value = settings.fontFamily;
      document.body.style.fontFamily = settings.fontFamily;
    }
  }

  async saveSetting(key, value) {
    const settings = await window.electronAPI.getSettings();
    settings[key] = value;
    await window.electronAPI.saveSettings(settings);
    
    if (key === 'accentColor') {
      this.applyAccentColor(value);
    }
    if (key === 'fontFamily') {
      document.body.style.fontFamily = value;
    }
  }

  showNotification(message, type = 'success') {
    document.querySelectorAll('.toast').forEach(el => el.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AssetorApp();
});