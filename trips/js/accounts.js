// Accounts Management JavaScript

// Mock user data for development
const MOCK_USERS = [
    {
        id: "daniel-wolthers",
        name: "Daniel Wolthers",
        email: "daniel@wolthers.com",
        role: "admin",
        avatar: "DW",
        memberSince: "2024-01-01",
        tripPermissions: ["brazil-coffee-origins-2025", "ethiopia-birthplace-2025"],
        isCreator: true
    },
    {
        id: "svenn-wolthers",
        name: "Svenn Wolthers",
        email: "svenn@wolthers.com",
        role: "admin",
        avatar: "SW",
        memberSince: "2024-01-01",
        tripPermissions: ["colombia-highlands-2025"],
        isCreator: true
    },
    {
        id: "maria-santos",
        name: "Maria Santos",
        email: "maria@wolthers.com",
        role: "editor",
        avatar: "MS",
        memberSince: "2024-02-15",
        tripPermissions: ["brazil-coffee-origins-2025", "colombia-highlands-2025"],
        isCreator: false
    },
    {
        id: "john-client",
        name: "John Anderson",
        email: "john@company.com",
        role: "guest",
        avatar: "JA",
        memberSince: "2024-03-01",
        tripPermissions: ["brazil-coffee-origins-2025"],
        isCreator: false
    },
    {
        id: "sarah-partner",
        name: "Sarah Wilson",
        email: "sarah@business.org",
        role: "guest",
        avatar: "SW",
        memberSince: "2024-03-10",
        tripPermissions: ["brazil-coffee-origins-2025", "ethiopia-birthplace-2025"],
        isCreator: false
    }
];

// Mock trips data
const MOCK_TRIPS_ACCOUNTS = [
    {
        id: "brazil-coffee-origins-2025",
        title: "Brazil Coffee Origins Tour",
        date: "2025-07-01",
        creator: "daniel-wolthers"
    },
    {
        id: "colombia-highlands-2025",
        title: "Colombian Highland Discovery",
        date: "2025-08-10",
        creator: "svenn-wolthers"
    },
    {
        id: "ethiopia-birthplace-2025",
        title: "Ethiopia: Coffee's Birthplace",
        date: "2025-09-05",
        creator: "daniel-wolthers"
    }
];

// Current user data
let currentUser = {
    id: "daniel-wolthers",
    name: "Daniel Wolthers",
    email: "daniel@wolthers.com",
    role: "admin"
};

// Initialize accounts page
document.addEventListener('DOMContentLoaded', function() {
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
    
    usersList.innerHTML = MOCK_USERS.map(user => `
        <div class="user-item" data-user-id="${user.id}">
            <div class="user-info">
                <div class="user-avatar" style="background: ${getUserAvatarColor(user.role)}">
                    ${user.avatar}
                </div>
                <div class="user-details">
                    <h4>${user.name}</h4>
                    <p>${user.email}</p>
                    <p class="role-badge ${user.role}">${user.role}</p>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn-small btn-edit" onclick="editUser('${user.id}')">Edit</button>
                ${user.id !== currentUser.id ? `<button class="btn-small btn-delete" onclick="deleteUser('${user.id}')">Delete</button>` : ''}
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
        isCreator: false
    };
    
    MOCK_USERS.push(newUser);
    loadUsersList();
    sendUserWelcomeEmail(newUser);
    hideAddUserModal();
    showNotification(`User ${newUser.name} has been added successfully!`, 'success');
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
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Are you sure you want to delete user: ${user.name}?`)) {
        const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            MOCK_USERS.splice(userIndex, 1);
            loadUsersList();
            showNotification(`User ${user.name} has been deleted.`, 'warning');
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