const API_URL = "https://script.google.com/macros/s/AKfycbzq8021mtDZ5JKL7MPREpDtAOqi3hmnGPd8nz0FVx1YvrcLxdvwjnpnLaNRGkmMVabF/exec";

function fetchData() {
  return new Promise((resolve, reject) => {
    // Create unique callback name
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    // Clean up any existing callback
    if (window[callbackName]) {
      delete window[callbackName];
    }
    
    window[callbackName] = function(data) {
      // Clean up
      if (script.parentNode) {
        document.body.removeChild(script);
      }
      delete window[callbackName];
      
      console.log("📡 API Response received:", data);
      
      // Handle different response formats
      let result = [];
      
      if (Array.isArray(data)) {
        result = data;
      } else if (data && typeof data === 'object') {
        // Try common data structures
        if (data.data && Array.isArray(data.data)) {
          result = data.data;
        } else if (data.records && Array.isArray(data.records)) {
          result = data.records;
        } else if (data.values && Array.isArray(data.values)) {
          result = data.values;
        } else if (data.rows && Array.isArray(data.rows)) {
          result = data.rows;
        } else {
          // Try to find any array in the object
          for (let key in data) {
            if (Array.isArray(data[key])) {
              result = data[key];
              break;
            }
          }
        }
      }
      
      console.log(`📊 Extracted ${result.length} records from API`);
      
      // Always resolve, even with empty array
      resolve(result || []);
    };
    
    // Create and append script tag
    const script = document.createElement('script');
    script.src = `${API_URL}?callback=${callbackName}&t=${Date.now()}`;
    script.onerror = () => {
      console.error("❌ Failed to load data from API");
      // Clean up
      if (window[callbackName]) {
        delete window[callbackName];
      }
      if (script.parentNode) {
        document.body.removeChild(script);
      }
      // Resolve with empty array (will use test data)
      resolve([]);
    };
    
    // Add script to document
    document.body.appendChild(script);
    
    // Timeout after 15 seconds
    setTimeout(() => {
      if (window[callbackName]) {
        console.warn("⏰ API request timed out after 15 seconds");
        delete window[callbackName];
        if (script.parentNode) {
          document.body.removeChild(script);
        }
        resolve([]);
      }
    }, 15000);
  });
}

// Make fetchData globally available
window.fetchData = fetchData;