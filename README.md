# 📊 Kafka App - Interactive Management Dashboard

A modern, responsive web-based Kafka management application with an intuitive UI for managing topics, producing messages, and consuming messages in real-time.

## 🚀 Features

- **Cluster Management**: Monitor Kafka cluster status and broker information
- **Topic Management**: Create and list Kafka topics with customizable partitions
- **Producer**: Send messages to topics with optional keys
- **Consumer**: Consume messages from topics with real-time display
- **Responsive UI**: Beautiful, modern interface that works on all devices
- **Real-time Updates**: Auto-refresh cluster and topic information
- **Message History**: View received messages with metadata (topic, partition, offset, key)

##Demo-Application

https://github.com/user-attachments/assets/64466070-d341-4fb8-86d5-b7ef532562df

#hand on Experiences
<img width="1902" height="735" alt="Screenshot 2026-04-01 143444" src="https://github.com/user-attachments/assets/6032fff7-99f7-4a6c-8227-e33bb334fdf5" />
<img width="1774" height="594" alt="Screenshot 2026-04-01 144228" src="https://github.com/user-attachments/assets/f34fbdf4-a72e-487b-9526-b95a779673c7" />

<img width="1876" height="838" alt="Screenshot 2026-04-01 091736" src="https://github.com/user-attachments/assets/58f3e2b0-c7b8-4797-a3f7-98b64f483410" />
<img width="1884" height="1073" alt="Screenshot 2026-04-01 143332" src="https://github.com/user-attachments/assets/b9ef4dd4-3e3f-4de3-9c58-6c93dc32055e" />



## 📦 Installation

1. **Navigate to the Kafka-App folder**:
```bash
cd c:\Users\bramh\Kafka-App
⚙️ Prerequisites

Make sure you have installed:

Node.js (>= 16)
Docker & Docker Compose
npm or yarn
🐳 Step 1: Run Kafka using Docker

Create a docker-compose.yml file:

version: '3'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:latest
    ports:
      - "9092:9092"
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
    depends_on:
      - zookeeper

Run:

docker-compose up -d
📦 Step 2: Install Dependencies
npm install
🔧 Step 3: Environment Setup

Create .env file:

KAFKA_BROKER=localhost:9092
TOPIC_NAME=test-topic
```

2. **Install dependencies**:
```bash
npm install
# or
yarn install
```

## ⚙️ Configuration

Edit `src/client.js` to configure your Kafka broker connection:

```javascript
const kafka = new Kafka({
    clientId: 'kafka-app',
    brokers: ['192.168.29.197:9092'], // Update your broker address
});
```

## 🟢 Running the Application

### Start the server:
```bash
npm start
# or
yarn start
```

The application will start on `http://localhost:3000`

### Development mode (with auto-reload):
```bash
npm run dev
# or
yarn dev
```

## 🎨 UI Features

### Header
- Displays application title and cluster connection status
- Shows real-time cluster information

### Cluster Information
- Number of brokers
- Current controller ID
- Connection status
- Auto-refreshes every 10 seconds

### Topics Management
- Create new topics with custom partition count and replication factor
- View all available topics
- Click any topic to select it for producing or consuming

### Producer Section
- Select topic and enter message
- Optional message key
- Real-time feedback on message send status
- Textarea for multiline message input

### Consumer Section
- Select topic and consumer group
- Start/Stop consuming messages
- Real-time message display with:
  - Topic name
  - Partition number
  - Offset
  - Message key (if present)
  - Full message value
- Clear message history
- Auto-scrolls to latest messages

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cluster-info` | Get cluster information |
| GET | `/api/topics` | List all topics |
| POST | `/api/topics/create` | Create a new topic |
| POST | `/api/produce` | Send a message |
| POST | `/api/consumer/start` | Start consuming |
| POST | `/api/consumer/stop` | Stop consuming |
| GET | `/api/messages` | Get all consumed messages |
| POST | `/api/messages/clear` | Clear message history |

## 🛠️ Project Structure

```
Kafka-App/
├── public/
│   ├── index.html          # Main UI
│   ├── style.css           # Responsive styles
│   └── app.js              # Frontend logic
├── src/
│   ├── server.js           # Express server
│   ├── client.js           # Kafka client initialization
│   └── kafkaManager.js     # Kafka operations
├── package.json
├── README.md
└── .gitignore
```

## 🎯 Usage Examples

### 1. Create a Topic
- Enter topic name in the "Create New Topic" form
- Set desired partitions and replication factor
- Click "Create Topic"

### 2. Send a Message
- Select a topic from the list or enter topic name
- Add optional message key
- Enter message value
- Click "Send Message"

### 3. Consume Messages
- Enter topic name
- Enter consumer group (or use default)
- Click "Start Consumer"
- Messages will appear in real-time as they arrive
- Click "Stop Consumer" to stop consuming

## 🔧 Troubleshooting

**Cannot connect to Kafka broker**
- Verify broker address in `src/client.js`
- Ensure Kafka broker is running
- Check firewall/network connectivity

**Port 3000 already in use**
- Change port in `.env`: `PORT=3001`
- Or kill the process using port 3000

**Module not found errors**
- Run `npm install` or `yarn install`
- Ensure all dependencies are installed

## 🌐 Browser Compatibility

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

📊 Kafka CLI Commands (Optional)
# Create topic
docker exec -it <kafka-container> kafka-topics --create \
--topic test-topic --bootstrap-server localhost:9092

# List topics
docker exec -it <kafka-container> kafka-topics --list \
--bootstrap-server localhost:9092

💻 Sample Code Snippet
Producer Example
await producer.send({
  topic: 'test-topic',
  messages: [{ value: 'Hello Kafka 🚀' }],
});
Consumer Example
await consumer.run({
  eachMessage: async ({ message }) => {
    console.log(`Received: ${message.value.toString()}`);
  },
});


🧪 Example Workflow
Start Docker Kafka
Open 2 terminals
Run producer in Terminal 1
Run consumer in Terminal 2
Send messages from producer
Watch real-time output in consumer

▶️ Step 4: Run Producer & Consumer (2 Terminals)
🖥️ Terminal 1 (Producer)
node src/server.js producer
🖥️ Terminal 2 (Consumer)
node src/server.js consumer

