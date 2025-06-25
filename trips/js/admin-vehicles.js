/**
 * Vehicle Management Admin JavaScript
 * Handles all vehicle, maintenance, and driver log management functionality
 */

let currentVehicles = [];
let currentMaintenanceLogs = [];
let currentDriverLogs = [];
let currentUsers = [];
let currentTrips = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        await Promise.all([
            loadVehicles(),
            loadUsers(),
            loadTrips()
        ]);
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Load initial data for active tab
        showTab('vehicles');
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showNotification('Failed to load initial data', 'error');
    }
}

function initializeEventListeners() {
    // Vehicle form
    document.getElementById('vehicle-form').addEventListener('submit', handleVehicleSubmit);
    
    // Maintenance form
    document.getElementById('maintenance-form').addEventListener('submit', handleMaintenanceSubmit);
    
    // Driver log form
    document.getElementById('driver-log-form').addEventListener('submit', handleDriverLogSubmit);
    
    // Damage checkbox toggle
    document.getElementById('driver-log-damage').addEventListener('change', function() {
        const damageGroup = document.getElementById('damage-description-group');
        damageGroup.style.display = this.checked ? 'block' : 'none';
    });
    
    // Driver selection auto-fill name
    document.getElementById('driver-log-driver').addEventListener('change', function() {
        const selectedUser = currentUsers.find(u => u.id == this.value);
        if (selectedUser) {
            document.getElementById('driver-log-name').value = selectedUser.name;
        }
    });
    
    // Auto-calculate next revision date
    document.getElementById('vehicle-last-revision').addEventListener('change', calculateNextRevision);
    document.getElementById('vehicle-revision-interval').addEventListener('input', calculateNextRevision);
}

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load data for the selected tab
    switch(tabName) {
        case 'vehicles':
            loadVehicles();
            break;
        case 'maintenance':
            loadMaintenanceLogs();
            populateVehicleSelects();
            break;
        case 'driver-logs':
            loadDriverLogs();
            populateVehicleSelects();
            populateDriverSelects();
            break;
        case 'reports':
            generateReport();
            break;
    }
}

// Vehicle Management
async function loadVehicles() {
    try {
        const response = await fetch('/trips/api/vehicles/manage.php?include_maintenance=true&include_driver_logs=false');
        const data = await response.json();
        
        if (data.success) {
            currentVehicles = data.vehicles;
            displayVehicles(data.vehicles);
            updateVehicleSummary(data.summary);
        } else {
            throw new Error(data.error || 'Failed to load vehicles');
        }
    } catch (error) {
        console.error('Error loading vehicles:', error);
        showNotification('Failed to load vehicles', 'error');
    }
}

function displayVehicles(vehicles) {
    const grid = document.getElementById('vehicle-grid');
    
    if (!vehicles || vehicles.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-light);">No vehicles found</div>';
        return;
    }
    
    grid.innerHTML = vehicles.map(vehicle => createVehicleCard(vehicle)).join('');
}

function createVehicleCard(vehicle) {
    const statusClass = vehicle.status.toLowerCase();
    const statusLabel = vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1);
    
    // Check for alerts
    const alerts = [];
    const warnings = [];
    
    if (vehicle.computed_status === 'insurance_expired') {
        alerts.push('Insurance expired');
    } else if (vehicle.insurance_days_remaining !== null && vehicle.insurance_days_remaining < 30) {
        warnings.push(`Insurance expires in ${vehicle.insurance_days_remaining} days`);
    }
    
    if (vehicle.computed_status === 'revision_overdue') {
        alerts.push('Revision overdue');
    } else if (vehicle.revision_days_remaining !== null && vehicle.revision_days_remaining < 30) {
        warnings.push(`Revision due in ${vehicle.revision_days_remaining} days`);
    }
    
    if (vehicle.computed_status === 'overdue_maintenance') {
        alerts.push('Maintenance overdue');
    }
    
    const alertsHtml = alerts.map(alert => 
        `<div class="alert-item">${alert}</div>`
    ).join('');
    
    const warningsHtml = warnings.map(warning => 
        `<div class="warning-item">${warning}</div>`
    ).join('');
    
    return `
        <div class="vehicle-card ${statusClass}">
            <div class="vehicle-header">
                <h3 class="vehicle-title">${vehicle.make} ${vehicle.model}</h3>
                <span class="vehicle-status status-${statusClass}">${statusLabel}</span>
            </div>
            
            <div class="vehicle-details">
                <div class="detail-item">
                    <span class="detail-label">Year:</span>
                    <span class="detail-value">${vehicle.year || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">License:</span>
                    <span class="detail-value">${vehicle.license_plate || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${vehicle.vehicle_type.toUpperCase()}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Capacity:</span>
                    <span class="detail-value">${vehicle.capacity} people</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${vehicle.location || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Mileage:</span>
                    <span class="detail-value">${vehicle.current_mileage.toLocaleString()} km</span>
                </div>
            </div>
            
            ${alertsHtml}
            ${warningsHtml}
            
            <div class="vehicle-actions">
                <button class="action-btn btn-edit" onclick="editVehicle(${vehicle.id})">Edit</button>
                <button class="action-btn btn-maintenance" onclick="scheduleMaintenanceForVehicle(${vehicle.id})">Maintenance</button>
                <button class="action-btn btn-logs" onclick="viewVehicleLogs(${vehicle.id})">Logs</button>
            </div>
        </div>
    `;
}

function updateVehicleSummary(summary) {
    document.getElementById('total-vehicles').textContent = summary.total || 0;
    document.getElementById('available-vehicles').textContent = summary.available || 0;
    document.getElementById('maintenance-vehicles').textContent = summary.maintenance || 0;
    document.getElementById('retired-vehicles').textContent = summary.retired || 0;
}

// Vehicle Modal Functions
function openVehicleModal(vehicleId = null) {
    const modal = document.getElementById('vehicle-modal');
    const title = document.getElementById('vehicle-modal-title');
    const form = document.getElementById('vehicle-form');
    
    // Reset form
    form.reset();
    document.getElementById('vehicle-id').value = '';
    
    if (vehicleId) {
        title.textContent = 'Edit Vehicle';
        const vehicle = currentVehicles.find(v => v.id == vehicleId);
        if (vehicle) {
            populateVehicleForm(vehicle);
        }
    } else {
        title.textContent = 'Add Vehicle';
    }
    
    modal.style.display = 'block';
}

function populateVehicleForm(vehicle) {
    document.getElementById('vehicle-id').value = vehicle.id;
    document.getElementById('vehicle-make').value = vehicle.make || '';
    document.getElementById('vehicle-model').value = vehicle.model || '';
    document.getElementById('vehicle-year').value = vehicle.year || '';
    document.getElementById('vehicle-license-plate').value = vehicle.license_plate || '';
    document.getElementById('vehicle-type').value = vehicle.vehicle_type || '';
    document.getElementById('vehicle-capacity').value = vehicle.capacity || '';
    document.getElementById('vehicle-status').value = vehicle.status || '';
    document.getElementById('vehicle-location').value = vehicle.location || '';
    document.getElementById('vehicle-color').value = vehicle.color || '';
    document.getElementById('vehicle-fuel-type').value = vehicle.fuel_type || '';
    document.getElementById('vehicle-transmission').value = vehicle.transmission || '';
    document.getElementById('vehicle-engine-size').value = vehicle.engine_size || '';
    document.getElementById('vehicle-vin').value = vehicle.vin || '';
    document.getElementById('vehicle-purchase-date').value = vehicle.purchase_date || '';
    document.getElementById('vehicle-purchase-price').value = vehicle.purchase_price || '';
    document.getElementById('vehicle-mileage').value = vehicle.current_mileage || '';
    document.getElementById('vehicle-insurance-company').value = vehicle.insurance_company || '';
    document.getElementById('vehicle-insurance-policy').value = vehicle.insurance_policy_number || '';
    document.getElementById('vehicle-insurance-start').value = vehicle.insurance_start_date || '';
    document.getElementById('vehicle-insurance-end').value = vehicle.insurance_end_date || '';
    document.getElementById('vehicle-insurance-amount').value = vehicle.insurance_amount || '';
    document.getElementById('vehicle-last-revision').value = vehicle.last_revision_date || '';
    document.getElementById('vehicle-next-revision').value = vehicle.next_revision_due || '';
    document.getElementById('vehicle-revision-interval').value = vehicle.revision_interval_months || 6;
    document.getElementById('vehicle-notes').value = vehicle.notes || '';
}

async function handleVehicleSubmit(e) {
    e.preventDefault();
    
    const vehicleId = document.getElementById('vehicle-id').value;
    const isEdit = vehicleId !== '';
    
    const vehicleData = {
        make: document.getElementById('vehicle-make').value,
        model: document.getElementById('vehicle-model').value,
        year: document.getElementById('vehicle-year').value || null,
        license_plate: document.getElementById('vehicle-license-plate').value,
        vehicle_type: document.getElementById('vehicle-type').value,
        capacity: parseInt(document.getElementById('vehicle-capacity').value),
        status: document.getElementById('vehicle-status').value,
        location: document.getElementById('vehicle-location').value,
        color: document.getElementById('vehicle-color').value,
        fuel_type: document.getElementById('vehicle-fuel-type').value,
        transmission: document.getElementById('vehicle-transmission').value,
        engine_size: document.getElementById('vehicle-engine-size').value,
        vin: document.getElementById('vehicle-vin').value,
        purchase_date: document.getElementById('vehicle-purchase-date').value || null,
        purchase_price: parseFloat(document.getElementById('vehicle-purchase-price').value) || null,
        current_mileage: parseInt(document.getElementById('vehicle-mileage').value) || 0,
        insurance_company: document.getElementById('vehicle-insurance-company').value,
        insurance_policy_number: document.getElementById('vehicle-insurance-policy').value,
        insurance_start_date: document.getElementById('vehicle-insurance-start').value || null,
        insurance_end_date: document.getElementById('vehicle-insurance-end').value || null,
        insurance_amount: parseFloat(document.getElementById('vehicle-insurance-amount').value) || null,
        last_revision_date: document.getElementById('vehicle-last-revision').value || null,
        next_revision_due: document.getElementById('vehicle-next-revision').value || null,
        revision_interval_months: parseInt(document.getElementById('vehicle-revision-interval').value) || 6,
        notes: document.getElementById('vehicle-notes').value
    };
    
    if (isEdit) {
        vehicleData.id = vehicleId;
    }
    
    try {
        const url = '/trips/api/vehicles/manage.php';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vehicleData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            closeModal('vehicle-modal');
            loadVehicles();
        } else {
            throw new Error(result.error || 'Failed to save vehicle');
        }
    } catch (error) {
        console.error('Error saving vehicle:', error);
        showNotification(error.message, 'error');
    }
}

function editVehicle(vehicleId) {
    openVehicleModal(vehicleId);
}

async function deleteVehicle(vehicleId) {
    if (!confirm('Are you sure you want to retire this vehicle? This action will set the vehicle status to "retired".')) {
        return;
    }
    
    try {
        const response = await fetch(`/trips/api/vehicles/manage.php?id=${vehicleId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            loadVehicles();
        } else {
            throw new Error(result.error || 'Failed to delete vehicle');
        }
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        showNotification(error.message, 'error');
    }
}

// Maintenance Management
async function loadMaintenanceLogs() {
    try {
        const response = await fetch('/trips/api/vehicles/maintenance.php');
        const data = await response.json();
        
        if (data.success) {
            currentMaintenanceLogs = data.logs;
            displayMaintenanceLogs(data.logs);
        } else {
            throw new Error(data.error || 'Failed to load maintenance logs');
        }
    } catch (error) {
        console.error('Error loading maintenance logs:', error);
        showNotification('Failed to load maintenance logs', 'error');
    }
}

function displayMaintenanceLogs(logs) {
    const tbody = document.querySelector('#maintenance-table tbody');
    
    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-light);">No maintenance logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.make} ${log.model} (${log.license_plate})</td>
            <td><span class="badge badge-${log.maintenance_type}">${log.maintenance_type}</span></td>
            <td>${log.description}</td>
            <td>${formatDate(log.start_date)}</td>
            <td>${log.end_date ? formatDate(log.end_date) : 'N/A'}</td>
            <td>${log.cost ? '$' + parseFloat(log.cost).toFixed(2) : 'N/A'}</td>
            <td><span class="badge badge-${log.status}">${log.status.replace('_', ' ')}</span></td>
            <td>
                <button class="action-btn btn-edit" onclick="editMaintenanceLog(${log.id})">Edit</button>
                ${log.status !== 'completed' ? `<button class="action-btn btn-delete" onclick="deleteMaintenanceLog(${log.id})">Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function openMaintenanceModal(maintenanceId = null) {
    const modal = document.getElementById('maintenance-modal');
    const title = document.getElementById('maintenance-modal-title');
    const form = document.getElementById('maintenance-form');
    
    // Reset form
    form.reset();
    document.getElementById('maintenance-id').value = '';
    
    if (maintenanceId) {
        title.textContent = 'Edit Maintenance Log';
        const log = currentMaintenanceLogs.find(l => l.id == maintenanceId);
        if (log) {
            populateMaintenanceForm(log);
        }
    } else {
        title.textContent = 'Schedule Maintenance';
    }
    
    modal.style.display = 'block';
}

function scheduleMaintenanceForVehicle(vehicleId) {
    openMaintenanceModal();
    document.getElementById('maintenance-vehicle').value = vehicleId;
}

async function handleMaintenanceSubmit(e) {
    e.preventDefault();
    
    const maintenanceId = document.getElementById('maintenance-id').value;
    const isEdit = maintenanceId !== '';
    
    const maintenanceData = {
        vehicle_id: parseInt(document.getElementById('maintenance-vehicle').value),
        maintenance_type: document.getElementById('maintenance-type').value,
        description: document.getElementById('maintenance-description').value,
        start_date: document.getElementById('maintenance-start-date').value,
        end_date: document.getElementById('maintenance-end-date').value || null,
        cost: parseFloat(document.getElementById('maintenance-cost').value) || null,
        mileage_at_service: parseInt(document.getElementById('maintenance-mileage').value) || null,
        service_provider: document.getElementById('maintenance-provider').value,
        invoice_number: document.getElementById('maintenance-invoice').value,
        parts_replaced: document.getElementById('maintenance-parts').value,
        next_service_due: document.getElementById('maintenance-next-due').value || null,
        status: document.getElementById('maintenance-status').value
    };
    
    if (isEdit) {
        maintenanceData.id = maintenanceId;
    }
    
    try {
        const url = '/trips/api/vehicles/maintenance.php';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(maintenanceData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            closeModal('maintenance-modal');
            loadMaintenanceLogs();
            loadVehicles(); // Refresh vehicles to update status
        } else {
            throw new Error(result.error || 'Failed to save maintenance log');
        }
    } catch (error) {
        console.error('Error saving maintenance log:', error);
        showNotification(error.message, 'error');
    }
}

// Driver Logs Management
async function loadDriverLogs() {
    try {
        const response = await fetch('/trips/api/vehicles/driver-logs.php');
        const data = await response.json();
        
        if (data.success) {
            currentDriverLogs = data.logs;
            displayDriverLogs(data.logs);
        } else {
            throw new Error(data.error || 'Failed to load driver logs');
        }
    } catch (error) {
        console.error('Error loading driver logs:', error);
        showNotification('Failed to load driver logs', 'error');
    }
}

function displayDriverLogs(logs) {
    const tbody = document.querySelector('#driver-logs-table tbody');
    
    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-light);">No driver logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.make} ${log.model} (${log.license_plate})</td>
            <td>${log.driver_name}</td>
            <td>${log.trip_title || 'N/A'}</td>
            <td>${formatDate(log.start_date)}</td>
            <td>${log.end_date ? formatDate(log.end_date) : 'Ongoing'}</td>
            <td>${log.mileage_driven || 0} km</td>
            <td>$${(parseFloat(log.total_expenses) || 0).toFixed(2)}</td>
            <td><span class="badge badge-${log.status}">${log.status.replace('_', ' ')}</span></td>
            <td>
                <button class="action-btn btn-edit" onclick="editDriverLog(${log.id})">Edit</button>
                ${log.status !== 'completed' ? `<button class="action-btn btn-delete" onclick="deleteDriverLog(${log.id})">Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function openDriverLogModal(driverLogId = null) {
    const modal = document.getElementById('driver-log-modal');
    const title = document.getElementById('driver-log-modal-title');
    const form = document.getElementById('driver-log-form');
    
    // Reset form
    form.reset();
    document.getElementById('driver-log-id').value = '';
    
    if (driverLogId) {
        title.textContent = 'Edit Driver Log';
        const log = currentDriverLogs.find(l => l.id == driverLogId);
        if (log) {
            populateDriverLogForm(log);
        }
    } else {
        title.textContent = 'New Driver Log';
    }
    
    modal.style.display = 'block';
}

async function handleDriverLogSubmit(e) {
    e.preventDefault();
    
    const driverLogId = document.getElementById('driver-log-id').value;
    const isEdit = driverLogId !== '';
    
    const driverLogData = {
        vehicle_id: parseInt(document.getElementById('driver-log-vehicle').value),
        driver_user_id: document.getElementById('driver-log-driver').value || null,
        driver_name: document.getElementById('driver-log-name').value,
        trip_id: document.getElementById('driver-log-trip').value || null,
        start_date: document.getElementById('driver-log-start-date').value,
        end_date: document.getElementById('driver-log-end-date').value || null,
        start_mileage: parseInt(document.getElementById('driver-log-start-mileage').value) || null,
        end_mileage: parseInt(document.getElementById('driver-log-end-mileage').value) || null,
        fuel_cost: parseFloat(document.getElementById('driver-log-fuel-cost').value) || null,
        toll_cost: parseFloat(document.getElementById('driver-log-toll-cost').value) || null,
        other_expenses: parseFloat(document.getElementById('driver-log-other-expenses').value) || null,
        route_description: document.getElementById('driver-log-route').value,
        notes: document.getElementById('driver-log-notes').value,
        damage_reported: document.getElementById('driver-log-damage').checked ? 1 : 0,
        damage_description: document.getElementById('driver-log-damage-description').value,
        status: document.getElementById('driver-log-status').value
    };
    
    if (isEdit) {
        driverLogData.id = driverLogId;
    }
    
    try {
        const url = '/trips/api/vehicles/driver-logs.php';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(driverLogData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            closeModal('driver-log-modal');
            loadDriverLogs();
            loadVehicles(); // Refresh vehicles to update mileage
        } else {
            throw new Error(result.error || 'Failed to save driver log');
        }
    } catch (error) {
        console.error('Error saving driver log:', error);
        showNotification(error.message, 'error');
    }
}

// Utility Functions
async function loadUsers() {
    try {
        const response = await fetch('/trips/api/auth/list-users.php');
        const data = await response.json();
        
        if (data.success) {
            currentUsers = data.users;
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadTrips() {
    try {
        const response = await fetch('/trips/api/trips/list.php');
        const data = await response.json();
        
        if (data.success) {
            currentTrips = data.trips;
        }
    } catch (error) {
        console.error('Error loading trips:', error);
    }
}

function populateVehicleSelects() {
    const selects = [
        'maintenance-vehicle',
        'driver-log-vehicle'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Vehicle</option>' + 
                currentVehicles.map(vehicle => 
                    `<option value="${vehicle.id}">${vehicle.make} ${vehicle.model} (${vehicle.license_plate})</option>`
                ).join('');
        }
    });
}

function populateDriverSelects() {
    const select = document.getElementById('driver-log-driver');
    if (select) {
        select.innerHTML = '<option value="">Select Driver</option>' + 
            currentUsers.filter(user => user.role === 'admin' || user.role === 'employee')
                .map(user => 
                    `<option value="${user.id}">${user.name}</option>`
                ).join('');
    }
    
    // Populate trips select
    const tripSelect = document.getElementById('driver-log-trip');
    if (tripSelect) {
        tripSelect.innerHTML = '<option value="">Select Trip (Optional)</option>' + 
            currentTrips.filter(trip => trip.status === 'planned' || trip.status === 'active')
                .map(trip => 
                    `<option value="${trip.id}">${trip.title}</option>`
                ).join('');
    }
}

function calculateNextRevision() {
    const lastRevision = document.getElementById('vehicle-last-revision').value;
    const interval = parseInt(document.getElementById('vehicle-revision-interval').value) || 6;
    
    if (lastRevision) {
        const nextDate = new Date(lastRevision);
        nextDate.setMonth(nextDate.getMonth() + interval);
        document.getElementById('vehicle-next-revision').value = nextDate.toISOString().split('T')[0];
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Filter Functions
function applyFilters() {
    const statusFilter = document.getElementById('status-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const locationFilter = document.getElementById('location-filter').value.toLowerCase();
    
    let filteredVehicles = currentVehicles;
    
    if (statusFilter) {
        filteredVehicles = filteredVehicles.filter(v => v.status === statusFilter);
    }
    
    if (typeFilter) {
        filteredVehicles = filteredVehicles.filter(v => v.vehicle_type === typeFilter);
    }
    
    if (locationFilter) {
        filteredVehicles = filteredVehicles.filter(v => 
            v.location && v.location.toLowerCase().includes(locationFilter)
        );
    }
    
    displayVehicles(filteredVehicles);
}

function clearFilters() {
    document.getElementById('status-filter').value = '';
    document.getElementById('type-filter').value = '';
    document.getElementById('location-filter').value = '';
    displayVehicles(currentVehicles);
}

// Reports
async function generateReport() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    try {
        let url = '/trips/api/vehicles/driver-logs.php';
        if (startDate) url += `?start_date=${startDate}`;
        if (endDate) url += `${startDate ? '&' : '?'}end_date=${endDate}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            updateReportSummary(data.summary);
        }
    } catch (error) {
        console.error('Error generating report:', error);
    }
}

function updateReportSummary(summary) {
    document.getElementById('total-mileage').textContent = (summary.total_mileage || 0).toLocaleString();
    document.getElementById('total-fuel-cost').textContent = '$' + (summary.total_fuel_cost || 0).toFixed(2);
    document.getElementById('active-logs').textContent = summary.active || 0;
    
    // Get maintenance cost separately
    fetch('/trips/api/vehicles/maintenance.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('total-maintenance-cost').textContent = '$' + (data.summary.total_cost || 0).toFixed(2);
            }
        });
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '5px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        maxWidth: '400px',
        backgroundColor: type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'
    });
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Event handlers for specific actions
function editMaintenanceLog(id) {
    openMaintenanceModal(id);
}

function editDriverLog(id) {
    openDriverLogModal(id);
}

function viewVehicleLogs(vehicleId) {
    showTab('driver-logs');
    // Filter by vehicle
    document.getElementById('driver-vehicle-filter').value = vehicleId;
    // Apply filter (you'd need to implement this filtering)
}

async function deleteMaintenanceLog(id) {
    if (!confirm('Are you sure you want to delete this maintenance log?')) {
        return;
    }
    
    try {
        const response = await fetch(`/trips/api/vehicles/maintenance.php?id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            loadMaintenanceLogs();
            loadVehicles();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function deleteDriverLog(id) {
    if (!confirm('Are you sure you want to delete this driver log?')) {
        return;
    }
    
    try {
        const response = await fetch(`/trips/api/vehicles/driver-logs.php?id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            loadDriverLogs();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function populateMaintenanceForm(log) {
    document.getElementById('maintenance-id').value = log.id;
    document.getElementById('maintenance-vehicle').value = log.vehicle_id;
    document.getElementById('maintenance-type').value = log.maintenance_type;
    document.getElementById('maintenance-description').value = log.description;
    document.getElementById('maintenance-start-date').value = log.start_date;
    document.getElementById('maintenance-end-date').value = log.end_date || '';
    document.getElementById('maintenance-cost').value = log.cost || '';
    document.getElementById('maintenance-mileage').value = log.mileage_at_service || '';
    document.getElementById('maintenance-provider').value = log.service_provider || '';
    document.getElementById('maintenance-invoice').value = log.invoice_number || '';
    document.getElementById('maintenance-parts').value = log.parts_replaced || '';
    document.getElementById('maintenance-next-due').value = log.next_service_due || '';
    document.getElementById('maintenance-status').value = log.status;
}

function populateDriverLogForm(log) {
    document.getElementById('driver-log-id').value = log.id;
    document.getElementById('driver-log-vehicle').value = log.vehicle_id;
    document.getElementById('driver-log-driver').value = log.driver_user_id || '';
    document.getElementById('driver-log-name').value = log.driver_name;
    document.getElementById('driver-log-trip').value = log.trip_id || '';
    document.getElementById('driver-log-start-date').value = log.start_date;
    document.getElementById('driver-log-end-date').value = log.end_date || '';
    document.getElementById('driver-log-start-mileage').value = log.start_mileage || '';
    document.getElementById('driver-log-end-mileage').value = log.end_mileage || '';
    document.getElementById('driver-log-fuel-cost').value = log.fuel_cost || '';
    document.getElementById('driver-log-toll-cost').value = log.toll_cost || '';
    document.getElementById('driver-log-other-expenses').value = log.other_expenses || '';
    document.getElementById('driver-log-route').value = log.route_description || '';
    document.getElementById('driver-log-notes').value = log.notes || '';
    document.getElementById('driver-log-damage').checked = log.damage_reported == 1;
    document.getElementById('driver-log-damage-description').value = log.damage_description || '';
    document.getElementById('driver-log-status').value = log.status;
    
    // Toggle damage description visibility
    const damageGroup = document.getElementById('damage-description-group');
    damageGroup.style.display = log.damage_reported == 1 ? 'block' : 'none';
}

// Export functions
function exportData() {
    // This would export all vehicle data to CSV
    console.log('Export functionality would be implemented here');
}

function exportReport() {
    // This would export the current report data
    console.log('Export report functionality would be implemented here');
} 