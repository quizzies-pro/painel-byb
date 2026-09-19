# Vídeos explicativos para Packs

## Objetivo

Adicionar em cada Pack uma lista simples de vídeos de orientação, sem reutilizar módulos ou aulas. A área estará disponível para Packs Canva, Textual e Google Drive.

## O que será criado

### 1. Estrutura dos vídeos
- Criar um cadastro próprio de vídeos vinculado ao Pack.
- Cada vídeo terá título, descrição opcional, link do YouTube ou Vimeo, ordem e estado: rascunho, publicado ou oculto.
- Validar que o produto vinculado é realmente um Pack.
- Impedir links que não sejam válidos e manter os vídeos separados da estrutura de Cursos.

### 2. Segurança e acesso
- Administradores com permissão para gerenciar produtos poderão criar, editar, ordenar e excluir vídeos.
- Alunos poderão visualizar somente vídeos publicados de Packs nos quais tenham matrícula ativa e não expirada.
- Aplicar permissões de acesso e registrar alterações no histórico do Hub.

### 3. Gerenciamento no Hub
- Adicionar a seção **Vídeos explicativos** dentro do gerenciador de conteúdo do Pack.
- Permitir cadastrar vários vídeos por link.
- Exibir uma lista compacta com título, origem, estado e ações de editar ou excluir.
- Permitir reorganizar a sequência dos vídeos sem criar módulos ou aulas.
- Disponibilizar uma prévia do link para conferência no Hub.

### 4. Preparação para a Members
- Documentar a leitura da lista ordenada de vídeos publicados.
- Definir a conversão segura dos links do YouTube e Vimeo para reprodução incorporada.
- A apresentação visual final será feita no projeto da Members junto com a View de Pack; o Hub ficará responsável apenas pelo cadastro e organização.

## Detalhes técnicos

- Nova tabela pública específica para vídeos de Pack, com permissões explícitas, proteção por usuário e atualização automática de data.
- Validação no banco para vínculo exclusivo com produtos do tipo Pack e URLs HTTPS do YouTube/Vimeo.
- A ordenação será independente das coleções e dos itens do Pack.
- A funcionalidade não altera `course_modules`, `lessons` nem a experiência atual dos Cursos.

## Validação

- Criar, editar, ordenar e excluir múltiplos vídeos em um Pack.
- Confirmar rejeição de links inválidos e de associação com Curso.
- Confirmar que rascunhos e itens ocultos não ficam disponíveis para alunos.
- Executar verificação de tipos, testes existentes e inspeção visual do gerenciador.

## Resultado desta etapa

O Hub ficará pronto para cadastrar e organizar os vídeos de qualquer Pack. Depois, restará apresentar essa lista na View de Pack da Members conforme o desenho visual aprovado.
