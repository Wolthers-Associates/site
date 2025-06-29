// Production Configuration - NO DEVELOPMENT MODE
function normalizeWebsiteUrl(url) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return 'https://' + url.replace(/^\/+/, '');
}

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
            url: `${window.location.origin}/?code=${tripCode}`,
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
            const response = await fetch('api/auth/validate.php', {
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
            const response = await fetch('api/auth/check-user.php', {
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
    // Load vehicles for simple dropdown
    loadVehicles: () => {
        const vehicleSelect = document.getElementById('vehicles');
        if (!vehicleSelect) return;

        // Try to load from API first
        fetch('api/vehicles/list.php')
            .then(response => response.json())
            .then(data => {
                vehicleSelect.innerHTML = '';
                if (data.success && data.vehicles) {
                    data.vehicles.forEach(vehicle => {
                        const option = document.createElement('option');
                        option.value = vehicle.id;
                        option.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`;
                        vehicleSelect.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.log('API not available, using mock data');
                // Mock vehicle data
                const mockVehicles = [
                    { id: 1, make: 'Toyota', model: 'Land Cruiser', license_plate: 'ABC-123' },
                    { id: 2, make: 'Ford', model: 'Transit', license_plate: 'DEF-456' },
                    { id: 3, make: 'Chevrolet', model: 'Suburban', license_plate: 'GHI-789' },
                    { id: 4, make: 'Nissan', model: 'Patrol', license_plate: 'JKL-012' }
                ];
                
                vehicleSelect.innerHTML = '';
                mockVehicles.forEach(vehicle => {
                    const option = document.createElement('option');
                    option.value = vehicle.id;
                    option.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`;
                    vehicleSelect.appendChild(option);
                });
            });
    },

    // Load staff for simple dropdown - API ONLY
    loadStaffAvailability: async () => {
        const staffSelect = document.getElementById('wolthersStaff');
        const staffContainer = document.getElementById('staffSelectionContainer');
        const loadingMessage = document.getElementById('staffLoadingMessage');

        if (!staffSelect) return;

        // Show loading message
        if (loadingMessage) {
            loadingMessage.textContent = '🔄 Loading staff from database...';
            loadingMessage.style.display = 'block';
        }

        try {
            const response = await fetch('api/staff/mock-availability.php');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.staff) {
                if (loadingMessage) loadingMessage.style.display = 'none';
                if (staffContainer) staffContainer.style.display = 'block';
                
                staffSelect.innerHTML = '';
                data.staff.forEach(staff => {
                    const option = document.createElement('option');
                    option.value = staff.id;
                    option.textContent = `${staff.name} - ${staff.role || staff.department}`;
                    
                    if (staff.available === false) {
                        option.disabled = true;
                        option.textContent += ' (Unavailable)';
                    }
                    
                    staffSelect.appendChild(option);
                });
                
                // Show availability info
                const availabilityInfo = document.getElementById('staffAvailabilityInfo');
                if (availabilityInfo) {
                    availabilityInfo.textContent = `${data.staff.length} staff members loaded from database`;
                }
                
                console.log(`✅ Loaded ${data.staff.length} staff members from API`);
                utils.showNotification(`Loaded ${data.staff.length} staff members successfully`, 'success');
            } else {
                throw new Error('Invalid API response: ' + JSON.stringify(data));
            }
        } catch (error) {
            console.error('❌ Failed to load staff from API:', error);
            
            if (loadingMessage) {
                loadingMessage.textContent = '❌ Failed to load staff - Check database connection';
                loadingMessage.style.display = 'block';
            }
            
            staffSelect.innerHTML = '<option value="">❌ Failed to load staff</option>';
            utils.showNotification('Failed to load staff. Please check your database connection.', 'error');
        }
    },

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

    // Create new trip with simple form data
    createTrip: async (formData) => {
        utils.showLoading();
        
        try {
            // Extract form data
            const tripTitle = formData.get('tripTitle');
            const guestName = formData.get('guests') || '';
            const partnerEmailsText = formData.get('partnerEmails') || '';
            const partnerEmails = partnerEmailsText ? 
                partnerEmailsText.split('\n').map(e => e.trim()).filter(e => e) : [];
            
            // Get selected vehicles and staff from simple dropdowns
            const vehicleSelect = document.getElementById('vehicles');
            const staffSelect = document.getElementById('wolthersStaff');
            const driverInput = document.getElementById('driver');
            
            const selectedVehicleIds = Array.from(vehicleSelect.selectedOptions).map(option => option.value);
            const selectedStaffIds = Array.from(staffSelect.selectedOptions).map(option => option.value);
            const externalDrivers = driverInput ? driverInput.value.trim() : '';
            
            // Get selected vehicle and staff names for display
            const selectedVehicleNames = Array.from(vehicleSelect.selectedOptions).map(option => option.textContent);
            const selectedStaffNames = Array.from(staffSelect.selectedOptions).map(option => option.textContent);
            
            // Extract company name from partner emails (smart detection)
            let companyName = '';
            if (partnerEmails.length > 0) {
                const emailDomain = partnerEmails[0].split('@')[1] || '';
                companyName = trips.extractCompanyFromEmail(emailDomain);
            }
            
            // Auto-generate dates from itinerary if available
            const itineraryText = formData.get('itinerary') || '';
            let startDate = null;
            let endDate = null;
            
            if (itineraryText) {
                const extractedDates = trips.extractDatesFromItinerary(itineraryText);
                startDate = extractedDates.startDate;
                endDate = extractedDates.endDate;
            }
            
            // If no dates extracted, use default 7-day trip starting tomorrow
            if (!startDate || !endDate) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                startDate = tomorrow.toISOString().split('T')[0];
                
                const endDateObj = new Date(tomorrow);
                endDateObj.setDate(endDateObj.getDate() + 6); // 7-day trip
                endDate = endDateObj.toISOString().split('T')[0];
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

            // Create new trip object with simple data
            const newTrip = {
                id: tripId,
                title: tripTitle,
                description: formData.get('tripDescription') || '',
                date: startDate,
                endDate: endDate,
                guests: guestName,
                status: 'upcoming',
                partnerEmails: partnerEmails,
                partnerCodes: [tripCodeData.code],
                createdBy: currentUser.name,
                highlights: [],
                accommodations: '',
                meals: '',
                // Trip code metadata
                tripCodeData: tripCodeData,
                companyName: companyName,
                // Simple vehicle and staff data
                selectedVehicleIds: selectedVehicleIds,
                selectedStaffIds: selectedStaffIds,
                externalDrivers: externalDrivers,
                itinerary: itineraryText,
                // Formatted display for compatibility with existing UI
                cars: selectedVehicleNames.length > 0 ? selectedVehicleNames.join(', ') : 'TBD',
                driver: externalDrivers || 'Wolthers Staff',
                wolthersStaff: selectedStaffNames.length > 0 ? selectedStaffNames.join(', ') : 'TBD',
                wolthersGuide: selectedStaffNames.length > 0 ? selectedStaffNames[0].split(' (')[0] : currentUser.name
            };
            
            // Simulate API delay for realism
            setTimeout(() => {
            // Add to mock data (at the beginning for upcoming trips)
            MOCK_TRIPS.unshift(newTrip);
            
            utils.hideLoading();
            ui.hideAddTripModal();
                
                // Reset form
                document.getElementById('addTripForm').reset();
                
                // 🎉 Show Trip Code Success Modal
                trips.showTripCodeModal(newTrip);
                
                // Refresh display in background
                trips.loadTrips();
                
                console.log('✅ Trip created successfully:', {
                    title: newTrip.title,
                    vehicles: selectedVehicleIds.length,
                    staff: selectedStaffIds.length,
                    hasItinerary: !!itineraryText,
                    startDate: startDate,
                    endDate: endDate
                });
        }, 1500);
            
        } catch (error) {
            console.error('Error creating trip:', error);
            utils.hideLoading();
            utils.showNotification('Failed to create trip. Please try again.', 'error');
        }
    },

    // Extract dates from itinerary text
    extractDatesFromItinerary: (itinerary) => {
        const datePatterns = [
            /(\d{1,2}\/\d{1,2}\/\d{4})/g,      // MM/DD/YYYY or M/D/YYYY
            /(\d{4}-\d{1,2}-\d{1,2})/g,        // YYYY-MM-DD
            /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/gi
        ];
        
        const dates = [];
        datePatterns.forEach(pattern => {
            const matches = itinerary.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const date = new Date(match);
                    if (!isNaN(date.getTime())) {
                        dates.push(date);
                    }
                });
            }
        });
        
        if (dates.length === 0) {
            return { startDate: null, endDate: null };
        }
        
        dates.sort((a, b) => a - b);
        const startDate = dates[0].toISOString().split('T')[0];
        const endDate = dates[dates.length - 1].toISOString().split('T')[0];
        
        return { startDate, endDate };
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

    // Helper function to format drivers display
    formatDriversDisplay: (vehicles) => {
        if (!vehicles || vehicles.length === 0) return 'TBD';
        
        const driversWithVehicles = vehicles
            .filter(v => v.drivers && v.drivers.trim())
            .map(v => `${v.drivers} (${v.name})`);
            
        if (driversWithVehicles.length === 0) {
            return 'Wolthers Staff';
        }
        
        return driversWithVehicles.join(', ');
    },

    // Simple AI formatting for itinerary
    formatItinerary: () => {
        const itineraryTextarea = document.getElementById('itineraryText');
        const previewDiv = document.getElementById('itineraryPreview');
        const previewActions = document.querySelector('.preview-actions');
        
        if (!itineraryTextarea || !previewDiv) return;
        
        const rawText = itineraryTextarea.value.trim();
        if (!rawText) {
            utils.showNotification('Please enter some itinerary text first.', 'warning');
            return;
        }
        
        // Show loading state
        previewDiv.innerHTML = '<div class="preview-placeholder"><p>🤖 AI is formatting your itinerary...</p></div>';
        
        // Simulate AI processing
        setTimeout(() => {
            const formattedText = trips.processItineraryText(rawText);
            previewDiv.innerHTML = formattedText;
            
            // Show preview actions
            if (previewActions) {
                previewActions.style.display = 'flex';
            }
        }, 1500);
    },

    // Process itinerary text with basic AI-like formatting
    processItineraryText: (rawText) => {
        const lines = rawText.split('\n').filter(line => line.trim());
        let formattedHtml = '<div class="formatted-itinerary">';
        
        let currentDay = 0;
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Check if it's a day header
            if (trimmedLine.toLowerCase().includes('day ') || /^day\s*\d+/i.test(trimmedLine)) {
                currentDay++;
                const dayMatch = trimmedLine.match(/day\s*(\d+)/i);
                const dayNumber = dayMatch ? dayMatch[1] : currentDay;
                formattedHtml += `<div class="day-header"><h4>Day ${dayNumber}</h4></div>`;
            } else if (trimmedLine) {
                // Process activity line
                let activity = trimmedLine;
                
                // Capitalize first letter
                activity = activity.charAt(0).toUpperCase() + activity.slice(1);
                
                // Add period if missing
                if (!activity.endsWith('.') && !activity.endsWith('!') && !activity.endsWith('?')) {
                    activity += '.';
                }
                
                // Format times
                activity = activity.replace(/(\d{1,2})(am|pm)/gi, '$1:00 $2');
                activity = activity.replace(/(\d{1,2}):(\d{2})(am|pm)/gi, '$1:$2 $3');
                
                // Add to formatted output
                formattedHtml += `<div class="activity-item">• ${activity}</div>`;
            }
        });
        
        formattedHtml += '</div>';
        
        // Add some basic styling
        formattedHtml += `
        <style>
        .formatted-itinerary { font-family: inherit; }
        .day-header { margin: 15px 0 10px 0; padding: 8px 0; border-bottom: 2px solid #e9ecef; }
        .day-header h4 { margin: 0; color: var(--dark-green); font-size: 16px; }
        .activity-item { margin: 5px 0; padding: 3px 0; line-height: 1.5; }
        </style>`;
        
        return formattedHtml;
    },

    // Clear itinerary
    clearItinerary: () => {
        const itineraryTextarea = document.getElementById('itineraryText');
        const previewDiv = document.getElementById('itineraryPreview');
        const previewActions = document.querySelector('.preview-actions');
        
        if (itineraryTextarea) {
            itineraryTextarea.value = '';
        }
        
        if (previewDiv) {
            previewDiv.innerHTML = `
                <div class="preview-placeholder">
                    <p>✨ Your AI-enhanced itinerary will appear here</p>
                    <p>Type or paste your itinerary, then click "AI Format & Enhance"</p>
                </div>
            `;
        }
        
        if (previewActions) {
            previewActions.style.display = 'none';
        }
    },

    // Load vehicles from database - API ONLY
    loadVehicles: async () => {
        const vehicleSelect = document.getElementById('vehicles');
        if (!vehicleSelect) return;

        vehicleSelect.innerHTML = '<option value="">🔄 Loading vehicles from database...</option>';

        try {
            const response = await fetch('api/vehicles/mock-list.php');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.vehicles) {
                vehicleSelect.innerHTML = '';
                
                data.vehicles.forEach(vehicle => {
                    const option = document.createElement('option');
                    option.value = vehicle.id;
                    option.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate}) - ${vehicle.capacity} seats`;
                    
                    if (!vehicle.isAvailable) {
                        option.disabled = true;
                        option.textContent += ` (${vehicle.status})`;
                    }
                    
                    option.title = `Status: ${vehicle.status} | Location: ${vehicle.location || 'Unknown'} | Assignments: ${vehicle.currentAssignments}`;
                    vehicleSelect.appendChild(option);
                });
                
                console.log(`✅ Loaded ${data.vehicles.length} vehicles from API`);
                utils.showNotification(`Loaded ${data.vehicles.length} vehicles successfully`, 'success');
            } else {
                throw new Error('Invalid API response: ' + JSON.stringify(data));
            }
        } catch (error) {
            console.error('❌ Failed to load vehicles from API:', error);
            vehicleSelect.innerHTML = '<option value="">❌ Failed to load vehicles - Check database connection</option>';
            utils.showNotification('Failed to load vehicles. Please check your database connection.', 'error');
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
        qrUrl.textContent = `${window.location.origin}/?code=${tripCodeData.code}`;
        
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
        console.log('🔍 Fetching Microsoft config...');
        const configResponse = await fetch('api/auth/microsoft-config.php');
        console.log('🔍 Config response status:', configResponse.status);
        const configData = await configResponse.json();
        console.log('🔍 Config data received:', configData);
        
        if (configData.success && configData.config.clientId) {
            console.log('🔍 Creating MicrosoftAuth with:', {
                clientId: configData.config.clientId,
                tenantId: configData.config.tenantId,
                redirectUri: configData.config.redirectUri
            });
            
            microsoftAuth = new MicrosoftAuth(
                configData.config.clientId,
                configData.config.tenantId,
                configData.config.redirectUri
            );
            console.log('✅ Microsoft Auth initialized successfully');
            console.log('✅ MicrosoftAuth object:', microsoftAuth);
            
            // Set up Microsoft login button click handler
            const microsoftBtn = document.getElementById('microsoftLoginBtn');
            if (microsoftBtn) {
                console.log('✅ Microsoft button found, setting up click handler');
                microsoftBtn.addEventListener('click', (event) => {
                    console.log('🔍 Microsoft button clicked!');
                    event.preventDefault();
                    
                    // Add debugging
                    console.log('Microsoft Auth object:', microsoftAuth);
                    console.log('Config data:', configData);
                    
                    if (!microsoftAuth) {
                        console.error('❌ Microsoft Auth not initialized');
                        alert('Microsoft authentication not initialized. Please check Azure AD configuration.');
                        return;
                    }
                    
                    // Call the sign-in function
                    auth.signInWithMicrosoft();
                });
            } else {
                console.error('❌ Microsoft button not found in DOM');
            }
        } else {
            console.warn('⚠️ Microsoft Auth not configured - check Azure AD credentials');
            console.warn('⚠️ Config success:', configData.success);
            console.warn('⚠️ Client ID:', configData.config?.clientId);
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

    // Trip Creation Modal Initialization
    window.showAddTripModal = () => {
        ui.showAddTripModal();
        
        // Load vehicles and staff immediately when modal opens
        setTimeout(() => {
            trips.loadVehicles();
            trips.loadStaffAvailability();
        }, 100);

        // Initialize AI format button
        const formatItineraryBtn = document.getElementById('formatItineraryBtn');
        if (formatItineraryBtn) {
            formatItineraryBtn.onclick = trips.formatItinerary;
        }

        // Initialize clear button
        const clearItineraryBtn = document.getElementById('clearItineraryBtn');
        if (clearItineraryBtn) {
            clearItineraryBtn.onclick = trips.clearItinerary;
        }
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

// ============================================================================
// ENHANCED TRIP CREATION SYSTEM
// ============================================================================

const EnhancedTripCreation = {
    // State management
    selectedVehicles: [],
    selectedStaff: [],
    currentItinerary: null,
    templates: {},

    // Initialize the enhanced trip creation system
    initialize() {
        console.log('🚀 Initializing Enhanced Trip Creation System...');
        this.setupEventHandlers();
        this.loadVehicles();
        this.loadStaff();
        this.loadTemplates();
        // Show initial availability messages
        this.checkVehicleAvailability(null, null);
        this.checkStaffAvailability(null, null);
        console.log('✅ Enhanced Trip Creation System initialized');
    },

    // Set up all event handlers
    setupEventHandlers() {
        // Vehicle management
        const addVehicleBtn = document.getElementById('addVehicleBtn');
        if (addVehicleBtn) {
            addVehicleBtn.addEventListener('click', () => this.showVehicleSelection());
        }

        // Staff management
        const addStaffBtn = document.getElementById('addStaffBtn');
        if (addStaffBtn) {
            addStaffBtn.addEventListener('click', () => this.showStaffSelection());
        }

        // AI Itinerary
        const formatItineraryBtn = document.getElementById('formatItineraryBtn');
        if (formatItineraryBtn) {
            formatItineraryBtn.addEventListener('click', () => this.formatItinerary());
        }

        const clearItineraryBtn = document.getElementById('clearItineraryBtn');
        if (clearItineraryBtn) {
            clearItineraryBtn.addEventListener('click', () => this.clearItinerary());
        }

        // Template selection
        const templateSelect = document.getElementById('itineraryTemplate');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => this.loadTemplate(e.target.value));
        }

        // Preview actions
        const approveItineraryBtn = document.getElementById('approveItineraryBtn');
        if (approveItineraryBtn) {
            approveItineraryBtn.addEventListener('click', () => this.approveItinerary());
        }

        const editItineraryBtn = document.getElementById('editItineraryBtn');
        if (editItineraryBtn) {
            editItineraryBtn.addEventListener('click', () => this.editItinerary());
        }

        const regenerateItineraryBtn = document.getElementById('regenerateItineraryBtn');
        if (regenerateItineraryBtn) {
            regenerateItineraryBtn.addEventListener('click', () => this.regenerateItinerary());
        }
    },

    // Extract dates from AI-processed itinerary
    extractDatesFromItinerary(itinerary) {
        if (!itinerary || itinerary.length === 0) return null;
        
        // For now, return null - dates will be set when itinerary is processed
        // This can be enhanced later to extract actual dates from itinerary text
        return null;
    },

    // Vehicle Management
    async loadVehicles() {
        const loadingMessage = document.getElementById('vehicleLoadingMessage');
        if (loadingMessage) {
            loadingMessage.textContent = 'Loading available vehicles...';
        }

        try {
            // Simulate API call to get vehicles
            const vehicles = await this.fetchVehicles();
            this.displayAvailableVehicles(vehicles);
        } catch (error) {
            console.error('Error loading vehicles:', error);
            if (loadingMessage) {
                loadingMessage.textContent = 'Error loading vehicles. Please try again.';
            }
        }
    },

    async fetchVehicles() {
        try {
            const response = await fetch('api/vehicles/list.php');
            const data = await response.json();
            
            if (data.success) {
                return data.vehicles.map(vehicle => ({
                    id: vehicle.id,
                    name: vehicle.displayName,
                    license: vehicle.license_plate,
                    status: vehicle.isAvailable ? 'available' : 'maintenance',
                    capacity: vehicle.capacity || 4,
                    location: vehicle.location || 'Unknown'
                }));
            } else {
                throw new Error(data.message || 'Failed to fetch vehicles');
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            // Fallback to mock data for development
            return [
                { id: 1, name: 'Chevrolet S10', license: 'ABC-1234', status: 'available', capacity: 4 },
                { id: 2, name: 'Toyota Hilux', license: 'DEF-5678', status: 'available', capacity: 4 },
                { id: 3, name: 'Ford Ranger', license: 'GHI-9012', status: 'maintenance', capacity: 4 },
                { id: 4, name: 'Nissan Frontier', license: 'JKL-3456', status: 'available', capacity: 4 },
                { id: 5, name: 'Volkswagen Amarok', license: 'MNO-7890', status: 'available', capacity: 4 }
            ];
        }
    },

    async checkVehicleAvailability(startDate, endDate) {
        const availabilityInfo = document.getElementById('vehicleAvailabilityInfo');
        if (!startDate || !endDate) {
            if (availabilityInfo) {
                availabilityInfo.innerHTML = `<span style="color: #666;">📅 Dates will be set from itinerary processing</span>`;
            }
            return;
        }

        if (availabilityInfo) {
            availabilityInfo.textContent = `Checking vehicle availability for ${startDate} to ${endDate}...`;
        }

        // Simulate availability check
        setTimeout(() => {
            if (availabilityInfo) {
                availabilityInfo.innerHTML = `
                    <span style="color: green;">✓ 4 vehicles available</span> | 
                    <span style="color: orange;">⚠ 1 in maintenance</span>
                `;
            }
        }, 500);
    },

    displayAvailableVehicles(vehicles) {
        const container = document.getElementById('availableVehiclesList');
        const loadingMessage = document.getElementById('vehicleLoadingMessage');
        const selectionContainer = document.getElementById('vehicleSelectionContainer');

        if (!container) return;

        // Hide loading message and show the selection interface
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (selectionContainer) selectionContainer.style.display = 'block';

        container.innerHTML = vehicles.map(vehicle => `
            <div class="available-vehicle-item ${vehicle.status === 'available' ? '' : 'unavailable'}" 
                 onclick="EnhancedTripCreation.selectVehicle(${vehicle.id})">
                <input type="checkbox" class="vehicle-checkbox" id="vehicle-${vehicle.id}" 
                       ${vehicle.status === 'available' ? '' : 'disabled'}>
                <div class="vehicle-info">
                    <div class="vehicle-info-name">${vehicle.name}</div>
                    <div class="vehicle-info-details">${vehicle.license} • ${vehicle.capacity} passengers</div>
                </div>
                <div class="vehicle-status ${vehicle.status}">${vehicle.status}</div>
            </div>
        `).join('');

        console.log(`✅ Displayed ${vehicles.length} vehicles`);
    },

    selectVehicle(vehicleId) {
        const checkbox = document.getElementById(`vehicle-${vehicleId}`);
        if (checkbox && !checkbox.disabled) {
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                this.addVehicleToSelection(vehicleId);
            } else {
                this.removeVehicleFromSelection(vehicleId);
            }
        }
    },

    async addVehicleToSelection(vehicleId) {
        // Get vehicle details
        const vehicles = await this.fetchVehicles();
        const vehicle = vehicles.find(v => v.id === vehicleId);
        
        if (!vehicle || this.selectedVehicles.find(v => v.id === vehicleId)) return;

        this.selectedVehicles.push({
            ...vehicle,
            drivers: ''
        });

        this.updateSelectedVehiclesList();
    },

    removeVehicleFromSelection(vehicleId) {
        this.selectedVehicles = this.selectedVehicles.filter(v => v.id !== vehicleId);
        this.updateSelectedVehiclesList();
    },

    updateSelectedVehiclesList() {
        const container = document.getElementById('selectedVehiclesList');
        if (!container) return;

        container.innerHTML = this.selectedVehicles.map(vehicle => `
            <div class="selected-vehicle-item">
                <div class="vehicle-header">
                    <div>
                        <span class="vehicle-name">${vehicle.name}</span>
                        <span class="vehicle-license">${vehicle.license}</span>
                    </div>
                    <button type="button" class="remove-vehicle-btn" 
                            onclick="EnhancedTripCreation.removeVehicleFromSelection(${vehicle.id})">×</button>
                </div>
                <div class="driver-assignment">
                    <label>Driver(s) for this vehicle:</label>
                    <input type="text" class="driver-input" 
                           placeholder="e.g., Carlos Silva, Maria Santos (comma-separated for multiple drivers)"
                           value="${vehicle.drivers}"
                           onchange="EnhancedTripCreation.updateVehicleDrivers(${vehicle.id}, this.value)">
                    <div class="driver-help">
                        💡 For multiple drivers per vehicle, separate names with commas. 
                        Leave blank if Wolthers staff will drive.
                    </div>
                </div>
            </div>
        `).join('');
    },

    updateVehicleDrivers(vehicleId, drivers) {
        const vehicle = this.selectedVehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.drivers = drivers;
        }
    },

    showVehicleSelection() {
        const container = document.getElementById('availableVehiclesList');
        if (container) {
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
        }
    },

    // Staff Management
    async loadStaff() {
        const loadingMessage = document.getElementById('staffLoadingMessage');
        if (loadingMessage) {
            loadingMessage.textContent = 'Loading Wolthers staff...';
        }

        try {
            const staff = await this.fetchStaff();
            this.displayAvailableStaff(staff);
        } catch (error) {
            console.error('Error loading staff:', error);
            if (loadingMessage) {
                loadingMessage.textContent = 'Error loading staff. Please try again.';
            }
        }
    },

    async fetchStaff() {
        try {
            // Load all staff without date restrictions initially
            // Availability will be checked later when dates are available from itinerary
            const response = await fetch('api/staff/availability.php');
            const data = await response.json();
            
            if (data.success) {
                return data.staff.map(member => ({
                    id: member.id,
                    name: member.name,
                    department: member.department || 'Operations',
                    role: member.role || 'Staff',
                    available: true // Assume available initially, will check later with dates
                }));
            } else {
                throw new Error(data.message || 'Failed to fetch staff');
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
            return this.getDefaultStaff();
        }
    },

    getDefaultStaff() {
        // Fallback staff data for development
        return [
            { id: 1, name: 'Daniel Wolthers', department: 'Management', role: 'CEO', available: true },
            { id: 2, name: 'Christian Wolthers', department: 'Operations', role: 'COO', available: true },
            { id: 3, name: 'Svenn Wolthers', department: 'Sales', role: 'Sales Director', available: false },
            { id: 4, name: 'Rasmus Wolthers', department: 'Marketing', role: 'Marketing Manager', available: true },
            { id: 5, name: 'Ana Molina', department: 'Operations', role: 'Tour Guide', available: true },
            { id: 6, name: 'Edgar Gomes', department: 'Operations', role: 'Driver', available: true },
            { id: 7, name: 'Hector Posada', department: 'Operations', role: 'Tour Guide', available: true }
        ];
    },

    async checkStaffAvailability(startDate, endDate) {
        const availabilityInfo = document.getElementById('staffAvailabilityInfo');
        if (!startDate || !endDate) {
            if (availabilityInfo) {
                availabilityInfo.innerHTML = `<span style="color: #666;">📅 Dates will be set from itinerary processing</span>`;
            }
            return;
        }

        if (availabilityInfo) {
            availabilityInfo.textContent = `Checking staff availability for ${startDate} to ${endDate}...`;
        }

        // Simulate availability check
        setTimeout(() => {
            if (availabilityInfo) {
                availabilityInfo.innerHTML = `
                    <span style="color: green;">✓ 6 staff members available</span> | 
                    <span style="color: orange;">⚠ 1 unavailable</span>
                `;
            }
        }, 500);
    },

    displayAvailableStaff(staff) {
        const container = document.getElementById('staffList');
        const loadingMessage = document.getElementById('staffLoadingMessage');
        const selectionContainer = document.getElementById('staffSelectionContainer');

        if (!container) return;

        // Hide loading message and show the selection interface
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (selectionContainer) selectionContainer.style.display = 'block';

        container.innerHTML = staff.map(member => `
            <div class="staff-member ${member.available ? '' : 'unavailable'}" 
                 onclick="EnhancedTripCreation.selectStaff(${member.id})">
                <input type="checkbox" class="staff-checkbox" id="staff-${member.id}" 
                       ${member.available ? '' : 'disabled'}>
                <div class="staff-info">
                    <div class="staff-name">${member.name}</div>
                    <div class="staff-department">${member.department} • ${member.role}</div>
                </div>
                <div class="staff-availability ${member.available ? 'available' : 'busy'}">
                    ${member.available ? 'Available' : 'Unavailable'}
                </div>
            </div>
        `).join('');

        console.log(`✅ Displayed ${staff.length} staff members`);
    },

    selectStaff(staffId) {
        const checkbox = document.getElementById(`staff-${staffId}`);
        if (checkbox && !checkbox.disabled) {
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                this.addStaffToSelection(staffId);
            } else {
                this.removeStaffFromSelection(staffId);
            }
        }
    },

    async addStaffToSelection(staffId) {
        const staff = await this.fetchStaff();
        const member = staff.find(s => s.id === staffId);
        
        if (!member || this.selectedStaff.find(s => s.id === staffId)) return;

        this.selectedStaff.push({
            ...member,
            attendanceType: 'full',
            startDay: 1,
            endDay: 7, // Default to 7 days, will be updated when itinerary is processed
            customRole: member.role
        });

        this.updateSelectedStaffList();
    },

    removeStaffFromSelection(staffId) {
        this.selectedStaff = this.selectedStaff.filter(s => s.id !== staffId);
        this.updateSelectedStaffList();
    },

    updateSelectedStaffList() {
        const container = document.getElementById('selectedStaffList');
        if (!container) return;

        const totalDays = 7; // Default to 7 days, will be updated when itinerary is processed

        container.innerHTML = this.selectedStaff.map(member => `
            <div class="selected-staff-item">
                <div class="staff-header">
                    <div class="staff-name-role">
                        <span class="staff-name">${member.name}</span>
                        <span class="staff-role-badge">${member.customRole}</span>
                    </div>
                    <button type="button" class="remove-staff-btn" 
                            onclick="EnhancedTripCreation.removeStaffFromSelection(${member.id})">×</button>
                </div>
                <div class="staff-attendance-config">
                    <div class="attendance-field">
                        <label>Attendance:</label>
                        <select onchange="EnhancedTripCreation.updateStaffAttendance(${member.id}, 'attendanceType', this.value)">
                            <option value="full" ${member.attendanceType === 'full' ? 'selected' : ''}>Full Trip</option>
                            <option value="partial" ${member.attendanceType === 'partial' ? 'selected' : ''}>Partial</option>
                        </select>
                    </div>
                    <div class="attendance-field">
                        <label>From Day:</label>
                        <input type="number" min="1" max="${totalDays}" value="${member.startDay}"
                               onchange="EnhancedTripCreation.updateStaffAttendance(${member.id}, 'startDay', this.value)">
                    </div>
                    <div class="attendance-field">
                        <label>To Day:</label>
                        <input type="number" min="1" max="${totalDays}" value="${member.endDay}"
                               onchange="EnhancedTripCreation.updateStaffAttendance(${member.id}, 'endDay', this.value)">
                    </div>
                </div>
                <div class="attendance-preview">
                    ${this.generateAttendancePreview(member, startDate, endDate)}
                </div>
            </div>
        `).join('');
    },

    updateStaffAttendance(staffId, field, value) {
        const member = this.selectedStaff.find(s => s.id === staffId);
        if (member) {
            member[field] = field === 'attendanceType' ? value : parseInt(value);
            
            // Auto-adjust for full attendance
            if (field === 'attendanceType' && value === 'full') {
                member.startDay = 1;
                member.endDay = 7; // Default to 7 days, will be updated when itinerary is processed
            }
            
            this.updateSelectedStaffList();
        }
    },

    generateAttendancePreview(member, startDate, endDate) {
        if (!startDate || !endDate) {
            return `📅 ${member.name} attending: Day ${member.startDay}-${member.endDay} (dates will be set from itinerary)`;
        }
        
        const start = new Date(startDate);
        const startAttendance = new Date(start.getTime() + (member.startDay - 1) * 24 * 60 * 60 * 1000);
        const endAttendance = new Date(start.getTime() + (member.endDay - 1) * 24 * 60 * 60 * 1000);
        
        return `📅 ${member.name} attending: ${startAttendance.toLocaleDateString()} - ${endAttendance.toLocaleDateString()} (Day ${member.startDay}-${member.endDay})`;
    },

    getTripDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    },

    showStaffSelection() {
        const container = document.getElementById('staffList');
        if (container) {
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
        }
    },

    // AI-Enhanced Itinerary
    async formatItinerary() {
        const textarea = document.getElementById('itineraryText');
        const preview = document.getElementById('itineraryPreview');
        const actions = document.querySelector('.preview-actions');
        
        if (!textarea || !preview) return;

        const rawText = textarea.value.trim();
        if (!rawText) {
            utils.showNotification('Please enter some itinerary text first.', 'warning');
            return;
        }

        // Show processing state
        preview.classList.add('processing');
        preview.innerHTML = '<div class="preview-placeholder"><p>🤖 AI is enhancing your itinerary...</p></div>';
        
        try {
            // Simulate AI processing
            const enhancedItinerary = await this.processItineraryWithAI(rawText);
            
            // Display enhanced itinerary
            preview.classList.remove('processing');
            preview.innerHTML = this.renderEnhancedItinerary(enhancedItinerary);
            
            if (actions) actions.style.display = 'flex';
            
            this.currentItinerary = enhancedItinerary;
            
        } catch (error) {
            console.error('Error processing itinerary:', error);
            preview.classList.remove('processing');
            preview.innerHTML = '<div class="preview-placeholder"><p style="color: red;">❌ Error processing itinerary. Please try again.</p></div>';
        }
    },

    async processItineraryWithAI(rawText) {
        // Simulate AI processing - replace with real AI API
        return new Promise(resolve => {
            setTimeout(() => {
                const days = this.parseRawItinerary(rawText);
                const enhanced = this.enhanceItineraryWithAI(days);
                resolve(enhanced);
            }, 2000);
        });
    },

    parseRawItinerary(rawText) {
        const lines = rawText.split('\n').filter(line => line.trim());
        const days = [];
        let currentDay = null;
        let extractedDates = null;

        lines.forEach(line => {
            const trimmed = line.trim().toLowerCase();
            
            // Try to extract dates from the text
            if (!extractedDates) {
                extractedDates = this.extractDatesFromText(line);
            }
            
            // Detect day markers
            if (trimmed.includes('day ') || trimmed.match(/^\d+/) || trimmed.includes('dia ')) {
                if (currentDay) days.push(currentDay);
                currentDay = {
                    dayNumber: days.length + 1,
                    activities: [],
                    rawLine: line
                };
            } else if (currentDay) {
                currentDay.activities.push(line.trim());
            } else {
                // First activity without day marker
                currentDay = {
                    dayNumber: 1,
                    activities: [line.trim()],
                    rawLine: 'Day 1'
                };
            }
        });

        if (currentDay) days.push(currentDay);

        // Auto-set dates if found
        if (extractedDates) {
            this.autoSetTripDates(extractedDates.startDate, extractedDates.endDate);
        } else if (days.length > 0) {
            // If no dates found, set default dates based on number of days
            this.autoSetDefaultDates(days.length);
        }

        return days;
    },

    extractDatesFromText(text) {
        // Look for date patterns in various formats
        const datePatterns = [
            /(\d{1,2}\/\d{1,2}\/\d{4})/g, // MM/DD/YYYY or DD/MM/YYYY
            /(\d{4}-\d{1,2}-\d{1,2})/g,   // YYYY-MM-DD
            /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi,
            /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/gi
        ];

        for (const pattern of datePatterns) {
            const matches = text.match(pattern);
            if (matches && matches.length >= 2) {
                return {
                    startDate: matches[0],
                    endDate: matches[matches.length - 1]
                };
            }
        }
        return null;
    },

    autoSetTripDates(startDate, endDate) {
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        
        if (startInput && endInput) {
            try {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                startInput.value = start.toISOString().split('T')[0];
                endInput.value = end.toISOString().split('T')[0];
                
                console.log('✅ Auto-set trip dates from itinerary:', startDate, 'to', endDate);
            } catch (error) {
                console.warn('Could not parse extracted dates:', error);
                this.autoSetDefaultDates(7);
            }
        }
    },

    autoSetDefaultDates(numberOfDays) {
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        
        if (startInput && endInput) {
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            const endDate = new Date(nextMonth.getTime() + (numberOfDays - 1) * 24 * 60 * 60 * 1000);
            
            startInput.value = nextMonth.toISOString().split('T')[0];
            endInput.value = endDate.toISOString().split('T')[0];
            
            console.log(`✅ Auto-set default dates for ${numberOfDays}-day trip`);
        }
    },

    enhanceItineraryWithAI(days) {
        return days.map(day => ({
            ...day,
            activities: day.activities.map(activity => this.enhanceActivity(activity))
        }));
    },

    enhanceActivity(activity) {
        // Simple AI enhancement simulation
        const enhanced = activity
            .replace(/(\d{1,2})(am|pm)/gi, '$1:00 $2')
            .replace(/(\d{1,2})(\d{2})(am|pm)/gi, '$1:$2 $3')
            .replace(/\b(morning|afternoon|evening|night)\b/gi, match => {
                const timeMap = {
                    'morning': '9:00 AM',
                    'afternoon': '2:00 PM', 
                    'evening': '6:00 PM',
                    'night': '8:00 PM'
                };
                return timeMap[match.toLowerCase()] || match;
            });

        // Extract time if present
        const timeMatch = enhanced.match(/(\d{1,2}:\d{2}\s*(AM|PM))/i);
        const time = timeMatch ? timeMatch[0] : '';
        const text = enhanced.replace(/(\d{1,2}:\d{2}\s*(AM|PM))/i, '').trim();

        // Capitalize first letter
        const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
        
        // Add period if missing
        const finalText = capitalizedText.endsWith('.') ? capitalizedText : capitalizedText + '.';

        return {
            time: time,
            text: finalText,
            location: this.extractLocation(finalText),
            enhanced: true
        };
    },

    extractLocation(text) {
        // Simple location extraction
        const locationKeywords = ['at ', 'in ', 'to ', 'visit ', 'farm ', 'hotel ', 'restaurant ', 'airport '];
        for (const keyword of locationKeywords) {
            const index = text.toLowerCase().indexOf(keyword);
            if (index !== -1) {
                const afterKeyword = text.slice(index + keyword.length);
                const location = afterKeyword.split(/[,.!?]/)[0].trim();
                if (location.length > 0 && location.length < 50) {
                    return location;
                }
            }
        }
        return '';
    },

    renderEnhancedItinerary(itinerary) {
        return `
            <div class="ai-formatted-content">
                ${itinerary.map(day => `
                    <div class="ai-day-section">
                        <div class="ai-day-header">
                            <div class="ai-day-number">${day.dayNumber}</div>
                            <span>Day ${day.dayNumber}</span>
                            <span class="ai-enhancement-badge">AI Enhanced</span>
                        </div>
                        ${day.activities.map(activity => `
                            <div class="ai-activity">
                                <div class="ai-time">${activity.time || '—'}</div>
                                <div class="ai-activity-text">
                                    ${activity.text}
                                    ${activity.location ? `<div class="ai-location">📍 ${activity.location}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    },

    clearItinerary() {
        const textarea = document.getElementById('itineraryText');
        const preview = document.getElementById('itineraryPreview');
        const actions = document.querySelector('.preview-actions');
        
        if (textarea) textarea.value = '';
        if (preview) {
            preview.innerHTML = `
                <div class="preview-placeholder">
                    <p style="color: #666; font-style: italic;">✨ Your AI-enhanced itinerary will appear here</p>
                    <p style="color: #888; font-size: 0.9em;">Type or paste your itinerary above, then click "AI Format & Enhance" to see the magic!</p>
                </div>
            `;
        }
        if (actions) actions.style.display = 'none';
        
        this.currentItinerary = null;
    },

    approveItinerary() {
        if (this.currentItinerary) {
            utils.showNotification('✅ Itinerary approved and ready for trip creation!', 'success');
            const actions = document.querySelector('.preview-actions');
            if (actions) actions.style.display = 'none';
        }
    },

    editItinerary() {
        const textarea = document.getElementById('itineraryText');
        if (textarea) {
            textarea.focus();
            utils.showNotification('💡 Make your changes above, then click "AI Format & Enhance" again.', 'info');
        }
    },

    async regenerateItinerary() {
        const textarea = document.getElementById('itineraryText');
        if (textarea && textarea.value.trim()) {
            await this.formatItinerary();
        }
    },

    // Template Management
    loadTemplates() {
        this.templates = {
            'coffee-origin': {
                title: 'Coffee Origin Tour (5 days)',
                description: 'Complete coffee journey from farm to cup',
                content: `Day 1
Arrival at airport
Transfer to hotel in coffee region
Welcome dinner with local coffee farmers
Coffee cupping introduction session

Day 2
Morning visit to high-altitude coffee farm
Meet with farm owner and learn about cultivation
Lunch at farm with traditional Colombian food
Afternoon processing facility tour
Evening return to hotel

Day 3
Early morning harvest experience
Traditional coffee processing workshop
Lunch break
Afternoon roasting session
Evening cultural presentation

Day 4
Visit to cooperative facilities
Meet with coffee exporters
Quality control laboratory tour
Farewell dinner with live music

Day 5
Final cupping session
Departure preparations
Transfer to airport`
            },
            'city-coffee': {
                title: 'City Coffee Experience (3 days)',
                description: 'Urban coffee culture immersion',
                content: `Day 1
Airport pickup
Check-in at boutique hotel
Lunch at specialty coffee shop
Afternoon coffee shop tour
Evening at roastery with dinner

Day 2
Morning at coffee museum
Barista workshop session
Lunch break
Afternoon coffee tasting tour
Evening free time

Day 3
Final coffee breakfast
Shopping for coffee souvenirs
Transfer to airport`
            }
        };
    },

    loadTemplate(templateKey) {
        const template = this.templates[templateKey];
        const textarea = document.getElementById('itineraryText');
        const preview = document.getElementById('itineraryPreview');
        
        if (!template || !textarea) return;

        if (templateKey === '') {
            this.clearItinerary();
            return;
        }

        textarea.value = template.content;
        
        // Show template preview
        if (preview) {
            preview.innerHTML = `
                <div class="template-preview active">
                    <div class="template-title">${template.title}</div>
                    <div class="template-description">${template.description}</div>
                    <div class="template-highlights">
                        <li>Pre-structured daily activities</li>
                        <li>Optimized timing and flow</li>
                        <li>Professional formatting ready</li>
                        <li>Customizable for your needs</li>
                    </div>
                    <p style="margin-top: 15px; font-style: italic; color: #666;">
                        Click "AI Format & Enhance" to process this template with AI improvements.
                    </p>
                </div>
            `;
        }
    },

    // Get collected data for trip creation
    getCollectedData() {
        return {
            vehicles: this.selectedVehicles,
            staff: this.selectedStaff,
            itinerary: this.currentItinerary
        };
    }
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
    console.log('Opening User Management Modal...');
    const modal = document.getElementById('userManagementModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        loadUserManagementData();
    }
}

function hideUserManagementModal() {
    const modal = document.getElementById('userManagementModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200); // Allow transition to complete
        document.body.style.overflow = 'auto';
    }
}

function showCompanyManagementModal() {
    console.log('Opening Company Management Modal...');
    const modal = document.getElementById('companyManagementModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Load company management data
        loadCompanyManagementData();
    }
}

function hideCompanyManagementModal() {
    const modal = document.getElementById('companyManagementModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200); // Allow transition to complete
        document.body.style.overflow = 'auto';
    }
}

/**
 * Comprehensive Data Refresh Function
 * Reloads both companies and users from backend and updates all UI components
 */
async function refreshAllData() {
    try {
        console.log('🔄 Refreshing all data from backend...');
        
        // 1. Load users fresh from backend (for user count accuracy)
        if (currentUser && currentUser.role === 'admin') {
            await loadAllUsersForAdmin();
        }
        
        // 2. Load companies fresh from backend
        await loadCompanies();
        
        // 3. Auto-link users to companies based on latest data
        await autoLinkUsersToCompanies();
        
        // 4. Update all UI components
        loadCompanyTable();
        updateCompanyDropdown();
        
        console.log('✅ All data refreshed successfully');
        
    } catch (error) {
        console.error('❌ Failed to refresh data:', error);
        showToast('Failed to refresh data', 'error');
    }
}

async function loadCompanyManagementData() {
    try {
        console.log('Loading company management data...');
        
        // First, load users fresh from backend (for user count accuracy)
        if (currentUser && currentUser.role === 'admin') {
            await loadAllUsersForAdmin();
        }
        
        // Then load companies fresh from backend
        await loadCompanies();
        
        // Auto-link users to companies based on latest data
        await autoLinkUsersToCompanies();
        
        // Load company table with fresh data
        loadCompanyTable();
        
        // Setup search and filter interactions
        setupCompanyManagementInteractions();
        
    } catch (error) {
        console.error('Error loading company management data:', error);
        showToast('Failed to load company data', 'error');
    }
}

function loadCompanyTable() {
    const companiesList = document.getElementById('modalCompaniesList');
    if (!companiesList || !companiesData) return;
    
    // Get users for counting
    const users = getUsersFromDatabase();
    
    // Clear existing content
    companiesList.innerHTML = '';
    
    // Calculate summary statistics
    updateCompanySummary();
    
    // Render companies
    companiesData.forEach(company => {
        const row = createCompanyTableRow(company, users);
        companiesList.appendChild(row);
    });
    
    // Update pagination info
    updateCompanyPaginationInfo();
}

function createCompanyTableRow(company, users) {
    const row = document.createElement('tr');
    row.className = 'fluent-table-row';
    
    // Count users in this company
    const companyUsers = users.filter(u => u.company_id == company.id);
    const userCount = companyUsers.length;
    
    // Format location
    const location = [company.city, company.state, company.country].filter(Boolean).join(', ') || '-';
    
    // Format company type
    const typeDisplayMap = {
        'importer': 'Importer',
        'exporter': 'Exporter',
        'roaster': 'Coffee Roaster',
        'distributor': 'Distributor',
        'retailer': 'Retailer',
        'consultant': 'Consultant',
        'service_provider_broker': 'Service Provider (Broker)',
        'service_provider_broker_qc': 'Service Provider (Broker and Quality Control)',
        'service_provider_qc': 'Service Provider (Quality Control)',
        'general_warehouse': 'General Warehouse',
        'bonded_warehouse': 'Bonded Warehouse',
        'other': 'Other'
    };
    const typeDisplay = typeDisplayMap[company.company_type] || 'Other';
    
    // Format creation date
    const createdDate = company.created_at ? 
        formatTableDate(company.created_at) : 
        'Unknown';
    
    row.innerHTML = `
        <td class="fluent-td-checkbox">
            <input type="checkbox" class="fluent-checkbox company-checkbox" data-company-id="${company.id}">
        </td>
        <td class="fluent-td-company-info">
            <div class="company-info">
                <div class="company-name">${escapeHtml(company.fantasy_name || company.full_name)}</div>
                ${company.fantasy_name && company.fantasy_name !== company.full_name ? 
                    `<div class="company-legal-name">${escapeHtml(company.full_name)}</div>` : 
                    ''
                }
            </div>
        </td>
        <td class="fluent-td-type">
            <span class="company-type-badge ${getCompanyTypeClass(company.company_type)}">${typeDisplay}</span>
        </td>
        <td class="fluent-td-location">${escapeHtml(location)}</td>
        <td class="fluent-td-users">
            <span class="user-count">${userCount}</span>
        </td>
        <td class="fluent-td-status">
            <span class="status-badge ${getCompanyStatusClass(company.status || 'active')}">${(company.status || 'active').charAt(0).toUpperCase() + (company.status || 'active').slice(1)}</span>
        </td>
        <td class="fluent-td-date">${createdDate}</td>
        <td class="fluent-td-actions">
            <div class="fluent-action-buttons">
                <button class="fluent-action-btn" onclick="editCompany('${company.id}')" title="Edit company">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354L12.427 2.487zM12.25 6.25L10.811 4.81 9.53 6.091a.25.25 0 00-.064.108l-.85 2.972 2.972-.85a.25.25 0 00.108-.064L12.25 6.25z"/>
                    </svg>
                </button>
                <button class="fluent-action-btn" onclick="viewCompanyUsers('${company.id}')" title="View company users">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM12.5 9a.5.5 0 01.5.5c0 1.5-1.5 3-4.5 3s-4.5-1.5-4.5-3a.5.5 0 01.5-.5h8z"/>
                        <path d="M14 8a.5.5 0 01.5.5c0 1.5-1.5 3-4.5 3-.5 0-1-.1-1.4-.2a6.5 6.5 0 003.4-2.3h2z"/>
                    </svg>
                </button>
                <button class="fluent-action-btn" onclick="deleteCompany('${company.id}')" title="Delete company">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H5a1 1 0 011-1h4a1 1 0 011 1h2.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

function updateCompanySummary() {
    if (!companiesData) return;
    
    const totalCount = companiesData.length;
    const activeCount = companiesData.filter(c => (c.status || 'active') === 'active').length;
    const importerCount = companiesData.filter(c => c.company_type === 'importer').length;
    const exporterCount = companiesData.filter(c => c.company_type === 'exporter').length;
    
    // Update summary cards
    const totalElement = document.getElementById('totalCompaniesCount');
    const activeElement = document.getElementById('activeCompaniesCount');
    const importerElement = document.getElementById('importerCompaniesCount');
    const exporterElement = document.getElementById('exporterCompaniesCount');
    
    if (totalElement) totalElement.textContent = totalCount;
    if (activeElement) activeElement.textContent = activeCount;
    if (importerElement) importerElement.textContent = importerCount;
    if (exporterElement) exporterElement.textContent = exporterCount;
}

function updateCompanyPaginationInfo() {
    const paginationInfo = document.getElementById('companyPaginationInfo');
    if (paginationInfo && companiesData) {
        const count = companiesData.length;
        paginationInfo.textContent = `Showing ${count} of ${count} companies`;
    }
}

function getCompanyTypeClass(type) {
    const typeClasses = {
        'importer': 'type-importer',
        'exporter': 'type-exporter', 
        'roaster': 'type-roaster',
        'distributor': 'type-distributor',
        'retailer': 'type-retailer',
        'consultant': 'type-consultant',
        'service_provider_broker': 'type-service-provider',
        'service_provider_broker_qc': 'type-service-provider',
        'service_provider_qc': 'type-service-provider',
        'general_warehouse': 'type-warehouse',
        'bonded_warehouse': 'type-warehouse',
        'other': 'type-other'
    };
    return typeClasses[type] || 'type-other';
}

function getCompanyStatusClass(status) {
    const statusClasses = {
        'active': 'status-active',
        'inactive': 'status-inactive',
        'suspended': 'status-suspended'
    };
    return statusClasses[status] || 'status-active';
}

function setupCompanyManagementInteractions() {
    // Search functionality
    const searchInput = document.getElementById('companySearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterCompanies();
        }, 300));
    }
    
    // Filter functionality
    const typeFilter = document.getElementById('companyTypeFilter');
    const statusFilter = document.getElementById('companyStatusFilter');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterCompanies);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCompanies);
    }
}

function filterCompanies() {
    if (!companiesData) return;
    
    const searchTerm = document.getElementById('companySearchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('companyTypeFilter')?.value || '';
    const statusFilter = document.getElementById('companyStatusFilter')?.value || '';
    
    let filteredCompanies = companiesData.filter(company => {
        // Search filter
        const matchesSearch = !searchTerm || 
            (company.full_name && company.full_name.toLowerCase().includes(searchTerm)) ||
            (company.fantasy_name && company.fantasy_name.toLowerCase().includes(searchTerm)) ||
            (company.city && company.city.toLowerCase().includes(searchTerm)) ||
            (company.country && company.country.toLowerCase().includes(searchTerm));
        
        // Type filter
        const matchesType = !typeFilter || company.company_type === typeFilter;
        
        // Status filter
        const matchesStatus = !statusFilter || (company.status || 'active') === statusFilter;
        
        return matchesSearch && matchesType && matchesStatus;
    });
    
    // Re-render table with filtered data
    renderFilteredCompanies(filteredCompanies);
}

function renderFilteredCompanies(companies) {
    const companiesList = document.getElementById('modalCompaniesList');
    const users = getUsersFromDatabase();
    
    if (!companiesList) return;
    
    companiesList.innerHTML = '';
    
    companies.forEach(company => {
        const row = createCompanyTableRow(company, users);
        companiesList.appendChild(row);
    });
    
    // Update pagination info
    const paginationInfo = document.getElementById('companyPaginationInfo');
    if (paginationInfo) {
        paginationInfo.textContent = `Showing ${companies.length} of ${companiesData.length} companies`;
    }
}

function editCompany(companyId) {
    const company = companiesData.find(c => c.id == companyId);
    if (company) {
        showEditCompanyModal(company);
    } else {
        showToast('Company not found', 'error');
    }
}

function viewCompanyUsers(companyId) {
    // Close company management modal and open user management with company filter
    hideCompanyManagementModal();
    
    setTimeout(() => {
        showUserManagementModal();
        
        // Set company filter after modal loads
        setTimeout(() => {
            const companyFilter = document.getElementById('userCompanyFilter');
            if (companyFilter) {
                companyFilter.value = companyId;
                applyFiltersAndSearch();
            }
        }, 100);
    }, 200);
}

async function deleteCompany(companyId) {
    const company = companiesData.find(c => c.id == companyId);
    if (!company) return;
    
    const users = getUsersFromDatabase();
    const companyUsers = users.filter(u => u.company_id == companyId);
    
    let confirmMessage = `Are you sure you want to delete "${company.fantasy_name || company.full_name}"?`;
    
    if (companyUsers.length > 0) {
        confirmMessage += `\n\nThis company has ${companyUsers.length} user${companyUsers.length !== 1 ? 's' : ''} assigned. They will be unlinked from this company.`;
    }
    
    confirmMessage += '\n\nThis action cannot be undone.';
    
    if (confirm(confirmMessage)) {
        try {
            // Try to delete via API first
            try {
                            const response = await fetch('companies-api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    id: companyId
                })
                });

                const data = await response.json();
                
                if (data.success) {
                    // Refresh all data from backend
                    await refreshAllData();
                    
                    showToast(`Company "${company.fantasy_name || company.full_name}" deleted successfully!`, 'success');
                    return;
                } else {
                    throw new Error(data.error || 'Failed to delete company');
                }
            } catch (apiError) {
                console.warn('API deletion failed, using fallback:', apiError);
                
                // Fallback: Refresh all data from backend
                await refreshAllData();
                
                showToast(`Company "${company.fantasy_name || company.full_name}" deleted locally`, 'success');
            }
            
        } catch (error) {
            console.error('Error deleting company:', error);
            showToast('Failed to delete company: ' + error.message, 'error');
        }
    }
}

function removeCompanyFromLocalData(companyId, company) {
    // Remove company from companiesData
    const companyIndex = companiesData.findIndex(c => c.id == companyId);
    if (companyIndex !== -1) {
        companiesData.splice(companyIndex, 1);
    }
    
    // Unlink users from this company
    const users = getUsersFromDatabase();
    const companyUsers = users.filter(u => u.company_id == companyId);
    
    companyUsers.forEach(user => {
        user.company_id = null;
        user.company_name = null;
        user.company_role = 'staff';
        user.can_see_company_trips = false;
    });
    
    // Save user changes
    window.USER_DATABASE = users;
    saveUserDatabase();
    
    // Refresh company table and dropdowns
    loadCompanyTable();
    updateCompanyDropdown();
    
    // Refresh user displays if modal is open
    if (document.getElementById('userManagementModal').style.display !== 'none') {
        loadUsersTable();
    }
}

function showEditCompanyModal(company) {
    const modal = document.getElementById('editCompanyModal');
    if (modal && company) {
        // Populate form with company data
        document.getElementById('editCompanyId').value = company.id;
        document.getElementById('editCompanyFullName').value = company.full_name || '';
        document.getElementById('editCompanyFantasyName').value = company.fantasy_name || '';
        document.getElementById('editCompanyType').value = company.company_type || '';
        document.getElementById('editCompanyAddress').value = company.address || '';
        document.getElementById('editCompanyCity').value = company.city || '';
        document.getElementById('editCompanyState').value = company.state || '';
        document.getElementById('editCompanyCountry').value = company.country || '';
        document.getElementById('editCompanyPostalCode').value = company.postal_code || '';
        document.getElementById('editCompanyPhone').value = company.phone || '';
        document.getElementById('editCompanyEmail').value = company.email || '';
        document.getElementById('editCompanyRegistrationNumber').value = company.registration_number || '';
        document.getElementById('editCompanyTaxId').value = company.tax_id || '';
        document.getElementById('editCompanyStatus').value = company.status || 'active';
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Setup form submission
        const form = document.getElementById('editCompanyForm');
        form.onsubmit = handleEditCompanySubmit;
        
        // Reset details section
        const detailsSection = document.getElementById('editCompanyDetailsSection');
        const toggleBtn = document.getElementById('toggleEditCompanyDetails');
        if (detailsSection && toggleBtn) {
            // Show details if any optional fields have data
            const hasOptionalData = company.address || company.city || company.phone || 
                                   company.email || company.registration_number;
            
            if (hasOptionalData) {
                detailsSection.style.display = 'block';
                toggleBtn.querySelector('span').textContent = '- Hide additional details';
                toggleBtn.querySelector('.toggle-icon').style.transform = 'rotate(45deg)';
                toggleBtn.classList.add('expanded');
            } else {
                detailsSection.style.display = 'none';
                toggleBtn.querySelector('span').textContent = '+ Edit additional details';
                toggleBtn.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
                toggleBtn.classList.remove('expanded');
            }
        }
    }
}

function hideEditCompanyModal() {
    const modal = document.getElementById('editCompanyModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function toggleEditCompanyDetailsForm() {
    const detailsSection = document.getElementById('editCompanyDetailsSection');
    const toggleBtn = document.getElementById('toggleEditCompanyDetails');
    const toggleText = toggleBtn.querySelector('span');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');
    
    if (detailsSection.style.display === 'none' || detailsSection.style.display === '') {
        detailsSection.style.display = 'block';
        toggleText.textContent = '- Hide additional details';
        toggleIcon.style.transform = 'rotate(45deg)';
        toggleBtn.classList.add('expanded');
    } else {
        detailsSection.style.display = 'none';
        toggleText.textContent = '+ Edit additional details';
        toggleIcon.style.transform = 'rotate(0deg)';
        toggleBtn.classList.remove('expanded');
    }
}

async function handleEditCompanySubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('editCompanySubmitBtn');
    const spinner = submitBtn.querySelector('.fluent-spinner');
    const btnText = submitBtn.querySelector('.btn-text');
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.textContent = 'Updating...';
        
        // Collect form data
        const companyId = document.getElementById('editCompanyId').value;
        const formData = {
            id: companyId,
            full_name: document.getElementById('editCompanyFullName').value.trim(),
            fantasy_name: document.getElementById('editCompanyFantasyName').value.trim(),
            company_type: document.getElementById('editCompanyType').value,
            service_provider_subtype: document.getElementById('editServiceProviderSubtype')?.value || '',
            address: document.getElementById('editCompanyAddress').value.trim(),
            city: document.getElementById('editCompanyCity').value.trim(),
            state: document.getElementById('editCompanyState').value.trim(),
            country: document.getElementById('editCompanyCountry').value.trim(),
            postal_code: document.getElementById('editCompanyPostalCode').value.trim(),
            phone: document.getElementById('editCompanyPhone').value.trim(),
            email: document.getElementById('editCompanyEmail').value.trim(),
            registration_number: document.getElementById('editCompanyRegistrationNumber').value.trim(),
            tax_id: document.getElementById('editCompanyTaxId').value.trim(),
            status: document.getElementById('editCompanyStatus').value
        };
        
        // Validate required fields
        if (!formData.full_name || !formData.company_type) {
            throw new Error('Please fill in all required fields');
        }
        
        // Try to update via API first
        try {
            const response = await fetch('companies-api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    ...formData
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Refresh all data from backend
                await refreshAllData();
                
                showToast(`Company "${formData.fantasy_name || formData.full_name}" updated successfully!`, 'success');
                hideEditCompanyModal();
                return;
            } else {
                throw new Error(data.error || 'Failed to update company');
            }
        } catch (apiError) {
            console.warn('API update failed, using fallback:', apiError);
            
            // Fallback: Update local data
            updateCompanyInLocalData(formData);
            
            showToast(`Company "${formData.fantasy_name || formData.full_name}" updated locally`, 'success');
            hideEditCompanyModal();
        }
        
    } catch (error) {
        console.error('Error updating company:', error);
        showToast('Failed to update company: ' + error.message, 'error');
        
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Update Company';
    }
}

function updateCompanyInLocalData(updatedCompany) {
    if (!companiesData) return;
    
    // Find and update the company in local data
    const companyIndex = companiesData.findIndex(c => c.id == updatedCompany.id);
    if (companyIndex !== -1) {
        // Preserve original creation date
        const originalCompany = companiesData[companyIndex];
        companiesData[companyIndex] = {
            ...originalCompany,
            ...updatedCompany,
            updated_at: new Date().toISOString()
        };
        
        // Update any users with this company
        const users = getUsersFromDatabase();
        users.forEach(user => {
            if (user.company_id == updatedCompany.id) {
                user.company_name = updatedCompany.fantasy_name || updatedCompany.full_name;
            }
        });
        
        // Save user changes
        window.USER_DATABASE = users;
        saveUserDatabase();
        
        // Refresh displays
        loadCompanyTable();
        updateCompanyDropdown();
    }
}

async function loadUserManagementData() {
    try {
        showLoadingState(true);
        
        // Load current user profile
        if (currentUser) {
            updateCurrentUserProfile(currentUser);
        }
        
        // For admins: Load all users from all sources (fresh from backend)
        if (currentUser && currentUser.role === 'admin') {
            await loadAllUsersForAdmin();
        }
        
        // Load companies fresh from backend (for user-company linking)
        await loadCompanies();
        
        // Auto-link users to companies based on latest data
        await autoLinkUsersToCompanies();
        
        // Load users list from API
        await loadModalUsersList();
        
        // Setup search and filter functionality
        setupUserManagementInteractions();
        
        // Setup Add User form handler
        setupAddUserForm();
        
        // Update user summary cards
        updateUserSummaryCards(getUsersFromDatabase());
        
    } catch (error) {
        showToast('Failed to load user management data', 'error');
    } finally {
        showLoadingState(false);
    }
}

function updateCurrentUserProfile(user) {
    const profileName = document.getElementById('modalProfileName');
    const profileEmail = document.getElementById('modalProfileEmail');
    const profileCompany = document.getElementById('modalProfileCompany');
    const profileRole = document.getElementById('modalProfileRole');
    const profileAvatar = document.getElementById('modalProfileAvatar');
    
    if (profileName) profileName.textContent = user.name || 'Unknown User';
    if (profileEmail) profileEmail.textContent = user.email || 'No email';
    
    if (profileCompany) {
        const userCompany = user.company_fantasy_name || user.company_name || getUserCompany(user);
        profileCompany.textContent = userCompany || 'No company';
    }
    
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

/**
 * Update User Summary Cards with statistics
 * @param {Array} users - Array of user objects
 */
function updateUserSummaryCards(users) {
    try {
        if (!users || !Array.isArray(users)) {
            console.warn('⚠️ No users array provided to updateUserSummaryCards');
            users = [];
        }

        const totalUsers = users.length;
        const activeUsers = users.filter(user => {
            const status = getUserStatus(user);
            return status === 'active' || status === 'Active';
        }).length;
        const adminUsers = users.filter(user => 
            user.role === 'admin' || user.systemRole === 'admin'
        ).length;
        const guestUsers = users.filter(user => 
            user.role === 'guest' || user.systemRole === 'guest'
        ).length;
        
        // Update the summary card numbers
        const totalElement = document.getElementById('totalUsersCount');
        const activeElement = document.getElementById('activeUsersCount');
        const adminElement = document.getElementById('adminUsersCount');
        const guestElement = document.getElementById('guestUsersCount');
        
        if (totalElement) totalElement.textContent = totalUsers;
        if (activeElement) activeElement.textContent = activeUsers;
        if (adminElement) adminElement.textContent = adminUsers;
        if (guestElement) guestElement.textContent = guestUsers;
        
        console.log('📊 User summary cards updated:', {
            total: totalUsers,
            active: activeUsers,
            admin: adminUsers,
            guest: guestUsers
        });
        
    } catch (error) {
        console.error('❌ Error updating user summary cards:', error);
        // Set default values if there's an error
        ['totalUsersCount', 'activeUsersCount', 'adminUsersCount', 'guestUsersCount'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
    }
}

// Load all users for admin view - primarily from database API
async function loadAllUsersForAdmin() {
    try {
        console.log('🔍 Admin loading users from database...');
        
        // Load users from real database API
        try {
            const response = await fetch('users-api.php?auth_check=1&limit=100');
            if (response.ok) {
                const apiData = await response.json();
                console.log('🔍 Raw API response:', apiData);
                
                // Handle different response formats from the API
                let usersArray = null;
                if (apiData.users && Array.isArray(apiData.users)) {
                    usersArray = apiData.users;
                    console.log('✅ Using formatted users from API');
                } else if (apiData.raw_users && Array.isArray(apiData.raw_users)) {
                    console.log('⚠️ Using raw_users from API (debug mode detected)');
                    usersArray = apiData.raw_users;
                } else if (Array.isArray(apiData)) {
                    console.log('⚠️ API returned array directly');
                    usersArray = apiData;
                } else {
                    console.error('❌ Unable to find users array in API response. Keys:', Object.keys(apiData));
                }
                
                if (usersArray && usersArray.length > 0) {
                    console.log(`📡 Loaded ${usersArray.length} users from database API`);
                    console.log('📊 Database statistics:', apiData.statistics);
                    console.log('🔍 First user data structure:', usersArray[0]);
                    
                    // Map API data to the frontend user model to ensure all fields match
                    const mappedUsers = usersArray.map(user => ({
                        ...user,
                        id: user.id || generateUserId(user.name || user.email),
                        memberSince: user.created_at,
                        lastLoginDisplay: (user.last_login_at || user.last_login) ? formatUserTimezone(user.last_login_at || user.last_login) : 'Never',
                        company_name: user.company_fantasy_name || user.company_full_name,
                        isWolthersTeam: user.email?.endsWith('@wolthers.com') || false,
                        avatar: user.name?.charAt(0).toUpperCase() || '?'
                    }));
                    
                    console.log('🔍 Mapped users IDs:', mappedUsers.map(u => ({ id: u.id, name: u.name })));
                    USER_DATABASE = mappedUsers;
                    
                    // Fix any invalid timestamps from API data
                    fixUserTimestamps();
                    
                    saveUserDatabase();
                    localStorage.setItem('wolthers_users_database_source', 'true');
                    return;
                } else {
                    console.log('⚠️ No users array found in API response');
                }
            } else {
                console.log('⚠️ Users API response not ok:', response.status);
            }
        } catch (error) {
            console.log('⚠️ Users API error:', error.message);
        }
        
        // Fallback: Initialize with empty database if API fails
        console.log('⚠️ Database API unavailable, initializing empty user database...');
        USER_DATABASE = [];
        saveUserDatabase();
        localStorage.setItem('wolthers_users_database_source', 'false');
        
    } catch (error) {
        console.error('❌ Error loading all users for admin:', error);
        USER_DATABASE = [];
        saveUserDatabase();
        localStorage.setItem('wolthers_users_database_source', 'false');
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
    console.log('loadModalUsersList: Found', users.length, 'users');
    console.log('🔍 User IDs and names:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));
    
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
        
        // Setup enhanced form handling with company integration
        setupEnhancedAddUserForm();
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

async function editUser(userId) {
    console.log('Edit user called with ID:', userId);
    
    try {
        // Always fetch fresh user data from backend
        const response = await fetch(`https://trips.wolthers.com/users-api.php?id=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.user) {
            console.log('Found user from backend:', result.user);
            await showEditUserModal(result.user);
        } else {
            // Fallback to local data if backend fails
            console.log('Backend fetch failed, trying local data...');
            const users = getUsersFromDatabase();
            
            // Try multiple ID matching strategies
            let user = users.find(u => u.id === userId) ||
                      users.find(u => String(u.id) === String(userId)) ||
                      users.find(u => u.email === userId);
            
            if (user) {
                console.log('Found user in local data:', user);
                await showEditUserModal(user);
            } else {
                console.warn('User not found with ID:', userId);
                showToast('User not found. The user may have been deleted or you may need to refresh the page.', 'warning');
            }
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        
        // Fallback to local data on network error
        const users = getUsersFromDatabase();
        let user = users.find(u => u.id === userId) ||
                  users.find(u => String(u.id) === String(userId)) ||
                  users.find(u => u.email === userId);
        
        if (user) {
            console.log('Using local data due to network error:', user);
            showEditUserModal(user);
        } else {
            showToast('Unable to load user data. Please check your connection and try again.', 'error');
        }
    }
}

async function deleteUser(userId) {
    const user = getUsersFromDatabase().find(u => u.id === userId);
    if (!user) return;
    
    const confirmed = await showConfirmDialog(
        'Delete User',
        `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
        'Delete',
        'danger'
    );
    
    if (confirmed) {
        try {
            const response = await fetch(`users-api.php?id=${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Refresh all data from backend
                await refreshAllData();
                
                showToast(`User ${user.name} deleted successfully`, 'success');
            } else {
                throw new Error(result.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast('Failed to delete user: ' + error.message, 'error');
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

async function showEditUserModal(user) {
    console.log('🔧 showEditUserModal called with user:', user);
    
    const modal = document.getElementById('editUserModal');
    if (!modal) {
        console.error('❌ Edit user modal not found in DOM');
        showToast('Modal not found - please refresh the page', 'error');
        return;
    }
    
    try {
        // Populate form with user data
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = user.name || '';
        document.getElementById('editUserEmail').value = user.email || '';
        
        // Populate company dropdown first, then set selected value
        await populateEditUserCompanyDropdown();
        document.getElementById('editUserCompany').value = user.company_id || '';
        
        document.getElementById('editUserCompanyRole').value = user.company_role || 'staff';
        document.getElementById('editUserRole').value = user.role || 'user';
        document.getElementById('editCanSeeCompanyTrips').checked = user.can_see_company_trips || false;
        
        console.log('✅ Form populated with user data');
        
        // Setup company role dependencies for edit form
        setupEditUserFormDependencies();
        
        // Show modal using the theme system (requires both display and show class)
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        console.log('✅ Modal should now be visible');
        
        // Setup form submission
        const form = document.getElementById('editUserForm');
        form.onsubmit = handleEditUserSubmit;
        
        // Setup modal backdrop click to close
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.onclick = hideEditUserModal;
        }
        
        // Setup ESC key to close modal
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                hideEditUserModal();
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
        
        // Focus on first input for better UX
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([type="hidden"])');
            if (firstInput) {
                firstInput.focus();
                firstInput.select();
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Error showing edit user modal:', error);
        showToast('Error opening edit modal: ' + error.message, 'error');
    }
}

function hideEditUserModal() {
    console.log('🔧 hideEditUserModal called');
    
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Clear form data for security
        const form = document.getElementById('editUserForm');
        if (form) {
            form.reset();
        }
        
        console.log('✅ Modal hidden and form cleared');
    }
}

async function populateEditUserCompanyDropdown() {
    try {
        const companySelect = document.getElementById('editUserCompany');
        if (!companySelect) return;
        
        // Clear existing options except the first one
        companySelect.innerHTML = '<option value="">Select a company</option>';
        
        // Get companies data
        const companies = companiesData || await loadCompanies() || [];
        
        // Add company options
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.fantasy_name || company.full_name || company.name;
            companySelect.appendChild(option);
        });
        
        console.log('✅ Company dropdown populated with', companies.length, 'companies');
    } catch (error) {
        console.error('❌ Error populating company dropdown:', error);
    }
}

function setupEditUserFormDependencies() {
    const companyRoleSelect = document.getElementById('editUserCompanyRole');
    const canSeeTripsCheckbox = document.getElementById('editCanSeeCompanyTrips');
    
    if (companyRoleSelect && canSeeTripsCheckbox) {
        companyRoleSelect.addEventListener('change', (e) => {
            const role = e.target.value;
            
            // Admins automatically get trip visibility
            if (role === 'admin') {
                canSeeTripsCheckbox.checked = true;
                canSeeTripsCheckbox.disabled = true;
            } else {
                canSeeTripsCheckbox.disabled = false;
            }
        });
    }
}

async function handleEditUserSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('editUserSubmitBtn');
    const spinner = submitBtn.querySelector('.fluent-spinner');
    const btnText = submitBtn.querySelector('.btn-text');
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.textContent = 'Updating...';
        
        // Collect form data
        const userId = document.getElementById('editUserId').value;
        const formData = {
            id: userId,
            name: document.getElementById('editUserName').value.trim(),
            email: document.getElementById('editUserEmail').value.trim(),
            company_id: document.getElementById('editUserCompany').value,
            company_role: document.getElementById('editUserCompanyRole').value,
            role: document.getElementById('editUserRole').value,
            can_see_company_trips: document.getElementById('editCanSeeCompanyTrips').checked
        };
        
        // Get company name for display
        const selectedCompany = companiesData.find(c => c.id == formData.company_id);
        if (selectedCompany) {
            formData.company_name = selectedCompany.fantasy_name || selectedCompany.full_name;
        }
        
        // Submit to real users API
        const response = await fetch('users-api.php', {
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
            // Refresh all data from backend
            await refreshAllData();
            
            showToast(`User "${result.user.name}" updated successfully!`, 'success');
            hideEditUserModal();
        } else {
            throw new Error(result.error || 'Failed to update user');
        }
        
    } catch (error) {
        console.error('Error updating user:', error);
        showToast('Failed to update user: ' + error.message, 'error');
        
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Update User';
    }
}

async function autoLinkUsersToCompanies() {
    try {
        showToast('Auto-linking users to companies...', 'info');
        
        // Fallback: Update mock data locally
        autoLinkUsersFallback();
        
    } catch (error) {
        console.error('Auto-link error:', error);
        showToast('Auto-link failed: ' + error.message, 'error');
    }
}

function autoLinkUsersFallback() {
    const users = getUsersFromDatabase();
    let linkedCount = 0;
    
    users.forEach(user => {
        if (user.company_id) return; // Skip already linked users
        
        const email = user.email?.toLowerCase() || '';
        let companyId = null;
        let companyRole = 'staff';
        let canSeeTrips = false;
        
        // Auto-link based on email domain
        if (email.includes('@wolthers.com') || user.role === 'admin') {
            const wolthersCompany = companiesData.find(c => c.full_name.includes('Wolthers'));
            if (wolthersCompany) {
                companyId = wolthersCompany.id;
                companyRole = user.role === 'admin' ? 'admin' : 'senior';
                canSeeTrips = true;
            }
        } else if (email.includes('@mitsui.com')) {
            const mitsuiCompany = companiesData.find(c => c.full_name.includes('Mitsui'));
            if (mitsuiCompany) {
                companyId = mitsuiCompany.id;
            }
        } else if (email.includes('@cce.com.co')) {
            const cceCompany = companiesData.find(c => c.full_name.includes('Colombian'));
            if (cceCompany) {
                companyId = cceCompany.id;
            }
        } else if (email.includes('@premiumroasters.com')) {
            const premiumCompany = companiesData.find(c => c.full_name.includes('Premium'));
            if (premiumCompany) {
                companyId = premiumCompany.id;
            }
        }
        
        if (companyId) {
            user.company_id = companyId;
            user.company_role = companyRole;
            user.can_see_company_trips = canSeeTrips;
            
            // Update company name for display
            const company = companiesData.find(c => c.id == companyId);
            if (company) {
                user.company_name = company.fantasy_name || company.full_name;
            }
            
            linkedCount++;
        }
    });
    
    // Save updated users
    window.USER_DATABASE = users;
    saveUserDatabase();
    
    // Refresh user list
    loadModalUsersList();
    
    showToast(`Auto-linked ${linkedCount} users to companies`, 'success');
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

function formatUserTimezone(dateString) {
    if (!dateString) return 'Never';
    
    try {
        const date = new Date(dateString);
        
        // Get user's timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Format with user's timezone
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
        console.warn('Error formatting date:', error);
        return new Date(dateString).toLocaleString();
    }
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
    
    // Fix any invalid timestamps automatically
    fixUserTimestamps();
    
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
    
    // Add sample users from different companies with new structure
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
            company_id: 3,
            company_name: "Colombian Coffee Exports S.A.",
            company_role: "admin",
            can_see_company_trips: true,
            status: "active"
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
            company_id: 3,
            company_name: "Colombian Coffee Exports S.A.",
            company_role: "staff",
            can_see_company_trips: false,
            status: "active"
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
            company_id: 4,
            company_name: "Premium Roasters International",
            company_role: "admin",
            can_see_company_trips: true,
            status: "active"
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
            company_id: 4,
            company_name: "Premium Roasters International",
            company_role: "senior",
            can_see_company_trips: true,
            status: "active"
        },
        // Mitsui users with hierarchy
        {
            id: "takeshi-yamamoto-mitsui",
            name: "Takeshi Yamamoto",
            email: "t.yamamoto@mitsui.co.jp",
            role: "user",
            avatar: "TY",
            memberSince: "2024-01-10",
            tripPermissions: ["brazil-coffee-origins-tour", "colombia-coffee-regions"],
            isCreator: false,
            lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            isWolthersTeam: false,
            company_id: 2,
            company_name: "Mitsui & Co. Ltd.",
            company_role: "admin",
            can_see_company_trips: true,
            status: "active"
        },
        {
            id: "hiroshi-sato-mitsui",
            name: "Hiroshi Sato",
            email: "h.sato@mitsui.co.jp",
            role: "user",
            avatar: "HS",
            memberSince: "2024-02-05",
            tripPermissions: ["brazil-coffee-origins-tour"],
            isCreator: false,
            lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            isWolthersTeam: false,
            company_id: 2,
            company_name: "Mitsui & Co. Ltd.",
            company_role: "staff",
            can_see_company_trips: false,
            status: "active"
        },
        // Personal users
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
            company_id: null,
            company_name: "Personal",
            company_role: "staff",
            can_see_company_trips: false,
            status: "active",
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
            company_id: null,
            company_name: "Personal",
            company_role: "staff",
            can_see_company_trips: false,
            status: "active"
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
    // Check if user has company_name from new structure
    if (user.company_name) {
        return user.company_name;
    }
    
    // Check if user has company_id and lookup in companiesData
    if (user.company_id && companiesData) {
        const company = companiesData.find(c => c.id == user.company_id);
        if (company) {
            return company.fantasy_name || company.full_name;
        }
    }
    
    // Legacy handling
    if (user.isWolthersTeam) {
        return 'Wolthers & Associates';
    }
    
    // Extract company from email domain as fallback
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
                aValue = (a.last_login_at || a.last_login) ? new Date(a.last_login_at || a.last_login) : new Date(0);
                bValue = (b.last_login_at || b.last_login) ? new Date(b.last_login_at || b.last_login) : new Date(0);
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
                <p><strong>Access URL:</strong> ${window.location.origin}/?code=${tripCodeData.code}</p>
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
🌐 Access URL: ${window.location.origin}/?code=${tripCodeData.code}

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
 * Update navigation visibility based on user role
 */
function updateNavigationVisibility(user) {
    if (!user) return;
    
    const role = user.role || 'employee';
    const isAdmin = role === 'admin';
    const isAdminOrDriver = isAdmin || role === 'driver';
    
    // Desktop navigation elements
    const adminSettings = document.getElementById('adminSettings');
    
    // Mobile navigation elements
    const mobileAccountsLink = document.getElementById('mobileAccountsLink');
    const mobileCompaniesLink = document.getElementById('mobileCompaniesLink');
    const mobileCarsLink = document.getElementById('mobileCarsLink');
    const mobileAdminLink = document.getElementById('mobileAdminLink');
    
    // Show/hide admin settings
    if (adminSettings) {
        adminSettings.style.display = isAdmin ? 'flex' : 'none';
    }
    
    // Update mobile navigation
    if (mobileAccountsLink) {
        mobileAccountsLink.style.display = isAdmin ? 'flex' : 'none';
    }
    
    if (mobileCompaniesLink) {
        mobileCompaniesLink.style.display = isAdmin ? 'flex' : 'none';
    }
    
    if (mobileCarsLink) {
        mobileCarsLink.style.display = isAdminOrDriver ? 'flex' : 'none';
    }
    
    if (mobileAdminLink) {
        mobileAdminLink.style.display = isAdmin ? 'flex' : 'none';
    }
    
    console.log(`Navigation updated for ${user.name} (${role}):`, {
        canAccessFleet: isAdminOrDriver,
        canAccessAdmin: isAdmin
    });
}

// ============================================================================
// 🏢 COMPANY MANAGEMENT SYSTEM
// ============================================================================

let companiesData = [];

/**
 * Show Add Company Modal
 */
function showAddCompanyModal() {
    console.log('Opening Add Company Modal...');
    const modal = document.getElementById('addCompanyModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setupAddCompanyForm();
    }
}

/**
 * Hide Add Company Modal
 */
function hideAddCompanyModal() {
    const modal = document.getElementById('addCompanyModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        clearCompanyForm();
    }
}

/**
 * Setup Add Company Form
 */
function setupAddCompanyForm() {
    const form = document.getElementById('addCompanyForm');
    if (form) {
        form.addEventListener('submit', handleAddCompanySubmit);
    }
    
    // Clear any existing errors
    clearCompanyFormErrors();
}

/**
 * Toggle Company Details Form Section
 */
function toggleCompanyDetailsForm() {
    const section = document.getElementById('companyDetailsSection');
    const button = document.getElementById('toggleCompanyDetails');
    const isExpanded = section.style.display !== 'none';
    
    if (isExpanded) {
        section.style.display = 'none';
        button.innerHTML = `
            <span>+ Add additional details (optional)</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="toggle-icon">
                <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z"/>
            </svg>
        `;
        button.classList.remove('expanded');
    } else {
        section.style.display = 'block';
        button.innerHTML = `
            <span>- Hide additional details</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="toggle-icon">
                <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z"/>
            </svg>
        `;
        button.classList.add('expanded');
    }
}

/**
 * Handle Add Company Form Submit
 */
async function handleAddCompanySubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('addCompanySubmitBtn');
    const spinner = submitBtn.querySelector('.fluent-spinner');
    const btnText = submitBtn.querySelector('.btn-text');
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.textContent = 'Adding Company...';
        
        // Collect form data
        const formData = collectCompanyFormData();
        
        // Validate data
        const validation = validateCompanyFormData(formData);
        if (!validation.isValid) {
            displayCompanyFormErrors(validation.errors);
            return;
        }
        
        // Clear previous errors
        clearCompanyFormErrors();
        
        // Submit to API
        const response = await fetch('https://trips.wolthers.com/companies-api.php', {
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
            // Refresh all data from backend
            await refreshAllData();
            
            // Select the newly created company
            const companySelect = document.getElementById('newUserCompany');
            if (companySelect) {
                companySelect.value = result.company.id;
            }
            
            showToast(`Company "${result.company.full_name}" created successfully!`, 'success');
            hideAddCompanyModal();
            
        } else {
            throw new Error(result.error || 'Failed to create company');
        }
        
    } catch (error) {
        console.error('Error creating company:', error);
        showToast('Failed to create company: ' + error.message, 'error');
        
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Add Company';
    }
}

/**
 * Collect Company Form Data
 */
function collectCompanyFormData() {
    return {
        full_name: document.getElementById('companyFullName')?.value?.trim() || '',
        fantasy_name: document.getElementById('companyFantasyName')?.value?.trim() || '',
        company_type: document.getElementById('companyType').value,
        service_provider_subtype: document.getElementById('serviceProviderSubtype')?.value || '',
        address: document.getElementById('companyAddress')?.value?.trim() || '',
        city: document.getElementById('companyCity')?.value?.trim() || '',
        state: document.getElementById('companyState')?.value?.trim() || '',
        country: document.getElementById('companyCountry')?.value?.trim() || '',
        postal_code: document.getElementById('companyPostalCode')?.value?.trim() || '',
        phone: document.getElementById('companyPhone')?.value?.trim() || '',
        email: document.getElementById('companyEmail')?.value?.trim() || '',
        registration_number: document.getElementById('companyRegistrationNumber')?.value?.trim() || '',
        tax_id: document.getElementById('companyTaxId')?.value?.trim() || '',
        status: 'active'
    };
}

/**
 * Validate Company Form Data
 */
function validateCompanyFormData(formData) {
    const errors = {};
    
    // Required fields
    if (!formData.full_name) {
        errors.full_name = 'Legal company name is required';
    } else if (formData.full_name.length < 2) {
        errors.full_name = 'Company name must be at least 2 characters';
    }
    
    if (!formData.company_type) {
        errors.company_type = 'Company type is required';
    }
    
    // Optional email validation
    if (formData.email && !validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
    };
}

/**
 * Display Company Form Errors
 */
function displayCompanyFormErrors(errors) {
    // Clear previous errors
    clearCompanyFormErrors();
    
    Object.keys(errors).forEach(fieldName => {
        const field = document.getElementById(`company${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);
        const errorElement = document.createElement('span');
        errorElement.className = 'fluent-error-message';
        errorElement.textContent = errors[fieldName];
        
        if (field) {
            field.classList.add('error');
            field.parentNode.appendChild(errorElement);
        }
    });
}

/**
 * Clear Company Form Errors
 */
function clearCompanyFormErrors() {
    const form = document.getElementById('addCompanyForm');
    if (form) {
        // Remove error classes
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        
        // Remove error messages
        form.querySelectorAll('.fluent-error-message').forEach(el => el.remove());
    }
}

/**
 * Clear Company Form
 */
function clearCompanyForm() {
    const form = document.getElementById('addCompanyForm');
    if (form) {
        form.reset();
        clearCompanyFormErrors();
        
        // Reset expanded state
        const section = document.getElementById('companyDetailsSection');
        const button = document.getElementById('toggleCompanyDetails');
        if (section && button) {
            section.style.display = 'none';
            button.classList.remove('expanded');
            button.innerHTML = `
                <span>+ Add additional details (optional)</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="toggle-icon">
                    <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z"/>
                </svg>
            `;
        }
    }
}

/**
 * Load Companies for Dropdown
 */
async function loadCompanies() {
    try {
        const response = await fetch('https://trips.wolthers.com/companies-api.php?status=active&limit=100');
        const result = await response.json();
        
        if (result.companies) {
            companiesData = result.companies;
            updateCompanyDropdown();
        } else {
            console.error('Failed to load companies:', result.error);
            // Initialize with mock data for development
            companiesData = getDefaultCompanies();
            updateCompanyDropdown();
        }
        
    } catch (error) {
        console.error('Error loading companies:', error);
        // Initialize with mock data for development
        companiesData = getDefaultCompanies();
        updateCompanyDropdown();
    }
}

/**
 * Update Company Dropdown
 */
function updateCompanyDropdown() {
    const companySelects = [
        document.getElementById('newUserCompany'),
        document.getElementById('editUserCompany'),
        document.getElementById('userCompanyFilter')
    ];
    
    companySelects.forEach(companySelect => {
        if (companySelect && companiesData) {
            // Store current value
            const currentValue = companySelect.value;
            
            // Clear existing options except the first one
            const isFilter = companySelect.id === 'userCompanyFilter';
            companySelect.innerHTML = isFilter ? 
                '<option value="">All companies</option>' : 
                '<option value="">Select a company</option>';
            
            // Add companies (show fantasy name preferentially)
            companiesData.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.fantasy_name || company.full_name;
                option.setAttribute('data-type', company.company_type);
                option.setAttribute('data-full-name', company.full_name);
                companySelect.appendChild(option);
            });
            
            // Restore previous value
            if (currentValue) {
                companySelect.value = currentValue;
            }
        }
    });
}

/**
 * Get Default Companies (Mock Data)
 */
function getDefaultCompanies() {
    return [
        {
            id: 1,
            full_name: 'Wolthers & Associates Ltd.',
            fantasy_name: 'W & A',
            company_type: 'consultant',
            address: 'Rua XV de Novembro, 96',
            city: 'Santos',
            state: 'SP',
            country: 'Brazil',
            postal_code: '11010-151',
            registration_number: '62.298.006/0001-91',
            status: 'active'
        },
        {
            id: 2,
            full_name: 'Mitsui & Co. Ltd.',
            fantasy_name: 'Mitsui Coffee',
            company_type: 'importer',
            city: 'Tokyo',
            state: 'Tokyo',
            country: 'Japan',
            status: 'active'
        },
        {
            id: 3,
            full_name: 'Colombian Coffee Exports S.A.',
            fantasy_name: 'ColCoffee',
            company_type: 'exporter',
            city: 'Bogotá',
            state: 'Cundinamarca',
            country: 'Colombia',
            status: 'active'
        },
        {
            id: 4,
            full_name: 'Premium Roasters International',
            fantasy_name: 'Premium Roasters',
            company_type: 'roaster',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            status: 'active'
        }
    ];
}

/**
 * Enhanced User Management with Company Integration
 */

/**
 * Enhanced Setup Add User Form with Company Integration
 */
function setupEnhancedAddUserForm() {
    const form = document.getElementById('addUserForm');
    if (form) {
        form.addEventListener('submit', handleEnhancedAddUserSubmit);
        
        // Load companies
        loadCompanies();
        
        // Setup company role dependencies
        setupCompanyRoleDependencies();
    }
}

/**
 * Setup Company Role Dependencies
 */
function setupCompanyRoleDependencies() {
    const companyRoleSelect = document.getElementById('newUserCompanyRole');
    const canSeeTripsCheckbox = document.getElementById('canSeeCompanyTrips');
    
    if (companyRoleSelect && canSeeTripsCheckbox) {
        companyRoleSelect.addEventListener('change', (e) => {
            const role = e.target.value;
            
            // Admins automatically get trip visibility
            if (role === 'admin') {
                canSeeTripsCheckbox.checked = true;
                canSeeTripsCheckbox.disabled = true;
            } else {
                canSeeTripsCheckbox.disabled = false;
            }
        });
    }
}

/**
 * Enhanced Handle Add User Submit with Company Data
 */
async function handleEnhancedAddUserSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('addUserSubmitBtn');
    const spinner = submitBtn.querySelector('.fluent-spinner');
    const btnText = submitBtn.querySelector('.btn-text');
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.textContent = 'Adding User...';
        
        // Collect enhanced form data
        const formData = collectEnhancedUserFormData();
        
        // Validate data
        const validation = validateEnhancedUserFormData(formData);
        if (!validation.isValid) {
            displayUserFormErrors(validation.errors);
            return;
        }
        
        // Clear previous errors
        clearFormErrors();
        
        // Submit to real users API
        const response = await fetch('users-api.php', {
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
            // Refresh all data from backend
            await refreshAllData();
            
            showToast(`User "${result.user.name}" created successfully!`, 'success');
            hideAddUserModal();
        } else {
            throw new Error(result.error || 'Failed to create user');
        }
        
    } catch (error) {
        console.error('Error adding user:', error);
        showToast('Failed to add user: ' + error.message, 'error');
        
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Add person';
    }
}

/**
 * Collect Enhanced User Form Data
 */
function collectEnhancedUserFormData() {
    const companyId = document.getElementById('newUserCompany')?.value;
    const selectedCompany = companiesData.find(c => c.id == companyId);
    
    return {
        name: document.getElementById('newUserName')?.value?.trim() || '',
        email: document.getElementById('newUserEmail')?.value?.trim() || '',
        company_id: companyId || null,
        company_name: selectedCompany?.full_name || selectedCompany?.fantasy_name || '',
        company_role: document.getElementById('newUserCompanyRole')?.value || 'staff',
        role: document.getElementById('newUserRole')?.value || 'user',
        can_see_company_trips: document.getElementById('canSeeCompanyTrips')?.checked || false,
        status: 'active',
        memberSince: new Date().toISOString().split('T')[0],
        lastLogin: null,
        tripCount: 0,
        upcomingTrip: null
    };
}

/**
 * Validate Enhanced User Form Data
 */
function validateEnhancedUserFormData(formData) {
    const errors = {};
    
    // Required fields
    if (!formData.name) {
        errors.name = 'Full name is required';
    }
    
    if (!formData.email) {
        errors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.company_id) {
        errors.company = 'Company selection is required';
    }
    
    if (!formData.company_role) {
        errors.company_role = 'Company role is required';
    }
    
    if (!formData.role) {
        errors.role = 'System role is required';
    }
    
    // Check for duplicate email
    const users = getUsersFromDatabase();
    if (users.some(user => user.email.toLowerCase() === formData.email.toLowerCase())) {
        errors.email = 'User with this email already exists';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
    };
}

/**
 * Helper function to validate URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// ============================================================================
// 🚗 FLEET MANAGEMENT SYSTEM
// ============================================================================

let fleetData = [];
let filteredFleetData = [];

/**
 * Show Fleet Management Modal
 */
function showFleetManagementModal() {
    console.log('Opening Fleet Management Modal...');
    
    const modal = document.getElementById('fleetManagementModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        loadFleetManagementData();
    }
}

/**
 * Hide Fleet Management Modal
 */
function hideFleetManagementModal() {
    const modal = document.getElementById('fleetManagementModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200); // Allow transition to complete
        document.body.style.overflow = 'auto';
    }
}

/**
 * Show Vehicle Management Modal (Legacy compatibility)
 */
function showVehicleManagementModal() {
    showFleetManagementModal();
}

/**
 * Hide Vehicle Management Modal (Legacy compatibility)
 */
function hideVehicleManagementModal() {
    hideFleetManagementModal();
}

/**
 * Load Fleet Management Data
 */
async function loadFleetManagementData() {
    try {
        console.log('Loading fleet data from database...');
        
        // Show loading state
        const tableBody = document.getElementById('fleetTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">Loading fleet data...</td></tr>';
        }
        
        // Load vehicles from API with trip information
        const response = await fetch('api/vehicles/manage.php?include_trips=true&include_maintenance=true');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            fleetData = data.vehicles;
            
            // Apply filtering to exclude retired/sold vehicles by default
            filterFleetData();
            updateFleetSummary(data.summary);
            setupFleetInteractions();
            
            console.log(`Loaded ${fleetData.length} vehicles from database`);
        } else {
            throw new Error(data.error || 'Failed to load fleet data');
        }
        
    } catch (error) {
        console.error('Error loading fleet data:', error);
        
        const tableBody = document.getElementById('fleetTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: #f44336;">
                        <strong>Failed to load fleet data</strong><br>
                        <small>${error.message}</small><br>
                        <button onclick="loadFleetManagementData()" style="margin-top: 10px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Retry
                        </button>
                    </td>
                </tr>
            `;
        }
        
                 showToast('Failed to load fleet data: ' + error.message, 'error');
    }
}

/**
 * Display Fleet Data in Table
 */
function displayFleetData(vehicles) {
    const tableBody = document.getElementById('fleetTableBody');
    
    if (!tableBody) {
        console.error('Fleet table body not found!');
        return;
    }
    
    if (!vehicles || vehicles.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <h3 style="margin-bottom: 10px;">No vehicles found</h3>
                    <p style="margin-bottom: 20px;">Try adjusting your search or filters, or add a new vehicle to get started.</p>
                    <button onclick="showAddVehicleModal()" style="padding: 10px 20px; background: #DAA520; color: #000; border: none; border-radius: 6px; cursor: pointer;">
                        + Add Your First Vehicle
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = vehicles.map(vehicle => createFleetTableRow(vehicle)).join('');
}

/**
 * Create Fleet Table Row
 */
function createFleetTableRow(vehicle) {
    // Format vehicle name with details
    const vehicleName = `${vehicle.make} ${vehicle.model}`;
    const vehicleYear = vehicle.year || 'N/A';
    const vehicleCapacity = vehicle.capacity ? `${vehicle.capacity} people` : 'N/A';
    
    // Format license plate
    const licensePlate = vehicle.license_plate || 'N/A';
    
    // Format mileage
    const mileage = vehicle.current_mileage ? `${parseInt(vehicle.current_mileage).toLocaleString()} km` : 'N/A';
    
    // Get status with proper styling
    const status = vehicle.status || 'unknown';
    const statusClass = getFleetStatusClass(status);
    const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
    
    // Get insurance status
    const insuranceStatus = getInsuranceStatus(vehicle);
    const insuranceClass = getInsuranceStatusClass(insuranceStatus);
    
    // Get revision status
    const revisionStatus = getRevisionStatus(vehicle);
    const revisionClass = getRevisionStatusClass(revisionStatus);
    
    // Get trip information
    const lastTrip = formatLastTripInfo(vehicle.last_trip);
    const nextTrip = formatNextTripInfo(vehicle.next_trip);
    
    return `
        <tr>
            <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="font-weight: 600; color: var(--text-primary);">${vehicleName}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">${vehicleYear}</div>
                    <div style="font-size: 12px; color: var(--text-tertiary); font-style: italic;">${vehicleCapacity}</div>
                </div>
            </td>
            <td>
                <span style="font-family: 'Courier New', monospace; font-weight: bold; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; color: var(--text-primary);">
                    ${licensePlate}
                </span>
            </td>
            <td>
                <span style="font-family: 'Courier New', monospace; font-weight: 500; color: var(--text-primary);">
                    ${mileage}
                </span>
            </td>
            <td>
                <span class="fluent-badge ${statusClass}">${statusDisplay}</span>
            </td>
            <td>
                <span class="fluent-badge ${insuranceClass}">${insuranceStatus}</span>
            </td>
            <td>
                <span class="fluent-badge ${revisionClass}">${revisionStatus}</span>
            </td>
            <td>
                <span style="color: var(--text-secondary); font-size: 13px; ${lastTrip === 'None' ? 'font-style: italic;' : ''}">${lastTrip}</span>
            </td>
            <td>
                <span style="color: var(--text-secondary); font-size: 13px; ${nextTrip.includes('None') ? 'font-style: italic;' : ''}">${nextTrip}</span>
            </td>
            <td>
                <div class="fluent-action-buttons">
                    <button onclick="editFleetVehicle(${vehicle.id})" title="Edit Vehicle" class="fluent-action-btn fluent-action-edit">
                        ✏️
                    </button>
                    <button onclick="deleteFleetVehicle(${vehicle.id})" title="Delete Vehicle" class="fluent-action-btn fluent-action-delete">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Get Fleet Status CSS Class
 */
function getFleetStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'available': return 'fluent-badge-success';
        case 'maintenance': return 'fluent-badge-warning';
        case 'retired': return 'fluent-badge-secondary';
        case 'sold': return 'fluent-badge-error';
        default: return 'fluent-badge-secondary';
    }
}

/**
 * Get Insurance Status
 */
function getInsuranceStatus(vehicle) {
    if (!vehicle.insurance_end_date) return 'Unknown';
    
    const endDate = new Date(vehicle.insurance_end_date);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining < 30) return `${daysRemaining}d`;
    return 'Active';
}

/**
 * Get Insurance Status CSS Class
 */
function getInsuranceStatusClass(status) {
    if (status === 'Expired') return 'fluent-badge-error';
    if (status.includes('d')) return 'fluent-badge-warning';
    if (status === 'Active') return 'fluent-badge-success';
    return 'fluent-badge-secondary';
}

/**
 * Get Revision Status
 */
function getRevisionStatus(vehicle) {
    if (!vehicle.next_revision_due) return 'Unknown';
    
    const dueDate = new Date(vehicle.next_revision_due);
    const today = new Date();
    const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'Overdue';
    if (daysRemaining < 30) return `${daysRemaining}d`;
    return 'Current';
}

/**
 * Get Revision Status CSS Class
 */
function getRevisionStatusClass(status) {
    if (status === 'Overdue') return 'fluent-badge-error';
    if (status.includes('d')) return 'fluent-badge-warning';
    if (status === 'Current') return 'fluent-badge-success';
    return 'fluent-badge-secondary';
}

/**
 * Format Last Trip Information
 */
function formatLastTripInfo(lastTrip) {
    if (!lastTrip || !lastTrip.title) return 'None';
    return lastTrip.title;
}

/**
 * Format Next Trip Information
 */
function formatNextTripInfo(nextTrip) {
    if (!nextTrip || !nextTrip.title) return 'None Scheduled';
    return nextTrip.title;
}

/**
 * Update Fleet Summary
 */
function updateFleetSummary(summary) {
    if (!summary) return;
    
    // Calculate active fleet totals (excluding retired vehicles)
    const activeTotal = (summary.available || 0) + (summary.maintenance || 0);
    
    document.getElementById('fleetTotalVehicles').textContent = activeTotal;
    document.getElementById('fleetAvailableVehicles').textContent = summary.available || 0;
    document.getElementById('fleetMaintenanceVehicles').textContent = summary.maintenance || 0;
    document.getElementById('fleetRetiredVehicles').textContent = summary.retired || 0;
}

/**
 * Setup Fleet Interactions
 */
function setupFleetInteractions() {
    // Search functionality
    const searchInput = document.getElementById('fleetSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterFleetData, 300));
    }
    
    // Filter functionality
    const statusFilter = document.getElementById('fleetStatusFilter');
    const typeFilter = document.getElementById('fleetTypeFilter');
    
    if (statusFilter) statusFilter.addEventListener('change', filterFleetData);
    if (typeFilter) typeFilter.addEventListener('change', filterFleetData);
}

/**
 * Filter Fleet Data
 */
function filterFleetData() {
    const searchTerm = document.getElementById('fleetSearchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('fleetStatusFilter')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('fleetTypeFilter')?.value.toLowerCase() || '';
    
    filteredFleetData = fleetData.filter(vehicle => {
        // Hide retired/sold vehicles by default unless specifically filtering for them
        const isRetired = vehicle.status && vehicle.status.toLowerCase() === 'retired';
        const isSold = vehicle.status && vehicle.status.toLowerCase() === 'sold';
        
        if ((isRetired && statusFilter !== 'retired') || (isSold && statusFilter !== 'sold')) {
            return false;
        }
        
        // Search filter
        const matchesSearch = !searchTerm || 
            `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm) ||
            (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(searchTerm)) ||
            (vehicle.year && vehicle.year.toString().includes(searchTerm));
        
        // Status filter
        const matchesStatus = !statusFilter || 
            (vehicle.status && vehicle.status.toLowerCase() === statusFilter);
        
        // Type filter
        const matchesType = !typeFilter || 
            (vehicle.vehicle_type && vehicle.vehicle_type.toLowerCase() === typeFilter);
        
        return matchesSearch && matchesStatus && matchesType;
    });
    
    displayFleetData(filteredFleetData);
    console.log(`Filtered to ${filteredFleetData.length} vehicles`);
}

/**
 * Show Add Vehicle Modal
 */
function showAddVehicleModal() {
    console.log('Opening Add Vehicle Modal...');
    
    const modal = document.getElementById('addVehicleModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Reset form
        document.getElementById('addVehicleForm').reset();
        clearVehicleFormErrors();
        
        // Set default values
        document.getElementById('vehicleStatus').value = 'available';
        
        // Set up form submission
        setupAddVehicleForm();
    }
}

/**
 * Hide Add Vehicle Modal
 */
function hideAddVehicleModal() {
    const modal = document.getElementById('addVehicleModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        clearVehicleFormErrors();
    }
}

/**
 * Setup Add Vehicle Form
 */
function setupAddVehicleForm() {
    const form = document.getElementById('addVehicleForm');
    const submitBtn = document.getElementById('addVehicleSubmitBtn');
    
    // Remove existing event listeners
    form.removeEventListener('submit', handleAddVehicleSubmit);
    
    // Add new event listener
    form.addEventListener('submit', handleAddVehicleSubmit);
    
    // Auto-uppercase license plate
    const licenseInput = document.getElementById('vehicleLicense');
    licenseInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
    
    // Auto-calculate next revision date when last revision date or interval changes
    const lastRevisionInput = document.getElementById('lastRevisionDate');
    const intervalSelect = document.getElementById('revisionInterval');
    
    function updateNextRevisionDate() {
        const lastDate = lastRevisionInput.value;
        const interval = parseInt(intervalSelect.value);
        
        if (lastDate && interval) {
            const lastRevisionDate = new Date(lastDate);
            const nextRevisionDate = new Date(lastRevisionDate);
            nextRevisionDate.setMonth(nextRevisionDate.getMonth() + interval);
            
            console.log(`Next revision calculated: ${nextRevisionDate.toISOString().split('T')[0]}`);
        }
    }
    
    lastRevisionInput.addEventListener('change', updateNextRevisionDate);
    intervalSelect.addEventListener('change', updateNextRevisionDate);
}

/**
 * Handle Add Vehicle Form Submission
 */
async function handleAddVehicleSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('addVehicleSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.fluent-spinner');
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Adding Vehicle...';
        spinner.style.display = 'inline-block';
        
        // Collect form data
        const formData = collectVehicleFormData();
        
        // Validate form data
        const validationErrors = validateVehicleFormData(formData);
        if (validationErrors.length > 0) {
            displayVehicleFormErrors(validationErrors);
            throw new Error('Please fix the validation errors');
        }
        
        // Clear any existing errors
        clearVehicleFormErrors();
        
        // Submit to API
        const response = await fetch('api/vehicles/manage.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Vehicle ${formData.make} ${formData.model} added successfully!`, 'success');
            hideAddVehicleModal();
            
            // Reload fleet data to show the new vehicle
            loadFleetManagementData();
        } else {
            throw new Error(data.error || 'Failed to add vehicle');
        }
        
    } catch (error) {
        console.error('Error adding vehicle:', error);
        showToast('Failed to add vehicle: ' + error.message, 'error');
    } finally {
        // Reset loading state
        submitBtn.disabled = false;
        btnText.textContent = 'Add Vehicle';
        spinner.style.display = 'none';
    }
}

/**
 * Collect Vehicle Form Data
 */
function collectVehicleFormData() {
    const formData = {
        make: document.getElementById('vehicleMake').value.trim(),
        model: document.getElementById('vehicleModel').value.trim(),
        year: parseInt(document.getElementById('vehicleYear').value),
        vehicle_type: document.getElementById('vehicleType').value,
        license_plate: document.getElementById('vehicleLicense').value.trim().toUpperCase(),
        capacity: document.getElementById('vehicleCapacity').value ? parseInt(document.getElementById('vehicleCapacity').value) : null,
        color: document.getElementById('vehicleColor').value.trim() || null,
        fuel_type: document.getElementById('vehicleFuelType').value || null,
        current_mileage: document.getElementById('vehicleMileage').value ? parseInt(document.getElementById('vehicleMileage').value) : 0,
        location: document.getElementById('vehicleLocation').value.trim() || null,
        insurance_company: document.getElementById('insuranceCompany').value.trim() || null,
        insurance_end_date: document.getElementById('insuranceEndDate').value || null,
        last_revision_date: document.getElementById('lastRevisionDate').value || null,
        revision_interval_months: document.getElementById('revisionInterval').value ? parseInt(document.getElementById('revisionInterval').value) : null,
        status: document.getElementById('vehicleStatus').value || 'available',
        notes: document.getElementById('vehicleNotes').value.trim() || null
    };
    
    // Calculate next revision date if we have last revision date and interval
    if (formData.last_revision_date && formData.revision_interval_months) {
        const lastDate = new Date(formData.last_revision_date);
        const nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + formData.revision_interval_months);
        formData.next_revision_due = nextDate.toISOString().split('T')[0];
    }
    
    return formData;
}

/**
 * Validate Vehicle Form Data
 */
function validateVehicleFormData(formData) {
    const errors = [];
    
    // Required fields
    if (!formData.make) errors.push({ field: 'vehicleMake', message: 'Make is required' });
    if (!formData.model) errors.push({ field: 'vehicleModel', message: 'Model is required' });
    if (!formData.year || formData.year < 1990 || formData.year > 2030) {
        errors.push({ field: 'vehicleYear', message: 'Please enter a valid year between 1990 and 2030' });
    }
    if (!formData.vehicle_type) errors.push({ field: 'vehicleType', message: 'Vehicle type is required' });
    if (!formData.license_plate) errors.push({ field: 'vehicleLicense', message: 'License plate is required' });
    
    // License plate format validation (basic)
    if (formData.license_plate && formData.license_plate.length < 3) {
        errors.push({ field: 'vehicleLicense', message: 'License plate must be at least 3 characters' });
    }
    
    // Capacity validation
    if (formData.capacity !== null && (formData.capacity < 1 || formData.capacity > 50)) {
        errors.push({ field: 'vehicleCapacity', message: 'Capacity must be between 1 and 50' });
    }
    
    // Mileage validation
    if (formData.current_mileage < 0) {
        errors.push({ field: 'vehicleMileage', message: 'Mileage cannot be negative' });
    }
    
    // Date validations
    if (formData.insurance_end_date) {
        const insuranceDate = new Date(formData.insurance_end_date);
        if (insuranceDate < new Date()) {
            errors.push({ field: 'insuranceEndDate', message: 'Insurance expiry date should be in the future' });
        }
    }
    
    return errors;
}

/**
 * Display Vehicle Form Errors
 */
function displayVehicleFormErrors(errors) {
    // Clear existing errors first
    clearVehicleFormErrors();
    
    errors.forEach(error => {
        const field = document.getElementById(error.field);
        if (field) {
            field.classList.add('fluent-input-error');
            
            // Create error message element
            const errorElement = document.createElement('div');
            errorElement.className = 'fluent-error-message';
            errorElement.textContent = error.message;
            
            // Insert error message after the field
            field.parentNode.appendChild(errorElement);
        }
    });
    
    // Show first error field
    if (errors.length > 0) {
        const firstErrorField = document.getElementById(errors[0].field);
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

/**
 * Clear Vehicle Form Errors
 */
function clearVehicleFormErrors() {
    // Remove error classes from inputs
    document.querySelectorAll('#addVehicleForm .fluent-input-error').forEach(field => {
        field.classList.remove('fluent-input-error');
    });
    
    // Remove error messages
    document.querySelectorAll('#addVehicleForm .fluent-error-message').forEach(errorMsg => {
        errorMsg.remove();
    });
}

/**
 * Edit Fleet Vehicle
 */
function editFleetVehicle(vehicleId) {
    const vehicle = fleetData.find(v => v.id === vehicleId);
    if (!vehicle) {
        console.error('Vehicle not found:', vehicleId);
        return;
    }
    
    console.log('Editing vehicle:', vehicle);
    showEditVehicleModal(vehicle);
}

/**
 * Show Edit Vehicle Modal
 */
function showEditVehicleModal(vehicle) {
    const modal = document.getElementById('editVehicleModal');
    if (modal && vehicle) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Store vehicle ID for submission
        modal.dataset.vehicleId = vehicle.id;
        
        // Populate form with vehicle data
        populateEditVehicleForm(vehicle);
        
        // Clear any previous errors
        clearEditVehicleFormErrors();
        
        // Set up form submission and interactions
        setupEditVehicleForm();
    }
}

/**
 * Hide Edit Vehicle Modal
 */
function hideEditVehicleModal() {
    const modal = document.getElementById('editVehicleModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear form data
        document.getElementById('editVehicleForm').reset();
        clearEditVehicleFormErrors();
        
        // Remove stored vehicle ID
        delete modal.dataset.vehicleId;
    }
}

/**
 * Populate Edit Vehicle Form with existing data
 */
function populateEditVehicleForm(vehicle) {
    // Basic information
    document.getElementById('editVehicleMake').value = vehicle.make || '';
    document.getElementById('editVehicleModel').value = vehicle.model || '';
    document.getElementById('editVehicleYear').value = vehicle.year || '';
    document.getElementById('editVehicleType').value = vehicle.vehicle_type || '';
    document.getElementById('editLicensePlate').value = vehicle.license_plate || '';
    
    // Vehicle details
    document.getElementById('editVehicleCapacity').value = vehicle.capacity || '';
    document.getElementById('editVehicleColor').value = vehicle.color || '';
    document.getElementById('editFuelType').value = vehicle.fuel_type || 'gasoline';
    document.getElementById('editVehicleLocation').value = vehicle.location || '';
    document.getElementById('editCurrentMileage').value = vehicle.current_mileage || '';
    
    // Insurance information
    document.getElementById('editInsuranceCompany').value = vehicle.insurance_company || '';
    document.getElementById('editInsuranceExpiry').value = vehicle.insurance_expiry_date || '';
    
    // Maintenance information
    document.getElementById('editLastRevision').value = vehicle.last_revision_date || '';
    document.getElementById('editRevisionInterval').value = vehicle.revision_interval_months || '6';
    document.getElementById('editNextRevision').value = vehicle.next_revision_due || '';
    
    // Status and notes
    document.getElementById('editVehicleStatus').value = vehicle.status || 'available';
    document.getElementById('editVehicleNotes').value = vehicle.notes || '';
}

/**
 * Setup Edit Vehicle Form interactions
 */
function setupEditVehicleForm() {
    // Auto-calculate next revision date when last revision or interval changes
    const updateEditNextRevisionDate = () => {
        const lastRevisionInput = document.getElementById('editLastRevision');
        const intervalInput = document.getElementById('editRevisionInterval');
        const nextRevisionInput = document.getElementById('editNextRevision');
        
        if (lastRevisionInput.value && intervalInput.value) {
            const lastRevision = new Date(lastRevisionInput.value);
            const intervalMonths = parseInt(intervalInput.value);
            const nextRevision = new Date(lastRevision);
            nextRevision.setMonth(nextRevision.getMonth() + intervalMonths);
            
            nextRevisionInput.value = nextRevision.toISOString().split('T')[0];
        } else {
            nextRevisionInput.value = '';
        }
    };
    
    // Add event listeners for auto-calculation
    document.getElementById('editLastRevision').addEventListener('change', updateEditNextRevisionDate);
    document.getElementById('editRevisionInterval').addEventListener('change', updateEditNextRevisionDate);
    
    // Auto-uppercase license plate
    document.getElementById('editLicensePlate').addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
    
    // Clear errors on input
    const formInputs = document.querySelectorAll('#editVehicleForm .fluent-input');
    formInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('fluent-input-error');
            const errorElement = document.getElementById(this.id.replace('edit', 'edit') + 'Error');
            if (errorElement) {
                errorElement.textContent = '';
            }
        });
    });
}

/**
 * Handle Edit Vehicle Form Submission
 */
async function handleEditVehicleSubmit(event) {
    event.preventDefault();
    
    const modal = document.getElementById('editVehicleModal');
    const vehicleId = modal.dataset.vehicleId;
    
    if (!vehicleId) {
        showToast('Vehicle ID not found', 'error');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px; animation: spin 1s linear infinite;">
                <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z"/>
                <path d="M8 4a4 4 0 0 1 4 4h1a5 5 0 0 0-5-5v1z"/>
            </svg>
            Updating...
        `;
        
        // Collect and validate form data
        const formData = collectEditVehicleFormData();
        const validationErrors = validateEditVehicleFormData(formData);
        
        if (validationErrors.length > 0) {
            displayEditVehicleFormErrors(validationErrors);
            return;
        }
        
        // Clear any existing errors
        clearEditVehicleFormErrors();
        
        // Submit to API
        const response = await fetch(`api/vehicles/manage.php?id=${vehicleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Vehicle ${formData.make} ${formData.model} updated successfully!`, 'success');
            hideEditVehicleModal();
            loadFleetManagementData(); // Reload the fleet data
        } else {
            throw new Error(data.error || 'Failed to update vehicle');
        }
        
    } catch (error) {
        console.error('Error updating vehicle:', error);
        showToast('Failed to update vehicle: ' + error.message, 'error');
        
        // Handle validation errors from server
        if (error.message.includes('License plate already exists')) {
            displayEditVehicleFormErrors([{
                field: 'license_plate',
                message: 'This license plate is already registered to another vehicle'
            }]);
        }
    } finally {
        // Restore button state
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
            </svg>
            Update Vehicle
        `;
    }
}

/**
 * Collect Edit Vehicle Form Data
 */
function collectEditVehicleFormData() {
    const formData = {
        make: document.getElementById('editVehicleMake').value.trim(),
        model: document.getElementById('editVehicleModel').value.trim(),
        year: parseInt(document.getElementById('editVehicleYear').value),
        vehicle_type: document.getElementById('editVehicleType').value,
        license_plate: document.getElementById('editLicensePlate').value.trim().toUpperCase(),
        capacity: document.getElementById('editVehicleCapacity').value ? parseInt(document.getElementById('editVehicleCapacity').value) : null,
        color: document.getElementById('editVehicleColor').value.trim(),
        fuel_type: document.getElementById('editFuelType').value,
        location: document.getElementById('editVehicleLocation').value.trim(),
        current_mileage: document.getElementById('editCurrentMileage').value ? parseInt(document.getElementById('editCurrentMileage').value) : null,
        insurance_company: document.getElementById('editInsuranceCompany').value.trim(),
        insurance_expiry_date: document.getElementById('editInsuranceExpiry').value || null,
        last_revision_date: document.getElementById('editLastRevision').value || null,
        revision_interval_months: parseInt(document.getElementById('editRevisionInterval').value),
        next_revision_due: document.getElementById('editNextRevision').value || null,
        status: document.getElementById('editVehicleStatus').value,
        notes: document.getElementById('editVehicleNotes').value.trim()
    };
    
    // Remove empty strings and convert to null
    Object.keys(formData).forEach(key => {
        if (formData[key] === '') {
            formData[key] = null;
        }
    });
    
    return formData;
}

/**
 * Validate Edit Vehicle Form Data
 */
function validateEditVehicleFormData(formData) {
    const errors = [];
    
    // Required fields validation
    if (!formData.make) {
        errors.push({ field: 'make', message: 'Make is required' });
    }
    
    if (!formData.model) {
        errors.push({ field: 'model', message: 'Model is required' });
    }
    
    if (!formData.year) {
        errors.push({ field: 'year', message: 'Year is required' });
    } else if (formData.year < 1990 || formData.year > 2030) {
        errors.push({ field: 'year', message: 'Year must be between 1990 and 2030' });
    }
    
    if (!formData.vehicle_type) {
        errors.push({ field: 'vehicle_type', message: 'Vehicle type is required' });
    }
    
    if (!formData.license_plate) {
        errors.push({ field: 'license_plate', message: 'License plate is required' });
    } else if (formData.license_plate.length < 3) {
        errors.push({ field: 'license_plate', message: 'License plate must be at least 3 characters' });
    }
    
    // Optional field validation
    if (formData.capacity && (formData.capacity < 1 || formData.capacity > 20)) {
        errors.push({ field: 'capacity', message: 'Capacity must be between 1 and 20' });
    }
    
    if (formData.current_mileage && formData.current_mileage < 0) {
        errors.push({ field: 'current_mileage', message: 'Mileage cannot be negative' });
    }
    
    // Date validation
    if (formData.insurance_expiry_date) {
        const expiryDate = new Date(formData.insurance_expiry_date);
        if (isNaN(expiryDate.getTime())) {
            errors.push({ field: 'insurance_expiry_date', message: 'Invalid insurance expiry date' });
        }
    }
    
    if (formData.last_revision_date) {
        const revisionDate = new Date(formData.last_revision_date);
        if (isNaN(revisionDate.getTime())) {
            errors.push({ field: 'last_revision_date', message: 'Invalid last revision date' });
        }
    }
    
    return errors;
}

/**
 * Display Edit Vehicle Form Errors
 */
function displayEditVehicleFormErrors(errors) {
    // Clear previous errors
    clearEditVehicleFormErrors();
    
    errors.forEach(error => {
        const fieldId = `edit${error.field.charAt(0).toUpperCase() + error.field.slice(1).replace('_', '')}`;
        const input = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (input) {
            input.classList.add('fluent-input-error');
        }
        
        if (errorElement) {
            errorElement.textContent = error.message;
        }
    });
    
    // Scroll to first error
    const firstErrorElement = document.querySelector('#editVehicleForm .fluent-input-error');
    if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorElement.focus();
    }
}

/**
 * Clear Edit Vehicle Form Errors
 */
function clearEditVehicleFormErrors() {
    // Remove error classes from inputs
    document.querySelectorAll('#editVehicleForm .fluent-input-error').forEach(input => {
        input.classList.remove('fluent-input-error');
    });
    
    // Clear error messages
    document.querySelectorAll('#editVehicleForm .fluent-error-message').forEach(errorElement => {
        errorElement.textContent = '';
    });
}

/**
 * Delete Fleet Vehicle
 */
async function deleteFleetVehicle(vehicleId) {
    const vehicle = fleetData.find(v => v.id === vehicleId);
    if (!vehicle) {
        console.error('Vehicle not found:', vehicleId);
        return;
    }
    
    const vehicleName = `${vehicle.make} ${vehicle.model}`;
    const confirmed = await showConfirmDialog(
        'Retire Vehicle',
        `Are you sure you want to retire ${vehicleName}?\n\nThis will remove it from your active fleet. The vehicle can be restored later if needed.`,
        'Retire',
        'error'
    );
    
    if (confirmed) {
        try {
            const response = await fetch(`api/vehicles/manage.php?id=${vehicleId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast(`${vehicleName} has been retired and removed from active fleet.`, 'success');
                loadFleetManagementData(); // Reload data
            } else {
                throw new Error(data.error || 'Failed to delete vehicle');
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            showToast('Failed to delete vehicle: ' + error.message, 'error');
        }
    }
}

/**
 * Load Vehicles for Modal (Legacy compatibility)
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
    const statusClass = `status-${vehicle.status?.toLowerCase() || 'unknown'}`;
    const insuranceClass = vehicle.insurance_days_remaining < 0 ? 'status-expired' : (vehicle.insurance_days_remaining < 30 ? 'status-warning' : 'status-active');
    const revisionClass = vehicle.revision_days_remaining < 0 ? 'status-expired' : (vehicle.revision_days_remaining < 30 ? 'status-warning' : 'status-active');

    const insuranceStatus = vehicle.insurance_days_remaining < 0 ? 'Expired' : (vehicle.insurance_days_remaining < 30 ? `${vehicle.insurance_days_remaining} days` : 'Active');
    const revisionStatus = vehicle.revision_days_remaining < 0 ? 'Overdue' : (vehicle.revision_days_remaining < 30 ? `${vehicle.revision_days_remaining} days` : 'Current');

    const lastTripDisplay = (vehicle.last_trip && vehicle.last_trip.title)
        ? `<a href="#" onclick="openTripDetails('${vehicle.last_trip.id}')" class="trip-link" title="${vehicle.last_trip.title}">${vehicle.last_trip.title}</a>`
        : '<span class="no-trip">None</span>';

    const nextTripDisplay = (vehicle.next_trip && vehicle.next_trip.title)
        ? `<a href="#" onclick="openTripDetails('${vehicle.next_trip.id}')" class="trip-link" title="${vehicle.next_trip.title}">${vehicle.next_trip.title}</a>`
        : '<span class="no-trip">None Scheduled</span>';

    return `
        <tr>
            <td>
                <div class="vehicle-info">
                    <div class="vehicle-name">${vehicle.make || ''} ${vehicle.model || ''}</div>
                    <div class="vehicle-year">${vehicle.year || ''}</div>
                    <div class="vehicle-capacity">${vehicle.capacity || ''} people</div>
                </div>
            </td>
            <td><span class="license-plate">${vehicle.license_plate || 'N/A'}</span></td>
            <td class="mileage">${vehicle.current_mileage ? Number(vehicle.current_mileage).toLocaleString() + ' km' : 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${vehicle.status?.toUpperCase() || 'N/A'}</span></td>
            <td><span class="status-indicator ${insuranceClass}">${insuranceStatus}</span></td>
            <td><span class="status-indicator ${revisionClass}">${revisionStatus}</span></td>
            <td class="trip-info">${lastTripDisplay}</td>
            <td class="trip-info">${nextTripDisplay}</td>
            <td class="action-buttons">
                <button class="fluent-action-btn" onclick="editModalVehicle(${vehicle.id})" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61z"/></svg>
                </button>
                <button class="fluent-action-btn" onclick="viewModalVehicleLogs(${vehicle.id})" title="View Logs">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3.75C2 2.784 2.784 2 3.75 2h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0112.25 14h-8.5A1.75 1.75 0 012 12.25v-8.5z"/></svg>
                </button>
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
 * Legacy compatibility: redirect to Fleet Management modal
 */
function goToVehicleManagement() {
    showFleetManagementModal();
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

// Debug function for timezone testing
// Debug function to test edit user modal
function testEditUserModal() {
    console.log('🧪 Testing edit user modal...');
    
    // Create a test user object
    const testUser = {
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        company_id: '1',
        company_role: 'staff',
        role: 'user',
        can_see_company_trips: false
    };
    
    console.log('📝 Test user data:', testUser);
    
    // Test the modal
    showEditUserModal(testUser).then(() => {
        console.log('✅ Modal test completed');
    }).catch(error => {
        console.error('❌ Modal test failed:', error);
    });
}

// Make function available globally for testing
window.testEditUserModal = testEditUserModal;

function debugTimezoneIssue() {
    console.log('=== TIMEZONE DEBUG ===');
    console.log('Current system time:', new Date().toISOString());
    console.log('User timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Test with different timestamps
    const testDates = [
        new Date().toISOString(), // Current time
        '2024-12-19T02:46:00.000Z', // Sample UTC time around user's current time
        '2025-06-29T05:54:00.000Z', // The problematic date from screenshot
    ];
    
    testDates.forEach(dateString => {
        console.log(`Testing date: ${dateString}`);
        console.log(`Formatted: ${formatUserTimezone(dateString)}`);
    });
    
    // Check current user data
    const currentUserData = USER_DATABASE.find(u => u.email === 'daniel@wolthers.com');
    if (currentUserData) {
        console.log('Current user data:', currentUserData);
        console.log('User last_login_at:', currentUserData.last_login_at);
        console.log('User last_login:', currentUserData.last_login);
        console.log('User lastActive:', currentUserData.lastActive);
    }
    
    console.log('=== END DEBUG ===');
}

// Make it globally available for browser console testing
window.debugTimezoneIssue = debugTimezoneIssue;

// Fix invalid future timestamps in user data
function fixUserTimestamps() {
    console.log('🔧 Fixing invalid user timestamps...');
    
    const now = new Date();
    const maxValidDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now max
    let fixed = 0;
    
    USER_DATABASE = USER_DATABASE.map(user => {
        const updatedUser = { ...user };
        
        // Check and fix last_login_at
        if (user.last_login_at) {
            const loginDate = new Date(user.last_login_at);
            if (loginDate > maxValidDate) {
                // Set to a realistic recent login time (e.g., a few hours ago)
                updatedUser.last_login_at = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
                fixed++;
            }
        }
        
        // Check and fix last_login
        if (user.last_login) {
            const loginDate = new Date(user.last_login);
            if (loginDate > maxValidDate) {
                updatedUser.last_login = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
                fixed++;
            }
        }
        
        // Check and fix lastActive
        if (user.lastActive) {
            const activeDate = new Date(user.lastActive);
            if (activeDate > maxValidDate) {
                updatedUser.lastActive = new Date(now.getTime() - Math.random() * 6 * 60 * 60 * 1000).toISOString();
                fixed++;
            }
        }
        
        // For Daniel Wolthers specifically, set to recent login
        if (user.email === 'daniel@wolthers.com') {
            const recentLogin = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
            updatedUser.last_login_at = recentLogin;
            updatedUser.last_login = recentLogin;
            updatedUser.lastActive = recentLogin;
        }
        
        return updatedUser;
    });
    
    if (fixed > 0) {
        console.log(`✅ Fixed ${fixed} invalid timestamps`);
        saveUserDatabase();
        
        // Refresh the user management display if it's open
        if (document.getElementById('userManagementModal')?.classList.contains('show')) {
            loadModalUsersList();
        }
    } else {
        console.log('✅ No invalid timestamps found');
    }
}

// Make it globally available
window.fixUserTimestamps = fixUserTimestamps;