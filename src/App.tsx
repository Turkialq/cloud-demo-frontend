import { useState, useEffect, useRef } from "react";
import "./App.css";

interface Message {
  type: string;
  username?: string;
  content?: string;
  timestamp: string;
}

function App() {
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string>("general");
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

  const getLastMessage = () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return "No messages yet";

    if (lastMsg.type === "message") {
      return lastMsg.content || "";
    } else {
      return lastMsg.content || "";
    }
  };

  const getLastMessageTime = () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return "";

    const date = new Date(lastMsg.timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return formatTime(lastMsg.timestamp);
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const groupMessagesByUser = (messages: Message[]) => {
    const groups: Array<{
      messages: Message[];
      username?: string;
      isOwn: boolean;
    }> = [];
    let currentGroup: Message[] = [];
    let currentUsername: string | undefined = undefined;

    messages.forEach((message) => {
      if (message.type === "message") {
        if (message.username === currentUsername && currentGroup.length > 0) {
          currentGroup.push(message);
        } else {
          if (currentGroup.length > 0) {
            groups.push({
              messages: currentGroup,
              username: currentUsername,
              isOwn: currentUsername === username,
            });
          }
          currentGroup = [message];
          currentUsername = message.username;
        }
      } else {
        // System message
        if (currentGroup.length > 0) {
          groups.push({
            messages: currentGroup,
            username: currentUsername,
            isOwn: currentUsername === username,
          });
          currentGroup = [];
          currentUsername = undefined;
        }
        groups.push({
          messages: [message],
          username: undefined,
          isOwn: false,
        });
      }
    });

    if (currentGroup.length > 0) {
      groups.push({
        messages: currentGroup,
        username: currentUsername,
        isOwn: currentUsername === username,
      });
    }

    return groups;
  };

  if (!isConnected) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Welcome to WhatsApp</h1>
          <p>Enter your name to start messaging</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              connectToChat();
            }}
          >
            <input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <button type="submit" disabled={!username.trim()}>
              Start Messaging
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
        ☰ Chats
      </button>

      <div
        className={`overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="profile-section">
            <div className="profile-avatar">{username[0].toUpperCase()}</div>
            <div className="profile-info">
              <h3>{username}</h3>
              <div className="profile-status">Online</div>
            </div>
          </div>
        </div>

        <div className="search-container">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search or start new chat" />
          </div>
        </div>

        <div className="chats-list">
          <div
            className={`chat-item ${
              selectedChat === "general" ? "active" : ""
            }`}
            onClick={() => setSelectedChat("general")}
          >
            <div className="chat-avatar">G</div>
            <div className="chat-info">
              <div className="chat-name">General Chat</div>
              <div className="chat-preview">{getLastMessage()}</div>
            </div>
            <div className="chat-meta">
              <div className="chat-time">{getLastMessageTime()}</div>
              {messages.length > 0 && (
                <div className="unread-badge">{messages.length}</div>
              )}
            </div>
          </div>

          {users
            .filter((user) => user !== username)
            .map((user, index) => (
              <div key={index} className="chat-item">
                <div className="chat-avatar">{user[0].toUpperCase()}</div>
                <div className="chat-info">
                  <div className="chat-name">{user}</div>
                  <div className="chat-preview">Online</div>
                </div>
                <div className="chat-meta">
                  <div className="chat-time">now</div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="main-content">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="chat-header-avatar">G</div>
              <div className="chat-header-info">
                <div className="chat-header-name">General Chat</div>
                <div className="chat-header-status">
                  {users.length} participant{users.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="chat-actions">
                <button className="action-button">🔍</button>
                <button className="action-button">⋮</button>
              </div>
            </div>

            <div className="messages-container">
              {groupMessagesByUser(messages).map((group, groupIndex) => (
                <div key={groupIndex} className="message-group">
                  {group.username
                    ? group.messages.map((msg, msgIndex) => (
                        <div key={msgIndex}>
                          {msgIndex === 0 && (
                            <div
                              className={`message-username ${
                                group.isOwn ? "own" : "other"
                              }`}
                            >
                              {group.isOwn ? "You" : msg.username}
                            </div>
                          )}
                          <div
                            className={`message-bubble ${
                              group.isOwn ? "own" : "other"
                            }`}
                          >
                            <div className="message-content">{msg.content}</div>
                            <div className="message-footer">
                              <span className="message-time">
                                {formatTime(msg.timestamp)}
                              </span>
                              {group.isOwn && (
                                <span className="message-status">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    : group.messages.map((msg, msgIndex) => (
                        <div
                          key={msgIndex}
                          className={`system-message ${
                            msg.type === "user-joined"
                              ? "join"
                              : msg.type === "user-left"
                              ? "leave"
                              : ""
                          }`}
                        >
                          {msg.content}
                        </div>
                      ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="message-input-container">
              <div className="input-wrapper">
                <button type="button" className="emoji-button">
                  😊
                </button>
                <textarea
                  placeholder="Type a message"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="message-input"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
                <button type="button" className="attach-button">
                  📎
                </button>
              </div>
              <button
                type="submit"
                className="send-button"
                disabled={!inputMessage.trim()}
              >
                ➤
              </button>
            </form>
          </>
        ) : (
          <div className="welcome-screen">
            <div className="welcome-logo">💬</div>
            <h2 className="welcome-title">WhatsApp Web</h2>
            <p className="welcome-description">
              Send and receive messages without keeping your phone online. Use
              WhatsApp on up to 4 linked devices and 1 phone at the same time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
