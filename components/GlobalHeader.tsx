
// components/GlobalHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import { LogOut, User as UserIcon, Settings, QrCode, Power } from 'lucide-react';
import { User, LabelProcessingStatus, GeneralSettings } from '../types';
import LabelProcessingIndicator from './LabelProcessingIndicator';


interface GlobalHeaderProps {
  user: User | null;
  onLogout: () => void;
  onNavigateToProfile: () => void;
  isAutoBipagemActive: boolean;
  onToggleAutoBipagem: () => void;
  labelProcessingStatus: LabelProcessingStatus;
  setLabelProcessingStatus: React.Dispatch<React.SetStateAction<LabelProcessingStatus>>;
  generalSettings: GeneralSettings;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ user, onLogout, onNavigateToProfile, isAutoBipagemActive, onToggleAutoBipagem, labelProcessingStatus, setLabelProcessingStatus, generalSettings }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="hidden md:flex flex-shrink-0 bg-[var(--color-surface)]">
      <div className="w-full flex items-center justify-between p-4 h-[69px] border-b border-[var(--color-border)] text-[var(--color-text-primary)]">
        <div className="flex items-center gap-4">
           {generalSettings.bipagem.enableBipagem && (
            <button 
                  onClick={onToggleAutoBipagem}
                  title="Ativar/Desativar Auto Bipagem Global"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all border ${
                      isAutoBipagemActive 
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)]'
                  }`}
              >
                  <Power size={14} className={isAutoBipagemActive ? 'animate-pulse' : ''} />
                  <span className="hidden sm:inline">Auto Bipar</span>
              </button>
           )}
        </div>
        
        <div className="flex items-center gap-4">
          <LabelProcessingIndicator
            status={labelProcessingStatus}
            onReset={() => setLabelProcessingStatus({ isActive: false, progress: 0, current: 0, total: 0, message: '', isFinished: false })}
          />
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 p-1 rounded-lg hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              <span className="hidden sm:inline font-semibold text-sm">{user?.name}</span>
              {user?.avatar ? (
                <img src={user.avatar} alt="User avatar" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center font-bold text-[var(--color-text-primary)]">
                  {user ? getInitials(user.name) : ''}
                </div>
              )}
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] rounded-md shadow-lg py-1 z-50 border border-[var(--color-border)]">
                <button
                  onClick={() => {
                    onNavigateToProfile();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  <UserIcon size={16} /> Meu Perfil
                </button>
                <div className="border-t border-[var(--color-border)] my-1"></div>
                <button
                  onClick={onLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                >
                  <LogOut size={16} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
