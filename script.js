// Получаем элементы DOM
const todoInput = document.getElementById('todoInput');
const addButton = document.getElementById('addButton');
const todoList = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');
const clearCompleted = document.getElementById('clearCompleted');
const userGreeting = document.getElementById('userGreeting');
const tg = window.Telegram?.WebApp;

// Массив для хранения задач
let todos = [];

// Функция для вывода отладочной информации на экран
function addDebugInfo(message, type = 'info') {
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo) return;
    
    const line = document.createElement('div');
    line.className = `debug-line ${type}`;
    line.textContent = message;
    debugInfo.appendChild(line);
    
    // Также выводим в консоль для полноты
    console.log(message);
}

function clearDebugInfo() {
    const debugInfo = document.getElementById('debugInfo');
    if (debugInfo) {
        debugInfo.innerHTML = '';
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Сначала инициализируем Telegram WebApp
    initTelegramIntegration();
    
    // Небольшая задержка для корректной инициализации Telegram API
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Загружаем задачи из Telegram Cloud Storage
    await loadTodos();
    renderTodos();
});

// Добавление задачи по клику на кнопку
addButton.addEventListener('click', addTodo);

// Добавление задачи по нажатию Enter
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// Очистка выполненных задач
clearCompleted.addEventListener('click', () => {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
});

// Функция добавления задачи
function addTodo() {
    const text = todoInput.value.trim();
    
    if (text === '') {
        return;
    }
    
    const todo = {
        id: Date.now(),
        text: text,
        completed: false
    };
    
    todos.push(todo);
    todoInput.value = '';
    
    saveTodos();
    renderTodos();
}

function handleMainButtonClick() {
    const totalCount = todos.length;
    const completedCount = todos.filter(todo => todo.completed).length;
    const activeCount = totalCount - completedCount;
    
    const totalWord = getTaskWord(totalCount);
    const completedWord = getTaskWord(completedCount);
    
    const message = `Всего задач: ${totalCount} ${totalWord}\nВыполнено: ${completedCount} ${completedWord}`;

    if (tg?.showPopup) {
        tg.showPopup({
            title: 'Статистика задач',
            message,
            buttons: [{ type: 'ok', text: 'Закрыть' }]
        });
    } else {
        alert(message);
    }
}

function initTelegramIntegration() {
    clearDebugInfo();
    addDebugInfo('=== ДИАГНОСТИКА TELEGRAM ===');
    
    // ДИАГНОСТИКА: Проверяем есть ли Telegram WebApp API
    addDebugInfo(`1️⃣ Telegram WebApp доступен: ${!!tg ? '✅ ДА' : '❌ НЕТ'}`, !!tg ? 'success' : 'error');
    
    if (!tg) {
        if (userGreeting) {
            userGreeting.textContent = '⚠️ Открой в Telegram для сохранения задач';
        }
        addDebugInfo(`❌ ПРОБЛЕМА: Telegram не доступен`, 'error');
        addDebugInfo(`   Задачи НЕ будут сохраняться!`, 'warning');
        addDebugInfo('=========================');
        return;
    }

    try {
        tg.ready();
        tg.expand();
        addDebugInfo('2️⃣ Telegram инициализирован', 'success');
    } catch (err) {
        addDebugInfo(`❌ Ошибка инициализации: ${err.message}`, 'error');
    }

    // Проверяем доступность Cloud Storage
    const hasCloudStorage = !!tg.CloudStorage;
    addDebugInfo(`3️⃣ Cloud Storage доступен: ${hasCloudStorage ? '✅ ДА' : '❌ НЕТ'}`, hasCloudStorage ? 'success' : 'error');

    // ДИАГНОСТИКА: Смотрим что в initDataUnsafe
    const user = tg.initDataUnsafe?.user;
    
    addDebugInfo(`4️⃣ Данные пользователя:`);
    if (user) {
        addDebugInfo(`   - ID: ${user.id || 'НЕТ'}`, user.id ? 'success' : 'error');
        addDebugInfo(`   - Имя: ${user.first_name || 'НЕТ'}`);
        addDebugInfo(`   - Username: ${user.username || 'НЕТ'}`);
    } else {
        addDebugInfo(`   ❌ User данные недоступны`, 'error');
    }
    
    const name = user?.first_name || user?.username || 'друг';
    
    addDebugInfo('=========================');
    
    // Показываем приветствие
    if (userGreeting) {
        userGreeting.textContent = `✅ Привет, ${name}!`;
        userGreeting.style.color = '#155724';
    }

    // Настраиваем главную кнопку
    tg.MainButton.setText('Готово');
    tg.MainButton.onClick(handleMainButtonClick);
    tg.MainButton.show();
}

// Функция переключения состояния задачи
function toggleTodo(id) {
    todos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    
    saveTodos();
    renderTodos();
}

// Функция удаления задачи
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    
    saveTodos();
    renderTodos();
}

// Функция отрисовки списка задач
function renderTodos() {
    todoList.innerHTML = '';
    
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="todo-content">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    onchange="toggleTodo(${todo.id})">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
            </div>
            <button class="delete-button" onclick="deleteTodo(${todo.id})">×</button>
        `;
        
        todoList.appendChild(li);
    });
    
    updateCounter();
}

// Обновление счетчика задач
function updateCounter() {
    const activeCount = todos.filter(todo => !todo.completed).length;
    const word = getTaskWord(activeCount);
    todoCount.textContent = `${activeCount} ${word}`;
}

// Склонение слова "задача"
function getTaskWord(count) {
    if (count === 0) return 'задач';
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'задач';
    if (lastDigit === 1) return 'задача';
    if (lastDigit >= 2 && lastDigit <= 4) return 'задачи';
    return 'задач';
}

// Экранирование HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Сохранение задач в Telegram Cloud Storage
async function saveTodos() {
    addDebugInfo('');
    addDebugInfo('=== СОХРАНЕНИЕ ЗАДАЧ ===');
    addDebugInfo(`Количество задач: ${todos.length}`);
    
    // Если Telegram недоступен, сохраняем в localStorage как fallback
    if (!tg || !tg.CloudStorage) {
        addDebugInfo('⚠️ Cloud Storage недоступен, используем localStorage', 'warning');
        try {
            localStorage.setItem('todos', JSON.stringify(todos));
            addDebugInfo('✅ Сохранено в localStorage', 'success');
        } catch (error) {
            addDebugInfo(`❌ Ошибка localStorage: ${error.message}`, 'error');
        }
        addDebugInfo('====================');
        return;
    }

    try {
        const todosJson = JSON.stringify(todos);
        
        // Используем промис для async/await
        await new Promise((resolve, reject) => {
            tg.CloudStorage.setItem('todos', todosJson, (error, success) => {
                if (error) {
                    reject(new Error(error));
                } else {
                    resolve(success);
                }
            });
        });

        addDebugInfo('✅ Задачи сохранены в Telegram Cloud!', 'success');
        addDebugInfo('====================');
    } catch (error) {
        addDebugInfo(`❌ Ошибка сохранения: ${error.message}`, 'error');
        addDebugInfo('====================');
    }
}

// Загрузка задач из Telegram Cloud Storage
async function loadTodos() {
    addDebugInfo('');
    addDebugInfo('=== ЗАГРУЗКА ЗАДАЧ ===');
    
    // Если Telegram недоступен, загружаем из localStorage как fallback
    if (!tg || !tg.CloudStorage) {
        addDebugInfo('⚠️ Cloud Storage недоступен, используем localStorage', 'warning');
        try {
            const savedTodos = localStorage.getItem('todos');
            todos = savedTodos ? JSON.parse(savedTodos) : [];
            addDebugInfo(`✅ Загружено из localStorage: ${todos.length} задач`, 'success');
        } catch (error) {
            addDebugInfo(`❌ Ошибка localStorage: ${error.message}`, 'error');
            todos = [];
        }
        addDebugInfo('===================');
        return;
    }

    try {
        // Используем промис для async/await
        const todosJson = await new Promise((resolve, reject) => {
            tg.CloudStorage.getItem('todos', (error, value) => {
                if (error) {
                    reject(new Error(error));
                } else {
                    resolve(value);
                }
            });
        });

        if (todosJson) {
            todos = JSON.parse(todosJson);
            addDebugInfo(`✅ Загружено из Telegram Cloud: ${todos.length} задач`, 'success');
            if (todos.length > 0) {
                addDebugInfo(`   Первая задача: ${todos[0].text?.substring(0, 30)}...`);
            }
        } else {
            todos = [];
            addDebugInfo('ℹ️ Задач пока нет (первый запуск)', 'info');
        }
        
        addDebugInfo('===================');
    } catch (error) {
        addDebugInfo(`❌ Ошибка загрузки: ${error.message}`, 'error');
        todos = [];
        addDebugInfo('===================');
    }
}

