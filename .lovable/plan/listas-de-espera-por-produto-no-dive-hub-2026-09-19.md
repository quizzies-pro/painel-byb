# Listas de espera por produto no Dive | Hub

## Objetivo
Criar no Hub uma área completa para cadastrar e administrar várias listas de espera ligadas a produtos. Na Members, somente alunos autenticados poderão entrar com um clique, usando os dados já existentes no perfil e aceitando conjuntamente comunicações de marketing por e-mail e WhatsApp.

## Regras definidas
- Cada lista pertence a um produto; um produto pode ter várias listas.
- Somente alunos autenticados e vinculados a um cadastro de aluno podem participar.
- Cada aluno entra apenas uma vez em cada lista.
- Alunos que já possuem matrícula ativa no mesmo produto não entram na lista.
- Nome e e-mail vêm do cadastro existente; telefone é obrigatório para o aceite conjunto. Se estiver ausente, a Members deve pedir a atualização antes da confirmação.
- O aceite será explícito, não pré-marcado, com texto claro sobre e-mail e WhatsApp e link para a política de privacidade.
- A lista encerra automaticamente quando o produto passa a estar disponível para venda; seu histórico permanece consultável.
- O aluno poderá retirar o consentimento e sair da lista, sem apagar o registro histórico da autorização e da revogação.

## Estrutura de dados e segurança
- Criar `product_waitlists` com produto, nome interno, descrição, status, versão/texto do consentimento, datas de criação, atualização e encerramento.
- Criar `product_waitlist_members` com lista, aluno, estado da inscrição, cópia dos dados de contato no momento do aceite, data/origem do consentimento e eventual data de revogação.
- Adicionar chaves estrangeiras, índices e unicidade por lista + aluno.
- Conceder acesso explícito às funções administrativas e aos alunos autenticados, com RLS em todas as novas tabelas.
- Administradores poderão gerenciar listas e consultar participantes; alunos verão somente a própria participação e apenas os dados públicos da lista ativa.
- Criar funções seguras para entrar e sair da lista. Elas derivarão o aluno exclusivamente da sessão autenticada, validarão lista ativa, telefone, matrícula e disponibilidade do produto, sem aceitar um ID de aluno enviado pelo navegador.
- Criar automação no banco que encerra todas as listas ativas do produto quando `available_for_sale` mudar para verdadeiro.
- Registrar criação, alteração e encerramento administrativo no histórico de atividades.

## Área administrativa do Hub
- Adicionar **Listas de espera** no menu Gestão e novas páginas protegidas.
- Tela de listagem com busca e filtros por produto e status, mostrando quantidade de interessados e datas.
- Formulário para criar/editar lista, selecionar o produto, definir nome, descrição e texto/versão do consentimento.
- Tela de detalhes com participantes, nome, e-mail, telefone, situação, data de entrada, consentimento e revogação.
- Permitir encerrar ou reabrir manualmente quando o produto ainda não estiver à venda; listas de produtos já liberados não poderão ser reabertas.
- Permitir exportação CSV dos participantes respeitando os filtros, para uso nas ações de marketing.
- Incluir permissão específica de visualizar e gerenciar listas de espera para a equipe administrativa.

## Contrato para integração na Members
- Entregar ao projeto Members as funções e campos necessários para o botão **Entrar na lista de espera**.
- O fluxo deverá preencher os dados do aluno autenticado, exibir o aceite conjunto e confirmar a inscrição sem revelar dados privados do produto ou de outros participantes.
- Estados previstos: disponível, já inscrito, telefone ausente, já matriculado, lista encerrada e produto liberado para venda.
- Esta etapa prepara o banco e o Hub; a colocação visual do botão na Members será feita no projeto separado da área de membros.

## Validação
- Validar criação, edição, filtros, detalhes, encerramento e exportação no Hub.
- Testar que um aluno autenticado entra apenas em nome próprio e que um ID alternativo não pode ser usado.
- Testar duplicidade, ausência de telefone, matrícula ativa, revogação e isolamento entre alunos.
- Confirmar que liberar o produto encerra automaticamente todas as listas ativas e preserva participantes e consentimentos.
- Rodar verificação de tipos, testes relevantes e revisão das políticas de segurança.
