# Proporção dinâmica das capas dos itens de Pack

## Objetivo

Permitir escolher a proporção de cada capa de item entre **1:1, 16:9, 4:3, 3:4 e 9:16**, preservando a imagem sem recortes indevidos. O Hub terá uma apresentação editorial própria; a Members receberá a proporção cadastrada para compor seu visual separadamente.

## Hub

- Adicionar ao cadastro e à edição do item um seletor visual de proporção com as cinco opções.
- Atualizar imediatamente a prévia lateral do popup conforme a opção escolhida.
- Manter upload, URL, título, coleção, descrição, etiquetas, estado e link do Canva com o mesmo funcionamento.
- Trocar a grade atual de cards por uma **lista editorial administrativa**, com miniatura proporcional, informações e ações alinhadas; formatos verticais não tornarão a página desorganizada.
- Aplicar o campo de proporção aos itens de Pack de forma compartilhada, mantendo o popup Canva como a primeira experiência otimizada.

## Dados e compatibilidade

- Criar em `pack_items` um campo controlado de proporção, aceitando somente `1:1`, `16:9`, `4:3`, `3:4` e `9:16`.
- Definir `16:9` como padrão para itens existentes e novos sem escolha explícita, evitando quebra de dados antigos.
- Preservar `cover_url`; a mudança acrescenta apenas a informação de como a imagem deve ser apresentada.
- Manter as permissões atuais: administradores gerenciam os itens e alunos matriculados leem apenas conteúdo publicado permitido pelas regras existentes.

## Contrato para a Members

- Documentar que cada item entrega `cover_url` junto com sua proporção cadastrada.
- A Members deverá usar esse valor para montar uma apresentação proporcional própria, sem copiar o formato editorial do Hub e sem forçar um recorte único.
- A implementação visual da Members permanece separada, pois este projeto é o Hub; o contrato ficará pronto para consumo no outro app.

## Validação

- Testar criação, edição e duplicação preservando a proporção.
- Confirmar itens antigos com padrão 16:9.
- Verificar no Hub todos os cinco formatos, imagens ausentes, textos longos e telas menores.
- Validar tipos, testes automatizados e compilação.
