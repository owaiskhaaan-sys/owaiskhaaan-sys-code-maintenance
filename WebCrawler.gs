/**
 * Enhanced Web Crawler and Meta Data Extractor for Google Apps Script
 * 
 * This script provides robust web crawling, fetching, logging, and meta tag extraction
 * capabilities with comprehensive error handling and debug readiness.
 * 
 * Features:
 * - Robust URL fetching with retry mechanism
 * - Depth-controlled web crawling
 * - Comprehensive logging system
 * - Meta title and description extraction
 * - Visited URL tracking to prevent redundant operations
 * - Input validation and error handling
 * - Debug utilities for troubleshooting
 * 
 * @author Google Apps Script Enhanced Crawler
 * @version 2.0.0
 */

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Configuration object for crawler settings
 * @constant {Object}
 */
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  REQUEST_TIMEOUT_MS: 30000,
  MAX_CRAWL_DEPTH: 3,
  MAX_URLS_PER_CRAWL: 50,
  USER_AGENT: 'Mozilla/5.0 (compatible; GoogleAppsScriptCrawler/2.0)',
  LOG_SHEET_NAME: 'CrawlerLogs',
  RESULTS_SHEET_NAME: 'CrawlResults'
};

/**
 * Log level enumeration
 * @enum {string}
 */
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

// ============================================================================
// LOGGING SYSTEM
// ============================================================================

/**
 * Logger class for comprehensive logging with timestamp and level support
 * @class
 */
class Logger {
  constructor() {
    this.logs = [];
    this.startTime = new Date();
  }
  
  /**
   * Log a message with specified level
   * @param {LogLevel} level - The log level
   * @param {string} message - The message to log
   * @param {Object} [data] - Optional additional data
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp: timestamp,
      level: level,
      message: message,
      data: data,
      elapsed: new Date() - this.startTime
    };
    
    this.logs.push(logEntry);
    
    // Also log to console for immediate visibility
    const consoleMsg = `[${timestamp}] [${level}] ${message}`;
    if (level === LogLevel.ERROR) {
      console.error(consoleMsg, data);
    } else if (level === LogLevel.WARN) {
      console.warn(consoleMsg, data);
    } else {
      console.log(consoleMsg, data);
    }
  }
  
  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} [data] - Optional data
   */
  debug(message, data = null) {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} [data] - Optional data
   */
  info(message, data = null) {
    this.log(LogLevel.INFO, message, data);
  }
  
  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} [data] - Optional data
   */
  warn(message, data = null) {
    this.log(LogLevel.WARN, message, data);
  }
  
  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object} [data] - Optional data
   */
  error(message, data = null) {
    this.log(LogLevel.ERROR, message, data);
  }
  
  /**
   * Get all logs
   * @returns {Array<Object>} Array of log entries
   */
  getLogs() {
    return this.logs;
  }
  
  /**
   * Write logs to Google Sheet
   * @param {string} [sheetName] - Optional sheet name
   */
  writeToSheet(sheetName = CONFIG.LOG_SHEET_NAME) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(['Timestamp', 'Level', 'Message', 'Data', 'Elapsed (ms)']);
        sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      }
      
      this.logs.forEach(log => {
        sheet.appendRow([
          log.timestamp,
          log.level,
          log.message,
          JSON.stringify(log.data),
          log.elapsed
        ]);
      });
      
      this.info('Logs written to sheet successfully', { sheetName: sheetName });
    } catch (error) {
      console.error('Failed to write logs to sheet:', error);
    }
  }
}

// ============================================================================
// URL VALIDATION AND UTILITIES
// ============================================================================

/**
 * Validates if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlPattern = /^https?:\/\/([\w\-]+(\.[\w\-]+)+)([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?$/;
    return urlPattern.test(url.trim());
  } catch (error) {
    return false;
  }
}

/**
 * Normalizes a URL for consistent comparison
 * @param {string} url - The URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
  try {
    let normalized = url.trim().toLowerCase();
    // Remove trailing slash
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    // Remove fragment
    const hashIndex = normalized.indexOf('#');
    if (hashIndex !== -1) {
      normalized = normalized.slice(0, hashIndex);
    }
    return normalized;
  } catch (error) {
    return url;
  }
}

/**
 * Extracts domain from URL
 * @param {string} url - The URL
 * @returns {string|null} Domain or null if invalid
 */
function extractDomain(url) {
  try {
    const match = url.match(/^https?:\/\/([^\/]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// HTTP FETCHING WITH RETRY MECHANISM
// ============================================================================

/**
 * Fetches URL content with retry mechanism and error handling
 * @param {string} url - The URL to fetch
 * @param {Logger} logger - Logger instance
 * @param {number} [retryCount=0] - Current retry attempt
 * @returns {Object} Response object with status, content, and headers
 */
function fetchUrlWithRetry(url, logger, retryCount = 0) {
  logger.debug(`Attempting to fetch URL (attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES})`, { url: url });
  
  try {
    const options = {
      method: 'get',
      headers: {
        'User-Agent': CONFIG.USER_AGENT
      },
      muteHttpExceptions: true,
      followRedirects: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const content = response.getContentText();
    const headers = response.getHeaders();
    
    if (statusCode >= 200 && statusCode < 300) {
      logger.info(`Successfully fetched URL`, { 
        url: url, 
        statusCode: statusCode,
        contentLength: content.length 
      });
      
      return {
        success: true,
        statusCode: statusCode,
        content: content,
        headers: headers,
        url: url
      };
    } else if (statusCode >= 400 && statusCode < 500) {
      // Client errors - don't retry
      logger.warn(`Client error fetching URL`, { 
        url: url, 
        statusCode: statusCode 
      });
      
      return {
        success: false,
        statusCode: statusCode,
        error: `Client error: ${statusCode}`,
        url: url
      };
    } else {
      // Server errors - retry
      throw new Error(`Server error: ${statusCode}`);
    }
  } catch (error) {
    logger.warn(`Error fetching URL`, { 
      url: url, 
      error: error.toString(),
      attempt: retryCount + 1 
    });
    
    if (retryCount < CONFIG.MAX_RETRIES - 1) {
      logger.info(`Retrying after delay`, { 
        delay: CONFIG.RETRY_DELAY_MS,
        nextAttempt: retryCount + 2 
      });
      
      Utilities.sleep(CONFIG.RETRY_DELAY_MS);
      return fetchUrlWithRetry(url, logger, retryCount + 1);
    } else {
      logger.error(`Max retries reached for URL`, { 
        url: url,
        totalAttempts: CONFIG.MAX_RETRIES 
      });
      
      return {
        success: false,
        error: error.toString(),
        url: url
      };
    }
  }
}

// ============================================================================
// META TAG EXTRACTION
// ============================================================================

/**
 * Extracts meta title and description from HTML content
 * @param {string} html - HTML content
 * @param {string} url - Source URL for logging
 * @param {Logger} logger - Logger instance
 * @returns {Object} Object containing title and description
 */
function extractMetaTags(html, url, logger) {
  logger.debug('Extracting meta tags', { url: url });
  
  const result = {
    title: null,
    description: null,
    ogTitle: null,
    ogDescription: null,
    url: url
  };
  
  try {
    // Extract title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      result.title = titleMatch[1].trim();
      logger.debug('Found title tag', { title: result.title });
    }
    
    // Extract meta description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch && descMatch[1]) {
      result.description = descMatch[1].trim();
      logger.debug('Found meta description', { description: result.description });
    }
    
    // Extract Open Graph title
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      result.ogTitle = ogTitleMatch[1].trim();
      logger.debug('Found OG title', { ogTitle: result.ogTitle });
    }
    
    // Extract Open Graph description
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (ogDescMatch && ogDescMatch[1]) {
      result.ogDescription = ogDescMatch[1].trim();
      logger.debug('Found OG description', { ogDescription: result.ogDescription });
    }
    
    // Fallback: use OG title if regular title not found
    if (!result.title && result.ogTitle) {
      result.title = result.ogTitle;
    }
    
    // Fallback: use OG description if regular description not found
    if (!result.description && result.ogDescription) {
      result.description = result.ogDescription;
    }
    
    logger.info('Meta tags extracted successfully', { 
      url: url,
      hasTitle: !!result.title,
      hasDescription: !!result.description
    });
    
  } catch (error) {
    logger.error('Error extracting meta tags', { 
      url: url,
      error: error.toString() 
    });
  }
  
  return result;
}

/**
 * Extracts all links from HTML content
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative links
 * @param {Logger} logger - Logger instance
 * @returns {Array<string>} Array of absolute URLs
 */
function extractLinks(html, baseUrl, logger) {
  logger.debug('Extracting links', { baseUrl: baseUrl });
  
  const links = [];
  const baseDomain = extractDomain(baseUrl);
  
  try {
    // Match href attributes in anchor tags
    const hrefRegex = /<a\s+[^>]*href=["']([^"']+)["']/gi;
    let match;
    
    while ((match = hrefRegex.exec(html)) !== null) {
      let link = match[1].trim();
      
      // Skip anchors, javascript, and mailto links
      if (link.startsWith('#') || 
          link.startsWith('javascript:') || 
          link.startsWith('mailto:') ||
          link.length === 0) {
        continue;
      }
      
      // Convert relative URLs to absolute
      if (link.startsWith('/')) {
        const protocol = baseUrl.match(/^https?:/)[0];
        link = `${protocol}//${baseDomain}${link}`;
      } else if (!link.startsWith('http')) {
        // Handle relative paths without leading slash
        const baseWithoutFile = baseUrl.replace(/\/[^\/]*$/, '/');
        link = baseWithoutFile + link;
      }
      
      // Only include links from the same domain
      if (extractDomain(link) === baseDomain && isValidUrl(link)) {
        links.push(link);
      }
    }
    
    logger.debug('Links extracted', { 
      count: links.length,
      baseUrl: baseUrl 
    });
    
  } catch (error) {
    logger.error('Error extracting links', { 
      baseUrl: baseUrl,
      error: error.toString() 
    });
  }
  
  return [...new Set(links)]; // Remove duplicates
}

// ============================================================================
// WEB CRAWLER
// ============================================================================

/**
 * Web crawler with depth control and visited URL tracking
 * @class
 */
class WebCrawler {
  /**
   * @param {Logger} logger - Logger instance
   */
  constructor(logger) {
    this.logger = logger;
    this.visitedUrls = new Set();
    this.results = [];
  }
  
  /**
   * Crawls a website starting from the given URL
   * @param {string} startUrl - Starting URL
   * @param {number} [maxDepth] - Maximum crawl depth
   * @param {number} [maxUrls] - Maximum URLs to crawl
   * @returns {Array<Object>} Array of crawl results
   */
  crawl(startUrl, maxDepth = CONFIG.MAX_CRAWL_DEPTH, maxUrls = CONFIG.MAX_URLS_PER_CRAWL) {
    this.logger.info('Starting crawl', { 
      startUrl: startUrl,
      maxDepth: maxDepth,
      maxUrls: maxUrls 
    });
    
    // Validate start URL
    if (!isValidUrl(startUrl)) {
      this.logger.error('Invalid start URL', { url: startUrl });
      return [];
    }
    
    // Reset crawler state
    this.visitedUrls.clear();
    this.results = [];
    
    // Start crawling
    this._crawlRecursive(startUrl, 0, maxDepth, maxUrls);
    
    this.logger.info('Crawl completed', { 
      totalUrls: this.results.length,
      visitedUrls: this.visitedUrls.size 
    });
    
    return this.results;
  }
  
  /**
   * Recursive crawling function
   * @param {string} url - Current URL to crawl
   * @param {number} depth - Current depth
   * @param {number} maxDepth - Maximum depth
   * @param {number} maxUrls - Maximum URLs
   * @private
   */
  _crawlRecursive(url, depth, maxDepth, maxUrls) {
    // Check if we've reached limits
    if (depth > maxDepth) {
      this.logger.debug('Max depth reached', { url: url, depth: depth });
      return;
    }
    
    if (this.results.length >= maxUrls) {
      this.logger.debug('Max URLs reached', { count: this.results.length });
      return;
    }
    
    // Check if already visited
    const normalizedUrl = normalizeUrl(url);
    if (this.visitedUrls.has(normalizedUrl)) {
      this.logger.debug('URL already visited', { url: url });
      return;
    }
    
    // Mark as visited
    this.visitedUrls.add(normalizedUrl);
    this.logger.info(`Crawling URL at depth ${depth}`, { url: url });
    
    // Fetch the URL
    const response = fetchUrlWithRetry(url, this.logger);
    
    if (!response.success) {
      this.logger.warn('Failed to fetch URL', { url: url });
      
      // Still record the failed attempt
      this.results.push({
        url: url,
        depth: depth,
        success: false,
        error: response.error,
        timestamp: new Date().toISOString()
      });
      
      return;
    }
    
    // Extract meta tags
    const metaTags = extractMetaTags(response.content, url, this.logger);
    
    // Record result
    const result = {
      url: url,
      depth: depth,
      success: true,
      statusCode: response.statusCode,
      title: metaTags.title,
      description: metaTags.description,
      ogTitle: metaTags.ogTitle,
      ogDescription: metaTags.ogDescription,
      contentLength: response.content.length,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    // Extract and crawl child links if not at max depth
    if (depth < maxDepth && this.results.length < maxUrls) {
      const links = extractLinks(response.content, url, this.logger);
      
      this.logger.info(`Found ${links.length} links to crawl`, { 
        url: url,
        currentDepth: depth,
        linksFound: links.length 
      });
      
      // Crawl child links
      for (const link of links) {
        if (this.results.length >= maxUrls) {
          break;
        }
        
        // Small delay to avoid overwhelming servers
        Utilities.sleep(500);
        
        this._crawlRecursive(link, depth + 1, maxDepth, maxUrls);
      }
    }
  }
  
  /**
   * Get crawl results
   * @returns {Array<Object>} Array of results
   */
  getResults() {
    return this.results;
  }
  
  /**
   * Write results to Google Sheet
   * @param {string} [sheetName] - Optional sheet name
   */
  writeResultsToSheet(sheetName = CONFIG.RESULTS_SHEET_NAME) {
    this.logger.info('Writing results to sheet', { sheetName: sheetName });
    
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow([
          'URL', 
          'Depth', 
          'Success', 
          'Status Code',
          'Title', 
          'Description',
          'OG Title',
          'OG Description',
          'Content Length',
          'Timestamp',
          'Error'
        ]);
        sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
      }
      
      this.results.forEach(result => {
        sheet.appendRow([
          result.url,
          result.depth,
          result.success,
          result.statusCode || '',
          result.title || '',
          result.description || '',
          result.ogTitle || '',
          result.ogDescription || '',
          result.contentLength || '',
          result.timestamp,
          result.error || ''
        ]);
      });
      
      // Auto-resize columns for better readability
      sheet.autoResizeColumns(1, 11);
      
      this.logger.info('Results written to sheet successfully', { 
        sheetName: sheetName,
        rowsWritten: this.results.length 
      });
      
    } catch (error) {
      this.logger.error('Failed to write results to sheet', { 
        error: error.toString() 
      });
    }
  }
}

// ============================================================================
// MAIN ENTRY POINTS
// ============================================================================

/**
 * Main function to crawl a single URL and extract meta tags
 * @param {string} url - The URL to crawl
 * @returns {Object} Meta tag information
 */
function crawlSingleUrl(url) {
  const logger = new Logger();
  
  logger.info('Starting single URL crawl', { url: url });
  
  if (!isValidUrl(url)) {
    logger.error('Invalid URL provided', { url: url });
    return { error: 'Invalid URL' };
  }
  
  const response = fetchUrlWithRetry(url, logger);
  
  if (!response.success) {
    logger.error('Failed to fetch URL', { url: url });
    logger.writeToSheet();
    return { error: response.error };
  }
  
  const metaTags = extractMetaTags(response.content, url, logger);
  
  logger.info('Single URL crawl completed', { url: url });
  logger.writeToSheet();
  
  return metaTags;
}

/**
 * Main function to crawl a website with depth control
 * @param {string} startUrl - Starting URL
 * @param {number} [maxDepth=3] - Maximum crawl depth
 * @param {number} [maxUrls=50] - Maximum URLs to crawl
 * @returns {Array<Object>} Crawl results
 */
function crawlWebsite(startUrl, maxDepth = 3, maxUrls = 50) {
  const logger = new Logger();
  
  logger.info('=== Starting Website Crawl ===');
  logger.info('Configuration', { 
    startUrl: startUrl,
    maxDepth: maxDepth,
    maxUrls: maxUrls 
  });
  
  const crawler = new WebCrawler(logger);
  const results = crawler.crawl(startUrl, maxDepth, maxUrls);
  
  // Write results and logs to sheets
  crawler.writeResultsToSheet();
  logger.writeToSheet();
  
  logger.info('=== Website Crawl Completed ===');
  logger.info('Summary', {
    totalUrls: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  });
  
  return results;
}

/**
 * Test function to demonstrate functionality
 * Run this function from the script editor to test the crawler
 */
function testCrawler() {
  // Example: Crawl a website with depth 2 and max 10 URLs
  const startUrl = 'https://example.com';
  const results = crawlWebsite(startUrl, 2, 10);
  
  Logger.log('Crawl completed!');
  Logger.log(`Total URLs crawled: ${results.length}`);
  Logger.log('Check the "CrawlResults" and "CrawlerLogs" sheets for details.');
}

/**
 * Debug function to check configuration and test URL validation
 */
function debugConfiguration() {
  const logger = new Logger();
  
  logger.info('=== Debug Configuration ===');
  logger.info('Current Configuration', CONFIG);
  
  // Test URL validation
  const testUrls = [
    'https://example.com',
    'http://test.com/page',
    'invalid-url',
    'javascript:void(0)',
    'https://domain.com/path?query=1#fragment'
  ];
  
  testUrls.forEach(url => {
    logger.info('URL Validation Test', {
      url: url,
      isValid: isValidUrl(url),
      normalized: normalizeUrl(url),
      domain: extractDomain(url)
    });
  });
  
  logger.writeToSheet();
  
  Logger.log('Debug information written to sheet. Check "CrawlerLogs" sheet.');
}
