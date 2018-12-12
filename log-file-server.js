const fs = require('fs');

const serveLogFile = (request, response, requestDumpsDir, fileName) => {
    request.on('data', chunk => {});
    request.on('end', () => {
        fs.readFile(`${requestDumpsDir}/${fileName}`, 'utf8', (err, fileContent) => {
            if (err) {
                response.writeHead(404);
                response.end();
                return;
            }

            response.setHeader('Content-Type', 'text/plain');
            response.writeHead(200);
            response.write(fileContent);
            response.end();
        });
    });
};

module.exports = serveLogFile;
