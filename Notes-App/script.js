// Notes storage
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let currentNoteId = null;
let currentFilter = 'all';
let autoSaveTimer = null;

// Initialize app
window.addEventListener('load', () => {
    renderNotesList();
    updateStats();
    
    // Auto-save on content change
    document.getElementById('editor').addEventListener('input', () => {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(autoSave, 1000);
        updateWordCount();
    });
    
    document.getElementById('noteTitle').addEventListener('input', () => {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(autoSave, 1000);
    });
});

// Create new note
function createNewNote() {
    const note = {
        id: Date.now(),
        title: 'Untitled Note',
        content: '',
        tags: [],
        color: '#fff',
        favorite: false,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    notes.unshift(note);
    saveNotes();
    openNote(note.id);
    renderNotesList();
    updateStats();
}

// Open note
function openNote(noteId) {
    currentNoteId = noteId;
    const note = notes.find(n => n.id === noteId);
    
    if (!note) return;
    
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('editor').innerHTML = note.content;
    document.getElementById('favoriteIcon').textContent = note.favorite ? '⭐' : '☆';
    
    // Set note color
    document.querySelector('.main-editor').style.background = note.color;
    
    // Render tags
    renderTags(note.tags);
    
    // Update UI
    document.getElementById('emptyState').classList.add('hidden');
    document.querySelector('.main-editor').classList.add('active');
    
    // Update active state in list
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id == noteId);
    });
    
    updateWordCount();
    updateLastSaved();
}

// Auto-save
function autoSave() {
    if (!currentNoteId) return;
    
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;
    
    note.title = document.getElementById('noteTitle').value || 'Untitled Note';
    note.content = document.getElementById('editor').innerHTML;
    note.updatedAt = new Date().toISOString();
    
    saveNotes();
    renderNotesList();
    updateLastSaved();
}

// Save to localStorage
function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Render notes list
function renderNotesList() {
    const container = document.getElementById('notesList');
    let filteredNotes = notes;
    
    // Apply filter
    if (currentFilter === 'favorites') {
        filteredNotes = notes.filter(n => n.favorite && !n.archived);
    } else if (currentFilter === 'archived') {
        filteredNotes = notes.filter(n => n.archived);
    } else {
        filteredNotes = notes.filter(n => !n.archived);
    }
    
    // Apply search
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredNotes = filteredNotes.filter(n => 
            n.title.toLowerCase().includes(searchTerm) ||
            n.content.toLowerCase().includes(searchTerm) ||
            n.tags.some(t => t.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filteredNotes.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No notes found</p>';
        return;
    }
    
    container.innerHTML = filteredNotes.map(note => {
        const preview = note.content.replace(/<[^>]*>/g, '').substring(0, 60);
        const date = new Date(note.updatedAt).toLocaleDateString();
        
        return `
            <div class="note-item ${note.id === currentNoteId ? 'active' : ''}" 
                 style="background:${note.color}" 
                 data-id="${note.id}" 
                 onclick="openNote(${note.id})">
                <div class="note-item-title">${note.title}</div>
                <div class="note-item-preview">${preview}...</div>
                <div class="note-item-meta">
                    <span>${date}</span>
                    <span>${note.favorite ? '⭐' : ''}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Search notes
function searchNotes() {
    renderNotesList();
}

// Filter notes
function filterNotes(filter) {
    currentFilter = filter;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    renderNotesList();
}

// Rich text formatting
function formatText(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('editor').focus();
}

// Toggle favorite
function toggleFavorite() {
    if (!currentNoteId) return;
    
    const note = notes.find(n => n.id === currentNoteId);
    note.favorite = !note.favorite;
    
    document.getElementById('favoriteIcon').textContent = note.favorite ? '⭐' : '☆';
    saveNotes();
    renderNotesList();
}

// Toggle archive
function toggleArchive() {
    if (!currentNoteId) return;
    
    const note = notes.find(n => n.id === currentNoteId);
    note.archived = !note.archived;
    
    saveNotes();
    renderNotesList();
    
    if (note.archived) {
        document.getElementById('emptyState').classList.remove('hidden');
        document.querySelector('.main-editor').classList.remove('active');
        currentNoteId = null;
    }
}

// Delete note
function deleteNote() {
    if (!currentNoteId) return;
    
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    notes = notes.filter(n => n.id !== currentNoteId);
    saveNotes();
    renderNotesList();
    updateStats();
    
    document.getElementById('emptyState').classList.remove('hidden');
    document.querySelector('.main-editor').classList.remove('active');
    currentNoteId = null;
}

// Export note
function exportNote() {
    if (!currentNoteId) return;
    
    const note = notes.find(n => n.id === currentNoteId);
    const content = `${note.title}\n\n${note.content.replace(/<[^>]*>/g, '')}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Tags
function addTag(event) {
    if (event.key !== 'Enter' || !currentNoteId) return;
    
    const input = document.getElementById('tagInput');
    const tag = input.value.trim();
    
    if (!tag) return;
    
    const note = notes.find(n => n.id === currentNoteId);
    if (!note.tags.includes(tag)) {
        note.tags.push(tag);
        saveNotes();
        renderTags(note.tags);
    }
    
    input.value = '';
}

function renderTags(tags) {
    const container = document.getElementById('tagsList');
    container.innerHTML = tags.map(tag => `
        <span class="tag">
            ${tag}
            <span class="tag-remove" onclick="removeTag('${tag}')">×</span>
        </span>
    `).join('');
}

function removeTag(tag) {
    if (!currentNoteId) return;
    
    const note = notes.find(n => n.id === currentNoteId);
    note.tags = note.tags.filter(t => t !== tag);
    saveNotes();
    renderTags(note.tags);
}

// Set note color
function setNoteColor(color) {
    if (!currentNoteId) return;
    
    const note = notes.find(n => n.id === currentNoteId);
    note.color = color;
    
    document.querySelector('.main-editor').style.background = color;
    saveNotes();
    renderNotesList();
}

// Update word count
function updateWordCount() {
    const content = document.getElementById('editor').innerText;
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    document.getElementById('wordCount').textContent = `${words} words`;
}

// Update last saved
function updateLastSaved() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastSaved').textContent = `Saved at ${time}`;
}

// Update stats
function updateStats() {
    const activeNotes = notes.filter(n => !n.archived).length;
    document.getElementById('noteCount').textContent = `${activeNotes} note${activeNotes !== 1 ? 's' : ''}`;
}
