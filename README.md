# MERN Todo

A simple todo app built with MongoDB, Express, React (Vite) and Node.

## Structure

- `server/` – Express + Mongoose REST API (`/api/todos`)
- `client/` – React frontend (Vite, proxies `/api` to the server)

## Setup

1. Install [Node.js](https://nodejs.org) and MongoDB (local or Atlas).
2. Install dependencies:

   ```bash
   npm run install:all
   ```

3. Create `server/.env`:

   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/mern-todo
   ```

4. Start MongoDB, then run both server and client:

   ```bash
   npm run dev
   ```

5. Open http://localhost:5173

## API

| Method | Endpoint         | Description      |
| ------ | ---------------- | ---------------- |
| GET    | `/api/todos`     | List todos       |
| POST   | `/api/todos`     | Create (`text`)  |
| PUT    | `/api/todos/:id` | Update a todo    |
| DELETE | `/api/todos/:id` | Delete a todo    |
