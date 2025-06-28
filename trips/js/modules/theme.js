/**
 * Theme Management Module
 * Handles light/dark theme switching and persistence
 * Supports 'light', 'dark', and 'auto' modes
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'auto';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.isInitialized = false;
    }

    /**
     * Initialize the theme system
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('🎨 Initializing theme system...');
        
        // Set initial theme
        this.applyTheme(this.currentTheme);
        
        // Watch for system theme changes
        this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
        
        // Create theme toggle button if container exists
        this.createThemeToggle();
        
        this.isInitialized = true;
        
        // Emit theme initialized event
        this.emitThemeChange('initialized');
        
        console.log('🎨 Theme system initialized with theme:', this.currentTheme);
    }

    /**
     * Get theme from localStorage
     */
    getStoredTheme() {
        try {
            return localStorage.getItem('preferred-theme');
        } catch (e) {
            console.warn('Could not access localStorage for theme preference');
            return null;
        }
    }

    /**
     * Store theme preference
     */
    storeTheme(theme) {
        try {
            localStorage.setItem('preferred-theme', theme);
        } catch (e) {
            console.warn('Could not save theme preference to localStorage');
        }
    }

    /**
     * Get the effective theme (resolves 'auto' to actual theme)
     */
    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.mediaQuery.matches ? 'dark' : 'light';
        }
        return this.currentTheme;
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        const effectiveTheme = theme === 'auto' 
            ? (this.mediaQuery.matches ? 'dark' : 'light')
            : theme;

        // Set data-theme attribute on document element
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        
        // Also set on body for backwards compatibility
        document.body.setAttribute('data-theme', effectiveTheme);
        
        // Update theme meta tag for mobile browsers
        this.updateThemeColorMeta(effectiveTheme);
        
        this.currentTheme = theme;
    }

    /**
     * Update theme-color meta tag for mobile browsers
     */
    updateThemeColorMeta(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        // Set appropriate theme color
        const themeColors = {
            light: '#ffffff',
            dark: '#181c1f'
        };
        
        metaThemeColor.content = themeColors[theme] || themeColors.light;
    }

    /**
     * Switch to specific theme
     */
    setTheme(theme) {
        if (!['light', 'dark', 'auto'].includes(theme)) {
            console.error('Invalid theme:', theme);
            return;
        }

        this.applyTheme(theme);
        this.storeTheme(theme);
        this.updateToggleButton();
        this.emitThemeChange(theme);
        
        console.log('🎨 Theme changed to:', theme);
    }

    /**
     * Cycle through themes: light -> dark -> auto -> light
     */
    cycleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    /**
     * Handle system theme preference changes
     */
    handleSystemThemeChange() {
        if (this.currentTheme === 'auto') {
            this.applyTheme('auto');
            this.emitThemeChange('auto');
        }
    }

    /**
     * Create theme toggle button
     */
    createThemeToggle() {
        // Look for existing theme toggle container
        let container = document.getElementById('themeToggle');
        
        if (!container) {
            // Look for alternative containers
            container = document.querySelector('[data-theme-toggle-container]') ||
                       document.querySelector('.theme-toggle') ||
                       document.querySelector('.theme-controls');
        }

        if (!container) {
            console.log('🎨 No theme toggle container found, skipping toggle creation');
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Create toggle button
        const button = document.createElement('button');
        button.className = 'fluent-btn fluent-btn-icon theme-toggle-btn';
        button.title = 'Toggle theme';
        button.setAttribute('aria-label', 'Toggle theme');
        
        // Add click handler
        button.addEventListener('click', () => {
            this.cycleTheme();
        });

        // Add to container
        container.appendChild(button);
        
        // Update button content
        this.updateToggleButton();
        
        console.log('🎨 Theme toggle button created');
    }

    /**
     * Update theme toggle button appearance
     */
    updateToggleButton() {
        const button = document.querySelector('.theme-toggle-btn');
        if (!button) return;

        const icons = {
            light: '☀️',
            dark: '🌙', 
            auto: '🔄'
        };

        const labels = {
            light: 'Switch to dark mode',
            dark: 'Switch to auto mode', 
            auto: 'Switch to light mode'
        };

        button.innerHTML = icons[this.currentTheme] || icons.auto;
        button.title = labels[this.currentTheme] || labels.auto;
        button.setAttribute('aria-label', labels[this.currentTheme] || labels.auto);
        
        // Add theme class for styling
        button.className = `fluent-btn fluent-btn-icon theme-toggle-btn theme-${this.currentTheme}`;
    }

    /**
     * Emit theme change event
     */
    emitThemeChange(theme) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: theme,
                effectiveTheme: this.getEffectiveTheme(),
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(event);
        document.dispatchEvent(event);
    }

    /**
     * Get current theme info
     */
    getThemeInfo() {
        return {
            current: this.currentTheme,
            effective: this.getEffectiveTheme(),
            systemPrefersDark: this.mediaQuery.matches,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Force refresh of theme application
     */
    refresh() {
        this.applyTheme(this.currentTheme);
        this.updateToggleButton();
    }
}

// Create global instance
const themeManager = new ThemeManager();

// Auto-initialize on DOM content loaded if not already done
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!themeManager.isInitialized) {
            themeManager.init();
        }
    });
} else {
    // DOM already loaded
    if (!themeManager.isInitialized) {
        themeManager.init();
    }
}

// Export for both ES6 modules and global access
export { themeManager as ThemeManager };
export default themeManager;

// Also make available globally for non-module scripts
window.ThemeManager = themeManager;

// Legacy function exports for backwards compatibility
export function initTheme() {
    return themeManager.init();
}

export function setTheme(theme) {
    return themeManager.setTheme(theme);
}

export function getThemeInfo() {
    return themeManager.getThemeInfo();
}

// Console logging for debugging
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🎨 Theme module loaded');
    
    // Add debug commands to window for testing
    window.debugTheme = {
        info: () => themeManager.getThemeInfo(),
        setLight: () => themeManager.setTheme('light'),
        setDark: () => themeManager.setTheme('dark'),
        setAuto: () => themeManager.setTheme('auto'),
        cycle: () => themeManager.cycleTheme(),
        refresh: () => themeManager.refresh()
    };
} 