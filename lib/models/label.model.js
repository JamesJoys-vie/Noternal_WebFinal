import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function createLabel(userId, name) {
  const client = await clientPromise;
  const db = client.db();

  const newLabel = {
    user_id: new ObjectId(userId),
    name: name,
    created_at: new Date()
  };

  const result = await db.collection('labels').insertOne(newLabel);
  return { ...newLabel, _id: result.insertedId };
}

export async function updateLabel(labelId, userId, newName) {
  const client = await clientPromise;
  const db = client.db();

  const result = await db.collection('labels').findOneAndUpdate(
    { _id: new ObjectId(labelId), user_id: new ObjectId(userId) },
    { $set: { name: newName } },
    { returnDocument: 'after' }
  );

  return result.value;
}

export async function deleteLabel(labelId, userId) {
  const client = await clientPromise;
  const db = client.db();

  // 1. Delete the label
  const result = await db.collection('labels').deleteOne({
    _id: new ObjectId(labelId),
    user_id: new ObjectId(userId)
  });

  if (result.deletedCount > 0) {
    // 2. Cascade Delete: Remove this label_id from any notes that used it
    await db.collection('notes').updateMany(
      { owner_id: new ObjectId(userId) },
      { $pull: { label_ids: new ObjectId(labelId) } }
    );
  }

  return result.deletedCount > 0;
}

/**
 * Fetches all labels belonging to a specific user.
 * * @param {string} userId - The ID of the logged-in user.
 * @returns {Array} - An array of label objects.
 */
export async function getUserLabels(userId) {
  const client = await clientPromise;
  const db = client.db();

  const labels = await db.collection('labels')
    .find({ user_id: new ObjectId(userId) })
    .sort({ created_at: -1 }) // Sorts by newest first (optional but good for UI)
    .toArray();

  return labels;
}