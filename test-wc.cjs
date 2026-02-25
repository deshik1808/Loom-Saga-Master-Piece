const https = require('https');

const url = "https://itirhuta.in/loomsaga-mvp/wp-json/wc/v3/orders?search=medeshik@gmail.com";
const auth = "Basic " + Buffer.from("cs_1cd83bbaa0d790e19bb4d0861e7ac2bc0f782d4d:cs_1cd83bbaa0d790e19bb4d0861e7ac2bc0f782d4d").toString("base64");

https.get(url, { headers: { Authorization: auth } }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        try {
            const orders = JSON.parse(data);
            console.log('Response:', JSON.stringify(orders).substring(0, 200));
            if (Array.isArray(orders)) {
                console.log(`Found ${orders.length} orders by search=medeshik@gmail.com`);
                if (orders.length > 0) {
                    console.log(`First order ID: ${orders[0].id}, customer_id: ${orders[0].customer_id}, email: ${orders[0].billing.email}`);
                }
            }
        } catch (e) {
            console.log("Error parsing", data.slice(0, 100));
        }
    });
}).on('error', (e) => {
    console.error(e);
});
