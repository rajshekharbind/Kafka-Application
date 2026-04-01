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

## 📦 Installation

1. **Navigate to the Kafka-App folder**:
```bash
cd c:\Users\bramh\Kafka-App
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

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and enhancement requests.

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for better Kafka management**
