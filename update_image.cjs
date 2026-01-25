const fs = require('fs');
const productsFilePath = 'data/products.json';
const newImagePath = '/images/lime-green-cyber.jpg';
const targetProductName = 'Lime green Hand-printed Vishnupuri Silk';

try {
    // Read the products.json file
    const productsData = fs.readFileSync(productsFilePath, 'utf8');
    let productsJson = JSON.parse(productsData);

    // Find the product and update its primary image
    const productIndex = productsJson.products.findIndex(product =>
        product.name.includes(targetProductName)
    );

    if (productIndex !== -1) {
        productsJson.products[productIndex].images.primary = newImagePath;
        // Optionally, also update the first image in the gallery if it's meant to be the same as primary
        if (productsJson.products[productIndex].images.gallery.length > 0) {
            productsJson.products[productIndex].images.gallery[0] = newImagePath;
        }

        // Save the updated JSON back to the file
        fs.writeFileSync(productsFilePath, JSON.stringify(productsJson, null, 2), 'utf8');
        console.log(`Successfully updated primary image for "${targetProductName}" to "${newImagePath}".`);
    } else {
        console.log(`Product "${targetProductName}" not found.`);
    }
} catch (error) {
    console.error('Error updating product image:', error);
}