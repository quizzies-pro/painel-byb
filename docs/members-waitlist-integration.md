# Integração da lista de espera na Members

## Objetivo
Permitir que um aluno autenticado entre ou saia da lista de espera de um produto sem reenviar nome, e-mail ou telefone.

## Descobrir o estado
Chame a função `get_product_waitlist_state` com `_waitlist_id`.

A resposta informa:
- dados públicos da lista e do consentimento;
- `waitlist_status`;
- `product_available_for_sale`;
- `membership_status` (`active`, `withdrawn` ou vazio);
- `phone_missing`;
- `has_active_enrollment`.

## Entrar na lista
Chame `join_product_waitlist` com:
- `_waitlist_id`: ID cadastrado no Dive | Hub;
- `_consent`: `true`, somente após aceite explícito;
- `_source`: `members`.

Nome, e-mail e telefone são sempre obtidos do aluno autenticado. Nunca envie esses dados como argumentos.

## Sair da lista
Chame `leave_product_waitlist` com `_waitlist_id`.

## Estados da interface
- Produto liberado: mostrar compra, não inscrição.
- Matrícula ativa: mostrar acesso ao produto.
- Lista encerrada: botão desativado.
- Telefone ausente: solicitar atualização do cadastro antes do aceite.
- Já inscrito: mostrar confirmação e opção de sair.
- Elegível: mostrar texto do consentimento, link da política e botão para entrar.

## Segurança
- As três funções aceitam apenas usuários autenticados.
- O aluno e seus dados são determinados pela sessão.
- As tabelas não permitem que alunos alterem inscrições diretamente.
- O ID da lista é obtido no detalhe da lista no Dive | Hub.
