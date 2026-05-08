import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cleanDisplayName, clearCurrentUser, updateCurrentUser } from '../utils/storage';

export const ProfileMenu = ({ user, onUserUpdate }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [name, setName] = useState(user?.displayName || '');

  const saveName = (value) => {
    const cleanedName = cleanDisplayName(value);
    setName(cleanedName);
    const updatedUser = updateCurrentUser({ displayName: cleanedName.trim() || user?.displayName || 'Noternal user' });
    onUserUpdate?.(updatedUser);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const updatedUser = updateCurrentUser({ avatar: reader.result });
      onUserUpdate?.(updatedUser);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    clearCurrentUser();
    navigate('/login');
  };

  return (
    <div className="absolute right-6 top-16 w-64 border-2 rounded-xl p-5 shadow-xl z-50 flex flex-col items-center text-center transition-colors duration-300 bg-white dark:bg-[#2b2d36] border-[#d9cbff] dark:border-[#5d3fd3]">
      
      {/* User Info */}
      <div className="text-[15px] leading-relaxed mb-1 text-gray-800 dark:text-gray-200">
        <div className="font-semibold">Display name:</div>
        <input
          value={name}
          onChange={(e) => saveName(e.target.value)}
          className="mb-1 w-full rounded-lg bg-[#f6f2ff] dark:bg-[#1f2128] px-3 py-1 text-center outline-none focus:ring-2 focus:ring-[#5d3fd3]"
          placeholder="Insert name"
        />
        <div className="font-semibold">Email:</div>
        <div className="break-all">{user?.email || 'No email'}</div>
      </div>

      {/* Large Avatar */}
      <img 
        src={user?.avatar || 'https://randomuser.me/api/portraits/women/44.jpg'} 
        alt="User Profile" 
        className="w-28 h-28 rounded-full object-cover mb-2 border-4 border-gray-100 dark:border-[#1f2128]"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />
      <button onClick={() => fileInputRef.current?.click()} className="text-sm mb-3 hover:underline transition-colors text-[#3a2a7a] dark:text-[#a890ff]">
        Change profile<br/>picture
      </button>

      {/* Bottom Actions */}
      <div className="w-full flex justify-between items-end">
        <Link to="/password-restart" state={{ from: '/home', mode: 'profile' }}>
          <button className="text-sm text-left hover:underline transition-colors text-[#3a2a7a] dark:text-[#a890ff]">
            Change<br/>password
          </button>
        </Link>

        <button onClick={handleLogout} className="px-4 py-2 rounded-lg font-medium transition-colors bg-[#cbb5ff] dark:bg-[#5d3fd3] text-[#3a2a7a] dark:text-white hover:bg-[#b89cff] dark:hover:bg-[#4a32a8]">
          Logout
        </button>
      </div>

    </div>
  );
};
