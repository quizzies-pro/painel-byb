# Plano — Prévia privada, vitrine e venda por produto

## Objetivo
Permitir construir e revisar um produto dentro da área de membros antes do lançamento, sem mostrá-lo nem vendê-lo aos clientes. Quando um aluno tiver uma matrícula ativa — por compra ou liberação manual — o produto continuará aparecendo e poderá ser acessado mesmo que tenha sido retirado da vitrine.

## Estado atual confirmado
- O painel já possui status do produto (`Rascunho`, `Publicado`, `Oculto` e `Arquivado`), destaque, gratuidade e endereço de checkout.
- A área de membros lista somente produtos com status `Publicado`.
- A página interna exige matrícula ativa e também exige que o produto esteja `Publicado`.
- O único produto atual está publicado e possui uma matrícula ativa ligada ao super admin.
- Não há hoje controles independentes para “mostrar na vitrine” e “permitir venda”.

## Regra proposta
A quantidade de alunos não controlará a publicação. Isso evita que um produto apareça acidentalmente quando uma segunda matrícula for criada.

Cada produto terá três controles separados:

1. **Status do conteúdo**
   - Rascunho: em construção.
   - Publicado: conteúdo pronto para uso.
   - Oculto/Arquivado: estados administrativos já existentes.

2. **Exibir na vitrine**
   - Ligado: alunos sem acesso também enxergam a caixa do produto na tela principal.
   - Desligado: somente alunos matriculados e o super admin enxergam o produto.

3. **Disponível para venda**
   - Ligado: alunos sem acesso veem o botão de compra, desde que exista um endereço de checkout.
   - Desligado: o produto pode aparecer como “Em breve”, mas não abre uma página de venda.

A prioridade será:

```text
Matrícula ativa → sempre mostra e libera o produto
Super admin → pode visualizar a prévia antes do lançamento
Sem matrícula + produto na vitrine → mostra bloqueado
Sem matrícula + fora da vitrine → não mostra
Venda ligada + checkout válido → mostra botão de compra
Venda desligada → nunca envia o cliente ao checkout
```

## Alterações no Dive | Hub
- Adicionar em **Produto → Configurações** os controles:
  - `Exibir na vitrine`;
  - `Disponível para venda`;
  - campo do endereço de checkout junto ao controle de venda.
- Criar textos curtos abaixo dos controles explicando quem verá o produto.
- Impedir a ativação da venda sem um endereço de checkout válido.
- Mostrar na lista de produtos indicadores claros: `Em construção`, `Prévia privada`, `Na vitrine`, `À venda` e `Fora de venda`.
- Manter a conexão do webhook responsável por identificar a compra e liberar a matrícula; o endereço comercial do produto será a fonte usada pelo botão da vitrine.

## Alterações no banco e segurança
- Adicionar ao produto dois campos booleanos independentes: visibilidade na vitrine e disponibilidade para venda.
- Novos produtos começarão fora da vitrine e fora de venda, evitando lançamentos acidentais.
- Preservar a visibilidade do produto atual durante a atualização.
- Ajustar a leitura segura para permitir um produto quando ocorrer pelo menos uma destas condições:
  - ele está publicado e visível na vitrine;
  - o aluno autenticado possui matrícula ativa nele;
  - o usuário autenticado é administrador autorizado.
- A matrícula continuará sendo a autorização real de acesso; esconder ou mostrar a caixa não substituirá a proteção do conteúdo.

## Alterações na área de membros Dive Club
- Atualizar a tela principal para combinar produtos da vitrine com os produtos já adquiridos pelo aluno.
- Para o super admin, mostrar também produtos em construção com o selo `Prévia`.
- Atualizar a página interna para:
  - permitir acesso de qualquer aluno com matrícula ativa, mesmo se o produto estiver fora da vitrine;
  - permitir prévia ao super admin;
  - continuar bloqueando qualquer outro usuário.
- Manter os tamanhos atuais das caixas e o layout existente.
- Estados da caixa:
  - `Seu produto` + botão `Acessar produto`;
  - `Conheça` + botão de compra quando a venda estiver ligada;
  - `Em breve` quando estiver visível, mas fora de venda;
  - `Prévia` somente para o super admin.

## Fluxo de preparação e lançamento
```text
Criar produto
  ↓
Rascunho + fora da vitrine + fora de venda
  ↓
Super admin revisa na área de membros
  ↓
Publicar conteúdo
  ↓
Opcional: exibir como “Em breve”
  ↓
Cadastrar checkout e ativar venda
  ↓
Compra aprovada → webhook cria matrícula
  ↓
Produto aparece como “Seu produto” para o comprador
```

## Validação
- Produto em construção aparece para o super admin, mas não para um aluno comum.
- Produto fora da vitrine continua aparecendo e abrindo para quem já possui matrícula ativa.
- Produto visível e fora de venda mostra `Em breve` sem link comercial.
- Produto visível e à venda abre o checkout correto.
- Compra aprovada mantém o fluxo existente de aluno, pagamento e matrícula.
- Desligar a vitrine ou a venda não remove acesso de compradores.
- Um aluno sem matrícula não consegue abrir o conteúdo por endereço direto.

## Escopo entre os dois projetos
- Neste projeto: controles administrativos, dados e regras de segurança.
- No projeto **Dive Club**: exibição da vitrine, estado de prévia e regra de acesso visual.
- As duas partes usarão o mesmo banco para que as alterações feitas no Dive | Hub reflitam na área de membros.
