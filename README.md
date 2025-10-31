
# Sistema de Presença Inteligente com IA

Este é um aplicativo web completo para gerenciamento de presença de alunos, aprimorado com recursos de Inteligência Artificial através da API do Gemini. A aplicação oferece dois portais distintos: um para alunos marcarem sua presença de forma simples e outro para professores gerenciarem turmas, presenças e obterem insights valiosos gerados por IA.

## ✨ Funcionalidades Principais

### Portal do Aluno
- **Login e Cadastro**: Alunos podem criar uma conta e se matricular em turmas.
- **Marcação de Presença**: Interface simples para selecionar a turma e marcar a presença do dia.
- **Histórico de Presenças**: Visualização de todo o histórico de presenças e faltas.
- **Justificativa de Ausência**: Alunos podem enviar uma justificativa para suas faltas, que fica pendente para aprovação do professor.
- **Sequência de Presença (Streak)**: Gamificação que incentiva a presença contínua.
- **Feedback Visual**: Animações de sucesso e mensagens de erro claras para uma melhor experiência do usuário.

### Painel do Professor
- **Dashboard Centralizado**: Visão geral da situação da turma selecionada com métricas diárias e um resumo inteligente gerado por IA.
- **Controle de Presença**: Lançamento manual de presenças e faltas para todos os alunos da turma.
- **Gerenciamento de Turmas**: Crie, edite, exclua e visualize detalhes de cada turma, incluindo lista de alunos e histórico de frequência.
- **Análises com IA (Gemini)**:
    - **Resumo Inteligente**: Receba um resumo conciso e acionável sobre a frequência da turma no dashboard.
    - **Relatório Completo de Presença**: Gere uma análise detalhada sobre padrões de ausência, alunos com mais faltas e sugestões.
    - **Análise de Risco**: Identifique alunos em potencial risco de desengajamento com base em seu histórico de faltas.
    - **Rascunhos de Comunicação**: Crie e-mails pré-formatados e personalizados para se comunicar com alunos ausentes ou para dar feedbacks.
    - **Análise Comparativa (Em desenvolvimento)**: Compare o desempenho de frequência entre diferentes turmas.
- **Perfil do Aluno**: Visualize um perfil detalhado de cada aluno, incluindo seu desempenho de presença por turma e histórico de comunicações.
- **Aprovação de Justificativas**: Revise e aprove o ou rejeite as justificativas de falta enviadas pelos alunos.
- **Exportação de Dados**: Exporte a lista de presença diária para um arquivo CSV.
- **Geração de Link/QR Code**: Crie um link único para a chamada do dia, simplificando o processo para os alunos.

## 🚀 Tecnologias Utilizadas

- **Frontend**: [React](https://react.dev/)
- **API de Inteligência Artificial**: [Google Gemini API](https://ai.google.dev/gemini-api)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Módulos ES6**: Utilizando `importmap` para carregar dependências diretamente no navegador.

## 📁 Estrutura do Projeto

O projeto é organizado da seguinte forma:

```
.
├── components/          # Componentes React reutilizáveis
│   ├── Icons.tsx
│   ├── LogoPlaceholder.tsx
│   ├── StudentLogin.tsx
│   ├── StudentView.tsx
│   ├── TeacherDashboard.tsx
│   └── TeacherLogin.tsx
├── services/            # Módulos para lógica de negócios e API
│   └── geminiService.ts # Funções que interagem com a API do Gemini
├── App.tsx              # Componente principal, gerencia o estado e a navegação
├── constants.ts         # Constantes e dados mockados
├── index.html           # Ponto de entrada da aplicação
├── index.tsx            # Ponto de montagem do React
└── ...
```

- **`components/`**: Contém todos os componentes visuais da aplicação. `TeacherDashboard.tsx` e `StudentView.tsx` são os componentes mais complexos, representando as duas principais interfaces.
- **`services/geminiService.ts`**: Abstrai todas as chamadas para a API do Gemini. Cada função exportada corresponde a uma funcionalidade de IA, formatando o prompt adequado e tratando a resposta.
- **`App.tsx`**: É o coração da aplicação. Ele gerencia todo o estado (alunos, turmas, presenças), a lógica de autenticação e renderiza o componente correto com base no usuário logado.

## 🧠 Integração com IA (Gemini)

A API do Gemini é usada para transformar dados brutos de presença em insights úteis para o professor. O arquivo `services/geminiService.ts` é o responsável por essa integração.

- **Prompts Estruturados**: Para cada funcionalidade de IA, um *prompt* detalhado é construído, fornecendo contexto claro para o modelo. Os dados de presença são formatados em JSON e incluídos no prompt.
- **Respostas em Markdown**: Solicitamos que o Gemini retorne as respostas em formato Markdown simples. Isso facilita a renderização no frontend com formatação básica (negrito, listas), tornando a leitura mais agradável.
- **Funcionalidades**:
    - `getDashboardSummary`: Gera um resumo rápido para a tela inicial.
    - `getAttendanceAnalysis`: Cria um relatório detalhado.
    - `getRiskAnalysis`: Foca em identificar padrões preditivos de risco.
    - `getCommunicationDraft`: Atua como um assistente de escrita para o professor.
    - `getComparativeAnalysis`: Compara dados entre múltiplas turmas.

## 🚀 Como Executar o Projeto

Este é um projeto puramente de frontend, projetado para ser executado em um ambiente de desenvolvimento web que possa servir arquivos estáticos e fornecer variáveis de ambiente.

### Pré-requisitos
1.  **Servidor Web Local**: Você precisa de uma maneira de servir o `index.html`. Ferramentas como `Live Server` (extensão do VS Code) ou `npx serve` funcionam bem.
2.  **Chave de API do Gemini**: A aplicação requer uma chave de API válida do Google para funcionar.

### Passos para Execução

1.  **Configurar a Chave de API**:
    A aplicação espera que a chave da API do Gemini esteja disponível como uma variável de ambiente chamada `process.env.API_KEY`. O ambiente de execução (como o Google AI Studio) deve injetar essa variável.

    **No `geminiService.ts` e em outros arquivos, a inicialização ocorre da seguinte forma:**
    ```javascript
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    ```
    **Importante**: Não é necessário modificar o código para inserir a chave. O ambiente de hospedagem é responsável por fornecer `process.env.API_KEY`.

2.  **Servir os Arquivos**:
    - Use uma extensão como o "Live Server" no VS Code e abra o arquivo `index.html`.
    - Ou, no terminal, navegue até a pasta raiz do projeto e execute `npx serve`. Isso iniciará um servidor local.

3.  **Acessar a Aplicação**:
    - Abra o seu navegador e acesse o endereço fornecido pelo servidor local (ex: `http://localhost:3000`).
    - A tela de login do professor será a primeira a ser exibida.

### Dados Mockados
Atualmente, a aplicação funciona com dados mockados definidos em `constants.ts` e gerenciados em memória no componente `App.tsx`. Isso significa que:
- Não há persistência de dados. Recarregar a página reiniciará o estado da aplicação.
- Para um ambiente de produção, seria necessário substituir a lógica de estado em memória por chamadas a um backend com um banco de dados.

