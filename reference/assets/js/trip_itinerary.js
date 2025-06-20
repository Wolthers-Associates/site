// Trip Itinerary JavaScript
// This file handles calendar generation, timeline updates, and interactive features

function generateICalFile(events, filename) {
    let icalContent = 'BEGIN:VCALENDAR\r\n';
    icalContent += 'VERSION:2.0\r\n';
    icalContent += 'PRODID:-//Wolthers//Coffee Trip//EN\r\n';
    icalContent += 'CALSCALE:GREGORIAN\r\n';
    icalContent += 'METHOD:PUBLISH\r\n';

    events.forEach((event, index) => {
        icalContent += 'BEGIN:VEVENT\r\n';
        icalContent += `UID:${new Date().getTime()}-${index}@wolthers.com\r\n`;
        icalContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
        icalContent += `DTSTART:${event.start}\r\n`;
        icalContent += `DTEND:${event.end}\r\n`;
        icalContent += `SUMMARY:${event.summary}\r\n`;
        icalContent += `DESCRIPTION:${event.description}\r\n`;
        icalContent += 'STATUS:CONFIRMED\r\n';
        icalContent += 'END:VEVENT\r\n';
    });

    icalContent += 'END:VCALENDAR\r\n';

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function downloadDayICal(dateStr) {
    // This function should be customized for each trip
    // eventsByDate should be defined in the individual HTML file
    if (typeof window.eventsByDate === 'undefined') {
        alert('Event data not found. Please ensure eventsByDate is defined in your HTML file.');
        return;
    }

    const events = window.eventsByDate[dateStr] || [];
    if (events.length === 0) {
        alert('No events found for this day');
        return;
    }

    const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    generateICalFile(events, `Coffee_Trip_${formattedDate.replace(/[, ]/g, '_')}.ics`);
}

function downloadICal() {
    // This function should be customized for each trip
    // allEvents should be defined in the individual HTML file
    if (typeof window.allEvents === 'undefined') {
        alert('Event data not found. Please ensure allEvents is defined in your HTML file.');
        return;
    }

    generateICalFile(window.allEvents, 'Coffee_Trip_Complete.ics');
}

function updateTimelineStatus() {
    const now = new Date();
    const days = document.querySelectorAll('.day');
    
    days.forEach(day => {
        const activities = day.querySelectorAll('.activity');
        const dayDateText = day.querySelector('.day-date').textContent;
        const dayDate = parseDateFromText(dayDateText);
        
        if (!dayDate) return;
        
        const isToday = isSameDay(now, dayDate);
        const isPast = dayDate < now && !isToday;
        
        if (isToday) {
            day.classList.add('current');
            day.classList.remove('past');

            let currentActivityFound = false;
            
            activities.forEach(activity => {
                const timeElement = activity.querySelector('.activity-time');
                const timeText = timeElement.textContent;
                const activityDateTime = parseActivityTime(dayDate, timeText);
                
                if (!activityDateTime) return;
                
                const isActivityPast = activityDateTime < now;
                const isCurrentActivity = !currentActivityFound && !isActivityPast;
                
                activity.classList.toggle('past', isActivityPast);
                activity.classList.toggle('current', isCurrentActivity);
                
                if (isCurrentActivity) {
                    currentActivityFound = true;
                }
            });
        } else if (isPast) {
            day.classList.add('past');
            day.classList.remove('current');

            activities.forEach(activity => {
                activity.classList.add('past');
                activity.classList.remove('current');
            });
        } else {
            day.classList.remove('past', 'current');
            activities.forEach(activity => {
                activity.classList.remove('past', 'current');
            });
        }
    });
}

function parseDateFromText(dateText) {
    const months = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3,
        'may': 4, 'june': 5, 'july': 6, 'august': 7,
        'september': 8, 'october': 9, 'november': 10, 'december': 11
    };
    
    // Handle both "July 1st, 2025" and "1st July, 2025" formats
    const match = dateText.match(/(\w+), (\w+) (\d+)\w{2}, (\d+)/) || 
                  dateText.match(/(\w+), (\d+)\w{2} (\w+), (\d+)/);
    
    if (!match) return null;
    
    let month, day, year;
    
    if (dateText.includes(',')) {
        // "Wednesday, July 1st, 2025" format
        month = months[match[2].toLowerCase()];
        day = parseInt(match[3]);
        year = parseInt(match[4]);
    }
    
    if (month === undefined) return null;
    
    return new Date(year, month, day);
}

function parseActivityTime(dayDate, timeText) {
    if (timeText.toLowerCase().includes('all day')) {
        const activityDate = new Date(dayDate);
        activityDate.setHours(9, 0, 0, 0);
        return activityDate;
    }
    
    const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return null;
    
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    
    const activityDate = new Date(dayDate);
    activityDate.setHours(hours, minutes, 0, 0);
    
    return activityDate;
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function addActivityClickEffects() {
    document.querySelectorAll('.activity').forEach(activity => {
        activity.addEventListener('click', function() {
            this.style.transform = 'translateX(10px)';
            setTimeout(() => {
                this.style.transform = 'translateX(5px)';
            }, 150);
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateTimelineStatus();
    addActivityClickEffects();
    
    // Update timeline every minute
    setInterval(updateTimelineStatus, 60000);
    
    // Add print functionality if print button exists
    const printButton = document.querySelector('.print-button');
    if (printButton) {
        printButton.addEventListener('click', function() {
            const header = document.querySelector('.header');
            const map = document.querySelector('.map-container');

            if (header) header.classList.add('print-hide');
            if (map) map.classList.add('print-hide');

            window.print();

            if (header) header.classList.remove('print-hide');
            if (map) map.classList.remove('print-hide');
        });
    }
});

// Utility functions for trip customization
window.TripUtils = {
    // Create event object for calendar
    createEvent: function(summary, start, end, description) {
        return {
            summary: summary,
            start: start,
            end: end,
            description: description
        };
    },
    
    // Format date for iCal (YYYYMMDDTHHMMSS)
    formatDateForICal: function(dateStr, timeStr = '090000') {
        return dateStr.replace(/-/g, '') + 'T' + timeStr;
    },
    
    // Generate events for a full day
    generateDayEvents: function(dateStr, activities) {
        const events = [];
        activities.forEach(activity => {
            const startTime = this.formatDateForICal(dateStr, activity.time.replace(':', '') + '00');
            const endTime = this.formatDateForICal(dateStr, activity.endTime ? activity.endTime.replace(':', '') + '00' : (parseInt(activity.time.replace(':', '')) + 100).toString().padStart(4, '0') + '00');
            
            events.push(this.createEvent(
                activity.title,
                startTime,
                endTime,
                activity.description
            ));
        });
        return events;
    }
};