// Strings dos dashboards de acessos (Professor e partilhadas entre ambos).
// O ProfessorDashboard reutiliza as chaves admin.* onde o texto coincide;
// aqui ficam só as variantes específicas dele.
// Este ficheiro é fundido automaticamente pelo import.meta.glob em ../index.js.

export const pt = {
  'profDash.alunosAtivos': 'Alunos Ativos',
  'profDash.ultimosAcessos': 'Últimos Acessos',
  // {n} é substituído no componente pelo número de acessos exibidos.
  'profDash.monitorDesc': 'Monitoriza os últimos {n} acessos à plataforma por alunos.',
  'profDash.historicoTurma': 'Histórico de Acessos da Turma',
  'profDash.fullHistoryDesc': 'Lista completa de todos os acessos efetuados pelos alunos.',
  'profDash.aluno': 'Aluno',
  'profDash.noData': 'Ainda não há registos de acesso de alunos.',
  'profDash.aCarregar': 'A carregar dados...',
  'profDash.exportPdf': 'Exportar Relatório PDF',
  'profDash.dadosAtualizados': 'Dados atualizados.',
  'profDash.erroPdf': 'Houve um problema ao gerar o PDF.',
};

export const en = {
  'profDash.alunosAtivos': 'Active Students',
  'profDash.ultimosAcessos': 'Latest Logins',
  'profDash.monitorDesc': 'Monitor the last {n} student logins to the platform.',
  'profDash.historicoTurma': 'Class Login History',
  'profDash.fullHistoryDesc': 'Complete list of all student logins.',
  'profDash.aluno': 'Student',
  'profDash.noData': 'No student login records yet.',
  'profDash.aCarregar': 'Loading data...',
  'profDash.exportPdf': 'Export PDF Report',
  'profDash.dadosAtualizados': 'Data refreshed.',
  'profDash.erroPdf': 'There was a problem generating the PDF.',
};
