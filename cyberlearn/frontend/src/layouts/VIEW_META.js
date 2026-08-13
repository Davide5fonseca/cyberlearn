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
};

// Caminho → nome de vista (para o estado ativo da Sidebar).
export const PATH_VIEWS = Object.fromEntries(
  Object.entries(VIEW_PATHS).map(([vista, caminho]) => [caminho, vista])
);

// Título/subtítulo do cabeçalho por vista. `saudacao: true` antepõe "Olá, <nome>".
export const VIEW_META = {
  dashboard:           { saudacao: true,  subtitulo: 'Bem-vindo ao teu centro de estudo.' },
  professor_dashboard: { saudacao: true,  subtitulo: 'Aqui está a atividade dos alunos.' },
  professor_alunos:    { titulo: 'Gestão de Alunos', subtitulo: 'Acompanha o progresso e as notas dos teus alunos.' },
  professor_cursos:    { titulo: 'Conteúdos Educativos', subtitulo: 'Cria, edita e apaga conteúdos educativos.' },
  admin_dashboard:     { saudacao: true,  subtitulo: 'Aqui está a atividade dos professores.' },
  admin_professores:   { titulo: 'Gestão de Professores', subtitulo: 'Consulta perfis e remove professores do sistema.' },
  admin_aprovacoes:    { titulo: 'Aprovações de Conteúdos', subtitulo: 'Aprova ou rejeita os cursos e quizzes pendentes.' },
  cursos:              { titulo: 'Catálogo de Cursos', subtitulo: 'Explora os novos módulos.' },
  quizzes:             { titulo: 'Quizzes', subtitulo: 'Testa os teus conhecimentos.' },
  profile:             { titulo: 'O Teu Perfil', subtitulo: 'Gere a tua conta e segurança.' },
};

// Vista inicial de cada perfil após o login.
export const HOME_POR_PERFIL = {
  admin: '/admin',
  professor: '/professor',
  aluno: '/dashboard',
};
