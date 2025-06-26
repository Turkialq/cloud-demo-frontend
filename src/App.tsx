import { useState, useEffect, useRef } from "react";
import "./App.css";

interface Message {
  type: string;
  username?: string;
  content?: string;
  timestamp: string;
}

interface User {
  username: string;
}

function App() {
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectToChat = () => {
    if (!username.trim()) return;

    // Get the backend URL from environment or use default
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:5050/ws";

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("Connected to WebSocket");
      setIsConnected(true);

      // Send join message
      ws.current?.send(
        JSON.stringify({
          type: "join",
          username: username,
        })
      );
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "users-list") {
        setUsers(message.users || []);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            type: message.type,
            username: message.username,
            content: message.content,
            timestamp: message.timestamp,
          },
        ]);
      }
    };

    ws.current.onclose = () => {
      console.log("Disconnected from WebSocket");
      setIsConnected(false);
      setUsers([]);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !inputMessage.trim() ||
      !ws.current ||
      ws.current.readyState !== WebSocket.OPEN
    )
      return;

    ws.current.send(
      JSON.stringify({
        type: "message",
        content: inputMessage,
      })
    );

    setInputMessage("");
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getMessageClass = (type: string) => {
    switch (type) {
      case "user-joined":
        return "system-message join";
      case "user-left":
        return "system-message leave";
      default:
        return "chat-message";
    }
  };

  if (!isConnected) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Welcome to Chat</h1>
          <p>Enter your username to join the chat room</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              connectToChat();
            }}
          >
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <button type="submit" disabled={!username.trim()}>
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <button
        className="menu-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        ☰ Menu
      </button>

      <div
        className={`overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="server-info">
          <h2>Chat Room</h2>
        </div>
        <div className="users-section">
          <h3>ONLINE — {users.length}</h3>
          <div className="users-list">
            {users.map((user, index) => (
              <div key={index} className="user-item">
                <div className="user-avatar">{user[0].toUpperCase()}</div>
                <span className="user-name">{user}</span>
                {user === username && <span className="user-tag">(You)</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="chat-header">
          <h2># general</h2>
          <span className="header-topic">Welcome to the chat room!</span>
        </div>

        <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={getMessageClass(msg.type)}>
              {msg.type === "message" ? (
                <>
                  <div className="message-avatar">
                    {msg.username?.[0].toUpperCase()}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-username">{msg.username}</span>
                      <span className="message-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <div className="message-text">{msg.content}</div>
                  </div>
                </>
              ) : (
                <div className="system-content">
                  <span className="system-text">{msg.content}</span>
                  <span className="system-time">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="message-input-container">
          <input
            type="text"
            placeholder={`Message #general`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="message-input"
          />
          <button
            type="submit"
            className="send-button"
            disabled={!inputMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
