/**
 * Configuration page functionality for Acestream Scraper
 */

// Load and display configuration data
async function loadConfigData() {
    showLoading();
    try {
        // Get stats from API
        const stats = await fetchStats();
        
        // Update system info table - only elements that exist on the config page
        if (document.getElementById('configBaseUrl')) 
            document.getElementById('configBaseUrl').textContent = stats.base_url || 'Not configured';
        if (document.getElementById('configChannelBaseUrl'))
            document.getElementById('configChannelBaseUrl').textContent = stats.channel_base_url || 'Not configured';
        if (document.getElementById('configAceEngineUrl'))
            document.getElementById('configAceEngineUrl').textContent = stats.ace_engine_url || 'Not configured';
        if (document.getElementById('configRescrapeInterval'))
            document.getElementById('configRescrapeInterval').textContent = (stats.rescrape_interval || 'N/A') + ' hours';
        if (document.getElementById('configTotalUrls'))
            document.getElementById('configTotalUrls').textContent = stats.urls?.length || 0;
        if (document.getElementById('configTotalChannels'))
            document.getElementById('configTotalChannels').textContent = stats.total_channels || 0;
        
        // Update Acexy status
        await updateAcexyStatus();
        
        // Update Acestream Engine status
        await updateAcestreamStatus();
        
        // Load URLs list
        await loadUrlsList();
        
        // Update footer statistics
        updateStats(stats);
    } catch (error) {
        console.error('Error loading configuration data:', error);
    } finally {
        hideLoading();
    }
}

// Update Acexy status in the config page
async function updateAcexyStatus() {
    try {
        const response = await fetch('/api/config/acexy_status');
        const data = await response.json();
        
        const acexyStatusElement = document.getElementById('acexyStatusConfig');
        const configAcexyStatus = document.getElementById('configAcexyStatus');
        
        if (acexyStatusElement) {
            if (data.enabled) {
                if (data.available) {
                    acexyStatusElement.className = 'badge bg-success';
                    acexyStatusElement.textContent = 'Online';
                    if (configAcexyStatus) configAcexyStatus.textContent = 'Enabled and Online';
                } else {
                    acexyStatusElement.className = 'badge bg-danger';
                    acexyStatusElement.textContent = 'Offline';
                    if (configAcexyStatus) configAcexyStatus.textContent = 'Enabled but Offline';
                }
            } else {
                acexyStatusElement.className = 'badge bg-secondary';
                acexyStatusElement.textContent = 'Disabled';
                if (configAcexyStatus) configAcexyStatus.textContent = 'Disabled';
            }
        }
        
        // Show/hide Acexy features
        const acexyElements = document.querySelectorAll('.acexy-feature');
        if (data.enabled) {
            acexyElements.forEach(el => el.classList.remove('d-none'));
        } else {
            acexyElements.forEach(el => el.classList.add('d-none'));
        }
    } catch (error) {
        console.error('Error checking Acexy status:', error);
        const acexyStatusElement = document.getElementById('acexyStatusConfig');
        if (acexyStatusElement) {
            acexyStatusElement.className = 'badge bg-warning';
            acexyStatusElement.textContent = 'Error';
        }
    }
}

// Update Acestream Engine status in the config page
async function updateAcestreamStatus() {
    try {
        const response = await fetch('/api/config/acestream_status');
        const data = await response.json();
        
        const acestreamStatusElement = document.getElementById('acestreamStatusConfig');
        const configAcestreamStatus = document.getElementById('configAcexyStatus');
        const acestreamDetailsElement = document.getElementById('acestreamDetailsConfig');
        const versionElement = document.getElementById('acestreamVersionConfig');
        const platformElement = document.getElementById('acestreamPlatformConfig');
        const networkElement = document.getElementById('acestreamNetworkConfig');
        
        if (acestreamStatusElement) {
            if (data.enabled) {
                if (data.available) {
                    acestreamStatusElement.className = 'badge bg-success';
                    acestreamStatusElement.textContent = 'Online';
                    
                    if (acestreamDetailsElement) {
                        acestreamDetailsElement.classList.remove('d-none');
                        if (versionElement) versionElement.textContent = data.version || 'Unknown';
                        if (platformElement) platformElement.textContent = data.platform || 'Unknown';
                        if (networkElement) networkElement.textContent = data.connected ? 'Connected' : 'Disconnected';
                    }
                    
                    if (configAcestreamStatus) configAcestreamStatus.textContent = 'Enabled and Online';
                } else {
                    acestreamStatusElement.className = 'badge bg-danger';
                    acestreamStatusElement.textContent = 'Offline';
                    if (acestreamDetailsElement) acestreamDetailsElement.classList.add('d-none');
                    if (configAcestreamStatus) configAcestreamStatus.textContent = 'Enabled but Offline';
                }
            } else {
                acestreamStatusElement.className = 'badge bg-secondary';
                acestreamStatusElement.textContent = 'Disabled';
                if (acestreamDetailsElement) acestreamDetailsElement.classList.add('d-none');
                if (configAcestreamStatus) configAcestreamStatus.textContent = 'Disabled';
            }
        }
    } catch (error) {
        console.error('Error checking Acestream Engine status:', error);
        const acestreamStatusElement = document.getElementById('acestreamStatusConfig');
        if (acestreamStatusElement) {
            acestreamStatusElement.className = 'badge bg-warning';
            acestreamStatusElement.textContent = 'Error';
        }
    }
}

// Check Acestream Engine status with optional loading indicator
async function checkAcestreamStatus(showLoadingIndicator = false) {
    try {
        if (showLoadingIndicator) showLoading();
        await updateAcestreamStatus();
    } finally {
        if (showLoadingIndicator) hideLoading();
    }
}

// Load URLs list for management
async function loadUrlsList() {
    try {
        const stats = await fetchStats();
        const urlsManagementList = document.getElementById('urlsManagementList');
        
        if (urlsManagementList && stats.urls && stats.urls.length > 0) {
            urlsManagementList.innerHTML = stats.urls.map(url => `
                <div class="list-group-item">
                    <div class="row align-items-center">
                        <div class="col-md-7">
                            <div><strong>${url.url}</strong></div>
                            <div class="small text-muted">
                                Status: <span class="status-${url.status.toLowerCase()}">${url.status}</span>
                                <span class="ms-2">Channels: ${url.channel_count}</span>
                                ${url.last_scraped ? `<span class="ms-2">Last scraped: ${formatLocalDate(url.last_scraped)}</span>` : ''}
                            </div>
                        </div>
                        <div class="col-md-5 text-end">
                            <button class="btn btn-sm ${url.enabled ? 'btn-warning' : 'btn-success'}" 
                                    onclick="toggleUrl('${url.url}', ${!url.enabled})">
                                ${url.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button class="btn btn-sm btn-info" 
                                    onclick="refreshUrl('${url.url}')">
                                Refresh
                            </button>
                            <button class="btn btn-sm btn-danger" 
                                    onclick="deleteUrl('${url.url}')">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            urlsManagementList.innerHTML = '<div class="list-group-item text-center text-muted">No URLs found</div>';
        }
    } catch (error) {
        console.error('Error loading URLs list:', error);
    }
}

// Refresh a single URL
async function refreshUrl(url) {
    try {
        showLoading();
        const response = await fetch(`/api/urls/${encodeURIComponent(url)}/refresh`, {
            method: 'POST'
        });
        
        await handleApiResponse(response, 'URL refresh started');
    } catch (error) {
        console.error('Error refreshing URL:', error);
        alert('Network error while refreshing URL');
    } finally {
        hideLoading();
    }
}

// Migrate configuration from file to database
async function migrateConfigToDatabase() {
    if (!confirm('This will migrate settings from config.json to the database. Continue?')) {
        return;
    }
    
    try {
        showLoading();
        const response = await fetch('/api/config/migrate_config', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showAlert('success', data.message);
            await loadConfigData();
        } else {
            showAlert('error', data.message || 'Failed to migrate configuration');
        }
    } catch (error) {
        console.error('Error migrating config:', error);
        showAlert('error', 'Network error while migrating configuration');
    } finally {
        hideLoading();
    }
}

// Setup event listeners for the configuration page
function setupConfigEvents() {
    // Base URL form
    const baseUrlForm = document.getElementById('baseUrlForm');
    if (baseUrlForm) {
        baseUrlForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const baseUrlInput = document.getElementById('baseUrlInput');
            const baseUrl = baseUrlInput.value;

            try {
                showLoading();
                const response = await fetch('/api/config/base_url', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ base_url: baseUrl })
                });

                if (await handleApiResponse(response, 'Base URL updated successfully')) {
                    baseUrlInput.value = '';
                    await loadConfigData();
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Network error while updating base URL');
            } finally {
                hideLoading();
            }
        });
    }
    // Channel Base URL form
    const channelBaseUrlForm = document.getElementById('channelBaseUrlForm');
    if (channelBaseUrlForm) {
        channelBaseUrlForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const channelBaseUrlInput = document.getElementById('channelBaseUrlInput');
            const channelBaseUrl = channelBaseUrlInput.value;
            
            try {
                showLoading();
                const response = await fetch('/api/config/channel_base_url', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ channel_base_url: channelBaseUrl })
                });
                
                if (await handleApiResponse(response, 'Channel Base URL updated successfully')) {
                    channelBaseUrlInput.value = '';
                    await loadConfigData();
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Network error while updating channel base URL');
            } finally {
                hideLoading();
            }
        });
    }

    // Ace Engine form
    const aceEngineForm = document.getElementById('aceEngineForm');
    if (aceEngineForm) {
        aceEngineForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const aceEngineInput = document.getElementById('aceEngineInput');
            const aceEngineUrl = aceEngineInput.value;

            try {
                showLoading();
                const response = await fetch('/api/config/ace_engine_url', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ace_engine_url: aceEngineUrl })
                });

                if (await handleApiResponse(response, 'Ace Engine URL updated successfully')) {
                    aceEngineInput.value = '';
                    await loadConfigData();
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Network error while updating Ace Engine URL');
            } finally {
                hideLoading();
            }
        });
    }

    // Rescrape interval form
    const rescrapeIntervalForm = document.getElementById('rescrapeIntervalForm');
    if (rescrapeIntervalForm) {
        rescrapeIntervalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const hoursInput = document.getElementById('rescrapeIntervalInput');
            const hours = parseInt(hoursInput.value, 10);

            if (isNaN(hours) || hours < 1) {
                alert('Please enter a valid number of hours (minimum 1)');
                return;
            }

            try {
                showLoading();
                const response = await fetch('/api/config/rescrape_interval', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ hours: hours })
                });

                if (await handleApiResponse(response, 'Rescrape interval updated successfully')) {
                    hoursInput.value = '';
                    await loadConfigData();
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Network error while updating rescrape interval');
            } finally {
                hideLoading();
            }
        });
    }

    // Add URL form
    const addUrlForm = document.getElementById('addUrlForm');
    if (addUrlForm) {
        addUrlForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const urlInput = document.getElementById('urlInput');
            const url = urlInput.value;
            
            console.log('Form submitted with URL:', url); // Add debugging
            
            const result = await addUrl(url);
            if (result.success) {
                urlInput.value = '';
                await loadConfigData();
            }
        });
    }
    
    // Migration button
    const migrateConfigBtn = document.getElementById('migrateConfigBtn');
    if (migrateConfigBtn) {
        migrateConfigBtn.addEventListener('click', migrateConfigToDatabase);
    }
}

// Initialize configuration page
document.addEventListener('DOMContentLoaded', function() {
    // Load configuration data
    loadConfigData();
    
    // Set up event handlers
    setupConfigEvents();
    
    // Refresh periodically
    setInterval(loadConfigData, 60000); // Every minute
});