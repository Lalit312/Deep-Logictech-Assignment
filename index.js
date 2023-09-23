const http = require('http');
const https = require('https');
const { parse } = require('url');

// Constants
const PORT = 3000;
const TIME_URL = 'https://time.com';

// Create an HTTP server
const server = http.createServer(handleRequest);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Request handler function
function handleRequest(req, res) {
  const { url, method } = req;
  
  if (url === '/getTimeStories' && method === 'GET') {
    fetchTimeStories(res);
  } else {
    notFound(res);
  }
}

// Fetch Time.com stories
function fetchTimeStories(res) {
  https.get(TIME_URL, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      const latestStories = extractLatestStories(data);
      respondWithJSON(res, 200, latestStories);
    });
  }).on('error', (error) => {
    respondWithError(res, 500, `Error: ${error.message}`);
  });
}

// Extract latest stories from HTML
function extractLatestStories(html) {
  const topStories = [];
  const startMarker = "<h2 class=\"latest-stories__heading\">Latest Stories</h2>\n";
  const endMarker = "</time>\n            </li>\n          </ul>";

  const startIndex = html.indexOf(startMarker);
  const endIndex = html.indexOf(endMarker, startIndex + startMarker.length);
  const extractedContent = html.substring(startIndex + startMarker.length, endIndex);
  const items = extractedContent.split('<li class="latest-stories__item">');
  items.shift();

  for (let i = 0; i < 6; i++) {
    const item = items[i];
    const titleStartIndex = item.indexOf('<h3 class="latest-stories__item-headline">');
    const titleEndIndex = item.indexOf('</h3>', titleStartIndex);
    const title = item.substring(titleStartIndex + '<h3 class="latest-stories__item-headline">'.length, titleEndIndex).trim();
    const linkStartIndex = item.indexOf('<a href="');
    const linkEndIndex = item.indexOf('">', linkStartIndex);
    const link = item.substring(linkStartIndex + '<a href="'.length, linkEndIndex);
    topStories.push({ title, link });
  }

  return topStories;
}

// Helper function to respond with JSON data
function respondWithJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Helper function to respond with an error message
function respondWithError(res, statusCode, errorMessage) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
  res.end(errorMessage);
}

// Helper function for 404 Not Found response
function notFound(res) {
  respondWithError(res, 404, 'Not Found');
}
