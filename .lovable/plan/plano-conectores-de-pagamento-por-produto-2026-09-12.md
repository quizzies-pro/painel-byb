# Plano — Conectores de pagamento por produto

## Objetivo
Permitir que cada produto tenha um ou mais webhooks de venda configurados pelo painel. Uma compra aprovada cria ou localiza o aluno, envia um link seguro de primeiro acesso e libera somente o produto comprado. Na área de membros, o aluno vê todo o catálogo, com seus produtos disponíveis e os demais bloqueados com opção de compra.

## Fluxo final
```text
Plataforma de pagamento
        ↓ webhook assinado
Conector do produto no painel
        ↓ validação + identificação da venda
Aluno + pagamento + matrícula
        ↓
E-mail com link seguro de acesso
        ↓
Área de membros: comprado = liberado | não comprado = bloqueado
```

## 1. Estrutura dos conectores
- Criar uma estrutura própria para vincular cada endpoint a produtos externos e produtos da Dive.
- Permitir vários códigos externos apontando para o mesmo produto e um produto sendo vendido em plataformas diferentes.
- Manter por conector: nome, plataforma, URL exclusiva, status, segredo, mapeamento dos campos, eventos aceitos e data do último recebimento.
- Substituir o vínculo exclusivo atual da Ticto por um mapeamento genérico, preservando compatibilidade com os dados existentes.
- Impedir vínculos duplicados entre plataforma, endpoint e código externo do produto.

## 2. Configuração pelo painel administrativo
- Transformar a área de Webhooks em uma tela de conectores por produto.
- Criar um assistente com:
  1. nome e plataforma;
  2. seleção do produto da Dive;
  3. código do produto na plataforma de pagamento;
  4. correspondência dos campos recebidos;
  5. eventos de compra aprovada, pendente, reembolso, chargeback e cancelamento;
  6. geração da URL e configuração do segredo;
  7. teste com uma amostra de webhook antes de ativar.
- Exibir estado do conector, produto relacionado, última entrega, erros e botão para copiar a URL.
- Permitir editar, pausar, testar e excluir somente conforme as permissões administrativas.
- Manter uma caixa de eventos com filtros e detalhes úteis, ocultando dados sensíveis.

## 3. Recebimento seguro e processamento
- Consolidar os dois receptores atuais em um único receptor genérico para evitar regras duplicadas.
- Validar método, tamanho, formato e campos obrigatórios de toda requisição.
- Exigir segredo ou assinatura em todo conector; conectores sem proteção não poderão ser ativados.
- Comparar assinaturas de forma segura e adicionar suporte a validadores específicos quando uma plataforma exigir seu próprio padrão.
- Não salvar tokens, assinaturas, CPF completo ou outros dados sensíveis nos registros de eventos.
- Criar idempotência por conector + identificador do evento/transação, impedindo matrículas e pagamentos duplicados em reenvios.
- Registrar cada etapa como recebido, validado, processado, ignorado ou falhou, com possibilidade segura de reprocessamento.

## 4. Regra única de venda e acesso
- Normalizar qualquer webhook para um formato interno comum: evento, transação, produto externo, comprador, valor, moeda e data.
- Em compra aprovada:
  - localizar o conector e seu produto;
  - localizar ou criar o aluno pelo e-mail normalizado;
  - localizar ou criar a conta de acesso usando o mesmo identificador do aluno;
  - registrar ou atualizar o pagamento;
  - criar ou reativar a matrícula do produto correto;
  - calcular validade conforme o tipo e os dias de acesso do produto;
  - enviar o link seguro para o aluno definir o acesso.
- Se o aluno já existir, apenas acrescentar o novo produto e preservar os acessos anteriores.
- Em reembolso, chargeback ou cancelamento, atualizar o pagamento e aplicar a regra configurada à matrícula daquele produto, sem afetar os demais.
- Eventos pendentes registram a venda, mas não liberam conteúdo.
- Produtos externos sem vínculo ficam em erro de configuração e nunca liberam um produto por aproximação de nome.

## 5. Conta do aluno e primeiro acesso
- Usar convite/link de definição de senha enviado pelo Supabase, sem criar ou armazenar senha temporária.
- Garantir que o registro do aluno use o mesmo identificador da conta autenticada, corrigindo o bloqueio atual entre compra e login.
- Tornar o processamento repetível: webhooks reenviados não enviam vários convites nem criam contas duplicadas.
- Prever reenvio manual do link pelo painel e estados claros: convite enviado, conta ativada e falha no envio.

## 6. Área de membros e catálogo
- A área de membros será preparada para o projeto do aluno conectado ao mesmo banco; este projeto atual permanece como painel administrativo.
- Mostrar todos os produtos publicados em caixas de tamanho fixo.
- Produto com matrícula ativa: botão para acessar e conteúdo liberado conforme módulos/aulas.
- Produto sem matrícula: visual bloqueado, cadeado e botão de compra usando a URL comercial cadastrada no produto.
- Produto expirado, cancelado ou bloqueado: estado correspondente, sem acesso ao conteúdo.
- Garantir que a proteção real esteja no banco: ocultar ou mostrar um botão nunca substitui as regras de acesso.
- Exibir somente pagamentos, matrículas, mensagens e avaliações pertencentes ao aluno autenticado.

## 7. Segurança e permissões
- Manter segredos fora das respostas do navegador e impedir que administradores operacionais consultem o valor original.
- Reservar criação, troca e exclusão de segredos ao super admin; permissões operacionais poderão acompanhar eventos sem revelar credenciais.
- Revisar as regras de acesso das novas tabelas, concedendo apenas o mínimo necessário ao painel, ao aluno e ao processador de webhooks.
- Não confiar em nome de produto, valor ou status enviados pelo navegador.
- Adicionar limites contra abuso, rejeição de eventos antigos quando aplicável e trilha de auditoria administrativa.

## 8. Implantação por etapas
1. **Base segura:** tabelas de conectores, mapeamentos e idempotência; migração do vínculo Ticto existente.
2. **Processador genérico:** validação, normalização, pagamento, aluno, conta, matrícula e cancelamentos.
3. **Painel:** assistente de configuração, teste, monitoramento e reprocessamento.
4. **Área de membros:** catálogo liberado/bloqueado e proteção por matrícula.
5. **Validação:** testes de compra nova, aluno existente, segundo produto, evento duplicado, pendência, reembolso, assinatura inválida e produto não mapeado.

## Detalhes técnicos
- Novas tabelas públicas terão concessões explícitas, RLS e índices no mesmo conjunto de alterações.
- O receptor externo ficará público apenas no transporte; cada chamada será autenticada pela assinatura do conector e processada internamente com privilégios controlados.
- O payload será validado antes de qualquer gravação e convertido para um contrato interno independente da plataforma.
- O código específico de cada plataforma ficará isolado em adaptadores; a regra de matrícula será única e compartilhada.
- A entrega da área do aluno será aplicada no novo projeto conectado ao mesmo Supabase quando ele estiver disponível; o banco e o contrato de acesso serão preparados nesta implementação.

## Critérios de aceite
- O admin conecta um código de produto externo a um produto da Dive sem alterar código.
- Uma compra aprovada cria o aluno, envia um único link de acesso e libera apenas o produto comprado.
- Uma segunda compra no mesmo e-mail adiciona outro produto à mesma conta.
- Reenvios do mesmo evento não duplicam pagamento, aluno, convite ou matrícula.
- Reembolso ou chargeback afeta somente o produto daquela venda.
- O aluno vê todos os produtos publicados, mas só abre os que possui com matrícula ativa.
- Nenhum segredo aparece para alunos ou administradores operacionais, e eventos falsos ou sem assinatura são rejeitados.
