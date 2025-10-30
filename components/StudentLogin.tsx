
import React, { useState } from 'react';
import { CheckCircleIcon } from './Icons';
import { Logo } from './LogoPlaceholder';

export const StudentLogin = ({ classes, onLogin, onRegister }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState(''); // Matricula
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [error, setError] = useState('');

  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState('idle');

  const handleClassToggle = (classId) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleAuthAction = (e) => {
    e.preventDefault();
    setError('');
    try {
        if (isRegister) {
            if (!name || !studentId || !email || !password || selectedClassIds.length === 0) {
                setError('Todos os campos são obrigatórios.');
                return;
            }
            onRegister({ id: studentId, name, email, classIds: selectedClassIds, password });
        } else {
             if (!email || !password) {
                setError('Email e senha são obrigatórios.');
                return;
            }
            onLogin(email, password);
        }
    } catch(e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('Ocorreu um erro desconhecido.');
        }
    }
  };

  const handleRecoverySubmit = (e) => {
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-gray-800 relative">
       {renderRecoveryModal()}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <Logo className="h-12 w-40 mx-auto" />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">{isRegister ? 'Cadastro de Aluno' : 'Login do Aluno'}</h1>

            <form onSubmit={handleAuthAction} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                    <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} required className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                {!isRegister && (
                    <div className="text-right mt-2">
                        <button type="button" onClick={() => { setIsRecoveryModalOpen(true); setRecoveryEmail(email); }} className="text-xs text-blue-600 hover:underline font-semibold">
                            Esqueceu a senha?
                        </button>
                    </div>
                )}
              </div>

              {isRegister && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selecione suas Turmas</label>
                    <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                        {classes.map(cls => (
                            <div key={cls.id} className="flex items-center">
                                <input 
                                    id={`class-${cls.id}`} 
                                    type="checkbox" 
                                    checked={selectedClassIds.includes(cls.id)}
                                    onChange={() => handleClassToggle(cls.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor={`class-${cls.id}`} className="ml-3 text-sm text-gray-700">{cls.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {error && <p className="text-red-600 text-sm text-center pt-2">{error}</p>}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md mt-4">
                {isRegister ? 'Cadastrar' : 'Entrar'}
              </button>
            </form>

            <p className="text-center mt-6 text-gray-600 text-sm">
              {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-blue-600 hover:underline ml-1 font-semibold">
                {isRegister ? 'Faça Login' : 'Cadastre-se'}
              </button>
            </p>
        </div>
      </div>
    </div>
  );
};