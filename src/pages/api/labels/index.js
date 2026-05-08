import { createLabel, updateLabel, deleteLabel } from '../../../models/label.model';

export default async function handler(req, res) {
  const loggedInUserId = req.headers['x-user-id']; 
  if (!loggedInUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    switch (req.method) {
      
      // CREATE
      case 'POST': {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Label name required" });
        
        const newLabel = await createLabel(loggedInUserId, name);
        return res.status(201).json(newLabel);
      }

      // UPDATE
      case 'PUT': {
        const { id, name } = req.body; // Extracting id from body
        
        if (!id || !name) return res.status(400).json({ error: "Label ID and new name required" });

        const updatedLabel = await updateLabel(id, loggedInUserId, name);
        if (!updatedLabel) return res.status(404).json({ error: "Label not found" });
        
        return res.status(200).json(updatedLabel);
      }

      // DELETE
      case 'DELETE': {
        const id = req.body.id || req.query.id; // Extracting id from body or query
        
        if (!id) return res.status(400).json({ error: "Label ID required" });

        const success = await deleteLabel(id, loggedInUserId);
        if (!success) return res.status(404).json({ error: "Label not found" });
        
        return res.status(200).json({ message: "Label deleted and removed from notes" });
      }

      default:
        res.setHeader('Allow', ['POST', 'PUT', 'DELETE']); // Assuming GET is handled elsewhere or not needed here
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Label operation failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}