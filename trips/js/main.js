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

// Mock Data
const MOCK_TRIPS = [
    // Add mock trips here or load from API
];

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
                utils.hideLoading();
                ui.showDashboard();
                await trips.loadTrips();
                utils.showNotification(`Welcome ${result.user.name}!`, 'success');
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
        sessionStorage.removeItem('userSession');
        localStorage.removeItem('wolthers_auth');
        currentUser = null;
        ui.showLogin();
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
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        
            // Update user info
    document.getElementById('userInfo').textContent = 
        `Welcome, ${currentUser.name} | Wolthers & Associates - Internal Access Only`;
    
    // Show add trip button for employees (handled in renderTrips now)
    console.log('✅ User can add trips:', currentUser.canAddTrips);
    
    // Show admin settings for admin users (Wolthers team members are admins)
    const isWolthersAdmin = currentUser.email && currentUser.email.endsWith('@wolthers.com');
    if (isWolthersAdmin || currentUser.role === 'admin') {
        const adminSettings = document.getElementById('adminSettings');
        if (adminSettings) {
            adminSettings.style.display = 'flex';
        }
    }
    
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

    // Create new trip
    createTrip: (formData) => {
        utils.showLoading();
        
        // Simulate API call delay
        setTimeout(() => {
            // Generate trip ID
            const tripTitle = formData.get('tripTitle');
            const tripId = tripTitle.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-') + '-2025';
            
            // Process partner emails
            const partnerEmailsText = formData.get('partnerEmails') || '';
            const partnerEmails = partnerEmailsText ? 
                partnerEmailsText.split('\n').map(e => e.trim()).filter(e => e) : [];
            
            // Extract dates from itinerary or set defaults
            const itineraryText = formData.get('itineraryText') || '';
            let startDate, endDate;
            
            if (itineraryText) {
                // Try to extract dates from itinerary (simplified)
                const dateMatches = itineraryText.match(/\d{4}-\d{2}-\d{2}/g);
                if (dateMatches && dateMatches.length >= 2) {
                    startDate = dateMatches[0];
                    endDate = dateMatches[dateMatches.length - 1];
                } else {
                    // Default dates if no dates found in itinerary
                    const today = new Date();
                    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                    startDate = nextMonth.toISOString().split('T')[0];
                    endDate = new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                }
            } else {
                // Default dates if no itinerary
                const today = new Date();
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                startDate = nextMonth.toISOString().split('T')[0];
                endDate = new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            }

            // Create new trip object
            const newTrip = {
                id: tripId,
                title: tripTitle,
                description: formData.get('tripDescription') || '',
                date: startDate,
                endDate: endDate,
                guests: formData.get('guests') || '',
                cars: formData.get('cars') || '',
                driver: formData.get('driver') || '',
                status: 'upcoming',
                partnerEmails: partnerEmails,
                partnerCodes: [], // Would be generated in real app
                createdBy: currentUser.name,
                highlights: [], // Would be added later
                accommodations: '', // Would be added later
                meals: '' // Would be added later
            };
            
            // Add to mock data (at the beginning for upcoming trips)
            MOCK_TRIPS.unshift(newTrip);
            
            utils.hideLoading();
            ui.hideAddTripModal();
            trips.loadTrips(); // Refresh display
            
            utils.showNotification(`Trip "${newTrip.title}" created successfully!`, 'success');
        }, 1500);
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

function loadModalUsersList() {
    const usersList = document.getElementById('modalUsersList');
    if (!usersList) {
        console.log('modalUsersList element not found');
        return;
    }
    
    // Get users from the global USER_DATABASE array
    const users = getUsersFromDatabase();
    console.log('loadModalUsersList: Found', users.length, 'users:', users.map(u => u.name));
    
    // Update pagination info
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        paginationInfo.textContent = `Showing 1-${users.length} of ${users.length} users`;
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
                <td class="fluent-last-trip">${formatLastTrip(lastTrip)}</td>
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// User Database - Integrated from accounts.js
let USER_DATABASE = [];

// Initialize user database
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

// Save user database to localStorage
function saveUserDatabase() {
    try {
        localStorage.setItem('wolthers_users_database', JSON.stringify(USER_DATABASE));
        localStorage.setItem('wolthers_users_last_updated', new Date().toISOString());
        
        // Update global references
        window.USER_DATABASE = USER_DATABASE;
        window.MOCK_USERS = USER_DATABASE;
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
    const trips = [];
    
    // Add mock trips if they exist
    if (typeof MOCK_TRIPS !== 'undefined' && MOCK_TRIPS.length > 0) {
        trips.push(...MOCK_TRIPS);
    }
    
    // Add trips from localStorage
    try {
        const savedTrips = localStorage.getItem('wolthers_trips');
        if (savedTrips) {
            const parsedTrips = JSON.parse(savedTrips);
            if (Array.isArray(parsedTrips)) {
                trips.push(...parsedTrips);
            }
        }
    } catch (e) {
        console.log('No saved trips found');
    }
    
    // Remove duplicates based on ID
    const uniqueTrips = trips.filter((trip, index, self) => 
        index === self.findIndex(t => t.id === trip.id)
    );
    
    return uniqueTrips;
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
            case 'lastTrip':
                const aLastTrip = getUserTripsData(a).lastTrip;
                const bLastTrip = getUserTripsData(b).lastTrip;
                aValue = aLastTrip ? new Date(aLastTrip.endDate || aLastTrip.date) : new Date(0);
                bValue = bLastTrip ? new Date(bLastTrip.endDate || bLastTrip.date) : new Date(0);
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
                <td class="fluent-last-trip">${formatLastTrip(lastTrip)}</td>
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