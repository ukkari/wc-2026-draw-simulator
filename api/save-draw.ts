import type { VercelRequest, VercelResponse } from '@vercel/node';
import { nanoid } from 'nanoid';
import { db } from './db/client';
import { draws } from './db/schema';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { drawData } = req.body;

    if (!drawData) {
      return res.status(400).json({ error: 'drawData is required' });
    }

    // Generate unique ID (8 characters)
    const id = nanoid(8);

    // Save to database
    await db.insert(draws).values({
      id,
      drawData: JSON.stringify(drawData),
      createdAt: new Date(),
    });

    return res.status(200).json({ id });
  } catch (error) {
    console.error('Error saving draw:', error);
    return res.status(500).json({ error: 'Failed to save draw' });
  }
}
