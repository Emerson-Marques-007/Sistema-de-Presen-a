
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const callGemini = async (prompt) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Ocorreu um erro ao se comunicar com a IA. Verifique o console para mais detalhes.";
    }
}

export const getDashboardSummary = async (
  attendanceData,
  students,
  currentClass
) => {
  if (attendanceData.length < 3) {
    return "Ainda não há dados de presença suficientes para gerar um resumo inteligente para esta turma. Continue registrando as presenças.";
  }
  
  const studentMap = new Map(students.map(s => [s.id, s.name]));
  const formattedData = attendanceData.map(record => ({
    studentName: studentMap.get(record.studentId) || 'Desconhecido',
    status: record.status,
    date: record.date,
  }));

  const prompt = `
    Você é um assistente de professor e sua tarefa é gerar um resumo inteligente e conciso sobre a situação de presença da turma.

    **Turma para Análise:** ${currentClass.name}

    **Dados de Presença (últimos dias):**
    ${JSON.stringify(formattedData, null, 2)}

    **Sua Resposta (em formato markdown simples):**
    1.  **Visão Geral:** Comece com uma frase sobre a taxa de presença geral. Exemplo: "A presença na turma se mantém estável..." ou "Houve uma queda na frequência nos últimos dias...".
    2.  **Alunos em Destaque:** Identifique até 2 alunos com múltiplas faltas recentes ou consecutivas. Mencione-os de forma proativa. Exemplo: "Atenção para os alunos [Nome do Aluno 1] e [Nome do Aluno 2], que apresentaram faltas consecutivas.". Se não houver ninguém, diga que o engajamento está bom.
    3.  **Ação Sugerida:** Termine com uma sugestão de ação simples e direta. Exemplo: "Considere enviar uma mensagem de apoio aos alunos ausentes para entender a situação."

    Seja breve, direto e foque em fornecer insights acionáveis para o professor.
  `;
  return callGemini(prompt);
};


export const getAttendanceAnalysis = async (
  attendanceData,
  students,
  classes
) => {
   if (attendanceData.length === 0) {
    return "Não há dados de presença suficientes para gerar uma análise.";
  }

  const studentMap = new Map(students.map(s => [s.id, s.name]));
  const classMap = new Map(classes.map(c => [c.id, c.name]));

  const formattedData = attendanceData.map(record => ({
    studentName: studentMap.get(record.studentId) || 'Desconhecido',
    className: classMap.get(record.classId) || 'Desconhecido',
    status: record.status,
    date: record.date,
  }));

  const prompt = `
    Você é um assistente educacional para um professor. Analise os seguintes dados históricos de presença para uma turma e forneça um relatório detalhado e útil em formato markdown.

    O relatório deve incluir:
    1.  **Resumo Geral da Turma**: Calcule e exiba a taxa de presença geral (porcentagem de presenças em relação ao total de registros).
    2.  **Alunos com Mais Ausências**: Identifique e liste os alunos com o maior número de faltas no período. Mostre o nome do aluno e o número total de ausências.
    3.  **Análise de Padrões**: Com base nos dados, aponte qualquer padrão de ausência que seja relevante (por exemplo, ausências concentradas em datas específicas ou um aumento geral nas faltas).
    4.  **Conclusão e Sugestões**: Ofereça uma breve conclusão sobre a situação da turma e, se apropriado, sugira uma ação simples (ex: "Considerar uma conversa com os alunos de baixa frequência.").

    Seja claro, objetivo e use uma linguagem profissional.

    Aqui estão os dados de presença para análise:
    ${JSON.stringify(formattedData, null, 2)}
  `;

  return callGemini(prompt);
};

export const getRiskAnalysis = async (
  attendanceData,
  students,
  targetStudentId
) => {
  if (attendanceData.length < 5) { // Need some data to analyze
    return "Não há dados de presença suficientes para uma análise de risco. Continue registrando as presenças para habilitar esta função.";
  }

  const studentMap = new Map(students.map(s => [s.id, s.name]));
  let formattedData = attendanceData.map(record => ({
    studentName: studentMap.get(record.studentId) || 'Desconhecido',
    status: record.status,
    date: record.date,
  }));
  
  let analysisFocus = "da turma inteira";
  if (targetStudentId) {
      formattedData = formattedData.filter(d => d.studentName === studentMap.get(targetStudentId));
      analysisFocus = `do aluno ${studentMap.get(targetStudentId)}`;
  }


  const prompt = `
    Você é um analista de dados educacional. Sua tarefa é realizar uma análise de risco preditiva com base no histórico de faltas ${analysisFocus} para identificar alunos que possam estar em risco de desengajamento ou dificuldades acadêmicas.

    Analise os dados de presença a seguir:
    ${JSON.stringify(formattedData, null, 2)}

    Seu relatório, em formato markdown, deve conter:
    1.  **Identificação de Alunos em Risco**: Liste os alunos com padrões de ausência preocupantes. Considere não apenas o número total de faltas, mas também a frequência (ex: faltas consecutivas, faltas em dias específicos da semana).
    2.  **Nível de Risco**: Para cada aluno identificado, classifique o nível de risco como **Baixo**, **Médio** ou **Alto**. Justifique brevemente a classificação.
    3.  **Observações e Padrões**: Descreva quaisquer padrões gerais observados (ex: "um aumento nas faltas nas últimas duas semanas", "faltas concentradas às sextas-feiras").
    4.  **Recomendações Proativas**: Sugira ações específicas e construtivas que o professor pode tomar para cada nível de risco (ex: para risco 'Médio', "agendar uma conversa individual para entender os motivos das ausências"; para risco 'Alto', "considerar envolver o coordenador pedagógico").

    Seja analítico, proativo e forneça insights acionáveis. Se o foco for um único aluno, centre toda a análise nele.
  `;

  return callGemini(prompt);
};

export const getComparativeAnalysis = async (comparisonData) => {
    if (comparisonData.length < 2) {
        return "Selecione ao menos duas turmas para realizar a comparação.";
    }

    const prompt = `
        Você é um analista de dados educacional. Sua tarefa é comparar a performance de presença entre diferentes turmas e gerar insights para o professor.

        Aqui estão os dados da taxa de presença (%) ao longo do tempo para as turmas selecionadas:
        ${JSON.stringify(comparisonData, null, 2)}

        Seu relatório, em formato markdown, deve conter:
        1.  **Análise Comparativa**: Compare as tendências de presença entre as turmas. Qual turma tem a maior média de presença? Há alguma turma com uma tendência de queda ou de subida notável?
        2.  **Observações Chave**: Aponte qualquer insight interessante. Por exemplo, "A turma de 'Inteligência Artificial' mantém uma presença consistentemente 15% maior que a de 'Algoritmos'." ou "Todas as turmas apresentaram uma queda de presença na última semana, o que pode indicar um fator externo."
        3.  **Sugestão**: Com base na análise, ofereça uma sugestão. Exemplo: "Investigar as práticas de engajamento da turma com maior presença para aplicar em outras."

        Seja objetivo e foque nos insights que ajudem o professor a entender as diferenças entre as turmas.
    `;
    return callGemini(prompt);
};

export const getCommunicationDraft = async (
  studentName,
  className,
  type
) => {
  let promptInstruction = '';

  switch (type) {
    case 'absence':
      promptInstruction = `O aluno tem se ausentado das aulas. O objetivo é abrir um canal de comunicação, entender o motivo e oferecer ajuda. O tom deve ser empático e de apoio, não punitivo.`;
      break;
    case 'positive':
      promptInstruction = `O objetivo é dar um feedback positivo, parabenizando o aluno por uma atividade ou pelo seu desempenho. O tom deve ser encorajador. Exemplo: "Parabéns pela atividade".`;
      break;
    case 'support':
      promptInstruction = `O objetivo é verificar se o aluno tem alguma dúvida ou precisa de ajuda. O tom deve ser acolhedor e proativo. Exemplo: "Tem alguma dúvida?".`;
      break;
    case 'corrective':
      promptInstruction = `O objetivo é fornecer um feedback construtivo, apontando que algo está errado ou faltando em uma entrega e oferecendo ajuda para corrigir. O tom deve ser de apoio, não acusatório. Exemplo: "Você errou ou está faltando alguma coisa".`;
      break;
  }

  const prompt = `
    Você é um assistente de comunicação para professores. Sua tarefa é gerar um rascunho de e-mail para um aluno.

    **Informações:**
    - Nome do Aluno: ${studentName}
    - Nome da Turma: ${className}
    - Contexto: ${promptInstruction}

    **Estrutura do E-mail:**
    - **Assunto**: Um título amigável e relevante ao contexto.
    - **Corpo**:
        - Comece com uma saudação cordial ("Olá, ${studentName},").
        - Desenvolve a mensagem principal baseada no contexto.
        - Ofereça ajuda e se coloque à disposição para conversar.
        - Termine com uma despedida calorosa ("Atenciosamente," ou "Abraços,").

    Gere o rascunho do e-mail em português.
  `;
  
  return callGemini(prompt);
}