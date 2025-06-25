// Accounts Management JavaScript

// User Database - Persistent storage with localStorage backup
let USER_DATABASE = [];

// Initialize user database from localStorage or defaults
function initializeUserDatabase() {
    const savedUsers = localStorage.getItem('wolthers_users_database');
    if (savedUsers) {
        try {
            USER_DATABASE = JSON.parse(savedUsers);
            console.log(`Loaded ${USER_DATABASE.length} users from database`);
        } catch (e) {
            console.error('Error loading user database:', e);
            USER_DATABASE = getDefaultWolthersTeam();
            saveUserDatabase();
        }
    } else {
        USER_DATABASE = getDefaultWolthersTeam();
        saveUserDatabase();
        console.log('Initialized user database with Wolthers team');
    }
    
    // Update global references
    window.USER_DATABASE = USER_DATABASE;
    window.MOCK_USERS = USER_DATABASE;
}

// Core Wolthers team members - foundation users
function getDefaultWolthersTeam() {
    return [
        {
            id: "daniel-wolthers",
            name: "Daniel Wolthers",
            email: "daniel@wolthers.com",
            role: "admin",
            avatar: "DW",
            memberSince: "2024-01-01",
            tripPermissions: [],
            isCreator: true,
            lastActive: new Date().toISOString(),
            isWolthersTeam: true
        },
        {
            id: "svenn-wolthers",
            name: "Svenn Wolthers",
            email: "svenn@wolthers.com",
            role: "admin",
            avatar: "SW",
            memberSince: "2024-01-01",
            tripPermissions: [],
            isCreator: true,
            lastActive: new Date().toISOString(),
            isWolthersTeam: true
        },
        {
            id: "tom-wolthers",
            name: "Tom Wolthers",
            email: "tom@wolthers.com",
            role: "admin",
            avatar: "TW",
            memberSince: "2024-01-01",
            tripPermissions: [],
            isCreator: true,
            lastActive: new Date().toISOString(),
            isWolthersTeam: true
        },
        {
            id: "rasmus-wolthers",
            name: "Rasmus Wolthers",
            email: "rasmus@wolthers.com",
            role: "admin",
            avatar: "RW",
            memberSince: "2024-01-01",
            tripPermissions: [],
            isCreator: true,
            lastActive: new Date().toISOString(),
            isWolthersTeam: true
        }
    ];
}

// Save user database to localStorage
function saveUserDatabase() {
    try {
        localStorage.setItem('wolthers_users_database', JSON.stringify(USER_DATABASE));
        // Also save timestamp of last update
        localStorage.setItem('wolthers_users_last_updated', new Date().toISOString());
        
        // Update global references
        window.USER_DATABASE = USER_DATABASE;
        window.MOCK_USERS = USER_DATABASE;
    } catch (e) {
        console.error('Error saving user database:', e);
    }
}

// Make USER_DATABASE globally accessible
window.USER_DATABASE = USER_DATABASE;

// Compatibility - MOCK_USERS points to real database
const MOCK_USERS = USER_DATABASE;
window.MOCK_USERS = MOCK_USERS;

// Mock trips data - reset to empty for fresh start
const MOCK_TRIPS_ACCOUNTS = [];

// Current user data
let currentUser = {
    id: "daniel-wolthers",
    name: "Daniel Wolthers",
    email: "daniel@wolthers.com",
    role: "admin"
};

// Initialize accounts page
document.addEventListener('DOMContentLoaded', function() {
    initializeUserDatabase();
    initializeAccountsPage();
});

function initializeAccountsPage() {
    loadCurrentUserInfo();
    loadUsersList();
    loadTripAdminList();
    loadUserTrips();
    toggleAdminSections();
    setupFormHandlers();
    loadSettings();
    updateAccountsNavigationVisibility();
}

function loadCurrentUserInfo() {
    const user = getCurrentUser();
    
    document.getElementById('currentUserInfo').textContent = `${user.name} | ${user.role}`;
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileRole').textContent = user.role;
    document.getElementById('profileRole').className = `role-badge ${user.role}`;
}

function getCurrentUser() {
    return currentUser;
}

function toggleAdminSections() {
    const user = getCurrentUser();
    const adminSection = document.getElementById('adminSection');
    const userTripsSection = document.getElementById('userTripsSection');
    
    if (user.role === 'admin') {
        adminSection.style.display = 'block';
        userTripsSection.style.display = 'block';
    } else {
        adminSection.style.display = 'none';
        userTripsSection.style.display = 'block';
    }
}

function loadUsersList() {
    const usersList = document.getElementById('usersList');
    
    if (!usersList) return;
    
    // Add database info header
    const dbInfo = `
        <div class="database-info">
            <h4>User Database (${USER_DATABASE.length} users)</h4>
            <p>Last updated: ${localStorage.getItem('wolthers_users_last_updated') ? new Date(localStorage.getItem('wolthers_users_last_updated')).toLocaleString() : 'Never'}</p>
        </div>
    `;
    
    usersList.innerHTML = dbInfo + USER_DATABASE.map(user => `
        <div class="user-item" data-user-id="${user.id}">
            <div class="user-info">
                <div class="user-avatar" style="background: ${getUserAvatarColor(user.role)}">
                    ${user.avatar}
                </div>
                <div class="user-details">
                    <h4>${user.name}</h4>
                    <p>${user.email}</p>
                    <div class="user-badges">
                        <span class="role-badge ${user.role}">${user.role}</span>
                        ${user.isWolthersTeam ? '<span class="team-badge">Wolthers Team</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn-small btn-edit" onclick="editUser('${user.id}')">Edit</button>
                ${!user.isWolthersTeam ? `<button class="btn-small btn-delete" onclick="deleteUser('${user.id}')">Delete</button>` : ''}
            </div>
        </div>
    `).join('');
}

function getUserAvatarColor(role) {
    const colors = {
        admin: '#D4AF37',
        editor: '#2d5a47',
        guest: '#d2b48c'
    };
    return colors[role] || '#888';
}

function loadTripAdminList() {
    const tripAdminList = document.getElementById('tripAdminList');
    
    if (!tripAdminList) return;
    
    tripAdminList.innerHTML = MOCK_TRIPS_ACCOUNTS.map(trip => {
        const admins = MOCK_USERS.filter(user => 
            user.tripPermissions.includes(trip.id) && 
            (user.role === 'admin' || user.role === 'editor')
        );
        
        const creator = MOCK_USERS.find(user => user.id === trip.creator);
        
        return `
            <div class="trip-admin-item" data-trip-id="${trip.id}">
                <div class="trip-admin-info">
                    <h4>${trip.title}</h4>
                    <p>Created by: ${creator ? creator.name : 'Unknown'}</p>
                    <p>Date: ${formatDate(trip.date)}</p>
                    <div class="admin-badges">
                        ${admins.map(admin => `
                            <span class="admin-badge">${admin.name}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="trip-actions">
                    <button class="btn-small btn-edit" onclick="editTripAdmins('${trip.id}')">Manage Admins</button>
                </div>
            </div>
        `;
    }).join('');
}

function loadUserTrips() {
    const userTripsList = document.getElementById('userTripsList');
    const user = getCurrentUser();
    
    if (!userTripsList) return;
    
    const userTrips = MOCK_TRIPS_ACCOUNTS.filter(trip => 
        user.tripPermissions.includes(trip.id)
    );
    
    userTripsList.innerHTML = userTrips.map(trip => {
        const permissions = getUserTripPermissions(user, trip);
        
        return `
            <div class="user-trip-card" data-trip-id="${trip.id}">
                <h4>${trip.title}</h4>
                <p>Date: ${formatDate(trip.date)}</p>
                <p>Role: ${user.id === trip.creator ? 'Creator' : 'Administrator'}</p>
                
                <div class="trip-permissions">
                    ${permissions.map(permission => `
                        <div class="permission-item">
                            <span class="permission-icon">✓</span>
                            <span>${permission}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function getUserTripPermissions(user, trip) {
    const permissions = [];
    
    if (user.id === trip.creator || user.role === 'admin') {
        permissions.push('Edit itinerary');
        permissions.push('Manage participants');
        permissions.push('Send notifications');
        permissions.push('Modify trip details');
    } else if (user.role === 'editor') {
        permissions.push('Edit itinerary');
        permissions.push('Add notes');
    } else {
        permissions.push('View itinerary');
        permissions.push('Add personal notes');
    }
    
    return permissions;
}

function setupFormHandlers() {
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }
    
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfile);
    }
    
    const settingsCheckboxes = document.querySelectorAll('.settings-grid input[type="checkbox"]');
    settingsCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleSettingChange);
    });
    
    loadTripCheckboxes();
}

function loadTripCheckboxes() {
    const tripCheckboxContainer = document.getElementById('newUserTrips');
    
    if (!tripCheckboxContainer) return;
    
    tripCheckboxContainer.innerHTML = MOCK_TRIPS_ACCOUNTS.map(trip => `
        <div class="trip-checkbox-item">
            <input type="checkbox" id="trip-${trip.id}" value="${trip.id}">
            <label for="trip-${trip.id}" class="trip-checkbox-label">${trip.title}</label>
        </div>
    `).join('');
}

function handleAddUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const selectedTrips = Array.from(document.querySelectorAll('#newUserTrips input:checked'))
        .map(input => input.value);
    
    const newUser = {
        id: generateUserId(formData.get('newUserName')),
        name: formData.get('newUserName'),
        email: formData.get('newUserEmail'),
        role: formData.get('newUserRole'),
        avatar: generateUserAvatar(formData.get('newUserName')),
        memberSince: new Date().toISOString().split('T')[0],
        tripPermissions: selectedTrips,
        isCreator: false,
        lastActive: new Date().toISOString(),
        isWolthersTeam: false
    };
    
    // Check for duplicate email
    if (USER_DATABASE.find(user => user.email === newUser.email)) {
        showNotification(`A user with email ${newUser.email} already exists!`, 'error');
        return;
    }
    
    USER_DATABASE.push(newUser);
    saveUserDatabase();
    loadUsersList();
    
    // Refresh the modal user list if it's open
    if (typeof loadModalUsersList === 'function') {
        loadModalUsersList();
    }
    
    sendUserWelcomeEmail(newUser);
    hideAddUserModal();
    showNotification(`User ${newUser.name} has been added successfully!`, 'success');
    
    console.log(`New user added: ${newUser.name} (${newUser.email})`);
}

function handleEditProfile(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    currentUser.name = formData.get('editName');
    currentUser.email = formData.get('editEmail');
    
    const userIndex = MOCK_USERS.findIndex(user => user.id === currentUser.id);
    if (userIndex !== -1) {
        MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...currentUser };
    }
    
    loadCurrentUserInfo();
    hideEditProfileModal();
    showNotification('Profile updated successfully!', 'success');
}

function handleSettingChange(event) {
    const settingName = event.target.id;
    const isEnabled = event.target.checked;
    
    localStorage.setItem(`setting_${settingName}`, isEnabled);
    applySettingChange(settingName, isEnabled);
    showNotification(`Setting "${settingName}" ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
}

function applySettingChange(settingName, isEnabled) {
    switch(settingName) {
        case 'emailNotifications':
            console.log(`Email notifications ${isEnabled ? 'enabled' : 'disabled'}`);
            break;
        case 'dragDropEditing':
            console.log(`Drag & drop editing ${isEnabled ? 'enabled' : 'disabled'}`);
            break;
        case 'calendarSync':
            console.log(`Calendar sync ${isEnabled ? 'enabled' : 'disabled'}`);
            break;
        case 'guestEditing':
            console.log(`Guest editing ${isEnabled ? 'enabled' : 'disabled'}`);
            break;
    }
}

function loadSettings() {
    const settingsCheckboxes = document.querySelectorAll('.settings-grid input[type="checkbox"]');
    
    settingsCheckboxes.forEach(checkbox => {
        const savedValue = localStorage.getItem(`setting_${checkbox.id}`);
        if (savedValue !== null) {
            checkbox.checked = savedValue === 'true';
        }
    });
}

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'flex';
}

function hideAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
    document.getElementById('addUserForm').reset();
}

function editProfile() {
    const user = getCurrentUser();
    
    document.getElementById('editName').value = user.name;
    document.getElementById('editEmail').value = user.email;
    
    document.getElementById('editProfileModal').style.display = 'flex';
}

function hideEditProfileModal() {
    document.getElementById('editProfileModal').style.display = 'none';
    document.getElementById('editProfileForm').reset();
}

function editUser(userId) {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) return;
    
    alert(`Edit user: ${user.name}\nThis would open an edit modal in a full implementation.`);
}

function deleteUser(userId) {
    const user = USER_DATABASE.find(u => u.id === userId);
    if (!user) return;
    
    // Prevent deletion of Wolthers team members
    if (user.isWolthersTeam) {
        showNotification(`Cannot delete Wolthers team member: ${user.name}`, 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete user: ${user.name}?\n\nThis action cannot be undone.`)) {
        const userIndex = USER_DATABASE.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            USER_DATABASE.splice(userIndex, 1);
            saveUserDatabase();
            loadUsersList();
            
            // Refresh the modal user list if it's open
            if (typeof loadModalUsersList === 'function') {
                loadModalUsersList();
            }
            
            showNotification(`User ${user.name} has been deleted.`, 'success');
            console.log(`User deleted: ${user.name} (${user.email})`);
        }
    }
}

function editTripAdmins(tripId) {
    const trip = MOCK_TRIPS_ACCOUNTS.find(t => t.id === tripId);
    if (!trip) return;
    
    alert(`Manage administrators for: ${trip.title}\nThis would open an admin management modal in a full implementation.`);
}

function sendUserWelcomeEmail(user) {
    console.log(`Sending welcome email to ${user.email}`);
    
    setTimeout(() => {
        console.log(`Welcome email sent to ${user.name} at ${user.email}`);
    }, 1000);
}

function sendTripNotificationEmail(tripId, message) {
    const trip = MOCK_TRIPS_ACCOUNTS.find(t => t.id === tripId);
    if (!trip) return;
    
    const participants = MOCK_USERS.filter(user => 
        user.tripPermissions.includes(tripId)
    );
    
    console.log(`Sending trip notification for ${trip.title} to ${participants.length} participants`);
    
    participants.forEach(participant => {
        console.log(`Notification sent to ${participant.email}: ${message}`);
    });
}

function generateUserId(name) {
    return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
}

function generateUserAvatar(name) {
    const names = name.split(' ');
    return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 600;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-backdrop')) {
        const modal = event.target.parentElement;
        modal.style.display = 'none';
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="flex"]');
        openModals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

window.AccountsManager = {
    getCurrentUser,
    sendTripNotificationEmail,
    showNotification
};

// ============================================================================
// 🚗 MOBILE NAVIGATION FOR ACCOUNTS PAGE
// ============================================================================

/**
 * Toggle mobile navigation menu for accounts page
 */
function toggleAccountsMobileMenu() {
    const hamburger = document.getElementById('hamburgerMenuAccounts');
    const menu = document.getElementById('mobileNavMenuAccounts');
    
    if (hamburger && menu) {
        hamburger.classList.toggle('active');
        menu.classList.toggle('active');
        
        // Close menu when clicking outside
        if (menu.classList.contains('active')) {
            document.addEventListener('click', closeAccountsMobileMenuOnOutsideClick);
        } else {
            document.removeEventListener('click', closeAccountsMobileMenuOnOutsideClick);
        }
    }
}

/**
 * Close accounts mobile menu when clicking outside
 */
function closeAccountsMobileMenuOnOutsideClick(event) {
    const hamburger = document.getElementById('hamburgerMenuAccounts');
    const menu = document.getElementById('mobileNavMenuAccounts');
    
    if (hamburger && menu && 
        !hamburger.contains(event.target) && 
        !menu.contains(event.target)) {
        hamburger.classList.remove('active');
        menu.classList.remove('active');
        document.removeEventListener('click', closeAccountsMobileMenuOnOutsideClick);
    }
}

/**
 * Logout function for accounts page
 */
function logout() {
    // Clear session storage
    sessionStorage.removeItem('userSession');
    localStorage.removeItem('wolthers_auth');
    
    // Redirect to login page
    window.location.href = 'index.html';
}

/**
 * Update accounts navigation visibility based on user role
 */
function updateAccountsNavigationVisibility() {
    // Get current user
    const user = getCurrentUser();
    const role = user.role || 'employee';
    const isAdmin = role === 'admin';
    const isAdminOrDriver = isAdmin || role === 'driver';
    
    // Show/hide vehicles link based on admin/driver status
    const mobileVehiclesLink = document.getElementById('mobileVehiclesLink');
    
    if (mobileVehiclesLink) {
        mobileVehiclesLink.style.display = isAdminOrDriver ? 'flex' : 'none';
    }
    
    console.log(`Accounts navigation updated for ${user.name} (${role}):`, {
        canAccessVehicles: isAdminOrDriver
    });
} 