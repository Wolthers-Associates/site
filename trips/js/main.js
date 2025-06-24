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
    // Initialize authentication system
    init: async () => {
        auth.initializeLoginForms();
        await auth.initializeMicrosoftAuth();
        auth.validateExistingSession();
    },

    // Initialize form handlers
    initializeLoginForms: () => {
        // Initial form (step 1)
        const initialForm = document.getElementById('initialForm');
        if (initialForm) {
            initialForm.addEventListener('submit', auth.handleInitialInput);
        }
        
        // Password form (step 2)
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', auth.handlePasswordLogin);
        }
        
        // Create account form (step 3)
        const createAccountForm = document.getElementById('createAccountForm');
        if (createAccountForm) {
            createAccountForm.addEventListener('submit', auth.handleAccountCreation);
        }
        
        // Code verification form (step 4)
        const codeForm = document.getElementById('codeForm');
        if (codeForm) {
            codeForm.addEventListener('submit', auth.handleCodeVerification);
        }
        
        // Setup dark mode detection for Microsoft button
        auth.setupDarkModeDetection();
    },

    // Microsoft Auth instance
    msAuth: null,

    // Initialize Microsoft authentication
    initializeMicrosoftAuth: async () => {
        try {
            // Load Azure AD configuration from backend
            const config = await auth.loadMicrosoftConfig();
            
            if (!config.clientId) {
                console.warn('Microsoft authentication not configured. Client ID missing.');
                return;
            }
            
            // Initialize Microsoft Auth
            auth.msAuth = new MicrosoftAuth(config.clientId, config.tenantId || 'common');
            
            const microsoftBtn = document.getElementById('microsoftLoginBtn');
            if (microsoftBtn) {
                microsoftBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth.handleMicrosoftLogin();
                });
            }
        } catch (error) {
            console.error('Failed to initialize Microsoft authentication:', error);
        }
    },

    // Load Microsoft configuration from backend
    loadMicrosoftConfig: async () => {
        try {
            const response = await fetch('/api/auth/microsoft-config.php');
            if (response.ok) {
                const data = await response.json();
                return data.config;
            }
            throw new Error('Failed to load Microsoft configuration');
        } catch (error) {
            console.error('Error loading Microsoft config:', error);
            // Fallback to hardcoded values for development
            console.warn('Using fallback Microsoft configuration. Update secure-config.php with your Azure AD credentials.');
            return { 
                clientId: null, // Set to null to disable Microsoft auth until configured
                tenantId: 'common' 
            };
        }
    },

    // Handle Microsoft login
    handleMicrosoftLogin: async () => {
        if (!auth.msAuth) {
            utils.showError('Microsoft authentication not initialized. Please configure your Azure AD credentials.');
            return;
        }

        try {
            const result = await auth.msAuth.signIn();
            console.log('Microsoft sign-in successful:', result);
            
            // The Microsoft auth callback will handle the login
            // This is just a fallback for direct usage
            if (result && result.user) {
                auth.handleSuccessfulLogin(result);
            }
        } catch (error) {
            console.error('Microsoft sign-in error:', error);
            utils.showError('Microsoft sign-in failed: ' + error.message);
        }
    },

    // Setup dark mode detection for Microsoft button and logo
    setupDarkModeDetection: () => {
        const microsoftImg = document.getElementById('microsoftBtnImg');
        const loginLogo = document.querySelector('.login-logo-image');
        
        const updateForDarkMode = () => {
            const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            // Update Microsoft button
            if (microsoftImg) {
                microsoftImg.src = isDarkMode ? 'images/ms_signin_dark_short.svg' : 'images/ms_signin_light_short.svg';
            }
            
            // Update Wolthers logo
            if (loginLogo) {
                loginLogo.src = isDarkMode ? 'images/wolthers-logo-off-white.svg' : 'images/wolthers-logo-green.svg';
            }
        };

        // Initial setup
        updateForDarkMode();

        // Listen for changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateForDarkMode);
        }
    },

    // Current user email for multi-step flow
    currentEmail: null,
    
    // Handle initial input (step 1)
    handleInitialInput: async (e) => {
        e.preventDefault();
        
        const input = document.getElementById('primaryInput').value.trim();
        
        if (!input) {
            utils.showError('Please enter your email or trip access code');
            return;
        }
        
        // Check if it's an email or trip code
        if (input.includes('@')) {
            // It's an email - check if user exists
            auth.currentEmail = input;
            await auth.checkUserExists(input);
        } else {
            // It's a trip code - process directly
            await auth.processPasscodeLogin(input.toUpperCase());
        }
    },
    
    // Check if user exists
    checkUserExists: async (email) => {
        try {
            const response = await fetch('/api/auth/check-user.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });
            
            const data = await response.json();
            
            if (data.exists) {
                // User exists - show password step
                auth.showStep2(data.user.name);
            } else {
                // User doesn't exist - show account creation step
                auth.showStep3(email);
            }
        } catch (error) {
            // For development, mock the user check
            auth.mockUserCheck(email);
        }
    },
    
    // Handle password login (step 2)
    handlePasswordLogin: async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('passwordInput').value.trim();
        
        if (!password) {
            utils.showError('Please enter your password');
            return;
        }
        
        await auth.processRegularLogin(auth.currentEmail, password);
    },
    
    // Handle account creation (step 3)
    handleAccountCreation: async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('fullNameInput').value.trim();
        const company = document.getElementById('companyInput').value.trim();
        
        if (!name) {
            utils.showError('Please enter your full name');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: auth.currentEmail,
                    company: company
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                utils.showNotification('Account created! Check your email for confirmation.', 'success');
                auth.goBackToStep1();
            } else {
                utils.showError(data.error || 'Failed to create account');
            }
        } catch (error) {
            // For development, mock account creation
            utils.showNotification('Account created! (Development mode)', 'success');
            setTimeout(() => auth.goBackToStep1(), 2000);
        }
    },
    
    // Handle code verification (step 4)
    handleCodeVerification: async (e) => {
        e.preventDefault();
        
        const code = document.getElementById('codeInput').value.trim();
        
        if (!code || code.length !== 6) {
            utils.showError('Please enter the 6-digit code');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/verify-code.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: auth.currentEmail,
                    code: code
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('userSession', JSON.stringify(data));
                auth.handleSuccessfulLogin(data);
            } else {
                utils.showError(data.error || 'Invalid code');
            }
        } catch (error) {
            // For development, mock code verification
            if (code === '123456') {
                const mockData = {
                    success: true,
                    user: { name: 'Test User', email: auth.currentEmail, role: 'partner' },
                    auth_type: 'one_time_code'
                };
                auth.handleSuccessfulLogin(mockData);
            } else {
                utils.showError('Invalid code. Try 123456 for development.');
            }
        }
    },
    
    // Process regular email/password login
    processRegularLogin: async (email, password) => {
        try {
            const response = await fetch('/api/auth/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    login_type: 'regular',
                    username: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('userSession', JSON.stringify(data));
                auth.handleSuccessfulLogin(data);
            } else {
                utils.showError(data.error || 'Invalid password');
            }
        } catch (error) {
            // For development, fall back to mock authentication
            auth.mockRegularLogin(email, password);
        }
    },

    // Process trip passcode login
    processPasscodeLogin: async (tripCode) => {
        try {
            const response = await fetch('/api/auth/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    login_type: 'passcode',
                    trip_code: tripCode
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('userSession', JSON.stringify(data));
                auth.handleSuccessfulLogin(data);
            } else {
                utils.showError(data.error || 'Invalid trip code');
            }
        } catch (error) {
            // For development, fall back to mock authentication
            auth.mockPasscodeLogin(tripCode);
        }
    },

    // Handle Microsoft Office 365 login
    handleMicrosoftLogin: async () => {
        if (!auth.msAuth) {
            utils.showError('Microsoft authentication not initialized. Please configure your Azure AD credentials.');
            return;
        }

        try {
            console.log('🚀 Starting Microsoft authentication...');
            const result = await auth.msAuth.signIn();
            console.log('✅ Microsoft sign-in successful:', result);
            
            // Convert the session data to the expected format for handleSuccessfulLogin
            if (result && result.user) {
                const loginData = {
                    success: true,
                    user: result.user,
                    auth_type: result.auth_type || 'office365',
                    session_id: result.session_id,
                    access_level: 'full', // Office 365 users get full access by default
                    restrictions: null
                };
                
                // Store session for backend validation
                localStorage.setItem('userSession', JSON.stringify(loginData));
                
                // Handle the successful login (this will redirect to main content)
                auth.handleSuccessfulLogin(loginData);
            }
        } catch (error) {
            console.error('❌ Microsoft sign-in error:', error);
            utils.showError('Microsoft sign-in failed: ' + error.message);
        }
    },

    // Handle successful login
    handleSuccessfulLogin: (data) => {
        // Update global user state
        currentUser = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            type: data.auth_type,
            canAddTrips: data.auth_type === 'regular' || data.auth_type === 'office365',
            accessLevel: data.access_level,
            tripAccess: data.trip_access,
            restrictions: data.restrictions,
            loginTime: new Date().toISOString()
        };
        
        // Store in session
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Show main content
        ui.showMainContent();
        
        // Show access restrictions if applicable
        if (data.restrictions) {
            auth.showAccessRestrictions(data.restrictions);
        }
    },

    // Step navigation functions
    showStep2: (userName) => {
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step2').classList.add('active');
        document.getElementById('welcomeMessage').innerHTML = `
            <h3>Welcome back, ${userName}!</h3>
            <p>Enter your password to continue</p>
        `;
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
        auth.currentEmail = null;
    },
    
    goBackToStep2: () => {
        document.getElementById('step4').classList.remove('active');
        document.getElementById('step2').classList.add('active');
    },
    
    // Mock user check for development
    mockUserCheck: (email) => {
        const knownUsers = [
            { email: 'daniel@wolthers.com', name: 'Daniel Wolthers' },
            { email: 'test@example.com', name: 'Test User' }
        ];
        
        const user = knownUsers.find(u => u.email === email);
        if (user) {
            auth.showStep2(user.name);
        } else {
            auth.showStep3(email);
        }
    },

    // Mock authentication for development
    mockRegularLogin: (email, password) => {
        const mockUsers = [
            { email: 'daniel@wolthers.com', name: 'Daniel Wolthers', role: 'admin' },
            { email: 'test@example.com', name: 'Test User', role: 'partner' }
        ];
        
        const user = mockUsers.find(u => u.email === email);
        if (user && (password === 'any' || password === 'password')) {
            const mockData = {
                success: true,
                user: user,
                auth_type: 'regular'
            };
            auth.handleSuccessfulLogin(mockData);
        } else {
            utils.showError('Invalid credentials. Try daniel@wolthers.com with any password.');
        }
    },

    // Mock passcode authentication for development
    mockPasscodeLogin: (tripCode) => {
        const validCodes = ['BRAZIL2025', 'COLOMBIA2025', 'ETHIOPIA2025'];
        
        if (validCodes.includes(tripCode)) {
            const mockData = {
                success: true,
                user: { name: 'Trip Visitor', role: 'visitor' },
                auth_type: 'passcode',
                access_level: 'trip_only',
                trip_access: { trip_id: 1, trip_title: 'Brazil Coffee Origins Tour' },
                restrictions: {
                    cannot_access_other_trips: true,
                    cannot_see_past_trips: true,
                    read_only_access: true
                }
            };
            auth.handleSuccessfulLogin(mockData);
        } else {
            utils.showError('Invalid trip code. Try BRAZIL2025, COLOMBIA2025, or ETHIOPIA2025');
        }
    },

    // Validate existing session
    validateExistingSession: async () => {
        const session = localStorage.getItem('userSession');
        const savedUser = sessionStorage.getItem('currentUser');
        
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            ui.showMainContent();
            return;
        }
        
        if (!session) return;
        
        try {
            const response = await fetch('/api/auth/validate.php');
            const data = await response.json();
            
            if (data.success && data.authenticated) {
                auth.handleSuccessfulLogin(data);
            } else {
                localStorage.removeItem('userSession');
                sessionStorage.removeItem('currentUser');
            }
        } catch (error) {
            localStorage.removeItem('userSession');
            sessionStorage.removeItem('currentUser');
            console.error('Session validation error:', error);
        }
    },

    // Show access restrictions notice
    showAccessRestrictions: (restrictions) => {
        if (restrictions.cannot_access_other_trips) {
            const notice = document.createElement('div');
            notice.className = 'access-notice';
            notice.innerHTML = `
                <div class="notice-content" style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; border-radius: 6px; margin: 10px 0;">
                    <span class="notice-icon">ℹ️</span>
                    <span>You have limited access to this specific trip only.</span>
                </div>
            `;
            const header = document.querySelector('.header');
            if (header) {
                header.appendChild(notice);
            }
        }
    },

    // Check for existing authentication
    checkAuth: () => {
        auth.validateExistingSession();
    },

    // Enhanced logout function
    logout: async () => {
        try {
            // Call logout endpoint
            await fetch('/api/auth/logout.php', { method: 'POST' });
        } catch (error) {
            console.error('Logout API error:', error);
        }
        
        // Clear local storage and session
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        currentTrips = [];
        selectedTrip = null;
        
        // Show login page
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('mainContainer').style.display = 'none';
        
        // Reset login forms
        auth.goBackToStep1();
        
        // Clear error messages
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) errorDiv.textContent = '';
        
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
        let overviewHTML = `
            <div class="trip-preview-info">
                ${trip.guests ? `
                <div class="preview-info-item">
                    <img src="images/user.svg" alt="User" style="height:18px;vertical-align:middle;margin-right:6px;">
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
    console.log('🚧 Development Mode - Enhanced Authentication Active');
    console.log('🎯 Available authentication methods:');
    console.log('🏢 Microsoft/Office 365: Ready (configure Azure AD credentials)');
    console.log('📧 Email + One-time Code: Functional with backend');
    console.log('👤 Regular Login: daniel@wolthers.com / any password');
    console.log('🔑 Trip Codes: BRAZIL2025, COLOMBIA2025, ETHIOPIA2025');
    
    // Initialize enhanced authentication system
    auth.init().catch(error => {
        console.error('Failed to initialize authentication:', error);
    });
    
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