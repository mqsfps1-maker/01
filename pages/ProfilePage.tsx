
import React, { useState, useRef } from 'react';
import { User, UiSettings } from '../types';
import { User as UserIcon, Lock, Save, ArrowLeft, Camera, X, Palette, Sun, Moon, Laptop, Type as FontIcon, Crown, CheckCircle } from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  subscription?: any; // Add subscription prop
}

const defaultUiSettings: UiSettings = {
    baseTheme: 'system',
    fontFamily: 'Inter',
    accentColor: 'indigo',
    customAccentColor: '#4f46e5',
    fontSize: 16,
    soundOnSuccess: true,
    soundOnDuplicate: true,
    soundOnError: true,
};

const BaseThemeOption: React.FC<{
    value: 'light' | 'dark' | 'system';
    label: string;
    icon: React.ReactNode;
    currentValue: string;
    onClick: (value: any) => void;
}> = ({ value, label, icon, currentValue, onClick }) => (
     <button
        onClick={() => onClick(value)}
        className={`flex-1 p-3 rounded-md text-sm font-medium border-2 transition-all flex flex-col items-center justify-center gap-2 ${
            currentValue === value ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-surface-tertiary)]'
        }`}
    >
        {icon}
        {label}
    </button>
);


const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser, subscription }) => {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar);
  const [uiSettings, setUiSettings] = useState<UiSettings>(user.ui_settings || defaultUiSettings);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX = 512;
      try {
        if ('createImageBitmap' in window) {
          const bitmap = await createImageBitmap(file);
          let { width, height } = bitmap;
          let scale = 1;
          if (width > MAX || height > MAX) {
            scale = Math.min(MAX / width, MAX / height);
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setAvatar(dataUrl);
          }
        } else {
          const img = new Image();
          const reader = new FileReader();
          reader.onload = (ev) => {
            img.onload = () => {
              const MAX_LOCAL = 512;
              let { width, height } = img;
              if (width > MAX_LOCAL || height > MAX_LOCAL) {
                const ratio = Math.min(MAX_LOCAL / width, MAX_LOCAL / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                setAvatar(dataUrl);
              } else {
                setAvatar(ev.target?.result as string);
              }
            };
            img.src = ev.target?.result as string;
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        // fallback: read as dataURL directly
        const reader = new FileReader();
        reader.onloadend = (ev) => setAvatar(ev.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSave = () => {
    setError('');
    if (password && password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const updatedUser = { ...user };
    updatedUser.name = name;
    updatedUser.avatar = avatar;
    updatedUser.ui_settings = uiSettings;

    if (password) {
      updatedUser.password = password;
    } else {
      delete updatedUser.password; // Garante que a senha não seja alterada se os campos estiverem vazios
    }

    onUpdateUser(updatedUser);
  };

  const fontOptions = ['Inter', 'Lato', 'Montserrat', 'Poppins', 'Roboto Slab'];

  const planName = subscription?.plan?.name || 'Plano Grátis (Teste)';
  const planStatus = subscription?.status === 'active' ? 'Ativo' : 'Período de Teste';

  React.useEffect(() => {
    const onVisibility = () => {
      // Debug: log tab visibility changes to help diagnose freezing
      // eslint-disable-next-line no-console
      console.debug('[ProfilePage] visibilitychange:', document.visibilityState);
      // Re-enable input if necessary
      if (document.visibilityState === 'visible' && fileInputRef.current) {
        try { fileInputRef.current.disabled = false; } catch (e) { /* ignore */ }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <a href="#dashboard" className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6">
        <ArrowLeft size={16} /> Voltar para o Dashboard
      </a>

      <div className="bg-[var(--color-surface)] p-6 sm:p-8 rounded-xl border border-[var(--color-border)] shadow-sm">
        <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Meu Perfil</h1>
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                <Crown size={16} className="text-blue-600" />
                <div>
                    <p className="text-xs font-bold text-blue-800">{planName}</p>
                    <p className="text-[10px] text-blue-600 uppercase tracking-wide">{planStatus}</p>
                </div>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover bg-gray-700 border-4 border-[var(--color-primary)]" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center border-4 border-[var(--color-border)]">
                <UserIcon size={48} className="text-[var(--color-text-secondary)]" />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => { if (fileInputRef.current) fileInputRef.current.value = ''; fileInputRef.current?.click(); }}
              className="absolute -bottom-1 -right-1 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 border-2 border-[var(--color-surface)]"
              title="Mudar foto"
            >
              <Camera size={16} />
            </button>
             {avatar && (
              <button
                onClick={() => setAvatar(undefined)}
                className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 border-2 border-[var(--color-surface)]"
                title="Remover foto"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex-grow w-full">
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)]">Nome</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2 text-[var(--color-text-primary)]"
            />
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mt-4">Email (não pode ser alterado)</label>
            <input
              id="email"
              type="email"
              value={user.email}
              disabled
              readOnly
              className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-tertiary)] shadow-sm sm:text-sm p-2 text-[var(--color-text-secondary)] cursor-not-allowed opacity-70"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
                <label htmlFor="cpfCnpj" className="block text-sm font-medium text-[var(--color-text-secondary)] flex justify-between">
                    CPF/CNPJ
                    <span className="text-xs text-gray-400 font-normal">(Somente leitura)</span>
                </label>
                <input
                  id="cpfCnpj"
                  type="text"
                  value={user.cpfCnpj || ''}
                  disabled
                  readOnly
                  className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2 text-[var(--color-text-primary)] cursor-pointer"
                />
            </div>
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-text-secondary)] flex justify-between">
                    Telefone
                    <span className="text-xs text-gray-400 font-normal">(Somente leitura)</span>
                </label>
                <input
                  id="phone"
                  type="text"
                  value={user.phone || ''}
                  disabled
                  readOnly
                  className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-tertiary)] shadow-sm sm:text-sm p-2 text-[var(--color-text-secondary)] cursor-not-allowed opacity-70"
                />
            </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2"><Lock size={18}/> Alterar Senha</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-4">Deixe em branco para manter a senha atual.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)]">Nova Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2 text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text-secondary)]">Confirmar Nova Senha</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2 text-[var(--color-text-primary)]"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2"><Palette size={18}/> Aparência do Tema</h2>
            <div className="flex gap-2 mt-4">
                <BaseThemeOption value="light" label="Claro" icon={<Sun/>} currentValue={uiSettings.baseTheme} onClick={(v) => setUiSettings(s => ({...s, baseTheme: v}))} />
                <BaseThemeOption value="dark" label="Escuro" icon={<Moon/>} currentValue={uiSettings.baseTheme} onClick={(v) => setUiSettings(s => ({...s, baseTheme: v}))} />
                <BaseThemeOption value="system" label="Sistema" icon={<Laptop/>} currentValue={uiSettings.baseTheme} onClick={(v) => setUiSettings(s => ({...s, baseTheme: v}))} />
            </div>
            <div className="mt-4">
                <label htmlFor="font-family" className="block text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2 mb-2"><FontIcon size={16}/> Fonte da Aplicação</label>
                <select
                    id="font-family"
                    value={uiSettings.fontFamily}
                    onChange={(e) => setUiSettings(s => ({...s, fontFamily: e.target.value}))}
                    className="mt-1 block w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface-secondary)] shadow-sm sm:text-sm p-2 text-[var(--color-text-primary)]"
                >
                    {fontOptions.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                    ))}
                </select>
            </div>
        </div>


        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold rounded-lg hover:bg-[var(--color-primary-hover)]"
          >
            <Save size={16} /> Salvar Alterações
          </button>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] mb-3">Informações de Assinatura (DEBUG)</h3>
          <div className="text-xs space-y-2 font-mono text-[var(--color-text-secondary)]">
            <p><strong>Plano:</strong> {planName}</p>
            <p><strong>Status:</strong> {subscription?.status || 'N/A'}</p>
            <p><strong>Limite Etiquetas:</strong> {subscription?.plan?.label_limit || 200}</p>
            <p><strong>Etiquetas Usadas:</strong> {subscription?.monthly_label_count || 0}</p>
            <p><strong>Bônus:</strong> {subscription?.bonus_balance || 0}</p>
            <p><strong>Período End:</strong> {subscription?.period_end ? new Date(subscription.period_end).toLocaleString('pt-BR') : 'N/A'}</p>
            <p><strong>Dias Restantes:</strong> {subscription?.period_end ? Math.ceil((new Date(subscription.period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 'N/A'}</p>
            <p><strong>Agora:</strong> {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
