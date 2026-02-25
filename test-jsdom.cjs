const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('cart.html', 'utf8');
const scriptString = fs.readFileSync('js/main.js', 'utf8');

const dom = new JSDOM(html, {
    url: 'http://localhost:3000/cart.html',
    runScripts: 'dangerously',
    resources: 'usable'
});

const window = dom.window;
const document = window.document;

// Mock localStorage
let store = {
    'loomSaga_cart': '[{"id":"110","name":"Tissue Silk","price":1099,"quantity":1,"image":"test.png"},{"id":"107","name":"Tussar Jamdani","price":5199,"quantity":1,"image":"test2.png"}]'
};
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value; },
        removeItem: (key) => { delete store[key]; }
    }
});

// Run script
try {
    const scriptEl = document.createElement('script');
    scriptEl.textContent = scriptString;
    document.body.appendChild(scriptEl);

    // Wait for rendering
    setTimeout(() => {
        const listHtml = document.getElementById('cartItems').innerHTML;
        console.log('Cart Items HTML length:', listHtml.length);
        console.log('Cart Items HTMl snippet:', listHtml.slice(0, 500));
    }, 500);
} catch (e) {
    console.error('Error executing script:', e.message);
}
