const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8"
};

http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    const file = path.join(root, rel);

    if (!file.startsWith(root)) {
        res.writeHead(403).end("forbidden");
        return;
    }

    fs.readFile(file, (err, buf) => {
        if (err) {
            res.writeHead(404).end("not found");
            return;
        }
        res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
        res.end(buf);
    });
}).listen(8731, () => console.log("serving on 8731"));