// Global state
let properties = JSON.parse(localStorage.getItem('properties')) || [];
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let payments = JSON.parse(localStorage.getItem('payments')) || [];
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let currentPropertyImages = [];
let currentCustomerPhoto = null;
let currentDate = new Date();
let selectedDate = null;
let cameraStream = null;
let currentTab = 'dashboard';

// Comprehensive amenities list
const AMENITIES_LIST = [
    'WiFi', 'Air Conditioning', 'Swimming Pool', 'Garden', 'Parking', 'Kitchen',
    'Washing Machine', 'TV', 'Refrigerator', 'Microwave', 'Balcony', 'Terrace',
    'Gym', 'Elevator', 'Security', 'CCTV', 'Generator', 'Water Heater',
    'Dining Area', 'Living Room', 'Study Room', 'Prayer Room', 'Store Room',
    'Servant Quarter', 'Power Backup', 'Water Supply', 'Intercom', 'Doorbell',
    'Modular Kitchen', 'Wardrobes', 'Ceiling Fan', 'Lights', 'Curtains',
    'Sofa Set', 'Dining Table', 'Bed', 'Mattress', 'Pillows', 'Blankets',
    'Towels', 'Utensils', 'Gas Stove', 'Water Purifier', 'Iron', 'Hair Dryer',
    'First Aid Kit', 'Fire Extinguisher', 'Smoke Detector', 'Garden Furniture',
    'BBQ Area', 'Jacuzzi', 'Sauna', 'Steam Room', 'Tennis Court', 'Badminton Court',
    'Children Play Area', 'Pet Friendly', 'Wheelchair Accessible', 'Beach Access',
    'Mountain View', 'City View', 'Lake View', 'Forest View', 'Sunrise View',
    'Sunset View', 'Private Entrance', 'Concierge Service', 'Housekeeping'
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupPWA();
    checkSharedProperty();
    setMinimumDates();
});

function initializeApp() {
    switchTab('dashboard');
    updateDashboardStats();
    renderPropertiesGrid();
    renderBookingsTable();
    renderPaymentsTable();
    renderCustomersGrid();
    renderBookingHistory();
    renderCalendar();
    populateSelects();
    generateAmenitiesGrid();
    setDefaultDates();
    populateLocationFilters();
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Modal controls
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeAllModals);
    });

    // Click outside modal to close
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Global search (dashboard only)
    document.getElementById('globalSearch').addEventListener('input', handleGlobalSearch);
    document.getElementById('globalSearch').addEventListener('focus', showGlobalSearchDropdown);

    // Tab-specific searches
    document.getElementById('inventorySearch').addEventListener('input', handleInventorySearch);
    document.getElementById('bookingsSearch').addEventListener('input', handleBookingsSearch);
    document.getElementById('customersSearch').addEventListener('input', handleCustomersSearch);
    document.getElementById('paymentsSearch').addEventListener('input', handlePaymentsSearch);

    // Property management
    document.getElementById('addPropertyBtn').addEventListener('click', () => {
        openAddPropertyModal();
    });
    document.getElementById('addPropertyFromInventory').addEventListener('click', () => {
        openAddPropertyModal();
    });

    // Share all properties
    document.getElementById('shareAllPropertiesBtn').addEventListener('click', () => {
        openShareAllPropertiesModal();
    });

    // Customer management
    document.getElementById('addCustomerBtn').addEventListener('click', () => {
        openAddCustomerModal();
    });

    // Customer photo management
    document.getElementById('uploadPhotoBtn').addEventListener('click', () => {
        document.getElementById('customerPhotoInput').click();
    });
    document.getElementById('customerPhotoInput').addEventListener('change', handleCustomerPhotoUpload);
    document.getElementById('capturePhotoBtn').addEventListener('click', openCamera);
    document.getElementById('removeCustomerPhoto').addEventListener('click', removeCustomerPhoto);
    document.getElementById('captureBtn').addEventListener('click', capturePhoto);

    // Booking management
    document.getElementById('addBookingBtn').addEventListener('click', () => {
        openAddBookingModal();
    });
    document.getElementById('addBookingFromCalendar').addEventListener('click', () => {
        openAddBookingModal();
    });

    // Customer search in booking
    document.getElementById('customerSearchInput').addEventListener('input', handleCustomerSearch);
    document.getElementById('customerSearchInput').addEventListener('focus', showCustomerSearchDropdown);

    // Payment management
    document.getElementById('recordPaymentBtn').addEventListener('click', () => {
        openModal('recordPaymentModal');
        populatePaymentBookingSelect();
    });

    // Forms
    document.getElementById('addPropertyForm').addEventListener('submit', handleAddProperty);
    document.getElementById('addCustomerForm').addEventListener('submit', handleAddCustomer);
    document.getElementById('addBookingForm').addEventListener('submit', handleAddBooking);
    document.getElementById('editBookingForm').addEventListener('submit', handleEditBooking);
    document.getElementById('recordPaymentForm').addEventListener('submit', handleRecordPayment);

    // Image upload
    document.getElementById('propertyImages').addEventListener('change', handleImageUpload);

    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Filters
    document.getElementById('propertyFilter').addEventListener('change', renderCalendar);
    document.getElementById('categoryFilter').addEventListener('change', applyInventoryFilters);
    document.getElementById('typeFilter').addEventListener('change', applyInventoryFilters);
    document.getElementById('locationFilter').addEventListener('change', applyInventoryFilters);
    document.getElementById('priceMinFilter').addEventListener('input', applyInventoryFilters);
    document.getElementById('priceMaxFilter').addEventListener('input', applyInventoryFilters);
    document.getElementById('availabilityFilter').addEventListener('change', applyInventoryFilters);

    // Pricing type selection
    document.querySelectorAll('input[name="pricingType"]').forEach(radio => {
        radio.addEventListener('change', handlePricingTypeChange);
    });

    // Amenities selection
    document.getElementById('selectAllAmenities').addEventListener('click', selectAllAmenities);
    document.getElementById('deselectAllAmenities').addEventListener('click', deselectAllAmenities);

    // Auto description generator
    document.getElementById('generateDescriptionBtn').addEventListener('click', generateDescription);

    // Booking form calculations
    const bookingForm = document.getElementById('addBookingForm');
    const checkInInput = bookingForm.querySelector('input[name="checkIn"]');
    const checkOutInput = bookingForm.querySelector('input[name="checkOut"]');
    const negotiatedRateInput = bookingForm.querySelector('input[name="negotiatedRate"]');
    const guestsInput = bookingForm.querySelector('input[name="guests"]');

    [checkInInput, checkOutInput, negotiatedRateInput].forEach(input => {
        input.addEventListener('change', calculateBookingTotal);
    });

    // Date validation
    checkInInput.addEventListener('change', validateBookingDates);
    checkOutInput.addEventListener('change', validateBookingDates);

    guestsInput.addEventListener('change', checkGuestLimit);

    // Property selection in booking form
    document.getElementById('bookingPropertySelect').addEventListener('change', handlePropertySelection);

    // Share functionality
    document.getElementById('copyLinkBtn').addEventListener('click', copyShareLink);
    document.getElementById('copyAllLinkBtn').addEventListener('click', copyAllPropertiesLink);

    // Report generation
    document.getElementById('generateReport').addEventListener('click', generateReport);

    // History filtering
    document.getElementById('filterHistory').addEventListener('click', filterBookingHistory);
    document.getElementById('shareHistory').addEventListener('click', shareBookingHistory);

    // Calendar day modal
    document.getElementById('addBookingForDay').addEventListener('click', () => {
        closeAllModals();
        openAddBookingModal();
        if (selectedDate) {
            const checkInInput = document.querySelector('input[name="checkIn"]');
            checkInInput.value = selectedDate;
            validateBookingDates();
            calculateBookingTotal();
        }
    });

    // Click outside search dropdowns to close
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.global-search')) {
            hideGlobalSearchDropdown();
        }
        if (!e.target.closest('.searchable-customer-select')) {
            hideCustomerSearchDropdown();
        }
    });

    // Edit booking date validation
    const editCheckInInput = document.getElementById('editCheckInDate');
    const editCheckOutInput = document.getElementById('editCheckOutDate');
    if (editCheckInInput && editCheckOutInput) {
        editCheckInInput.addEventListener('change', validateEditBookingDates);
        editCheckOutInput.addEventListener('change', validateEditBookingDates);
    }
}

// Tab switching with search bar management
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    // Show/hide search bars and share button
    hideAllSearchBars();
    hideShareAllButton();
    
    if (tabName === 'dashboard') {
        document.getElementById('globalSearchContainer').style.display = 'block';
    } else if (tabName === 'inventory') {
        document.getElementById('inventorySearchContainer').style.display = 'block';
        document.getElementById('shareAllPropertiesBtn').style.display = 'flex';
    } else if (tabName === 'bookings') {
        document.getElementById('bookingsSearchContainer').style.display = 'block';
    } else if (tabName === 'customers') {
        document.getElementById('customersSearchContainer').style.display = 'block';
    } else if (tabName === 'payments') {
        document.getElementById('paymentsSearchContainer').style.display = 'block';
    }

    // Load tab content
    switch(tabName) {
        case 'dashboard':
            updateDashboardStats();
            break;
        case 'calendar':
            renderCalendar();
            break;
        case 'inventory':
            renderPropertiesGrid();
            break;
        case 'bookings':
            renderBookingsTable();
            break;
        case 'customers':
            renderCustomersGrid();
            break;
        case 'booking-history':
            renderBookingHistory();
            break;
        case 'payments':
            renderPaymentsTable();
            break;
        case 'reports':
            generateReport();
            break;
    }
}

function hideAllSearchBars() {
    document.getElementById('globalSearchContainer').style.display = 'none';
    document.getElementById('inventorySearchContainer').style.display = 'none';
    document.getElementById('bookingsSearchContainer').style.display = 'none';
    document.getElementById('customersSearchContainer').style.display = 'none';
    document.getElementById('paymentsSearchContainer').style.display = 'none';
}

function hideShareAllButton() {
    document.getElementById('shareAllPropertiesBtn').style.display = 'none';
}

// Set minimum dates for booking inputs
function setMinimumDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkInDate').min = today;
    document.getElementById('checkOutDate').min = today;
    
    if (document.getElementById('editCheckInDate')) {
        document.getElementById('editCheckInDate').min = today;
        document.getElementById('editCheckOutDate').min = today;
    }
}

// Enhanced Global Search Functions (Dashboard only)
function handleGlobalSearch() {
    const query = document.getElementById('globalSearch').value.toLowerCase().trim();
    const dropdown = document.getElementById('searchDropdown');
    
    if (query.length < 1) {
        hideGlobalSearchDropdown();
        return;
    }
    
    const results = performGlobalSearch(query);
    displayGlobalSearchResults(results, query);
    showGlobalSearchDropdown();
}

function performGlobalSearch(query) {
    const results = [];
    
    // Search Properties
    properties.forEach(property => {
        if (property.name.toLowerCase().includes(query) || 
            property.location.toLowerCase().includes(query) ||
            property.type.toLowerCase().includes(query) ||
            property.category.toLowerCase().includes(query)) {
            results.push({
                type: 'property',
                id: property.id,
                title: property.name,
                meta: `${property.type} in ${property.location} - ${property.category}`,
                data: property
            });
        }
    });
    
    // Search Customers
    customers.forEach(customer => {
        if (customer.name.toLowerCase().includes(query) || 
            customer.phone.includes(query) ||
            (customer.email && customer.email.toLowerCase().includes(query))) {
            const customerBookings = bookings.filter(b => b.customerId === customer.id);
            results.push({
                type: 'customer',
                id: customer.id,
                title: customer.name,
                meta: `${customer.phone} - ${customerBookings.length} bookings`,
                data: customer
            });
        }
    });
    
    // Search Bookings
    bookings.forEach(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        if (booking.guestName.toLowerCase().includes(query) ||
            booking.guestPhone.includes(query) ||
            booking.id.toLowerCase().includes(query) ||
            (property && property.name.toLowerCase().includes(query))) {
            results.push({
                type: 'booking',
                id: booking.id,
                title: `${booking.guestName} - ${property ? property.name : 'Unknown Property'}`,
                meta: `${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)} - ${formatCurrency(booking.totalAmount)}`,
                data: booking
            });
        }
    });
    
    // Search Payments
    payments.forEach(payment => {
        const booking = bookings.find(b => b.id === payment.bookingId);
        const property = booking ? properties.find(p => p.id === booking.propertyId) : null;
        if (payment.id.toLowerCase().includes(query) ||
            (booking && booking.guestName.toLowerCase().includes(query)) ||
            (property && property.name.toLowerCase().includes(query))) {
            results.push({
                type: 'payment',
                id: payment.id,
                title: `Payment ${payment.id.substr(-6).toUpperCase()}`,
                meta: `${formatCurrency(payment.amount)} - ${payment.method} - ${booking ? booking.guestName : 'Unknown'}`,
                data: payment
            });
        }
    });
    
    return results.slice(0, 10);
}

function displayGlobalSearchResults(results, query) {
    const dropdown = document.getElementById('searchDropdown');
    
    if (results.length === 0) {
        dropdown.innerHTML = '<div class="no-search-results">No results found</div>';
        return;
    }
    
    dropdown.innerHTML = results.map(result => {
        const highlightedTitle = highlightSearchTerm(result.title, query);
        const highlightedMeta = highlightSearchTerm(result.meta, query);
        
        return `
            <div class="search-result" onclick="handleGlobalSearchSelect('${result.type}', '${result.id}')">
                <div class="search-result-type">${result.type}</div>
                <div class="search-result-title">${highlightedTitle}</div>
                <div class="search-result-meta">${highlightedMeta}</div>
            </div>
        `;
    }).join('');
}

function highlightSearchTerm(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function handleGlobalSearchSelect(type, id) {
    hideGlobalSearchDropdown();
    document.getElementById('globalSearch').value = '';
    
    switch(type) {
        case 'property':
            switchTab('inventory');
            setTimeout(() => {
                const propertyCard = document.querySelector(`[data-property-id="${id}"]`);
                if (propertyCard) {
                    propertyCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    propertyCard.style.outline = '3px solid #219EBC';
                    setTimeout(() => { propertyCard.style.outline = 'none'; }, 3000);
                }
            }, 100);
            break;
        case 'customer':
            switchTab('customers');
            setTimeout(() => {
                const customerCard = document.querySelector(`[data-customer-id="${id}"]`);
                if (customerCard) {
                    customerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    customerCard.style.outline = '3px solid #219EBC';
                    setTimeout(() => { customerCard.style.outline = 'none'; }, 3000);
                }
            }, 100);
            break;
        case 'booking':
            switchTab('bookings');
            viewBookingDetails(id);
            break;
        case 'payment':
            switchTab('payments');
            viewPaymentDetails(id);
            break;
    }
}

function showGlobalSearchDropdown() {
    document.getElementById('searchDropdown').style.display = 'block';
}

function hideGlobalSearchDropdown() {
    document.getElementById('searchDropdown').style.display = 'none';
}

// Tab-specific search functions
function handleInventorySearch() {
    const query = document.getElementById('inventorySearch').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.property-card');
    
    cards.forEach(card => {
        const propertyId = card.getAttribute('data-property-id');
        const property = properties.find(p => p.id === propertyId);
        
        if (!property) {
            card.style.display = 'none';
            return;
        }
        
        const searchText = `${property.name} ${property.location} ${property.type} ${property.category}`.toLowerCase();
        
        if (query === '' || searchText.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function handleBookingsSearch() {
    const query = document.getElementById('bookingsSearch').value.toLowerCase().trim();
    const rows = document.querySelectorAll('#bookingsTable tr');
    
    rows.forEach(row => {
        if (row.querySelector('.no-data')) return;
        
        const bookingId = row.getAttribute('data-booking-id');
        const booking = bookings.find(b => b.id === bookingId);
        
        if (!booking) {
            row.style.display = 'none';
            return;
        }
        
        const property = properties.find(p => p.id === booking.propertyId);
        const searchText = `${booking.guestName} ${booking.guestPhone} ${booking.id} ${property ? property.name : ''}`.toLowerCase();
        
        if (query === '' || searchText.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function handleCustomersSearch() {
    const query = document.getElementById('customersSearch').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.customer-card');
    
    cards.forEach(card => {
        const customerId = card.getAttribute('data-customer-id');
        const customer = customers.find(c => c.id === customerId);
        
        if (!customer) {
            card.style.display = 'none';
            return;
        }
        
        const searchText = `${customer.name} ${customer.phone} ${customer.email || ''}`.toLowerCase();
        
        if (query === '' || searchText.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function handlePaymentsSearch() {
    const query = document.getElementById('paymentsSearch').value.toLowerCase().trim();
    const rows = document.querySelectorAll('#paymentsTable tr');
    
    rows.forEach(row => {
        if (row.querySelector('.no-data')) return;
        
        const paymentId = row.getAttribute('data-payment-id');
        const payment = payments.find(p => p.id === paymentId);
        
        if (!payment) {
            row.style.display = 'none';
            return;
        }
        
        const booking = bookings.find(b => b.id === payment.bookingId);
        const property = booking ? properties.find(p => p.id === booking.propertyId) : null;
        const searchText = `${payment.id} ${booking ? booking.guestName : ''} ${property ? property.name : ''} ${payment.method}`.toLowerCase();
        
        if (query === '' || searchText.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Details view functions
function viewStatDetails(type) {
    switch(type) {
        case 'properties':
            switchTab('inventory');
            break;
        case 'bookings':
            switchTab('bookings');
            break;
        case 'customers':
            switchTab('customers');
            break;
        case 'revenue':
            switchTab('payments');
            break;
    }
}

function viewPropertyDetails(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const images = property.images && property.images.length > 0 ? property.images : ['https://via.placeholder.com/600x400?text=No+Image'];
    
    document.getElementById('propertyDetailsTitle').textContent = property.name;
    document.getElementById('propertyDetailsContent').innerHTML = `
        <div class="details-section">
            <h4>Property Images</h4>
            <div class="property-details-images">
                ${images.map(img => `<img src="${img}" alt="${property.name}" onclick="window.open('${img}', '_blank')">`).join('')}
            </div>
        </div>
        
        <div class="details-section">
            <h4>Basic Information</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Property Name</label>
                    <div class="value">${property.name}</div>
                </div>
                <div class="detail-item">
                    <label>Type</label>
                    <div class="value">${property.type}</div>
                </div>
                <div class="detail-item">
                    <label>Category</label>
                    <div class="value">${property.category.replace('-', ' ')}</div>
                </div>
                <div class="detail-item">
                    <label>Location</label>
                    <div class="value">${property.location}</div>
                </div>
                <div class="detail-item">
                    <label>Max Guests</label>
                    <div class="value">${property.maxGuests}</div>
                </div>
                <div class="detail-item">
                    <label>Bedrooms</label>
                    <div class="value">${property.bedrooms || 'N/A'}</div>
                </div>
            </div>
        </div>
        
        <div class="details-section">
            <h4>Pricing</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Pricing Type</label>
                    <div class="value">${property.pricingType === 'weekly' ? 'Weekday/Weekend' : 'Uniform'}</div>
                </div>
                ${property.pricingType === 'weekly' ? `
                    <div class="detail-item">
                        <label>Weekday Price</label>
                        <div class="value">${formatCurrency(property.weekdayPrice)}</div>
                    </div>
                    <div class="detail-item">
                        <label>Weekend Price</label>
                        <div class="value">${formatCurrency(property.weekendPrice)}</div>
                    </div>
                ` : `
                    <div class="detail-item">
                        <label>Daily Price</label>
                        <div class="value">${formatCurrency(property.uniformPrice || property.basePrice)}</div>
                    </div>
                `}
            </div>
        </div>
        
        ${property.description ? `
            <div class="details-section">
                <h4>Description</h4>
                <p>${property.description}</p>
            </div>
        ` : ''}
        
        ${property.amenities && property.amenities.length > 0 ? `
            <div class="details-section">
                <h4>Amenities</h4>
                <div class="property-amenities">
                    ${property.amenities.map(amenity => `<span class="amenity-tag">${amenity}</span>`).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="details-section">
            <h4>Actions</h4>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="shareProperty('${property.id}')">
                    <i class="fas fa-share"></i> Share Property
                </button>
                <button class="btn btn-success" onclick="bookProperty('${property.id}')">
                    <i class="fas fa-calendar-plus"></i> Book Property
                </button>
                <button class="btn btn-warning" onclick="editProperty('${property.id}')">
                    <i class="fas fa-edit"></i> Edit Property
                </button>
                <button class="btn btn-danger" onclick="deleteProperty('${property.id}')">
                    <i class="fas fa-trash"></i> Delete Property
                </button>
            </div>
        </div>
    `;
    
    openModal('propertyDetailsModal');
}

function viewBookingDetails(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const property = properties.find(p => p.id === booking.propertyId);
    const customer = customers.find(c => c.id === booking.customerId);
    const bookingPayments = payments.filter(p => p.bookingId === bookingId);
    const balance = booking.totalAmount - booking.paidAmount;
    
    document.getElementById('bookingDetailsTitle').textContent = `Booking ${booking.id.substr(-6).toUpperCase()}`;
    document.getElementById('bookingDetailsContent').innerHTML = `
        <div class="details-section">
            <h4>Booking Information</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Booking ID</label>
                    <div class="value">${booking.id.substr(-6).toUpperCase()}</div>
                </div>
                <div class="detail-item">
                    <label>Status</label>
                    <div class="value"><span class="status-badge status-${booking.status}">${booking.status}</span></div>
                </div>
                <div class="detail-item">
                    <label>Customer Type</label>
                    <div class="value">${booking.isNewCustomer ? 'New Customer' : 'Existing Customer'}</div>
                </div>
                <div class="detail-item">
                    <label>Created On</label>
                    <div class="value">${formatDate(booking.createdAt)}</div>
                </div>
            </div>
        </div>
        
        <div class="details-section">
            <h4>Property Details</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Property Name</label>
                    <div class="value">${property ? property.name : 'Unknown Property'}</div>
                </div>
                <div class="detail-item">
                    <label>Location</label>
                    <div class="value">${property ? property.location : 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>Property Type</label>
                    <div class="value">${property ? property.type : 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>Category</label>
                    <div class="value">${property ? property.category.replace('-', ' ') : 'N/A'}</div>
                </div>
            </div>
        </div>
        
        <div class="details-section">
            <h4>Guest Information</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Guest Name</label>
                    <div class="value">${booking.guestName}</div>
                </div>
                <div class="detail-item">
                    <label>Phone Number</label>
                    <div class="value">${booking.guestPhone}</div>
                </div>
                <div class="detail-item">
                    <label>Email</label>
                    <div class="value">${booking.guestEmail || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>Number of Guests</label>
                    <div class="value">${booking.guests}</div>
                </div>
            </div>
        </div>
        
        <div class="details-section">
            <h4>Stay Details</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Check-in Date</label>
                    <div class="value">${formatDate(booking.checkIn)}</div>
                </div>
                <div class="detail-item">
                    <label>Check-out Date</label>
                    <div class="value">${formatDate(booking.checkOut)}</div>
                </div>
                <div class="detail-item">
                    <label>Duration</label>
                    <div class="value">${booking.days} days, ${booking.nights} nights</div>
                </div>
                <div class="detail-item">
                    <label>Daily Rate</label>
                    <div class="value">${formatCurrency(booking.negotiatedRate)}</div>
                </div>
            </div>
        </div>
        
        <div class="details-section">
            <h4>Payment Summary</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Total Amount</label>
                    <div class="value">${formatCurrency(booking.totalAmount)}</div>
                </div>
                <div class="detail-item">
                    <label>Paid Amount</label>
                    <div class="value">${formatCurrency(booking.paidAmount)}</div>
                </div>
                <div class="detail-item">
                    <label>Balance</label>
                    <div class="value" style="color: ${balance > 0 ? '#dc2626' : '#059669'}">${formatCurrency(balance)}</div>
                </div>
                <div class="detail-item">
                    <label>Payment Status</label>
                    <div class="value">${balance > 0 ? 'Pending' : 'Completed'}</div>
                </div>
            </div>
        </div>
        
        ${bookingPayments.length > 0 ? `
            <div class="details-section">
                <h4>Payment History</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookingPayments.map(payment => `
                                <tr>
                                    <td>${formatDate(payment.date)}</td>
                                    <td>${formatCurrency(payment.amount)}</td>
                                    <td>${payment.method}</td>
                                    <td>${payment.notes || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : ''}
        
        <div class="details-section">
            <h4>Actions</h4>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-warning" onclick="editBooking('${booking.id}')">
                    <i class="fas fa-edit"></i> Edit Booking
                </button>
                ${balance > 0 ? `
                    <button class="btn btn-success" onclick="recordPaymentForBooking('${booking.id}')">
                        <i class="fas fa-plus"></i> Record Payment
                    </button>
                ` : ''}
                <button class="btn btn-danger" onclick="cancelBooking('${booking.id}')">
                    <i class="fas fa-times"></i> Cancel Booking
                </button>
            </div>
        </div>
    `;
    
    openModal('bookingDetailsModal');
}

function viewCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerBookings = bookings.filter(b => b.customerId === customerId);
    const customerPayments = [];
    customerBookings.forEach(booking => {
        const bookingPayments = payments.filter(p => p.bookingId === booking.id);
        customerPayments.push(...bookingPayments);
    });
    
    const totalSpent = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const photoSrc = customer.photo || 'https://i.postimg.cc/FFb1S6Vt/image.png';
    
    document.getElementById('customerDetailsTitle').textContent = customer.name;
    document.getElementById('customerDetailsContent').innerHTML = `
        <div class="details-section">
            <h4>Customer Information</h4>
            <div style="display: flex; gap: 2rem; margin-bottom: 1rem;">
                <img src="${photoSrc}" alt="${customer.name}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 50%; border: 3px solid #219EBC;">
                <div class="details-grid" style="flex: 1;">
                    <div class="detail-item">
                        <label>Full Name</label>
                        <div class="value">${customer.name}</div>
                    </div>
                    <div class="detail-item">
                        <label>Phone Number</label>
                        <div class="value">${customer.phone}</div>
                    </div>
                    <div class="detail-item">
                        <label>Email</label>
                        <div class="value">${customer.email || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <label>Member Since</label>
                        <div class="value">${formatDate(customer.createdAt)}</div>
                    </div>
                </div>
            </div>
            ${customer.address ? `
                <div class="detail-item">
                    <label>Address</label>
                    <div class="value">${customer.address}</div>
                </div>
            ` : ''}
            ${customer.idType && customer.idNumber ? `
                <div class="details-grid">
                    <div class="detail-item">
                        <label>ID Proof Type</label>
                        <div class="value">${customer.idType.toUpperCase()}</div>
                    </div>
                    <div class="detail-item">
                        <label>ID Number</label>
                        <div class="value">${customer.idNumber}</div>
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="details-section">
            <h4>Booking Statistics</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Total Bookings</label>
                    <div class="value">${customerBookings.length}</div>
                </div>
                <div class="detail-item">
                    <label>Total Spent</label>
                    <div class="value">${formatCurrency(totalSpent)}</div>
                </div>
                <div class="detail-item">
                    <label>Average Booking Value</label>
                    <div class="value">${customerBookings.length > 0 ? formatCurrency(totalSpent / customerBookings.length) : formatCurrency(0)}</div>
                </div>
                <div class="detail-item">
                    <label>Status</label>
                    <div class="value">${customerBookings.length > 0 ? 'Active Customer' : 'New Customer'}</div>
                </div>
            </div>
        </div>
        
        ${customerBookings.length > 0 ? `
            <div class="details-section">
                <h4>Booking History</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customerBookings.map(booking => {
                                const property = properties.find(p => p.id === booking.propertyId);
                                return `
                                    <tr>
                                        <td>${property ? property.name : 'Unknown'}</td>
                                        <td>${formatDate(booking.checkIn)}</td>
                                        <td>${formatDate(booking.checkOut)}</td>
                                        <td>${formatCurrency(booking.totalAmount)}</td>
                                        <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-primary" onclick="viewBookingDetails('${booking.id}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : ''}
        
        <div class="details-section">
            <h4>Actions</h4>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="bookForCustomer('${customer.id}')">
                    <i class="fas fa-calendar-plus"></i> New Booking
                </button>
                <button class="btn btn-warning" onclick="editCustomer('${customer.id}')">
                    <i class="fas fa-edit"></i> Edit Customer
                </button>
                <button class="btn btn-secondary" onclick="contactCustomer('${customer.phone}')">
                    <i class="fas fa-phone"></i> Contact Customer
                </button>
                <button class="btn btn-danger" onclick="deleteCustomer('${customer.id}')">
                    <i class="fas fa-trash"></i> Delete Customer
                </button>
            </div>
        </div>
    `;
    
    openModal('customerDetailsModal');
}

function viewPaymentDetails(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    const booking = bookings.find(b => b.id === payment.bookingId);
    const property = booking ? properties.find(p => p.id === booking.propertyId) : null;
    
    document.getElementById('paymentDetailsTitle').textContent = `Payment ${payment.id.substr(-6).toUpperCase()}`;
    document.getElementById('paymentDetailsContent').innerHTML = `
        <div class="details-section">
            <h4>Payment Information</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Payment ID</label>
                    <div class="value">${payment.id.substr(-6).toUpperCase()}</div>
                </div>
                <div class="detail-item">
                    <label>Amount</label>
                    <div class="value">${formatCurrency(payment.amount)}</div>
                </div>
                <div class="detail-item">
                    <label>Payment Method</label>
                    <div class="value">${payment.method}</div>
                </div>
                <div class="detail-item">
                    <label>Payment Date</label>
                    <div class="value">${formatDate(payment.date)}</div>
                </div>
            </div>
            ${payment.notes ? `
                <div class="detail-item">
                    <label>Notes</label>
                    <div class="value">${payment.notes}</div>
                </div>
            ` : ''}
        </div>
        
        ${booking ? `
            <div class="details-section">
                <h4>Related Booking</h4>
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Booking ID</label>
                        <div class="value">${booking.id.substr(-6).toUpperCase()}</div>
                    </div>
                    <div class="detail-item">
                        <label>Guest Name</label>
                        <div class="value">${booking.guestName}</div>
                    </div>
                    <div class="detail-item">
                        <label>Property</label>
                        <div class="value">${property ? property.name : 'Unknown'}</div>
                    </div>
                    <div class="detail-item">
                        <label>Booking Total</label>
                        <div class="value">${formatCurrency(booking.totalAmount)}</div>
                    </div>
                </div>
            </div>
        ` : ''}
        
        <div class="details-section">
            <h4>Actions</h4>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${booking ? `
                    <button class="btn btn-primary" onclick="viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i> View Booking
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="printPaymentReceipt('${payment.id}')">
                    <i class="fas fa-print"></i> Print Receipt
                </button>
            </div>
        </div>
    `;
    
    openModal('paymentDetailsModal');
}

function viewReportDetails(type) {
    switch(type) {
        case 'revenue':
            switchTab('payments');
            break;
        case 'property':
            switchTab('inventory');
            break;
    }
}

// Property Management Functions
function openAddPropertyModal(propertyId = null) {
    const isEditing = !!propertyId;
    
    document.getElementById('propertyModalTitle').textContent = isEditing ? 'Edit Property' : 'Add New Property';
    document.getElementById('savePropertyBtn').textContent = isEditing ? 'Update Property' : 'Add Property';
    
    // Reset form
    document.getElementById('addPropertyForm').reset();
    currentPropertyImages = [];
    updateImagePreview();
    
    if (isEditing) {
        const property = properties.find(p => p.id === propertyId);
        if (property) {
            document.getElementById('editPropertyId').value = propertyId;
            const form = document.getElementById('addPropertyForm');
            form.querySelector('input[name="name"]').value = property.name;
            form.querySelector('select[name="type"]').value = property.type;
            form.querySelector('select[name="category"]').value = property.category;
            form.querySelector('input[name="location"]').value = property.location;
            form.querySelector('textarea[name="description"]').value = property.description || '';
            form.querySelector('input[name="maxGuests"]').value = property.maxGuests;
            form.querySelector('input[name="bedrooms"]').value = property.bedrooms || 0;
            
            // Set pricing
            if (property.pricingType === 'weekly') {
                form.querySelector('input[name="pricingType"][value="weekly"]').checked = true;
                handlePricingTypeChange({ target: { value: 'weekly' } });
                form.querySelector('input[name="weekdayPrice"]').value = property.weekdayPrice;
                form.querySelector('input[name="weekendPrice"]').value = property.weekendPrice;
            } else {
                form.querySelector('input[name="pricingType"][value="uniform"]').checked = true;
                handlePricingTypeChange({ target: { value: 'uniform' } });
                form.querySelector('input[name="uniformPrice"]').value = property.uniformPrice || property.basePrice;
            }
            
            // Set amenities
            property.amenities?.forEach(amenity => {
                const checkbox = document.getElementById(`amenity_${amenity.replace(/\s+/g, '_')}`);
                if (checkbox) checkbox.checked = true;
            });
            
            // Set images
            currentPropertyImages = property.images || [];
            updateImagePreview();
        }
    }
    
    openModal('addPropertyModal');
    generateAmenitiesGrid();
}

function generateAmenitiesGrid() {
    const grid = document.getElementById('amenitiesGrid');
    grid.innerHTML = AMENITIES_LIST.map(amenity => `
        <div class="amenity-checkbox">
            <input type="checkbox" id="amenity_${amenity.replace(/\s+/g, '_')}" name="amenities" value="${amenity}">
            <label for="amenity_${amenity.replace(/\s+/g, '_')}">${amenity}</label>
        </div>
    `).join('');
}

function selectAllAmenities() {
    document.querySelectorAll('#amenitiesGrid input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function deselectAllAmenities() {
    document.querySelectorAll('#amenitiesGrid input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function generateDescription() {
    const form = document.getElementById('addPropertyForm');
    const name = form.querySelector('input[name="name"]').value;
    const type = form.querySelector('select[name="type"]').value;
    const category = form.querySelector('select[name="category"]').value;
    const location = form.querySelector('input[name="location"]').value;
    const maxGuests = form.querySelector('input[name="maxGuests"]').value;
    const bedrooms = form.querySelector('input[name="bedrooms"]').value;
    
    // Get selected amenities
    const selectedAmenities = Array.from(document.querySelectorAll('#amenitiesGrid input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    let description = `Experience luxury and comfort at ${name}, a beautiful ${category} ${type} located in the heart of ${location}. `;
    
    if (maxGuests) {
        description += `Perfect for groups of up to ${maxGuests} guests, `;
    }
    
    if (bedrooms) {
        description += `featuring ${bedrooms} spacious bedroom${bedrooms > 1 ? 's' : ''} `;
    }
    
    description += `designed to provide an unforgettable stay experience. `;
    
    if (selectedAmenities.length > 0) {
        const topAmenities = selectedAmenities.slice(0, 5);
        description += `Enjoy premium amenities including ${topAmenities.join(', ')}`;
        if (selectedAmenities.length > 5) {
            description += ` and ${selectedAmenities.length - 5} more facilities`;
        }
        description += '. ';
    }
    
    description += `Book now for an exceptional ${category} experience in ${location}!`;
    
    form.querySelector('textarea[name="description"]').value = description;
    showNotification('Description generated successfully!', 'success');
}

function handlePricingTypeChange(event) {
    const pricingType = event.target.value;
    const uniformSection = document.getElementById('uniformPricing');
    const weeklySection = document.getElementById('weeklyPricing');
    
    if (pricingType === 'weekly') {
        uniformSection.style.display = 'none';
        weeklySection.style.display = 'block';
    } else {
        uniformSection.style.display = 'block';
        weeklySection.style.display = 'none';
    }
}

function handleImageUpload(event) {
    const files = event.target.files;
    const maxImages = 10;
    
    if (currentPropertyImages.length + files.length > maxImages) {
        showNotification(`Maximum ${maxImages} images allowed`, 'error');
        return;
    }
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                currentPropertyImages.push(e.target.result);
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        }
    });
}

function updateImagePreview() {
    const preview = document.getElementById('imagePreview');
    const coverSelector = document.getElementById('coverImageSelector');
    const coverOptions = document.getElementById('coverImageOptions');
    
    if (currentPropertyImages.length === 0) {
        preview.innerHTML = '';
        coverSelector.style.display = 'none';
        return;
    }
    
    preview.innerHTML = currentPropertyImages.map((img, index) => `
        <div style="position: relative;">
            <img src="${img}" alt="Property Image ${index + 1}" onclick="removeImage(${index})">
            <button type="button" onclick="removeImage(${index})" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer;">×</button>
        </div>
    `).join('');
    
    // Show cover image selector if more than one image
    if (currentPropertyImages.length > 1) {
        coverSelector.style.display = 'block';
        coverOptions.innerHTML = currentPropertyImages.map((img, index) => `
            <div class="cover-image-option">
                <img src="${img}" alt="Cover option ${index + 1}">
                <input type="radio" name="coverImage" value="${index}" ${index === 0 ? 'checked' : ''}>
            </div>
        `).join('');
    } else {
        coverSelector.style.display = 'none';
    }
}

function removeImage(index) {
    currentPropertyImages.splice(index, 1);
    updateImagePreview();
}

function handleAddProperty(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const propertyId = formData.get('propertyId');
    const isEditing = !!propertyId;
    
    // Get selected amenities
    const selectedAmenities = Array.from(document.querySelectorAll('#amenitiesGrid input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    // Get cover image index
    const coverImageIndex = document.querySelector('input[name="coverImage"]:checked')?.value || 0;
    
    const property = {
        id: isEditing ? propertyId : generateId(),
        name: formData.get('name'),
        type: formData.get('type'),
        category: formData.get('category'),
        location: formData.get('location'),
        description: formData.get('description'),
        maxGuests: parseInt(formData.get('maxGuests')),
        bedrooms: parseInt(formData.get('bedrooms')) || 0,
        pricingType: formData.get('pricingType'),
        uniformPrice: formData.get('pricingType') === 'uniform' ? parseFloat(formData.get('uniformPrice')) : null,
        weekdayPrice: formData.get('pricingType') === 'weekly' ? parseFloat(formData.get('weekdayPrice')) : null,
        weekendPrice: formData.get('pricingType') === 'weekly' ? parseFloat(formData.get('weekendPrice')) : null,
        amenities: selectedAmenities,
        images: currentPropertyImages,
        coverImageIndex: parseInt(coverImageIndex),
        createdAt: isEditing ? properties.find(p => p.id === propertyId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // For backward compatibility
    property.basePrice = property.uniformPrice || property.weekdayPrice || 0;
    
    if (isEditing) {
        const index = properties.findIndex(p => p.id === propertyId);
        properties[index] = property;
        showNotification('Property updated successfully!', 'success');
    } else {
        properties.push(property);
        showNotification('Property added successfully!', 'success');
    }
    
    saveToLocalStorage();
    renderPropertiesGrid();
    updateDashboardStats();
    populateSelects();
    populateLocationFilters();
    closeAllModals();
}

// Customer Management Functions
function openAddCustomerModal(customerId = null) {
    const isEditing = !!customerId;
    
    document.getElementById('customerModalTitle').textContent = isEditing ? 'Edit Customer' : 'Add New Customer';
    document.getElementById('saveCustomerBtn').textContent = isEditing ? 'Update Customer' : 'Add Customer';
    
    // Reset form and photo
    document.getElementById('addCustomerForm').reset();
    currentCustomerPhoto = null;
    document.getElementById('customerPhotoPreview').src = 'https://i.postimg.cc/FFb1S6Vt/image.png';
    document.getElementById('removeCustomerPhoto').style.display = 'none';
    
    if (isEditing) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            document.getElementById('editCustomerId').value = customerId;
            const form = document.getElementById('addCustomerForm');
            form.querySelector('input[name="name"]').value = customer.name;
            form.querySelector('input[name="phone"]').value = customer.phone;
            form.querySelector('input[name="email"]').value = customer.email || '';
            form.querySelector('textarea[name="address"]').value = customer.address || '';
            form.querySelector('select[name="idType"]').value = customer.idType || 'aadhar';
            form.querySelector('input[name="idNumber"]').value = customer.idNumber || '';
            
            if (customer.photo) {
                currentCustomerPhoto = customer.photo;
                document.getElementById('customerPhotoPreview').src = customer.photo;
                document.getElementById('removeCustomerPhoto').style.display = 'block';
            }
        }
    }
    
    openModal('addCustomerModal');
}

function handleCustomerPhotoUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentCustomerPhoto = e.target.result;
            document.getElementById('customerPhotoPreview').src = e.target.result;
            document.getElementById('removeCustomerPhoto').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function removeCustomerPhoto() {
    currentCustomerPhoto = null;
    document.getElementById('customerPhotoPreview').src = 'https://i.postimg.cc/FFb1S6Vt/image.png';
    document.getElementById('removeCustomerPhoto').style.display = 'none';
    document.getElementById('customerPhotoInput').value = '';
}

function openCamera() {
    openModal('cameraModal');
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            cameraStream = stream;
            document.getElementById('cameraVideo').srcObject = stream;
        })
        .catch(err => {
            console.error('Camera access denied:', err);
            showNotification('Camera access denied', 'error');
            closeAllModals();
        });
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    currentCustomerPhoto = canvas.toDataURL('image/jpeg');
    document.getElementById('customerPhotoPreview').src = currentCustomerPhoto;
    document.getElementById('removeCustomerPhoto').style.display = 'block';
    
    // Stop camera
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    closeAllModals();
    openModal('addCustomerModal');
}

function handleAddCustomer(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const customerId = formData.get('customerId');
    const isEditing = !!customerId;
    
    const customer = {
        id: isEditing ? customerId : generateId(),
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email') || null,
        address: formData.get('address') || null,
        idType: formData.get('idType'),
        idNumber: formData.get('idNumber') || null,
        photo: currentCustomerPhoto,
        createdAt: isEditing ? customers.find(c => c.id === customerId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (isEditing) {
        const index = customers.findIndex(c => c.id === customerId);
        customers[index] = customer;
        showNotification('Customer updated successfully!', 'success');
    } else {
        customers.push(customer);
        showNotification('Customer added successfully!', 'success');
    }
    
    saveToLocalStorage();
    renderCustomersGrid();
    updateDashboardStats();
    closeAllModals();
}

// Customer search functionality for booking form
function handleCustomerSearch() {
    const query = document.getElementById('customerSearchInput').value.toLowerCase().trim();
    const dropdown = document.getElementById('customerSearchDropdown');
    
    if (query.length < 1) {
        hideCustomerSearchDropdown();
        return;
    }
    
    const results = customers.filter(customer => 
        customer.name.toLowerCase().includes(query) || 
        customer.phone.includes(query)
    ).slice(0, 8);
    
    if (results.length === 0) {
        dropdown.innerHTML = `
            <div class="customer-search-result" onclick="selectNewCustomer()">
                <div class="customer-search-info">
                    <h4>Add New Customer</h4>
                    <p>No existing customer found. Click to add new customer details.</p>
                </div>
            </div>
        `;
    } else {
        dropdown.innerHTML = results.map(customer => `
            <div class="customer-search-result" onclick="selectCustomer('${customer.id}')">
                <img src="${customer.photo || 'https://i.postimg.cc/FFb1S6Vt/image.png'}" alt="${customer.name}" class="customer-search-avatar">
                <div class="customer-search-info">
                    <h4>${customer.name}</h4>
                    <p>${customer.phone} ${customer.email ? '• ' + customer.email : ''}</p>
                </div>
            </div>
        `).join('') + `
            <div class="customer-search-result" onclick="selectNewCustomer()">
                <div class="customer-search-info">
                    <h4>Add New Customer</h4>
                    <p>Add a new customer instead</p>
                </div>
            </div>
        `;
    }
    
    showCustomerSearchDropdown();
}

function selectCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    document.getElementById('customerSearchInput').value = customer.name;
    document.getElementById('selectedCustomerId').value = customerId;
    document.getElementById('selectedCustomerType').value = 'existing';
    
    // Show customer info
    const customerInfo = document.getElementById('customerInfo');
    customerInfo.innerHTML = `
        <h4>Selected Customer</h4>
        <p><strong>Name:</strong> ${customer.name}</p>
        <p><strong>Phone:</strong> ${customer.phone}</p>
        ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ''}
    `;
    customerInfo.style.display = 'block';
    
    // Hide new customer form
    document.getElementById('newCustomerForm').style.display = 'none';
    
    hideCustomerSearchDropdown();
}

function selectNewCustomer() {
    document.getElementById('customerSearchInput').value = 'New Customer';
    document.getElementById('selectedCustomerId').value = '';
    document.getElementById('selectedCustomerType').value = 'new';
    
    // Hide customer info
    document.getElementById('customerInfo').style.display = 'none';
    
    // Show new customer form
    document.getElementById('newCustomerForm').style.display = 'block';
    
    hideCustomerSearchDropdown();
}

function showCustomerSearchDropdown() {
    document.getElementById('customerSearchDropdown').style.display = 'block';
}

function hideCustomerSearchDropdown() {
    document.getElementById('customerSearchDropdown').style.display = 'none';
}

// Booking Management Functions
function openAddBookingModal(selectedPropertyId = null) {
    document.getElementById('addBookingForm').reset();
    
    // Reset customer selection
    document.getElementById('selectedCustomerId').value = '';
    document.getElementById('selectedCustomerType').value = 'existing';
    document.getElementById('customerInfo').style.display = 'none';
    document.getElementById('newCustomerForm').style.display = 'none';
    
    // Reset property info
    document.getElementById('propertyInfo').style.display = 'none';
    
    // Reset calculations
    document.getElementById('totalDaysInput').value = '';
    document.getElementById('totalNightsInput').value = '';
    document.getElementById('totalAmount').textContent = '0';
    document.getElementById('durationSummary').textContent = '0 days, 0 nights';
    
    if (selectedPropertyId) {
        document.getElementById('bookingPropertySelect').value = selectedPropertyId;
        handlePropertySelection();
    }
    
    openModal('addBookingModal');
    populateBookingPropertySelect();
}

function populateBookingPropertySelect() {
    const select = document.getElementById('bookingPropertySelect');
    select.innerHTML = '<option value="">Select Property</option>' +
        properties.map(property => 
            `<option value="${property.id}">${property.name} - ${property.location}</option>`
        ).join('');
}

function handlePropertySelection() {
    const propertyId = document.getElementById('bookingPropertySelect').value;
    const propertyInfo = document.getElementById('propertyInfo');
    
    if (!propertyId) {
        propertyInfo.style.display = 'none';
        document.querySelector('input[name="baseRate"]').value = '';
        return;
    }
    
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const basePrice = property.uniformPrice || property.weekdayPrice || property.basePrice || 0;
    
    propertyInfo.innerHTML = `
        <h4>Selected Property</h4>
        <p><strong>Name:</strong> ${property.name}</p>
        <p><strong>Location:</strong> ${property.location}</p>
        <p><strong>Type:</strong> ${property.type}</p>
        <p><strong>Max Guests:</strong> ${property.maxGuests}</p>
        <p><strong>Base Rate:</strong> ${formatCurrency(basePrice)}/day</p>
    `;
    propertyInfo.style.display = 'block';
    
    document.querySelector('input[name="baseRate"]').value = basePrice;
    document.querySelector('input[name="negotiatedRate"]').value = basePrice;
    
    calculateBookingTotal();
}

function validateBookingDates() {
    const checkIn = document.getElementById('checkInDate').value;
    const checkOut = document.getElementById('checkOutDate').value;
    
    if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        if (checkOutDate <= checkInDate) {
            showNotification('Check-out date must be after check-in date', 'error');
            document.getElementById('checkOutDate').value = '';
            return false;
        }
        
        calculateBookingTotal();
        return true;
    }
}

function validateEditBookingDates() {
    const checkIn = document.getElementById('editCheckInDate').value;
    const checkOut = document.getElementById('editCheckOutDate').value;
    
    if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        if (checkOutDate <= checkInDate) {
            showNotification('Check-out date must be after check-in date', 'error');
            document.getElementById('editCheckOutDate').value = '';
            return false;
        }
        
        return true;
    }
}

function calculateBookingTotal() {
    const checkIn = document.getElementById('checkInDate').value;
    const checkOut = document.getElementById('checkOutDate').value;
    const negotiatedRate = parseFloat(document.querySelector('input[name="negotiatedRate"]').value) || 0;
    
    if (!checkIn || !checkOut || !negotiatedRate) {
        document.getElementById('totalAmount').textContent = '0';
        document.getElementById('durationSummary').textContent = '0 days, 0 nights';
        return;
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate - checkInDate;
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const nights = days - 1;
    
    if (days <= 0) {
        document.getElementById('totalAmount').textContent = '0';
        document.getElementById('durationSummary').textContent = '0 days, 0 nights';
        return;
    }
    
    const totalAmount = days * negotiatedRate;
    
    document.getElementById('totalDaysInput').value = days;
    document.getElementById('totalNightsInput').value = nights;
    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString();
    document.getElementById('durationSummary').textContent = `${days} days, ${nights} nights`;
}

function checkGuestLimit() {
    const propertyId = document.getElementById('bookingPropertySelect').value;
    const guests = parseInt(document.querySelector('input[name="guests"]').value) || 0;
    const warningDiv = document.getElementById('guestWarning');
    
    if (!propertyId) {
        warningDiv.style.display = 'none';
        return;
    }
    
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    if (guests > property.maxGuests) {
        warningDiv.innerHTML = `Warning: This property allows maximum ${property.maxGuests} guests. Current selection: ${guests} guests.`;
        warningDiv.style.display = 'block';
    } else {
        warningDiv.style.display = 'none';
    }
}

function handleAddBooking(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const propertyId = formData.get('propertyId');
    const customerType = formData.get('customerType');
    
    if (!propertyId) {
        showNotification('Please select a property', 'error');
        return;
    }
    
    let customerId = null;
    let guestName, guestPhone, guestEmail;
    
    if (customerType === 'existing') {
        customerId = formData.get('customerId');
        if (!customerId) {
            showNotification('Please select a customer', 'error');
            return;
        }
        const customer = customers.find(c => c.id === customerId);
        guestName = customer.name;
        guestPhone = customer.phone;
        guestEmail = customer.email;
    } else {
        guestName = formData.get('guestName');
        guestPhone = formData.get('guestPhone');
        guestEmail = formData.get('guestEmail');
        
        if (!guestName || !guestPhone) {
            showNotification('Please enter guest name and phone number', 'error');
            return;
        }
        
        // Create new customer
        const newCustomer = {
            id: generateId(),
            name: guestName,
            phone: guestPhone,
            email: guestEmail || null,
            photo: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        customers.push(newCustomer);
        customerId = newCustomer.id;
    }
    
    const checkIn = formData.get('checkIn');
    const checkOut = formData.get('checkOut');
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate - checkInDate;
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const nights = days - 1;
    const negotiatedRate = parseFloat(formData.get('negotiatedRate'));
    const totalAmount = days * negotiatedRate;
    
    const booking = {
        id: generateId(),
        propertyId: propertyId,
        customerId: customerId,
        guestName: guestName,
        guestPhone: guestPhone,
        guestEmail: guestEmail,
        checkIn: checkIn,
        checkOut: checkOut,
        days: days,
        nights: nights,
        guests: parseInt(formData.get('guests')),
        negotiatedRate: negotiatedRate,
        totalAmount: totalAmount,
        paidAmount: 0,
        status: 'confirmed',
        isNewCustomer: customerType === 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    bookings.push(booking);
    
    saveToLocalStorage();
    renderBookingsTable();
    renderCalendar();
    updateDashboardStats();
    
    showNotification('Booking created successfully!', 'success');
    closeAllModals();
}

// Continue with more functions...
// Due to length limitations, I'm providing the core functionality.
// The remaining functions follow similar patterns for editing bookings, payments, etc.

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
    
    // Stop camera if open
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
}

function saveToLocalStorage() {
    localStorage.setItem('properties', JSON.stringify(properties));
    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.setItem('payments', JSON.stringify(payments));
    localStorage.setItem('customers', JSON.stringify(customers));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Dashboard Stats
function updateDashboardStats() {
    document.getElementById('totalProperties').textContent = properties.length;
    document.getElementById('totalBookings').textContent = bookings.filter(b => b.status !== 'cancelled').length;
    document.getElementById('totalCustomers').textContent = customers.length;
    
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    
    renderRecentBookings();
}

function renderRecentBookings() {
    const recentBookings = bookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    const tbody = document.getElementById('recentBookingsTable');
    
    if (recentBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No recent bookings</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentBookings.map(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        return `
            <tr onclick="viewBookingDetails('${booking.id}')" data-booking-id="${booking.id}">
                <td>${property ? property.name : 'Unknown'}</td>
                <td>${booking.guestName}</td>
                <td>${formatDate(booking.checkIn)}</td>
                <td>${formatDate(booking.checkOut)}</td>
                <td>${booking.days}/${booking.nights}</td>
                <td>${formatCurrency(booking.totalAmount)}</td>
                <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Render Functions
function renderPropertiesGrid() {
    const grid = document.getElementById('propertiesGrid');
    
    if (properties.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-building"></i>
                <h3>No Properties Added</h3>
                <p>Add your first property to get started</p>
                <button class="btn btn-primary" onclick="openAddPropertyModal()">
                    <i class="fas fa-plus"></i> Add Property
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = properties.map(property => {
        const mainImage = property.images && property.images.length > 0 
            ? property.images[property.coverImageIndex || 0] 
            : 'https://via.placeholder.com/320x200?text=No+Image';
        
        const price = property.uniformPrice || property.weekdayPrice || property.basePrice || 0;
        
        return `
            <div class="property-card" data-property-id="${property.id}" onclick="viewPropertyDetails('${property.id}')">
                <img src="${mainImage}" alt="${property.name}" class="property-image" onerror="this.src='https://via.placeholder.com/320x200?text=No+Image'">
                <div class="property-content">
                    <div class="property-header">
                        <h3 class="property-title">${property.name}</h3>
                        <span class="property-category">${property.category.replace('-', ' ')}</span>
                    </div>
                    <div class="property-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${property.location}
                    </div>
                    <div class="property-details">
                        <span><i class="fas fa-users"></i> ${property.maxGuests} guests</span>
                        <span><i class="fas fa-bed"></i> ${property.bedrooms || 0} beds</span>
                        <span><i class="fas fa-home"></i> ${property.type}</span>
                    </div>
                    <div class="property-price">
                        ${formatCurrency(price)}/day
                    </div>
                    ${property.amenities && property.amenities.length > 0 ? `
                        <div class="property-amenities">
                            ${property.amenities.slice(0, 3).map(amenity => 
                                `<span class="amenity-tag">${amenity}</span>`
                            ).join('')}
                            ${property.amenities.length > 3 ? `<span class="amenity-tag">+${property.amenities.length - 3} more</span>` : ''}
                        </div>
                    ` : ''}
                    <div class="property-actions">
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); shareProperty('${property.id}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                        <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); bookProperty('${property.id}')">
                            <i class="fas fa-calendar-plus"></i> Book
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); editProperty('${property.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteProperty('${property.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCustomersGrid() {
    const grid = document.getElementById('customersGrid');
    
    if (customers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Customers Added</h3>
                <p>Add your first customer to get started</p>
                <button class="btn btn-primary" onclick="openAddCustomerModal()">
                    <i class="fas fa-plus"></i> Add Customer
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = customers.map(customer => {
        const customerBookings = bookings.filter(b => b.customerId === customer.id);
        const totalSpent = customerBookings.reduce((sum, booking) => {
            const bookingPayments = payments.filter(p => p.bookingId === booking.id);
            return sum + bookingPayments.reduce((pSum, payment) => pSum + payment.amount, 0);
        }, 0);
        
        return `
            <div class="customer-card" data-customer-id="${customer.id}" onclick="viewCustomerDetails('${customer.id}')">
                <div class="customer-header">
                    <img src="${customer.photo || 'https://i.postimg.cc/FFb1S6Vt/image.png'}" alt="${customer.name}" class="customer-avatar">
                    <div class="customer-info">
                        <h3>${customer.name}</h3>
                        <div class="customer-phone">${customer.phone}</div>
                        ${customer.email ? `<div class="customer-email">${customer.email}</div>` : ''}
                    </div>
                </div>
                <div class="customer-stats">
                    <div class="customer-stat">
                        <span class="value">${customerBookings.length}</span>
                        <span class="label">Bookings</span>
                    </div>
                    <div class="customer-stat">
                        <span class="value">${formatCurrency(totalSpent)}</span>
                        <span class="label">Total Spent</span>
                    </div>
                </div>
                <div class="customer-actions">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); bookForCustomer('${customer.id}')">
                        <i class="fas fa-calendar-plus"></i> Book
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); editCustomer('${customer.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); contactCustomer('${customer.phone}')">
                        <i class="fas fa-phone"></i> Call
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTable');
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="no-data">No bookings found</td></tr>';
        return;
    }
    
    tbody.innerHTML = bookings.map(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        const balance = booking.totalAmount - booking.paidAmount;
        
        return `
            <tr onclick="viewBookingDetails('${booking.id}')" data-booking-id="${booking.id}">
                <td>${booking.id.substr(-6).toUpperCase()}</td>
                <td>${property ? property.name : 'Unknown'}</td>
                <td>${booking.guestName}</td>
                <td>${booking.isNewCustomer ? 'New' : 'Existing'}</td>
                <td>${formatDate(booking.checkIn)}</td>
                <td>${formatDate(booking.checkOut)}</td>
                <td>${booking.days}/${booking.nights}</td>
                <td>${formatCurrency(booking.negotiatedRate)}</td>
                <td>${formatCurrency(booking.totalAmount)}</td>
                <td>${formatCurrency(booking.paidAmount)}</td>
                <td style="color: ${balance > 0 ? '#dc2626' : '#059669'}">${formatCurrency(balance)}</td>
                <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); editBooking('${booking.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPaymentsTable() {
    const tbody = document.getElementById('paymentsTable');
    
    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No payments recorded</td></tr>';
        return;
    }
    
    tbody.innerHTML = payments.map(payment => {
        const booking = bookings.find(b => b.id === payment.bookingId);
        const property = booking ? properties.find(p => p.id === booking.propertyId) : null;
        
        return `
            <tr onclick="viewPaymentDetails('${payment.id}')" data-payment-id="${payment.id}">
                <td>${payment.id.substr(-6).toUpperCase()}</td>
                <td>${booking ? booking.id.substr(-6).toUpperCase() : 'N/A'}</td>
                <td>${property ? property.name : 'Unknown'}</td>
                <td>${booking ? booking.guestName : 'Unknown'}</td>
                <td>${formatCurrency(payment.amount)}</td>
                <td>${payment.method}</td>
                <td>${formatDate(payment.date)}</td>
                <td><span class="status-badge status-confirmed">Completed</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewPaymentDetails('${payment.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Initialize default dates and selects
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    document.getElementById('checkInDate').value = today;
    document.getElementById('checkOutDate').value = tomorrowStr;
    
    // Report dates
    document.getElementById('reportFromDate').value = today;
    document.getElementById('reportToDate').value = today;
    
    // History dates
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    document.getElementById('historyFromDate').value = lastMonth.toISOString().split('T')[0];
    document.getElementById('historyToDate').value = today;
    
    // Payment date
    if (document.querySelector('input[name="date"]')) {
        document.querySelector('input[name="date"]').value = today;
    }
}

function populateSelects() {
    populateBookingPropertySelect();
    populateCalendarPropertyFilter();
    populatePaymentBookingSelect();
}

function populateCalendarPropertyFilter() {
    const select = document.getElementById('propertyFilter');
    select.innerHTML = '<option value="">All Properties</option>' +
        properties.map(property => 
            `<option value="${property.id}">${property.name}</option>`
        ).join('');
}

function populateLocationFilters() {
    const locations = [...new Set(properties.map(p => p.location))];
    const select = document.getElementById('locationFilter');
    select.innerHTML = '<option value="">All Locations</option>' +
        locations.map(location => 
            `<option value="${location}">${location}</option>`
        ).join('');
}

function populatePaymentBookingSelect() {
    const unpaidBookings = bookings.filter(b => b.totalAmount > b.paidAmount && b.status !== 'cancelled');
    const select = document.getElementById('paymentBookingSelect');
    select.innerHTML = '<option value="">Select Booking</option>' +
        unpaidBookings.map(booking => {
            const property = properties.find(p => p.id === booking.propertyId);
            const balance = booking.totalAmount - booking.paidAmount;
            return `<option value="${booking.id}">${booking.guestName} - ${property ? property.name : 'Unknown'} - Balance: ${formatCurrency(balance)}</option>`;
        }).join('');
}

// Calendar Functions
function renderCalendar() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    
    document.getElementById('currentMonth').textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendarGrid = document.getElementById('calendarGrid');
    const selectedPropertyId = document.getElementById('propertyFilter').value;
    
    let calendarHTML = `
        <div class="calendar-header-row">
            <div class="calendar-day-header">Sun</div>
            <div class="calendar-day-header">Mon</div>
            <div class="calendar-day-header">Tue</div>
            <div class="calendar-day-header">Wed</div>
            <div class="calendar-day-header">Thu</div>
            <div class="calendar-day-header">Fri</div>
            <div class="calendar-day-header">Sat</div>
        </div>
        <div class="calendar-body">
    `;
    
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
        const isToday = date.toDateString() === new Date().toDateString();
        const dateStr = date.toISOString().split('T')[0];
        
        // Get bookings for this date
        const dayBookings = bookings.filter(booking => {
            if (selectedPropertyId && booking.propertyId !== selectedPropertyId) return false;
            return dateStr >= booking.checkIn && dateStr < booking.checkOut;
        });
        
        calendarHTML += `
            <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" 
                 onclick="openDayModal('${dateStr}')">
                <div class="day-number">${date.getDate()}</div>
                <div class="day-bookings">
                    ${dayBookings.map(booking => {
                        const property = properties.find(p => p.id === booking.propertyId);
                        return `<div class="booking-item" title="${booking.guestName} - ${property ? property.name : 'Unknown'}">${booking.guestName}</div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    calendarGrid.innerHTML = calendarHTML;
}

function openDayModal(dateStr) {
    selectedDate = dateStr;
    const dayBookings = bookings.filter(booking => 
        dateStr >= booking.checkIn && dateStr < booking.checkOut
    );
    
    document.getElementById('dayModalTitle').textContent = `Bookings for ${formatDate(dateStr)}`;
    
    const daySummary = document.getElementById('daySummary');
    daySummary.innerHTML = `
        <h4>Summary</h4>
        <p><strong>Date:</strong> ${formatDate(dateStr)}</p>
        <p><strong>Total Bookings:</strong> ${dayBookings.length}</p>
        <p><strong>Total Revenue:</strong> ${formatCurrency(dayBookings.reduce((sum, b) => sum + (b.totalAmount / b.days), 0))}</p>
    `;
    
    const dayBookingsDiv = document.getElementById('dayBookings');
    if (dayBookings.length === 0) {
        dayBookingsDiv.innerHTML = '<p>No bookings for this date</p>';
    } else {
        dayBookingsDiv.innerHTML = `
            <h4>Active Bookings</h4>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Guest</th>
                            <th>Property</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dayBookings.map(booking => {
                            const property = properties.find(p => p.id === booking.propertyId);
                            return `
                                <tr onclick="viewBookingDetails('${booking.id}')">
                                    <td>${booking.guestName}</td>
                                    <td>${property ? property.name : 'Unknown'}</td>
                                    <td>${formatDate(booking.checkIn)}</td>
                                    <td>${formatDate(booking.checkOut)}</td>
                                    <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    openModal('calendarDayModal');
}

// More utility functions for property actions
function shareProperty(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const shareLink = `${window.location.origin}${window.location.pathname}?property=${propertyId}`;
    const mainImage = property.images && property.images.length > 0 
        ? property.images[property.coverImageIndex || 0] 
        : 'https://via.placeholder.com/400x300?text=No+Image';
    
    document.getElementById('sharePropertyPreview').innerHTML = `
        <img src="${mainImage}" alt="${property.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">
        <h4>${property.name}</h4>
        <p><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
        <p><strong>Type:</strong> ${property.type} | <strong>Category:</strong> ${property.category.replace('-', ' ')}</p>
        <p><strong>Max Guests:</strong> ${property.maxGuests} | <strong>Price:</strong> ${formatCurrency(property.uniformPrice || property.weekdayPrice || property.basePrice || 0)}/day</p>
    `;
    
    document.getElementById('shareLink').value = shareLink;
    
    // Setup share buttons
    document.getElementById('shareWhatsApp').onclick = () => {
        const message = `Check out this amazing ${property.type} in ${property.location}!\n\n${property.name}\n${formatCurrency(property.uniformPrice || property.weekdayPrice || property.basePrice || 0)}/day\n\n${shareLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    };
    
    document.getElementById('shareEmail').onclick = () => {
        const subject = `Property Recommendation: ${property.name}`;
        const body = `I found this great property for you!\n\n${property.name}\nLocation: ${property.location}\nType: ${property.type}\nPrice: ${formatCurrency(property.uniformPrice || property.weekdayPrice || property.basePrice || 0)}/day\n\nView details: ${shareLink}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };
    
    openModal('sharePropertyModal');
}

function bookProperty(propertyId) {
    openAddBookingModal(propertyId);
}

function editProperty(propertyId) {
    openAddPropertyModal(propertyId);
}

function deleteProperty(propertyId) {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
        // Check if property has active bookings
        const activeBookings = bookings.filter(b => b.propertyId === propertyId && b.status !== 'cancelled');
        if (activeBookings.length > 0) {
            showNotification('Cannot delete property with active bookings', 'error');
            return;
        }
        
        properties = properties.filter(p => p.id !== propertyId);
        saveToLocalStorage();
        renderPropertiesGrid();
        updateDashboardStats();
        showNotification('Property deleted successfully', 'success');
    }
}

function openShareAllPropertiesModal() {
    const shareAllLink = `${window.location.origin}${window.location.pathname}?view=all`;
    document.getElementById('shareAllLink').value = shareAllLink;
    
    document.getElementById('shareAllWhatsApp').onclick = () => {
        const message = `Check out our amazing property collection!\n\nWe have ${properties.length} properties available for booking.\n\n${shareAllLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    };
    
    document.getElementById('shareAllEmail').onclick = () => {
        const subject = 'Our Property Collection';
        const body = `Discover our amazing collection of ${properties.length} properties!\n\nView all properties: ${shareAllLink}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };
    
    openModal('shareAllPropertiesModal');
}

function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    shareLink.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(shareLink.value);
    showNotification('Link copied to clipboard!', 'success');
}

function copyAllPropertiesLink() {
    const shareAllLink = document.getElementById('shareAllLink');
    shareAllLink.select();
    shareAllLink.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(shareAllLink.value);
    showNotification('Link copied to clipboard!', 'success');
}

// Customer action functions
function bookForCustomer(customerId) {
    openAddBookingModal();
    // Pre-select customer
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        document.getElementById('customerSearchInput').value = customer.name;
        selectCustomer(customerId);
    }
}

function editCustomer(customerId) {
    openAddCustomerModal(customerId);
}

function contactCustomer(phoneNumber) {
    window.open(`tel:${phoneNumber}`);
}

function deleteCustomer(customerId) {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        // Check if customer has active bookings
        const activeBookings = bookings.filter(b => b.customerId === customerId && b.status !== 'cancelled');
        if (activeBookings.length > 0) {
            showNotification('Cannot delete customer with active bookings', 'error');
            return;
        }
        
        customers = customers.filter(c => c.id !== customerId);
        saveToLocalStorage();
        renderCustomersGrid();
        updateDashboardStats();
        showNotification('Customer deleted successfully', 'success');
    }
}

// Booking action functions
function editBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    // Populate edit form
    document.getElementById('editBookingId').value = bookingId;
    const form = document.getElementById('editBookingForm');
    form.querySelector('select[name="propertyId"]').value = booking.propertyId;
    form.querySelector('input[name="guestName"]').value = booking.guestName;
    form.querySelector('input[name="guestPhone"]').value = booking.guestPhone;
    form.querySelector('input[name="checkIn"]').value = booking.checkIn;
    form.querySelector('input[name="checkOut"]').value = booking.checkOut;
    form.querySelector('input[name="guests"]').value = booking.guests;
    form.querySelector('input[name="negotiatedRate"]').value = booking.negotiatedRate;
    form.querySelector('select[name="status"]').value = booking.status;
    
    // Populate property select for edit form
    const editSelect = document.getElementById('editBookingPropertySelect');
    editSelect.innerHTML = '<option value="">Select Property</option>' +
        properties.map(property => 
            `<option value="${property.id}" ${property.id === booking.propertyId ? 'selected' : ''}>${property.name} - ${property.location}</option>`
        ).join('');
    
    openModal('editBookingModal');
}

function handleEditBooking(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const bookingId = formData.get('bookingId');
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) {
        showNotification('Booking not found', 'error');
        return;
    }
    
    const checkIn = formData.get('checkIn');
    const checkOut = formData.get('checkOut');
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate - checkInDate;
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const nights = days - 1;
    const negotiatedRate = parseFloat(formData.get('negotiatedRate'));
    const totalAmount = days * negotiatedRate;
    
    // Update booking
    bookings[bookingIndex] = {
        ...bookings[bookingIndex],
        propertyId: formData.get('propertyId'),
        guestName: formData.get('guestName'),
        guestPhone: formData.get('guestPhone'),
        checkIn: checkIn,
        checkOut: checkOut,
        days: days,
        nights: nights,
        guests: parseInt(formData.get('guests')),
        negotiatedRate: negotiatedRate,
        totalAmount: totalAmount,
        status: formData.get('status'),
        updatedAt: new Date().toISOString()
    };
    
    saveToLocalStorage();
    renderBookingsTable();
    renderCalendar();
    updateDashboardStats();
    
    showNotification('Booking updated successfully!', 'success');
    closeAllModals();
}

function recordPaymentForBooking(bookingId) {
    openModal('recordPaymentModal');
    populatePaymentBookingSelect();
    document.getElementById('paymentBookingSelect').value = bookingId;
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex !== -1) {
            bookings[bookingIndex].status = 'cancelled';
            bookings[bookingIndex].updatedAt = new Date().toISOString();
            
            saveToLocalStorage();
            renderBookingsTable();
            renderCalendar();
            updateDashboardStats();
            
            showNotification('Booking cancelled successfully', 'success');
            closeAllModals();
        }
    }
}

// Payment management
function handleRecordPayment(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const bookingId = formData.get('bookingId');
    const amount = parseFloat(formData.get('amount'));
    
    if (!bookingId || !amount) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
        showNotification('Booking not found', 'error');
        return;
    }
    
    const remainingBalance = booking.totalAmount - booking.paidAmount;
    if (amount > remainingBalance) {
        showNotification(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`, 'error');
        return;
    }
    
    const payment = {
        id: generateId(),
        bookingId: bookingId,
        amount: amount,
        method: formData.get('method'),
        date: formData.get('date'),
        notes: formData.get('notes') || null,
        createdAt: new Date().toISOString()
    };
    
    payments.push(payment);
    
    // Update booking paid amount
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    bookings[bookingIndex].paidAmount += amount;
    bookings[bookingIndex].updatedAt = new Date().toISOString();
    
    saveToLocalStorage();
    renderPaymentsTable();
    renderBookingsTable();
    updateDashboardStats();
    
    showNotification('Payment recorded successfully!', 'success');
    closeAllModals();
}

function printPaymentReceipt(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    const booking = bookings.find(b => b.id === payment.bookingId);
    const property = booking ? properties.find(p => p.id === booking.propertyId) : null;
    
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
        <html>
        <head>
            <title>Payment Receipt</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #219EBC; padding-bottom: 10px; margin-bottom: 20px; }
                .receipt-details { margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
                .total { font-weight: bold; font-size: 1.2em; border-top: 1px solid #ccc; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Payment Receipt</h1>
                <p>Receipt ID: ${payment.id.substr(-6).toUpperCase()}</p>
            </div>
            <div class="receipt-details">
                <div class="detail-row"><span>Date:</span><span>${formatDate(payment.date)}</span></div>
                <div class="detail-row"><span>Payment Method:</span><span>${payment.method}</span></div>
                <div class="detail-row"><span>Amount:</span><span>${formatCurrency(payment.amount)}</span></div>
                ${booking ? `
                    <hr>
                    <h3>Booking Details</h3>
                    <div class="detail-row"><span>Guest Name:</span><span>${booking.guestName}</span></div>
                    <div class="detail-row"><span>Property:</span><span>${property ? property.name : 'Unknown'}</span></div>
                    <div class="detail-row"><span>Check-in:</span><span>${formatDate(booking.checkIn)}</span></div>
                    <div class="detail-row"><span>Check-out:</span><span>${formatDate(booking.checkOut)}</span></div>
                    <div class="detail-row"><span>Total Amount:</span><span>${formatCurrency(booking.totalAmount)}</span></div>
                    <div class="detail-row"><span>Paid Amount:</span><span>${formatCurrency(booking.paidAmount)}</span></div>
                    <div class="detail-row"><span>Balance:</span><span>${formatCurrency(booking.totalAmount - booking.paidAmount)}</span></div>
                ` : ''}
                ${payment.notes ? `
                    <hr>
                    <div class="detail-row"><span>Notes:</span><span>${payment.notes}</span></div>
                ` : ''}
            </div>
            <div style="text-align: center; margin-top: 30px; color: #666;">
                <p>Thank you for your payment!</p>
                <p>Generated on ${formatDate(new Date().toISOString())}</p>
            </div>
        </body>
        </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
}

// Inventory filters
function applyInventoryFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    const priceMin = parseFloat(document.getElementById('priceMinFilter').value) || 0;
    const priceMax = parseFloat(document.getElementById('priceMaxFilter').value) || Infinity;
    const availabilityFilter = document.getElementById('availabilityFilter').value;
    
    const cards = document.querySelectorAll('.property-card');
    
    cards.forEach(card => {
        const propertyId = card.getAttribute('data-property-id');
        const property = properties.find(p => p.id === propertyId);
        
        if (!property) {
            card.style.display = 'none';
            return;
        }
        
        let shouldShow = true;
        
        // Category filter
        if (categoryFilter && property.category !== categoryFilter) {
            shouldShow = false;
        }
        
        // Type filter
        if (typeFilter && property.type !== typeFilter) {
            shouldShow = false;
        }
        
        // Location filter
        if (locationFilter && property.location !== locationFilter) {
            shouldShow = false;
        }
        
        // Price filter
        const price = property.uniformPrice || property.weekdayPrice || property.basePrice || 0;
        if (price < priceMin || price > priceMax) {
            shouldShow = false;
        }
        
        // Availability filter
        if (availabilityFilter) {
            const today = new Date().toISOString().split('T')[0];
            const hasActiveBooking = bookings.some(b => 
                b.propertyId === propertyId && 
                b.status !== 'cancelled' && 
                today >= b.checkIn && 
                today < b.checkOut
            );
            
            if (availabilityFilter === 'available' && hasActiveBooking) {
                shouldShow = false;
            } else if (availabilityFilter === 'booked' && !hasActiveBooking) {
                shouldShow = false;
            }
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
}

// Booking History
function renderBookingHistory() {
    const tbody = document.getElementById('historyTable');
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No booking history found</td></tr>';
        return;
    }
    
    const sortedBookings = bookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    tbody.innerHTML = sortedBookings.map(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        return `
            <tr onclick="viewBookingDetails('${booking.id}')">
                <td>${formatDate(booking.createdAt)}</td>
                <td>${booking.id.substr(-6).toUpperCase()}</td>
                <td>${property ? property.name : 'Unknown'}</td>
                <td>${booking.guestName}</td>
                <td>${booking.days} days, ${booking.nights} nights</td>
                <td>${formatCurrency(booking.totalAmount)}</td>
                <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterBookingHistory() {
    const fromDate = document.getElementById('historyFromDate').value;
    const toDate = document.getElementById('historyToDate').value;
    
    if (!fromDate || !toDate) {
        showNotification('Please select both from and to dates', 'error');
        return;
    }
    
    const filteredBookings = bookings.filter(booking => {
        const bookingDate = booking.createdAt.split('T')[0];
        return bookingDate >= fromDate && bookingDate <= toDate;
    });
    
    const tbody = document.getElementById('historyTable');
    
    if (filteredBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No bookings found in selected date range</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredBookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(booking => {
            const property = properties.find(p => p.id === booking.propertyId);
            return `
                <tr onclick="viewBookingDetails('${booking.id}')">
                    <td>${formatDate(booking.createdAt)}</td>
                    <td>${booking.id.substr(-6).toUpperCase()}</td>
                    <td>${property ? property.name : 'Unknown'}</td>
                    <td>${booking.guestName}</td>
                    <td>${booking.days} days, ${booking.nights} nights</td>
                    <td>${formatCurrency(booking.totalAmount)}</td>
                    <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewBookingDetails('${booking.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
}

function shareBookingHistory() {
    const fromDate = document.getElementById('historyFromDate').value;
    const toDate = document.getElementById('historyToDate').value;
    
    if (!fromDate || !toDate) {
        showNotification('Please filter history first', 'error');
        return;
    }
    
    const filteredBookings = bookings.filter(booking => {
        const bookingDate = booking.createdAt.split('T')[0];
        return bookingDate >= fromDate && bookingDate <= toDate;
    });
    
    const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const report = `Booking History Report\nPeriod: ${formatDate(fromDate)} to ${formatDate(toDate)}\nTotal Bookings: ${filteredBookings.length}\nTotal Revenue: ${formatCurrency(totalRevenue)}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Booking History Report',
            text: report
        });
    } else {
        navigator.clipboard.writeText(report);
        showNotification('Report copied to clipboard', 'success');
    }
}

// Reports Generation
function generateReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    
    if (!fromDate || !toDate) {
        showNotification('Please select date range', 'error');
        return;
    }
    
    const filteredBookings = bookings.filter(booking => {
        const bookingDate = booking.createdAt.split('T')[0];
        return bookingDate >= fromDate && bookingDate <= toDate;
    });
    
    const filteredPayments = payments.filter(payment => {
        const paymentDate = payment.date;
        return paymentDate >= fromDate && paymentDate <= toDate;
    });
    
    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const avgRate = filteredBookings.length > 0 ? 
        filteredBookings.reduce((sum, booking) => sum + booking.negotiatedRate, 0) / filteredBookings.length : 0;
    
    // Update revenue summary
    document.getElementById('reportRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('reportBookings').textContent = filteredBookings.length;
    document.getElementById('reportAvgRate').textContent = formatCurrency(avgRate);
    
    // Property performance
    const propertyPerformance = properties.map(property => {
        const propertyBookings = filteredBookings.filter(b => b.propertyId === property.id);
        const propertyRevenue = propertyBookings.reduce((sum, booking) => {
            const bookingPayments = filteredPayments.filter(p => p.bookingId === booking.id);
            return sum + bookingPayments.reduce((pSum, payment) => pSum + payment.amount, 0);
        }, 0);
        
        return {
            property: property,
            bookings: propertyBookings.length,
            revenue: propertyRevenue,
            occupancyRate: propertyBookings.length > 0 ? 
                (propertyBookings.reduce((sum, b) => sum + b.days, 0) / ((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24))) * 100 : 0
        };
    }).sort((a, b) => b.revenue - a.revenue);
    
    document.getElementById('propertyPerformance').innerHTML = propertyPerformance.slice(0, 5).map(perf => `
        <div style="margin-bottom: 10px; padding: 10px; background: #f8fafc; border-radius: 6px;">
            <div style="font-weight: 600;">${perf.property.name}</div>
            <div style="font-size: 0.875rem; color: #64748b;">
                ${perf.bookings} bookings • ${formatCurrency(perf.revenue)} revenue
            </div>
        </div>
    `).join('') + (propertyPerformance.length === 0 ? '<p>No data available for selected period</p>' : '');
}

// PWA Setup
function setupPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service worker registration failed:', err);
        });
    }
    
    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'flex';
        
        installBtn.addEventListener('click', () => {
            installBtn.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            });
        });
    });
}

// Check for shared property
function checkSharedProperty() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('property');
    const viewAll = urlParams.get('view');
    
    if (propertyId) {
        // Show specific property
        switchTab('inventory');
        setTimeout(() => viewPropertyDetails(propertyId), 500);
    } else if (viewAll === 'all') {
        // Show all properties
        switchTab('inventory');
    }
}

// Initialize application
console.log('Calendar Manager loaded successfully!');
