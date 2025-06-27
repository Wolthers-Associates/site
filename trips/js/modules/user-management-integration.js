/**
 * User Management Integration Module
 * Wolthers & Associates - Trips Platform
 * 
 * Integrates the standalone user management system into the main platform
 */

class UserManagementIntegration {
    constructor() {
        this.userManagementUrl = '/trips/user-management.html';
        this.apiBase = 'https://trips.wolthers.com/trips';
        this.isEmbedded = false;
    }

    /**
     * Open user management in a new tab/window
     */
    openUserManagement() {
        const userManagementWindow = window.open(
            this.userManagementUrl,
            'userManagement',
            'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes,toolbar=yes,menubar=yes,location=yes'
        );

        if (userManagementWindow) {
            userManagementWindow.focus();
        } else {
            // Fallback: redirect current window
            window.location.href = this.userManagementUrl;
        }
    }

    /**
     * Embed user management as an iframe
     */
    embedUserManagement(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = this.userManagementUrl;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        iframe.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';

        // Clear container and add iframe
        container.innerHTML = '';
        container.appendChild(iframe);

        this.isEmbedded = true;
        return iframe;
    }

    /**
     * Create a modal with user management
     */
    showUserManagementModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('userManagementModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'userManagementModal';
        modal.className = 'modal';
        modal.style.cssText = `
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            width: 95%;
            height: 90%;
            max-width: 1200px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f9fafb;
        `;

        const title = document.createElement('h2');
        title.textContent = 'User Management';
        title.style.cssText = `
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
            color: #111827;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: background-color 0.2s;
        `;

        closeBtn.addEventListener('click', () => this.hideUserManagementModal());
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.backgroundColor = '#f3f4f6';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.backgroundColor = 'transparent';
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Create iframe container
        const iframeContainer = document.createElement('div');
        iframeContainer.style.cssText = `
            height: calc(100% - 80px);
            overflow: hidden;
        `;

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = this.userManagementUrl;
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;

        iframeContainer.appendChild(iframe);
        modalContent.appendChild(header);
        modalContent.appendChild(iframeContainer);
        modal.appendChild(modalContent);

        // Add to document
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideUserManagementModal();
            }
        });

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideUserManagementModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        return modal;
    }

    /**
     * Hide user management modal
     */
    hideUserManagementModal() {
        const modal = document.getElementById('userManagementModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Quick add user function that can be called from main platform
     */
    async quickAddUser(userData) {
        try {
            const response = await fetch(`${this.apiBase}/users-api.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create',
                    ...userData
                })
            });

            const result = await response.json();

            if (result.success) {
                // Trigger refresh in main platform if needed
                if (typeof refreshAllData === 'function') {
                    await refreshAllData();
                }
                
                return { success: true, user: result.user };
            } else {
                throw new Error(result.error || 'Failed to create user');
            }
        } catch (error) {
            console.error('Failed to add user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Quick edit user function
     */
    async quickEditUser(userId, userData) {
        try {
            const response = await fetch(`${this.apiBase}/users-api.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update',
                    id: userId,
                    ...userData
                })
            });

            const result = await response.json();

            if (result.success) {
                // Trigger refresh in main platform if needed
                if (typeof refreshAllData === 'function') {
                    await refreshAllData();
                }
                
                return { success: true, user: result.user };
            } else {
                throw new Error(result.error || 'Failed to update user');
            }
        } catch (error) {
            console.error('Failed to edit user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Show a compact user selector
     */
    async showUserSelector(onSelect, options = {}) {
        try {
            // Fetch users
            const response = await fetch(`${this.apiBase}/users-api.php`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to load users');
            }

            const users = result.users || [];

            // Create selector modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.cssText = `
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                align-items: center;
                justify-content: center;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            `;

            const header = document.createElement('div');
            header.style.cssText = `
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
                background: #f9fafb;
            `;

            const title = document.createElement('h3');
            title.textContent = options.title || 'Select User';
            title.style.cssText = `
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: #111827;
            `;

            header.appendChild(title);

            const userList = document.createElement('div');
            userList.style.cssText = `
                max-height: 400px;
                overflow-y: auto;
                padding: 10px;
            `;

            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.style.cssText = `
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    margin-bottom: 4px;
                `;

                userItem.addEventListener('mouseenter', () => {
                    userItem.style.backgroundColor = '#f3f4f6';
                });

                userItem.addEventListener('mouseleave', () => {
                    userItem.style.backgroundColor = 'transparent';
                });

                userItem.addEventListener('click', () => {
                    modal.remove();
                    document.body.style.overflow = 'auto';
                    onSelect(user);
                });

                const avatar = document.createElement('div');
                avatar.textContent = user.avatar || user.name?.charAt(0) || '?';
                avatar.style.cssText = `
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #2563eb;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    margin-right: 12px;
                `;

                const userDetails = document.createElement('div');
                userDetails.innerHTML = `
                    <div style="font-weight: 600; color: #111827;">${user.name}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${user.email}</div>
                `;

                userItem.appendChild(avatar);
                userItem.appendChild(userDetails);
                userList.appendChild(userItem);
            });

            const footer = document.createElement('div');
            footer.style.cssText = `
                padding: 16px 20px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: flex-end;
            `;

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.cssText = `
                padding: 8px 16px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: white;
                color: #374151;
                cursor: pointer;
                font-weight: 500;
            `;

            cancelBtn.addEventListener('click', () => {
                modal.remove();
                document.body.style.overflow = 'auto';
            });

            footer.appendChild(cancelBtn);

            content.appendChild(header);
            content.appendChild(userList);
            content.appendChild(footer);
            modal.appendChild(content);

            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    document.body.style.overflow = 'auto';
                }
            });

        } catch (error) {
            console.error('Failed to show user selector:', error);
        }
    }
}

// Create global instance
window.userManagementIntegration = new UserManagementIntegration();

// Export for module use
window.UserManagementIntegration = UserManagementIntegration; 