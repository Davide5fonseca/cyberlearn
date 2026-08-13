import { Navigate, Route, Routes, useOutletContext } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import PerfilPage from './pages/PerfilPage';
import AppLayout from './layouts/AppLayout';
import Dashboard from './components/Dashboard';
import Cursos from './components/Cursos';
import Licao from './components/Licao';
import Quizzes from './components/Quizzes';
import ProfessorDashboard from './components/ProfessorDashboard';
import ProfessorAlunos from './components/ProfessorAlunos';
import ProfessorCursos from './components/ProfessorCursos';
import AdminDashboard from './components/AdminDashboard';
import AdminProfessores from './components/AdminProfessores';
import AdminAprovacoes from './components/AdminAprovacoes';
import { useAuth } from './context/AuthContext';
import { HOME_POR_PERFIL } from './layouts/VIEW_META';

// Rota protegida: exige sessão e, opcionalmente, um dos perfis indicados.
// O papel vem do payload do JWT (AuthContext) e o servidor revalida sempre.
function ProtectedRoute({ perfis, children }) {
  const { autenticado, perfil } = useAuth();
  if (!autenticado) return <Navigate to="/login" replace />;
  if (perfis && !perfis.includes(perfil)) {
    return <Navigate to={HOME_POR_PERFIL[perfil] || '/dashboard'} replace />;
  }
  return children;
}

// Rotas públicas de autenticação: com sessão ativa, seguem para o painel.
function PublicOnly({ children }) {
  const { autenticado, perfil } = useAuth();
  if (autenticado) return <Navigate to={HOME_POR_PERFIL[perfil] || '/dashboard'} replace />;
  return children;
}

function HomeRedirect() {
  const { autenticado, perfil } = useAuth();
  if (!autenticado) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_POR_PERFIL[perfil] || '/dashboard'} replace />;
}

// Páginas: ligam o contexto do layout aos props dos componentes existentes.
function DashboardPage() {
  const { theme, user } = useOutletContext();
  return <Dashboard theme={theme} user={user} />;
}

function CursosPage() {
  const { theme, setView, setActiveCourse } = useOutletContext();
  return <Cursos theme={theme} setView={setView} setActiveCourse={setActiveCourse} />;
}

function LicaoPage() {
  const { theme, user, setView, activeCourse, setTargetQuizCourse } = useOutletContext();
  // Deep-link/refresh sem lição escolhida: volta ao catálogo.
  if (!activeCourse) return <Navigate to="/cursos" replace />;
  return <Licao theme={theme} user={user} setView={setView} curso={activeCourse} setTargetQuizCourse={setTargetQuizCourse} />;
}

function QuizzesPage() {
  const { theme, setView, targetQuizCourse, setTargetQuizCourse } = useOutletContext();
  return <Quizzes theme={theme} setView={setView} targetQuizCourse={targetQuizCourse} setTargetQuizCourse={setTargetQuizCourse} />;
}

function ProfessorDashboardPage() {
  const { theme, user } = useOutletContext();
  return <ProfessorDashboard theme={theme} user={user} />;
}

function ProfessorAlunosPage() {
  const { theme } = useOutletContext();
  return <ProfessorAlunos theme={theme} />;
}

function ProfessorCursosPage() {
  const { theme, user } = useOutletContext();
  return <ProfessorCursos theme={theme} user={user} />;
}

function AdminDashboardPage() {
  const { theme } = useOutletContext();
  return <AdminDashboard theme={theme} />;
}

function AdminProfessoresPage() {
  const { theme } = useOutletContext();
  return <AdminProfessores theme={theme} />;
}

function AdminAprovacoesPage() {
  const { theme } = useOutletContext();
  return <AdminAprovacoes theme={theme} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/login" element={<PublicOnly><AuthPage /></PublicOnly>} />
      <Route path="/registar" element={<PublicOnly><AuthPage /></PublicOnly>} />
      <Route path="/recuperar" element={<PublicOnly><AuthPage /></PublicOnly>} />
      <Route path="/reset" element={<PublicOnly><AuthPage /></PublicOnly>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<ProtectedRoute perfis={['aluno']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/cursos" element={<CursosPage />} />
        <Route path="/licao" element={<LicaoPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/perfil" element={<PerfilPage />} />

        <Route path="/professor" element={<ProtectedRoute perfis={['professor', 'admin']}><ProfessorDashboardPage /></ProtectedRoute>} />
        <Route path="/professor/alunos" element={<ProtectedRoute perfis={['professor', 'admin']}><ProfessorAlunosPage /></ProtectedRoute>} />
        <Route path="/professor/cursos" element={<ProtectedRoute perfis={['professor', 'admin']}><ProfessorCursosPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute perfis={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/professores" element={<ProtectedRoute perfis={['admin']}><AdminProfessoresPage /></ProtectedRoute>} />
        <Route path="/admin/aprovacoes" element={<ProtectedRoute perfis={['admin']}><AdminAprovacoesPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
