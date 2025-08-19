/**
 * Automatic Timezone Update Module
 * Wolthers & Associates - Trips Platform
 * 
 * Automatically detects and updates user timezone data during normal site usage
 * No fresh login required - works in the background
 */

class AutoTimezoneUpdate {
    constructor() {
        this.lastTimezoneCheck = localStorage.getItem('lastTimezoneCheck');
        this.checkInterval = 60 * 60 * 1000; // Check every hour
        this.isRunning = false;
    }

    /**
     * Initialize automatic timezone updates
     */
    init() {
        console.log('🌍 Initializing automatic timezone updates...');
        
        // Run immediately on page load
        this.checkAndUpdateTimezone();
        
        // Set up periodic checks
        setInterval(() => {
            this.checkAndUpdateTimezone();
        }, this.checkInterval);
        
        // Also check when page becomes visible (user returns to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkAndUpdateTimezone();
            }
        });
    }

    /**
     * Check and update user timezone if needed
     */
    async checkAndUpdateTimezone() {
        if (this.isRunning) {
            return; // Prevent concurrent runs
        }

        try {
            this.isRunning = true;
            
            // Get current user from session
            const currentUser = this.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                console.log('🌍 No logged-in user found, skipping timezone update');
                return;
            }

            // Get user's current timezone
            const currentTimezone = this.getUserTimezone();
            if (!currentTimezone) {
                console.warn('🌍 Could not detect user timezone');
                return;
            }

            // Check if we've checked recently
            const now = Date.now();
            if (this.lastTimezoneCheck && (now - this.lastTimezoneCheck < this.checkInterval)) {
                return; // Don't check too frequently
            }

            console.log(`🌍 Checking timezone for user ${currentUser.id}: ${currentTimezone}`);

            // Send timezone update to backend
            const response = await fetch('api/update-user-timezone.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    timezone: currentTimezone
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.timezone_updated) {
                    console.log('✅ Timezone updated successfully:', result.timezone_updated);
                    
                    // Show subtle notification if significant change
                    if (result.timezone_updated.local_time_corrected) {
                        this.showTimezoneUpdateNotification(result.timezone_updated);
                    }
                } else {
                    console.log('🌍 Timezone already correct:', result.current_timezone);
                }
                
                // Update last check time
                this.lastTimezoneCheck = now;
                localStorage.setItem('lastTimezoneCheck', now.toString());
                
            } else {
                const error = await response.json();
                console.warn('🌍 Timezone update failed:', error.message);
            }

        } catch (error) {
            console.warn('🌍 Timezone update error:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Get current user from session storage or auth module
     */
    getCurrentUser() {
        try {
            // Try to get from auth module first
            if (window.auth && window.auth.getCurrentUser) {
                const user = window.auth.getCurrentUser();
                if (user) return user;
            }

            // Fallback to session storage
            const session = sessionStorage.getItem('userSession');
            if (session) {
                const userData = JSON.parse(session);
                return userData.user;
            }

            return null;
        } catch (error) {
            console.warn('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Get user's timezone using various methods
     */
    getUserTimezone() {
        try {
            // Primary method: Intl.DateTimeFormat
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timezone && timezone !== 'UTC') {
                return timezone;
            }

            // Fallback method: calculate from offset
            const offset = new Date().getTimezoneOffset();
            const hours = Math.abs(Math.floor(offset / 60));
            const minutes = Math.abs(offset % 60);
            const sign = offset > 0 ? '-' : '+';
            return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
        } catch (error) {
            console.warn('Failed to detect timezone:', error);
            return null;
        }
    }

    /**
     * Show subtle notification about timezone update
     */
    showTimezoneUpdateNotification(updateInfo) {
        // Create a subtle, temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 300px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        
        notification.innerHTML = `
            <strong>🌍 Timezone Updated</strong><br>
            Login times now show in your local timezone<br>
            <small>From: ${updateInfo.from} → To: ${updateInfo.to}</small>
        `;
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);
        
        // Fade out and remove after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    /**
     * Force timezone update check (can be called manually)
     */
    async forceUpdate() {
        this.lastTimezoneCheck = null;
        localStorage.removeItem('lastTimezoneCheck');
        await this.checkAndUpdateTimezone();
    }
}

// Create singleton instance
const autoTimezoneUpdate = new AutoTimezoneUpdate();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        autoTimezoneUpdate.init();
    });
} else {
    autoTimezoneUpdate.init();
}

// Export for manual access
window.autoTimezoneUpdate = autoTimezoneUpdate;

export default autoTimezoneUpdate; 