import clientPromise from '../lib/mongodb'; // Assuming this is your connection file
import { ObjectId } from 'mongodb';

// CREATE NOTE
export async function createNote(noteData) {
  const client = await clientPromise;
  const db = client.db();

  const newNote = {
    ...noteData,
    owner_id: new ObjectId(noteData.owner_id),
    label_ids: noteData.label_ids ? noteData.label_ids.map(id => new ObjectId(id)) : [],
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await db.collection('notes').insertOne(newNote);
  return { ...newNote, _id: result.insertedId };
}

// UPDATE NOTE
export async function updateNote(noteId, ownerId, updateFields) {
  const client = await clientPromise;
  const db = client.db();

  // Ensure updated_at is always refreshed for your "Auto-save" requirement
  updateFields.updated_at = new Date();

  // If label_ids are being updated, ensure they are cast to ObjectIds
  if (updateFields.label_ids) {
    updateFields.label_ids = updateFields.label_ids.map(id => new ObjectId(id));
  }

  const result = await db.collection('notes').findOneAndUpdate(
    { _id: new ObjectId(noteId), owner_id: new ObjectId(ownerId) }, // Security check
    { $set: updateFields },
    { returnDocument: 'after' } // Returns the newly updated document
  );

  return result.value;
}

// DELETE NOTE
export async function deleteNote(noteId, ownerId) {
  const client = await clientPromise;
  const db = client.db();

  const result = await db.collection('notes').deleteOne({
    _id: new ObjectId(noteId),
    owner_id: new ObjectId(ownerId) // Security check
  });

  return result.deletedCount > 0;
}

// fetches all notes owned by the user AND notes shared with them.
export async function getUserNotes(userId) {
  const client = await clientPromise;
  const db = client.db(); 

  const query = {
    owner_id: userId
  };

  // Fetch and sort by newest first
  const notes = await db.collection('notes')
    .find(query)
    .sort({ updated_at: -1 })
    .toArray();

  return notes;
}

// fetches all notes shared with them.
export async function getNotesSharedWithUser(userEmail, userId) {
  const client = await clientPromise;
  const db = client.db();

  const query = {
    // 1. Ensures we don't accidentally fetch notes they own 
    // (just in case they somehow shared a note with themselves)
    owner_id: { $ne: userId }, 
    
    // 2. Looks inside the embedded array for their exact email
    "shared_with.recipient_email": userEmail 
  };

  const sharedNotes = await db.collection('notes')
    .find(query)
    .sort({ updated_at: -1 }) // Newest first
    .toArray();

  return sharedNotes;
}