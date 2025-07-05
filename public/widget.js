(function() {
  'use strict';

  // Get the script tag and extract configuration
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  // Sanitize and validate inputs
  const sanitizeAttribute = (value, allowedValues, defaultValue) => {
    if (!value) return defaultValue;
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    return allowedValues.includes(sanitized) ? sanitized : defaultValue;
  };

  const chatbotId = currentScript.getAttribute('data-chatbot-id');
  const position = sanitizeAttribute(
    currentScript.getAttribute('data-position'),
    ['bottom-right', 'bottom-left'],
    'bottom-right'
  );
  const size = sanitizeAttribute(
    currentScript.getAttribute('data-size'),
    ['small', 'medium', 'large'],
    'medium'
  );
  const theme = sanitizeAttribute(
    currentScript.getAttribute('data-theme'),
    ['light', 'dark', 'auto'],
    'light'
  );
  
  if (!chatbotId) {
    console.error('Chatbot Widget Error: data-chatbot-id attribute is required');
    return;
  }

  // Validate chatbot ID format
  const chatbotIdRegex = /^[a-zA-Z0-9-_]+$/;
  if (!chatbotIdRegex.test(chatbotId)) {
    console.error('Chatbot Widget Error: Invalid chatbot ID format');
    return;
  }

  // Get the base URL from the script source
  const scriptSrc = currentScript.src;
  const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

  // Widget configuration
  const config = {
    chatbotId: chatbotId,
    position: position,
    size: size,
    theme: theme,
    baseUrl: baseUrl
  };

  // Size configurations
  const sizes = {
    small: { width: '350px', height: '500px', buttonSize: '50px' },
    medium: { width: '400px', height: '600px', buttonSize: '60px' },
    large: { width: '500px', height: '700px', buttonSize: '70px' }
  };

  // Position configurations
  const positions = {
    'bottom-right': { bottom: '20px', right: '20px', left: 'auto', top: 'auto' },
    'bottom-left': { bottom: '20px', left: '20px', right: 'auto', top: 'auto' }
  };

  // Prevent duplicate widget instances
  if (window.ChatbotWidget && window.ChatbotWidget._initialized) {
    console.warn('Chatbot Widget: Widget already initialized on this page');
    return;
  }

  // Create widget styles
  const styles = `
    .chatbot-widget-container {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .chatbot-widget-button {
      width: ${sizes[size].buttonSize};
      height: ${sizes[size].buttonSize};
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .chatbot-widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }
    
    .chatbot-widget-button svg {
      width: 60%;
      height: 60%;
      fill: white;
    }
    
    .chatbot-widget-button .notification-dot {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 12px;
      height: 12px;
      background-color: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.7;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    .chatbot-widget-iframe-container {
      position: relative;
      width: ${sizes[size].width};
      height: ${sizes[size].height};
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    
    .chatbot-widget-iframe-container.open {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    
    .chatbot-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    .chatbot-widget-close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 35px;
      height: 35px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(0, 0, 0, 0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    .chatbot-widget-close:hover {
      background: rgba(255, 255, 255, 1);
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    
    .chatbot-widget-close svg {
      width: 18px;
      height: 18px;
      fill: #333;
    }

    @media (max-width: 480px) {
      .chatbot-widget-iframe-container {
        width: calc(100vw - 20px);
        height: calc(100vh - 80px);
        right: 10px;
        left: 10px;
        bottom: 70px;
        margin: 0 auto;
      }
    }
  `;

  // Create and inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create widget container
  const container = document.createElement('div');
  container.className = 'chatbot-widget-container';
  Object.assign(container.style, positions[position]);

  // Create chat button
  const button = document.createElement('button');
  button.className = 'chatbot-widget-button';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.5 15.57 3.36 17.03L2.04 21.96L6.97 20.64C8.43 21.5 10.15 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.35 20 8.82 19.54 7.52 18.76L7.2 18.58L3.58 19.58L4.58 15.96L4.4 15.64C3.62 14.34 3.16 12.81 3.16 11.16C3.16 6.62 6.62 3.16 11.16 3.16C15.7 3.16 19.16 6.62 19.16 11.16C19.16 15.7 15.7 19.16 11.16 19.16Z"/>
      <path d="M8 8H16V10H8V8ZM8 11H16V13H8V11ZM8 14H13V16H8V14Z"/>
    </svg>
    <span class="notification-dot"></span>
  `;

  // Create iframe container
  const iframeContainer = document.createElement('div');
  iframeContainer.className = 'chatbot-widget-iframe-container';
  iframeContainer.style.display = 'none';

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'chatbot-widget-close';
  closeButton.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  `;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.className = 'chatbot-widget-iframe';
  iframe.src = `${config.baseUrl}/chat?chatbotId=${config.chatbotId}&embed=true&theme=${config.theme}`;
  iframe.title = 'Chatbot Widget';

  // Assemble the widget
  iframeContainer.appendChild(closeButton);
  iframeContainer.appendChild(iframe);
  container.appendChild(button);
  container.appendChild(iframeContainer);

  // Add event listeners
  let isOpen = false;

  button.addEventListener('click', function() {
    if (!isOpen) {
      iframeContainer.style.display = 'block';
      setTimeout(() => {
        iframeContainer.classList.add('open');
      }, 10);
      isOpen = true;
      // Remove notification dot when opened
      const dot = button.querySelector('.notification-dot');
      if (dot) {
        dot.style.display = 'none';
      }
    }
  });

  closeButton.addEventListener('click', function() {
    iframeContainer.classList.remove('open');
    setTimeout(() => {
      iframeContainer.style.display = 'none';
    }, 300);
    isOpen = false;
  });

  // Listen for messages from iframe (optional - for advanced features)
  window.addEventListener('message', function(event) {
    // Verify origin
    if (event.origin !== config.baseUrl) return;

    // Validate message structure
    if (!event.data || typeof event.data !== 'object') return;

    // Handle different message types
    switch (event.data.type) {
      case 'chatbot-minimize':
      case 'close-chatbot':
        closeButton.click();
        break;
      case 'chatbot-resize':
        // Future feature: dynamic resizing
        break;
      default:
        // Ignore unknown message types
        break;
    }
  });

  // Inject widget into page
  if (document.body) {
    document.body.appendChild(container);
  } else {
    // If body is not ready, wait for it
    document.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(container);
    });
  }

  // Export widget API for advanced usage (optional)
  window.ChatbotWidget = {
    _initialized: true,
    config: config,
    open: function() {
      if (!isOpen && button) {
        button.click();
      }
    },
    close: function() {
      if (isOpen && closeButton) {
        closeButton.click();
      }
    },
    toggle: function() {
      if (isOpen) {
        this.close();
      } else {
        this.open();
      }
    },
    destroy: function() {
      if (container && container.parentNode) {
        container.remove();
      }
      if (styleSheet && styleSheet.parentNode) {
        styleSheet.remove();
      }
      delete window.ChatbotWidget;
    },
    isOpen: function() {
      return isOpen;
    }
  };

})();
