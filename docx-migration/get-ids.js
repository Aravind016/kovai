require('dotenv').config();
const axios = require('axios');

const API_TOKEN = process.env.DOC360_API_TOKEN;

async function getIds() {
    if (!API_TOKEN || API_TOKEN === 'YOUR_API_TOKEN_HERE') {
        console.error("Please add your DOC360_API_TOKEN to the .env file first!");
        return;
    }

    try {
        console.log("Fetching Project Versions...");
        const projectResponse = await axios.get('https://apihub.document360.io/v2/ProjectVersions', {
            headers: { 'api_token': API_TOKEN }
        });

        const versions = projectResponse.data.data;
        if (!versions || versions.length === 0) {
            console.log("No project versions found.");
            return;
        }

        console.log("\n=== Available Project Versions ===");
        versions.forEach(v => {
            console.log(`- Name: ${v.name}`);
            console.log(`  Project Version ID: ${v.id}  <-- copy this`);
        });

        // Let's get categories for the first (main) version
        const mainVersion = versions.find(v => v.is_main_version) || versions[0];
        console.log(`\nFetching Categories for project version: ${mainVersion.name}...`);
        
        const categoryResponse = await axios.get(`https://apihub.document360.io/v2/ProjectVersions/${mainVersion.id}/Categories`, {
            headers: { 'api_token': API_TOKEN }
        });

        const categories = categoryResponse.data.data;
        console.log("\n=== Available Categories ===");
        categories.forEach(c => {
            console.log(`- Category Name: ${c.name}`);
            console.log(`  Category ID: ${c.id}  <-- copy this`);
        });

        console.log("\nNow you can copy these IDs into your .env file!");

    } catch (error) {
        console.error("Failed to fetch data:", error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

getIds();
