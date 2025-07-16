import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  try {
    const {businessName, email, storeUrl, platform, revenue } = req.body;

    // Match EXACT property names from your Notion database
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        "Business Name": {  // Changed from "Name"
          title: [{
            text: { content: businessName }
          }]
        },
        "Email": { email: email },
        "Store URL": { url: storeUrl },
        "Platform": { select: { name: platform } },
        "Revenue Range": {  // Changed from "Revenue"
          select: { name: revenue } 
        }
        // Removed "Date" property since it doesn't exist
      }
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Notion API Error:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    return res.status(500).json({ 
      error: 'Failed to process submission',
      details: error.message 
    });
  }
}
