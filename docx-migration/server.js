const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files
const PORT = 4000;

// Store the latest parsed HTML in memory so the migrate button can access it
let latestHtmlContent = "";

// Keep old references for HTML layout
const template = (resultContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Docx to HTML Migration</title>
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
            max-width: 900px;
            width: 100%;
        }
        h1, h2, h3 { color: #2c3e50; }
        .upload-area {
            border: 2px dashed #3498db;
            padding: 40px;
            text-align: center;
            border-radius: 8px;
            background: #fdfdfd;
            margin-bottom: 30px;
        }
        .btn {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 15px;
        }
        .btn:hover { background-color: #2980b9; }
        .output-box {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            padding: 20px;
            border-radius: 6px;
            margin-top: 20px;
        }
        /* Format for showing code */
        pre {
            background: #272822;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
            font-family: 'Courier New', Courier, monospace;
        }
        /* Format for preview */
        .preview-box {
            border: 1px solid #ddd;
            padding: 20px;
            margin-top: 20px;
            background: #fff;
        }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        td, th { border: 1px solid #ddd; padding: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Document Migration Tool</h1>
        <p>Upload a <b>.docx</b> file below to convert it into Semantic HTML.</p>
        
        <form class="upload-area" action="/convert" method="POST" enctype="multipart/form-data">
            <input type="file" name="document" accept=".docx" required />
            <br/>
            <button type="submit" class="btn">Convert Document</button>
        </form>

        ${resultContent || ''}
        
    </div>
</body>
</html>
`;

// GET: Render the initial upload limit
app.get('/', (req, res) => {
    res.send(template(''));
});

// POST: Handle document upload and conversion
app.post('/convert', upload.single('document'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send("No file uploaded!");
    }

    try {
        // Read the uploaded file directly into Mammoth
        const result = await mammoth.convertToHtml({ path: file.path });
        const htmlContent = result.value;

        // Cleanup the temporary file from disk securely
        fs.unlinkSync(file.path);

        // Save to memory for migration
        latestHtmlContent = htmlContent;

        // Parse the HTML using jsdom to list out elements and their contents
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(htmlContent);
        const elements = dom.window.document.body.querySelectorAll('*');
        
        let tagsListHtml = `<table style="width:100%; text-align:left;">
            <tr>
                <th style="width:20%">HTML Tag</th>
                <th style="width:20%">Element Type</th>
                <th>Extracted Content Snippet</th>
            </tr>`;

        // Map tag names to human-readable names for the assignment
        const tagMap = {
            'H1': 'Heading 1', 'H2': 'Heading 2', 'H3': 'Heading 3',
            'P': 'Paragraph', 'UL': 'Bullet List', 'OL': 'Numbered List',
            'LI': 'List Item', 'TABLE': 'Table', 'TR': 'Table Row',
            'TD': 'Table Cell', 'A': 'Hyperlink', 'STRONG': 'Bold Text'
        };

        elements.forEach(el => {
            const tagName = el.tagName;
            // Only list structural block elements that are important to the document
            if (['HTML', 'HEAD', 'BODY', 'TBODY', 'THEAD'].includes(tagName)) return;

            const friendlyName = tagMap[tagName] || tagName;
            
            // For block elements containing lots of children (like lists/tables), just show a summary
            let contentSnippet = el.textContent.trim().substring(0, 80);
            if (el.textContent.trim().length > 80) contentSnippet += '...';
            
            // Special handling for links to show href
            if (tagName === 'A') {
                contentSnippet = `Link Text: "${contentSnippet}" | URL: ${el.href}`;
            }

            // Exclude empty structural wrappers like <ul> or <table> that only contain whitespace directly
            if (['UL', 'OL', 'TABLE', 'TR'].includes(tagName) && !el.textContent.trim()) {
                contentSnippet = `[Contains ${el.children.length} nested elements]`;
            }

            tagsListHtml += `
                <tr>
                    <td><strong>&lt;${tagName.toLowerCase()}&gt;</strong></td>
                    <td>${friendlyName}</td>
                    <td><em>${contentSnippet || '[Empty/Structural]'}</em></td>
                </tr>
            `;
        });
        tagsListHtml += `</table>`;

        // Escape specific HTML tags safely to show them visually for learning/review
        const formattedCode = htmlContent
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Format a beautifully rendered UI with both views (Source and Parsed List)
        const resultContent = `
            <h2>Conversion Results</h2>
            <hr/>
            
            <h3>Structured Formats Found in Document</h3>
            <p>Here is a breakdown of every element identified in your document and how it was mapped to HTML:</p>
            <div class="preview-box" style="padding: 0;">
                ${tagsListHtml}
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <form action="/migrate" method="POST" style="display: inline;">
                    <button type="submit" class="btn" style="background-color: #2ecc71;">Migrate to Document360</button>
                </form>
                <a href="/"><button class="btn" style="margin-left: 10px;">Upload Another Document</button></a>
            </div>
        `;

        // Send back the dynamically built UI
        res.send(template(resultContent));

    } catch (error) {
        // Cleanup file if error occurs
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(500).send(`Error parsing document: ${error.message}`);
    }
});

app.post('/migrate', async (req, res) => {
    if (!latestHtmlContent) {
        return res.status(400).send("No document has been converted yet to migrate.");
    }

    const API_TOKEN = process.env.DOC360_API_TOKEN?.trim();
    const PROJECT_VERSION_ID = process.env.DOC360_PROJECT_VERSION_ID?.trim();
    const CATEGORY_ID = process.env.DOC360_CATEGORY_ID?.trim();
    
    if (!API_TOKEN || API_TOKEN === 'YOUR_API_TOKEN_HERE') {
        return res.send(template(`
            <h2 style="color: #e74c3c;">Migration Failed</h2>
            <p>Please configure your Document360 API Token and IDs in the <b>.env</b> file.</p>
            <a href="/"><button class="btn">Go Back</button></a>
        `));
    }

    try {
        const url = 'https://apihub.document360.io/v2/ProjectVersions/' + PROJECT_VERSION_ID + '/Categories/' + CATEGORY_ID + '/Articles';
        const payload = {
            title: 'Migrated Document ' + new Date().toISOString(),
            content: latestHtmlContent,
            contentType: 1, // HTML
        };

        const response = await axios.post(url, payload, {
            headers: {
                'api_token': API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        res.send(template(`
            <h2 style="color: #2ecc71;">Migration Successful!</h2>
            <p>Your original DOCX file has been accurately parsed and published to Document360.</p>
            <div class="preview-box">
                <p><strong>Article ID:</strong> ${response.data?.data?.id || 'Unknown'}</p>
                <p><strong>Article Title:</strong> ${response.data?.data?.title || payload.title}</p>
            </div>
            <div style="text-align: center; margin-top: 40px;">
                <p style="color: #666;">Check your Document360 portal to verify the structure! Take a screenshot for your deliverables.</p>
                <a href="/"><button class="btn">Upload Another Document</button></a>
            </div>
        `));
    } catch (error) {
        let errorMsg = error.message;
        if (error.response && error.response.data) {
            errorMsg = JSON.stringify(error.response.data, null, 2);
        }
        res.status(500).send(template(`
            <h2 style="color: #e74c3c;">Migration Failed</h2>
            <pre><code>${errorMsg}</code></pre>
            <a href="/"><button class="btn">Go Back</button></a>
        `));
    }
});

app.listen(PORT, () => {
    console.log(`Web UI Server running at http://localhost:${PORT}`);
    console.log('Upload your Word documents there to see their parsed HTML source output!');
});
