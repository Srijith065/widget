// current code

(function (w, d) {
  // Check if widget options exist and get mode
  const widgetOptions = w.finiWidgetOptions || { mode: "widget" };
  const mode = widgetOptions.mode || "widget";
  const widgetId = widgetOptions.widgetId || "default";

  // Azure OpenAI Configuration
  const AZURE_ENDPOINT = 'https://iuat-aillm-ia7nf2g24v7ns.openai.azure.com';
  const DEPLOYMENT_NAME = 'gpt-4-omni';
  const API_VERSION = '2024-02-15-preview';
  const API_KEY = '4ef40c4a5bad41fdb5544ca04de0365b';

  // Create widget styles with mode-specific variations
  const styles = `
      /* Common Styles */
      .fini-widget-base {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          z-index: 999999;
      }

      /* Widget Mode Styles */
      .fini-chat-launcher {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
      }
      .fini-chat-launcher:hover {
          transform: scale(1.1);
      }
      .fini-chat-launcher img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
      }

      .fini-chat-container {
          position: fixed;
          bottom: 100px;
          right: 20px;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: none;
          flex-direction: column;
      }
      .fini-chat-container.visible {
          display: flex;
      }

      /* Chat Widget Styles */
      .fini-chat-header {
          padding: 16px;
          background: white;
          color: black;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
      }
      .fini-chat-header .fini-chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 12px;
      }
      .fini-chat-close {
          cursor: pointer;
          padding: 5px;
      }
      .fini-chat-close svg {
          width: 20px;
          height: 20px;
          fill: black;
      }
      .fini-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #f0f2f5;
      }
      .fini-chat-message {
          max-width: 70%;
          padding: 8px 16px;
          border-radius: 16px;
          margin: 4px 0;
          word-wrap: break-word;
          font-size: 14px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
      }
      .fini-chat-message .fini-chat-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
      }
      .fini-message-content {
          flex-grow: 1;
      }
      .fini-chat-message.received {
          background: white;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
      }
      .fini-chat-message.sent {
          background: #0084ff;
          color: white;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
      }
      .fini-chat-input {
          padding: 16px;
          background: white;
          border-radius: 0 0 12px 12px;
          display: flex;
          gap: 8px;
      }
      .fini-chat-input input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 24px;
          outline: none;
          font-size: 14px;
      }
      .fini-chat-input button {
          padding: 12px;
          background: #0084ff;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
      }
      .fini-chat-input button:disabled {
          background: #cccccc;
          cursor: not-allowed;
      }
      .fini-chat-input button svg {
          width: 20px;
          height: 20px;
          fill: white;
      }
      .fini-timestamp {
          font-size: 12px;
          color: #65676b;
          margin-top: 4px;
          text-align: right;
      }
      .fini-typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px;
      }
      .fini-typing-dot {
          width: 8px;
          height: 8px;
          background: #90949c;
          border-radius: 50%;
          animation: typing-animation 1.4s infinite ease-in-out;
      }
      .fini-typing-dot:nth-child(1) { animation-delay: 0s; }
      .fini-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .fini-typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typing-animation {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
      }
  `;

  // Inject styles
  const styleSheet = d.createElement("style");
  styleSheet.textContent = styles;
  d.head.appendChild(styleSheet);

  async function streamFromAzureOpenAI(userMessage, messageElement) {
    const url = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: [{
                type: "text",
                text: "You are an AI assistant that helps people find information."
              }]
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonResponse = await response.json();
      const contentSpan = messageElement.querySelector('.fini-message-content');
      
      if (jsonResponse.choices && jsonResponse.choices[0]?.message?.content) {
        const content = jsonResponse.choices[0].message.content;
        if (contentSpan) {
          // Simulate streaming effect for better UX
          let displayedContent = '';
          const contentArray = content.split('');
          
          for (const char of contentArray) {
            displayedContent += char;
            contentSpan.textContent = displayedContent;
            await new Promise(resolve => setTimeout(resolve, 20)); // Adjust timing as needed
            
            // Scroll to bottom as new content arrives
            const messagesContainer = document.getElementById('finiChatMessages');
            if (messagesContainer) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          }
        }
      } else {
        throw new Error('No content in response');
      }

    } catch (error) {
      console.error('Error with request:', error);
      messageElement.querySelector('.fini-message-content').textContent = 
        'Sorry, there was an error processing your request. Please try again later.';
    }
  }

  function createChatWidget() {
    // Create launcher button
    const launcher = d.createElement("div");
    launcher.className = "fini-widget-base fini-chat-launcher";
    launcher.innerHTML = `
      <img src="widget-logo.png" alt="Assistant">
    `;

    // Create chat container
    const chatContainer = d.createElement("div");
    chatContainer.className = "fini-widget-base fini-chat-container";
    chatContainer.innerHTML = `
      <div class="fini-chat-header">
        <img src="widget-logo.png" alt="Assistant" class="fini-chat-avatar">
        <h3 style="margin: 0;">Ask Intelligent</h3>
        <div class="fini-chat-close">
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        </div>
      </div>
      <div class="fini-chat-messages" id="finiChatMessages">
        <div class="fini-chat-message received">
          <img src="widget-logo.png" alt="Assistant" class="fini-chat-avatar">
          <div class="fini-message-content">Welcome! How can I help you today?</div>
          <div class="fini-timestamp">${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
        </div>
      </div>
      <div class="fini-chat-input">
        <input type="text" id="finiChatInput" placeholder="Type a message...">
        <button id="finiChatSend">
          <svg viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    `;

    // Add elements to page
    d.body.appendChild(launcher);
    d.body.appendChild(chatContainer);

    // Add event listeners
    launcher.addEventListener("click", () => {
      chatContainer.classList.add("visible");
      launcher.style.display = "none";
      const input = d.getElementById("finiChatInput");
      if (input) input.focus();
    });

    const closeButton = chatContainer.querySelector(".fini-chat-close");
    closeButton.addEventListener("click", () => {
      chatContainer.classList.remove("visible");
      launcher.style.display = "flex";
    });

    // Chat functionality
    const messageContainer = d.getElementById("finiChatMessages");
    const messageInput = d.getElementById("finiChatInput");
    const sendButton = d.getElementById("finiChatSend");

    function addMessage(text, isSent) {
      const messageDiv = d.createElement("div");
      messageDiv.className = `fini-chat-message ${isSent ? "sent" : "received"}`;

      const timestamp = new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });

      messageDiv.innerHTML = `
        ${isSent ? "" : '<img src="widget-logo.png" alt="Assistant" class="fini-chat-avatar">'}
        <div class="fini-message-content">${text}</div>
        <div class="fini-timestamp">${timestamp}</div>
      `;

      messageContainer.appendChild(messageDiv);
      messageContainer.scrollTop = messageContainer.scrollHeight;
      return messageDiv;
    }

    async function sendMessage() {
      const message = messageInput.value.trim();
      if (message) {
        // Disable input and button while processing
        messageInput.disabled = true;
        sendButton.disabled = true;

        // Add user message
        addMessage(message, true);
        messageInput.value = "";

        // Add assistant message with typing indicator
        const assistantMessage = addMessage('', false);
        const typingIndicator = d.createElement('div');
        typingIndicator.className = 'fini-typing-indicator';
        typingIndicator.innerHTML = `
          <div class="fini-typing-dot"></div>
          <div class="fini-typing-dot"></div>
          <div class="fini-typing-dot"></div>
        `;
        assistantMessage.querySelector('.fini-message-content').appendChild(typingIndicator);

        // Stream the response
        await streamFromAzureOpenAI(message, assistantMessage);

        // Remove typing indicator
        const content = assistantMessage.querySelector('.fini-message-content');
        const indicator = content.querySelector('.fini-typing-indicator');
        if (indicator) {
          content.removeChild(indicator);
        }

        // Re-enable input and button
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
      }
    }

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  function createSearchBar() {
    // Search bar implementation remains the same
  }

  // Create widget based on mode
  switch (mode) {
    case "widget":
      createChatWidget();
      break;
    case "searchbar":
      createSearchBar();
      break;
    default:
      console.warn("Invalid widget mode specified");
  }
})(window, document);