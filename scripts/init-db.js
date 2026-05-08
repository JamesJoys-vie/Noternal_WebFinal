import ObjectId from 'mongodb';
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import clientPromise from '../lib/mongodb.js'

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Error: MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

async function seed() {
  const client = await clientPromise;

  try {
    await client.connect();
    const db = client.db();

    // 1. CLEAN SLATE
    console.log("Emptying collections...");
    await db.collection('users').deleteMany({});
    await db.collection('labels').deleteMany({});
    await db.collection('notes').deleteMany({});

    // 2. ENFORCE UNIQUE INDEX
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log("Unique index enforced on Users 'email'.");

    // 3. GENERATE HASHES
    console.log("Generating secure hashes...");
    const commonPasswordHash = await bcrypt.hash('password123', 10);
    const notePasswordHash = await bcrypt.hash('secret123', 10);

    // 4. CREATE USERS
    const activeUser = {
      _id: new ObjectId(),
      email: "active@student.tdtu.edu.vn",
      display_name: "John (Active)",
      avatar_img: "/uploads/avatars/avatar1.png",
      password_hash: commonPasswordHash,
      is_active: true, // CAN LOGIN IMMEDIATELY
      activation_token: null,
      preferences: { theme: "light", font_size: 16, note_color: "yellow" },
      created_at: new Date(),
      updated_at: new Date()
    };

    const unactivatedUser = {
      _id: new ObjectId(),
      email: "pending@student.tdtu.edu.vn",
      display_name: "Jane (Unactivated)",
      avatar_img: "/uploads/avatars/avatar2.png",
      password_hash: commonPasswordHash,
      is_active: false, 
      activation_token: "mock-token-abc-123",
      preferences: { theme: "dark", font_size: 14, note_color: "red" },
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('users').insertMany([activeUser, unactivatedUser]);

    // 5. CREATE LABELS
    const labels = [
      { _id: new ObjectId(), user_id: activeUser._id, name: "Web Dev", created_at: new Date() },
      { _id: new ObjectId(), user_id: activeUser._id, name: "Urgent", created_at: new Date() },
      { _id: new ObjectId(), user_id: unactivatedUser._id, name: "Drafts", created_at: new Date() }
    ];
    await db.collection('labels').insertMany(labels);

    // Helper function to offset dates for sorting tests
    const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 6. CREATE NOTES FOR ACTIVE USER (10 Notes for thorough testing)
    const activeNotes = [
      { // 1. Standard Note
        owner_id: activeUser._id, title: "Standard Note", content: "Just a normal text note.", images: [], label_ids: [], is_pinned: false, is_locked: false, password_hash: null, shared_with: [], created_at: daysAgo(5), updated_at: daysAgo(5)
      },
      { // 2. Pinned Note
        owner_id: activeUser._id, title: "Pinned Note", content: "Should appear at the top.", images: [], label_ids: [], is_pinned: true, pinned_at: new Date(), is_locked: false, password_hash: null, shared_with: [], created_at: daysAgo(4), updated_at: daysAgo(4)
      },
      { // 3. Locked Note
        owner_id: activeUser._id, title: "Locked Passwords", content: "Hidden content! Password is 'secret123'", images: [], label_ids: [labels[1]._id], is_pinned: false, is_locked: true, password_hash: notePasswordHash, shared_with: [], created_at: daysAgo(3), updated_at: daysAgo(3)
      },
      { // 4. Note with Images (Relative Paths)
        owner_id: activeUser._id, title: "UI Mockups", content: "Check out these attached designs.", images: ["/uploads/notes/mockup1.png", "/uploads/notes/mockup2.png"], label_ids: [labels[0]._id], is_pinned: false, is_locked: false, password_hash: null, shared_with: [], created_at: daysAgo(2), updated_at: daysAgo(2)
      },
      { // 5. Shared Note (Read Only)
        owner_id: activeUser._id, title: "Shared Read-Only", content: "Jane can read this but not edit.", images: [], label_ids: [], is_pinned: false, is_locked: false, password_hash: null, shared_with: [{ recipient_email: unactivatedUser.email, permission: "read", shared_at: new Date() }], created_at: daysAgo(1), updated_at: daysAgo(1)
      },
      { // 6. Shared Note (Edit)
        owner_id: activeUser._id, title: "Shared Editable", content: "Jane can edit this in real-time.", images: [], label_ids: [], is_pinned: false, is_locked: false, password_hash: null, shared_with: [{ recipient_email: unactivatedUser.email, permission: "edit", shared_at: new Date() }], created_at: new Date(), updated_at: new Date()
      },
      { // 7. Pinned + Locked
        owner_id: activeUser._id, title: "Top Secret (Pinned)", content: "Pinned AND Locked.", images: [], label_ids: [], is_pinned: true, pinned_at: daysAgo(1), is_locked: true, password_hash: notePasswordHash, shared_with: [], created_at: daysAgo(10), updated_at: daysAgo(10)
      },
      { // 8. Shared + Locked (Edge Case)
        owner_id: activeUser._id, title: "Shared Secret", content: "Jane must enter password to see this shared note.", images: [], label_ids: [], is_pinned: false, is_locked: true, password_hash: notePasswordHash, shared_with: [{ recipient_email: unactivatedUser.email, permission: "read", shared_at: new Date() }], created_at: new Date(), updated_at: new Date()
      },
      { // 9. Multi-Label Note
        owner_id: activeUser._id, title: "Project Alpha", content: "Has multiple labels.", images: [], label_ids: [labels[0]._id, labels[1]._id], is_pinned: false, is_locked: false, password_hash: null, shared_with: [], created_at: new Date(), updated_at: new Date()
      },
      { // 10. Long Content Note (For UI scrolling tests)
        owner_id: activeUser._id, title: "Terms of Service", content: "Lorem ipsum dolor sit amet...".repeat(50), images: [], label_ids: [], is_pinned: false, is_locked: false, password_hash: null, shared_with: [], created_at: new Date(), updated_at: new Date()
      }
    ];

    // 7. CREATE NOTES FOR UNACTIVATED USER (10 Notes)
    const pendingNotes = Array.from({ length: 10 }).map((_, index) => ({
      owner_id: unactivatedUser._id,
      title: `Jane's Note ${index + 1}`,
      content: `Content for note ${index + 1}. Once Jane activates her account, she will see these.`,
      images: index === 0 ? ["/uploads/notes/jane_pic.png"] : [],
      label_ids: index < 3 ? [labels[2]._id] : [],
      is_pinned: index === 1, // Pin the second note
      pinned_at: index === 1 ? new Date() : null,
      is_locked: index === 2, // Lock the third note
      password_hash: index === 2 ? notePasswordHash : null,
      shared_with: index === 9 ? [{ recipient_email: activeUser.email, permission: "edit", shared_at: new Date() }] : [], // Share the 10th note back to John
      created_at: daysAgo(index),
      updated_at: daysAgo(index)
    }));

    await db.collection('notes').insertMany([...activeNotes, ...pendingNotes]);

    console.log("---------------------------------------------------------");
    console.log("DATABASE SUCCESSFULLY SEEDED WITH 2 USERS & 20 NOTES!");
    console.log("---------------------------------------------------------");
    console.log("🟢 ACTIVE ACCOUNT (Test Login, Notes, Real-time):");
    console.log("   Email:    active@student.tdtu.edu.vn");
    console.log("   Password: password123");
    console.log("");
    console.log("🔴 UNACTIVATED ACCOUNT (Test Verification Redirects):");
    console.log("   Email:    pending@student.tdtu.edu.vn");
    console.log("   Password: password123");
    console.log("");
    console.log("🔒 LOCKED NOTE PASSWORD for both users: secret123");
    console.log("---------------------------------------------------------");

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await client.close();
  }
}

seed();