const fs = require('fs');
const http = require('http');

let LISTEN_PORT = 3000;
if (process.argv.length >= 3) {
    LISTEN_PORT = process.argv[2];
}

const LISTEN_HOSTNAME = '0.0.0.0';
const REQUESTS_DUMP_FILE = 'HTTP_requests.log';

const wrapRequestWithMetadata = data =>
    `New request (${new Date().toUTCString()}):\r\n${data}\r\n\r\n`;

const writeRequestToFile = (data) =>
    fs.appendFile(
        REQUESTS_DUMP_FILE,
        wrapRequestWithMetadata(data),
        () => {}
    );

const buildHttpHeaders = rawHeaders => {
    const headers = [];
    for (let i = 0; i < rawHeaders.length / 2; i++) {
        const headerKey = rawHeaders[2 * i];
        const headerValue = rawHeaders[2 * i + 1];
        headers.push(`${headerKey}: ${headerValue}`);
    }
    return headers;
};

const buildRawHttpRequest = (httpMethod, uri, httpVersion, headersArray, body) =>
    `${httpMethod} ${uri} HTTP/${httpVersion}\r\n` +
    `${headersArray.join('\r\n')}\r\n` +
    '\r\n' +
    body;

const onOtherRequest = (request, response, httpMethod, requestUri) => {
    const rawBodyChunks = [];
    request.on('data', chunk => {
        rawBodyChunks.push(chunk);
    });

    request.on('end', () => {
        response.writeHead(200);
        response.end();

        const httpVersion = request.httpVersion;
        const headers = buildHttpHeaders(request.rawHeaders);
        const body = rawBodyChunks.join('');
        const fullRequest = buildRawHttpRequest(httpMethod, requestUri, httpVersion, headers, body);
        writeRequestToFile(fullRequest);
    });
};

const listRequestLogs = (request, response) => {
    request.on('data', chunk => {});
    request.on('end', () => {
        response.writeHead(200);
        response.end();
    });
};

const requestFileRegex = new RegExp('/requests/(\\S+)');
const serveLogFile = (request, response, requestUri) => {
    request.on('data', chunk => {});
    request.on('end', () => {
        response.writeHead(200);
        response.end();
    });
};

const server = http.createServer((request, response) => {
    const httpMethod = request.method.toUpperCase();
    const requestUri = request.url;

    if (httpMethod === 'GET' && requestUri === '/requests') {
        listRequestLogs(request, response);
    } else if (httpMethod === 'GET' && requestFileRegex.test(requestUri)) {
        serveLogFile(request, response, requestUri);
    } else {
        onOtherRequest(request, response, httpMethod, requestUri);
    }
});

// start listening server
console.log(`Listening on ${LISTEN_HOSTNAME}:${LISTEN_PORT}`);
server.listen(LISTEN_PORT, LISTEN_HOSTNAME);
