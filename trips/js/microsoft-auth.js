/**
 * Microsoft Authentication Module
 * Wolthers & Associates - Trips Platform
 * 
 * Handles Microsoft/Office 365 authentication using Azure AD
 */

class MicrosoftAuth {
    constructor(clientId, tenantId = 'common', redirectUri = null) {
        this.clientId = clientId;
        this.tenantId = tenantId;
        
        // Auto-detect correct redirect URI based on domain
        if (redirectUri) {
            this.redirectUri = redirectUri;
        } else {
            const host = window.location.host;
            if (host.startsWith('trips.')) {
                // trips.wolthers.com subdomain - domain root points to /trips/ folder
                this.redirectUri = `${window.location.origin}/auth-callback.html`;
            } else {
                // wolthers.com/trips subdirectory
                this.redirectUri = `${window.location.origin}/trips/auth-callback.html`;
            }
        }
        
        this.scopes = ['openid', 'profile', 'email', 'User.Read'];
    }

    /**
     * Generate Microsoft OAuth URL
     */
    getAuthUrl() {
        const baseUrl = 'https://login.microsoftonline.com';
        
        // Implicit flow is now enabled in Azure AD
        const useModernFlow = false; // Implicit flow works and is simpler for this setup
        
        if (useModernFlow) {
            // Authorization Code Flow with PKCE (recommended)
            const params = new URLSearchParams({
                client_id: this.clientId,
                response_type: 'code',
                redirect_uri: this.redirectUri,
                scope: this.scopes.join(' '),
                response_mode: 'query',
                state: this.generateState(),
                code_challenge_method: 'S256',
                code_challenge: this.generateCodeChallenge()
            });
            
            return `${baseUrl}/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
        } else {
            // Implicit Flow (requires enabling in Azure AD)
            const params = new URLSearchParams({
                client_id: this.clientId,
                response_type: 'token',
                redirect_uri: this.redirectUri,
                scope: this.scopes.join(' '),
                response_mode: 'fragment',
                state: this.generateState(),
                nonce: this.generateNonce()
            });
            
            return `${baseUrl}/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
        }
    }

    /**
     * Start Microsoft authentication flow
     */
    signIn() {
        const authUrl = this.getAuthUrl();
        
        // Open in popup for better UX
        const popup = window.open(
            authUrl,
            'microsoftAuth',
            'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=no'
        );

        // Monitor popup for completion
        return new Promise((resolve, reject) => {
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    
                    // Give a small delay to ensure session data is stored
                    setTimeout(() => {
                        // Check for stored auth result
                        const authResult = localStorage.getItem('wolthers_auth');
                        console.log('🔍 Popup closed, checking for auth result:', authResult ? 'Found' : 'Not found');
                        
                        if (authResult) {
                            try {
                                const parsed = JSON.parse(authResult);
                                console.log('✅ Auth result parsed successfully:', parsed);
                                resolve(parsed);
                            } catch (error) {
                                console.error('❌ Failed to parse auth result:', error);
                                reject(new Error('Failed to parse authentication result'));
                            }
                        } else {
                            console.warn('⚠️ No auth result found in localStorage');
                            reject(new Error('Authentication was cancelled or failed'));
                        }
                    }, 100); // Small delay to ensure session storage is updated
                }
            }, 1000);

            // Timeout after 5 minutes
            setTimeout(() => {
                clearInterval(checkClosed);
                if (!popup.closed) {
                    popup.close();
                }
                reject(new Error('Authentication timeout'));
            }, 300000);
        });
    }

    /**
     * Check if user is currently authenticated
     */
    isAuthenticated() {
        const authData = localStorage.getItem('wolthers_auth');
        if (!authData) return false;

        try {
            const parsed = JSON.parse(authData);
            const isExpired = Date.now() - parsed.timestamp > 3600000; // 1 hour
            
            if (isExpired) {
                localStorage.removeItem('wolthers_auth');
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get current user data
     */
    getCurrentUser() {
        if (!this.isAuthenticated()) return null;
        
        try {
            const authData = JSON.parse(localStorage.getItem('wolthers_auth'));
            return authData.user;
        } catch {
            return null;
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            // Call logout endpoint
                            await fetch('api/auth/logout.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        } catch (error) {
            console.warn('Logout API call failed:', error);
        }

        // Clear local session data
        localStorage.removeItem('wolthers_auth');
        
        // Redirect to Microsoft logout
        const logoutUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
        window.location.href = logoutUrl;
    }

    /**
     * Generate random state for CSRF protection
     */
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Generate random nonce
     */
    generateNonce() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Generate PKCE code verifier
     */
    generateCodeVerifier() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64URLEncode(array);
    }

    /**
     * Generate PKCE code challenge
     */
    generateCodeChallenge() {
        const codeVerifier = this.generateCodeVerifier();
        sessionStorage.setItem('pkce_code_verifier', codeVerifier);
        
        // For simplicity, we'll use plain method instead of S256
        // In production, implement SHA256 hashing
        return codeVerifier;
    }

    /**
     * Base64 URL encode
     */
    base64URLEncode(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
}

/**
 * Microsoft Sign-In Button Component
 */
class MicrosoftSignInButton {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            theme: options.theme || 'dark', // 'dark' or 'light'
            size: options.size || 'large', // 'small', 'medium', 'large'
            text: options.text || 'Sign in with Microsoft',
            ...options
        };
        
        this.auth = new MicrosoftAuth(options.clientId, options.tenantId);
        this.render();
    }

    render() {
        if (!this.container) {
            console.error('Microsoft Sign-In Button container not found');
            return;
        }

        const button = document.createElement('button');
        button.className = `ms-signin-btn ms-signin-${this.options.theme} ms-signin-${this.options.size}`;
        button.innerHTML = this.getButtonHTML();
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSignIn();
        });

        this.container.appendChild(button);
        this.addStyles();
    }

    getButtonHTML() {
        const microsoftIcon = `
            <svg width="18" height="18" viewBox="0 0 18 18" style="margin-right: 8px;">
                <path fill="#f25022" d="M0 0h8.5v8.5H0z"/>
                <path fill="#00a4ef" d="M9.5 0H18v8.5H9.5z"/>
                <path fill="#7fba00" d="M0 9.5h8.5V18H0z"/>
                <path fill="#ffb900" d="M9.5 9.5H18V18H9.5z"/>
            </svg>
        `;
        
        return `${microsoftIcon}<span>${this.options.text}</span>`;
    }

    addStyles() {
        if (document.getElementById('ms-signin-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'ms-signin-styles';
        styles.textContent = `
            .ms-signin-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border: none;
                border-radius: 4px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
            }
            
            .ms-signin-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            
            .ms-signin-btn:active {
                transform: translateY(0);
            }
            
            /* Dark theme */
            .ms-signin-dark {
                background-color: #2f2f2f;
                color: #ffffff;
                border: 1px solid #2f2f2f;
            }
            
            .ms-signin-dark:hover {
                background-color: #1f1f1f;
            }
            
            /* Light theme */
            .ms-signin-light {
                background-color: #ffffff;
                color: #2f2f2f;
                border: 1px solid #ddd;
            }
            
            .ms-signin-light:hover {
                background-color: #f8f8f8;
            }
            
            /* Sizes */
            .ms-signin-small {
                padding: 6px 12px;
                font-size: 12px;
            }
            
            .ms-signin-medium {
                padding: 8px 16px;
                font-size: 14px;
            }
            
            .ms-signin-large {
                padding: 12px 24px;
                font-size: 16px;
            }
        `;
        
        document.head.appendChild(styles);
    }

    async handleSignIn() {
        try {
            const button = this.container.querySelector('.ms-signin-btn');
            const originalText = button.innerHTML;
            
            // Show loading state
            button.innerHTML = '<span>Signing in...</span>';
            button.disabled = true;
            
            const result = await this.auth.signIn();
            
            // Handle successful sign-in
            if (this.options.onSuccess) {
                this.options.onSuccess(result);
            } else {
                // Default: redirect to trips page
                window.location.href = 'index.html';
            }
            
        } catch (error) {
            console.error('Microsoft sign-in error:', error);
            
            // Reset button
            const button = this.container.querySelector('.ms-signin-btn');
            button.innerHTML = this.getButtonHTML();
            button.disabled = false;
            
            if (this.options.onError) {
                this.options.onError(error);
            } else {
                alert('Sign-in failed: ' + error.message);
            }
        }
    }
}

// Export for use in other scripts
window.MicrosoftAuth = MicrosoftAuth;
window.MicrosoftSignInButton = MicrosoftSignInButton; 