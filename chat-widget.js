// DevOps backup - 3-12-2024:Sigle page contentLoader

(function (w, d) {
  // Text Embedding Utility
  class TextEmbedding {
    constructor(maxTokens = 5000) {
      this.maxTokens = maxTokens;
    }

    // Basic text preprocessing and chunking
    preprocessAndChunk(text) {
      // Clean and preprocess text
      const cleanedText = text
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .replace(/[^\w\s.,!?]/g, '')  // Remove special characters
        .trim()
        .substring(0, this.maxTokens);

      // Simple chunking strategy
      const chunkSize = 500;
      const chunks = [];
      for (let i = 0; i < cleanedText.length; i += chunkSize) {
        chunks.push(cleanedText.slice(i, i + chunkSize));
      }

      return chunks;
    }

    // Placeholder for actual embedding generation
    async generateEmbeddings(chunks) {
      // In a real implementation, this would call an embedding API
      return chunks.map((chunk, index) => ({
        chunkId: index,
        vector: this.simpleEmbeddingVector(chunk)
      }));
    }

    // Simple embedding vector generation (mock implementation)
    simpleEmbeddingVector(text) {
      // Basic vector generation based on text characteristics
      return text.split('').map(char => char.charCodeAt(0))
        .slice(0, 128)  // Limit vector size
        .map(code => code / 255);  // Normalize
    }
  }


  // Advanced Web Content Loader
  class WebContentLoader {
    constructor(url, maxTokens = 5000) {
      this.url = url;
      this.maxTokens = maxTokens;
      this.embeddingUtility = new TextEmbedding(maxTokens);
      this.visitedUrls = new Set();
      this.domainUrls = new Set();
      this.originHostname = new URL(url).hostname;
      this.originProtocol = new URL(url).protocol;
      this.originPort = new URL(url).port || '';
    }
  
    // Method to extract all links from the current page
    async discoverPageLinks(currentDocument) {
      const linkSources = [
        () => {
          // Primary method: use document.links for broader compatibility
          return Array.from(currentDocument.links)
            .map(link => link.href)
            .filter(href => href.trim() !== '');
        },
        () => {
          // Fallback: query selector for all anchor tags
          return Array.from(currentDocument.querySelectorAll('a[href]'))
            .map(a => {
              try {
                // Resolve relative URLs
                return new URL(a.getAttribute('href'), this.url).href;
              } catch {
                return null;
              }
            })
            .filter(href => href !== null);
        }
      ];
  
      let links = [];
      for (const source of linkSources) {
        links = source().filter(href => {
          try {
            const url = new URL(href);
            
            // More permissive URL matching for local development
            const isSameOrigin = 
              url.hostname === this.originHostname &&
              url.protocol === this.originProtocol &&
              url.port === this.originPort;
  
            return (
              isSameOrigin &&
              !this.visitedUrls.has(href) &&
              !href.includes('#') &&
              !href.includes('javascript:') &&
              !href.endsWith('.pdf') &&
              !href.endsWith('.jpg') &&
              !href.endsWith('.png') &&
              !href.endsWith('.gif')
            );
          } catch {
            return false;
          }
        });
  
        if (links.length > 0) break;
      }
  
      console.log(`🔍 WebCrawler Link Discovery:
        - Total Unique Links Found: ${links.length}
        - Links: ${links.join(', ')}`);
  
      return [...new Set(links)];
    }
  
      async crawlWebsite(depth = 10, currentDepth = 0, currentDocument = document) {
        console.log(`🌐 WebCrawler: Crawling ${this.url} (Depth: ${currentDepth})`);
    
        // Prevent infinite recursion and limit total pages
        if (currentDepth >= depth || this.visitedUrls.size >= 100) {
          console.log('🛑 WebCrawler: Reached maximum crawl depth or page limit');
          return Array.from(this.domainUrls);
        }        
    
        try {
          // Extract current page content
          const currentPageContent = await this.extractText(currentDocument);
          
          if (currentPageContent && currentPageContent.length > 200) {
            this.domainUrls.add({
              url: this.url,
              content: currentPageContent
            });
            this.visitedUrls.add(this.url);
            
            console.log(`✅ WebCrawler: Added page ${this.url}
              - Content Length: ${currentPageContent.length} characters`);
          }
    
          // Discover links on the current page
          const pageLinks = await this.discoverPageLinks(currentDocument);
    
          // Recursive crawling of links
          for (const link of pageLinks) {
            if (this.visitedUrls.size >= 20) break;
    
            if (!this.visitedUrls.has(link)) {
              try {
                // Temporarily switch context
                const originalUrl = this.url;
                this.url = link;
    
                // Create a temporary iframe to load and extract content
                const iframe = document.createElement('iframe');
                iframe.src = link;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
    
                await new Promise(resolve => {
                  iframe.onload = async () => {
                    // Switch iframe context
                    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    
                    try {
                      // Load page content
                      const pageContent = await this.extractText(iframeDocument);
                      
                      if (pageContent && pageContent.length > 200) {
                        this.domainUrls.add({
                          url: link,
                          content: pageContent
                        });
                        
                        // Continue crawling recursively
                        await this.crawlWebsite(depth, currentDepth + 1, iframeDocument);
                      }
                    } catch (error) {
                      console.error(`❌ WebCrawler Error in iframe for ${link}:`, error);
                    } finally {
                      document.body.removeChild(iframe);
                      resolve();
                    }
                  };
                });
    
                // Restore original URL
                this.url = originalUrl;
              } catch (error) {
                console.error(`❌ WebCrawler Global Error crawling ${link}:`, error);
              }
            }
          }
    
          return Array.from(this.domainUrls);
        } catch (error) {
          console.error('❌ WebCrawler Catastrophic Error:', error);
          return Array.from(this.domainUrls);
        }
      }
      
      async extractText(currentDocument = document) {
        const extractionMethods = [
          () => this.extractMainContentBySemantics(currentDocument),
          () => this.extractTextByElementTypes(currentDocument),
          () => this.extractTextByTreeWalker(currentDocument),
          () => this.extractEntireBodyText(currentDocument)
        ];
  
        let extractedContent = '';
        for (const extractor of extractionMethods) {
          extractedContent = await extractor();
          
          if (extractedContent && extractedContent.trim().length > 100) {
            console.log(`📄 Content Extraction Success:
              - Method: ${extractor.name}
              - Content Length: ${extractedContent.length} characters`);
            break;
          }
        }
  
        return this.preprocessText(extractedContent);
      }
    
      // New method: extract entire body text as a last resort
      async extractEntireBodyText(currentDocument) {
        return currentDocument.body.innerText || currentDocument.body.textContent || '';
      }

      async extractMainContentBySemantics(currentDocument) {
        const contentSelectors = [
          'main', 'article', '.content', '#content', 
          '.main-content', 'body'
        ];
  
        for (const selector of contentSelectors) {
          const contentElement = currentDocument.querySelector(selector);
          if (contentElement) {
            return contentElement.innerText || contentElement.textContent;
          }
        }
  
        return '';
      }
  
      async extractTextByElementTypes(currentDocument) {
        const importantElements = [
          'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
          'article', 'section', 'div'
        ];
  
        const textParts = [];
        importantElements.forEach(tag => {
          const elements = currentDocument.getElementsByTagName(tag);
          Array.from(elements).forEach(el => {
            const text = el.innerText || el.textContent;
            if (text.trim().length > 10) {
              textParts.push(text);
            }
          });
        });
  
        return textParts.join(' ');
      }
  
      async extractTextByTreeWalker(currentDocument) {
        const walker = currentDocument.createTreeWalker(
          currentDocument.body, 
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
  
        let text = '';
        while(walker.nextNode()) {
          const nodeText = walker.currentNode.textContent.trim();
          if (nodeText.length > 10) {
            text += nodeText + ' ';
          }
        }
  
        return text;
      }
  
      preprocessText(text) {
        return text
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s.,!?]/g, '')
          .trim()
          .substring(0, this.maxTokens);
      }
  
      async processContentEmbedding() {
        const extractedText = await this.extractText();
        const textChunks = this.embeddingUtility.preprocessAndChunk(extractedText);
        return await this.embeddingUtility.generateEmbeddings(textChunks);
      }
    }

  // Existing code from the original script continues here...
  const msalConfig = {
    auth: {
      clientId: "5c366cc7-6259-4ffa-96ab-8b13ac790d67",
      authority: "https://login.microsoftonline.com/b092f630-a3ad-4610-b96e-4a6c75c2a6cc",
    },
  };
  const msalInstance = new msal.PublicClientApplication(msalConfig);
 
  async function checkLoginStatus() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      console.log("User  is already logged in:", accounts);
      // You can use the first account to get an access token if needed
      return accounts[0]; // Return the first account
    } else {
      console.log("User  is not logged in.");
      return null; // No accounts found
    }
  }
 
  async function login() {
    const existingAccount = await checkLoginStatus();
    console.log(existingAccount);
 
    if (existingAccount) {
      console.log("Using existing account:", existingAccount);
      // Optionally, you can acquire a token silently here if needed
      // e.g., await msalInstance.acquireTokenSilent({ account: existingAccount });
    } else {
      try {
        const loginResponse = await msalInstance.loginPopup();
        console.log("Login successful", loginResponse);
        const accessToken = loginResponse.accessToken;
        // Store the access token or use it as needed
      } catch (error) {
        console.error("Login failed", error);
      }
    }
  }
 
  const widgetOptions = w.intellientoptions || { mode: "widget" };
  const mode = widgetOptions.mode || "widget";
  const widgetId = widgetOptions.widgetId;
  console.log("widgetId", widgetId);
  console.log(" window.location.href", window.location.href);
 
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

.ask-intellient-title {
      display: block;
      font-size: 20px;
      margin: 0;
      font-weight: bold;
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
 
  // Add this at the top of your script
let conversationHistory = [];
let personaData = []; // Default empty array
let abortController;
 
  async function persona() {
    try {
      const response = await fetch(
        //"http://localhost:3000/api/link-widget/intellibots",
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
  // Updated code - Intellient UAT
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

  // Modified scrapeWebsiteContent function
  async function scrapeWebsiteContent(url) {
    try {
      const contentLoader = new WebContentLoader(url);
      
      // Detect homepage conditions
      const isHomepage = 
        url === window.location.origin + '/' || 
        url === window.location.origin;
  
      if (isHomepage) {
        console.log('🏠 Homepage detected - initiating comprehensive website crawl');
        const crawledContent = await contentLoader.crawlWebsite();
        
        console.log(`🕸️ Web Crawling Results:
          - Total Pages Crawled: ${crawledContent.length}
          - Crawled Page URLs: ${crawledContent.map(page => page.url).join(', ')}`);
  
        // Combine contents from all crawled pages
        const combinedContent = crawledContent
          .map(page => `URL: ${page.url}\n\nContent:\n${page.content}`)
          .join('\n\n---\n\n');
  
        console.log(`📊 Combined Content Stats:
          - Total Combined Content Length: ${combinedContent.length} characters`);
  
        return combinedContent;
      } else {
        // For non-homepage, use existing extraction method
        const websiteContent = await contentLoader.extractText();
        
        console.log(`📄 Single Page Content Extraction:
          - URL: ${url}
          - Content Length: ${websiteContent.length} characters
          - First 300 chars: ${websiteContent.substring(0, 300)}...`);
  
        return websiteContent;
      }
    } catch (error) {
      console.error('❌ Advanced website content crawling error:', error);
      return '';
    }
  }
  
  // Modified streamFromAzureOpenAI function remains the same as in your original code
  async function streamFromAzureOpenAI(
    userMessage,
    messageElement,
    intelliBot
  ) {
    abortController = new AbortController();
    const { signal } = abortController;
  
    // Attempt to get the current website URL
    const currentWebsiteUrl = window.location.href;
  
    // Scrape website content if applicable
    const websiteContent = await scrapeWebsiteContent(currentWebsiteUrl);
  
    // Prepare context-aware prompt
    const contextAwarePrompt = websiteContent 
      ? `Context from ${currentWebsiteUrl}: ${websiteContent}\n\nUser Query: ${userMessage}`
      : userMessage;
  
    conversationHistory.push({ role: "user", content: contextAwarePrompt });
  
    try {
      const response = await fetch(
        "https://intellientuat.azurewebsites.net/api/link-widget",
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userMessage: contextAwarePrompt,
            filteredBot: intelliBot ? personaData.filter((name) => name.name === intelliBot) : null,
            conversationHistory,
            websiteUrl: currentWebsiteUrl
          }),
          signal,
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("responses", data);
      const contentSpan = messageElement.querySelector(".fini-message-content");
  
      if (data.choices && data.choices[0]?.message?.content) {
        let content = data.choices[0].message.content;
        console.log("content", content);
  
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
              messagesContainer.clientHeight 
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



  function logout() {
    msalInstance.logout();
  }
  async function createChatWidget() {
    let response =await persona();
    const validatedLogo = await validateLogo(branding.logo);
 
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
      //login();
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
        // console.log("accounts", accounts);
 
        //if (checkLoginStatus()) {
          await streamFromAzureOpenAI(
            message,
            assistantMessage,
            "Context-Scraper"
          );
        // } else {
        //   try {
        //     instance.loginPopup();
        //   } catch {
        //     console.log("login error");
        //   }
        // }
        // addMessage("", true);
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
 
    messageInput.addEventListener("input", async () => {
      const message = messageInput.value.trim();
 
      // Check if the input contains a name or meets specific conditions
      if (message) {
        if (message.includes("@")) {
          // let response = await persona();
 
          const data = response.response;
          console.log("intellibot resposnes", data); // Replace with the actual function you want to call
          nameDropdown.innerHTML = "";
          nameDropdown.style.display = "block";
          data.forEach((item) => {
            const nameItem = document.createElement("div");
            nameItem.textContent = item.name; // Assuming 'name' is the field you want to display
            nameItem.style.padding = "8px";
            nameItem.style.cursor = "pointer";
 
            // Add click event to insert the name into the input field
            nameItem.addEventListener("click", () => {
              const tagName = item.name; // Get the name from the item
              // Create a tag element
              const tagElement = document.createElement("span");
              tagElement.className = "tag"; // You can style this class in your CSS
              tagElement.textContent = `@${tagName}`;
 
              // Append the tag to the chat container (or wherever you want)
              const tagContainer = document.getElementById("tag-container");
              tagContainer.appendChild(tagElement);
 
              // Optionally, you can add functionality to remove the tag if needed
              tagElement.addEventListener("click", () => {
                tagContainer.removeChild(tagElement);
              });
 
              messageInput.value = ""; // Clear the input field
              nameDropdown.style.display = "none";
            });
 
            nameDropdown.appendChild(nameItem);
          });
        }
      } else {
        nameDropdown.style.display = "none";
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
