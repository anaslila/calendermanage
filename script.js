// Global state
let properties = JSON.parse(localStorage.getItem('properties')) || [];
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let payments = JSON.parse(localStorage.getItem('payments')) || [];
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let currentPropertyImages = [];
let currentDate = new Date();
let selectedDate = null;

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

    // Property management
    document.getElementById('addPropertyBtn').addEventListener('click', () => {
        openAddPropertyModal();
    });
    document.getElementById('addPropertyFromInventory').addEventListener('click', () => {
        openAddPropertyModal();
    });

    // Customer management
    document.getElementById('addCustomerBtn').addEventListener('click', () => {
        openModal('addCustomerModal');
    });

    // Booking management
    document.getElementById('addBookingBtn').addEventListener('click', () => {
        openAddBookingModal();
    });
    document.getElementById('addBookingFromCalendar').addEventListener('click', () => {
        openAddBookingModal();
    });

    // Payment management
    document.getElementById('recordPaymentBtn').addEventListener('click', () => {
        openModal('recordPaymentModal');
        populatePaymentBookingSelect();
    });

    // Forms
    document.getElementById('addPropertyForm').addEventListener('submit', handleAddProperty);
    document.getElementById('addCustomerForm').addEventListener('submit', handleAddCustomer);
    document.getElementById('addBookingForm').addEventListener('submit', handleAddBooking);
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

    // Property filter
    document.getElementById('propertyFilter').addEventListener('change', renderCalendar);

    // Pricing type selection
    document.querySelectorAll('input[name="pricingType"]').forEach(radio => {
        radio.addEventListener('change', handlePricingTypeChange);
    });

    // Customer type selection
    document.querySelectorAll('input[name="customerType"]').forEach(radio => {
        radio.addEventListener('change', handleCustomerTypeChange);
    });

    // Booking form calculations
    const bookingForm = document.getElementById('addBookingForm');
    const checkInInput = bookingForm.querySelector('input[name="checkIn"]');
    const checkOutInput = bookingForm.querySelector('input[name="checkOut"]');
    const negotiatedRateInput = bookingForm.querySelector('input[name="negotiatedRate"]');
    const guestsInput = bookingForm.querySelector('input[name="guests"]');

    [checkInInput, checkOutInput, negotiatedRateInput].forEach(input => {
        input.addEventListener('change', calculateBookingTotal);
    });

    guestsInput.addEventListener('change', checkGuestLimit);

    // Property selection in booking form
    document.getElementById('bookingPropertySelect').addEventListener('change', handlePropertySelection);

    // Customer selection in booking form
    document.getElementById('customerSelect').addEventListener('change', handleCustomerSelection);

    // Share functionality
    document.getElementById('copyLinkBtn').addEventListener('click', copyShareLink);

    // Report generation
    document.getElementById('generateReport').addEventListener('click', generateReport);

    // History filtering
    document.getElementById('filterHistory').addEventListener('click', filterBookingHistory);
    document.getElementById('shareHistory').addEventListener('click', shareBookingHistory);

    // Customer search
    document.getElementById('customerSearch').addEventListener('input', searchCustomers);

    // Property view page
    document.getElementById('backToApp').addEventListener('click', () => {
        document.getElementById('propertyViewPage').style.display = 'none';
        document.querySelector('.app-container').style.display = 'flex';
    });

    // Calendar day modal
    document.getElementById('addBookingForDay').addEventListener('click', () => {
        closeAllModals();
        openAddBookingModal();
        if (selectedDate) {
            const checkInInput = document.querySelector('input[name="checkIn"]');
            checkInInput.value = selectedDate;
            calculateBookingTotal();
        }
    });
}

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

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
}

function checkSharedProperty() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('property');
    
    if (propertyId) {
        const property = properties.find(p => p.id === propertyId);
        if (property) {
            showPropertyView(property);
        }
    }
}

function showPropertyView(property) {
    document.querySelector('.app-container').style.display = 'none';
    document.getElementById('propertyViewPage').style.display = 'block';
    
    const content = document.getElementById('propertyViewContent');
    const images = property.images && property.images.length > 0 ? property.images : ['https://via.placeholder.com/800x400?text=No+Image'];
    
    content.innerHTML = `
        <div class="property-view-gallery">
            ${images.map(img => `<img src="${img}" alt="${property.name}">`).join('')}
        </div>
        <div class="property-view-details">
            <h1>${property.name}</h1>
            <p class="price">${formatPropertyPrice(property)}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
            <p><i class="fas fa-users"></i> Up to ${property.maxGuests || 'N/A'} guests</p>
            <p><i class="fas fa-bed"></i> ${property.bedrooms || 'N/A'} bedrooms</p>
            
            ${property.description ? `<p>${property.description}</p>` : ''}
            
            ${property.amenities && property.amenities.length > 0 ? `
                <h3>Amenities</h3>
                <div class="property-amenities-list">
                    ${property.amenities.map(amenity => `
                        <span class="amenity-tag">${amenity}</span>
                    `).join('')}
                </div>
            ` : ''}
            
            <div style="margin-top: 2rem; text-align: center;">
                <p style="font-size: 1.125rem; font-weight: 600; color: #219EBC;">
                    Interested in booking? Contact us!
                </p>
                <p style="color: #64748b;">
                    This property is managed by Calendar Manager
                </p>
            </div>
        </div>
    `;
}

function formatPropertyPrice(property) {
    if (property.pricingType === 'weekly') {
        return `₹${property.weekdayPrice}/day (weekdays), ₹${property.weekendPrice}/day (weekends)`;
    } else {
        return `₹${property.uniformPrice || property.basePrice}/day`;
    }
}

function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    // Update content based on tab
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

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
    
    // Clear forms
    document.querySelectorAll('form').forEach(form => form.reset());
    clearImagePreview();
    
    // Reset property form
    document.getElementById('editPropertyId').value = '';
    document.getElementById('propertyModalTitle').textContent = 'Add New Property';
    document.getElementById('savePropertyBtn').textContent = 'Add Property';
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
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

function calculateDaysAndNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const nights = Math.max(0, days - 1);
    return { days, nights };
}

// Property Management
function openAddPropertyModal() {
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

function handlePricingTypeChange(e) {
    const pricingType = e.target.value;
    const uniformPricing = document.getElementById('uniformPricing');
    const weeklyPricing = document.getElementById('weeklyPricing');
    
    if (pricingType === 'uniform') {
        uniformPricing.style.display = 'block';
        weeklyPricing.style.display = 'none';
        // Clear weekly pricing inputs
        weeklyPricing.querySelectorAll('input').forEach(input => input.removeAttribute('required'));
        uniformPricing.querySelector('input').setAttribute('required', '');
    } else {
        uniformPricing.style.display = 'none';
        weeklyPricing.style.display = 'block';
        // Clear uniform pricing input
        uniformPricing.querySelector('input').removeAttribute('required');
        weeklyPricing.querySelectorAll('input').forEach(input => input.setAttribute('required', ''));
    }
}

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
        location: formData.get('location'),
        description: formData.get('description'),
        maxGuests: parseInt(formData.get('maxGuests')),
        bedrooms: parseInt(formData.get('bedrooms')) || 0,
        pricingType: formData.get('pricingType'),
        amenities: selectedAmenities,
        images: currentPropertyImages.length > 0 ? currentPropertyImages : (isEditing ? properties.find(p => p.id === propertyId).images : []),
        coverImage: currentPropertyImages.length > 0 ? currentPropertyImages[0] : (isEditing ? properties.find(p => p.id === propertyId).coverImage : null),
        createdAt: isEditing ? properties.find(p => p.id === propertyId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add pricing data based on type
    if (formData.get('pricingType') === 'uniform') {
        propertyData.uniformPrice = parseInt(formData.get('uniformPrice'));
        propertyData.basePrice = propertyData.uniformPrice; // For backward compatibility
    } else {
        propertyData.weekdayPrice = parseInt(formData.get('weekdayPrice'));
        propertyData.weekendPrice = parseInt(formData.get('weekendPrice'));
        propertyData.basePrice = propertyData.weekdayPrice; // For backward compatibility
    }
    
    if (isEditing) {
        // Update existing property
        const index = properties.findIndex(p => p.id === propertyId);
        properties[index] = propertyData;
        showNotification('Property updated successfully!', 'success');
    } else {
        // Add new property
        properties.push(propertyData);
        showNotification('Property added successfully!', 'success');
    }
    
    localStorage.setItem('properties', JSON.stringify(properties));
    
    closeAllModals();
    renderPropertiesGrid();
    updateDashboardStats();
    populateSelects();
}

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
    
    // Show cover image selector if there are images
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

    grid.innerHTML = properties.map(property => `
        <div class="property-card">
            <img class="property-image" 
                 src="${property.coverImage || property.images?.[0] || 'https://via.placeholder.com/380x220?text=No+Image'}" 
                 alt="${property.name}">
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
    `).join('');
}

function shareProperty(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?property=${propertyId}`;
    
    document.getElementById('sharePropertyPreview').innerHTML = `
        <div class="property-preview">
            <img src="${property.coverImage || property.images?.[0] || 'https://via.placeholder.com/300x200'}" 
                 alt="${property.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">
            <h3>${property.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
            <p><i class="fas fa-users"></i> Up to ${property.maxGuests} guests</p>
            <p><strong>${formatPropertyPrice(property)}</strong></p>
            <p>${property.description || 'Contact us for more details!'}</p>
        </div>
    `;
    
    document.getElementById('shareLink').value = shareUrl;
    
    // Setup share buttons
    document.getElementById('shareWhatsApp').onclick = () => {
        const message = `Check out this amazing ${property.type}: ${property.name}\nLocation: ${property.location}\nCapacity: Up to ${property.maxGuests} guests\nPrice: ${formatPropertyPrice(property)}\n\n${shareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    };
    
    document.getElementById('shareEmail').onclick = () => {
        const subject = `${property.name} - ${property.type} for Rent`;
        const body = `Hi,\n\nI wanted to share this ${property.type} with you:\n\n${property.name}\nLocation: ${property.location}\nCapacity: Up to ${property.maxGuests} guests\nPrice: ${formatPropertyPrice(property)}\n\n${property.description || ''}\n\nView details: ${shareUrl}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };
    
    openModal('sharePropertyModal');
}

function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    shareLink.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for modern browsers
        navigator.clipboard.writeText(shareLink.value).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy link', 'error');
        });
    }
}

function bookProperty(propertyId) {
    openAddBookingModal();
    document.getElementById('bookingPropertySelect').value = propertyId;
    handlePropertySelection({ target: { value: propertyId } });
}

function editProperty(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    // Set modal title and button text
    document.getElementById('propertyModalTitle').textContent = 'Edit Property';
    document.getElementById('savePropertyBtn').textContent = 'Update Property';
    document.getElementById('editPropertyId').value = propertyId;
    
    // Fill form with existing data
    const form = document.getElementById('addPropertyForm');
    form.querySelector('input[name="name"]').value = property.name;
    form.querySelector('select[name="type"]').value = property.type;
    form.querySelector('input[name="location"]').value = property.location;
    form.querySelector('textarea[name="description"]').value = property.description || '';
    form.querySelector('input[name="maxGuests"]').value = property.maxGuests;
    form.querySelector('input[name="bedrooms"]').value = property.bedrooms || '';
    
    // Set pricing type and values
    const pricingType = property.pricingType || 'uniform';
    form.querySelector(`input[name="pricingType"][value="${pricingType}"]`).checked = true;
    
    if (pricingType === 'uniform') {
        form.querySelector('input[name="uniformPrice"]').value = property.uniformPrice || property.basePrice;
        document.getElementById('uniformPricing').style.display = 'block';
        document.getElementById('weeklyPricing').style.display = 'none';
    } else {
        form.querySelector('input[name="weekdayPrice"]').value = property.weekdayPrice;
        form.querySelector('input[name="weekendPrice"]').value = property.weekendPrice;
        document.getElementById('uniformPricing').style.display = 'none';
        document.getElementById('weeklyPricing').style.display = 'block';
    }
    
    // Set amenities
    if (property.amenities) {
        property.amenities.forEach(amenity => {
            const checkbox = form.querySelector(`input[name="amenities"][value="${amenity}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    // Set images
    if (property.images && property.images.length > 0) {
        currentPropertyImages = [...property.images];
        updateImagePreview();
    }
    
    openModal('addPropertyModal');
    generateAmenitiesGrid();
    
    // Reapply form data after generating amenities
    if (property.amenities) {
        setTimeout(() => {
            property.amenities.forEach(amenity => {
                const checkbox = document.querySelector(`input[name="amenities"][value="${amenity}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }, 100);
    }
}

function deleteProperty(propertyId) {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
        properties = properties.filter(p => p.id !== propertyId);
        localStorage.setItem('properties', JSON.stringify(properties));
        renderPropertiesGrid();
        updateDashboardStats();
        populateSelects();
        showNotification('Property deleted successfully!', 'success');
    }
}

// Customer Management
function handleAddCustomer(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const customer = {
        id: generateId(),
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        idType: formData.get('idType'),
        idNumber: formData.get('idNumber'),
        createdAt: new Date().toISOString(),
        totalBookings: 0,
        totalSpent: 0
    };

    customers.push(customer);
    localStorage.setItem('customers', JSON.stringify(customers));
    
    closeAllModals();
    renderCustomersGrid();
    updateDashboardStats();
    populateSelects();
    
    showNotification('Customer added successfully!', 'success');
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
        customer.totalSpent = customerBookings.reduce((sum, booking) => sum + booking.paidAmount, 0);
    });
    
    // Save updated stats
    localStorage.setItem('customers', JSON.stringify(customers));

    grid.innerHTML = customers.map(customer => {
        const customerBookings = bookings.filter(b => b.customerId === customer.id).slice(0, 3);
        
        return `
            <div class="customer-card">
                <div class="customer-header">
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
                    <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${customer.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function searchCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const customerCards = document.querySelectorAll('.customer-card');
    
    customerCards.forEach(card => {
        const customerName = card.querySelector('h3').textContent.toLowerCase();
        const customerPhone = card.querySelector('.customer-contact').textContent.toLowerCase();
        
        if (customerName.includes(searchTerm) || customerPhone.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function bookForCustomer(customerId) {
    openAddBookingModal();
    document.querySelector('input[name="customerType"][value="existing"]').checked = true;
    handleCustomerTypeChange({ target: { value: 'existing' } });
    document.getElementById('customerSelect').value = customerId;
    handleCustomerSelection({ target: { value: customerId } });
}

function viewCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerBookings = bookings.filter(b => b.customerId === customerId);
    
    let details = `Customer Details:\n\n`;
    details += `Name: ${customer.name}\n`;
    details += `Phone: ${customer.phone}\n`;
    if (customer.email) details += `Email: ${customer.email}\n`;
    if (customer.address) details += `Address: ${customer.address}\n`;
    details += `Total Bookings: ${customer.totalBookings}\n`;
    details += `Total Spent: ${formatCurrency(customer.totalSpent)}\n`;
    details += `Member Since: ${formatDate(customer.createdAt)}\n\n`;
    
    if (customerBookings.length > 0) {
        details += `Booking History:\n`;
        customerBookings.forEach((booking, index) => {
            const property = properties.find(p => p.id === booking.propertyId);
            details += `${index + 1}. ${property ? property.name : 'Unknown'} (${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}) - ${formatCurrency(booking.totalAmount)}\n`;
        });
    }
    
    alert(details);
}

function deleteCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    const customerBookings = bookings.filter(b => b.customerId === customerId);
    
    if (customerBookings.length > 0) {
        if (!confirm(`This customer has ${customerBookings.length} booking(s). Deleting the customer will not affect existing bookings. Are you sure?`)) {
            return;
        }
    }
    
    customers = customers.filter(c => c.id !== customerId);
    localStorage.setItem('customers', JSON.stringify(customers));
    renderCustomersGrid();
    updateDashboardStats();
    populateSelects();
    showNotification('Customer deleted successfully!', 'success');
}

// Booking Management
function openAddBookingModal() {
    openModal('addBookingModal');
    populateBookingPropertySelect();
    populateCustomerSelect();
    handleCustomerTypeChange({ target: { value: 'existing' } });
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

function populateCustomerSelect() {
    const select = document.getElementById('customerSelect');
    select.innerHTML = '<option value="">Select Customer</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.phone})`;
        select.appendChild(option);
    });
}

function handleCustomerTypeChange(e) {
    const customerType = e.target.value;
    const existingCustomer = document.getElementById('existingCustomer');
    const newCustomer = document.getElementById('newCustomer');
    
    if (customerType === 'existing') {
        existingCustomer.style.display = 'block';
        newCustomer.style.display = 'none';
        // Make existing customer fields required
        document.getElementById('customerSelect').setAttribute('required', '');
        newCustomer.querySelectorAll('input').forEach(input => {
            input.removeAttribute('required');
            input.value = '';
        });
    } else {
        existingCustomer.style.display = 'none';
        newCustomer.style.display = 'block';
        // Make new customer fields required
        document.getElementById('customerSelect').removeAttribute('required');
        document.getElementById('customerSelect').value = '';
        newCustomer.querySelectorAll('input[name="guestName"], input[name="guestPhone"]').forEach(input => {
            input.setAttribute('required', '');
        });
    }
    
    // Clear customer info
    document.getElementById('customerInfo').style.display = 'none';
}

function handlePropertySelection(e) {
    const propertyId = e.target.value;
    const propertyInfo = document.getElementById('propertyInfo');
    
    if (propertyId) {
        const property = properties.find(p => p.id === propertyId);
        if (property) {
            propertyInfo.innerHTML = `
                <h4>${property.name}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
                <p><i class="fas fa-users"></i> Max ${property.maxGuests} guests</p>
                <p><i class="fas fa-bed"></i> ${property.bedrooms} bedrooms</p>
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

function handleCustomerSelection(e) {
    const customerId = e.target.value;
    const customerInfo = document.getElementById('customerInfo');
    
    if (customerId) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            const customerBookings = bookings.filter(b => b.customerId === customerId);
            customerInfo.innerHTML = `
                <h4>${customer.name}</h4>
                <p><i class="fas fa-phone"></i> ${customer.phone}</p>
                <p><i class="fas fa-calendar"></i> ${customerBookings.length} previous bookings</p>
                <p><i class="fas fa-rupee-sign"></i> ${formatCurrency(customer.totalSpent)} total spent</p>
            `;
            customerInfo.style.display = 'block';
        }
    } else {
        customerInfo.style.display = 'none';
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
    
    const checkIn = new Date(formData.get('checkIn'));
    const checkOut = new Date(formData.get('checkOut'));
    const { days, nights } = calculateDaysAndNights(formData.get('checkIn'), formData.get('checkOut'));
    const rate = parseFloat(formData.get('negotiatedRate'));
    const total = days * rate;
    
    let customerId = formData.get('customerId');
    let guestName = formData.get('guestName');
    let guestPhone = formData.get('guestPhone');
    let guestEmail = formData.get('guestEmail');
    let isNewCustomer = false;
    
    // Handle customer creation if new customer
    if (formData.get('customerType') === 'new') {
        const newCustomer = {
            id: generateId(),
            name: formData.get('guestName'),
            phone: formData.get('guestPhone'),
            email: formData.get('guestEmail') || '',
            address: '',
            idType: 'aadhar',
            idNumber: '',
            createdAt: new Date().toISOString(),
            totalBookings: 0,
            totalSpent: 0
        };
        
        customers.push(newCustomer);
        localStorage.setItem('customers', JSON.stringify(customers));
        customerId = newCustomer.id;
        isNewCustomer = true;
    } else {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            guestName = customer.name;
            guestPhone = customer.phone;
            guestEmail = customer.email;
        }
    }
    
    const booking = {
        id: generateId(),
        propertyId: formData.get('propertyId'),
        customerId: customerId,
        guestName: guestName,
        guestPhone: guestPhone,
        guestEmail: guestEmail,
        checkIn: formData.get('checkIn'),
        checkOut: formData.get('checkOut'),
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

function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTable');
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="no-data">No bookings found</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.slice().reverse().map(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        const balance = booking.totalAmount - booking.paidAmount;
        const customer = customers.find(c => c.id === booking.customerId);
        
        return `
            <tr>
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

function viewBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        const property = properties.find(p => p.id === booking.propertyId);
        const customer = customers.find(c => c.id === booking.customerId);
        const balance = booking.totalAmount - booking.paidAmount;
        
        let details = `Booking Details:\n\n`;
        details += `Booking ID: ${booking.id.substr(-6).toUpperCase()}\n`;
        details += `Property: ${property ? property.name : 'Unknown'}\n`;
        details += `Guest: ${booking.guestName}\n`;
        details += `Phone: ${booking.guestPhone}\n`;
        if (booking.guestEmail) details += `Email: ${booking.guestEmail}\n`;
        details += `Customer Type: ${booking.isNewCustomer ? 'New Customer' : 'Existing Customer'}\n`;
        details += `Check-in: ${formatDate(booking.checkIn)}\n`;
        details += `Check-out: ${formatDate(booking.checkOut)}\n`;
        details += `Duration: ${booking.days} days, ${booking.nights} nights\n`;
        details += `Guests: ${booking.guests}\n`;
        details += `Base Rate: ${formatCurrency(booking.baseRate)}/day\n`;
        details += `Negotiated Rate: ${formatCurrency(booking.negotiatedRate)}/day\n`;
        details += `Total Amount: ${formatCurrency(booking.totalAmount)}\n`;
        details += `Paid Amount: ${formatCurrency(booking.paidAmount)}\n`;
        details += `Balance: ${formatCurrency(balance)}\n`;
        details += `Status: ${booking.status}\n`;
        details += `Created: ${formatDate(booking.createdAt)}`;
        
        alert(details);
    }
}

function editBooking(bookingId) {
    showNotification('Edit booking feature will be available in the next update!', 'info');
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            localStorage.setItem('bookings', JSON.stringify(bookings));
            renderBookingsTable();
            updateDashboardStats();
            renderCalendar();
            renderBookingHistory();
            showNotification('Booking cancelled successfully!', 'success');
        }
    }
}

// Booking History
function renderBookingHistory() {
    const tbody = document.getElementById('historyTable');
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No booking history found</td></tr>';
        return;
    }

    const sortedBookings = bookings.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    tbody.innerHTML = sortedBookings.map(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        return `
            <tr>
                <td>${formatDate(booking.createdAt)}</td>
                <td>${booking.id.substr(-6).toUpperCase()}</td>
                <td>${property ? property.name : 'Unknown Property'}</td>
                <td>${booking.guestName}</td>
                <td>${booking.days}D/${booking.nights}N</td>
                <td>${formatCurrency(booking.totalAmount)}</td>
                <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
            </tr>
        `;
    }).join('');
}

function filterBookingHistory() {
    const fromDate = document.getElementById('historyFromDate').value;
    const toDate = document.getElementById('historyToDate').value;
    const tbody = document.getElementById('historyTable');
    
    let filteredBookings = bookings;
    
    if (fromDate) {
        filteredBookings = filteredBookings.filter(booking => 
            new Date(booking.checkIn) >= new Date(fromDate)
        );
    }
    
    if (toDate) {
        filteredBookings = filteredBookings.filter(booking => 
            new Date(booking.checkIn) <= new Date(toDate)
        );
    }
    
    if (filteredBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No bookings found for selected date range</td></tr>';
        return;
    }

    const sortedBookings = filteredBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    tbody.innerHTML = sortedBookings.map(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        return `
            <tr>
                <td>${formatDate(booking.createdAt)}</td>
                <td>${booking.id.substr(-6).toUpperCase()}</td>
                <td>${property ? property.name : 'Unknown Property'}</td>
                <td>${booking.guestName}</td>
                <td>${booking.days}D/${booking.nights}N</td>
                <td>${formatCurrency(booking.totalAmount)}</td>
                <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
            </tr>
        `;
    }).join('');
}

function shareBookingHistory() {
    const fromDate = document.getElementById('historyFromDate').value;
    const toDate = document.getElementById('historyToDate').value;
    
    let filteredBookings = bookings;
    
    if (fromDate) {
        filteredBookings = filteredBookings.filter(booking => 
            new Date(booking.checkIn) >= new Date(fromDate)
        );
    }
    
    if (toDate) {
        filteredBookings = filteredBookings.filter(booking => 
            new Date(booking.checkIn) <= new Date(toDate)
        );
    }
    
    const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.paidAmount, 0);
    const totalBookings = filteredBookings.length;
    
    let report = `Calendar Manager - Booking History Report\n`;
    report += `Generated: ${new Date().toLocaleDateString()}\n`;
    if (fromDate || toDate) {
        report += `Period: ${fromDate || 'Start'} to ${toDate || 'End'}\n`;
    }
    report += `\nSummary:\n`;
    report += `Total Bookings: ${totalBookings}\n`;
    report += `Total Revenue: ${formatCurrency(totalRevenue)}\n\n`;
    
    report += `Detailed History:\n`;
    report += `Date | Booking ID | Property | Customer | Duration | Amount | Status\n`;
    report += `${'='.repeat(80)}\n`;
    
    filteredBookings.forEach(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        report += `${formatDate(booking.createdAt)} | ${booking.id.substr(-6).toUpperCase()} | ${property ? property.name : 'Unknown'} | ${booking.guestName} | ${booking.days}D/${booking.nights}N | ${formatCurrency(booking.totalAmount)} | ${booking.status}\n`;
    });
    
    // Copy to clipboard
    navigator.clipboard.writeText(report).then(() => {
        showNotification('Booking history report copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback: show in alert for manual copy
        alert('Booking History Report:\n\n' + report);
    });
}

// Payment Management
function populatePaymentBookingSelect() {
    const select = document.getElementById('paymentBookingSelect');
    select.innerHTML = '<option value="">Select Booking</option>';
    
    const pendingBookings = bookings.filter(b => b.totalAmount > b.paidAmount && b.status !== 'cancelled');
    
    pendingBookings.forEach(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        const balance = booking.totalAmount - booking.paidAmount;
        const option = document.createElement('option');
        option.value = booking.id;
        option.textContent = `${booking.id.substr(-6).toUpperCase()} - ${property ? property.name : 'Unknown'} (${booking.guestName}) - Balance: ${formatCurrency(balance)}`;
        select.appendChild(option);
    });
}

function handleRecordPayment(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const payment = {
        id: generateId(),
        bookingId: formData.get('bookingId'),
        amount: parseFloat(formData.get('amount')),
        method: formData.get('method'),
        date: formData.get('date'),
        notes: formData.get('notes'),
        createdAt: new Date().toISOString()
    };

    // Update booking paid amount
    const booking = bookings.find(b => b.id === payment.bookingId);
    if (booking) {
        booking.paidAmount += payment.amount;
        // Mark as completed if fully paid
        if (booking.paidAmount >= booking.totalAmount) {
            booking.status = 'completed';
        }
        localStorage.setItem('bookings', JSON.stringify(bookings));
    }

    payments.push(payment);
    localStorage.setItem('payments', JSON.stringify(payments));
    
    closeAllModals();
    renderPaymentsTable();
    renderBookingsTable();
    updateDashboardStats();
    
    showNotification('Payment recorded successfully!', 'success');
}

function renderPaymentsTable() {
    const tbody = document.getElementById('paymentsTable');
    
    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No payments recorded</td></tr>';
        return;
    }

    tbody.innerHTML = payments.slice().reverse().map(payment => {
        const booking = bookings.find(b => b.id === payment.bookingId);
        const property = booking ? properties.find(p => p.id === booking.propertyId) : null;
        
        return `
            <tr>
                <td>${payment.id.substr(-6).toUpperCase()}</td>
                <td>${booking ? booking.id.substr(-6).toUpperCase() : 'Unknown'}</td>
                <td>${property ? property.name : 'Unknown Property'}</td>
                <td>${booking ? booking.guestName : 'Unknown Guest'}</td>
                <td>${formatCurrency(payment.amount)}</td>
                <td style="text-transform: capitalize">${payment.method.replace('_', ' ')}</td>
                <td>${formatDate(payment.date)}</td>
                <td><span class="status-badge status-completed">Completed</span></td>
            </tr>
        `;
    }).join('');
}

// Calendar
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
                bookingsHTML += `
                    <div class="calendar-booking" 
                         title="${property ? property.name : 'Unknown'} - ${booking.guestName}"
                         onclick="event.stopPropagation()">
                        ${booking.guestName} (${property ? property.name.substring(0, 8) : 'Unknown'})
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
    
    document.getElementById('daySummary').innerHTML = `
        <h4>Day Summary</h4>
        <p><strong>${dayBookings.length}</strong> bookings across <strong>${totalProperties}</strong> properties</p>
        <p><strong>${totalGuests}</strong> total guests</p>
    `;
    
    // Day bookings
    const dayBookingsContainer = document.getElementById('dayBookings');
    if (dayBookings.length === 0) {
        dayBookingsContainer.innerHTML = '<p>No bookings for this date.</p>';
    } else {
        dayBookingsContainer.innerHTML = dayBookings.map(booking => {
            const property = properties.find(p => p.id === booking.propertyId);
            return `
                <div class="day-booking-item">
                    <h5>${booking.guestName}</h5>
                    <p><i class="fas fa-building"></i> <strong>Property:</strong> ${property ? property.name : 'Unknown'}</p>
                    <p><i class="fas fa-calendar"></i> <strong>Stay:</strong> ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</p>
                    <p><i class="fas fa-users"></i> <strong>Guests:</strong> ${booking.guests}</p>
                    <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${booking.guestPhone}</p>
                    <p><i class="fas fa-rupee-sign"></i> <strong>Total:</strong> ${formatCurrency(booking.totalAmount)}</p>
                    <p><i class="fas fa-info-circle"></i> <strong>Status:</strong> 
                        <span class="status-badge status-${booking.status}">${booking.status}</span>
                    </p>
                </div>
            `;
        }).join('');
    }
    
    openModal('calendarDayModal');
}

// Dashboard Stats
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

// Populate selects
function populateSelects() {
    // Property filter in calendar
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

// Reports
function generateReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    
    if (!fromDate || !toDate) {
        showNotification('Please select both from and to dates', 'warning');
        return;
    }
    
    const filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.checkIn);
        return bookingDate >= new Date(fromDate) && bookingDate <= new Date(toDate) && booking.status !== 'cancelled';
    });
    
    const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.paidAmount, 0);
    const totalBookings = filteredBookings.length;
    const totalDays = filteredBookings.reduce((sum, booking) => sum + booking.days, 0);
    const avgRate = totalDays > 0 ? totalRevenue / totalDays : 0;
    
    document.getElementById('reportRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('reportBookings').textContent = totalBookings;
    document.getElementById('reportAvgRate').textContent = formatCurrency(avgRate);
    
    // Property performance
    const propertyPerformance = {};
    filteredBookings.forEach(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        const propertyName = property ? property.name : 'Unknown';
        
        if (!propertyPerformance[propertyName]) {
            propertyPerformance[propertyName] = { bookings: 0, revenue: 0, days: 0 };
        }
        
        propertyPerformance[propertyName].bookings++;
        propertyPerformance[propertyName].revenue += booking.paidAmount;
        propertyPerformance[propertyName].days += booking.days;
    });
    
    const performanceDiv = document.getElementById('propertyPerformance');
    if (Object.keys(propertyPerformance).length === 0) {
        performanceDiv.innerHTML = '<p>No data available for selected period</p>';
    } else {
        performanceDiv.innerHTML = Object.entries(propertyPerformance)
            .sort(([,a], [,b]) => b.revenue - a.revenue)
            .map(([propertyName, data]) => `
                <p><strong>${propertyName}:</strong><br>
                ${data.bookings} bookings, ${data.days} days, ${formatCurrency(data.revenue)} revenue
                (Avg: ${formatCurrency(data.revenue/data.days)}/day)</p>
            `).join('');
    }
}

// Set default dates
function setDefaultDates() {
    const today = new Date();
    
    // Report dates - current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('reportFromDate').value = firstDayOfMonth.toISOString().split('T')[0];
    document.getElementById('reportToDate').value = today.toISOString().split('T')[0];
    
    // History dates - last 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    document.getElementById('historyFromDate').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('historyToDate').value = today.toISOString().split('T')[0];
    
    // Payment form - today's date
    const paymentForm = document.getElementById('recordPaymentForm');
    if (paymentForm) {
        const dateInput = paymentForm.querySelector('input[name="date"]');
        if (dateInput) {
            dateInput.value = today.toISOString().split('T')[0];
        }
    }
}

// Utility functions
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
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

// Initialize default dates when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setDefaultDates, 500);
});

// Auto-save functionality
setInterval(() => {
    if (properties.length > 0 || bookings.length > 0 || customers.length > 0 || payments.length > 0) {
        localStorage.setItem('properties', JSON.stringify(properties));
        localStorage.setItem('bookings', JSON.stringify(bookings));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('payments', JSON.stringify(payments));
    }
}, 30000); // Auto-save every 30 seconds

// Handle page visibility change to save data
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        localStorage.setItem('properties', JSON.stringify(properties));
        localStorage.setItem('bookings', JSON.stringify(bookings));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('payments', JSON.stringify(payments));
    }
});
