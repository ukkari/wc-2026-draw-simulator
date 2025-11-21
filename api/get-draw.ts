import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './db/client.js';
import { draws } from './db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'id parameter is required' });
    }

    // Fetch from database
    const result = await db
      .select()
      .from(draws)
      .where(eq(draws.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    const draw = result[0];
    const drawData = JSON.parse(draw.drawData);

    return res.status(200).json({ drawData });
  } catch (error) {
    console.error('Error fetching draw:', error);
    return res.status(500).json({ error: 'Failed to fetch draw' });
  }
}
