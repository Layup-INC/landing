import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://laygen.ai');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, storeUrl, platform, revenue } = req.body;

    // Validate required fields
    if (!email || !storeUrl || !platform || !revenue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate URL format
    try {
      new URL(storeUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid store URL' });
    }

    // Create page in Notion
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        "Business Name": {
          title: [
            {
              text: { content: `Store: ${storeUrl.replace(/^https?:\/\//, '')}` }
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
        },
        "Date": {
          date: {
            start: new Date().toISOString()
          }
        }
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notion API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to submit to Notion' 
    });
  }
}