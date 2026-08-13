// Traduções centralizadas da aplicação. Hoje só há Português, mas todas as
// strings traduzíveis vivem aqui — basta acrescentar outro idioma e expor a
// sua seleção para internacionalizar a app.
export const messages = {
  pt: {
    // Autenticação
    'auth.welcome': 'Bem-vindo',
    'auth.subtitleLogin': 'Insere as tuas credenciais para aceder à plataforma.',
    'auth.email': 'Endereço de E-mail',
    'auth.password': 'Palavra-Passe',
    'auth.passwordHint': 'Mínimo de 8 caracteres, 1 maiúscula e 1 carácter especial.',
    'auth.forgot': 'Esqueceste-te da senha?',
    'auth.signIn': 'Entrar',
    'auth.noAccount': 'Ainda não tens conta?',
    'auth.signUp': 'Regista-te aqui',
    'auth.createAccount': 'Criar Conta',
    'auth.subtitleRegister': 'Junta-te à nossa plataforma de cibersegurança.',
    'auth.fullName': 'Nome Completo',
    'auth.confirmPassword': 'Confirmar Palavra-Passe',
    'auth.role': 'Tipo de Conta',
    'auth.student': 'Aluno',
    'auth.instructor': 'Professor',
    'auth.admin': 'Administrador',
    'auth.createBtn': 'Criar Conta',
    'auth.hasAccount': 'Já tens uma conta?',
    'auth.resetTitle': 'Recuperar Senha',
    'auth.resetSub': 'Introduz o teu e-mail para receberes um código.',
    'auth.sendLink': 'Enviar Código',
    'auth.backLogin': 'Voltar ao Login',
    'auth.back': 'Voltar',
    'auth.newPassTitle': 'Nova Senha',
    'auth.newPassSub': 'Insere o código que recebeste por e-mail e a tua nova senha.',
    'auth.newPass': 'Nova Palavra-Passe',
    'auth.confirmNewPass': 'Confirmar Nova Palavra-Passe',
    'auth.resetBtn': 'Atualizar Palavra-Passe',
    'auth.twoFaTitle': 'Segurança 2FA',
    'auth.twoFaSub': 'Insere o código de 6 dígitos enviado para o teu e-mail.',
    'auth.code': 'Código de 6 dígitos',
    'auth.verifyBtn': 'Verificar Acesso',
    'auth.brandTitle': 'Domina a\nCibersegurança',
    'auth.brandSub': 'Aprende, pratica e protege. Junta-te à elite da segurança digital.',

    // Barra lateral
    'sidebar.adminPlatform': 'Dashboard',
    'sidebar.adminUsers': 'Professores',
    'sidebar.adminAprovacoes': 'Aprovações',
    'sidebar.adminSeguranca': 'Segurança',
    'sidebar.profile': 'Perfil',
    'sidebar.profAnalytics': 'Dashboard',
    'sidebar.profStudents': 'Alunos',
    'sidebar.profStudio': 'Cursos',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.courses': 'Cursos',
    'sidebar.quizzes': 'Quizzes',
    'sidebar.logout': 'Sair da Conta',

    // Painel de administração
    'admin.activeInstructors': 'Professores Registados',
    'admin.activeSessions': 'Sessões Ativas (24h)',
    'admin.totalLogins': 'Total de Acessos',
    'admin.loginHistory': 'Histórico de Acessos',
    'admin.monitorDesc': 'Monitoriza os últimos 5 acessos à plataforma por professores.',
    'admin.fullHistoryDesc': 'Lista completa de todos os acessos efetuados por professores.',
    'admin.refresh': 'Atualizar Dados',
    'admin.exportPdf': 'Exportar PDF',
    'admin.viewAll': 'Ver Todo o Histórico',
    'admin.back': 'Voltar ao Painel',
    'admin.user': 'Professor',
    'admin.email': 'Endereço de E-mail',
    'admin.timestamp': 'Data e Hora do Acesso',
    'admin.status': 'Estado',
    'admin.noData': 'Ainda não há registos de acesso.',

    // Comuns / notificações
    'notifications.notif1Title': 'Aviso',
    'common.success': 'Sucesso',
  },
};

const lang = 'pt';

// Hook de tradução. Devolve a função t(key) que resolve uma chave para a
// string traduzida (ou a própria chave, como fallback seguro).
export function useTranslation() {
  return (key) => messages[lang][key] || key;
}
