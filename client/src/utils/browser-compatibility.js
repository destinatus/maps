/**
 * Browser Compatibility Utilities
 * 
 * This module provides utilities for handling browser-specific compatibility issues
 * and detecting browser capabilities.
 */

// Browser detection
export const browserInfo = {
  // Detect browser and version
  detect: () => {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    let osName = 'Unknown';
    
    // Detect browser
    if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
    } else if (userAgent.indexOf('SamsungBrowser') > -1) {
      browserName = 'Samsung Browser';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      browserName = 'Opera';
    } else if (userAgent.indexOf('Trident') > -1) {
      browserName = 'Internet Explorer';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge (Legacy)';
    } else if (userAgent.indexOf('Edg') > -1) {
      browserName = 'Edge (Chromium)';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
    }
    
    // Detect OS
    if (userAgent.indexOf('Windows') > -1) {
      osName = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
      osName = 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
      osName = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
      osName = 'Android';
    } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
      osName = 'iOS';
    }
    
    // Extract version
    let versionMatch;
    switch (browserName) {
      case 'Firefox':
        versionMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
        break;
      case 'Chrome':
        versionMatch = userAgent.match(/Chrome\/(\d+\.\d+)/);
        break;
      case 'Safari':
        versionMatch = userAgent.match(/Version\/(\d+\.\d+)/);
        break;
      case 'Edge (Chromium)':
        versionMatch = userAgent.match(/Edg\/(\d+\.\d+)/);
        break;
      case 'Edge (Legacy)':
        versionMatch = userAgent.match(/Edge\/(\d+\.\d+)/);
        break;
      case 'Internet Explorer':
        versionMatch = userAgent.match(/rv:(\d+\.\d+)/);
        break;
      case 'Opera':
        versionMatch = userAgent.match(/OPR\/(\d+\.\d+)/);
        if (!versionMatch) {
          versionMatch = userAgent.match(/Opera\/(\d+\.\d+)/);
        }
        break;
      case 'Samsung Browser':
        versionMatch = userAgent.match(/SamsungBrowser\/(\d+\.\d+)/);
        break;
      default:
        break;
    }
    
    if (versionMatch && versionMatch[1]) {
      browserVersion = versionMatch[1];
    }
    
    return {
      name: browserName,
      version: browserVersion,
      os: osName,
      userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(userAgent)
    };
  },
  
  // Check if the browser is supported
  isSupported: () => {
    const browser = browserInfo.detect();
    
    // Define minimum supported versions
    const minVersions = {
      'Chrome': 60,
      'Firefox': 60,
      'Safari': 12,
      'Edge (Chromium)': 79,
      'Edge (Legacy)': 16,
      'Opera': 50,
      'Samsung Browser': 10,
      'Internet Explorer': Infinity // Not supported
    };
    
    // Check if browser is in the supported list
    if (!(browser.name in minVersions)) {
      return false;
    }
    
    // Check version
    const majorVersion = parseInt(browser.version, 10);
    return !isNaN(majorVersion) && majorVersion >= minVersions[browser.name];
  },
  
  // Log browser information
  logInfo: () => {
    const browser = browserInfo.detect();
    console.log('Browser Information:', browser);
    console.log('Is Supported:', browserInfo.isSupported());
    return browser;
  }
};

// Feature detection
export const featureDetection = {
  // Check if CSS Grid is supported
  hasGrid: () => {
    return window.CSS && CSS.supports && CSS.supports('display', 'grid');
  },
  
  // Check if Flexbox is supported
  hasFlexbox: () => {
    return window.CSS && CSS.supports && CSS.supports('display', 'flex');
  },
  
  // Check if CSS Variables are supported
  hasCssVariables: () => {
    return window.CSS && CSS.supports && CSS.supports('--custom-prop', 'value');
  },
  
  // Check if WebGL is supported
  hasWebGL: () => {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  },
  
  // Check if Web Workers are supported
  hasWebWorkers: () => {
    return !!window.Worker;
  },
  
  // Check if Service Workers are supported
  hasServiceWorkers: () => {
    return 'serviceWorker' in navigator;
  },
  
  // Check if Local Storage is supported
  hasLocalStorage: () => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  },
  
  // Check if Session Storage is supported
  hasSessionStorage: () => {
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  },
  
  // Check if IndexedDB is supported
  hasIndexedDB: () => {
    return !!window.indexedDB;
  },
  
  // Check if WebSockets are supported
  hasWebSockets: () => {
    return 'WebSocket' in window;
  },
  
  // Check if Geolocation is supported
  hasGeolocation: () => {
    return 'geolocation' in navigator;
  },
  
  // Run all feature detection tests
  runAllTests: () => {
    return {
      cssGrid: featureDetection.hasGrid(),
      flexbox: featureDetection.hasFlexbox(),
      cssVariables: featureDetection.hasCssVariables(),
      webGL: featureDetection.hasWebGL(),
      webWorkers: featureDetection.hasWebWorkers(),
      serviceWorkers: featureDetection.hasServiceWorkers(),
      localStorage: featureDetection.hasLocalStorage(),
      sessionStorage: featureDetection.hasSessionStorage(),
      indexedDB: featureDetection.hasIndexedDB(),
      webSockets: featureDetection.hasWebSockets(),
      geolocation: featureDetection.hasGeolocation()
    };
  }
};

// Polyfill loader
export const polyfills = {
  // Load polyfills based on feature detection
  loadRequired: async () => {
    const features = featureDetection.runAllTests();
    const polyfillsToLoad = [];
    
    // Check which polyfills are needed
    if (!features.cssGrid) {
      polyfillsToLoad.push('css-grid');
    }
    
    if (!features.flexbox) {
      polyfillsToLoad.push('flexbox');
    }
    
    if (!features.cssVariables) {
      polyfillsToLoad.push('css-variables');
    }
    
    if (!features.webSockets) {
      polyfillsToLoad.push('websocket');
    }
    
    // Load polyfills if needed
    if (polyfillsToLoad.length > 0) {
      console.log('Loading polyfills for:', polyfillsToLoad.join(', '));
      
      // This would typically load polyfills from a CDN or local files
      // For example:
      // await import('https://cdn.jsdelivr.net/npm/css-vars-ponyfill@2');
      
      return polyfillsToLoad;
    }
    
    console.log('No polyfills needed');
    return [];
  }
};

// Browser compatibility warnings
export const compatWarnings = {
  // Show a warning if the browser is not fully supported
  checkAndWarn: () => {
    const browser = browserInfo.detect();
    const features = featureDetection.runAllTests();
    const warnings = [];
    
    // Check browser support
    if (!browserInfo.isSupported()) {
      warnings.push({
        type: 'browser',
        message: `Your browser (${browser.name} ${browser.version}) may not be fully supported. For the best experience, please use a modern browser like Chrome, Firefox, or Edge.`
      });
    }
    
    // Check feature support
    if (!features.webGL) {
      warnings.push({
        type: 'feature',
        message: 'WebGL is not supported in your browser, which may affect map rendering performance.'
      });
    }
    
    if (!features.webSockets) {
      warnings.push({
        type: 'feature',
        message: 'WebSockets are not supported in your browser, which will affect real-time updates.'
      });
    }
    
    return warnings;
  },
  
  // Display warnings to the user
  displayWarnings: (containerId = 'browser-warnings') => {
    const warnings = compatWarnings.checkAndWarn();
    
    if (warnings.length === 0) {
      return false;
    }
    
    // Find or create container
    let container = document.getElementById(containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'browser-compatibility-warnings';
      document.body.insertBefore(container, document.body.firstChild);
    }
    
    // Clear existing warnings
    container.innerHTML = '';
    
    // Add warnings
    warnings.forEach(warning => {
      const warningElement = document.createElement('div');
      warningElement.className = `warning-item warning-${warning.type}`;
      warningElement.innerHTML = `
        <div class="warning-icon">⚠️</div>
        <div class="warning-message">${warning.message}</div>
        <button class="warning-close" aria-label="Dismiss warning">×</button>
      `;
      
      // Add close button functionality
      const closeButton = warningElement.querySelector('.warning-close');
      closeButton.addEventListener('click', () => {
        warningElement.remove();
        if (container.children.length === 0) {
          container.remove();
        }
      });
      
      container.appendChild(warningElement);
    });
    
    return true;
  }
};

// CSS fixes for specific browsers
export const cssFixes = {
  // Apply browser-specific CSS fixes
  applyFixes: () => {
    const browser = browserInfo.detect();
    
    // Add browser info classes to the html element
    document.documentElement.classList.add(
      `browser-${browser.name.toLowerCase().replace(/\s+/g, '-')}`,
      `browser-version-${parseInt(browser.version, 10)}`,
      `os-${browser.os.toLowerCase()}`,
      browser.isMobile ? 'mobile' : 'desktop',
      browser.isTablet ? 'tablet' : ''
    );
    
    // Safari-specific fixes
    if (browser.name === 'Safari') {
      // Fix for flexbox gap property
      if (parseInt(browser.version, 10) < 14) {
        document.documentElement.classList.add('safari-flexgap-fix');
        
        // Add a style element with the fix
        const style = document.createElement('style');
        style.textContent = `
          .safari-flexgap-fix .sidebar {
            margin-left: 1px; /* Fix for Safari flexbox gap */
          }
          
          .safari-flexgap-fix .map-stats {
            bottom: 20px; /* Adjust position for Safari */
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    // IE and Edge Legacy fixes
    if (browser.name === 'Internet Explorer' || browser.name === 'Edge (Legacy)') {
      document.documentElement.classList.add('ms-browser-fix');
      
      // Add a style element with the fix
      const style = document.createElement('style');
      style.textContent = `
        .ms-browser-fix .map-container {
          height: 100vh; /* Fix for IE/Edge height issues */
        }
      `;
      document.head.appendChild(style);
    }
    
    return browser;
  }
};

// Initialize browser compatibility checks
export const initBrowserCompat = async () => {
  // Log browser info
  const browser = browserInfo.logInfo();
  
  // Apply CSS fixes
  cssFixes.applyFixes();
  
  // Load required polyfills
  await polyfills.loadRequired();
  
  // Display warnings if needed
  compatWarnings.displayWarnings();
  
  return {
    browser,
    features: featureDetection.runAllTests()
  };
};

export default {
  browserInfo,
  featureDetection,
  polyfills,
  compatWarnings,
  cssFixes,
  initBrowserCompat
};
