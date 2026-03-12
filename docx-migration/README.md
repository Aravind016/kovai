# Document360 Migration Application

This Node.js application automates the process of reading a Microsoft Word document (`.docx`), converting its content to clean HTML, and uploading it to Document360 via their Article Creation POST API.

## Requirements

- Node.js installed

## Tools Used

- **JavaScript (Node.js)**: Core language
- **[mammoth](https://www.npmjs.com/package/mammoth)**: Used for robust `.docx` parsing and HTML conversion. It automatically maps Word document styles to valid semantic HTML tags (e.g., `<p>`, `<h1>`, `<h2>`, `<ul>`, `<ol>`, `<table>`).
- **[axios](https://www.npmjs.com/package/axios)**: Used to handle the REST API (POST) requests to Document360.
- **[dotenv](https://www.npmjs.com/package/dotenv)**: Environment variable management for API keys securely.

## Setup Instructions

1. Run `npm install` to install necessary dependencies.
2. Place the Microsoft Word document you want to migrate in the project root and name it `sample.docx`.
3. Open the `.env` file and configure your Document360 API details:
   - `DOC360_API_TOKEN`
   - `DOC360_PROJECT_VERSION_ID`
   - `DOC360_CATEGORY_ID`

## Running the Application

Execute the following command:

```bash
npm start
```

### Application Workflow
1. The script first verifies the presence of `sample.docx`.
2. It uses `mammoth` to extract text, headings, lists, tables, and hyperlinks, converting them precisely to structured HTML without losing context or formatting.
3. The converted HTML is saved locally to `output.html` so you can manually review it.
4. If your `.env` contains the keys, the tool initiates a POST API request to Document360.
5. Finally, it logs the successful API response and Article ID, or any relevant error messages.
