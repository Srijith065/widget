(function (w, d) {
  // Fini AI Integration Configuration
  const FINI_CONFIG = {
    apiEndpoint: 'https://api.usefini.com/v1', // Replace with actual Fini API endpoint
    widgetId: null,
    botId: null,
    domain: null
  };

  class FiniWidget {
    constructor() {
      this.config = {
        widgetTitle: 'Fini AI',
        widgetDescription: '',
        welcomeMessage: 'Hello! How can I help you today?',
        brandColor: '#fe1dff',
        brandLogo: null,
        showReferences: true,
        predefinedQuestions: [],
        domain: '',
        botId: '',
        connectionDetails: {
          connectedAt: null,
          connectedBy: null
        }
      };

      this.initialize();
    }

    async initialize() {
      try {
        // Fetch widget configuration from Fini AI
        await this.fetchConfig();
        // Initialize the widget UI
        this.createWidget();
        // Connect to Fini AI's messaging system
        this.connectMessaging();
      } catch (error) {
        console.error('Failed to initialize Fini widget:', error);
      }
    }

    async fetchConfig() {
      try {
        // Get widget ID from script tag
        const scriptTag = document.querySelector('script[data-fini-widget-id]');
        if (scriptTag) {
          FINI_CONFIG.widgetId = scriptTag.getAttribute('data-fini-widget-id');
        }

        // Fetch configuration from Fini AI
        const response = await fetch(`${FINI_CONFIG.apiEndpoint}/widget/${FINI_CONFIG.widgetId}/config`);
        const config = await response.json();
        
        // Update local configuration
        this.config = { ...this.config, ...config };
        
        // Record connection details
        this.config.connectionDetails.connectedAt = new Date().toISOString();
      } catch (error) {
        console.error('Failed to fetch Fini configuration:', error);
      }
    }

    createWidget() {
      // Inject base styles
      this.injectStyles();

      // Create widget elements
      const widget = this.createWidgetElement();
      document.body.appendChild(widget);

      // Initialize event listeners
      this.initializeEventListeners();
    }

    injectStyles() {
      const styles = `
        .fini-widget {
          --fini-primary-color: ${this.config.brandColor};
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .fini-launcher {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--fini-primary-color);
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
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
          overflow: hidden;
        }

        .fini-chat-container.visible {
          display: flex;
        }

        .fini-chat-header {
          padding: 16px;
          background: var(--fini-primary-color);
          color: white;
        }

        .fini-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f5f5f5;
        }

        .fini-message {
          margin: 8px 0;
          padding: 12px;
          border-radius: 8px;
          max-width: 80%;
        }

        .fini-message.received {
          background: white;
          align-self: flex-start;
        }

        .fini-message.sent {
          background: var(--fini-primary-color);
          color: white;
          align-self: flex-end;
        }

        .fini-references {
          font-size: 12px;
          margin-top: 4px;
          color: #666;
        }

        .fini-predefined-questions {
          padding: 8px 16px;
          background: #f9f9f9;
        }

        .fini-predefined-question {
          padding: 8px;
          margin: 4px 0;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .fini-input-container {
          padding: 16px;
          background: white;
          border-top: 1px solid #eee;
          display: flex;
          gap: 8px;
        }

        .fini-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          outline: none;
        }

        .fini-send-button {
          padding: 8px 16px;
          background: var(--fini-primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `;

      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    createWidgetElement() {
      const container = document.createElement('div');
      container.className = 'fini-widget';

      // Create launcher
      const launcher = document.createElement('div');
      launcher.className = 'fini-launcher';
      launcher.innerHTML = this.config.brandLogo ? 
        `<img src="${this.config.brandLogo}" alt="${this.config.widgetTitle}" style="width: 30px; height: 30px;">` :
        `<svg viewBox="0 0 24 24" width="30" height="30" fill="white">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>`;

      // Create chat container
      const chatContainer = document.createElement('div');
      chatContainer.className = 'fini-chat-container';
      chatContainer.innerHTML = `
        <div class="fini-chat-header">
          <div class="fini-header-content">
            <h3 style="margin: 0">${this.config.widgetTitle}</h3>
            ${this.config.widgetDescription ? `<p style="margin: 4px 0 0">${this.config.widgetDescription}</p>` : ''}
          </div>
        </div>
        <div class="fini-messages"></div>
        ${this.config.predefinedQuestions.length ? `
          <div class="fini-predefined-questions">
            ${this.config.predefinedQuestions.map(q => 
              `<div class="fini-predefined-question">${q}</div>`
            ).join('')}
          </div>
        ` : ''}
        <div class="fini-input-container">
          <input type="text" class="fini-input" placeholder="Type your message...">
          <button class="fini-send-button">Send</button>
        </div>
      `;

      container.appendChild(launcher);
      container.appendChild(chatContainer);
      return container;
    }

    async connectMessaging() {
      try {
        // Connect to Fini AI's messaging system
        const connection = await this.establishConnection();
        
        // Send connection details to Fini AI
        await this.updateConnectionStatus(connection);
      } catch (error) {
        console.error('Failed to connect to Fini messaging:', error);
      }
    }

    async establishConnection() {
      // Implement connection to Fini AI's messaging system
      return new Promise((resolve) => {
        // Simulate connection establishment
        setTimeout(() => {
          resolve({
            status: 'connected',
            timestamp: new Date().toISOString()
          });
        }, 1000);
      });
    }

    async updateConnectionStatus(connection) {
      try {
        // Update connection status in Fini AI
        await fetch(`${FINI_CONFIG.apiEndpoint}/widget/${FINI_CONFIG.widgetId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: connection.status,
            connectedAt: connection.timestamp,
            domain: window.location.hostname
          })
        });
      } catch (error) {
        console.error('Failed to update connection status:', error);
      }
    }

    initializeEventListeners() {
      const launcher = document.querySelector('.fini-launcher');
      const chatContainer = document.querySelector('.fini-chat-container');
      const input = document.querySelector('.fini-input');
      const sendButton = document.querySelector('.fini-send-button');

      launcher.addEventListener('click', () => {
        chatContainer.classList.add('visible');
        launcher.style.display = 'none';
        if (!this.welcomeMessageShown) {
          this.addMessage(this.config.welcomeMessage, 'received');
          this.welcomeMessageShown = true;
        }
      });

      sendButton.addEventListener('click', () => this.handleSendMessage());
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSendMessage();
      });

      document.querySelectorAll('.fini-predefined-question').forEach(q => {
        q.addEventListener('click', () => {
          input.value = q.textContent;
          this.handleSendMessage();
        });
      });
    }
    

    addMessage(text, type, references = []) {
      const messagesContainer = document.querySelector('.fini-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = `fini-message ${type}`;
      messageDiv.textContent = text;

      if (this.config.showReferences && references.length > 0) {
        const referencesDiv = document.createElement('div');
        referencesDiv.className = 'fini-references';
        referencesDiv.innerHTML = references.map(ref => 
          `<a href="${ref.url}" target="_blank">${ref.title}</a>`
        ).join(', ');
        messageDiv.appendChild(referencesDiv);
      }

      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async handleSendMessage() {
      const input = document.querySelector('.fini-input');
      const message = input.value.trim();
      
      if (message) {
        // Add user message to chat
        this.addMessage(message, 'sent');
        input.value = '';

        try {
          // Send message to Fini AI
          const response = await fetch(`${FINI_CONFIG.apiEndpoint}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              widgetId: FINI_CONFIG.widgetId,
              botId: this.config.botId,
              message
            })
          });

          const data = await response.json();
          
          // Add bot response to chat
          this.addMessage(data.response, 'received', data.references);
        } catch (error) {
          console.error('Failed to send message:', error);
          this.addMessage('Sorry, I encountered an error. Please try again.', 'received');
        }
      }
    }
  }

  // Initialize the widget
  w.finiWidget = new FiniWidget();
})(window, document);