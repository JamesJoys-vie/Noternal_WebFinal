import { useRef, useState } from 'react';
import { ImagePlus, Lock, Pin, Share2, Trash2, Unlock, X } from 'lucide-react';
import { useTheme } from '../contexts/theme-context';
import { makeNoteImageKey, saveNoteImage } from '../utils/storage';

const NoteForm = ({
  note,
  availableLabels = [],
  onAddGlobalLabel,
  onDelete,
  onShareNote,
  onUpdateNote,
}) => {
  const {
    id,
    title = '',
    content = '',
    labels = [],
    image = null,
    pinned = false,
    locked = false,
    lockPasscode = '',
    received = false,
    sharedWith = [],
    isNew = false,
  } = note;
  const { noteColor, fontSize, colorPalette } = useTheme();
  const currentStyles = colorPalette[noteColor];
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState((isNew || (!title && !content)) && !locked);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(!locked);
  const [newLabel, setNewLabel] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [showLockSetup, setShowLockSetup] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [typedPasscode, setTypedPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [lockSetupError, setLockSetupError] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState('');
  const [hoveredLabel, setHoveredLabel] = useState(null);

  const isContentHidden = locked && !isUnlocked;
  const isCreatingNote = Boolean(isNew);
  const hasShareStatus = received || sharedWith.length > 0;
  const hasStatusIndicators = hasShareStatus || pinned;
  const noteShellClasses = `${currentStyles.bg} ${currentStyles.text} ${noteColor === 'white' ? 'border-[#616ebe] dark:border-[#cabfff]' : 'dark:border-[#616ebe] border-[#cabfff]'}`;

  const stop = (e) => e.stopPropagation();

  const handleImageUpload = (e) => {
    if (isCreatingNote) {
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result;
      const imageKey = makeNoteImageKey(id);
      await saveNoteImage(imageKey, imageData);
      onUpdateNote(id, { image: imageData, imageKey });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddLabel = (e) => {
    if (isCreatingNote) return;

    const trimmedLabel = newLabel.trim();

    if (e.key === 'Enter' && trimmedLabel) {
      if (!labels.includes(trimmedLabel)) {
        onUpdateNote(id, { labels: [...labels, trimmedLabel] });
      }
      onAddGlobalLabel?.(trimmedLabel);
      setNewLabel('');
      setIsAddingLabel(false);
    }
  };

  const removeLabel = (labelToRemove) => {
    if (isCreatingNote) return;

    onUpdateNote(id, { labels: labels.filter(label => label !== labelToRemove) });
  };

  const openNote = () => {
    if (isContentHidden) {
      setShowPasscode(true);
      return;
    }

    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setIsAddingLabel(false);
    setNewLabel('');

    if (isCreatingNote) {
      onUpdateNote(id, { isNew: false });
    }
  };

  const handleToggleLock = () => {
    if (isCreatingNote) return;

    if (!locked) {
      setShowLockSetup(true);
      return;
    }

    if (!isUnlocked) {
      setShowPasscode(true);
      return;
    }

    onUpdateNote(id, { locked: false, lockPasscode: '' });
    setIsUnlocked(true);
  };

  const resetLockSetup = () => {
    setShowLockSetup(false);
    setNewPasscode('');
    setConfirmPasscode('');
    setLockSetupError('');
  };

  const handleCreateLock = (e) => {
    e.preventDefault();

    if (newPasscode.length !== 4) {
      setLockSetupError('Passcode must be exactly 4 digits.');
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setLockSetupError('Passcodes do not match.');
      return;
    }

    onUpdateNote(id, { locked: true, lockPasscode: newPasscode });
    setIsUnlocked(false);
    setIsEditing(false);
    resetLockSetup();
  };

  const handleUnlock = (e) => {
    e.preventDefault();

    if (typedPasscode !== lockPasscode) {
      setPasscodeError('Passcode is incorrect.');
      return;
    }

    onUpdateNote(id, { locked: false, lockPasscode: '' });
    setIsUnlocked(true);
    setIsEditing(true);
    setShowPasscode(false);
    setTypedPasscode('');
    setPasscodeError('');
  };

  const handleForgotPasscode = (e) => {
    e.preventDefault();
    setShowPasscode(false);
    setTypedPasscode('');
    setPasscodeError('');
    setShowConfirm(true);
  };

  const handleShare = (e) => {
    e.preventDefault();
    if (isCreatingNote) return;

    const trimmedEmail = shareEmail.trim();

    if (!trimmedEmail) {
      setShareError('Enter an email address.');
      return;
    }

    const errorMessage = onShareNote?.(id, trimmedEmail);
    if (errorMessage) {
      setShareError(errorMessage);
      return;
    }

    setShowShare(false);
    setShareEmail('');
    setShareError('');
  };

  const renderLabels = (editing) => {
    const canEditLabels = editing && !isCreatingNote;

    return (
    <div className="flex min-h-7 flex-wrap items-center gap-2">
      {(editing ? labels : labels.length > 4 ? [...labels.slice(0, 4), '...'] : labels).map((label, index) => (
        <span
          key={`${label}-${index}`}
          onClick={() => canEditLabels && label !== '...' && removeLabel(label)}
          onMouseEnter={() => canEditLabels && setHoveredLabel(label)}
          onMouseLeave={() => setHoveredLabel(null)}
          className={`px-3 py-1 rounded-full text-xs transition-colors ${
            canEditLabels && label !== '...'
              ? 'cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {hoveredLabel === label && label !== '...' ? 'Remove' : label}
        </span>
      ))}

      {canEditLabels && (
        isAddingLabel ? (
          <input
            autoFocus
            list={`labels-${id}`}
            className="bg-purple-50 dark:bg-[#1f2128] border border-purple-200 dark:border-purple-900/50 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs focus:outline-none w-28"
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={handleAddLabel}
            onBlur={() => setIsAddingLabel(false)}
            placeholder="Label name..."
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingLabel(true)}
            className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors h-[24px]"
          >
            ...
          </button>
        )
      )}

      <datalist id={`labels-${id}`}>
        {availableLabels.map(label => <option key={label} value={label} />)}
      </datalist>
    </div>
    );
  };

  const renderIndicators = (isEditor = false) => {
    if (!hasStatusIndicators) return null;

    return (
      <div className={`absolute ${isEditor ? 'right-14 top-5' : 'right-4 top-4'} flex items-center gap-2`}>
        {hasShareStatus && (
          <Share2
            className={`h-5 w-5 ${received ? 'text-cyan-500 dark:text-cyan-300' : 'text-emerald-500 dark:text-emerald-300'}`}
            strokeWidth={2.6}
            aria-label={received ? 'Received note' : 'Shared note'}
          />
        )}
        {pinned && (
          <Pin
            className="h-5 w-5 fill-[#5d3fd3] text-[#5d3fd3] dark:fill-[#a890ff] dark:text-[#a890ff]"
            strokeWidth={2.6}
            aria-label="Pinned note"
          />
        )}
      </div>
    );
  };

  const renderDeleteConfirm = () => showConfirm && (
    <div onClick={stop} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <div className="bg-[#2b2d36] w-[280px] p-6 rounded-2xl border border-[#5d3fd3]/30 shadow-2xl relative animate-in fade-in zoom-in duration-150">
        <button
          onClick={() => setShowConfirm(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close remove confirmation"
        >
          <span className="text-lg">x</span>
        </button>

        <div className="flex flex-col items-center">
          <h3 className="text-white text-lg font-semibold mb-6">Delete note?</h3>
          <button
            onClick={onDelete}
            className="w-full bg-[#f87171] hover:bg-[#ef4444] text-white py-2.5 rounded-full font-bold shadow-lg transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  const renderPasscodePrompt = () => showPasscode && (
    <div onClick={stop} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <form onSubmit={handleUnlock} className="bg-[#2b2d36] w-[300px] p-6 rounded-2xl border border-[#5d3fd3]/30 shadow-2xl relative animate-in fade-in zoom-in duration-150">
        <button
          type="button"
          onClick={() => {
            setShowPasscode(false);
            setTypedPasscode('');
            setPasscodeError('');
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close passcode prompt"
        >
          <span className="text-lg">x</span>
        </button>

        <div className="flex flex-col items-center">
          <h3 className="text-white text-lg font-semibold mb-5">Unlock note</h3>
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            value={typedPasscode}
            onChange={(e) => {
              setTypedPasscode(e.target.value.replace(/\D/g, '').slice(0, 4));
              setPasscodeError('');
            }}
            placeholder="4-digit passcode"
            className="mb-3 w-full rounded-full px-4 py-2.5 text-center text-indigo-900 outline-none focus:ring-2 focus:ring-[#a890ff]"
          />
          <a
            href="#"
            onClick={handleForgotPasscode}
            className="mb-3 text-sm font-semibold text-[#a890ff] underline transition-colors hover:text-white"
          >
            Forgot passcode?
          </a>
          {passcodeError && <p className="mb-3 text-sm font-semibold text-red-300">{passcodeError}</p>}
          <button
            type="submit"
            className="w-full bg-[#5d3fd3] hover:bg-[#4a32a8] text-white py-2.5 rounded-full font-bold shadow-lg transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  );

  const renderLockSetupPrompt = () => showLockSetup && (
    <div onClick={stop} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <form onSubmit={handleCreateLock} className="bg-[#2b2d36] w-[320px] p-6 rounded-2xl border border-[#5d3fd3]/30 shadow-2xl relative animate-in fade-in zoom-in duration-150">
        <button
          type="button"
          onClick={resetLockSetup}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close lock setup"
        >
          <span className="text-lg">x</span>
        </button>

        <div className="flex flex-col items-center">
          <h3 className="text-white text-lg font-semibold mb-5">Create note passcode</h3>
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            value={newPasscode}
            onChange={(e) => {
              setNewPasscode(e.target.value.replace(/\D/g, '').slice(0, 4));
              setLockSetupError('');
            }}
            placeholder="4-digit passcode"
            className="mb-3 w-full rounded-full px-4 py-2.5 text-center text-indigo-900 outline-none focus:ring-2 focus:ring-[#a890ff]"
          />
          <input
            type="password"
            inputMode="numeric"
            value={confirmPasscode}
            onChange={(e) => {
              setConfirmPasscode(e.target.value.replace(/\D/g, '').slice(0, 4));
              setLockSetupError('');
            }}
            placeholder="Confirm passcode"
            className="mb-3 w-full rounded-full px-4 py-2.5 text-center text-indigo-900 outline-none focus:ring-2 focus:ring-[#a890ff]"
          />
          {lockSetupError && <p className="mb-3 text-center text-sm font-semibold text-red-300">{lockSetupError}</p>}
          <button
            type="submit"
            className="w-full bg-[#5d3fd3] hover:bg-[#4a32a8] text-white py-2.5 rounded-full font-bold shadow-lg transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  );

  const renderSharePrompt = () => showShare && (
    <div onClick={stop} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <form onSubmit={handleShare} className="bg-[#2b2d36] w-[320px] p-6 rounded-2xl border border-[#5d3fd3]/30 shadow-2xl relative animate-in fade-in zoom-in duration-150">
        <button
          type="button"
          onClick={() => {
            setShowShare(false);
            setShareEmail('');
            setShareError('');
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close share prompt"
        >
          <span className="text-lg">x</span>
        </button>

        <div className="flex flex-col items-center">
          <h3 className="text-white text-lg font-semibold mb-5">Share note</h3>
          <input
            autoFocus
            type="email"
            value={shareEmail}
            onChange={(e) => {
              setShareEmail(e.target.value);
              setShareError('');
            }}
            placeholder="Email address..."
            className="mb-3 w-full rounded-full px-4 py-2.5 text-center text-indigo-900 outline-none focus:ring-2 focus:ring-[#a890ff]"
          />
          {shareError && <p className="mb-3 text-center text-sm font-semibold text-red-300">{shareError}</p>}
          <button
            type="submit"
            className="w-full bg-[#5d3fd3] hover:bg-[#4a32a8] text-white py-2.5 rounded-full font-bold shadow-lg transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <div
        onClick={openNote}
        className={`relative flex min-h-[300px] min-w-[280px] w-full cursor-pointer flex-col rounded-lg border border-3 p-6 transition-all duration-300 hover:border-[#f5a9c8] dark:hover:border-[#f5a9c8] ${noteShellClasses}`}
      >
        {renderIndicators()}

        {isContentHidden ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
            <Lock className="mb-3 h-10 w-10" />
            <p className="text-sm font-semibold">This note is locked</p>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${hasStatusIndicators ? 'pr-14' : ''}`}>{title || 'Untitled note'}</h3>
              <p
                style={{
                  fontSize: `${fontSize}px`,
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                }}
                className="mt-4 overflow-hidden whitespace-pre-wrap leading-relaxed"
              >
                {content || 'No content yet.'}
              </p>
            </div>

            {image && (
              <div className="mt-4 w-full overflow-hidden rounded-xl border border-black/5 dark:border-white/10">
                <img src={image} alt="Attachment" className="w-full aspect-video object-cover" />
              </div>
            )}
          </>
        )}

        <footer className="mt-auto pt-4">
          {renderLabels(false)}
        </footer>
      </div>

      {isEditing && (
        <div
          onMouseDown={closeEditor}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-6 backdrop-blur-[2px]"
        >
          <article
            onClick={stop}
            onMouseDown={stop}
            className={`relative flex max-h-[88vh] min-h-[520px] w-full max-w-2xl flex-col overflow-y-auto rounded-xl border p-7 shadow-2xl custom-scrollbar ${noteShellClasses}`}
          >
            {renderIndicators(true)}
            <button
              type="button"
              onClick={closeEditor}
              className="absolute right-5 top-5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-black/10 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close note editor"
            >
              <X className="h-5 w-5" />
            </button>

            <input
              value={title}
              onChange={(e) => onUpdateNote(id, { title: e.target.value })}
              className={`mr-10 bg-transparent text-2xl font-bold focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 ${currentStyles.text}`}
              placeholder="Title..."
            />

            <textarea
              value={content}
              onChange={(e) => onUpdateNote(id, { content: e.target.value })}
              placeholder="Take a note..."
              style={{ fontSize: `${fontSize}px` }}
              className={`mt-5 max-h-[280px] min-h-[220px] flex-1 resize-none overflow-y-auto bg-transparent leading-relaxed focus:outline-none custom-scrollbar placeholder-gray-300 dark:placeholder-gray-600 ${currentStyles.text}`}
            />

            {image && (
              <div className="mt-4 relative w-full overflow-hidden rounded-xl border border-black/5 dark:border-white/10">
                <img src={image} alt="Attachment" className="w-full aspect-video object-cover transition-all duration-500" />
                <button
                  onClick={() => onUpdateNote(id, { image: null, imageKey: '' })}
                  className="absolute top-2 right-2 bg-black/50 text-white px-2 py-0.5 rounded-full hover:bg-black/70"
                  aria-label="Remove image"
                >
                  x
                </button>
              </div>
            )}

            {!isCreatingNote && (
              <footer className="mt-auto pt-5">
                {renderLabels(true)}

                <div
                  className="mt-4 grid items-center gap-2"
                  style={{ gridTemplateColumns: `repeat(${image ? 4 : 5}, minmax(0, 1fr))` }}
                >
                  {!image && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="grid h-10 w-full place-items-center rounded-lg bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                      title="Add image"
                    >
                      <ImagePlus className="h-5 w-5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onUpdateNote(id, { pinned: !pinned })}
                    className={`grid h-10 w-full place-items-center rounded-lg transition-colors ${pinned ? 'bg-[#5d3fd3] text-white' : 'bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20'}`}
                    title="Pin note"
                  >
                    <Pin className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowShare(true)}
                    className="grid h-10 w-full place-items-center rounded-lg bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                    title="Share note"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleLock}
                    className={`grid h-10 w-full place-items-center rounded-lg transition-colors ${locked ? 'bg-[#5d3fd3] text-white' : 'bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20'}`}
                    title={locked ? 'Unlock note' : 'Lock note'}
                  >
                    {locked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="grid h-10 w-full place-items-center rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove note"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </footer>
            )}
          </article>
        </div>
      )}

      {renderDeleteConfirm()}
      {renderPasscodePrompt()}
      {renderLockSetupPrompt()}
      {renderSharePrompt()}
    </>
  );
};

export default NoteForm;
