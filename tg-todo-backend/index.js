const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Middleware для парсинга JSON
app.use(express.json());

// Хранилище задач в памяти: объект, где ключ - userId, значение - массив задач
const todosByUser = {};

// GET /todos?userId=... — получить список задач
app.get('/todos', (req, res) => {
    const userId = req.query.userId;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId parameter is required' });
    }
    
    // Если у пользователя еще нет задач, возвращаем пустой массив
    const todos = todosByUser[userId] || [];
    
    res.json(todos);
});

// POST /todos — сохранить список задач
app.post('/todos', (req, res) => {
    const { userId, todos } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!Array.isArray(todos)) {
        return res.status(400).json({ error: 'todos must be an array' });
    }
    
    // Сохраняем список задач для пользователя
    todosByUser[userId] = todos;
    
    res.json({ success: true, message: 'Todos saved successfully' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

