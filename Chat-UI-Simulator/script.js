let chats = JSON.parse(localStorage.getItem('chats')) || [];
let currentChatId = null;
let currentCategory = 'all';
let searchQuery = '';
let settings = {
    personality: 'friendly',
    responseSpeed: 2000,
    soundEnabled: true,
    autoScroll: true,
    showTimestamps: true
};

const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'];

const responses = {
    friendly: {
        greetings: ['Hello! 😊 How can I help you today?', 'Hi there! 👋 What can I do for you?', 'Hey! Great to see you! How may I assist?'],
        jokes: ['Why do programmers prefer dark mode? Because light attracts bugs! 😄', 'Why did the developer go broke? Because he used up all his cache! 💸', 'How many programmers does it take to change a light bulb? None, that\'s a hardware problem! 💡'],
        default: ['That\'s interesting! Tell me more! 🤔', 'I see what you mean! 😊', 'Great question! Let me think about that... 💭', 'Hmm, that\'s a good point! 👍']
    },
    professional: {
        greetings: ['Good day. How may I assist you?', 'Hello. What can I help you with today?', 'Greetings. How can I be of service?'],
        jokes: ['I appreciate humor, but let\'s focus on productivity. How can I help?', 'Interesting request. Would you like to discuss something else?'],
        default: ['I understand. Please provide more details.', 'Noted. What else would you like to know?', 'I see. How can I further assist you?']
    },
    humorous: {
        greetings: ['Yo! What\'s up? 😎', 'Hey hey! Ready to chat? 🎉', 'Greetings, human! 🤖'],
        jokes: ['Why do Java developers wear glasses? Because they can\'t C#! 😂', 'I told my computer I needed a break... now it won\'t stop sending me Kit-Kats! 🍫', 'My code doesn\'t always work, but when it does, I have no idea why! 🤷'],
        default: ['LOL! That\'s hilarious! 😂', 'You\'re funny! Tell me more! 😄', 'Haha! I like your style! 😎', 'That\'s comedy gold! 🎭']
    },
    technical: {
        greetings: ['System initialized. Ready for input.', 'Hello. Technical assistance mode activated.', 'Greetings. How can I help with your technical query?'],
        jokes: ['Humor module not found. Please specify technical requirements.', 'Error 404: Joke not found. Please try a technical question.'],
        default: ['Processing query... Please specify technical parameters.', 'Analyzing input. Require additional data points.', 'Query received. Awaiting further specifications.']
    }
};

// Initialize
window.addEventListener('load', () => {
    loadSettings();
    loadTheme();
    renderChatList();
    initializeEmojiPicker();
    
    if (chats.length > 0) {
        loadChat(chats[0].id);
    }
});

function createNewChat() {
    const chat = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        pinned: false,
        archived: false,
        createdAt: new Date().toISOString()
    };
    
    chats.unshift(chat);
    saveChats();
    renderChatList();
    loadChat(chat.id);
}

function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) return;
    
    document.getElementById('chatTitle').textContent = chat.title;
    
    const messagesArea = document.getElementById('messagesArea');
    const welcomeScreen = document.getElementById('welcomeScreen');
    
    if (chat.messages.length === 0) {
        messagesArea.innerHTML = `
            <div class="welcome-screen" id="welcomeScreen">
                <div class="welcome-icon">💬</div>
                <h2>Welcome to ChatFlow</h2>
                <p>Your intelligent AI assistant is ready to help!</p>
                <div class="suggestions">
                    <button class="suggestion-btn" onclick="sendSuggestion('Tell me a joke')">😄 Tell me a joke</button>
                    <button class="suggestion-btn" onclick="sendSuggestion('Explain quantum computing')">🔬 Explain quantum computing</button>
                    <button class="suggestion-btn" onclick="sendSuggestion('Write a poem about coding')">✍️ Write a poem</button>
                    <button class="suggestion-btn" onclick="sendSuggestion('Give me productivity tips')">⚡ Productivity tips</button>
                </div>
            </div>
        `;
    } else {
        messagesArea.innerHTML = chat.messages.map(msg => createMessageHTML(msg)).join('');
    }
    
    if (settings.autoScroll) {
        scrollToBottom();
    }
    
    renderChatList();
}

function createMessageHTML(msg) {
    return `
        <div class="message ${msg.type}">
            <div class="message-avatar">${msg.type === 'bot' ? '🤖' : '👤'}</div>
            <div class="message-content">
                <div class="message-bubble">${msg.text}</div>
                ${settings.showTimestamps ? `<div class="message-time">${formatTime(msg.timestamp)}</div>` : ''}
            </div>
        </div>
    `;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function sendMessage() {
    console.log('Send button clicked!');
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    console.log('Message text:', text);
    
    if (!text) {
        console.log('Empty message, returning');
        return;
    }
    
    if (!currentChatId) {
        const chat = {
            id: Date.now().toString(),
            title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            messages: [],
            createdAt: new Date().toISOString()
        };
        chats.unshift(chat);
        currentChatId = chat.id;
        saveChats();
        renderChatList();
    }
    
    const chat = chats.find(c => c.id === currentChatId);
    
    // Hide welcome screen if it exists
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    
    // Add user message
    const userMsg = {
        type: 'user',
        text: text,
        timestamp: new Date().toISOString()
    };
    
    chat.messages.push(userMsg);
    
    // Update chat title if needed
    if (chat.messages.length === 1) {
        chat.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        renderChatList();
    }
    
    appendMessage(userMsg);
    input.value = '';
    input.style.height = 'auto';
    
    if (settings.soundEnabled) {
        playSound();
    }
    
    // Show typing indicator
    document.getElementById('typingIndicator').classList.add('active');
    
    // Generate bot response
    setTimeout(() => {
        document.getElementById('typingIndicator').classList.remove('active');
        
        const botMsg = {
            type: 'bot',
            text: generateResponse(text),
            timestamp: new Date().toISOString()
        };
        
        chat.messages.push(botMsg);
        appendMessage(botMsg);
        
        if (settings.soundEnabled) {
            playSound();
        }
        
        saveChats();
        renderChatList();
    }, settings.responseSpeed);
}

function generateResponse(input) {
    const personality = responses[settings.personality];
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
        return personality.greetings[Math.floor(Math.random() * personality.greetings.length)];
    }
    
    if (lowerInput.includes('joke') || lowerInput.includes('funny')) {
        return personality.jokes[Math.floor(Math.random() * personality.jokes.length)];
    }
    
    if (lowerInput.includes('quantum')) {
        return 'Quantum computing uses quantum-mechanical phenomena like superposition and entanglement to perform computations. Unlike classical computers that use bits (0 or 1), quantum computers use qubits that can be in multiple states simultaneously! 🔬';
    }
    
    if (lowerInput.includes('poem') || lowerInput.includes('poetry') || lowerInput.includes('write')) {
        return 'Code flows like poetry,\nFunctions dance in harmony,\nBugs? Just poetry! 🎭✨';
    }
    
    if (lowerInput.includes('productivity') || lowerInput.includes('tips')) {
        return '⚡ Here are some productivity tips:\n1. Use the Pomodoro Technique (25 min work, 5 min break)\n2. Prioritize tasks with the Eisenhower Matrix\n3. Minimize distractions\n4. Take regular breaks\n5. Stay hydrated! 💧';
    }
    
    if (lowerInput.includes('weather')) {
        return 'I\'m a chat simulator, so I don\'t have real weather data. But I hope it\'s nice where you are! ☀️';
    }
    
    if (lowerInput.includes('time') || lowerInput.includes('date')) {
        return `The current time is ${new Date().toLocaleTimeString()} and today is ${new Date().toLocaleDateString()}! ⏰`;
    }
    
    if (lowerInput.includes('name')) {
        return 'I\'m ChatFlow, your AI assistant! Nice to meet you! 🤖';
    }
    
    if (lowerInput.includes('help')) {
        return 'I can chat with you, tell jokes, explain concepts, give tips, and more! Just ask me anything! 💬';
    }
    
    if (lowerInput.includes('thank')) {
        return 'You\'re welcome! Happy to help! 😊';
    }
    
    if (lowerInput.includes('bye') || lowerInput.includes('goodbye')) {
        return 'Goodbye! Have a great day! 👋';
    }
    
    // Smart contextual responses
    if (lowerInput.includes('how are you')) {
        return 'I\'m doing great! Thanks for asking! How can I help you today? 😊';
    }
    
    if (lowerInput.includes('what') && lowerInput.includes('do')) {
        return 'I\'m here to chat, answer questions, and assist you! Try asking me about jokes, tips, or any topic! 💡';
    }
    
    return personality.default[Math.floor(Math.random() * personality.default.length)];
}

function appendMessage(msg) {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.insertAdjacentHTML('beforeend', createMessageHTML(msg));
    
    if (settings.autoScroll) {
        scrollToBottom();
    }
}

function scrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function sendSuggestion(text) {
    document.getElementById('messageInput').value = text;
    sendMessage();
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function clearChat() {
    if (!currentChatId) return;
    if (!confirm('Clear all messages in this chat?')) return;
    
    const chat = chats.find(c => c.id === currentChatId);
    chat.messages = [];
    saveChats();
    loadChat(currentChatId);
}

function exportChat() {
    if (!currentChatId) return;
    
    const chat = chats.find(c => c.id === currentChatId);
    const text = chat.messages.map(msg => 
        `[${formatTime(msg.timestamp)}] ${msg.type === 'user' ? 'You' : 'Bot'}: ${msg.text}`
    ).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function renderChatList() {
    const chatList = document.getElementById('chatList');
    
    let filteredChats = chats.filter(chat => {
        const matchesCategory = 
            currentCategory === 'all' ? !chat.archived :
            currentCategory === 'pinned' ? chat.pinned && !chat.archived :
            currentCategory === 'archived' ? chat.archived : true;
        
        const matchesSearch = !searchQuery || 
            chat.title.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesCategory && matchesSearch;
    });
    
    filteredChats.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    updateCategoryCounts();
    
    if (filteredChats.length === 0) {
        chatList.innerHTML = '<div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">No chats found</div>';
        return;
    }
    
    chatList.innerHTML = filteredChats.map(chat => `
        <div class="chat-item ${chat.id === currentChatId ? 'active' : ''} ${chat.pinned ? 'pinned' : ''} ${chat.archived ? 'archived' : ''}" onclick="loadChat('${chat.id}')">
            <div class="chat-item-title">${chat.pinned ? '📌 ' : ''}${chat.title}</div>
            <div class="chat-item-preview">${chat.messages.length} messages</div>
            <div class="chat-actions" onclick="event.stopPropagation()">
                <button class="chat-action-btn" onclick="togglePin('${chat.id}')" title="${chat.pinned ? 'Unpin' : 'Pin'}">
                    ${chat.pinned ? '📌' : '📍'}
                </button>
                <button class="chat-action-btn" onclick="toggleArchive('${chat.id}')" title="${chat.archived ? 'Unarchive' : 'Archive'}">
                    ${chat.archived ? '📤' : '🗄️'}
                </button>
                <button class="chat-action-btn" onclick="deleteChat('${chat.id}')" title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function showSettings() {
    document.getElementById('settingsPanel').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsPanel').classList.remove('active');
}

function changeBotPersonality() {
    settings.personality = document.getElementById('botPersonality').value;
    saveSettings();
}

function changeResponseSpeed() {
    const speed = document.getElementById('responseSpeed').value;
    settings.responseSpeed = speed === 'fast' ? 1000 : speed === 'slow' ? 3000 : 2000;
    saveSettings();
}

function toggleSound() {
    settings.soundEnabled = document.getElementById('soundToggle').checked;
    saveSettings();
}

function toggleAutoScroll() {
    settings.autoScroll = document.getElementById('autoScrollToggle').checked;
    saveSettings();
}

function toggleTimestamps() {
    settings.showTimestamps = document.getElementById('timestampToggle').checked;
    saveSettings();
    if (currentChatId) {
        loadChat(currentChatId);
    }
}

function initializeEmojiPicker() {
    const emojiGrid = document.querySelector('.emoji-grid');
    emojiGrid.innerHTML = emojis.map(emoji => 
        `<span class="emoji-item" onclick="insertEmoji('${emoji}')">${emoji}</span>`
    ).join('');
}

function showEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.classList.toggle('active');
}

function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    input.value += emoji;
    input.focus();
    document.getElementById('emojiPicker').classList.remove('active');
}

function showAttachments() {
    alert('📎 Attachment feature coming soon!');
}

let isRecording = false;

function toggleVoiceInput() {
    const btn = document.getElementById('voiceBtn');
    isRecording = !isRecording;
    
    if (isRecording) {
        btn.classList.add('recording');
        btn.textContent = '⏹️';
        simulateVoiceInput();
    } else {
        btn.classList.remove('recording');
        btn.textContent = '🎤';
    }
}

function simulateVoiceInput() {
    const messages = [
        'Hello, how are you?',
        'Tell me a joke',
        'What is quantum computing?',
        'Give me productivity tips'
    ];
    
    setTimeout(() => {
        if (isRecording) {
            const input = document.getElementById('messageInput');
            input.value = messages[Math.floor(Math.random() * messages.length)];
            toggleVoiceInput();
        }
    }, 2000);
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function searchChats() {
    searchQuery = document.getElementById('chatSearch').value;
    renderChatList();
}

function filterChatsByCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    renderChatList();
}

function updateCategoryCounts() {
    const allCount = chats.filter(c => !c.archived).length;
    const pinnedCount = chats.filter(c => c.pinned && !c.archived).length;
    const archivedCount = chats.filter(c => c.archived).length;
    
    document.getElementById('allCount').textContent = allCount;
    document.getElementById('pinnedCount').textContent = pinnedCount;
    document.getElementById('archivedCount').textContent = archivedCount;
}

function togglePin(chatId) {
    const chat = chats.find(c => c.id === chatId);
    chat.pinned = !chat.pinned;
    saveChats();
    renderChatList();
}

function toggleArchive(chatId) {
    const chat = chats.find(c => c.id === chatId);
    chat.archived = !chat.archived;
    if (chat.archived && currentChatId === chatId) {
        currentChatId = null;
    }
    saveChats();
    renderChatList();
}

function deleteChat(chatId) {
    if (!confirm('Delete this chat permanently?')) return;
    chats = chats.filter(c => c.id !== chatId);
    if (currentChatId === chatId) {
        currentChatId = null;
    }
    saveChats();
    renderChatList();
}

function showShortcuts() {
    document.getElementById('shortcutsModal').classList.add('active');
}

function closeShortcuts() {
    document.getElementById('shortcutsModal').classList.remove('active');
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    }
}

function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

function saveSettings() {
    localStorage.setItem('chatSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('chatSettings');
    if (saved) {
        settings = JSON.parse(saved);
        document.getElementById('botPersonality').value = settings.personality;
        document.getElementById('responseSpeed').value = 
            settings.responseSpeed === 1000 ? 'fast' : 
            settings.responseSpeed === 3000 ? 'slow' : 'normal';
        document.getElementById('soundToggle').checked = settings.soundEnabled;
        document.getElementById('autoScrollToggle').checked = settings.autoScroll;
        document.getElementById('timestampToggle').checked = settings.showTimestamps;
    }
}

function playSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofsz=');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

// Close panels on escape
document.addEventListener('keydown', (e) => {
    // Ctrl+N: New Chat
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewChat();
    }
    
    // Ctrl+K: Search
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('chatSearch').focus();
    }
    
    // Ctrl+B: Toggle Sidebar
    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
    }
    
    // Ctrl+D: Delete Current Chat
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (currentChatId) deleteChat(currentChatId);
    }
    
    // Ctrl+P: Pin/Unpin Current Chat
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (currentChatId) togglePin(currentChatId);
    }
    
    if (e.key === 'Escape') {
        closeSettings();
        closeShortcuts();
        document.getElementById('emojiPicker').classList.remove('active');
    }
});

// Close emoji picker when clicking outside
document.addEventListener('click', (e) => {
    const picker = document.getElementById('emojiPicker');
    const emojiBtn = document.querySelector('.emoji-btn');
    
    if (!picker.contains(e.target) && e.target !== emojiBtn) {
        picker.classList.remove('active');
    }
});
