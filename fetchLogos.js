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
          // Add the logo URL as a new attribute to the channel
          if (logoUrl) {
            channel.$.logo = logoUrl;
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
          console.log('Updated XML saved to updated_channels.xml');
        }
      });
    });
  });
});

// Function to fetch the logo URL based on site_id from TV Passport
async function fetchLogoForSiteId(siteId) {
  try {
    // Fetch the HTML page of the site
    const response = await axios.get(`https://www.tvpassport.com/tv-listings/stations/${siteId}`);
    
    // Parse the HTML using cheerio
    const $ = cheerio.load(response.data);

    // Extract the logo URL from the <meta property="og:image" content="..."/>
    const logoContent = $('meta[property="og:image"]').attr('content');
    
    if (logoContent) {
      // Prepend 'https:' to the content if it starts with '//'
      const logoUrl = logoContent.startsWith('//') ? `https:${logoContent}` : logoContent;
      return logoUrl;
    } else {
      throw new Error('Logo not found in the HTML content');
    }
  } catch (error) {
    console.error(`Error fetching logo for site_id ${siteId}:`, error);
    return ''; // Return empty string or a default logo if the fetch fails
  }
}
