# Proporção dinâmica para capas de coleções

## Objetivo
Aplicar às coleções de Packs a mesma dinâmica já usada nos itens: cada capa terá uma proporção declarada entre `1:1`, `16:9`, `4:3`, `3:4` e `9:16`, respeitada no Hub e disponibilizada para a Members.

## Implementação

1. **Persistir a proporção**
   - Adicionar `cover_ratio` em `pack_collections`, usando o mesmo tipo de proporção já criado para os itens.
   - Definir `16:9` como padrão para coleções existentes e novas sem escolha explícita.
   - Preservar `cover_url` e todas as permissões atuais.

2. **Atualizar o cadastro da coleção**
   - Incluir um seletor visual com as cinco proporções no popup de criação e edição.
   - Fazer a prévia da capa responder imediatamente à opção escolhida.
   - Manter nome, descrição, etiquetas, visibilidade e demais comportamentos inalterados.

3. **Respeitar a proporção no Hub**
   - Ajustar a miniatura da coleção na lista editorial para representar a proporção cadastrada sem forçar recorte 16:9.
   - Exibir a proporção junto ao estado da coleção para facilitar a conferência administrativa.

4. **Atualizar o contrato da Members**
   - Documentar que `pack_collections` entrega `cover_url` e `cover_ratio`.
   - A Members poderá usar esse dado em seu próprio visual proporcional, sem copiar a composição administrativa do Hub.

## Validação
- Confirmar criação e edição com as cinco proporções.
- Confirmar que coleções existentes permanecem em `16:9`.
- Verificar tipos, testes e compilação.

## Limite
A apresentação visual na Members continuará sendo implementada no projeto da Members; nesta entrega, o Hub e o banco fornecerão o contrato necessário.
