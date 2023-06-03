const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());

// In-memory database of users and todos
const users = [
  { id: 1, username: 'user1', password: 'password1' },
  { id: 2, username: 'user2', password: 'password2' },
];

const todos = [
  { id: 1, userId: 1, title: 'Todo 1', completed: false },
  { id: 2, userId: 2, title: 'Todo 2', completed: false },
];

// Secret key for JWT
const secretKey = 'secret';

// Middleware to validate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
}

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username }, secretKey);
    res.json({ token });
  } else {
    res.sendStatus(401);
  }
});

// Get all todos
app.get('/todos', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const userTodos = todos.filter(todo => todo.userId === userId);
  res.json(userTodos);
});

// Create a new todo
app.post('/todos', authenticateToken, (req, res) => {
  const { title } = req.body;
  const userId = req.user.id;

  const newTodo = { id: todos.length + 1, userId, title, completed: false };
  todos.push(newTodo);
  res.json(newTodo);
});

// Update a todo
app.put('/todos/:id', authenticateToken, (req, res) => {
  const todoId = parseInt(req.params.id);
  const { title, completed } = req.body;

  const todo = todos.find(todo => todo.id === todoId && todo.userId === req.user.id);
  if (!todo) {
    return res.sendStatus(404);
  }

  todo.title = title || todo.title;
  todo.completed = completed !== undefined ? completed : todo.completed;

  res.json(todo);
});

// Delete a todo
app.delete('/todos/:id', authenticateToken, (req, res) => {
  const todoId = parseInt(req.params.id);

  const todoIndex = todos.findIndex(todo => todo.id === todoId && todo.userId === req.user.id);
  if (todoIndex === -1) {
    return res.sendStatus(404);
  }

  todos.splice(todoIndex, 1);
  res.sendStatus(204);
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
