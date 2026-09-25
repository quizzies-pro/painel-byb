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

## Apresentação por contexto e proporção

Curso e Pack compartilham o mesmo contrato visual, cadastrado exclusivamente no Hub. A Members deve informar o uso e a proporção desejados para escolher a imagem:

- capas: `cover_16_9_url`, `cover_4_3_url`, `cover_1_1_url`, `cover_3_4_url` e `cover_9_16_url`;
- banners da hero: `hero_16_9_url` e `hero_4_3_url`;
- `logo_url`: logo opcional; quando estiver vazia, apresentar `title` em texto;
- `short_description`: chamada curta da vitrine;
- `full_description`: descrição da página do produto;
- `presentation_button_enabled`: controla a exibição do botão personalizado;
- `presentation_button_text` e `presentation_button_url`: texto e destino HTTPS do botão quando ativo.

Cada campo de imagem representa um arquivo independente; a Members não deve derivar os formatos por recorte quando houver uma arte específica. Enquanto a biblioteca estiver incompleta, usar a seguinte resolução:

- capa: formato exato, depois a capa de proporção mais próxima, depois a capa 16:9 e, por último, `cover_url`;
- hero: formato exato, depois o outro banner, depois `banner_url`, depois a capa equivalente, a capa 16:9 e `cover_url`.

`cover_url` e `banner_url` são fallbacks legados preservados durante a transição. `login_cover_url` permanece legado e não deve ser usado. A autenticação usa a identidade única da Members. O botão personalizado é apenas de apresentação e nunca substitui a validação de matrícula ou as regras comerciais.

## Formatos de Pack

Todo Pack possui um `pack_format` permanente:

- `canva`: exibir coleções e designs publicados, usando a capa de apresentação resolvida para o contexto e `canva_template_url` no botão **Usar no Canva**;
- `textual`: exibir coleções e textos publicados, com leitura e cópia de `textual_content`;
- `drive`: exibir coleções e arquivos publicados. Prévia e download devem chamar a função protegida `pack-drive`, nunca expor links privados do Drive.

Cada Pack Drive possui uma pasta principal exclusiva (`drive_root_folder_id`). A seleção percorre somente essa pasta e suas subpastas, incluindo paginação acima de 1.000 arquivos. A pasta não pode ser trocada enquanto houver arquivos importados.

As coleções vêm de `pack_collections`, filtradas por `is_visible` e ordenadas por `sort_order`. Capas e etiquetas podem ser usadas na navegação e nos filtros. Os conteúdos vêm de `pack_items`, filtrados por `status = published` e também ordenados por `sort_order`. Itens vinculados a uma coleção oculta não podem ser exibidos; itens sem coleção continuam válidos. A leitura por aluno é permitida apenas com matrícula ativa e não expirada.

## Vídeos explicativos dos Packs

Todos os formatos de Pack podem ter uma lista complementar de vídeos em `pack_videos`:

- consultar somente vídeos com `status = published`, ordenados por `sort_order`;
- exibir título, descrição e reprodução incorporada de `video_url`;
- aceitar links HTTPS do YouTube e Vimeo, convertendo-os para o endereço oficial de incorporação;
- não misturar esses vídeos com módulos ou aulas de Cursos;
- aplicar a mesma matrícula ativa e não expirada exigida para o restante do Pack.

## Liberação comercial

Enquanto a View correspondente ainda não estiver ativa na Members:

- Packs permanecem em rascunho;
- Packs não aparecem na vitrine;
- Packs não podem ser colocados à venda;
- Packs não aceitam módulos ou aulas;
- o Hub pode preparar seus dados gerais, categorias e lista de espera.

## Implementação obrigatória na Members

1. No carregamento do produto, ler `product_type` e direcionar `course` para a experiência atual e `pack` para a experiência de Pack.
2. Para Packs, ler `pack_format` e renderizar somente a apresentação correspondente: Canva, Textual ou Google Drive.
3. Confirmar antes da abertura que existe matrícula `active` e que `expires_at` está vazio ou no futuro. Sem acesso, apresentar compra ou lista de espera conforme os dados do produto.
4. Consultar `pack_collections`, `pack_items` e `pack_videos` diretamente com a sessão do aluno; as políticas do banco filtram conteúdos ocultos, não publicados e matrículas inválidas.
5. Ordenar coleções, itens e vídeos por `sort_order` e fornecer estados vazios e de conteúdo indisponível.
6. No Canva, abrir `canva_template_url` em nova aba pelo botão **Usar no Canva**.
7. No Textual, exibir `textual_content`, `textual_example` quando preenchido e ações de copiar.
8. No Drive, nunca usar ou exibir um endereço privado. Chamar `pack-drive` com `{ action: "download", item_id }` usando a sessão autenticada.
9. Reproduzir somente vídeos publicados e converter links HTTPS do YouTube e Vimeo para seus endereços oficiais de incorporação.
10. Aplicar o contrato de apresentação por uso e proporção, incluindo fallbacks, logo opcional e botão personalizado válido.
11. Validar em celular e computador os estados: matrícula ativa, expirada, cancelada, aluno sem matrícula, item oculto, coleção oculta, arquivo removido e formato desconhecido.

## Critério para liberar venda

Somente remover a trava comercial depois que as três apresentações acima estiverem publicadas e os testes de acesso forem concluídos na Members. Nessa etapa, uma nova migração deverá permitir que Packs sejam publicados, exibidos na vitrine e vendidos; não remova a proteção antes disso.

## Expansão futura

Novos formatos devem ser adicionados à identificação controlada e ao direcionador central da Members. Não devem reutilizar módulos e aulas quando o formato de entrega for diferente.