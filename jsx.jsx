/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState, useEffect, useRef } from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";
import { marked } from "https://esm.sh/marked@9.0.0";

function App() {
  const [messages, setMessages] = useState([
    { 
      id: 0, 
      text: "👋 Welcome to Advanced AI! I'm your intelligent assistant.", 
      sender: "system" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    model: "gpt-4o-mini",
    maxTokens: 300,
    temperature: 0.7
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'maxTokens' || name === 'temperature' 
        ? Number(value) 
        : value
    }));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { 
      id: Date.now(), 
      text: input, 
      sender: "user"
    };

    setMessages(prev => [...prev, userMessage]);
    
    const generatingMessage = {
      id: Date.now() + 0.5,
      text: "Generating.....",
      sender: "system"
    };
    setMessages(prev => [...prev, generatingMessage]);
    
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/chat", {
        method: "POST",
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          settings: settings
        })
      });

      const data = await response.json();
      
      setMessages(prev => prev
        .filter(msg => msg.id !== generatingMessage.id)
        .concat({ 
          id: Date.now() + 1, 
          text: data.response, 
          sender: "ai" 
        })
      );
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev
        .filter(msg => msg.id !== generatingMessage.id)
        .concat({ 
          id: Date.now() + 2, 
          text: "Sorry, something went wrong. Please try again.", 
          sender: "system" 
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-container ${theme}`}>
      <header>
        <div className="header-left">
          <button 
            onClick={toggleSettings} 
            className="settings-toggle"
          >
            ⚙️
          </button>
        </div>
        <div className="header-center">
          <h1>Advanced AI</h1>
          <p>Created By Varun Ajmera</p>
        </div>
        <div className="header-right">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>
      
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <div className="settings-content">
              <div className="settings-header">
                <h2>AI Settings</h2>
                <button 
                  onClick={toggleSettings} 
                  className="close-settings"
                >
                  ✖️
                </button>
              </div>
              <div className="setting-group">
                <label>
                  Model:
                  <select 
                    name="model" 
                    value={settings.model} 
                    onChange={handleSettingChange}
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </label>
              </div>
              <div className="setting-group">
                <label>
                  Max Tokens: {settings.maxTokens}
                  <input 
                    type="range" 
                    name="maxTokens"
                    min="50" 
                    max="500" 
                    value={settings.maxTokens}
                    onChange={handleSettingChange}
                  />
                </label>
              </div>
              <div className="setting-group">
                <label>
                  Creativity: {settings.temperature.toFixed(1)}
                  <input 
                    type="range" 
                    name="temperature"
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={settings.temperature}
                    onChange={handleSettingChange}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="messages">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`message ${msg.sender} ${msg.sender === "system" && msg.text === "Generating....." ? "generating" : ""}`}
          >
            <div 
              dangerouslySetInnerHTML={{
                __html: marked.parse(msg.text)
              }}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button 
          onClick={sendMessage} 
          disabled={isLoading}
        >
          {isLoading ? "Generating....." : "Send"}
        </button>
      </div>
    </div>
  );
}

function client() {
  createRoot(document.getElementById("root")).render(<App />);
}
if (typeof document !== "undefined") { client(); }

export default async function server(request) {
  if (request.method === "POST") {
    const { OpenAI } = await import("https://esm.town/v/std/openai");
    const openai = new OpenAI();

    const body = await request.json();
    const messages = body.messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are an advanced AI assistant named Advanced AI. Be helpful, creative, and precise. Use markdown for formatting complex responses." 
        },
        ...messages
      ],
      model: body.settings?.model || "gpt-4o-mini",
      max_tokens: body.settings?.maxTokens || 300,
      temperature: body.settings?.temperature || 0.7
    });

    return Response.json({ 
      response: completion.choices[0].message.content 
    });
  }

  return new Response(`
    <html>
      <head>
        <title>Advanced AI</title>
        <style>${css}</style>
      </head>
      <body>
        <div id="root"></div>
        <script src="https://esm.town/v/std/catch"></script>
        <script type="module" src="${import.meta.url}"></script>
      </body>
    </html>
  `, {
    headers: { "content-type": "text/html" }
  });
}

const css = `
body { 
  margin: 0; 
  font-family: 'Arial', sans-serif; 
}

.chat-container {
  max-width: 600px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.dark {
  background-color: #1a1a2e;
  color: #e0e0e0;
}

.light {
  background-color: #f4f4f4;
  color: #333;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  position: relative;
}

.header-center {
  text-align: center;
}

.header-left, .header-right {
  width: 50px;
}

.settings-toggle, .theme-toggle {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.settings-modal {
  width: 90%;
  max-width: 500px;
  max-height: 80%;
  overflow-y: auto;
}

.settings-content {
  background: #2a2a3a;
  padding: 30px;
  border-radius: 10px;
  color: white;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-settings {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group label {
  display: block;
  margin-bottom: 10px;
}

.setting-group select, 
.setting-group input[type="range"] {
  width: 100%;
  margin-top: 10px;
}

.messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 10px;
  max-width: 80%;
}

.user {
  align-self: flex-end;
  background-color: #4a4a6a;
  color: white;
  margin-left: auto;
}

.ai {
  align-self: flex-start;
  background-color: #2a2a3a;
  color: #e0e0e0;
}

.system {
  text-align: center;
  background-color: #3a3a4a;
  color: #b0b0b0;
}

.generating {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.input-area {
  display: flex;
  padding: 20px;
}

input[type="text"] {
  flex-grow: 1;
  padding: 10px;
  margin-right: 10px;
  border-radius: 5px;
  border: 1px solid #555;
  background-color: #2a2a3a;
  color: white;
}

input[type="text"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button {
  padding: 10px 20px;
  background-color: #4a4a6a;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;