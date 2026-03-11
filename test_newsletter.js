import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = process.env;

async function test() {
    const email = 'testnewsletterplugin_debug123@example.com';
    const wcUrl = `${WC_API_URL}/wp-json/wc/v3/customers`;
    const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

    console.log("URL:", wcUrl);

    try {
        const response = await fetch(wcUrl, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${credentials}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                username: email.split('@')[0] + Math.floor(Math.random() * 1000),
                role: "customer"
            }),
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response text:", text);
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
