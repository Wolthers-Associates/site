// Development Configuration
const CONFIG = {
    DEVELOPMENT_MODE: true,
    TEMP_DOMAIN: 'khaki-raccoon-228009.hostingersite.com',
    FUTURE_DOMAIN: 'wolthers.com',
    VERSION: '1.0.0-dev'
};

// Mock Data - Coffee Trip Itineraries
const MOCK_TRIPS = [
    {
        id: "brazil-coffee-origins-2025",
        title: "Brazil Coffee Origins Tour",
        description: "Exploring premium coffee regions in São Paulo and Minas Gerais with visits to historic fazendas and modern processing facilities",
        date: "2025-07-01",
        endDate: "2025-07-15",
        guests: "International clients, Roasting partners",
        cars: "Toyota Land Cruiser, Jeep Wrangler",
        driver: "Carlos Silva",
        status: "upcoming",
        partnerEmails: ["john@company.com", "sarah@business.org"],
        partnerCodes: ["BRAZIL2025", "COFFEE-VIP"],
        createdBy: "Daniel Wolthers",
        highlights: [
            "Visit to Santos Coffee Museum",
            "Fazenda Santa Monica tour",
            "Cupping sessions with local roasters",
            "Meeting with coffee cooperatives"
        ],
        accommodations: "Luxury eco-lodge in Campos do Jordão",
        meals: "Traditional Brazilian cuisine with coffee pairings",
        wolthersGuide: "Daniel Wolthers & Maria Santos",
        itinerary: [
            {
                day: 1,
                date: "2025-07-01",
                title: "Arrival in São Paulo",
                activities: [
                    {
                        time: "10:00",
                        title: "Airport Pickup",
                        description: "Private transfer from São Paulo Guarulhos Airport"
                    },
                    {
                        time: "12:30",
                        title: "Welcome Lunch",
                        description: "Traditional Brazilian lunch at restaurant with city views"
                    },
                    {
                        time: "15:00",
                        title: "São Paulo Coffee Culture Tour",
                        description: "Explore historic coffee houses and learn about Brazil's coffee heritage"
                    },
                    {
                        time: "19:30",
                        title: "Welcome Dinner",
                        description: "Dinner with local coffee experts and trip overview"
                    }
                ],
                summary: "Introduction to São Paulo's rich coffee culture and meet fellow travelers"
            },
            {
                day: 2,
                date: "2025-07-02",
                title: "Santos Coffee Heritage",
                activities: [
                    {
                        time: "08:00",
                        title: "Departure to Santos",
                        description: "2-hour drive to the historic port city of Santos"
                    },
                    {
                        time: "10:30",
                        title: "Coffee Museum Visit",
                        description: "Explore the history of coffee trade at the famous Santos Coffee Museum"
                    },
                    {
                        time: "14:00",
                        title: "Port Tour",
                        description: "Visit the port facilities and see how coffee is exported worldwide"
                    },
                    {
                        time: "16:30",
                        title: "Coffee Tasting Session",
                        description: "Professional cupping session with local coffee experts"
                    }
                ],
                summary: "Discover the historic heart of Brazil's coffee export industry"
            },
            {
                day: 3,
                date: "2025-07-03",
                title: "Fazenda Santa Monica",
                activities: [
                    {
                        time: "07:00",
                        title: "Early Departure",
                        description: "Journey to the famous Fazenda Santa Monica coffee plantation"
                    },
                    {
                        time: "09:30",
                        title: "Farm Tour",
                        description: "Walk through coffee fields and learn about cultivation methods"
                    },
                    {
                        time: "11:00",
                        title: "Processing Demonstration",
                        description: "See traditional and modern coffee processing techniques"
                    },
                    {
                        time: "13:00",
                        title: "Farm Lunch",
                        description: "Traditional farm-to-table meal prepared by local cooks"
                    },
                    {
                        time: "15:30",
                        title: "Coffee Roasting Workshop",
                        description: "Hands-on experience roasting your own coffee beans"
                    }
                ],
                summary: "Immersive experience in traditional Brazilian coffee farming"
            }
        ]
    },
    {
        id: "colombia-highlands-2025",
        title: "Colombian Highland Discovery", 
        description: "Journey through Colombian coffee highlands and processing facilities in the Coffee Triangle region",
        date: "2025-08-10",
        endDate: "2025-08-20",
        guests: "VIP coffee buyers, Export partners",
        cars: "Mercedes Sprinter Van",
        driver: "Ana Rodriguez",
        status: "upcoming",
        partnerEmails: ["team@roasters.com", "buyer@specialty.co"],
        partnerCodes: ["COLOMBIA2025"],
        createdBy: "Svenn Wolthers",
        highlights: [
            "Cocora Valley palm forest hike",
            "Traditional coffee processing methods",
            "Visit to Recuca Coffee Park",
            "Meeting with coffee farmers"
        ],
        accommodations: "Boutique hotel in Salento",
        meals: "Farm-to-table dining experience",
        wolthersGuide: "Carlos Wolthers & Ana Rodriguez"
    },
    {
        id: "ethiopia-birthplace-2025",
        title: "Ethiopia: Coffee's Birthplace",
        description: "Discover the origins of coffee in Ethiopia's ancient highlands and traditional ceremonies",
        date: "2025-09-05",
        endDate: "2025-09-18",
        guests: "Coffee historians, Specialty importers",
        cars: "Toyota Land Cruiser 4x4",
        driver: "Daniel Wolthers",
        status: "upcoming",
        partnerEmails: ["history@coffee.edu", "import@specialty.com"],
        partnerCodes: ["ETHIOPIA2025", "ORIGIN-QUEST"],
        createdBy: "Daniel Wolthers",
        highlights: [
            "Traditional coffee ceremonies",
            "Visit to Yirgacheffe region",
            "Ancient forest coffee gardens",
            "Cultural exchange with local tribes"
        ],
        accommodations: "Mountain lodge overlooking coffee forests",
        meals: "Traditional Ethiopian cuisine and coffee rituals",
        wolthersGuide: "Daniel Wolthers & Almaz Bekele"
    },
    {
        id: "guatemala-antigua-2024",
        title: "Guatemala Antigua Experience",
        description: "Completed tour of Antigua coffee farms and volcanic soil benefits with cultural immersion",
        date: "2024-11-05",
        endDate: "2024-11-12",
        guests: "European importers",
        cars: "Ford Expedition",
        driver: "Sofia Morales",
        status: "completed",
        partnerEmails: ["europe@import.com"],
        partnerCodes: ["GUATEMALA2024"],
        createdBy: "Daniel Wolthers",
        highlights: [
            "Volcano-grown coffee tasting",
            "Colonial architecture tour",
            "Traditional weaving workshops",
            "Local market experiences"
        ],
        accommodations: "Historic hotel in Antigua city center",
        meals: "Guatemalan fusion cuisine",
        wolthersGuide: "Daniel Wolthers & Sofia Morales"
    },
    {
        id: "costa-rica-sustainability-2024",
        title: "Costa Rica Sustainability Tour",
        description: "Completed exploration of sustainable coffee farming practices and eco-tourism in Monteverde",
        date: "2024-09-20",
        endDate: "2024-09-28",
        guests: "Sustainability advocates, Eco-tourism partners",
        cars: "Hybrid SUV fleet",
        driver: "Miguel Torres",
        status: "completed",
        partnerEmails: ["eco@partners.org", "sustain@coffee.net"],
        partnerCodes: ["COSTARICA2024", "ECO-COFFEE"],
        createdBy: "Svenn Wolthers",
        highlights: [
            "Carbon-neutral coffee farms",
            "Cloud forest canopy tours",
            "Wildlife conservation projects",
            "Zero-waste processing methods"
        ],
        accommodations: "Sustainable eco-lodge",
        meals: "Organic, locally-sourced cuisine",
        wolthersGuide: "Svenn Wolthers & Isabella Vargas"
    }
];

// Mock Credentials for Testing
const MOCK_CREDENTIALS = {
    emails: [
        'john@company.com',
        'sarah@business.org', 
        'team@roasters.com',
        'buyer@specialty.co',
        'europe@import.com',
        'history@coffee.edu',
        'import@specialty.com',
        'eco@partners.org',
        'sustain@coffee.net'
    ],
    codes: [
        'BRAZIL2025',
        'COLOMBIA2025', 
        'COFFEE-VIP',
        'GUATEMALA2024',
        'ETHIOPIA2025',
        'ORIGIN-QUEST',
        'COSTARICA2024',
        'ECO-COFFEE'
    ]
};

// Global Application State
let currentUser = null;
let currentTrips = [];
let selectedTrip = null;

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

// Authentication Functions
const auth = {
    // Handle unified login form
    handleLogin: (formData) => {
        const username = formData.get('username') || document.getElementById('username').value;
        const password = formData.get('password') || document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        const loginBtn = document.querySelector('.login-btn');
        
        // Show loading state
        loginBtn.textContent = 'Authenticating...';
        loginBtn.disabled = true;
        errorDiv.textContent = '';
        
        utils.showLoading();
        
        // Simulate authentication delay
        setTimeout(() => {
            let isValid = false;
            let userType = 'unknown';
            let accessValue = '';
            
            // Check for employee login
            if (username.toLowerCase() === 'employee' || username.toLowerCase().includes('@wolthers')) {
                isValid = true;
                userType = 'employee';
                accessValue = username;
            }
            // Check for email login
            else if (MOCK_CREDENTIALS.emails.includes(username.toLowerCase())) {
                isValid = true;
                userType = 'partner';
                accessValue = username.toLowerCase();
            }
            // Check for code login (username can be anything, password is the code)
            else if (MOCK_CREDENTIALS.codes.includes(password.toUpperCase())) {
                isValid = true;
                userType = 'partner';
                accessValue = password.toUpperCase();
            }
            
            utils.hideLoading();
            
            if (isValid) {
                if (userType === 'employee') {
                    currentUser = {
                        name: 'Test Employee',
                        email: 'test@wolthers.com',
                        type: 'employee',
                        canAddTrips: true,
                        accessMethod: 'employee',
                        accessValue: accessValue,
                        loginTime: new Date().toISOString()
                    };
                } else {
                    const isEmailAccess = MOCK_CREDENTIALS.emails.includes(accessValue);
                    currentUser = {
                        name: isEmailAccess ? accessValue.split('@')[0] : 'Partner User',
                        email: isEmailAccess ? accessValue : 'partner@company.com',
                        type: 'partner',
                        canAddTrips: false,
                        accessMethod: isEmailAccess ? 'email' : 'code',
                        accessValue: accessValue,
                        loginTime: new Date().toISOString()
                    };
                }
                
                sessionStorage.setItem('mockUser', JSON.stringify(currentUser));
                ui.showMainContent();
            } else {
                errorDiv.textContent = 'Invalid credentials. Check the test credentials below.';
            }
            
            // Reset button
            loginBtn.textContent = 'Access Trips';
            loginBtn.disabled = false;
            document.getElementById('password').value = '';
        }, 1000);
    },

    // Check for existing authentication
    checkAuth: () => {
        const savedUser = sessionStorage.getItem('mockUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            ui.showMainContent();
        }
    },

    // Logout function
    logout: () => {
        sessionStorage.removeItem('mockUser');
        currentUser = null;
        currentTrips = [];
        selectedTrip = null;
        
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('mainContainer').style.display = 'none';
        
        // Reset login form
        document.getElementById('loginForm').reset();
        document.getElementById('errorMessage').textContent = '';
        
        utils.showNotification('Logged out successfully', 'info');
    }
};

// UI Management Functions
const ui = {
    // Show main content after authentication
    showMainContent: () => {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        
            // Update user info
    document.getElementById('userInfo').textContent = 
        `Welcome, ${currentUser.name} | Wolthers & Associates - Internal Access Only`;
    
    // Show add trip button for employees (handled in renderTrips now)
    console.log('✅ User can add trips:', currentUser.canAddTrips);
    
    // Show accounts link for admin users (employees can access admin features)
    if (currentUser.type === 'employee') {
        const accountsLink = document.getElementById('accountsLink');
        if (accountsLink) {
            accountsLink.style.display = 'flex';
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
        
        // Get Wolthers staff attending
        const wolthersStaff = trip.wolthersGuide || trip.createdBy || 'Daniel Wolthers';
        
        // Get trip codes for display
        const tripCodes = trip.partnerCodes || [];

        return `
            <div class="trip-card ${status}" onclick="trips.openTrip('${trip.id}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') trips.openTrip('${trip.id}')">
                <div class="trip-card-header">
                    <div class="trip-title">${trip.title}</div>
                    <div class="trip-date">${startDate} - ${endDate}</div>
                </div>
                
                <div class="trip-description">${trip.description}</div>
                
                <div class="trip-meta">
                    ${trip.guests ? `<div class="trip-guests">👤 ${trip.guests}</div>` : ''}
                    ${trip.cars ? `
                        <div class="trip-cars">
                            <img src="assets/images/disco-icon.png" alt="Vehicle" class="disco-icon-card">
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
                    ${status === 'upcoming' ? `Upcoming (${duration} days)` : 'Completed'}
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
        if (containerId === 'upcomingTrips' && currentUser && currentUser.canAddTrips) {
            html += ui.createAddTripCard();
        }
        
        if (tripList.length === 0 && containerId !== 'upcomingTrips') {
            container.innerHTML = `<div class="no-trips">No ${status} trips found</div>`;
            return;
        }
        
        if (tripList.length === 0 && containerId === 'upcomingTrips' && currentUser && currentUser.canAddTrips) {
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
        
        content.innerHTML = `
            <div class="trip-preview-header">
                <h3 class="trip-preview-title">${trip.title}</h3>
                <div class="trip-preview-dates">${dateRange}</div>
                ${trip.wolthersGuide ? `<div class="trip-preview-guide">Guided by: ${trip.wolthersGuide}</div>` : ''}
                <div class="trip-preview-description">${trip.description}</div>
                
                <div class="trip-preview-actions">
                    <button class="preview-btn secondary" onclick="ui.hideTripPreview()">Close</button>
                    <button class="preview-btn primary" onclick="trips.openFullTrip('${trip.id}')">Open Trip</button>
                </div>
            </div>
            
            <div class="trip-preview-body">
            
            <div class="trip-preview-info">
                ${trip.guests ? `
                <div class="preview-info-item">
                    <span class="preview-info-icon">👤</span>
                    <span>${trip.guests}</span>
                </div>
                ` : ''}
                
                ${trip.cars ? `
                <div class="preview-info-item">
                    <span class="preview-info-icon">🚗</span>
                    <span>${trip.cars}</span>
                </div>
                ` : ''}
                
                <div class="preview-info-item">
                    <span class="preview-info-icon">📅</span>
                    <span>${duration} days</span>
                </div>
                
                <div class="preview-info-item">
                    <span class="preview-info-icon">✨</span>
                    <span>${trip.status === 'upcoming' ? 'Upcoming' : 'Completed'}</span>
                </div>
            </div>
            
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
                        <span class="trip-info-icon">👥</span>
                        <span>${trip.guests}</span>
                    </div>
                    ` : ''}
                    
                    ${trip.cars ? `
                    <div class="trip-info-item">
                        <span class="trip-info-icon">🚗</span>
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
                        
                        ${currentUser.type === 'employee' ? `
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚧 Development Mode - Mock Data Active');
    console.log('🎯 Mock credentials for testing:');
    console.log('📧 Emails:', MOCK_CREDENTIALS.emails.join(', '));
    console.log('🔑 Codes:', MOCK_CREDENTIALS.codes.join(', '));
    
    // Check for existing authentication
    auth.checkAuth();
    
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        auth.handleLogin(new FormData(this));
    });
    
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