import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Error: MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

async function seed() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(); // Uses the DB name from your connection string

    // 1. Clean existing data for a fresh start
    await db.collection('users').deleteMany({});
    await db.collection('labels').deleteMany({});
    await db.collection('notes').deleteMany({});

    console.log("Emptying collections for a clean state...");

    // 2. Prepare Hashed Passwords
    const commonPasswordHash = await bcrypt.hash('password123', 10);
    const notePasswordHash = await bcrypt.hash('secret123', 10);

    // 3. Create Users
    const users = [
      {
        email: "grading@student.tdtu.edu.vn",
        display_name: "Instructor Account",
        avatar_img: "/uploads/avatars/instructor.png",
        password_hash: commonPasswordHash,
        is_active: true,
        activation_token: null,
        preferences: { theme: "light", font_size: "medium", note_color: "yellow" },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: "partner@student.tdtu.edu.vn",
        display_name: "Study Partner",
        avatar_img: "/uploads/avatars/partner.png",
        password_hash: commonPasswordHash,
        is_active: true,
        activation_token: null,
        preferences: { theme: "dark", font_size: "medium", note_color: "blue" },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const userResult = await db.collection('users').insertMany(users);
    const instructorId = userResult.insertedIds[0];
    const partnerEmail = users[1].email;

    // 4. Create Labels
    const labels = [
      { user_id: instructorId, name: "Discrete Mathematics", created_at: new Date() },
      { user_id: instructorId, name: "Project Work", created_at: new Date() }
    ];

    const labelResult = await db.collection('labels').insertMany(labels);
    const labelId = labelResult.insertedIds[0];

    // 5. Create Notes (Covering multiple rubric criteria)
    const notes = [
      {
        owner_id: instructorId,
        title: "Reverse Polish Notation Review",
        content: "Logic and truth tables for upcoming exam...",
        images: ["/uploads/notes/logic_gate.jpg"],
        label_ids: [labelId],
        is_pinned: true, // Criteria: Pin to top
        pinned_at: new Date(),
        is_locked: false,
        password_hash: null,
        shared_with: [
          { recipient_email: partnerEmail, permission: "edit", shared_at: new Date() } // Criteria: Collaboration
        ],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        owner_id: instructorId,
        title: "Confidential Grades",
        content: "This content is protected and requires a password to view.",
        images: [],
        label_ids: [],
        is_pinned: false,
        is_locked: true, // Criteria: Note Lock
        password_hash: notePasswordHash,
        shared_with: [],
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await db.collection('notes').insertMany(notes);

    console.log("-----------------------------------------");
    console.log("Database successfully seeded!");
    console.log("INSTRUCTOR LOGIN: grading@student.tdtu.edu.vn");
    console.log("PASSWORD: password123");
    console.log("LOCKED NOTE PASSWORD: secret123");
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await client.close();
  }
}

seed();