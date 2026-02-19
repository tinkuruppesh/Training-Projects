let boards = JSON.parse(localStorage.getItem('kanban_boards')) || {
    columns: [
        { id: 'todo', title: 'To Do', cards: [] },
        { id: 'inprogress', title: 'In Progress', cards: [] },
        { id: 'review', title: 'Review', cards: [] },
        { id: 'done', title: 'Done', cards: [] }
    ]
};

let currentCard = null;
let draggedCard = null;
let filters = { priorities: [], search: '' };

// Initialize
window.addEventListener('load', () => {
    renderBoard();
    loadTheme();
    loadBoardTitle();
});

function renderBoard() {
    const wrapper = document.getElementById('columnsWrapper');
    wrapper.innerHTML = boards.columns.map(column => `
        <div class="column" data-column-id="${column.id}">
            <div class="column-header">
                <div class="column-title">
                    ${column.title}
                    <span class="card-count">${column.cards.length}</span>
                </div>
                <div class="column-actions">
                    <button class="icon-btn" onclick="deleteColumn('${column.id}')" title="Delete Column">🗑️</button>
                </div>
            </div>
            <div class="cards-container" ondrop="drop(event, '${column.id}')" ondragover="allowDrop(event)">
                ${renderCards(column.cards, column.id)}
            </div>
            <button class="add-card-btn" onclick="showAddCardModal('${column.id}')">+ Add Card</button>
        </div>
    `).join('');
}

function renderCards(cards, columnId) {
    const filteredCards = cards.filter(card => {
        const matchesPriority = filters.priorities.length === 0 || filters.priorities.includes(card.priority);
        const matchesSearch = !filters.search || 
            card.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            (card.description && card.description.toLowerCase().includes(filters.search.toLowerCase()));
        return matchesPriority && matchesSearch;
    });

    return filteredCards.map(card => {
        const checklistProgress = card.checklist ? 
            card.checklist.filter(item => item.completed).length / card.checklist.length * 100 : 0;
        const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
        
        return `
            <div class="card" draggable="true" ondragstart="drag(event, '${columnId}', '${card.id}')" onclick="editCard('${columnId}', '${card.id}')">
                <div class="card-header">
                    <div class="card-title">${card.title}</div>
                    <span class="priority-badge priority-${card.priority}">${getPriorityIcon(card.priority)}</span>
                </div>
                ${card.description ? `<div class="card-description">${card.description}</div>` : ''}
                ${card.tags && card.tags.length > 0 ? `
                    <div class="card-tags">
                        ${card.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="card-footer">
                    <div>
                        ${card.dueDate ? `<div class="due-date ${isOverdue ? 'overdue' : ''}">📅 ${formatDate(card.dueDate)}</div>` : ''}
                        ${card.assignee ? `<div class="assignee">${card.assignee}</div>` : ''}
                    </div>
                    ${card.checklist && card.checklist.length > 0 ? `
                        <div class="checklist-progress">
                            <span>✓ ${card.checklist.filter(i => i.completed).length}/${card.checklist.length}</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${checklistProgress}%"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getPriorityIcon(priority) {
    const icons = { low: '🟢', medium: '🟡', high: '🔴' };
    return icons[priority] || '⚪';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event, columnId, cardId) {
    draggedCard = { columnId, cardId };
    event.target.classList.add('dragging');
}

function drop(event, targetColumnId) {
    event.preventDefault();
    
    if (!draggedCard) return;
    
    const sourceColumn = boards.columns.find(col => col.id === draggedCard.columnId);
    const targetColumn = boards.columns.find(col => col.id === targetColumnId);
    const cardIndex = sourceColumn.cards.findIndex(card => card.id === draggedCard.cardId);
    
    if (cardIndex > -1) {
        const [card] = sourceColumn.cards.splice(cardIndex, 1);
        targetColumn.cards.push(card);
        saveBoards();
        renderBoard();
    }
    
    draggedCard = null;
    document.querySelectorAll('.card').forEach(card => card.classList.remove('dragging'));
}

function showAddCardModal(columnId) {
    currentCard = { columnId, isNew: true };
    document.getElementById('cardModal').classList.add('active');
    resetCardForm();
}

function editCard(columnId, cardId) {
    const column = boards.columns.find(col => col.id === columnId);
    const card = column.cards.find(c => c.id === cardId);
    
    currentCard = { columnId, cardId, isNew: false };
    
    document.getElementById('cardTitle').value = card.title;
    document.getElementById('cardDescription').value = card.description || '';
    document.getElementById('cardPriority').value = card.priority;
    document.getElementById('cardDueDate').value = card.dueDate || '';
    document.getElementById('cardAssignee').value = card.assignee || '';
    
    const tagsContainer = document.getElementById('selectedTags');
    tagsContainer.innerHTML = (card.tags || []).map(tag => `
        <span class="tag-item">${tag} <span class="tag-remove" onclick="removeTag('${tag}')">×</span></span>
    `).join('');
    
    const checklistContainer = document.getElementById('checklistItems');
    checklistContainer.innerHTML = (card.checklist || []).map((item, index) => `
        <div class="checklist-item ${item.completed ? 'completed' : ''}">
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleChecklistItem(${index})">
            <input type="text" value="${item.text}" onchange="updateChecklistItem(${index}, this.value)">
            <button class="icon-btn" onclick="removeChecklistItem(${index})">🗑️</button>
        </div>
    `).join('');
    
    document.getElementById('cardModal').classList.add('active');
}

function resetCardForm() {
    document.getElementById('cardTitle').value = '';
    document.getElementById('cardDescription').value = '';
    document.getElementById('cardPriority').value = 'low';
    document.getElementById('cardDueDate').value = '';
    document.getElementById('cardAssignee').value = '';
    document.getElementById('selectedTags').innerHTML = '';
    document.getElementById('checklistItems').innerHTML = '';
}

function saveCard() {
    const title = document.getElementById('cardTitle').value.trim();
    if (!title) return alert('Please enter a card title');
    
    const column = boards.columns.find(col => col.id === currentCard.columnId);
    
    const tags = Array.from(document.querySelectorAll('.tag-item')).map(tag => 
        tag.textContent.replace('×', '').trim()
    );
    
    const checklist = Array.from(document.querySelectorAll('.checklist-item')).map(item => ({
        text: item.querySelector('input[type="text"]').value,
        completed: item.querySelector('input[type="checkbox"]').checked
    }));
    
    const cardData = {
        id: currentCard.isNew ? Date.now().toString() : currentCard.cardId,
        title,
        description: document.getElementById('cardDescription').value.trim(),
        priority: document.getElementById('cardPriority').value,
        dueDate: document.getElementById('cardDueDate').value,
        assignee: document.getElementById('cardAssignee').value.trim(),
        tags,
        checklist,
        createdAt: currentCard.isNew ? new Date().toISOString() : 
            column.cards.find(c => c.id === currentCard.cardId).createdAt
    };
    
    if (currentCard.isNew) {
        column.cards.push(cardData);
    } else {
        const index = column.cards.findIndex(c => c.id === currentCard.cardId);
        column.cards[index] = cardData;
    }
    
    saveBoards();
    renderBoard();
    closeCardModal();
}

function handleTagInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const tag = input.value.trim();
        
        if (tag) {
            const tagsContainer = document.getElementById('selectedTags');
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-item';
            tagElement.innerHTML = `${tag} <span class="tag-remove" onclick="this.parentElement.remove()">×</span>`;
            tagsContainer.appendChild(tagElement);
            input.value = '';
        }
    }
}

function addChecklistItem() {
    const container = document.getElementById('checklistItems');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'checklist-item';
    div.innerHTML = `
        <input type="checkbox" onchange="this.parentElement.classList.toggle('completed')">
        <input type="text" placeholder="Checklist item...">
        <button class="icon-btn" onclick="this.parentElement.remove()">🗑️</button>
    `;
    container.appendChild(div);
}

function closeCardModal() {
    document.getElementById('cardModal').classList.remove('active');
    currentCard = null;
}

function showAddColumnModal() {
    document.getElementById('columnModal').classList.add('active');
    document.getElementById('columnName').value = '';
}

function addColumn() {
    const name = document.getElementById('columnName').value.trim();
    if (!name) return alert('Please enter a column name');
    
    boards.columns.push({
        id: Date.now().toString(),
        title: name,
        cards: []
    });
    
    saveBoards();
    renderBoard();
    closeColumnModal();
}

function deleteColumn(columnId) {
    if (!confirm('Delete this column and all its cards?')) return;
    
    boards.columns = boards.columns.filter(col => col.id !== columnId);
    saveBoards();
    renderBoard();
}

function closeColumnModal() {
    document.getElementById('columnModal').classList.remove('active');
}

function showStats() {
    const panel = document.getElementById('statsPanel');
    panel.classList.add('active');
    
    const totalCards = boards.columns.reduce((sum, col) => sum + col.cards.length, 0);
    const completedCards = boards.columns.find(col => col.id === 'done')?.cards.length || 0;
    const highPriority = boards.columns.reduce((sum, col) => 
        sum + col.cards.filter(card => card.priority === 'high').length, 0);
    const overdue = boards.columns.reduce((sum, col) => 
        sum + col.cards.filter(card => card.dueDate && new Date(card.dueDate) < new Date()).length, 0);
    
    document.getElementById('statsContent').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalCards}</div>
            <div class="stat-label">Total Tasks</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${completedCards}</div>
            <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${highPriority}</div>
            <div class="stat-label">High Priority</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${overdue}</div>
            <div class="stat-label">Overdue</div>
        </div>
    `;
}

function closeStats() {
    document.getElementById('statsPanel').classList.remove('active');
}

function showFilters() {
    document.getElementById('filterPanel').classList.add('active');
}

function closeFilters() {
    document.getElementById('filterPanel').classList.remove('active');
}

function applyFilters() {
    const checkboxes = document.querySelectorAll('#filterPanel input[type="checkbox"]:checked');
    filters.priorities = Array.from(checkboxes).map(cb => cb.value);
    filters.search = document.getElementById('searchFilter').value.trim();
    renderBoard();
}

function clearFilters() {
    document.querySelectorAll('#filterPanel input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('searchFilter').value = '';
    filters = { priorities: [], search: '' };
    renderBoard();
}

function exportBoard() {
    const data = JSON.stringify(boards, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban-board-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function saveBoardTitle() {
    const title = document.getElementById('boardTitle').value;
    localStorage.setItem('boardTitle', title);
}

function loadBoardTitle() {
    const title = localStorage.getItem('boardTitle');
    if (title) {
        document.getElementById('boardTitle').value = title;
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    }
}

function saveBoards() {
    localStorage.setItem('kanban_boards', JSON.stringify(boards));
}

// Close modals on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCardModal();
        closeColumnModal();
        closeStats();
        closeFilters();
    }
});

// Prevent drag image
document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('card')) {
        e.dataTransfer.effectAllowed = 'move';
    }
});
