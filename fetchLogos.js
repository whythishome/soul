const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const xml2js = require('xml2js');

// Read the XML file
fs.readFile('tvpassport.com.channels.xml', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading XML file:', err);
    return;
  }

  // Parse XML to JavaScript object
  const parser = new xml2js.Parser();
  parser.parseString(data, (err, result) => {
    if (err) {
      console.error('Error parsing XML:', err);
      return;
    }

    // Iterate through each channel and fetch the logo URL
    const channels = result.channels.channel;

    const promises = channels.map(async (channel) => {
      const siteId = channel.$.site_id; // Extract site_id from the channel attributes
      if (siteId) {
        try {
          // Fetch the logo URL from TV Passport by making a request
          const logoUrl = await fetchLogoForSiteId(siteId);
          // Add the logo URL as a new attribute to the channel, only if not already present
          if (logoUrl && !channel.logo) {
            channel.logo = [logoUrl];  // Adding logo as an array (since XML parsing might expect it)
          }
        } catch (error) {
          console.error(`Error fetching logo for site_id ${siteId}:`, error);
        }
      }
    });

    // Wait for all promises to resolve
    Promise.all(promises).then(() => {
      // Convert the updated JavaScript object back to XML
      const builder = new xml2js.Builder();
      const updatedXml = builder.buildObject(result);

      // Save the updated XML back to the file
      fs.writeFile('tvpassport.com.channels.xml', updatedXml, (err) => {
        if (err) {
          console.error('Error writing updated XML file:', err);
        } else {
          console.log('Updated XML saved to tvpassport.com.channels.xml');
        }
      });
    });
  });
});

// Function to fetch the logo URL based on site_id from TV Passport
async function fetchLogoForSiteId(siteId) {
  try {
    const response = await axios.get(`https://www.tvpassport.com/tv-listings/stations/${siteId}`, {
      maxRedirects: 5, // Allow a maximum of 5 redirects
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'TE': 'Trailers'
      }
    });

    // Check if the URL has redirected
    const finalUrl = response.request.res.responseUrl;
    if (finalUrl !== `https://www.tvpassport.com/tv-listings/stations/${siteId}`) {
      console.log(`Redirected from ${siteId} to ${finalUrl}`);
    }

    // If response is successful, extract the logo
    if (response.status === 200) {
      const $ = cheerio.load(response.data);

      // Get the content from the og:image meta tag
      const logoContent = $('meta[property="og:image"]').attr('content');

      if (logoContent) {
        // Check if the logo URL ends with ".png"
        if (logoContent.includes('.png')) {
          const logoUrl = logoContent.startsWith('//') ? `https:${logoContent}` : logoContent;
          return logoUrl;
        } else {
          console.error(`Invalid image type (not PNG) for site_id: ${siteId}`);
          return ''; // Return blank if it's not a PNG
        }
      } else {
        console.error(`Logo not found for site_id: ${siteId}`);
        return ''; // Return blank if no logo is found
      }
    } else {
      console.error(`Error fetching page for site_id ${siteId}: ${response.status} - ${response.statusText}`);
      return ''; // Handle error gracefully
    }
  } catch (error) {
    console.error(`Error fetching logo for site_id ${siteId}:`, error.message);
    return ''; // Return an empty string or a default logo
  }
}
