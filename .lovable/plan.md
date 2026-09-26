# Reestruturação de Alunos e Matrículas

## Objetivo

Transformar **Alunos** no ponto central da operação e substituir o formulário isolado de matrícula por uma gestão visual de produtos em **lista horizontal expandida**. O administrador verá, para um aluno específico, quais produtos já têm acesso e quais ainda podem ser liberados.

## Experiência escolhida

- Direção: **lista centrada no produto**, em faixas de largura total.
- Paleta: branco, cinzas frios, azul `#2563EB` para foco e ações; cores semânticas apenas para estados.
- Tipografia nesta área: **Outfit** nos títulos e **Figtree** no conteúdo.
- Visual compacto, operacional e minimalista, com bordas finas, pouca elevação e sem excesso de cartões.
- Edição abre dentro da própria linha, sem trocar de página e sem perder o contexto do aluno.

## Novo fluxo

### 1. Lista de alunos

- Manter busca, filtros e ações existentes, aprimorando a leitura em lista.
- Exibir um resumo útil por aluno, incluindo status e quantidade de matrículas ativas.
- Tornar a linha do aluno o acesso principal à sua área de gestão.
- Preservar criação, edição cadastral, envio de acesso e exclusão existentes.

### 2. Área unificada do aluno

- Unificar a visão hoje separada entre detalhes e edição em uma página organizada por faixas:
  1. cabeçalho compacto com nome, e-mail, status e ações;
  2. dados cadastrais;
  3. gestão de acessos por produto;
  4. histórico de pagamentos.
- Abrir **Acessos e produtos** como área principal do aluno.
- Salvar alterações sem sair da página; mostrar apenas a confirmação de sucesso.
- Preservar o botão Voltar baseado no histórico real de navegação.

### 3. Lista completa de produtos do aluno

- Carregar todos os produtos e cruzá-los com as matrículas do aluno.
- Cada linha mostrará:
  - capa pequena e nome do produto;
  - tipo: Curso ou Pack;
  - situação: disponível, ativa, expirada, cancelada ou bloqueada;
  - modalidade de acesso: completo ou personalizado;
  - origem;
  - validade;
  - ação contextual.
- Adicionar busca por produto e filtros por situação e tipo.
- Usar ações claras: **Liberar acesso**, **Editar acesso**, **Renovar** ou **Desbloquear**.
- Evitar duplicidade: produtos já matriculados aparecem no seu estado atual, não novamente como disponíveis.

### 4. Edição inline da matrícula

- Expandir apenas uma linha por vez para editar os campos existentes:
  - origem;
  - status;
  - data de expiração;
  - observações;
  - acesso completo ou personalizado.
- Para Cursos, manter a seleção de módulos e aulas, com contagem e expansão organizada.
- Para Packs, deixar explícito que o acesso é integral às coleções, itens e vídeos publicados.
- Salvar ou cancelar dentro da linha, mantendo busca, filtros e posição da página.
- Apresentar erros de negócio em linguagem clara, sem mensagens técnicas do banco.

### 5. Visão geral de matrículas

- Manter **Matrículas** no menu como visão transversal para suporte e auditoria.
- Melhorar a tabela com filtros por aluno, produto, tipo, origem e status.
- Ao abrir uma matrícula, direcionar para a área do aluno com o produto correspondente já expandido.
- O botão **Nova matrícula** inicia pela busca do aluno e, após a seleção, abre a mesma lista completa de produtos — sem voltar ao formulário de dois seletores isolados.
- Preservar URLs antigas com redirecionamento compatível para não quebrar favoritos ou links internos.

## Regras preservadas

- Não alterar o conteúdo nem as regras atuais de matrícula.
- Uma matrícula continua vinculando um aluno a um produto.
- Cursos continuam aceitando acesso completo ou personalizado por módulos/aulas.
- Packs continuam com acesso integral.
- Status, origem, validade, observações e autoria continuam sendo salvos.
- Criar aluno continua usando o fluxo seguro de convite existente.
- Pagamentos permanecem somente como histórico nesta reorganização.
- Nenhuma mudança de banco é necessária: as tabelas atuais já suportam o novo fluxo.

## Organização técnica

- Criar componentes reutilizáveis para a linha de produto, editor expandido, estados da matrícula e controle granular de Curso.
- Consolidar a consulta do aluno, seus pagamentos, suas matrículas e os produtos disponíveis na área unificada.
- Reaproveitar os componentes de botões, campos, seletores, confirmações e notificações do Hub.
- Aplicar Outfit/Figtree e o azul escolhido por tokens semânticos, limitados à nova área para não alterar telas não relacionadas.
- Manter o estado da linha aberta e dos filtros durante salvamentos.
- Tratar carregamento por skeleton/lista estável, evitando tela vazia ou salto de layout.

## Validação

- Aluno sem matrículas vê todos os produtos como disponíveis.
- Aluno com matrículas vê estados atuais e produtos restantes na mesma lista.
- Liberar Curso completo e personalizado.
- Liberar Pack com acesso integral.
- Editar, renovar, bloquear, desbloquear, cancelar e expirar sem sair da página.
- Confirmar que salvar não redireciona nem desmonta a tela.
- Confirmar que URLs antigas continuam funcionando.
- Verificar lista em desktop e telas menores, sem sobreposição ou texto cortado.
- Executar compilação, testes automatizados e checagem visual do fluxo acessível.
