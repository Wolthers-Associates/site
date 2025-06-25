// Production Configuration - NO DEVELOPMENT MODE
const CONFIG = {
    DEVELOPMENT_MODE: false,
    DOMAIN: 'trips.wolthers.com',
    API_BASE: '/api',
    VERSION: '1.0.0'
};

// Global Application State
let currentUser = null;
let currentTrips = [];
let selectedTrip = null;
let microsoftAuth = null;
let USER_DATABASE = [];

// Dark mode logo handling
function updateLogoForColorScheme() {
    const logo = document.querySelector('.main-logo');
    if (!logo) return;
    
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
        logo.src = 'images/wolthers-logo-green.svg';
    } else {
        logo.src = 'images/wolthers-logo-off-white.svg';
    }
}

// Listen for color scheme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateLogoForColorScheme);

// Mock data for development - will be replaced with API calls
const MOCK_TRIPS = [
    {
        id: 'upcoming-sample-trip',
        title: 'Upcoming Sample Trip',
        description: 'This is a sample upcoming trip for testing purposes.',
        date: '2025-02-15',
        endDate: '2025-02-22',
        guests: 'Sample Participants',
        cars: '2 SUVs',
        driver: 'Local Driver',
        status: 'upcoming',
        partnerEmails: ['sample@example.com'],
        partnerCodes: ['BRAZIL2025', 'COLOMBIA2025', 'ETHIOPIA2025']
    }
    // Add mock trips here or load from API
];

const MOCK_CREDENTIALS = {
    // Development credentials for testing
    wolthers: ['daniel@wolthers.com', 'svenn@wolthers.com', 'tom@wolthers.com', 'rasmus@wolthers.com'],
    tripCodes: ['BRAZIL2025', 'COLOMBIA2025', 'ETHIOPIA2025']
};

// ============================================================================
// 🤖 AI TRIP CODE GENERATOR SYSTEM
// ============================================================================

/**
 * Company Abbreviation Mapping System
 * Handles intelligent abbreviation generation for company names
 */
const COMPANY_ABBREVIATIONS = {
    // Pre-defined recognizable company mappings
    'mitsui': 'MITSUI',
    'mitsui & co': 'MITSUI',
    'cape horn coffees': 'CHC',
    'douqué': 'DQ',
    'blaser': 'BT',
    'blaser trading': 'BT',
    'equatorial': 'EQT',
    'equatorial coffee': 'EQT',
    'volcafe': 'VOLC',
    'neumann': 'NEUM',
    'ed&f man': 'EDF',
    'sucafina': 'SUCA',
    'olam': 'OLAM',
    'louis dreyfus': 'LDC',
    'cargill': 'CARG',
    'coffee holding': 'CHC',
    'royal coffee': 'ROYAL',
    'green coffee company': 'GCC',
    'specialty coffee': 'SPEC',
    'importers alliance': 'IMPA',
    'atlantic specialty coffee': 'ASC',
    'red fox coffee': 'RFX',
    'genuine origin': 'GO',
    'ally coffee': 'ALLY',
    'coffee beans international': 'CBI',
    'sustainable harvest': 'SH',
    'wolthers & associates': 'WA',
    'wolthers': 'WA'
};

/**
 * AI Trip Code Generator Class
 * Generates intelligent, memorable trip codes following business rules
 */
class TripCodeGenerator {
    constructor() {
        this.existingCodes = new Set();
        this.loadExistingCodes();
    }

    /**
     * Load existing trip codes to prevent duplicates
     */
    loadExistingCodes() {
        // Load from mock data
        MOCK_TRIPS.forEach(trip => {
            if (trip.partnerCodes) {
                trip.partnerCodes.forEach(code => this.existingCodes.add(code));
            }
        });
        
        // Add hardcoded existing codes
        ['BRAZIL2025', 'COLOMBIA2025', 'ETHIOPIA2025', 'GUATEMALA2024'].forEach(code => {
            this.existingCodes.add(code);
        });
    }

    /**
     * Generate company abbreviation with intelligent logic
     * @param {string} companyName - Full company name
     * @returns {string} - Company abbreviation (2-5 chars)
     */
    generateCompanyAbbreviation(companyName) {
        if (!companyName) return 'GEN'; // Generic fallback
        
        const cleaned = companyName.toLowerCase().trim();
        
        // Check predefined mappings first
        if (COMPANY_ABBREVIATIONS[cleaned]) {
            return COMPANY_ABBREVIATIONS[cleaned];
        }
        
        // Smart abbreviation generation
        const words = cleaned
            .replace(/[^a-z0-9\s]/g, '') // Remove special chars
            .split(/\s+/)
            .filter(word => word.length > 0);
        
        if (words.length === 1) {
            // Single word: take first 3-4 characters
            const word = words[0];
            if (word.length <= 3) return word.toUpperCase();
            if (word.length <= 5) return word.toUpperCase();
            return word.substring(0, 4).toUpperCase();
        } else if (words.length === 2) {
            // Two words: take first 2-3 chars of each
            const first = words[0].substring(0, 2);
            const second = words[1].substring(0, 2);
            return (first + second).toUpperCase();
        } else {
            // Multiple words: take first letter of each (max 5)
            const initials = words.slice(0, 5).map(word => word[0]).join('');
            return initials.toUpperCase();
        }
    }

    /**
     * Generate guest surname abbreviation
     * @param {string} guestName - Main guest name or participant list
     * @returns {string} - Surname abbreviation (3-4 chars)
     */
    generateGuestAbbreviation(guestName) {
        if (!guestName) return 'ANON';
        
        // Extract surnames from participant list or single name
        const names = guestName.split(/[,\n\r]+/).map(name => name.trim());
        const mainName = names[0] || guestName;
        
        // Get surname (last word typically)
        const nameParts = mainName.split(/\s+/).filter(part => part.length > 0);
        const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
        
        if (!surname) return 'ANON';
        
        // Clean and format surname
        const cleaned = surname.replace(/[^a-zA-Z]/g, '');
        if (cleaned.length <= 4) return cleaned.toUpperCase();
        
        return cleaned.substring(0, 4).toUpperCase();
    }

    /**
     * Generate random month format
     * @param {Date} date - Trip start date
     * @returns {string} - Month in random format
     */
    generateMonthFormat(date) {
        const month = date.getMonth();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthNamesLong = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
        
        const formats = [
            monthNames[month],                           // "Jan"
            String(month + 1).padStart(2, '0'),        // "01"
            monthNamesLong[month]                       // "January"
        ];
        
        return formats[Math.floor(Math.random() * formats.length)];
    }

    /**
     * Generate random year format
     * @param {Date} date - Trip start date
     * @returns {string} - Year in random format
     */
    generateYearFormat(date) {
        const year = date.getFullYear();
        const formats = [
            String(year).slice(-2),  // "25"
            String(year)             // "2025"
        ];
        
        return formats[Math.floor(Math.random() * formats.length)];
    }

    /**
     * Generate unique suffix if needed
     * @param {string} baseCode - Base code without suffix
     * @returns {string} - Suffix (empty or 2-digit number)
     */
    generateUniqueSuffix(baseCode) {
        if (!this.existingCodes.has(baseCode)) {
            return '';
        }
        
        // Try suffixes 01-99
        for (let i = 1; i <= 99; i++) {
            const suffix = String(i).padStart(2, '0');
            const codeWithSuffix = `${baseCode}-${suffix}`;
            if (!this.existingCodes.has(codeWithSuffix)) {
                return `-${suffix}`;
            }
        }
        
        // Fallback: use random suffix
        const randomSuffix = Math.floor(Math.random() * 99) + 1;
        return `-${String(randomSuffix).padStart(2, '0')}`;
    }

    /**
     * Main trip code generation function
     * @param {Object} tripData - Trip information
     * @returns {Object} - Generated code info
     */
    generateTripCode(tripData) {
        const {
            companyName = '',
            guestName = '',
            startDate = new Date(),
            title = ''
        } = tripData;

        const tripDate = new Date(startDate);
        
        // Generate components
        const companyAbbrev = this.generateCompanyAbbreviation(companyName);
        const guestAbbrev = this.generateGuestAbbreviation(guestName);
        const monthFormat = this.generateMonthFormat(tripDate);
        const yearFormat = this.generateYearFormat(tripDate);
        
        // Build base code components
        const components = [companyAbbrev, guestAbbrev, monthFormat];
        
        // Add year if total length allows
        let baseCode = components.join('-');
        if (baseCode.length + yearFormat.length + 1 <= 13) { // Leave room for suffix
            baseCode += `-${yearFormat}`;
        }
        
        // Ensure maximum 15 characters total
        if (baseCode.length > 13) {
            // Trim components if too long
            const maxCompanyLen = Math.min(companyAbbrev.length, 4);
            const maxGuestLen = Math.min(guestAbbrev.length, 3);
            const trimmedCompany = companyAbbrev.substring(0, maxCompanyLen);
            const trimmedGuest = guestAbbrev.substring(0, maxGuestLen);
            baseCode = `${trimmedCompany}-${trimmedGuest}-${monthFormat}`;
        }
        
        // Add unique suffix if needed
        const suffix = this.generateUniqueSuffix(baseCode);
        const finalCode = baseCode + suffix;
        
        // Add to existing codes set
        this.existingCodes.add(finalCode);
        
        return {
            code: finalCode,
            components: {
                company: companyAbbrev,
                guest: guestAbbrev,
                month: monthFormat,
                year: yearFormat,
                suffix: suffix.replace('-', '')
            },
            metadata: {
                originalCompany: companyName,
                originalGuest: guestName,
                tripDate: tripDate.toISOString().split('T')[0],
                generatedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Generate QR code data URL for a trip code
     * @param {string} tripCode - The trip code
     * @param {Object} tripData - Additional trip data for QR
     * @returns {string} - QR code data URL
     */
    generateQRCode(tripCode, tripData = {}) {
        // For now, return a placeholder. In production, use QR library
        const qrData = {
            code: tripCode,
            trip: tripData.title || 'Wolthers Coffee Trip',
            url: `${window.location.origin}/trips/?code=${tripCode}`,
            company: 'Wolthers & Associates'
        };
        
        // Placeholder QR code (in production, use a QR library like qrcode.js)
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="white"/>
                <rect x="20" y="20" width="160" height="160" fill="black"/>
                <rect x="30" y="30" width="140" height="140" fill="white"/>
                <text x="100" y="90" text-anchor="middle" font-size="12" font-family="monospace" fill="black">${tripCode}</text>
                <text x="100" y="110" text-anchor="middle" font-size="8" font-family="Arial" fill="black">Wolthers Trips</text>
                <text x="100" y="125" text-anchor="middle" font-size="6" font-family="Arial" fill="black">${qrData.url}</text>
            </svg>
        `)}`;
    }
}

// Initialize the trip code generator
const tripCodeGenerator = new TripCodeGenerator();

// Utility Functions
const utils = {
    // Format date for display
    formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Format date range
    formatDateRange: (startDate, endDate) => {
        const start = utils.formatDate(startDate);
        const end = utils.formatDate(endDate);
        return `${start} - ${end}`;
    },

    // Calculate trip duration
    getTripDuration: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },

    // Show loading spinner
    showLoading: () => {
        document.getElementById('loadingSpinner').style.display = 'flex';
    },

    // Hide loading spinner
    hideLoading: () => {
        document.getElementById('loadingSpinner').style.display = 'none';
    },

    // Show notification (simple alert for now)
    showNotification: (message, type = 'info') => {
        // In a real app, this would be a toast notification
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        alert(`${icon} ${message}`);
    },

    // Show error message
    showError: (message) => {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.classList.remove('show');
            }, 5000);
        } else {
            // Fallback to alert if error div not found
            alert(`❌ ${message}`);
        }
    },

    // Debounce function for search/filtering
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Enhanced Authentication Functions
const auth = {
    // Real authentication only
    init: async () => {
        const session = sessionStorage.getItem('userSession');
        if (session) {
            try {
                const userData = JSON.parse(session);
                if (await auth.validateSession(userData)) {
                                    currentUser = userData.user;
                ui.showDashboard();
                updateNavigationVisibility(currentUser);
                await trips.loadTrips();
                    return;
                }
            } catch (e) {
                sessionStorage.removeItem('userSession');
            }
        }
        ui.showLogin();
    },

    // Real session validation
    validateSession: async (userData) => {
        try {
            const response = await fetch('/api/auth/validate.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_token: userData.token })
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    // Real Office 365 authentication
    signInWithMicrosoft: async () => {
        try {
            if (!microsoftAuth) {
                throw new Error('Microsoft authentication not initialized. Please check Azure AD configuration.');
            }
            
            utils.showLoading();
            const result = await microsoftAuth.signIn();
            
            // The Microsoft auth returns data from auth-callback.html
            // which already contains the authenticated user data
            if (result && result.user) {
                // The auth-callback.html already processed the Microsoft token
                // and stored the authenticated user data
                sessionStorage.setItem('userSession', JSON.stringify(result));
                currentUser = result.user;
                
                // Store user in system database for admin visibility
                await addUserToSystemDatabase(result.user);
                
                utils.hideLoading();
                ui.showDashboard();
                updateNavigationVisibility(currentUser);
                await trips.loadTrips();
            } else {
                utils.hideLoading();
                console.error('Microsoft auth result:', result);
                throw new Error('Microsoft authentication was cancelled or failed');
            }
        } catch (error) {
            utils.hideLoading();
            console.error('Microsoft sign-in error:', error);
            utils.showError('Microsoft sign-in failed: ' + error.message);
        }
    },

    // Real email authentication
    handleEmailLogin: async (e) => {
        e.preventDefault();
        const email = document.getElementById('primaryInput').value.trim();
        
        if (!email || !email.includes('@')) {
            utils.showError('Please enter a valid email address');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/check-user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            if (data.success) {
                auth.currentEmail = email;
                if (data.user_type === 'employee') {
                    auth.showStep2(data.user.name);
            } else {
                    auth.showStep3(email);
                }
            } else {
                utils.showError(data.error || 'Email not found');
            }
        } catch (error) {
            utils.showError('Authentication error: ' + error.message);
        }
    },

    // Remove all mock functions (mockUserCheck, mockRegularLogin, mockPasscodeLogin)
    
    // Login step functions
    showStep2: (userName) => {
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step2').classList.add('active');
        document.getElementById('welcomeMessage').innerHTML = `<h3>Welcome back, ${userName}!</h3>`;
    },
    
    showStep3: (email) => {
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step3').classList.add('active');
        document.getElementById('emailToConfirm').textContent = email;
    },
    
    showStep4: (email) => {
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step4').classList.add('active');
        document.getElementById('emailForCode').textContent = email;
    },
    
    goBackToStep1: () => {
        document.querySelectorAll('.login-step').forEach(step => step.classList.remove('active'));
        document.getElementById('step1').classList.add('active');
        document.getElementById('primaryInput').value = '';
        document.getElementById('errorMessage').classList.remove('show');
    },
    
    goBackToStep2: () => {
        document.getElementById('step4').classList.remove('active');
        document.getElementById('step2').classList.add('active');
    },
    
    logout: () => {
        // Clear all session data
        sessionStorage.removeItem('userSession');
        localStorage.removeItem('wolthers_auth');
        currentUser = null;
        
        // Reload the page to show login form (since login container was removed)
        window.location.reload();
    }
};

// UI Management Functions
const ui = {
    // Show login screen
    showLogin: () => {
        document.getElementById('loginContainer').style.display = 'block';
        document.getElementById('mainContainer').style.display = 'none';
    },
    
    // Show dashboard/main content after authentication
    showDashboard: () => {
            ui.showMainContent();
    },
    
    // Show main content after authentication
    showMainContent: () => {
        const loginContainer = document.getElementById('loginContainer');
        const mainContainer = document.getElementById('mainContainer');
        
        if (loginContainer) {
            loginContainer.style.display = 'none';
            loginContainer.remove(); // Completely remove the login form from DOM
        }
        if (mainContainer) {
            mainContainer.style.display = 'block';
        }
        
            // Update user info
    document.getElementById('userInfo').textContent = 
        `Welcome, ${currentUser.name} | Wolthers & Associates - Internal Access Only`;
    
    // Show add trip button for employees (handled in renderTrips now)
    console.log('✅ User can add trips:', currentUser.canAddTrips);
    
    // Update navigation visibility based on user role
    updateNavigationVisibility(currentUser);
    
    // Load trips
    trips.loadTrips();
    },

    // Create trip card HTML
    createTripCard: (trip, status) => {
        const startDate = utils.formatDate(trip.date);
        const endDate = utils.formatDate(trip.endDate);
        const duration = utils.getTripDuration(trip.date, trip.endDate);
        const daysUntilStart = getDaysUntilStart(trip.date);
        const daysLeft = getDaysLeft(trip.endDate);
        const totalDays = getTotalDays(trip.date, trip.endDate);
        const ongoing = isOngoing(trip.date, trip.endDate);
        
        // Get Wolthers staff attending
        const wolthersStaff = trip.wolthersGuide || trip.createdBy || 'Daniel Wolthers';
        
        // Get trip codes for display
        const tripCodes = trip.partnerCodes || [];

        return `
            <div class="trip-card ${status}" onclick="trips.openTrip('${trip.id}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') trips.openTrip('${trip.id}')">
                <div class="trip-card-header">
                    <div class="trip-title">${trip.title}</div>
                    <div class="trip-date">${startDate} - ${endDate}</div>
                    <div class="trip-total-days">Total trip duration: ${totalDays} days</div>
                </div>
                
                <div class="trip-description">${trip.description}</div>
                
                <div class="trip-meta">
                    ${trip.guests ? `<div class="trip-guests"><img src="images/user.svg" alt="User" style="height:18px;vertical-align:middle;margin-right:6px;"> ${trip.guests}</div>` : ''}
                    ${trip.cars ? `
                        <div class="trip-cars">
                            <img src="images/disco-icon.png" alt="Vehicle" class="disco-icon-card">
                            ${trip.cars}
                        </div>
                        ${trip.driver ? `
                        <div class="trip-driver">
                            Driver: ${trip.driver}
                        </div>
                        ` : ''}
                    ` : ''}
                </div>
                
                <div class="trip-status status-${status}">
                    ${status === 'upcoming' ? (
                      daysUntilStart > 0 ? `UPCOMING (${daysUntilStart} days to go)` : ongoing ? 'ONGOING' : 'UPCOMING (Starts today)'
                    ) : status === 'completed' ? 'COMPLETED' : ongoing ? 'ONGOING' : 'COMPLETED'}
                </div>
                
                <div class="trip-footer">
                    <div class="trip-wolthers-staff">
                        <strong>Wolthers Guide:</strong> ${wolthersStaff}
                    </div>
                    
                    ${tripCodes.length > 0 ? `
                        <div class="trip-codes">
                            🔑 ${tripCodes.join(', ')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // Create add trip card HTML
    createAddTripCard: () => {
        return `
            <div class="trip-card add-trip-card" onclick="ui.showAddTripModal()" role="button" tabindex="0" onkeypress="if(event.key==='Enter') ui.showAddTripModal()" onmousemove="ui.moveTooltip(event)" onmouseleave="ui.hideTooltip(event)">
                <div class="add-trip-content">
                    <div class="add-trip-icon">+</div>
                    <div class="add-trip-tooltip" id="addTripTooltip">Add New Trip</div>
                </div>
            </div>
        `;
    },

    // Move tooltip with mouse
    moveTooltip: (event) => {
        const tooltip = document.getElementById('addTripTooltip');
        if (tooltip) {
            tooltip.style.left = event.clientX + 'px';
            tooltip.style.top = (event.clientY - 45) + 'px';
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
            tooltip.style.position = 'fixed';
            tooltip.style.transform = 'translateX(-50%)';
        }
    },

    // Hide tooltip
    hideTooltip: (event) => {
        const tooltip = document.getElementById('addTripTooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
        }
    },

    // Render trips in container
    renderTrips: (containerId, tripList, status) => {
        const container = document.getElementById(containerId);
        
        let html = '';
        
        // Add the "Add Trip" button as first card for upcoming trips if user can add trips
        const isWolthersAdmin = currentUser && currentUser.email && currentUser.email.endsWith('@wolthers.com');
        if (containerId === 'upcomingTrips' && currentUser && (currentUser.canAddTrips || isWolthersAdmin)) {
            html += ui.createAddTripCard();
        }
        
        if (tripList.length === 0 && containerId !== 'upcomingTrips') {
            container.innerHTML = `<div class="no-trips">No ${status} trips found</div>`;
            return;
        }
        
        if (tripList.length === 0 && containerId === 'upcomingTrips' && currentUser && (currentUser.canAddTrips || isWolthersAdmin)) {
            // Show only the add trip card
            container.innerHTML = html;
            return;
        }
        
        html += tripList
            .map(trip => ui.createTripCard(trip, status))
            .join('');
            
        container.innerHTML = html;
    },

    // Show add trip modal
    showAddTripModal: () => {
        document.getElementById('addTripModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on title
        setTimeout(() => document.getElementById('tripTitle').focus(), 100);
    },

    // Hide add trip modal
    hideAddTripModal: () => {
        document.getElementById('addTripModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('addTripForm').reset();
    },

    // Show trip preview sidebar
    showTripPreview: (trip) => {
        const sidebar = document.getElementById('tripPreviewSidebar');
        const content = document.getElementById('tripPreviewContent');
        
        const duration = utils.getTripDuration(trip.date, trip.endDate);
        const dateRange = utils.formatDateRange(trip.date, trip.endDate);
        const daysUntilStart = getDaysUntilStart(trip.date);
        const daysLeft = getDaysLeft(trip.endDate);
        const totalDays = getTotalDays(trip.date, trip.endDate);
        const ongoing = isOngoing(trip.date, trip.endDate);
        
        let daysHTML = '';
        if (trip.itinerary && trip.itinerary.length > 0) {
            daysHTML = `
                <div class="trip-preview-days">
                    <h4 class="preview-section-title">Daily Overview</h4>
                    ${trip.itinerary.map(day => `
                        <div class="preview-day-item">
                            <div class="preview-day-header">
                                <span class="preview-day-number">Day ${day.day}</span>
                                <span class="preview-day-date">${utils.formatDate(day.date)}</span>
                            </div>
                            <div class="preview-day-title">${day.title}</div>
                            <div class="preview-day-summary">${day.summary}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        let statusText = daysUntilStart > 0 ? `Starts in ${daysUntilStart} days` : ongoing ? 'Ongoing' : 'Completed';
        
        // Use light mode user icon for better visibility in overview
        const userIcon = 'images/user-LM.svg';
        
        let overviewHTML = `
            <div class="trip-preview-info">
                ${trip.guests ? `
                <div class="preview-info-item">
                    <img src="${userIcon}" alt="User" style="height:18px;vertical-align:middle;margin-right:6px;">
                    <span>${trip.guests}</span>
                </div>
                ` : ''}
                ${trip.cars ? `
                <div class="preview-info-item">
                    <img src="images/disco-icon.png" alt="Car" style="height:18px;vertical-align:middle;margin-right:6px;">
                    <span>${trip.cars}</span>
                </div>
                ` : ''}
                </div>
        `;
        
        content.innerHTML = `
            <div class="trip-preview-header">
                <h3 class="trip-preview-title">${trip.title}</h3>
                <div class="trip-preview-dates">${dateRange}</div>
                <div class="trip-total-days">Total trip duration: ${totalDays} days | ${statusText}</div>
                ${overviewHTML}
                ${trip.wolthersGuide ? `<div class="trip-preview-guide">Guided by: ${trip.wolthersGuide}</div>` : ''}
                <div class="trip-preview-description">${trip.description}</div>
                <div class="trip-preview-actions">
                    <button class="preview-btn secondary" onclick="ui.hideTripPreview()">Close</button>
                    <button class="preview-btn primary" onclick="trips.openFullTrip('${trip.id}')">Open Trip</button>
                </div>
            </div>
            <div class="trip-preview-body">
            ${trip.highlights && trip.highlights.length > 0 ? `
            <div class="trip-preview-highlights">
                <h4 class="preview-section-title">Highlights</h4>
                ${trip.highlights.map(highlight => `
                    <div class="preview-highlight-item">${highlight}</div>
                `).join('')}
            </div>
            ` : ''}
            ${daysHTML}
            </div>
        `;
        
        sidebar.classList.add('open');
    },
    
    // Hide trip preview sidebar
    hideTripPreview: () => {
        const sidebar = document.getElementById('tripPreviewSidebar');
        sidebar.classList.remove('open');
        selectedTrip = null;
    },

    // Show trip itinerary modal
    showTripItineraryModal: (trip) => {
        const modal = document.getElementById('tripDetailModal');
        const content = document.getElementById('tripDetailContent');
        
        const duration = utils.getTripDuration(trip.date, trip.endDate);
        const dateRange = utils.formatDateRange(trip.date, trip.endDate);
        
        // Replace content class for itinerary styling
        content.className = 'trip-itinerary-content';
        
        let itineraryHTML = '';
        if (trip.itinerary && trip.itinerary.length > 0) {
            itineraryHTML = `
                <div class="itinerary-section">
                    <h3 class="itinerary-section-title">Daily Itinerary</h3>
                    <div class="daily-itinerary">
                        ${trip.itinerary.map(day => `
                            <div class="day-item">
                                <div class="day-header">
                                    <div class="day-title">
                                        <div class="day-number">Day ${day.day}</div>
                                        <div class="day-date">${utils.formatDate(day.date)}</div>
                                        <h4 style="color: var(--dark-green); margin-top: 8px; font-size: 1.1rem;">${day.title}</h4>
                                    </div>
                                    <button class="day-calendar-btn" onclick="calendar.addDayToCalendar('${trip.id}', ${day.day})">
                                        📅 Add to Calendar
                                    </button>
                                </div>
                                
                                <div class="day-activities">
                                    ${day.activities.map(activity => `
                                        <div class="activity-item">
                                            <div class="activity-time">${activity.time}</div>
                                            <div class="activity-content">
                                                <div class="activity-title">${activity.title}</div>
                                                <div class="activity-description">${activity.description}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                
                                <div class="day-summary">
                                    <div class="day-summary-title">Day Summary</div>
                                    <div class="day-summary-text">${day.summary}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        content.innerHTML = `
            <div class="trip-itinerary-header">
                <h2 class="trip-itinerary-title">${trip.title}</h2>
                <div class="trip-itinerary-dates">${dateRange}</div>
                <div class="trip-itinerary-description">${trip.description}</div>
                
                <div class="trip-info-bar">
                    ${trip.guests ? `
                    <div class="trip-info-item">
                        <img src="images/user.svg" alt="User" style="height:18px;vertical-align:middle;margin-right:6px;">
                        <span>${trip.guests}</span>
                    </div>
                    ` : ''}
                    
                    ${trip.cars ? `
                    <div class="trip-info-item">
                        <img src="images/disco-icon.png" alt="Car" style="height:18px;vertical-align:middle;margin-right:6px;">
                        <span>${trip.cars}</span>
                    </div>
                    ` : ''}
                    
                    <div class="trip-info-item">
                        <span class="trip-info-icon">📅</span>
                        <span>${duration} days</span>
                    </div>
                    
                    <div class="trip-info-item">
                        <span class="trip-info-icon">✨</span>
                        <span>${trip.status === 'upcoming' ? 'Upcoming' : 'Completed'}</span>
                    </div>
                </div>
                
                <div class="trip-calendar-actions">
                    <button class="calendar-btn primary" onclick="calendar.addTripToCalendar('${trip.id}')">
                        📅 Add Entire Trip to Calendar
                    </button>
                    <button class="calendar-btn" onclick="calendar.downloadItinerary('${trip.id}')">
                        📄 Download Itinerary
                    </button>
                    <button class="calendar-btn" onclick="calendar.shareTrip('${trip.id}')">
                        📤 Share Trip
                    </button>
                </div>
            </div>
            
            <div class="trip-itinerary-body">
                ${itineraryHTML}
                
                ${trip.highlights && trip.highlights.length > 0 ? `
                <div class="itinerary-section">
                    <h3 class="itinerary-section-title">Trip Highlights</h3>
                    <div class="trip-detail-grid">
                        ${trip.highlights.map(highlight => `
                            <div class="trip-detail-item">
                                <div class="trip-detail-value">• ${highlight}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="itinerary-section">
                    <h3 class="itinerary-section-title">Trip Information</h3>
                    <div class="trip-detail-grid">
                        ${trip.accommodations ? `
                        <div class="trip-detail-item">
                            <div class="trip-detail-label">Accommodations</div>
                            <div class="trip-detail-value">${trip.accommodations}</div>
                        </div>
                        ` : ''}
                        
                        ${trip.meals ? `
                        <div class="trip-detail-item">
                            <div class="trip-detail-label">Dining</div>
                            <div class="trip-detail-value">${trip.meals}</div>
                        </div>
                        ` : ''}
                        
                        <div class="trip-detail-item">
                            <div class="trip-detail-label">Created By</div>
                            <div class="trip-detail-value">${trip.createdBy}</div>
                        </div>
                        
                        ${(currentUser.email && currentUser.email.endsWith('@wolthers.com')) || currentUser.role === 'admin' ? `
                        <div class="trip-detail-item">
                            <div class="trip-detail-label">Access Information</div>
                            <div class="trip-detail-value">
                                <strong>Partner Emails:</strong><br>
                                ${trip.partnerEmails.join('<br>')}
                                <br><br>
                                <strong>Access Codes:</strong><br>
                                ${trip.partnerCodes.join(', ')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    // Hide trip detail modal
    hideTripDetailModal: () => {
        const modal = document.getElementById('tripDetailModal');
        const content = document.getElementById('tripDetailContent');
        
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset content class
        content.className = 'trip-detail-content';
        selectedTrip = null;
    }
};

// Calendar Integration Functions
const calendar = {
    // Add entire trip to calendar
    addTripToCalendar: (tripId) => {
        const trip = MOCK_TRIPS.find(t => t.id === tripId);
        if (!trip) return;
        
        const startDate = new Date(trip.date);
        const endDate = new Date(trip.endDate);
        
        // Format dates for calendar (YYYYMMDD)
        const formatCalendarDate = (date) => {
            return date.toISOString().slice(0, 10).replace(/-/g, '');
        };
        
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
            `&text=${encodeURIComponent(trip.title)}` +
            `&dates=${formatCalendarDate(startDate)}/${formatCalendarDate(new Date(endDate.getTime() + 24*60*60*1000))}` +
            `&details=${encodeURIComponent(trip.description + '\n\nManaged by Wolthers & Associates')}` +
            `&location=${encodeURIComponent('Brazil Coffee Regions')}`;
        
        window.open(calendarUrl, '_blank');
        utils.showNotification('Opening calendar to add entire trip', 'info');
    },
    
    // Add single day to calendar
    addDayToCalendar: (tripId, dayNumber) => {
        const trip = MOCK_TRIPS.find(t => t.id === tripId);
        if (!trip || !trip.itinerary) return;
        
        const day = trip.itinerary.find(d => d.day === dayNumber);
        if (!day) return;
        
        const dayDate = new Date(day.date);
        const formatCalendarDate = (date) => {
            return date.toISOString().slice(0, 10).replace(/-/g, '');
        };
        
        // Create detailed description from activities
        const activities = day.activities.map(activity => 
            `${activity.time} - ${activity.title}: ${activity.description}`
        ).join('\n');
        
        const description = `${trip.title} - Day ${day.day}\n\n${day.summary}\n\nSchedule:\n${activities}\n\nManaged by Wolthers & Associates`;
        
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
            `&text=${encodeURIComponent(`${trip.title} - Day ${day.day}: ${day.title}`)}` +
            `&dates=${formatCalendarDate(dayDate)}/${formatCalendarDate(new Date(dayDate.getTime() + 24*60*60*1000))}` +
            `&details=${encodeURIComponent(description)}` +
            `&location=${encodeURIComponent('Brazil Coffee Regions')}`;
        
        window.open(calendarUrl, '_blank');
        utils.showNotification(`Opening calendar to add Day ${day.day}`, 'info');
    },
    
    // Download itinerary as text file
    downloadItinerary: (tripId) => {
        const trip = MOCK_TRIPS.find(t => t.id === tripId);
        if (!trip) return;
        
        let content = `${trip.title}\n`;
        content += `${utils.formatDateRange(trip.date, trip.endDate)}\n`;
        content += `${trip.description}\n\n`;
        
        if (trip.guests) content += `Guests: ${trip.guests}\n`;
        if (trip.cars) content += `Transportation: ${trip.cars}\n`;
        if (trip.accommodations) content += `Accommodations: ${trip.accommodations}\n`;
        if (trip.meals) content += `Dining: ${trip.meals}\n\n`;
        
        if (trip.itinerary) {
            content += `DAILY ITINERARY\n${'='.repeat(50)}\n\n`;
            trip.itinerary.forEach(day => {
                content += `Day ${day.day} - ${utils.formatDate(day.date)}\n`;
                content += `${day.title}\n`;
                content += `-`.repeat(30) + '\n';
                
                day.activities.forEach(activity => {
                    content += `${activity.time} - ${activity.title}\n`;
                    content += `    ${activity.description}\n\n`;
                });
                
                content += `Summary: ${day.summary}\n\n`;
            });
        }
        
        if (trip.highlights) {
            content += `TRIP HIGHLIGHTS\n${'='.repeat(50)}\n`;
            trip.highlights.forEach(highlight => {
                content += `• ${highlight}\n`;
            });
        }
        
        content += `\n\nManaged by Wolthers & Associates\nwww.wolthers.com`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${trip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-itinerary.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        utils.showNotification('Itinerary downloaded successfully', 'success');
    },
    
    // Share trip via email/social
    shareTrip: (tripId) => {
        const trip = MOCK_TRIPS.find(t => t.id === tripId);
        if (!trip) return;
        
        const shareText = `Check out this amazing coffee trip: ${trip.title}\n\n${trip.description}\n\nDates: ${utils.formatDateRange(trip.date, trip.endDate)}\n\nManaged by Wolthers & Associates`;
        const shareUrl = `mailto:?subject=${encodeURIComponent(trip.title)}&body=${encodeURIComponent(shareText)}`;
        
        window.location.href = shareUrl;
        utils.showNotification('Opening email to share trip', 'info');
    }
};

// Trip Management Functions
const trips = {
    // Load and display trips
    loadTrips: () => {
        utils.showLoading();
        
        // Simulate loading delay
        setTimeout(() => {
            // Filter trips based on user access
            let visibleTrips = MOCK_TRIPS;
            
            if (currentUser.type === 'partner') {
                visibleTrips = MOCK_TRIPS.filter(trip => {
                    if (currentUser.accessMethod === 'email') {
                        return trip.partnerEmails.includes(currentUser.accessValue);
                    } else {
                        return trip.partnerCodes.includes(currentUser.accessValue);
                    }
                });
            }
            
            currentTrips = visibleTrips;
            
            // Separate upcoming and past trips
            const now = new Date();
            const upcomingTrips = visibleTrips.filter(trip => new Date(trip.endDate) >= now);
            const pastTrips = visibleTrips.filter(trip => new Date(trip.endDate) < now);
            
            // Render trips
            ui.renderTrips('upcomingTrips', upcomingTrips, 'upcoming');
            ui.renderTrips('pastTrips', pastTrips, 'past');
            
            utils.hideLoading();
        }, 800);
    },

    // Open trip preview
    openTrip: (tripId) => {
        const trip = currentTrips.find(t => t.id === tripId);
        if (trip) {
            selectedTrip = trip;
            ui.showTripPreview(trip);
        }
    },
    
    // Open full trip page
    openFullTrip: (tripId) => {
        const trip = currentTrips.find(t => t.id === tripId);
        if (trip) {
            // Close the preview sidebar first
            ui.hideTripPreview();
            
            // Navigate to the dedicated trip page
            const tripUrl = `trip-pages/${trip.id}.html`;
            window.open(tripUrl, '_blank');
        }
    },

    // Create new trip with AI-generated codes and real staff/vehicle assignments
    createTrip: async (formData) => {
        utils.showLoading();
        
        try {
            // Extract form data
            const tripTitle = formData.get('tripTitle');
            const guestName = formData.get('guests') || '';
            const partnerEmailsText = formData.get('partnerEmails') || '';
            const partnerEmails = partnerEmailsText ? 
                partnerEmailsText.split('\n').map(e => e.trim()).filter(e => e) : [];
            
            // Get selected staff and vehicles from the new system
            const selectedStaff = window.selectedStaffAssignments || [];
            const selectedVehicles = Array.from(document.getElementById('vehicles').selectedOptions)
                .map(option => ({ 
                    id: option.value, 
                    displayName: option.textContent 
                })).filter(v => v.id);
            
            // Extract company name from partner emails (smart detection)
            let companyName = '';
            if (partnerEmails.length > 0) {
                const emailDomain = partnerEmails[0].split('@')[1] || '';
                companyName = trips.extractCompanyFromEmail(emailDomain);
            }
            
            // Get dates from form fields
            const startDate = formData.get('startDate');
            const endDate = formData.get('endDate');
            
            // Validate dates
            if (!startDate || !endDate) {
                throw new Error('Please select both start and end dates');
            }
            
            if (new Date(startDate) >= new Date(endDate)) {
                throw new Error('End date must be after start date');
            }

            // 🤖 Generate AI Trip Code
            const tripCodeData = tripCodeGenerator.generateTripCode({
                companyName: companyName,
                guestName: guestName,
                startDate: startDate,
                title: tripTitle
            });

            // Generate trip ID
            const tripId = tripTitle.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-') + '-2025';

            // Create new trip object with real staff and vehicle data
            const newTrip = {
                id: tripId,
                title: tripTitle,
                description: formData.get('tripDescription') || '',
                date: startDate,
                endDate: endDate,
                guests: guestName,
                vehicles: selectedVehicles,
                externalDriver: formData.get('driver') || '',
                staffAssignments: selectedStaff,
                status: 'upcoming',
                partnerEmails: partnerEmails,
                partnerCodes: [tripCodeData.code], // AI-generated code
                createdBy: currentUser.name,
                highlights: [], // Would be added later
                accommodations: '', // Would be added later
                meals: '', // Would be added later
                // Trip code metadata
                tripCodeData: tripCodeData,
                companyName: companyName,
                // Formatted display for compatibility
                cars: selectedVehicles.map(v => v.displayName).join(', ') || 'TBD',
                driver: selectedStaff.find(s => s.role === 'driver')?.name || formData.get('driver') || 'TBD',
                wolthersStaff: selectedStaff.map(s => `${s.name} (${s.role})`).join(', ') || 'TBD'
            };
            
            // Simulate API delay for realism
            setTimeout(() => {
            // Add to mock data (at the beginning for upcoming trips)
            MOCK_TRIPS.unshift(newTrip);
            
            utils.hideLoading();
            ui.hideAddTripModal();
                
                // Reset form state
                window.selectedStaffAssignments = [];
                
                // 🎉 Show Trip Code Success Modal
                trips.showTripCodeModal(newTrip);
                
                // Refresh display in background
                trips.loadTrips();
                
                console.log('✅ Trip created with staff and vehicle assignments:', {
                    title: newTrip.title,
                    staff: selectedStaff,
                    vehicles: selectedVehicles
                });
        }, 1500);
            
        } catch (error) {
            console.error('Error creating trip:', error);
            utils.hideLoading();
            utils.showNotification('Failed to create trip. Please try again.', 'error');
        }
    },

    // Extract company name from email domain
    extractCompanyFromEmail: (domain) => {
        // Remove common email providers
        const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com'];
        if (commonProviders.includes(domain.toLowerCase())) {
            return '';
        }
        
        // Extract company name from domain
        const parts = domain.split('.');
        let companyName = parts[0] || '';
        
        // Clean up common prefixes/suffixes
        companyName = companyName.replace(/^(www|mail|email)$/, '');
        
        // Capitalize first letter
        return companyName.charAt(0).toUpperCase() + companyName.slice(1);
    },

    // Load vehicles from database
    loadVehicles: async () => {
        try {
            const response = await fetch('api/vehicles/list.php');
            const data = await response.json();
            
            if (data.success) {
                const vehicleSelect = document.getElementById('vehicles');
                if (vehicleSelect) {
                    vehicleSelect.innerHTML = '';
                    
                    data.vehicles.forEach(vehicle => {
                        const option = document.createElement('option');
                        option.value = vehicle.id;
                        option.textContent = `${vehicle.displayName} (${vehicle.capacity} seats)`;
                        option.className = vehicle.isAvailable ? 'available' : 'unavailable';
                        option.disabled = !vehicle.isAvailable;
                        option.title = vehicle.isAvailable ? 
                            `Available - Location: ${vehicle.location}` : 
                            `Unavailable - ${vehicle.upcomingTrips.join(', ')}`;
                        vehicleSelect.appendChild(option);
                    });
                    
                    console.log(`✅ Loaded ${data.vehicles.length} vehicles (${data.summary.available} available)`);
                }
            }
        } catch (error) {
            console.error('Failed to load vehicles:', error);
            const vehicleSelect = document.getElementById('vehicles');
            if (vehicleSelect) {
                vehicleSelect.innerHTML = '<option value="">Failed to load vehicles</option>';
            }
        }
    },

    // Load staff availability for date range
    loadStaffAvailability: async (startDate, endDate) => {
        try {
            const staffContainer = document.getElementById('staffSelectionContainer');
            const loadingMessage = document.getElementById('staffLoadingMessage');
            const availabilityInfo = document.getElementById('staffAvailabilityInfo');
            const staffList = document.getElementById('staffList');
            
            if (!startDate || !endDate) {
                loadingMessage.textContent = 'Please set trip dates to check staff availability';
                return;
            }
            
            loadingMessage.style.display = 'block';
            staffContainer.style.display = 'none';
            
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate
            });
            
            const response = await fetch(`api/staff/availability.php?${params}`);
            const data = await response.json();
            
            if (data.success) {
                // Update availability info
                const { available, busy, total } = data.summary;
                availabilityInfo.className = `availability-info ${busy > 0 ? 'has-conflicts' : 'all-available'}`;
                availabilityInfo.innerHTML = `
                    <strong>Staff Availability for ${startDate} to ${endDate}:</strong><br>
                    ${available} of ${total} staff members available ${busy > 0 ? `(${busy} have conflicts)` : ''}
                `;
                
                // Render staff list
                staffList.innerHTML = data.staff.map(staff => `
                    <div class="staff-member ${staff.isAvailable ? '' : 'unavailable'}">
                        <input type="checkbox" 
                               class="staff-checkbox" 
                               data-staff-id="${staff.id}"
                               ${staff.isAvailable ? '' : 'disabled'}
                               onchange="trips.toggleStaffMember(${staff.id}, '${staff.name}', this.checked)">
                        
                        <div class="staff-info">
                            <div class="staff-name">${staff.name}</div>
                            <div class="staff-department">${staff.displayName}</div>
                            <span class="staff-availability ${staff.statusIndicator}">
                                ${staff.isAvailable ? 'Available' : 'Busy'}
                            </span>
                            ${staff.conflictingAssignments.length > 0 ? `
                                <div class="staff-conflicts">
                                    Conflicts: ${staff.conflictingAssignments.join('; ')}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="staff-role-selector" style="display: none;">
                            <select onchange="trips.updateStaffRole(${staff.id}, this.value)">
                                <option value="guide">Guide</option>
                                <option value="driver">Driver</option>
                                <option value="coordinator">Coordinator</option>
                                <option value="translator">Translator</option>
                                <option value="specialist">Specialist</option>
                            </select>
                        </div>
                        
                        <div class="staff-date-range" style="display: none;">
                            <div class="date-range-label">Custom dates (optional):</div>
                            <input type="date" 
                                   placeholder="Start date" 
                                   value="${startDate}"
                                   onchange="trips.updateStaffDateRange(${staff.id}, 'start', this.value)">
                            <input type="date" 
                                   placeholder="End date" 
                                   value="${endDate}"
                                   onchange="trips.updateStaffDateRange(${staff.id}, 'end', this.value)">
                        </div>
                    </div>
                `).join('');
                
                loadingMessage.style.display = 'none';
                staffContainer.style.display = 'block';
                
                console.log(`✅ Loaded ${total} staff members (${available} available, ${busy} busy)`);
            }
        } catch (error) {
            console.error('Failed to load staff availability:', error);
            document.getElementById('staffLoadingMessage').textContent = 'Failed to load staff availability';
        }
    },

    // Toggle staff member selection
    toggleStaffMember: (staffId, staffName, isSelected) => {
        if (!window.selectedStaffAssignments) {
            window.selectedStaffAssignments = [];
        }
        
        const roleSelector = document.querySelector(`[data-staff-id="${staffId}"]`)
            .closest('.staff-member').querySelector('.staff-role-selector');
        const dateRange = document.querySelector(`[data-staff-id="${staffId}"]`)
            .closest('.staff-member').querySelector('.staff-date-range');
        
        if (isSelected) {
            // Add staff member with default role
            window.selectedStaffAssignments.push({
                id: staffId,
                name: staffName,
                role: 'guide',
                startDate: null, // Will use trip dates
                endDate: null    // Will use trip dates
            });
            
            roleSelector.style.display = 'block';
            dateRange.style.display = 'block';
        } else {
            // Remove staff member
            window.selectedStaffAssignments = window.selectedStaffAssignments
                .filter(staff => staff.id !== staffId);
            
            roleSelector.style.display = 'none';
            dateRange.style.display = 'none';
        }
        
        console.log('Selected staff assignments:', window.selectedStaffAssignments);
    },

    // Update staff member role
    updateStaffRole: (staffId, role) => {
        if (window.selectedStaffAssignments) {
            const staff = window.selectedStaffAssignments.find(s => s.id === staffId);
            if (staff) {
                staff.role = role;
                console.log(`Updated ${staff.name} role to ${role}`);
            }
        }
    },

    // Update staff member date range
    updateStaffDateRange: (staffId, type, date) => {
        if (window.selectedStaffAssignments) {
            const staff = window.selectedStaffAssignments.find(s => s.id === staffId);
            if (staff) {
                if (type === 'start') {
                    staff.startDate = date;
                } else if (type === 'end') {
                    staff.endDate = date;
                }
                console.log(`Updated ${staff.name} ${type} date to ${date}`);
            }
        }
    },

    // Show Trip Code Success Modal
    showTripCodeModal: (trip) => {
        const modal = document.getElementById('tripCodeModal');
        const tripCodeData = trip.tripCodeData;
        
        // Update trip code display
        document.getElementById('generatedTripCode').textContent = tripCodeData.code;
        
        // Update code components
        document.getElementById('codeCompanyPart').textContent = tripCodeData.components.company;
        document.getElementById('codeGuestPart').textContent = tripCodeData.components.guest;
        document.getElementById('codeDatePart').textContent = `${tripCodeData.components.month}${tripCodeData.components.year}`;
        
        // Show suffix if present
        const suffixComponent = document.getElementById('codeSuffixComponent');
        if (tripCodeData.components.suffix) {
            document.getElementById('codeSuffixPart').textContent = tripCodeData.components.suffix;
            suffixComponent.style.display = 'block';
        } else {
            suffixComponent.style.display = 'none';
        }
        
        // Update QR code
        const qrCodeImg = document.getElementById('tripQRCode');
        const qrUrl = document.getElementById('tripQRUrl');
        const qrData = tripCodeGenerator.generateQRCode(tripCodeData.code, trip);
        qrCodeImg.src = qrData;
        qrUrl.textContent = `${window.location.origin}/trips/?code=${tripCodeData.code}`;
        
        // Update trip summary
        document.getElementById('summaryTripTitle').textContent = trip.title;
        document.getElementById('summaryTripDates').textContent = formatDateRange(trip.date, trip.endDate);
        document.getElementById('summaryTripGuests').textContent = trip.guests || 'TBD';
        document.getElementById('summaryTripCompany').textContent = trip.companyName || 'Various Partners';
        
        // Store current trip for actions
        window.currentTripCodeData = { trip, tripCodeData };
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚧 Development Mode - Enhanced Authentication Active');
    console.log('🎯 Available authentication methods:');
    console.log('🏢 Microsoft/Office 365: Ready (configure Azure AD credentials)');
    console.log('📧 Email + One-time Code: Functional with backend');
    console.log('👤 Regular Login: Wolthers team emails (daniel@wolthers.com, svenn@wolthers.com, tom@wolthers.com, rasmus@wolthers.com) / any password');
    console.log('🔑 Trip Codes: BRAZIL2025, COLOMBIA2025, ETHIOPIA2025');
    
    // Remove logout success message from URL parameters (from Microsoft OAuth logout redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('logout') || urlParams.has('post_logout_redirect_uri') || window.location.search.includes('logout')) {
        // Clean the URL without the logout parameters
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
    
    // Initialize Microsoft Authentication
    try {
        const configResponse = await fetch('/api/auth/microsoft-config.php');
        const configData = await configResponse.json();
        
        if (configData.success && configData.config.clientId) {
            microsoftAuth = new MicrosoftAuth(
                configData.config.clientId,
                configData.config.tenantId,
                configData.config.redirectUri
            );
            console.log('✅ Microsoft Auth initialized successfully');
            
            // Set up Microsoft login button click handler
            const microsoftBtn = document.getElementById('microsoftLoginBtn');
            if (microsoftBtn) {
                microsoftBtn.addEventListener('click', auth.signInWithMicrosoft);
            }
        } else {
            console.warn('⚠️ Microsoft Auth not configured - check Azure AD credentials');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Microsoft Auth:', error);
    }
    
    // Initialize auth system first - don't initialize user database here to avoid conflicts
    auth.init().catch(error => {
        console.error('Failed to initialize authentication:', error);
    });
    
    // Initialize user database for user management
    initializeUserDatabase();
    
    // Initialize logo for current color scheme
    updateLogoForColorScheme();
    
    // Set up form event handlers
    const initialForm = document.getElementById('initialForm');
    if (initialForm) {
        initialForm.addEventListener('submit', auth.handleEmailLogin);
    }
    
    // Global functions for modal interactions
    // Registration modal functions removed - using compact login only
    
    // Trip creation form handler
    const addTripForm = document.getElementById('addTripForm');
    addTripForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        trips.createTrip(new FormData(this));
    });

    // Initialize staff and vehicle management when modal opens
    window.showAddTripModal = () => {
        ui.showAddTripModal();
        
        // Load vehicles when modal opens
        trips.loadVehicles();
        
        // Initialize staff assignments array
        window.selectedStaffAssignments = [];
        
        // Set up date change handlers for staff availability
        const setupDateHandlers = () => {
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');
            
            if (!startDateInput || !endDateInput) {
                // If date inputs don't exist, check again in 100ms
                setTimeout(setupDateHandlers, 100);
                return;
            }
            
            const checkStaffAvailability = () => {
                const startDate = startDateInput.value;
                const endDate = endDateInput.value;
                
                if (startDate && endDate) {
                    trips.loadStaffAvailability(startDate, endDate);
                } else {
                    document.getElementById('staffLoadingMessage').textContent = 'Please select trip dates to check staff availability';
                    document.getElementById('staffSelectionContainer').style.display = 'none';
                }
            };
            
            startDateInput.addEventListener('change', checkStaffAvailability);
            endDateInput.addEventListener('change', checkStaffAvailability);
            
            // Set default dates (next month)
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            const weekLater = new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            startDateInput.value = nextMonth.toISOString().split('T')[0];
            endDateInput.value = weekLater.toISOString().split('T')[0];
            
            // Initial check with default dates
            setTimeout(checkStaffAvailability, 500);
        };
        
        setupDateHandlers();
    };
    
    // Modal click handlers
    window.addEventListener('click', function(event) {
        const addTripModal = document.getElementById('addTripModal');
        const tripDetailModal = document.getElementById('tripDetailModal');
        
        if (event.target === addTripModal) {
            ui.hideAddTripModal();
        }
        
        if (event.target === tripDetailModal) {
            ui.hideTripDetailModal();
        }
    });
    
    // Keyboard handlers for accessibility
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            if (document.getElementById('addTripModal').style.display === 'flex') {
                ui.hideAddTripModal();
            }
            if (document.getElementById('tripDetailModal').style.display === 'flex') {
                ui.hideTripDetailModal();
            }
        }
    });
    
    // Form validation
    const inputs = document.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('invalid', function() {
            this.classList.add('error');
        });
        
        input.addEventListener('input', function() {
            this.classList.remove('error');
        });
    });
});

// Global functions (for onclick handlers)
window.logout = auth.logout;
window.showAddTripModal = ui.showAddTripModal;
window.hideAddTripModal = ui.hideAddTripModal;
window.hideTripDetailModal = ui.hideTripDetailModal;

// Login step navigation functions
window.goBackToStep1 = auth.goBackToStep1;
window.goBackToStep2 = auth.goBackToStep2;

// Auth helper functions
window.sendOneTimeCode = () => {
    auth.showStep4(auth.currentEmail);
    // In development, simulate sending code
    utils.showNotification('One-time code sent! Use 123456 for development.', 'info');
};

window.forgotPassword = () => {
    utils.showNotification('Password reset email sent! (Development mode)', 'info');
    setTimeout(() => auth.goBackToStep1(), 2000);
};

window.resendCode = () => {
    utils.showNotification('Code resent! Use 123456 for development.', 'info');
};

// Development helpers
window.DEV = {
    config: CONFIG,
    mockTrips: MOCK_TRIPS,
    mockCredentials: MOCK_CREDENTIALS,
    currentUser: () => currentUser,
    currentTrips: () => currentTrips,
    utils: utils,
    auth: auth,
    ui: ui,
    trips: trips
};

console.log('✅ Trip Management System loaded successfully');
console.log('🔧 Development tools available in window.DEV'); 

// Helper to get days until start
function getDaysUntilStart(startDate) {
  const today = new Date();
  const start = new Date(startDate);
  const diff = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
  return diff;
}
// Helper to get days left (for upcoming)
function getDaysLeft(endDate) {
  const today = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return diff;
}
// Helper to get total days
function getTotalDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function isOngoing(startDate, endDate) {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return today >= start && today <= end;
}

// Admin Panel Functions
function showAdminPanel() {
    document.getElementById('adminPanelModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideAdminPanel() {
    document.getElementById('adminPanelModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Admin Panel Action Functions
function exportAllData() {
    const data = {
        trips: MOCK_TRIPS,
        users: currentUser ? [currentUser] : [],
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wolthers-trips-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    utils.showNotification('Data exported successfully', 'success');
}

function viewSystemLogs() {
    utils.showNotification('System logs feature coming soon', 'info');
}

function manageBackups() {
    utils.showNotification('Backup management feature coming soon', 'info');
}

function viewAccessLogs() {
    utils.showNotification('Access logs feature coming soon', 'info');
}

function managePermissions() {
    utils.showNotification('Permission management feature coming soon', 'info');
}

function bulkTripOperations() {
    utils.showNotification('Bulk operations feature coming soon', 'info');
}

function tripTemplates() {
    utils.showNotification('Trip templates feature coming soon', 'info');
}

function partnerCodeManagement() {
    utils.showNotification('Partner code management feature coming soon', 'info');
}

function emailSettings() {
    utils.showNotification('Email configuration feature coming soon', 'info');
}

function authenticationSettings() {
    utils.showNotification('Authentication settings feature coming soon', 'info');
}

function systemConfiguration() {
    utils.showNotification('System configuration feature coming soon', 'info');
}

// User Management Modal Functions
function showUserManagementModal() {
    // Initialize user database when first opening modal (safe timing - after auth is established)
    if (!window.USER_DATABASE || window.USER_DATABASE.length === 0) {
        initializeUserDatabase();
    }
    
    document.getElementById('userManagementModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    loadUserManagementData();
}

function hideUserManagementModal() {
    document.getElementById('userManagementModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function loadUserManagementData() {
    try {
        showLoadingState(true);
        
        // Load current user profile
        if (currentUser) {
            updateCurrentUserProfile(currentUser);
        }
        
        // For admins: Load all users from all sources
        if (currentUser && currentUser.role === 'admin') {
            await loadAllUsersForAdmin();
        }
        
        // Load users list from API
        await loadModalUsersList();
        
        // Setup search and filter functionality
        setupUserManagementInteractions();
        
        // Setup Add User form handler
        setupAddUserForm();
        
    } catch (error) {
        showToast('Failed to load user management data', 'error');
    } finally {
        showLoadingState(false);
    }
}

function updateCurrentUserProfile(user) {
    const profileName = document.getElementById('modalProfileName');
    const profileEmail = document.getElementById('modalProfileEmail');
    const profileRole = document.getElementById('modalProfileRole');
    const profileAvatar = document.getElementById('modalProfileAvatar');
    
    if (profileName) profileName.textContent = user.name || 'Unknown User';
    if (profileEmail) profileEmail.textContent = user.email || 'No email';
    
    if (profileRole) {
        const roleText = {
            admin: 'Administrator',
            editor: 'Editor', 
            user: 'User',
            guest: 'Guest'
        }[user.role] || 'User';
        
        profileRole.textContent = roleText;
        profileRole.className = `fluent-badge fluent-badge-${user.role}`;
    }
    
    if (profileAvatar) {
        profileAvatar.textContent = user.avatar || user.name?.charAt(0) || '?';
    }
}

// Load all users for admin view - primarily from database API
async function loadAllUsersForAdmin() {
    try {
        console.log('🔍 Admin loading users from database...');
        
        // 1. Load users from backend database API (primary source)
        try {
            const response = await fetch('/api/auth/list-users.php?auth_check=1');
            if (response.ok) {
                const apiData = await response.json();
                if (apiData.success && Array.isArray(apiData.users)) {
                    console.log(`📡 Loaded ${apiData.users.length} users from database API`);
                    console.log('📊 Database statistics:', apiData.statistics);
                    
                    // Replace USER_DATABASE with real database users
                    USER_DATABASE = apiData.users;
                    saveUserDatabase();
                    
                    console.log(`✅ Real database users loaded: ${USER_DATABASE.length}`);
                    console.log('👥 Users from database:', USER_DATABASE.map(u => `${u.name} (${u.email})`));
                    return;
                }
            }
        } catch (error) {
            console.log('⚠️ Backend database API error:', error.message);
        }
        
        // 2. Fallback: Load users from Microsoft Auth sessions (recent logins)
        console.log('⚠️ Database API unavailable, falling back to local sources...');
        const recentMSUsers = loadRecentMicrosoftUsers();
        if (recentMSUsers.length > 0) {
            console.log(`🔐 Found ${recentMSUsers.length} recent Microsoft users`);
            mergeUsersIntoDatabase(recentMSUsers);
        }
        
        // 3. Fallback: Load any additional users from localStorage backups
        const backupUsers = loadBackupUsers();
        if (backupUsers.length > 0) {
            console.log(`💾 Found ${backupUsers.length} backup users`);
            mergeUsersIntoDatabase(backupUsers);
        }
        
        console.log(`⚠️ Fallback: Total users loaded: ${USER_DATABASE.length}`);
        
    } catch (error) {
        console.error('❌ Error loading all users for admin:', error);
    }
}

// Merge users into database without duplicates
function mergeUsersIntoDatabase(newUsers) {
    newUsers.forEach(newUser => {
        // Check if user already exists (by email)
        const existingIndex = USER_DATABASE.findIndex(existing => 
            existing.email.toLowerCase() === newUser.email.toLowerCase()
        );
        
        if (existingIndex === -1) {
            // Add new user
            USER_DATABASE.push({
                id: newUser.id || generateUserId(newUser.name || newUser.email),
                name: newUser.name || newUser.displayName || newUser.email.split('@')[0],
                email: newUser.email,
                role: newUser.role || 'user',
                avatar: newUser.avatar || (newUser.name || newUser.email).charAt(0).toUpperCase(),
                memberSince: newUser.memberSince || newUser.createdAt || new Date().toISOString().split('T')[0],
                tripPermissions: newUser.tripPermissions || [],
                isCreator: newUser.isCreator || false,
                lastActive: newUser.lastActive || new Date().toISOString(),
                isWolthersTeam: newUser.isWolthersTeam || newUser.email?.endsWith('@wolthers.com') || false,
                company: newUser.company || getUserCompanyFromEmail(newUser.email)
            });
        } else {
            // Update existing user with newer information
            const existing = USER_DATABASE[existingIndex];
            USER_DATABASE[existingIndex] = {
                ...existing,
                name: newUser.name || newUser.displayName || existing.name,
                lastActive: newUser.lastActive || new Date().toISOString(),
                role: newUser.role || existing.role,
                avatar: newUser.avatar || existing.avatar,
                company: newUser.company || existing.company || getUserCompanyFromEmail(newUser.email)
            };
        }
    });
    
    // Save updated database
    saveUserDatabase();
}

// Load recent Microsoft authentication users
function loadRecentMicrosoftUsers() {
    const recentUsers = [];
    
    try {
        // Check for Microsoft user data in localStorage
        const msUserData = localStorage.getItem('microsoft_user_sessions');
        if (msUserData) {
            const sessions = JSON.parse(msUserData);
            if (Array.isArray(sessions)) {
                recentUsers.push(...sessions);
            }
        }
        
        // Check for recent login data
        const recentLogins = localStorage.getItem('recent_microsoft_logins');
        if (recentLogins) {
            const logins = JSON.parse(recentLogins);
            if (Array.isArray(logins)) {
                recentUsers.push(...logins);
            }
        }
    } catch (error) {
        console.log('No recent Microsoft users found');
    }
    
    return recentUsers;
}

// Load backup users from various localStorage keys
function loadBackupUsers() {
    const backupUsers = [];
    
    try {
        // Check various backup locations
        const backupKeys = [
            'wolthers_all_users',
            'backup_users_database',
            'registered_users',
            'trip_participants'
        ];
        
        backupKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                const users = JSON.parse(data);
                if (Array.isArray(users)) {
                    backupUsers.push(...users);
                }
            }
        });
    } catch (error) {
        console.log('No backup users found');
    }
    
    return backupUsers;
}

// Helper function to get company from email
function getUserCompanyFromEmail(email) {
    const emailDomain = email?.split('@')[1];
    if (emailDomain) {
        const domainToCompany = {
            'gmail.com': 'Personal',
            'yahoo.com': 'Personal', 
            'hotmail.com': 'Personal',
            'outlook.com': 'Personal',
            'wolthers.com': 'Wolthers & Associates'
        };
        
        if (domainToCompany[emailDomain]) {
            return domainToCompany[emailDomain];
        }
        
        // Convert domain to company name
        return emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);
    }
    
    return 'Unknown';
}

// Helper function to generate user ID
function generateUserId(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);
}

// Add user to system database for admin visibility
async function addUserToSystemDatabase(user) {
    try {
        // Check if user already exists in USER_DATABASE
        const existingUser = USER_DATABASE.find(u => 
            u.email.toLowerCase() === user.email.toLowerCase()
        );
        
        if (!existingUser) {
            const newUser = {
                id: generateUserId(user.name || user.email),
                name: user.name || user.displayName || user.email.split('@')[0],
                email: user.email,
                role: user.role || 'user',
                avatar: user.avatar || (user.name || user.email).charAt(0).toUpperCase(),
                memberSince: new Date().toISOString().split('T')[0],
                tripPermissions: [],
                isCreator: false,
                lastActive: new Date().toISOString(),
                isWolthersTeam: user.email?.endsWith('@wolthers.com') || false,
                company: getUserCompanyFromEmail(user.email),
                authMethod: 'microsoft'
            };
            
            USER_DATABASE.push(newUser);
            saveUserDatabase();
            
            console.log(`✅ Added new user to system database: ${newUser.name} (${newUser.email})`);
            
            // Also save to recent Microsoft users for future admin loading
            saveRecentMicrosoftUser(user);
        } else {
            // Update last active time
            existingUser.lastActive = new Date().toISOString();
            saveUserDatabase();
            console.log(`🔄 Updated last active for user: ${existingUser.name}`);
        }
    } catch (error) {
        console.error('Error adding user to system database:', error);
    }
}

// Save recent Microsoft user for admin loading
function saveRecentMicrosoftUser(user) {
    try {
        let recentUsers = [];
        const existing = localStorage.getItem('recent_microsoft_logins');
        if (existing) {
            recentUsers = JSON.parse(existing);
        }
        
        // Add user if not already in recent list
        const userExists = recentUsers.find(u => 
            u.email.toLowerCase() === user.email.toLowerCase()
        );
        
        if (!userExists) {
            recentUsers.push({
                ...user,
                loginTime: new Date().toISOString()
            });
            
            // Keep only last 50 recent users
            if (recentUsers.length > 50) {
                recentUsers = recentUsers.slice(-50);
            }
            
            localStorage.setItem('recent_microsoft_logins', JSON.stringify(recentUsers));
        }
    } catch (error) {
        console.error('Error saving recent Microsoft user:', error);
    }
}

function loadModalUsersList() {
    const usersList = document.getElementById('modalUsersList');
    if (!usersList) {
        console.log('modalUsersList element not found');
        return;
    }
    
    // Get users from the global USER_DATABASE array
    const users = getUsersFromDatabase();
    console.log('loadModalUsersList: Found', users.length, 'users:', users.map(u => u.name));
    
    // Check if we're using real database data
    const isDatabaseSource = localStorage.getItem('wolthers_users_database_source') === 'true';
    
    // Update pagination info with company breakdown for admins
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        if (currentUser && currentUser.role === 'admin') {
            const companies = [...new Set(users.map(user => getUserCompany(user)))];
            const sourceIndicator = isDatabaseSource ? '🗄️ Database' : '⚠️ Mock Data';
            paginationInfo.textContent = `${sourceIndicator} | Showing 1-${users.length} of ${users.length} users from ${companies.length} companies`;
        } else {
            const sourceIndicator = isDatabaseSource ? '🗄️ Database' : '⚠️ Mock Data';
            paginationInfo.textContent = `${sourceIndicator} | Showing 1-${users.length} of ${users.length} users`;
        }
    }
    
    // Populate company filter dropdown
    populateCompanyFilter(users);
    
    // Create table rows using clean text-only format
    const tableRows = users.map((user, index) => {
        const userTrips = getUserTripsData(user);
        const tripCount = userTrips.count;
        const lastTrip = userTrips.lastTrip;
        const upcomingTrip = userTrips.upcomingTrip;
        
        return `
            <tr>
                <td class="fluent-th-checkbox">
                    <input type="checkbox" class="fluent-checkbox user-checkbox" data-user-id="${user.id}">
                </td>
                <td class="fluent-user-name">${user.name}</td>
                <td class="fluent-user-email">
                    <div class="email-container">
                        <span class="email-text">${user.email}</span>
                        <button class="copy-email-btn" onclick="copyEmail('${user.email}')" title="Copy email">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                            </svg>
                        </button>
                    </div>
                </td>
                <td class="fluent-user-company">${getUserCompany(user)}</td>
                <td>
                    <span class="fluent-badge-table ${user.role}">${getRoleDisplayName(user.role)}</span>
                    ${user.isWolthersTeam ? '<br><span class="fluent-badge-table team" style="background: var(--medium-green); color: white; margin-top: 4px;">Team</span>' : ''}
                </td>
                <td class="fluent-member-since">${formatTableDate(user.memberSince)}</td>
                <td class="fluent-trip-count">${tripCount}</td>
                <td class="fluent-last-login">${user.lastLoginDisplay || 'Never'}</td>
                <td class="fluent-upcoming-trip">${formatUpcomingTrip(upcomingTrip)}</td>
                <td class="fluent-actions">
                    <div class="fluent-action-buttons">
                        <button class="fluent-action-btn" onclick="editUser('${user.id}')" title="Edit user">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61z"/>
                            </svg>
                        </button>
                        ${!user.isWolthersTeam ? `
                            <button class="fluent-action-btn danger" onclick="deleteUser('${user.id}')" title="Delete user">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M6.5 1h3a.5.5 0 01.5.5v1H6v-1a.5.5 0 01.5-.5zM11 2.5v-1A1.5 1.5 0 009.5 0h-3A1.5 1.5 0 005 1.5v1H2.5a.5.5 0 000 1h.538l.853 10.66A2 2 0 005.885 16h4.23a2 2 0 001.994-1.84L12.962 3.5h.538a.5.5 0 000-1H11z"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    usersList.innerHTML = tableRows;
}

// Production-ready user management - trip admin functionality removed

// Production User Management Functions
function showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Clear any previous error states
        clearFormErrors();
    }
}

function hideAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('addUserForm');
        if (form) {
            form.reset();
            clearFormErrors();
        }
    }
}

function clearFormErrors() {
    document.querySelectorAll('.fluent-input.error, .fluent-select.error').forEach(input => {
        input.classList.remove('error');
    });
    document.querySelectorAll('.fluent-error-message').forEach(msg => {
        msg.remove();
    });
}

function editUser(userId) {
    utils.showNotification('Edit user feature coming soon', 'info');
}

function deleteUser(userId) {
    const user = getUsersFromDatabase().find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
        if (removeUserFromDatabase(userId)) {
            utils.showNotification(`User ${user.name} has been deleted successfully`, 'success');
        } else {
            utils.showNotification('Failed to delete user', 'error');
        }
    }
}

function editProfile() {
    showToast('Edit profile functionality available in user settings', 'info');
}

// Production-ready helper functions
function showLoadingState(isLoading) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = isLoading ? 'flex' : 'none';
    }
    
    // Disable/enable form buttons
    const submitButtons = document.querySelectorAll('.fluent-btn-primary');
    submitButtons.forEach(btn => {
        btn.disabled = isLoading;
        const spinnerEl = btn.querySelector('.fluent-spinner');
        const textEl = btn.querySelector('.btn-text');
        
        if (spinnerEl) spinnerEl.style.display = isLoading ? 'inline-block' : 'none';
        if (textEl) textEl.style.display = isLoading ? 'none' : 'inline';
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fluent-toast ${type} show`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <div class="fluent-toast-content">
            <div class="fluent-toast-icon">${icons[type] || icons.info}</div>
            <div class="fluent-toast-message">
                <div class="fluent-toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="fluent-toast-text">${message}</div>
            </div>
            <button class="fluent-toast-close" onclick="this.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

async function showConfirmDialog(title, message, confirmText = 'Confirm', type = 'primary') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal fluent-modal';
        modal.style.display = 'flex';
        modal.style.zIndex = '3000';
        
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content fluent-modal-content-small">
                <div class="fluent-modal-header">
                    <div class="fluent-header-content">
                        <h1 class="fluent-modal-title">${title}</h1>
                    </div>
                </div>
                <div class="fluent-modal-body-form">
                    <p style="margin: 0; padding: 20px 0; line-height: 1.5;">${message}</p>
                    <div class="fluent-form-actions">
                        <button type="button" class="fluent-btn fluent-btn-secondary cancel-btn">Cancel</button>
                        <button type="button" class="fluent-btn fluent-btn-${type} confirm-btn">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        const cleanup = (result) => {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
            resolve(result);
        };
        
        modal.querySelector('.cancel-btn').addEventListener('click', () => cleanup(false));
        modal.querySelector('.confirm-btn').addEventListener('click', () => cleanup(true));
        modal.querySelector('.modal-backdrop').addEventListener('click', () => cleanup(false));
    });
}

function showEditUserModal(user) {
    // Simple edit modal implementation
    showToast('Edit user functionality will be available in the next release', 'info');
}

// Form validation helpers
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateForm(formData) {
    const errors = [];
    
    if (!formData.get('newUserName')?.trim()) {
        errors.push({ field: 'newUserName', message: 'Full name is required' });
    }
    
    const email = formData.get('newUserEmail')?.trim();
    if (!email) {
        errors.push({ field: 'newUserEmail', message: 'Email address is required' });
    } else if (!validateEmail(email)) {
        errors.push({ field: 'newUserEmail', message: 'Please enter a valid email address' });
    }
    
    if (!formData.get('newUserRole')) {
        errors.push({ field: 'newUserRole', message: 'User type is required' });
    }
    
    return errors;
}

function displayFormErrors(errors) {
    clearFormErrors();
    
    errors.forEach(error => {
        const field = document.getElementById(error.field);
        if (field) {
            field.classList.add('error');
            
            const errorMsg = document.createElement('div');
            errorMsg.className = 'fluent-error-message';
            errorMsg.textContent = error.message;
            field.parentNode.appendChild(errorMsg);
        }
    });
}

// Production-ready Add User form setup
function setupAddUserForm() {
    const addUserForm = document.getElementById('addUserForm');
    if (!addUserForm) return;
    
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Validate form data
        const errors = validateForm(formData);
        if (errors.length > 0) {
            displayFormErrors(errors);
            return;
        }
        
        const userData = {
            name: formData.get('newUserName').trim(),
            email: formData.get('newUserEmail').trim(),
            company: formData.get('newUserCompany')?.trim() || null,
            role: formData.get('newUserRole'),
            sendWelcomeEmail: formData.get('sendWelcomeEmail') === 'on',
            requirePasswordReset: formData.get('requirePasswordReset') === 'on'
        };
        
        try {
            showLoadingState(true);
            
            const newUser = await UserAPI.createUser(userData);
            
            // Send welcome email if requested
            if (userData.sendWelcomeEmail) {
                await sendWelcomeEmail(newUser.id);
            }
            
            await loadModalUsersList();
            hideAddUserModal();
            showToast(`User ${newUser.name} created successfully`, 'success');
            
        } catch (error) {
            if (error.message.includes('already exists')) {
                displayFormErrors([{
                    field: 'newUserEmail',
                    message: 'A user with this email address already exists'
                }]);
            } else {
                showToast(error.message || 'Failed to create user', 'error');
            }
        } finally {
            showLoadingState(false);
        }
    });
}

async function sendWelcomeEmail(userId) {
    try {
        await UserAPI.apiCall(`/users/${userId}/welcome-email`, { method: 'POST' });
    } catch (error) {
        // Log error but don't fail the user creation
    }
}

// Production-ready utility functions
function getRoleDisplayName(role) {
    const roleNames = {
        admin: 'Administrator',
        editor: 'Editor',
        user: 'User',
        guest: 'Guest'
    };
    return roleNames[role] || 'User';
}

function getUserStatus(user) {
    if (!user.lastActive) return { type: 'inactive', text: 'Never logged in' };
    
    const lastActive = new Date(user.lastActive);
    const now = new Date();
    const diffHours = (now - lastActive) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
        return { type: 'active', text: 'Active' };
    } else if (diffHours < 24) {
        return { type: 'active', text: 'Active' };
    } else if (diffHours < 168) { // 7 days
        return { type: 'pending', text: 'Away' };
    } else {
        return { type: 'inactive', text: 'Inactive' };
    }
}

function formatRelativeTime(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    
    return date.toLocaleDateString();
}

// Format date range for trip code modal
function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const options = { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    };
    
    if (start.getFullYear() === end.getFullYear()) {
        if (start.getMonth() === end.getMonth()) {
            // Same month and year
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${start.getFullYear()}`;
        } else {
            // Same year, different months
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
        }
    } else {
        // Different years
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// User Database - Real database integration
// Initialize user database
function initializeUserDatabase() {
    // Check if we have database-sourced users in localStorage
    const savedUsers = localStorage.getItem('wolthers_users_database');
    const lastUpdated = localStorage.getItem('wolthers_users_last_updated');
    const isDatabaseSource = localStorage.getItem('wolthers_users_database_source') === 'true';
    
    if (savedUsers && isDatabaseSource) {
        try {
            USER_DATABASE = JSON.parse(savedUsers);
            console.log(`✅ Loaded ${USER_DATABASE.length} users from cached database`);
            console.log(`📅 Last updated: ${lastUpdated}`);
        } catch (e) {
            console.error('Error loading cached user database:', e);
            USER_DATABASE = getDefaultUsersWithMultipleCompanies();
            saveUserDatabase();
        }
    } else {
        // Use mock data as fallback (will be replaced by real data when admin loads)
        USER_DATABASE = getDefaultUsersWithMultipleCompanies();
        saveUserDatabase();
        console.log('⚠️ Initialized with mock users - will load real database when admin accesses user management');
    }
    
    // Make globally accessible for compatibility
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

// Enhanced user database with multiple companies for admin demonstration
function getDefaultUsersWithMultipleCompanies() {
    const wolthersTeam = getDefaultWolthersTeam();
    
    // Add sample users from different companies
    const sampleUsers = [
        // Coffee company partners
        {
            id: "maria-santos-finca",
            name: "Maria Santos",
            email: "maria.santos@fincaelparaiso.com",
            role: "user",
            avatar: "MS",
            memberSince: "2024-02-15",
            tripPermissions: ["brazil-coffee-origins-tour"],
            isCreator: false,
            lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            isWolthersTeam: false,
            company: "Finca El Paraiso"
        },
        {
            id: "carlos-rodriguez-cafe",
            name: "Carlos Rodriguez",
            email: "carlos@cafecooperativa.co",
            role: "user",
            avatar: "CR",
            memberSince: "2024-03-01",
            tripPermissions: ["colombia-coffee-regions"],
            isCreator: false,
            lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            isWolthersTeam: false,
            company: "Cafe Cooperativa"
        },
        // Business clients
        {
            id: "sarah-johnson-roasters",
            name: "Sarah Johnson",
            email: "sarah.johnson@premiumroasters.com",
            role: "user",
            avatar: "SJ",
            memberSince: "2024-01-20",
            tripPermissions: ["brazil-coffee-origins-tour", "colombia-coffee-regions"],
            isCreator: false,
            lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            isWolthersTeam: false,
            company: "Premium Roasters"
        },
        {
            id: "james-mitchell-imports",
            name: "James Mitchell",
            email: "j.mitchell@specialtyimports.com",
            role: "editor",
            avatar: "JM",
            memberSince: "2024-02-01",
            tripPermissions: ["ethiopia-coffee-journey"],
            isCreator: false,
            lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            isWolthersTeam: false,
            company: "Specialty Imports"
        },
        // Microsoft/Office 365 users
        {
            id: "emily-chen-outlook",
            name: "Emily Chen",
            email: "emily.chen@outlook.com",
            role: "user",
            avatar: "EC",
            memberSince: "2024-03-10",
            tripPermissions: [],
            isCreator: false,
            lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            isWolthersTeam: false,
            company: "Personal",
            authMethod: "microsoft"
        },
        {
            id: "alex-thompson-gmail",
            name: "Alex Thompson",
            email: "alex.thompson@gmail.com",
            role: "user",
            avatar: "AT",
            memberSince: "2024-03-05",
            tripPermissions: ["brazil-coffee-origins-tour"],
            isCreator: false,
            lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            isWolthersTeam: false,
            company: "Personal"
        },
        // Corporate client
        {
            id: "jennifer-davis-corp",
            name: "Jennifer Davis", 
            email: "jennifer.davis@globalcoffecorp.com",
            role: "user",
            avatar: "JD",
            memberSince: "2024-01-15",
            tripPermissions: ["colombia-coffee-regions", "ethiopia-coffee-journey"],
            isCreator: false,
            lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            isWolthersTeam: false,
            company: "Global Coffee Corp"
        }
    ];
    
    return [...wolthersTeam, ...sampleUsers];
}

// Save user database to localStorage
function saveUserDatabase() {
    try {
        localStorage.setItem('wolthers_users_database', JSON.stringify(USER_DATABASE));
        localStorage.setItem('wolthers_users_last_updated', new Date().toISOString());
        
        // Track if this is real database data (check if users have database-like IDs)
        const hasRealDbData = USER_DATABASE.some(user => 
            typeof user.id === 'number' || 
            user.department || 
            user.authMethods
        );
        localStorage.setItem('wolthers_users_database_source', hasRealDbData ? 'true' : 'false');
        
        // Update global references
        window.USER_DATABASE = USER_DATABASE;
        window.MOCK_USERS = USER_DATABASE;
        
        console.log(`💾 Saved ${USER_DATABASE.length} users to localStorage (DB source: ${hasRealDbData})`);
    } catch (e) {
        console.error('Error saving user database:', e);
    }
}

// User Database Functions
function getUsersFromDatabase() {
    // Access the USER_DATABASE from accounts.js
    if (typeof USER_DATABASE !== 'undefined' && USER_DATABASE.length > 0) {
        return USER_DATABASE;
    }
    // Fallback to MOCK_USERS if USER_DATABASE not available
    if (typeof MOCK_USERS !== 'undefined' && MOCK_USERS.length > 0) {
        return MOCK_USERS;
    }
    // Last fallback to current user
    return currentUser ? [currentUser] : [];
}

function addUserToDatabase(user) {
    if (typeof USER_DATABASE !== 'undefined') {
        USER_DATABASE.push(user);
        // Refresh the user list in the modal
        loadModalUsersList();
        return true;
    }
    if (typeof MOCK_USERS !== 'undefined') {
        MOCK_USERS.push(user);
        // Refresh the user list in the modal
        loadModalUsersList();
        return true;
    }
    return false;
}

function removeUserFromDatabase(userId) {
    if (typeof USER_DATABASE !== 'undefined') {
        const index = USER_DATABASE.findIndex(user => user.id === userId);
        if (index !== -1) {
            USER_DATABASE.splice(index, 1);
            loadModalUsersList();
            return true;
        }
    }
    if (typeof MOCK_USERS !== 'undefined') {
        const index = MOCK_USERS.findIndex(user => user.id === userId);
        if (index !== -1) {
            MOCK_USERS.splice(index, 1);
            loadModalUsersList();
            return true;
        }
    }
    return false;
}

function getUserCompany(user) {
    if (user.isWolthersTeam) {
        return 'Wolthers & Associates';
    }
    
    // Extract company from email domain
    const emailDomain = user.email.split('@')[1];
    if (emailDomain) {
        // Common company domain mappings
        const domainToCompany = {
            'gmail.com': 'Personal',
            'yahoo.com': 'Personal',
            'hotmail.com': 'Personal',
            'outlook.com': 'Personal',
            'wolthers.com': 'Wolthers & Associates'
        };
        
        if (domainToCompany[emailDomain]) {
            return domainToCompany[emailDomain];
        }
        
        // Convert domain to company name (e.g., company.com -> Company)
        return emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);
    }
    
    return 'Unknown';
}

function getUserTripsData(user) {
    // Get all trips from localStorage (including real trip data)
    const allTrips = getAllTrips();
    
    // Get trips where user has permissions or is creator
    const userTrips = allTrips.filter(trip => 
        user.tripPermissions?.includes(trip.id) || 
        trip.createdBy === user.email ||
        trip.createdBy === user.name ||
        trip.wolthersStaff?.includes(user.name)
    );
    
    const now = new Date();
    
    // Separate past and upcoming trips
    const pastTrips = userTrips.filter(trip => new Date(trip.endDate || trip.date) < now);
    const upcomingTrips = userTrips.filter(trip => new Date(trip.startDate || trip.date) > now);
    
    // Find most recent past trip
    let lastTrip = null;
    if (pastTrips.length > 0) {
        lastTrip = pastTrips.reduce((latest, current) => {
            const currentDate = new Date(current.endDate || current.date);
            const latestDate = new Date(latest.endDate || latest.date);
            return currentDate > latestDate ? current : latest;
        });
    }
    
    // Find next upcoming trip
    let upcomingTrip = null;
    if (upcomingTrips.length > 0) {
        upcomingTrip = upcomingTrips.reduce((earliest, current) => {
            const currentDate = new Date(current.startDate || current.date);
            const earliestDate = new Date(earliest.startDate || earliest.date);
            return currentDate < earliestDate ? current : earliest;
        });
    }
    
    return {
        count: userTrips.length,
        lastTrip: lastTrip,
        upcomingTrip: upcomingTrip
    };
}

// Get all trips from various sources
function getAllTrips() {
    // Try to get trips from various sources
    if (typeof window.tripsData !== 'undefined') {
        return window.tripsData;
    }
    
    if (typeof trips !== 'undefined' && trips.data) {
        return trips.data;
    }
    
    if (typeof mockTrips !== 'undefined') {
        return mockTrips;
    }
    
    // Return empty array if no trips found
    return [];
}

// Populate company filter dropdown
function populateCompanyFilter(users) {
    const companyFilter = document.getElementById('userCompanyFilter');
    if (!companyFilter) return;
    
    // Get unique companies
    const companies = [...new Set(users.map(user => getUserCompany(user)))].sort();
    
    // Clear existing options except "All companies"
    companyFilter.innerHTML = '<option value="">All companies</option>';
    
    // Add company options
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companyFilter.appendChild(option);
    });
}

// Format last trip display
function formatLastTrip(trip) {
    if (!trip) return '-';
    
    const tripDate = new Date(trip.endDate || trip.date);
    const formattedDate = formatTableDate(tripDate.toISOString());
    
    return `<div class="trip-info">
        <div class="trip-name">${trip.title || trip.name || 'Untitled Trip'}</div>
        <div class="trip-date">${formattedDate}</div>
    </div>`;
}

// Format upcoming trip display
function formatUpcomingTrip(trip) {
    if (!trip) return '-';
    
    const tripDate = new Date(trip.startDate || trip.date);
    const formattedDate = formatTableDate(tripDate.toISOString());
    
    return `<div class="trip-info">
        <div class="trip-name">${trip.title || trip.name || 'Untitled Trip'}</div>
        <div class="trip-date">${formattedDate}</div>
    </div>`;
}

function getUserAvatarColor(role) {
    const colors = {
        admin: '#DAA520',
        editor: '#2d5a47', 
        user: '#6c757d',
        guest: '#d2b48c'
    };
    return colors[role] || '#6c757d';
}

function formatMemberSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
}

function formatTableDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Production user management - trip-related functions removed for clean interface

// Production User Management Interactive Features
function setupUserManagementInteractions() {
    // Search functionality with debouncing
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            applyFiltersAndSearch();
        }, 300));
    }
    
    // Role filter functionality
    const roleFilter = document.getElementById('userRoleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', () => {
            applyFiltersAndSearch();
        });
    }
    
    // Company filter functionality
    const companyFilter = document.getElementById('userCompanyFilter');
    if (companyFilter) {
        companyFilter.addEventListener('change', () => {
            applyFiltersAndSearch();
        });
    }
    
    // Select all checkbox functionality
    const selectAllCheckbox = document.getElementById('selectAllUsers');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', toggleSelectAllUsers);
    }
    
    // Table sorting functionality
    const sortableHeaders = document.querySelectorAll('.fluent-th-sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => sortUserTable(header.dataset.sort));
    });
}

// Apply filters and search to user list
function applyFiltersAndSearch() {
    let users = getUsersFromDatabase();
    
    // Apply search filter
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        users = users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            getUserCompany(user).toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply role filter
    const roleFilter = document.getElementById('userRoleFilter');
    if (roleFilter && roleFilter.value) {
        users = users.filter(user => user.role === roleFilter.value);
    }
    
    // Apply company filter
    const companyFilter = document.getElementById('userCompanyFilter');
    if (companyFilter && companyFilter.value) {
        users = users.filter(user => getUserCompany(user) === companyFilter.value);
    }
    
    // Render filtered users
    renderFilteredUsers(users);
}

// Production-ready debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Production filtering is now handled directly in loadModalUsersList via API calls

// Toggle select all users
function toggleSelectAllUsers() {
    const selectAllCheckbox = document.getElementById('selectAllUsers');
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    
    userCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

// Attach event listeners to user checkboxes
function attachCheckboxListeners() {
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    userCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectAllState);
    });
}

// Update select all checkbox state
function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('selectAllUsers');
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    
    if (checkedBoxes.length === userCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}

// Sort user table by column
let currentSortColumn = null;
let currentSortDirection = 'asc';

function sortUserTable(column) {
    const users = getUsersFromDatabase();
    
    // Toggle sort direction if clicking the same column
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    // Sort users based on column
    const sortedUsers = [...users].sort((a, b) => {
        let aValue, bValue;
        
        switch (column) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'email':
                aValue = a.email.toLowerCase();
                bValue = b.email.toLowerCase();
                break;
            case 'company':
                aValue = getUserCompany(a).toLowerCase();
                bValue = getUserCompany(b).toLowerCase();
                break;
            case 'role':
                const roleOrder = { admin: 4, editor: 3, user: 2, guest: 1 };
                aValue = roleOrder[a.role] || 0;
                bValue = roleOrder[b.role] || 0;
                break;
            case 'memberSince':
                aValue = new Date(a.memberSince);
                bValue = new Date(b.memberSince);
                break;
            case 'tripCount':
                const aTrips = getUserTripsData(a);
                const bTrips = getUserTripsData(b);
                aValue = aTrips.count;
                bValue = bTrips.count;
                break;
            case 'lastLogin':
                aValue = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
                bValue = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
                break;
            case 'upcomingTrip':
                const aUpcoming = getUserTripsData(a).upcomingTrip;
                const bUpcoming = getUserTripsData(b).upcomingTrip;
                aValue = aUpcoming ? new Date(aUpcoming.startDate || aUpcoming.date) : new Date('2099-12-31');
                bValue = bUpcoming ? new Date(bUpcoming.startDate || bUpcoming.date) : new Date('2099-12-31');
                break;
            default:
                return 0;
        }
        
        if (aValue < bValue) return currentSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Update sort icons
    updateSortIcons(column, currentSortDirection);
    
    // Render sorted users
    renderFilteredUsers(sortedUsers);
}

// Render filtered users in the table
function renderFilteredUsers(users) {
    const usersList = document.getElementById('modalUsersList');
    if (!usersList) return;
    
    // Update pagination info
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        paginationInfo.textContent = `Showing 1-${users.length} of ${users.length} users`;
    }
    
    // Create table rows using clean text-only format
    const tableRows = users.map((user, index) => {
        const userTrips = getUserTripsData(user);
        const tripCount = userTrips.count;
        const lastTrip = userTrips.lastTrip;
        const upcomingTrip = userTrips.upcomingTrip;
        
        return `
            <tr>
                <td class="fluent-th-checkbox">
                    <input type="checkbox" class="fluent-checkbox user-checkbox" data-user-id="${user.id}">
                </td>
                <td class="fluent-user-name">${user.name}</td>
                <td class="fluent-user-email">
                    <div class="email-container">
                        <span class="email-text">${user.email}</span>
                        <button class="copy-email-btn" onclick="copyEmail('${user.email}')" title="Copy email">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                            </svg>
                        </button>
                    </div>
                </td>
                <td class="fluent-user-company">${getUserCompany(user)}</td>
                <td>
                    <span class="fluent-badge-table ${user.role}">${getRoleDisplayName(user.role)}</span>
                    ${user.isWolthersTeam ? '<br><span class="fluent-badge-table team" style="background: var(--medium-green); color: white; margin-top: 4px;">Team</span>' : ''}
                </td>
                <td class="fluent-member-since">${formatTableDate(user.memberSince)}</td>
                <td class="fluent-trip-count">${tripCount}</td>
                <td class="fluent-last-login">${user.lastLoginDisplay || 'Never'}</td>
                <td class="fluent-upcoming-trip">${formatUpcomingTrip(upcomingTrip)}</td>
                <td class="fluent-actions">
                    <div class="fluent-action-buttons">
                        <button class="fluent-action-btn" onclick="editUser('${user.id}')" title="Edit user">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61z"/>
                            </svg>
                        </button>
                        ${!user.isWolthersTeam ? `
                            <button class="fluent-action-btn danger" onclick="deleteUser('${user.id}')" title="Delete user">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M6.5 1h3a.5.5 0 01.5.5v1H6v-1a.5.5 0 01.5-.5zM11 2.5v-1A1.5 1.5 0 009.5 0h-3A1.5 1.5 0 005 1.5v1H2.5a.5.5 0 000 1h.538l.853 10.66A2 2 0 005.885 16h4.23a2 2 0 001.994-1.84L12.962 3.5h.538a.5.5 0 000-1H11z"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    usersList.innerHTML = tableRows;
}

// Update sort icons in table headers
function updateSortIcons(activeColumn, direction) {
    const sortableHeaders = document.querySelectorAll('.fluent-th-sortable');
    
    sortableHeaders.forEach(header => {
        const icon = header.querySelector('.fluent-sort-icon');
        const column = header.dataset.sort;
        
        if (column === activeColumn) {
            icon.style.opacity = '1';
            if (direction === 'desc') {
                icon.style.transform = 'rotate(180deg)';
            } else {
                icon.style.transform = 'rotate(0deg)';
            }
        } else {
            icon.style.opacity = '0.5';
            icon.style.transform = 'rotate(0deg)';
        }
    });
}

// Copy email to clipboard
function copyEmail(email) {
    navigator.clipboard.writeText(email).then(() => {
        showToast(`Email ${email} copied to clipboard`, 'success');
    }).catch(err => {
        console.error('Failed to copy email:', err);
        showToast('Failed to copy email', 'error');
    });
}

// ============================================================================
// 🎉 TRIP CODE MODAL FUNCTIONS
// ============================================================================

// Hide trip code modal
function hideTripCodeModal() {
    const modal = document.getElementById('tripCodeModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Clear stored data
    window.currentTripCodeData = null;
    
    // Show success notification
    showToast('Trip created successfully! Code has been generated.', 'success');
}

// Copy trip code to clipboard
function copyTripCode() {
    const tripCode = document.getElementById('generatedTripCode').textContent;
    navigator.clipboard.writeText(tripCode).then(() => {
        const btn = document.querySelector('.copy-code-btn');
        const originalBg = btn.style.background;
        
        // Visual feedback
        btn.style.background = 'rgba(40, 167, 69, 0.3)';
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
            </svg>
        `;
        
        setTimeout(() => {
            btn.style.background = originalBg;
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/>
                    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/>
                </svg>
            `;
        }, 2000);
        
        showToast('Trip code copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy trip code', 'error');
    });
}

// Print trip code details
function printTripCode() {
    if (!window.currentTripCodeData) return;
    
    const { trip, tripCodeData } = window.currentTripCodeData;
    
    // Create print-friendly version
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Trip Code: ${tripCodeData.code}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .code-display { font-size: 24px; font-weight: bold; text-align: center; 
                               padding: 20px; background: #f5f5f5; margin: 20px 0; }
                .details { margin: 20px 0; }
                .qr-code { text-align: center; margin: 20px 0; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Wolthers & Associates</h1>
                <h2>Coffee Travel Trip Code</h2>
            </div>
            
            <div class="code-display">${tripCodeData.code}</div>
            
            <div class="details">
                <h3>Trip Details:</h3>
                <p><strong>Title:</strong> ${trip.title}</p>
                <p><strong>Dates:</strong> ${formatDateRange(trip.date, trip.endDate)}</p>
                <p><strong>Participants:</strong> ${trip.guests || 'TBD'}</p>
                <p><strong>Company:</strong> ${trip.companyName || 'Various Partners'}</p>
            </div>
            
            <div class="details">
                <h3>Access Information:</h3>
                <p><strong>Website:</strong> trips.wolthers.com</p>
                <p><strong>Access URL:</strong> ${window.location.origin}/trips/?code=${tripCodeData.code}</p>
            </div>
            
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()">Print</button>
                <button onclick="window.close()">Close</button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Auto-print after content loads
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Email trip code to participants
function emailTripCode() {
    if (!window.currentTripCodeData) return;
    
    const { trip, tripCodeData } = window.currentTripCodeData;
    const subject = `Trip Access Code: ${trip.title}`;
    const body = `Hello,

Your access code for the "${trip.title}" trip has been generated:

🎯 ACCESS CODE: ${tripCodeData.code}

📅 Trip Dates: ${formatDateRange(trip.date, trip.endDate)}
🌐 Access URL: ${window.location.origin}/trips/?code=${tripCodeData.code}

Simply visit the website and enter your code to access trip details, itinerary, and updates.

Best regards,
Wolthers & Associates
Coffee Travel Specialists`;

    // Create mailto link
    const emails = trip.partnerEmails.join(',');
    const mailtoLink = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.open(mailtoLink);
    
    showToast('Email client opened with trip code details', 'info');
}

// View trip details (close modal and show trip)
function viewTripDetails() {
    hideTripCodeModal();
    
    // Show trip details in trip modal
    if (window.currentTripCodeData) {
        const { trip } = window.currentTripCodeData;
        trips.showTripDetails(trip);
    }
}

// ============================================================================
// 🚗 MOBILE NAVIGATION & VEHICLE MANAGEMENT
// ============================================================================

/**
 * Toggle mobile navigation menu
 */
function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburgerMenu');
    const menu = document.getElementById('mobileNavMenu');
    
    if (hamburger && menu) {
        hamburger.classList.toggle('active');
        menu.classList.toggle('active');
        
        // Close menu when clicking outside
        if (menu.classList.contains('active')) {
            document.addEventListener('click', closeMobileMenuOnOutsideClick);
        } else {
            document.removeEventListener('click', closeMobileMenuOnOutsideClick);
        }
    }
}

/**
 * Close mobile menu when clicking outside
 */
function closeMobileMenuOnOutsideClick(event) {
    const hamburger = document.getElementById('hamburgerMenu');
    const menu = document.getElementById('mobileNavMenu');
    
    if (hamburger && menu && 
        !hamburger.contains(event.target) && 
        !menu.contains(event.target)) {
        hamburger.classList.remove('active');
        menu.classList.remove('active');
        document.removeEventListener('click', closeMobileMenuOnOutsideClick);
    }
}

/**
 * Navigate to vehicle management page
 */
function goToVehicleManagement() {
    window.location.href = 'admin-vehicles.html';
}

/**
 * Update navigation visibility based on user role
 */
function updateNavigationVisibility(user) {
    if (!user) return;
    
    const role = user.role || 'employee';
    const isAdmin = role === 'admin';
    const isAdminOrDriver = isAdmin || role === 'driver';
    
    // Desktop navigation elements
    const vehicleManagementBtn = document.getElementById('vehicleManagementBtn');
    const adminSettings = document.getElementById('adminSettings');
    
    // Mobile navigation elements
    const mobileAccountsLink = document.getElementById('mobileAccountsLink');
    const mobileCarsLink = document.getElementById('mobileCarsLink');
    const mobileAdminLink = document.getElementById('mobileAdminLink');
    
    // Show/hide vehicle management for admins and drivers
    if (vehicleManagementBtn) {
        vehicleManagementBtn.style.display = isAdminOrDriver ? 'inline-block' : 'none';
    }
    
    // Show/hide admin settings
    if (adminSettings) {
        adminSettings.style.display = isAdmin ? 'flex' : 'none';
    }
    
    // Update mobile navigation
    if (mobileAccountsLink) {
        mobileAccountsLink.style.display = isAdmin ? 'flex' : 'none';
    }
    
    if (mobileCarsLink) {
        mobileCarsLink.style.display = isAdminOrDriver ? 'flex' : 'none';
    }
    
    if (mobileAdminLink) {
        mobileAdminLink.style.display = isAdmin ? 'flex' : 'none';
    }
    
    console.log(`Navigation updated for ${user.name} (${role}):`, {
        canAccessVehicles: isAdminOrDriver,
        canAccessAdmin: isAdmin
    });
}

/**
 * Show Vehicle Management Modal
 */
function showVehicleManagementModal() {
    document.getElementById('vehicleManagementModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    loadVehicleManagementData();
}

/**
 * Hide Vehicle Management Modal
 */
function hideVehicleManagementModal() {
    document.getElementById('vehicleManagementModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * Load Vehicle Management Data
 */
async function loadVehicleManagementData() {
    try {
        // Show loading state
        showLoadingState(true);
        
        // Load vehicles data
        await loadModalVehicles();
        
        // Load maintenance and driver logs for other tabs
        await loadModalMaintenance();
        await loadModalDriverLogs();
        
        // Setup interactions
        setupVehicleManagementInteractions();
        
    } catch (error) {
        console.error('Failed to load vehicle management data:', error);
        showToast('Failed to load vehicle data', 'error');
    } finally {
        showLoadingState(false);
    }
}

/**
 * Load Vehicles for Modal
 */
async function loadModalVehicles() {
    try {
        const response = await fetch('api/vehicles/manage.php?include_maintenance=true&include_trips=true');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayModalVehicles(data.vehicles);
                updateModalVehicleSummary(data.summary);
            } else {
                throw new Error(data.error || 'Failed to load vehicles');
            }
        }
    } catch (error) {
        console.error('Error loading vehicles:', error);
        // Show fallback empty state
        document.getElementById('modalVehiclesList').innerHTML = `
            <tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-light);">
                No vehicles found. <a href="#" onclick="openVehicleAddModal()" style="color: var(--primary-green);">Add your first vehicle</a>
            </td></tr>
        `;
        updateModalVehicleSummary({ total: 0, available: 0, maintenance: 0, retired: 0 });
    }
}

/**
 * Display Vehicles in Modal Table
 */
function displayModalVehicles(vehicles) {
    const tableBody = document.getElementById('modalVehiclesList');
    
    if (!vehicles || vehicles.length === 0) {
        tableBody.innerHTML = `
            <tr><td colspan="9" style="text-align: center; padding: 40px;">
                No vehicles found. <a href="#" onclick="openVehicleAddModal()">Add your first vehicle</a>
            </td></tr>
        `;
        return;
    }
    
    tableBody.innerHTML = vehicles.map(vehicle => createModalVehicleRow(vehicle)).join('');
}

/**
 * Create Vehicle Row for Modal Table
 */
function createModalVehicleRow(vehicle) {
    const statusClass = `status-${vehicle.status}`;
    const typeClass = `badge-${vehicle.vehicle_type}`;
    
    // Insurance status
    let insuranceStatus = 'Active';
    let insuranceClass = 'status-active';
    if (vehicle.insurance_days_remaining !== null && vehicle.insurance_days_remaining < 0) {
        insuranceStatus = 'Expired';
        insuranceClass = 'status-expired';
    } else if (vehicle.insurance_days_remaining !== null && vehicle.insurance_days_remaining < 30) {
        insuranceStatus = `${vehicle.insurance_days_remaining} days`;
        insuranceClass = 'status-warning';
    }
    
    // Revision status
    let revisionStatus = 'Current';
    let revisionClass = 'status-active';
    if (vehicle.revision_days_remaining !== null && vehicle.revision_days_remaining < 0) {
        revisionStatus = 'Overdue';
        revisionClass = 'status-expired';
    } else if (vehicle.revision_days_remaining !== null && vehicle.revision_days_remaining < 30) {
        revisionStatus = `${vehicle.revision_days_remaining} days`;
        revisionClass = 'status-warning';
    }
    
    // Last trip information
    let lastTripDisplay = '<span class="no-trip">No trips</span>';
    if (vehicle.last_trip) {
        const tripDate = formatTableDate(vehicle.last_trip.end_date || vehicle.last_trip.start_date);
        lastTripDisplay = `<a href="#" onclick="openTripDetails('${vehicle.last_trip.id}')" class="trip-link" title="View trip details">
            <div class="trip-name">${vehicle.last_trip.title}</div>
            <div class="trip-date">${tripDate}</div>
        </a>`;
    }
    
    // Next trip information
    let nextTripDisplay = '<span class="no-trip">No scheduled trips</span>';
    if (vehicle.next_trip) {
        const tripDate = formatTableDate(vehicle.next_trip.start_date);
        nextTripDisplay = `<a href="#" onclick="openTripDetails('${vehicle.next_trip.id}')" class="trip-link" title="View trip details">
            <div class="trip-name">${vehicle.next_trip.title}</div>
            <div class="trip-date">${tripDate}</div>
        </a>`;
    }
    
    return `
        <tr>
            <td>
                <div class="vehicle-info">
                    <div class="vehicle-name">${vehicle.make} ${vehicle.model}</div>
                    <div class="vehicle-year">${vehicle.year}</div>
                    <div class="vehicle-capacity">${vehicle.capacity} people</div>
                </div>
            </td>
            <td><span class="license-plate">${vehicle.license_plate}</span></td>
            <td class="mileage">${vehicle.current_mileage ? Number(vehicle.current_mileage).toLocaleString() + ' km' : 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${vehicle.status.toUpperCase()}</span></td>
            <td><span class="status-indicator ${insuranceClass}">${insuranceStatus}</span></td>
            <td><span class="status-indicator ${revisionClass}">${revisionStatus}</span></td>
            <td class="trip-info">${lastTripDisplay}</td>
            <td class="trip-info">${nextTripDisplay}</td>
            <td>
                <div class="fluent-action-buttons">
                    <button class="fluent-action-btn" onclick="editModalVehicle(${vehicle.id})" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61z"/>
                        </svg>
                    </button>
                    <button class="fluent-action-btn" onclick="viewModalVehicleLogs(${vehicle.id})" title="View Logs">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M2 3.75C2 2.784 2.784 2 3.75 2h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0112.25 14h-8.5A1.75 1.75 0 012 12.25v-8.5zm1.75-.25a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25v-8.5a.25.25 0 00-.25-.25h-8.5z"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Update Modal Vehicle Summary
 */
function updateModalVehicleSummary(summary) {
    const defaultSummary = { total: 0, available: 0, maintenance: 0, retired: 0 };
    const finalSummary = summary || defaultSummary;
    
    try {
        document.getElementById('modal-total-vehicles').textContent = finalSummary.total || 0;
        document.getElementById('modal-available-vehicles').textContent = finalSummary.available || 0;
        document.getElementById('modal-maintenance-vehicles').textContent = finalSummary.maintenance || 0;
        document.getElementById('modal-retired-vehicles').textContent = finalSummary.retired || 0;
    } catch (error) {
        console.error('Error updating modal vehicle summary:', error);
    }
}

/**
 * Show Vehicle Tab
 */
function showVehicleTab(tabName, event) {
    // Hide all vehicle tab contents
    document.querySelectorAll('.vehicle-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all vehicle tabs
    document.querySelectorAll('.fluent-tab').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(`modal-${tabName}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Load data for the selected tab
    switch(tabName) {
        case 'vehicles':
            loadModalVehicles();
            break;
        case 'maintenance':
            loadModalMaintenance();
            break;
        case 'driver-logs':
            loadModalDriverLogs();
            break;
        case 'reports':
            generateModalReports();
            break;
    }
}

/**
 * Load Modal Maintenance Data
 */
async function loadModalMaintenance() {
    try {
        const response = await fetch('api/vehicles/maintenance.php');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayModalMaintenance(data.maintenance_logs);
            }
        }
    } catch (error) {
        console.error('Error loading maintenance data:', error);
    }
}

/**
 * Load Modal Driver Logs Data
 */
async function loadModalDriverLogs() {
    try {
        const response = await fetch('api/vehicles/driver-logs.php');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayModalDriverLogs(data.driver_logs);
            }
        }
    } catch (error) {
        console.error('Error loading driver logs:', error);
    }
}

/**
 * Display Modal Maintenance
 */
function displayModalMaintenance(logs) {
    const tableBody = document.getElementById('modalMaintenanceList');
    if (!logs || logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No maintenance logs found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.vehicle_make} ${log.vehicle_model}</td>
            <td><span class="badge-${log.maintenance_type}">${log.maintenance_type}</span></td>
            <td>${log.description}</td>
            <td>${formatDate(log.start_date)}</td>
            <td><span class="badge-${log.status}">${log.status}</span></td>
            <td>
                <button class="fluent-action-btn" onclick="editModalMaintenance(${log.id})">Edit</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Display Modal Driver Logs
 */
function displayModalDriverLogs(logs) {
    const tableBody = document.getElementById('modalDriverLogsList');
    if (!logs || logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No driver logs found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.vehicle_make} ${log.vehicle_model}</td>
            <td>${log.driver_name}</td>
            <td>${log.route_description || 'N/A'}</td>
            <td>${formatDate(log.start_date)}</td>
            <td><span class="badge-${log.status}">${log.status}</span></td>
            <td>
                <button class="fluent-action-btn" onclick="editModalDriverLog(${log.id})">Edit</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Setup Vehicle Management Interactions
 */
function setupVehicleManagementInteractions() {
    // Search functionality
    const searchInput = document.getElementById('vehicleSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterModalVehicles, 300));
    }
    
    // Filter functionality
    const statusFilter = document.getElementById('vehicleStatusFilter');
    const typeFilter = document.getElementById('vehicleTypeFilter');
    
    if (statusFilter) statusFilter.addEventListener('change', filterModalVehicles);
    if (typeFilter) typeFilter.addEventListener('change', filterModalVehicles);
}

/**
 * Filter Modal Vehicles
 */
function filterModalVehicles() {
    // Implementation for filtering vehicles in modal
    console.log('Filtering vehicles...');
}

/**
 * Placeholder functions for modal actions
 */
function openVehicleAddModal() {
    showToast('Add Vehicle functionality coming soon', 'info');
}

function openMaintenanceAddModal() {
    showToast('Add Maintenance functionality coming soon', 'info');
}

function openDriverLogAddModal() {
    showToast('Add Driver Log functionality coming soon', 'info');
}

function editModalVehicle(id) {
    showToast(`Edit Vehicle ${id} functionality coming soon`, 'info');
}

function viewModalVehicleLogs(id) {
    showToast(`View Vehicle ${id} logs functionality coming soon`, 'info');
}

function editModalMaintenance(id) {
    showToast(`Edit Maintenance ${id} functionality coming soon`, 'info');
}

function editModalDriverLog(id) {
    showToast(`Edit Driver Log ${id} functionality coming soon`, 'info');
}

function generateModalReports() {
    showToast('Reports functionality coming soon', 'info');
}

/**
 * Update the original function to use modal
 */
function goToVehicleManagement() {
    showVehicleManagementModal();
}

/**
 * Open Trip Details from Vehicle Management
 */
function openTripDetails(tripId) {
    // Close vehicle management modal
    hideVehicleManagementModal();
    
    // Find the trip in the existing trips data
    const allTrips = getAllTrips();
    const trip = allTrips.find(t => t.id === tripId || t.id === parseInt(tripId));
    
    if (trip) {
        // Use the existing trip details functionality
        if (typeof trips !== 'undefined' && trips.showTripDetails) {
            trips.showTripDetails(trip);
        } else {
            // Fallback: show trip information in a simple modal
            showTripDetailsModal(trip);
        }
    } else {
        showToast('Trip not found', 'error');
    }
}

/**
 * Show Trip Details Modal (fallback)
 */
function showTripDetailsModal(trip) {
    const modal = document.createElement('div');
    modal.className = 'modal fluent-modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="modal-content fluent-modal-content">
            <div class="fluent-modal-header">
                <div class="fluent-header-content">
                    <h1 class="fluent-modal-title">${trip.title}</h1>
                    <p class="fluent-modal-subtitle">${formatDateRange(trip.date, trip.endDate)}</p>
                </div>
                <button class="fluent-close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="fluent-modal-body">
                <div class="trip-details">
                    <p><strong>Dates:</strong> ${formatDateRange(trip.date, trip.endDate)}</p>
                    <p><strong>Participants:</strong> ${trip.guests || 'TBD'}</p>
                    <p><strong>Company:</strong> ${trip.companyName || 'Various Partners'}</p>
                    ${trip.description ? `<p><strong>Description:</strong> ${trip.description}</p>` : ''}
                </div>
                <div class="fluent-form-actions">
                    <button class="fluent-btn fluent-btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Clean up when modal is removed
    modal.addEventListener('remove', () => {
        document.body.style.overflow = 'auto';
    });
}