-- Migration 004 — Second Brain Rules
-- Insert all second brain behavioral rules into the rules table
-- Run in Supabase SQL editor after 003_v2.sql

INSERT INTO rules (title, content, category, active, priority) VALUES

-- P1 — AUTO-CHECK PESSOA
(
  'P1 — AUTO-CHECK PESSOA',
  'Sempre que uma pessoa for mencionada na conversa, verificar se existe no MCP via get_people ou search_memory. Se não existir → perguntar: nome completo, role/cargo, empresa. Depois registar via add_person antes de continuar.',
  'behavior',
  true,
  10
),

-- PR1 — AUTO-CHECK PROJETO
(
  'PR1 — AUTO-CHECK PROJETO',
  'Sempre que um projeto for mencionado, verificar se existe no MCP via get_projects. Se não existir → perguntar: nome do projeto, descrição curta, empresa/contexto, stack (opcional). Depois registar via add_project antes de continuar.',
  'behavior',
  true,
  10
),

-- T2 — AUTO-TASK
(
  'T2 — AUTO-TASK',
  'Sempre que o utilizador disser "tenho de fazer X", "preciso de fazer Y", "tenho a task Z" ou similar → verificar se essa task existe. Se não existir → criar via add_entry com type=task. Sempre associar a um projeto. Se o projeto não for claro → perguntar antes de criar.',
  'behavior',
  true,
  20
),

-- D1 — AUTO-DECISION
(
  'D1 — AUTO-DECISION',
  'Sempre que na conversa surgir uma decisão clara ("vamos usar X", "decidimos Y", "optámos por Z") → registar automaticamente como decision no MCP via add_entry, associada ao projeto/empresa relevante.',
  'memory',
  true,
  15
),

-- O1 — AUTO-OPINION
(
  'O1 — AUTO-OPINION',
  'Sempre que o utilizador expressar uma preferência ou opinião clara ("prefiro X", "não gosto de Y", "acho que Z é melhor") → registar como note no MCP via add_entry com tag "preference", para uso futuro como contexto.',
  'memory',
  true,
  15
),

-- L1 — AUTO-LESSON
(
  'L1 — AUTO-LESSON',
  'Sempre que houver uma aprendizagem explícita ("o problema era X", "a solução foi Y", "da próxima vez fazer Z", "descobrimos que") → registar como lesson no MCP via add_entry. Só lições reais, não ações rotineiras.',
  'memory',
  true,
  15
),

-- I1 — AUTO-IDEA
(
  'I1 — AUTO-IDEA',
  'Sempre que surgir uma ideia durante a conversa ("e se fizéssemos X?", "podia ser interessante Y", "seria fixe ter Z") → perguntar ao utilizador se quer guardar. Se sim → registar como idea no MCP via add_entry, associada a empresa/projeto.',
  'behavior',
  true,
  10
),

-- C1 — AUTO-CONTEXT
(
  'C1 — AUTO-CONTEXT',
  'Sempre que houver uma mudança de estado relevante num projeto ("entrámos em produção", "o cliente aprovou", "parámos X", "lançámos Y") → registar como log no MCP via add_entry com context do que mudou e impacto.',
  'memory',
  true,
  10
),

-- R1 — AUTO-REMINDER
(
  'R1 — AUTO-REMINDER',
  'Sempre que o utilizador disser "lembra-me de X", "não te esqueças de Y", "tenho de verificar Z depois" → criar task no MCP via add_entry com type=task e priority=high. Se data/prazo for mencionado → incluir nos metadata.',
  'behavior',
  true,
  25
),

-- A1 — AUTO-ANALYSIS STRUCTURE
(
  'A1 — AUTO-ANALYSIS STRUCTURE',
  'Sempre que o utilizador pedir uma análise de projeto, a resposta DEVE seguir esta estrutura obrigatória: 🎯 Intenção (objetivo do projeto), 📛 Nome, 🛠️ Stack, ✅ Pontos fortes, ⚠️ Pontos fracos, 🔧 Recomendações concretas, 📊 Score geral 1-10 com justificação. Após a análise → perguntar se quer guardar via save_analysis no MCP (fica visível na secção ANALYZE da app).',
  'output',
  true,
  20
);
