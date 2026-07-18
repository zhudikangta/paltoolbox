const childProcess = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const rootDir = __dirname;
const host = '127.0.0.1';
const preferredPort = Number(process.env.PT_PREVIEW_PORT || process.argv[2]) || 51777;
const maxPortTries = 20;

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm'
};

function resolveFile(requestUrl) {
    let pathname = new URL(requestUrl, 'http://localhost').pathname;
    try {
        pathname = decodeURIComponent(pathname);
    } catch (error) {
        return null;
    }
    if (pathname === '/') pathname = '/入口页面/index.html';
    const filePath = path.normalize(path.join(rootDir, pathname));
    if (filePath !== rootDir && !filePath.startsWith(rootDir + path.sep)) return null;
    return filePath;
}

function sendFile(response, filePath) {
    fs.stat(filePath, function(statError, stat) {
        if (statError || !stat.isFile()) {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end('Not found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        response.writeHead(200, {
            'Content-Type': contentTypes[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(response);
    });
}

function openBrowser(url) {
    if (process.platform === 'win32') {
        childProcess.execFile('cmd', ['/c', 'start', '', url], { windowsHide: true });
        return;
    }
    if (process.platform === 'darwin') {
        childProcess.spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
        return;
    }
    childProcess.spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
}

function startServer(port, triedCount) {
    const server = http.createServer(function(request, response) {
        const filePath = resolveFile(request.url || '/');
        if (!filePath) {
            response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end('Forbidden');
            return;
        }
        sendFile(response, filePath);
    });

    server.on('error', function(error) {
        if (error.code === 'EADDRINUSE' && triedCount < maxPortTries) {
            startServer(port + 1, triedCount + 1);
            return;
        }
        console.error('');
        console.error('Preview server failed to start.');
        console.error(error && error.message ? error.message : error);
        console.error('');
        console.error('Press any key to close this window.');
        process.stdin.setRawMode && process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', function() { process.exit(1); });
    });

    server.listen(port, host, function() {
        const url = 'http://' + host + ':' + port + '/%E5%85%A5%E5%8F%A3%E9%A1%B5%E9%9D%A2/index.html';
        console.log('');
        console.log('PalToolbox local preview is running.');
        console.log('');
        console.log('Open address:');
        console.log(url);
        console.log('');
        console.log('Keep this window open while using the site.');
        console.log('Close this window or press Ctrl+C to stop the local preview server.');
        console.log('');
        if (process.env.PT_PREVIEW_NO_OPEN !== '1') openBrowser(url);
    });
}

process.on('SIGINT', function() {
    console.log('');
    console.log('Local preview server stopped.');
    process.exit(0);
});

startServer(preferredPort, 0);
