/**
 * Authentication Module
 * Wolthers & Associates - Trips Platform
 * 
 * Handles all authentication logic including Microsoft OAuth2 and session management
 */

// Authentication configuration
const CONFIG = {
    API_BASE: 'api',
    SESSION_TIMEOUT: 3600000, // 1 hour
    MICROSOFT_TENANT: 'common'
};

// Global authentication state
let currentUser = null;
let microsoftAuth = null;

/**
 * Authentication class with all auth-related functionality
 */
export class Auth {
    constructor() {
        this.currentUser = null;
        this.microsoftAuth = null;
        this.currentEmail = null;
    }

    /**
     * Initialize authentication system
     */
    async init() {
        console.log('🔐 Initializing authentication system...');
        
        // Initialize Microsoft Auth
        await this.initializeMicrosoftAuth();
        
        // Check for existing session
        const session = sessionStorage.getItem('userSession');
        if (session) {
            try {
                const userData = JSON.parse(session);
                if (await this.validateSession(userData)) {
                    this.currentUser = userData.user;
                    return { success: true, user: this.currentUser };
                }
            } catch (e) {
                console.warn('Invalid session data:', e);
                sessionStorage.removeItem('userSession');
            }
        }
        
        return { success: false, user: null };
    }

    /**
     * Initialize Microsoft authentication
     */
    async initializeMicrosoftAuth() {
        try {
            // Load Microsoft auth configuration from server
            const configResponse = await fetch(`${CONFIG.API_BASE}/auth/microsoft-config.php`);
            if (configResponse.ok) {
                const config = await configResponse.json();
                
                // Import Microsoft auth class if not already available
                if (typeof MicrosoftAuth === 'undefined') {
                    await import('../microsoft-auth.js');
                }
                
                this.microsoftAuth = new MicrosoftAuth(
                    config.clientId,
                    config.tenantId || CONFIG.MICROSOFT_TENANT
                );
                
                console.log('✅ Microsoft authentication initialized');
            } else {
                console.warn('⚠️  Microsoft auth config not available');
            }
        } catch (error) {
            console.warn('⚠️  Failed to initialize Microsoft auth:', error);
        }
    }

    /**
     * Validate session with server
     */
    async validateSession(userData) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/auth/validate.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_token: userData.token })
            });
            return response.ok;
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }

    /**
     * Microsoft OAuth sign-in
     */
    async signInWithMicrosoft() {
        try {
            if (!this.microsoftAuth) {
                throw new Error('Microsoft authentication not initialized. Please check Azure AD configuration.');
            }
            
            const result = await this.microsoftAuth.signIn();
            
            if (result && result.user) {
                // Send login request to backend with timezone info
                const timezone = this.getUserTimezone();
                const loginResponse = await fetch(`${CONFIG.API_BASE}/auth/login.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        login_type: 'office365',
                        access_token: result.accessToken,
                        timezone: timezone
                    })
                });
                
                if (loginResponse.ok) {
                    const loginResult = await loginResponse.json();
                    
                    // Store session with backend response
                    sessionStorage.setItem('userSession', JSON.stringify(loginResult));
                    this.currentUser = loginResult.user;
                    
                    return { success: true, user: this.currentUser };
                } else {
                    const error = await loginResponse.json();
                    throw new Error(error.message || 'Login failed');
                }
            } else {
                throw new Error('Microsoft authentication was cancelled or failed');
            }
        } catch (error) {
            console.error('Microsoft sign-in error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Email and password authentication
     */
    async signInWithEmail(email, password) {
        try {
            // Check if it's a Wolthers team member (development)
            const wolthersEmails = ['daniel@wolthers.com', 'svenn@wolthers.com', 'tom@wolthers.com', 'rasmus@wolthers.com'];
            
            if (wolthersEmails.includes(email.toLowerCase())) {
                // Simulate successful Wolthers team login
                const user = {
                    id: email.split('@')[0].replace('.', '-'),
                    name: this.getNameFromEmail(email),
                    email: email.toLowerCase(),
                    role: 'admin',
                    canAddTrips: true,
                    isWolthersTeam: true,
                    loginMethod: 'email'
                };
                
                const sessionData = {
                    user: user,
                    token: 'mock-session-' + Date.now(),
                    timestamp: Date.now()
                };
                
                sessionStorage.setItem('userSession', JSON.stringify(sessionData));
                this.currentUser = user;
                
                return { success: true, user: this.currentUser };
            }
            
            // For other users, check with backend
            const timezone = this.getUserTimezone();
            const response = await fetch(`${CONFIG.API_BASE}/auth/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    login_type: 'regular',
                    username: email, 
                    password: password,
                    timezone: timezone
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                sessionStorage.setItem('userSession', JSON.stringify(result));
                this.currentUser = result.user;
                return { success: true, user: this.currentUser };
            } else {
                const error = await response.json();
                return { success: false, error: error.message || 'Invalid credentials' };
            }
        } catch (error) {
            console.error('Email sign-in error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    }

    /**
     * Trip code authentication
     */
    async signInWithTripCode(code) {
        try {
            const validCodes = ['BRAZIL2025', 'COLOMBIA2025', 'ETHIOPIA2025'];
            
            if (validCodes.includes(code.toUpperCase())) {
                const user = {
                    id: 'partner-' + code.toLowerCase(),
                    name: 'Trip Participant',
                    email: `participant.${code.toLowerCase()}@trip.guest`,
                    role: 'guest',
                    canAddTrips: false,
                    isPartner: true,
                    tripCode: code.toUpperCase(),
                    loginMethod: 'tripcode'
                };
                
                const sessionData = {
                    user: user,
                    token: 'trip-session-' + Date.now(),
                    timestamp: Date.now()
                };
                
                sessionStorage.setItem('userSession', JSON.stringify(sessionData));
                this.currentUser = user;
                
                return { success: true, user: this.currentUser };
            }
            
            return { success: false, error: 'Invalid trip code' };
        } catch (error) {
            console.error('Trip code sign-in error:', error);
            return { success: false, error: 'Invalid trip code' };
        }
    }

    /**
     * Send one-time code to email
     */
    async sendOneTimeCode(email) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/auth/send-code.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            if (response.ok) {
                this.currentEmail = email;
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Send code error:', error);
            return { success: false, error: 'Failed to send code' };
        }
    }

    /**
     * Verify one-time code
     */
    async verifyOneTimeCode(code) {
        try {
            // Development mode - accept 123456
            if (code === '123456' && this.currentEmail) {
                const user = {
                    id: this.currentEmail.split('@')[0].replace('.', '-'),
                    name: this.getNameFromEmail(this.currentEmail),
                    email: this.currentEmail,
                    role: 'user',
                    canAddTrips: false,
                    loginMethod: 'onetime'
                };
                
                const sessionData = {
                    user: user,
                    token: 'onetime-session-' + Date.now(),
                    timestamp: Date.now()
                };
                
                sessionStorage.setItem('userSession', JSON.stringify(sessionData));
                this.currentUser = user;
                
                return { success: true, user: this.currentUser };
            }
            
            // Production verification
            const response = await fetch(`${CONFIG.API_BASE}/auth/verify-code.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: this.currentEmail, code })
            });
            
            if (response.ok) {
                const result = await response.json();
                sessionStorage.setItem('userSession', JSON.stringify(result));
                this.currentUser = result.user;
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, error: 'Invalid code' };
            }
        } catch (error) {
            console.error('Code verification error:', error);
            return { success: false, error: 'Verification failed' };
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            // Call logout endpoint
            await fetch(`${CONFIG.API_BASE}/auth/logout.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.warn('Logout API call failed:', error);
        }

        // Clear local session
        sessionStorage.removeItem('userSession');
        this.currentUser = null;
        this.currentEmail = null;

        // If Microsoft user, redirect to Microsoft logout
        if (this.microsoftAuth) {
            const logoutUrl = `https://login.microsoftonline.com/${CONFIG.MICROSOFT_TENANT}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
            window.location.href = logoutUrl;
        } else {
            // Refresh page to show login
            window.location.reload();
        }
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Add user to system database
     */
    async addUserToSystemDatabase(user) {
        try {
            const userData = {
                name: user.name,
                email: user.email,
                loginMethod: user.loginMethod || 'microsoft',
                lastLogin: new Date().toISOString(),
                role: user.role || 'user'
            };

            await fetch(`${CONFIG.API_BASE}/users/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
        } catch (error) {
            console.warn('Failed to add user to database:', error);
        }
    }

    /**
     * Helper to get name from email
     */
    getNameFromEmail(email) {
        const names = {
            'daniel@wolthers.com': 'Daniel Wolthers',
            'svenn@wolthers.com': 'Svenn Wolthers',
            'tom@wolthers.com': 'Tom Sullivan',
            'rasmus@wolthers.com': 'Rasmus Wolthers'
        };
        
        return names[email.toLowerCase()] || email.split('@')[0].replace(/[.-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Get user's timezone for login timestamp accuracy
     */
    getUserTimezone() {
        try {
            // Use Intl.DateTimeFormat to get the user's timezone
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (error) {
            console.warn('Failed to detect user timezone:', error);
            // Fallback: try to determine timezone from date offset
            const offset = new Date().getTimezoneOffset();
            const hours = Math.abs(Math.floor(offset / 60));
            const minutes = Math.abs(offset % 60);
            const sign = offset > 0 ? '-' : '+';
            return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Show login step
     */
    showStep1() {
        document.querySelectorAll('.login-step').forEach(step => step.classList.remove('active'));
        document.getElementById('step1').classList.add('active');
        document.getElementById('primaryInput').focus();
    }

    /**
     * Show password step
     */
    showStep2(email) {
        this.currentEmail = email;
        document.querySelectorAll('.login-step').forEach(step => step.classList.remove('active'));
        document.getElementById('step2').classList.add('active');
        document.getElementById('welcomeMessage').innerHTML = `<h3>Welcome back!</h3><p>Enter your password for <strong>${email}</strong></p>`;
        document.getElementById('passwordInput').focus();
    }

    /**
     * Show account creation step
     */
    showStep3(email) {
        this.currentEmail = email;
        document.querySelectorAll('.login-step').forEach(step => step.classList.remove('active'));
        document.getElementById('step3').classList.add('active');
        document.getElementById('emailToConfirm').textContent = email;
        document.getElementById('fullNameInput').focus();
    }

    /**
     * Show one-time code step
     */
    showStep4(email) {
        this.currentEmail = email;
        document.querySelectorAll('.login-step').forEach(step => step.classList.remove('active'));
        document.getElementById('step4').classList.add('active');
        document.getElementById('emailForCode').textContent = email;
        document.getElementById('codeInput').focus();
    }

    /**
     * Navigation helpers
     */
    goBackToStep1() {
        this.currentEmail = null;
        this.showStep1();
    }

    goBackToStep2() {
        if (this.currentEmail) {
            this.showStep2(this.currentEmail);
        } else {
            this.showStep1();
        }
    }
}

// Create and export singleton instance
export const auth = new Auth();

// Export for global access (backwards compatibility)
window.auth = auth;
