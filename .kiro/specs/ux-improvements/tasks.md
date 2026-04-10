# Tarefas de Implementação — UX Improvements

## Tarefa 1: Configurar dependências de syntax highlighting

- [x] 1.1 Instalar `highlight.js` e `marked-highlight` como dependências do projeto
- [x] 1.2 Instalar `fast-check` como dependência de desenvolvimento para testes de propriedade

## Tarefa 2: Implementar realce de sintaxe no MarkdownPreview

- [x] 2.1 Criar configuração do `marked` com `marked-highlight` e `highlight.js` em `components/MarkdownPreview.tsx`
- [x] 2.2 Importar tema CSS escuro do highlight.js (ex: `github-dark`) no componente ou no `index.css`
- [x] 2.3 Implementar callback de highlight com try/catch para fallback gracioso quando a linguagem é desconhecida ou ocorre erro
- [x] 2.4 Verificar que blocos sem linguagem especificada são renderizados como texto simples (sem highlighting)

## Tarefa 3: Criar módulo de predefinições de filtro

- [x] 3.1 Criar ficheiro `lib/filterPresets.ts` com a interface `FilterPreset` e a constante `FILTER_PRESETS` contendo as 3 predefinições obrigatórias (Node.js, Assets estáticos, Ficheiros minificados)
- [x] 3.2 Implementar função utilitária `mergePatterns(existing: string[], newPatterns: string[]): string[]` que faz a união sem duplicatas

## Tarefa 4: Integrar predefinições de filtro no ControlsPanel

- [x] 4.1 Adicionar secção de botões de predefinição no `components/ControlsPanel.tsx`, acima ou abaixo da lista de padrões de exclusão
- [x] 4.2 Implementar lógica de clique que faz merge dos padrões da predefinição com os existentes usando `mergePatterns`
- [x] 4.3 Adicionar estado local `appliedPresets` e feedback visual temporário (ícone de check ou texto "Aplicado!") após aplicar uma predefinição

## Tarefa 5: Adicionar traduções para predefinições de filtro

- [x] 5.1 Adicionar secção `filterPresets` ao ficheiro `lib/translations/en.json` com chaves: title, nodejs.label, staticAssets.label, minified.label, applied
- [x] 5.2 Adicionar secção `filterPresets` ao ficheiro `lib/translations/pt.json` com as traduções correspondentes em português

## Tarefa 6: Escrever testes

- [ ] 6.1 Escrever testes unitários para o MarkdownPreview: bloco com linguagem conhecida, bloco sem linguagem, bloco com linguagem inválida (fallback)
- [ ] 6.2 Escrever testes unitários para o ControlsPanel: renderização da secção de predefinições, existência das 3 predefinições, feedback visual
- [ ] 6.3 Escrever teste de propriedade: highlighting aplicado para linguagens conhecidas (Property 1)
- [ ] 6.4 Escrever teste de propriedade: sem highlighting quando linguagem não é especificada (Property 2)
- [ ] 6.5 Escrever teste de propriedade: cobertura de linguagens do LANG_MAP (Property 3)
- [ ] 6.6 Escrever teste de propriedade: merge de predefinições é uma união de conjuntos e é idempotente (Property 4)
- [ ] 6.7 Escrever teste de propriedade: chaves de tradução existem para todas as predefinições em todos os idiomas (Property 5)
