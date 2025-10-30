
import React, { useState, useMemo, useEffect } from 'react';
import { LogoutIcon, CheckCircleIcon, ExclamationCircleIcon, BookOpenIcon, QrCodeIcon } from './Icons';
import { Logo } from './LogoPlaceholder';

export const StudentView = (props) => {
  const { student, allClasses, attendanceRecords, onMarkAttendance, onLogout, onJustifyAbsence, initialFeedback } = props;
  
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [justificationModal, setJustificationModal] = useState(null);
  const [justificationText, setJustificationText] = useState('');

  const studentClasses = useMemo(() => 
    allClasses.filter(cls => student.classIds.includes(cls.id))
  , [allClasses, student.classIds]);
  
  useEffect(() => {
    if (initialFeedback) {
        if(initialFeedback.type === 'error'){
             setFeedback(initialFeedback);
        } else {
            setShowSuccessAnimation(true);
            setTimeout(() => setShowSuccessAnimation(false), 2500);
        }
    }
  }, [initialFeedback]);
  
  const attendanceStreak = useMemo(() => {
    const sortedRecords = [...attendanceRecords]
      .filter(r => r.status === 'present' || r.status === 'justified_absent')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();
    
    // Check today
    if (sortedRecords.some(r => r.date === currentDate.toISOString().split('T')[0])) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Check previous days
    for (const record of sortedRecords) {
      const recordDate = new Date(record.date + 'T00:00:00');
      const expectedDate = new Date(currentDate.toISOString().split('T')[0] + 'T00:00:00');
      
      if (recordDate.getTime() === expectedDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (recordDate < expectedDate) {
        // Break if there's a gap
        break;
      }
    }
    return streak;
  }, [attendanceRecords]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClassId) {
      setFeedback({ type: 'error', message: 'Por favor, selecione a turma.' });
      return;
    }
    
    setIsLoading(true);
    setFeedback(null);

    setTimeout(() => {
      try {
        onMarkAttendance(student.id, selectedClassId);
        setShowSuccessAnimation(true);
        setSelectedClassId('');
        setTimeout(() => setShowSuccessAnimation(false), 2500);
      } catch (error) {
        if (error instanceof Error) {
            setFeedback({ type: 'error', message: error.message });
        } else {
            setFeedback({ type: 'error', message: 'Ocorreu um erro desconhecido.' });
        }
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleJustificationSubmit = (e) => {
    e.preventDefault();
    if (!justificationText.trim() || !justificationModal) return;
    onJustifyAbsence(justificationModal.id, justificationText.trim());
    setJustificationModal(null);
    setJustificationText('');
  };
  
  const renderSuccessModal = () => {
    if (!showSuccessAnimation) return null;

    return (
      <div className="fixed inset-0 bg-gray-600/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="text-center bg-white p-10 rounded-xl shadow-2xl animate-scale-in">
            <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto animate-pulse" />
            <h2 className="text-3xl font-bold mt-6 text-gray-800">Presença Confirmada!</h2>
            <p className="text-lg text-gray-600">Tenha uma ótima aula, {student.name.split(' ')[0]}!</p>
        </div>
        <style>{`
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scale-in { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
        `}</style>
      </div>
    );
  };
  
   const renderJustificationModal = () => {
    if (!justificationModal) return null;
    const className = allClasses.find(c => c.id === justificationModal.classId)?.name || 'Turma desconhecida';

    return (
      <div className="fixed inset-0 bg-gray-600/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
          <button onClick={() => setJustificationModal(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Justificar Ausência</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Data: <strong>{new Date(justificationModal.date + 'T00:00:00').toLocaleDateString('pt-BR')}</strong> | Turma: <strong>{className}</strong>
          </p>
          <form onSubmit={handleJustificationSubmit}>
            <textarea
              value={justificationText}
              onChange={(e) => setJustificationText(e.target.value)}
              placeholder="Descreva o motivo da sua ausência (ex: consulta médica, problema pessoal, etc.)."
              className="w-full bg-gray-100 border border-gray-300 text-gray-900 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              autoFocus
              required
            ></textarea>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setJustificationModal(null)} className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-800">Cancelar</button>
              <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">Enviar Justificativa</button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  const TABS = [
    { id: 'attendance', label: 'Marcar Presença', icon: QrCodeIcon },
    { id: 'history', label: 'Meu Histórico', icon: BookOpenIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-gray-800 relative">
        {renderSuccessModal()}
        {renderJustificationModal()}
        <div className="absolute top-4 right-4 flex gap-4 items-center">
            <button onClick={onLogout} className="flex items-center gap-2 py-2 px-4 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-400 hover:text-red-600 rounded-lg transition-colors text-gray-700">
              <LogoutIcon className="w-5 h-5"/> Sair
            </button>
        </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <Logo className="h-12 w-40 mx-auto" />
            <p className="text-center text-gray-600 mt-4">Bem-vindo(a), <span className="font-bold">{student.name}</span>!</p>
            {attendanceStreak > 1 && (
                <div className="mt-4 inline-block bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full">
                    🔥 Você está numa sequência de {attendanceStreak} dias de presença!
                </div>
            )}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex border-b border-gray-200">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold transition-colors ${activeTab === tab.id ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
                        <tab.icon className="w-5 h-5"/> {tab.label}
                    </button>
                ))}
            </div>
            
            <div className="p-8">
                {activeTab === 'attendance' && (
                    <>
                        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Registrar Presença</h1>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div>
                            <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">Sua Turma</label>
                            <select id="class" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                              <option value="">Selecione a turma</option>
                              {studentClasses.map(cls => ( <option key={cls.id} value={cls.id}>{cls.name}</option> ))}
                            </select>
                          </div>
                          
                          <button type="submit" disabled={isLoading || studentClasses.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center">
                            {isLoading ? ( <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> ) : studentClasses.length > 0 ? 'Marcar Presença' : 'Nenhuma turma encontrada'}
                          </button>
                        </form>
                        {feedback && ( <div className={`mt-6 p-4 rounded-lg text-center flex items-center justify-center gap-3 text-sm bg-red-100 text-red-700 border border-red-200`}> <ExclamationCircleIcon className="w-5 h-5" /> <span>{feedback.message}</span> </div> )}
                    </>
                )}
                
                {activeTab === 'history' && (
                    <div>
                        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Histórico de Presenças</h1>
                        <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                            {attendanceRecords.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum registro encontrado.</p>}
                            {[...attendanceRecords].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(rec => {
                                const className = allClasses.find(c => c.id === rec.classId)?.name || 'Turma desconhecida';
                                const getStatusChip = () => {
                                    switch(rec.status) {
                                        case 'present': return <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">Presente</span>;
                                        case 'absent': 
                                             if (rec.justificationStatus === 'pending') return <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pendente</span>;
                                             if (rec.justificationStatus === 'rejected') return <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full">Falta</span>;
                                             return <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full">Falta</span>;
                                        case 'justified_absent': return <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Justificada</span>;
                                    }
                                }
                                return (
                                    <div key={rec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div>
                                            <p className="font-semibold text-gray-800">{className}</p>
                                            <p className="text-sm text-gray-500">{new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusChip()}
                                            {rec.status === 'absent' && !rec.justificationStatus && (
                                                <button onClick={() => setJustificationModal(rec)} className="text-xs text-blue-600 hover:underline font-semibold">Justificar</button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};