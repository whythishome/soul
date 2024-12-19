const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
    try {
        // Define the headers
        const headers = {
            'sec-ch-ua': '\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '\"Windows\"',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        };

        // Fetch the HTML from the URL
        const response = await axios.get('https://www.fancode.com/', { headers });

        // Load the HTML into Cheerio
        const $ = cheerio.load(response.data);

        // Extract the `window.__INIT_STATE__` variable
        let initState = null;
        $('script').each((index, element) => {
            const scriptContent = $(element).html();
            if (scriptContent && scriptContent.includes('window.__INIT_STATE__')) {
                const match = scriptContent.match(/window\.__INIT_STATE__\s*=\s*(\{.*?\});/);
                if (match && match[1]) {
                    initState = JSON.parse(match[1]);
                }
            }
        });

        // Output the extracted JSON
        if (initState) {
            console.log('Extracted JSON:', initState);
        } else {
            console.log('Could not find the window.__INIT_STATE__ variable.');
        }
    } catch (error) {
        console.error('Error fetching or parsing the page:', error);
    }
})();
