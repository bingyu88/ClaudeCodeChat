const fs = require('fs');
const path = require('path');

// Language mappings for auto-translation
const languageMap = {
    'ar': 'Arabic', 'bn': 'Bengali', 'de': 'German', 'el': 'Greek', 'es': 'Spanish',
    'fa': 'Persian', 'fr': 'French', 'he': 'Hebrew', 'hi': 'Hindi', 'id': 'Indonesian',
    'it': 'Italian', 'ja': 'Japanese', 'ko': 'Korean', 'pl': 'Polish', 'pt': 'Portuguese',
    'ru': 'Russian', 'th': 'Thai', 'tr': 'Turkish', 'uk': 'Ukrainian', 'vi': 'Vietnamese', 'zh': 'Chinese'
};

// Placeholder for translation logic
function generateTranslation(key, englishValue, targetLang) {
    const langName = languageMap[targetLang] || targetLang.toUpperCase();
    // Escape double quotes in the English value to prevent breaking the string
    const safeEnglishValue = englishValue.replace(/"/g, '\"');
    return `[${langName}] ${safeEnglishValue}`;
}

// A robust function to get translations from a file.
function getTranslationsFromFile(filePath, lang) {
    try {
        // Mock the global window object that the scripts expect
        global.window = { translations: {} };
        // Require the script. Node.js will execute it, populating our mock window object.
        require(filePath);
        // The script either populates window.translations.en or window.translations[lang]
        return window.translations[lang] || window.translations.en;
    } catch (e) {
        console.error(`❌ Error parsing ${path.basename(filePath)}: ${e.message}`);
        return null;
    } finally {
        // Clean up the global scope and cache
        delete require.cache[require.resolve(filePath)];
        delete global.window;
    }
}

function main() {
    const langDir = path.join(__dirname, 'lang');
    const englishFile = path.join(langDir, 'en.js');

    console.log('🚀 Starting auto-completion of translation files...\n');

    if (!fs.existsSync(englishFile)) {
        console.error('❌ Base English translation file (en.js) not found.');
        return;
    }

    const englishKeys = getTranslationsFromFile(englishFile, 'en');

    if (!englishKeys) {
        console.error('❌ Could not parse English translation file. Aborting.');
        return;
    }

    const englishKeySet = new Set(Object.keys(englishKeys));
    console.log(`📖 Found ${englishKeySet.size} keys in en.js as the base.\n`);

    const languageFiles = fs.readdirSync(langDir)
        .filter(file => file.endsWith('.js') && file !== 'en.js');

    console.log(`📁 Found ${languageFiles.length} language files to process.\n`);

    languageFiles.forEach(file => {
        const filePath = path.join(langDir, file);
        const lang = path.basename(file, '.js');
        const originalContent = fs.readFileSync(filePath, 'utf8');
        const existingKeys = getTranslationsFromFile(filePath, lang);

        if (!existingKeys) {
            console.log(`⚠️ Skipping ${file} due to parsing error.`);
            return;
        }

        const missingKeys = [...englishKeySet].filter(key => !existingKeys.hasOwnProperty(key));

        if (missingKeys.length === 0) {
            console.log(`✅ ${file}: All keys are present.`);
        } else {
            console.log(`🔍 ${file}: Found ${missingKeys.length} missing keys. Adding them...`);

            const newTranslations = missingKeys.map(key => {
                const englishValue = englishKeys[key] || '';
                const translation = generateTranslation(key, englishValue, lang);
                // Indent for nice formatting
                return `    "${key}": "${translation}"`;
            }).join(',\n');

            // Find the last translation to append the new ones after it
            const lastEntryRegex = /"[^"]+"\s*:\s*"[^\"]*"(,?)/g;
            let lastMatch;
            let match;
            while((match = lastEntryRegex.exec(originalContent)) !== null) {
                lastMatch = match;
            }

            let updatedContent;
            if (lastMatch) {
                const insertionPoint = lastMatch.index + lastMatch[0].length;
                const needsComma = !lastMatch[0].endsWith(',');
                const prefix = originalContent.substring(0, insertionPoint);
                const suffix = originalContent.substring(insertionPoint);
                updatedContent = `${prefix}${needsComma ? ',' : ''}\n${newTranslations}${suffix}`;
            } else {
                // Fallback for empty files
                const insertionPoint = originalContent.lastIndexOf('}');
                const prefix = originalContent.substring(0, insertionPoint);
                const suffix = originalContent.substring(insertionPoint);
                updatedContent = `${prefix}${newTranslations}\n${suffix}`;
            }

            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`   Added ${missingKeys.length} keys to ${file}.`);
        }
    });

    console.log('\n🎉 Auto-completion process completed!');
    console.log('   Next, run the verification script to check for correctness.');
}

if (require.main === module) {
    main();
}

