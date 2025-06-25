/**
 * Fleet Management JavaScript - Clean Implementation
 * Handles vehicle management with exact table structure requested
 */

// Sample vehicle data - exactly as requested
const vehicles = [
    {
        id: 1,
        name: "Chevrolet S10",
        year: "2021",
        capacity: "5 people",
        license: "WOL-002",
        mileage: "38,000 km",
        status: "AVAILABLE",
        insurance: "EXPIRED",
        revision: "OVERDUE",
        lastTrip: "None",
        nextTrip: "None Scheduled"
    },
    {
        id: 2,
        name: "Toyota Hilux",
        year: "2020",
        capacity: "5 people",
        license: "WOL-001",
        mileage: "45,230 km",
        status: "MAINTENANCE",
        insurance: "ACTIVE",
        revision: "CURRENT",
        lastTrip: "Brazil Coffee Origins",
        nextTrip: "Guatemala Highlands"
    },
    {
        id: 3,
        name: "Ford Transit",
        year: "2019",
        capacity: "12 people",
        license: "WOL-003",
        mileage: "67,890 km",
        status: "AVAILABLE",
        insurance: "WARNING",
        revision: "WARNING",
        lastTrip: "Colombian Coffee Route",
        nextTrip: "None Scheduled"
    },
    {
        id: 4,
        name: "Honda CR-V",
        year: "2022",
        capacity: "7 people",
        license: "WOL-004",
        mileage: "15,670 km",
        status: "AVAILABLE",
        insurance: "ACTIVE",
        revision: "CURRENT",
        lastTrip: "None",
        nextTrip: "Peru Coffee Expedition"
    },
    {
        id: 5,
        name: "Volkswagen Crafter",
        year: "2018",
        capacity: "15 people",
        license: "WOL-005",
        mileage: "89,450 km",
        status: "RETIRED",
        insurance: "EXPIRED",
        revision: "OVERDUE",
        lastTrip: "Costa Rica Coffee Tour",
        nextTrip: "None Scheduled"
    }
];

// Current filtered vehicles
let filteredVehicles = [...vehicles];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeFleetManagement();
});

/**
 * Initialize Fleet Management
 */
function initializeFleetManagement() {
    console.log('Initializing Fleet Management...');
    
    // Load and display vehicles
    displayFleetTable();
    
    // Initialize event listeners
    initializeEventListeners();
    
    console.log('Fleet Management initialized successfully');
}

/**
 * Initialize Event Listeners
 */
function initializeEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('fleet-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterFleet);
    }
    
    // Filter functionality
    const statusFilter = document.getElementById('status-filter');
    const typeFilter = document.getElementById('type-filter');
    
    if (statusFilter) statusFilter.addEventListener('change', filterFleet);
    if (typeFilter) typeFilter.addEventListener('change', filterFleet);
    
    console.log('Event listeners initialized');
}

/**
 * Display Fleet Table
 */
function displayFleetTable() {
    const tableBody = document.getElementById('fleet-table-body');
    
    if (!tableBody) {
        console.error('Fleet table body not found!');
        return;
    }
    
    // Clear existing content
    tableBody.innerHTML = '';
    
    // Check if we have vehicles to display
    if (!filteredVehicles || filteredVehicles.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <h3>No vehicles found</h3>
                    <p>Try adjusting your search or filters, or add a new vehicle to get started.</p>
                    <button class="btn-add-vehicle" onclick="openAddVehicleModal()">
                        <span>+</span> Add Your First Vehicle
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    // Generate table rows
    filteredVehicles.forEach(vehicle => {
        const row = createVehicleRow(vehicle);
        tableBody.appendChild(row);
    });
    
    console.log(`Displayed ${filteredVehicles.length} vehicles`);
}

/**
 * Create Vehicle Table Row
 */
function createVehicleRow(vehicle) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>
            <div class="vehicle-info">
                <div class="vehicle-name">${vehicle.name}</div>
                <div class="vehicle-year">${vehicle.year}</div>
                <div class="vehicle-capacity">${vehicle.capacity}</div>
            </div>
        </td>
        <td>
            <span class="license-plate">${vehicle.license}</span>
        </td>
        <td>
            <span class="mileage">${vehicle.mileage}</span>
        </td>
        <td>
            <span class="status-badge ${getStatusClass(vehicle.status)}">${vehicle.status}</span>
        </td>
        <td>
            <span class="insurance-badge ${getInsuranceClass(vehicle.insurance)}">${vehicle.insurance}</span>
        </td>
        <td>
            <span class="revision-badge ${getRevisionClass(vehicle.revision)}">${vehicle.revision}</span>
        </td>
        <td>
            <span class="trip-info ${vehicle.lastTrip === 'None' ? 'none' : ''}">${vehicle.lastTrip}</span>
        </td>
        <td>
            <span class="trip-info ${vehicle.nextTrip === 'None Scheduled' ? 'none' : ''}">${vehicle.nextTrip}</span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="action-btn edit" onclick="editVehicle(${vehicle.id})" title="Edit Vehicle">
                    ✏️
                </button>
                <button class="action-btn delete" onclick="deleteVehicle(${vehicle.id})" title="Delete Vehicle">
                    🗑️
                </button>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * Get Status CSS Class
 */
function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'available': return 'status-available';
        case 'maintenance': return 'status-maintenance';
        case 'retired': return 'status-retired';
        default: return 'status-available';
    }
}

/**
 * Get Insurance CSS Class
 */
function getInsuranceClass(insurance) {
    switch(insurance.toLowerCase()) {
        case 'active': return 'insurance-active';
        case 'warning': return 'insurance-warning';
        case 'expired': return 'insurance-expired';
        default: return 'insurance-active';
    }
}

/**
 * Get Revision CSS Class
 */
function getRevisionClass(revision) {
    switch(revision.toLowerCase()) {
        case 'current': return 'revision-current';
        case 'warning': return 'revision-warning';
        case 'overdue': return 'revision-overdue';
        default: return 'revision-current';
    }
}

/**
 * Filter Fleet based on search and filters
 */
function filterFleet() {
    const searchTerm = document.getElementById('fleet-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('status-filter')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('type-filter')?.value.toLowerCase() || '';
    
    filteredVehicles = vehicles.filter(vehicle => {
        // Search filter
        const matchesSearch = !searchTerm || 
            vehicle.name.toLowerCase().includes(searchTerm) ||
            vehicle.license.toLowerCase().includes(searchTerm) ||
            vehicle.year.includes(searchTerm);
        
        // Status filter
        const matchesStatus = !statusFilter || 
            vehicle.status.toLowerCase() === statusFilter;
        
        // Type filter - simplified for demo
        const matchesType = !typeFilter || 
            vehicle.name.toLowerCase().includes(typeFilter);
        
        return matchesSearch && matchesStatus && matchesType;
    });
    
    displayFleetTable();
    console.log(`Filtered to ${filteredVehicles.length} vehicles`);
}

/**
 * Open Add Vehicle Modal
 */
function openAddVehicleModal() {
    console.log('Opening Add Vehicle Modal...');
    
    // For now, show a simple alert - in production this would open a proper modal
    alert('Add Vehicle Modal would open here.\n\nThis would contain a form with:\n- Vehicle details (make, model, year)\n- License plate\n- Capacity\n- Status\n- Insurance information\n- Revision schedule\n- And more...');
}

/**
 * Edit Vehicle
 */
function editVehicle(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
        console.error('Vehicle not found:', vehicleId);
        return;
    }
    
    console.log('Editing vehicle:', vehicle);
    
    // For now, show a simple alert - in production this would open a proper modal
    alert(`Edit Vehicle: ${vehicle.name}\n\nThis would open a modal with the vehicle's current information pre-filled for editing.`);
}

/**
 * Delete Vehicle
 */
function deleteVehicle(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
        console.error('Vehicle not found:', vehicleId);
        return;
    }
    
    // Confirm deletion
    if (confirm(`Are you sure you want to delete ${vehicle.name} (${vehicle.license})?\n\nThis action cannot be undone.`)) {
        // Remove from vehicles array
        const index = vehicles.findIndex(v => v.id === vehicleId);
        if (index > -1) {
            vehicles.splice(index, 1);
            
            // Refresh the filtered list and display
            filterFleet();
            
            console.log('Vehicle deleted:', vehicle.name);
            showNotification(`Vehicle ${vehicle.name} has been deleted successfully.`, 'success');
        }
    }
}

/**
 * Go Back to Dashboard
 */
function goBack() {
    // Navigate back to main trips page
    window.location.href = 'index.html';
}

/**
 * Show Notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#4caf50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            break;
        default:
            notification.style.backgroundColor = '#2196f3';
    }
    
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('fleet-search').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('type-filter').value = '';
    
    filteredVehicles = [...vehicles];
    displayFleetTable();
    
    console.log('Filters cleared');
}

/**
 * Export Fleet Data
 */
function exportFleetData() {
    console.log('Exporting fleet data...');
    
    // Create CSV content
    const headers = ['Fleet', 'Year', 'Capacity', 'License', 'Mileage', 'Status', 'Insurance', 'Revision', 'Last Trip', 'Next Trip'];
    const csvContent = [
        headers.join(','),
        ...filteredVehicles.map(vehicle => [
            `"${vehicle.name}"`,
            vehicle.year,
            `"${vehicle.capacity}"`,
            vehicle.license,
            `"${vehicle.mileage}"`,
            vehicle.status,
            vehicle.insurance,
            vehicle.revision,
            `"${vehicle.lastTrip}"`,
            `"${vehicle.nextTrip}"`
        ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Fleet data exported successfully!', 'success');
}

// Global functions for easy access
window.filterFleet = filterFleet;
window.openAddVehicleModal = openAddVehicleModal;
window.editVehicle = editVehicle;
window.deleteVehicle = deleteVehicle;
window.goBack = goBack;
window.clearFilters = clearFilters;
window.exportFleetData = exportFleetData; 