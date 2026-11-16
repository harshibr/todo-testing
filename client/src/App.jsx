import { useEffect, useState } from 'react';

const API = '/api/todos';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

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
            <span className={t.completed ? 'done' : ''} onClick={() => toggle(t)}>
              {t.text}
            </span>
            <button className="del" onClick={() => remove(t._id)}>✕</button>
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
