# Documento de Requisitos

## Introdução

Este documento descreve os requisitos para melhorias na interface e experiência do utilizador (UX) do Project Unifier. As melhorias focam-se em duas áreas principais: (1) realce de sintaxe nos blocos de código da pré-visualização Markdown, utilizando uma biblioteca de syntax highlighting, e (2) predefinições de filtros por stack tecnológica no painel de controlo, permitindo ao utilizador aplicar conjuntos de padrões de exclusão com um clique.

## Glossário

- **Project_Unifier**: Aplicação web React/TypeScript que converte bases de código em ficheiros de contexto unificados para LLMs, revisão de código e documentação.
- **MarkdownPreview**: Componente React responsável por renderizar a pré-visualização do conteúdo Markdown gerado, incluindo blocos de código.
- **ControlsPanel**: Componente React que apresenta as configurações de entrada ao utilizador, incluindo padrões de exclusão, tamanho máximo de ficheiro e formato de saída.
- **Padrão_de_Exclusão**: Padrão glob utilizado para filtrar ficheiros e diretórios durante o processamento do projeto (ex: `node_modules`, `*.min.js`).
- **Predefinição_de_Filtro**: Conjunto pré-configurado de padrões de exclusão associado a uma stack tecnológica ou categoria de ficheiros, aplicável com um clique.
- **Biblioteca_de_Highlighting**: Biblioteca JavaScript de realce de sintaxe (ex: Shiki, Prism.js, Highlight.js) que aplica coloração ao código com base na linguagem de programação.
- **LANG_MAP**: Mapeamento existente no projeto que associa extensões de ficheiro a identificadores de linguagem de programação.

## Requisitos

### Requisito 1: Realce de Sintaxe na Pré-visualização Markdown

**User Story:** Como utilizador, quero que os blocos de código na pré-visualização Markdown sejam renderizados com realce de sintaxe colorido, para que a leitura do código seja mais agradável e legível antes de o exportar.

#### Critérios de Aceitação

1. WHEN o MarkdownPreview renderiza um bloco de código com uma linguagem especificada (ex: ` ```typescript `), THE MarkdownPreview SHALL aplicar realce de sintaxe colorido ao conteúdo do bloco utilizando a Biblioteca_de_Highlighting.
2. WHEN o MarkdownPreview renderiza um bloco de código sem linguagem especificada, THE MarkdownPreview SHALL renderizar o bloco de código como texto simples sem realce de sintaxe.
3. THE MarkdownPreview SHALL suportar realce de sintaxe para todas as linguagens definidas no LANG_MAP (incluindo typescript, javascript, python, java, go, rust, css, html, json, yaml, sql, shell, entre outras).
4. WHEN o MarkdownPreview aplica realce de sintaxe, THE MarkdownPreview SHALL utilizar um tema de cores escuro consistente com o esquema de cores existente da aplicação (fundo slate escuro).
5. WHEN o conteúdo Markdown contém múltiplos blocos de código com linguagens diferentes, THE MarkdownPreview SHALL aplicar o realce de sintaxe correto a cada bloco de forma independente.
6. IF a Biblioteca_de_Highlighting falhar ao processar um bloco de código, THEN THE MarkdownPreview SHALL renderizar o bloco como texto simples sem interromper a pré-visualização.

### Requisito 2: Predefinições de Filtros por Stack Tecnológica

**User Story:** Como utilizador, quero ter predefinições de filtros por stack tecnológica disponíveis no painel de controlo, para que possa aplicar conjuntos de padrões de exclusão comuns com um clique, poupando tempo na configuração.

#### Critérios de Aceitação

1. THE ControlsPanel SHALL apresentar uma secção de predefinições de filtro na área de padrões de exclusão.
2. THE ControlsPanel SHALL disponibilizar, no mínimo, as seguintes predefinições de filtro:
   - "Node.js" com padrões: `node_modules`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `.npm`, `.yarn`
   - "Assets estáticos" com padrões: `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.svg`, `*.ico`, `*.webp`, `*.mp4`, `*.webm`, `*.mp3`, `*.wav`, `*.ogg`, `*.ttf`, `*.woff`, `*.woff2`, `*.eot`
   - "Ficheiros minificados" com padrões: `*.min.js`, `*.min.css`, `*.min.map`, `*.bundle.js`, `*.chunk.js`
3. WHEN o utilizador clica numa Predefinição_de_Filtro, THE ControlsPanel SHALL adicionar todos os padrões de exclusão dessa predefinição à lista de padrões atual, sem remover os padrões já existentes.
4. WHEN o utilizador clica numa Predefinição_de_Filtro cujos padrões já existem na lista atual, THE ControlsPanel SHALL não duplicar os padrões já presentes.
5. THE ControlsPanel SHALL apresentar cada Predefinição_de_Filtro como um botão com rótulo descritivo, visualmente distinto dos controlos existentes.
6. WHEN uma Predefinição_de_Filtro é aplicada, THE ControlsPanel SHALL fornecer feedback visual ao utilizador indicando que os padrões foram adicionados com sucesso.

### Requisito 3: Internacionalização das Predefinições de Filtro

**User Story:** Como utilizador, quero que os rótulos das predefinições de filtro estejam traduzidos no meu idioma, para que a interface seja consistente com o resto da aplicação.

#### Critérios de Aceitação

1. THE Project_Unifier SHALL incluir traduções para os rótulos das predefinições de filtro nos ficheiros de tradução em inglês (en.json) e português (pt.json).
2. WHEN o idioma da aplicação é alterado, THE ControlsPanel SHALL apresentar os rótulos das predefinições de filtro no idioma selecionado.
