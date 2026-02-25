const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Navigate to site to set localStorage in domain context
    await page.goto('http://localhost:3000');

    await page.evaluate(() => {
        localStorage.setItem('loomSaga_cart', '[{"id":"LS-SLK-001","name":"Royal Blue Tussar Silk Saree","price":6499,"image":"https://placehold.co/140x180/4169e1/fff","quantity":1,"stockQuantity":5,"inStock":true,"color":"Blue","style":"Silk"}]');
    });

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    page.on('pageerror', error => consoleMessages.push('ERROR: ' + error.message));

    // Navigate to cart page
    await page.goto('http://localhost:3000/cart.html');
    await page.waitForTimeout(2000); // give it time to render

    const cartContentVisible = await page.evaluate(() => document.getElementById('cartContent')?.style.display !== 'none');
    const cartEmptyVisible = await page.evaluate(() => document.getElementById('cartEmpty')?.style.display !== 'none');
    const cartItemsHtml = await page.evaluate(() => document.getElementById('cartItems')?.innerHTML.trim() || '');

    console.log('CartContent Visible:', cartContentVisible);
    console.log('CartEmpty Visible:', cartEmptyVisible);
    console.log('cartItemsHtml length:', cartItemsHtml.length);
    console.log('Console:', consoleMessages.join('\n'));

    await browser.close();
})();
