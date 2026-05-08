import { getUserById, createUser, updateUser, deleteUser } from '../../../models/user.model';
import bcrypt from 'bcryptjs'; // Required for secure password hashing

export default async function handler(req, res) {
  try {
    switch (req.method) {
      
      // READ (Get the currently logged-in user's profile)
      case 'GET': {
        const userId = req.headers['x-user-id'] || req.query.id;
        if (!userId) return res.status(400).json({ error: "User ID required" });

        const user = await getUserById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        
        return res.status(200).json(user);
      }

      // CREATE (Registration)
      case 'POST': {
        const { email, password, display_name } = req.body;
        
        if (!email || !password || !display_name) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Security Requirement: Hash the password before sending to the model
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
          const newUser = await createUser({
            email,
            password_hash: hashedPassword,
            display_name
          });
          
          // Remove the hash before sending the response to the frontend
          delete newUser.password_hash;
          return res.status(201).json({ message: "Account created! Please check your email to activate.", user: newUser });
        
        } catch (dbError) {
          // Catch the unique index error if the email already exists
          if (dbError.code === 11000) {
            return res.status(409).json({ error: "Email is already in use." });
          }
          throw dbError; // Pass other errors down to the main catch block
        }
      }

      // UPDATE (Modify Profile or Settings)
      case 'PUT': {
        const userId = req.headers['x-user-id'] || req.body.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Ensure users cannot update their own password or email through this generic route
        const { password, email, ...safeUpdateFields } = req.body;

        const updatedUser = await updateUser(userId, safeUpdateFields);
        if (!updatedUser) return res.status(404).json({ error: "User not found" });
        
        return res.status(200).json({ message: "Profile updated", user: updatedUser });
      }

      // DELETE (Delete Account)
      case 'DELETE': {
        const userId = req.headers['x-user-id'] || req.body.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const success = await deleteUser(userId);
        if (!success) return res.status(404).json({ error: "User not found" });
        
        return res.status(200).json({ message: "Account and all associated data successfully deleted." });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("User operation failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}