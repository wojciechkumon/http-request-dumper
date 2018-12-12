const fs = require('fs');

const htmlTemplate = fs.readFileSync('logs-list-template.html', 'utf8');

const listRequestLogs = (request, response, requestDumpsDir) => {
    request.on('data', chunk => {});
    request.on('end', () => {

        fs.readdir(requestDumpsDir, (err, files) => {
            if (err) {
                response.writeHead(500);
                response.end();
                console.error(err);
                return;
            }

            response.writeHead(200);
            const linksHtml = files
                .map(file => buildSingleLinkHtml(`/${requestDumpsDir}/${file}`, file))
                .join('\r\n');
            const filledTemplate = htmlTemplate.replace('{INSERT_LINKS_HERE}', linksHtml);
            response.write(filledTemplate);
            response.end();
        })
    });
};

const buildSingleLinkHtml = (href, text) =>
    `<a href="${href}" class="list-group-item list-group-item-action">${text}</a>`;

module.exports = listRequestLogs;
