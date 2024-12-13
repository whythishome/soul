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
          // Check if the logo attribute is missing entirely (undefined or absent)
          if (!channel.$.hasOwnProperty('logo')) {
            // Fetch the logo URL only if the logo is missing
            const logoUrl = await fetchLogoForSiteId(siteId);
            // Add the logo URL as a new attribute to the channel if found
            if (logoUrl) {
              channel.$.logo = logoUrl;
            }
          } else {
            console.log(`Skipping channel ${channel.$.site_id} as it already has a logo.`);
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
          console.log('Updated XML saved.');
        }
      });
    });
  });
});

// Function to fetch the logo URL based on site_id from TV Passport
async function fetchLogoForSiteId(siteId) {
  try {
    const response = await axios.get(`https://www.tvpassport.com/tv-listings/stations/${siteId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'TE': 'Trailers'
      },
      maxRedirects: 5  // Follow redirects automatically (with a max of 5 redirects)
    });

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
