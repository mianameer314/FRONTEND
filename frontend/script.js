// Global variables
let currentUser = null;
let currentToken = null;
let currentChatRoom = null;
let websocket = null;
let currentPage = 1;
let listingsPerPage = 12;

// API Base URL - Update this to match your FastAPI server
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

// Initialize the application
function initializeApp() {
    // Load initial data
    loadListings();
    
    // Setup navigation
    setupNavigation();
    
    // Check for stored token
    const token = localStorage.getItem('token');
    if (token) {
        currentToken = token;
        fetchCurrentUser();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            showSection(section);
        });
    });

    // Mobile navigation toggle
    document.getElementById('nav-toggle').addEventListener('click', function() {
        document.getElementById('nav-menu').classList.toggle('active');
    });

    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('create-listing-form').addEventListener('submit', handleCreateListing);
    document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);

    // Profile picture upload
    document.getElementById('profile-picture-input').addEventListener('change', handleProfilePictureUpload);

    // Chat input
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Show password toggles
    const loginShow = document.getElementById('login-show-password');
    if (loginShow) loginShow.addEventListener('change', () => {
        const input = document.getElementById('login-password');
        if (input) input.type = loginShow.checked ? 'text' : 'password';
    });
    const signupShow = document.getElementById('signup-show-password');
    if (signupShow) signupShow.addEventListener('change', () => {
        const input = document.getElementById('signup-password');
        if (input) input.type = signupShow.checked ? 'text' : 'password';
    });

    // Verification forms
    document.getElementById('verification-request-form').addEventListener('submit', handleVerificationRequest);
    document.getElementById('verification-otp-form').addEventListener('submit', handleVerificationOTP);
    document.getElementById('verification-upload-form').addEventListener('submit', handleVerificationUpload);
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            currentToken = result.access_token;
            localStorage.setItem('token', currentToken);
            
            await fetchCurrentUser();
            closeModal('auth-modal');
            showSuccess('Login successful!');
            updateAuthUI();
        } else {
            const error = await response.json();
            showError(error.detail || 'Login failed');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

async function handleSignup(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    const data = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        university_name: formData.get('university_name'),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            currentToken = result.access_token;
            localStorage.setItem('token', currentToken);
            
            await fetchCurrentUser();
            closeModal('signup-modal');
            showSuccess('Account created successfully!');
            updateAuthUI();
        } else {
            const error = await response.json();
            showError(error.detail || 'Signup failed');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

async function fetchCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            updateAuthUI();
            loadUserProfile();
            loadNotifications();
        } else {
            // Token is invalid, clear it
            logout();
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

function logout() {
    currentUser = null;
    currentToken = null;
    localStorage.removeItem('token');
    updateAuthUI();
    showSection('home');
    
    // Close WebSocket connection if open
    if (websocket) {
        websocket.close();
        websocket = null;
    }
}

function updateAuthUI() {
    const navAuth = document.getElementById('nav-auth');
    const navUser = document.getElementById('nav-user');
    const profileLink = document.getElementById('profile-link');
    const verificationLink = document.getElementById('verification-link');
    const adminLink = document.getElementById('admin-link');

    if (currentUser) {
        navAuth.style.display = 'none';
        navUser.style.display = 'flex';
        profileLink.style.display = 'inline';
        
        // Show verification link if user is not verified
        if (!currentUser.is_verified) {
            verificationLink.style.display = 'inline';
        } else {
            verificationLink.style.display = 'none';
        }
        
        // Show admin link if user is admin
        if (currentUser.is_admin) {
            adminLink.style.display = 'inline';
        } else {
            adminLink.style.display = 'none';
        }
    } else {
        navAuth.style.display = 'flex';
        navUser.style.display = 'none';
        profileLink.style.display = 'none';
        verificationLink.style.display = 'none';
        adminLink.style.display = 'none';
    }
}

// Listings Functions
async function loadListings(page = 1) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/listings?limit=${listingsPerPage}&offset=${(page - 1) * listingsPerPage}`);
        
        if (response.ok) {
            const data = await response.json();
            displayListings(data.items);
            createPagination(data.total, page);
        } else {
            showError('Failed to load listings');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

function displayListings(listings) {
    const grid = document.getElementById('listings-grid');
    grid.innerHTML = '';

    listings.forEach(listing => {
        const card = createListingCard(listing);
        grid.appendChild(card);
    });
}

function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    
    const image = listing.images && listing.images.length > 0 ? listing.images[0] : 'https://via.placeholder.com/300x200?text=No+Image';
    
    card.innerHTML = `
        <img src="${image}" alt="${listing.title}" class="listing-image">
        <div class="listing-content">
            <h3 class="listing-title">${listing.title}</h3>
            <div class="listing-price">$${listing.price}</div>
            <span class="listing-category">${listing.category}</span>
            <p class="listing-description">${listing.description.substring(0, 100)}${listing.description.length > 100 ? '...' : ''}</p>
            <div class="listing-actions">
                <button class="btn btn-primary" onclick="openListingDetail(${listing.id})">View Details</button>
                <button class="btn btn-secondary" onclick="toggleFavorite(${listing.id})" title="Favorite">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="btn btn-secondary" onclick="startChat(${listing.id})" title="Chat">
                    <i class="fas fa-comments"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function createPagination(total, currentPage) {
    const pagination = document.getElementById('listings-pagination');
    const totalPages = Math.ceil(total / listingsPerPage);
    
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.onclick = () => loadListings(currentPage - 1);
        pagination.appendChild(prevBtn);
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.onclick = () => loadListings(i);
            pagination.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '10px 15px';
            pagination.appendChild(ellipsis);
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.onclick = () => loadListings(currentPage + 1);
        pagination.appendChild(nextBtn);
    }
}

async function handleCreateListing(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_BASE_URL}/listings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });

        if (response.ok) {
            const listing = await response.json();
            closeModal('create-listing-modal');
            showSuccess('Listing created successfully!');
            loadListings(); // Refresh listings
            e.target.reset();
        } else {
            // Try to parse JSON; fallback to status text
            let errorBody = null;
            try { errorBody = await response.json(); } catch (_) {}

            // Handle common cases
            if (response.status === 401) {
                showError('You must be logged in. Please login and try again.');
                showAuthModal();
                return;
            }
            if (response.status === 403) {
                // Backend returns 403 for unverified users
                showError('You must verify your account before creating listings. Redirecting to verification...');
                window.location.hash = '#verification';
                showSection('verification');
                return;
            }

            showError(errorBody || response.statusText || 'Failed to create listing');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Search Functions
async function searchListings() {
    const query = document.getElementById('search-query').value;
    const category = document.getElementById('search-category').value;
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    
    showLoading();
    
    try {
        let url = `${API_BASE_URL}/listings/search?page=1&page_size=20`;
        
        if (query) url += `&q=${encodeURIComponent(query)}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (minPrice) url += `&min_price=${minPrice}`;
        if (maxPrice) url += `&max_price=${maxPrice}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            displaySearchResults(data.results);
        } else {
            showError('Search failed');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

function displaySearchResults(results) {
    const container = document.getElementById('search-results');
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = '<p>No results found.</p>';
        return;
    }
    
    results.forEach(listing => {
        const card = createListingCard(listing);
        container.appendChild(card);
    });
}

// Chat Functions
async function loadChatRooms() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const rooms = await response.json();
            displayChatRooms(rooms);
        }
    } catch (error) {
        console.error('Error loading chat rooms:', error);
    }
}

function displayChatRooms(rooms) {
    const container = document.getElementById('chat-rooms');
    container.innerHTML = '';
    
    if (rooms.length === 0) {
        container.innerHTML = '<p>No chat rooms yet.</p>';
        return;
    }
    
    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = 'chat-room';
        roomElement.innerHTML = `
            <h4>${room.listing.title}</h4>
            <p>${room.participant1.id === currentUser.id ? room.participant2.full_name : room.participant1.full_name}</p>
        `;
        roomElement.onclick = () => selectChatRoom(room.id);
        container.appendChild(roomElement);
    });
}

async function selectChatRoom(roomId) {
    currentChatRoom = roomId;
    
    // Update UI
    document.querySelectorAll('.chat-room').forEach(room => room.classList.remove('active'));
    event.target.closest('.chat-room').classList.add('active');
    
    // Load messages
    await loadChatMessages(roomId);
    
    // Show chat input
    document.getElementById('chat-input-container').style.display = 'flex';
    
    // Connect WebSocket
    connectWebSocket(roomId);
}

async function loadChatMessages(roomId) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            displayChatMessages(messages);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayChatMessages(messages) {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender_id === currentUser.id ? 'sent' : 'received'}`;
        messageElement.innerHTML = `
            <p>${message.content}</p>
            <small>${new Date(message.timestamp).toLocaleString()}</small>
        `;
        container.appendChild(messageElement);
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function connectWebSocket(roomId) {
    if (websocket) {
        websocket.close();
    }
    
    const wsUrl = `ws://localhost:8000/api/v1/chat/ws/${roomId}`;
    websocket = new WebSocket(wsUrl);
    
    websocket.onopen = function() {
        // Send authentication
        websocket.send(JSON.stringify({
            type: 'auth',
            token: currentToken
        }));
    };
    
    websocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
            addMessageToChat(data.message);
        }
    };
    
    websocket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || !currentChatRoom) return;
    
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
            type: 'message',
            content: message,
            room_id: currentChatRoom
        }));
        input.value = '';
    }
}

function addMessageToChat(message) {
    const container = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.sender_id === currentUser.id ? 'sent' : 'received'}`;
    messageElement.innerHTML = `
        <p>${message.content}</p>
        <small>${new Date(message.timestamp).toLocaleString()}</small>
    `;
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

// Profile Functions
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/profile/me`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const profile = await response.json();
            displayUserProfile(profile);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function displayUserProfile(profile) {
    // Update profile display
    document.getElementById('profile-name').textContent = profile.full_name || 'Not set';
    document.getElementById('profile-email').textContent = profile.email;
    document.getElementById('profile-university').textContent = profile.university_name || 'Not set';
    
    // Update profile picture
    if (profile.profile_picture) {
        setProfileImage(profile.profile_picture);
    }
    
    // Fill form fields
    document.getElementById('profile-full-name').value = profile.full_name || '';
    document.getElementById('profile-phone').value = profile.phone || '';
    document.getElementById('profile-university-input').value = profile.university_name || '';
    document.getElementById('profile-student-id').value = profile.student_id || '';
    document.getElementById('profile-department').value = profile.department || '';
    document.getElementById('profile-year').value = profile.year_of_study || '';
    document.getElementById('profile-whatsapp').value = profile.whatsapp_number || '';
    document.getElementById('profile-bio').value = profile.bio || '';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_BASE_URL}/profile/me`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });

        if (response.ok) {
            const profile = await response.json();
            displayUserProfile(profile);
            showSuccess('Profile updated successfully!');
        } else {
            const error = await response.json();
            showError(error.detail || 'Failed to update profile');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

async function handleProfilePictureUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    showLoading();
    
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/profile/me`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });

        if (response.ok) {
            const profile = await response.json();
            setProfileImage(profile.profile_picture);
            showSuccess('Profile picture updated!');
        } else {
            showError('Failed to update profile picture');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Favorites Functions
async function toggleFavorite(listingId) {
    if (!currentUser) {
        showError('Please login to add favorites');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${listingId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccess(result.status === 'already_favorited' ? 'Already in favorites' : 'Added to favorites');
        } else {
            showError('Failed to add to favorites');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

async function loadFavorites() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const favorites = await response.json();
            displayFavorites(favorites);
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

function displayFavorites(favorites) {
    const container = document.getElementById('my-favorites');
    container.innerHTML = '';
    
    if (favorites.length === 0) {
        container.innerHTML = '<p>No favorites yet.</p>';
        return;
    }
    
    favorites.forEach(favorite => {
        const card = createListingCard(favorite.listing);
        container.appendChild(card);
    });
}

// Notifications Functions
async function loadNotifications() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const notifications = await response.json();
            displayNotifications(notifications);
            updateNotificationBadge(notifications.filter(n => !n.is_read).length);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('notifications-list');
    container.innerHTML = '';
    
    if (notifications.length === 0) {
        container.innerHTML = '<p>No notifications.</p>';
        return;
    }
    
    notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.is_read ? '' : 'unread'}`;
        item.innerHTML = `
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
            <small>${new Date(notification.created_at).toLocaleString()}</small>
        `;
        item.onclick = () => markNotificationRead(notification.id);
        container.appendChild(item);
    });
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

async function markNotificationRead(notificationId) {
    try {
        await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_read: true })
        });
        
        loadNotifications(); // Refresh notifications
    } catch (error) {
        console.error('Error marking notification read:', error);
    }
}

async function markAllNotificationsRead() {
    try {
        await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        loadNotifications(); // Refresh notifications
    } catch (error) {
        console.error('Error marking all notifications read:', error);
    }
}

// UI Functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
    
    // Load section-specific data
    switch(sectionId) {
        case 'listings':
            loadListings();
            break;
        case 'chat':
            loadChatRooms();
            break;
        case 'profile':
            loadUserProfile();
            break;
        case 'verification':
            loadVerificationStatus();
            break;
        case 'admin':
            loadAdminStats();
            break;
    }
}

function showProfileTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`profile-${tabName}-tab`).classList.add('active');
    
    // Load tab-specific data
    switch(tabName) {
        case 'listings':
            loadUserListings();
            break;
        case 'favorites':
            loadFavorites();
            break;
    }
}

function showAuthModal() {
    document.getElementById('auth-modal').style.display = 'block';
}

function showSignupModal() {
    closeModal('auth-modal');
    document.getElementById('signup-modal').style.display = 'block';
}

function showCreateListingModal() {
    if (!currentUser) {
        showError('Please login to create a listing');
        return;
    }
    document.getElementById('create-listing-modal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    panel.classList.toggle('active');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function setupNavigation() {
    // Handle hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1) || 'home';
        showSection(hash);
    });
    
    // Handle initial hash
    const hash = window.location.hash.substring(1) || 'home';
    showSection(hash);
}

function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function showSuccess(message) {
    pushToast(message, 'success');
}

function normalizeErrorMessage(errorLike) {
    if (!errorLike) return 'Unknown error';
    if (typeof errorLike === 'string') return errorLike;
    if (errorLike.detail) return errorLike.detail;
    if (errorLike.message) return errorLike.message;
    try {
        return JSON.stringify(errorLike);
    } catch (_) {
        return 'Unexpected error';
    }
}

function showError(messageOrObject) {
    pushToast(normalizeErrorMessage(messageOrObject), 'error');
}

// Resolve media URL to absolute (handles local storage backend)
function resolveMediaUrl(url) {
    if (!url) return url;
    // Clean up accidental prefixes/suffixes like leading '@' or quotes
    let cleaned = String(url).trim();
    cleaned = cleaned.replace(/^@+/, '');
    cleaned = cleaned.replace(/^\"|^\'|\"$|\'$/g, '');
    url = cleaned;
    // If already absolute (http/https/data), return as-is
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
    // If backend serves from /uploads, ensure absolute to same host:port as backend
    if (url.startsWith('/')) {
        const base = API_BASE_URL.replace(/\/api\/v1$/, '');
        return base + url;
    }
    // Otherwise treat as relative path under backend root
    const base = API_BASE_URL.replace(/\/api\/v1$/, '');
    return base + '/' + url.replace(/^\/+/, '');
}

function setProfileImage(url) {
    const img = document.getElementById('profile-picture');
    if (!img) return;
    const finalUrl = resolveMediaUrl(url);
    // Avoid cache-busting on public S3 URLs that may be signed/policy-controlled
    const shouldBust = !/amazonaws\.com/i.test(finalUrl);
    const withCache = shouldBust ? finalUrl + (finalUrl.includes('?') ? '&' : '?') + 't=' + Date.now() : finalUrl;

    const pre = new Image();
    pre.onload = function() {
        img.src = withCache;
        img.title = finalUrl;
    };
    pre.onerror = function() {
        pushToast('Could not load profile image. Showing placeholder.', 'error');
        img.src = 'https://via.placeholder.com/150?text=Profile';
        img.title = 'Image failed to load: ' + finalUrl;
    };
    pre.src = withCache;
}

// Toasts
function pushToast(text, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return alert(text);
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = text;
    container.appendChild(el);
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 4000);
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        currentToken = token;
        fetchCurrentUser();
    }
}

// Additional utility functions
function viewListing(listingId) {
    openListingDetail(listingId);
}

function startChat(listingId) {
    if (!currentUser) {
        showError('Please login to start a chat');
        return;
    }
    
    // Open listing detail to fetch owner and then connect
    openListingDetail(listingId, true);
}

async function openListingDetail(listingId, autoStartChat = false) {
    try {
        const res = await fetch(`${API_BASE_URL}/listings/${listingId}`);
        if (!res.ok) { showError('Listing not found'); return; }
        const listing = await res.json();

        const image = listing.images && listing.images.length ? listing.images[0] : 'https://via.placeholder.com/600x400?text=No+Image';
        const container = document.getElementById('listing-detail');
        container.innerHTML = `
            <div style="display:grid;grid-template-columns: 1fr 1fr;gap:24px;align-items:start;">
                <img src="${image}" alt="${listing.title}" style="width:100%;border-radius:12px;object-fit:cover;max-height:360px;">
                <div>
                    <h2 style="margin-bottom:8px;">${listing.title}</h2>
                    <div class="listing-price" style="margin-bottom:12px;">$${listing.price}</div>
                    <span class="listing-category">${listing.category}</span>
                    <p style="margin-top:16px;color:#cbd5e1;white-space:pre-wrap;">${listing.description}</p>
                    <div style="margin-top:20px;display:flex;gap:10px;">
                        <button class="btn btn-primary" id="detail-chat-btn"><i class="fas fa-comments"></i> Chat with Seller</button>
                        <button class="btn btn-secondary" onclick="toggleFavorite(${listing.id})"><i class="fas fa-heart"></i> Favorite</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('listing-detail-modal').style.display = 'block';

        const chatBtn = document.getElementById('detail-chat-btn');
        chatBtn.onclick = () => beginChatForListing(listing);

        if (autoStartChat) beginChatForListing(listing);
    } catch (e) {
        showError('Failed to load listing');
    }
}

function beginChatForListing(listing) {
    if (!currentUser) { showAuthModal(); return; }
    const sellerId = listing.owner_id || (listing.owner && listing.owner.id);
    if (!sellerId) { showError('Seller info not available'); return; }

    // Close detail modal and switch to chat
    closeModal('listing-detail-modal');
    showSection('chat');

    // Create websocket to auto-create room (server will create if not exists)
    connectListingChat(listing.id, sellerId);
}

function connectListingChat(listingId, peerId) {
    if (websocket) try { websocket.close(); } catch(_){}
    const url = `ws://localhost:8000/api/v1/chat/${listingId}/${peerId}?token=${encodeURIComponent(currentToken)}`;
    websocket = new WebSocket(url);
    websocket.onopen = () => {
        // connection established; server created/fetched the room automatically
    };
    websocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.error) {
            showError(data.error);
            return;
        }
        addMessageToChat(data);
        document.getElementById('chat-input-container').style.display = 'flex';
    };
    websocket.onerror = function(error) { console.error('WS error', error); };
}

async function loadUserListings() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/listings/my`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const listings = await response.json();
            displayUserListings(listings);
        }
    } catch (error) {
        console.error('Error loading user listings:', error);
    }
}

function displayUserListings(listings) {
    const container = document.getElementById('my-listings');
    container.innerHTML = '';
    
    if (listings.length === 0) {
        container.innerHTML = '<p>No listings yet.</p>';
        return;
    }
    
    listings.forEach(listing => {
        const card = createListingCard(listing);
        container.appendChild(card);
    });
}

// Verification Functions
async function loadVerificationStatus() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/verification/status`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const status = await response.json();
            displayVerificationStatus(status);
        }
    } catch (error) {
        console.error('Error loading verification status:', error);
    }
}

function displayVerificationStatus(status) {
    const container = document.getElementById('verification-status');
    
    if (status.status === 'verified') {
        container.innerHTML = `
            <h3>✅ Account Verified</h3>
            <p>Your account has been verified. You can now create listings and use all features.</p>
        `;
        container.style.background = '#d4edda';
        container.style.color = '#155724';
    } else if (status.status === 'pending') {
        container.innerHTML = `
            <h3>⏳ Verification Pending</h3>
            <p>Your verification is under review. You'll be notified once it's approved.</p>
        `;
        container.style.background = '#fff3cd';
        container.style.color = '#856404';
    } else {
        container.innerHTML = `
            <h3>❌ Account Not Verified</h3>
            <p>Please complete the verification process to access all features.</p>
        `;
        container.style.background = '#f8d7da';
        container.style.color = '#721c24';
    }
}

async function handleVerificationRequest(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    const data = {
        university_email: formData.get('university_email'),
        student_id: formData.get('student_id')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/verification/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showSuccess('OTP sent to your university email');
            document.getElementById('step-1').style.display = 'none';
            document.getElementById('step-2').style.display = 'block';
        } else {
            const error = await response.json();
            showError(error.detail || 'Failed to send OTP');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

async function handleVerificationOTP(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    const data = {
        otp_code: formData.get('otp_code')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/verification/verify-otp`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showSuccess('OTP verified successfully');
            document.getElementById('step-2').style.display = 'none';
            document.getElementById('step-3').style.display = 'block';
        } else {
            const error = await response.json();
            showError(error.detail || 'Invalid OTP');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

async function handleVerificationUpload(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_BASE_URL}/verification/upload-id`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            showSuccess('ID uploaded successfully. Waiting for admin review.');
            loadVerificationStatus();
        } else {
            const error = await response.json();
            showError(error.detail || 'Failed to upload ID');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Admin Functions
async function loadAdminStats() {
    if (!currentUser || !currentUser.is_admin) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            displayAdminStats(stats);
        }
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

function displayAdminStats(stats) {
    const container = document.getElementById('admin-stats');
    container.innerHTML = `
        <div class="stat-card">
            <h3>${stats.total_users}</h3>
            <p>Total Users</p>
        </div>
        <div class="stat-card">
            <h3>${stats.verified_users}</h3>
            <p>Verified Users</p>
        </div>
        <div class="stat-card">
            <h3>${stats.total_listings}</h3>
            <p>Total Listings</p>
        </div>
        <div class="stat-card">
            <h3>${stats.active_listings}</h3>
            <p>Active Listings</p>
        </div>
        <div class="stat-card">
            <h3>${stats.pending_verifications}</h3>
            <p>Pending Verifications</p>
        </div>
        <div class="stat-card">
            <h3>${stats.pending_reports}</h3>
            <p>Pending Reports</p>
        </div>
    `;
}

async function loadAdminUsers() {
    if (!currentUser || !currentUser.is_admin) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayAdminUsers(data.items);
        }
    } catch (error) {
        console.error('Error loading admin users:', error);
    }
}

function displayAdminUsers(users) {
    const container = document.getElementById('admin-users');
    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>University</th>
                    <th>Verified</th>
                    <th>Admin</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.email}</td>
                        <td>${user.full_name || 'N/A'}</td>
                        <td>${user.university_name || 'N/A'}</td>
                        <td>${user.is_verified ? '✅' : '❌'}</td>
                        <td>${user.is_admin ? '✅' : '❌'}</td>
                        <td class="admin-actions">
                            <button class="btn btn-small btn-warning" onclick="toggleUserVerification('${user.id}')">
                                ${user.is_verified ? 'Unverify' : 'Verify'}
                            </button>
                            <button class="btn btn-small btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadAdminVerifications() {
    if (!currentUser || !currentUser.is_admin) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/verification/pending`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const verifications = await response.json();
            displayAdminVerifications(verifications);
        }
    } catch (error) {
        console.error('Error loading admin verifications:', error);
    }
}

function displayAdminVerifications(verifications) {
    const container = document.getElementById('admin-verifications');
    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>User ID</th>
                    <th>Email</th>
                    <th>Student ID</th>
                    <th>ID Document</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${verifications.map(ver => `
                    <tr>
                        <td>${ver.user_id}</td>
                        <td>${ver.email}</td>
                        <td>${ver.student_id}</td>
                        <td>
                            ${ver.id_document_url ? 
                                `<a href="${ver.id_document_url}" target="_blank">View Document</a>` : 
                                'No document uploaded'
                            }
                        </td>
                        <td class="admin-actions">
                            <button class="btn btn-small btn-success" onclick="approveVerification('${ver.user_id}')">Approve</button>
                            <button class="btn btn-small btn-danger" onclick="rejectVerification('${ver.user_id}')">Reject</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function approveVerification(userId) {
    if (!confirm('Are you sure you want to approve this verification?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/verification/approve/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admin_notes: 'Approved by admin'
            })
        });
        
        if (response.ok) {
            showSuccess('Verification approved');
            loadAdminVerifications();
        } else {
            showError('Failed to approve verification');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

async function rejectVerification(userId) {
    if (!confirm('Are you sure you want to reject this verification?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/verification/reject/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admin_notes: 'Rejected by admin'
            })
        });
        
        if (response.ok) {
            showSuccess('Verification rejected');
            loadAdminVerifications();
        } else {
            showError('Failed to reject verification');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

function showAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.admin-content .tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`admin-${tabName}-tab`).classList.add('active');
    
    // Load tab-specific data
    switch(tabName) {
        case 'dashboard':
            loadAdminStats();
            break;
        case 'users':
            loadAdminUsers();
            break;
        case 'verifications':
            loadAdminVerifications();
            break;
    }
}
