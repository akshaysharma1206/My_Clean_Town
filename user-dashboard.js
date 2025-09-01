// user-dashboard.js - User Dashboard Functionality

let currentFilters = {
    status: 'all'
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
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    
    if (currentUser.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
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
    
    setTimeout(() => {
        localStorage.removeItem('currentUser');
        showNotification('Logged out successfully');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    }, 500);
}

// Update user interface
function updateUserInterface(user) {
    const userNameElements = document.querySelectorAll('#userName, #userGreeting');
    userNameElements.forEach(el => {
        if (el) el.textContent = user.name;
    });
    
    document.title = `${user.name}'s Dashboard - CivicConnect`;
}

// Load statistics
function loadStatistics() {
    const issues = JSON.parse(localStorage.getItem('civicIssues')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return;
    
    const userIssues = issues.filter(issue => issue.reportedBy === currentUser.email);
    
    const total = userIssues.length;
    const reported = userIssues.filter(issue => issue.status === 'Reported').length;
    const inProgress = userIssues.filter(issue => issue.status === 'In Progress').length;
    const confirmed = userIssues.filter(issue => issue.status === 'Confirmed').length;
    const resolved = userIssues.filter(issue => issue.status === 'Resolved').length;
    
    document.getElementById('totalReports').textContent = total;
    document.getElementById('pendingReports').textContent = reported + confirmed + inProgress;
    document.getElementById('resolvedReports').textContent = resolved;
    
    const responseRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    document.getElementById('responseRate').textContent = `${responseRate}%`;
}

// Load issues with filtering
function loadIssues() {
    const issuesContainer = document.getElementById('issuesContainer');
    if (!issuesContainer) return;
    
    showLoading();
    
    setTimeout(() => {
        try {
            const issues = JSON.parse(localStorage.getItem('civicIssues')) || [];
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            if (!currentUser) {
                issuesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>Please log in</h3>
                        <p>Your session has expired. Please log in again to view your issues.</p>
                    </div>
                `;
                hideLoading();
                return;
            }
            
            let userIssues = issues.filter(issue => issue.reportedBy === currentUser.email);
            
            if (currentFilters.status !== 'all') {
                userIssues = userIssues.filter(issue => issue.status === currentFilters.status);
            }
            
            userIssues.sort((a, b) => b.id - a.id);
            
            issuesContainer.innerHTML = '';
            
            if (userIssues.length === 0) {
                issuesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No issues found</h3>
                        <p>${currentFilters.status !== 'all' ? 'No issues match your current filter' : 'You haven\'t reported any issues yet'}</p>
                    </div>
                `;
                hideLoading();
                return;
            }
            
            userIssues.forEach(issue => {
                const issueElement = createIssueElement(issue);
                issuesContainer.appendChild(issueElement);
            });
            
        } catch (error) {
            console.error('Error loading issues:', error);
            showNotification('Error loading your issues', 'error');
        }
        
        hideLoading();
    }, 500);
}

// Create issue element
function createIssueElement(issue) {
    const issueElement = document.createElement('div');
    issueElement.className = 'issue-card';
    
    const statusColors = {
        'reported': '#f59e0b',
        'confirmed': '#3b82f6',
        'in-progress': '#8b5cf6',
        'resolved': '#10b981'
    };
    const statusColor = statusColors[issue.status.toLowerCase().replace(' ', '-')] || '#6b7280';
    issueElement.style.borderLeft = `4px solid ${statusColor}`;

    const urgencyBadge = issue.urgency ? `
        <span class="urgency-badge ${issue.urgency.toLowerCase()}">
            <i class="fas fa-exclamation-circle"></i> ${issue.urgency} Priority
        </span>
    ` : '';
    
    const statusInfo = issue.status === 'Resolved' ? `<p class="status-info"><i class="fas fa-check-circle"></i> This issue has been resolved!</p>` : `<p class="status-info"><i class="fas fa-clock"></i> Currently ${issue.status.toLowerCase()}</p>`;

    issueElement.innerHTML = `
        <div class="issue-header">
            <h3>${issue.title}</h3>
            ${urgencyBadge}
        </div>
        <p class="issue-meta">
            <i class="fas fa-tag"></i> ${issue.category} &bull; 
            <i class="fas fa-map-marker-alt"></i> ${issue.location} &bull; 
            <span class="status-badge status-${issue.status.toLowerCase().replace(' ', '-')}">
                <i class="fas fa-info-circle"></i> ${issue.status}
            </span>
        </p>
        <p class="issue-description">${issue.description}</p>
        <p class="issue-date"><i class="fas fa-calendar-alt"></i> Reported on ${new Date(issue.timestamp).toLocaleDateString()}</p>
        ${statusInfo}
        <div class="issue-actions">
            <button class="btn btn-sm btn-secondary view-btn" onclick="viewIssueDetails(${issue.id})">
                <i class="fas fa-eye"></i> View Details
            </button>
            <button class="btn btn-sm btn-danger delete-btn" onclick="deleteIssue(${issue.id})">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        </div>
    `;

    return issueElement;
}

// View issue details
function viewIssueDetails(issueId) {
    const issues = JSON.parse(localStorage.getItem('civicIssues')) || [];
    const issue = issues.find(i => i.id === issueId);
    
    if (!issue) {
        showNotification('Issue not found', 'error');
        return;
    }
    
    const modal = document.getElementById('issueDetailsModal');
    if (!modal) return;
    
    document.getElementById('modalTitle').textContent = issue.title;
    document.getElementById('modalCategory').innerHTML = `<i class="fas fa-tag"></i> Category: ${issue.category}`;
    document.getElementById('modalLocation').innerHTML = `<i class="fas fa-map-marker-alt"></i> Location: ${issue.location || 'N/A'}`;
    document.getElementById('modalUrgency').innerHTML = `<i class="fas fa-exclamation-triangle"></i> Urgency: ${issue.urgency || 'N/A'}`;
    document.getElementById('modalStatus').innerHTML = `<i class="fas fa-info-circle"></i> Status: ${issue.status}`;
    document.getElementById('modalDescription').textContent = issue.description;

    modal.classList.add('show');
}

// Delete an issue
function deleteIssue(issueId) {
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
        return;
    }
    
    let issues = JSON.parse(localStorage.getItem('civicIssues')) || [];
    const updatedIssues = issues.filter(issue => issue.id !== issueId);
    
    localStorage.setItem('civicIssues', JSON.stringify(updatedIssues));
    
    showNotification('Issue deleted successfully!', 'success');
    
    // Refresh the view
    loadIssues();
    loadStatistics();
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Handle issue report submission
function handleIssueSubmit(event) {
    event.preventDefault();
    showLoading();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        hideLoading();
        showNotification('Please log in to report an issue', 'error');
        return;
    }

    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const location = document.getElementById('location').value;
    const urgency = document.getElementById('urgency').value;
    const description = document.getElementById('description').value;

    if (!title || !category || !location || !description) {
        hideLoading();
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const newIssue = {
        id: Date.now(),
        title,
        category,
        location,
        urgency,
        description,
        status: 'Reported',
        reportedBy: currentUser.email,
        timestamp: new Date().toISOString()
    };

    let issues = JSON.parse(localStorage.getItem('civicIssues')) || [];
    issues.push(newIssue);
    localStorage.setItem('civicIssues', JSON.stringify(issues));

    hideLoading();
    showNotification('Issue reported successfully!');
    document.getElementById('issueForm').reset();
    
    loadStatistics();
    loadIssues();
}

// Function to handle sidebar navigation
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
    } else if (sectionId === 'dashboardSection') {
        loadStatistics();
    }
}

// Setup event listeners
function setupEventListeners() {
    const reportIssueForm = document.getElementById('issueForm');
    if (reportIssueForm) {
        reportIssueForm.addEventListener('submit', handleIssueSubmit);
    }
    
    const filterStatusSelect = document.getElementById('userFilterStatus');
    if (filterStatusSelect) {
        filterStatusSelect.addEventListener('change', function() {
            currentFilters.status = this.value;
            loadIssues();
            showNotification(`Filtered by: ${this.value}`);
        });
    }

    const refreshIssuesBtn = document.getElementById('refreshIssues');
    if (refreshIssuesBtn) {
        refreshIssuesBtn.addEventListener('click', function() {
            loadIssues();
            loadStatistics();
            showNotification('Issues refreshed');
        });
    }
    
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('show');
            document.querySelector('.main-content').classList.toggle('sidebar-open');
        });
    }
    
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            let targetId = this.getAttribute('href').replace('#', '');
            if (targetId === 'dashboard') {
                targetId = 'dashboardSection';
            } else if (targetId === 'report-issue') {
                targetId = 'reportSection';
            } else if (targetId === 'my-issues') {
                targetId = 'issuesSection';
            }
            handleNavigation(targetId);
        });
    });

    document.addEventListener('click', function(event) {
        const modal = document.getElementById('issueDetailsModal');
        if (event.target === modal) {
            closeModal('issueDetailsModal');
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal('issueDetailsModal');
        }
    });
}

// Initialize dashboard
function initDashboard() {
    const currentUser = checkAuth();
    if (!currentUser) return;
    
    showLoading();
    
    setTimeout(() => {
        updateUserInterface(currentUser);
        setupEventListeners();
        loadStatistics();
        
        const initialSection = window.location.hash.slice(1) || 'dashboard';
        let initialSectionId = initialSection;
        if (initialSection === 'dashboard') {
            initialSectionId = 'dashboardSection';
        } else if (initialSection === 'report-issue') {
            initialSectionId = 'reportSection';
        } else if (initialSection === 'my-issues') {
            initialSectionId = 'issuesSection';
        }
        handleNavigation(initialSectionId);
        
        hideLoading();
        
        const issues = JSON.parse(localStorage.getItem('civicIssues')) || [];
        const userIssues = issues.filter(issue => issue.reportedBy === currentUser.email);
        
        if (userIssues.length === 0) {
            showNotification('Welcome to CivicConnect! Report your first community issue to get started.');
        }
        
    }, 500);
}

// Make functions global
window.logout = logout;
window.viewIssueDetails = viewIssueDetails;
window.deleteIssue = deleteIssue;
window.closeModal = closeModal;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);