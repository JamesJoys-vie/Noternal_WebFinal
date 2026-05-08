import { createNote, updateNote, deleteNote, getUserNotes } from '../../../models/note.model';

export default async function handler(req, res) {
  // 1. Get the logged-in user's ID (Replace this with your actual auth logic)
  const loggedInUserId = req.headers['x-user-id']; 
  if (!loggedInUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    switch (req.method) {
      
      // READ
      case 'GET': {
        const { email } = req.query;
        const notes = await getUserNotes(loggedInUserId, email);
        return res.status(200).json(notes);
      }

      // CREATE
      case 'POST': {
        const newNote = await createNote({ ...req.body, owner_id: loggedInUserId });
        return res.status(201).json({ message: "Note created", note: newNote });
      }

      // UPDATE
      case 'PUT': {
        // Extract the ID from the request body instead of the URL
        const { id, ...updateData } = req.body; 
        
        if (!id) return res.status(400).json({ error: "Note ID is required in the body" });
        
        const updatedNote = await updateNote(id, loggedInUserId, updateData);
        if (!updatedNote) return res.status(404).json({ error: "Note not found or unauthorized" });
        
        return res.status(200).json({ message: "Note updated", note: updatedNote });
      }

      // DELETE
      case 'DELETE': {
        // For DELETE, you can send the ID in the body, or as a query: /api/notes?id=123
        const id = req.body.id || req.query.id; 
        
        if (!id) return res.status(400).json({ error: "Note ID is required" });

        const success = await deleteNote(id, loggedInUserId);
        if (!success) return res.status(404).json({ error: "Note not found or unauthorized" });
        
        return res.status(200).json({ message: "Note deleted successfully" });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Note operation failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}