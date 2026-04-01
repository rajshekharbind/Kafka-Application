const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'kafka-app',
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
    logLevel: logLevel.ERROR,
    retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
    },
    connectionTimeout: 10000,
    requestTimeout: 30000,
});

module.exports = { kafka };
