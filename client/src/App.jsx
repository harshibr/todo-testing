import { useEffect, useState } from 'react';

const API = `${import.meta.env.VITE_API_URL || ''}/api/todos`;

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetch(API).then((r) => r.json()).then(setTodos);
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const todo = await res.json();
    setTodos([todo, ...todos]);
    setText('');
  };

  const toggle = async (todo) => {
    const res = await fetch(`${API}/${todo._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    const updated = await res.json();
    setTodos(todos.map((t) => (t._id === updated._id ? updated : t)));
  };

  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditText(todo.text);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (todo) => {
    const next = editText.trim();
    setEditingId(null);
    if (!next || next === todo.text) return;
    const res = await fetch(`${API}/${todo._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: next }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setTodos((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  };

  const remove = async (id) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    setTodos(todos.filter((t) => t._id !== id));
  };

  const clearCompleted = async () => {
    await fetch(`${API}/completed`, { method: 'DELETE' });
    setTodos(todos.filter((t) => !t.completed));
  };

  const hasCompleted = todos.some((t) => t.completed);

  return (
    <div className="app">
      <h1>Todo List</h1>
      <form onSubmit={addTodo}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task..." />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map((t) => (
          <li key={t._id}>
            {editingId === t._id ? (
              <input
                className="edit"
                aria-label="Edit task"
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => saveEdit(t)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
            ) : (
              <span
                className={t.completed ? 'done' : ''}
                title="Click to toggle"
                onClick={() => toggle(t)}
              >
                {t.text}
              </span>
            )}
            <span className="actions">
              {editingId !== t._id && (
                <button type="button" className="icon" aria-label="Edit" title="Edit" onClick={() => startEdit(t)}>✎</button>
              )}
              <button type="button" className="del" aria-label="Delete" title="Delete" onClick={() => remove(t._id)}>✕</button>
            </span>
          </li>
        ))}
      </ul>
      {hasCompleted && (
        <button type="button" className="clear" onClick={clearCompleted}>Clear completed</button>
      )}
      {todos.length === 0 && <p className="empty">No tasks yet.</p>}
    </div>
  );
}
