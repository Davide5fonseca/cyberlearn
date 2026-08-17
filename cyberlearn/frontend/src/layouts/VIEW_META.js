// Mapa central de vistas: caminho de rota, título e subtítulo do cabeçalho.
// Substitui as cadeias de ternários do antigo App.jsx e alimenta o adaptador
// setView(nome) → navigate(caminho) usado pelos componentes existentes.

export const VIEW_PATHS = {
  login: '/login',
  register: '/registar',
  forgot: '/recuperar',
  reset: '/reset',
  dashboard: '/dashboard',
  cursos: '/cursos',
  licao: '/licao',
  quizzes: '/quizzes',
  profile: '/perfil',
  professor_dashboard: '/professor',
  professor_alunos: '/professor/alunos',
  professor_cursos: '/professor/cursos',
  admin_dashboard: '/admin',
  admin_professores: '/admin/professores',
  admin_aprovacoes: '/admin/aprovacoes',
  admin_seguranca: '/admin/seguranca',
};

// Caminho → nome de vista (para o estado ativo da Sidebar).
export const PATH_VIEWS = Object.fromEntries(
  Object.entries(VIEW_PATHS).map(([vista, caminho]) => [caminho, vista])
);

// Título/subtítulo do cabeçalho por vista, como CHAVES i18n (traduzidas no
// AppLayout com t()). `saudacao: true` antepõe "Olá, <nome>".
export const VIEW_META = {
  dashboard:           { saudacao: true, sub: 'meta.dashboard.sub' },
  professor_dashboard: { saudacao: true, sub: 'meta.professor_dashboard.sub' },
  professor_alunos:    { titulo: 'meta.professor_alunos.titulo', sub: 'meta.professor_alunos.sub' },
  professor_cursos:    { titulo: 'meta.professor_cursos.titulo', sub: 'meta.professor_cursos.sub' },
  admin_dashboard:     { saudacao: true, sub: 'meta.admin_dashboard.sub' },
  admin_professores:   { titulo: 'meta.admin_professores.titulo', sub: 'meta.admin_professores.sub' },
  admin_aprovacoes:    { titulo: 'meta.admin_aprovacoes.titulo', sub: 'meta.admin_aprovacoes.sub' },
  admin_seguranca:     { titulo: 'meta.admin_seguranca.titulo', sub: 'meta.admin_seguranca.sub' },
  cursos:              { titulo: 'meta.cursos.titulo', sub: 'meta.cursos.sub' },
  quizzes:             { titulo: 'meta.quizzes.titulo', sub: 'meta.quizzes.sub' },
  profile:             { titulo: 'meta.profile.titulo', sub: 'meta.profile.sub' },
};

// Vista inicial de cada perfil após o login.
export const HOME_POR_PERFIL = {
  admin: '/admin',
  professor: '/professor',
  aluno: '/dashboard',
};
