// Contact Messages Management for Admin Dashboard

let allContactMessages = [];
let filteredContactMessages = [];
let currentMessageFilter = 'all';
let currentViewingMessageId = null;

// API Base URL
const API_BASE = '/api';

/**
 * Load all contact messages from the API
 */
async function loadContactMessages() {
    try {
        const response = await fetch(`${API_BASE}/contact`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            // Check if it's a table not found error
            if (result.error && result.error.includes('does not exist')) {
                showSetupInstructions(result);
                return;
            }
            throw new Error(result.message || 'Failed to load contact messages');
        }

        allContactMessages = result.data || [];
        filteredContactMessages = [...allContactMessages];

        // Update badge counts
        updateMessageCounts();

        // Apply current filter
        filterContactMessages(currentMessageFilter);

        console.log(`Loaded ${allContactMessages.length} contact messages`);

    } catch (error) {
        console.error('Error loading contact messages:', error);
        showErrorInTable(error.message || 'Failed to load messages. Please try again later.');
    }
}

/**
 * Update message count badges
 */
function updateMessageCounts() {
    const newCount = allContactMessages.filter(msg => msg.status === 'new').length;
    
    // Update sidebar badge
    const sidebarBadge = document.getElementById('newMessagesCount');
    if (sidebarBadge) {
        sidebarBadge.textContent = newCount;
        sidebarBadge.style.display = newCount > 0 ? 'inline-block' : 'none';
    }

    // Update filter button badge
    const filterBadge = document.getElementById('newBadge');
    if (filterBadge) {
        filterBadge.textContent = newCount;
    }
}

/**
 * Filter contact messages by status
 */
function filterContactMessages(status) {
    currentMessageFilter = status;

    // Update button states
    document.querySelectorAll('[data-message-status]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-message-status') === status);
    });

    // Filter messages
    if (status === 'all') {
        filteredContactMessages = [...allContactMessages];
    } else {
        filteredContactMessages = allContactMessages.filter(msg => msg.status === status);
    }

    // Display filtered messages
    displayContactMessages();
}

/**
 * Search contact messages
 */
function searchContactMessages() {
    const searchTerm = document.getElementById('messageSearch').value.toLowerCase();

    if (!searchTerm) {
        filterContactMessages(currentMessageFilter);
        return;
    }

    filteredContactMessages = allContactMessages.filter(msg => {
        return (
            msg.name.toLowerCase().includes(searchTerm) ||
            msg.email.toLowerCase().includes(searchTerm) ||
            (msg.phone && msg.phone.toLowerCase().includes(searchTerm)) ||
            (msg.subject && msg.subject.toLowerCase().includes(searchTerm)) ||
            msg.message.toLowerCase().includes(searchTerm)
        );
    });

    displayContactMessages();
}

/**
 * Display contact messages in table
 */
function displayContactMessages() {
    const tbody = document.getElementById('contactMessagesTableBody');

    if (!filteredContactMessages || filteredContactMessages.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No messages found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredContactMessages.map(msg => {
        const statusColors = {
            new: 'danger',
            read: 'info',
            replied: 'success',
            archived: 'secondary'
        };
        
        const statusColor = statusColors[msg.status] || 'secondary';
        const date = new Date(msg.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const truncatedMessage = msg.message.length > 50 
            ? msg.message.substring(0, 50) + '...' 
            : msg.message;

        return `
            <tr class="${msg.status === 'new' ? 'table-warning' : ''}">
                <td>
                    <input type="checkbox" class="message-checkbox" value="${msg.id}">
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm me-2">
                            <div class="avatar-title rounded-circle bg-primary text-white">
                                ${msg.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <span class="fw-bold">${escapeHtml(msg.name)}</span>
                    </div>
                </td>
                <td>
                    <a href="mailto:${msg.email}" class="text-decoration-none">
                        ${escapeHtml(msg.email)}
                    </a>
                </td>
                <td>${msg.phone ? escapeHtml(msg.phone) : '-'}</td>
                <td>${msg.subject ? escapeHtml(msg.subject) : '-'}</td>
                <td>
                    <span class="text-muted">${escapeHtml(truncatedMessage)}</span>
                </td>
                <td>
                    <small class="text-muted">${formattedDate}</small>
                </td>
                <td>
                    <span class="badge bg-${statusColor}">${msg.status}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewMessage(${msg.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMessage(${msg.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * View message details in modal
 */
async function viewMessage(messageId) {
    const message = allContactMessages.find(msg => String(msg.id) === String(messageId));
    
    if (!message) {
        Swal.fire('Error', 'Message not found', 'error');
        return;
    }

    currentViewingMessageId = messageId;

    // Populate modal
    document.getElementById('messageDetailName').textContent = message.name;
    document.getElementById('messageDetailEmail').textContent = message.email;
    document.getElementById('messageDetailPhone').textContent = message.phone || 'Not provided';
    document.getElementById('messageDetailProject').textContent = message.project || 'Not specified';
    document.getElementById('messageDetailSubject').textContent = message.subject || 'No subject';
    document.getElementById('messageDetailMessage').textContent = message.message;
    
    const date = new Date(message.created_at);
    document.getElementById('messageDetailDate').textContent = date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    document.getElementById('messageDetailStatus').value = message.status;

    // Set reply email link
    const emailSubject = encodeURIComponent(`Re: ${message.subject || 'Your inquiry'}`);
    const emailBody = encodeURIComponent(`\n\n--- Original Message ---\nFrom: ${message.name}\nDate: ${date.toLocaleString()}\n\n${message.message}`);
    document.getElementById('replyEmailLink').href = `mailto:${message.email}?subject=${emailSubject}&body=${emailBody}`;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewMessageModal'));
    modal.show();

    // Mark as read if it's new
    if (message.status === 'new') {
        await updateMessageStatus(messageId, 'read');
    }
}

/**
 * Update message status from modal
 */
async function updateMessageStatusFromModal() {
    const newStatus = document.getElementById('messageDetailStatus').value;
    
    if (currentViewingMessageId) {
        await updateMessageStatus(currentViewingMessageId, newStatus);
    }
}

/**
 * Update message status via API
 */
async function updateMessageStatus(messageId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/contact/${messageId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update message status');
        }

        const result = await response.json();

        // Update local data
        const messageIndex = allContactMessages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
            allContactMessages[messageIndex].status = newStatus;
        }

        // Refresh display
        updateMessageCounts();
        filterContactMessages(currentMessageFilter);

        console.log(`Message ${messageId} status updated to ${newStatus}`);

    } catch (error) {
        console.error('Error updating message status:', error);
        Swal.fire('Error', 'Failed to update message status', 'error');
    }
}

/**
 * Delete message
 */
async function deleteMessage(messageId) {
    const result = await Swal.fire({
        title: 'Delete Message?',
        text: 'This action cannot be undone',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
        try {
            // Note: You may need to create a DELETE endpoint in your API
            // For now, we'll mark as archived
            await updateMessageStatus(messageId, 'archived');
            
            Swal.fire('Deleted!', 'Message has been archived', 'success');
        } catch (error) {
            console.error('Error deleting message:', error);
            Swal.fire('Error', 'Failed to delete message', 'error');
        }
    }
}

/**
 * Delete message from modal
 */
async function deleteMessageFromModal() {
    if (currentViewingMessageId) {
        await deleteMessage(currentViewingMessageId);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewMessageModal'));
        if (modal) {
            modal.hide();
        }
    }
}

/**
 * Export contact messages to CSV
 */
function exportContactMessages() {
    if (filteredContactMessages.length === 0) {
        Swal.fire('No Data', 'No messages to export', 'info');
        return;
    }

    const csvHeaders = ['ID', 'Name', 'Email', 'Phone', 'Project', 'Subject', 'Message', 'Status', 'Date'];
    const csvRows = filteredContactMessages.map(msg => {
        return [
            msg.id,
            msg.name,
            msg.email,
            msg.phone || '',
            msg.project || '',
            msg.subject || '',
            msg.message.replace(/"/g, '""'), // Escape quotes
            msg.status,
            new Date(msg.created_at).toLocaleString()
        ].map(field => `"${field}"`).join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-messages-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    Swal.fire('Success', 'Messages exported successfully', 'success');
}

/**
 * Show setup instructions when table doesn't exist
 */
function showSetupInstructions(errorData) {
    const tbody = document.getElementById('contactMessagesTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-5">
                <i class="fas fa-database fa-3x text-warning mb-3"></i>
                <h5 class="text-warning mb-3">Database Table Not Found</h5>
                <p class="text-muted mb-4">The contact_messages table needs to be created in your MySQL database.</p>
                <div class="alert alert-info text-start mx-auto" style="max-width: 600px;">
                    <h6 class="alert-heading"><i class="fas fa-info-circle me-2"></i>Setup Instructions:</h6>
                    <ol class="mb-0">
                        <li>Ensure your MySQL database server is running</li>
                        <li>Run the ecommerce table creation script: <code>node backend/create-ecommerce-tables.js</code></li>
                        <li>Return here and click <strong>Refresh</strong> below</li>
                    </ol>
                </div>
                <button class="btn btn-primary mt-3" onclick="loadContactMessages()">
                    <i class="fas fa-sync-alt me-2"></i>Refresh
                </button>
            </td>
        </tr>
    `;
}

/**
 * Show error in table
 */
function showErrorInTable(message) {
    const tbody = document.getElementById('contactMessagesTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="text-danger">${message}</p>
                <button class="btn btn-primary" onclick="loadContactMessages()">
                    <i class="fas fa-sync-alt me-2"></i>Retry
                </button>
            </td>
        </tr>
    `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize contact messages when section is shown
 */
document.addEventListener('DOMContentLoaded', function() {
    // Load messages when contact messages section is activated
    const originalShowSection = window.showSection;
    window.showSection = function(sectionId) {
        if (originalShowSection) {
            originalShowSection(sectionId);
        }
        
        if (sectionId === 'contact-messages') {
            loadContactMessages();
        }
    };

    // Also load on initial page load if we're on contact messages section
    if (window.location.hash === '#contact-messages') {
        loadContactMessages();
    }
});

// Auto-refresh messages every 30 seconds
setInterval(() => {
    const currentSection = document.querySelector('.content-section.active');
    if (currentSection && currentSection.id === 'contact-messages-section') {
        loadContactMessages();
    }
}, 30000);
