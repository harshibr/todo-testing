const express = require('express');
const Todo = require('../models/Todo');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await Todo.find().sort({ createdAt: -1 }));
});

router.post('/', async (req, res) => {
  if (!req.body.text || !req.body.text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  if ('description' in req.body && typeof req.body.description !== 'string') {
    return res.status(400).json({ error: 'description must be a string' });
  }
  res.status(201).json(await Todo.create({ text: req.body.text, description: req.body.description || '' }));
});

router.put('/:id', async (req, res) => {
  if ('text' in req.body && (typeof req.body.text !== 'string' || !req.body.text.trim())) {
    return res.status(400).json({ error: 'text is required' });
  }
  if ('description' in req.body && typeof req.body.description !== 'string') {
    return res.status(400).json({ error: 'description must be a string' });
  }
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!todo) return res.status(404).json({ error: 'not found' });
  res.json(todo);
});

// Must be registered before '/:id' so "completed" is not treated as an id.
router.delete('/completed', async (req, res) => {
  const result = await Todo.deleteMany({ completed: true });
  res.json({ success: true, deletedCount: result.deletedCount });
});

router.delete('/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
