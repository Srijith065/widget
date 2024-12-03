// Crawl sites - Devops:

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
      this.originUrl = new URL(url);
      this.crawlStartTime = Date.now();
      this.MAX_CRAWL_TIME = 30000; // 30 seconds max crawl time
      this.MAX_PAGES = 150; // Increased page limit
      this.MAX_DEPTH = 5; // Reasonable depth limit
    }
  
    // Improved URL validation and filtering
    isValidUrl(href, currentUrl) {
      try {
        const url = new URL(href, currentUrl);
        
        // Strict origin matching with additional conditions
        const isSameOrigin = 
          url.hostname === this.originUrl.hostname &&
          url.protocol === this.originUrl.protocol;
  
        // More comprehensive invalid extension list
        const invalidExtensions = [
          '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', 
          '.doc', '.docx', '.xlsx', '.pptx', '.zip', '.rar', 
          '.mp3', '.mp4', '.avi', '.mov', '.webm'
        ];
  
        return (
          isSameOrigin &&
          !this.visitedUrls.has(url.href) &&
          !url.href.includes('#') &&
          !url.href.includes('javascript:') &&
          !invalidExtensions.some(ext => url.href.toLowerCase().endsWith(ext)) &&
          url.protocol.startsWith('http') &&
          // Exclude login, admin, and other non-content pages
          !url.pathname.match(/\/(login|admin|wp-admin|dashboard)/)
        );
      } catch {
        return false;
      }
    }
  
    async discoverPageLinks(currentDocument, baseUrl) {
      const linkSources = [
        () => Array.from(currentDocument.links).map(link => link.href),
        () => Array.from(currentDocument.querySelectorAll('a[href]'))
          .map(a => a.getAttribute('href'))
      ];
  
      let links = [];
      for (const source of linkSources) {
        links = source()
          .filter(href => href && this.isValidUrl(href, baseUrl))
          .map(href => new URL(href, baseUrl).href);
  
        if (links.length > 0) break;
      }
  
      console.log(`🔍 WebCrawler Link Discovery:
        - Total Unique Links Found: ${links.length}`);
  
      return [...new Set(links)];
    }
  
    async crawlWebsite(depth = 0, currentDocument = document) {
      // Check crawl constraints
      const elapsedTime = Date.now() - this.crawlStartTime;
      if (
        depth >= this.MAX_DEPTH || 
        this.visitedUrls.size >= this.MAX_PAGES || 
        elapsedTime >= this.MAX_CRAWL_TIME
      ) {
        console.log(`🛑 WebCrawler Stopped:
          - Max Depth: ${depth >= this.MAX_DEPTH}
          - Max Pages: ${this.visitedUrls.size >= this.MAX_PAGES}
          - Time Limit: ${elapsedTime >= this.MAX_CRAWL_TIME}`);
        
        return Array.from(this.domainUrls);
      }
  
      try {
        // Skip if already visited
        if (this.visitedUrls.has(this.url)) {
          return Array.from(this.domainUrls);
        }
  
        // Extract current page content with multiple strategies
        const currentPageContent = await this.extractText(currentDocument);
        
        if (currentPageContent && currentPageContent.length > 200) {
          this.domainUrls.add({
            url: this.url,
            content: currentPageContent,
            depth: depth
          });
          this.visitedUrls.add(this.url);
          
          console.log(`✅ WebCrawler: Added page ${this.url}
            - Content Length: ${currentPageContent.length} characters
            - Crawl Depth: ${depth}`);
        }
  
        // Discover and process links
        const pageLinks = await this.discoverPageLinks(currentDocument, this.url);
  
        // Recursive crawling with depth and limit tracking
        for (const link of pageLinks) {
          if (
            this.visitedUrls.size >= this.MAX_PAGES || 
            Date.now() - this.crawlStartTime >= this.MAX_CRAWL_TIME
          ) break;
  
          if (!this.visitedUrls.has(link)) {
            try {
              // Temporary context switch
              const originalUrl = this.url;
              this.url = link;
  
              // Create iframe for content loading
              const iframe = document.createElement('iframe');
              iframe.src = link;
              iframe.style.display = 'none';
              document.body.appendChild(iframe);
  
              await new Promise(resolve => {
                iframe.onload = async () => {
                  const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
  
                  try {
                    // Recursive crawl with increased depth
                    await this.crawlWebsite(depth + 1, iframeDocument);
                  } catch (error) {
                    console.error(`❌ WebCrawler Iframe Error for ${link}:`, error);
                  } finally {
                    document.body.removeChild(iframe);
                    resolve();
                  }
                };
              });
  
              // Restore original URL
              this.url = originalUrl;
            } catch (error) {
              console.error(`❌ WebCrawler Error crawling ${link}:`, error);
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
        // More selective text extraction
        const relevantSelectors = [
          'body', 'main', 'article', '#content', 
          '.content', '.main-content', '#main-content'
        ];
  
        for (const selector of relevantSelectors) {
          const contentElement = currentDocument.querySelector(selector);
          if (contentElement) {
            // Remove script, style, and other non-content elements
            const clonedContent = contentElement.cloneNode(true);
            const elementsToRemove = clonedContent.querySelectorAll('script, style, nav, header, footer');
            elementsToRemove.forEach(el => el.remove());
  
            return clonedContent.innerText || clonedContent.textContent || '';
          }
        }
  
        return currentDocument.body.innerText || currentDocument.body.textContent || '';
      }

      async extractMainContentBySemantics(currentDocument) {
        const contentSelectors = [
          'main', 'article', '.content', '#content', 
          '.main-content', '.page-content', '#page-content',
          '.entry-content', '#entry-content'
        ];
  
        for (const selector of contentSelectors) {
          const contentElement = currentDocument.querySelector(selector);
          if (contentElement) {
            // Remove unnecessary nested elements
            const clonedContent = contentElement.cloneNode(true);
            const unnecessaryElements = clonedContent.querySelectorAll('nav, header, footer, aside, .sidebar, .comment');
            unnecessaryElements.forEach(el => el.remove());
  
            return clonedContent.innerText || clonedContent.textContent;
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
            // More strict filtering
            if (text.trim().length > 30 && 
                !text.toLowerCase().includes('navigation') && 
                !text.toLowerCase().includes('menu')) {
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
          // More selective text gathering
          if (nodeText.length > 30 && 
              !nodeText.toLowerCase().includes('menu') && 
              !nodeText.toLowerCase().includes('navigation')) {
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

  // Add WebsiteContentCache class for managing crawled content
  class WebsiteContentCache {
    constructor() {
      this.cachedContent = {};
    }

    async getCachedContent(url) {
      // Check if content is already cached
      if (this.cachedContent[url]) {
        console.log('📦 Returning cached content for:', url);
        return this.cachedContent[url];
      }
      return null;
    }

    async cacheWebsiteContent(url, content) {
      // Store crawled content with timestamp
      this.cachedContent[url] = {
        content: content,
        timestamp: Date.now()
      };
      
      // Optional: Persist to localStorage for longer-term storage
      try {
        localStorage.setItem(`intellient_cache_${url}`, JSON.stringify({
          content: content,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Could not save to localStorage:', error);
      }
    }

    isCacheValid(url, maxAgeHours = 24) {
      const cachedItem = this.cachedContent[url] || 
        JSON.parse(localStorage.getItem(`intellient_cache_${url}`));
      
      if (!cachedItem) return false;

      const maxAgeMilliseconds = maxAgeHours * 60 * 60 * 1000;
      return (Date.now() - cachedItem.timestamp) < maxAgeMilliseconds;
    }
  }

  // Modified scrapeWebsiteContent function
  async function scrapeWebsiteContent(url) {
    const websiteContentCache = new WebsiteContentCache();

    try {
      // Check for valid cached content first
      if (websiteContentCache.isCacheValid(url)) {
        const cachedContent = await websiteContentCache.getCachedContent(url);
        if (cachedContent) return cachedContent.content;
      }

      const contentLoader = new WebContentLoader(url);
      
      const isHomepage = 
        url === window.location.origin + '/' || 
        url === window.location.origin ||
        url.replace(/\/$/, '') === window.location.origin;
  
      if (isHomepage) {
        console.log('🏠 Homepage detected - initiating comprehensive website crawl');
        const crawledContent = await contentLoader.crawlWebsite();
        
        console.log(`🕸️ Web Crawling Results:
          - Total Pages Crawled: ${crawledContent.length}
          - Crawled Page URLs: ${crawledContent.map(page => page.url).join(', ')}`);
  
        const combinedContent = crawledContent
          .sort((a, b) => a.depth - b.depth)
          .map(page => `URL: ${page.url}\n\nContent:\n${page.content}`)
          .join('\n\n---\n\n');
  
        console.log(`📊 Combined Content Stats:
          - Total Combined Content Length: ${combinedContent.length} characters`);

        // Cache the combined content
        await websiteContentCache.cacheWebsiteContent(url, combinedContent);
  
        return combinedContent;
      } else {
        const websiteContent = await contentLoader.extractText();
        
        console.log(`📄 Single Page Content Extraction:
          - URL: ${url}
          - Content Length: ${websiteContent.length} characters
          - First 300 chars: ${websiteContent.substring(0, 300)}...`);

        // Cache the single page content
        await websiteContentCache.cacheWebsiteContent(url, websiteContent);
  
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
  
    const currentWebsiteUrl = window.location.href;
  
    const websiteContent = await scrapeWebsiteContent(currentWebsiteUrl);
  
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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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
  
        let userScrolledUp = false;
  
        messagesContainer.addEventListener("scroll", () => {
          const isAtBottom =
            messagesContainer.scrollHeight -
              messagesContainer.scrollTop -
              messagesContainer.clientHeight 
            10;
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
        throw new Error("No content in response or unexpected response format");
      }
    } catch (error) {
      console.error("Detailed Error:", error);
      
      if (error.name === "AbortError") {
        messageElement.querySelector(".fini-message-content").textContent =
          "Response Stopped...";
      } else {
        messageElement.querySelector(".fini-message-content").textContent =
          `Error: ${error.message}. Please try again.`;
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
