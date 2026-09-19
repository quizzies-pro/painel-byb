# Fundação segura para produtos Curso e Pack

## Objetivo desta primeira etapa

Preparar o Hub e o banco para reconhecer **Curso** e **Pack** como formatos permanentes de produto, sem alterar a experiência atual dos cursos e sem expor Packs aos alunos antes de sua estrutura de entrega estar pronta.

Ao concluir esta etapa:

- todo produto terá um tipo obrigatório: `Curso` ou `Pack`;
- o tipo será escolhido na criação e ficará bloqueado depois;
- o produto atual continuará classificado como Curso;
- módulos e aulas continuarão exclusivos de Curso;
- Packs poderão ser cadastrados como rascunho no Hub;
- Packs ainda não poderão ser publicados, vendidos ou exibidos na Members;
- categorias, listas de espera, matrículas, pagamentos e webhooks continuarão vinculados ao mesmo produto-base;
- a arquitetura ficará preparada para adicionar novas Views futuramente sem alterar Curso e Pack.

## Situação atual confirmada

- A tabela `courses` funciona hoje como cadastro central dos produtos e ainda não possui um campo de tipo.
- Existe atualmente 1 produto publicado, com módulos e matrícula; ele será preservado como Curso.
- Categorias de apresentação, listas de espera, matrículas, pagamentos e mapeamentos de webhook já se relacionam pelo ID desse cadastro central.
- O formulário atual mistura informações gerais do produto com funções próprias de Curso, incluindo módulos, instrutor, trailer, comentários e certificado.
- A matrícula manual carrega módulos e aulas do produto selecionado.
- O webhook concede acesso usando o produto, o prazo de acesso e a matrícula; essa regra pode continuar compartilhada pelos dois tipos.

## Escopo de implementação agora

### 1. Criar a identificação permanente do produto

- Criar o tipo controlado `course | pack` no banco.
- Adicionar `product_type` ao cadastro central de produtos, obrigatório e com valor seguro para compatibilidade.
- Classificar todos os produtos existentes como `course`.
- Criar proteção no banco que rejeite qualquer tentativa de alterar `product_type` após a criação.
- Manter o nome técnico atual das relações nesta etapa, evitando renomear tabelas e quebrar integrações já estáveis.

### 2. Criar uma definição central de capacidades

Manter uma única definição no aplicativo para cada formato:

```text
Curso
- módulos e aulas
- progresso e conclusão
- comentários
- certificado
- trailer e instrutor

Pack
- conteúdo próprio ainda pendente
- sem módulos e aulas
- sem publicação nesta primeira etapa
```

Essa definição controlará rótulos, recursos permitidos e direcionamento das telas. Uma View futura será adicionada como uma nova entrada, sem espalhar condições diferentes pelo Hub.

### 3. Alterar a criação de produtos no Hub

- Ao abrir **Novo produto**, apresentar primeiro a escolha entre **Curso** e **Pack**.
- Explicar brevemente a finalidade de cada formato.
- Exigir a escolha antes de abrir o cadastro.
- Salvar o tipo junto com o novo produto.
- Em produtos existentes, mostrar o tipo como informação bloqueada, sem seletor editável.
- Exibir um aviso claro de que o formato não poderá ser trocado após a criação.

### 4. Separar campos compartilhados dos campos de Curso

**Compartilhados por Curso e Pack:**

- título, endereço amigável e descrições;
- capa e imagens gerais;
- status interno;
- prazo de acesso;
- checkout e identificadores comerciais;
- categorias de apresentação;
- vitrine, venda, destaque e gratuidade;
- informações de busca e ordenação.

**Exclusivos de Curso nesta etapa:**

- instrutor;
- trailer;
- comentários;
- certificado;
- módulos, aulas e liberações progressivas de conteúdo.

O formulário continuará usando o mesmo fluxo salvo, mas mostrará apenas os controles compatíveis com o tipo escolhido.

### 5. Preservar integralmente os Cursos

- Manter o formulário e a aba de módulos para produtos `course`.
- Manter as rotas atuais de módulos e aulas.
- Bloquear no Hub a abertura ou criação de módulos e aulas para produtos `pack`.
- Adicionar também uma proteção no banco para impedir módulos e aulas vinculados a Packs, evitando inconsistências fora da interface.
- Não migrar, duplicar ou recriar módulos, aulas, matrículas ou arquivos do produto atual.

### 6. Permitir Pack somente como rascunho seguro

Enquanto a entrega e a View de Pack não existirem:

- permitir criar e editar os dados básicos de um Pack;
- permitir associá-lo a categorias e preparar uma lista de espera;
- impedir que fique publicado, visível na vitrine ou disponível para venda;
- aplicar essa proteção tanto no Hub quanto no banco;
- identificar no Hub o estado **Entrega do Pack pendente**.

Isso permite preparar o produto sem criar uma página quebrada ou vender um acesso que ainda não pode ser entregue.

### 7. Adaptar listagens e matrículas administrativas

- Mostrar um marcador **Curso** ou **Pack** na listagem de produtos.
- Permitir busca e filtro por tipo.
- Na matrícula manual, carregar módulos e aulas somente quando o produto for Curso.
- Para Pack, nesta etapa, permitir apenas o acesso integral ao produto, sem opções granulares ainda inexistentes.
- Manter pagamentos, webhooks, prazo de acesso, cancelamento e bloqueio usando a matrícula comum.

### 8. Preservar categorias e listas de espera

- Continuar permitindo que Curso e Pack sejam vinculados às categorias de apresentação.
- Continuar permitindo lista de espera para ambos enquanto não estiverem à venda.
- Incluir o tipo do produto nas telas administrativas onde isso ajuda a equipe a diferenciá-los.
- Não alterar as funções seguras de adesão e saída da lista de espera.

### 9. Preparar o contrato para a Members

Documentar para o projeto Members um contrato único:

```text
product_type = course → abrir a experiência atual de Curso
product_type = pack   → abrir a futura experiência de Pack
outro tipo            → bloquear com estado seguro
```

O contrato também registrará que compra, lista de espera e acesso são regras compartilhadas, enquanto o conteúdo entregue depende do tipo.

Nesta primeira etapa não será criada a tela do Pack na Members.

### 10. Validação e proteção contra regressões

Validar antes de concluir:

- produto existente permanece `course` e publicado;
- módulos e aulas atuais permanecem relacionados e acessíveis;
- tipo não pode ser alterado após salvar;
- Curso ainda pode criar, editar e ordenar módulos e aulas;
- Pack não aceita módulos ou aulas;
- Pack não pode ser publicado, vendido ou aparecer na vitrine;
- Pack pode receber categoria e lista de espera;
- matrícula integral continua funcionando para ambos;
- webhook continua criando a mesma matrícula comum;
- verificações de tipos e testes relevantes passam sem modificar a regra do alerta de senha vazada.

## Detalhes técnicos

- A mudança estrutural será aplicada por migração no Supabase.
- A proteção de imutabilidade e as restrições temporárias de Pack serão garantidas por funções de validação executadas no banco.
- As políticas existentes serão mantidas; qualquer nova tabela futura terá permissões explícitas e RLS.
- O cadastro central continuará em `courses` por compatibilidade, embora a interface use o termo **Produtos**.
- As tipagens do Supabase serão regeneradas após a migração; não serão editadas manualmente.
- O código de capacidades será centralizado para evitar condicionais duplicadas quando novas Views forem adicionadas.

## Fora desta primeira etapa

Estes itens precisam do desenho e das regras da experiência de Pack:

1. Definir se o Pack terá coleções, pastas, categorias internas ou outra hierarquia.
2. Definir os tipos de recursos aceitos: arquivos, links, imagens, vídeos, templates ou outros.
3. Definir prévia, download individual, download em conjunto e permissões de download.
4. Definir busca, filtros, favoritos, versões e atualizações dos recursos.
5. Criar as tabelas específicas de conteúdo do Pack.
6. Criar o gerenciador de conteúdo do Pack no Hub.
7. Criar a View visual de Pack na Members conforme o desenho aprovado.
8. Integrar a navegação da Members ao novo direcionador de Views.
9. Liberar publicação, vitrine e venda para Packs somente após a entrega estar validada.
10. Testar o primeiro Pack completo com compra, matrícula, acesso, bloqueio e reembolso.

## Próximo ciclo de planejamento

Depois desta fundação, o próximo plano será criado a partir do desenho do Pack e seguirá esta ordem:

1. modelo de conteúdo do Pack;
2. cadastro e organização no Hub;
3. experiência visual na Members;
4. regras de download e atualização;
5. integrações de acesso e comercialização;
6. testes e liberação gradual.

Ao final da implementação desta primeira etapa, será entregue uma lista atualizada separando:

- o que foi concluído;
- o que depende do desenho do Pack;
- o que precisa ser feito no projeto Members;
- o que falta para liberar o primeiro Pack real.
