/**
 * Global Cross-Site Search Utility
 * Works across all pages of the Wolthers & Associates website
 * Usage: Include this file and call initializeGlobalSearch() on any page
 */

class GlobalSearch {
    constructor() {
        this.sitePages = [
            {
                url: 'index.html',
                title: 'Home - Wolthers & Associates',
                description: 'Coffee trading excellence since 1949',
                content: 'Coffee Trading Excellence Since 1949 Wolthers Associates John Wolthers Christian Wolthers Rasmus Wolthers heritage coffee trading Brazil Santos family business 75 years 4 million bags FOB Brokerage Quality Control Sustainable Trading Global Connections Internal Market Origin Services logistics Q Graders laboratories PSS SS testing analysis pre-shipment sample shipment sample risk reduction fast logistics trust building Santos Brazil Buenaventura Colombia Guatemala City Central America'
            },
            {
                url: 'team.html',
                title: 'Our Team - Wolthers & Associates',
                description: 'Meet our global coffee experts',
                content: 'Rasmus Wolthers CEO Chief Executive Officer Christian Wolthers Chairman Daniel Wolthers COO Chief Operating Officer leadership team 3rd generation 2nd generation Svenn Wolthers Partner Labs Marketing Tom Sullivan Senior Trader Edgar Gomes Quality Control Director Anderson Nunes Lab Manager Q Grader Boeri Ferrari Internal Market Broker Natalia Barletta Logistics Santos Brazil team Rhafael Gonçalves Caio Diniz Yara Melo Luciano Corsi Gabriel Oliveira Kamila Nespresso AAA sustainable agriculture Hector Posada Sandra Bonilla Arishay Pulgarin Ana Molina Diana Saavedra Colombia Buenaventura Edgar Guillen Wilson Larias Hector Subuyuj Guatemala Central America quality control'
            },
            {
                url: 'journal.html',
                title: 'Coffee Journal / Viagens / Viajes - Wolthers & Associates',
                description: 'Coffee industry insights and travel stories',
                content: 'coffee journal viagens viajes articles blog news updates specialty coffee industry insights stories origin trips travel experiences market analysis coffee culture sustainability practices quality standards cupping notes farm visits producer profiles'
            },
            {
                url: 'trips/index.html',
                title: 'Coffee Origin Trips - Wolthers & Associates',
                description: 'Explore coffee origins with our expert guides',
                content: 'coffee origin trips Brazil Colombia Guatemala travel experiences farm visits cupping sessions cultural immersion coffee production process specialty tours educational travel coffee tourism origin experiences'
            },
            {
                url: 'trips/accounts.html',
                title: 'Accounts - Coffee Origin Trips',
                description: 'Partner portal for trip bookings',
                content: 'accounts login partner access trip bookings travel arrangements partner portal authentication user management travel coordination booking system'
            },
            {
                url: 'trips/trip-pages/brazil-coffee-origins-tour.html',
                title: 'Brazil Coffee Origins Tour',
                description: 'Comprehensive Brazil coffee experience',
                content: 'Brazil coffee origins tour farm visits Santos São Paulo coffee production experience itinerary accommodation transportation cupping sessions processing facilities specialty coffee estates Brazilian coffee culture'
            }
        ];
        
        this.currentSearchIndex = [];
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        this.createSearchIndex();
        this.addSearchStyles();
        this.isInitialized = true;
        console.log('Global Search initialized successfully');
    }

    createSearchIndex() {
        this.currentSearchIndex = [];
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        
        this.sitePages.forEach(page => {
            const isCurrentPage = this.isCurrentPage(page.url, currentPath, currentPage);
            
            if (isCurrentPage) {
                // Index current page content dynamically
                const content = page.content.toLowerCase();
                const words = content.split(' ').filter(word => word.length > 1);
                words.forEach(word => {
                    if (word.length > 1) {
                        this.currentSearchIndex.push({
                            url: page.url,
                            pageTitle: page.title,
                            description: page.description,
                            content: word,
                            isCurrentPage: true,
                            fullPath: currentPath
                        });
                    }
                });
            }
        });
    }

    isCurrentPage(pageUrl, currentPath, currentPage) {
        // Handle various URL patterns
        if (pageUrl === 'index.html') {
            return currentPage === 'index.html' || currentPage === '' || currentPath === '/' || currentPath.endsWith('/index.html');
        }
        
        if (pageUrl.includes('trips/')) {
            return currentPath.includes('trips/') && pageUrl.includes(currentPage);
        }
        
        return pageUrl.endsWith(currentPage);
    }

    search(query) {
        if (!query || query.length < 2) return [];
        
        const results = [];
        const queryLower = query.toLowerCase();
        const words = queryLower.split(' ').filter(word => word.length > 1);
        const currentPath = window.location.pathname;
        
        // Search all pages
        this.sitePages.forEach(page => {
            const isCurrentPage = this.isCurrentPage(page.url, currentPath);
            let searchContent = page.content.toLowerCase();
            
            // For current page, also include live DOM content
            if (isCurrentPage) {
                const liveContent = this.extractLiveContent();
                if (liveContent) {
                    searchContent = (page.content + ' ' + liveContent).toLowerCase();
                }
            }
            
            let relevance = 0;
            let matches = 0;
            
            // Exact phrase match (highest score)
            if (searchContent.includes(queryLower)) {
                relevance += isCurrentPage ? 100 : 60;
                matches++;
            }
            
            // Individual word matches
            words.forEach(word => {
                const wordMatches = (searchContent.match(new RegExp(word, 'g')) || []).length;
                if (wordMatches > 0) {
                    relevance += (isCurrentPage ? 25 : 15) * wordMatches;
                    matches += wordMatches;
                }
            });
            
            if (matches > 0) {
                results.push({
                    url: page.url,
                    pageTitle: page.title,
                    description: page.description,
                    content: searchContent,
                    isCurrentPage,
                    relevance,
                    matches,
                    snippet: this.createSnippet(searchContent, query, 200)
                });
            }
        });

        // Sort by relevance (current page first, then by score)
        return results
            .sort((a, b) => {
                // Current page results first
                if (a.isCurrentPage && !b.isCurrentPage) return -1;
                if (!a.isCurrentPage && b.isCurrentPage) return 1;
                // Then by relevance
                if (b.relevance !== a.relevance) return b.relevance - a.relevance;
                return b.matches - a.matches;
            })
            .slice(0, 12); // Limit to top 12 results
    }
    
    extractLiveContent() {
        // Extract content from current page DOM
        const selectors = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            '.team-name', '.team-position', '.team-description',
            '.service-card h3', '.service-card p',
            '.location-title', '.location-subtitle',
            '.hero h1', '.hero p',
            'main p', 'section p',
            '.result-title', '.result-description'
        ];
        
        const elements = document.querySelectorAll(selectors.join(', '));
        return Array.from(elements)
            .map(el => el.textContent.trim())
            .filter(text => text.length > 5)
            .join(' ');
    }

    displayResults(results, query) {
        this.clearPreviousResults();
        
        if (results.length === 0) {
            this.showMessage(`No results found for "${query}"`);
            return;
        }

        const overlay = this.createResultsOverlay(results, query);
        document.body.appendChild(overlay);
        this.bindResultsEvents(overlay, results);
    }

    createResultsOverlay(results, query) {
        const overlay = document.createElement('div');
        overlay.className = 'global-search-overlay';
        
        const currentPageResults = results.filter(r => r.isCurrentPage);
        const otherPageResults = results.filter(r => !r.isCurrentPage);
        
        overlay.innerHTML = `
            <div class="global-search-container">
                <div class="global-search-header">
                    <h3>Search Results for "${query}"</h3>
                    <div class="search-stats">${results.length} result${results.length !== 1 ? 's' : ''} found</div>
                    <button class="close-search" aria-label="Close search results">&times;</button>
                </div>
                <div class="global-search-content">
                    ${currentPageResults.length > 0 ? `
                        <div class="search-section">
                            <h4>On this page (${currentPageResults.length})</h4>
                            ${currentPageResults.map(result => this.createResultItem(result, query, true)).join('')}
                        </div>
                    ` : ''}
                    ${otherPageResults.length > 0 ? `
                        <div class="search-section">
                            <h4>Other pages (${otherPageResults.length})</h4>
                            ${otherPageResults.map(result => this.createResultItem(result, query, false)).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        return overlay;
    }

    createResultItem(result, query, isCurrentPage) {
        const highlightedSnippet = this.highlightQuery(result.snippet, query);
        
        return `
            <div class="search-result-item ${isCurrentPage ? 'current-page' : 'other-page'}">
                <div class="result-header">
                    <div class="result-title">${result.pageTitle}</div>
                    ${result.description ? `<div class="result-description">${result.description}</div>` : ''}
                </div>
                <div class="result-snippet">${highlightedSnippet}</div>
                <div class="result-actions">
                    ${isCurrentPage ? 
                        `<button class="scroll-to-top" onclick="window.scrollTo({top: 0, behavior: 'smooth'}); this.closest('.global-search-overlay').remove();">View on this page</button>` :
                        `<a href="${result.url}" class="visit-page">Visit page</a>`
                    }
                    <span class="result-relevance">${result.matches} match${result.matches !== 1 ? 'es' : ''}</span>
                </div>
            </div>
        `;
    }

    createSnippet(content, query, maxLength) {
        const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
        
        if (queryIndex === -1) {
            return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
        }
        
        const start = Math.max(0, queryIndex - 50);
        const end = Math.min(content.length, start + maxLength);
        const snippet = content.substring(start, end);
        
        return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '');
    }

    highlightQuery(text, query) {
        const words = query.split(' ').filter(word => word.length > 1);
        let highlightedText = text;
        
        // Highlight exact phrase first
        const phraseRegex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        highlightedText = highlightedText.replace(phraseRegex, '<mark class="exact-match">$1</mark>');
        
        // Highlight individual words
        words.forEach(word => {
            const wordRegex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
            highlightedText = highlightedText.replace(wordRegex, '<mark class="word-match">$1</mark>');
        });
        
        return highlightedText;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    bindResultsEvents(overlay, results) {
        // Close button
        overlay.querySelector('.close-search').addEventListener('click', () => {
            this.closeResults();
        });

        // Close on outside click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeResults();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    handleKeyboard(e) {
        if (e.key === 'Escape') {
            this.closeResults();
        }
    }

    scrollToElement(element) {
        this.clearHighlights();
        element.classList.add('search-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove highlight after a few seconds
        setTimeout(() => {
            element.classList.remove('search-highlight');
        }, 3000);
    }

    clearHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
        });
    }

    clearPreviousResults() {
        document.querySelectorAll('.global-search-overlay').forEach(el => el.remove());
        this.clearHighlights();
    }

    closeResults() {
        this.clearPreviousResults();
        document.removeEventListener('keydown', this.handleKeyboard.bind(this));
    }

    showMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'global-search-message';
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    addSearchStyles() {
        if (document.getElementById('global-search-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'global-search-styles';
        style.textContent = `
            .global-search-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.75);
                z-index: 10000;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding: 80px 20px 20px;
                overflow-y: auto;
            }

            .global-search-container {
                background: white;
                border-radius: 12px;
                max-width: 900px;
                width: 100%;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                animation: searchSlideIn 0.3s ease-out;
            }

            @keyframes searchSlideIn {
                from { transform: translateY(-30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .global-search-header {
                padding: 25px 30px;
                background: linear-gradient(135deg, #2c5530 0%, #4a7c4a 100%);
                color: white;
                border-radius: 12px 12px 0 0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 10px;
            }

            .global-search-header h3 {
                margin: 0;
                font-size: 1.3rem;
                font-weight: 600;
            }

            .search-stats {
                font-size: 0.9rem;
                opacity: 0.9;
            }

            .close-search {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s ease;
            }

            .close-search:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .global-search-content {
                padding: 0;
                max-height: calc(85vh - 100px);
                overflow-y: auto;
            }

            .search-section {
                border-bottom: 1px solid #eee;
            }

            .search-section:last-child {
                border-bottom: none;
            }

            .search-section h4 {
                background: #f8f9fa;
                margin: 0;
                padding: 15px 30px;
                font-size: 1rem;
                font-weight: 600;
                color: #2c5530;
                border-bottom: 1px solid #eee;
            }

            .search-result-item {
                padding: 20px 30px;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s ease;
                cursor: pointer;
            }

            .search-result-item:hover {
                background-color: #f8f9fa;
            }

            .search-result-item:last-child {
                border-bottom: none;
            }

            .search-result-item.current-page {
                border-left: 4px solid #d4af37;
            }

            .search-result-item.other-page {
                border-left: 4px solid #2c5530;
            }

            .result-header {
                margin-bottom: 10px;
            }

            .result-title {
                font-weight: 600;
                color: #2c5530;
                font-size: 1.1rem;
                margin-bottom: 4px;
            }

            .result-description {
                color: #666;
                font-size: 0.9rem;
                font-style: italic;
            }

            .result-snippet {
                color: #333;
                line-height: 1.5;
                margin-bottom: 15px;
                font-size: 0.95rem;
            }

            .result-snippet mark.exact-match {
                background-color: rgba(212, 175, 55, 0.6);
                padding: 2px 4px;
                border-radius: 3px;
                font-weight: 600;
            }

            .result-snippet mark.word-match {
                background-color: rgba(212, 175, 55, 0.3);
                padding: 1px 2px;
                border-radius: 2px;
            }

            .result-actions {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 10px;
            }

            .scroll-to-top,
            .visit-page {
                background: #2c5530;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                text-decoration: none;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.2s ease;
                display: inline-block;
            }

            .scroll-to-top:hover,
            .visit-page:hover {
                background: #1a3d1e;
                transform: translateY(-1px);
            }

            .result-relevance {
                color: #666;
                font-size: 0.8rem;
            }

            .search-highlight {
                background-color: rgba(212, 175, 55, 0.4) !important;
                padding: 4px 6px !important;
                border-radius: 4px !important;
                transition: background-color 0.3s ease !important;
                box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2) !important;
            }

            .global-search-message {
                position: fixed;
                top: 120px;
                right: 20px;
                background: #2c5530;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 10001;
                animation: slideInRight 0.3s ease-out;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @media (max-width: 768px) {
                .global-search-overlay {
                    padding: 60px 10px 10px;
                }
                
                .global-search-header {
                    padding: 20px;
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .global-search-header h3 {
                    font-size: 1.1rem;
                }
                
                .search-section h4,
                .search-result-item {
                    padding-left: 20px;
                    padding-right: 20px;
                }
                
                .result-actions {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .global-search-message {
                    right: 10px;
                    left: 10px;
                    top: 80px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Initialize global search function
function initializeGlobalSearch() {
    const globalSearch = new GlobalSearch();
    globalSearch.init();
    
    // Setup search inputs
    const setupSearchInput = (searchInput, searchBtn) => {
        if (!searchInput || !searchBtn) return;
        
        const performSearch = () => {
            const query = searchInput.value.trim();
            if (!query || query.length < 2) {
                globalSearch.clearPreviousResults();
                return;
            }
            
            const results = globalSearch.search(query);
            globalSearch.displayResults(results, query);
        };
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Real-time search feedback
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    const results = globalSearch.search(query);
                    // Visual feedback for available results
                    searchInput.style.borderColor = results.length > 0 ? '#d4af37' : '#ccc';
                } else {
                    searchInput.style.borderColor = '#ccc';
                    globalSearch.clearPreviousResults();
                }
            }, 300);
        });
    };

    // Setup search for both header and footer
    setupSearchInput(
        document.querySelector('.search-input'),
        document.querySelector('.search-btn')
    );

    setupSearchInput(
        document.querySelector('.footer-search-input'),
        document.querySelector('.footer-search-btn')
    );
    
    console.log('Global search initialized for cross-site functionality');
    return globalSearch;
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGlobalSearch);
} else {
    initializeGlobalSearch();
} 