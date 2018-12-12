const fs = require('fs');

const saveLog = (request, response, requestDumpsDir) => {
    const httpMethod = request.method.toUpperCase();
    const requestUri = request.url;

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
        writeRequestToFile(fullRequest, requestDumpsDir);
    });
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

const writeRequestToFile = (data, requestDumpsDir) => {
    const file = `${requestDumpsDir}/${getNewFileName()}.log`;
    fs.writeFile(
        file,
        wrapRequestWithMetadata(data),
        err => {if (err) console.error(err)}
    );
};

const getNewFileName = () =>
    new Date().toISOString().replace(fileNameReplaceRegex, '_');
const fileNameReplaceRegex = /[:.]/g;

const wrapRequestWithMetadata = data =>
    `New request (${new Date().toUTCString()}):\r\n${data}`;

module.exports = saveLog;
