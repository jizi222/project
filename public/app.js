// Lendify - Main Application Logic

// App State
const appState = {
    currentUser: null,
    map: null,
    markers: [],
    qrScanner: null,
    currentView: 'explore',
    isAuthenticated: false
};

// Check if user is logged in
function checkAuth() {
    const savedUser = localStorage.getItem('lendify_user');
    if (savedUser) {
        try {
            appState.currentUser = JSON.parse(savedUser);
            appState.isAuthenticated = true;
            return true;
        } catch (e) {
            localStorage.removeItem('lendify_user');
        }
    }
    return false;
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        // User is logged in, show main app
        showMainApp();
    } else {
        // User not logged in, show login screen
        showLoginView();
    }
    initializeAuth();
});

// Authentication Functions
function initializeAuth() {
    try {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) {
            console.error('Login form not found!');
            return;
        }
        loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                errorDiv.textContent = errorData.error || `Error: ${response.status} ${response.statusText}`;
                errorDiv.classList.remove('hidden');
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                appState.currentUser = data.user;
                appState.isAuthenticated = true;
                localStorage.setItem('lendify_user', JSON.stringify(data.user));
                document.getElementById('loginForm').reset();
                document.getElementById('loginError').classList.add('hidden');
                showMainApp();
            } else {
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = `Connection error: ${error.message}. Make sure the server is running on http://localhost:3000`;
            errorDiv.classList.remove('hidden');
        }
    });
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) {
        console.error('Signup form not found!');
        return;
    }
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const errorDiv = document.getElementById('signupError');
        
        // Get user location if available
        let lat = 40.7128;
        let lng = -74.0060;
        
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
            } catch (e) {
                // Use default location
            }
        }
        
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, lat, lng })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                errorDiv.textContent = errorData.error || `Error: ${response.status} ${response.statusText}`;
                errorDiv.classList.remove('hidden');
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                appState.currentUser = data.user;
                appState.isAuthenticated = true;
                localStorage.setItem('lendify_user', JSON.stringify(data.user));
                document.getElementById('signupForm').reset();
                document.getElementById('signupError').classList.add('hidden');
                showMainApp();
            } else {
                errorDiv.textContent = data.error || 'Signup failed';
                errorDiv.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Signup error:', error);
            errorDiv.textContent = `Connection error: ${error.message}. Make sure the server is running on http://localhost:3000`;
            errorDiv.classList.remove('hidden');
        }
    });
    
    // Toggle between login and signup
    document.getElementById('showSignupBtn').addEventListener('click', () => {
        document.getElementById('loginView').classList.add('hidden');
        document.getElementById('signupView').classList.remove('hidden');
    });
    
    document.getElementById('showLoginBtn').addEventListener('click', () => {
        document.getElementById('signupView').classList.add('hidden');
        document.getElementById('loginView').classList.remove('hidden');
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        appState.currentUser = null;
        appState.isAuthenticated = false;
        localStorage.removeItem('lendify_user');
        showLoginView();
    });
    } catch (error) {
        console.error('Error initializing auth:', error);
    }
}

function showLoginView() {
    document.getElementById('loginView').classList.remove('hidden');
    document.getElementById('signupView').classList.add('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('bottomNav').classList.add('hidden');
    document.getElementById('trustBadge').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
}

// Update authentication UI elements
function updateAuthUI() {
    const trustBadge = document.getElementById('trustBadge');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (appState.isAuthenticated && appState.currentUser) {
        // Show trust badge and logout button
        if (trustBadge) {
            trustBadge.classList.remove('hidden');
            const trustScore = trustBadge.querySelector('.trust-score');
            if (trustScore && appState.currentUser.trustScore !== undefined) {
                trustScore.textContent = appState.currentUser.trustScore;
            }
        }
        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
        }
    } else {
        // Hide trust badge and logout button
        if (trustBadge) trustBadge.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }
}

function showMainApp() {
    try {
        // Hide login/signup views
        document.getElementById('loginView').classList.add('hidden');
        document.getElementById('signupView').classList.add('hidden');
        
        // Show main content
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('bottomNav').classList.remove('hidden');
        
        // Update auth UI
        updateAuthUI();
    
    // Set default location first (so tools load immediately)
    if (!appState.currentUser) {
        appState.currentUser = { location: { lat: 40.7128, lng: -74.0060 } };
    } else if (!appState.currentUser.location) {
        appState.currentUser.location = { lat: 40.7128, lng: -74.0060 };
    }
    
    // Initialize app features
    initializeNavigation();
    
    // Load tools FIRST (they don't depend on map)
    loadNearbyTools();
    
    // Initialize map after a small delay (non-blocking)
    setTimeout(() => {
        initializeMap();
    }, 200);
    
    initializeScanner();
    loadUserProfile();
    loadMyTools();
    
    // Try to get user location (will update tools if successful)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (!appState.currentUser) {
                    appState.currentUser = {};
                }
                appState.currentUser.location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                if (appState.isAuthenticated) {
                    localStorage.setItem('lendify_user', JSON.stringify(appState.currentUser));
                }
                if (appState.map) {
                    appState.map.setView([position.coords.latitude, position.coords.longitude], 13);
                }
                // Reload tools with new location
                loadNearbyTools();
            },
            (error) => {
                // Silently handle geolocation errors - app works fine with default location
                if (error.code === error.PERMISSION_DENIED) {
                    console.log('Location permission denied - using default location');
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    console.log('Location unavailable - using default location');
                } else if (error.code === error.TIMEOUT) {
                    console.log('Location request timeout - using default location');
                }
                // Already using default location, tools already loaded
            },
            { 
                enableHighAccuracy: false, // Don't require GPS, reduces Google API calls
                timeout: 5000,
                maximumAge: 300000 // Cache location for 5 minutes
            }
        );
    }
    } catch (error) {
        console.error('Error in showMainApp:', error);
    }
}

// Navigation
function initializeNavigation() {
    try {
        const navItems = document.querySelectorAll('.nav-item');
        if (navItems.length === 0) {
            console.error('No navigation items found!');
            return;
        }
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const view = item.dataset.view;
                if (view) {
                    console.log('Switching to view:', view);
                    switchView(view);
                } else {
                    console.error('No view specified for nav item');
                }
            });
        });
        console.log('Navigation initialized with', navItems.length, 'items');
    } catch (error) {
        console.error('Error initializing navigation:', error);
    }
}

function switchView(viewName) {
    try {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show selected view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.remove('hidden');
        } else {
            console.error(`View not found: ${viewName}View`);
        }
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItem = document.querySelector(`[data-view="${viewName}"]`);
        if (navItem) {
            navItem.classList.add('active');
        } else {
            console.error(`Nav item not found for view: ${viewName}`);
        }
        
        appState.currentView = viewName;
        
        // View-specific initialization
        if (viewName === 'explore') {
            // Ensure map is initialized and properly sized when switching to explore view
            // Don't block if map fails - just log error
            try {
                if (!appState.map) {
                    // Map not initialized, initialize it now
                    setTimeout(() => {
                        try {
                            initializeMap();
                        } catch (err) {
                            console.error('Map initialization error:', err);
                        }
                    }, 100);
                } else {
                    // Map exists, just invalidate size
                    setTimeout(() => {
                        try {
                            if (appState.map) {
                                appState.map.invalidateSize();
                                appState.map.setView([appState.currentUser?.location?.lat || 40.7128, appState.currentUser?.location?.lng || -74.0060], 13);
                            }
                        } catch (err) {
                            console.error('Map update error:', err);
                        }
                    }, 150);
                }
                loadNearbyTools();
            } catch (err) {
                console.error('Explore view initialization error:', err);
                // Still show the view even if map fails
            }
        } else if (viewName === 'scan') {
            try {
                if (appState.qrScanner) {
                    appState.qrScanner.resume();
                }
            } catch (err) {
                console.error('Scanner resume error:', err);
            }
        } else {
            try {
                if (appState.qrScanner) {
                    appState.qrScanner.pause();
                }
            } catch (err) {
                console.error('Scanner pause error:', err);
            }
        }
    } catch (error) {
        console.error('Error in switchView:', error);
        // Still try to show the view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
    }
}

// Map Initialization
function initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found!');
        return;
    }
    
    // Wait for Leaflet to load (with timeout)
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds total
    
    const checkLeaflet = setInterval(() => {
        attempts++;
        
        if (typeof L !== 'undefined') {
            clearInterval(checkLeaflet);
            // Leaflet loaded, initialize map
            tryInitializeMap(mapContainer);
        } else if (attempts >= maxAttempts) {
            clearInterval(checkLeaflet);
            // Leaflet failed to load - likely internet issue
            console.error('Leaflet library failed to load after timeout - possible internet connection issue');
            mapContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; margin: 1rem;"><strong>⚠️ Internet Connection Required</strong><br><small>Map requires internet to load libraries. Please check your connection.</small><br><small style="margin-top: 0.5rem; display: block;">Tools list below should still work if server is running.</small></div>';
        }
    }, 100);
}

function tryInitializeMap(mapContainer) {
    try {
        // Check if map already exists
        if (appState.map) {
            console.log('Map already initialized');
            appState.map.invalidateSize();
            return;
        }
        
        console.log('Initializing map...');
        console.log('Map container dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
        
        // Clear loading message
        mapContainer.innerHTML = '';
        
        // Initialize Leaflet map
        appState.map = L.map('map', {
            zoomControl: true,
            preferCanvas: false
        }).setView([40.7128, -74.0060], 13);
        
        console.log('Map object created');
        
        // Add tile layer with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYXAgVGFwaW5nPC90ZXh0Pjwvc3ZnPg=='
        });
        
        tileLayer.on('tileerror', (error) => {
            console.warn('Tile loading error:', error);
        });
        
        tileLayer.addTo(appState.map);
        
        console.log('Tile layer added');
        
        // Invalidate map size after a delay to ensure container is properly sized
        setTimeout(() => {
            if (appState.map) {
                appState.map.invalidateSize();
                console.log('Map size invalidated');
            }
        }, 500);
        
        // Also invalidate when window resizes
        window.addEventListener('resize', () => {
            if (appState.map) {
                appState.map.invalidateSize();
            }
        });
        
        // Add user location button handler (only once)
        const getLocationBtn = document.getElementById('getLocationBtn');
        if (getLocationBtn && !getLocationBtn.dataset.listenerAdded) {
            getLocationBtn.dataset.listenerAdded = 'true';
            getLocationBtn.addEventListener('click', () => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            if (!appState.currentUser) {
                                appState.currentUser = {};
                            }
                            appState.currentUser.location = { lat, lng };
                            if (appState.isAuthenticated) {
                                localStorage.setItem('lendify_user', JSON.stringify(appState.currentUser));
                            }
                            if (appState.map) {
                                appState.map.setView([lat, lng], 13);
                            }
                            loadNearbyTools();
                        },
                        (error) => {
                            alert('Unable to get your location. Please enable location services.');
                        }
                    );
                }
            });
        }
    } catch (error) {
        console.error('Error initializing map:', error);
        mapContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: #666; background: #f5f5f5; border-radius: 8px; margin: 1rem;"><strong>Map Error</strong><br><small>${error.message}</small><br><small style="margin-top: 0.5rem; display: block;">Tools are still available below.</small></div>`;
    }
}

// Load Nearby Tools
async function loadNearbyTools() {
    if (!appState.currentUser || !appState.currentUser.location) {
        // Set default location if not available
        appState.currentUser = appState.currentUser || {};
        appState.currentUser.location = appState.currentUser.location || { lat: 40.7128, lng: -74.0060 };
    }
    
    const { lat, lng } = appState.currentUser.location;
    const toolsList = document.getElementById('toolsList');
    
    if (!toolsList) {
        console.error('toolsList element not found!');
        return;
    }
    
    // Validate coordinates before making request
    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        console.error('Invalid coordinates:', { lat, lng });
        toolsList.innerHTML = '<div class="error-message">Unable to load tools - invalid location data</div>';
        return;
    }
    
    toolsList.innerHTML = '<div class="loading">Loading nearby tools...</div>';
    
    try {
        console.log(`Loading tools for location: ${lat}, ${lng}`);
        const response = await fetch(`/api/get-tools?lat=${lat}&lng=${lng}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Tools data received:', data);
        
        if (data.tools && data.tools.length > 0) {
            console.log(`Found ${data.tools.length} tools`);
            displayTools(data.tools);
            updateMapMarkers(data.tools);
        } else {
            toolsList.innerHTML = '<div class="loading">No tools found within 5 miles. Check back later!</div>';
        }
    } catch (error) {
        console.error('Error loading tools:', error);
        let errorMessage = 'Error loading tools';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = '⚠️ Network Error: Cannot connect to server. Make sure the server is running on http://localhost:3000';
        } else if (error.message.includes('404')) {
            errorMessage = '⚠️ Server Error: API endpoint not found. Check if server is running.';
        } else {
            errorMessage = `Error: ${error.message}`;
        }
        
        toolsList.innerHTML = `<div class="loading" style="color: #d32f2f; background: #ffebee; padding: 1rem; border-radius: 8px; border-left: 4px solid #d32f2f;">${errorMessage}<br><small style="margin-top: 0.5rem; display: block;">Check browser console (F12) for details.</small></div>`;
    }
}

function displayTools(tools) {
    const toolsList = document.getElementById('toolsList');
    toolsList.innerHTML = '';
    
    tools.forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card';
        toolCard.innerHTML = `
            <h3>${tool.name}</h3>
            <div class="tool-meta">
                <span>${tool.category} • ${tool.ownerName}</span>
                <span class="tool-distance">${tool.distance.toFixed(1)} mi</span>
            </div>
            <div class="tool-meta" style="margin-top: 0.5rem;">
                <span>Trust: ${tool.ownerTrustScore}</span>
            </div>
        `;
        toolCard.addEventListener('click', () => showToolModal(tool));
        toolsList.appendChild(toolCard);
    });
}

function updateMapMarkers(tools) {
    if (!appState.map) {
        console.log('Map not initialized - skipping markers (this is OK if map failed to load)');
        return;
    }
    
    if (!appState.currentUser || !appState.currentUser.location) {
        if (!appState.currentUser) {
            appState.currentUser = { location: { lat: 40.7128, lng: -74.0060 } };
        }
        if (!appState.currentUser.location) {
            appState.currentUser.location = { lat: 40.7128, lng: -74.0060 };
        }
    }
    
    // Ensure map is properly sized
    setTimeout(() => {
        if (appState.map) {
            appState.map.invalidateSize();
        }
    }, 50);
    
    // Clear existing markers
    if (appState.markers && appState.markers.length > 0) {
        appState.markers.forEach(marker => {
            if (appState.map && appState.map.hasLayer(marker)) {
                appState.map.removeLayer(marker);
            }
        });
    }
    appState.markers = [];
    
    // Add user location marker
    const userMarker = L.marker([appState.currentUser.location.lat, appState.currentUser.location.lng])
        .addTo(appState.map)
        .bindPopup('Your Location');
    userMarker._icon.style.filter = 'hue-rotate(200deg)';
    appState.markers.push(userMarker);
    
    // Add tool markers
    tools.forEach(tool => {
        const marker = L.marker([tool.location.lat, tool.location.lng])
            .addTo(appState.map)
            .bindPopup(`<b>${tool.name}</b><br>${tool.category}<br>${tool.distance.toFixed(1)} mi away`);
        appState.markers.push(marker);
    });
    
    // Fit map to show all markers
    if (tools.length > 0) {
        const group = new L.featureGroup(appState.markers);
        appState.map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Tool Modal
function showToolModal(tool) {
    const modal = document.getElementById('toolModal');
    document.getElementById('modalToolName').textContent = tool.name;
    document.getElementById('modalCategory').textContent = tool.category;
    document.getElementById('modalOwner').textContent = tool.ownerName;
    document.getElementById('modalTrustScore').textContent = tool.ownerTrustScore;
    document.getElementById('modalDistance').textContent = `${tool.distance.toFixed(1)} miles`;
    
    document.getElementById('requestToolBtn').onclick = () => {
        alert('To checkout this tool, scan its QR code using the Scan tab!');
        modal.classList.add('hidden');
    };
    
    modal.classList.remove('hidden');
}

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('toolModal').classList.add('hidden');
});

// QR Scanner
function initializeScanner() {
    // Check if Html5Qrcode library is loaded
    if (typeof Html5Qrcode === 'undefined') {
        console.error('Html5Qrcode library not loaded - possible internet connection issue');
        const scannerContainer = document.querySelector('.scanner-container');
        if (scannerContainer) {
            scannerContainer.innerHTML = `
                <div style="color: white; text-align: center; padding: 2rem;">
                    <p style="font-size: 1.2rem; margin-bottom: 1rem;">⚠️ Internet Connection Required</p>
                    <p>QR Scanner library requires internet to load.</p>
                    <p>Please check your connection and refresh the page.</p>
                </div>
            `;
        }
        return;
    }
    
    const qrReader = document.getElementById('qr-reader');
    if (!qrReader) {
        console.error('QR reader element not found');
        return;
    }
    
    try {
        appState.qrScanner = new Html5Qrcode("qr-reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
        
        appState.qrScanner.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        ).catch(err => {
            console.error('Error starting scanner:', err);
            const scannerContainer = document.querySelector('.scanner-container');
            if (scannerContainer) {
                scannerContainer.innerHTML = `
                    <div style="color: white; text-align: center; padding: 2rem;">
                        <p style="font-size: 1.2rem; margin-bottom: 1rem;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
                                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="2" y1="10" x2="22" y2="10"></line>
                            </svg>
                            Camera Access Required
                        </p>
                        <p>Please allow camera permissions and refresh.</p>
                        <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">If this persists, check browser settings for camera permissions.</p>
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error('Error initializing scanner:', error);
        const scannerContainer = document.querySelector('.scanner-container');
        if (scannerContainer) {
            scannerContainer.innerHTML = `
                <div style="color: white; text-align: center; padding: 2rem;">
                    <p style="font-size: 1.2rem; margin-bottom: 1rem;">⚠️ Scanner Error</p>
                    <p>${error.message}</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem;">Please refresh the page.</p>
                </div>
            `;
        }
    }
}

function onScanSuccess(decodedText, decodedResult) {
    // Stop scanning
    appState.qrScanner.pause();
    
    // Show results
    const resultsDiv = document.getElementById('scannerResults');
    const toolName = document.getElementById('scannedToolName');
    const toolInfo = document.getElementById('scannedToolInfo');
    
    if (!appState.currentUser || !appState.currentUser.location) {
        toolName.textContent = 'Error';
        toolInfo.textContent = 'Please set your location first.';
        resultsDiv.classList.remove('hidden');
        return;
    }
    
    // Find tool by QR token
    fetch(`/api/get-tools?lat=${appState.currentUser.location.lat}&lng=${appState.currentUser.location.lng}`)
        .then(res => res.json())
        .then(data => {
            const tool = data.tools.find(t => t.qrToken === decodedText);
            if (tool) {
                toolName.textContent = tool.name;
                toolInfo.textContent = `${tool.category} • Owner: ${tool.ownerName}`;
                resultsDiv.classList.remove('hidden');
                
                // Setup checkout button
                document.getElementById('checkoutBtn').onclick = () => {
                    checkoutTool(decodedText, tool);
                };
            } else {
                toolName.textContent = 'Tool Not Found';
                toolInfo.textContent = 'This QR code is not recognized or the tool is not available.';
                resultsDiv.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Error fetching tool:', error);
            toolName.textContent = 'Error';
            toolInfo.textContent = 'Unable to verify tool. Please try again.';
            resultsDiv.classList.remove('hidden');
        });
}

function onScanError(errorMessage) {
    // Ignore scanning errors (they're frequent during scanning)
}

async function checkoutTool(qrToken, tool) {
    if (!appState.currentUser) {
        alert('Please login to checkout tools');
        return;
    }
    
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                qrToken: qrToken,
                borrowerID: appState.currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Tool checked out successfully!\n\nTool: ${tool.name}\nCheckout Time: ${new Date(data.checkout.checkoutTime).toLocaleString()}\n\nRemember to return it on time to maintain your trust score!`);
            
            // Reset scanner
            document.getElementById('scannerResults').classList.add('hidden');
            appState.qrScanner.resume();
            
            // Refresh views
            loadNearbyTools();
            loadMyTools();
        } else {
            alert('Error: ' + (data.error || 'Unable to checkout tool'));
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('Error checking out tool. Please try again.');
    }
}

// My Tools
async function loadMyTools() {
    if (!appState.currentUser) return;
    
    const myToolsList = document.getElementById('myToolsList');
    myToolsList.innerHTML = '<div class="loading">Loading your tools...</div>';
    
    try {
        const response = await fetch(`/api/my-tools?userID=${appState.currentUser.id}`);
        const data = await response.json();
        
        if (data.tools && data.tools.length > 0) {
            displayMyTools(data.tools, data.checkouts);
        } else {
            myToolsList.innerHTML = '<div class="loading">You haven\'t listed any tools yet.</div>';
        }
    } catch (error) {
        console.error('Error loading my tools:', error);
        myToolsList.innerHTML = '<div class="loading">Error loading tools.</div>';
    }
}

function displayMyTools(tools, checkouts) {
    const myToolsList = document.getElementById('myToolsList');
    myToolsList.innerHTML = '';
    
    tools.forEach(tool => {
        const toolItem = document.createElement('div');
        toolItem.className = 'tool-item';
        
        const status = tool.status === 'Available' ? 'available' : 'rented';
        const icon = getToolIcon(tool.category);
        
        toolItem.innerHTML = `
            <div class="tool-icon">${icon}</div>
            <div class="tool-name">${tool.name}</div>
            <div class="tool-status ${status}">${tool.status}</div>
        `;
        
        myToolsList.appendChild(toolItem);
    });
}

function getToolIcon(category) {
    const icons = {
        'Power Tools': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline></svg>',
        'Hand Tools': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
        'Ladders': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="2" x2="5" y2="22"></line><line x1="19" y1="2" x2="19" y2="22"></line><line x1="5" y1="6" x2="19" y2="6"></line><line x1="5" y1="10" x2="19" y2="10"></line><line x1="5" y1="14" x2="19" y2="14"></line><line x1="5" y1="18" x2="19" y2="18"></line></svg>',
        'Outdoor': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        'Other': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>'
    };
    return icons[category] || icons['Other'];
}

// Profile
async function loadUserProfile() {
    if (!appState.currentUser) return;
    
    try {
        const response = await fetch(`/api/profile?userID=${appState.currentUser.id}`);
        const data = await response.json();
        
        if (data.user) {
            appState.currentUser = { ...appState.currentUser, ...data.user };
            localStorage.setItem('lendify_user', JSON.stringify(appState.currentUser));
            updateProfileDisplay();
            updateTrustBadge();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateProfileDisplay() {
    document.getElementById('profileName').textContent = appState.currentUser.name;
    document.getElementById('profileTrustScore').textContent = `Trust Score: ${appState.currentUser.trustScore}`;
    
    // Update stats (simplified for demo)
    fetch(`/api/my-tools?userID=${appState.currentUser.id}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('toolsOwned').textContent = data.tools ? data.tools.length : 0;
            document.getElementById('toolsBorrowed').textContent = data.checkouts ? data.checkouts.length : 0;
        });
}

function updateTrustBadge() {
    document.getElementById('trustBadge').textContent = `Trust: ${appState.currentUser.trustScore}`;
}
