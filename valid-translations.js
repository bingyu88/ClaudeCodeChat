const fs = require('fs');
const path = require('path');

const langDir = path.join(__dirname, 'lang');
const baseLangFile = path.join(langDir, 'en.js');

// Mock window object to load translation files
function getTranslationsFromFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // A safer eval-like approach for this specific structure
        const context = { window: { translations: {} } };
        new Function('window', fileContent)(context.window);
        const langKey = path.basename(filePath, '.js');
        return context.window.translations[langKey] || null;
    } catch (e) {
        console.error(`❌ Syntax error or parsing issue in ${path.basename(filePath)}: ${e.message}`);
        return null;
    }
}

function verifyTranslations() {
    console.log('🚀 Starting verification of translation files...');

    const baseTranslations = getTranslationsFromFile(baseLangFile);
    if (!baseTranslations) {
        console.error('Could not load base translation file (en.js). Aborting.');
        return;
    }

    const baseKeyCount = Object.keys(baseTranslations).length;
    console.log(`📖 Base file en.js has ${baseKeyCount} keys.`);

    const langFiles = fs.readdirSync(langDir).filter(file => file.endsWith('.js') && file !== 'en.js');
    let allFilesValid = true;

    console.log(`
🔍 Checking ${langFiles.length} language files...`);

    for (const file of langFiles) {
        const filePath = path.join(langDir, file);
        const translations = getTranslationsFromFile(filePath);

        if (!translations) {
            allFilesValid = false;
            continue; // Error already logged in getTranslationsFromFile
        }

        const keyCount = Object.keys(translations).length;

        if (keyCount !== baseKeyCount) {
            allFilesValid = false;
            console.error(`❌ ${file}: FAILED - Key count mismatch. Expected ${baseKeyCount}, but found ${keyCount}.`);
        } else {
            console.log(`✅ ${file}: PASSED - Syntax is valid and key count (${keyCount}) matches.`);
        }
    }

    console.log('\n----------------------------------------');
    if (allFilesValid) {
        console.log('🎉 SUCCESS: All translation files are valid and complete!');
    } else {
        console.error('🔥 FAILURE: Some translation files have errors. Please review the logs above.');
    }
    console.log('----------------------------------------');
}

verifyTranslations();
