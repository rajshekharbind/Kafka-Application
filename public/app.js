// API Base URL
const API_BASE = 'http://localhost:3000/api';

// State variables
let refreshIntervals = {};
let isConsumerRunning = false;
let filteredMessages = [];
let allMessages = [];
let stats = {
    topics: 0,
    produced: 0,
    consumed: 0,
    brokers: 0
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Kafka Pro initialized');
    
    // Setup event listeners
    setupEventListeners();
    
    // Load theme preference
    loadTheme();
    
    // Load stats from localStorage
    loadStats();
    
    // Initial data load
    getClusterInfo();
    listTopics();
    checkServerStatus();
    updateStatsDisplay();
    
    // Auto-refresh
    setInterval(getClusterInfo, 10000);
    setInterval(listTopics, 15000);
    setInterval(checkServerStatus, 20000);
});

// Setup event listeners
function setupEventListeners() {
    // Guide modal
    const showGuide = document.getElementById('showGuide');
    if (showGuide) {
        showGuide.addEventListener('click', openGuide);
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Message character counter
    const messageValue = document.getElementById('messageValue');
    if (messageValue) {
        messageValue.addEventListener('input', updateCharCount);
    }
    
    // Topic search
    const topicsSearch = document.getElementById('topicsSearch');
    if (topicsSearch) {
        topicsSearch.addEventListener('input', filterTopics);
    }
    
    // Message search
    const messagesSearch = document.getElementById('messagesSearch');
    if (messagesSearch) {
        messagesSearch.addEventListener('input', filterMessages);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('guideModal');
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeGuide();
            }
        });
    }
}

// Guide modal functions
function openGuide() {
    const modal = document.getElementById('guideModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeGuide() {
    const modal = document.getElementById('guideModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Theme management
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// Update character count
function updateCharCount() {
    const messageValue = document.getElementById('messageValue');
    const charCount = document.getElementById('charCount');
    if (charCount) {
        charCount.textContent = `${messageValue.value.length} characters`;
    }
}

// Filter topics
function filterTopics() {
    const searchInput = document.getElementById('topicsSearch');
    const filter = searchInput.value.toLowerCase();
    const topicItems = document.querySelectorAll('.topic-item');
    let visibleCount = 0;
    
    topicItems.forEach(item => {
        const topicName = item.textContent.toLowerCase();
        if (topicName.includes(filter)) {
            item.style.display = '';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    const topicsCount = document.getElementById('topicsCount');
    if (topicsCount) {
        topicsCount.textContent = visibleCount;
    }
}

// Filter messages
function filterMessages() {
    const searchInput = document.getElementById('messagesSearch');
    const filter = searchInput.value.toLowerCase();
    
    filteredMessages = allMessages.filter(msg => {
        return msg.value.toLowerCase().includes(filter) ||
               (msg.key && msg.key.toLowerCase().includes(filter)) ||
               msg.topic.toLowerCase().includes(filter);
    });
    
    displayMessages(filteredMessages);
}

// Check server status
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        if (data.status) {
            const statusCircle = document.querySelector('.status-circle');
            if (statusCircle) {
                statusCircle.classList.remove('disconnected');
            }
        }
    } catch (error) {
        const statusCircle = document.querySelector('.status-circle');
        if (statusCircle) {
            statusCircle.classList.add('disconnected');
        }
    }
}

// Show status message
function showStatus(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.textContent = message;
    element.className = `status-message ${type}`;
    
    // Auto-hide success/error messages after 5 seconds
    if (type !== 'info') {
        setTimeout(() => {
            element.className = 'status-message';
        }, 5000);
    }
}

// Get Cluster Information
async function getClusterInfo() {
    const btn = document.getElementById('clusterRefreshBtn');
    try {
        setButtonLoading(btn, true);
        const response = await fetch(`${API_BASE}/cluster-info`);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();

        if (data.success) {
            const { cluster } = data;
            
            // Update status circle
            const statusCircle = document.querySelector('.status-circle');
            if (statusCircle) {
                statusCircle.classList.remove('disconnected');
            }
            
            // Update cluster values
            const brokerCount = cluster.brokers || 0;
            document.getElementById('clusterBrokers').textContent = brokerCount;
            document.getElementById('clusterController').textContent = cluster.controller || 'N/A';
            document.getElementById('clusterHealthStatus').textContent = '🟢 Active';
            
            // Update stats
            stats.brokers = brokerCount;
            saveStats();
            updateStatsDisplay();
        } else {
            updateClusterError('Disconnected');
        }
    } catch (error) {
        console.error('Error fetching cluster info:', error);
        updateClusterError('Error');
    } finally {
        setButtonLoading(btn, false);
    }
}

function updateClusterError(status) {
    const statusCircle = document.querySelector('.status-circle');
    if (statusCircle) {
        statusCircle.classList.add('disconnected');
    }
    document.getElementById('clusterHealthStatus').textContent = `❌ ${status}`;
}

// List Topics
async function listTopics() {
    const btn = document.getElementById('topicsRefreshBtn');
    try {
        setButtonLoading(btn, true);
        const response = await fetch(`${API_BASE}/topics`);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();

        const topicsList = document.getElementById('topicsList');
        const topicsCount = document.getElementById('topicsCount');
        
        if (data.success && data.topics && data.topics.length > 0) {
            topicsList.innerHTML = data.topics
                .map(topic => `
                    <div class="topic-item-container">
                        <div class="topic-item" onclick="selectTopic('${topic.name}')" role="button" tabindex="0">
                            <div class="topic-name">📌 ${topic.name}</div>
                            <div class="topic-partitions">Partitions: ${topic.partitions}</div>
                        </div>
                        <button class="btn-delete-topic" onclick="deleteTopic('${topic.name}')" title="Delete ${topic.name}" aria-label="Delete topic ${topic.name}">🗑️</button>
                    </div>
                `)
                .join('');
            if (topicsCount) {
                topicsCount.textContent = data.topics.length;
            }
            updateStats('topics', 0); // Reset to actual count
            stats.topics = data.topics.length;
            saveStats();
            updateStatsDisplay();
        } else {
            topicsList.innerHTML = '<p class="empty-state">No topics. Create one to start!</p>';
            if (topicsCount) {
                topicsCount.textContent = '0';
            }
            stats.topics = 0;
            saveStats();
            updateStatsDisplay();
        }
    } catch (error) {
        console.error('Error fetching topics:', error);
        document.getElementById('topicsList').innerHTML = 
            '<p class="empty-state">Error loading topics</p>';
    } finally {
        setButtonLoading(btn, false);
    }
}

// Create Topic
async function createTopic(event) {
    event.preventDefault();
    
    const topicName = document.getElementById('topicName').value.trim();
    const partitions = parseInt(document.getElementById('partitions').value) || 3;
    const replicationFactor = parseInt(document.getElementById('replicationFactor').value) || 1;
    const btn = document.querySelector('#createTopicForm button');

    // Validation
    if (!topicName) {
        showStatus('topicStatus', '❌ Topic name is required', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9._-]+$/.test(topicName)) {
        showStatus('topicStatus', '❌ Topic name can only contain alphanumeric, dots, dashes, and underscores', 'error');
        return;
    }

    if (partitions < 1 || partitions > 32) {
        showStatus('topicStatus', '❌ Partitions must be between 1 and 32', 'error');
        return;
    }

    if (replicationFactor < 1 || replicationFactor > 3) {
        showStatus('topicStatus', '❌ Replication factor must be between 1 and 3', 'error');
        return;
    }

    try {
        setButtonLoading(btn, true);
        const response = await fetch(`${API_BASE}/topics/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topicName, partitions, replicationFactor }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.success) {
            showStatus('topicStatus', `✅ ${data.message}`, 'success');
            document.getElementById('createTopicForm').reset();
            await listTopics();
        } else {
            showStatus('topicStatus', `❌ Error: ${data.error || 'Failed to create topic'}`, 'error');
        }
    } catch (error) {
        showStatus('topicStatus', `❌ Error: ${error.message}`, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

// Delete Topic
async function deleteTopic(topicName) {
    if (!confirm(`🗑️ Are you sure you want to delete topic "${topicName}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/topics/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topicName }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.success) {
            showStatus('topicStatus', `✅ ${data.message}`, 'success');
            await listTopics();
        } else {
            showStatus('topicStatus', `❌ Error: ${data.error || 'Failed to delete topic'}`, 'error');
        }
    } catch (error) {
        showStatus('topicStatus', `❌ Error: ${error.message}`, 'error');
    }
}

// Select Topic
function selectTopic(topicName) {
    document.getElementById('producerTopic').value = topicName;
    document.getElementById('consumerTopic').value = topicName;
    
    // Smooth scroll to producer section
    const producerSection = document.querySelector('.producer-section');
    if (producerSection) {
        producerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('messageValue').focus();
    }
}

// Produce Message
async function produceMessage(event) {
    event.preventDefault();

    const topic = document.getElementById('producerTopic').value.trim();
    const key = document.getElementById('messageKey').value.trim() || null;
    const value = document.getElementById('messageValue').value.trim();
    const btn = document.querySelector('#producerForm button');

    // Validation
    if (!topic) {
        showStatus('producerStatus', '❌ Topic is required', 'error');
        return;
    }

    if (!value) {
        showStatus('producerStatus', '❌ Message value is required', 'error');
        return;
    }

    try {
        setButtonLoading(btn, true);
        const response = await fetch(`${API_BASE}/produce`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, key, value }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.success) {
            showStatus('producerStatus', `✅ ${data.message}`, 'success');
            document.getElementById('producerForm').reset();
            updateCharCount();
            updateStats('produced', 1);
        } else {
            showStatus('producerStatus', `❌ Error: ${data.error || 'Failed to send message'}`, 'error');
        }
    } catch (error) {
        showStatus('producerStatus', `❌ Error: ${error.message}`, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

// Start Consumer
async function startConsumer() {
    const topic = document.getElementById('consumerTopic').value.trim();
    const groupId = document.getElementById('consumerGroup').value.trim() || 'default-group';
    const startBtn = document.getElementById('startConsumerBtn');
    const stopBtn = document.getElementById('stopConsumerBtn');

    if (!topic) {
        showStatus('consumerStatus', '❌ Topic is required', 'error');
        return;
    }

    try {
        setButtonLoading(startBtn, true);
        const response = await fetch(`${API_BASE}/consumer/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, groupId }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.success) {
            showStatus('consumerStatus', `✅ ${data.message}`, 'success');
            isConsumerRunning = true;
            
            // Update UI state
            startBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = false;
            
            const consumerStatus = document.getElementById('consumerRunningStatus');
            if (consumerStatus) {
                consumerStatus.textContent = '🟢 Consumer is running...';
                consumerStatus.classList.add('active');
            }
            
            // Start polling for messages
            startMessagePolling();
            
            console.log(`✅ Consumer started for topic: ${topic}, group: ${groupId}`);
        } else {
            // Check if it's a rebalancing error
            if (data.error && data.error.includes('rebalancing')) {
                showStatus('consumerStatus', `⚠️ Group is rebalancing. Retrying in 2 seconds...`, 'info');
                // Auto-retry after 2 seconds
                setTimeout(() => {
                    startConsumer();
                }, 2000);
            } else {
                showStatus('consumerStatus', `❌ Error: ${data.error || 'Failed to start consumer'}`, 'error');
            }
        }
    } catch (error) {
        showStatus('consumerStatus', `❌ Error: ${error.message}`, 'error');
        console.error('Consumer error:', error);
    } finally {
        setButtonLoading(startBtn, false);
    }
}

// Start Message Polling
function startMessagePolling() {
    // Clear any existing polling
    if (refreshIntervals.messagePolling) {
        clearInterval(refreshIntervals.messagePolling);
    }

    // Start polling for new messages every 500ms
    refreshIntervals.messagePolling = setInterval(getMessages, 500);
}

// Get Messages
async function getMessages() {
    try {
        const response = await fetch(`${API_BASE}/messages`);
        
        if (!response.ok) return;
        
        const data = await response.json();

        if (data.success && data.messages) {
            allMessages = data.messages;
            displayMessages(data.messages);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Display Messages
function displayMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    const messageCount = document.getElementById('messageCount');

    messageCount.textContent = `${messages.length} message${messages.length !== 1 ? 's' : ''}`;
    updateStats('consumed', 0); // Reset
    stats.consumed = messages.length;
    saveStats();
    updateStatsDisplay();

    if (messages.length === 0) {
        messagesList.innerHTML = '<p class="empty-state">No messages received yet. Start consuming to see messages.</p>';
        return;
    }

    messagesList.innerHTML = messages
        .map((msg, index) => `
            <div class="message-item" role="article">
                <div class="message-meta">
                    <span class="message-badge">📊 ${msg.topic}</span>
                    <span class="message-badge">P: ${msg.partition}</span>
                    <span class="message-badge">O: ${msg.offset}</span>
                    ${msg.key ? `<span class="message-key">🔑 ${escapeHtml(msg.key)}</span>` : ''}
                </div>
                <div class="message-value">${escapeHtml(msg.value)}</div>
                <small class="message-time">${formatTimestamp(msg.timestamp)}</small>
            </div>
        `)
        .join('');

    // Auto-scroll to latest message
    messagesList.scrollTop = messagesList.scrollHeight;
}

// Format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(parseInt(timestamp));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Stop Consumer
async function stopConsumer() {
    const groupId = document.getElementById('consumerGroup').value.trim() || 'default-group';
    const startBtn = document.getElementById('startConsumerBtn');
    const stopBtn = document.getElementById('stopConsumerBtn');

    // Stop polling
    if (refreshIntervals.messagePolling) {
        clearInterval(refreshIntervals.messagePolling);
    }

    try {
        setButtonLoading(stopBtn, true);
        const response = await fetch(`${API_BASE}/consumer/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.success) {
            showStatus('consumerStatus', `✅ ${data.message}`, 'success');
            isConsumerRunning = false;
            
            // Update UI state
            startBtn.disabled = false;
            stopBtn.disabled = true;
            
            const consumerStatus = document.getElementById('consumerRunningStatus');
            if (consumerStatus) {
                consumerStatus.textContent = '⚫ Consumer stopped';
                consumerStatus.classList.remove('active');
            }
        } else {
            showStatus('consumerStatus', `❌ Error: ${data.error || 'Failed to stop consumer'}`, 'error');
        }
    } catch (error) {
        showStatus('consumerStatus', `❌ Error: ${error.message}`, 'error');
    } finally {
        setButtonLoading(stopBtn, false);
    }
}

// Clear Messages
async function clearMessages() {
    if (allMessages.length === 0) {
        showStatus('consumerStatus', 'ℹ️ No messages to clear', 'info');
        return;
    }

    try {
        const btn = document.getElementById('clearMessagesBtn');
        setButtonLoading(btn, true);
        
        const response = await fetch(`${API_BASE}/messages/clear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.success) {
            allMessages = [];
            filteredMessages = [];
            document.getElementById('messagesList').innerHTML = 
                '<p class="empty-state">No messages received yet. Start consuming to see messages.</p>';
            document.getElementById('messageCount').textContent = '0 messages';
            showStatus('consumerStatus', '✅ Messages cleared', 'success');
        }
    } catch (error) {
        showStatus('consumerStatus', `❌ Error: ${error.message}`, 'error');
    } finally {
        setButtonLoading(document.getElementById('clearMessagesBtn'), false);
    }
}

// Utility function: Set button loading state
function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Statistics Management
function updateStats(type, increment = 1) {
    if (stats[type] !== undefined) {
        stats[type] += increment;
        saveStats();
        updateStatsDisplay();
    }
}

function updateStatsDisplay() {
    const topicsCount = document.getElementById('statTopics');
    const producedCount = document.getElementById('statProduced');
    const consumedCount = document.getElementById('statConsumed');
    const brokersCount = document.getElementById('statBrokers');
    
    if (topicsCount) topicsCount.textContent = stats.topics;
    if (producedCount) producedCount.textContent = stats.produced;
    if (consumedCount) consumedCount.textContent = stats.consumed;
    if (brokersCount) brokersCount.textContent = stats.brokers;
}

function saveStats() {
    localStorage.setItem('kafkaStats', JSON.stringify(stats));
}

function loadStats() {
    const saved = localStorage.getItem('kafkaStats');
    if (saved) {
        try {
            stats = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading stats:', e);
        }
    }
}
