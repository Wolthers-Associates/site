# Trip Itineraries Management System - Production Version

🌐 **Production Domain**: https://trips.wolthers.com
🎯 **Purpose**: Real-time Trip & User Management for Wolthers & Associates

## 🌟 Overview

This is a professional trip management system for **Wolthers & Associates** coffee exploration tours. The platform now uses **real authentication** and live data APIs for secure, production-grade operations.

## ✨ Features

### 🔐 Authentication System (Production)
- **Microsoft Office 365 Login**: Secure authentication for both employees and partners
- **Partner Access**: Partners can log in with Microsoft if their email is registered, has been invited, or has received a trip itinerary
- **Auto-creation**: If a partner logs in with Microsoft and their email is found in invitations or trip participation, a partner account is auto-created
- **Session Management**: Secure tokens and session handling
- **Access Control**: Role-based permissions for users and partners

### 🧳 Trip & User Management
- **Trip Creation & Editing**: Add, update, and manage coffee exploration tours
- **User Management**: Add, edit, and delete users with real-time updates
- **Company Management**: Manage companies, link users, and assign roles
- **Live Data**: All data is loaded from and saved to the production database via API
- **Status Tracking**: Upcoming, ongoing, and completed trips

### 🎨 Modern UI/UX
- **Professional Design**: Clean, modern interface
- **Mobile-First**: Responsive across all devices
- **Brand Styling**: Coffee-themed, accessible, and WCAG compliant

## 🚀 Quick Start

1. **Open the website**: [https://trips.wolthers.com](https://trips.wolthers.com)
2. **Login**:
   - Employees: Use your Microsoft Office 365 credentials
   - Partners: Use your registered email or access code
3. **Manage**:
   - Trips, users, and companies in real time

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: PHP 7.4+, MySQL
- **Authentication**: Microsoft Office 365 (OAuth2)
- **APIs**: Live endpoints (see below)

## 🔗 Key API Endpoints

- **User Authentication**: `https://trips.wolthers.com/trips/api/auth/login.php`
- **User Management**: `https://trips.wolthers.com/users-api.php`
- **Company Management**: `https://trips.wolthers.com/companies-api.php`
- **Trip Management**: `https://trips.wolthers.com/trips/api/trips/list.php`, `get.php`, etc.

## 📱 Responsive Design

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## ⚡ Performance & Security

- **Fast Loading**: Optimized assets, minimal dependencies
- **Secure Authentication**: OAuth2, secure tokens
- **Live Data**: All operations use real-time API calls
- **Role-Based Access**: Fine-grained permissions for all users

## 📂 File Structure (Key Files)

```
trips.wolthers.com/
├── index.html                # Main application
├── trips/js/main.js          # Core logic (auth, API, UI)
├── trips/api/auth/           # Authentication endpoints
├── users-api.php             # User management API
├── companies-api.php         # Company management API
├── trips/api/trips/          # Trip management API
└── css/                      # Styling
```

## 🎯 Implementation Details

### Authentication Flow
1. **Employee Login**: Microsoft Office 365 OAuth2
2. **Partner Login**: Email/code validation via API
3. **Session Management**: Secure tokens, session expiry
4. **Access Control**: Role-based trip and company visibility

### User & Company Management
- **Live CRUD**: All user and company operations are real-time
- **Company Linking**: Users can be linked to multiple companies
- **Role Assignment**: Admin, editor, user, guest, etc.

### Trip Management
- **Live Data**: All trip data is loaded from and saved to the production database
- **Filtering**: Upcoming, ongoing, and completed trips
- **Details**: Full itinerary, participants, and logistics

### UI/UX Highlights
- **Loading States**: Smooth transitions and spinners
- **Error Handling**: User-friendly error messages
- **Accessibility**: Screen reader support, keyboard navigation

## 🐛 Testing Checklist

### Authentication Testing
- [x] Microsoft Office 365 login (employee)
- [x] Partner email/code login
- [x] Session persistence and logout
- [x] Role-based access control

### User & Trip Management Testing
- [x] User CRUD operations
- [x] Company CRUD operations
- [x] Trip CRUD operations
- [x] Real-time updates and UI refresh
- [x] Mobile responsiveness

---

**For any issues or support, please contact the Wolthers & Associates IT team.** 