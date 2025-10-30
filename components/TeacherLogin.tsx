import React, { useState } from 'react';
import type { Teacher } from '../types';
import { CheckCircleIcon } from './Icons';
import { Logo } from './LogoPlaceholder';

interface TeacherLoginProps {
  onLogin: (teacher: Teacher) => void;
}

export const TeacherLogin: React.FC<TeacherLoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [error, setError] = useState('');
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sent'>('idle');

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!email) {
        setError('Email é obrigatório.');
        return;
      }
      const mockTeacher: Teacher = { id: 't1', name: name || 'Professor Exemplo', email, sector: sector || 'Educação', photoUrl: '' };
      onLogin(mockTeacher);
      return;
    }

    const MOCK_TEACHER_EMAIL = "professor@exemplo.com";
    const MOCK_TEACHER_PASS = "senha123";

    if (!email || !password) {
        setError("Email e senha são obrigatórios.");
        return;
    }
    
    if (email.toLowerCase() !== MOCK_TEACHER_EMAIL) {
        setError("Email não encontrado.");
        return;
    }

    if (password !== MOCK_TEACHER_PASS) {
        setError("Senha incorreta.");
        return;
    }
    
    const mockTeacher: Teacher = { id: 't1', name: 'Professor Exemplo', email, sector: 'Educação', photoUrl: '' };
    onLogin(mockTeacher);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setTimeout(() => {
        setRecoveryStatus('sent');
    }, 500);
  };

  const closeRecoveryModal = () => {
    setIsRecoveryModalOpen(false);
    setTimeout(() => {
        setRecoveryEmail('');
        setRecoveryStatus('idle');
    }, 300);
  };

  const renderRecoveryModal = () => {
    if (!isRecoveryModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-gray-600/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-md p-6 relative text-gray-800">
          <button onClick={closeRecoveryModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
          <h2 className="text-xl font-bold mb-4">Recuperar Conta</h2>
          {recoveryStatus === 'sent' ? (
            <div className="text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">Se uma conta existir com o email <span className="font-semibold">{recoveryEmail}</span>, um link de recuperação foi enviado.</p>
              <button onClick={closeRecoveryModal} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md">
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleRecoverySubmit}>
              <p className="text-gray-600 mb-4">Insira seu email para receber um link de recuperação de senha.</p>
              <input 
                type="email" 
                value={recoveryEmail} 
                onChange={(e) => setRecoveryEmail(e.target.value)} 
                placeholder="seuemail@exemplo.com"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500" 
                required
                autoFocus 
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeRecoveryModal} className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 font-semibold">Cancelar</button>
                <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">Enviar Link</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
        className="relative min-h-screen flex flex-col items-center justify-center p-4 text-white bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
    >
        <div className="absolute inset-0 bg-blue-900/70 backdrop-brightness-75"></div>
        {renderRecoveryModal()}
        <div className="relative w-full max-w-md">
            <div className="text-center mb-8">
                <Logo variant="white" className="h-12 w-auto mx-auto" />
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-8 border border-white/20">
                <h1 className="text-2xl font-bold text-center mb-6 text-white">{isRegister ? 'Criar Conta de Professor' : 'Login do Professor'}</h1>
                
                <form onSubmit={handleAuthAction} className="space-y-4">
                  {isRegister && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Nome Completo</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition placeholder-gray-400" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Setor</label>
                        <input type="text" value={sector} onChange={e => setSector(e.target.value)} required className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition placeholder-gray-400" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Senha</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition placeholder-gray-400" />
                     {!isRegister && (
                        <div className="text-right mt-2">
                            <button type="button" onClick={() => { setIsRecoveryModalOpen(true); setRecoveryEmail(email); }} className="text-xs text-blue-300 hover:underline font-semibold">
                                Esqueceu a senha?
                            </button>
                        </div>
                    )}
                  </div>
                  {error && <p className="text-red-300 text-sm text-center">{error}</p>}
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg mt-2">
                    {isRegister ? 'Registrar' : 'Entrar'}
                  </button>
                </form>

                <p className="text-center mt-6 text-gray-300 text-sm">
                  {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                  <button onClick={() => setIsRegister(!isRegister)} className="text-blue-300 hover:underline ml-1 font-semibold">
                    {isRegister ? 'Faça Login' : 'Crie uma'}
                  </button>
                </p>
            </div>
        </div>
    </div>
  );
};
