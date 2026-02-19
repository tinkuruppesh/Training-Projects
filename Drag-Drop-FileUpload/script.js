// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

// State
let uploadQueue = [];
let uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || [];

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadQueueEl = document.getElementById('uploadQueue');
const message = document.getElementById('message');
const actions = document.getElementById('actions');
const uploadBtn = document.getElementById('uploadBtn');
const clearBtn = document.getElementById('clearBtn');
const gallery = document.getElementById('gallery');
const gallerySection = document.getElementById('gallerySection');
const deleteAllBtn = document.getElementById('deleteAllBtn');

// Initialize
function init() {
  // Drag and drop events
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  dropZone.addEventListener('click', () => fileInput.click());
  
  // File input
  fileInput.addEventListener('change', handleFileSelect);
  
  // Buttons
  uploadBtn.addEventListener('click', uploadAllFiles);
  clearBtn.addEventListener('click', clearQueue);
  deleteAllBtn.addEventListener('click', deleteAllFiles);
  
  // Load gallery
  renderGallery();
  updateStats();
}

// Drag handlers
function handleDragOver(e) {
  e.preventDefault();
  dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
}

function handleFileSelect(e) {
  handleFiles(e.target.files);
}

// Process files
function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (validateFile(file)) {
      uploadQueue.push({
        id: Date.now() + Math.random(),
        file: file,
        progress: 0,
        status: 'pending'
      });
    }
  });
  
  renderQueue();
  fileInput.value = '';
}

// Validate file
function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    showMessage(`"${file.name}" is too large. Max 5MB.`, 'error');
    return false;
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    showMessage(`"${file.name}" type not allowed.`, 'error');
    return false;
  }
  
  return true;
}

// Render upload queue
function renderQueue() {
  if (uploadQueue.length === 0) {
    uploadQueueEl.innerHTML = '';
    actions.style.display = 'none';
    return;
  }
  
  actions.style.display = 'flex';
  
  uploadQueueEl.innerHTML = uploadQueue.map(item => `
    <div class="queue-item" id="queue-${item.id}">
      <div class="queue-header">
        <div class="queue-info">
          <span class="queue-icon">${getFileIcon(item.file.type)}</span>
          <div class="queue-details">
            <h4>${item.file.name}</h4>
            <p>${formatFileSize(item.file.size)}</p>
          </div>
        </div>
        <button class="queue-remove" onclick="removeFromQueue(${item.id})">Remove</button>
      </div>
      ${item.status === 'uploading' ? `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${item.progress}%"></div>
        </div>
        <div class="progress-text">${item.progress}%</div>
      ` : ''}
    </div>
  `).join('');
}

// Remove from queue
function removeFromQueue(id) {
  uploadQueue = uploadQueue.filter(item => item.id !== id);
  renderQueue();
}

// Clear queue
function clearQueue() {
  uploadQueue = [];
  renderQueue();
  showMessage('Queue cleared', 'error');
}

// Upload all files (simulated)
function uploadAllFiles() {
  if (uploadQueue.length === 0) return;
  
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';
  
  uploadQueue.forEach((item, index) => {
    setTimeout(() => {
      simulateUpload(item);
    }, index * 500);
  });
}

// Simulate file upload with progress
function simulateUpload(item) {
  item.status = 'uploading';
  let progress = 0;
  
  const interval = setInterval(() => {
    progress += 10;
    item.progress = progress;
    renderQueue();
    
    if (progress >= 100) {
      clearInterval(interval);
      item.status = 'completed';
      
      // Add to uploaded files
      uploadedFiles.push({
        id: item.id,
        name: item.file.name,
        size: item.file.size,
        type: item.file.type,
        url: URL.createObjectURL(item.file),
        uploadDate: new Date().toLocaleString()
      });
      
      // Save to localStorage
      localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
      
      // Remove from queue
      uploadQueue = uploadQueue.filter(q => q.id !== item.id);
      renderQueue();
      renderGallery();
      updateStats();
      
      if (uploadQueue.length === 0) {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload All Files';
        showMessage('All files uploaded successfully!', 'success');
      }
    }
  }, 100);
}

// Render gallery
function renderGallery() {
  if (uploadedFiles.length === 0) {
    gallerySection.style.display = 'none';
    return;
  }
  
  gallerySection.style.display = 'block';
  
  gallery.innerHTML = uploadedFiles.map(file => {
    const isImage = file.type.startsWith('image/');
    
    return `
      <div class="gallery-item">
        <div class="gallery-preview">
          ${isImage ? 
            `<img src="${file.url}" alt="${file.name}">` : 
            `<span class="file-icon">${getFileIcon(file.type)}</span>`
          }
        </div>
        <div class="gallery-info">
          <div class="gallery-name" title="${file.name}">${file.name}</div>
          <div class="gallery-meta">
            <span>${formatFileSize(file.size)}</span>
            <span>${file.uploadDate.split(',')[0]}</span>
          </div>
          <div class="gallery-actions">
            <button class="gallery-btn view" onclick="viewFile(${file.id})">View</button>
            <button class="gallery-btn delete" onclick="deleteFile(${file.id})">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// View file
function viewFile(id) {
  const file = uploadedFiles.find(f => f.id === id);
  if (file) {
    window.open(file.url, '_blank');
  }
}

// Delete file
function deleteFile(id) {
  if (confirm('Delete this file?')) {
    uploadedFiles = uploadedFiles.filter(f => f.id !== id);
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
    renderGallery();
    updateStats();
    showMessage('File deleted', 'error');
  }
}

// Delete all files
function deleteAllFiles() {
  if (confirm('Delete all uploaded files?')) {
    uploadedFiles = [];
    localStorage.removeItem('uploadedFiles');
    renderGallery();
    updateStats();
    showMessage('All files deleted', 'error');
  }
}

// Update stats
function updateStats() {
  const totalFiles = uploadedFiles.length;
  const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
  
  document.getElementById('totalFiles').textContent = totalFiles;
  document.getElementById('totalSize').textContent = (totalSize / (1024 * 1024)).toFixed(2);
}

// Get file icon
function getFileIcon(type) {
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📄';
  if (type.includes('word')) return '📝';
  if (type === 'text/plain') return '📃';
  return '📁';
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Show message
function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
  setTimeout(() => {
    message.className = 'message';
  }, 3000);
}

// Initialize
init();
