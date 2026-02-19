class Calculator {
    constructor() {
        this.expression = '';
        this.result = '0';
        this.lastAnswer = 0;
        this.memory = 0;
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.history = JSON.parse(localStorage.getItem('calcHistory')) || [];
        this.expressionDisplay = document.getElementById('expression');
        this.resultDisplay = document.getElementById('result');
        this.init();
    }

    init() {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.createRipple(e);
                this.playSound();
                this.handleClick(e.target);
            });
        });
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        this.updateMemoryIndicator();
    }

    handleClick(btn) {
        const action = btn.dataset.action;
        const value = btn.dataset.value;

        if (action) {
            this.handleAction(action);
        } else if (value) {
            this.appendValue(value);
        }
    }

    handleAction(action) {
        const actions = {
            clear: () => this.clear(),
            delete: () => this.delete(),
            equals: () => this.calculate(),
            sin: () => this.appendFunction('Math.sin('),
            cos: () => this.appendFunction('Math.cos('),
            tan: () => this.appendFunction('Math.tan('),
            log: () => this.appendFunction('Math.log10('),
            ln: () => this.appendFunction('Math.log('),
            sqrt: () => this.appendFunction('Math.sqrt('),
            pow: () => this.appendOperator('**2'),
            exp: () => this.appendFunction('Math.exp('),
            pi: () => this.appendValue(Math.PI.toString()),
            percent: () => this.appendOperator('/100'),
            factorial: () => this.calculateFactorial(),
            ans: () => this.appendValue(this.lastAnswer.toString()),
            'mc': () => this.memoryClear(),
            'mr': () => this.memoryRecall(),
            'm+': () => this.memoryAdd(),
            'm-': () => this.memorySubtract()
        };

        actions[action]?.();
    }

    appendValue(value) {
        if (this.result !== '0' && this.expression === '') {
            this.expression = this.result;
        }
        this.expression += value;
        this.updateDisplay();
    }

    appendOperator(op) {
        if (this.expression === '' && this.result !== '0') {
            this.expression = this.result;
        }
        this.expression += op;
        this.updateDisplay();
    }

    appendFunction(func) {
        this.expression += func;
        this.updateDisplay();
    }

    clear() {
        this.expression = '';
        this.result = '0';
        this.updateDisplay();
    }

    delete() {
        this.expression = this.expression.slice(0, -1);
        this.updateDisplay();
    }

    calculate() {
        try {
            const sanitized = this.sanitizeExpression(this.expression);
            const result = eval(sanitized);
            
            if (!isFinite(result)) {
                throw new Error('Invalid calculation');
            }
            
            this.result = this.formatResult(result);
            this.lastAnswer = parseFloat(this.result);
            
            this.addToHistory(this.expression, this.result);
            
            this.expression = '';
            this.updateDisplay();
        } catch (error) {
            this.result = 'Error';
            this.updateDisplay();
        }
    }

    calculateFactorial() {
        try {
            const num = parseFloat(this.expression || this.result);
            if (num < 0 || !Number.isInteger(num)) {
                throw new Error('Invalid input');
            }
            const result = this.factorial(num);
            this.result = this.formatResult(result);
            this.expression = '';
            this.updateDisplay();
        } catch (error) {
            this.result = 'Error';
            this.updateDisplay();
        }
    }

    factorial(n) {
        if (n === 0 || n === 1) return 1;
        return n * this.factorial(n - 1);
    }

    sanitizeExpression(expr) {
        return expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-');
    }

    formatResult(num) {
        if (Number.isInteger(num)) return num.toString();
        return parseFloat(num.toFixed(10)).toString();
    }

    handleKeyboard(e) {
        const key = e.key;
        const keyMap = {
            '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
            '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
            '.': '.', '+': '+', '-': '-', '*': '*', '/': '/',
            'Enter': 'equals', 'Escape': 'clear', 'Backspace': 'delete'
        };

        if (e.ctrlKey && key === 'c') {
            e.preventDefault();
            copyResult();
            return;
        }
        
        if (e.ctrlKey && key === 'h') {
            e.preventDefault();
            this.showHistory();
            return;
        }

        if (keyMap[key]) {
            e.preventDefault();
            this.playSound();
            if (['equals', 'clear', 'delete'].includes(keyMap[key])) {
                this.handleAction(keyMap[key]);
            } else {
                this.appendValue(keyMap[key]);
            }
        }
    }

    updateDisplay() {
        this.expressionDisplay.textContent = this.expression || '';
        this.resultDisplay.textContent = this.result;
    }

    addToHistory(expr, result) {
        const historyItem = {
            expression: expr,
            result: result,
            timestamp: new Date().toLocaleString()
        };
        this.history.unshift(historyItem);
        if (this.history.length > 100) this.history.pop();
        localStorage.setItem('calcHistory', JSON.stringify(this.history));
    }

    showHistory() {
        const panel = document.getElementById('historyPanel');
        panel.classList.remove('hidden');
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center; padding: 30px;">No history yet</div>';
            return;
        }
        
        historyList.innerHTML = this.history.map((item, index) => `
            <div class="history-item" onclick="calculator.useHistory(${index})">
                <div class="history-expr">${item.expression}</div>
                <div class="history-result">= ${item.result}</div>
                <div class="history-time">${item.timestamp}</div>
            </div>
        `).join('');
    }

    useHistory(index) {
        const item = this.history[index];
        this.expression = item.expression;
        this.updateDisplay();
        closeHistory();
    }

    searchHistory() {
        const searchTerm = document.getElementById('historySearch').value.toLowerCase();
        const filtered = this.history.filter(item => 
            item.expression.toLowerCase().includes(searchTerm) ||
            item.result.toLowerCase().includes(searchTerm)
        );
        
        const historyList = document.getElementById('historyList');
        if (filtered.length === 0) {
            historyList.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center; padding: 30px;">No results found</div>';
            return;
        }
        
        historyList.innerHTML = filtered.map((item) => `
            <div class="history-item" onclick="calculator.useHistory(${this.history.indexOf(item)})">
                <div class="history-expr">${item.expression}</div>
                <div class="history-result">= ${item.result}</div>
                <div class="history-time">${item.timestamp}</div>
            </div>
        `).join('');
    }

    memoryClear() {
        this.memory = 0;
        this.updateMemoryIndicator();
    }

    memoryRecall() {
        this.appendValue(this.memory.toString());
    }

    memoryAdd() {
        const value = parseFloat(this.result);
        if (!isNaN(value)) {
            this.memory += value;
            this.updateMemoryIndicator();
        }
    }

    memorySubtract() {
        const value = parseFloat(this.result);
        if (!isNaN(value)) {
            this.memory -= value;
            this.updateMemoryIndicator();
        }
    }

    updateMemoryIndicator() {
        const indicator = document.getElementById('memoryIndicator');
        indicator.textContent = this.memory !== 0 ? `M: ${this.memory}` : '';
    }

    createRipple(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('btn-ripple');
        
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    playSound() {
        if (!this.soundEnabled) return;
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofsz=');
        audio.volume = 0.1;
        audio.play().catch(() => {});
    }
}

const calculator = new Calculator();

function closeHistory() {
    document.getElementById('historyPanel').classList.add('hidden');
}

function clearHistory() {
    calculator.history = [];
    localStorage.removeItem('calcHistory');
    calculator.renderHistory();
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function toggleSound() {
    calculator.soundEnabled = !calculator.soundEnabled;
    localStorage.setItem('soundEnabled', calculator.soundEnabled);
    const btn = event.target;
    btn.textContent = calculator.soundEnabled ? '🔊' : '🔇';
}

function copyResult() {
    const result = document.getElementById('result').textContent;
    navigator.clipboard.writeText(result).then(() => {
        const btn = event.target;
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = '📋', 1000);
    });
}

function showConverter() {
    document.getElementById('converterPanel').classList.remove('hidden');
    updateConverterUnits();
}

function closeConverter() {
    document.getElementById('converterPanel').classList.add('hidden');
}

function showShortcuts() {
    document.getElementById('shortcutsPanel').classList.remove('hidden');
}

function closeShortcuts() {
    document.getElementById('shortcutsPanel').classList.add('hidden');
}

function closeCalculator() {
    if (confirm('Close calculator?')) {
        calculator.clear();
    }
}

function exportHistory() {
    const data = JSON.stringify(calculator.history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculator-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importHistory() {
    document.getElementById('importFile').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            calculator.history = [...imported, ...calculator.history];
            localStorage.setItem('calcHistory', JSON.stringify(calculator.history));
            calculator.renderHistory();
        } catch (error) {
            alert('Invalid file format');
        }
    };
    reader.readAsText(file);
}

const converterData = {
    length: {
        meter: 1,
        kilometer: 0.001,
        centimeter: 100,
        millimeter: 1000,
        mile: 0.000621371,
        yard: 1.09361,
        foot: 3.28084,
        inch: 39.3701
    },
    weight: {
        kilogram: 1,
        gram: 1000,
        milligram: 1000000,
        pound: 2.20462,
        ounce: 35.274
    },
    temperature: {
        celsius: 'c',
        fahrenheit: 'f',
        kelvin: 'k'
    }
};

function updateConverterUnits() {
    const type = document.getElementById('converterType').value;
    const units = Object.keys(converterData[type]);
    
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    
    fromUnit.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
    toUnit.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
    toUnit.selectedIndex = 1;
}

function convert() {
    const type = document.getElementById('converterType').value;
    const fromValue = parseFloat(document.getElementById('fromValue').value) || 0;
    const fromUnit = document.getElementById('fromUnit').value;
    const toUnit = document.getElementById('toUnit').value;
    
    let result;
    
    if (type === 'temperature') {
        result = convertTemperature(fromValue, fromUnit, toUnit);
    } else {
        const fromFactor = converterData[type][fromUnit];
        const toFactor = converterData[type][toUnit];
        result = (fromValue / fromFactor) * toFactor;
    }
    
    document.getElementById('toValue').value = result.toFixed(6);
}

function convertTemperature(value, from, to) {
    let celsius;
    
    if (from === 'celsius') celsius = value;
    else if (from === 'fahrenheit') celsius = (value - 32) * 5/9;
    else celsius = value - 273.15;
    
    if (to === 'celsius') return celsius;
    if (to === 'fahrenheit') return celsius * 9/5 + 32;
    return celsius + 273.15;
}

window.addEventListener('DOMContentLoaded', () => {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    }
});
