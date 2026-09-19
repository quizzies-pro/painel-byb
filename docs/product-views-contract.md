# Contrato de Views de produto para a Members

## Identificação

Todo produto possui `product_type` permanente:

- `course`: abrir a experiência atual de Curso;
- `pack`: abrir a futura experiência de Pack;
- qualquer outro valor: não abrir conteúdo e apresentar um estado seguro.

O tipo não pode ser alterado depois que o produto é criado.

## Regras compartilhadas

Curso e Pack utilizam o mesmo produto-base para:

- matrícula e prazo de acesso;
- pagamento, cancelamento e reembolso;
- checkout e disponibilidade comercial;
- categorias da página principal;
- listas de espera.

A View define somente a organização e a entrega do conteúdo.

## Formatos de Pack

Todo Pack possui um `pack_format` permanente:

- `canva`: exibir coleções e designs publicados, usando `cover_url` como capa e `canva_template_url` no botão **Usar no Canva**;
- `textual`: exibir coleções e textos publicados, com leitura e cópia de `textual_content`;
- `drive`: exibir coleções e arquivos publicados. Prévia e download devem chamar a função protegida `pack-drive`, nunca expor links privados do Drive.

As coleções vêm de `pack_collections`, ordenadas por `sort_order`. Os conteúdos vêm de `pack_items`, também ordenados por `sort_order`. A leitura por aluno é permitida apenas com matrícula ativa e não expirada.

## Estado temporário do Pack

Até a View e o conteúdo próprio do Pack serem implementados:

- Packs permanecem em rascunho;
- Packs não aparecem na vitrine;
- Packs não podem ser colocados à venda;
- Packs não aceitam módulos ou aulas;
- o Hub pode preparar seus dados gerais, categorias e lista de espera.

## Expansão futura

Novos formatos devem ser adicionados à identificação controlada e ao direcionador central da Members. Não devem reutilizar módulos e aulas quando o formato de entrega for diferente.