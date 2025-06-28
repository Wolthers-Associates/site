/**
 * Theme Module
 * Wolthers & Associates - Trips Platform
 * 
 * Handles light/dark theme switching and persistence
 */

export class Theme {
    constructor() {
        this.storageKey = 'wolthers-trips-theme';
        this.currentTheme = null;
        this.toggleButton = null;
        
        this.init();
    }

    /**
     * Initialize theme system
     */
    init() {
        console.log('🎨 Initializing theme system...');
        
        // Load saved theme or detect system preference
        this.loadTheme();
        
        // Setup theme toggle button if it exists
        this.setupThemeToggle();
        
        // Listen for system theme changes
        this.watchSystemTheme();
        
        console.log(`✅ Theme system initialized - Current theme: ${this.currentTheme || 'auto'}`);
    }

    /**
     * Load theme from storage or detect system preference
     */
    loadTheme() {
        // Check for stored theme preference
        const storedTheme = localStorage.getItem(this.storageKey);
        
        if (storedTheme && ['light', 'dark', 'auto'].includes(storedTheme)) {
            this.setTheme(storedTheme);
        } else {
            // Default to auto (system preference)
            this.setTheme('auto');
        }
    }

    /**
     * Set theme and apply to document
     * @param {string} theme - 'light', 'dark', or 'auto'
     */
    setTheme(theme) {
        const validThemes = ['light', 'dark', 'auto'];
        if (!validThemes.includes(theme)) {
            console.warn(`⚠️ Invalid theme: ${theme}. Using 'auto' instead.`);
            theme = 'auto';
        }

        this.currentTheme = theme;
        
        // Save preference
        localStorage.setItem(this.storageKey, theme);
        
        // Apply theme to document
        this.applyTheme(theme);
        
        // Update toggle button state
        this.updateToggleButton();
        
        // Dispatch custom event for other components to listen
        this.dispatchThemeChange(theme);
        
        console.log(`🎨 Theme set to: ${theme}`);
    }

    /**
     * Apply theme to document element
     * @param {string} theme - Theme to apply
     */
    applyTheme(theme) {
        const html = document.documentElement;
        
        // Remove existing theme attributes
        html.removeAttribute('data-theme');
        
        if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
        } else if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        }
        // For 'auto', we don't set data-theme, letting CSS media query handle it
    }

    /**
     * Get current effective theme (resolved from auto)
     * @returns {string} 'light' or 'dark'
     */
    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return this.currentTheme;
    }

    /**
     * Toggle between light and dark themes
     */
    toggle() {
        const effectiveTheme = this.getEffectiveTheme();
        const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Setup theme toggle button
     */
    setupThemeToggle() {
        // Look for theme toggle buttons
        const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => this.toggle());
            this.toggleButton = button; // Keep reference to last one found
        });

        // Auto-create toggle if none exists and we're in the main app
        if (toggleButtons.length === 0 && document.getElementById('mainContainer')) {
            this.createThemeToggle();
        }
    }

    /**
     * Create theme toggle button
     */
    createThemeToggle() {
        const toggle = document.createElement('button');
        toggle.setAttribute('data-theme-toggle', '');
        toggle.className = 'theme-toggle-btn';
        toggle.innerHTML = `
            <span class="theme-icon" data-theme-icon="light">☀️</span>
            <span class="theme-icon" data-theme-icon="dark">🌙</span>
            <span class="theme-icon" data-theme-icon="auto">🔄</span>
        `;
        toggle.title = 'Toggle theme';
        
        // Add CSS for the toggle button
        this.addToggleStyles();
        
        // Find a suitable container (header nav area)
        const headerNav = document.querySelector('.header-nav');
        const adminSettings = document.querySelector('.admin-settings');
        
        if (headerNav) {
            if (adminSettings) {
                // Insert before admin settings
                headerNav.insertBefore(toggle, adminSettings);
            } else {
                // Insert at beginning of header nav
                headerNav.insertBefore(toggle, headerNav.firstChild);
            }
        }
        
        this.toggleButton = toggle;
    }

    /**
     * Add CSS styles for theme toggle button
     */
    addToggleStyles() {
        if (document.getElementById('theme-toggle-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'theme-toggle-styles';
        styles.textContent = `
            .theme-toggle-btn {
                background: var(--bg-secondary, #f8f9fa);
                border: 1px solid var(--border-color, #dee2e6);
                border-radius: var(--radius-md, 6px);
                padding: var(--spacing-sm, 8px);
                cursor: pointer;
                transition: all var(--transition-base, 0.2s ease-in-out);
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                margin-right: var(--spacing-sm, 8px);
            }
            
            .theme-toggle-btn:hover {
                background: var(--bg-hover, #f5f5f5);
                border-color: var(--border-dark, #adb5bd);
                transform: translateY(-1px);
            }
            
            .theme-icon {
                font-size: 18px;
                display: none;
            }
            
            .theme-icon.active {
                display: block;
            }
            
            @media (max-width: 768px) {
                .theme-toggle-btn {
                    width: 36px;
                    height: 36px;
                    margin-right: var(--spacing-xs, 4px);
                }
                
                .theme-icon {
                    font-size: 16px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Update toggle button visual state
     */
    updateToggleButton() {
        if (!this.toggleButton) return;
        
        const icons = this.toggleButton.querySelectorAll('.theme-icon');
        icons.forEach(icon => icon.classList.remove('active'));
        
        const activeIcon = this.toggleButton.querySelector(`[data-theme-icon="${this.currentTheme}"]`);
        if (activeIcon) {
            activeIcon.classList.add('active');
        }
        
        // Update title
        const themeNames = {
            light: 'Light theme',
            dark: 'Dark theme',
            auto: 'Auto theme (follows system)'
        };
        this.toggleButton.title = `Current: ${themeNames[this.currentTheme]}. Click to toggle.`;
    }

    /**
     * Watch for system theme changes
     */
    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                console.log(`🎨 System theme changed to: ${e.matches ? 'dark' : 'light'}`);
                this.dispatchThemeChange('auto');
            }
        });
    }

    /**
     * Dispatch theme change event
     * @param {string} theme - Current theme
     */
    dispatchThemeChange(theme) {
        const effectiveTheme = this.getEffectiveTheme();
        
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: {
                theme: theme,
                effectiveTheme: effectiveTheme
            }
        }));
    }

    /**
     * Get theme preference for API calls or other components
     * @returns {object} Theme information
     */
    getThemeInfo() {
        return {
            current: this.currentTheme,
            effective: this.getEffectiveTheme(),
            isAuto: this.currentTheme === 'auto',
            isDark: this.getEffectiveTheme() === 'dark',
            isLight: this.getEffectiveTheme() === 'light'
        };
    }

    /**
     * Force theme without saving preference (useful for testing)
     * @param {string} theme - Theme to apply
     */
    forceTheme(theme) {
        this.applyTheme(theme);
        this.dispatchThemeChange(theme);
    }

    /**
     * Reset theme to system default
     */
    reset() {
        localStorage.removeItem(this.storageKey);
        this.setTheme('auto');
    }
}

// Global theme instance
let themeInstance = null;

/**
 * Initialize theme system
 * @returns {Theme} Theme instance
 */
export function initTheme() {
    if (!themeInstance) {
        themeInstance = new Theme();
    }
    return themeInstance;
}

/**
 * Get current theme instance
 * @returns {Theme|null} Theme instance or null if not initialized
 */
export function getTheme() {
    return themeInstance;
}

/**
 * Quick theme toggle function for global use
 */
export function toggleTheme() {
    if (themeInstance) {
        themeInstance.toggle();
    }
}

/**
 * Get current theme info
 * @returns {object|null} Theme info or null if not initialized
 */
export function getThemeInfo() {
    return themeInstance ? themeInstance.getThemeInfo() : null;
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

// Export as default for easier importing
export default {
    Theme,
    initTheme,
    getTheme,
    toggleTheme,
    getThemeInfo
}; 