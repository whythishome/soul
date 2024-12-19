const axios = require('axios');
const cheerio = require('cheerio');

// Define the URL and headers
const url = "https://www.fancode.com/";
const headers = {
    "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
};

// Make the GET request using Axios
axios.get(url, { headers })
    .then(response => {
        if (response.status !== 200) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.data; // Get the HTML response as text
    })
    .then(html => {
        // Load the HTML into Cheerio
        const $ = cheerio.load(html);

        // Find the script tag containing the JSON data
        const scriptTag = $('script').filter(function() {
            return $(this).html().includes('window.__INIT_STATE__');
        }).html();

        if (scriptTag) {
            // Extract the JSON data from the script tag
            const jsonMatch = scriptTag.match(/window\.__INIT_STATE__\s*=\s*({.*});/);

            if (jsonMatch) {
                const jsonString = jsonMatch[1];
                try {
                    // Parse the JSON data
                    const initState = JSON.parse(jsonString);
                    console.log(initState); // Store or use the parsed JSON data
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            } else {
                console.error('JSON data not found in the script tag.');
            }
        } else {
            console.error('Script tag containing window.__INIT_STATE__ not found.');
        }
    })
    .catch(error => {
        console.error('There was a problem with the Axios operation:', error);
    });
