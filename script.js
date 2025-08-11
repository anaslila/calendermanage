// Global state
let properties = JSON.parse(localStorage.getItem('properties')) || [];
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let payments = JSON.parse(localStorage.getItem('payments')) || [];
let currentPropertyImages = [];
let currentDate = new Date();

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupPWA();
});

function initializeApp() {
    switchTab('dashboard');
    updateDashboardStats();
    renderPropertiesGrid();
    renderBookingsTable();
    renderPaymentsTable();
    renderCalendar();
    populateSelects();
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

    // Add property
    document.getElementById('addPropertyBtn').addEventListener('click', () => {
        openModal('addPropertyModal');
    });

    document.getElementById('addPropertyFromInventory').addEventListener('click', () => {
        openModal('addPropertyModal');
    });

    // Add booking
    document.getElementById('addBookingBtn').addEventListener('click', () => {
        openModal('addBookingModal');
        populateBookingPropertySelect();
    });

    // Record payment
    document.getElementById('recordPaymentBtn').addEventListener('click', () => {
        openModal('recordPaymentModal');
        populatePaymentBookingSelect();
    });

    // Forms
    document.getElementById('addPropertyForm').addEventListener('submit', handleAddProperty);
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

    // Booking form calculations
    const bookingForm = document.getElementById('addBookingForm');
    const checkInInput = bookingForm.querySelector('input[name="checkIn"]');
    const checkOutInput = bookingForm.querySelector('input[name="checkOut"]');
    const negotiatedRateInput = bookingForm.querySelector('input[name="negotiatedRate"]');

    [checkInInput, checkOutInput, negotiatedRateInput].forEach(input => {
        input.addEventListener('change', calculateBookingTotal);
    });

    // Property selection in booking form
    document.getElementById('bookingPropertySelect').addEventListener('change', function() {
        const propertyId = this.value;
        if (propertyId) {
            const property = properties.find(p => p.id === propertyId);
            if (property) {
                bookingForm.querySelector('input[name="baseRate"]').value = property.basePrice;
                bookingForm.querySelector('input[name="negotiatedRate"]').value = property.basePrice;
                calculateBookingTotal();
            }
        }
    });

    // Copy share link
    document.getElementById('copyLinkBtn').addEventListener('click', copyShareLink);

    // Report generation
    document.getElementById('generateReport').addEventListener('click', generateReport);
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

// Property Management
function handleAddProperty(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const property = {
        id: generateId(),
        name: formData.get('name'),
        type: formData.get('type'),
        basePrice: parseInt(formData.get('basePrice')),
        location: formData.get('location'),
        description: formData.get('description'),
        amenities: formData.get('amenities'),
        images: currentPropertyImages,
        coverImage: currentPropertyImages[0] || null,
        createdAt: new Date().toISOString()
    };

    properties.push(property);
    localStorage.setItem('properties', JSON.stringify(properties));
    
    closeAllModals();
    renderPropertiesGrid();
    updateDashboardStats();
    populateSelects();
    
    showNotification('Property added successfully!', 'success');
}

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    currentPropertyImages = [];
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentPropertyImages.push(e.target.result);
            updateImagePreview();
        };
        reader.readAsDataURL(file);
    });
}

function updateImagePreview() {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    currentPropertyImages.forEach((image, index) => {
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML = `
            <img src="${image}" alt="Preview ${index + 1}">
            <button type="button" class="remove-image" onclick="removeImage(${index})">&times;</button>
        `;
        preview.appendChild(item);
    });
}

function removeImage(index) {
    currentPropertyImages.splice(index, 1);
    updateImagePreview();
}

function clearImagePreview() {
    currentPropertyImages = [];
    document.getElementById('imagePreview').innerHTML = '';
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
                 src="${property.coverImage || property.images[0] || 'https://via.placeholder.com/350x200?text=No+Image'}" 
                 alt="${property.name}">
            <div class="property-content">
                <div class="property-header">
                    <div>
                        <h3 class="property-title">${property.name}</h3>
                        <p class="property-type">${property.type}</p>
                    </div>
                    <div class="property-price">${formatCurrency(property.basePrice)}/day</div>
                </div>
                <p class="property-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${property.location}
                </p>
                ${property.amenities ? `
                    <div class="property-amenities">
                        ${property.amenities.split(',').map(amenity => 
                            `<span class="amenity-tag">${amenity.trim()}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                <div class="property-actions">
                    <button class="btn btn-primary" onclick="shareProperty('${property.id}')">
                        <i class="fas fa-share"></i> Share
                    </button>
                    <button class="btn btn-success" onclick="bookProperty('${property.id}')">
                        <i class="fas fa-calendar-plus"></i> Book
                    </button>
                    <button class="btn btn-secondary" onclick="editProperty('${property.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteProperty('${property.id}')">
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
            <img src="${property.coverImage || property.images[0] || 'https://via.placeholder.com/300x200'}" 
                 alt="${property.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">
            <h3>${property.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
            <p><strong>${formatCurrency(property.basePrice)}/day</strong></p>
            <p>${property.description || 'Contact us for more details!'}</p>
        </div>
    `;
    
    document.getElementById('shareLink').value = shareUrl;
    
    // Setup share buttons
    document.getElementById('shareWhatsApp').onclick = () => {
        const message = `Check out this amazing ${property.type}: ${property.name}\nLocation: ${property.location}\nPrice: ${formatCurrency(property.basePrice)}/day\n\n${shareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    };
    
    document.getElementById('shareEmail').onclick = () => {
        const subject = `${property.name} - ${property.type} for Rent`;
        const body = `Hi,\n\nI wanted to share this ${property.type} with you:\n\n${property.name}\nLocation: ${property.location}\nPrice: ${formatCurrency(property.basePrice)}/day\n\n${property.description || ''}\n\nView details: ${shareUrl}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };
    
    openModal('sharePropertyModal');
}

function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    document.execCommand('copy');
    showNotification('Link copied to clipboard!', 'success');
}

function bookProperty(propertyId) {
    openModal('addBookingModal');
    populateBookingPropertySelect();
    document.getElementById('bookingPropertySelect').value = propertyId;
    
    const property = properties.find(p => p.id === propertyId);
    if (property) {
        const bookingForm = document.getElementById('addBookingForm');
        bookingForm.querySelector('input[name="baseRate"]').value = property.basePrice;
        bookingForm.querySelector('input[name="negotiatedRate"]').value = property.basePrice;
    }
}

function editProperty(propertyId) {
    // Implementation for editing property
    showNotification('Edit property feature coming soon!', 'info');
}

function deleteProperty(propertyId) {
    if (confirm('Are you sure you want to delete this property?')) {
        properties = properties.filter(p => p.id !== propertyId);
        localStorage.setItem('properties', JSON.stringify(properties));
        renderPropertiesGrid();
        updateDashboardStats();
        populateSelects();
        showNotification('Property deleted successfully!', 'success');
    }
}

// Booking Management
function populateBookingPropertySelect() {
    const select = document.getElementById('bookingPropertySelect');
    select.innerHTML = '<option value="">Select Property</option>';
    
    properties.forEach(property => {
        const option = document.createElement('option');
        option.value = property.id;
        option.textContent = `${property.name} (${formatCurrency(property.basePrice)}/day)`;
        select.appendChild(option);
    });
}

function calculateBookingTotal() {
    const form = document.getElementById('addBookingForm');
    const checkIn = form.querySelector('input[name="checkIn"]').value;
    const checkOut = form.querySelector('input[name="checkOut"]').value;
    const rate = parseFloat(form.querySelector('input[name="negotiatedRate"]').value) || 0;
    
    if (checkIn && checkOut && rate) {
        const days = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
        const total = days * rate;
        
        document.getElementById('totalDays').textContent = days;
        document.getElementById('totalAmount').textContent = total.toLocaleString();
    }
}

function handleAddBooking(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const checkIn = new Date(formData.get('checkIn'));
    const checkOut = new Date(formData.get('checkOut'));
    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const rate = parseFloat(formData.get('negotiatedRate'));
    const total = days * rate;
    
    const booking = {
        id: generateId(),
        propertyId: formData.get('propertyId'),
        guestName: formData.get('guestName'),
        guestPhone: formData.get('guestPhone'),
        guestEmail: formData.get('guestEmail'),
        checkIn: formData.get('checkIn'),
        checkOut: formData.get('checkOut'),
        days: days,
        baseRate: parseFloat(formData.get('baseRate')),
        negotiatedRate: rate,
        totalAmount: total,
        paidAmount: 0,
        guests: parseInt(formData.get('guests')),
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    closeAllModals();
    renderBookingsTable();
    updateDashboardStats();
    renderCalendar();
    populateSelects();
    
    showNotification('Booking created successfully!', 'success');
}

function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTable');
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="no-data">No bookings found</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        const balance = booking.totalAmount - booking.paidAmount;
        
        return `
            <tr>
                <td>${booking.id.substr(-6).toUpperCase()}</td>
                <td>${property ? property.name : 'Unknown Property'}</td>
                <td>${booking.guestName}</td>
                <td>${formatDate(booking.checkIn)}</td>
                <td>${formatDate(booking.checkOut)}</td>
                <td>${booking.days}</td>
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
        recentTbody.innerHTML = '<tr><td colspan="6" class="no-data">No recent bookings</td></tr>';
    } else {
        recentTbody.innerHTML = recentBookings.map(booking => {
            const property = properties.find(p => p.id === booking.propertyId);
            return `
                <tr>
                    <td>${property ? property.name : 'Unknown'}</td>
                    <td>${booking.guestName}</td>
                    <td>${formatDate(booking.checkIn)}</td>
                    <td>${formatDate(booking.checkOut)}</td>
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
        alert(`Booking Details:\n\nProperty: ${property ? property.name : 'Unknown'}\nGuest: ${booking.guestName}\nPhone: ${booking.guestPhone}\nCheck-in: ${formatDate(booking.checkIn)}\nCheck-out: ${formatDate(booking.checkOut)}\nTotal: ${formatCurrency(booking.totalAmount)}\nPaid: ${formatCurrency(booking.paidAmount)}\nBalance: ${formatCurrency(booking.totalAmount - booking.paidAmount)}`);
    }
}

function editBooking(bookingId) {
    showNotification('Edit booking feature coming soon!', 'info');
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
            showNotification('Booking cancelled successfully!', 'success');
        }
    }
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

    tbody.innerHTML = payments.map(payment => {
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
            dayBookings.forEach(booking => {
                const property = properties.find(p => p.id === booking.propertyId);
                bookingsHTML += `<div class="calendar-booking" title="${property ? property.name : 'Unknown'} - ${booking.guestName}">${booking.guestName}</div>`;
            });
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateStr}">
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

// Dashboard Stats
function updateDashboardStats() {
    const totalProperties = properties.length;
    const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingPayments = bookings.reduce((sum, booking) => {
        return sum + (booking.totalAmount - booking.paidAmount);
    }, 0);
    
    document.getElementById('totalProperties').textContent = totalProperties;
    document.getElementById('totalBookings').textContent = activeBookings;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('pendingPayments').textContent = formatCurrency(pendingPayments);
}

// Populate selects
function populateSelects() {
    // Property filter in calendar
    const propertyFilter = document.getElementById('propertyFilter');
    propertyFilter.innerHTML = '<option value="">All Properties</option>';
    
    properties.forEach(property => {
        const option = document.createElement('option');
        option.value = property.id;
        option.textContent = property.name;
        propertyFilter.appendChild(option);
    });
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
    const avgRate = totalBookings > 0 ? totalRevenue / filteredBookings.reduce((sum, booking) => sum + booking.days, 0) : 0;
    
    document.getElementById('reportRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('reportBookings').textContent = totalBookings;
    document.getElementById('reportAvgRate').textContent = formatCurrency(avgRate);
    
    // Property performance
    const propertyPerformance = {};
    filteredBookings.forEach(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        const propertyName = property ? property.name : 'Unknown';
        
        if (!propertyPerformance[propertyName]) {
            propertyPerformance[propertyName] = { bookings: 0, revenue: 0 };
        }
        
        propertyPerformance[propertyName].bookings++;
        propertyPerformance[propertyName].revenue += booking.paidAmount;
    });
    
    const performanceDiv = document.getElementById('propertyPerformance');
    performanceDiv.innerHTML = Object.entries(propertyPerformance)
        .map(([propertyName, data]) => `
            <p><strong>${propertyName}:</strong> ${data.bookings} bookings, ${formatCurrency(data.revenue)} revenue</p>
        `).join('') || '<p>No data available for selected period</p>';
}

// Utility functions
function showNotification(message, type = 'info') {
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
            notification.style.background = '#2563eb';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Set default dates
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const reportFromInput = document.getElementById('reportFromDate');
    const reportToInput = document.getElementById('reportToDate');
    
    if (reportFromInput) {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        reportFromInput.value = firstDayOfMonth.toISOString().split('T')[0];
    }
    
    if (reportToInput) {
        reportToInput.value = today.toISOString().split('T')[0];
    }
    
    // Set default payment date to today
    const paymentForm = document.getElementById('recordPaymentForm');
    if (paymentForm) {
        const dateInput = paymentForm.querySelector('input[name="date"]');
        if (dateInput) {
            dateInput.value = today.toISOString().split('T')[0];
        }
    }
});
