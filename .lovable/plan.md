# Permanência de navegação no Hub

## Objetivo

Salvar e atualizar dados sem retirar o administrador da tela ou seção atual, além de restaurar sessões sem exibir brevemente a tela de login.

## Implementação

1. **Sessão sem redirecionamento prematuro**
   - Manter a tela de carregamento até a sessão e a permissão administrativa serem verificadas juntas.
   - Evitar que eventos simultâneos da autenticação liberem a navegação antes dessa verificação.

2. **Salvar sem sair da tela**
   - Remover os redirecionamentos após edições bem-sucedidas de produtos, módulos, aulas, alunos, matrículas e listas de espera.
   - Manter apenas a notificação de sucesso.
   - Após a primeira criação, trocar silenciosamente a URL `/new` pela URL de edição do registro criado. A tela permanece no mesmo lugar e os próximos cliques em salvar atualizam o registro, sem criar duplicatas.

3. **Preservar a seção aberta**
   - Registrar a aba ativa na própria URL nos editores de produto, módulo e aula.
   - Restaurar essa aba ao atualizar o navegador.
   - Preservar posição de rolagem durante salvamentos na mesma tela.

4. **Validação**
   - Cobrir a regra de permanência com verificações automatizadas onde aplicável.
   - Validar compilação, tipos e fluxos de criação/edição disponíveis no ambiente.

## Limites

- Botões explícitos de voltar e cancelar continuam funcionando normalmente.
- Redirecionamentos por registro inexistente, falta de permissão ou tipo de produto incompatível continuam ativos.
- Popups continuam fechando ao concluir suas próprias ações; esta mudança trata os formulários de página inteira.