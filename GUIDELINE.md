# Noternal Project Guideline

This document explains the current Noternal project file by file. Each section answers:

- What does this file do?
- What does it handle, and how does it handle things?
- What are the highlights of the file?
- Where is the data stored, and how can you find it?

Noternal is a Vite + React single-page note app. It has local accounts, login/register, password reset, profile editing, note CRUD, labels, filters, pinned notes, per-note locks, shared/received notes, image attachments, theme settings, and grid/list layouts. There is no backend. Everything is stored in the browser for the current origin.

Useful commands:

```bash
npm run dev
npm run lint
npm run build
```

## Data Storage Overview

The app stores data in the browser under the active origin, for example `http://127.0.0.1:5173`.

To inspect data:

1. Open browser DevTools.
2. Go to `Application`.
3. Open `Local storage -> http://127.0.0.1:5173`.
4. Open `IndexedDB -> noternal-image-store -> note-images` for note images.

Main `localStorage` keys:

- `noternal-users`: registered local users. Stores email, display name, password, and avatar. It no longer stores a generic note passcode.
- `noternal-current-user`: email address of the current logged-in user.
- `noternal-notes-v2`: all note records for all users. Notes are separated by `ownerEmail`.
- `noternal-labels-v1`: labels grouped by user email.
- `noternal-reset-otp`: temporary forgot-password OTP data.
- `noternal-notes`: old legacy note key, used only for migration.
- `theme`: light or dark theme.

Main IndexedDB data:

- Database: `noternal-image-store`
- Object store: `note-images`
- Keys: `note-image-<noteId>-<timestamp>`
- Values: image data URLs

Images are stored in IndexedDB because image data can be too large for `localStorage`. Notes only keep `imageKey` in `noternal-notes-v2`.

## Current Data Shapes

### User Shape

Users in `localStorage["noternal-users"]` usually look like this:

```json
{
  "email": "user@example.com",
  "displayName": "User Name",
  "password": "password123",
  "avatar": "data:image/png;base64,..."
}
```

Important notes:

- `email` is the unique account identifier.
- `displayName` is editable in the profile menu.
- `password` is local-only and not protected by a backend.
- `avatar` stores a profile image data URL.
- There is no `notePasscode` field anymore. Passcodes now belong to individual notes.

### Note Shape

Notes in `localStorage["noternal-notes-v2"]` usually look like this:

```json
{
  "id": 1710000000000,
  "ownerEmail": "user@example.com",
  "title": "Example note",
  "content": "Note body",
  "labels": ["work", "idea"],
  "imageKey": "note-image-1710000000000-1710000000500",
  "pinned": false,
  "locked": false,
  "lockPasscode": "",
  "sharedWith": ["friend@example.com"],
  "received": false,
  "sharedBy": "sender@example.com",
  "sourceNoteId": 1710000000000
}
```

Important fields:

- `ownerEmail`: decides which account owns and sees the note.
- `title` and `content`: note text.
- `labels`: labels assigned to this note.
- `imageKey`: IndexedDB key for the note image.
- `pinned`: pinned notes sort before unpinned notes.
- `locked`: true when this note is currently locked.
- `lockPasscode`: the 4-digit passcode for this note only.
- `sharedWith`: emails that received a copy of this note.
- `received`: true when this note is a received copy.
- `sharedBy`: sender email for received notes.
- `sourceNoteId`: original note id for shared copies.

Lock behavior:

- Each locked note has its own independent 4-digit `lockPasscode`.
- When a user unlocks a note successfully, the note becomes unlocked and `lockPasscode` is cleared.
- If the user wants to lock it again, they must create a new 4-digit passcode.
- Received shared notes are delivered unlocked and do not require the sender's passcode.

## Root Files

### `package.json`

What this file does:

Defines project metadata, scripts, dependencies, and dev dependencies.

What it handles and how:

- `npm run dev` starts the Vite dev server.
- `npm run lint` runs ESLint.
- `npm run build` creates a production build in `dist`.
- `npm run preview` previews the built app.

Highlights:

- React 19 app.
- React Router 7 for page routing.
- Tailwind CSS for styling.
- Heroicons and Lucide React for UI icons.

Where data is stored:

No app data is stored here. This file only defines project configuration.

### `vite.config.js`

What this file does:

Configures Vite for the React app.

What it handles and how:

- Loads the React plugin.
- Provides the development and build pipeline.

Highlights:

This project is a standard Vite single-page app.

Where data is stored:

No runtime app data is stored here.

### `tailwind.config.js`

What this file does:

Configures Tailwind CSS.

What it handles and how:

- Tells Tailwind where to scan files for class names.
- Allows theme extension if needed.

Highlights:

Most UI styling is written with Tailwind utility classes directly in JSX.

Where data is stored:

No runtime app data is stored here.

### `postcss.config.js`

What this file does:

Connects PostCSS plugins.

What it handles and how:

- Runs Tailwind.
- Runs Autoprefixer.

Highlights:

This is part of the CSS build pipeline.

Where data is stored:

No runtime app data is stored here.

### `eslint.config.js`

What this file does:

Defines JavaScript and React linting rules.

What it handles and how:

- Lints `.js` and `.jsx` files.
- Checks React hook usage.
- Checks React refresh constraints.

Highlights:

Run `npm run lint` after edits to catch syntax and quality issues.

Where data is stored:

No runtime app data is stored here.

## App Entry And Routing

### `src/main.jsx`

What this file does:

Bootstraps the React app into the HTML page.

What it handles and how:

- Creates the React root.
- Wraps `App` in `React.StrictMode`.
- Adds `ThemeProvider`.
- Adds `LayoutProvider`.
- Adds `BrowserRouter`.

Highlights:

This file is why every page can access theme, layout, and routing behavior.

Where data is stored:

No direct data storage. Providers below it may read or write storage.

### `src/App.jsx`

What this file does:

Defines the route table.

What it handles and how:

- `/` and `/Login`: login screen.
- `/Register`: registration screen.
- `/ForgotPassword`: forgot-password email step.
- `/Authenticate`: OTP authentication step.
- `/PasswordRestart`: profile password change and forgot-password reset.
- `/Home`: main notes workspace.

Highlights:

The old `/PasscodeRestart` route has been removed because note passcodes are no longer account-level.

Where data is stored:

No direct data storage. Routed pages handle storage through `src/utils/storage.js`.

## Utilities

### `src/utils/storage.js`

What this file does:

Centralizes browser persistence and storage helper functions.

What it handles and how:

- Reads and writes JSON in `localStorage`.
- Normalizes emails with `normalizeEmail`.
- Cleans display names with `cleanDisplayName`.
- Creates, finds, and updates users.
- Stores the current logged-in user email.
- Loads, saves, and migrates notes.
- Loads and saves labels.
- Creates, reads, and clears forgot-password OTP data.
- Stores note images in IndexedDB.
- Hydrates notes by loading images from IndexedDB.
- Strips inline image data before saving note metadata.
- Handles localStorage quota errors without crashing the app.

Highlights:

- This is the main persistence file.
- `normalizeUserRecord` removes old `notePasscode` data from stored users.
- `normalizeNoteRecord` enforces current note-lock rules.
- Received notes are normalized to unlocked state with empty `lockPasscode`.
- `noternal-notes` legacy data is migrated into `noternal-notes-v2`.
- Images are kept out of localStorage to avoid quota problems.

Where data is stored and how to find it:

- Users: DevTools `Application -> Local storage -> noternal-users`.
- Current session: `noternal-current-user`.
- Notes: `noternal-notes-v2`.
- Labels: `noternal-labels-v1`.
- OTP: `noternal-reset-otp`.
- Images: DevTools `Application -> IndexedDB -> noternal-image-store -> note-images`.

## Contexts

### `src/contexts/ThemeContext.jsx`

What this file does:

Provides global theme and note appearance settings.

What it handles and how:

- Stores `isDarkMode` in React state.
- Reads initial theme from `localStorage["theme"]`.
- Writes `theme` whenever dark mode changes.
- Stores note `fontSize` in React state.
- Stores selected `noteColor` in React state.
- Defines the note color palette used by notes and settings.

Highlights:

- Exposes `useTheme`.
- Controls the whole app dark/light wrapper.
- Controls the visual style of note cards.

Where data is stored and how to find it:

- Theme mode: DevTools `Application -> Local storage -> theme`.
- Font size and note color are React state only and reset on refresh.

### `src/contexts/LayoutContext.jsx`

What this file does:

Provides the note layout mode.

What it handles and how:

- Stores `viewMode` as `grid` or `list`.
- Exposes `toggleViewMode`.
- Home uses it to switch the note display layout.

Highlights:

The layout toggle is global context state, so reusable components can access it.

Where data is stored and how to find it:

Layout mode is React state only and is not persisted to localStorage.

## Pages

### `src/Pages/Home.jsx`

What this file does:

Renders the main Noternal workspace after login.

What it handles and how:

- Redirects to `/Login` if there is no current user.
- Loads notes for the current user from `noternal-notes-v2`.
- Hydrates note images from IndexedDB.
- Saves note changes with `saveNotesForUser`.
- Persists inline note images through `persistInlineNoteImages`.
- Loads and saves labels for the current user.
- Creates new notes.
- Updates notes.
- Deletes notes.
- Shares notes to other registered users.
- Creates received-note copies for recipients.
- Searches notes by title.
- Filters notes by labels.
- Sorts pinned notes before unpinned notes.
- Switches between Notes, Received & Shared, and Labels views.
- Opens settings, profile, filter, and layout controls.

Highlights:

- This is the central coordinator for note state.
- Notes view excludes received notes.
- Received notes only appear in `Received & Shared`.
- `Received & Shared` shows both received notes and notes shared by the current user.
- Shared locked notes are delivered as unlocked copies with empty `lockPasscode`.
- Sharing requires the recipient email to exist in `noternal-users`.

Where data is stored and how to find it:

- Notes: DevTools `Application -> Local storage -> noternal-notes-v2`.
- Labels: `noternal-labels-v1`.
- Current user: `noternal-current-user`.
- Images: `IndexedDB -> noternal-image-store -> note-images`.

### `src/Pages/Login.jsx`

What this file does:

Renders the login screen.

What it handles and how:

- Accepts email and password.
- Finds the user with `findUser`.
- Compares the entered password with the stored local password.
- Stores the current user email with `setCurrentUser`.
- Navigates to `/Home` on success.
- Links to Register and Forgot Password.

Highlights:

Authentication is local-only. There is no server validation.

Where data is stored and how to find it:

- Users: `localStorage["noternal-users"]`.
- Current session after login: `localStorage["noternal-current-user"]`.

### `src/Pages/Register.jsx`

What this file does:

Renders the registration screen.

What it handles and how:

- Accepts email, display name, password, and confirm password.
- Cleans display name with `cleanDisplayName`.
- Rejects duplicate email addresses.
- Requires a password of at least 6 characters.
- Requires password confirmation to match.
- Creates the account with `upsertUser`.
- Logs the new user in with `setCurrentUser`.
- Navigates to `/Home`.

Highlights:

- Registration no longer asks for a note passcode.
- Note passcodes are created later per individual note when locking that note.

Where data is stored and how to find it:

- New users: DevTools `Application -> Local storage -> noternal-users`.
- Current session: `noternal-current-user`.

### `src/Pages/ForgotPassword.jsx`

What this file does:

Starts the forgot-password flow.

What it handles and how:

- Accepts an email address.
- Uses `findUser` to check whether the account exists.
- Creates a demo OTP with `createResetOtp`.
- Navigates to `/Authenticate`.

Highlights:

Because the app has no backend email service, the OTP is handled locally as demo data.

Where data is stored and how to find it:

- OTP: `localStorage["noternal-reset-otp"]`.
- Users: `localStorage["noternal-users"]`.

### `src/Pages/Authenticate.jsx`

What this file does:

Verifies the OTP for forgot-password reset.

What it handles and how:

- Accepts email and 6-digit OTP.
- Reads stored OTP with `getResetOtp`.
- Supports resending by creating a new OTP.
- Verifies that email and OTP match.
- Navigates to `/PasswordRestart` in forgot-password mode.

Highlights:

The page can receive initial OTP data through route state or read the current OTP from storage.

Where data is stored and how to find it:

- OTP: `localStorage["noternal-reset-otp"]`.

### `src/Pages/PasswordRestart.jsx`

What this file does:

Handles both profile password changes and forgot-password password resets.

What it handles and how:

- Uses route state to detect forgot-password mode.
- In profile mode, asks for the current password.
- In forgot-password mode, uses the reset email passed from `/Authenticate`.
- Requires the new password to be at least 6 characters.
- Requires confirmation to match.
- Updates the user through `upsertUser`.
- Clears OTP data.
- Clears the current session.
- Sends the user back to `/Login`.

Highlights:

One page supports two flows:

- Profile menu -> Change password.
- Forgot Password -> Authenticate -> PasswordRestart.

Where data is stored and how to find it:

- Users: `localStorage["noternal-users"]`.
- OTP: `localStorage["noternal-reset-otp"]`.
- Current session: `localStorage["noternal-current-user"]`.

## Components

### `src/components/Note.jsx`

What this file does:

Renders a single note card and its edit modal.

What it handles and how:

- Shows a preview card in view mode.
- Opens a centered edit modal.
- Updates title and content through `onUpdateNote`.
- Displays note content with preview truncation.
- Uploads one image per note.
- Saves uploaded image data to IndexedDB with `saveNoteImage`.
- Removes images by clearing `image` and `imageKey`.
- Displays and edits note labels.
- Pins and unpins notes.
- Shares notes through a custom share prompt.
- Deletes notes through a custom delete confirmation prompt.
- Locks notes through a custom create-passcode prompt.
- Unlocks notes through a custom passcode prompt.
- Shows `forgot passcode?` under the unlock input.
- Sends forgotten-passcode flow to the same custom delete confirmation alert.
- Shows shared/received/pinned status icons in view mode.

Highlights:

- Passcodes are per note, not per account.
- Locking an unlocked note asks the user to create a 4-digit passcode.
- Unlocking with the correct passcode immediately removes the lock and clears `lockPasscode`.
- To lock the same note again, the user must create a new passcode.
- Pinned notes use a visible pin icon in the top right instead of a highlighted border.
- Shared and received notes use the same `Share2` icon.
- Shared icon color is green.
- Received icon color is cyan.
- Icon order is Shared/Received first, then Pinned.
- When a note is only shared/received and not pinned, the share icon occupies the top-right status position.

Where data is stored and how to find it:

- Note metadata: `localStorage["noternal-notes-v2"]`.
- Per-note lock data: note fields `locked` and `lockPasscode` inside `noternal-notes-v2`.
- Image data: `IndexedDB -> noternal-image-store -> note-images`.

### `src/components/Profile.jsx`

What this file does:

Renders the profile dropdown menu.

What it handles and how:

- Shows current display name and email.
- Lets the user edit display name.
- Cleans display name with `cleanDisplayName`.
- Uploads a profile picture.
- Stores avatar data on the user record.
- Links to password change.
- Logs out by clearing the current user and navigating to `/Login`.

Highlights:

- The account-level lock passcode option has been removed.
- Display name edits are immediate.
- Email is read-only.

Where data is stored and how to find it:

- User data: `localStorage["noternal-users"]`.
- Current session: `localStorage["noternal-current-user"]`.

### `src/components/Setting.jsx`

What this file does:

Renders the settings dropdown.

What it handles and how:

- Shows the dark/light theme toggle.
- Edits note font size.
- Validates font size between 10 and 20 on blur.
- Shows note color options from `ThemeContext`.
- Updates theme settings through `useTheme`.

Highlights:

This is the main visual preference panel for note appearance.

Where data is stored and how to find it:

- Theme: `localStorage["theme"]`.
- Font size and note color are React state only.

### `src/components/ToggleTheme.jsx`

What this file does:

Renders the theme switch used inside Settings.

What it handles and how:

- Reads `isDarkMode` from `useTheme`.
- Calls `toggleTheme` when clicked.
- Moves the switch knob visually based on theme state.

Highlights:

Small focused component for the dark/light mode control.

Where data is stored and how to find it:

- Theme mode: `localStorage["theme"]`.

### `src/components/Filter.jsx`

What this file does:

Renders the label filter popover.

What it handles and how:

- Receives all available labels from Home.
- Receives the active filter list from Home.
- Calls `toggleFilter` when a label is clicked.
- Shows active styling for selected labels.
- Shows an empty state when no labels exist.

Highlights:

The label list comes from the user's global labels, not only from notes currently visible.

Where data is stored and how to find it:

- Labels: `localStorage["noternal-labels-v1"]`.

### `src/components/LayoutToggle.jsx`

What this file does:

Provides a reusable layout toggle button.

What it handles and how:

- Reads `viewMode` from `useLayout`.
- Calls `toggleViewMode`.
- Displays grid or list icon depending on the current layout.

Highlights:

Home currently has its own layout button, but this component can be reused if the UI is refactored.

Where data is stored and how to find it:

Layout mode is React state in `LayoutContext`, not browser storage.

## Styling And Assets

### `src/index.css`

What this file does:

Defines global CSS and Tailwind layers.

What it handles and how:

- Loads Tailwind base, components, and utilities.
- Defines body transition behavior.
- Defines dark body background.
- Defines `.custom-scrollbar`.

Highlights:

The main workspace and note editor use `.custom-scrollbar` for cleaner scrolling.

Where data is stored:

No app data is stored here.

### `src/assets/noternal_logo.png`

What this file does:

Stores the Noternal logo.

What it handles and how:

- Imported by auth pages.
- Imported by the Home header.

Highlights:

This is a bundled static asset.

Where data is stored:

This is project file data, not browser runtime data.

### `public/favicon.svg`

What this file does:

Provides the browser tab favicon.

What it handles and how:

- Served directly from the public folder by Vite.

Highlights:

Static public asset.

Where data is stored:

This is project file data, not browser runtime data.

### `public/icons.svg`

What this file does:

Provides a public SVG icon resource.

What it handles and how:

- Served directly from the public folder if referenced.

Highlights:

Static public asset.

Where data is stored:

This is project file data, not browser runtime data.

## Main Feature Flows

### Account Flow

1. `Register.jsx` creates a user in `noternal-users`.
2. `Login.jsx` validates against `noternal-users`.
3. `setCurrentUser` writes the session email to `noternal-current-user`.
4. `Home.jsx` reads the current user and loads notes for that email.
5. `Profile.jsx` updates display name and avatar through `updateCurrentUser`.
6. `PasswordRestart.jsx` updates passwords through `upsertUser`.

### Note CRUD Flow

1. `Home.jsx` creates the note object.
2. `Note.jsx` edits the note and calls `onUpdateNote(id, updates)`.
3. `Home.jsx` updates `noteForms` state.
4. The `useEffect` in `Home.jsx` saves notes with `saveNotesForUser`.
5. `storage.js` writes metadata to `noternal-notes-v2`.

### Lock Flow

1. User clicks the lock button in `Note.jsx`.
2. If the note is unlocked, `Note.jsx` opens the create-passcode prompt.
3. User enters and confirms a 4-digit passcode.
4. `Note.jsx` saves `{ locked: true, lockPasscode: "<code>" }`.
5. Opening the locked note shows the unlock prompt.
6. Correct passcode saves `{ locked: false, lockPasscode: "" }`.
7. The passcode is gone after unlock.
8. If the user clicks `forgot passcode?`, the delete confirmation alert appears.

### Share Flow

1. User opens the share prompt in `Note.jsx`.
2. `Note.jsx` sends the target email to `Home.jsx`.
3. `Home.jsx` checks the email exists in `noternal-users`.
4. The sender note gets the recipient email in `sharedWith`.
5. A copied note is created for the recipient with `received: true`.
6. The delivered copy is forced to `locked: false` and `lockPasscode: ""`.
7. Recipient sees the note under `Received & Shared`, not under normal Notes.

### Image Flow

1. User uploads an image in `Note.jsx`.
2. `saveNoteImage` stores the image data in IndexedDB.
3. The note stores the image data during the session and `imageKey` for persistence.
4. `stripImagesForStorage` removes inline image data before writing notes to `localStorage`.
5. On load, `hydrateNotesWithImages` reads IndexedDB by `imageKey` and restores the display image.

## Maintenance Notes

- The app has no backend. All data is local to the browser and origin.
- Clearing browser storage deletes users, notes, labels, sessions, OTPs, and images.
- Changing from `127.0.0.1` to `localhost`, or changing ports, can make data appear missing because browser storage is origin-specific.
- Do not reintroduce a generic user-level `notePasscode`.
- Keep lock data on each note with `locked` and `lockPasscode`.
- Received notes should stay unlocked.
- If adding new note fields, update note creation in `Home.jsx`, normalization in `storage.js`, and UI behavior in `Note.jsx`.
- If adding new routes, update `src/App.jsx`.
- If adding persistent settings, add explicit keys and helpers in `src/utils/storage.js`.
- If adding image-like large data, prefer IndexedDB over localStorage.
