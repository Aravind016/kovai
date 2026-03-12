const fs = require('fs');
const docx = require('docx');

const { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableRow, TableCell, ExternalHyperlink, File } = docx;

// Configure Custom Numbering for the document
const numberingConfig = {
    config: [
        {
            reference: "my-numbering",
            levels: [
                {
                    level: 0,
                    format: "decimal",
                    text: "%1.",
                    alignment: "start",
                }
            ]
        }
    ]
};

// Create a new Word document containing headings, paragraphs, lists, tables, and hyperlinks
const doc = new Document({
    creator: "CLI Tool",
    title: "Sample Document",
    description: "A sample document to test the Migration Tool",
    numbering: numberingConfig,
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "Document360 Migration Test",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                children: [
                    new TextRun("This is a sample paragraph. The migration tool should be able to process this and convert it gracefully into a "),
                    new TextRun({ text: "<p>", bold: true }),
                    new TextRun(" tag in HTML."),
                ],
            }),
            new Paragraph({
                text: "Features Supported",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "Item 1 in a bulleted list",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "Item 2 in a bulleted list",
                bullet: { level: 0 }
            }),
            new Paragraph({ text: "" }), // spacing
            new Paragraph({
                text: "Step 1 in a numbered list",
                numbering: { reference: "my-numbering", level: 0 }
            }),
            new Paragraph({
                text: "Step 2 in a numbered list",
                numbering: { reference: "my-numbering", level: 0 }
            }),
            new Paragraph({ text: "" }), // spacing
            new Paragraph({
                text: "Data Table",
                heading: HeadingLevel.HEADING_2,
            }),
            new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph("Header 1")] }),
                            new TableCell({ children: [new Paragraph("Header 2")] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph("Row 1, Cell 1")] }),
                            new TableCell({ children: [new Paragraph("Row 1, Cell 2")] }),
                        ],
                    }),
                ],
            }),
            new Paragraph({ text: "" }), // spacing
            new Paragraph({
                children: [
                    new TextRun("Here is a "),
                    new ExternalHyperlink({
                        children: [
                            new TextRun({
                                text: "link to Document360",
                                style: "Hyperlink",
                            }),
                        ],
                        link: "https://document360.com/",
                    }),
                    new TextRun(" for testing hyperlinks."),
                ],
            }),
        ],
    }],
});

// Write the file to disk
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("sample.docx", buffer);
    console.log("sample.docx created successfully.");
});
