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
let map = null;
let marker = null;

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

// Category pricing hierarchy
const CATEGORY_PRICE_RANGES = {
    'basic': { min: 1000, max: 3000 },
    'premium': { min: 3000, max: 6000 },
    'grande': { min: 6000, max: 10000 },
    'luxury': { min: 10000, max: 20000 },
    'ultra-luxury': { min: 20000, max: 100000 }
};

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

    // Enhanced Global Search
    document.getElementById('globalSearch').addEventListener('input', handleGlobalSearch);
    document.getElementById('globalSearch').addEventListener('focus', showGlobalSearchDropdown);
    
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

    // Maps functionality
    document.getElementById('searchMapsBtn').addEventListener('click', searchLocation);
    document.getElementById('getCurrentLocationBtn').addEventListener('click', getCurrentLocation);

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

    // Customer search
    document.getElementById('customerSearch').addEventListener('input', searchCustomers);

    // Property view navigation
    if (document.getElementById('backToApp')) {
        document.getElementById('backToApp').addEventListener('click', () => {
            document.getElementById('propertyViewPage').style.display = 'none';
            document.querySelector('.app-container').style.display = 'flex';
        });
    }

    if (document.getElementById('backToListings')) {
        document.getElementById('backToListings').addEventListener('click', () => {
            document.getElementById('propertyViewPage').style.display = 'none';
            document.getElementById('propertyListingsPage').style.display = 'block';
        });
    }

    if (document.getElementById('backToAppFromListings')) {
        document.getElementById('backToAppFromListings').addEventListener('click', () => {
            document.getElementById('propertyListingsPage').style.display = 'none';
            document.querySelector('.app-container').style.display = 'flex';
        });
    }

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

// Enhanced Global Search Functions
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
            results.push({
                type: 'customer',
                id: customer.id,
                title: customer.name,
                meta: `${customer.phone} - ${customer.totalBookings} bookings`,
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
            viewBooking(id);
            break;
        case 'payment':
            switchTab('payments');
            setTimeout(() => {
                const paymentRow = document.querySelector(`[data-payment-id="${id}"]`);
                if (paymentRow) {
                    paymentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    paymentRow.style.background = 'rgba(33, 158, 188, 0.1)';
                    setTimeout(() => { paymentRow.style.background = ''; }, 3000);
                }
            }, 100);
            break;
    }
}

function showGlobalSearchDropdown() {
    document.getElementById('searchDropdown').style.display = 'block';
}

function hideGlobalSearchDropdown() {
    document.getElementById('searchDropdown').style.display = 'none';
}

// Customer Search Functions for Booking Form
function handleCustomerSearch() {
    const query = document.getElementById('customerSearchInput').value.toLowerCase().trim();
    const dropdown = document.getElementById('customerSearchDropdown');
    
    if (query.length < 1) {
        hideCustomerSearchDropdown();
        return;
    }
    
    const matchingCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(query) || 
        customer.phone.includes(query)
    );
    
    displayCustomerSearchResults(matchingCustomers, query);
    showCustomerSearchDropdown();
}

function displayCustomerSearchResults(customers, query) {
    const dropdown = document.getElementById('customerSearchDropdown');
    
    let html = '';
    
    // Show matching customers
    if (customers.length > 0) {
        html += customers.map(customer => `
            <div class="customer-search-result" onclick="selectExistingCustomer('${customer.id}')">
                <div class="customer-search-result-name">${highlightSearchTerm(customer.name, query)}</div>
                <div class="customer-search-result-phone">${highlightSearchTerm(customer.phone, query)}</div>
            </div>
        `).join('');
    }
    
    // Always show option to add new customer
    html += `
        <div class="add-new-customer-option" onclick="selectNewCustomer('${query}')">
            <i class="fas fa-plus"></i> Add "${query}" as new customer
        </div>
    `;
    
    dropdown.innerHTML = html;
}

function selectExistingCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    document.getElementById('customerSearchInput').value = customer.name;
    document.getElementById('selectedCustomerId').value = customerId;
    document.getElementById('selectedCustomerType').value = 'existing';
    
    // Show customer info
    const customerBookings = bookings.filter(b => b.customerId === customerId);
    const photoSrc = customer.photo || 'https://i.postimg.cc/FFb1S6Vt/image.png';
    
    document.getElementById('customerInfo').innerHTML = `
        <h4>
            <img src="${photoSrc}" alt="${customer.name}" class="customer-avatar-small">
            ${customer.name} <span class="customer-type-indicator"><i class="fas fa-user-check"></i> Existing Customer</span>
        </h4>
        <p><i class="fas fa-phone"></i> ${customer.phone}</p>
        ${customer.email ? `<p><i class="fas fa-envelope"></i> ${customer.email}</p>` : ''}
        <p><i class="fas fa-calendar"></i> ${customerBookings.length} previous bookings</p>
        <p><i class="fas fa-rupee-sign"></i> ${formatCurrency(customer.totalSpent || 0)} total spent</p>
    `;
    document.getElementById('customerInfo').style.display = 'block';
    
    // Hide new customer form
    document.getElementById('newCustomerForm').style.display = 'none';
    
    hideCustomerSearchDropdown();
}

function selectNewCustomer(query) {
    document.getElementById('customerSearchInput').value = query;
    document.getElementById('selectedCustomerId').value = '';
    document.getElementById('selectedCustomerType').value = 'new';
    
    // Hide customer info
    document.getElementById('customerInfo').style.display = 'none';
    
    // Show new customer form
    document.getElementById('newCustomerForm').style.display = 'block';
    
    // Pre-fill name if it looks like a name
    if (query && !query.match(/^\d+$/)) {
        document.getElementById('newGuestName').value = query;
        document.getElementById('newGuestPhone').value = '';
    } else if (query && query.match(/^\d+$/)) {
        document.getElementById('newGuestName').value = '';
        document.getElementById('newGuestPhone').value = query;
    }
    
    hideCustomerSearchDropdown();
}

function showCustomerSearchDropdown() {
    document.getElementById('customerSearchDropdown').style.display = 'block';
}

function hideCustomerSearchDropdown() {
    document.getElementById('customerSearchDropdown').style.display = 'none';
}

// Validate booking dates
function validateBookingDates() {
    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');
    const today = new Date().toISOString().split('T')[0];
    
    // Remove previous error classes
    checkInInput.classList.remove('date-input-error');
    checkOutInput.classList.remove('date-input-error');
    
    // Remove previous error messages
    document.querySelectorAll('.date-error-message').forEach(msg => msg.remove());
    
    let hasError = false;
    
    // Check if check-in date is in the past
    if (checkInInput.value && checkInInput.value < today) {
        checkInInput.classList.add('date-input-error');
        const errorMsg = document.createElement('div');
        errorMsg.className = 'date-error-message';
        errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Check-in date cannot be in the past';
        checkInInput.parentNode.appendChild(errorMsg);
        hasError = true;
    }
    
    // Check if check-out date is before check-in date
    if (checkInInput.value && checkOutInput.value && checkOutInput.value <= checkInInput.value) {
        checkOutInput.classList.add('date-input-error');
        const errorMsg = document.createElement('div');
        errorMsg.className = 'date-error-message';
        errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Check-out date must be after check-in date';
        checkOutInput.parentNode.appendChild(errorMsg);
        hasError = true;
    }
    
    // Update checkout minimum date
    if (checkInInput.value) {
        const nextDay = new Date(checkInInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOutInput.min = nextDay.toISOString().split('T')[0];
    }
    
    if (!hasError) {
        calculateBookingTotal();
    }
}

function validateEditBookingDates() {
    const checkInInput = document.getElementById('editCheckInDate');
    const checkOutInput = document.getElementById('editCheckOutDate');
    const today = new Date().toISOString().split('T')[0];
    
    // Remove previous error classes
    checkInInput.classList.remove('date-input-error');
    checkOutInput.classList.remove('date-input-error');
    
    // Remove previous error messages
    document.querySelectorAll('.date-error-message').forEach(msg => msg.remove());
    
    // Check if check-out date is before check-in date
    if (checkInInput.value && checkOutInput.value && checkOutInput.value <= checkInInput.value) {
        checkOutInput.classList.add('date-input-error');
        const errorMsg = document.createElement('div');
        errorMsg.className = 'date-error-message';
        errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Check-out date must be after check-in date';
        checkOutInput.parentNode.appendChild(errorMsg);
    }
    
    // Update checkout minimum date
    if (checkInInput.value) {
        const nextDay = new Date(checkInInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOutInput.min = nextDay.toISOString().split('T')[0];
    }
}

// Property Management Functions
function openAddPropertyModal() {
    openModal('addPropertyModal');
    generateAmenitiesGrid();
    initializeMap();
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

// Google Maps Integration
function initializeMap() {
    if (typeof google !== 'undefined' && google.maps) {
        const mapContainer = document.getElementById('mapContainer');
        map = new google.maps.Map(mapContainer, {
            center: { lat: 19.0760, lng: 72.8777 }, // Mumbai coordinates
            zoom: 10
        });
        
        marker = new google.maps.Marker({
            position: { lat: 19.0760, lng: 72.8777 },
            map: map,
            draggable: true
        });
        
        marker.addListener('dragend', function() {
            const position = marker.getPosition();
            document.getElementById('propertyLatitude').value = position.lat();
            document.getElementById('propertyLongitude').value = position.lng();
            generateMapsUrl(position.lat(), position.lng());
        });
        
        mapContainer.style.display = 'block';
    }
}

function searchLocation() {
    const query = document.getElementById('mapsSearchInput').value;
    if (!query || typeof google === 'undefined') return;
    
    const service = new google.maps.places.PlacesService(map);
    const request = {
        query: query,
        fields: ['name', 'geometry'],
    };
    
    service.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
            const place = results[0];
            const position = place.geometry.location;
            
            map.setCenter(position);
            map.setZoom(15);
            marker.setPosition(position);
            
            document.getElementById('propertyLatitude').value = position.lat();
            document.getElementById('propertyLongitude').value = position.lng();
            generateMapsUrl(position.lat(), position.lng());
        }
    });
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                if (map && marker) {
                    const pos = new google.maps.LatLng(lat, lng);
                    map.setCenter(pos);
                    map.setZoom(15);
                    marker.setPosition(pos);
                    
                    document.getElementById('propertyLatitude').value = lat;
                    document.getElementById('propertyLongitude').value = lng;
                    generateMapsUrl(lat, lng);
                }
            },
            () => {
                showNotification('Error: The Geolocation service failed.', 'error');
            }
        );
    } else {
        showNotification('Error: Your browser doesn\'t support geolocation.', 'error');
    }
}

function generateMapsUrl(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    document.getElementById('propertyMapsUrl').value = url;
}

// Property Actions
function handleAddProperty(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Get selected amenities
    const selectedAmenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked'))
        .map(checkbox => checkbox.value);
    
    const propertyId = document.getElementById('editPropertyId').value;
    const isEditing = !!propertyId;
    
    const propertyData = {
        id: isEditing ? propertyId : generateId(),
        name: formData.get('name'),
        type: formData.get('type'),
        category: formData.get('category'),
        location: formData.get('location'),
        description: formData.get('description'),
        maxGuests: parseInt(formData.get('maxGuests')),
        bedrooms: parseInt(formData.get('bedrooms')) || 0,
        pricingType: formData.get('pricingType'),
        amenities: selectedAmenities,
        images: currentPropertyImages.length > 0 ? currentPropertyImages : (isEditing ? properties.find(p => p.id === propertyId)?.images || [] : []),
        coverImage: currentPropertyImages.length > 0 ? currentPropertyImages[0] : (isEditing ? properties.find(p => p.id === propertyId)?.coverImage : null),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        mapsUrl: formData.get('mapsUrl'),
        createdAt: isEditing ? properties.find(p => p.id === propertyId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add pricing data based on type
    if (formData.get('pricingType') === 'uniform') {
        propertyData.uniformPrice = parseInt(formData.get('uniformPrice'));
        propertyData.basePrice = propertyData.uniformPrice;
    } else {
        propertyData.weekdayPrice = parseInt(formData.get('weekdayPrice'));
        propertyData.weekendPrice = parseInt(formData.get('weekendPrice'));
        propertyData.basePrice = propertyData.weekdayPrice;
    }
    
    if (isEditing) {
        const index = properties.findIndex(p => p.id === propertyId);
        properties[index] = propertyData;
        showNotification('Property updated successfully!', 'success');
    } else {
        properties.push(propertyData);
        showNotification('Property added successfully!', 'success');
    }
    
    localStorage.setItem('properties', JSON.stringify(properties));
    
    closeAllModals();
    renderPropertiesGrid();
    updateDashboardStats();
    populateSelects();
    populateLocationFilters();
}

function handlePricingTypeChange(e) {
    const pricingType = e.target.value;
    const uniformPricing = document.getElementById('uniformPricing');
    const weeklyPricing = document.getElementById('weeklyPricing');
    
    if (pricingType === 'uniform') {
        uniformPricing.style.display = 'block';
        weeklyPricing.style.display = 'none';
        weeklyPricing.querySelectorAll('input').forEach(input => input.removeAttribute('required'));
        uniformPricing.querySelector('input').setAttribute('required', '');
    } else {
        uniformPricing.style.display = 'none';
        weeklyPricing.style.display = 'block';
        uniformPricing.querySelector('input').removeAttribute('required');
        weeklyPricing.querySelectorAll('input').forEach(input => input.setAttribute('required', ''));
    }
}

function renderPropertiesGrid() {
    const grid = document.getElementById('propertiesGrid');
    
    if (properties.length === 0) {
        grid.innerHTML = `
            <div class="no-data" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-building" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                <p>No properties added yet. Add your first property to get started!</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = properties.map(property => {
        const availability = getPropertyAvailability(property.id);
        const categoryClass = `category-${property.category}`;
        const statusClass = `status-${availability}`;
        
        return `
            <div class="property-card ${categoryClass} ${statusClass}" data-property-id="${property.id}">
                <div class="category-badge ${property.category}">${property.category.replace('-', ' ')}</div>
                <div class="availability-badge ${availability}">${availability}</div>
                <img class="property-image" 
                     src="${property.coverImage || property.images?.[0] || 'https://via.placeholder.com/380x220?text=No+Image'}" 
                     alt="${property.name}"
                     onclick="viewPropertyDetails('${property.id}')">
                <div class="property-content">
                    <div class="property-header">
                        <div>
                            <h3 class="property-title">${property.name}</h3>
                            <p class="property-type">${property.type}</p>
                            <p class="property-guests">
                                <i class="fas fa-users"></i> Up to ${property.maxGuests} guests
                            </p>
                        </div>
                        <div class="property-price">${formatPropertyPrice(property)}</div>
                    </div>
                    <p class="property-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${property.location}
                    </p>
                    ${property.amenities && property.amenities.length > 0 ? `
                        <div class="property-amenities">
                            ${property.amenities.slice(0, 6).map(amenity => 
                                `<span class="amenity-tag">${amenity}</span>`
                            ).join('')}
                            ${property.amenities.length > 6 ? `<span class="amenity-tag">+${property.amenities.length - 6} more</span>` : ''}
                        </div>
                    ` : ''}
                    <div class="property-actions">
                        <button class="btn btn-primary btn-sm" onclick="shareProperty('${property.id}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                        <button class="btn btn-success btn-sm" onclick="bookProperty('${property.id}')">
                            <i class="fas fa-calendar-plus"></i> Book
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editProperty('${property.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProperty('${property.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getPropertyAvailability(propertyId) {
    const today = new Date();
    const activeBookings = bookings.filter(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        return booking.propertyId === propertyId && 
               booking.status !== 'cancelled' &&
               checkIn <= today && 
               checkOut > today;
    });
    
    return activeBookings.length > 0 ? 'booked' : 'available';
}

function viewPropertyDetails(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const images = property.images && property.images.length > 0 ? property.images : ['https://via.placeholder.com/600x400?text=No+Image'];
    const photoSrc = property.coverImage || property.images?.[0] || 'https://via.placeholder.com/600x400?text=No+Image';
    
    document.getElementById('propertyDetailsTitle').textContent = property.name;
    document.getElementById('propertyDetailsContent').innerHTML = `
        <div class="property-details-images">
            ${images.map(img => `<img src="${img}" alt="${property.name}">`).join('')}
        </div>
        <div class="property-details-info">
            <h2>${property.name}</h2>
            <div class="category-badge ${property.category}">${property.category.replace('-', ' ')}</div>
            <p><strong>Type:</strong> ${property.type}</p>
            <p><strong>Location:</strong> ${property.location}</p>
            <p><strong>Price:</strong> ${formatPropertyPrice(property)}</p>
            <p><strong>Max Guests:</strong> ${property.maxGuests}</p>
            <p><strong>Bedrooms:</strong> ${property.bedrooms || 'N/A'}</p>
            ${property.description ? `<p><strong>Description:</strong> ${property.description}</p>` : ''}
            ${property.mapsUrl ? `
                <p><strong>Location:</strong> 
                    <a href="${property.mapsUrl}" target="_blank" class="btn btn-secondary btn-sm">
                        <i class="fas fa-map-marker-alt"></i> View on Google Maps
                    </a>
                </p>
            ` : ''}
            ${property.amenities && property.amenities.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <strong>Amenities:</strong>
                    <div class="property-amenities" style="margin-top: 0.5rem;">
                        ${property.amenities.map(amenity => `<span class="amenity-tag">${amenity}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    openModal('propertyDetailsModal');
}

function populateLocationFilters() {
    const locationFilter = document.getElementById('locationFilter');
    const currentValue = locationFilter.value;
    
    // Get unique locations
    const locations = [...new Set(properties.map(p => p.location))];
    
    locationFilter.innerHTML = '<option value="">All Locations</option>';
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
    
    locationFilter.value = currentValue;
    
    // Also populate listings location filter if it exists
    const listingsLocationFilter = document.getElementById('listingsLocationFilter');
    if (listingsLocationFilter) {
        const currentListingsValue = listingsLocationFilter.value;
        listingsLocationFilter.innerHTML = '<option value="">All Locations</option>';
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            listingsLocationFilter.appendChild(option);
        });
        listingsLocationFilter.value = currentListingsValue;
    }
}

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
        
        // Filter by category
        if (categoryFilter && property.category !== categoryFilter) {
            card.style.display = 'none';
            return;
        }
        
        // Filter by type
        if (typeFilter && property.type !== typeFilter) {
            card.style.display = 'none';
            return;
        }
        
        // Filter by location
        if (locationFilter && property.location !== locationFilter) {
            card.style.display = 'none';
            return;
        }
        
        // Filter by price
        const propertyPrice = property.uniformPrice || property.weekdayPrice || property.basePrice || 0;
        if (propertyPrice < priceMin || propertyPrice > priceMax) {
            card.style.display = 'none';
            return;
        }
        
        // Filter by availability
        if (availabilityFilter) {
            const availability = getPropertyAvailability(propertyId);
            if (availability !== availabilityFilter) {
                card.style.display = 'none';
                return;
            }
        }
        
        card.style.display = 'block';
    });
}

// Enhanced Booking Management
function openAddBookingModal() {
    openModal('addBookingModal');
    populateBookingPropertySelect();
    clearBookingForm();
}

function clearBookingForm() {
    document.getElementById('customerSearchInput').value = '';
    document.getElementById('selectedCustomerId').value = '';
    document.getElementById('selectedCustomerType').value = 'existing';
    document.getElementById('customerInfo').style.display = 'none';
    document.getElementById('newCustomerForm').style.display = 'none';
    hideCustomerSearchDropdown();
}

function populateBookingPropertySelect() {
    const select = document.getElementById('bookingPropertySelect');
    select.innerHTML = '<option value="">Select Property</option>';
    
    properties.forEach(property => {
        const option = document.createElement('option');
        option.value = property.id;
        option.textContent = `${property.name} (${formatPropertyPrice(property)})`;
        select.appendChild(option);
    });
}

function handlePropertySelection(e) {
    const propertyId = e.target.value;
    const propertyInfo = document.getElementById('propertyInfo');
    
    if (propertyId) {
        const property = properties.find(p => p.id === propertyId);
        if (property) {
            const availability = getPropertyAvailability(propertyId);
            propertyInfo.innerHTML = `
                <h4>${property.name}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
                <p><i class="fas fa-users"></i> Max ${property.maxGuests} guests</p>
                <p><i class="fas fa-bed"></i> ${property.bedrooms} bedrooms</p>
                <p><i class="fas fa-tag"></i> ${property.category.replace('-', ' ')} ${property.type}</p>
                <div class="availability-badge ${availability}">${availability}</div>
                <p><strong>Base Price: ${formatPropertyPrice(property)}</strong></p>
            `;
            propertyInfo.style.display = 'block';
            
            // Set base rate
            const baseRate = property.pricingType === 'weekly' ? property.weekdayPrice : (property.uniformPrice || property.basePrice);
            document.querySelector('input[name="baseRate"]').value = baseRate;
            document.querySelector('input[name="negotiatedRate"]').value = baseRate;
            
            calculateBookingTotal();
        }
    } else {
        propertyInfo.style.display = 'none';
    }
}

function checkGuestLimit() {
    const propertyId = document.getElementById('bookingPropertySelect').value;
    const guestsCount = parseInt(document.querySelector('input[name="guests"]').value);
    const warningDiv = document.getElementById('guestWarning');
    
    if (propertyId && guestsCount) {
        const property = properties.find(p => p.id === propertyId);
        if (property && property.maxGuests && guestsCount > property.maxGuests) {
            warningDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                Warning: Guest count (${guestsCount}) exceeds property limit (${property.maxGuests})
            `;
            warningDiv.style.display = 'block';
        } else {
            warningDiv.style.display = 'none';
        }
    } else {
        warningDiv.style.display = 'none';
    }
}

function calculateBookingTotal() {
    const form = document.getElementById('addBookingForm');
    const checkIn = form.querySelector('input[name="checkIn"]').value;
    const checkOut = form.querySelector('input[name="checkOut"]').value;
    const rate = parseFloat(form.querySelector('input[name="negotiatedRate"]').value) || 0;
    
    if (checkIn && checkOut && rate) {
        const { days, nights } = calculateDaysAndNights(checkIn, checkOut);
        
        if (days > 0) {
            const total = days * rate;
            
            document.getElementById('totalDaysInput').value = days;
            document.getElementById('totalNightsInput').value = nights;
            document.getElementById('durationSummary').textContent = `${days} days, ${nights} nights`;
            document.getElementById('totalAmount').textContent = total.toLocaleString();
        }
    }
    
    checkGuestLimit();
}

function handleAddBooking(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Validate dates first
    const checkInDate = formData.get('checkIn');
    const checkOutDate = formData.get('checkOut');
    const today = new Date().toISOString().split('T')[0];
    
    if (checkInDate < today) {
        showNotification('Check-in date cannot be in the past!', 'error');
        return;
    }
    
    if (checkOutDate <= checkInDate) {
        showNotification('Check-out date must be after check-in date!', 'error');
        return;
    }
    
    const { days, nights } = calculateDaysAndNights(checkInDate, checkOutDate);
    const rate = parseFloat(formData.get('negotiatedRate'));
    const total = days * rate;
    
    let customerId = document.getElementById('selectedCustomerId').value;
    let guestName, guestPhone, guestEmail;
    let isNewCustomer = false;
    
    const customerType = document.getElementById('selectedCustomerType').value;
    
    if (customerType === 'new') {
        // Create new customer
        const newCustomer = {
            id: generateId(),
            name: formData.get('guestName'),
            phone: formData.get('guestPhone'),
            email: formData.get('guestEmail') || '',
            address: '',
            idType: 'aadhar',
            idNumber: '',
            photo: null,
            createdAt: new Date().toISOString(),
            totalBookings: 0,
            totalSpent: 0
        };
        
        customers.push(newCustomer);
        localStorage.setItem('customers', JSON.stringify(customers));
        customerId = newCustomer.id;
        guestName = newCustomer.name;
        guestPhone = newCustomer.phone;
        guestEmail = newCustomer.email;
        isNewCustomer = true;
    } else {
        // Use existing customer
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            guestName = customer.name;
            guestPhone = customer.phone;
            guestEmail = customer.email;
        } else {
            showNotification('Please select a customer or add new customer details!', 'error');
            return;
        }
    }
    
    const booking = {
        id: generateId(),
        propertyId: formData.get('propertyId'),
        customerId: customerId,
        guestName: guestName,
        guestPhone: guestPhone,
        guestEmail: guestEmail,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        days: days,
        nights: nights,
        baseRate: parseFloat(formData.get('baseRate')),
        negotiatedRate: rate,
        totalAmount: total,
        paidAmount: 0,
        guests: parseInt(formData.get('guests')),
        status: 'confirmed',
        isNewCustomer: isNewCustomer,
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    closeAllModals();
    renderBookingsTable();
    renderCustomersGrid();
    updateDashboardStats();
    renderCalendar();
    populateSelects();
    
    showNotification('Booking created successfully!', 'success');
}

// Edit Booking Functionality
function editBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    // Populate edit booking form
    document.getElementById('editBookingId').value = bookingId;
    
    // Populate property select
    const editPropertySelect = document.getElementById('editBookingPropertySelect');
    editPropertySelect.innerHTML = '<option value="">Select Property</option>';
    properties.forEach(property => {
        const option = document.createElement('option');
        option.value = property.id;
        option.textContent = `${property.name} (${formatPropertyPrice(property)})`;
        editPropertySelect.appendChild(option);
    });
    editPropertySelect.value = booking.propertyId;
    
    // Fill form with existing data
    const editForm = document.getElementById('editBookingForm');
    editForm.querySelector('input[name="guestName"]').value = booking.guestName;
    editForm.querySelector('input[name="guestPhone"]').value = booking.guestPhone;
    editForm.querySelector('input[name="checkIn"]').value = booking.checkIn;
    editForm.querySelector('input[name="checkOut"]').value = booking.checkOut;
    editForm.querySelector('input[name="guests"]').value = booking.guests;
    editForm.querySelector('input[name="negotiatedRate"]').value = booking.negotiatedRate;
    editForm.querySelector('select[name="status"]').value = booking.status;
    
    openModal('editBookingModal');
}

function handleEditBooking(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bookingId = document.getElementById('editBookingId').value;
    
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return;
    
    // Validate dates
    const checkInDate = formData.get('checkIn');
    const checkOutDate = formData.get('checkOut');
    
    if (checkOutDate <= checkInDate) {
        showNotification('Check-out date must be after check-in date!', 'error');
        return;
    }
    
    const { days, nights } = calculateDaysAndNights(checkInDate, checkOutDate);
    const rate = parseFloat(formData.get('negotiatedRate'));
    const total = days * rate;
    
    // Update booking
    const booking = bookings[bookingIndex];
    booking.propertyId = formData.get('propertyId');
    booking.guestName = formData.get('guestName');
    booking.guestPhone = formData.get('guestPhone');
    booking.checkIn = checkInDate;
    booking.checkOut = checkOutDate;
    booking.days = days;
    booking.nights = nights;
    booking.negotiatedRate = rate;
    booking.totalAmount = total;
    booking.guests = parseInt(formData.get('guests'));
    booking.status = formData.get('status');
    booking.updatedAt = new Date().toISOString();
    
    // If amount changed, adjust paid amount to not exceed new total
    if (booking.paidAmount > total) {
        booking.paidAmount = total;
    }
    
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    closeAllModals();
    renderBookingsTable();
    renderCalendar();
    updateDashboardStats();
    
    showNotification('Booking updated successfully!', 'success');
}

function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTable');
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="no-data">No bookings found</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.slice().reverse().map(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        const balance = booking.totalAmount - booking.paidAmount;
        
        return `
            <tr data-booking-id="${booking.id}">
                <td>${booking.id.substr(-6).toUpperCase()}</td>
                <td>${property ? property.name : 'Unknown Property'}</td>
                <td>${booking.guestName}</td>
                <td>
                    ${booking.isNewCustomer ? '<span class="new-customer-badge">New Customer</span>' : 'Existing Customer'}
                </td>
                <td>${formatDate(booking.checkIn)}</td>
                <td>${formatDate(booking.checkOut)}</td>
                <td>${booking.days}/${booking.nights}</td>
                <td>${formatCurrency(booking.negotiatedRate)}</td>
                <td>${formatCurrency(booking.totalAmount)}</td>
                <td>${formatCurrency(booking.paidAmount)}</td>
                <td style="color: ${balance > 0 ? '#dc2626' : '#059669'}">${formatCurrency(balance)}</td>
                <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewBooking('${booking.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editBooking('${booking.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cancelBooking('${booking.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Update recent bookings in dashboard
    updateRecentBookingsTable();
}

function updateRecentBookingsTable() {
    const recentBookings = bookings.slice(-5).reverse();
    const recentTbody = document.getElementById('recentBookingsTable');
    
    if (recentBookings.length === 0) {
        recentTbody.innerHTML = '<tr><td colspan="7" class="no-data">No recent bookings</td></tr>';
    } else {
        recentTbody.innerHTML = recentBookings.map(booking => {
            const property = properties.find(p => p.id === booking.propertyId);
            return `
                <tr>
                    <td>${property ? property.name : 'Unknown'}</td>
                    <td>${booking.guestName}</td>
                    <td>${formatDate(booking.checkIn)}</td>
                    <td>${formatDate(booking.checkOut)}</td>
                    <td>${booking.days}/${booking.nights}</td>
                    <td>${formatCurrency(booking.totalAmount)}</td>
                    <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                </tr>
            `;
        }).join('');
    }
}

// Share All Properties Function
function openShareAllPropertiesModal() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=all`;
    
    document.getElementById('shareAllLink').value = shareUrl;
    
    // Setup share buttons
    document.getElementById('shareAllWhatsApp').onclick = () => {
        const message = `Check out our amazing property collection!\n\nWe have ${properties.length} properties available across different categories and locations.\n\nView all properties: ${shareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    };
    
    document.getElementById('shareAllEmail').onclick = () => {
        const subject = 'Property Portfolio - Premium Accommodations';
        const body = `Hi,\n\nI wanted to share our complete property portfolio with you.\n\nWe offer ${properties.length} carefully selected properties across various categories:\n\n${properties.map(p => `• ${p.name} (${p.type}) - ${p.location}`).join('\n')}\n\nView our complete collection: ${shareUrl}\n\nContact us for bookings and inquiries!`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };
    
    openModal('shareAllPropertiesModal');
}

function copyAllPropertiesLink() {
    const shareLink = document.getElementById('shareAllLink');
    shareLink.select();
    shareLink.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        showNotification('All properties link copied to clipboard!', 'success');
    } catch (err) {
        navigator.clipboard.writeText(shareLink.value).then(() => {
            showNotification('All properties link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy link', 'error');
        });
    }
}

// Enhanced Calendar Functions
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('currentMonth');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYear.textContent = new Date(year, month).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const propertyFilter = document.getElementById('propertyFilter').value;
    
    let calendarHTML = `
        <div class="calendar-month">
            <div class="calendar-day-header">Sun</div>
            <div class="calendar-day-header">Mon</div>
            <div class="calendar-day-header">Tue</div>
            <div class="calendar-day-header">Wed</div>
            <div class="calendar-day-header">Thu</div>
            <div class="calendar-day-header">Fri</div>
            <div class="calendar-day-header">Sat</div>
    `;
    
    const today = new Date();
    let currentCalendarDate = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
        for (let day = 0; day < 7; day++) {
            const isCurrentMonth = currentCalendarDate.getMonth() === month;
            const isToday = currentCalendarDate.toDateString() === today.toDateString();
            
            let dayClass = 'calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (isToday) dayClass += ' today';
            
            // Get bookings for this date
            const dateStr = currentCalendarDate.toISOString().split('T')[0];
            const dayBookings = bookings.filter(booking => {
                const checkIn = new Date(booking.checkIn);
                const checkOut = new Date(booking.checkOut);
                const currentDateObj = new Date(currentCalendarDate);
                
                if (propertyFilter && booking.propertyId !== propertyFilter) {
                    return false;
                }
                
                return currentDateObj >= checkIn && currentDateObj < checkOut && booking.status !== 'cancelled';
            });
            
            let bookingsHTML = '';
            dayBookings.slice(0, 2).forEach(booking => {
                const property = properties.find(p => p.id === booking.propertyId);
                const propertyName = property ? property.name.substring(0, 12) : 'Unknown';
                const guestName = booking.guestName.split(' ')[0]; // First name only
                
                bookingsHTML += `
                    <div class="calendar-booking" 
                         title="${property ? property.name : 'Unknown'} - ${booking.guestName} (${booking.guestPhone})"
                         onclick="event.stopPropagation(); viewBooking('${booking.id}')">
                        ${guestName} - ${propertyName}
                    </div>
                `;
            });
            
            if (dayBookings.length > 2) {
                bookingsHTML += `<div class="calendar-booking">+${dayBookings.length - 2} more</div>`;
            }
            
            calendarHTML += `
                <div class="${dayClass}" 
                     data-date="${dateStr}"
                     onclick="openDayModal('${dateStr}')">
                    <div class="calendar-day-number">${currentCalendarDate.getDate()}</div>
                    ${bookingsHTML}
                </div>
            `;
            
            currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
        }
    }
    
    calendarHTML += '</div>';
    grid.innerHTML = calendarHTML;
}

function openDayModal(dateStr) {
    selectedDate = dateStr;
    const date = new Date(dateStr);
    const dayBookings = bookings.filter(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        const selectedDateObj = new Date(date);
        
        return selectedDateObj >= checkIn && selectedDateObj < checkOut && booking.status !== 'cancelled';
    });
    
    document.getElementById('dayModalTitle').textContent = 
        `Bookings for ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    
    // Day summary
    const totalProperties = new Set(dayBookings.map(b => b.propertyId)).size;
    const totalGuests = dayBookings.reduce((sum, booking) => sum + booking.guests, 0);
    const totalRevenue = dayBookings.reduce((sum, booking) => sum + (booking.negotiatedRate || 0), 0);
    
    document.getElementById('daySummary').innerHTML = `
        <h4>Day Summary</h4>
        <p><strong>${dayBookings.length}</strong> bookings across <strong>${totalProperties}</strong> properties</p>
        <p><strong>${totalGuests}</strong> total guests</p>
        <p><strong>${formatCurrency(totalRevenue)}</strong> daily revenue</p>
    `;
    
    // Day bookings
    const dayBookingsContainer = document.getElementById('dayBookings');
    if (dayBookings.length === 0) {
        dayBookingsContainer.innerHTML = '<p>No bookings for this date.</p>';
    } else {
        dayBookingsContainer.innerHTML = dayBookings.map(booking => {
            const property = properties.find(p => p.id === booking.propertyId);
            const customer = customers.find(c => c.id === booking.customerId);
            
            return `
                <div class="day-booking-item">
                    <h5>${booking.guestName}</h5>
                    <p><i class="fas fa-building"></i> <strong>Property:</strong> ${property ? property.name : 'Unknown'}</p>
                    <p><i class="fas fa-calendar"></i> <strong>Stay:</strong> ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</p>
                    <p><i class="fas fa-users"></i> <strong>Guests:</strong> ${booking.guests}</p>
                    <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${booking.guestPhone}</p>
                    <p><i class="fas fa-rupee-sign"></i> <strong>Rate:</strong> ${formatCurrency(booking.negotiatedRate)}/day</p>
                    <p><i class="fas fa-info-circle"></i> <strong>Status:</strong> 
                        <span class="status-badge status-${booking.status}">${booking.status}</span>
                        ${booking.isNewCustomer ? '<span class="new-customer-badge">New Customer</span>' : ''}
                    </p>
                    <div style="margin-top: 0.5rem;">
                        <button class="btn btn-sm btn-warning" onclick="editBooking('${booking.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    openModal('calendarDayModal');
}

// Utility Functions
function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

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
    }
}

function updateDashboardStats() {
    const totalProperties = properties.length;
    const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalCustomers = customers.length;
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    document.getElementById('totalProperties').textContent = totalProperties;
    document.getElementById('totalBookings').textContent = activeBookings;
    document.getElementById('totalCustomers').textContent = totalCustomers;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN');
}

function formatPropertyPrice(property) {
    if (property.pricingType === 'weekly') {
        return `₹${property.weekdayPrice}/day (WD), ₹${property.weekendPrice}/day (WE)`;
    } else {
        return `₹${property.uniformPrice || property.basePrice}/day`;
    }
}

function calculateDaysAndNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const nights = Math.max(0, days - 1);
    return { days, nights };
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
    
    // Stop camera if active
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    // Clear forms
    document.querySelectorAll('form').forEach(form => form.reset());
    clearImagePreview();
    currentPropertyImages = [];
    
    // Reset form states
    document.getElementById('editPropertyId').value = '';
    document.getElementById('propertyModalTitle').textContent = 'Add New Property';
    document.getElementById('savePropertyBtn').textContent = 'Add Property';
    
    document.getElementById('editCustomerId').value = '';
    document.getElementById('customerModalTitle').textContent = 'Add New Customer';
    document.getElementById('saveCustomerBtn').textContent = 'Add Customer';
    removeCustomerPhoto();
    
    clearBookingForm();
    
    // Clear date validation errors
    document.querySelectorAll('.date-input-error').forEach(input => {
        input.classList.remove('date-input-error');
    });
    document.querySelectorAll('.date-error-message').forEach(msg => msg.remove());
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 500;
    `;
    
    switch(type) {
        case 'success':
            notification.style.background = '#059669';
            break;
        case 'warning':
            notification.style.background = '#d97706';
            break;
        case 'error':
            notification.style.background = '#dc2626';
            break;
        default:
            notification.style.background = '#219EBC';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// PWA Setup
function setupPWA() {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installBtn').style.display = 'flex';
    });

    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (outcome === 'accepted') {
                document.getElementById('installBtn').style.display = 'none';
            }
        }
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
}

// Initialize remaining functions for completeness
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    const existingImages = document.getElementById('editPropertyId').value ? 
        properties.find(p => p.id === document.getElementById('editPropertyId').value)?.images || [] : [];
    
    currentPropertyImages = [...existingImages];
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentPropertyImages.push(e.target.result);
            updateImagePreview();
        };
        reader.readAsDataURL(file);
    });
    
    if (files.length === 0 && existingImages.length > 0) {
        currentPropertyImages = [...existingImages];
        updateImagePreview();
    }
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
    
    preview.innerHTML = currentPropertyImages.map((image, index) => `
        <div class="image-preview-item">
            <img src="${image}" alt="Preview ${index + 1}">
            <button type="button" class="remove-image" onclick="removeImage(${index})">&times;</button>
        </div>
    `).join('');
    
    coverSelector.style.display = 'block';
    coverOptions.innerHTML = currentPropertyImages.map((image, index) => `
        <div class="cover-option">
            <input type="radio" name="coverImage" value="${index}" id="cover_${index}" ${index === 0 ? 'checked' : ''}>
            <img src="${image}" alt="Cover option ${index + 1}">
        </div>
    `).join('');
}

function removeImage(index) {
    currentPropertyImages.splice(index, 1);
    updateImagePreview();
}

function clearImagePreview() {
    currentPropertyImages = [];
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('coverImageSelector').style.display = 'none';
}

// Auto-save functionality
setInterval(() => {
    if (properties.length > 0 || bookings.length > 0 || customers.length > 0 || payments.length > 0) {
        localStorage.setItem('properties', JSON.stringify(properties));
        localStorage.setItem('bookings', JSON.stringify(bookings));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('payments', JSON.stringify(payments));
    }
}, 30000);

// Handle page visibility change to save data
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        localStorage.setItem('properties', JSON.stringify(properties));
        localStorage.setItem('bookings', JSON.stringify(bookings));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('payments', JSON.stringify(payments));
    }
});

// Placeholder functions for remaining functionality
function shareProperty(propertyId) {
    // Implementation for sharing individual property
    console.log('Share property:', propertyId);
}

function bookProperty(propertyId) {
    // Implementation for booking property
    console.log('Book property:', propertyId);
}

function editProperty(propertyId) {
    // Implementation for editing property
    console.log('Edit property:', propertyId);
}

function deleteProperty(propertyId) {
    // Implementation for deleting property
    console.log('Delete property:', propertyId);
}

function viewBooking(bookingId) {
    // Implementation for viewing booking
    console.log('View booking:', bookingId);
}

function cancelBooking(bookingId) {
    // Implementation for canceling booking
    console.log('Cancel booking:', bookingId);
}

// Additional helper functions
function populateSelects() {
    // Populate property filter in calendar
    const propertyFilter = document.getElementById('propertyFilter');
    const currentValue = propertyFilter.value;
    propertyFilter.innerHTML = '<option value="">All Properties</option>';
    
    properties.forEach(property => {
        const option = document.createElement('option');
        option.value = property.id;
        option.textContent = property.name;
        propertyFilter.appendChild(option);
    });
    
    propertyFilter.value = currentValue;
}

function setDefaultDates() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (document.getElementById('reportFromDate')) {
        document.getElementById('reportFromDate').value = firstDayOfMonth.toISOString().split('T')[0];
        document.getElementById('reportToDate').value = today.toISOString().split('T')[0];
    }
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (document.getElementById('historyFromDate')) {
        document.getElementById('historyFromDate').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('historyToDate').value = today.toISOString().split('T')[0];
    }
    
    const paymentForm = document.getElementById('recordPaymentForm');
    if (paymentForm) {
        const dateInput = paymentForm.querySelector('input[name="date"]');
        if (dateInput) {
            dateInput.value = today.toISOString().split('T')[0];
        }
    }
}

function checkSharedProperty() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('property');
    const viewAll = urlParams.get('view');
    
    if (propertyId) {
        const property = properties.find(p => p.id === propertyId);
        if (property) {
            showPropertyView(property);
        }
    } else if (viewAll === 'all') {
        showAllPropertiesView();
    }
}

function showPropertyView(property) {
    // Implementation for showing property view
    console.log('Show property view:', property);
}

function showAllPropertiesView() {
    // Implementation for showing all properties view
    console.log('Show all properties view');
}

// Customer photo management
function handleCustomerPhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentCustomerPhoto = e.target.result;
        document.getElementById('customerPhotoPreview').src = currentCustomerPhoto;
        document.getElementById('removeCustomerPhoto').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function openCamera() {
    openModal('cameraModal');
    
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            cameraStream = stream;
            document.getElementById('cameraVideo').srcObject = stream;
        })
        .catch(err => {
            console.error('Error accessing camera:', err);
            showNotification('Unable to access camera', 'error');
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
    
    currentCustomerPhoto = canvas.toDataURL('image/jpeg', 0.8);
    document.getElementById('customerPhotoPreview').src = currentCustomerPhoto;
    document.getElementById('removeCustomerPhoto').style.display = 'block';
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    closeAllModals();
    openModal('addCustomerModal');
}

function removeCustomerPhoto() {
    currentCustomerPhoto = null;
    document.getElementById('customerPhotoPreview').src = 'https://i.postimg.cc/FFb1S6Vt/image.png';
    document.getElementById('removeCustomerPhoto').style.display = 'none';
    document.getElementById('customerPhotoInput').value = '';
}

// Customer management
function openAddCustomerModal(customerId = null) {
    const isEditing = !!customerId;
    
    document.getElementById('customerModalTitle').textContent = isEditing ? 'Edit Customer' : 'Add New Customer';
    document.getElementById('saveCustomerBtn').textContent = isEditing ? 'Update Customer' : 'Add Customer';
    
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
            } else {
                removeCustomerPhoto();
            }
        }
    } else {
        removeCustomerPhoto();
    }
    
    openModal('addCustomerModal');
}

function handleAddCustomer(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const customerId = document.getElementById('editCustomerId').value;
    const isEditing = !!customerId;
    
    const customerData = {
        id: isEditing ? customerId : generateId(),
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email') || '',
        address: formData.get('address') || '',
        idType: formData.get('idType'),
        idNumber: formData.get('idNumber') || '',
        photo: currentCustomerPhoto,
        createdAt: isEditing ? customers.find(c => c.id === customerId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalBookings: 0,
        totalSpent: 0
    };

    if (isEditing) {
        const index = customers.findIndex(c => c.id === customerId);
        const existingCustomer = customers[index];
        customerData.totalBookings = existingCustomer?.totalBookings || 0;
        customerData.totalSpent = existingCustomer?.totalSpent || 0;
        customers[index] = customerData;
        showNotification('Customer updated successfully!', 'success');
    } else {
        customers.push(customerData);
        showNotification('Customer added successfully!', 'success');
    }

    localStorage.setItem('customers', JSON.stringify(customers));
    
    closeAllModals();
    renderCustomersGrid();
    updateDashboardStats();
    populateSelects();
}

function renderCustomersGrid() {
    const grid = document.getElementById('customersGrid');
    
    if (customers.length === 0) {
        grid.innerHTML = `
            <div class="no-data" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-users" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                <p>No customers added yet. Add your first customer to get started!</p>
            </div>
        `;
        return;
    }

    // Update customer stats
    customers.forEach(customer => {
        const customerBookings = bookings.filter(b => b.customerId === customer.id);
        customer.totalBookings = customerBookings.length;
        customer.totalSpent = customerBookings.reduce((sum, booking) => sum + (booking.paidAmount || 0), 0);
    });
    
    localStorage.setItem('customers', JSON.stringify(customers));

    grid.innerHTML = customers.map(customer => {
        const customerBookings = bookings.filter(b => b.customerId === customer.id).slice(0, 3);
        const photoSrc = customer.photo || 'https://i.postimg.cc/FFb1S6Vt/image.png';
        
        return `
            <div class="customer-card" data-customer-id="${customer.id}">
                <div class="customer-header">
                    <img src="${photoSrc}" alt="${customer.name}" class="customer-avatar">
                    <div class="customer-info">
                        <h3>${customer.name}</h3>
                        <p class="customer-contact">
                            <i class="fas fa-phone"></i> ${customer.phone}
                        </p>
                        ${customer.email ? `
                            <p class="customer-contact">
                                <i class="fas fa-envelope"></i> ${customer.email}
                            </p>
                        ` : ''}
                    </div>
                    <div class="customer-stats">
                        <div>${customer.totalBookings} bookings</div>
                        <div>${formatCurrency(customer.totalSpent)} spent</div>
                    </div>
                </div>
                
                ${customerBookings.length > 0 ? `
                    <div class="customer-booking-history">
                        <h4>Recent Bookings</h4>
                        ${customerBookings.map(booking => {
                            const property = properties.find(p => p.id === booking.propertyId);
                            return `
                                <div class="booking-history-item">
                                    <strong>${property ? property.name : 'Unknown Property'}</strong> - 
                                    ${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)} - 
                                    ${formatCurrency(booking.totalAmount)}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
                
                <div class="customer-actions">
                    <button class="btn btn-primary btn-sm" onclick="bookForCustomer('${customer.id}')">
                        <i class="fas fa-calendar-plus"></i> New Booking
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="viewCustomerDetails('${customer.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="editCustomer('${customer.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${customer.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Stub functions - implement these based on your requirements
function copyShareLink() { console.log('Copy share link'); }
function searchCustomers() { console.log('Search customers'); }
function bookForCustomer(customerId) { console.log('Book for customer:', customerId); }
function viewCustomerDetails(customerId) { console.log('View customer details:', customerId); }
function editCustomer(customerId) { openAddCustomerModal(customerId); }
function deleteCustomer(customerId) { console.log('Delete customer:', customerId); }
function renderPaymentsTable() { console.log('Render payments table'); }
function renderBookingHistory() { console.log('Render booking history'); }
function populatePaymentBookingSelect() { console.log('Populate payment booking select'); }
function handleRecordPayment(e) { console.log('Handle record payment'); }
function generateReport() { console.log('Generate report'); }
function filterBookingHistory() { console.log('Filter booking history'); }
function shareBookingHistory() { console.log('Share booking history'); }
