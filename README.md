
# 🌍 Wolthers & Associates - Trip Management System

> **Production System** | Live at [trips.wolthers.com](https://trips.wolthers.com)

A comprehensive trip management platform for Wolthers & Associates, designed to streamline coffee origin trips, partner coordination, and fleet management across Latin America.

---

## 🚀 **Live Production System**

- **🌐 Domain**: [https://trips.wolthers.com](https://trips.wolthers.com)
- **🏗️ Architecture**: Modular JavaScript + PHP APIs + MySQL
- **🔐 Authentication**: Microsoft Office 365 OAuth2
- **📱 UI**: Mobile-responsive, dark/light theme support
- **🖥️ Hosting**: Hostinger Linux server

---

## 🛠️ **Technology Stack**

### **Frontend**
- **Vanilla JavaScript** (ES6 modules, no frameworks)
- **Modular Architecture** - Separated concerns across modules
- **Responsive CSS** - Mobile-first design with theme support
- **Real-time APIs** - Direct production endpoint integration

### **Backend**
- **PHP 7.4+** - RESTful API endpoints
- **MySQL Database** - Secure production database
- **OAuth2 Integration** - Microsoft Azure AD authentication
- **Session Management** - Secure user sessions and role-based access

### **Infrastructure**
- **Hostinger Linux Server** - Production hosting environment
- **SSL/TLS Security** - HTTPS encryption
- **Secure Configuration** - Environment variables in `.secure-config/`

---

## 📁 **Project Structure**

```
trips.wolthers.com/
├── 📂 trips/                          # Main application files
│   ├── index.html                     # Dashboard (main entry)
│   ├── accounts.html                  # User management
│   ├── admin-vehicles.html            # Fleet management
│   └── auth-callback.html             # OAuth2 callback handler
│
├── 📂 js/                             # JavaScript modules
│   ├── 📂 modules/                    # Core business logic
│   │   ├── auth.js                    # Authentication & sessions
│   │   ├── trips.js                   # Trip CRUD operations
│   │   ├── users.js                   # User management
│   │   ├── companies.js               # Company management
│   │   ├── vehicles.js                # Fleet management
│   │   ├── ui.js                      # UI rendering & interactions
│   │   ├── utils.js                   # Utility functions
│   │   └── theme.js                   # Dark/light mode toggle
│   │
│   ├── 📂 pages/                      # Page-specific bootstraps
│   │   ├── index.bootstrap.js         # Dashboard initialization
│   │   ├── accounts.bootstrap.js      # Accounts page setup
│   │   └── admin-vehicles.bootstrap.js # Fleet page setup
│   │
│   ├── microsoft-auth.js              # Microsoft OAuth2 handler
│   └── main.js                        # Core application logic
│
├── 📂 api/                            # Backend API endpoints
│   ├── 📂 auth/                       # Authentication APIs
│   │   ├── microsoft-config.php       # OAuth2 configuration
│   │   ├── login.php                  # User authentication
│   │   ├── logout.php                 # Session termination
│   │   └── validate.php               # Session validation
│   │
│   ├── 📂 trips/                      # Trip management APIs
│   ├── 📂 users/                      # User management APIs
│   ├── 📂 companies/                  # Company management APIs
│   ├── 📂 vehicles/                   # Fleet management APIs
│   └── config.php                     # Database configuration
│
├── 📂 css/                            # Stylesheets
│   ├── style.css                      # Main application styles
│   └── trip-page.css                  # Trip-specific styles
│
└── 📂 images/                         # Static assets
    ├── wolthers-logo-*.svg            # Company branding
    └── 📂 members/                    # Team member photos
```

---

## 🔐 **Authentication System**

### **Microsoft Office 365 Integration**
- **Employee Access**: Direct login with company Microsoft accounts
- **Partner Access**: OAuth2-based account creation for trip invitees
- **Auto-Registration**: Partners are automatically registered when invited
- **Role Management**: Employee vs. Partner permissions

### **Authentication Flow**
1. User clicks "Sign in with Microsoft"
2. Redirected to Microsoft OAuth2 endpoint
3. User authenticates with Microsoft credentials
4. System validates token and creates/updates user record
5. Session established with appropriate role-based permissions

---

## ✨ **Core Features**

### 🗺️ **Trip Management**
- **Create & Edit Trips** - Full CRUD operations for coffee origin trips
- **Itinerary Planning** - Detailed day-by-day trip planning
- **Partner Coordination** - Invite and manage trip participants
- **Status Tracking** - Upcoming, ongoing, and completed trip status
- **Trip Codes** - Unique QR codes for easy trip identification

### 👥 **User & Company Management**
- **Employee Management** - Internal staff directory and permissions
- **Partner Companies** - External client and partner organization management
- **Role-Based Access** - Different permissions for employees vs. partners
- **Company Linking** - Associate users with their respective organizations

### 🚗 **Fleet Management** *(Admin Only)*
- **Vehicle Inventory** - Complete fleet tracking and management
- **Maintenance Scheduling** - Service records and upcoming maintenance
- **Driver Logs** - Trip assignments and driver tracking
- **Availability Management** - Real-time vehicle availability for trips

### 🎨 **User Experience**
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Dark/Light Theme** - User preference theme switching
- **Real-time Updates** - Live data synchronization
- **Intuitive Interface** - Clean, modern UI following design best practices

---

## 🚦 **Getting Started**

### **For Employees**
1. Visit [trips.wolthers.com](https://trips.wolthers.com)
2. Click "Sign in with Microsoft"
3. Use your Wolthers & Associates Microsoft account
4. Access full trip management and administrative features

### **For Partners**
1. Receive trip invitation email from Wolthers team
2. Click invitation link to access the platform
3. Sign in with Microsoft account (auto-registration)
4. View assigned trips and participate in trip coordination

---

## 🔧 **Development & Deployment**

### **Local Development**
```bash
# Clone the repository
git clone [repository-url]
cd trips-wolthers

# Set up local environment
# Configure database connection in api/config.php
# Set up Microsoft OAuth2 credentials

# Deploy to production
# Upload files to /home/u975408171/domains/trips.wolthers.com/public_html/
```

### **Production Environment**
- **Server**: Hostinger Linux hosting
- **Database**: MySQL with secure configuration
- **SSL**: HTTPS encryption enabled
- **Environment**: Production-optimized PHP and JavaScript

### **Security Configuration**
- Database credentials stored in `.secure-config/` (not in public directory)
- Microsoft OAuth2 credentials securely configured
- Session management with secure tokens
- HTTPS-only operation

---

## 📊 **System Architecture**

### **Modular Frontend Design**
- **Separation of Concerns** - Each module handles specific functionality
- **Reusable Components** - Shared utilities and UI components
- **Page-Specific Logic** - Bootstrap files initialize page-specific features
- **Theme Management** - Centralized theme switching and persistence

### **API-First Backend**
- **RESTful Endpoints** - Clean API design for all operations
- **Database Abstraction** - Secure database interaction layer
- **Authentication Middleware** - Consistent auth validation across endpoints
- **Error Handling** - Comprehensive error responses and logging

---

## 🎯 **Key Benefits**

- **🚀 Performance** - Lightweight vanilla JavaScript, no framework overhead
- **🔒 Security** - Microsoft OAuth2, secure database configuration
- **📱 Accessibility** - Mobile-responsive, WCAG-compliant interface
- **🔧 Maintainability** - Modular architecture, clean separation of concerns
- **⚡ Real-time** - Live data updates, no mock or placeholder data
- **🌍 Scalability** - Production-ready architecture supporting growth

---

## 📞 **Support & Contact**

**Wolthers & Associates**  
📧 Email: [Contact through company channels]  
🌐 Website: [trips.wolthers.com](https://trips.wolthers.com)  
🏢 Focus: Coffee origin trips and partner coordination

---

## 📝 **License & Usage**

This system is proprietary to Wolthers & Associates and is intended for internal use and authorized partner access only. Unauthorized access or distribution is prohibited.

---

*Last Updated: December 2024 | Production System v2.0*
