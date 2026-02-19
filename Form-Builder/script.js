let formFields = [];
let selectedFieldId = null;
let draggedType = null;

const validationRules = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    tel: /^[\d\s\-\+\(\)]+$/,
    url: /^https?:\/\/.+/
};

// Initialize
window.addEventListener('load', () => {
    initDragDrop();
    loadTheme();
    updateFieldCount();
});

function initDragDrop() {
    const fieldItems = document.querySelectorAll('.field-item');
    const canvas = document.getElementById('formCanvas');
    
    fieldItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedType = e.target.closest('.field-item').dataset.type;
            e.dataTransfer.effectAllowed = 'copy';
        });
    });
    
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        
        if (draggedType) {
            addField(draggedType);
            draggedType = null;
        }
    });
}

function addFieldByClick(type) {
    addField(type);
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} field added!`);
}

function searchFields() {
    const query = document.getElementById('fieldSearch').value.toLowerCase();
    const items = document.querySelectorAll('.field-item');
    
    items.forEach(item => {
        const name = item.querySelector('.field-name').textContent.toLowerCase();
        const desc = item.querySelector('.field-desc').textContent.toLowerCase();
        
        if (name.includes(query) || desc.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function toggleFieldsPanel() {
    const panel = document.querySelector('.fields-panel');
    panel.classList.toggle('collapsed');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #2563eb;
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        animation: slideInRight 0.3s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function addField(type) {
    const field = {
        id: Date.now().toString(),
        type: type,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
        placeholder: `Enter ${type}...`,
        required: false,
        validation: type === 'email' || type === 'tel' || type === 'url',
        hint: '',
        options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : []
    };
    
    formFields.push(field);
    renderForm();
    selectField(field.id);
    updateFieldCount();
}

function renderForm() {
    const canvas = document.getElementById('formCanvas');
    
    if (formFields.length === 0) {
        canvas.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <h3>Start Building Your Form</h3>
                <p>Drag and drop fields from the left panel</p>
            </div>
        `;
        return;
    }
    
    canvas.innerHTML = formFields.map(field => createFieldHTML(field)).join('');
    
    // Add click listeners
    document.querySelectorAll('.form-field').forEach(el => {
        el.addEventListener('click', (e) => {
            if (!e.target.closest('.field-action-btn')) {
                selectField(el.dataset.id);
            }
        });
    });
}

function createFieldHTML(field) {
    let inputHTML = '';
    
    switch(field.type) {
        case 'textarea':
            inputHTML = `<textarea class="field-input" placeholder="${field.placeholder}" rows="4"></textarea>`;
            break;
        case 'select':
            inputHTML = `
                <select class="field-input">
                    <option value="">Select an option</option>
                    ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            `;
            break;
        case 'radio':
            inputHTML = field.options.map((opt, i) => `
                <div style="margin: 8px 0;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="radio" name="${field.id}" value="${opt}">
                        <span>${opt}</span>
                    </label>
                </div>
            `).join('');
            break;
        case 'checkbox':
            inputHTML = `
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" style="width: 18px; height: 18px;">
                    <span>${field.label}</span>
                </label>
            `;
            break;
        case 'file':
            inputHTML = `<input type="file" class="field-input">`;
            break;
        default:
            inputHTML = `<input type="${field.type}" class="field-input" placeholder="${field.placeholder}">`;
    }
    
    return `
        <div class="form-field ${selectedFieldId === field.id ? 'selected' : ''}" data-id="${field.id}">
            <div class="field-header">
                <div class="field-label">
                    ${field.label}
                    ${field.required ? '<span class="field-required">*</span>' : ''}
                </div>
                <div class="field-actions">
                    <button class="field-action-btn" onclick="moveFieldUp('${field.id}')" title="Move Up">↑</button>
                    <button class="field-action-btn" onclick="moveFieldDown('${field.id}')" title="Move Down">↓</button>
                    <button class="field-action-btn" onclick="duplicateField('${field.id}')" title="Duplicate">📋</button>
                    <button class="field-action-btn" onclick="deleteField('${field.id}')" title="Delete">🗑️</button>
                </div>
            </div>
            ${inputHTML}
            ${field.hint ? `<div class="field-hint">${field.hint}</div>` : ''}
            <div class="validation-error">This field is required</div>
        </div>
    `;
}

function selectField(id) {
    selectedFieldId = id;
    const field = formFields.find(f => f.id === id);
    
    renderForm();
    renderProperties(field);
}

function renderProperties(field) {
    const content = document.getElementById('propertiesContent');
    
    const showOptions = field.type === 'select' || field.type === 'radio';
    
    content.innerHTML = `
        <div class="property-group">
            <label class="property-label">Field Label</label>
            <input type="text" class="property-input" value="${field.label}" onchange="updateField('label', this.value)">
        </div>
        
        ${field.type !== 'checkbox' ? `
            <div class="property-group">
                <label class="property-label">Placeholder</label>
                <input type="text" class="property-input" value="${field.placeholder}" onchange="updateField('placeholder', this.value)">
            </div>
        ` : ''}
        
        <div class="property-group">
            <label class="property-label">Help Text</label>
            <input type="text" class="property-input" value="${field.hint}" onchange="updateField('hint', this.value)">
        </div>
        
        <div class="property-group">
            <label class="property-checkbox">
                <input type="checkbox" ${field.required ? 'checked' : ''} onchange="updateField('required', this.checked)">
                <span>Required Field</span>
            </label>
        </div>
        
        ${field.type === 'email' || field.type === 'tel' || field.type === 'url' ? `
            <div class="property-group">
                <label class="property-checkbox">
                    <input type="checkbox" ${field.validation ? 'checked' : ''} onchange="updateField('validation', this.checked)">
                    <span>Enable Validation</span>
                </label>
            </div>
        ` : ''}
        
        ${showOptions ? `
            <div class="property-group">
                <label class="property-label">Options</label>
                <div class="options-list" id="optionsList">
                    ${field.options.map((opt, i) => `
                        <div class="option-item">
                            <input type="text" class="property-input" value="${opt}" onchange="updateOption(${i}, this.value)">
                            <button onclick="removeOption(${i})">×</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-primary" onclick="addOption()" style="margin-top: 8px; padding: 8px;">+ Add Option</button>
            </div>
        ` : ''}
    `;
}

function updateField(property, value) {
    const field = formFields.find(f => f.id === selectedFieldId);
    field[property] = value;
    renderForm();
}

function updateOption(index, value) {
    const field = formFields.find(f => f.id === selectedFieldId);
    field.options[index] = value;
    renderForm();
}

function addOption() {
    const field = formFields.find(f => f.id === selectedFieldId);
    field.options.push(`Option ${field.options.length + 1}`);
    renderProperties(field);
    renderForm();
}

function removeOption(index) {
    const field = formFields.find(f => f.id === selectedFieldId);
    field.options.splice(index, 1);
    renderProperties(field);
    renderForm();
}

function moveFieldUp(id) {
    const index = formFields.findIndex(f => f.id === id);
    if (index > 0) {
        [formFields[index], formFields[index - 1]] = [formFields[index - 1], formFields[index]];
        renderForm();
    }
}

function moveFieldDown(id) {
    const index = formFields.findIndex(f => f.id === id);
    if (index < formFields.length - 1) {
        [formFields[index], formFields[index + 1]] = [formFields[index + 1], formFields[index]];
        renderForm();
    }
}

function duplicateField(id) {
    const field = formFields.find(f => f.id === id);
    const newField = { ...field, id: Date.now().toString(), label: field.label + ' (Copy)' };
    const index = formFields.findIndex(f => f.id === id);
    formFields.splice(index + 1, 0, newField);
    renderForm();
    updateFieldCount();
}

function deleteField(id) {
    if (confirm('Delete this field?')) {
        formFields = formFields.filter(f => f.id !== id);
        selectedFieldId = null;
        renderForm();
        document.getElementById('propertiesContent').innerHTML = `
            <div class="no-selection">
                <span>🎯</span>
                <p>Select a field to edit properties</p>
            </div>
        `;
        updateFieldCount();
    }
}

function updateFieldCount() {
    document.querySelector('.field-count').textContent = `${formFields.length} field${formFields.length !== 1 ? 's' : ''}`;
}

function previewForm() {
    const modal = document.getElementById('previewModal');
    const content = document.getElementById('previewContent');
    
    content.innerHTML = `
        <form id="previewForm" onsubmit="return false;">
            ${formFields.map(field => createFieldHTML(field)).join('')}
        </form>
    `;
    
    modal.classList.add('active');
}

function closePreview() {
    document.getElementById('previewModal').classList.remove('active');
}

function testSubmit() {
    const form = document.getElementById('previewForm');
    let isValid = true;
    
    formFields.forEach(field => {
        const fieldEl = form.querySelector(`[data-id="${field.id}"]`);
        const input = fieldEl.querySelector('.field-input, input[type="radio"]:checked, input[type="checkbox"]');
        
        if (field.required) {
            if (!input || !input.value) {
                isValid = false;
                fieldEl.querySelector('.field-input')?.classList.add('error');
            }
        }
        
        if (field.validation && input && input.value) {
            const rule = validationRules[field.type];
            if (rule && !rule.test(input.value)) {
                isValid = false;
                input.classList.add('error');
            }
        }
    });
    
    if (isValid) {
        alert('✅ Form validation passed! All fields are valid.');
    } else {
        alert('❌ Please fix the errors in the form.');
    }
}

function exportForm() {
    const formData = {
        name: document.getElementById('formName').value,
        fields: formFields,
        createdAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function clearForm() {
    if (confirm('Clear all fields? This cannot be undone.')) {
        formFields = [];
        selectedFieldId = null;
        renderForm();
        document.getElementById('propertiesContent').innerHTML = `
            <div class="no-selection">
                <span>🎯</span>
                <p>Select a field to edit properties</p>
            </div>
        `;
        updateFieldCount();
    }
}

function saveFormName() {
    localStorage.setItem('formName', document.getElementById('formName').value);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}
