# Usage Examples for Enhanced Web Crawler

This document provides practical examples for using the Enhanced Web Crawler Google Apps Script.

## Table of Contents
1. [Basic Examples](#basic-examples)
2. [Advanced Examples](#advanced-examples)
3. [Custom Configuration Examples](#custom-configuration-examples)
4. [Real-World Scenarios](#real-world-scenarios)
5. [Error Handling Examples](#error-handling-examples)

---

## Basic Examples

### Example 1: Crawl a Single Page

Extract meta information from a single URL without following links:

```javascript
function example1_SinglePage() {
  const url = 'https://www.example.com';
  const result = crawlSingleUrl(url);
  
  Logger.log('Title: ' + result.title);
  Logger.log('Description: ' + result.description);
  Logger.log('OG Title: ' + result.ogTitle);
  Logger.log('OG Description: ' + result.ogDescription);
  
  // Result is also available in sheets:
  // - CrawlerLogs sheet for detailed logs
}
```

**Output:**
```
Title: Example Domain
Description: This domain is for use in illustrative examples in documents.
```

### Example 2: Simple Website Crawl

Crawl a website with default settings (depth 3, max 50 URLs):

```javascript
function example2_SimpleWebsiteCrawl() {
  const startUrl = 'https://www.example.com';
  const results = crawlWebsite(startUrl);
  
  Logger.log(`Total pages crawled: ${results.length}`);
  
  // Display summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  Logger.log(`Successful: ${successful}`);
  Logger.log(`Failed: ${failed}`);
  
  // Results are in CrawlResults sheet
  // Logs are in CrawlerLogs sheet
}
```

---

## Advanced Examples

### Example 3: Shallow Crawl with Limited URLs

Quick scan of a website's top-level pages:

```javascript
function example3_ShallowCrawl() {
  const startUrl = 'https://www.example.com';
  const maxDepth = 1;     // Only follow links one level deep
  const maxUrls = 10;     // Limit to 10 pages
  
  const results = crawlWebsite(startUrl, maxDepth, maxUrls);
  
  Logger.log('Crawled pages:');
  results.forEach(page => {
    if (page.success) {
      Logger.log(`  - ${page.url}`);
      Logger.log(`    Title: ${page.title || 'No title'}`);
    }
  });
}
```

**Use Case:** Quick site overview, testing, or when you only need main pages.

### Example 4: Deep Crawl for Comprehensive Analysis

Thorough crawl for site audit or content analysis:

```javascript
function example4_DeepCrawl() {
  const startUrl = 'https://www.yoursite.com';
  const maxDepth = 5;     // Go 5 levels deep
  const maxUrls = 200;    // Crawl up to 200 pages
  
  Logger.log('Starting deep crawl - this may take several minutes...');
  
  const results = crawlWebsite(startUrl, maxDepth, maxUrls);
  
  // Analyze results
  const pagesWithoutDescription = results.filter(r => 
    r.success && !r.description
  ).length;
  
  const pagesWithoutTitle = results.filter(r => 
    r.success && !r.title
  ).length;
  
  Logger.log('=== Analysis ===');
  Logger.log(`Total pages: ${results.length}`);
  Logger.log(`Pages without description: ${pagesWithoutDescription}`);
  Logger.log(`Pages without title: ${pagesWithoutTitle}`);
}
```

**Use Case:** SEO audit, content inventory, site migration planning.

### Example 5: Processing Results Programmatically

Access and process crawl results in your script:

```javascript
function example5_ProcessResults() {
  const startUrl = 'https://www.example.com';
  const results = crawlWebsite(startUrl, 2, 20);
  
  // Find pages with long titles
  const longTitles = results.filter(r => 
    r.success && r.title && r.title.length > 60
  );
  
  Logger.log('Pages with titles longer than 60 characters:');
  longTitles.forEach(page => {
    Logger.log(`  ${page.url}`);
    Logger.log(`  Title (${page.title.length} chars): ${page.title}`);
  });
  
  // Find pages with missing meta descriptions
  const missingDesc = results.filter(r => 
    r.success && !r.description
  );
  
  Logger.log(`\nPages missing meta description: ${missingDesc.length}`);
  missingDesc.forEach(page => {
    Logger.log(`  - ${page.url}`);
  });
  
  // Calculate average content length
  const successfulPages = results.filter(r => r.success);
  const avgLength = successfulPages.reduce((sum, page) => 
    sum + (page.contentLength || 0), 0
  ) / successfulPages.length;
  
  Logger.log(`\nAverage page size: ${Math.round(avgLength)} bytes`);
}
```

**Use Case:** SEO analysis, content audit, quality assurance.

---

## Custom Configuration Examples

### Example 6: Custom Configuration

Modify crawler behavior for specific needs:

```javascript
function example6_CustomConfig() {
  // Temporarily modify configuration
  const originalRetries = CONFIG.MAX_RETRIES;
  const originalDelay = CONFIG.RETRY_DELAY_MS;
  
  // Increase retries for unreliable network
  CONFIG.MAX_RETRIES = 5;
  CONFIG.RETRY_DELAY_MS = 3000;
  
  try {
    const startUrl = 'https://slow-site.example.com';
    const results = crawlWebsite(startUrl, 2, 15);
    
    Logger.log(`Crawled ${results.length} pages with custom config`);
  } finally {
    // Restore original configuration
    CONFIG.MAX_RETRIES = originalRetries;
    CONFIG.RETRY_DELAY_MS = originalDelay;
  }
}
```

### Example 7: Custom Sheet Names

Write results to custom-named sheets:

```javascript
function example7_CustomSheets() {
  // Set custom sheet names
  CONFIG.RESULTS_SHEET_NAME = 'MySiteAudit';
  CONFIG.LOG_SHEET_NAME = 'AuditLogs';
  
  const startUrl = 'https://www.example.com';
  const results = crawlWebsite(startUrl, 2, 20);
  
  Logger.log('Results written to "MySiteAudit" sheet');
  Logger.log('Logs written to "AuditLogs" sheet');
  
  // Reset to defaults
  CONFIG.RESULTS_SHEET_NAME = 'CrawlResults';
  CONFIG.LOG_SHEET_NAME = 'CrawlerLogs';
}
```

---

## Real-World Scenarios

### Example 8: Blog Post Inventory

Create an inventory of all blog posts with their titles and descriptions:

```javascript
function example8_BlogInventory() {
  const blogUrl = 'https://www.example.com/blog';
  const results = crawlWebsite(blogUrl, 3, 100);
  
  // Filter for successful crawls with titles
  const posts = results.filter(r => r.success && r.title);
  
  Logger.log(`Found ${posts.length} blog posts:`);
  
  // Create a summary
  posts.forEach((post, index) => {
    Logger.log(`\n${index + 1}. ${post.title}`);
    Logger.log(`   URL: ${post.url}`);
    Logger.log(`   Description: ${post.description || 'No description'}`);
  });
  
  // Results are also in the CrawlResults sheet for export
}
```

**Use Case:** Content audit, migration planning, SEO review.

### Example 9: SEO Health Check

Check for common SEO issues:

```javascript
function example9_SEOHealthCheck() {
  const startUrl = 'https://www.yoursite.com';
  const results = crawlWebsite(startUrl, 3, 50);
  
  const issues = {
    noTitle: [],
    noDescription: [],
    longTitle: [],
    shortDescription: [],
    duplicateTitles: {}
  };
  
  results.forEach(page => {
    if (!page.success) return;
    
    // Check for missing title
    if (!page.title) {
      issues.noTitle.push(page.url);
    }
    
    // Check for missing description
    if (!page.description) {
      issues.noDescription.push(page.url);
    }
    
    // Check for long title (over 60 characters)
    if (page.title && page.title.length > 60) {
      issues.longTitle.push({
        url: page.url,
        length: page.title.length
      });
    }
    
    // Check for short description (under 120 characters)
    if (page.description && page.description.length < 120) {
      issues.shortDescription.push({
        url: page.url,
        length: page.description.length
      });
    }
    
    // Track duplicate titles
    if (page.title) {
      if (!issues.duplicateTitles[page.title]) {
        issues.duplicateTitles[page.title] = [];
      }
      issues.duplicateTitles[page.title].push(page.url);
    }
  });
  
  // Find actual duplicates
  const duplicates = Object.entries(issues.duplicateTitles)
    .filter(([title, urls]) => urls.length > 1);
  
  // Report findings
  Logger.log('=== SEO Health Check Report ===\n');
  Logger.log(`Pages crawled: ${results.filter(r => r.success).length}`);
  Logger.log(`\nIssues found:`);
  Logger.log(`  - Missing titles: ${issues.noTitle.length}`);
  Logger.log(`  - Missing descriptions: ${issues.noDescription.length}`);
  Logger.log(`  - Titles too long: ${issues.longTitle.length}`);
  Logger.log(`  - Descriptions too short: ${issues.shortDescription.length}`);
  Logger.log(`  - Duplicate titles: ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    Logger.log('\nDuplicate titles:');
    duplicates.forEach(([title, urls]) => {
      Logger.log(`  "${title}" appears on ${urls.length} pages`);
    });
  }
}
```

**Use Case:** Regular SEO audits, pre-launch checks, quality assurance.

### Example 10: Compare Pages Before/After Update

Track changes to page metadata:

```javascript
function example10_CompareChanges() {
  const url = 'https://www.example.com';
  
  // First crawl (before changes)
  Logger.log('Crawling site BEFORE changes...');
  CONFIG.RESULTS_SHEET_NAME = 'BeforeUpdate';
  const resultsBefore = crawlWebsite(url, 2, 30);
  
  // Wait or prompt user to make changes
  Logger.log('\nMake your changes now, then run the second part...');
  
  // In a separate run (after changes):
  // Logger.log('Crawling site AFTER changes...');
  // CONFIG.RESULTS_SHEET_NAME = 'AfterUpdate';
  // const resultsAfter = crawlWebsite(url, 2, 30);
  
  // Compare and find differences
  // (implementation would compare the two result sets)
  
  Logger.log('Check "BeforeUpdate" and "AfterUpdate" sheets to compare');
}
```

**Use Case:** Site redesigns, content updates, migration verification.

---

## Error Handling Examples

### Example 11: Handling Invalid URLs

Gracefully handle invalid input:

```javascript
function example11_HandleInvalidUrls() {
  const testUrls = [
    'https://www.example.com',      // Valid
    'not-a-url',                     // Invalid
    'javascript:void(0)',            // Invalid
    'http://nonexistent-site-xyz123.com' // Valid format, doesn't exist
  ];
  
  testUrls.forEach(url => {
    Logger.log(`\nTesting: ${url}`);
    
    const result = crawlSingleUrl(url);
    
    if (result.error) {
      Logger.log(`  Error: ${result.error}`);
    } else {
      Logger.log(`  Success: ${result.title || 'No title'}`);
    }
  });
}
```

### Example 12: Monitoring Crawl Progress

Track crawl progress with custom logging:

```javascript
function example12_MonitorProgress() {
  const logger = new Logger();
  const crawler = new WebCrawler(logger);
  
  const startUrl = 'https://www.example.com';
  
  logger.info('Starting monitored crawl');
  const results = crawler.crawl(startUrl, 2, 25);
  
  // Get detailed logs
  const logs = logger.getLogs();
  const errorLogs = logs.filter(log => log.level === LogLevel.ERROR);
  const warnLogs = logs.filter(log => log.level === LogLevel.WARN);
  
  Logger.log(`\n=== Crawl Summary ===`);
  Logger.log(`Total pages: ${results.length}`);
  Logger.log(`Errors: ${errorLogs.length}`);
  Logger.log(`Warnings: ${warnLogs.length}`);
  Logger.log(`Duration: ${logs[logs.length-1].elapsed}ms`);
  
  if (errorLogs.length > 0) {
    Logger.log('\nError details:');
    errorLogs.forEach(log => {
      Logger.log(`  ${log.message}`);
    });
  }
  
  // Write everything to sheets
  crawler.writeResultsToSheet();
  logger.writeToSheet();
}
```

---

## Tips for Using These Examples

1. **Start with Basic Examples**: Test with example 1 or 2 first to ensure everything works
2. **Adjust Parameters**: Modify maxDepth and maxUrls based on your needs and time constraints
3. **Monitor Execution Time**: Google Apps Script has execution limits (6 min for free accounts)
4. **Check the Sheets**: All examples write results to Google Sheets for detailed analysis
5. **Use Logger.log**: Check the script execution logs (View > Logs) for immediate output

## Common Modifications

### Modify Delay Between Requests
```javascript
// In the WebCrawler._crawlRecursive method, find:
Utilities.sleep(500);

// Change to your desired delay:
Utilities.sleep(1000);  // 1 second delay
```

### Filter URLs to Crawl
```javascript
// In the WebCrawler._crawlRecursive method, after extracting links:
const filteredLinks = links.filter(link => {
  // Example: Only crawl URLs containing '/blog/'
  return link.includes('/blog/');
});
```

### Custom Error Handling
```javascript
function customErrorHandling() {
  try {
    const results = crawlWebsite('https://example.com', 2, 20);
    
    // Your processing here
    
  } catch (error) {
    Logger.log('Critical error: ' + error.message);
    // Send email notification
    MailApp.sendEmail({
      to: 'admin@example.com',
      subject: 'Crawler Error',
      body: 'The crawler encountered an error: ' + error.message
    });
  }
}
```

---

## Next Steps

After trying these examples:
1. Read the main README.md for detailed documentation
2. Review the WebCrawler.gs code to understand the implementation
3. Customize the configuration for your specific needs
4. Create your own functions based on these examples

For more advanced usage, consider:
- Integrating with other Google services (Sheets API, Gmail, etc.)
- Creating scheduled triggers for regular crawls
- Exporting results to external systems via API
- Building custom reports based on crawl data
