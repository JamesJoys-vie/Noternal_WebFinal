const USERS_KEY = 'noternal-users';
const CURRENT_USER_KEY = 'noternal-current-user';
const NOTES_KEY = 'noternal-notes-v2';
const LEGACY_NOTES_KEY = 'noternal-notes';
const LABELS_KEY = 'noternal-labels-v1';
const OTP_KEY = 'noternal-reset-otp';
const IMAGE_DB_NAME = 'noternal-image-store';
const IMAGE_STORE_NAME = 'note-images';

export const normalizeEmail = (email = '') => email.trim().toLowerCase();

const readJson = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const isQuotaError = (error) =>
  error?.name === 'QuotaExceededError' ||
  error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
  error?.code === 22 ||
  error?.code === 1014;

const writeJson = (key, value) => {
  const serialized = JSON.stringify(value);

  try {
    localStorage.setItem(key, serialized);
  } catch (error) {
    if (!isQuotaError(error)) throw error;

    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, serialized);
    } catch (retryError) {
      console.warn(`Unable to persist ${key}. Browser storage is full.`, retryError);
    }
  }
};

export const cleanDisplayName = (name = '') =>
  name.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trimStart();

const normalizeUserRecord = (user = {}) => {
  const rest = { ...(user || {}) };
  delete rest.notePasscode;

  return {
    avatar: '',
    ...rest,
    displayName: cleanDisplayName(rest.displayName || '').trim() || 'Noternal user',
    email: normalizeEmail(rest.email || ''),
  };
};

export const getUsers = () => {
  const users = readJson(USERS_KEY, []);
  if (!Array.isArray(users)) return [];

  const normalizedUsers = users
    .map(normalizeUserRecord)
    .filter(user => user.email);

  if (JSON.stringify(users) !== JSON.stringify(normalizedUsers)) {
    saveUsers(normalizedUsers);
  }

  return normalizedUsers;
};

export const saveUsers = (users) => writeJson(USERS_KEY, users);

export const findUser = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return getUsers().find(user => user.email === normalizedEmail) || null;
};

export const getCurrentUserEmail = () => normalizeEmail(localStorage.getItem(CURRENT_USER_KEY) || '');

export const getCurrentUser = () => findUser(getCurrentUserEmail());

export const setCurrentUser = (email) => {
  localStorage.setItem(CURRENT_USER_KEY, normalizeEmail(email));
};

export const clearCurrentUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const upsertUser = (nextUser) => {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(nextUser.email);
  const user = normalizeUserRecord({ ...nextUser, email: normalizedEmail });
  const existingIndex = users.findIndex(item => item.email === normalizedEmail);

  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...user };
  } else {
    users.push(user);
  }

  saveUsers(users);
  return user;
};

export const updateCurrentUser = (updates) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const nextUser = {
    ...currentUser,
    ...updates,
    displayName: updates.displayName !== undefined
      ? cleanDisplayName(updates.displayName).trim() || currentUser.displayName
      : currentUser.displayName,
  };

  upsertUser(nextUser);
  return nextUser;
};

const openImageDb = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) {
    reject(new Error('IndexedDB is unavailable.'));
    return;
  }

  const request = indexedDB.open(IMAGE_DB_NAME, 1);

  request.onupgradeneeded = () => {
    request.result.createObjectStore(IMAGE_STORE_NAME);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const withImageStore = async (mode, action) => {
  const db = await openImageDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE_NAME, mode);
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const makeNoteImageKey = (noteId) => `note-image-${noteId}-${Date.now()}`;

export const saveNoteImage = async (key, imageData) => {
  try {
    await withImageStore('readwrite', store => store.put(imageData, key));
    return true;
  } catch (error) {
    console.warn('Unable to persist note image.', error);
    return false;
  }
};

export const getNoteImage = async (key) => {
  if (!key) return null;

  try {
    return await withImageStore('readonly', store => store.get(key));
  } catch (error) {
    console.warn('Unable to load note image.', error);
    return null;
  }
};

export const hydrateNotesWithImages = async (notes) => {
  const hydratedNotes = await Promise.all(notes.map(async note => {
    if (note.image || !note.imageKey) return note;

    const image = await getNoteImage(note.imageKey);
    return image ? { ...note, image } : note;
  }));

  return hydratedNotes;
};

export const persistInlineNoteImages = async (notes) => {
  const persistedNotes = await Promise.all(notes.map(async note => {
    if (!note.image) return note;

    const imageKey = note.imageKey || makeNoteImageKey(note.id);
    await saveNoteImage(imageKey, note.image);
    return { ...note, imageKey };
  }));

  return persistedNotes;
};

const stripImagesForStorage = (notes) => notes.map(note => {
  const persistedNote = { ...note };
  delete persistedNote.image;

  return {
    ...persistedNote,
    imageKey: persistedNote.imageKey || '',
  };
});

const normalizeNoteRecord = (note = {}, fallbackOwnerEmail = '') => {
  const received = Boolean(note.received);
  const lockPasscode = String(note.lockPasscode || '').replace(/\D/g, '').slice(0, 4);
  const locked = !received && Boolean(note.locked) && lockPasscode.length === 4;

  return {
    ...note,
    ownerEmail: normalizeEmail(note.ownerEmail || fallbackOwnerEmail),
    pinned: Boolean(note.pinned),
    locked,
    lockPasscode: locked ? lockPasscode : '',
    sharedWith: Array.isArray(note.sharedWith) ? note.sharedWith : [],
    received,
    isNew: !received && Boolean(note.isNew),
  };
};

export const getAllNotes = () => {
  const notes = readJson(NOTES_KEY, null);
  if (Array.isArray(notes)) {
    const normalizedNotes = notes.map(note => normalizeNoteRecord(note)).filter(note => note.ownerEmail);

    if (JSON.stringify(notes) !== JSON.stringify(normalizedNotes)) {
      saveAllNotes(normalizedNotes);
    }

    return normalizedNotes;
  }

  const legacyNotes = readJson(LEGACY_NOTES_KEY, []);
  if (!Array.isArray(legacyNotes)) return [];

  const ownerEmail = getCurrentUserEmail();
  const normalizedLegacyNotes = legacyNotes.map(note => normalizeNoteRecord(note, ownerEmail));
  saveAllNotes(normalizedLegacyNotes);
  return normalizedLegacyNotes;
};

export const saveAllNotes = (notes) => {
  writeJson(NOTES_KEY, stripImagesForStorage(notes));
  localStorage.removeItem(LEGACY_NOTES_KEY);
};

export const getNotesForUser = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return getAllNotes().filter(note => note.ownerEmail === normalizedEmail);
};

export const saveNotesForUser = (email, userNotes) => {
  const normalizedEmail = normalizeEmail(email);
  const otherNotes = getAllNotes().filter(note => note.ownerEmail !== normalizedEmail);
  saveAllNotes([...otherNotes, ...userNotes]);
};

export const getLabelsForUser = (email) => {
  const normalizedEmail = normalizeEmail(email);
  const labelsByUser = readJson(LABELS_KEY, {});
  const labels = labelsByUser[normalizedEmail] || [];
  return Array.isArray(labels) ? labels : [];
};

export const saveLabelsForUser = (email, labels) => {
  const normalizedEmail = normalizeEmail(email);
  const labelsByUser = readJson(LABELS_KEY, {});
  labelsByUser[normalizedEmail] = [...new Set(labels.map(label => label.trim()).filter(Boolean))];
  writeJson(LABELS_KEY, labelsByUser);
};

export const createResetOtp = (email) => {
  const normalizedEmail = normalizeEmail(email);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  writeJson(OTP_KEY, {
    email: normalizedEmail,
    code,
    createdAt: Date.now(),
  });
  return code;
};

export const getResetOtp = () => readJson(OTP_KEY, null);

export const clearResetOtp = () => {
  localStorage.removeItem(OTP_KEY);
};
