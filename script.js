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

// Загрузка задач из localStorage при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    renderTodos();
    initTelegramIntegration();
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
    if (!tg) {
        if (userGreeting) {
            userGreeting.textContent = 'Открой в Telegram, чтобы увидеть приветствие.';
        }
        return;
    }

    try {
        tg.ready();
        tg.expand();
    } catch (err) {
        console.error('Telegram init error', err);
    }

    const user = tg.initDataUnsafe?.user;
    const name = user?.first_name || user?.username || 'друг';
    if (userGreeting) {
        userGreeting.textContent = `Привет, ${name}!`;
    }

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

// Сохранение в localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Загрузка из localStorage
function loadTodos() {
    const stored = localStorage.getItem('todos');
    if (stored) {
        todos = JSON.parse(stored);
    }
}

