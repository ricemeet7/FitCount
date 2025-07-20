class TrainoteApp {
    constructor() {
        this.records = this.loadRecords();
        this.currentSort = { field: 'date', direction: 'desc' };
        this.currentView = 'table';
        this.filters = {
            search: '',
            exercise: '',
            date: ''
        };
        this.editingIndex = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
        this.renderRecords();
        this.updateFilters();
        this.setupTheme();
        this.populateExerciseSuggestions();
        
        // Set today's date as default
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('add-workout-btn').addEventListener('click', () => this.openModal());
        document.getElementById('empty-add-btn').addEventListener('click', () => this.openModal());
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeModal());
        
        // Form submission
        document.getElementById('workout-form').addEventListener('submit', (e) => this.saveRecord(e));
        
        // Search and filters
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('exercise-filter').addEventListener('change', (e) => this.handleFilter(e));
        document.getElementById('date-filter').addEventListener('change', (e) => this.handleFilter(e));
        document.getElementById('clear-filters').addEventListener('click', () => this.clearFilters());
        
        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleView(e));
        });
        
        // Table sorting
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', (e) => this.handleSort(e));
        });
        
        // Header actions
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-btn').addEventListener('click', () => this.importData());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
        // File input for import
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileImport(e));
        
        // Modal overlay click to close
        document.getElementById('workout-modal').addEventListener('click', (e) => {
            if (e.target.id === 'workout-modal') this.closeModal();
        });
        
        // Tag suggestions
        document.getElementById('tags').addEventListener('input', () => this.updateTagSuggestions());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // Data management
    loadRecords() {
        try {
            return JSON.parse(localStorage.getItem('trainote_records') || '[]');
        } catch (error) {
            console.error('Error loading records:', error);
            return [];
        }
    }

    saveRecords() {
        try {
            localStorage.setItem('trainote_records', JSON.stringify(this.records));
        } catch (error) {
            console.error('Error saving records:', error);
            this.showToast('Error saving data', 'error');
        }
    }

    saveRecord(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const record = {
            id: this.editingIndex !== null ? this.records[this.editingIndex].id : Date.now(),
            date: formData.get('date') || document.getElementById('date').value,
            exercise: formData.get('exercise') || document.getElementById('exercise').value,
            weight: parseFloat(document.getElementById('weight').value) || 0,
            reps: parseInt(document.getElementById('reps').value) || 0,
            sets: parseInt(document.getElementById('sets').value) || 0,
            restTime: parseFloat(document.getElementById('rest-time').value) || 0,
            comment: document.getElementById('comment').value,
            tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            createdAt: this.editingIndex !== null ? this.records[this.editingIndex].createdAt : new Date().toISOString()
        };

        // Validation
        if (!record.exercise) {
            this.showToast('Exercise name is required', 'error');
            return;
        }

        if (this.editingIndex !== null) {
            this.records[this.editingIndex] = record;
            this.showToast('Workout updated successfully', 'success');
        } else {
            this.records.push(record);
            this.showToast('Workout added successfully', 'success');
        }

        this.saveRecords();
        this.updateStats();
        this.renderRecords();
        this.updateFilters();
        this.populateExerciseSuggestions();
        this.closeModal();
    }

    editRecord(index) {
        const record = this.records[index];
        this.editingIndex = index;
        
        document.getElementById('modal-title').textContent = 'Edit Workout';
        document.getElementById('date').value = record.date;
        document.getElementById('exercise').value = record.exercise;
        document.getElementById('weight').value = record.weight || '';
        document.getElementById('reps').value = record.reps || '';
        document.getElementById('sets').value = record.sets || '';
        document.getElementById('rest-time').value = record.restTime || '';
        document.getElementById('comment').value = record.comment || '';
        document.getElementById('tags').value = record.tags ? record.tags.join(', ') : '';
        
        this.openModal();
    }

    deleteRecord(index) {
        if (confirm('Are you sure you want to delete this workout?')) {
            this.records.splice(index, 1);
            this.saveRecords();
            this.updateStats();
            this.renderRecords();
            this.updateFilters();
            this.showToast('Workout deleted', 'success');
        }
    }

    duplicateRecord(index) {
        const record = { ...this.records[index] };
        record.id = Date.now();
        record.date = new Date().toISOString().split('T')[0];
        record.createdAt = new Date().toISOString();
        
        this.records.push(record);
        this.saveRecords();
        this.updateStats();
        this.renderRecords();
        this.showToast('Workout duplicated', 'success');
    }

    // UI Management
    openModal() {
        if (this.editingIndex === null) {
            document.getElementById('modal-title').textContent = 'Add New Workout';
            document.getElementById('workout-form').reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
        }
        document.getElementById('workout-modal').classList.remove('hidden');
        document.getElementById('exercise').focus();
    }

    closeModal() {
        document.getElementById('workout-modal').classList.add('hidden');
        this.editingIndex = null;
        document.getElementById('workout-form').reset();
    }

    toggleView(e) {
        const view = e.target.dataset.view;
        this.currentView = view;
        
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        if (view === 'table') {
            document.getElementById('table-view').classList.remove('hidden');
            document.getElementById('cards-view').classList.add('hidden');
        } else {
            document.getElementById('table-view').classList.add('hidden');
            document.getElementById('cards-view').classList.remove('hidden');
        }
        
        this.renderRecords();
    }

    // Statistics
    updateStats() {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const thisWeekRecords = this.records.filter(record => 
            new Date(record.date) >= weekStart
        );
        
        const totalVolume = this.records.reduce((sum, record) => 
            sum + (record.weight * record.reps * record.sets), 0
        );
        
        const streak = this.calculateStreak();
        
        document.getElementById('total-workouts').textContent = this.records.length;
        document.getElementById('this-week').textContent = thisWeekRecords.length;
        document.getElementById('streak').textContent = streak;
        document.getElementById('total-volume').textContent = `${totalVolume.toLocaleString()}kg`;
    }

    calculateStreak() {
        if (this.records.length === 0) return 0;
        
        const sortedDates = [...new Set(this.records.map(r => r.date))].sort().reverse();
        let streak = 0;
        let currentDate = new Date();
        
        for (const dateStr of sortedDates) {
            const recordDate = new Date(dateStr);
            const diffDays = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= streak + 1) {
                streak++;
                currentDate = recordDate;
            } else {
                break;
            }
        }
        
        return streak;
    }

    // Rendering
    renderRecords() {
        const filteredRecords = this.getFilteredRecords();
        
        if (filteredRecords.length === 0) {
            document.getElementById('empty-state').classList.remove('hidden');
            document.getElementById('table-view').classList.add('hidden');
            document.getElementById('cards-view').classList.add('hidden');
            return;
        }
        
        document.getElementById('empty-state').classList.add('hidden');
        
        if (this.currentView === 'table') {
            this.renderTable(filteredRecords);
        } else {
            this.renderCards(filteredRecords);
        }
    }

    renderTable(records) {
        const tbody = document.getElementById('records-tbody');
        tbody.innerHTML = '';
        
        records.forEach((record, index) => {
            const originalIndex = this.records.indexOf(record);
            const tr = document.createElement('tr');
            
            const volume = record.weight * record.reps * record.sets;
            const tags = record.tags ? record.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('') : '';
            
            tr.innerHTML = `
                <td>${this.formatDate(record.date)}</td>
                <td class="font-bold">${record.exercise}</td>
                <td>${record.weight ? record.weight + 'kg' : '-'}</td>
                <td>${record.reps || '-'}</td>
                <td>${record.sets || '-'}</td>
                <td>${volume ? volume.toLocaleString() + 'kg' : '-'}</td>
                <td>${tags}</td>
                <td class="actions">
                    <button class="btn btn-small btn-secondary" onclick="app.editRecord(${originalIndex})">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="app.duplicateRecord(${originalIndex})">
                        📋 Copy
                    </button>
                    <button class="btn btn-small btn-error" onclick="app.deleteRecord(${originalIndex})">
                        🗑️ Delete
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    renderCards(records) {
        const container = document.getElementById('cards-view');
        container.innerHTML = '';
        
        records.forEach((record, index) => {
            const originalIndex = this.records.indexOf(record);
            const volume = record.weight * record.reps * record.sets;
            const tags = record.tags ? record.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('') : '';
            
            const card = document.createElement('div');
            card.className = 'record-card';
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-exercise">${record.exercise}</div>
                    <div class="card-date">${this.formatDate(record.date)}</div>
                </div>
                <div class="card-stats">
                    <div class="card-stat">
                        <div class="card-stat-value">${record.weight || '-'}</div>
                        <div class="card-stat-label">Weight (kg)</div>
                    </div>
                    <div class="card-stat">
                        <div class="card-stat-value">${record.reps || '-'}</div>
                        <div class="card-stat-label">Reps</div>
                    </div>
                    <div class="card-stat">
                        <div class="card-stat-value">${record.sets || '-'}</div>
                        <div class="card-stat-label">Sets</div>
                    </div>
                </div>
                ${volume ? `<div class="text-center text-sm"><strong>Volume: ${volume.toLocaleString()}kg</strong></div>` : ''}
                ${record.comment ? `<div class="text-sm" style="margin: 8px 0; color: var(--text-secondary);">${record.comment}</div>` : ''}
                ${tags ? `<div class="card-tags">${tags}</div>` : ''}
                <div class="card-actions">
                    <button class="btn btn-small btn-secondary" onclick="app.editRecord(${originalIndex})">
                        ✏️
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="app.duplicateRecord(${originalIndex})">
                        📋
                    </button>
                    <button class="btn btn-small btn-error" onclick="app.deleteRecord(${originalIndex})">
                        🗑️
                    </button>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    // Filtering and Sorting
    getFilteredRecords() {
        let filtered = [...this.records];
        
        // Search filter
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(record => 
                record.exercise.toLowerCase().includes(search) ||
                (record.comment && record.comment.toLowerCase().includes(search)) ||
                (record.tags && record.tags.some(tag => tag.toLowerCase().includes(search)))
            );
        }
        
        // Exercise filter
        if (this.filters.exercise) {
            filtered = filtered.filter(record => record.exercise === this.filters.exercise);
        }
        
        // Date filter
        if (this.filters.date) {
            const now = new Date();
            let startDate;
            
            switch (this.filters.date) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
            }
            
            if (startDate) {
                filtered = filtered.filter(record => new Date(record.date) >= startDate);
            }
        }
        
        // Sort
        filtered.sort((a, b) => {
            let aVal = a[this.currentSort.field];
            let bVal = b[this.currentSort.field];
            
            if (this.currentSort.field === 'date') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (aVal < bVal) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return filtered;
    }

    handleSearch(e) {
        this.filters.search = e.target.value;
        this.renderRecords();
    }

    handleFilter(e) {
        const filterType = e.target.id.replace('-filter', '');
        this.filters[filterType] = e.target.value;
        this.renderRecords();
    }

    clearFilters() {
        this.filters = { search: '', exercise: '', date: '' };
        document.getElementById('search-input').value = '';
        document.getElementById('exercise-filter').value = '';
        document.getElementById('date-filter').value = '';
        this.renderRecords();
    }

    handleSort(e) {
        const field = e.target.dataset.sort;
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }
        
        // Update sort icons
        document.querySelectorAll('.sort-icon').forEach(icon => {
            icon.textContent = '↕️';
        });
        
        const icon = e.target.querySelector('.sort-icon');
        icon.textContent = this.currentSort.direction === 'asc' ? '↑' : '↓';
        
        this.renderRecords();
    }

    updateFilters() {
        const exercises = [...new Set(this.records.map(r => r.exercise))].sort();
        const exerciseFilter = document.getElementById('exercise-filter');
        
        // Clear existing options except "All Exercises"
        exerciseFilter.innerHTML = '<option value="">All Exercises</option>';
        
        exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            option.textContent = exercise;
            exerciseFilter.appendChild(option);
        });
    }

    populateExerciseSuggestions() {
        const exercises = [...new Set(this.records.map(r => r.exercise))].sort();
        const datalist = document.getElementById('exercise-suggestions');
        
        datalist.innerHTML = '';
        exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            datalist.appendChild(option);
        });
    }

    updateTagSuggestions() {
        const allTags = [...new Set(this.records.flatMap(r => r.tags || []))];
        const currentTags = document.getElementById('tags').value.split(',').map(t => t.trim());
        const availableTags = allTags.filter(tag => !currentTags.includes(tag));
        
        const container = document.getElementById('tag-suggestions');
        container.innerHTML = '';
        
        availableTags.slice(0, 10).forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag-suggestion';
            span.textContent = tag;
            span.addEventListener('click', () => {
                const input = document.getElementById('tags');
                const current = input.value.trim();
                input.value = current ? `${current}, ${tag}` : tag;
                this.updateTagSuggestions();
            });
            container.appendChild(span);
        });
    }

    // Import/Export
    exportData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            records: this.records
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trainote-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully', 'success');
    }

    importData() {
        document.getElementById('file-input').click();
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.records && Array.isArray(data.records)) {
                    if (confirm(`Import ${data.records.length} records? This will merge with existing data.`)) {
                        // Merge records, avoiding duplicates based on ID
                        const existingIds = new Set(this.records.map(r => r.id));
                        const newRecords = data.records.filter(r => !existingIds.has(r.id));
                        
                        this.records.push(...newRecords);
                        this.saveRecords();
                        this.updateStats();
                        this.renderRecords();
                        this.updateFilters();
                        this.populateExerciseSuggestions();
                        
                        this.showToast(`Imported ${newRecords.length} new records`, 'success');
                    }
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Error importing file', 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    }

    // Theme management
    setupTheme() {
        const savedTheme = localStorage.getItem('trainote_theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('trainote_theme', theme);
        
        const themeBtn = document.getElementById('theme-toggle');
        const icon = themeBtn.querySelector('.icon');
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // Utilities
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.getElementById('toast-container').appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    handleKeyboard(e) {
        // Ctrl/Cmd + N: New workout
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.openModal();
        }
        
        // Escape: Close modal
        if (e.key === 'Escape') {
            this.closeModal();
        }
        
        // Ctrl/Cmd + E: Export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.exportData();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TrainoteApp();
});

// Make app globally available for onclick handlers
window.app = null;