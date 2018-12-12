const fs = require('fs');
const path = require('path');
const http = require('http');
const listRequestLogs = require('./logs-list-handler');

let LISTEN_PORT = 3000;
if (process.argv.length >= 3) {
    LISTEN_PORT = process.argv[2];
}

const LISTEN_HOSTNAME = '0.0.0.0';
const REQUEST_DUMPS_DIR = 'requests';

const wrapRequestWithMetadata = data =>
    `New request (${new Date().toUTCString()}):\r\n${data}`;

const fileNameReplaceRegex = /[:.]/g;
const getNewFileName = () =>
    new Date().toISOString().replace(fileNameReplaceRegex, '_');

const writeRequestToFile = (data) => {
    const file = `${REQUEST_DUMPS_DIR}/${getNewFileName()}.log`;
    fs.writeFile(
        file,
        wrapRequestWithMetadata(data),
        err => {if (err) console.error(err)}
    );
};

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

const deleteLogs = (request, response) => {
    request.on('data', chunk => {});
    request.on('end', () => {
        response.writeHead(200);
        response.end();
    });
    fs.readdir(REQUEST_DUMPS_DIR, (err, files) => {
        if (err) console.error(err);

        for (const file of files) {
            fs.unlink(path.join(REQUEST_DUMPS_DIR, file), err => {
                if (err) console.error(err);
            });
        }
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
        listRequestLogs(request, response, REQUEST_DUMPS_DIR);
    } else if (httpMethod === 'DELETE' && requestUri === '/requests') {
        deleteLogs(request, response, requestUri);
    } else if (httpMethod === 'GET' && requestFileRegex.test(requestUri)) {
        serveLogFile(request, response, requestUri);
    } else {
        onOtherRequest(request, response, httpMethod, requestUri);
    }
});

fs.exists(REQUEST_DUMPS_DIR, exists => {
    if (!exists) {
        fs.mkdir(REQUEST_DUMPS_DIR, err => {if (err) throw err});
    }
});
console.log(`Listening on ${LISTEN_HOSTNAME}:${LISTEN_PORT}`);
server.listen(LISTEN_PORT, LISTEN_HOSTNAME);

