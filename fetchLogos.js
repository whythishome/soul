const fs = require('fs');
const { DOMParser, XMLSerializer } = require('xmldom');

// File path
const filePath = 'tvpassport.com.channels.xml';

// Read the XML file
fs.readFile(filePath, 'utf-8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Parse the XML data
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(data, 'text/xml');

  // Get all channel elements
  const channels = xmlDoc.getElementsByTagName('channel');

  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
    const xmltvId = channel.getAttribute('xmltv_id');
    let channelName = channel.textContent.trim();

    // Update channel name based on xmltv_id
    if (xmltvId.endsWith('.us')) {
      channel.textContent = `US: ${channelName}`;
    } else if (xmltvId.endsWith('.ca')) {
      channel.textContent = `CA: ${channelName}`;
    }
  }

  // Serialize the updated XML
  const serializer = new XMLSerializer();
  const updatedXml = serializer.serializeToString(xmlDoc);

  // Write the updated XML back to the file
  fs.writeFile(filePath, updatedXml, (writeErr) => {
    if (writeErr) {
      console.error('Error writing the file:', writeErr);
    } else {
      console.log('XML file updated successfully.');
    }
  });
});
