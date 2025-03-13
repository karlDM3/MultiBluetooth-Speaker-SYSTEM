// MultiBluetooth Speaker System - Main JavaScript
// Handles UI interactions and WebSocket communications

document.addEventListener('DOMContentLoaded', function() {
    // Connect to WebSocket for real-time updates
    const socket = io();
    
    // UI Elements
    const scanButton = document.getElementById('scan-button');
    const deviceList = document.getElementById('device-list');
    const speakerList = document.getElementById('speaker-list');
    const speakerCount = document.getElementById('speaker-count');
    const statusSpeakerCount = document.getElementById('status-speaker-count');
    const scanningIndicator = document.getElementById('scanning-indicator');
    const scanProgress = document.getElementById('scan-progress');
    const playButton = document.getElementById('play-button');
    const pauseButton = document.getElementById('pause-button');
    const stopButton = document.getElementById('stop-button');
    const playbackStatus = document.getElementById('playback-status');
    const statusPlayback = document.getElementById('status-playback');
    const refreshStatusButton = document.getElementById('refresh-status-button');
    const noSpeakersRow = document.getElementById('no-speakers-row');
    
    // Connection Modal
    const connectionModal = new bootstrap.Modal(document.getElementById('connection-modal'));
    const connectionModalTitle = document.getElementById('connection-modal-title');
    const connectionModalBody = document.getElementById('connection-modal-body');
    
    // Initialize UI
    updateSpeakerCount();
    updateAudioButtons();
    
    // WebSocket Event Handlers
    socket.on('connect', function() {
        console.log('Connected to WebSocket');
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from WebSocket');
    });
    
    socket.on('speaker_update', function(data) {
        console.log('Speaker update received:', data);
        
        // Check if we need to add a new speaker or update existing one
        if (data.status === 'connected') {
            updateSpeakerUI(data.speaker);
        } else if (data.status === 'disconnected') {
            updateSpeakerUI(data.speaker);
        }
        
        updateSpeakerCount();
        updateAudioButtons();
    });
    
    socket.on('playback_update', function(data) {
        console.log('Playback update received:', data);
        updatePlaybackStatus(data.status);
    });
    
    // Button Event Handlers
    
    // Scan for Bluetooth devices
    scanButton.addEventListener('click', function() {
        startScan();
    });
    
    // Play audio
    playButton.addEventListener('click', function() {
        fetch('/play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updatePlaybackStatus('playing');
            } else {
                showAlert(data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error playing audio:', error);
            showAlert('Failed to play audio. Please try again.', 'danger');
        });
    });
    
    // Pause audio
    pauseButton.addEventListener('click', function() {
        fetch('/pause', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updatePlaybackStatus('paused');
            } else {
                showAlert(data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error pausing audio:', error);
            showAlert('Failed to pause audio. Please try again.', 'danger');
        });
    });
    
    // Stop audio
    stopButton.addEventListener('click', function() {
        fetch('/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updatePlaybackStatus('stopped');
            } else {
                showAlert(data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error stopping audio:', error);
            showAlert('Failed to stop audio. Please try again.', 'danger');
        });
    });
    
    // Refresh status
    refreshStatusButton.addEventListener('click', function() {
        fetchSystemStatus();
    });
    
    // Add event delegation for dynamic buttons
    document.addEventListener('click', function(event) {
        // Handle connect buttons in device list
        if (event.target.classList.contains('connect-btn') || 
            event.target.parentElement.classList.contains('connect-btn')) {
            
            const button = event.target.classList.contains('connect-btn') ? 
                event.target : event.target.parentElement;
            
            const address = button.dataset.address;
            const name = button.dataset.name;
            
            connectToDevice(address, name);
        }
        
        // Handle disconnect buttons
        if (event.target.classList.contains('disconnect-btn') || 
            event.target.parentElement.classList.contains('disconnect-btn')) {
            
            const button = event.target.classList.contains('disconnect-btn') ? 
                event.target : event.target.parentElement;
            
            const speakerId = button.dataset.speakerId;
            disconnectDevice(speakerId);
        }
        
        // Handle reconnect buttons
        if (event.target.classList.contains('reconnect-btn') || 
            event.target.parentElement.classList.contains('reconnect-btn')) {
            
            const button = event.target.classList.contains('reconnect-btn') ? 
                event.target : event.target.parentElement;
            
            const address = button.dataset.speakerAddress;
            const name = button.dataset.speakerName;
            
            connectToDevice(address, name);
        }
    });
    
    // Functions
    
    // Start Bluetooth device scan
    function startScan() {
        // Show scanning indicator
        scanningIndicator.classList.remove('d-none');
        scanButton.disabled = true;
        
        // Update device list
        deviceList.innerHTML = '<li class="list-group-item text-center">Scanning for devices...</li>';
        
        // Start progress bar animation
        let progress = 0;
        const scanInterval = setInterval(() => {
            progress += 12.5; // 8 seconds total (100% / 8 = 12.5)
            scanProgress.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(scanInterval);
            }
        }, 1000);
        
        // Perform scan
        fetch('/scan', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            // Hide scanning indicator
            scanningIndicator.classList.add('d-none');
            scanButton.disabled = false;
            clearInterval(scanInterval);
            scanProgress.style.width = '100%';
            
            if (data.status === 'success') {
                displayDevices(data.devices);
            } else {
                deviceList.innerHTML = `
                    <li class="list-group-item text-center text-danger">
                        <i class="fas fa-exclamation-triangle me-1"></i> 
                        Error: ${data.message}
                    </li>
                `;
            }
        })
        .catch(error => {
            console.error('Error scanning for devices:', error);
            scanningIndicator.classList.add('d-none');
            scanButton.disabled = false;
            clearInterval(scanInterval);
            
            deviceList.innerHTML = `
                <li class="list-group-item text-center text-danger">
                    <i class="fas fa-exclamation-triangle me-1"></i> 
                    Failed to scan for devices. Please try again.
                </li>
            `;
        });
    }
    
    // Display found devices in the UI
    function displayDevices(devices) {
        if (devices.length === 0) {
            deviceList.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    No Bluetooth devices found. Please try scanning again.
                </li>
            `;
            return;
        }
        
        deviceList.innerHTML = '';
        
        devices.forEach(device => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const deviceInfo = document.createElement('div');
            deviceInfo.innerHTML = `
                <strong>${device.name}</strong><br>
                <small class="text-muted">${device.address}</small>
            `;
            
            const connectButton = document.createElement('button');
            connectButton.className = 'btn btn-sm btn-success connect-btn';
            connectButton.dataset.address = device.address;
            connectButton.dataset.name = device.name;
            connectButton.innerHTML = '<i class="fas fa-link me-1"></i> Connect';
            
            listItem.appendChild(deviceInfo);
            listItem.appendChild(connectButton);
            deviceList.appendChild(listItem);
        });
    }
    
    // Connect to a Bluetooth device
    function connectToDevice(address, name) {
        // Show loading state on the button
        const buttons = document.querySelectorAll(`[data-address="${address}"]`);
        buttons.forEach(button => {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Connecting...';
        });
        
        // Send connection request
        fetch('/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: address,
                name: name
            })
        })
        .then(response => response.json())
        .then(data => {
            // Reset button state
            buttons.forEach(button => {
                button.disabled = false;
            });
            
            // Show result
            if (data.status === 'success') {
                showConnectionResult('Connection Successful', data.message, 'success');
                // UI will be updated via WebSocket
            } else {
                showConnectionResult('Connection Failed', data.message, 'danger');
                buttons.forEach(button => {
                    button.innerHTML = '<i class="fas fa-link me-1"></i> Connect';
                });
            }
        })
        .catch(error => {
            console.error('Error connecting to device:', error);
            
            // Reset button state
            buttons.forEach(button => {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-link me-1"></i> Connect';
            });
            
            showConnectionResult('Connection Error', 'Failed to connect to the device. Please try again.', 'danger');
        });
    }
    
    // Disconnect from a speaker
    function disconnectDevice(speakerId) {
        // Show loading state
        const button = document.querySelector(`.disconnect-btn[data-speaker-id="${speakerId}"]`);
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Disconnecting...';
        }
        
        // Send disconnect request
        fetch(`/disconnect/${speakerId}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            // Reset button state
            if (button) {
                button.disabled = false;
            }
            
            // Show result
            if (data.status === 'success') {
                showConnectionResult('Disconnection Successful', data.message, 'success');
                // UI will be updated via WebSocket
            } else {
                showConnectionResult('Disconnection Failed', data.message, 'danger');
                if (button) {
                    button.innerHTML = '<i class="fas fa-unlink me-1"></i> Disconnect';
                }
            }
        })
        .catch(error => {
            console.error('Error disconnecting device:', error);
            
            // Reset button state
            if (button) {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-unlink me-1"></i> Disconnect';
            }
            
            showConnectionResult('Disconnection Error', 'Failed to disconnect from the speaker. Please try again.', 'danger');
        });
    }
    
    // Update speaker UI element
    function updateSpeakerUI(speaker) {
        const existingRow = document.querySelector(`tr[data-speaker-id="${speaker.id}"]`);
        
        if (existingRow) {
            // Update existing row
            existingRow.querySelector('td:nth-child(3)').innerHTML = speaker.connected ? 
                '<span class="badge bg-success">Connected</span>' : 
                '<span class="badge bg-danger">Disconnected</span>';
            
            const actionCell = existingRow.querySelector('td:nth-child(4)');
            if (speaker.connected) {
                actionCell.innerHTML = `
                    <button class="btn btn-sm btn-danger disconnect-btn" data-speaker-id="${speaker.id}">
                        <i class="fas fa-unlink me-1"></i> Disconnect
                    </button>
                `;
            } else {
                actionCell.innerHTML = `
                    <button class="btn btn-sm btn-success reconnect-btn" data-speaker-address="${speaker.address}" data-speaker-name="${speaker.name}">
                        <i class="fas fa-link me-1"></i> Reconnect
                    </button>
                `;
            }
        } else {
            // Add new row
            const newRow = document.createElement('tr');
            newRow.dataset.speakerId = speaker.id;
            newRow.dataset.speakerAddress = speaker.address;
            
            newRow.innerHTML = `
                <td>${speaker.name}</td>
                <td>${speaker.address}</td>
                <td>${speaker.connected ? 
                    '<span class="badge bg-success">Connected</span>' : 
                    '<span class="badge bg-danger">Disconnected</span>'}</td>
                <td>
                    ${speaker.connected ? 
                        `<button class="btn btn-sm btn-danger disconnect-btn" data-speaker-id="${speaker.id}">
                            <i class="fas fa-unlink me-1"></i> Disconnect
                        </button>` : 
                        `<button class="btn btn-sm btn-success reconnect-btn" data-speaker-address="${speaker.address}" data-speaker-name="${speaker.name}">
                            <i class="fas fa-link me-1"></i> Reconnect
                        </button>`
                    }
                </td>
            `;
            
            // If the "no speakers" row exists, remove it
            if (noSpeakersRow) {
                noSpeakersRow.remove();
            }
            
            speakerList.appendChild(newRow);
        }
    }
    
    // Update the speaker count
    function updateSpeakerCount() {
        const connectedSpeakers = document.querySelectorAll('.badge.bg-success');
        const count = connectedSpeakers.length;
        
        speakerCount.textContent = count;
        statusSpeakerCount.textContent = count;
        
        // Enable/disable audio buttons based on speaker count
        updateAudioButtons();
    }
    
    // Update the audio control buttons
    function updateAudioButtons() {
        const connectedSpeakers = document.querySelectorAll('.badge.bg-success');
        const hasConnectedSpeakers = connectedSpeakers.length > 0;
        
        playButton.disabled = !hasConnectedSpeakers;
        pauseButton.disabled = !hasConnectedSpeakers;
        stopButton.disabled = !hasConnectedSpeakers;
    }
    
    // Update playback status in UI
    function updatePlaybackStatus(status) {
        let message = '';
        let icon = '';
        let badgeClass = '';
        
        switch (status) {
            case 'playing':
                message = 'Audio is currently playing on all connected speakers.';
                icon = 'fa-play';
                badgeClass = 'bg-success';
                break;
            case 'paused':
                message = 'Audio playback is paused. Press play to resume.';
                icon = 'fa-pause';
                badgeClass = 'bg-warning';
                break;
            case 'stopped':
            default:
                message = 'Audio playback is stopped. Press play to start.';
                icon = 'fa-stop';
                badgeClass = 'bg-secondary';
                break;
        }
        
        playbackStatus.innerHTML = `<i class="fas ${icon} me-1"></i> ${message}`;
        statusPlayback.className = `badge ${badgeClass} rounded-pill`;
        statusPlayback.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    // Show connection result in modal
    function showConnectionResult(title, message, type) {
        connectionModalTitle.textContent = title;
        connectionModalBody.innerHTML = `
            <div class="alert alert-${type} mb-0">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-1"></i>
                ${message}
            </div>
        `;
        connectionModal.show();
    }
    
    // Show alert message
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at the top of the content
        const container = document.querySelector('.container.mt-4');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }
    
    // Fetch system status
    function fetchSystemStatus() {
        fetch('/status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Update speaker count
                const connectedCount = data.speakers.filter(s => s.connected).length;
                statusSpeakerCount.textContent = connectedCount;
                
                // Update playback status
                const playbackState = data.playback.playing ? 
                    (data.playback.paused ? 'paused' : 'playing') : 'stopped';
                updatePlaybackStatus(playbackState);
                
                // Update health status
                const healthElement = document.getElementById('status-health');
                healthElement.textContent = 'Good';
                healthElement.className = 'badge bg-success rounded-pill';
            }
        })
        .catch(error => {
            console.error('Error fetching status:', error);
            const healthElement = document.getElementById('status-health');
            healthElement.textContent = 'Error';
            healthElement.className = 'badge bg-danger rounded-pill';
        });
    }
    
    // Initial system status check
    fetchSystemStatus();
});
