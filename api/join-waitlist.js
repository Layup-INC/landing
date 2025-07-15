const { Client } = require('@notionhq/client');

// Initialize Notion client with your integration token
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, storeUrl, platform, revenue } = req.body;

  if (!email || !storeUrl || !platform || !revenue) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate a business name (title) from timestamp or store URL
  const businessName = `Store: ${storeUrl.replace(/^https?:\/\//, '')}`;

  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "Business Name": {
          title: [
            {
              text: { content: businessName }
            }
          ]
        },
        "Email": {
          email: {
            address: email
          }
        },
        "Store URL": {
          url: storeUrl
        },
        "Platform": {
          select: {
            name: platform
          }
        },
        "Revenue Range": {
          select: {
            name: revenue
          }
        }
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Notion API Error:', error.message);
    return res.status(500).json({ error: 'Failed to submit to Notion' });
  }
}
