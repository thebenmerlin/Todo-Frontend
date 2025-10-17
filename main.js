// API Configuration
const API_URL = 'https://todo-backend-0dru.onrender.com/api/todos';

// DOM Elements - Windows
const todoWindow = document.getElementById('todoWindow');
const gameWindow = document.getElementById('gameWindow');
const notepadWindow = document.getElementById('notepadWindow');
const allWindows = [todoWindow, gameWindow, notepadWindow];

// DOM Elements - Controls
const startBtn = document.getElementById('startBtn');
const startMenu = document.getElementById('startMenu');
const clock = document.getElementById('clock');

// DOM Elements - Desktop Icons
const todoIcon = document.getElementById('todoIcon');
const gameIcon = document.getElementById('gameIcon');
const notepadIcon = document.getElementById('notepadIcon');

// DOM Elements - Taskbar Items
const todoTaskbarBtn = document.getElementById('todoTaskbarBtn');
const gameTaskbarBtn = document.getElementById('gameTaskbarBtn');
const notepadTaskbarBtn = document.getElementById('notepadTaskbarBtn');

// DOM Elements - Todo App
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

// DOM Elements - Game
const gameBoard = document.getElementById('gameBoard');
const gameStatus = document.getElementById('gameStatus');
const restartBtn = document.getElementById('restartBtn');
const gameCells = document.querySelectorAll('.game-cell');

// DOM Elements - Notepad
const notepadText = document.getElementById('notepadText');

// Audio Elements
const addSound = document.getElementById('addSound');
const clickSound = document.getElementById('clickSound');
const winSound = document.getElementById('winSound');

// State
let tasks = [];
let currentWindow = null;
let draggedWindow = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let windowStates = {
    todo: { isMaximized: false, originalPosition: {} },
    game: { isMaximized: false, originalPosition: {} },
    notepad: { isMaximized: false, originalPosition: {} }
};

// Tic Tac Toe State
let gameState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initWindowSystem();
    initTaskbar();
    initStartMenu();
    initDesktopIcons();
    loadTasks();
    initTaskInput();
    initGame();
    initNotepad();
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

// Window System
function initWindowSystem() {
    document.querySelectorAll('.title-bar-button').forEach(button => {
        button.addEventListener('click', handleWindowControl);
    });

    document.querySelectorAll('.title-bar').forEach(titleBar => {
        titleBar.addEventListener('mousedown', startDrag);
    });

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    allWindows.forEach(window => {
        window.addEventListener('mousedown', () => bringToFront(window));
    });
}

function handleWindowControl(e) {
    e.stopPropagation();
    playSound(clickSound);
    
    const action = e.currentTarget.dataset.action;
    const windowId = e.currentTarget.dataset.window;
    const window = document.getElementById(`${windowId}Window`);
    
    switch(action) {
        case 'minimize':
            minimizeWindow(window, windowId);
            break;
        case 'maximize':
            toggleMaximize(window, windowId);
            break;
        case 'close':
            closeWindow(window, windowId);
            break;
    }
}

function openWindow(windowId) {
    playSound(clickSound);
    const window = document.getElementById(`${windowId}Window`);
    const taskbarBtn = document.getElementById(`${windowId}TaskbarBtn`);
    
    window.classList.add('active');
    window.classList.remove('minimized');
    taskbarBtn.classList.add('visible', 'active');
    
    bringToFront(window);
    currentWindow = windowId;
}

function closeWindow(window, windowId) {
    window.classList.remove('active', 'minimized');
    const taskbarBtn = document.getElementById(`${windowId}TaskbarBtn`);
    taskbarBtn.classList.remove('visible', 'active');
    
    if (currentWindow === windowId) {
        currentWindow = null;
    }
}

function minimizeWindow(window, windowId) {
    window.classList.add('minimized');
    const taskbarBtn = document.getElementById(`${windowId}TaskbarBtn`);
    taskbarBtn.classList.remove('active');
}

function toggleMaximize(window, windowId) {
    const state = windowStates[windowId];
    
    if (!state.isMaximized) {
        state.originalPosition = {
            top: window.style.top,
            left: window.style.left,
            width: window.style.width,
            height: window.style.height,
            transform: window.style.transform
        };
        
        window.classList.add('maximized');
        state.isMaximized = true;
    } else {
        window.classList.remove('maximized');
        Object.assign(window.style, state.originalPosition);
        state.isMaximized = false;
    }
}

function bringToFront(window) {
    allWindows.forEach(w => {
        w.style.zIndex = '100';
    });
    window.style.zIndex = '200';
}

// Window Dragging
function startDrag(e) {
    if (e.target.closest('.title-bar-controls')) return;
    
    const titleBar = e.currentTarget;
    const window = titleBar.closest('.window');
    const windowId = titleBar.dataset.window;
    
    if (windowStates[windowId].isMaximized) return;
    
    isDragging = true;
    draggedWindow = window;
    
    const rect = window.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    titleBar.style.cursor = 'grabbing';
    bringToFront(window);
}

function drag(e) {
    if (!isDragging || !draggedWindow) return;
    
    e.preventDefault();
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;
    
    const maxX = window.innerWidth - draggedWindow.offsetWidth;
    const maxY = window.innerHeight - draggedWindow.offsetHeight - 40;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    draggedWindow.style.left = newX + 'px';
    draggedWindow.style.top = newY + 'px';
    draggedWindow.style.transform = 'none';
}

function stopDrag(e) {
    if (isDragging && draggedWindow) {
        const titleBar = draggedWindow.querySelector('.title-bar');
        titleBar.style.cursor = 'move';
    }
    isDragging = false;
    draggedWindow = null;
}

// Taskbar
function initTaskbar() {
    todoTaskbarBtn.addEventListener('click', () => {
        if (todoWindow.classList.contains('minimized') || !todoWindow.classList.contains('active')) {
            openWindow('todo');
        } else {
            minimizeWindow(todoWindow, 'todo');
        }
    });
    
    gameTaskbarBtn.addEventListener('click', () => {
        if (gameWindow.classList.contains('minimized') || !gameWindow.classList.contains('active')) {
            openWindow('game');
        } else {
            minimizeWindow(gameWindow, 'game');
        }
    });
    
    notepadTaskbarBtn.addEventListener('click', () => {
        if (notepadWindow.classList.contains('minimized') || !notepadWindow.classList.contains('active')) {
            openWindow('notepad');
        } else {
            minimizeWindow(notepadWindow, 'notepad');
        }
    });
}

// Start Menu
function initStartMenu() {
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound(clickSound);
        startMenu.classList.toggle('active');
        startBtn.classList.toggle('active');
    });
    
    document.querySelectorAll('.start-menu-item[data-app]').forEach(item => {
        item.addEventListener('click', () => {
            const app = item.dataset.app;
            openWindow(app);
            startMenu.classList.remove('active');
            startBtn.classList.remove('active');
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!startBtn.contains(e.target) && !startMenu.contains(e.target)) {
            startMenu.classList.remove('active');
            startBtn.classList.remove('active');
        }
    });
}

// Desktop Icons
function initDesktopIcons() {
    todoIcon.addEventListener('dblclick', () => {
        openWindow('todo');
    });
    
    gameIcon.addEventListener('dblclick', () => {
        openWindow('game');
    });
    
    notepadIcon.addEventListener('dblclick', () => {
        openWindow('notepad');
    });
}

// Notepad
function initNotepad() {
    // Auto-save to localStorage
    notepadText.addEventListener('input', () => {
        localStorage.setItem('notepadContent', notepadText.value);
    });
    
    // Load saved content
    const savedContent = localStorage.getItem('notepadContent');
    if (savedContent) {
        notepadText.value = savedContent;
    }
}

// Task Input (Todo App)
function initTaskInput() {
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
}

// API Functions (Todo App)
async function loadTasks() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
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
            body: JSON.stringify({ text: text, completed: false }),
        });
        
        if (!response.ok) throw new Error('Failed to add task');
        
        const newTask = await response.json();
        tasks.push(newTask);
        taskInput.value = '';
        renderTasks();
        playSound(addSound);
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task. Please try again.');
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
        
        if (!response.ok) throw new Error('Failed to update task');
        
        const updatedTask = await response.json();
        const index = tasks.findIndex(t => t.id === id);
        tasks[index] = updatedTask;
        renderTasks();
        playSound(clickSound);
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task. Please try again.');
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
        alert('Failed to delete task. Please try again.');
    }
}

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

// Tic Tac Toe Game Logic
function initGame() {
    gameCells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
    
    restartBtn.addEventListener('click', restartGame);
}

function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.dataset.cellIndex);
    
    if (gameState[index] !== '' || !gameActive) {
        return;
    }
    
    playSound(clickSound);
    
    gameState[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add('taken', currentPlayer.toLowerCase());
    
    checkResult();
}

function checkResult() {
    let roundWon = false;
    let winningCombination = [];
    
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (gameState[a] === '' || gameState[b] === '' || gameState[c] === '') {
            continue;
        }
        if (gameState[a] === gameState[b] && gameState[b] === gameState[c]) {
            roundWon = true;
            winningCombination = [a, b, c];
            break;
        }
    }
    
    if (roundWon) {
        gameStatus.textContent = `Player ${currentPlayer} Wins! 🎉`;
        gameActive = false;
        
        winningCombination.forEach(index => {
            gameCells[index].classList.add('winner');
        });
        
        playSound(winSound);
        setTimeout(() => {
            showXPDialog(`Player ${currentPlayer} Wins!`, 'Game Over');
        }, 500);
        return;
    }
    
    if (!gameState.includes('')) {
        gameStatus.textContent = "It's a Draw!";
        gameActive = false;
        setTimeout(() => {
            showXPDialog("It's a Draw!", 'Game Over');
        }, 500);
        return;
    }
    
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    gameStatus.textContent = `Player ${currentPlayer}'s Turn`;
}

function restartGame() {
    playSound(clickSound);
    gameState = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    gameStatus.textContent = `Player ${currentPlayer}'s Turn`;
    
    gameCells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });
}

function showXPDialog(message, title) {
    const dialog = confirm(`${title}\n\n${message}\n\nPlay again?`);
    if (dialog) {
        restartGame();
    }
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

// Make functions globally accessible for inline event handlers
window.toggleTaskCompletion = toggleTaskCompletion;
window.deleteTask = deleteTask;
