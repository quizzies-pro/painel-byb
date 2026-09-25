# Editor profissional de apresentação de produtos

## Objetivo
Reorganizar a aba **Apresentação** de Cursos e Packs como um editor horizontal dividido: configurações à esquerda e uma prévia fiel à Members à direita. A identidade atual do Hub será preservada — Geist, preto e branco, bordas discretas e controles compactos.

## Resultado esperado
- Melhor aproveitamento da largura disponível, eliminando o vazio lateral da tela atual.
- Relação imediata entre cada alteração e seu resultado visual.
- Mesma experiência para Curso e Pack, respeitando as diferenças já existentes entre eles.
- Nenhuma alteração nas regras de acesso, venda, categorias, uploads ou publicação.

## Implementação

### 1. Estrutura horizontal da aba
- Manter cabeçalho, navegação por abas e ações superiores como estão.
- Transformar somente o conteúdo de **Apresentação** em duas áreas:
  - **Editor**, ocupando a maior parte da largura à esquerda.
  - **Prévia**, em painel lateral fixo durante a rolagem em telas amplas.
- Em telas menores, empilhar editor e prévia sem esconder controles ou cortar conteúdo.

### 2. Faixas de edição
Organizar o editor em faixas horizontais separadas por divisórias leves:
1. **Identidade visual** — URL/upload da imagem principal e logo opcional.
2. **Vídeo de apresentação** — somente para Cursos, mantendo Vimeo.
3. **Botão personalizado** — chave de ativação e, quando ativo, texto e endereço HTTPS.
4. **Categorias da vitrine** — seleção, posição, ordenação, edição, criação e exclusão atuais.

Os uploads continuarão otimizando imagens para WebP e usando os mesmos destinos e limites atuais.

### 3. Prévia visual dedicada
- Retirar as pequenas prévias de dentro do campo da imagem principal.
- Criar uma prévia única e mais clara no painel direito, alimentada em tempo real pelos dados ainda não salvos.
- Exibir os contextos **Banner**, **Card** e **Celular** por um seletor compacto.
- Representar imagem principal, logo ou título substituto, nome do produto, descrição curta e botão personalizado quando ativo.
- Aplicar os mesmos recortes previstos para a Members, especialmente `object-cover` e área central segura.
- Mostrar estados vazios úteis quando imagem ou logo ainda não existirem.

### 4. Ajustes nos componentes existentes
- Adaptar o componente de upload para funcionar como controle compacto no editor, sem duplicar prévias.
- Criar um componente isolado de prévia de apresentação, reutilizável por Cursos e Packs.
- Preservar o editor de categorias e seus diálogos, ajustando apenas sua composição visual para a nova faixa.
- Usar exclusivamente componentes e tokens já existentes no Hub.

### 5. Qualidade e validação
- Confirmar os estados de Pack, Curso, imagem ausente, logo ausente, botão ligado/desligado e vídeo exclusivo de Curso.
- Validar visualmente em desktop e celular, incluindo rolagem, campos longos e ausência de sobreposição.
- Testar upload/troca/remoção de imagem, edição do botão e categorias.
- Executar checagem de tipos, testes existentes e validar que a prévia compila sem erros.

## Limites desta etapa
- O trabalho fica restrito ao Hub.
- A Members não será alterada nesta etapa; a prévia seguirá o contrato visual já documentado para facilitar a aplicação posterior.
- Banco de dados e regras comerciais permanecem inalterados.

## Arquivos previstos
- `src/pages/admin/CourseForm.tsx`
- `src/components/CoverUpload.tsx`
- Novo componente de prévia em `src/components/admin/`
- `AGENTS.md` apenas para registrar a decisão estrutural do novo componente reutilizável
