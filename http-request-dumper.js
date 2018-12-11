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
        () => console.log(`End of writing to file`)
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

const server = http.createServer((request, response) => {
    const httpMethod = request.method.toUpperCase();
    const requestUri = request.url;

    console.log(`Incoming request. Method: ${httpMethod}, URI: ${requestUri}`);

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
        console.log(fullRequest);
        writeRequestToFile(fullRequest);
    });
});

// start listening server
console.log(`Listening on ${LISTEN_HOSTNAME}:${LISTEN_PORT}`);
server.listen(LISTEN_PORT, LISTEN_HOSTNAME);
