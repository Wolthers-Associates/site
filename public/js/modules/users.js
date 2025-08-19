/**
 * Users Module
 * Wolthers & Associates - Trips Platform
 * 
 * Handles user management, company assignments, and user data operations
 */

// Users configuration
const CONFIG = {
    API_BASE: 'api',
    ITEMS_PER_PAGE: 20
};

/**
 * Users class with all user-related functionality
 */
export class Users {
    constructor() {
        this.users = [];
        this.companies = [];
        this.filteredUsers = [];
        this.currentPage = 1;
        this.sortColumn = 'name';
        this.sortDirection = 'asc';
    }

    /**
     * Initialize users system
     */
    async init() {
        console.log('👥 Initializing users system...');
        await this.loadUsers();
        await this.loadCompanies();
        this.setupEventHandlers();
    }

    /**
     * Load all users from various sources
     */
    async loadUsers() {
        try {
            // Load from API first
            const apiUsers = await this.loadUsersFromAPI();
            
            // Load from local storage/cache
            const localUsers = this.loadUsersFromStorage();
            
            // Merge and deduplicate users
            this.users = this.mergeUserSources(apiUsers, localUsers);
            
            console.log(`✅ Loaded ${this.users.length} users`);
        } catch (error) {
            console.error('Failed to load users:', error);
            this.users = this.getDefaultUsers();
        }
    }

    /**
     * Load users from API
     */
    async loadUsersFromAPI() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/users/list.php`);
            if (response.ok) {
                const data = await response.json();
                return data.users || [];
            }
        } catch (error) {
            console.warn('API users not available:', error);
        }
        return [];
    }

    /**
     * Load users from local storage
     */
    loadUsersFromStorage() {
        try {
            const stored = localStorage.getItem('userDatabase');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Local users not available:', error);
            return [];
        }
    }

    /**
     * Get default Wolthers team users
     */
    getDefaultUsers() {
        return [
            {
                id: 'daniel-wolthers',
                name: 'Daniel Wolthers',
                email: 'daniel@wolthers.com',
                role: 'admin',
                companyRole: 'admin',
                company: 'Wolthers & Associates',
                companyId: 'wolthers-associates',
                canSeeCompanyTrips: true,
                isWolthersTeam: true,
                memberSince: '2024-01-01',
                lastLogin: new Date().toISOString()
            },
            {
                id: 'svenn-wolthers',
                name: 'Svenn Wolthers',
                email: 'svenn@wolthers.com',
                role: 'admin',
                companyRole: 'admin',
                company: 'Wolthers & Associates',
                companyId: 'wolthers-associates',
                canSeeCompanyTrips: true,
                isWolthersTeam: true,
                memberSince: '2024-01-01',
                lastLogin: new Date().toISOString()
            }
        ];
    }

    /**
     * Load companies data
     */
    async loadCompanies() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/companies/list.php`);
            if (response.ok) {
                const data = await response.json();
                this.companies = data.companies || this.getDefaultCompanies();
            } else {
                this.companies = this.getDefaultCompanies();
            }
        } catch (error) {
            console.warn('Companies API not available:', error);
            this.companies = this.getDefaultCompanies();
        }
    }

    /**
     * Get default companies
     */
    getDefaultCompanies() {
        return [
            {
                id: 'wolthers-associates',
                name: 'Wolthers & Associates',
                legalName: 'Wolthers & Associates',
                type: 'consultant',
                status: 'active',
                createdAt: '2024-01-01'
            },
            {
                id: 'mitsui-co',
                name: 'Mitsui & Co',
                legalName: 'Mitsui & Co. Ltd.',
                type: 'importer',
                status: 'active',
                createdAt: '2024-01-15'
            }
        ];
    }

    /**
     * Merge users from different sources
     */
    mergeUserSources(apiUsers, localUsers) {
        const userMap = new Map();
        
        // Add local users first
        localUsers.forEach(user => {
            userMap.set(user.email.toLowerCase(), user);
        });
        
        // Add API users (overwrites local if same email)
        apiUsers.forEach(user => {
            userMap.set(user.email.toLowerCase(), user);
        });
        
        return Array.from(userMap.values());
    }

    /**
     * Add new user
     */
    async addUser(userData) {
        try {
            // Validate user data
            const validation = this.validateUserData(userData);
            if (!validation.valid) {
                return { success: false, errors: validation.errors };
            }

            // Check for existing user
            if (this.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                return { success: false, errors: ['Email already exists'] };
            }

            // Generate user ID
            const userId = this.generateUserId(userData.name);
            
            const newUser = {
                id: userId,
                name: userData.name,
                email: userData.email.toLowerCase(),
                role: userData.role || 'user',
                companyRole: userData.companyRole || 'staff',
                company: userData.company,
                companyId: userData.companyId,
                canSeeCompanyTrips: userData.canSeeCompanyTrips || false,
                memberSince: new Date().toISOString(),
                lastLogin: null,
                tripPermissions: [],
                isActive: true
            };

            // Add to API
            try {
                const response = await fetch(`${CONFIG.API_BASE}/users/create.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });

                if (!response.ok) {
                    throw new Error('API creation failed');
                }
            } catch (apiError) {
                console.warn('API user creation failed, using local storage:', apiError);
            }

            // Add to local data
            this.users.push(newUser);
            this.saveUsersToStorage();

            console.log('✅ User added successfully:', newUser.name);
            return { success: true, user: newUser };

        } catch (error) {
            console.error('Failed to add user:', error);
            return { success: false, errors: ['Failed to create user'] };
        }
    }

    /**
     * Update existing user
     */
    async updateUser(userId, userData) {
        try {
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                return { success: false, errors: ['User not found'] };
            }

            // Validate user data
            const validation = this.validateUserData(userData, userId);
            if (!validation.valid) {
                return { success: false, errors: validation.errors };
            }

            // Update user data
            const updatedUser = {
                ...this.users[userIndex],
                ...userData,
                email: userData.email.toLowerCase(),
                updatedAt: new Date().toISOString()
            };

            // Update in API
            try {
                const response = await fetch(`${CONFIG.API_BASE}/users/update.php`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userId, ...userData })
                });

                if (!response.ok) {
                    throw new Error('API update failed');
                }
            } catch (apiError) {
                console.warn('API user update failed, using local storage:', apiError);
            }

            // Update local data
            this.users[userIndex] = updatedUser;
            this.saveUsersToStorage();

            console.log('✅ User updated successfully:', updatedUser.name);
            return { success: true, user: updatedUser };

        } catch (error) {
            console.error('Failed to update user:', error);
            return { success: false, errors: ['Failed to update user'] };
        }
    }

    /**
     * Delete user
     */
    async deleteUser(userId) {
        try {
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                return { success: false, error: 'User not found' };
            }

            const user = this.users[userIndex];

            // Delete from API
            try {
                const response = await fetch(`${CONFIG.API_BASE}/users/delete.php`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userId })
                });

                if (!response.ok) {
                    throw new Error('API deletion failed');
                }
            } catch (apiError) {
                console.warn('API user deletion failed, using local storage:', apiError);
            }

            // Remove from local data
            this.users.splice(userIndex, 1);
            this.saveUsersToStorage();

            console.log('✅ User deleted successfully:', user.name);
            return { success: true };

        } catch (error) {
            console.error('Failed to delete user:', error);
            return { success: false, error: 'Failed to delete user' };
        }
    }

    /**
     * Get user by ID
     */
    getUserById(userId) {
        return this.users.find(u => u.id === userId);
    }

    /**
     * Get user by email
     */
    getUserByEmail(email) {
        return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    /**
     * Get users by company
     */
    getUsersByCompany(companyId) {
        return this.users.filter(u => u.companyId === companyId);
    }

    /**
     * Auto-link users to companies based on email domains
     */
    async autoLinkUsersToCompanies() {
        try {
            let updatedCount = 0;
            
            for (const user of this.users) {
                if (!user.companyId) {
                    const company = this.getCompanyFromEmail(user.email);
                    if (company) {
                        await this.updateUser(user.id, {
                            company: company.name,
                            companyId: company.id
                        });
                        updatedCount++;
                    }
                }
            }

            console.log(`✅ Auto-linked ${updatedCount} users to companies`);
            return { success: true, count: updatedCount };

        } catch (error) {
            console.error('Auto-link failed:', error);
            return { success: false, error: 'Auto-link failed' };
        }
    }

    /**
     * Get company from email domain
     */
    getCompanyFromEmail(email) {
        const domain = email.split('@')[1]?.toLowerCase();
        
        const domainMappings = {
            'wolthers.com': 'wolthers-associates',
            'mitsui.com': 'mitsui-co',
            'mitsui.co.jp': 'mitsui-co'
        };

        const companyId = domainMappings[domain];
        return companyId ? this.companies.find(c => c.id === companyId) : null;
    }

    /**
     * Validate user data
     */
    validateUserData(userData, excludeUserId = null) {
        const errors = [];

        // Required fields
        if (!userData.name?.trim()) {
            errors.push('Name is required');
        }

        if (!userData.email?.trim()) {
            errors.push('Email is required');
        } else if (!this.validateEmail(userData.email)) {
            errors.push('Invalid email format');
        }

        if (!userData.role) {
            errors.push('Role is required');
        }

        // Check for duplicate email
        if (userData.email) {
            const existing = this.users.find(u => 
                u.email.toLowerCase() === userData.email.toLowerCase() && 
                u.id !== excludeUserId
            );
            if (existing) {
                errors.push('Email already exists');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate email format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Generate unique user ID
     */
    generateUserId(name) {
        const base = name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-');
        
        const timestamp = Date.now().toString().slice(-4);
        return `${base}-${timestamp}`;
    }

    /**
     * Save users to local storage
     */
    saveUsersToStorage() {
        try {
            localStorage.setItem('userDatabase', JSON.stringify(this.users));
        } catch (error) {
            console.warn('Failed to save users to storage:', error);
        }
    }

    /**
     * Filter and search users
     */
    filterUsers(searchTerm = '', roleFilter = '', companyFilter = '') {
        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !searchTerm || 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesCompany = !companyFilter || user.companyId === companyFilter;

            return matchesSearch && matchesRole && matchesCompany;
        });

        this.currentPage = 1; // Reset to first page
        return this.filteredUsers;
    }

    /**
     * Sort users
     */
    sortUsers(column, direction = 'asc') {
        this.sortColumn = column;
        this.sortDirection = direction;

        const usersToSort = this.filteredUsers.length > 0 ? this.filteredUsers : this.users;

        usersToSort.sort((a, b) => {
            let aValue = a[column] || '';
            let bValue = b[column] || '';

            // Handle special cases
            if (column === 'memberSince' || column === 'lastLogin') {
                aValue = new Date(aValue || 0);
                bValue = new Date(bValue || 0);
            } else {
                aValue = aValue.toString().toLowerCase();
                bValue = bValue.toString().toLowerCase();
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        return usersToSort;
    }

    /**
     * Get paginated users
     */
    getPaginatedUsers(page = 1) {
        const usersToPage = this.filteredUsers.length > 0 ? this.filteredUsers : this.users;
        const startIndex = (page - 1) * CONFIG.ITEMS_PER_PAGE;
        const endIndex = startIndex + CONFIG.ITEMS_PER_PAGE;
        
        this.currentPage = page;
        
        return {
            users: usersToPage.slice(startIndex, endIndex),
            totalUsers: usersToPage.length,
            currentPage: page,
            totalPages: Math.ceil(usersToPage.length / CONFIG.ITEMS_PER_PAGE),
            hasNext: endIndex < usersToPage.length,
            hasPrev: page > 1
        };
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Search and filter handlers would be added here
        console.log('Users event handlers initialized');
    }

    /**
     * Get all users
     */
    getAllUsers() {
        return this.users;
    }

    /**
     * Get all companies
     */
    getAllCompanies() {
        return this.companies;
    }

    /**
     * Refresh users data
     */
    async refresh() {
        await this.loadUsers();
        await this.loadCompanies();
    }
}

// Create and export singleton instance
export const users = new Users();

// Export for global access (backwards compatibility)
window.users = users;
