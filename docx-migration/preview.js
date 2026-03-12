const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const OUTPUT_FILE = path.join(__dirname, 'output.html');

const template = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parsed HTML Preview</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f5f7;
            color: #333;
            margin: 0;
            padding: 40px;
            display: flex;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 800px;
            width: 100%;
        }
        h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        td, th { border: 1px solid #ddd; padding: 12px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .header {
            text-align: center;
            margin-bottom: 40px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Document360 Migration Preview</h2>
            <p>Below is the rendered HTML extracted directly from your sample.docx</p>
            <hr/>
        </div>
        <div class="content">
            ${content}
        </div>
    </div>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        try {
            const htmlContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(template(htmlContent));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error reading output.html. Please ensure you have run `node index.js` first to generate it.\n\n' + error.message);
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Preview server running at http://localhost:${PORT}/`);
    console.log(`Press Ctrl+C to stop the server.`);
});
