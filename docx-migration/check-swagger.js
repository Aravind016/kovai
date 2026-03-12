const fs = require('fs');
const doc = JSON.parse(fs.readFileSync('swagger.json'));
console.log(JSON.stringify(doc.paths['/v2/Articles']?.post?.parameters, null, 2));

// Manually dump the referenced definitions
console.log('--- DEFINITIONS ---');
const defs = Object.keys(doc.definitions).filter(k => k.includes('Article'));
for (const d of defs) {
    if (d.includes('Create') || d.includes('Add')) {
        console.log(`\nDEF ${d}:`);
        console.log(JSON.stringify(doc.definitions[d], null, 2));
    }
}

