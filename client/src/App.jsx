import { useEffect, useState } from 'react';
import Auth from './Auth';

const API = `${import.meta.env.VITE_API_URL || ''}/api/todos`;

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setTodos([]);
  };

  const handleAuth = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  useEffect(() => {
    if (!token) return;
    fetch(API, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (r.status === 401) { logout(); return null; } return r.json(); })
      .then((data) => { if (data) setTodos(data); })
      .catch(() => {});
  }, [token]);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch(API, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text, description }),
    });
    if (res.status === 401) { logout(); return; }
    const todo = await res.json();
    setTodos([todo, ...todos]);
    setText('');
    setDescription('');
  };

  const toggle = async (todo) => {
    const res = await fetch(`${API}/${todo._id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ completed: !todo.completed }),
    });
    if (res.status === 401) { logout(); return; }
    const updated = await res.json();
    setTodos(todos.map((t) => (t._id === updated._id ? updated : t)));
  };

  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditText(todo.text);
    setEditDescription(todo.description || '');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (todo) => {
    const next = editText.trim();
    const nextDescription = editDescription.trim();
    setEditingId(null);
    if (!next || (next === todo.text && nextDescription === (todo.description || ''))) return;
    const res = await fetch(`${API}/${todo._id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ text: next, description: nextDescription }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setTodos((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  };

  const remove = async (id) => {
    await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders });
    setTodos(todos.filter((t) => t._id !== id));
  };

  const clearCompleted = async () => {
    await fetch(`${API}/completed`, { method: 'DELETE', headers: authHeaders });
    setTodos(todos.filter((t) => !t.completed));
  };

  const doneCount = todos.filter((t) => t.completed).length;
  const hasCompleted = doneCount > 0;
  const onEditBlur = (todo) => (e) => {
    if (e.relatedTarget && e.relatedTarget.dataset.editFor === todo._id) return;
    saveEdit(todo);
  };
  const onEditKey = (e) => {
    if (e.key === 'Enter') e.currentTarget.blur();
    if (e.key === 'Escape') cancelEdit();
  };

  return (
    <div className="app">
      <h1>Todo List</h1>
      {!token ? (
        <Auth onAuth={handleAuth} />
      ) : (
        <>
          <div className="user-bar">
            <span className="user-email">{user?.email}</span>
            <button type="button" className="logout" onClick={logout}>Logout</button>
          </div>
          <form onSubmit={addTodo}>
            <div className="fields">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task..." />
              <input
                className="desc-input"
                aria-label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
              />
            </div>
            <button type="submit">Add</button>
          </form>
          {todos.length > 0 && (
            <p className="count">{doneCount} of {todos.length} done</p>
          )}
          <ul>
            {todos.map((t) => (
              <li key={t._id}>
                {editingId === t._id ? (
                  <>
                    <input
                      className="edit"
                      aria-label="Edit task"
                      data-edit-for={t._id}
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={onEditBlur(t)}
                      onKeyDown={onEditKey}
                    />
                    <input
                      className="edit edit-desc"
                      aria-label="Edit description"
                      data-edit-for={t._id}
                      placeholder="Description (optional)"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      onBlur={onEditBlur(t)}
                      onKeyDown={onEditKey}
                    />
                  </>
                ) : (
                  <>
                    <span
                      className={`title${t.completed ? ' done' : ''}`}
                      title="Click to toggle"
                      onClick={() => toggle(t)}
                    >
                      {t.text}
                    </span>
                    {t.description && <p className={`desc${t.completed ? ' done' : ''}`}>{t.description}</p>}
                  </>
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
          {todos.length === 0 && <p className="empty">No tasks yet. Add your first one above.</p>}
        </>
      )}
    </div>
  );
}
