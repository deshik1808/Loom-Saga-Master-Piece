const fs = require('fs');
const path = require('path');

const dir = './';

const preloadSearch = `  <!-- Main Stylesheet -->\n  <link rel="stylesheet" href="css/styles.css?v=2" />`;
const preloadReplace = `  <!-- Main Stylesheet -->\n  <link rel="stylesheet" href="css/styles.css?v=2" />\n\n  <!-- Preload logo PNG so it loads in sync with header elements -->\n  <link rel="preload" href="assets/Assets Loom Saga/Vertical logo.png" as="image" type="image/png" fetchpriority="high" />`;

const logoSearchRegex = /<img src="assets\/images\/optimized\/logo\.webp" alt="Loom Saga Logo" class="logo-image" \/>\s*<span class="logo-text">Loom Saga<\/span>/g;
const logoReplace = `<img src="assets/Assets Loom Saga/Vertical logo.png" alt="Loom Saga Logo" class="logo-image" fetchpriority="high" loading="eager" />`;

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.html') && file !== 'index.html') {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        let modified = false;

        // Replace preload if not already there
        if (content.includes(preloadSearch) && !content.includes(preloadReplace)) {
            content = content.replace(preloadSearch, preloadReplace);
            modified = true;
        }

        // Replace logo
        if (logoSearchRegex.test(content)) {
            content = content.replace(logoSearchRegex, logoReplace);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
});
console.log('Done.');
