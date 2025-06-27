# 👥 User Management System Guide

## Overview

The new User Management System is a standalone, modern solution for managing users in the Wolthers Trips platform. It provides full CRUD (Create, Read, Update, Delete) functionality with a clean, responsive interface.

## 🚀 Key Features

### ✅ **Full User Management**
- **Create** new users with complete profile information
- **View** all users in a searchable, filterable table
- **Edit** existing user details and permissions
- **Delete** users (with protection for Wolthers team members)

### ✅ **Advanced Functionality**
- **Real-time search** by name or email
- **Filter by role** (Admin, Editor, User)
- **Filter by company** affiliation
- **Timezone-aware** date formatting
- **Company integration** for user assignments

### ✅ **Modern UI/UX**
- **Responsive design** works on all devices
- **Toast notifications** for user feedback
- **Modal-based** forms for clean interactions
- **Loading states** and error handling
- **Keyboard shortcuts** (Escape to close modals)

## 📁 System Architecture

### **Files Structure**
```
trips/
├── user-management.html          # Standalone user management page
├── js/
│   ├── user-management.js        # Core user management functionality
│   └── modules/
│       └── user-management-integration.js  # Integration with main platform
└── test-user-management.html     # Test page for verification
```

### **API Integration**
- **Backend**: `https://trips.wolthers.com/users-api.php`
- **Companies**: `https://trips.wolthers.com/companies-api.php`
- **Authentication**: Integrated with existing Microsoft Auth system

## 🎯 How to Use

### **1. Standalone Access**
Visit: `https://trips.wolthers.com/user-management.html`

### **2. Integrated Access**
From the main platform, click "People" in the navigation menu.

### **3. Test the System**
Visit: `https://trips.wolthers.com/test-user-management.html`

## 🔧 Main Features

### **User Table**
- **Search**: Type in the search box to filter by name or email
- **Role Filter**: Select specific roles to view
- **Company Filter**: Filter users by company affiliation
- **Sort**: Click column headers to sort data

### **Add New User**
1. Click "**+ Add User**" button
2. Fill in required fields:
   - Full Name (required)
   - Email Address (required)
   - Phone Number (optional)
   - Role (User, Editor, Administrator)
   - Company affiliation
   - Company role and permissions
3. Click "**Add User**" to save

### **Edit User**
1. Click "**✏️ Edit**" button in the user row
2. Modify any field in the form
3. Click "**Update User**" to save changes

### **Delete User**
1. Click "**🗑️ Delete**" button in the user row
2. Confirm deletion in the dialog
3. User will be permanently removed

**Note**: Wolthers team members (@wolthers.com emails) cannot be deleted for security.

## 🔌 Integration Options

### **1. Modal Integration**
```javascript
// Show user management in a modal overlay
window.userManagementIntegration.showUserManagementModal();
```

### **2. Embed Integration**
```javascript
// Embed user management in a container
window.userManagementIntegration.embedUserManagement('containerId');
```

### **3. New Window Integration**
```javascript
// Open user management in new window
window.userManagementIntegration.openUserManagement();
```

### **4. Quick Functions**
```javascript
// Quick add user
const result = await window.userManagementIntegration.quickAddUser(userData);

// Quick edit user
const result = await window.userManagementIntegration.quickEditUser(userId, userData);

// Show user selector
window.userManagementIntegration.showUserSelector(onSelect, options);
```

## 🛠️ Technical Details

### **Frontend Technology**
- **Pure HTML5, CSS3, Vanilla JavaScript** (no frameworks)
- **ES6+ Modern JavaScript** with async/await
- **CSS Grid and Flexbox** for responsive layout
- **CSS Variables** for consistent theming

### **Backend Integration**
- **RESTful API** calls to trips.wolthers.com
- **JSON data exchange** format
- **Error handling** with user-friendly messages
- **Timezone support** for date formatting

### **Security Features**
- **Input validation** on both frontend and backend
- **XSS protection** through HTML escaping
- **Role-based permissions** enforcement
- **Protected deletion** for system users

## 🧪 Testing

### **Test Page Features**
The test page (`test-user-management.html`) provides:

1. **🚀 Standalone Test**: Opens user management in new window
2. **📱 Modal Test**: Tests modal integration
3. **🔗 API Test**: Verifies backend connectivity
4. **👥 User Selector Test**: Tests user selection functionality

### **Manual Testing Checklist**
- [ ] Can open user management page
- [ ] Can view existing users
- [ ] Can search and filter users
- [ ] Can add new user
- [ ] Can edit existing user
- [ ] Can delete user (non-Wolthers)
- [ ] Modals open and close properly
- [ ] API calls work correctly
- [ ] Error handling works
- [ ] Responsive design works on mobile

## 🔄 Migration from Old System

### **Benefits of New System**
- **Better Performance**: Direct API calls, no local storage dependencies
- **Real-time Data**: Always shows current backend data
- **Better UX**: Modern interface with proper loading states
- **More Reliable**: Proper error handling and validation
- **Maintainable**: Clean, modular code structure

### **Backwards Compatibility**
- The old system functions are still available
- New system integrates seamlessly with existing authentication
- No disruption to current workflows

## 📞 Support

### **Common Issues**
1. **User not found**: Refresh the page to reload data
2. **Cannot edit**: Check user permissions and role
3. **API errors**: Verify internet connection and backend status
4. **Modal not opening**: Check browser popup blockers

### **Debugging**
- Open browser console (F12) to see detailed error messages
- Check the test page for system health
- Verify API connectivity using the test functions

## 🎉 Success!

Your new User Management System is now ready to use! It provides a modern, efficient way to manage users with full integration to the trips.wolthers.com platform.

**Key Benefits:**
- ✅ **Modern UI/UX** - Clean, responsive interface
- ✅ **Full Functionality** - Complete CRUD operations  
- ✅ **Real-time Data** - Always current information
- ✅ **Easy Integration** - Multiple integration options
- ✅ **Reliable** - Proper error handling and validation 