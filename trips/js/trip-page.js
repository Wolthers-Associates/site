// Trip Page JavaScript - Collapsible Notes with Picture Support

// Initialize notes system when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeTripPage();
});

function initializeTripPage() {
    setupActivityTooltips();
    setupActivityClickHandlers();
    setupNoteCountDisplay();
    setupImageModal();
    loadExistingNotes();
    setupDocumentClickHandler();
    setupCommentForm();
    checkAdminPermissions();
    initializeAdminFeatures();
    setupEditModeToggle();
}

// Admin Permissions and Features
function checkAdminPermissions() {
    // Get current user from session (if available)
    const savedUser = sessionStorage.getItem('mockUser');
    if (savedUser) {
        const currentUser = JSON.parse(savedUser);
        
        // Show admin controls for employees/admins
        if (currentUser.type === 'employee' || currentUser.canAddTrips) {
            const adminControls = document.getElementById('adminControls');
            if (adminControls) {
                adminControls.style.display = 'flex';
            }
        }
    }
}

function initializeAdminFeatures() {
    setupDragAndDrop();
    setupEditModeToggle();
}

function toggleEditMode(enabled) {
    const activities = document.querySelectorAll('.activity');
    
    if (enabled) {
        // Enable edit mode
        activities.forEach(activity => {
            activity.classList.add('edit-mode', 'draggable');
            
            // Add drag handle
            if (!activity.querySelector('.drag-handle')) {
                const dragHandle = document.createElement('div');
                dragHandle.className = 'drag-handle';
                dragHandle.innerHTML = '⋮⋮';
                dragHandle.title = 'Drag to reorder';
                activity.appendChild(dragHandle);
            }
            
            // Make time editable
            makeTimeEditable(activity);
        });
        
        // Add drag and drop listeners
        addDragAndDropListeners();
        
        showNotification('Edit mode enabled - You can now drag activities and edit times', 'info');
    } else {
        // Disable edit mode
        activities.forEach(activity => {
            activity.classList.remove('edit-mode', 'draggable');
            
            // Remove drag handle
            const dragHandle = activity.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.remove();
            }
            
            // Make time non-editable
            makeTimeNonEditable(activity);
        });
        
        // Remove drag and drop listeners
        removeDragAndDropListeners();
        
        showNotification('Edit mode disabled', 'info');
    }
}

function makeTimeEditable(activity) {
    const timeElement = activity.querySelector('.activity-time');
    if (timeElement && !timeElement.isContentEditable) {
        const currentTime = timeElement.textContent;
        
        // Create input element
        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.className = 'edit-time-input';
        timeInput.value = convertToTimeValue(currentTime);
        
        // Replace time span with input
        timeElement.replaceWith(timeInput);
        
        // Handle time change
        timeInput.addEventListener('change', function() {
            const newTime = formatTimeDisplay(this.value);
            updateActivityTime(activity, newTime);
            sendTimeUpdateNotification(activity, currentTime, newTime);
        });
        
        timeInput.addEventListener('blur', function() {
            // Convert back to span if edit mode is still on
            const timeSpan = document.createElement('span');
            timeSpan.className = 'activity-time';
            timeSpan.textContent = formatTimeDisplay(this.value);
            this.replaceWith(timeSpan);
            
            // Re-enable editability if still in edit mode
            setTimeout(() => {
                if (activity.classList.contains('edit-mode')) {
                    makeTimeEditable(activity);
                }
            }, 100);
        });
    }
}

function makeTimeNonEditable(activity) {
    const timeInput = activity.querySelector('.edit-time-input');
    if (timeInput) {
        const timeSpan = document.createElement('span');
        timeSpan.className = 'activity-time';
        timeSpan.textContent = formatTimeDisplay(timeInput.value);
        timeInput.replaceWith(timeSpan);
    }
}

function convertToTimeValue(timeText) {
    // Convert "10:30" format to proper time value
    const cleaned = timeText.replace(/[^\d:]/g, '');
    if (cleaned.match(/^\d{1,2}:\d{2}$/)) {
        return cleaned;
    }
    return '09:00'; // Default fallback
}

function formatTimeDisplay(timeValue) {
    // Convert time input value back to display format
    if (timeValue) {
        return timeValue;
    }
    return '09:00';
}

function updateActivityTime(activity, newTime) {
    // Save the time change to localStorage for persistence
    const activityKey = getActivityKey(activity);
    const savedTimes = JSON.parse(localStorage.getItem('activityTimes') || '{}');
    savedTimes[activityKey] = newTime;
    localStorage.setItem('activityTimes', JSON.stringify(savedTimes));
}

function sendTimeUpdateNotification(activity, oldTime, newTime) {
    const activityText = activity.querySelector('.activity-description').textContent;
    const message = `Time updated for "${activityText.substring(0, 50)}..." from ${oldTime} to ${newTime}`;
    
    // Mock email notification
    console.log('Sending time update notification:', message);
    
    // Send to all trip participants
    setTimeout(() => {
        showNotification('Email notifications sent to all trip participants', 'success');
    }, 1000);
    
    // Mock calendar update
    setTimeout(() => {
        showNotification('Calendar events updated', 'success');
    }, 1500);
}

// Drag and Drop Implementation
function setupDragAndDrop() {
    // Event listeners will be added when edit mode is enabled
}

function addDragAndDropListeners() {
    const activities = document.querySelectorAll('.activity.draggable');
    
    activities.forEach(activity => {
        activity.draggable = true;
        
        activity.addEventListener('dragstart', handleDragStart);
        activity.addEventListener('dragend', handleDragEnd);
        activity.addEventListener('dragover', handleDragOver);
        activity.addEventListener('drop', handleDrop);
        activity.addEventListener('dragenter', handleDragEnter);
        activity.addEventListener('dragleave', handleDragLeave);
    });
}

function removeDragAndDropListeners() {
    const activities = document.querySelectorAll('.activity');
    
    activities.forEach(activity => {
        activity.draggable = false;
        activity.removeEventListener('dragstart', handleDragStart);
        activity.removeEventListener('dragend', handleDragEnd);
        activity.removeEventListener('dragover', handleDragOver);
        activity.removeEventListener('drop', handleDrop);
        activity.removeEventListener('dragenter', handleDragEnter);
        activity.removeEventListener('dragleave', handleDragLeave);
    });
}

let draggedActivity = null;

function handleDragStart(e) {
    draggedActivity = this;
    this.classList.add('dragging');
    
    // Set drag effect
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Remove drag-over class from all activities
    document.querySelectorAll('.activity').forEach(activity => {
        activity.classList.remove('drag-over');
    });
    
    draggedActivity = null;
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedActivity) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedActivity !== this) {
        // Swap the activities
        swapActivities(draggedActivity, this);
    }
    
    this.classList.remove('drag-over');
    return false;
}

function swapActivities(activity1, activity2) {
    // Get the times from both activities
    const time1 = getActivityTime(activity1);
    const time2 = getActivityTime(activity2);
    
    // Get activity descriptions for notification
    const desc1 = activity1.querySelector('.activity-description').textContent.substring(0, 50);
    const desc2 = activity2.querySelector('.activity-description').textContent.substring(0, 50);
    
    // Swap the times
    setActivityTime(activity1, time2);
    setActivityTime(activity2, time1);
    
    // Save the changes
    updateActivityTime(activity1, time2);
    updateActivityTime(activity2, time1);
    
    // Show notification
    showNotification(`Activities swapped: "${desc1}..." ↔ "${desc2}..."`, 'success');
    
    // Send notification email
    const message = `Activity times have been swapped in the itinerary:\n"${desc1}..." is now at ${time2}\n"${desc2}..." is now at ${time1}`;
    sendItineraryUpdateNotification(message);
}

function getActivityTime(activity) {
    const timeElement = activity.querySelector('.activity-time, .edit-time-input');
    if (timeElement.tagName === 'INPUT') {
        return formatTimeDisplay(timeElement.value);
    }
    return timeElement.textContent;
}

function setActivityTime(activity, newTime) {
    const timeElement = activity.querySelector('.activity-time, .edit-time-input');
    if (timeElement.tagName === 'INPUT') {
        timeElement.value = convertToTimeValue(newTime);
    } else {
        timeElement.textContent = newTime;
    }
}

function sendItineraryUpdateNotification(message) {
    console.log('Sending itinerary update notification:', message);
    
    // Mock email sending to all participants
    setTimeout(() => {
        showNotification('Email notifications sent to all trip participants', 'success');
    }, 1000);
    
    // Mock calendar sync
    setTimeout(() => {
        showNotification('Calendar events synchronized', 'success');
    }, 1500);
}

// Override the existing toggleEditMode when edit mode toggle changes
function setupEditModeToggle() {
    const editToggle = document.getElementById('editModeToggle');
    if (editToggle) {
        editToggle.addEventListener('change', function() {
            toggleEditMode(this.checked);
        });
    }
}

// Setup document click handler to collapse activities when clicking outside
function setupDocumentClickHandler() {
    document.addEventListener('click', function(e) {
        // If clicking outside any activity, collapse all
        if (!e.target.closest('.activity')) {
            collapseAllActivities();
        }
    });
}

function collapseAllActivities() {
    const activities = document.querySelectorAll('.activity.expanded');
    activities.forEach(activity => {
        const notesContent = activity.querySelector('.activity-notes, .notes-preview');
        if (notesContent) {
            notesContent.remove();
        }
        activity.classList.remove('expanded');
    });
}

// Enhanced Tooltip System
function setupActivityTooltips() {
    const activities = document.querySelectorAll('.activity');
    
    activities.forEach(activity => {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'activity-tooltip';
        activity.appendChild(tooltip);
        
        // Update tooltip content immediately
        updateTooltipContent(activity, tooltip);
        
        // Show tooltip on hover
        activity.addEventListener('mouseenter', function() {
            updateTooltipContent(activity, tooltip);
            tooltip.classList.add('show');
        });
        
        // Hide tooltip on leave
        activity.addEventListener('mouseleave', function() {
            tooltip.classList.remove('show');
        });
    });
}

function updateTooltipContent(activity, tooltip) {
    const activityKey = getActivityKey(activity);
    const notes = getNotes(activityKey);
    
    // Clear existing content
    tooltip.innerHTML = '';
    
    if (notes && notes.length > 0) {
        // Check if any notes have images
        const hasImages = notes.some(note => note.image);
        
        // Create text span
        const textSpan = document.createElement('span');
        textSpan.textContent = `${notes.length} note${notes.length > 1 ? 's' : ''}`;
        tooltip.appendChild(textSpan);
        
        // Add image indicator if there are images
        if (hasImages) {
            const imageIcon = document.createElement('span');
            imageIcon.className = 'image-indicator';
            imageIcon.textContent = '🖼️';
            tooltip.appendChild(imageIcon);
        }
    } else {
        const textSpan = document.createElement('span');
        textSpan.textContent = 'Add note';
        tooltip.appendChild(textSpan);
    }
}

function positionTooltip(tooltip, event) {
    // Position is now handled by CSS - keeping this function for compatibility
    return;
}

// Enhanced Activity Click Handlers
function setupActivityClickHandlers() {
    const activities = document.querySelectorAll('.activity');
    
    activities.forEach(activity => {
        const activityMain = activity.querySelector('.activity-main');
        
        activityMain.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent document click handler
            
            // Prevent event if clicking on add note button
            if (e.target.closest('.add-note-btn')) {
                return;
            }
            
            // Collapse all other activities first
            const allActivities = document.querySelectorAll('.activity');
            allActivities.forEach(otherActivity => {
                if (otherActivity !== activity) {
                    const otherContent = otherActivity.querySelector('.activity-notes, .notes-preview');
                    if (otherContent) {
                        otherContent.remove();
                    }
                    otherActivity.classList.remove('expanded');
                }
            });
            
            // Toggle current activity
            if (activity.classList.contains('expanded')) {
                // Collapse if already expanded
                const existingContent = activity.querySelector('.activity-notes, .notes-preview');
                if (existingContent) {
                    existingContent.remove();
                }
                activity.classList.remove('expanded');
            } else {
                // Expand with appropriate content
                const activityKey = getActivityKey(activity);
                const notes = getNotes(activityKey);
                
                if (notes && notes.length > 0) {
                    // Show notes preview mode
                    showNotesPreview(activity, notes);
                } else {
                    // Show add note form directly
                    showAddNoteForm(activity);
                }
            }
        });
    });
}

function showNotesPreview(activity, notes) {
    // Remove any existing preview or expanded content
    const existingContent = activity.querySelector('.notes-preview, .activity-notes');
    if (existingContent) {
        existingContent.remove();
    }
    
    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'notes-preview';
    
    // Add preview items for each note
    notes.forEach((note, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'notes-preview-item';
        previewItem.textContent = note.content.split('\n')[0].substring(0, 80) + '...';
        
        previewItem.addEventListener('click', function(e) {
            e.stopPropagation();
            showFullNotes(activity, notes, index);
        });
        
        previewContainer.appendChild(previewItem);
    });
    
    // Add "Add Note" button at bottom
    const addNoteBottom = document.createElement('div');
    addNoteBottom.className = 'add-note-bottom';
    addNoteBottom.textContent = '+ Add Note';
    addNoteBottom.addEventListener('click', function(e) {
        e.stopPropagation();
        showAddNoteForm(activity);
    });
    
    previewContainer.appendChild(addNoteBottom);
    activity.appendChild(previewContainer);
    
    // Mark as expanded for CSS styling
    activity.classList.add('expanded');
}

function showFullNotes(activity, notes, focusIndex = 0) {
    // Remove preview mode
    const previewContainer = activity.querySelector('.notes-preview');
    if (previewContainer) {
        previewContainer.remove();
    }
    
    // Create full notes container
    const notesContainer = document.createElement('div');
    notesContainer.className = 'activity-notes';
    
    const notesList = document.createElement('div');
    notesList.className = 'notes-list';
    
    notes.forEach((note, index) => {
        const noteCard = createNoteCard(note, index, getActivityKey(activity));
        if (index === focusIndex) {
            noteCard.classList.add('expanded');
        }
        notesList.appendChild(noteCard);
    });
    
    notesContainer.appendChild(notesList);
    
    // Add "Add Note" button at bottom
    const addNoteBottom = document.createElement('div');
    addNoteBottom.className = 'add-note-bottom';
    addNoteBottom.textContent = '+ Add Note';
    addNoteBottom.addEventListener('click', function(e) {
        e.stopPropagation();
        showAddNoteForm(activity);
    });
    
    notesContainer.appendChild(addNoteBottom);
    activity.appendChild(notesContainer);
    activity.classList.add('expanded');
}

function showAddNoteForm(activity) {
    // Remove any existing content
    const existingContent = activity.querySelector('.notes-preview, .activity-notes');
    if (existingContent) {
        existingContent.remove();
    }
    
    // Create notes container if it doesn't exist
    let notesContainer = activity.querySelector('.activity-notes');
    if (!notesContainer) {
        notesContainer = document.createElement('div');
        notesContainer.className = 'activity-notes';
        activity.appendChild(notesContainer);
    }
    
    // Create note input form
    const inputContainer = document.createElement('div');
    inputContainer.className = 'note-input-container';
    
    inputContainer.innerHTML = `
        <textarea class="note-input" placeholder="Add your note here..." rows="3"></textarea>
        <div class="note-attachment-section">
            <button type="button" class="note-attachment-btn">
                📎 Attach Picture
            </button>
            <input type="file" class="note-attachment-input" accept="image/*" style="display: none;">
            <div class="attachment-preview" style="margin-top: 5px; display: none;">
                <img class="attachment-image" style="max-width: 100px; height: auto; border-radius: 4px;">
            </div>
        </div>
        <div class="note-actions">
            <button class="save-note-btn">Save</button>
            <button class="cancel-note-btn">Cancel</button>
        </div>
    `;
    
    // Setup attachment functionality
    const attachBtn = inputContainer.querySelector('.note-attachment-btn');
    const attachInput = inputContainer.querySelector('.note-attachment-input');
    const attachPreview = inputContainer.querySelector('.attachment-preview');
    const attachImage = inputContainer.querySelector('.attachment-image');
    
    attachBtn.addEventListener('click', () => attachInput.click());
    
    attachInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                attachImage.src = e.target.result;
                attachPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Setup save/cancel handlers
    const saveBtn = inputContainer.querySelector('.save-note-btn');
    const cancelBtn = inputContainer.querySelector('.cancel-note-btn');
    const textarea = inputContainer.querySelector('.note-input');
    
    saveBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const content = textarea.value.trim();
        if (content) {
            const noteData = {
                content: content,
                author: 'Daniel Wolthers', // Mock user
                timestamp: new Date().toISOString(),
                image: attachImage.src || null
            };
            
            saveNote(getActivityKey(activity), noteData);
            refreshActivityNotes(activity);
            updateNoteCount(activity);
            updateActivityTooltip(activity);
        }
    });
    
    cancelBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        refreshActivityNotes(activity);
    });
    
    // Prevent clicks inside the form from bubbling up
    inputContainer.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    notesContainer.appendChild(inputContainer);
    activity.classList.add('expanded');
    
    // Focus textarea
    textarea.focus();
}

function refreshActivityNotes(activity) {
    const activityKey = getActivityKey(activity);
    const notes = getNotes(activityKey);
    
    // Remove any existing notes content
    const existingContent = activity.querySelector('.activity-notes, .notes-preview');
    if (existingContent) {
        existingContent.remove();
    }
    
    activity.classList.remove('expanded');
    
    // Always show notes if they exist, even after save/cancel
    if (notes && notes.length > 0) {
        showNotesPreview(activity, notes);
    }
}

// Note Count Display System
function setupNoteCountDisplay() {
    const activities = document.querySelectorAll('.activity');
    
    activities.forEach(activity => {
        updateNoteCount(activity);
    });
}

function updateNoteCount(activity) {
    const activityKey = getActivityKey(activity);
    const notes = getNotes(activityKey);
    const timeElement = activity.querySelector('.activity-time');
    
    if (!timeElement) return;
    
    // Remove existing count icon
    const existingIcon = timeElement.querySelector('.note-count-icon');
    if (existingIcon) {
        existingIcon.remove();
    }
    
    // Add count icon if there are notes
    if (notes && notes.length > 0) {
        const countIcon = document.createElement('div');
        countIcon.className = 'note-count-icon';
        countIcon.textContent = notes.length;
        timeElement.appendChild(countIcon);
    }
}

function updateActivityTooltip(activity) {
    const tooltip = activity.querySelector('.activity-tooltip');
    if (tooltip) {
        updateTooltipContent(activity, tooltip);
    }
}

// Note Card Creation
function createNoteCard(note, index, activityKey) {
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';
    
    const previewText = note.content.split('\n')[0].substring(0, 100);
    const hasMore = note.content.length > 100 || note.content.includes('\n');
    
    noteCard.innerHTML = `
        <div class="note-content">
            <div class="note-text-section">
                <div class="note-header">
                    <span class="note-author">${note.author}</span>
                    <span class="note-timestamp">${formatDate(note.timestamp)}</span>
                </div>
                <div class="note-preview">${previewText}${hasMore ? '...' : ''}</div>
                <div class="note-full">${note.content}</div>
            </div>
            ${note.image ? `
                <div class="note-image-section">
                    <img src="${note.image}" alt="Note attachment" class="note-image">
                </div>
            ` : ''}
        </div>
        <button class="delete-note-btn">×</button>
    `;
    
    // Setup click to expand/collapse
    noteCard.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!e.target.closest('.delete-note-btn') && !e.target.closest('.note-image')) {
            noteCard.classList.toggle('expanded');
        }
    });
    
    // Setup image click for modal
    const noteImage = noteCard.querySelector('.note-image');
    if (noteImage) {
        noteImage.addEventListener('click', function(e) {
            e.stopPropagation();
            showImageModal(note.image);
        });
    }
    
    // Setup delete button
    const deleteBtn = noteCard.querySelector('.delete-note-btn');
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Delete this note?')) {
            deleteNote(activityKey, index);
            const activity = document.querySelector(`[data-activity="${activityKey}"]`) || 
                           noteCard.closest('.activity');
            refreshActivityNotes(activity);
            updateNoteCount(activity);
            updateActivityTooltip(activity);
        }
    });
    
    return noteCard;
}

// Image Modal System
function setupImageModal() {
    // Create modal if it doesn't exist
    if (!document.querySelector('.image-modal')) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-content">
                <button class="image-modal-close">&times;</button>
                <img src="" alt="Preview">
            </div>
        `;
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.className === 'image-modal-close') {
                modal.classList.remove('active');
            }
        });
        
        document.body.appendChild(modal);
    }
}

function showImageModal(imageSrc) {
    const modal = document.querySelector('.image-modal');
    const img = modal.querySelector('img');
    img.src = imageSrc;
    modal.classList.add('active');
}

// Utility Functions
function getActivityKey(activity) {
    // Create a unique key based on activity content
    const time = activity.querySelector('.activity-time')?.textContent || '';
    const description = activity.querySelector('.activity-description')?.textContent || '';
    return btoa(time + description).replace(/[^a-zA-Z0-9]/g, '');
}

function getNotes(activityKey) {
    const notes = localStorage.getItem(`trip_notes_${activityKey}`);
    return notes ? JSON.parse(notes) : [];
}

function saveNote(activityKey, noteData) {
    const notes = getNotes(activityKey);
    notes.push(noteData);
    localStorage.setItem(`trip_notes_${activityKey}`, JSON.stringify(notes));
}

function deleteNote(activityKey, noteIndex) {
    const notes = getNotes(activityKey);
    notes.splice(noteIndex, 1);
    if (notes.length > 0) {
        localStorage.setItem(`trip_notes_${activityKey}`, JSON.stringify(notes));
    } else {
        localStorage.removeItem(`trip_notes_${activityKey}`);
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function loadExistingNotes() {
    // Update note counts and tooltips for all activities on page load
    const activities = document.querySelectorAll('.activity');
    
    activities.forEach(activity => {
        updateNoteCount(activity);
        updateActivityTooltip(activity);
    });
    
    // Force update after a short delay to ensure DOM is ready
    setTimeout(() => {
        activities.forEach(activity => {
            updateNoteCount(activity);
        });
    }, 500);
}

// Legacy function cleanup
function initializeNotesSystem() {
    // This function is kept for compatibility but functionality moved to initializeTripPage
}

function toggleNoteInput(button) {
    const activity = button.closest('.activity');
    const container = activity.querySelector('.note-input-container');
    
    if (container.style.display === 'none' || !container.style.display) {
        container.style.display = 'block';
        button.style.opacity = '0.3';
    } else {
        container.style.display = 'none';
        button.style.opacity = '1';
    }
}

function handleImageAttachment(input) {
    const file = input.files[0];
    if (file && file.type.startsWith('image/')) {
        // Show file name
        const btn = input.previousElementSibling;
        btn.textContent = `📎 ${file.name}`;
    }
}

function addTripToCalendar() {
    const events = [];
    
    // Collect all activities
    const activities = document.querySelectorAll('.activity');
    activities.forEach(activity => {
        const timeText = activity.querySelector('.activity-time').textContent;
        const description = activity.querySelector('.activity-description').textContent;
        const dayElement = activity.closest('.day-item');
        const dayTitle = dayElement.querySelector('.day-title').textContent;
        
        events.push({
            start: convertToICalDate(dayTitle, timeText),
            end: convertToICalDate(dayTitle, timeText, 120), // 2 hours duration
            summary: description.substring(0, 50),
            description: description
        });
    });
    
    generateICalFile(events, 'brazil-coffee-tour.ics');
}

function addDayToCalendar(dayNumber) {
    const dayItem = document.querySelector(`.day-item:nth-child(${dayNumber})`);
    if (!dayItem) return;
    
    const dayTitle = dayItem.querySelector('.day-title').textContent;
    const activities = dayItem.querySelectorAll('.activity');
    
    const events = [];
    activities.forEach(activity => {
        const timeText = activity.querySelector('.activity-time').textContent;
        const description = activity.querySelector('.activity-description').textContent;
        
        events.push({
            start: convertToICalDate(dayTitle, timeText),
            end: convertToICalDate(dayTitle, timeText, 120),
            summary: description.substring(0, 50),
            description: description
        });
    });
    
    generateICalFile(events, `day-${dayNumber}-activities.ics`);
}

function convertToICalDate(dayTitle, timeText, durationMinutes = 0) {
    // Parse date from dayTitle (e.g., "Tuesday, July 1st, 2025")
    const dateMatch = dayTitle.match(/(\w+),\s*(\w+)\s*(\d+)\w*,\s*(\d+)/);
    if (!dateMatch) return '';
    
    const [, , month, day, year] = dateMatch;
    const monthNum = new Date(`${month} 1, 2000`).getMonth() + 1;
    
    // Parse time (e.g., "10:00")
    const [hours, minutes] = timeText.split(':').map(Number);
    
    // Create date object
    const date = new Date(parseInt(year), monthNum - 1, parseInt(day), hours, minutes || 0);
    
    // Add duration for end time
    if (durationMinutes > 0) {
        date.setMinutes(date.getMinutes() + durationMinutes);
    }
    
    // Format as iCal datetime (YYYYMMDDTHHMMSSZ)
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Comment Form Functionality
function setupCommentForm() {
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitComment();
        });
        
        // Setup image upload functionality
        setupImageUpload();
    }
}

function setupImageUpload() {
    const imageInput = document.getElementById('commentImages');
    const uploadArea = document.querySelector('.image-upload-area');
    const previewContainer = document.getElementById('imagePreviewContainer');
    
    if (!imageInput || !uploadArea || !previewContainer) return;
    
    // Handle file input change
    imageInput.addEventListener('change', function(e) {
        handleImageSelection(e.target.files);
    });
    
    // Handle drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        handleImageSelection(files);
    });
}

let selectedImages = [];

function handleImageSelection(files) {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    // Add new images to selectedImages array
    imageFiles.forEach(file => {
        if (selectedImages.length < 5) { // Limit to 5 images
            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImages.push({
                    file: file,
                    dataUrl: e.target.result,
                    name: file.name
                });
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        }
    });
}

function updateImagePreview() {
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (!previewContainer) return;
    
    // Clear existing previews
    previewContainer.innerHTML = '';
    
    selectedImages.forEach((image, index) => {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        
        preview.innerHTML = `
            <img src="${image.dataUrl}" alt="${image.name}">
            <button type="button" class="image-preview-remove" onclick="removeSelectedImage(${index})">&times;</button>
        `;
        
        previewContainer.appendChild(preview);
    });
    
    // Update image count indicator
    updateImageCountIndicator();
}

function removeSelectedImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreview();
}

// Make function globally accessible
window.removeSelectedImage = removeSelectedImage;

function updateImageCountIndicator() {
    const uploadArea = document.querySelector('.image-upload-area');
    let indicator = document.querySelector('.image-count-indicator');
    
    if (selectedImages.length > 0) {
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'image-count-indicator';
            uploadArea.parentNode.appendChild(indicator);
        }
        indicator.textContent = `${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''} selected`;
    } else {
        if (indicator) {
            indicator.remove();
        }
    }
}

function submitComment() {
    const form = document.getElementById('commentForm');
    const formData = new FormData(form);
    
    const comment = {
        author: formData.get('authorName'),
        title: formData.get('commentTitle'),
        content: formData.get('commentText'),
        privacy: formData.get('privacy'),
        tripName: 'Brazil Coffee Origins Tour', // This would be dynamic in a real app
        timestamp: new Date().toISOString(),
        images: selectedImages.map(img => ({
            dataUrl: img.dataUrl,
            name: img.name
        }))
    };
    
    // Save to localStorage
    saveComment(comment);
    
    // Show success message
    showSuccessMessage(comment.privacy);
    
    // Reset form and clear images
    form.reset();
    selectedImages = [];
    updateImagePreview();
    
    // If public, auto-refresh journal page (if it's open in another tab)
    if (comment.privacy === 'public') {
        // Trigger a custom event that the journal page can listen for
        localStorage.setItem('new_public_comment', JSON.stringify(comment));
    }
}

function saveComment(comment) {
    const tripKey = 'trip_comments_brazil_coffee_origins'; // This would be dynamic
    const existingComments = JSON.parse(localStorage.getItem(tripKey) || '[]');
    
    existingComments.push(comment);
    localStorage.setItem(tripKey, JSON.stringify(existingComments));
}

function showSuccessMessage(privacy) {
    // Create and show success message
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #2c5530 0%, #4a7c4a 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: 'Source Sans Pro', sans-serif;
        font-weight: 600;
        animation: slideInFromRight 0.5s ease;
        max-width: 350px;
    `;
    
    const message = privacy === 'public' 
        ? 'Comment submitted and published to Coffee Journal!' 
        : 'Comment submitted successfully!';
    
    successMessage.textContent = message;
    document.body.appendChild(successMessage);
    
    // Add CSS animation
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInFromRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutToRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove message after 4 seconds
    setTimeout(() => {
        successMessage.style.animation = 'slideOutToRight 0.5s ease';
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.parentNode.removeChild(successMessage);
            }
        }, 500);
    }, 4000);
} 