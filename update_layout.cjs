const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const indexFile = path.join(rootDir, 'index.html');

console.log('Reading index.html...');
const indexContent = fs.readFileSync(indexFile, 'utf8');

// 1. Extract Top Block (Header -> Search Overlay)
// Match from Header Start up to <main> tag.
// We use <main as the anchor because it signifies the start of unique page content.
const topBlockRegex = /(<!-- ==================== HEADER ==================== -->[\s\S]*?)<main/i;
const topBlockMatch = indexContent.match(topBlockRegex);

if (!topBlockMatch) {
    console.error('CRITICAL: Could not find Top Block in index.html');
    process.exit(1);
}
const topBlock = topBlockMatch[1];
console.log('Top Block extracted. Length:', topBlock.length);

// 2. Extract Footer Block
const footerRegex = /(<!-- ==================== FOOTER ==================== -->[\s\S]*?<\/footer>)/i;
const footerMatch = indexContent.match(footerRegex);

if (!footerMatch) {
    console.error('CRITICAL: Could not find Footer Block in index.html');
    process.exit(1);
}
const footerBlock = footerMatch[1];
console.log('Footer Block extracted. Length:', footerBlock.length);

// 3. Extract Cart Drawer Block
// Match from Cart Drawer start to before JavaScript comment or body end
const cartRegex = /(<!-- Off-Canvas Cart Drawer -->[\s\S]*?)(?=<!-- JavaScript -->|<\/body>)/i;
const cartMatch = indexContent.match(cartRegex);

if (!cartMatch) {
    console.error('CRITICAL: Could not find Cart Drawer Block in index.html');
    process.exit(1);
}
const cartBlock = cartMatch[1];
console.log('Cart Block extracted. Length:', cartBlock.length);


// List of files to ignore
const ignoreFiles = ['index.html'];

// Find all HTML files
const files = fs.readdirSync(rootDir).filter(file => file.endsWith('.html') && !ignoreFiles.includes(file));

console.log(`Found ${files.length} target files to update.`);

files.forEach(file => {
    const filePath = path.join(rootDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalLength = content.length;
    let updated = false;

    // REPLACE TOP BLOCK
    // We look for Header Start ... <main> OR <div class="container"> or whatever starts the content.
    // The most reliable way for these files is likely replacing everything from Header Start to <main
    if (content.match(topBlockRegex)) {
        content = content.replace(topBlockRegex, `${topBlock}<main`);
        updated = true;
    } else {
        // Fallback: If no <main>, maybe look for <section class="...-hero"> or just specific known structure?
        // Let's try to be flexible: Look for Header Start up to the first <section or <div class="container" if <main> is missing.
        // But for this project, GEMINI.md says 'standard structure'. Let's hope <main> is used.
        // If not, we log warning.
        
        // Try alternate anchor if <main> is missing (e.g., maybe they used <div class="main-content">?
        // But about.html has <main class="about-page">.
        console.warn(`WARNING: Could not match Top Block regex in ${file}. skipping top block.`);
    }

    // REPLACE FOOTER BLOCK
    if (content.match(footerRegex)) {
        content = content.replace(footerRegex, footerBlock);
        updated = true;
    } else {
        console.warn(`WARNING: Could not match Footer regex in ${file}. skipping footer.`);
    }

    // REPLACE CART BLOCK
    // We assume the cart block is at the end.
    if (content.match(cartRegex)) {
        content = content.replace(cartRegex, cartBlock);
        updated = true;
    } else {
        // If the file doesn't have a cart drawer yet, maybe we should append it?
        // For now, let's assume if it's missing, we insert it before <!-- JavaScript -->
        const jsCommentRegex = /<!-- JavaScript -->/i;
        if (content.match(jsCommentRegex)) {
             content = content.replace(jsCommentRegex, `${cartBlock}\n    <!-- JavaScript -->`); // Add newline for clean format
             updated = true;
             console.log(`Inserted missing Cart Drawer in ${file}`);
        } else {
             console.warn(`WARNING: Could not find Cart Drawer or insertion point in ${file}. details: No '<!-- JavaScript -->' marker.`);
        }
    }

    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`No changes needed for ${file}`);
    }
});

console.log('Done.');
