# Kafka Pro - Troubleshooting Guide

## Common Issues and Solutions

### 1. Group Rebalancing Error
**Error Message:** `The group is rebalancing, so a rejoin is needed`

**What It Means:**
- Kafka is rebalancing consumer groups (normal operation)
- This happens when a consumer joins/leaves or there's a network issue
- The broker pauses message delivery during rebalancing

**Solutions:**
✅ **Automatic Retry** - The app now automatically retries after 2 seconds
✅ **Session Management** - Optimized heartbeat interval (3 seconds) and session timeout (30 seconds)
✅ **Better Logging** - Check console for detailed information

**Manual Fix:**
1. Stop the consumer (Click ⏹️ Stop button)
2. Wait 5 seconds
3. Start the consumer again (Click ▶️ Start button)

---

### 2. Connection Refused Error
**Error Message:** `connect ECONNREFUSED localhost:9092`

**Solutions:**
1. **Verify Kafka is Running:**
   ```bash
   # Check if Kafka is listening
   netstat -an | findstr 9092
   ```

2. **Start Kafka if Needed:**
   - If using Docker: `docker-compose up -d`
   - If installed locally: Start Zookeeper, then Kafka broker

3. **Check Broker Configuration:**
   - Edit `.env` file if Kafka is on different address
   - Default: `localhost:9092`

---

### 3. Topic Not Found Error
**Error Message:** `Topic does not exist`

**Solutions:**
1. Create the topic first using the "Create Topic" form
2. Or manually create via Kafka CLI:
   ```bash
   kafka-topics --create --topic my-topic --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
   ```

---

### 4. Replication Factor Too High
**Error Message:** `Replication factor is too high for the number of brokers`

**Solutions:**
1. Reduce replication factor in the form (set to 1 if only 1 broker)
2. Ensure you have enough brokers in your cluster
3. For local testing, use replication factor of 1

---

## Consumer Configuration Details

The application uses optimized Kafka consumer settings:

- **Session Timeout:** 30,000 ms (30 seconds)
- **Heartbeat Interval:** 3,000 ms (3 seconds)
- **Rebalance Timeout:** 60,000 ms (60 seconds)
- **Auto-commit:** Every 5 seconds or 100 messages

These settings provide a good balance between responsiveness and stability.

---

## Monitoring Issues

### Check Server Logs:
```bash
# View console output when running npm start
npm start
```

### Check Browser Console:
- Press `F12` to open Developer Tools
- Go to Console tab
- Look for error messages and API calls

### Enable Debug Logging:
Edit `src/client.js` and change:
```javascript
logLevel: logLevel.ERROR,  // Change to logLevel.DEBUG for verbose logs
```

---

## Performance Optimization

### For High-Volume Message Processing:
1. Increase auto-commit threshold: `100 → 500`
2. Increase auto-commit interval: `5000 → 10000`
3. Use multiple consumer groups
4. Consider batch processing

### For Latency-Sensitive Operations:
1. Decrease auto-commit interval: `5000 → 1000`
2. Use smaller auto-commit threshold
3. Dedicate resources to consumer

---

## Quick Checklist

Before troubleshooting, verify:
- ✅ Kafka broker is running
- ✅ Zookeeper is running (if required)
- ✅ Network connectivity to broker (no firewall blocks)
- ✅ Topics are created before consuming
- ✅ Consumer group doesn't conflict with other services

---

## Support

If issues persist:
1. Check the `.env.example` for configuration options
2. Review application logs in console
3. Verify Kafka broker is healthy
4. Restart both Kafka and the application

