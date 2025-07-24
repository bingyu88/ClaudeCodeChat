const fs = require('fs');
const path = require('path');

const langDir = path.join(__dirname, 'lang');
const baseFile = path.join(langDir, 'en.js');

// Mock window object
global.window = {};

function getKeys(filePath) {
    try {
        // Clear cache to get fresh file content
        delete require.cache[require.resolve(filePath)];
        require(filePath);
        const langCode = path.basename(filePath, '.js');
        if (global.window.translations && global.window.translations[langCode]) {
            return Object.keys(global.window.translations[langCode]);
        }
        return [];
    } catch (e) {
        console.error(`Error loading or parsing ${filePath}:`, e);
        return null;
    }
}

const baseKeys = getKeys(baseFile);
if (!baseKeys) {
    console.error('Could not load base translation file en.js. Aborting.');
    process.exit(1);
}

const baseKeyCount = baseKeys.length;
console.log(`Base file en.js has ${baseKeyCount} keys.`);

const langFiles = fs.readdirSync(langDir).filter(file => file.endsWith('.js') && file !== 'en.js');

let allFilesValid = true;

for (const file of langFiles) {
    const filePath = path.join(langDir, file);
    const keys = getKeys(filePath);

    if (keys === null) {
        console.error(`[ERROR] ${file} has syntax errors or could not be loaded.`);
        allFilesValid = false;
        continue;
    }

    if (keys.length !== baseKeyCount) {
        console.warn(`[WARNING] ${file} has ${keys.length} keys, but en.js has ${baseKeyCount}.`);
        const missingKeys = baseKeys.filter(k => !keys.includes(k));
        const extraKeys = keys.filter(k => !baseKeys.includes(k));
        if(missingKeys.length > 0) {
            console.warn(`  Missing keys: ${missingKeys.join(', ')}`);
        }
        if(extraKeys.length > 0) {
            console.warn(`  Extra keys: ${extraKeys.join(', ')}`);
        }
        allFilesValid = false;
    } else {
        console.log(`[OK] ${file} has ${keys.length} keys.`);
    }
}

if (allFilesValid) {
    console.log('\nAll translation files are valid and have the correct number of keys!');
} else {
    console.error('\nSome translation files have issues. Please review the warnings/errors above.');
    process.exit(1);
}
