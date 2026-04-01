const express = require('express');
const cors = require('cors');
const path = require('path');
const KafkaManager = require('./kafkaManager');

const app = express();
const kafkaManager = new KafkaManager();
const PORT = process.env.PORT || 3000;

let messageQueue = [];
const maxMessages = 100;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get Cluster Info
app.get('/api/cluster-info', async (req, res) => {
    const result = await kafkaManager.getClusterInfo();
    res.json(result);
});

// List Topics
app.get('/api/topics', async (req, res) => {
    const result = await kafkaManager.listTopics();
    res.json(result);
});

// Delete Topic
app.post('/api/topics/delete', async (req, res) => {
    const { topicName } = req.body;
    
    if (!topicName) {
        return res.status(400).json({ success: false, error: 'Topic name is required' });
    }

    const result = await kafkaManager.deleteTopic(topicName);
    res.json(result);
});

// Create Topic
app.post('/api/topics/create', async (req, res) => {
    const { topicName, partitions, replicationFactor } = req.body;
    
    if (!topicName) {
        return res.status(400).json({ success: false, error: 'Topic name is required' });
    }

    const result = await kafkaManager.createTopic(
        topicName,
        partitions || 3,
        replicationFactor || 1
    );
    res.json(result);
});

// Produce Message
app.post('/api/produce', async (req, res) => {
    const { topic, key, value } = req.body;
    
    if (!topic || !value) {
        return res.status(400).json({ success: false, error: 'Topic and value are required' });
    }

    const result = await kafkaManager.produceMessage(topic, [{ key, value }]);
    res.json(result);
});

// Start Consumer
app.post('/api/consumer/start', async (req, res) => {
    const { topic, groupId } = req.body;
    
    if (!topic || !groupId) {
        return res.status(400).json({ success: false, error: 'Topic and groupId are required' });
    }

    messageQueue = [];

    const result = await kafkaManager.consumeMessages(topic, groupId, (message) => {
        messageQueue.push(message);
        if (messageQueue.length > maxMessages) {
            messageQueue.shift();
        }
    });

    res.json(result);
});

// Stop Consumer
app.post('/api/consumer/stop', async (req, res) => {
    const { groupId } = req.body;
    
    if (!groupId) {
        return res.status(400).json({ success: false, error: 'GroupId is required' });
    }

    const result = await kafkaManager.stopConsumer(groupId);
    res.json(result);
});

// Get Messages
app.get('/api/messages', (req, res) => {
    res.json({ success: true, messages: messageQueue });
});

// Clear Messages
app.post('/api/messages/clear', (req, res) => {
    messageQueue = [];
    res.json({ success: true, message: 'Messages cleared' });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Kafka Pro is running on http://localhost:${PORT}`);
    console.log(`📊 Open your browser and navigate to http://localhost:${PORT}`);
    console.log(`✅ All endpoints are ready`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⚠️  Shutting down gracefully...');
    process.exit(0);
});
