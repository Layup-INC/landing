import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Block direct .js access
  if (req.url.endsWith('.js')) {
    return res.status(403).json({ error: 'Access forbidden' });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { businessName, email, storeUrl, platform, revenue } = body;
    
    // Validate all fields
    if (![businessName, email, storeUrl, platform, revenue].every(Boolean)) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Process with Notion
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        "Business Name": { title: [{ text: { content: businessName } }] },
        "Email": { email },
        "Store URL": { url: storeUrl },
        "Platform": { select: { name: platform } },
        "Revenue Range": { select: { name: revenue } }
      }
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' 
        ? 'Submission failed' 
        : error.message 
    });
  }
}
