

# Plano de Implementação — TTS Academy Admin Panel

## Visão Geral
Painel administrativo completo para a área de membros TTS Academy, com design system inspirado na Vercel (preto e branco, minimalista, fontes Geist Sans/Mono). Dividido em **3 fases** de implementação.

---

## Design System
- **Cores**: Fundo preto (#000), cards cinza escuro (#111), bordas (#333), texto branco (#fff) e cinza (#888)
- **Fontes**: Geist Sans para corpo, Geist Mono para dados/códigos
- **Componentes**: Estilo limpo, bordas finas, sem sombras pesadas, badges minimalistas
- **Vídeos**: Apenas reprodução via embed do Vimeo (sem upload de vídeo)

---

## FASE 1 — Autenticação + Banco de Dados + CRUD de Conteúdo

### 1.1 Autenticação Admin
- Login com email/senha (tela minimalista estilo Vercel)
- Tela "Esqueci minha senha"
- Super Admin seed: gabrielschuberts@gmail.com / @Gabriel1989
- Tabela `user_roles` com enum (super_admin, admin_operacional)
- Proteção de rotas admin

### 1.2 Estrutura do Banco de Dados (Supabase)
Criar todas as tabelas com RLS:
- **courses** — id, title, slug, short_description, full_description, cover_url, banner_url, trailer_url (Vimeo), category, instructor_name, status (draft/published/hidden/archived), featured, access_type, access_days, ticto_product_id, tags, allow_comments, has_certificate, is_free, language, seo_title, seo_description, display_order, created_at, updated_at
- **course_modules** — id, course_id, title, description, cover_url, sort_order, status, release_type (immediate/manual/drip), release_days, is_required, created_at, updated_at
- **lessons** — id, course_id, module_id, title, slug, short_description, content_html, lesson_type (video/text/audio/download/hybrid), video_url (Vimeo), audio_url, thumbnail_url, duration_seconds, is_preview, is_required, allow_comments, allow_download, status, release_type, release_days, sort_order, tags, author, estimated_time, published_at, created_at, updated_at
- **lesson_materials** — id, course_id, module_id, lesson_id, title, description, file_url, external_link, material_type, sort_order, is_visible, created_at

Storage buckets: course-covers, module-covers, lesson-thumbnails, materials

### 1.3 Layout Admin
- Sidebar de navegação com todos os módulos
- Header com nome do admin e logout
- Layout responsivo

### 1.4 CRUD de Cursos
- Listagem com filtros (status, categoria, gratuito/pago) e busca
- Formulário de criação/edição com todos os campos
- Upload de capa/banner via Supabase Storage
- Campo de URL do Vimeo para trailer
- Ações: publicar, despublicar, arquivar, duplicar, reordenar (drag & drop)

### 1.5 CRUD de Módulos
- Listagem filtrada por curso
- Formulário com campos: título, descrição, capa, ordem, status, regra de liberação (imediata/manual/drip)
- Reordenação dentro do curso

### 1.6 CRUD de Aulas
- Listagem com filtros por curso, módulo, status e tipo
- Formulário completo: título, slug, conteúdo (editor de texto rico), tipo de aula, URL do Vimeo, thumbnail, duração, materiais
- Mover aula entre módulos
- Upload de materiais complementares (PDF, planilhas, etc.)

---

## FASE 2 — Alunos + Pagamentos + Matrículas

### 2.1 Tabelas adicionais
- **students** — id, name, email (unique), phone, cpf, status (active/blocked/pending/canceled), origin, last_login_at, created_at, updated_at
- **payments** — id, external_payment_id, external_order_id, student_id, course_id, product_name, product_id, amount, currency, payment_method, installments, status (pending/approved/refunded/canceled/chargeback/expired/failed), coupon_code, affiliate_name, purchased_at, approved_at, canceled_at, raw_payload, origin, created_at, updated_at
- **enrollments** — id, student_id, course_id, origin (purchase/manual/bonus/test), status (active/expired/canceled/blocked), started_at, expires_at, created_by, notes, created_at, updated_at

### 2.2 Gestão de Alunos
- Listagem com filtros (status, curso, pagamento, data)
- Busca por nome, email, telefone, ID de compra
- Página individual do aluno: resumo, matrículas, pagamentos, histórico
- Ações: editar, ativar, bloquear, liberar curso manualmente, remover acesso, redefinir senha, reenviar email

### 2.3 Gestão de Pagamentos
- Listagem com filtros por status, produto, período
- Detalhes do pagamento com payload bruto
- Ações manuais: reprocessar, forçar sincronização, observações internas

### 2.4 Gestão de Matrículas
- Listagem separada de alunos (1 aluno = N matrículas)
- Criar matrícula manual (bônus, teste)
- Revogar, renovar, bloquear, reativar acesso
- Alterar data de expiração

---

## FASE 3 — Dashboard + Logs + Webhooks + Configurações

### 3.1 Dashboard
- Cards: total alunos, cursos, vendas, receita total/mensal, alunos ativos/bloqueados, aulas/cursos publicados, pagamentos pendentes
- Listas rápidas: últimos alunos, vendas, pagamentos pendentes, cursos editados
- Alertas: aluno sem acesso após pagamento, curso sem módulos, módulo sem aulas
- Gráficos: vendas/alunos por período, receita por curso, pagamentos por status

### 3.2 Webhook Ticto (Edge Function)
- Endpoint para receber eventos da Ticto
- Processar: compra criada, pagamento aprovado/pendente/recusado, reembolso, chargeback
- Lógica automática: criar aluno + pagamento + matrícula
- Segurança: validação de assinatura, prevenção de duplicatas
- Tabela **webhook_logs**: payload, status de processamento, erros

### 3.3 Logs e Histórico
- Tabela **activity_logs**: tipo, entidade, ator, timestamp, detalhes
- Tela de visualização com filtros
- Registro automático de todas as ações administrativas

### 3.4 Configurações
- Configurações gerais: nome, logo, favicon, timezone
- Configurações de conteúdo: cursos em destaque, comentários, certificados
- Configurações de acesso: política de expiração, bloqueio em reembolso/chargeback
- Configurações de integração: URL webhook, token Ticto
- Gestão de admins: criar, editar, ativar/desativar, definir permissões

---

## Começamos pela Fase 1
Após aprovação, implementamos: autenticação → banco de dados → layout admin → CRUD cursos → CRUD módulos → CRUD aulas, tudo com design Vercel-style.

