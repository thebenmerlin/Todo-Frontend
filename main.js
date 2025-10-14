const API_BASE_URL = "https://todo-backend-0dru.onrender.com/api/todos";

const todoList = document.getElementById("todo-list");
const addBtn = document.getElementById("add-btn");
const titleInput = document.getElementById("todo-title");

async function fetchTodos() {
  try {
    const res = await fetch(API_BASE_URL);
    const todos = await res.json();
    renderTodos(todos);
  } catch (error) {
    console.error("Failed to fetch todos:", error);
  }
}

function renderTodos(todos) {
  todoList.innerHTML = "";
  if (todos.length === 0) {
    todoList.innerHTML = `<p style="text-align:center;color:#555;">No tasks yet. Add one!</p>`;
    return;
  }

  todos.forEach(todo => {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "completed" : ""}`;
    li.innerHTML = `
      <span>${todo.title}</span>
      <div class="todo-actions">
        <button class="done-btn" onclick="toggleTodo('${todo.id}', ${!todo.completed})">
          ${todo.completed ? "Undo" : "Done"}
        </button>
        <button class="delete-btn" onclick="deleteTodo('${todo.id}')">✕</button>
      </div>
    `;
    todoList.appendChild(li);
  });
}

addBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  if (!title) return;

  await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, completed: false })
  });

  titleInput.value = "";
  fetchTodos();
});

async function toggleTodo(id, completed) {
  await fetch(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed })
  });
  fetchTodos();
}

async function deleteTodo(id) {
  await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  fetchTodos();
}

fetchTodos();
