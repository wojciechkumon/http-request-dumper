const fs = require('fs');
const http = require('http');
const listRequestLogs = require('./logs-list-handler');
const serveLogFile = require('./log-file-server');
const deleteLogs = require('./logs-delete-handler');
const saveLog = require('./logs-saving-handler');

/* one optional program argument: serverPort (example: node http-request-dumper 80) */
const main = () => {
    let port = 3000;
    if (process.argv.length >= 3) {
        port = process.argv[2];
    }
    const hostname = '0.0.0.0';
    const requestDumpsDir = 'requests';

    createRequestsDirIfNotExists(requestDumpsDir);

    console.log(`Listening on ${hostname}:${port}`);
    console.log('Saving all requests except: /requests, /requests/{fileName}, /favicon.ico');
    console.log('API:');
    console.log('GET /requests');
    console.log('GET /requests/{fileName}');
    console.log('DELETE /requests');

    buildServer(requestDumpsDir).listen(port, hostname);
};

const createRequestsDirIfNotExists = requestDumpsDir =>
    fs.exists(requestDumpsDir, exists => {
        if (!exists) {
            fs.mkdir(requestDumpsDir, err => {if (err) throw err});
        }
    });

const buildServer = requestDumpsDir => {
    const requestFileRegex = new RegExp('/requests/(\\S+)');
    const fileNameGroup = 1;
    return http.createServer((request, response) => {
        const httpMethod = request.method.toUpperCase();
        const requestUri = request.url;

        if (httpMethod === 'GET' && requestUri === '/requests') {
            listRequestLogs(request, response, requestDumpsDir);
        } else if (httpMethod === 'DELETE' && requestUri === '/requests') {
            deleteLogs(request, response, requestDumpsDir);
        } else if (httpMethod === 'GET' && requestFileRegex.test(requestUri)) {
            serveLogFile(request, response, requestDumpsDir,
                requestFileRegex.exec(requestUri)[fileNameGroup]);
        } else if (requestUri === '/favicon.ico') {
            ignoreRequest(request, response);
        } else {
            saveLog(request, response, requestDumpsDir);
        }
    });
};

const ignoreRequest = (request, response) => {
    request.on('data', chunk => {});
    request.on('end', () => {
        response.writeHead(200);
        response.end();
    });
};

main();

