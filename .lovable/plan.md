# Mídia e apresentação unificadas para Cursos e Packs

## Objetivo
Centralizar no Dive | Hub tudo o que define a apresentação de um produto na Members, usando o mesmo modelo para Curso e Pack. A Members apenas renderizará os dados cadastrados, sem exigir alterações manuais a cada novo produto.

## Estrutura final de apresentação
Cada produto terá:

- **Imagem principal**: única imagem horizontal usada como banner, capa da vitrine e miniatura, com recorte automático conforme o espaço.
- **Título**: texto principal do produto.
- **Logo opcional**: quando ausente, a Members usa o título em texto.
- **Descrição curta**: chamada da vitrine.
- **Descrição completa**: conteúdo da página do produto.
- **Botão opcional e personalizável**: ativar/desativar, texto e endereço.
- **Vídeo de apresentação opcional**: mantido para Cursos; os vídeos explicativos dos Packs continuam no gerenciador de conteúdo.

A capa de login individual deixa de fazer parte do produto, pois o acesso é único para toda a plataforma.

## Decisão para desktop e celular
Usar uma imagem principal em **16:9**, recomendada em **1600 × 900 px**, com assunto e textos importantes dentro da área central segura. O Hub mostrará orientações claras e a Members aplicará recorte proporcional (`cover`) nos cards e banners.

No envio, a imagem será validada e otimizada para reduzir peso sem exigir uma segunda versão móvel. A prévia no Hub mostrará os recortes de banner e card antes de salvar.

## Execução no Hub

### 1. Simplificar o cadastro
- Renomear a área para **Apresentação** e reunir imagem, título, logo, descrições e botão.
- Remover da interface os campos separados **Banner** e **Capa do login**.
- Manter apenas uma imagem principal para Cursos e Packs.
- Manter a logo como opcional.
- Preservar os controles específicos de Curso e Pack em suas áreas atuais.

### 2. Criar o botão personalizável
Adicionar ao produto:

- botão ativo/inativo;
- texto do botão;
- endereço de destino;
- validação para exigir texto e endereço HTTPS quando estiver ativo.

O botão será apenas de apresentação. Ele não poderá ignorar matrícula, autenticação ou regras de acesso; a Members continuará protegendo o conteúdo separadamente.

### 3. Melhorar o envio da imagem
- Aceitar JPG, PNG e WebP.
- Validar formato e tamanho antes do envio.
- Redimensionar imagens muito grandes e otimizar o arquivo para web.
- Salvar no depósito público já usado pelas capas de produtos.
- Exibir fallback quando o arquivo estiver ausente ou inválido.
- Mostrar prévias de banner e card com o mesmo arquivo.

### 4. Preservar os produtos existentes
- Usar `cover_url` como a imagem principal oficial.
- Manter `logo_url` como logo opcional.
- Não apagar imediatamente `banner_url` e `login_cover_url`; eles ficam preservados no banco durante a transição, mas deixam de aparecer no Hub e de fazer parte do novo contrato.
- Não alterar módulos, aulas, coleções, itens, vídeos, matrículas, pagamentos ou categorias.
- O Curso **Influencer.ai** e o Pack **Capas criativas** manterão suas capas atuais até eventual substituição manual.

### 5. Banco e segurança
- Adicionar campos próprios para ativação, texto e endereço do botão.
- Validar os dados do botão no banco, além da validação no formulário.
- Manter as políticas de acesso existentes; nenhuma informação privada será tornada pública.
- Atualizar os tipos gerados após a migração.

## Contrato para a Members
A Members deverá:

1. Usar `cover_url` como fonte única da imagem principal em Curso e Pack.
2. Aplicar recorte responsivo para banner, cards e celular.
3. Usar `logo_url` quando preenchida; caso contrário, mostrar o título.
4. Exibir descrição curta na vitrine e descrição completa na página do produto.
5. Exibir o botão somente quando estiver ativo e com dados válidos.
6. Continuar validando matrícula e disponibilidade antes de abrir conteúdo protegido.
7. Ignorar `banner_url` e `login_cover_url` no novo fluxo.
8. Preservar as Views específicas de Curso e dos Packs Canva, Textual e Drive.

## Validação
- Criar e editar um Curso e um Pack com a mesma estrutura de apresentação.
- Conferir upload, otimização, troca, remoção e fallback da imagem.
- Conferir prévias de banner e card em desktop e celular.
- Conferir produto com e sem logo.
- Conferir botão desligado, ligado corretamente e bloqueado com dados inválidos.
- Confirmar que nenhuma regra de matrícula, venda, lista de espera ou conteúdo foi alterada.
- Atualizar o contrato da Members e o roadmap com o que permanecer pendente no projeto separado.

## Resultado esperado
O cadastro de novos produtos ficará concentrado no Hub e exigirá apenas uma imagem principal, textos, logo opcional e botão opcional. Curso e Pack compartilharão essa base, enquanto suas formas de entrega continuarão independentes.
