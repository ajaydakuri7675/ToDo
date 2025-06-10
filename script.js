document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const helpToggle = document.getElementById('helpToggle');
    const helpModal = document.getElementById('helpModal');
    const taskModal = document.getElementById('taskModal');
    const confirmationModal = document.getElementById('confirmationModal');
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const taskForm = document.getElementById('taskForm');
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const inProgressTasksEl = document.getElementById('inProgressTasks');
    
    // Task-related variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentTaskId = null;
    let currentColumn = null;
    let taskToDelete = null;
    
    // Initialize the app
    init();
    
    function init() {
        // Load tasks from localStorage
        loadTasks();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update stats
        updateStats();
    }
    
    function setupEventListeners() {
        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);
        
        // Help toggle
        helpToggle.addEventListener('click', openHelpModal);
        
        // Add task buttons
        document.querySelectorAll('.add-task').forEach(button => {
            button.addEventListener('click', function() {
                const column = this.closest('.column');
                openTaskModal(column.id);
            });
        });
        
        // Form submission
        taskForm.addEventListener('submit', handleTaskFormSubmit);
        
        // Delete confirmation buttons
        cancelDeleteBtn.addEventListener('click', () => {
            deleteConfirmationModal.classList.remove('modal--active');
        });
        
        confirmDeleteBtn.addEventListener('click', confirmDeleteTask);
        
        // Initialize drag and drop
        initDragAndDrop();
    }
    
    function loadTasks() {
        // Clear all task lists first
        document.querySelectorAll('.task-list').forEach(list => {
            // Keep the add task button
            const addTaskButton = list.querySelector('.add-task');
            list.innerHTML = '';
            if (addTaskButton) {
                list.appendChild(addTaskButton);
            }
        });
        
        // Add tasks to their respective columns
        tasks.forEach(task => {
            addTaskToDOM(task);
        });
        
        // Update column counts
        updateColumnCounts();
    }
    
    function addTaskToDOM(task) {
        const column = document.getElementById(task.column);
        if (!column) return;
        
        const taskList = column.querySelector('.task-list');
        if (!taskList) return;
        
        const taskElement = createTaskElement(task);
        
        // Insert before the add task button
        const addTaskButton = taskList.querySelector('.add-task');
        if (addTaskButton) {
            taskList.insertBefore(taskElement, addTaskButton);
        } else {
            taskList.appendChild(taskElement);
        }
    }
    
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        taskElement.id = `task-${task.id}`;
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;
        
        // Set border color based on task color
        taskElement.style.borderLeftColor = task.color || '#3a86ff';
        
        // Format deadline if it exists
        let deadlineText = '';
        let deadlineClass = '';
        if (task.deadline) {
            const deadlineDate = new Date(task.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const deadlineFormatted = deadlineDate.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            deadlineText = `⏰ ${deadlineFormatted}`;
            
            // Check if deadline is overdue or today
            if (deadlineDate < new Date()) {
                deadlineClass = 'task__deadline--overdue';
            } else if (
                deadlineDate.getDate() === today.getDate() &&
                deadlineDate.getMonth() === today.getMonth() &&
                deadlineDate.getFullYear() === today.getFullYear()
            ) {
                deadlineClass = 'task__deadline--today';
            }
        }
        
        // Create task HTML
        taskElement.innerHTML = `
            <div class="task__header">
                <div class="task__title">${task.title}</div>
                <div class="task__actions">
                    <button class="task__action" data-action="edit">✏️</button>
                    <button class="task__action" data-action="delete">🗑️</button>
                </div>
            </div>
            ${task.description ? `<div class="task__description">${task.description}</div>` : ''}
            ${task.deadline ? `<div class="task__deadline ${deadlineClass}">${deadlineText}</div>` : ''}
            ${task.imageUrl ? `<img src="${task.imageUrl}" class="task__image" alt="Task image">` : ''}
            <div class="task__footer">
                <div class="task__color" style="background-color: ${task.color || '#3a86ff'}"></div>
                <div>${new Date(task.createdAt).toLocaleDateString()}</div>
            </div>
        `;
        
        // Add event listeners to action buttons
        taskElement.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const action = this.getAttribute('data-action');
                
                if (action === 'edit') {
                    editTask(task.id);
                } else if (action === 'delete') {
                    deleteTask(task.id);
                }
            });
        });
        
        return taskElement;
    }
    
    function openTaskModal(columnId, taskId = null) {
        currentColumn = columnId;
        currentTaskId = taskId;
        
        const modalTitle = taskId ? 'Edit Task' : 'New Task';
        taskModal.querySelector('h2').textContent = modalTitle;
        taskModal.querySelector('button[type="submit"]').textContent = taskId ? 'Update Task' : 'Add Task';
        
        // If editing, populate form with task data
        if (taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDescription').value = task.description || '';
                
                if (task.deadline) {
                    const deadline = new Date(task.deadline);
                    const formattedDeadline = deadline.toISOString().slice(0, 16);
                    document.getElementById('taskDeadline').value = formattedDeadline;
                } else {
                    document.getElementById('taskDeadline').value = '';
                }
                
                document.getElementById('taskColor').value = task.color || '#3a86ff';
                document.getElementById('columnType').value = task.column;
            }
        } else {
            // Reset form for new task
            taskForm.reset();
            document.getElementById('taskColor').value = '#3a86ff';
            document.getElementById('columnType').value = columnId;
        }
        
        // Show modal
        taskModal.classList.add('modal--active');
    }
    
    function closeModal() {
        taskModal.classList.remove('modal--active');
    }
    
    function openHelpModal() {
        helpModal.classList.add('modal--active');
    }
    
    function closeHelpModal() {
        helpModal.classList.remove('modal--active');
    }
    
    function handleTaskFormSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        if (!title) {
            showConfirmation('Error', 'Task title is required!', false);
            return;
        }
        
        const description = document.getElementById('taskDescription').value.trim();
        const deadline = document.getElementById('taskDeadline').value;
        const color = document.getElementById('taskColor').value;
        const imageInput = document.getElementById('taskImage');
        const column = document.getElementById('columnType').value;
        
        if (currentTaskId) {
            // Update existing task
            updateTask(currentTaskId, title, description, deadline, color, column, imageInput);
        } else {
            // Create new task
            createTask(title, description, deadline, color, column, imageInput);
        }
    }
    
    function createTask(title, description, deadline, color, column, imageInput) {
        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            color,
            column,
            createdAt: new Date().toISOString(),
            imageUrl: null
        };
        
        // Handle image upload if exists
        if (imageInput.files && imageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                newTask.imageUrl = e.target.result;
                saveTask(newTask);
            };
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            saveTask(newTask);
        }
    }
    
    function updateTask(id, title, description, deadline, color, column, imageInput) {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return;
        
        const updatedTask = {
            ...tasks[taskIndex],
            title,
            description,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            color,
            column
        };
        
        // Handle image upload if exists
        if (imageInput.files && imageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                updatedTask.imageUrl = e.target.result;
                tasks[taskIndex] = updatedTask;
                saveTasks();
            };
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            tasks[taskIndex] = updatedTask;
            saveTasks();
        }
    }
    
    function saveTask(task) {
        tasks.push(task);
        saveTasks();
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTasks();
        updateStats();
        closeModal();
        showConfirmation('Success', currentTaskId ? 'Task updated successfully!' : 'Task added successfully!');
        currentTaskId = null;
    }
    
    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            openTaskModal(task.column, taskId);
        }
    }
    
    function deleteTask(taskId) {
        taskToDelete = taskId;
        deleteConfirmationModal.classList.add('modal--active');
    }
    
    function confirmDeleteTask() {
        if (!taskToDelete) return;
        
        tasks = tasks.filter(task => task.id !== taskToDelete);
        saveTasks();
        deleteConfirmationModal.classList.remove('modal--active');
        showConfirmation('Success', 'Task deleted successfully!');
        taskToDelete = null;
    }
    
    function showConfirmation(title, message, isSuccess = true) {
        const confirmationMessage = document.getElementById('confirmationMessage');
        confirmationMessage.textContent = message;
        
        const checkIcon = confirmationModal.querySelector('.confirmation-check');
        checkIcon.textContent = isSuccess ? '✅' : '❌';
        checkIcon.style.color = isSuccess ? 'var(--success)' : 'var(--danger)';
        
        confirmationModal.querySelector('h3').textContent = title;
        confirmationModal.classList.add('modal--active');
        
        setTimeout(() => {
            confirmationModal.classList.remove('modal--active');
        }, 2000);
    }
    
    function updateStats() {
        totalTasksEl.textContent = tasks.length;
        completedTasksEl.textContent = tasks.filter(task => task.column === 'done').length;
        inProgressTasksEl.textContent = tasks.filter(task => task.column === 'progress').length;
    }
    
    function updateColumnCounts() {
        document.querySelectorAll('.column').forEach(column => {
            const columnId = column.id;
            const count = column.querySelector('.task-list').children.length - 1; // Subtract add task button
            column.querySelector('.column__count').textContent = count;
        });
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
    
    // Drag and drop functionality
    function initDragAndDrop() {
        const taskLists = document.querySelectorAll('.task-list');
        
        taskLists.forEach(list => {
            list.addEventListener('dragover', e => {
                e.preventDefault();
                const draggingTask = document.querySelector('.task--dragging');
                if (!draggingTask) return;
                
                const afterElement = getDragAfterElement(list, e.clientY);
                const addTaskButton = list.querySelector('.add-task');
                
                if (afterElement == null) {
                    list.insertBefore(draggingTask, addTaskButton);
                } else {
                    list.insertBefore(draggingTask, afterElement);
                }
            });
        });
        
        document.querySelectorAll('.task').forEach(task => {
            task.addEventListener('dragstart', () => {
                task.classList.add('task--dragging');
            });
            
            task.addEventListener('dragend', () => {
                task.classList.remove('task--dragging');
                
                // Update task column in the tasks array
                const taskId = task.dataset.taskId;
                const newColumn = task.closest('.column').id;
                
                const taskToUpdate = tasks.find(t => t.id === taskId);
                if (taskToUpdate && taskToUpdate.column !== newColumn) {
                    taskToUpdate.column = newColumn;
                    saveTasks();
                }
            });
        });
    }
    
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task:not(.task--dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeModal();
        }
        if (e.target === helpModal) {
            closeHelpModal();
        }
        if (e.target === deleteConfirmationModal) {
            deleteConfirmationModal.classList.remove('modal--active');
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeHelpModal();
            deleteConfirmationModal.classList.remove('modal--active');
        }
    });
});