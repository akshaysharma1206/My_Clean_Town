// admin-dashboard.js - Admin Dashboard Functionality

let currentFilters = {
    status: 'all',
    category: 'all',
    urgency: 'all',
    search: ''
};

let currentIssueId = null;
let previousStats = {
    users: 0,
    issues: 0,
    pending: 0,
    resolved: 0
};

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    const icon = notification.querySelector('.notification-icon');
    const messageEl = notification.querySelector('.notification-message');

    icon.className = 'notification-icon';
    if (type === 'success') {
        icon.classList.add('fas', 'fa-check-circle');
        notification.className = 'notification success';
    } else {
        icon.classList.add('fas', 'fa-exclamation-circle');
        notification.className = 'notification error';
    }

    messageEl.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Show loading overlay
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }
}

// Hide loading overlay
function hideLoading() {
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }, 300);
}

// Check authentication
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return null;
    }

    return currentUser;
}

// Logout function
function logout() {
    showLoading();
    if (!confirm('Are you sure you want to logout?')) {
        hideLoading();
        return;
    }
    localStorage.removeItem('currentUser');
    showNotification('Logged out successfully');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Update user interface
function updateUserInterface(user) {
    const userNameElement = document.querySelector('.user-info h4');
    if (userNameElement) {
        userNameElement.textContent = user.name || 'Administrator';
    }
}

// Load and update statistics
function loadStatistics() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const issues = JSON.parse(localStorage.getItem('civicIssues')) || [];

    const totalUsers = users.length;
    const totalIssues = issues.length;
    const pendingIssues = issues.filter(issue => issue.status !== 'Resolved').length;
    const resolvedIssues = issues.filter(issue => issue.status === 'Resolved').length;

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalIssues').textContent = totalIssues;
    document.getElementById('pendingIssues').textContent = pendingIssues;
    document.getElementById('resolvedIssues').textContent = resolvedIssues;

    if (totalUsers > previousStats.users) {
        showNotification(`A new user just registered!`, 'success');
    }
    if (totalIssues > previousStats.issues) {
        showNotification(`A new issue has been reported!`, 'success');
    }
    if (pendingIssues < previousStats.pending) {
        showNotification(`An issue has been resolved!`, 'success');
    }

    previousStats = {
        users: totalUsers,
        issues: totalIssues,
        pending: pendingIssues,
        resolved: resolvedIssues
    };
}

// Load and display issues
function loadIssues() {
    const issuesTableBody = document.getElementById('issuesTableBody');
    const emptyState = document.querySelector('#issuesSection .empty-state');
    if (!issuesTableBody) return;

    showLoading();
    
    setTimeout(() => {
        const issues = JSON.parse(localStorage.getItem('civicIssues')) || [];
        issuesTableBody.innerHTML = '';
        
        let filteredIssues = issues;

        if (currentFilters.status !== 'all') {
            filteredIssues = filteredIssues.filter(issue => issue.status === currentFilters.status);
        }
        if (currentFilters.category !== 'all') {
            filteredIssues = filteredIssues.filter(issue => issue.category === currentFilters.category);
        }
        if (currentFilters.urgency !== 'all') {
            filteredIssues = filteredIssues.filter(issue => issue.urgency === currentFilters.urgency);
        }
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            filteredIssues = filteredIssues.filter(issue =>
                issue.title.toLowerCase().includes(searchTerm) ||
                issue.description.toLowerCase().includes(searchTerm) ||
                issue.reportedBy.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredIssues.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            filteredIssues.sort((a, b) => b.id - a.id).forEach(issue => {
                const issueElement = createIssueElement(issue);
                issuesTableBody.appendChild(issueElement);
            });
        }

        hideLoading();
    }, 500);
}

// Create a single row for the issues table
function createIssueElement(issue) {
    const issueElement = document.createElement('tr');

    const statusClasses = {
        'Reported': 'status-reported',
        'Confirmed': 'status-confirmed',
        'In Progress': 'status-in-progress',
        'Resolved': 'status-resolved'
    };

    issueElement.innerHTML = `
        <td><div class="cell-content">${issue.title}</div></td>
        <td><div class="cell-content">${issue.category}</div></td>
        <td><div class="cell-content"><span class="status-badge ${statusClasses[issue.status]}">${issue.status}</span></div></td>
        <td><div class="cell-content">${issue.urgency}</div></td>
        <td><div class="cell-content">${issue.reportedBy}</div></td>
        <td><div class="cell-content">${new Date(issue.timestamp).toLocaleDateString()}</div></td>
        <td><div class="cell-content action-buttons">
            <button class="btn-sm btn-primary" onclick="openStatusModal(${issue.id})"><i class="fas fa-edit"></i> Update</button>
            <button class="btn-sm btn-danger" onclick="deleteIssue(${issue.id})"><i class="fas fa-trash-alt"></i> Delete</button>
        </div></td>
    `;
    return issueElement;
}

// Open the status update modal
function openStatusModal(issueId) {
    const issues = JSON.parse(localStorage.getItem('civicIssues')) || [];
    const issue = issues.find(i => i.id === issueId);

    if (!issue) {
        showNotification('Issue not found', 'error');
        return;
    }

    currentIssueId = issueId;
    document.getElementById('modalIssueTitle').textContent = issue.title;
    document.getElementById('statusSelect').value = issue.status;
    document.getElementById('statusNotes').value = issue.notes || '';
    document.getElementById('statusModal').classList.add('show');
}

// Close the modal
function closeModal() {
    document.getElementById('statusModal').classList.remove('show');
    currentIssueId = null;
}

// Confirm and save status update
function confirmStatusUpdate() {
    if (currentIssueId === null) {
        showNotification('No issue selected', 'error');
        return;
    }

    let issues = JSON.parse(localStorage.getItem('civicIssues')) || [];
    const issueIndex = issues.findIndex(i => i.id === currentIssueId);

    if (issueIndex === -1) {
        showNotification('Issue not found', 'error');
        return;
    }

    const newStatus = document.getElementById('statusSelect').value;
    const notes = document.getElementById('statusNotes').value;

    issues[issueIndex].status = newStatus;
    issues[issueIndex].notes = notes;

    localStorage.setItem('civicIssues', JSON.stringify(issues));

    closeModal();
    loadIssues();
    loadStatistics();
    showNotification(`Status for "${issues[issueIndex].title}" updated successfully!`, 'success');
}

// Delete an issue
function deleteIssue(issueId) {
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
        return;
    }

    let issues = JSON.parse(localStorage.getItem('civicIssues')) || [];
    const updatedIssues = issues.filter(issue => issue.id !== issueId);

    localStorage.setItem('civicIssues', JSON.stringify(updatedIssues));

    loadIssues();
    loadStatistics();
    showNotification('Issue deleted successfully!', 'success');
}

// Load all users
function loadUsers() {
    const usersTableBody = document.getElementById('usersTableBody');
    const emptyState = document.querySelector('#usersSection .empty-state');
    if (!usersTableBody) return;

    showLoading();

    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        usersTableBody.innerHTML = '';
        
        if (users.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            users.forEach(user => {
                const userElement = createUserElement(user);
                usersTableBody.appendChild(userElement);
            });
        }

        hideLoading();
    }, 500);
}

// Create user list item element
function createUserElement(user) {
    const userElement = document.createElement('tr');

    userElement.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span class="role-badge">${user.role || 'Community Member'}</span></td>
        <td>${new Date(user.joined).toLocaleDateString()}</td>
        <td>
            <button class="btn-sm btn-danger" onclick="deleteUser('${user.email}')"><i class="fas fa-trash-alt"></i> Delete</button>
        </td>
    `;
    return userElement;
}

// Delete a user
function deleteUser(email) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const updatedUsers = users.filter(user => user.email !== email);
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    loadUsers();
    loadStatistics();
    showNotification('User deleted successfully!', 'success');
}

// Handle sidebar navigation
function handleNavigation(sectionId) {
    document.querySelectorAll('.dashboard-content .content-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNavItem = document.querySelector(`.nav-menu a[href="#${sectionId.replace('Section', '')}"]`).closest('.nav-item');
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    if (sectionId === 'issuesSection') {
        loadIssues();
    } else if (sectionId === 'overviewSection') {
        loadStatistics();
    } else if (sectionId === 'usersSection') {
        loadUsers();
    }
}

// Setup event listeners for filters and actions
function setupEventListeners() {
    const filterStatus = document.getElementById('filterStatus');
    const filterCategory = document.getElementById('filterCategory');
    const filterUrgency = document.getElementById('filterUrgency');
    const searchInput = document.getElementById('searchInput');

    if (filterStatus) {
        filterStatus.addEventListener('change', function() {
            currentFilters.status = this.value;
            loadIssues();
        });
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', function() {
            currentFilters.category = this.value;
            loadIssues();
        });
    }

    if (filterUrgency) {
        filterUrgency.addEventListener('change', function() {
            currentFilters.urgency = this.value;
            loadIssues();
        });
    }

    if (searchInput) {
        let debounceTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                currentFilters.search = this.value;
                loadIssues();
            }, 300);
        });
    }
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadStatistics();
            loadIssues();
            showNotification('Dashboard refreshed');
        });
    }

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            if (filterStatus) filterStatus.value = 'all';
            if (filterCategory) filterCategory.value = 'all';
            if (filterUrgency) filterUrgency.value = 'all';
            if (searchInput) searchInput.value = '';
            currentFilters = { status: 'all', category: 'all', urgency: 'all', search: '' };
            loadIssues();
            showNotification('Filters cleared');
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('show');
            document.querySelector('.main-content').classList.toggle('sidebar-open');
        });
    }

    // Handle sidebar navigation
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').replace('#', '') + 'Section';
            handleNavigation(targetId);
        });
    });

    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('statusModal');
        if (event.target === modal) {
            closeModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Initialize dashboard
function initDashboard() {
    const currentUser = checkAuth();
    if (!currentUser) return;
    
    showLoading();
    
    setTimeout(() => {
        const adminAccount = JSON.parse(localStorage.getItem('adminAccount'));
        updateUserInterface(adminAccount);
        setupEventListeners();
        loadStatistics();
        
        const initialSection = window.location.hash.slice(1) || 'overview';
        let initialSectionId = initialSection + 'Section';
        handleNavigation(initialSectionId);
        
        hideLoading();
        
        // Auto-refresh stats every 30 seconds
        setInterval(loadStatistics, 30000);
    }, 500);
}

// Make functions global
window.logout = logout;
window.openStatusModal = openStatusModal;
window.closeModal = closeModal;
window.confirmStatusUpdate = confirmStatusUpdate;
window.deleteIssue = deleteIssue;
window.checkAuth = checkAuth;
window.deleteUser = deleteUser;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);