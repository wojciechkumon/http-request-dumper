const fs = require('fs');
const path = require('path');

const deleteLogs = (request, response, requestDumpsDir) => {
    request.on('data', chunk => {});
    request.on('end', () => {
        response.writeHead(204);
        response.end();
    });
    fs.readdir(requestDumpsDir, (err, files) => {
        if (err) console.error(err);

        for (const file of files) {
            fs.unlink(path.join(requestDumpsDir, file), err => {
                if (err) console.error(err);
            });
        }
    });
};

module.exports = deleteLogs;
