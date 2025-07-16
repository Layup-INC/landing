import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://laygen.ai');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    console.error('Missing Notion environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  try {
    const { email, storeUrl, platform, revenue } = req.body;

    // Validate input
    if (!email || !storeUrl || !platform || !revenue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify database connection
    const database = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID
    });

    // Create new page
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        "Name": {
          title: [
            {
              text: { content: `New Signup: ${email.substring(0, 20)}` }
            }
          ]
        },
        "Email": {
          email: email
        },
        "Store URL": {
          url: storeUrl
        },
        "Platform": {
          select: { name: platform }
        },
        "Revenue": {
          select: { name: revenue }
        },
        "Date": {
          date: { start: new Date().toISOString() }
        }
      }
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Full Notion API error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      request: error.request
    });

    return res.status(500).json({
      error: 'Failed to process submission',
      details: error.message,
      code: error.code
    });
  }
}
