// pages/AjudaPage.tsx
import React, { useState } from 'react';
import { ChevronDown, ScanLine, QrCode, ClipboardCheck, Package, Users, BarChart3, Printer, Settings, LayoutDashboard, ShoppingCart, Weight, Recycle, HelpCircle } from 'lucide-react';

interface AccordionItemProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ icon, title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-[var(--color-border)] rounded-lg">
            <button
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors rounded-t-lg"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center">
                    {icon}
                    <span className="ml-3">{title}</span>
                </div>
                <ChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 bg-[var(--color-surface)] rounded-b-lg">
                    <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] space-y-3">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};


const AjudaPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3"><HelpCircle size={32} /> Central de Ajuda</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Encontre respostas para as dúvidas mais comuns sobre o sistema.</p>
            </div>

            <div className="space-y-4">
                <AccordionItem icon={<Settings size={20} className="text-[var(--color-primary)]" />} title="Primeiros Passos e Configuração Inicial">
                    <p>Antes de começar a usar o sistema, é crucial realizar algumas configurações iniciais para garantir que tudo funcione corretamente.</p>
                     <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Configurações Gerais:</strong> Vá para <strong>Configurações</strong>. Preencha o nome da sua empresa, defina as nomenclaturas para seus produtos e cadastre os setores da sua empresa.</li>
                        <li><strong>Cadastro de Insumos e Produtos:</strong> Na tela de <strong>Produtos</strong>, cadastre todas as suas matérias-primas (Insumos) e seus produtos de venda (Produtos Finais). É importante que os códigos (SKUs) dos produtos de venda sejam os mesmos que você usa nas plataformas de e-commerce.</li>
                        <li><strong>Cadastro de Receitas (BOM):</strong> Para cada produto de venda, clique no ícone de engrenagem ⚙️ e defina a "receita", ou seja, quais insumos e em que quantidade são necessários para produzi-lo. Isso é essencial para a baixa automática de estoque.</li>
                        <li><strong>Cadastro de Funcionários:</strong> Na tela de <strong>Bipagem</strong>, cadastre todos os operadores. Se um operador for também um administrador que precisa fazer login, mude sua função para "Admin" e defina um email e senha.</li>
                    </ol>
                </AccordionItem>

                <AccordionItem icon={<ScanLine size={20} className="text-[var(--color-primary)]" />} title="Importação de Pedidos">
                    <p>Este é o primeiro passo do seu dia: alimentar o sistema com os novos pedidos.</p>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Navegue até a página <strong>Importação</strong>.</li>
                        <li>Arraste e solte o arquivo Excel de vendas (do Mercado Livre ou Shopee) na área indicada, ou clique para selecionar.</li>
                        <li>Clique no botão <strong>Processar Arquivo</strong>.</li>
                        <li>O sistema analisará o arquivo e mostrará um resumo da produção e uma lista de <strong>"SKUs Não Vinculados"</strong>. Um SKU não vinculado é um código de produto que o sistema ainda não conhece.</li>
                        <li>Para cada SKU não vinculado na aba <strong>"Vínculo de SKUs"</strong>, você tem duas opções:
                            <ul className="list-disc list-inside pl-6 mt-1">
                                <li><strong>Vincular:</strong> Se o produto já existe no seu catálogo, clique em "Vincular" e selecione o "Produto Mestre" correspondente na busca.</li>
                                <li><strong>Criar:</strong> Se for um produto novo, clique em "Criar". O sistema usará o SKU importado como o código principal e pedirá o nome e a cor para cadastrá-lo.</li>
                            </ul>
                        </li>
                        <li>Após vincular todos os SKUs, revise as outras abas ("Lista Completa", "Resumida", "Totais por Cor", "Lista de Materiais") para conferir a produção.</li>
                        <li>Quando estiver tudo certo, clique no botão verde <strong>Lançar Pedidos Vinculados</strong>. Isso salvará os pedidos no sistema e os deixará prontos para a bipagem.</li>
                        <li><strong>Histórico de Importações:</strong> A coluna da direita mostra todas as importações feitas, quem as fez e quando. Você pode clicar em "Visualizar" para rever os dados de uma importação antiga sem precisar reenviar o arquivo.</li>
                    </ol>
                </AccordionItem>

                <AccordionItem icon={<QrCode size={20} className="text-[var(--color-primary)]" />} title="Bipagem (Escaneamento) e Auto Bipagem">
                    <p>A bipagem confirma a separação de um pedido e aciona a baixa de estoque.</p>
                    <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Bipagem na Página Dedicada:</strong> Acesse a página <strong>Bipagem</strong>. Com o leitor de código de barras, escaneie a etiqueta do pedido. O sistema dará um feedback instantâneo (Sucesso, Duplicado, Não Encontrado).</li>
                        <li><strong>Auto Bipagem (Global):</strong> No topo de qualquer página, há um botão "Auto Bipar".
                            <ul className="list-disc list-inside pl-6 mt-1">
                                <li>Quando <strong>ativado</strong>, o sistema fica "escutando" o leitor de código de barras em <strong>qualquer tela</strong>. Você não precisa estar na página de Bipagem.</li>
                                <li>Isso é útil para quem está embalando e precisa bipar pedidos enquanto consulta o estoque ou outra tela.</li>
                                <li>O feedback da bipagem aparecerá como uma notificação no canto da tela, em vez de no painel principal.</li>
                            </ul>
                        </li>
                        <li><strong>Prefixos de Operador:</strong> Se vários operadores compartilham o mesmo computador, um administrador pode cadastrar prefixos (ex: "JOAO", "MARIA") na página de Bipagem. O operador então bipa no formato <code>(JOAO)CODIGO_DO_PEDIDO</code>, e o sistema atribui a bipagem à pessoa correta.</li>
                        <li><strong>Histórico de Bipagens:</strong> A lista mostra todas as bipagens. Um administrador pode cancelar uma bipagem feita por engano, o que reverte a baixa de estoque e o status do pedido.</li>
                    </ol>
                </AccordionItem>

                 <AccordionItem icon={<ShoppingCart size={20} className="text-[var(--color-primary)]" />} title="Pedidos">
                    <p>Esta tela permite consultar, filtrar e gerenciar todos os pedidos que já foram lançados no sistema.</p>
                     <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Consultar Pedidos:</strong> Use a barra de busca e os filtros (Canal, Status, Data) para encontrar pedidos específicos.</li>
                        <li><strong>Ações em Massa:</strong> Selecione um ou mais pedidos na lista para habilitar a ação "Marcar como Bipado", útil para processar pedidos atrasados em lote.</li>
                        <li><strong>Visualizar Pedidos com Múltiplos SKUs:</strong> Pedidos com mais de um item são agrupados. Clique na seta ao lado do nome para expandir e ver todos os SKUs do pedido.</li>
                    </ol>
                </AccordionItem>
                
                 <AccordionItem icon={<Package size={20} className="text-[var(--color-primary)]" />} title="Gerenciamento de Produtos e Kits">
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Acesse a página <strong>Produtos</strong>.</li>
                        <li>Use os botões para criar novos produtos ou editar existentes (nome, SKUs vinculados, etc).</li>
                        <li><strong>Configurar Kits (Receita/BOM):</strong> Para Produtos marcados como "Kit", é crucial configurar a "receita". Clique no ícone de engrenagem ⚙️ na linha do item para definir quais outros produtos e em que quantidade compõem este kit.</li>
                    </ol>
                </AccordionItem>
                
                <AccordionItem icon={<Printer size={20} className="text-[var(--color-primary)]" />} title="Etiquetas (ZPL)">
                    <p>Converta o código ZPL bruto das suas plataformas de venda em um PDF pronto para impressão, com informações de SKU adicionadas.</p>
                     <ol className="list-decimal list-inside space-y-2">
                        <li>Cole o conteúdo do arquivo de etiquetas (normalmente um <code>.txt</code> da Shopee/ML) na área de texto, ou clique em "Importar".</li>
                        <li>Clique em <strong>Gerar Etiquetas</strong>. O sistema irá separar as páginas, extrair os dados e começar a gerar as pré-visualizações.</li>
                        <li>As pré-visualizações à direita mostrarão as imagens das DANFEs e das etiquetas. As etiquetas terão um rodapé com as informações de SKU. Elas também mostrarão um selo "BIPADO" ou "IMPRESSO" se a ação já ocorreu.</li>
                        <li><strong>Para personalizar a impressão</strong>, clique no ícone de engrenagem ⚙️. No modal, você pode mudar o template do texto do rodapé, a fonte, o tamanho e o alinhamento.</li>
                        <li>Quando estiver tudo pronto, marque/desmarque "Incluir DANFE" conforme sua necessidade e clique em <strong>Gerar PDF</strong>. Use o botão "Limpar" para começar de novo.</li>
                    </ol>
                </AccordionItem>
            </div>
        </div>
    );
};

export default AjudaPage;