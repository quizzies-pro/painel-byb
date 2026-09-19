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

## Estado temporário do Pack

Até a View e o conteúdo próprio do Pack serem implementados:

- Packs permanecem em rascunho;
- Packs não aparecem na vitrine;
- Packs não podem ser colocados à venda;
- Packs não aceitam módulos ou aulas;
- o Hub pode preparar seus dados gerais, categorias e lista de espera.

## Expansão futura

Novos formatos devem ser adicionados à identificação controlada e ao direcionador central da Members. Não devem reutilizar módulos e aulas quando o formato de entrega for diferente.