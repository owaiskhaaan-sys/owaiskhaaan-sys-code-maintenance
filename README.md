# Enhanced Google Apps Script Web Crawler

A robust and comprehensive Google Apps Script for web crawling, URL fetching, logging, and meta title & description extraction.

## Features

### Core Capabilities
- **Robust URL Fetching**: Automatic retry mechanism with configurable attempts and delays
- **Intelligent Web Crawling**: Depth-controlled crawling with visited URL tracking to prevent redundant operations
- **Comprehensive Logging**: Multi-level logging system (DEBUG, INFO, WARN, ERROR) with timestamps and elapsed time tracking
- **Meta Tag Extraction**: Extracts title, description, Open Graph title, and Open Graph description
- **Error Handling**: Extensive input validation and error handling throughout
- **Debug Ready**: Built-in debug utilities and configuration display

### Advanced Features
- Prevents redundant URL visits with normalized URL tracking
- Configurable crawl depth and maximum URL limits
- Same-domain link following for focused crawling
- Automatic Google Sheets integration for results and logs
- User-Agent customization
- Request timeout handling
- HTTP status code differentiation (client vs server errors)
- Relative URL resolution

## Installation

1. Open Google Sheets
2. Go to **Extensions** > **Apps Script**
3. Delete any existing code in `Code.gs`
4. Copy the entire contents of `WebCrawler.gs` into the script editor
5. Save the project with a meaningful name (e.g., "Web Crawler")

## Configuration

All configuration options are centralized in the `CONFIG` object:

```javascript
const CONFIG = {
  MAX_RETRIES: 3,              // Number of retry attempts for failed requests
  RETRY_DELAY_MS: 2000,        // Delay between retries in milliseconds
  REQUEST_TIMEOUT_MS: 30000,   // Request timeout in milliseconds
  MAX_CRAWL_DEPTH: 3,          // Maximum crawl depth
  MAX_URLS_PER_CRAWL: 50,      // Maximum URLs to crawl per session
  USER_AGENT: '...',           // Custom User-Agent string
  LOG_SHEET_NAME: 'CrawlerLogs',    // Sheet name for logs
  RESULTS_SHEET_NAME: 'CrawlResults' // Sheet name for results
};
```

## Usage

### Basic Usage - Single URL

To crawl a single URL and extract its meta tags:

```javascript
function myCrawler() {
  const result = crawlSingleUrl('https://example.com');
  Logger.log(result);
}
```

Returns an object with:
- `title`: Page title
- `description`: Meta description
- `ogTitle`: Open Graph title
- `ogDescription`: Open Graph description
- `url`: Source URL

### Advanced Usage - Website Crawl

To crawl an entire website with depth control:

```javascript
function myWebsiteCrawl() {
  const startUrl = 'https://example.com';
  const maxDepth = 2;
  const maxUrls = 25;
  
  const results = crawlWebsite(startUrl, maxDepth, maxUrls);
  Logger.log(`Crawled ${results.length} pages`);
}
```

### Testing

Use the built-in test function:

```javascript
function testCrawler() {
  // This will crawl example.com with depth 2 and max 10 URLs
  const startUrl = 'https://example.com';
  const results = crawlWebsite(startUrl, 2, 10);
  
  Logger.log('Crawl completed!');
  Logger.log(`Total URLs crawled: ${results.length}`);
}
```

### Debug Mode

To check configuration and test URL validation:

```javascript
function debugConfiguration() {
  // Displays configuration and tests URL validation
  // Results are written to the CrawlerLogs sheet
}
```

## Output Sheets

### CrawlResults Sheet
Contains columns:
- **URL**: The crawled URL
- **Depth**: Crawl depth level
- **Success**: Whether the fetch was successful
- **Status Code**: HTTP status code
- **Title**: Page title
- **Description**: Meta description
- **OG Title**: Open Graph title
- **OG Description**: Open Graph description
- **Content Length**: Size of HTML content
- **Timestamp**: When the page was crawled
- **Error**: Error message (if any)

### CrawlerLogs Sheet
Contains columns:
- **Timestamp**: Log entry timestamp
- **Level**: Log level (DEBUG, INFO, WARN, ERROR)
- **Message**: Log message
- **Data**: Additional structured data (JSON)
- **Elapsed (ms)**: Time elapsed since crawl start

## Architecture

### Class Structure

#### Logger Class
- Handles all logging operations
- Supports multiple log levels
- Automatically writes to Google Sheets
- Tracks elapsed time for performance monitoring

#### WebCrawler Class
- Manages the crawling process
- Tracks visited URLs to prevent redundant operations
- Implements depth-first crawling algorithm
- Handles result collection and sheet writing

### Key Functions

#### URL Validation & Utils
- `isValidUrl(url)`: Validates URL format
- `normalizeUrl(url)`: Normalizes URLs for comparison
- `extractDomain(url)`: Extracts domain from URL

#### Fetching
- `fetchUrlWithRetry(url, logger, retryCount)`: Robust URL fetching with retry

#### Extraction
- `extractMetaTags(html, url, logger)`: Extracts meta tags from HTML
- `extractLinks(html, baseUrl, logger)`: Extracts and resolves links

## Error Handling

The script includes comprehensive error handling:

1. **URL Validation**: Invalid URLs are caught before fetching
2. **HTTP Errors**: 
   - 4xx errors (client errors) are logged but not retried
   - 5xx errors (server errors) trigger retry mechanism
3. **Network Errors**: Caught and retried up to MAX_RETRIES times
4. **Parse Errors**: Meta tag extraction failures are logged but don't stop the crawl
5. **Sheet Errors**: Logged to console if sheet writing fails

## Performance Considerations

- **Rate Limiting**: Built-in 500ms delay between requests
- **Depth Control**: Prevents infinite crawling loops
- **URL Limits**: Configurable maximum URLs per crawl
- **Same-Domain Only**: Only follows links within the starting domain
- **Duplicate Prevention**: Normalized URL tracking prevents revisits

## Best Practices

1. **Start Small**: Test with low depth (1-2) and few URLs (10-20) first
2. **Monitor Logs**: Check the CrawlerLogs sheet for issues
3. **Respect Robots**: Add delays and respect robots.txt in production
4. **Handle Permissions**: Ensure spreadsheet has proper permissions
5. **Script Timeout**: Google Apps Script has a 6-minute execution limit for free accounts

## Limitations

- Google Apps Script execution time limits (6 minutes for free, 30 minutes for Workspace)
- UrlFetchApp daily quotas apply
- No JavaScript rendering (static HTML only)
- No robots.txt checking (add manually if needed)

## Troubleshooting

### Common Issues

1. **"Invalid URL" Error**
   - Check URL format (must start with http:// or https://)
   - Ensure no special characters that need encoding

2. **"Max retries reached"**
   - Site may be blocking automated requests
   - Try increasing RETRY_DELAY_MS
   - Check if site is accessible manually

3. **"Script execution timeout"**
   - Reduce MAX_URLS_PER_CRAWL
   - Reduce MAX_CRAWL_DEPTH
   - Split crawl into multiple sessions

4. **No meta tags found**
   - Some sites may use non-standard meta tag formats
   - Check CrawlerLogs for parse errors
   - Verify the HTML structure of target site

## Advanced Customization

### Custom User Agent
Modify the USER_AGENT in CONFIG:
```javascript
USER_AGENT: 'MyBot/1.0 (contact@example.com)'
```

### Custom Sheet Names
Change sheet names in CONFIG:
```javascript
LOG_SHEET_NAME: 'MyLogs',
RESULTS_SHEET_NAME: 'MyResults'
```

### Add Custom Headers
Modify the fetchUrlWithRetry function to add custom headers:
```javascript
headers: {
  'User-Agent': CONFIG.USER_AGENT,
  'Accept': 'text/html',
  'Accept-Language': 'en-US'
}
```

## Version History

### Version 2.0.0
- Complete rewrite with enhanced architecture
- Added Logger class for comprehensive logging
- Added WebCrawler class for organized crawling
- Implemented retry mechanism
- Added visited URL tracking
- Enhanced meta tag extraction (including Open Graph)
- Improved error handling and validation
- Added debug utilities
- Comprehensive JSDoc annotations

## License

This code is provided as-is for use in Google Apps Script projects.

## Support

For issues or questions:
1. Check the CrawlerLogs sheet for detailed error information
2. Use the debugConfiguration() function to verify setup
3. Review this documentation for common issues
