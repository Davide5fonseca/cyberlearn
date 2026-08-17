import { describe, test, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth, decodeJwt } from '../context/AuthContext';

// JWT de teste (assinatura irrelevante: o cliente só lê o payload).
const jwtCom = (payload) => {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.assinatura`;
};

function Sonda() {
  const { autenticado, perfil, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{String(autenticado)}</span>
      <span data-testid="perfil">{perfil ?? 'null'}</span>
      <span data-testid="nome">{user?.nome ?? 'sem-user'}</span>
      <button onClick={() => login(jwtCom({ id: 7, perfil: 'professor', exp: Math.floor(Date.now() / 1000) + 3600 }), { nome: 'Ana', tipo: 'professor' })}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  test('decodeJwt lê o payload e devolve null para tokens inválidos', () => {
    expect(decodeJwt(jwtCom({ id: 1, perfil: 'aluno' }))).toMatchObject({ id: 1, perfil: 'aluno' });
    expect(decodeJwt('lixo')).toBeNull();
  });

  test('sem token, não está autenticado', () => {
    render(<AuthProvider><Sonda /></AuthProvider>);
    expect(screen.getByTestId('auth')).toHaveTextContent('false');
    expect(screen.getByTestId('perfil')).toHaveTextContent('null');
  });

  test('o PERFIL vem do JWT, não do objeto user guardado no localStorage', () => {
    // Um atacante edita o localStorage para se promover a admin…
    localStorage.setItem('cyberlearn_user', JSON.stringify({ nome: 'Eva', tipo: 'admin' }));
    // …mas o token diz que é aluno.
    localStorage.setItem('cyberlearn_token', jwtCom({ id: 3, perfil: 'aluno', exp: Math.floor(Date.now() / 1000) + 3600 }));

    render(<AuthProvider><Sonda /></AuthProvider>);

    expect(screen.getByTestId('auth')).toHaveTextContent('true');
    expect(screen.getByTestId('perfil')).toHaveTextContent('aluno');
  });

  test('token expirado no arranque é ignorado', () => {
    localStorage.setItem('cyberlearn_token', jwtCom({ id: 3, perfil: 'admin', exp: Math.floor(Date.now() / 1000) - 60 }));
    render(<AuthProvider><Sonda /></AuthProvider>);
    expect(screen.getByTestId('auth')).toHaveTextContent('false');
  });

  test('login guarda o token e logout limpa tudo', async () => {
    render(<AuthProvider><Sonda /></AuthProvider>);

    await act(async () => { screen.getByText('login').click(); });
    expect(screen.getByTestId('auth')).toHaveTextContent('true');
    expect(screen.getByTestId('perfil')).toHaveTextContent('professor');
    expect(screen.getByTestId('nome')).toHaveTextContent('Ana');
    expect(localStorage.getItem('cyberlearn_token')).toBeTruthy();

    await act(async () => { screen.getByText('logout').click(); });
    expect(screen.getByTestId('auth')).toHaveTextContent('false');
    expect(localStorage.getItem('cyberlearn_token')).toBeNull();
    expect(localStorage.getItem('cyberlearn_user')).toBeNull();
  });
});
