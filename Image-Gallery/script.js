// Sample images data
let images = JSON.parse(localStorage.getItem('gallery_images')) || [
    {
        id: 1,
        title: 'Mountain Sunset',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        category: 'nature',
        tags: ['sunset', 'mountain', 'landscape'],
        favorite: false,
        uploadDate: new Date('2024-01-15').toISOString()
    },
    {
        id: 2,
        title: 'Modern Architecture',
        url: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800',
        category: 'architecture',
        tags: ['building', 'modern', 'city'],
        favorite: false,
        uploadDate: new Date('2024-01-16').toISOString()
    },
    {
        id: 3,
        title: 'Happy People',
        url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
        category: 'people',
        tags: ['friends', 'happy', 'group'],
        favorite: false,
        uploadDate: new Date('2024-01-17').toISOString()
    },
    {
        id: 4,
        title: 'Cute Cat',
        url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
        category: 'animals',
        tags: ['cat', 'pet', 'cute'],
        favorite: false,
        uploadDate: new Date('2024-01-18').toISOString()
    },
    {
        id: 5,
        title: 'Delicious Food',
        url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
        category: 'food',
        tags: ['food', 'meal', 'delicious'],
        favorite: false,
        uploadDate: new Date('2024-01-19').toISOString()
    },
    {
        id: 6,
        title: 'Latest Technology',
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
        category: 'technology',
        tags: ['tech', 'gadget', 'modern'],
        favorite: false,
        uploadDate: new Date('2024-01-20').toISOString()
    }
];

let currentFilter = 'all';
let currentView = 'grid';
let currentImageIndex = 0;
let pendingFiles = [];
let selectedCategory = '';

// Initialize
window.addEventListener('load', () => {
    renderGallery();
    updateStats();
});

// Handle file upload
function handleFileUpload(event) {
    const files = event.target.files;
    pendingFiles = Array.from(files);
    
    // Show category selection modal
    document.getElementById('categoryModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Select upload category
function selectUploadCategory(category) {
    let processedCount = 0;
    const totalFiles = pendingFiles.length;
    
    pendingFiles.forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const newImage = {
                id: Date.now() + Math.random(),
                title: file.name.split('.')[0],
                url: e.target.result,
                category: category,
                tags: [category, 'uploaded'],
                favorite: false,
                uploadDate: new Date().toISOString()
            };
            
            images.unshift(newImage);
            processedCount++;
            
            if (processedCount === totalFiles) {
                saveImages();
                renderGallery();
                updateStats();
            }
        };
        
        reader.readAsDataURL(file);
    });
    
    // Close modal
    document.getElementById('categoryModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    pendingFiles = [];
    
    // Reset file input
    document.getElementById('fileInput').value = '';
}

// Cancel upload
function cancelUpload() {
    document.getElementById('categoryModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    pendingFiles = [];
    selectedCategory = '';
    document.getElementById('fileInput').value = '';
}

// Save to localStorage
function saveImages() {
    localStorage.setItem('gallery_images', JSON.stringify(images));
}

// Filter gallery
function filterGallery() {
    renderGallery();
}

// Filter by category
function filterByCategory(category) {
    currentFilter = category;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    renderGallery();
}

// Set view mode
function setView(view) {
    currentView = view;
    
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.view-btn').classList.add('active');
    
    const grid = document.getElementById('galleryGrid');
    grid.classList.toggle('list-view', view === 'list');
}

// Sort gallery
function sortGallery() {
    const sortBy = document.getElementById('sortSelect').value;
    
    switch(sortBy) {
        case 'newest':
            images.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
            break;
        case 'oldest':
            images.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
            break;
        case 'name':
            images.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'favorites':
            images.sort((a, b) => b.favorite - a.favorite);
            break;
    }
    
    renderGallery();
}

// Render gallery
function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    const emptyState = document.getElementById('emptyState');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredImages = images;
    
    // Apply category filter
    if (currentFilter !== 'all') {
        filteredImages = filteredImages.filter(img => img.category === currentFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredImages = filteredImages.filter(img => 
            img.title.toLowerCase().includes(searchTerm) ||
            img.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    // Update filtered count
    document.getElementById('filteredImages').textContent = filteredImages.length;
    
    if (filteredImages.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.add('active');
        return;
    }
    
    emptyState.classList.remove('active');
    
    grid.innerHTML = filteredImages.map(img => `
        <div class="gallery-item" onclick="openLightbox(${images.indexOf(img)})">
            <img src="${img.url}" alt="${img.title}" loading="lazy">
            <div class="gallery-overlay">
                <div class="gallery-title">${img.title}</div>
                <div class="gallery-meta">
                    <span>${img.category}</span>
                    <span class="favorite-icon">${img.favorite ? '⭐' : '☆'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Open lightbox
function openLightbox(index) {
    currentImageIndex = index;
    const img = images[index];
    
    document.getElementById('lightbox').classList.add('active');
    document.getElementById('lightboxImage').src = img.url;
    document.getElementById('lightboxTitle').textContent = img.title;
    document.getElementById('lightboxCategory').textContent = `📁 ${img.category}`;
    document.getElementById('lightboxDate').textContent = `📅 ${new Date(img.uploadDate).toLocaleDateString()}`;
    document.getElementById('lightboxFavorite').textContent = img.favorite ? '⭐' : '☆';
    
    // Render tags
    const tagsContainer = document.getElementById('lightboxTags');
    tagsContainer.innerHTML = img.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
    
    document.body.style.overflow = 'hidden';
}

// Close lightbox
function closeLightbox(event) {
    if (event && event.target.id !== 'lightbox') return;
    
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Navigate images in lightbox
function navigateImage(direction) {
    currentImageIndex += direction;
    
    if (currentImageIndex < 0) currentImageIndex = images.length - 1;
    if (currentImageIndex >= images.length) currentImageIndex = 0;
    
    openLightbox(currentImageIndex);
}

// Toggle favorite
function toggleFavorite() {
    const img = images[currentImageIndex];
    img.favorite = !img.favorite;
    
    document.getElementById('lightboxFavorite').textContent = img.favorite ? '⭐' : '☆';
    
    saveImages();
    renderGallery();
    updateStats();
}

// Download image
function downloadImage() {
    const img = images[currentImageIndex];
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `${img.title}.jpg`;
    link.click();
}

// Delete image
function deleteImage() {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    images.splice(currentImageIndex, 1);
    saveImages();
    closeLightbox();
    renderGallery();
    updateStats();
}

// Update stats
function updateStats() {
    document.getElementById('totalImages').textContent = images.length;
    document.getElementById('filteredImages').textContent = images.length;
    document.getElementById('favoriteCount').textContent = images.filter(img => img.favorite).length;
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!document.getElementById('lightbox').classList.contains('active')) return;
    
    if (e.key === 'ArrowLeft') navigateImage(-1);
    if (e.key === 'ArrowRight') navigateImage(1);
    if (e.key === 'Escape') closeLightbox();
});
