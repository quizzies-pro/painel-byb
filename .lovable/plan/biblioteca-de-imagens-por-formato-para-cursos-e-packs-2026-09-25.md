# Biblioteca de imagens por formato para Cursos e Packs

## Objetivo
Transformar a área **Apresentação** do Hub em uma biblioteca de imagens específicas por uso e proporção. Cada produto poderá receber arquivos diferentes para capas e banners, e a Members escolherá a chave adequada ao contexto onde a imagem será exibida.

## Estrutura definida

### Capas do produto
- **16:9** — paisagem ampla
- **4:3** — paisagem compacta
- **1:1** — quadrada
- **3:4** — retrato
- **9:16** — retrato vertical

### Banners da hero
- **16:9** — hero ampla
- **4:3** — hero compacta

Os sete arquivos serão independentes. Enviar ou trocar uma proporção não recortará nem substituirá as outras.

## 1. Banco e transição segura
- Adicionar ao produto sete endereços opcionais e explícitos: cinco de capa e dois de banner.
- Manter `cover_url` e `banner_url` durante a transição para não quebrar o Hub nem a Members atual.
- Migrar os produtos existentes:
  - preencher a nova capa 16:9 com `cover_url`;
  - preencher o novo banner 16:9 com o `banner_url` existente quando houver e, caso contrário, com `cover_url`;
  - deixar os demais formatos vazios, cobertos pelo fallback temporário.
- Preservar as políticas atuais: equipe administra os dados, e a Members mantém a leitura permitida pelo contrato existente.
- Atualizar os tipos gerados do Supabase após a migração.

## 2. Editor de apresentação no Hub
- Substituir o campo único **Imagem principal** por duas faixas claras: **Capas do produto** e **Banners da hero**.
- Exibir cada proporção em uma peça compacta com:
  - nome e proporção;
  - recomendação de dimensões;
  - miniatura no formato real;
  - upload/troca, visualização e remoção;
  - indicação visível quando estiver usando fallback.
- Manter upload de JPG, PNG e WebP, limite atual e otimização para WebP.
- Salvar em pastas organizadas por produto, família e proporção para evitar colisões e facilitar manutenção.
- Preservar logo, vídeo, botão, categorias, textos e regras comerciais sem alterações.

## 3. Prévia profissional
- Atualizar a prévia lateral para escolher separadamente o contexto e a proporção.
- Para **Capa**, oferecer 16:9, 4:3, 1:1, 3:4 e 9:16.
- Para **Banner**, oferecer 16:9 e 4:3.
- Mostrar exatamente o arquivo que a Members receberá, incluindo aviso discreto quando a prévia vier de fallback.
- Continuar usando o estado ainda não salvo, para que cada troca apareça imediatamente.

## 4. Regra de fallback temporário
A seleção será determinística e limitada à mesma família sempre que possível:

- **Capa solicitada**: formato exato → capa de proporção mais próxima → capa 16:9 → `cover_url` legado.
- **Banner solicitado**: formato exato → outro banner disponível → `banner_url` legado → capa equivalente → capa 16:9 → `cover_url` legado.

O Hub não bloqueará a publicação por formatos ausentes. Ele mostrará quais imagens são próprias e quais dependem de fallback, permitindo completar a biblioteca gradualmente.

## 5. Contrato para a Members
- Documentar nomes, finalidade e proporção de cada novo campo.
- Fornecer uma função/resolvedor compartilhável com a ordem de fallback, evitando regras diferentes em cada tela.
- A Members informará duas coisas ao pedir uma imagem:
  1. uso: `cover` ou `hero`;
  2. proporção: `16:9`, `4:3`, `1:1`, `3:4` ou `9:16`, conforme permitido pelo uso.
- O resolvedor retornará a melhor imagem disponível e se ela é específica ou fallback.
- `logo_url`, textos, botão e regras de acesso permanecem independentes das imagens.
- A remoção futura dos campos legados só poderá ocorrer depois que a Members estiver usando o novo contrato e todos os produtos relevantes estiverem completos.

## 6. Compatibilidade no próprio Hub
- Manter a listagem administrativa funcionando com capa 16:9 e fallback para `cover_url`.
- Atualizar a conferência de prontidão dos Packs para reconhecer a nova capa 16:9 ou o fallback legado.
- Não alterar capas de módulos, aulas, coleções ou itens de Pack; esta etapa vale apenas para a apresentação do produto Curso/Pack.

## 7. Validação
- Testar Curso e Pack com os sete arquivos próprios.
- Testar produto legado, produto parcialmente preenchido e produto sem imagem.
- Confirmar upload, troca, remoção, otimização e persistência de cada proporção sem afetar as demais.
- Conferir a resolução de todos os fallbacks e a indicação correspondente na prévia.
- Validar a aba em desktop e celular, sem sobreposição ou rolagem lateral.
- Executar checagem de tipos, testes existentes, verificação de compilação e inspeção visual do editor.

## Limites desta etapa
- O Hub, o banco compartilhado e o contrato da Members serão preparados.
- A implementação visual das telas da Members continua no projeto separado; este plano não altera esse aplicativo.
- Nenhuma regra de matrícula, venda, lista de espera, conteúdo ou autenticação será modificada.

## Resultado esperado
O Hub terá sete uploads independentes por produto, organizados por função e proporção. A Members poderá escolher dinamicamente a imagem correta para cada posição, enquanto produtos antigos e cadastros incompletos continuarão funcionando por fallback até que todas as artes sejam enviadas.
