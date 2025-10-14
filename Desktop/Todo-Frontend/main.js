const API_BASE_URL = "https://todo-backend-0dru.onrender.com/api/todos";

const todoList = document.getElementById("todo-list");
const addBtn = document.getElementById("add-btn");
const titleInput = document.getElementById("todo-title");

async function fetchTodos() {
  const res = await fetch(API_BASE_URL);
  const todos = await res.json();
  renderTodos(todos);
}

function renderTodos(todos) {
  todoList.innerHTML = "";
  todos.forEach(todo => {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "completed" : ""}`;
    li.innerHTML = `
      <span>${todo.title}</span>
      <div>
        <button onclick="toggleTodo('${todo.id}', ${!todo.completed})">
          ${todo.completed ? "Undo" : "Done"}
        </button>
        <button class="delete-btn" onclick="deleteTodo('${todo.id}')">Delete</button>
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