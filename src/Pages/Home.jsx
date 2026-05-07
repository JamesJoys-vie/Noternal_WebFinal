import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, Cog8ToothIcon, PlusIcon, 
  ListBulletIcon, DocumentTextIcon, ArrowUturnLeftIcon, 
  Squares2X2Icon, TagIcon, InboxArrowDownIcon
} from '@heroicons/react/24/outline';
import Logo from '../assets/noternal_logo.png'
import { FunnelIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../contexts/ThemeContext';
import { FilterMenu } from "../components/Filter";
import { useLayout } from '../contexts/LayoutContext';
import { SettingsMenu } from "../components/Setting";
import { ProfileMenu } from "../components/Profile";
import NoteForm from '../components/Note';
import {
  findUser,
  getAllNotes,
  getCurrentUser,
  getCurrentUserEmail,
  getLabelsForUser,
  hydrateNotesWithImages,
  normalizeEmail,
  persistInlineNoteImages,
  saveAllNotes,
  saveLabelsForUser,
  saveNotesForUser,
} from '../utils/storage';

function NoternalApp() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeView, setActiveView] = useState('notes');
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const [noteForms, setNoteForms] = useState(() => {
    const email = getCurrentUserEmail();
    return email ? getAllNotes().filter(note => note.ownerEmail === email) : [];
  });
  const [labels, setLabels] = useState(() => {
    const email = getCurrentUserEmail();
    return email ? getLabelsForUser(email) : [];
  });
  const [labelDraft, setLabelDraft] = useState('');
  const [editingLabel, setEditingLabel] = useState(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { viewMode, toggleViewMode } = useLayout();

  useEffect(() => {
    if (!currentUser) {
      navigate('/Login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser?.email) return;

    let cancelled = false;
    const storedNotes = getAllNotes().filter(note => note.ownerEmail === currentUser.email);

    hydrateNotesWithImages(storedNotes).then(hydratedNotes => {
      if (cancelled) return;

      const hasHydratedImage = hydratedNotes.some((note, index) =>
        note.image && note.image !== storedNotes[index]?.image
      );

      if (hasHydratedImage) setNoteForms(hydratedNotes);
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.email]);

  useEffect(() => {
    if (!currentUser?.email) return;

    saveNotesForUser(currentUser.email, noteForms);

    if (!noteForms.some(note => note.image && !note.imageKey)) return;

    let cancelled = false;

    persistInlineNoteImages(noteForms).then(persistedNotes => {
      if (cancelled) return;

      setNoteForms(prev => {
        const persistedById = new Map(persistedNotes.map(note => [note.id, note]));
        let changed = false;
        const mergedNotes = prev.map(note => {
          const persistedNote = persistedById.get(note.id);
          if (!persistedNote?.imageKey || persistedNote.imageKey === note.imageKey) return note;

          changed = true;
          return { ...note, imageKey: persistedNote.imageKey };
        });

        return changed ? mergedNotes : prev;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.email, noteForms]);

  useEffect(() => {
    if (currentUser?.email) saveLabelsForUser(currentUser.email, labels);
  }, [currentUser?.email, labels]);

  const deleteNote = (id) => {
    setNoteForms(prev => prev.filter(note => note.id !== id));
  };

  const toggleMenu = (menuName) => {
    setActiveMenu(prev => prev === menuName ? null : menuName);
  };

  const addNoteForm = () => {
    const id = Date.now();
    setNoteForms(prev => [
      ...prev,
      {
        id,
        ownerEmail: currentUser?.email,
        title: '',
        content: '',
        labels: [],
        image: null,
        pinned: false,
        locked: false,
        lockPasscode: '',
        sharedWith: [],
        received: false,
        isNew: true,
      },
    ]);
    setActiveView('notes');
    setActiveMenu(null);
  };

  const updateNote = (id, updates) => {
    setNoteForms(prev => prev.map(note =>
      note.id === id ? { ...note, ...updates } : note
    ));
  };

  const toggleFilter = (label) => {
    setActiveFilters(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label) // Remove if already active
        : [...prev, label]              // Add if not active
    );
  };

  const addGlobalLabel = (label) => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    setLabels(prev => prev.includes(trimmedLabel) ? prev : [...prev, trimmedLabel]);
  };

  const createLabel = (e) => {
    e.preventDefault();
    addGlobalLabel(labelDraft);
    setLabelDraft('');
  };

  const renameLabel = (oldLabel) => {
    const nextLabel = editingLabelValue.trim();
    if (!nextLabel || nextLabel === oldLabel) {
      setEditingLabel(null);
      return;
    }

    setLabels(prev => prev.map(label => label === oldLabel ? nextLabel : label));
    setActiveFilters(prev => prev.map(label => label === oldLabel ? nextLabel : label));
    setNoteForms(prev => prev.map(note => ({
      ...note,
      labels: (note.labels || []).map(label => label === oldLabel ? nextLabel : label),
    })));
    setEditingLabel(null);
  };

  const removeGlobalLabel = (labelToRemove) => {
    setLabels(prev => prev.filter(label => label !== labelToRemove));
    setActiveFilters(prev => prev.filter(label => label !== labelToRemove));
    setNoteForms(prev => prev.map(note => ({
      ...note,
      labels: (note.labels || []).filter(label => label !== labelToRemove),
    })));
  };

  const shareNote = (id, email) => {
    const recipientEmail = normalizeEmail(email);
    const recipient = findUser(recipientEmail);
    const sourceNote = noteForms.find(note => note.id === id);

    if (!recipient || !sourceNote || recipientEmail === currentUser?.email) {
      return 'Enter another registered user email to share this note.';
    }

    const nextUserNotes = noteForms.map(note => (
      note.id === id
        ? { ...note, sharedWith: [...new Set([...(note.sharedWith || []), recipientEmail])] }
        : note
    ));
    const deliveredNote = {
      ...sourceNote,
      id: Date.now(),
      ownerEmail: recipientEmail,
      sharedBy: currentUser.email,
      sharedWith: [],
      received: true,
      pinned: false,
      locked: false,
      lockPasscode: '',
      isNew: false,
      sourceNoteId: id,
    };
    const otherNotes = getAllNotes().filter(note => (
      note.ownerEmail !== currentUser.email &&
      !(note.ownerEmail === recipientEmail && note.sourceNoteId === id && note.sharedBy === currentUser.email)
    ));

    saveAllNotes([...otherNotes, ...nextUserNotes, deliveredNote]);
    setNoteForms(nextUserNotes);
    return '';
  };

  const displayedNotes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const sourceNotes = activeView === 'shared'
      ? noteForms.filter(note => note.received || (note.sharedWith || []).length > 0)
      : noteForms.filter(note => !note.received);

    return sourceNotes.filter(note => {
      const matchesFilters = activeFilters.length === 0 || (
      // Returns TRUE if the note has at least ONE of the active filters
        activeFilters.some(filter => (note.labels || []).includes(filter))
      );
      const matchesSearch = normalizedSearch === '' ||
        (note.title || '').toLowerCase().includes(normalizedSearch);

      return matchesFilters && matchesSearch;
    }).sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.id - a.id);
  }, [noteForms, activeFilters, searchQuery, activeView]);

  const sidebarButtonClass = (viewName) => `
    group flex h-12 w-12 items-center overflow-hidden rounded-xl bg-[#d2d2d2] px-3 text-gray-500 shadow-sm transition-all duration-300
    hover:w-48 hover:bg-[#5d3fd3] hover:text-white dark:bg-[#1d1d1b] dark:text-purple-400 dark:hover:bg-[#5d3fd3] dark:hover:text-white
    ${activeView === viewName ? 'w-48 bg-[#5d3fd3] text-white dark:bg-[#5d3fd3] dark:text-white' : ''}
  `;

  const sidebarLabelClass = (viewName) =>
    `ml-3 whitespace-nowrap font-semibold transition-opacity ${activeView === viewName ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`;

  const renderLabelManager = () => (
    <section className="col-span-full w-full max-w-3xl rounded-lg border border-[#cabfff] bg-white p-6 shadow-sm dark:border-[#616ebe] dark:bg-[#1f2025]">
      <h2 className="text-2xl font-bold text-[#3a2a7a] dark:text-gray-100">Labels</h2>
      <form onSubmit={createLabel} className="mt-5 flex gap-3">
        <input
          value={labelDraft}
          onChange={(e) => setLabelDraft(e.target.value)}
          placeholder="New label..."
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-[#5d3fd3] dark:border-gray-700 dark:bg-[#2b2d36] dark:text-white"
        />
        <button type="submit" className="rounded-lg bg-[#5d3fd3] px-5 py-2 font-semibold text-white hover:bg-[#4a32a8]">
          Add
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {labels.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No labels created yet.</p>
        ) : (
          labels.map(label => (
            <div key={label} className="flex items-center gap-3 rounded-lg bg-[#f6f2ff] p-3 dark:bg-[#2b2d36]">
              {editingLabel === label ? (
                <input
                  autoFocus
                  value={editingLabelValue}
                  onChange={(e) => setEditingLabelValue(e.target.value)}
                  onBlur={() => renameLabel(label)}
                  onKeyDown={(e) => e.key === 'Enter' && renameLabel(label)}
                  className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-[#5d3fd3] dark:bg-[#1f2128] dark:text-white"
                />
              ) : (
                <span className="min-w-0 flex-1 text-gray-800 dark:text-gray-200">{label}</span>
              )}
              <button
                onClick={() => {
                  setEditingLabel(label);
                  setEditingLabelValue(label);
                }}
                className="rounded-lg px-3 py-1 text-sm font-semibold text-[#5d3fd3] hover:bg-[#5d3fd3]/10"
              >
                Edit
              </button>
              <button
                onClick={() => removeGlobalLabel(label)}
                className="rounded-lg px-3 py-1 text-sm font-semibold text-red-500 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <main className="h-screen bg-white dark:bg-[#1f2025] flex flex-col font-sans relative transition-colors duration-300 overflow-hidden">
        
        {/* HEADER*/}
        <header className="h-16 bg-gradient-to-r from-[#d9cbff] to-[#f6f2ff] dark:from-[#2e1a4d] dark:to-[#1f2128] flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800 relative z-40">
          <div className="flex items-center gap-2">
            <img src={Logo} alt="App logo" style={{ width: '150px' }}/>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8 relative">
            <input 
              type="text" 
              placeholder="Search for notes" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-12 pr-4 rounded-xl bg-white/70 backdrop-blur-md dark:bg-[#2b2d36] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-[#343742] focus:outline-none transition-all" 
            />
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center gap-5 relative">
            <button 
              onClick={() => toggleMenu('settings')}
              className={`p-1.5 rounded-lg transition-colors ${activeMenu === 'settings' ? 'bg-[#5d3fd3]/20 text-[#5d3fd3]' : 'text-[#3a2a7a] dark:text-gray-300 hover:bg-[#5d3fd3]/10'}`}
            >
              <Cog8ToothIcon className="w-6 h-6" />
            </button>

            <button onClick={() => toggleMenu('profile')} className="relative">
              <img 
                src={currentUser?.avatar || 'https://randomuser.me/api/portraits/women/44.jpg'} 
                alt="User" 
                className={`w-10 h-10 rounded-full border-2 transition-all ${activeMenu === 'profile' ? 'border-[#5d3fd3] scale-110' : 'border-white dark:border-gray-600'}`}
              />
            </button>

            {activeMenu === 'settings' && <SettingsMenu />}
            {activeMenu === 'profile' && (
              <ProfileMenu
                user={currentUser}
                onUserUpdate={setCurrentUserState}
              />
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT SIDEBAR */}
          <aside className="w-60 pt-6 pl-4 flex flex-col items-start gap-6">
            <button onClick={() => setActiveView('notes')} className={sidebarButtonClass('notes')}>
              <DocumentTextIcon className="h-7 w-7 shrink-0" />
              <span className={sidebarLabelClass('notes')}>Notes</span>
            </button>
            <button onClick={() => setActiveView('shared')} className={sidebarButtonClass('shared')}>
              <InboxArrowDownIcon className="h-7 w-7 shrink-0" />
              <span className={sidebarLabelClass('shared')}>Mailbox</span>
            </button>
            <button onClick={() => setActiveView('labels')} className={sidebarButtonClass('labels')}>
              <TagIcon className="h-7 w-7 shrink-0" />
              <span className={sidebarLabelClass('labels')}>Labels</span>
            </button>
          </aside>

          {/* MAIN AREA */}
          <main className={`
            flex-1 p-6 items-start overflow-y-auto custom-scrollbar transition-all duration-500
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' 
              : 'flex w-full max-w-4xl flex-col gap-4 mx-auto'}
          `}>
            {activeView === 'labels' ? renderLabelManager() : displayedNotes.map(note => (
                <NoteForm
                  key={note.id}
                  note={note}
                  availableLabels={labels}
                  onAddGlobalLabel={addGlobalLabel}
                  onShareNote={shareNote}
                  onUpdateNote={updateNote}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
          </main>

          {/* RIGHT SIDEBAR */}
          <div className="w-24 pt-6 flex flex-col items-center gap-5 relative flex-shrink-0">
            <button onClick={addNoteForm} className="w-16 h-16 bg-[#5d3fd3] rounded-full text-white shadow-xl flex items-center justify-center hover:bg-[#4a32a8] transition-all">
              <PlusIcon className="w-8 h-8 stroke-2" />
            </button>

            <button 
              onClick={toggleViewMode} 
              className="w-16 h-16 bg-[#5d3fd3] rounded-full text-white shadow-xl flex items-center justify-center hover:bg-[#4a32a8] transition-all"
            >
              {viewMode === 'grid' ? (
                <ListBulletIcon className="w-8 h-8" /> 
              ) : (
                <Squares2X2Icon className="w-8 h-8" /> 
              )}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => toggleMenu('filter')}
                className={`w-16 h-16 rounded-full text-white shadow-xl flex items-center justify-center transition-all ${activeMenu === 'filter' ? 'bg-[#4a32a8]' : 'bg-[#5d3fd3] hover:bg-[#4a32a8]'}`}
              >
                <FunnelIcon className="w-7 h-7" />
              </button>
              {activeMenu === 'filter' && (
                <FilterMenu 
                  availableLabels={labels} 
                  activeFilters={activeFilters} 
                  toggleFilter={toggleFilter} 
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NoternalApp;
