# Plano — Entrega de Packs: Canva, Textual e Google Drive

## Objetivo

Preparar o Hub para criar e gerenciar Packs com um único formato permanente de entrega:

- **Canva:** galeria visual com capas e links de duplicação cadastrados no Hub;
- **Textual:** textos e roteiros escritos e organizados integralmente no Hub;
- **Google Drive:** biblioteca de vídeos, PDFs e outros arquivos importados da conta da empresa, com sincronização manual.

Cursos, módulos e aulas existentes permanecerão inalterados.

## Regras definidas

- Cada Pack escolhe apenas um formato: `canva`, `textual` ou `drive`.
- O formato é escolhido na criação e não pode ser trocado depois.
- Os três formatos compartilham coleções, ordenação, capas, descrições, publicação e controle de acesso.
- O conteúdo de um Pack só pode ser gerenciado pelas telas correspondentes ao seu formato.
- Matrícula, pagamento, prazo de acesso, listas de espera e categorias continuam vinculados ao produto principal.
- Packs continuam fora da venda e da vitrine até sua entrega na Members estar pronta e validada.

## Etapa 1 — Fundação segura no banco

1. Criar a identificação controlada dos formatos `canva`, `textual` e `drive`.
2. Adicionar o formato obrigatório aos produtos do tipo Pack, sem afetar Cursos existentes.
3. Proteger o formato contra alteração após a criação.
4. Criar coleções internas para organizar os conteúdos de cada Pack.
5. Criar itens comuns com título, descrição, capa, ordem, estado e vínculo ao Pack.
6. Criar dados específicos por formato:
   - Canva: link de duplicação e capa;
   - Textual: conteúdo formatado, texto de apoio e opção de cópia;
   - Drive: ID do arquivo, tipo, tamanho, miniatura e datas de sincronização.
7. Aplicar permissões e proteções para impedir conteúdo de Pack em Cursos ou formatos misturados.
8. Registrar alterações importantes no histórico administrativo.

## Etapa 2 — Criação do Pack no Hub

1. Exibir os três formatos somente quando o tipo de produto for Pack.
2. Explicar brevemente a finalidade de cada formato durante a escolha.
3. Gravar o formato na criação e exibi-lo como informação bloqueada na edição.
4. Manter dados gerais, categorias, checkout, listas de espera e acessos no cadastro principal.
5. Direcionar o administrador para o gerenciador correto depois que o Pack for criado.

## Etapa 3 — Gerenciador comum de Packs

1. Criar uma área própria de conteúdo, sem ampliar ainda mais o formulário principal do produto.
2. Permitir criar, renomear, ordenar e excluir coleções.
3. Permitir criar, editar, duplicar, ordenar, ocultar e excluir itens.
4. Exibir prévia de cada item antes da publicação.
5. Mostrar estado vazio, quantidade de itens e pendências do Pack.
6. Manter acesso integral por matrícula nesta primeira versão; não haverá liberação item a item.

## Etapa 4 — Pack Canva

1. Cadastrar título, descrição, capa, tags e link de template em cada design.
2. Validar o endereço informado e impedir links vazios ou inválidos.
3. Apresentar uma grade visual de designs no Hub.
4. Preparar para a Members o botão **Usar no Canva**, abrindo o link de duplicação.
5. Não exigir conexão com a API do Canva nesta versão: a conta da empresa gera os links e o Hub os organiza.
6. Preservar o arquivo original; o aluno recebe sua própria cópia pelo fluxo do Canva.

## Etapa 5 — Pack Textual

1. Criar editor interno para roteiros, textos, prompts e instruções.
2. Permitir título, resumo, conteúdo formatado, tags e exemplos.
3. Organizar os conteúdos por coleções e ordem definida no Hub.
4. Preparar ações de copiar conteúdo e copiar blocos na Members.
5. Salvar tudo no próprio sistema, sem dependência externa.

## Etapa 6 — Pack Google Drive

1. Conectar a conta Google Drive da empresa ao projeto quando iniciarmos a implementação.
2. Selecionar uma pasta raiz exclusiva para a biblioteca de Packs.
3. Criar no Hub um seletor de arquivos permitidos para cada Pack.
4. Implementar o botão **Sincronizar agora** para buscar nome, tipo, tamanho, miniatura e alterações.
5. Não sincronizar automaticamente nem espelhar toda a conta.
6. Fazer leitura, prévia e download por uma função protegida, validando login e matrícula antes do acesso.
7. Não usar links públicos do Drive como controle de acesso e não expor credenciais no navegador.
8. Tratar arquivos removidos, movidos ou sem permissão como indisponíveis, sem apagar silenciosamente o cadastro do Hub.

## Etapa 7 — Contrato para a Members

A Members deverá abrir a experiência conforme o produto:

```text
Curso -> experiência atual de módulos e aulas
Pack Canva -> galeria de designs e botão Usar no Canva
Pack Textual -> biblioteca de textos, leitura e cópia
Pack Drive -> biblioteca de arquivos, prévia e download protegido
Formato desconhecido -> estado seguro, sem liberar conteúdo
```

O contrato incluirá consultas, regras de acesso, estados vazios, erros e comportamento em celular e computador.

## Etapa 8 — Validação e liberação

1. Confirmar que o Curso atual e seus módulos/aulas continuam intactos.
2. Testar criação e bloqueio permanente dos três formatos.
3. Testar organização, ordenação e publicação de conteúdo.
4. Testar aluno com matrícula ativa, expirada, cancelada e sem matrícula.
5. Testar links de duplicação do Canva.
6. Testar sincronização, prévia e download do Drive sem revelar links privados.
7. Testar visualização e cópia de conteúdo Textual.
8. Liberar venda e vitrine de Packs somente após a View correspondente estar funcional na Members.

## Ordem de implementação

1. Banco e proteções dos formatos.
2. Escolha do formato na criação do Pack.
3. Gerenciador comum e coleções.
4. Cadastro Canva.
5. Editor Textual.
6. Conexão e sincronização Google Drive.
7. Contrato atualizado para a Members.
8. Views na Members e testes completos.
9. Liberação comercial dos Packs.

## Limites desta fase

- Canva será entregue por capas e links de template; não haverá edição do Canva dentro da Members.
- Drive usará a conta da empresa, não a conta Google individual de cada aluno.
- A sincronização do Drive será manual.
- Um Pack não poderá combinar formatos.
- A implementação da apresentação final na Members depende de edição no projeto separado da área de membros.
