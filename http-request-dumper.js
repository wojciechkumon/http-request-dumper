const fs = require('fs');
const http = require('http');
const listRequestLogs = require('./logs-list-handler');
const deleteLogs = require('./logs-delete-handler');
const saveLog = require('./logs-saving-handler');

let LISTEN_PORT = 3000;
if (process.argv.length >= 3) {
    LISTEN_PORT = process.argv[2];
}

const LISTEN_HOSTNAME = '0.0.0.0';
const REQUEST_DUMPS_DIR = 'requests';


const requestFileRegex = new RegExp('/requests/(\\S+)');
const serveLogFile = (request, response) => {
    const requestUri = request.url;

    request.on('data', chunk => {});
    request.on('end', () => {
        response.writeHead(200);
        response.end();
    });
};

const ignoreRequest = (request, response) => {
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
        listRequestLogs(request, response, REQUEST_DUMPS_DIR);
    } else if (httpMethod === 'DELETE' && requestUri === '/requests') {
        deleteLogs(request, response, REQUEST_DUMPS_DIR);
    } else if (httpMethod === 'GET' && requestFileRegex.test(requestUri)) {
        serveLogFile(request, response);
    } else if (requestUri === '/favicon.ico') {
        ignoreRequest(request, response);
    } else {
        saveLog(request, response, REQUEST_DUMPS_DIR);
    }
});

fs.exists(REQUEST_DUMPS_DIR, exists => {
    if (!exists) {
        fs.mkdir(REQUEST_DUMPS_DIR, err => {if (err) throw err});
    }
});
console.log(`Listening on ${LISTEN_HOSTNAME}:${LISTEN_PORT}`);
server.listen(LISTEN_PORT, LISTEN_HOSTNAME);
