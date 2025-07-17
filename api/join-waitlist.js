import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Block direct .js access
  if (req.url.endsWith('.js')) {
    return res.status(403).json({ error: 'Access forbidden' });
  }

  // Handle GET requests for fetching current count
  if (req.method === 'GET') {
    try {
      const notion = new Client({ auth: process.env.NOTION_TOKEN });
      const response = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
      });
      // Return count from Notion + 500 (seed value)
      return res.status(200).json({ 
        count: response.results.length + 500
      });
    } catch (error) {
      console.error('Error fetching count:', error);
      return res.status(500).json({ error: 'Failed to fetch count' });
    }
  }

  // Handle POST requests for form submission
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
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

      // Get updated count
      const response = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
      });
      
      return res.status(200).json({ 
        success: true,
        currentCount: response.results.length + 500
      });

    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' 
          ? 'Submission failed' 
          : error.message 
      });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
