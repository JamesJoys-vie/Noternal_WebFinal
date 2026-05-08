import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

// READ: Get User by ID
export async function getUserById(userId) {
  const client = await clientPromise;
  const db = client.db();

  // We exclude the password_hash from the result for security
  return await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { password_hash: 0 } }
  );
}

// READ: Get User by Email (Useful for Login/Authentication)
export async function getUserByEmail(email) {
  const client = await clientPromise;
  const db = client.db();

  return await db.collection('users').findOne({ email: email });
}

// CREATE: Insert a new User
export async function createUser(userData) {
  const client = await clientPromise;
  const db = client.db();

  const newUser = {
    ...userData,
    is_active: false, // Default to false based on your activation requirement
    activation_token: new ObjectId().toString(), // Mock token generation
    preferences: userData.preferences || { theme: "light", font_size: 16, note_color: "yellow" },
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await db.collection('users').insertOne(newUser);
  return { ...newUser, _id: result.insertedId };
}

// UPDATE: Modify User Data (e.g., changing preferences or display name)
export async function updateUser(userId, updateFields) {
  const client = await clientPromise;
  const db = client.db();

  updateFields.updated_at = new Date();

  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: updateFields },
    { returnDocument: 'after', projection: { password_hash: 0 } }
  );

  return result.value;
}

// DELETE: Remove User and Cascade Delete their Data
export async function deleteUser(userId) {
  const client = await clientPromise;
  const db = client.db();
  const userObjectId = new ObjectId(userId);

  // 1. Delete the user
  const result = await db.collection('users').deleteOne({ _id: userObjectId });

  if (result.deletedCount > 0) {
    // 2. Cascade Delete: Wipe all their notes
    await db.collection('notes').deleteMany({ owner_id: userObjectId });
    
    // 3. Cascade Delete: Wipe all their labels
    await db.collection('labels').deleteMany({ user_id: userObjectId });
  }

  return result.deletedCount > 0;
}