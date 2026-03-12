require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const axios = require('axios');

// Default target file to read
const DOCX_PATH = path.join(__dirname, 'Aravindkumar_docx_migration_test_file.docx');
const OUTPUT_HTML_PATH = path.join(__dirname, 'output.html');

// Document360 API credentials and endpoint configuration
const API_TOKEN = process.env.DOC360_API_TOKEN?.trim();
const PROJECT_VERSION_ID = process.env.DOC360_PROJECT_VERSION_ID?.trim();
const CATEGORY_ID = process.env.DOC360_CATEGORY_ID?.trim();
const ARTICLE_TITLE = 'Migrated Document ' + new Date().toISOString();

async function main() {
    try {
        console.log('1. Reading the Word document and extracting content...');
        if (!fs.existsSync(DOCX_PATH)) {
            console.error(`Error: File not found at ${DOCX_PATH}`);
            console.log('Please ensure you have placed a sample.docx in the project directory.');
            return;
        }

        // Mammoth automatically maps Word styles to standard HTML tags (headings, paragraphs, lists, tables).
        const result = await mammoth.convertToHtml({ path: DOCX_PATH });
        let htmlContent = result.value; 
        const messages = result.messages; 

        if (messages.length > 0) {
            console.log('Parsing messages/warnings:');
            messages.forEach(msg => console.log(` - ${msg.type}: ${msg.message}`));
        }

        console.log('2. Successfully extracted structured content & converted to clean HTML.');
        
        // Save HTML output to verify the output locally
        fs.writeFileSync(OUTPUT_HTML_PATH, htmlContent);
        console.log(`Saved HTML output locally to ${OUTPUT_HTML_PATH}`);

        // Checking if API token is configured to perform upload
        console.log('3. Uploading to Document360...');
        if (!API_TOKEN || API_TOKEN === 'YOUR_API_TOKEN_HERE') {
            console.warn('Skipping API upload! Please configure DOC360_API_TOKEN in the .env file to run the API integration.');
            return;
        }

        // Upload the generated HTML to document360
        const response = await uploadToDocument360(htmlContent);
        
        if (response.status === 200 || response.status === 201) {
            console.log('Success: Article successfully created in Document360!');
            console.log(`Article Details:\n  ID: ${response.data?.data?.id}\n  Title: ${response.data?.data?.title}`);
            console.log('Check your Document360 portal. Take a screenshot for your deliverables.');
        } else {
            console.log(`Upload failed with status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Migration failed:', error.message);
        if (error.response && error.response.data) {
            console.error('API Error Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

/**
 * Upload content to Document360.
 * Ref: Document360 API documentation for creating an article.
 */
async function uploadToDocument360(htmlContent) {
    const url = 'https://apihub.document360.io/v2/ProjectVersions/' + PROJECT_VERSION_ID + '/Categories/' + CATEGORY_ID + '/Articles';
    
    const payload = {
        title: ARTICLE_TITLE,
        content: htmlContent,
        contentType: 1, // 1 for HTML
    };

    return await axios.post(url, payload, {
        headers: {
            'api_token': API_TOKEN,
            'Content-Type': 'application/json'
        }
    });
}

main();
