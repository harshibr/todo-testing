const express = require('express');
const jwt = require('jsonwebtoken');
const Todo = require('../models/Todo');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET is health-check-friendly: returns the user's todos when authenticated, empty list otherwise.
router.get('/', async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.json([]);
  try {
    const user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return res.json(await Todo.find({ user: user.id }).sort({ createdAt: -1 }));
  } catch {
    return res.json([]);
  }
});

// All mutations require a valid JWT.
router.use(requireAuth);

router.post('/', async (req, res) => {
  if (!req.body.text || !req.body.text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  if ('description' in req.body && typeof req.body.description !== 'string') {
    return res.status(400).json({ error: 'description must be a string' });
  }
  res.status(201).json(
    await Todo.create({ text: req.body.text, description: req.body.description || '', user: req.user.id })
  );
});

router.put('/:id', async (req, res) => {
  if ('text' in req.body && (typeof req.body.text !== 'string' || !req.body.text.trim())) {
    return res.status(400).json({ error: 'text is required' });
  }
  if ('description' in req.body && typeof req.body.description !== 'string') {
    return res.status(400).json({ error: 'description must be a string' });
  }
  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!todo) return res.status(404).json({ error: 'not found' });
  res.json(todo);
});

// Must be registered before '/:id' so "completed" is not treated as an id.
router.delete('/completed', async (req, res) => {
  const result = await Todo.deleteMany({ user: req.user.id, completed: true });
  res.json({ success: true, deletedCount: result.deletedCount });
});

router.delete('/:id', async (req, res) => {
  await Todo.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.json({ success: true });
});

module.exports = router;
