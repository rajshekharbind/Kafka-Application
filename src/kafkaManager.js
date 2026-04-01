const { kafka } = require('./client');

class KafkaManager {
    constructor() {
        this.consumers = {};
        this.producers = {};
    }

    // Create Topic
    async createTopic(topicName, numPartitions = 3, replicationFactor = { min: 1 }) {
        const admin = kafka.admin();
        try {
            await admin.connect();
            
            // Check broker count to validate replication factor
            try {
                const cluster = await admin.describeCluster();
                const brokerCount = cluster.brokers.length;
                
                if (replicationFactor > brokerCount) {
                    await admin.disconnect();
                    return { 
                        success: false, 
                        error: `Replication factor (${replicationFactor}) cannot exceed number of brokers (${brokerCount})` 
                    };
                }
            } catch (clusterError) {
                console.warn('Could not verify broker count:', clusterError.message);
            }
            
            await admin.createTopics({
                topics: [
                    {
                        topic: topicName,
                        numPartitions,
                        replicationFactor,
                    }
                ],
                validateOnly: false,
                timeout: 30000,
            });
            
            await admin.disconnect();
            return { success: true, message: `Topic '${topicName}' created successfully` };
        } catch (error) {
            try {
                await admin.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
            
            // Provide detailed error messages
            let errorMessage = error.message;
            if (error.message.includes('UNKNOWN_TOPIC_OR_PART')) {
                errorMessage = 'Topic already exists or broker configuration issue';
            } else if (error.message.includes('NOT_COORDINATOR')) {
                errorMessage = 'Broker is not ready. Try again in a moment.';
            } else if (error.message.includes('InvalidReplicationFactor')) {
                errorMessage = 'Replication factor is too high for the number of brokers';
            }
            
            console.error('Topic creation error:', error);
            return { success: false, error: errorMessage };
        }
    }

    // List Topics
    async listTopics() {
        const admin = kafka.admin();
        try {
            await admin.connect();
            const topics = await admin.fetchTopicMetadata();
            await admin.disconnect();
            
            return {
                success: true,
                topics: topics.topics.map(t => ({
                    name: t.name,
                    partitions: t.partitions.length,
                })),
            };
        } catch (error) {
            try {
                await admin.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
            console.error('List topics error:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete Topic
    async deleteTopic(topicName) {
        const admin = kafka.admin();
        try {
            await admin.connect();
            
            await admin.deleteTopics({
                topics: [topicName],
                timeout: 30000,
            });
            
            await admin.disconnect();
            return { success: true, message: `Topic '${topicName}' deleted successfully` };
        } catch (error) {
            try {
                await admin.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
            
            let errorMessage = error.message;
            if (error.message.includes('UNKNOWN_TOPIC_ID')) {
                errorMessage = `Topic '${topicName}' does not exist`;
            }
            
            console.error('Delete topic error:', error);
            return { success: false, error: errorMessage };
        }
    }

    // Produce Message
    async produceMessage(topic, messages) {
        const producer = kafka.producer({
            retry: {
                initialRetryTime: 100,
                retries: 8,
                maxRetryTime: 30000,
            },
        });
        
        try {
            await producer.connect();
            
            const formattedMessages = messages.map(msg => ({
                key: msg.key || null,
                value: msg.value,
                timestamp: Date.now().toString(),
            }));

            await producer.send({
                topic,
                messages: formattedMessages,
                timeout: 30000,
            });
            
            await producer.disconnect();
            return { success: true, message: `${messages.length} message(s) sent to '${topic}'` };
        } catch (error) {
            try {
                await producer.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
            
            let errorMessage = error.message;
            if (error.message.includes('UNKNOWN_TOPIC_ID')) {
                errorMessage = `Topic '${topic}' does not exist. Please create it first.`;
            }
            
            console.error('Produce message error:', error);
            return { success: false, error: errorMessage };
        }
    }

    // Consume Messages
    // Consume Messages
    async consumeMessages(topic, groupId, callback) {
        try {
            const consumer = kafka.consumer({ 
                groupId,
                sessionTimeout: 30000,
                heartbeatInterval: 3000,
                rebalanceTimeout: 60000,
                retry: {
                    initialRetryTime: 100,
                    retries: 8,
                    maxRetryTime: 30000,
                },
            });
            
            // Handle rebalancing events
            consumer.on('consumer.connect', () => {
                console.log(`✅ Consumer connected for group: ${groupId}`);
            });
            
            consumer.on('consumer.disconnect', () => {
                console.log(`⚠️ Consumer disconnected for group: ${groupId}`);
            });
            
            consumer.on('consumer.crash', ({ error, groupId: gId }) => {
                console.error(`❌ Consumer crash for group ${gId}:`, error);
            });
            
            await consumer.connect();
            await consumer.subscribe({ topic, fromBeginning: true });

            await consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const msg = {
                            topic,
                            partition,
                            offset: message.offset,
                            key: message.key ? message.key.toString() : null,
                            value: message.value.toString(),
                            timestamp: message.timestamp,
                        };
                        callback(msg);
                    } catch (msgError) {
                        console.error('Error processing message:', msgError);
                    }
                },
                // Better error handling for rebalancing
                autoCommit: true,
                autoCommitInterval: 5000,
                autoCommitThreshold: 100,
            });

            this.consumers[groupId] = consumer;
            return { success: true, message: `Consumer group '${groupId}' started successfully` };
        } catch (error) {
            let errorMessage = error.message;
            if (error.message.includes('UNKNOWN_TOPIC_ID')) {
                errorMessage = `Topic '${topic}' does not exist. Create it first.`;
            } else if (error.message.includes('rebalancing')) {
                errorMessage = 'Consumer group is rebalancing. Please try again in a moment.';
            } else if (error.message.includes('ILLEGAL_GENERATION')) {
                errorMessage = 'Consumer group is rebalancing. The application will rejoin automatically.';
            }
            
            console.error('Consume messages error:', error);
            return { success: false, error: errorMessage };
        }
    }

    // Stop Consumer
    async stopConsumer(groupId) {
        try {
            if (this.consumers[groupId]) {
                console.log(`Stopping consumer for group: ${groupId}`);
                await this.consumers[groupId].disconnect();
                delete this.consumers[groupId];
                console.log(`✅ Consumer stopped for group: ${groupId}`);
                return { success: true, message: `Consumer group '${groupId}' stopped` };
            }
            return { success: false, error: 'Consumer group not found' };
        } catch (error) {
            console.error('Stop consumer error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get Cluster Info
    async getClusterInfo() {
        const admin = kafka.admin();
        try {
            await admin.connect();
            const cluster = await admin.describeCluster();
            await admin.disconnect();
            
            return {
                success: true,
                cluster: {
                    brokers: cluster.brokers.length,
                    controller: cluster.controller,
                    brokersList: cluster.brokers,
                },
            };
        } catch (error) {
            try {
                await admin.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
            
            let errorMessage = error.message;
            if (error.message.includes('ECONNREFUSED')) {
                errorMessage = 'Cannot connect to Kafka broker. Is Kafka running on localhost:9092?';
            }
            
            console.error('Cluster info error:', error);
            return { success: false, error: errorMessage };
        }
    }
}

module.exports = KafkaManager;
