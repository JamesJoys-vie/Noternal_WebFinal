import { getNotesSharedWithUser } from '../../../models/note.model';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, userId } = req.query;

    if (!email || !userId) {
      return res.status(400).json({ error: 'Missing email or userId parameter.' });
    }

    // Call the specific model function
    const sharedNotes = await getNotesSharedWithUser(email, userId);

    return res.status(200).json({ 
      message: "Shared notes retrieved successfully",
      count: sharedNotes.length,
      notes: sharedNotes 
    });

  } catch (error) {
    console.error("Database error in /api/notes/shared-with-me:", error);
    return res.status(500).json({ error: 'Failed to fetch shared notes.' });
  }
}