// API Configuration
const API_URL = 'https://todo-backend-0dru.onrender.com/api/todos';

// DOM Elements
const todoWindow = document.getElementById('todoWindow');
const titleBar = document.getElementById('titleBar');
const minimizeBtn = document.getElementById('minimizeBtn');
const maximizeBtn = document.getElementById('maximizeBtn');
const closeBtn = document.getElementById('closeBtn');
const startBtn = document.getElementById('startBtn');
const startMenu = document.getElementById('startMenu');
const todoTaskbarBtn = document.getElementById('todoTaskbarBtn');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const clock = document.getElementById('clock');
const addSound = document.getElementById('addSound');
const clickSound = document.getElementById('clickSound');

// State
let tasks = [];
let isDragging = false;
let isMaximized = false;
let dragOffset = { x: 0, y: 0 };
let originalPosition = { top: '', left: '', width: '', height: '', transform: '' };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initWindowDrag();
    initWindowControls();
    initTaskbar();
    loadTasks();
    initTaskInput();
});

// Clock
function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    clock.textContent = `${hours}:${minutesStr} ${ampm}`;
}

// Window Dragging
function initWindowDrag() {
    titleBar.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

function startDrag(e) {
    if (e.target.closest('.title-bar-controls')) return;
    if (isMaximized) return;
    
    isDragging = true;
    const rect = todoWindow.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    titleBar.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;
    
    // Boundary constraints
    const maxX = window.innerWidth - todoWindow.offsetWidth;
    const maxY = window.innerHeight - todoWindow.offsetHeight - 40;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    todoWindow.style.left = newX + 'px';
    todoWindow.style.top = newY + 'px';
    todoWindow.style.transform = 'none';
}

function stopDrag() {
    isDragging = false;
    titleBar.style.cursor = 'move';
}

// Window Controls
function initWindowControls() {
    minimizeBtn.addEventListener('click', () => {
        playSound(clickSound);
        todoWindow.classList.add('minimized');
        todoTaskbarBtn.classList.remove('active');
    });
    
    maximizeBtn.addEventListener('click', () => {
        playSound(clickSound);
        toggleMaximize();
    });
    
    closeBtn.addEventListener('click', () => {
        playSound(clickSound);
        todoWindow.classList.add('minimized');
        todoTaskbarBtn.classList.remove('active');
    });
}

function toggleMaximize() {
    if (!isMaximized) {
        // Save original position
        originalPosition.top = todoWindow.style.top;
        originalPosition.left = todoWindow.style.left;
        originalPosition.width = todoWindow.style.width;
        originalPosition.height = todoWindow.style.height;
        originalPosition.transform = todoWindow.style.transform;
        
        todoWindow.classList.add('maximized');
        isMaximized = true;
    } else {
        // Restore original position
        todoWindow.classList.remove('maximized');
        todoWindow.style.top = originalPosition.top;
        todoWindow.style.left = originalPosition.left;
        todoWindow.style.width = originalPosition.width;
        todoWindow.style.height = originalPosition.height;
        todoWindow.style.transform = originalPosition.transform;
        isMaximized = false;
    }
}

// Taskbar
function initTaskbar() {
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound(clickSound);
        startMenu.classList.toggle('active');
        startBtn.classList.toggle('active');
    });
    
    todoTaskbarBtn.addEventListener('click', () => {
        playSound(clickSound);
        if (todoWindow.classList.contains('minimized')) {
            todoWindow.classList.remove('minimized');
            todoTaskbarBtn.classList.add('active');
        } else {
            todoWindow.classList.add('minimized');
            todoTaskbarBtn.classList.remove('active');
        }
    });
    
    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!startBtn.contains(e.target) && !startMenu.contains(e.target)) {
            startMenu.classList.remove('active');
            startBtn.classList.remove('active');
        }
    });
}

// Task Input
function initTaskInput() {
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
}

// API Functions
async function loadTasks() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        tasks = await response.json();
        console.log('Loaded tasks:', tasks);
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showError('Failed to load tasks. Please check your connection.');
    }
}

async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Backend expects 'title' but we'll send 'text' and backend will handle both
            body: JSON.stringify({ text: text, completed: false }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error('Failed to add task');
        }
        
        const newTask = await response.json();
        console.log('Added task:', newTask);
        tasks.push(newTask);
        taskInput.value = '';
        renderTasks();
        playSound(addSound);
    } catch (error) {
        console.error('Error adding task:', error);
        showError('Failed to add task. Please try again.');
    }
}

async function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: !task.completed }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error('Failed to update task');
        }
        
        const updatedTask = await response.json();
        console.log('Updated task:', updatedTask);
        const index = tasks.findIndex(t => t.id === id);
        tasks[index] = updatedTask;
        renderTasks();
        playSound(clickSound);
    } catch (error) {
        console.error('Error updating task:', error);
        showError('Failed to update task. Please try again.');
    }
}

async function deleteTask(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete task');
        
        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== id);
                renderTasks();
            }, 200);
        }
        playSound(clickSound);
    } catch (error) {
        console.error('Error deleting task:', error);
        showError('Failed to delete task. Please try again.');
    }
}

// Render Tasks
function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<div style="text-align: center; color: #333; padding: 20px; font-size: 13px; background: #FAFAFA; border: 1px dashed #BFC9CA; border-radius: 3px;">No tasks yet. Add one to get started!</div>';
        return;
    }
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.setAttribute('data-task-id', task.id);
        
        // Backend uses 'title' field
        const taskText = task.title || task.text || 'Untitled Task';
        
        taskElement.innerHTML = `
            <div class="task-text">${escapeHtml(taskText)}</div>
            <div class="task-buttons">
                <button class="task-button done" onclick="toggleTaskCompletion('${task.id}')">
                    ${task.completed ? 'Undo' : 'Done'}
                </button>
                <button class="task-button delete" onclick="deleteTask('${task.id}')">Delete</button>
            </div>
        `;
        
        taskList.appendChild(taskElement);
    });
}

// Utility Functions
function playSound(audioElement) {
    audioElement.currentTime = 0;
    audioElement.play().catch(e => console.log('Audio play failed:', e));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    // Simple error display - could be enhanced with XP-style dialog
    console.error(message);
    alert(message);
}

// Make functions globally accessible for inline event handlers
window.toggleTaskCompletion = toggleTaskCompletion;
window.deleteTask = deleteTask;
