# Plano — Categorias de apresentação dos produtos

## Objetivo
Organizar a página principal da Members em seções configuráveis, semelhantes a trilhas, sem usar as tags internas dos produtos.

## Regras definidas
- Cada categoria terá **nome** e **descrição opcional**.
- Um produto poderá participar de **várias categorias**.
- Produtos visíveis na vitrine, mas sem categoria, **não aparecerão na página principal**.
- A seleção das categorias ficará **dentro do cadastro de cada produto**.
- As regras existentes de vitrine, venda e matrícula continuam valendo: a categoria organiza a apresentação, mas não concede acesso.

## Dive | Hub
- Adicionar ao cadastro do produto uma seção **Categorias de apresentação**.
- Permitir criar uma categoria sem sair do produto, informando nome e descrição.
- Exibir as categorias existentes como opções de múltipla seleção.
- Permitir remover o produto de uma categoria sem apagar a categoria.
- Incluir uma organização compacta dentro dessa seção para ordenar categorias e os produtos associados.
- Mostrar na lista de produtos quais categorias de apresentação estão vinculadas.

## Banco e segurança
- Criar uma tabela para as categorias, com nome, descrição, posição, estado ativo e datas de criação/alteração.
- Criar uma tabela de relacionamento entre categorias e produtos, com posição do produto dentro da categoria.
- Conceder acesso explícito às tabelas e ativar RLS.
- Permitir leitura aos alunos autenticados para montar a página principal.
- Restringir criação, alteração, ordenação e exclusão aos administradores autorizados.
- Manter exclusões consistentes: apagar uma categoria remove apenas seus vínculos; apagar um produto remove seus vínculos.

## Members
- Buscar categorias ativas em sua ordem de apresentação.
- Dentro de cada categoria, mostrar somente produtos vinculados, publicados e liberados para a vitrine, respeitando a ordem definida.
- Não criar uma seção automática para produtos sem categoria.
- Se o aluno já tiver matrícula ativa, preservar a visualização e o acesso adquirido conforme a regra existente, mesmo fora da vitrine pública.
- Evitar cartões duplicados quando a mesma categoria for processada mais de uma vez; um produto poderá aparecer em categorias diferentes conforme configurado.

## Validação
- Criar categoria no cadastro de um produto e vinculá-la imediatamente.
- Vincular o mesmo produto a várias categorias.
- Reordenar categorias e produtos e confirmar a mesma ordem na Members.
- Confirmar que produto sem categoria não aparece na página principal.
- Confirmar que categoria vazia ou inativa não aparece.
- Confirmar que vínculo de categoria não libera conteúdo sem matrícula.
- Confirmar que compradores continuam acessando produtos adquiridos.

## Escopo técnico
- Neste projeto: banco compartilhado e controles administrativos no Dive | Hub.
- No projeto Members: leitura das novas categorias e composição das seções da página principal.
