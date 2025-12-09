
import React from 'react';
import { LayoutDashboard, Tag, Package, Settings, CreditCard, ChevronsLeft, ChevronsRight, UploadCloud, ShoppingCart, QrCode, Users, HelpCircle, ClipboardCheck, ListTodo, BarChart3 } from 'lucide-react';
import { Page, GeneralSettings, User } from '../types';
import { useLocation } from 'react-router-dom';

type NavItemProps = {
  icon: React.ReactNode;
  text: string;
  page: Page;
  active?: boolean;
  isCollapsed: boolean;
};

const NavItem: React.FC<NavItemProps> = ({ icon, text, page, active = false, isCollapsed }) => {
  // CORREÇÃO: Usando <a> nativo em vez de Link do react-router para evitar conflitos de re-renderização e travamentos
  return (
    <li>
      <a
        href={`#/app/${page}`}
        title={isCollapsed ? text : ''}
        className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
          active
            ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        {icon}
        <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{text}</span>
      </a>
    </li>
  );
};


interface SidebarProps {
    currentPage?: Page;
    isCollapsed: boolean;
    setIsCollapsed: (isCollapsed: boolean) => void;
    generalSettings: GeneralSettings;
    isMobileOpen: boolean;
    onMobileClose: () => void;
    currentUser: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, generalSettings, isMobileOpen, onMobileClose, currentUser }) => {
  const location = useLocation();
  
  // Extrai a página atual da URL /app/pagina
  const currentPath = location.pathname.split('/')[2] || 'dashboard';

  // CORREÇÃO: Verifica roles com segurança (evita erro se currentUser for null)
  const isAdmin = currentUser && (currentUser.role === 'DONO_SAAS' || currentUser.role === 'CLIENTE_GERENTE');
  const isOwner = currentUser && currentUser.role === 'DONO_SAAS';

  const mainNavItems: { icon: React.ReactNode; text: string; page: Page }[] = [
    { icon: <LayoutDashboard size={20} />, text: "Dashboard", page: "dashboard" },
    { icon: <UploadCloud size={20} />, text: "Importação", page: "importer" },
    { icon: <Tag size={20} />, text: "Etiquetas", page: "etiquetas" },
    { icon: <ShoppingCart size={20} />, text: "Pedidos", page: "pedidos" },
    { icon: <QrCode size={20} />, text: "Bipagem", page: "bipagem" },
    { icon: <Package size={20} />, text: "Produtos", page: "produtos" },
    { icon: <Users size={20} />, text: "Clientes", page: "clientes" },
    { icon: <ListTodo size={20} />, text: "Compras", page: "compras" },
  ];
  
  // Itens apenas para Admins/Gerentes
  const adminOnlyMainItems: { icon: React.ReactNode; text: string; page: Page }[] = [
      { icon: <Users size={20} />, text: "Equipe", page: "equipe" },
  ];
  
  const secondaryNavItems: { icon: React.ReactNode; text: string; page: Page }[] = [
      { icon: <HelpCircle size={20} />, text: "Ajuda", page: "ajuda" },
  ];

  // Itens de configuração apenas para Admins
  const adminConfigItems: { icon: React.ReactNode; text: string; page: Page }[] = [
      { icon: <CreditCard size={20} />, text: "Assinatura", page: "assinatura" },
      { icon: <Settings size={20} />, text: "Configurações", page: "configuracoes" },
  ];

  const adminNavItems: { icon: React.ReactNode; text: string; page: Page }[] = [
    { icon: <BarChart3 size={20} />, text: "Métricas", page: "admin-metrics" },
  ];

  const SidebarContent = ({ forMobile = false }: { forMobile?: boolean }) => (
    <>
      <div className={`flex items-center justify-center px-4 py-5 border-b border-[var(--color-border)] h-[69px]`}>
        <Tag className="h-8 w-8 text-[var(--color-primary)] flex-shrink-0" />
        <span className={`ml-2 text-xl font-bold text-[var(--color-text-primary)] transition-opacity duration-200 ${(forMobile ? false : isCollapsed) ? 'opacity-0' : 'opacity-100'}`}>TagsFlow</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
            {mainNavItems
                .filter(item => item.page !== 'bipagem' || generalSettings.bipagem.enableBipagem)
                .map(item => (
                <NavItem 
                    key={item.page}
                    icon={item.icon}
                    text={item.text}
                    page={item.page}
                    active={currentPath === item.page}
                    isCollapsed={(forMobile ? false : isCollapsed)}
                />
            ))}
            {isAdmin && adminOnlyMainItems.map(item => (
                <NavItem 
                    key={item.page}
                    icon={item.icon}
                    text={item.text}
                    page={item.page}
                    active={currentPath === item.page}
                    isCollapsed={(forMobile ? false : isCollapsed)}
                />
            ))}
        </ul>

        {isOwner && (
            <div className="pt-4 mt-4 border-t border-[var(--color-border)]">
                <h3 className={`px-4 mb-2 text-xs font-semibold uppercase text-[var(--color-text-secondary)] tracking-wider ${(isCollapsed && !forMobile) ? 'text-center' : ''}`}>
                    {isCollapsed && !forMobile ? 'ADM' : 'Admin'}
                </h3>
                <ul className="space-y-1">
                    {adminNavItems.map(item => (
                        <NavItem 
                            key={item.page}
                            icon={item.icon}
                            text={item.text}
                            page={item.page}
                            active={currentPath === item.page}
                            isCollapsed={(forMobile ? false : isCollapsed)}
                        />
                    ))}
                </ul>
            </div>
        )}

      </nav>

      <div className={`p-4 border-t border-[var(--color-border)] ${forMobile ? '' : 'relative'}`}>
         <ul className="space-y-1">
             {secondaryNavItems.map(item => (
                <NavItem 
                    key={item.page}
                    icon={item.icon}
                    text={item.text}
                    page={item.page}
                    active={currentPath === item.page}
                    isCollapsed={(forMobile ? false : isCollapsed)}
                />
             ))}
             {isAdmin && adminConfigItems.map(item => (
                <NavItem 
                    key={item.page}
                    icon={item.icon}
                    text={item.text}
                    page={item.page}
                    active={currentPath === item.page}
                    isCollapsed={(forMobile ? false : isCollapsed)}
                />
             ))}
        </ul>
        
        {!forMobile && (
            <div className="absolute bottom-4 right-[-12px]">
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] rounded-full border-4 border-[var(--color-bg)] hover:bg-[var(--color-primary)] hover:text-white">
                    {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                </button>
            </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col h-screen bg-[var(--color-surface)] fixed transition-all duration-300 border-r border-[var(--color-border)] ${isCollapsed ? 'w-20' : 'w-64'} z-30`}>
        <SidebarContent />
      </aside>
      
      {/* Mobile Sidebar (Drawer) */}
      <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" onClick={onMobileClose}></div>
        
        {/* Menu */}
        <aside className={`relative flex flex-col h-full w-64 bg-[var(--color-surface)] transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent forMobile={true} />
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
