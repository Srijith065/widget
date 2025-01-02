(function (w, d) {
  // Create and inject preloader styles
  const preloaderStyles = `
    .intellient-preloader {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: #3B82F6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999998;
    }

    .intellient-preloader-spinner {
      width: 30px;
      height: 30px;
      border: 3px solid #ffffff;
      border-top: 3px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  const styleSheet = d.createElement("style");
  styleSheet.textContent = preloaderStyles;
  d.head.appendChild(styleSheet);

  // Create and show preloader
  const preloader = d.createElement("div");
  preloader.className = "intellient-preloader";
  preloader.innerHTML = '<div class="intellient-preloader-spinner"></div>';
  d.body.appendChild(preloader);

  const widgetOptions = w.intellientoptions || { mode: "widget" };
  const mode = widgetOptions.mode || "widget";
  const widgetId = widgetOptions.widgetId;
  let validationResponse;
  let validatedLogo;
  console.log("widgetId", widgetId);
  console.log(" window.location.href", window.location.href);

  const DEFAULT_THEME = {
    greeting: "Hello! How can I help you today?",
    avatarFile: "https://delightful-beach-07c9da51e.5.azurestaticapps.net/widget-logo.png",
    brandingColor: "#3B82F6",
    primaryButtonColor: "#10B981",
    primaryButtonTextColor: "#FFFFFF",
    pageBackgroundColor: "#F3F4F6",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  function markdownToHtml(markdown) {
    markdown = markdown.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    markdown = markdown.replace(/\*(.*?)\*/g, "<em>$1</em>");
    markdown = markdown.replace(/^\s*-\s+(.*)$/g, "<ul><li>$1</li></ul>");
    markdown = markdown.replace(/\n/g, "<br>");
    return markdown;
  }

  let abortController = null;
  let conversationHistory = [];
  async function streamFromAzureOpenAI(userMessage, messageElement, widgetId) {
    abortController = new AbortController();
    const { signal } = abortController;

    console.log("userMessage", userMessage);
    conversationHistory.push({ role: "user", content: userMessage });
    if (conversationHistory.length !== 0) {
      const starterContainer = document.getElementById('starter-container');
      starterContainer.style.display = "none";
    }

    try {
      const response = await fetch("http://localhost:3000/api/link-widget", {
        method: "POST",
        body: JSON.stringify({
          userMessage,
          widgetId,
          conversationHistory,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("resposnes", data);
      const contentSpan = messageElement.querySelector(".intellient-message-content");

      if (data.choices) {
        let content;
        if (data.choices[0]?.message?.content) {
          content = data.choices[0].message.content;
        } else {
          content = data.choices;
        }
        console.log("contemt", content);

        content = markdownToHtml(content);
        let displayedContent = "";
        const contentArray = content.split("");

        const messagesContainer = document.getElementById("intellientChatMessages");
        let userScrolledUp = false;

        messagesContainer.addEventListener("scroll", () => {
          const isAtBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 10;
          userScrolledUp = !isAtBottom;
        });

        function updateContent(content) {
          requestAnimationFrame(() => {
            contentSpan.innerHTML = content;
          });
        }

        for (const char of contentArray) {
          if (signal.aborted) {
            console.log("Streaming stopped");
            return;
          }
          displayedContent += char;
          updateContent(displayedContent);

          if (!userScrolledUp) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }

          await new Promise((resolve) => setTimeout(resolve, 5));
        }
        conversationHistory.push({ role: "assistant", content: content });
      } else {
        throw new Error("no content in response");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        messageElement.querySelector(".intellient-message-content").textContent = "Response Stopped...";
        console.log("Stream was aborted by user.");
      } else {
        console.error("Error:", error);
        messageElement.querySelector(".intellient-message-content").textContent = 
          "Sorry, there was an error processing your request. Please try again later.";
      }
    }
  }

  async function valiadateWidget(widgetId) {
    console.log("widgetId", widgetId);

    const response = await fetch(
      "http://localhost:3000/api/link-widget/widget-validations",
      {
        method: "POST",
        body: JSON.stringify({
          widgetId,
        }),
      }
    );

    const data = await response.json();
    validationResponse = data;
    return data;
  }

  async function createChatWidget() {
    try {
      await valiadateWidget(widgetId);
      console.log("validationResponse", validationResponse);
      validatedLogo = validationResponse.avatarFile;

      // Remove preloader once widget is ready
      const preloader = d.querySelector('.intellient-preloader');
      if (preloader) {
        preloader.remove();
      }

      const styles = `
        .intellient-widget-base {
          font-family: ${DEFAULT_THEME.fontFamily};
          z-index: 999999;
        }

        .intellient-chat-launcher {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          background: ${validationResponse.brandingColor || DEFAULT_THEME.brandingColor};
          border-radius: ${validationResponse.avatarShape === "circle" ? "50%" : "0%"};
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .intellient-chat-launcher:hover {
          transform: scale(1.1);
        }

        .intellient-chat-launcher img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .intellient-chat-container {
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

        .intellient-conversation-starters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px));
          gap: 8px;
          padding: 8px;
          border-top: 1px solid #ddd;
          background: white;
        }

        .ellipsis-button {
          padding: 8px 12px;
          font-size: 12px;
          text-align: center;
          border-radius: 12px;
          background-color:rgb(236, 236, 236);
          color: black;
          cursor: pointer;
          border: none;
          transition: background-color 0.3s;
        }

        .ellipsis-button:hover {
          background-color:rgb(226, 226, 226);
        }

        .intellient-chat-container.visible {
          display: flex;
        }

        .intellient-chat-header {
          padding: 16px;
          background: ${validationResponse.brandingColor || DEFAULT_THEME.brandingColor};
          color: white;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tooltip-container {
          position: relative;
          display: inline-block;
        }

        .tooltip {
          display: none;
          position: absolute;
          bottom: 120%;
          transform: translateX(-50%);
          background-color: #333;
          color: #fff;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 9px;
          white-space: nowrap;
          box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 62%;
          transform: translateX(-50%);
          border-width: 5px;
          border-style: solid;
          border-color: #333 transparent transparent transparent;
        }

        .tooltip-container:hover .tooltip {
          display: block;
        }

        .intellient-chat-header .intellient-chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: ${validationResponse.avatarShape === "circle" ? "50%" : "0%"};
          margin-right: 12px;
        }

        .intellient-chat-close {
          cursor: pointer;
          padding: 5px;
        }

        .intellient-chat-close svg {
          width: 20px;
          height: 20px;
          fill: white;
        }

        .intellient-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: ${validationResponse.pageBackgroundColor || DEFAULT_THEME.pageBackgroundColor};
        }

        .intellient-chat-message {
          padding: 8px 16px;
          border-radius: 16px;
          margin: 4px 0;
          word-wrap: break-word;
          font-size: 13px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .intellient-chat-message .intellient-chat-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .intellient-message-content {
          flex-grow: 1;
        }

        .intellient-chat-message.received {
          background: rgb(236, 236, 236);
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        .intellient-chat-message.sent {
          background: white;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }

        .intellient-chat-input {
          padding: 16px;
          background: white;
          border-radius: 0 0 12px 12px;
          display: flex;
          gap: 8px;
        }

        .intellient-chat-input input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 24px;
          outline: none;
          font-size: 14px;
        }

        .intellient-chat-input button {
          padding: 12px;
          background: ${validationResponse.primaryButtonColor || DEFAULT_THEME.primaryButtonColor};
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .intellient-chat-input button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }

        .intellient-chat-input button svg {
          width: 20px;
          height: 20px;
          fill: ${validationResponse.primaryButtonTextColor || DEFAULT_THEME.primaryButtonTextColor};
        }

        #starter-container {
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 10px;
        }

        .ask-intellient-title {
          display: block;
          font-size: 20px;
          margin: 0;
          font-weight: bold;
        }

        .intellient-timestamp {
          font-size: 12px;
          color: #65676b;
          margin-top: 4px;
          text-align: right;
        }

        .intellient-typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px;
        }

        .intellient-typing-dot {
          width: 8px;
          height: 8px;
          background: #90949c;
          border-radius: 50%;
          animation: typing-animation 1.4s ease-in-out infinite;
        }

        input {
          width: 300px;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #ccc;
          margin-bottom: 5px;
        }

        .tag {
          background-color: #0084ff;
          color: white;
          border-radius: 12px;
          cursor: pointer;
          font-size: 10px;
          padding: 2px;
        }

        .ellipsis-button {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          width: 100%;
          min-height: 30px;
          font-size: 12px;
          margin-bottom: 5px;
          box-sizing: border-box;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 5px;
          cursor: pointer;
          text-align: start;
        }

        .intellient-typing-dot:nth-child(1) { animation-delay: 0s; }
        .intellient-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .intellient-typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing-animation {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `;

      const styleSheet = d.createElement("style");
      styleSheet.textContent = styles;
      d.head.appendChild(styleSheet);

      const launcher = d.createElement("div");
      launcher.className = "intellient-widget-base intellient-chat-launcher";
      launcher.innerHTML = `<img src="${validatedLogo || DEFAULT_THEME.avatarFile}" alt="Chat">`;

      const chatContainer = d.createElement("div");
      chatContainer.className = "intellient-widget-base intellient-chat-container";
      chatContainer.innerHTML = `
        <div class="intellient-chat-header">
          <img src="${validatedLogo || DEFAULT_THEME.avatarFile}" alt="Assistant" class="intellient-chat-avatar">
          <label class="ask-intellient-title">${validationResponse.botName}</label>
          <div class="intellient-chat-close">
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
          </div>
        </div>
        <div class="intellient-chat-messages" id="intellientChatMessages">
          <div class="intellient-chat-message received">
            <img src="${validatedLogo || DEFAULT_THEME.avatarFile}" alt="Assistant" class="intellient-chat-avatar">
            <div class="intellient-message-content">${validationResponse.greeting || DEFAULT_THEME.greeting}</div>
            <div class="intellient-timestamp">${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
          </div>
        </div>  
        <div id="starter-container" class="intellient-conversation-starters">
        </div>
        <div id="tag-container" style="display: flex; flex-wrap; wrap; gap: 5px; margin-bottom: 10px;"></div>
        <div class="intellient-chat-input">
          <input type="text" id="intellientChatInput" placeholder="Type a message..." autocomplete="off">
          <div class="tooltip-container">
            <button id="intellientChatSend">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M12 15c1.66 0 3-1.34 3-3V6a3 3 0 0 0-6 0v6c0 1.66 1.34 3 3 3zm4.3-3c0 2.38-1.88 4.3-4.3 4.3S7.7 14.38 7.7 12H6.1c0 3.15 2.41 5.75 5.5 6.3v3h1.8v-3c3.09-.55 5.5-3.15 5.5-6.3h-1.6z" />
              </svg>
            </button>
            <div id="tooltip" class="tooltip">Long press to activate voice chat</div>
          </div>
          <button id="intellientChatStop">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
              <circle cx="12" cy="12" r="10" fill="red" />
              <rect x="7" y="7" width="10" height="10" fill="white" />
            </svg>
          </button>
        </div>
      `;

      d.body.appendChild(launcher);
      d.body.appendChild(chatContainer);
      console.log("conversationHistory", conversationHistory);

      if (conversationHistory.length === 0) {
        const starterContainer = document.getElementById('starter-container');
        validationResponse.conversationStarters.forEach(starter => {
          const button = document.createElement('button');
          button.id = `intellientChatClickable${starter.id}`;
          button.className = 'ellipsis-button';
          button.textContent = starter.description;
          button.title = `${starter.description}`;
          button.addEventListener('click', () => {
            const userMessage = starter.description;
            sendMessage(userMessage);
            starterContainer.style.display = "none";
          });
          starterContainer.appendChild(button);
        });
      }

      launcher.addEventListener("click", () => {
        chatContainer.classList.add("visible");
        launcher.style.display = "none";
        const input = d.getElementById("intellientChatInput");
        if (input) input.focus();
      });

      const closeButton = chatContainer.querySelector(".intellient-chat-close");
      closeButton.addEventListener("click", () => {
        chatContainer.classList.remove("visible");
        launcher.style.display = "flex";
      });

      const messageInput = d.getElementById("intellientChatInput");
      const sendButton = d.getElementById("intellientChatSend");
      const stopButton = d.getElementById("intellientChatStop");
      stopButton.style.display = "none";

      function startVoiceRecognition() {
        if (!("webkitSpeechRecognition" in window)) {
          alert("Your browser does not support voice recognition.");
          return;
        }
        const recognition = new webkitSpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          showMicIcon();
          console.log("Voice recognition started...");
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          document.getElementById("intellientChatInput").value = transcript;
        };

        recognition.onerror = (event) => {
          console.error("Voice recognition error:", event.error);
        };

        recognition.onend = () => {
          sendMessage("");
          resetSendButton();
          console.log("Voice recognition ended.");
        };

        recognition.start();
      }

      function showMicIcon() {
        sendButton.innerHTML = `
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M12 15c1.66 0 3-1.34 3-3V6a3 3 0 0 0-6 0v6c0 1.66 1.34 3 3 3zm4.3-3c0 2.38-1.88 4.3-4.3 4.3S7.7 14.38 7.7 12H6.1c0 3.15 2.41 5.75 5.5 6.3v3h1.8v-3c3.09-.55 5.5-3.15 5.5-6.3h-1.6z" />
          </svg>`;
      }

      function resetSendButton() {
        sendButton.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>`;
      }

      let longPressTimer;
      sendButton.onmousedown = sendButton.ontouchstart = () => {
        longPressTimer = setTimeout(() => {
          startVoiceRecognition();
        }, 800);
      };

      sendButton.onmouseup = sendButton.ontouchend = () => {
        clearTimeout(longPressTimer);
      };

      function toggleSendButton() {
        if (messageInput.value.trim().length > 0) {
          sendButton.innerHTML = `
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>`;
        } else {
          sendButton.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
              <path d="M12 15c1.66 0 3-1.34 3-3V6a3 3 0 0 0-6 0v6c0 1.66 1.34 3 3 3zm4.3-3c0 2.38-1.88 4.3-4.3 4.3S7.7 14.38 7.7 12H6.1c0 3.15 2.41 5.75 5.5 6.3v3h1.8v-3c3.09-.55 5.5-3.15 5.5-6.3h-1.6z" />
            </svg>`;
        }
      }

      async function sendMessage(userMessage) {
        console.log("entered");
        let intellibotName = "";
        const tagContainer = document.getElementById("tag-container");
        const tags = tagContainer.getElementsByClassName("tag");
        if (tags.length !== 0) {
          intellibotName = tags[0].textContent.slice(1);
        }

        const message = messageInput.value.trim() || userMessage;
        console.log("messages", message);
        console.log("intellibotName", intellibotName);

        if (message && message.length > 0) {
          sendButton.style.display = "none";
          stopButton.style.display = "flex";
          messageInput.disabled = true;
          sendButton.disabled = true;

          addMessage(message, true);
          messageInput.value = "";

          const assistantMessage = addMessage("", false);
          console.log("assistantMessage", assistantMessage);

          await streamFromAzureOpenAI(message, assistantMessage, widgetId);

          messageInput.disabled = false;
          sendButton.disabled = false;
          sendButton.style.display = "flex";
          stopButton.style.display = "none";
          messageInput.focus();

          toggleSendButton();
        }
      }

      messageInput.addEventListener("input", toggleSendButton);
      messageInput.addEventListener("change", function() {
        if (this.value.trim() === '') {
          toggleSendButton();
        }
      });

      sendButton.addEventListener("click", () => {
        if (messageInput.value.trim().length > 0) {
          sendMessage();
        }
      });

      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (messageInput.value.trim().length > 0) {
            sendMessage();
          }
        }
      });

      toggleSendButton();

      stopButton.addEventListener("click", () => {
        if (abortController) {
          abortController.abort();
          stopButton.style.display = "none";
          console.log("Streaming process stopped.");
        }
      });

      function addMessage(text, isSent) {
        const container = d.getElementById("intellientChatMessages");
        const messageDiv = d.createElement("div");
        messageDiv.className = `intellient-chat-message ${isSent ? "sent" : "received"}`;

        const timestamp = new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });

        if (!isSent) {
          messageDiv.innerHTML = `
            <img src="${validatedLogo || DEFAULT_THEME.avatarFile}" alt="Assistant" class="intellient-chat-avatar">
            <div class="intellient-message-content">
              ${text || `<div class="intellient-typing-indicator">
                <div class="intellient-typing-dot"></div>
                <div class="intellient-typing-dot"></div>
                <div class="intellient-typing-dot"></div>
              </div>`}
            </div>
            <div class="intellient-timestamp">${timestamp}</div>
          `;
        } else {
          messageDiv.innerHTML = `
            <div class="intellient-message-content">${text}</div>
            <div class="intellient-timestamp">${timestamp}</div>
          `;
        }

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        return messageDiv;
      }

    } catch (error) {
      console.error("Error creating widget:", error);
      const preloader = d.querySelector('.intellient-preloader');
      if (preloader) {
        preloader.style.background = '#EF4444';
        preloader.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        `;
      }
    }
  }

  if (mode === "widget") {
    createChatWidget();
  }
})(window, document);
