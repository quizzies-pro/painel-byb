# Padronização completa dos popups do Dive Hub

## Objetivo

Transformar todos os popups do Hub em uma experiência única, minimalista e profissional, preservando integralmente textos, campos, regras, validações e ações existentes.

A direção aprovada será adaptada ao sistema atual: **branco preciso**, tipografia **Geist Sans + Geist Mono**, superfícies limpas, divisórias discretas, cantos contidos e movimentos rápidos.

## Escopo confirmado

O Hub possui hoje:

- 11 janelas personalizadas distribuídas entre Packs, Categorias, Configurações, Pagamentos e Webhooks;
- 14 confirmações nativas do navegador para exclusões e remoções;
- elementos flutuantes compartilhados, como menus, listas de seleção, busca rápida, painéis laterais e gavetas.

A revisão abrangerá toda essa família visual, sem alterar o conteúdo ou o funcionamento de cada fluxo.

## Padrão visual e de experiência

### Estrutura-base

Toda janela seguirá quatro áreas previsíveis:

```text
┌────────────────────────────────────────────┐
│ Título                                  ×  │
├────────────────────────────────────────────┤
│                                            │
│ Conteúdo dimensionado para a tarefa        │
│                                            │
├────────────────────────────────────────────┤
│                          Cancelar   Salvar  │
└────────────────────────────────────────────┘
```

- cabeçalho e rodapé visualmente separados e sempre acessíveis;
- rolagem apenas no conteúdo central, nunca na janela inteira;
- botão de fechar com área de clique confortável, rótulo acessível e foco visível;
- fundo escurecido mais leve que o atual, mantendo contexto sem competir com a janela;
- largura, altura e organização adequadas à complexidade da tarefa;
- entrada e saída discretas, rápidas e respeitando redução de movimento.

### Tamanhos por finalidade

- **Compacto:** confirmações e decisões rápidas;
- **Padrão:** formulários curtos, como categorias e vídeos;
- **Amplo:** formulários com várias seções, permissões e conexões;
- **Com mídia:** formulário e imagem lado a lado no computador, em uma coluna no celular;
- **Explorador:** seleção de arquivos e pastas com lista ampla, área rolável e ações fixas;
- **Leitura:** detalhes de pagamentos e registros, com dados escaneáveis e blocos técnicos legíveis.

### Comportamento responsivo

- no computador, aproveitar a largura para reduzir altura e rolagem;
- no celular, ocupar quase toda a largura e limitar a altura à área visível;
- empilhar campos em uma coluna quando duas colunas comprometerem a leitura;
- manter as ações visíveis no rodapé, inclusive com teclado virtual;
- impedir conteúdo cortado, sobreposição e deslocamentos ao carregar imagens.

## Componentes compartilhados

Criar uma base reutilizável para que novos popups já nasçam padronizados:

- variações de tamanho e finalidade na janela principal;
- cabeçalho, corpo rolável e rodapé fixo;
- bloco de campos e bloco de opções com espaçamento consistente;
- estado de processamento para a ação principal;
- confirmação destrutiva padronizada;
- tratamento coerente para menus, listas de seleção, busca rápida, painéis laterais e gavetas;
- estilos baseados somente nos elementos e cores oficiais do Hub.

## Aplicação nos fluxos existentes

### Packs

- reorganizar **Nova/Editar coleção** em formato amplo com campos à esquerda e capa à direita;
- aplicar a mesma estrutura a **Novo/Editar item**, adaptando-se a Canva, Textual e Drive;
- tornar **Adicionar/Editar vídeo** compacto, mantendo a prévia existente;
- transformar seleção de arquivos e de pasta do Drive em exploradores claros, com listas e ações fixas.

### Apresentação de produtos

- padronizar **Nova/Editar categoria** como formulário curto;
- preservar seleção, ordem, visibilidade e exclusão exatamente como funcionam hoje.

### Configurações e integrações

- organizar **Convidar usuário** e permissões em uma janela ampla com rolagem central;
- reorganizar criação de webhook e conexão de produto por grupos visuais, sem mudar nenhum campo;
- apresentar detalhes técnicos de webhook em área de leitura adequada para conteúdo longo.

### Financeiro

- reorganizar detalhes de pagamento para leitura por pares de informação;
- manter o conteúdo técnico em área própria, rolável e com fonte Geist Mono.

### Confirmações destrutivas

Substituir as 14 caixas nativas do navegador por uma confirmação consistente no Hub:

- nome claro da ação;
- consequência já descrita pelo texto existente;
- cancelar como ação segura;
- ação destrutiva visualmente distinta;
- foco inicial seguro e navegação completa por teclado.

## Regras que não serão alteradas

- nenhum texto, campo, opção, validação ou regra de negócio;
- nenhuma operação de criação, edição, exclusão, convite, importação ou integração;
- nenhuma estrutura de dados ou permissão;
- nenhuma página fora do Hub.

## Implementação técnica

1. Evoluir as bases compartilhadas de janela, confirmação, painel, gaveta, menu e lista flutuante com tokens semânticos do tema.
2. Criar variações reutilizáveis de tamanho e organização, evitando estilos repetidos em cada tela.
3. Migrar primeiro Packs e Categorias, que concentram formulários com imagem e a situação mostrada na captura.
4. Migrar Configurações, Webhooks e Pagamentos.
5. Substituir confirmações nativas por confirmação visual compartilhada em todas as telas administrativas.
6. Preservar foco, fechamento por Escape, retorno do foco ao botão de origem e bloqueio de interação com o fundo.

## Validação

- comparar visualmente as janelas em computador e celular;
- testar conteúdo curto, conteúdo longo, rolagem, imagem vazia e imagem carregada;
- testar abrir, fechar, cancelar, salvar, estado de processamento e mensagens de erro;
- validar navegação por teclado, foco, Escape e leitores de tela;
- conferir que todas as funções continuam produzindo o mesmo resultado;
- executar verificações de tipos, testes automatizados e compilação final.

## Resultado esperado

Todos os popups do Hub parecerão parte do mesmo produto: mais compactos, claros e previsíveis, com melhor aproveitamento da tela e sem a sensação de formulário improvisado, mantendo exatamente o conteúdo e as funções atuais.
