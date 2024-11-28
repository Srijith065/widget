(function (w, d) {
  const widgetOptions = w.finiWidgetOptions || { mode: "widget" };
  const mode = widgetOptions.mode || "widget";
  const widgetId = widgetOptions.widgetId;
  
  // New configuration for URL-based content retrieval
  const CONTENT_SOURCES = widgetOptions.contentSources || [];
 
  // if (widgetId !== window.location.href) {
  //   console.error("Widget ID is required but not provided.");
  //   return; // Prevent further execution
  // }
 
  // Default branding
  const DEFAULT_LOGO =
    "https://delightful-beach-07c9da51e.5.azurestaticapps.net/widget-logo.png"; // Default Logo - Intellient
  const DEFAULT_THEME = {
    primaryColor: "#0084ff",
    secondaryColor: "#f0f2f5",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };
 
  // Get customer branding or use defaults
  const branding = {
    logo: widgetOptions.branding?.logo || DEFAULT_LOGO,
    theme: {
      primaryColor:
        widgetOptions.branding?.theme?.primaryColor ||
        DEFAULT_THEME.primaryColor,
      secondaryColor:
        widgetOptions.branding?.theme?.secondaryColor ||
        DEFAULT_THEME.secondaryColor,
      fontFamily:
        widgetOptions.branding?.theme?.fontFamily || DEFAULT_THEME.fontFamily,
    },
  };
 
  // Styles for the widget
  const styles = `
    .fini-widget-base {
      font-family: ${branding.theme.fontFamily};
      z-index: 999999;
    }
 
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
 
    .fini-chat-header {
      padding: 16px;
      background: ${branding.theme.primaryColor};
      color: white;
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
      fill: white;
    }
 
    .fini-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: ${branding.theme.secondaryColor};
    }
 
    .fini-chat-message {
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
      background: ${branding.theme.primaryColor};
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
      background: ${branding.theme.primaryColor};
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
        .ask-intellient-title {
    display: block;
    font-size: 20px;
    margin: 0;
    font-weight: bold;
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
 
#name-dropdown {
    display: none;
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    z-index: 1000;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
 
#name-dropdown div {
    padding: 10px;
    cursor: pointer;
    transition: background 0.3s;
}
 
#name-dropdown div:hover {
    background-color: #f0f0f0;
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
 
 
 
    .fini-typing-dot:nth-child(1) { animation-delay: 0s; }
    .fini-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .fini-typing-dot:nth-child(3) { animation-delay: 0.4s; }
 
    @keyframes typing-animation {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  `;
 
  // Create and inject stylesheet
  const styleSheet = d.createElement("style");
  styleSheet.textContent = styles;
  d.head.appendChild(styleSheet);
 
  // Function to validate logo URL
  function validateLogo(logoUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        console.warn("Logo loading timed out, using default");
        resolve(DEFAULT_LOGO);
      }, 5000);
 
      img.onload = () => {
        clearTimeout(timeout);
        resolve(logoUrl);
      };
 
      img.onerror = () => {
        clearTimeout(timeout);
        console.warn("Logo failed to load, using default");
        resolve(DEFAULT_LOGO);
      };
 
      img.src = logoUrl;
    });
  }
 
  let personaData;
 
  async function persona() {
    try {
      const response = await fetch(
        "https://intellientuat.azurewebsites.net/api/link-widget/intellibots",
        {
          method: "GET",
        }
      );
      const data = await response.json();
      personaData = data.response;
      return data;
    } catch {
      console.log("error from persona getmethod");
    }
  }
 
  function markdownToHtml(markdown) {
    // Convert **bold** to <strong>
    markdown = markdown.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
 
    // Convert *italic* to <em>
    markdown = markdown.replace(/\*(.*?)\*/g, "<em>$1</em>");
 
    // Convert - list items to <ul><li>
    markdown = markdown.replace(/^\s*-\s+(.*)$/g, "<ul><li>$1</li></ul>");
 
    // Handle line breaks
    markdown = markdown.replace(/\n/g, "<br>");
 
    return markdown;
  }
 
  // Updated code - Intellient UAT
  let abortController = null;
  let conversationHistory = [];
   // New function to retrieve content from URLs using a proxy approach
   // New function to retrieve content from URLs using a proxy approach
   async function retrieveWebsiteContent(url) {
    try {
      const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`, {
        method: 'GET',
        headers: {
          'Origin': window.location.origin
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
  
      // Advanced content extraction
      function extractRelevantContent() {
        // Define key sections and their extraction strategies
        const contentStrategies = [
          // Company Overview
          {
            keywords: ['about', 'overview', 'company', 'who we are'],
            extractor: () => {
              const selectors = [
                'section.about', 
                '.company-overview', 
                '#about', 
                'div.about-us', 
                'p.company-description'
              ];
              
              for (const selector of selectors) {
                const element = doc.querySelector(selector);
                if (element) return element.textContent.trim();
              }
              
              // Fallback to first few paragraphs
              const paragraphs = doc.querySelectorAll('p');
              return Array.from(paragraphs)
                .slice(0, 3)
                .map(p => p.textContent.trim())
                .join(' ');
            }
          },
          // Awards and Achievements
          {
            keywords: ['awards', 'achievements', 'recognitions', 'global', 'national'],
            extractor: () => {
              const awardSelectors = [
                '.awards-section',
                '#awards',
                '.achievements',
                'div.company-awards'
              ];
  
              const awardPatterns = [
                /(\d+)\s*Global\s*Awards\s*\|\s*(\d+)\s*National\s*Awards/i,
                /Global\s*Awards:\s*(\d+).*National\s*Awards:\s*(\d+)/i,
                /Awards\s*Won:\s*(\d+)\s*Global\s*\|\s*(\d+)\s*National/i
              ];
  
              // Check selectors first
              for (const selector of awardSelectors) {
                const element = doc.querySelector(selector);
                if (element) {
                  const text = element.textContent.trim();
                  for (const pattern of awardPatterns) {
                    const match = text.match(pattern);
                    if (match) {
                      return `Quadra Systems has won ${match[1]} Global Awards and ${match[2]} National Awards.`;
                    }
                  }
                }
              }
  
              // Scan entire document
              const documentText = doc.body.textContent;
              for (const pattern of awardPatterns) {
                const match = documentText.match(pattern);
                if (match) {
                  return `Quadra Systems has won ${match[1]} Global Awards and ${match[2]} National Awards.`;
                }
              }
  
              return "Award information not found on the website.";
            }
          },
          // Services
          {
            keywords: ['services', 'what we do', 'solutions', 'offerings'],
            extractor: () => {
              const serviceSelectors = [
                'section.services',
                '.our-services',
                '#services',
                'div.service-list'
              ];
  
              for (const selector of serviceSelectors) {
                const element = doc.querySelector(selector);
                if (element) return element.textContent.trim();
              }
  
              // Fallback to finding service-related text
              const serviceElements = [...doc.querySelectorAll('h2, h3')]
                .filter(el => /services|solutions|offerings/i.test(el.textContent));
              
              if (serviceElements.length > 0) {
                return serviceElements
                  .map(el => el.textContent + 
                    (el.nextElementSibling ? el.nextElementSibling.textContent : '')
                  )
                  .join(' ');
              }
  
              return "Service information not found on the website.";
            }
          },
          // Contact Information
          {
            keywords: ['contact', 'location', 'address', 'phone', 'email'],
            extractor: () => {
              const contactSelectors = [
                '.contact-info',
                '#contact',
                'div.company-contact',
                'section.contact'
              ];
  
              const contactPatterns = [
                /(?:Phone|Tel):\s*([\+\d\s-]+)/i,
                /(?:Email):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
                /Address:\s*(.+?)(?:\n|\r|$)/i
              ];
  
              // Check specific selectors
              for (const selector of contactSelectors) {
                const element = doc.querySelector(selector);
                if (element) {
                  const text = element.textContent.trim();
                  const contactInfo = contactPatterns
                    .map(pattern => text.match(pattern))
                    .filter(match => match)
                    .map(match => match[0]);
                  
                  return contactInfo.length > 0 
                    ? contactInfo.join(', ') 
                    : "Detailed contact information not found.";
                }
              }
  
              // Scan entire document
              const documentText = doc.body.textContent;
              const contactInfo = contactPatterns
                .map(pattern => documentText.match(pattern))
                .filter(match => match)
                .map(match => match[0]);
  
              return contactInfo.length > 0 
                ? contactInfo.join(', ') 
                : "Contact information not found on the website.";
            }
          }
        ];
  
        // Find the most relevant content based on user query
        return contentStrategies;
      }
  
      return {
        fullText: htmlText,
        extractionStrategies: extractRelevantContent()
      };
    } catch (error) {
      console.error(`Error fetching content from ${url}:`, error);
      return `Unable to retrieve content from ${url}. Error: ${error.message}`;
    }
  }
  
  async function streamFromAzureOpenAI(
    userMessage,
    messageElement,
    intelliBot
  ) {
    abortController = new AbortController();
    const { signal } = abortController;
  
    // Retrieve content from configured URLs
    let additionalContext = "";
    let extractionStrategies = [];
  
    for (const source of CONTENT_SOURCES) {
      const sourceContent = await retrieveWebsiteContent(source);
      
      // If it's an object with extraction strategies
      if (typeof sourceContent === 'object' && sourceContent.extractionStrategies) {
        extractionStrategies = sourceContent.extractionStrategies;
        
        // Find most relevant content for the user's query
        const relevantExtractors = extractionStrategies.filter(strategy => 
          strategy.keywords.some(keyword => 
            userMessage.toLowerCase().includes(keyword)
          )
        );
  
        // If specific extractors found, use them
        if (relevantExtractors.length > 0) {
          for (const extractor of relevantExtractors) {
            additionalContext += `\n\n${extractor.extractor()}`;
          }
        } else {
          // Fallback to first extractor if no specific match
          additionalContext += `\n\n${extractionStrategies[0].extractor()}`;
        }
      } else {
        additionalContext += `\n\n${sourceContent}`;
      }
    }
  
    // Enhanced prompt to encourage precise extraction
    const enhancedUserMessage = `
  Context: You have additional information about the organization from its website.
  
  User Query: ${userMessage}
  
  Additional Website Context:
  ${additionalContext}
  
  Instructions:
  - Carefully review the additional context
  - Provide a precise answer based on the website information
  - If the exact information is not found, suggest checking the website directly
  - Focus on extracting the most relevant and accurate information
  
  Please answer the question using only the information available in the provided context.`;
  
    conversationHistory.push({ role: "user", content: enhancedUserMessage });
  
    // Existing stream logic remains the same
    try {
      const response = await fetch(
        "https://intellientuat.azurewebsites.net/api/link-widget",
        {
          method: "POST",
          body: JSON.stringify({
            userMessage: enhancedUserMessage,
            filteredBot: intelliBot ? personaData.filter((name) => name.name === intelliBot) : null,
            conversationHistory,
          }),
          signal,
        }
      );
 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
 
      const data = await response.json();
      console.log("resposnes", data);
      const contentSpan = messageElement.querySelector(".fini-message-content");
 
      if (data.choices && data.choices[0]?.message?.content) {
        let content = data.choices[0].message.content;
        console.log("contemt", content);
 
        content = markdownToHtml(content);
        let displayedContent = "";
        const contentArray = content.split("");
 
        const messagesContainer = document.getElementById("finiChatMessages");
 
        // Flag to check if the user has scrolled up
        let userScrolledUp = false;
 
        messagesContainer.addEventListener("scroll", () => {
          const isAtBottom =
            messagesContainer.scrollHeight -
              messagesContainer.scrollTop -
              messagesContainer.clientHeight <
            10; // Adjust threshold as needed
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
            return; // Exit the function early if the request is aborted
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
        throw new Error("No content in response");
      }
    } catch (error) {
      // Existing error handling remains the same
      if (error.name === "AbortError") {
        messageElement.querySelector(".fini-message-content").textContent =
          "Response Stopped...";
        console.log("Stream was aborted by user.");
      } else {
        console.error("Error:", error);
        messageElement.querySelector(".fini-message-content").textContent =
          "Sorry, there was an error processing your request. Please try again later.";
      }
    }
  }
 
  async function createChatWidget() {
    const validatedLogo = await validateLogo(branding.logo);
    await persona();
    // Create launcher
    const launcher = d.createElement("div");
    launcher.className = "fini-widget-base fini-chat-launcher";
    launcher.innerHTML = `<img src="${validatedLogo}" alt="Chat">`;
 
    // Create chat container
    const chatContainer = d.createElement("div");
    chatContainer.className = "fini-widget-base fini-chat-container";
    chatContainer.innerHTML = `
      <div class="fini-chat-header">
        <img src="${validatedLogo}" alt="Assistant" class="fini-chat-avatar">
           <label class="ask-intellient-title">Ask Intellient</label>
        <div class="fini-chat-close">
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        </div>
      </div>
      <div class="fini-chat-messages" id="finiChatMessages">
        <div class="fini-chat-message received">
          <img src="${validatedLogo}" alt="Assistant" class="fini-chat-avatar">
          <div class="fini-message-content">Welcome! How can I help you today?</div>
          <div class="fini-timestamp">${new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}</div>
        </div>
      </div>
     
              <div id="name-dropdown" style="display: none; position: absolute; background: white; border: 1px solid #ccc; z-index: 1000;"></div>
 
              <div id="tag-container" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px;"></div>
 
      <div class="fini-chat-input">
        <input type="text" id="finiChatInput" placeholder="Type a message...">
        <button id="finiChatSend">
          <svg viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
           <button id="finiChatStop">
         <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="red" />
    <rect x="7" y="7" width="10" height="10" fill="white" />
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
 
    // Setup message handling
    const messageInput = d.getElementById("finiChatInput");
    const nameDropdown = document.getElementById("name-dropdown");
    const sendButton = d.getElementById("finiChatSend");
    const stopButton = d.getElementById("finiChatStop");
    stopButton.style.display = "none";
 
    async function sendMessage() {
      let intellibotName = "";
      const tagContainer = document.getElementById("tag-container");
      const tags = tagContainer.getElementsByClassName("tag");
      if (tags.length !== 0) {
        intellibotName = tags[0].textContent.slice(1);
      }
 
      const message = messageInput.value.trim();
      console.log("messages", message);
      console.log("intellibotName", intellibotName);
 
      if (message) {
        sendButton.style.display = "none";
        stopButton.style.display = "flex";
        messageInput.disabled = true;
        sendButton.disabled = true;
 
        // Add user message
        addMessage(message, true);
        messageInput.value = "";
 
        // Add assistant message
        const assistantMessage = addMessage("", false);
        console.log("assistantMessage", assistantMessage);
 
        await streamFromAzureOpenAI(message, assistantMessage, "QudraInfo");
 
        messageInput.disabled = false;
        sendButton.disabled = false;
        sendButton.style.display = "flex";
        stopButton.style.display = "none";
        messageInput.focus();
      }
    }
 
    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
 
    // Hide dropdown when clicking outside
    document.addEventListener("click", (event) => {
      if (
        !nameDropdown.contains(event.target) &&
        event.target !== messageInput
      ) {
        nameDropdown.style.display = "none"; // Hide dropdown
      }
    });
 
    stopButton.addEventListener("click", () => {
      if (abortController) {
        abortController.abort(); // Abort the ongoing fetch request
        stopButton.style.display = "none"; // Hide the stop button after stopping the stream
        console.log("Streaming process stopped.");
      }
    });
  }
 
  function addMessage(text, isSent) {
    const container = d.getElementById("finiChatMessages");
    const messageDiv = d.createElement("div");
    messageDiv.className = `fini-chat-message ${isSent ? "sent" : "received"}`;
 
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
 
    if (!isSent) {
      messageDiv.innerHTML = `
      <img src="${branding.logo}" alt="Assistant" class="fini-chat-avatar">
      <div class="fini-message-content">
        ${
          text ||
          `<div class="fini-typing-indicator">
          <div class="fini-typing-dot"></div>
          <div class="fini-typing-dot"></div>
          <div class="fini-typing-dot"></div>
        </div>`
        }
      </div>
      <div class="fini-timestamp">${timestamp}</div>
    `;
    } else {
      messageDiv.innerHTML = `
        <div class="fini-message-content">${text}</div>
        <div class="fini-timestamp">${timestamp}</div>
      `;
    }
 
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    return messageDiv;
  }
 
  // Initialize based on mode
  if (mode === "widget") {
    createChatWidget();
  }
})(window, document);
 
