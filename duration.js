const axios = require('axios');

async function makeRequests() {
    let duration = 100;
    const baseUrl = 'https://backend.tvguide.com/tvschedules/tvguide/9100002825/web?start=1734274800&duration=';
    const channelSourceIds = '9200020460';
    const apiKey = 'DI9elXhZ3bU6ujsA2gXEKOANyncXGUGc';

    while (duration <= 20500) { // You can adjust the upper limit as needed
        const url = `${baseUrl}${duration}&channelSourceIds=${channelSourceIds}&apiKey=${apiKey}`;

        try {
            const response = await axios.get(url);
            console.log(`Duration: ${duration}, Status Code: ${response.status}`);
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(`Duration: ${duration}, Status Code: ${error.response.status}`);
            } else if (error.request) {
                // The request was made but no response was received
                console.log(`Duration: ${duration}, Error: No response received`);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log(`Duration: ${duration}, Error: ${error.message}`);
            }
        }

        duration += 10;
    }
}

makeRequests();
