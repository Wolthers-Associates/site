/**
 * User Management Module
 * Wolthers & Associates - Trips Platform
 * 
 * Standalone user management system for trips.wolthers.com
 */

class UserManagement {
    constructor() {
        this.apiBase = 'https://trips.wolthers.com';
        this.users = [];
        this.companies = [];
        this.filteredUsers = [];
        this.currentEditUser = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing User Management System...');
        
        // Load initial data
        await this.loadCompanies();
        await this.loadUsers();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ User Management System initialized');
    }

    setupEventListeners() {
        // Search and filter
        const searchInput = document.getElementById('searchInput');
        const roleFilter = document.getElementById('roleFilter');
        const companyFilter = document.getElementById('companyFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
        
        if (roleFilter) {
            roleFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (companyFilter) {
            companyFilter.addEventListener('change', () => this.applyFilters());
        }

        // Form submissions
        const addUserForm = document.getElementById('addUserForm');
        const editUserForm = document.getElementById('editUserForm');

        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => this.handleAddUser(e));
        }

        if (editUserForm) {
            editUserForm.addEventListener('submit', (e) => this.handleEditUser(e));
        }

        // Modal close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModals();
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModals();
            }
        });
    }

    async loadUsers() {
        try {
            console.log('📥 Loading users from API...');
            console.log('API URL:', `${this.apiBase}/users-api.php`);
            
            const response = await fetch(`${this.apiBase}/users-api.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('API Response:', result);

            if (result.success !== false) {
                // Handle both new format (with success flag) and direct user array
                this.users = result.users || result || [];
                this.filteredUsers = [...this.users];
                this.renderUsers();
                console.log(`✅ Loaded ${this.users.length} users`);
            } else {
                throw new Error(result.error || 'Failed to load users');
            }
        } catch (error) {
            console.error('❌ Failed to load users:', error);
            this.showToast('Failed to load users: ' + error.message, 'error');
            
            // Show error in table
            const tbody = document.getElementById('userTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #ef4444;">
                            ❌ Failed to load users: ${error.message}<br>
                            <small>Check console for details</small>
                        </td>
                    </tr>
                `;
            }
        }
    }

    async loadCompanies() {
        try {
            console.log('🏢 Loading companies from API...');
            console.log('Companies API URL:', `${this.apiBase}/companies-api.php`);
            
            const response = await fetch(`${this.apiBase}/companies-api.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Companies response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Companies API Response:', result);

            if (result.success !== false) {
                this.companies = result.companies || result || [];
                this.populateCompanyDropdowns();
                console.log(`✅ Loaded ${this.companies.length} companies`);
            } else {
                console.warn('⚠️ Failed to load companies:', result.error);
                this.companies = [];
            }
        } catch (error) {
            console.error('❌ Failed to load companies:', error);
            this.companies = [];
        }
    }

    populateCompanyDropdowns() {
        const companySelects = [
            document.getElementById('addUserCompany'),
            document.getElementById('editUserCompany'),
            document.getElementById('companyFilter')
        ];

        companySelects.forEach(select => {
            if (!select) return;

            // Store current value
            const currentValue = select.value;
            
            // Clear existing options (except first one)
            const isFilter = select.id === 'companyFilter';
            select.innerHTML = isFilter ? 
                '<option value="">All Companies</option>' : 
                '<option value="">Select a company</option>';

            // Add company options
            this.companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.fantasy_name || company.full_name;
                select.appendChild(option);
            });

            // Restore previous value
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    renderUsers() {
        const tbody = document.getElementById('userTableBody');
        if (!tbody) return;

        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
                        No users found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredUsers.map(user => this.createUserRow(user)).join('');
    }

    createUserRow(user) {
        const avatar = user.avatar || user.name?.charAt(0)?.toUpperCase() || '?';
        const companyName = user.company_name || 'No Company';
        const lastLogin = this.formatLastLogin(user.last_login);
        const statusClass = user.status === 'active' ? 'success' : 'warning';

        return `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${avatar}</div>
                        <div class="user-details">
                            <div class="user-name">${this.escapeHtml(user.name)}</div>
                            <div class="user-email">${this.escapeHtml(user.email)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="user-role-badge ${user.role}">${this.getRoleDisplayName(user.role)}</span>
                </td>
                <td>${this.escapeHtml(companyName)}</td>
                <td>${lastLogin}</td>
                <td>
                    <span class="user-role-badge ${statusClass}">${user.status || 'active'}</span>
                </td>
                <td>
                    <div class="user-actions-cell">
                        <button class="action-btn edit" onclick="userManager.editUser(${user.id})" title="Edit user">
                            ✏️ Edit
                        </button>
                        ${!user.email?.endsWith('@wolthers.com') ? `
                            <button class="action-btn delete" onclick="userManager.deleteUser(${user.id})" title="Delete user">
                                🗑️ Delete
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('roleFilter')?.value || '';
        const companyFilter = document.getElementById('companyFilter')?.value || '';

        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !searchTerm || 
                user.name?.toLowerCase().includes(searchTerm) ||
                user.email?.toLowerCase().includes(searchTerm);

            const matchesRole = !roleFilter || user.role === roleFilter;
            
            const matchesCompany = !companyFilter || 
                user.company_id?.toString() === companyFilter;

            return matchesSearch && matchesRole && matchesCompany;
        });

        this.renderUsers();
    }

    async editUser(userId) {
        try {
            console.log('✏️ Loading user for edit:', userId);

            // Fetch fresh user data from API
            const response = await fetch(`${this.apiBase}/users-api.php?id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success && result.user) {
                this.currentEditUser = result.user;
                this.showEditUserModal(result.user);
            } else {
                throw new Error(result.error || 'User not found');
            }
        } catch (error) {
            console.error('❌ Failed to load user for edit:', error);
            this.showToast('Failed to load user: ' + error.message, 'error');
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const confirmed = await this.showConfirmDialog(
            'Delete User',
            `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
            'Delete',
            'error'
        );

        if (!confirmed) return;

        try {
            console.log('🗑️ Deleting user:', userId);

            const response = await fetch(`${this.apiBase}/users-api.php?id=${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showToast(`User ${user.name} deleted successfully`, 'success');
                await this.loadUsers(); // Refresh the list
            } else {
                throw new Error(result.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('❌ Failed to delete user:', error);
            this.showToast('Failed to delete user: ' + error.message, 'error');
        }
    }

    showEditUserModal(user) {
        // Populate form fields
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = user.name || '';
        document.getElementById('editUserEmail').value = user.email || '';
        document.getElementById('editUserPhone').value = user.phone || '';
        document.getElementById('editUserRole').value = user.role || 'user';
        document.getElementById('editUserCompany').value = user.company_id || '';
        document.getElementById('editUserCompanyRole').value = user.company_role || 'staff';
        document.getElementById('editCanSeeCompanyTrips').checked = user.can_see_company_trips || false;
        document.getElementById('editUserStatus').value = user.status || 'active';

        // Show modal
        const modal = document.getElementById('editUserModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    async handleAddUser(event) {
        event.preventDefault();
        
        const submitBtn = document.getElementById('addUserSubmitBtn');
        const spinner = submitBtn.querySelector('.loading-spinner');
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            spinner.style.display = 'inline-block';

            // Collect form data
            const formData = {
                name: document.getElementById('addUserName').value.trim(),
                email: document.getElementById('addUserEmail').value.trim(),
                phone: document.getElementById('addUserPhone').value.trim(),
                role: document.getElementById('addUserRole').value,
                company_id: document.getElementById('addUserCompany').value || null,
                company_role: document.getElementById('addUserCompanyRole').value,
                can_see_company_trips: document.getElementById('addCanSeeCompanyTrips').checked
            };

            // Validate required fields
            if (!formData.name || !formData.email) {
                throw new Error('Name and email are required');
            }

            console.log('➕ Creating new user:', formData);

            // Submit to API
            const response = await fetch(`${this.apiBase}/users-api.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create',
                    ...formData
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast(`User ${result.user.name} created successfully!`, 'success');
                this.hideAddUserModal();
                await this.loadUsers(); // Refresh the list
            } else {
                throw new Error(result.error || 'Failed to create user');
            }

        } catch (error) {
            console.error('❌ Failed to create user:', error);
            this.showToast('Failed to create user: ' + error.message, 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            spinner.style.display = 'none';
        }
    }

    async handleEditUser(event) {
        event.preventDefault();
        
        const submitBtn = document.getElementById('editUserSubmitBtn');
        const spinner = submitBtn.querySelector('.loading-spinner');
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            spinner.style.display = 'inline-block';

            // Collect form data
            const formData = {
                id: document.getElementById('editUserId').value,
                name: document.getElementById('editUserName').value.trim(),
                email: document.getElementById('editUserEmail').value.trim(),
                phone: document.getElementById('editUserPhone').value.trim(),
                role: document.getElementById('editUserRole').value,
                company_id: document.getElementById('editUserCompany').value || null,
                company_role: document.getElementById('editUserCompanyRole').value,
                can_see_company_trips: document.getElementById('editCanSeeCompanyTrips').checked,
                status: document.getElementById('editUserStatus').value
            };

            // Validate required fields
            if (!formData.name || !formData.email) {
                throw new Error('Name and email are required');
            }

            console.log('✏️ Updating user:', formData);

            // Submit to API
            const response = await fetch(`${this.apiBase}/users-api.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update',
                    ...formData
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast(`User ${result.user.name} updated successfully!`, 'success');
                this.hideEditUserModal();
                await this.loadUsers(); // Refresh the list
            } else {
                throw new Error(result.error || 'Failed to update user');
            }

        } catch (error) {
            console.error('❌ Failed to update user:', error);
            this.showToast('Failed to update user: ' + error.message, 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            spinner.style.display = 'none';
        }
    }

    async refreshUsers() {
        console.log('🔄 Refreshing users...');
        await this.loadUsers();
        this.showToast('Users refreshed successfully', 'success');
    }

    // Modal management
    showAddUserModal() {
        // Reset form
        document.getElementById('addUserForm').reset();
        
        // Show modal
        const modal = document.getElementById('addUserModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideAddUserModal() {
        const modal = document.getElementById('addUserModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    hideEditUserModal() {
        const modal = document.getElementById('editUserModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        this.currentEditUser = null;
    }

    hideModals() {
        this.hideAddUserModal();
        this.hideEditUserModal();
    }

    // Utility functions
    formatLastLogin(dateString) {
        if (!dateString) return 'Never';
        
        try {
            const date = new Date(dateString);
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            return date.toLocaleString('en-US', {
                timeZone: userTimezone,
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return new Date(dateString).toLocaleString();
        }
    }

    getRoleDisplayName(role) {
        const roleNames = {
            admin: 'Administrator',
            editor: 'Editor',
            user: 'User',
            guest: 'Guest'
        };
        return roleNames[role] || 'User';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    async showConfirmDialog(title, message, confirmText = 'Confirm', type = 'primary') {
        return new Promise((resolve) => {
            // Remove existing confirm dialogs
            document.querySelectorAll('.confirm-dialog').forEach(dialog => dialog.remove());

            const dialog = document.createElement('div');
            dialog.className = 'modal confirm-dialog show';
            dialog.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                    </div>
                    <div style="padding: 20px 0;">
                        <p style="margin: 0; line-height: 1.5;">${message}</p>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
                        <button type="button" class="btn btn-${type === 'error' ? 'primary' : type} confirm-btn" style="${type === 'error' ? 'background: #ef4444;' : ''}">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);
            document.body.style.overflow = 'hidden';

            const cleanup = (result) => {
                document.body.removeChild(dialog);
                document.body.style.overflow = 'auto';
                resolve(result);
            };

            dialog.querySelector('.cancel-btn').addEventListener('click', () => cleanup(false));
            dialog.querySelector('.confirm-btn').addEventListener('click', () => cleanup(true));
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) cleanup(false);
            });
        });
    }
}

// Global functions for onclick handlers
window.showAddUserModal = () => userManager.showAddUserModal();
window.hideAddUserModal = () => userManager.hideAddUserModal();
window.hideEditUserModal = () => userManager.hideEditUserModal();
window.refreshUsers = () => userManager.refreshUsers();

// Initialize when DOM is loaded
let userManager;
document.addEventListener('DOMContentLoaded', () => {
    userManager = new UserManagement();
});

// Export for module use
window.UserManagement = UserManagement;
