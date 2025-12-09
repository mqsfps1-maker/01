
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Menu,
  ArrowRight,
  ShieldCheck,
  Palette,
  UploadCloud,
  Zap,
  Check,
  Tags,
  XCircle,
  Package,
  Link as LinkIcon,
  ClipboardList,
  Scan,
  Users,
  Star,
  ChevronDown,
  X,
  LogIn,
  BarChart2,
  PieChart as PieChartIcon,
  Clock,
  Info,
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

// --- Componentes Reutilizáveis ---

const Reveal: React.FC<{ children: React.ReactNode, delay?: number, className?: string, immediate?: boolean }> = ({ children, delay = 0, className = '', immediate = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(immediate);

  useEffect(() => {
    if (immediate) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [immediate, delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
};

const Section: React.FC<{ id?: string, children: React.ReactNode, className?: string }> = ({ id, children, className = '' }) => (
  <section id={id} className={`w-full py-24 md:py-32 ${className}`}>
    <div className="container mx-auto px-4 md:px-6">
      {children}
    </div>
  </section>
);

const SectionHeader: React.FC<{ badge: string, title: React.ReactNode, description: string }> = ({ badge, title, description }) => (
    <Reveal className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
        <div className="inline-block rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">{badge}</div>
        <h2 className="text-4xl font-bold tracking-tighter sm:text-6xl text-[var(--color-text-primary)]">{title}</h2>
        <p className="max-w-[900px] text-[var(--color-text-secondary)] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
        {description}
        </p>
    </Reveal>
);

const FaqItem: React.FC<{ question: string, children: React.ReactNode }> = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-[var(--color-border)]">
            <button
                className="flex w-full items-center justify-between py-6 text-left font-medium"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-lg text-[var(--color-text-primary)]">{question}</span>
                <ChevronDown className={`h-6 w-6 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && <div className="pb-6 pr-4 text-base text-[var(--color-text-secondary)] prose max-w-none">{children}</div>}
        </div>
    )
}

const PrivacyTermsModal: React.FC<{ title: string, content: React.ReactNode, onClose: () => void }> = ({ title, content, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="prose prose-sm max-w-none text-gray-600 flex-grow overflow-y-auto pr-4">
                    {content}
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Componentes de Seção da Landing Page ---

function LandingNavbar({ onLogin, onRegister }: LandingPageProps) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { href: '#calculator', label: 'Calculadora' },
    { href: '#benefits', label: 'Benefícios' },
    { href: '#case-studies', label: 'Casos' },
    { href: '#how-it-works', label: 'Como Funciona' },
    { href: '#plans', label: 'Planos' },
    { href: '#faq', label: 'Dúvidas' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full h-20 md:h-auto">
        {/* Desktop Navbar */}
        <div className="hidden md:block h-full">
            {/* Initial State (Full Width, Glass) */}
            <div
              className={`
                fixed top-0 left-0 right-0 h-20
                transition-all duration-300 ease-in-out
                backdrop-blur-sm bg-slate-900/80 border-b border-slate-700/50
                ${isScrolled 
                  ? 'opacity-0 -translate-y-full pointer-events-none' 
                  : 'opacity-100 translate-y-0'
                }
              `}
            >
              <div className="container mx-auto h-full flex items-center justify-between px-4 md:px-6">
                {/* Left: Logo */}
                <a href="#" className="flex flex-shrink-0 items-center space-x-2">
                  <Tags className="h-7 w-7 text-blue-500" />
                  <span className="font-bold text-lg text-white">TagsFlow</span>
                </a>

                {/* Center: Nav Links */}
                <nav className="flex items-center gap-6 text-base">
                  {navLinks.map((link) => (
                    <a key={link.href} href={link.href} className="transition-colors text-slate-300 hover:text-white font-medium">
                      {link.label}
                    </a>
                  ))}
                </nav>

                {/* Right: Button */}
                <div className="flex flex-shrink-0 items-center">
                  <button onClick={onLogin} className="px-5 py-2 text-base font-medium rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 shadow-sm">
                    Entrar
                  </button>
                </div>
              </div>
            </div>
            
            {/* Scrolled State (Compact Widget) */}
            <div
              className={`
                fixed top-4 left-1/2 -translate-x-1/2
                flex items-center gap-4
                h-16 max-w-fit rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 backdrop-blur-sm shadow-lg
                transition-all duration-300 ease-in-out
                ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}
              `}
            >
              <a href="#" className="flex flex-shrink-0 items-center space-x-2">
                <Tags className="h-7 w-7 text-blue-500" />
              </a>
              <nav className="hidden md:flex items-center gap-4 text-sm">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="transition-colors text-slate-300 hover:text-white font-medium">
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex flex-shrink-0 items-center gap-2">
                <a
                  href="#plans"
                  onClick={(e) => { e.preventDefault(); onRegister(); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full text-white transition-all shadow-sm bg-blue-600 hover:bg-blue-700"
                >
                  <Zap size={16}/>
                  Testar Agora
                </a>
              </div>
            </div>
        </div>
          
        {/* Mobile Header */}
        <div className={`md:hidden flex items-center h-16 fixed top-0 left-0 right-0 bg-slate-900/80 px-4 shadow-lg backdrop-blur-sm z-50`}>
          {/* Left: Hamburger Menu */}
          <button onClick={() => setSheetOpen(true)} className="p-2 -ml-2 text-white z-10">
            <Menu className="h-6 w-6" />
          </button>
          {/* Center: Logo + Name */}
          <a href="#" className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-2">
            <Tags className="h-7 w-7 text-blue-500" />
            <span className="font-bold text-lg text-white">TagsFlow</span>
          </a>
        </div>
      </header>
      
      {/* Mobile Menu Sheet */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSheetOpen(false)}></div>
          <div className={`relative flex flex-col h-full w-72 max-w-[80vw] bg-[var(--color-surface)] shadow-xl transition-transform duration-300 ease-in-out ${isSheetOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                  <a href="#" className="flex items-center space-x-2">
                      <Tags className="h-7 w-7 text-blue-600" />
                      <span className="font-bold text-lg text-[var(--color-text-primary)]">TagsFlow</span>
                  </a>
                  <button onClick={() => setSheetOpen(false)} className="p-2 -mr-2"><X className="h-6 w-6 text-[var(--color-text-secondary)]"/></button>
              </div>
              <nav className="flex-1 p-6">
                  <div className="flex flex-col space-y-6">
                      {navLinks.map((link) => (
                          <a key={link.href} href={link.href} onClick={() => setSheetOpen(false)} className="text-[var(--color-text-primary)] font-medium text-lg transition-colors hover:text-blue-600">{link.label}</a>
                      ))}
                  </div>
              </nav>
              <div className="p-6 border-t border-[var(--color-border)] space-y-3">
                   <button onClick={() => { onLogin(); setSheetOpen(false); }} className="w-full px-4 py-3 text-sm font-semibold rounded-md bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">Entrar</button>
                   <button onClick={() => { onRegister(); setSheetOpen(false); }} className="w-full px-4 py-3 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">Testar Agora</button>
              </div>
          </div>
        </div>
      )}
    </>
  );
}


function Hero({ onRegister }: { onRegister: () => void }) {
  const [showVideo, setShowVideo] = useState(false);

  const handleShowDemo = () => {
    setShowVideo(true);
  }

  return (
    <Section className="!pt-20 md:!pt-24 !pb-32 bg-gray-900 text-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-center">
          <Reveal className="space-y-8 text-center lg:text-left" immediate delay={500}>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Dê fim à bagunça nas etiquetas — <span className="text-blue-500">gere, personalize e controle tudo com precisão.</span>
            </h1>
            <p className="max-w-3xl mx-auto lg:mx-0 text-lg text-slate-300 md:text-xl">
              Economize tempo, papel e retrabalho com um sistema inteligente que organiza seus pedidos, controla estoque e gera etiquetas perfeitas sem precisar de integração via API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={onRegister} className="px-8 py-4 text-lg font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1">
                  Testar Agora <ArrowRight className="h-5 w-5" />
              </button>
              <button onClick={handleShowDemo} className="px-8 py-4 text-lg font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors text-center">
                Ver Demonstração
              </button>
            </div>
          </Reveal>
          <Reveal immediate delay={700}>
              <div className="relative rounded-xl shadow-2xl overflow-hidden [transform:perspective(2000px)_rotateY(-15deg)_rotateX(5deg)] border-4 border-slate-700 hover:[transform:perspective(2000px)_rotateY(-12deg)_rotateX(4deg)] transition-transform duration-500 bg-slate-900 aspect-video">
                {showVideo ? (
                   <iframe
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/Xida-N0hxsQ?autoplay=1&mute=0&loop=1&playlist=Xida-N0hxsQ&controls=1&showinfo=0&rel=0"
                      title="Demonstração TagsFlow"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                  ></iframe>
                ) : (
                  <video
                      src="https://i.imgur.com/UYyS2mi.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="object-cover w-full h-full"
                  />
                )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
              </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

function Marketplaces() {
  return (
    <Section className="!py-20 bg-[var(--color-surface-secondary)]">
      <Reveal>
        <h3 className="text-center text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mb-10">
          Feito para os maiores marketplaces do Brasil
        </h3>
        <div className="flex justify-center items-center gap-12 md:gap-20">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/1200px-Shopee.svg.png" alt="Shopee Logo" className="h-10 md:h-12 object-contain" />
          <img src="https://bring.com.br/blog/wp-content/uploads/2018/05/Mercado-Livre-logo.png" alt="Mercado Livre Logo" className="h-12 md:h-16 object-contain" />
        </div>
      </Reveal>
    </Section>
  );
}

function CaseStudies() {
    const studies = [
        {
            quote: "Reduzimos o tempo de separação em 75% e praticamente eliminamos os erros de envio. O TagsFlow pagou-se no primeiro mês.",
            author: "Carla, Loja de Acessórios",
            challenge: "Com mais de 200 pedidos por dia, nossa equipe gastava horas conferindo listas e cometia erros frequentes, gerando custos com logística reversa e clientes insatisfeitos.",
            solution: "Implementamos o TagsFlow para gerar listas de separação otimizadas e usar a bipagem para confirmar cada item. O processo se tornou à prova de falhas.",
            results: [
                { value: "-15", unit: "horas/semana", description: "em tarefas manuais" },
                { value: "95%", unit: "redução", description: "nos erros de envio" },
                { value: "20%", unit: "aumento", description: "na capacidade de expedição" },
            ]
        },
        {
            quote: "O controle de matéria-prima era nosso maior gargalo. Agora, sei exatamente o que comprar e quando comprar, sem desperdício.",
            author: "Marcos, Fábrica de Papel de Parede",
            challenge: "Perdíamos o controle do estoque de insumos (bases, pigmentos), resultando em compras de emergência com sobrepreço ou produção parada por falta de material.",
            solution: "Com a configuração de 'receitas' (BOM), cada bipagem agora dá baixa precisa na matéria-prima. O planejamento de compras se tornou automático e preciso.",
            results: [
                { value: "100%", unit: "visibilidade", description: "do consumo de insumos" },
                { value: "30%", unit: "redução", description: "nos custos com compras" },
                { value: "Zero", unit: "paradas", description: "na produção por falta de material" },
            ]
        }
    ];

    return (
        <Section id="case-studies" className="bg-slate-900 text-white">
            <SectionHeader badge="Resultados Reais" title={<>O Fim do Caos: <span className="text-blue-500">Veja a Transformação na Prática</span></>} description="Nossos clientes estão economizando tempo, dinheiro e eliminando o estresse da expedição." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {studies.map((study, index) => (
                    <Reveal key={index} delay={index * 150}>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 h-full flex flex-col">
                            <blockquote className="text-xl font-semibold italic border-l-4 border-blue-500 pl-4 mb-6">"{study.quote}"</blockquote>
                            <p className="font-bold text-slate-300 mb-6">- {study.author}</p>
                            
                            <div className="space-y-4 mb-8 text-slate-300 flex-grow">
                                <p><strong className="text-white">O Desafio:</strong> {study.challenge}</p>
                                <p><strong className="text-white">A Solução com TagsFlow:</strong> {study.solution}</p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-center border-t border-slate-700 pt-6">
                                {study.results.map(result => (
                                    <div key={result.description}>
                                        <p className="text-3xl lg:text-4xl font-bold text-blue-500">{result.value}<span className="text-lg">{result.unit}</span></p>
                                        <p className="text-xs text-slate-400">{result.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </Section>
    );
}
function HowItWorks({ onRegister }: { onRegister: () => void }) {
    const steps = [
        { icon: UploadCloud, title: 'Importe seus pedidos', description: 'Exporte a lista de vendas do ML ou Shopee e importe em nossa plataforma com um clique.' },
        { icon: LinkIcon, title: 'Vincule SKUs automaticamente', description: 'O sistema identifica novos SKUs e sugere a vinculação a produtos existentes ou a criação de novos.' },
        { icon: Palette, title: 'Gere e personalize suas etiquetas', description: 'Com tudo vinculado, gere etiquetas inteligentes, prontas para impressão, com as cores da sua marca.' },
        { icon: Scan, title: 'Bipe e confirme os pedidos', description: 'Use um leitor de código de barras para confirmar cada item antes do envio, garantindo zero erros.' },
    ];
    return(
        <Section id="how-it-works" className="bg-[var(--color-surface-secondary)]">
            <SectionHeader badge="Como Funciona" title="Organização em 4 Passos Simples" description="Veja como é fácil transformar o caos em controle e eficiência." />
             <div className="relative">
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-300 -translate-y-1/2 -z-0"></div>
                <div className="relative grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, i) => (
                        <Reveal key={i} delay={i * 150} className="relative">
                            <div className="p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm h-full text-center flex flex-col items-center">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-3xl mb-6 ring-8 ring-[var(--color-surface-secondary)]">
                                    {i + 1}
                                </div>
                                <step.icon className="w-12 h-12 text-blue-600 mb-4" />
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-base text-[var(--color-text-secondary)]">{step.description}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
            <Reveal delay={steps.length * 150}>
                <div className="mt-16 text-center">
                    <button onClick={onRegister} className="px-8 py-4 text-lg font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg">
                        Ver Demonstração na Prática
                    </button>
                </div>
            </Reveal>
        </Section>
    )
}
function Benefits() {
  const benefits = [
    { icon: UploadCloud, title: 'Importação Rápida de Listas', description: 'Importe seus pedidos do Mercado Livre e Shopee com um clique.' },
    { icon: LinkIcon, title: 'Vinculação Automática de SKUs', description: 'Associe SKUs a um produto mestre e evite confusão.' },
    { icon: Palette, title: 'Etiquetas ZPL Personalizadas', description: 'Gere etiquetas com as cores da sua marca para uma identidade visual forte.' },
    { icon: Package, title: 'Controle de Estoque Real', description: 'Dê baixa automática na matéria-prima a cada pedido bipado, incluindo kits.' },
    { icon: ClipboardList, title: 'Lista de Separação Inteligente', description: 'Saiba exatamente o que separar, agrupado por produto e cor.' },
    { icon: Scan, title: 'Bipagem de Pedidos Anti-Erro', description: 'Confirme cada item antes de fechar a caixa e garanta 100% de acerto no envio.' },
    { icon: Users, title: 'Cadastro e Bonificação de Clientes', description: 'Identifique seus clientes fiéis e crie ações de bonificação automáticas.' },
    { icon: ShieldCheck, title: 'Operação 100% Segura e Local', description: 'Sem integrações arriscadas via API. Seus dados e sua conta ficam protegidos.' },
  ];

  return (
    <Section id="benefits">
      <SectionHeader badge="A Solução Completa" title="Recupere o controle da sua expedição" description="Nosso SaaS centraliza e automatiza as tarefas mais críticas do seu e-commerce, da importação à impressão, com segurança e inteligência." />
      <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-7xl lg:grid-cols-4">
        {benefits.map((benefit, i) => (
          <Reveal key={benefit.title} delay={i * 100}>
            <div className="grid gap-4 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <benefit.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">{benefit.title}</h3>
              <p className="text-base text-[var(--color-text-secondary)]">{benefit.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
       <Reveal delay={benefits.length * 100}>
        <p className="text-center text-xl mt-20 bg-emerald-100 text-emerald-800 font-semibold p-6 rounded-lg max-w-4xl mx-auto">Economize até <span className="font-bold">50% em papel</span>, reduza retrabalho em até <span className="font-bold">70%</span> e ganhe horas preciosas por semana.</p>
      </Reveal>
    </Section>
  );
}

const ImageCompareSlider: React.FC<{ beforeImage: string; afterImage: string }> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);


  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);


  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto aspect-[16/9] select-none overflow-hidden rounded-lg shadow-2xl cursor-ew-resize"
      onMouseDown={handleMouseDown}
      onTouchStart={() => setIsDragging(true)}
    >
      <img src={beforeImage} alt="Antes" className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none" />
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 calc(100% - ${sliderPosition}%) 0 0)` }}
      >
        <img src={afterImage} alt="Depois" className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none" />
      </div>
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/80 pointer-events-none"
        style={{ left: `calc(${sliderPosition}%)` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white/80 shadow-md flex items-center justify-center backdrop-blur-sm">
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
        </div>
      </div>
    </div>
  );
};
function SavingsCalculator() {
  const [pedidosPorMes, setPedidosPorMes] = useState(1000);
  const [pctMl, setPctMl] = useState(70);
  const [custoHoraFuncionario, setCustoHoraFuncionario] = useState(15.0);
  const [tempoSeparacao, setTempoSeparacao] = useState(2);
  const [taxaErro, setTaxaErro] = useState(3);
  const [numFuncionarios, setNumFuncionarios] = useState(2);
  const [horasPorDia, setHorasPorDia] = useState(8);
  const [diasPorSemana, setDiasPorSemana] = useState(5);
  const [ticketMedio, setTicketMedio] = useState(150);
  const [tipoImpressao, setTipoImpressao] = useState<'sulfite' | 'termica_sem_nf' | 'termica_com_nf'>('sulfite');

  const [precoA4, setPrecoA4] = useState(0.08);
  const [precoFita, setPrecoFita] = useState(10.0);
  const [precoEtiquetaTermica, setPrecoEtiquetaTermica] = useState(0.02);
  const [custoReimpressao, setCustoReimpressao] = useState(1.5);
  const [valorPlanoSaaS, setValorPlanoSaaS] = useState(59.0);
  const [animatedEconomy, setAnimatedEconomy] = useState(0);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const results = useMemo(() => {
    const REDUCAO_TEMPO_SAAS_PCT = 80;
    const REDUCAO_ERRO_SAAS_PCT = 90;

    const pedidosMl = pedidosPorMes * (pctMl / 100);
    const pedidosShopee = pedidosPorMes * (1 - (pctMl / 100));
    
    let custoPapel = 0;
    if (tipoImpressao === 'sulfite') {
      // ML usa 1 folha A4, Shopee usa 2 folhas A4
      custoPapel = (pedidosMl * 1 * precoA4) + (pedidosShopee * 2 * precoA4);
    } else if (tipoImpressao === 'termica_sem_nf') {
      custoPapel = pedidosPorMes * precoEtiquetaTermica;
    } else if (tipoImpressao === 'termica_com_nf') {
      // DANFE em A4 (1 folha) + Etiqueta térmica
      custoPapel = (pedidosPorMes * precoEtiquetaTermica) + (pedidosPorMes * precoA4);
    }

    const rolosFita = (pedidosPorMes / 100) * 4;
    const custoFita = tipoImpressao.startsWith('sulfite') ? rolosFita * precoFita : 0;
    
    const custoTempoManual = (pedidosPorMes * tempoSeparacao / 60) * custoHoraFuncionario;
    const numErros = pedidosPorMes * (taxaErro / 100);
    
    // Custo de devolução dinâmico baseado no Ticket Médio
    const custoMedioDevolucao = (ticketMedio * 0.15) + 20; // 15% do valor do produto + R$20 de logística/manuseio
    const custoDevolucao = numErros * custoMedioDevolucao;
    
    const custoRetrabalho = numErros * custoReimpressao;
    const custoManualTotal = custoPapel + custoFita + custoTempoManual + custoDevolucao + custoRetrabalho;

    const custoTempoSaaS = custoTempoManual * (1 - REDUCAO_TEMPO_SAAS_PCT / 100);
    const numErrosSaaS = numErros * (1 - REDUCAO_ERRO_SAAS_PCT / 100);
    const custoDevolucaoSaaS = numErrosSaaS * custoMedioDevolucao;
    const custoRetrabalhoSaaS = numErrosSaaS * custoReimpressao;
    const custoSaasTotal = custoTempoSaaS + custoDevolucaoSaaS + custoRetrabalhoSaaS + valorPlanoSaaS;
    
    const economiaAbsoluta = custoManualTotal - custoSaasTotal;
    const economiaPercentual = custoManualTotal > 0 ? (economiaAbsoluta / custoManualTotal) * 100 : 0;

    const horasUteisMes = numFuncionarios * horasPorDia * diasPorSemana * 4.3;
    const horasGastasManual = (pedidosPorMes * tempoSeparacao) / 60;
    const horasGastasSaaS = horasGastasManual * (1 - REDUCAO_TEMPO_SAAS_PCT / 100);

    const cargaTrabalhoManual = horasUteisMes > 0 ? (horasGastasManual / horasUteisMes) * 100 : 0;
    const cargaTrabalhoSaaS = horasUteisMes > 0 ? (horasGastasSaaS / horasUteisMes) * 100 : 0;

    return {
      custoManual: { total: custoManualTotal, papel: custoPapel, fita: custoFita, tempo: custoTempoManual, erros: custoDevolucao + custoRetrabalho },
      custoSaaS: { total: custoSaasTotal },
      economia: { absoluta: economiaAbsoluta, percentual: economiaPercentual },
      tempo: { horasGastasManual, horasGastasSaaS, horasPoupadas: horasGastasManual - horasGastasSaaS },
      cargaTrabalho: { horasUteisMes, manual: cargaTrabalhoManual, saas: cargaTrabalhoSaaS }
    };
  }, [pedidosPorMes, pctMl, tipoImpressao, precoA4, precoEtiquetaTermica, precoFita, custoHoraFuncionario, tempoSeparacao, taxaErro, ticketMedio, custoReimpressao, numFuncionarios, horasPorDia, diasPorSemana, valorPlanoSaaS]);

  useEffect(() => {
    const target = results.economia.absoluta;
    const duration = 1000;
    let start: number | null = null;
    const initialValue = animatedEconomy;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const currentValue = initialValue + (target - initialValue) * easeOutCubic(progress);
      setAnimatedEconomy(currentValue);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setAnimatedEconomy(target);
      }
    };
    requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.economia.absoluta]);

  const economyMessage = useMemo(() => {
    if (results.economia.percentual > 70) return "🚀 Você está economizando mais de 70%! Seu tempo e dinheiro estão no controle.";
    if (results.economia.percentual < 30) return "⚙️ Há espaço para otimização — ajuste seus processos para aumentar a economia.";
    return "✅ Ótima economia! O TagsFlow está otimizando seus custos de forma eficiente.";
  }, [results.economia.percentual]);

  const PieChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const segments = data.map(item => ({ ...item, percentage: total > 0 ? (item.value / total) * 100 : 0 }));
    
    let cumulativePercentage = 0;
    const gradientParts = segments.map(seg => {
      const part = `${seg.color} ${cumulativePercentage}% ${cumulativePercentage + seg.percentage}%`;
      cumulativePercentage += seg.percentage;
      return part;
    });

    return (
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-32 h-32 rounded-full flex-shrink-0" style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}></div>
        <div className="text-base space-y-2 w-full">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }}></div>
                <span>{seg.label}:</span>
              </div>
              <span className="font-bold">{formatCurrency(seg.value)} ({seg.percentage.toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SliderInput: React.FC<any> = ({ label, value, onChange, min, max, step, unit, currency }) => {
    const displayValue = currency
      ? formatCurrency(value)
      : `${value.toFixed(unit === 'min' || unit === 'h' ? 1 : 0)}${unit || ''}`;
    return (
      <div>
        <div className="flex justify-between items-baseline mb-1">
            <label className="text-sm text-slate-300">{label}</label>
            <span className="font-bold text-white tabular-nums flex-shrink-0">{displayValue}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
      </div>
    );
  };
  
  const tiposImpressao: {id: typeof tipoImpressao, label: string}[] = [
    { id: 'sulfite', label: 'Sulfite A4' },
    { id: 'termica_com_nf', label: 'Térmica + DANFE A4' },
    { id: 'termica_sem_nf', label: 'Apenas Térmica' },
  ];

  return (
    <Section id="calculator">
      <SectionHeader badge="Calculadora" title="O Custo Oculto da Sua Operação" description="Descubra quanto você deixa na mesa todos os meses com processos manuais e veja a economia que o TagsFlow pode gerar."/>
      <Reveal>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 bg-slate-800 p-4 sm:p-8 rounded-2xl shadow-2xl border border-slate-700 text-white">
          {/* Inputs */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold border-b border-slate-600 pb-2 mb-4">Sua Operação</h3>
              <div className="space-y-3">
                <SliderInput label="Pedidos por Mês" value={pedidosPorMes} onChange={setPedidosPorMes} min={100} max={10000} step={100} />
                <SliderInput label="Ticket Médio da Loja" value={ticketMedio} onChange={setTicketMedio} min={10} max={1000} step={10} currency />
                <div><label className="text-sm">Distribuição de Vendas</label><input type="range" min="0" max="100" value={pctMl} onChange={e => setPctMl(Number(e.target.value))} className="w-full accent-blue-500"/><div className="flex justify-between text-xs"><span className="font-bold text-yellow-300">ML: {pctMl}%</span><span className="font-bold text-orange-300">Shopee: {100 - pctMl}%</span></div></div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold border-b border-slate-600 pb-2 mb-4">Seu Processo Atual</h3>
              <div className="space-y-3">
                <SliderInput label="Tempo de Separação (min/pedido)" value={tempoSeparacao} onChange={setTempoSeparacao} min={0.5} max={10} step={0.5} unit="min" />
                <SliderInput label="Taxa Média de Erro/Devolução" value={taxaErro} onChange={setTaxaErro} min={0} max={20} step={0.5} unit="%" />
                <div>
                  <label className="text-sm text-slate-300">Tipo de Impressão</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {tiposImpressao.map(type => (
                      <button key={type.id} onClick={() => setTipoImpressao(type.id)} className={`px-3 py-1.5 text-xs rounded-full border-2 ${tipoImpressao === type.id ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-slate-600 text-slate-300'}`}>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold border-b border-slate-600 pb-2 mb-4">Sua Equipe</h3>
              <div className="space-y-3">
                <SliderInput label="Funcionários na Expedição" value={numFuncionarios} onChange={setNumFuncionarios} min={1} max={20} step={1} />
                <SliderInput label="Custo/Hora do Funcionário" value={custoHoraFuncionario} onChange={setCustoHoraFuncionario} min={10} max={50} step={0.5} currency />
                <SliderInput label="Horas por Dia" value={horasPorDia} onChange={setHorasPorDia} min={4} max={12} step={1} unit="h" />
                <SliderInput label="Dias por Semana" value={diasPorSemana} onChange={setDiasPorSemana} min={1} max={7} step={1} />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 flex flex-col justify-center space-y-6">
            <div className="p-6 bg-emerald-500/10 rounded-lg border-2 border-emerald-500 text-center">
              <p className="text-lg font-medium text-emerald-300">Sua economia mensal estimada:</p>
              <p className="text-5xl font-extrabold text-white tracking-tight">{formatCurrency(animatedEconomy)}</p>
              <p className="font-bold text-xl text-emerald-400">({results.economia.percentual.toFixed(1)}%)</p>
              <p className="text-sm mt-2">{economyMessage}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-bold flex items-center gap-2 mb-2"><BarChart2 size={18}/> Custo Mensal (Com vs. Sem)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><span className="w-28 flex-shrink-0">Manual:</span><div className="h-6 flex-grow bg-red-500/30 rounded"><div className="h-6 bg-red-500 rounded" style={{width: `100%`}}></div></div><span className="w-24 flex-shrink-0 text-right font-bold">{formatCurrency(results.custoManual.total)}</span></div>
                  <div className="flex items-center gap-2"><span className="w-28 flex-shrink-0">Com TagsFlow:</span><div className="h-6 flex-grow bg-emerald-500/30 rounded"><div className="h-6 bg-emerald-500 rounded" style={{width: `${(results.custoSaaS.total / Math.max(results.custoManual.total, 1)) * 100}%`}}></div></div><span className="w-24 flex-shrink-0 text-right font-bold">{formatCurrency(results.custoSaaS.total)}</span></div>
                </div>
              </div>
              <div>
                 <h4 className="font-bold flex items-center gap-2 mb-2">
                  <PieChartIcon size={18}/> Distribuição do Custo Manual
                  <div className="relative group">
                    <Info size={14} className="cursor-pointer text-slate-400" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs bg-slate-900 border border-slate-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      O custo com erros é calculado dinamicamente: (15% do Ticket Médio + R$20 de logística) por devolução.
                    </div>
                  </div>
                </h4>
                <PieChart data={[
                  { label: 'Tempo', value: results.custoManual.tempo, color: '#f87171' },
                  { label: 'Erros e Devoluções', value: results.custoManual.erros, color: '#fb923c' },
                  { label: 'Papel/Etiqueta', value: results.custoManual.papel, color: '#a78bfa' },
                  { label: 'Fita', value: results.custoManual.fita, color: '#60a5fa' },
                ]} />
              </div>
              <div>
                <h4 className="font-bold flex items-center gap-2 mb-2"><Clock size={18}/> Carga de Trabalho da Equipe</h4>
                <p className="text-xs text-slate-400 mb-2">Percentual do tempo útil da sua equipe gasto na separação de pedidos.</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><span className="w-28 flex-shrink-0">Manual:</span><div className="h-6 flex-grow bg-red-500/30 rounded"><div className="h-6 bg-red-500 rounded" style={{width: `${Math.min(results.cargaTrabalho.manual, 100)}%`}}></div></div><span className={`w-24 flex-shrink-0 text-right font-bold ${results.cargaTrabalho.manual > 100 ? 'text-red-400' : ''}`}>{results.cargaTrabalho.manual.toFixed(0)}%</span></div>
                  <div className="flex items-center gap-2"><span className="w-28 flex-shrink-0">Com TagsFlow:</span><div className="h-6 flex-grow bg-emerald-500/30 rounded"><div className="h-6 bg-emerald-500 rounded" style={{width: `${Math.min(results.cargaTrabalho.saas, 100)}%`}}></div></div><span className="w-24 flex-shrink-0 text-right font-bold">{results.cargaTrabalho.saas.toFixed(0)}%</span></div>
                </div>
                <div className="text-center font-bold text-emerald-400 mt-2">
                  <p>Você economiza {results.tempo.horasPoupadas.toFixed(0)} horas de trabalho por mês!</p>
                  <p className="text-emerald-300 font-semibold">Ou seja, você trabalha menos, produz mais e cresce mais rápido!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
function Plans({ onRegister }: { onRegister: () => void }) {
    const plans = [
      { name: 'Starter', price: 'R$ 59,90', period: '/mês', description: 'Ideal para quem está começando.', features: ['2 Usuários', 'Suporte por E-mail'], label_limit: 800, isFeatured: false },
      { name: 'Plus', price: 'R$ 99,90', period: '/mês', description: 'A escolha da maioria para crescimento.', features: ['Tudo do Starter', '4 Usuários', 'Relatórios Avançados', 'Suporte Prioritário via Chat'], label_limit: 2600, isFeatured: true },
      { name: 'Escala', price: 'R$ 399,90', period: '/mês', description: 'Para operações de larga escala.', features: ['Tudo do plano Plus', '8 Usuários', 'Gerente de conta dedicado', 'Suporte 24/7'], label_limit: 8000, isFeatured: false },
    ];
    return (
        <Section id="plans">
            <SectionHeader badge="Planos" title="Encontre o plano perfeito para sua operação" description="Comece pequeno e cresça conosco, ou vá direto para a solução completa. Temos um plano para cada etapa do seu negócio."/>
            <Reveal className="mx-auto grid max-w-md items-start gap-8 lg:max-w-5xl lg:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.name} className={`flex flex-col rounded-xl border transition-shadow hover:shadow-xl ${plan.isFeatured ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] shadow-2xl' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
                  <div className="p-6 items-start">
                    {plan.isFeatured && <div className="inline-block rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-text)] mb-2">Mais Popular</div>}
                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-extrabold text-[var(--color-text-primary)]">{plan.price}</span>
                      {plan.price && <span className="text-[var(--color-text-secondary)]">{plan.period}</span>}
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      <strong>Etiquetas/mês:</strong> <span className="font-semibold text-[var(--color-text-primary)]">{plan.label_limit?.toLocaleString() ?? 'Ilimitado'}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2 h-10">{plan.description}</p>
                  </div>
                  <div className="p-6 flex-1 bg-[var(--color-surface-secondary)]">
                    <ul className="space-y-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-[var(--color-primary)]" />
                          <span className="text-sm text-[var(--color-text-primary)]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 bg-[var(--color-surface)] rounded-b-xl">
                    <button onClick={onRegister} className={`w-full px-4 py-2 font-semibold rounded-md text-sm transition-colors disabled:opacity-70 ${plan.isFeatured ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]' : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]'}`}>
                      {plan.price === 'Custom' ? 'Fale Conosco' : 'Assinar Plano'}
                    </button>
                  </div>
                </div>
              ))}
            </Reveal>
        </Section>
    );
}

function Faq() {
    return(
        <Section id="faq">
            <SectionHeader badge="FAQ" title="Dúvidas Frequentes" description="Respostas para as perguntas mais comuns sobre nosso sistema."/>
            <Reveal className="mx-auto max-w-4xl">
                <FaqItem question="É necessário ter um ERP como o Bling?">
                    <p>
                        Qualquer ERP que possa gerar as etiquetas de envio junto com a DANFE no mesmo documento ZPL, é necessário apenas para a Shopee. Caso você venda <strong>somente no Mercado Livre</strong>, um ERP não é necessário.
                    </p>
                </FaqItem>
                <FaqItem question="Posso personalizar as etiquetas e o sistema?">
                  <p>Sim, a personalização é um dos nossos pontos fortes! Você pode:</p>
                  <ul className="list-disc list-inside space-y-2 mt-2 pl-2">
                      <li>Ajustar as informações que aparecem no rodapé da etiqueta (como SKU, nome, quantidade), alterar o tamanho da fonte e a sequência das informações.</li>
                      <li>A Dashboard do sistema também é personalizável, permitindo que você adicione sua logo e as cores da sua empresa para uma experiência de marca consistente.</li>
                  </ul>
                  <p className="mt-2">A única restrição é a cor do texto da etiqueta, pois trata-se de uma impressão térmica, que é monocromática (preto).</p>
                </FaqItem>
                <FaqItem question="É necessário ter um bipador (leitor de código de barras)?">
                  <p>Não é estritamente necessário, mas é <strong>altamente recomendado</strong>.</p>
                  <p className="mt-2">O leitor agiliza drasticamente o processo de confirmação de pedidos, minimiza erros de digitação e é essencial para operações com mais de uma pessoa na expedição ou com funcionários que não separam produtos específicos.</p>
                </FaqItem>
                 <FaqItem question="Posso usar em mais de uma conta por usuário?">
                    <p>Depende do plano:</p>
                     <ul className="list-disc list-inside space-y-2 mt-2 pl-2">
                        <li><strong>Planos Entrada e Plus:</strong> Permitem o uso em apenas uma conta por vez.</li>
                        <li><strong>Plano Profissional:</strong> Permite o uso em múltiplos usuários, conforme a quantidade estipulada no seu plano contratado.</li>
                    </ul>
                </FaqItem>
                 <FaqItem question="Posso cancelar quando quiser?">
                    <p>Pode sim! Nosso plano é recorrente, funcionando de forma similar a serviços como a Netflix. Você pode cancelar a qualquer momento sem multas.</p>
                     <p className="mt-2"><strong>Atenção:</strong> Caso você assine um plano promocional com fidelidade (por exemplo, de 3 ou 6 meses), o cancelamento será agendado para o final do período contratado, não havendo reembolso pelos meses já pagos. Conforme o Art. 49 do Código de Defesa do Consumidor, o direito de arrependimento é válido por 7 dias após a contratação. Passado esse prazo, as cláusulas contratuais de fidelidade são aplicáveis.</p>
                </FaqItem>
                <FaqItem question="Não entendo nada de e-commerce, tem alguém ensinando?">
                    <p>Com certeza! Teremos um módulo de ajuda completo dentro da própria plataforma, com tutoriais, guias e vídeos explicando todo o funcionamento, desde o básico até as funcionalidades mais avançadas. Além disso, nosso suporte estará sempre disponível para te ajudar.</p>
                </FaqItem>
            </Reveal>
        </Section>
    )
}

function FinalCTA({ onRegister }: { onRegister: () => void }) {
    return (
        <Section className="bg-blue-600 text-white">
            <Reveal className="flex flex-col items-center justify-center space-y-6 text-center">
                <h2 className="text-4xl font-bold tracking-tighter sm:text-6xl">Organize, gere e envie seus pedidos sem erros — comece hoje mesmo.</h2>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button onClick={onRegister} className="px-10 py-5 text-xl font-semibold rounded-lg bg-white text-blue-600 hover:bg-gray-100 transition-colors shadow-lg hover:-translate-y-1">
                        Criar Conta Grátis
                    </button>
                </div>
                 <p className="text-base text-blue-100 mt-2">Sem cartão, sem risco. Comece em menos de 2 minutos.</p>
            </Reveal>
        </Section>
    );
}

function Footer({ onOpenModal }: { onOpenModal: (type: 'terms' | 'privacy') => void }) {
    return (
        <footer className="border-t border-[var(--color-border)]">
            <div className="container mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row justify-between items-center text-sm text-[var(--color-text-secondary)]">
                <p>&copy; {new Date().getFullYear()} TagsFlow. Todos os direitos reservados.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <button onClick={() => onOpenModal('terms')} className="hover:underline">Termos de Serviço</button>
                    <button onClick={() => onOpenModal('privacy')} className="hover:underline">Política de Privacidade</button>
                </div>
            </div>
        </footer>
    )
}


export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [modalState, setModalState] = useState<{isOpen: boolean; type: 'terms' | 'privacy' | null}>({isOpen: false, type: null});

  const handleOpenModal = (type: 'terms' | 'privacy') => {
    setModalState({isOpen: true, type: type});
  };

  const handleCloseModal = () => {
    setModalState({isOpen: false, type: null});
  };
  
  const termsContent = (
    <>
      <h3>1. Aceitação dos Termos</h3>
      <p>Ao acessar e usar a plataforma TagsFlow ("Serviço"), você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com estes termos, não use o Serviço.</p>

      <h3>2. Descrição do Serviço</h3>
      <p>O TagsFlow é um software como serviço (SaaS) que auxilia na gestão de expedição de e-commerce, incluindo importação de planilhas de vendas, geração de etiquetas personalizadas, controle de separação e baixa de estoque, sem o uso de integrações diretas via API com as plataformas de marketplace.</p>

      <h3>3. Uso da Conta</h3>
      <p>Você é responsável por manter a segurança de sua conta e senha. O TagsFlow não pode e não será responsável por qualquer perda ou dano decorrente de sua falha em cumprir com esta obrigação de segurança.</p>
      <p>A depender do plano contratado, o uso da conta pode ser limitado a um número específico de usuários ou sessões simultâneas.</p>

      <h3>4. Pagamento, Reembolso, Upgrade e Downgrade</h3>
      <p>O Serviço é cobrado antecipadamente, de forma recorrente (mensal ou anual). Não haverá reembolsos ou créditos por meses parciais de serviço, reembolsos de upgrade/downgrade ou reembolsos por meses não utilizados com uma conta aberta.</p>

      <h3>5. Cancelamento e Rescisão</h3>
      <p>Você é o único responsável por cancelar adequadamente sua conta. O cancelamento pode ser feito a qualquer momento através da interface de gerenciamento de assinatura. Todo o seu conteúdo será imediatamente excluído do Serviço após o cancelamento.</p>

      <h3>6. Modificações no Serviço e Preços</h3>
      <p>O TagsFlow reserva-se o direito de, a qualquer momento, modificar ou descontinuar, temporária ou permanentemente, o Serviço (ou qualquer parte dele) com ou sem aviso prévio.</p>
      <p>Os preços de todos os Serviços estão sujeitos a alterações com 30 dias de antecedência. Tal aviso pode ser fornecido a qualquer momento, publicando as alterações no site do TagsFlow ou no próprio Serviço.</p>

      <h3>7. Limitação de Responsabilidade</h3>
      <p>Você entende e concorda expressamente que o TagsFlow não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou exemplares, incluindo, mas não se limitando a, danos por perda de lucros, boa vontade, uso, dados ou outras perdas intangíveis resultantes do uso ou da incapacidade de usar o serviço.</p>
    </>
  );

  const privacyContent = (
    <>
      <h3>1. Informações que Coletamos</h3>
      <p>Coletamos as informações que você nos fornece diretamente, como quando você cria uma conta, que podem incluir seu nome, endereço de e-mail e informações de pagamento.</p>
      <p>Também coletamos dados que você envia para a plataforma, como planilhas de vendas e informações de produtos. Estes dados são processados localmente em seu navegador sempre que possível e, quando armazenados em nossos servidores, são tratados com a máxima confidencialidade.</p>

      <h3>2. Como Usamos as Informações</h3>
      <p>Utilizamos as informações que coletamos para operar, manter e fornecer a você os recursos e a funcionalidade do Serviço, bem como para nos comunicarmos diretamente com você, como para enviar e-mails sobre o serviço.</p>
      <p><strong>Nós não vendemos, alugamos ou compartilhamos suas informações pessoais ou os dados da sua operação com terceiros.</strong></p>

      <h3>3. Armazenamento de Dados</h3>
      <p>O processamento principal de dados, como a leitura de planilhas e a geração de ZPL, ocorre localmente no seu navegador para garantir a máxima privacidade e segurança. Dados essenciais para o funcionamento contínuo da plataforma, como seu catálogo de produtos e histórico de pedidos, são armazenados de forma segura em nossos servidores.</p>
      <p>Usamos medidas de segurança comercialmente razoáveis para proteger suas informações contra perda, uso indevido e acesso não autorizado.</p>

      <h3>4. Seus Direitos</h3>
      <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento através das configurações da sua conta. Você também pode solicitar a exclusão total de sua conta e de todos os dados associados, em conformidade com nossos Termos de Serviço.</p>

      <h3>5. Cookies</h3>
      <p>Usamos cookies para manter sua sessão ativa e para entender como você usa nosso Serviço, a fim de melhorá-lo. Você pode configurar seu navegador para recusar todos os cookies ou para indicar quando um cookie está sendo enviado.</p>

      <h3>6. Alterações em Nossa Política de Privacidade</h3>
      <p>Podemos modificar ou atualizar esta Política de Privacidade de tempos em tempos para refletir as mudanças em nossas práticas. Iremos notificá-lo de quaisquer alterações, publicando a nova Política de Privacidade nesta página.</p>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <LandingNavbar onLogin={onLogin} onRegister={onRegister} />
      <main className="flex-1">
        <Hero onRegister={onRegister} />
        <Marketplaces />
        <SavingsCalculator />
        <Benefits />
        <CaseStudies />
        <HowItWorks onRegister={onRegister} />
        <Plans onRegister={onRegister} />
        <Faq />
        <FinalCTA onRegister={onRegister} />
      </main>
      <Footer onOpenModal={handleOpenModal} />
      {modalState.isOpen && (
        <PrivacyTermsModal
            title={modalState.type === 'terms' ? "Termos de Serviço" : "Política de Privacidade"}
            content={modalState.type === 'terms' ? termsContent : privacyContent}
            onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
