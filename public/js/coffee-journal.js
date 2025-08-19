// Coffee Journal JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeCoffeeJournal();
});

function initializeCoffeeJournal() {
    setupPageAnimations();
    setupFilterAndSort();
    loadJournalEntries();
    setupScrollEffects();
    setupImageGalleryModal();
}

// Page Load Animations
function setupPageAnimations() {
    // Add loaded class to body for animations
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

// Filter and Sort Functionality
function setupFilterAndSort() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortSelect = document.querySelector('.sort-select');

    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            filterEntries(filter);
        });
    });

    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            sortEntries(sortBy);
        });
    }
}

// Filter journal entries
function filterEntries(filter) {
    const entries = document.querySelectorAll('.journal-entry');
    
    entries.forEach(entry => {
        if (filter === 'all' || entry.dataset.trip === filter) {
            entry.style.display = 'block';
            entry.style.animation = 'fadeIn 0.5s ease';
        } else {
            entry.style.display = 'none';
        }
    });
}

// Sort journal entries
function sortEntries(sortBy) {
    const grid = document.getElementById('journalGrid');
    const entries = Array.from(grid.querySelectorAll('.journal-entry'));
    
    entries.sort((a, b) => {
        switch(sortBy) {
            case 'newest':
                return new Date(b.querySelector('.entry-date').textContent) - 
                       new Date(a.querySelector('.entry-date').textContent);
            case 'oldest':
                return new Date(a.querySelector('.entry-date').textContent) - 
                       new Date(b.querySelector('.entry-date').textContent);
            case 'trip':
                return a.querySelector('.trip-name').textContent.localeCompare(
                       b.querySelector('.trip-name').textContent);
            default:
                return 0;
        }
    });
    
    // Re-append sorted entries
    entries.forEach(entry => grid.appendChild(entry));
}

// Load journal entries from localStorage
function loadJournalEntries() {
    const publicComments = getPublicComments();
    const grid = document.getElementById('journalGrid');
    
    // Clear existing sample entries except the first one (keep for demo)
    const existingEntries = grid.querySelectorAll('.journal-entry');
    // Keep the first entry as sample, remove others
    for (let i = 1; i < existingEntries.length; i++) {
        existingEntries[i].remove();
    }
    
    // Add public comments as journal entries
    publicComments.forEach(comment => {
        const entry = createJournalEntry(comment);
        grid.appendChild(entry);
    });

    // Setup load more functionality
    setupLoadMore();
}

// Create journal entry HTML
function createJournalEntry(comment) {
    const entry = document.createElement('article');
    entry.className = 'journal-entry fade-in';
    entry.dataset.trip = getTripSlug(comment.tripName);
    
    const tags = generateTags(comment.content);
    const imagesHtml = createImageGalleryHtml(comment.images);
    
    entry.innerHTML = `
        <div class="entry-header">
            <h3 class="entry-title">${comment.title}</h3>
            <div class="entry-meta">
                <span class="trip-name">${comment.tripName}</span>
                <span class="entry-date">${formatDate(comment.timestamp)}</span>
            </div>
        </div>
        <div class="entry-content">
            <p>${truncateText(comment.content, 200)}</p>
            ${imagesHtml}
        </div>
        <div class="entry-footer">
            <span class="author">— ${comment.author}</span>
            <div class="entry-tags">
                ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
    
    // Add click handlers for images
    setupImageClickHandlers(entry);
    
    return entry;
}

function createImageGalleryHtml(images) {
    if (!images || images.length === 0) return '';
    
    return `
        <div class="entry-images">
            ${images.map((image, index) => `
                <div class="entry-image" data-image-index="${index}">
                    <img src="${image.dataUrl}" alt="${image.name}">
                </div>
            `).join('')}
        </div>
    `;
}

function setupImageClickHandlers(entry) {
    const imageElements = entry.querySelectorAll('.entry-image');
    imageElements.forEach((imageEl, index) => {
        imageEl.addEventListener('click', function() {
            // Get all images from this entry
            const allImages = entry.querySelectorAll('.entry-image img');
            const imageSrcs = Array.from(allImages).map(img => img.src);
            showImageGalleryModal(imageSrcs, index);
        });
    });
}

// Get public comments from localStorage
function getPublicComments() {
    const allComments = [];
    
    // Check all possible trip comment keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trip_comments_')) {
            const comments = JSON.parse(localStorage.getItem(key) || '[]');
            const publicComments = comments.filter(comment => comment.privacy === 'public');
            allComments.push(...publicComments);
        }
    }
    
    // Sort by timestamp (newest first)
    return allComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Helper functions
function getTripSlug(tripName) {
    return tripName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function generateTags(content) {
    const keywords = ['coffee', 'farm', 'processing', 'cupping', 'origin', 'harvest', 'fermentation', 'drying', 'quality', 'sustainability', 'farmers', 'cooperative', 'altitude', 'variety', 'terroir', 'flavor', 'aroma', 'acidity', 'body', 'finish'];
    const foundTags = [];
    
    const lowerContent = content.toLowerCase();
    keywords.forEach(keyword => {
        if (lowerContent.includes(keyword) && foundTags.length < 4) {
            foundTags.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        }
    });
    
    // Add generic tags if none found
    if (foundTags.length === 0) {
        foundTags.push('Coffee', 'Experience');
    }
    
    return foundTags;
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

// Header scroll effects
function setupScrollEffects() {
    const topHeader = document.querySelector('.top-header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            topHeader.classList.add('hidden');
        } else {
            // Scrolling up
            topHeader.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop;
    });
}

// Load more functionality
function setupLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            // In a real app, this would load more entries from the server
            // For now, just show a message
            this.textContent = 'No more stories to load';
            this.disabled = true;
        });
    }
}

// Search functionality (integrated with global search)
function setupSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const entries = document.querySelectorAll('.journal-entry');
            
            entries.forEach(entry => {
                const title = entry.querySelector('.entry-title').textContent.toLowerCase();
                const content = entry.querySelector('.entry-content p').textContent.toLowerCase();
                const author = entry.querySelector('.author').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm) || author.includes(searchTerm)) {
                    entry.style.display = 'block';
                } else {
                    entry.style.display = 'none';
                }
            });
        });
    });
}

// Image Gallery Modal
function setupImageGalleryModal() {
    // Create modal HTML if it doesn't exist
    if (!document.querySelector('.image-gallery-modal')) {
        const modal = document.createElement('div');
        modal.className = 'image-gallery-modal';
        modal.innerHTML = `
            <div class="gallery-modal-content">
                <button class="gallery-modal-close">&times;</button>
                <button class="gallery-nav gallery-prev">&lt;</button>
                <div class="gallery-image-container">
                    <img src="" alt="Gallery Image">
                </div>
                <button class="gallery-nav gallery-next">&gt;</button>
                <div class="gallery-counter">
                    <span class="current-image">1</span> / <span class="total-images">1</span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Setup event listeners
    const modal = document.querySelector('.image-gallery-modal');
    const closeBtn = modal.querySelector('.gallery-modal-close');
    const prevBtn = modal.querySelector('.gallery-prev');
    const nextBtn = modal.querySelector('.gallery-next');
    
    closeBtn.addEventListener('click', closeImageGalleryModal);
    prevBtn.addEventListener('click', () => navigateGallery(-1));
    nextBtn.addEventListener('click', () => navigateGallery(1));
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageGalleryModal();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (modal.classList.contains('active')) {
            if (e.key === 'Escape') closeImageGalleryModal();
            if (e.key === 'ArrowLeft') navigateGallery(-1);
            if (e.key === 'ArrowRight') navigateGallery(1);
        }
    });
}

let currentGalleryImages = [];
let currentImageIndex = 0;

function showImageGalleryModal(imageSrcs, startIndex = 0) {
    currentGalleryImages = imageSrcs;
    currentImageIndex = startIndex;
    
    const modal = document.querySelector('.image-gallery-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    updateGalleryDisplay();
}

function closeImageGalleryModal() {
    const modal = document.querySelector('.image-gallery-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateGallery(direction) {
    currentImageIndex += direction;
    
    if (currentImageIndex < 0) {
        currentImageIndex = currentGalleryImages.length - 1;
    } else if (currentImageIndex >= currentGalleryImages.length) {
        currentImageIndex = 0;
    }
    
    updateGalleryDisplay();
}

function updateGalleryDisplay() {
    const modal = document.querySelector('.image-gallery-modal');
    const img = modal.querySelector('.gallery-image-container img');
    const currentSpan = modal.querySelector('.current-image');
    const totalSpan = modal.querySelector('.total-images');
    
    img.src = currentGalleryImages[currentImageIndex];
    currentSpan.textContent = currentImageIndex + 1;
    totalSpan.textContent = currentGalleryImages.length;
    
    // Hide navigation buttons if only one image
    const prevBtn = modal.querySelector('.gallery-prev');
    const nextBtn = modal.querySelector('.gallery-next');
    const counter = modal.querySelector('.gallery-counter');
    
    if (currentGalleryImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        counter.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
        counter.style.display = 'block';
    }
}

// CSS for entry images
const imageStyles = `
.entry-images {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-top: 15px;
}

.entry-image {
    cursor: pointer;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.entry-image:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.entry-image img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    display: block;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = imageStyles;
document.head.appendChild(styleSheet); 