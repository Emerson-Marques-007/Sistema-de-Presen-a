
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getDashboardSummary, getAttendanceAnalysis, getRiskAnalysis, getCommunicationDraft, getComparativeAnalysis } from '../services/geminiService';
import { UsersIcon, BookOpenIcon, PlusIcon, PencilIcon, TrashIcon, SparklesIcon, LogoutIcon, QrCodeIcon, ChartBarIcon, ShieldExclamationIcon, EnvelopeIcon, ArrowLeftIcon, UserCircleIcon, XIcon, DownloadIcon, FileTextIcon, CheckBadgeIcon, XCircleIcon } from './Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Logo } from './LogoPlaceholder';

const renderMarkdown = (text) => {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/(\n)/g, '<br />');
  return { __html: html };
}

const exportToCSV = (data, filename) => {
    if (data.length === 0) return;
    const header = Object.keys(data[0]).join(',');
    const csv = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([header + '\n' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
};

export const TeacherDashboard = (props) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClassId, setSelectedClassId] = useState(props.classes.length > 0 ? props.classes[0].id : '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalContent, setModalContent] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [dashboardSummary, setDashboardSummary] = useState('');
  const [viewingClassDetails, setViewingClassDetails] = useState(null);
  const [classFilter, setClassFilter] = useState('');
  const [classSort, setClassSort] = useState('newest');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('risk');
  const [comparisonClassIds, setComparisonClassIds] = useState([]);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { students, attendance, classes } = props;

  const studentsInClass = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter(student => student.classIds.includes(selectedClassId));
  }, [students, selectedClassId]);

  const attendanceForSelectedClassAndDate = useMemo(() => 
    attendance.filter(a => a.date === selectedDate && a.classId === selectedClassId)
  , [attendance, selectedDate, selectedClassId]);

  const attendanceForSelectedClass = useMemo(() =>
    attendance.filter(a => a.classId === selectedClassId)
  , [attendance, selectedClassId]);
    
  useEffect(() => {
    if (activeTab === 'dashboard' && selectedClass) {
        setIsLoadingSummary(true);
        const last14Days = new Date();
        last14Days.setDate(last14Days.getDate() - 14);
        const filteredAttendance = attendanceForSelectedClass.filter(a => new Date(a.date) >= last14Days);
        getDashboardSummary(filteredAttendance, studentsInClass, selectedClass)
            .then(setDashboardSummary)
            .finally(() => setIsLoadingSummary(false));
    }
  }, [activeTab, selectedClassId, studentsInClass, attendanceForSelectedClass, classes]);
  
  const getInitials = (name) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const selectedClass = useMemo(() =>
    classes.find(c => c.id === selectedClassId)
  , [classes, selectedClassId]);
  
  const classDetailsStats = useMemo(() => {
    if (!viewingClassDetails) return [];
    const studentsInThisClass = students.filter(s => s.classIds.includes(viewingClassDetails.id));
    // FIX: Ensure 'attendance' is treated as an array to prevent 'filter' does not exist error.
    const attendanceForThisClass = (Array.isArray(attendance) ? attendance : []).filter(a => a.classId === viewingClassDetails.id);
    return studentsInThisClass.map(student => {
        const presences = attendanceForThisClass.filter(a => a.studentId === student.id && (a.status === 'present' || a.status === 'justified_absent')).length;
        const absences = attendanceForThisClass.filter(a => a.studentId === student.id && a.status === 'absent').length;
        return { ...student, presences, absences };
    });
  }, [viewingClassDetails, students, attendance]);

 const classHistory = useMemo(() => {
    if (!viewingClassDetails) return [];
    const attendanceForThisClass = attendance.filter(a => a.classId === viewingClassDetails.id);
    const groupedByDate = attendanceForThisClass.reduce((acc, record) => {
        if (!acc[record.date]) {
            acc[record.date] = [];
        }
        acc[record.date].push(record);
        return acc;
    }, {});

    return Object.entries(groupedByDate).map(([date, records]) => {
        const presentCount = records.filter(r => r.status === 'present' || r.status === 'justified_absent').length;
        return { date, present: presentCount, absent: records.length - presentCount };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}, [viewingClassDetails, attendance]);

  const dailyStats = useMemo(() => {
    const totalStudents = studentsInClass.length;
    if (totalStudents === 0) return { present: 0, absent: 0, rate: 0 };
    // FIX: Ensure 'attendanceForSelectedClassAndDate' is treated as an array before filtering.
    const presentCount = (Array.isArray(attendanceForSelectedClassAndDate) ? attendanceForSelectedClassAndDate : []).filter(a => a.status === 'present' || a.status === 'justified_absent').length;
    const absentCount = totalStudents - presentCount;
    const rate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    return { present: presentCount, absent: absentCount, rate };
  }, [studentsInClass, attendanceForSelectedClassAndDate]);

   const chartData = useMemo(() => {
        if (studentsInClass.length === 0 || attendanceForSelectedClass.length === 0) return [];
        const groupedByDate = attendanceForSelectedClass.reduce((acc, record) => {
            if (!acc[record.date]) {
                acc[record.date] = [];
            }
            acc[record.date].push(record);
            return acc;
        }, {});
        return Object.entries(groupedByDate).map(([date, records]) => {
            const presentCount = records.filter(r => r.status === 'present' || r.status === 'justified_absent').length;
            const rate = studentsInClass.length > 0 ? Math.round((presentCount / studentsInClass.length) * 100) : 0;
            const [_, month, day] = date.split('-');
            return { date, formattedDate: `${day}/${month}`, 'Taxa de Presença (%)': rate };
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [attendanceForSelectedClass, studentsInClass.length]);
    
  const filteredAndSortedClasses = useMemo(() => {
    return classes
      .filter(cls => cls.name.toLowerCase().includes(classFilter.toLowerCase()))
      .sort((a, b) => (classSort === 'newest') ? (b.createdAt || 0) - (a.createdAt || 0) : (a.createdAt || 0) - (b.createdAt || 0));
  }, [classes, classFilter, classSort]);

  const handleGenerateAIReport = async () => {
    if (!selectedClass) return;
    setIsLoading(true);
    const report = await getAttendanceAnalysis(attendanceForSelectedClass, studentsInClass, [selectedClass]);
    setModalContent({ type: 'aiReport', content: report, title: 'Relatório de Presença com IA' });
    setIsLoading(false);
  };
  
  const handleGenerateRiskAnalysis = async (studentId) => {
    if (!selectedClass && !studentId) return;
    setIsLoading(true);
    setAiReport('');
    const studentList = studentId ? props.students : studentsInClass;
    const attendanceData = studentId ? props.attendance.filter(a => a.studentId === studentId) : attendanceForSelectedClass;
    const report = await getRiskAnalysis(attendanceData, studentList, studentId);
    setAiReport(report);
    setIsLoading(false);
  }
  
  const handleGenerateCommunicationDraft = async (student, type) => {
    const currentClass = viewingClassDetails || selectedClass;
    if (!currentClass) return;
    
    setIsLoading(true);
    const draft = await getCommunicationDraft(student.name, currentClass.name, type);
    setModalContent({
      type: 'communicationDraft',
      content: draft,
      studentName: student.name,
      onConfirm: (content) => {
        props.onLogCommunication({ studentId: student.id, studentName: student.name, classId: currentClass.id, className: currentClass.name, type, content });
      }
    });
    setIsLoading(false);
  }

  const handleClassSubmit = (e) => {
    e.preventDefault();
    if (modalContent?.type === 'addClass' && newClassName.trim()) {
        props.onAddClass(newClassName.trim());
    }
    if (modalContent?.type === 'editClass' && newClassName.trim()) {
        props.onEditClass(modalContent.class.id, newClassName.trim());
        if (viewingClassDetails?.id === modalContent.class.id) {
            setViewingClassDetails({ ...viewingClassDetails, name: newClassName.trim() });
        }
    }
    setNewClassName('');
    setModalContent(null);
  };
  
  const handleDeleteClass = () => {
    if (modalContent?.type === 'confirmDelete') {
      props.onDeleteClass(modalContent.class.id);
      if (viewingClassDetails?.id === modalContent.class.id) setViewingClassDetails(null);
      if (selectedClassId === modalContent.class.id) setSelectedClassId(classes.length > 1 ? classes.find(c => c.id !== modalContent.class.id).id : '');
    }
    setModalContent(null);
  }
  
  const handleExportDailyAttendance = () => {
    const data = studentsInClass.map(student => {
      const record = attendanceForSelectedClassAndDate.find(a => a.studentId === student.id);
      return {
        matricula: student.id,
        nome: student.name,
        status: record ? record.status : 'absent',
        data: selectedDate,
        turma: selectedClass?.name
      };
    });
    exportToCSV(data, `presenca_${selectedClass?.name}_${selectedDate}`);
  };

  const renderModal = () => {
    if (!modalContent) return null;
    
    const renderContent = () => {
        switch (modalContent.type) {
            case 'addClass':
            case 'editClass': return <form onSubmit={handleClassSubmit}><h2 className="text-xl font-bold mb-4 text-gray-800">{modalContent.type === 'addClass' ? 'Adicionar Nova Turma' : 'Editar Turma'}</h2><input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Nome da Turma" className="w-full bg-gray-100 border border-gray-300 text-gray-900 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500" autoFocus /><div className="flex justify-end gap-3"><button type="button" onClick={() => setModalContent(null)} className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-800">Cancelar</button><button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">Salvar</button></div></form>;
            case 'confirmDelete': return <div><h2 className="text-xl font-bold mb-4 text-gray-800">Confirmar Exclusão</h2><p className="text-gray-600 mb-6">Tem certeza que deseja excluir a turma "{modalContent.class.name}"? Esta ação não pode ser desfeita.</p><div className="flex justify-end gap-3"><button type="button" onClick={() => setModalContent(null)} className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-800">Cancelar</button><button onClick={handleDeleteClass} className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold">Excluir</button></div></div>;
            case 'aiReport': return <div><h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600"><SparklesIcon className="w-5 h-5"/> {modalContent.title}</h2><div className="prose prose-sm max-h-[60vh] overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700"><div dangerouslySetInnerHTML={renderMarkdown(modalContent.content)} /></div></div>;
            case 'communicationDraft': return <div><h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600"><EnvelopeIcon className="w-5 h-5"/> Rascunho para {modalContent.studentName}</h2><div className="max-h-[60vh] overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 whitespace-pre-wrap"><div dangerouslySetInnerHTML={renderMarkdown(modalContent.content)} /></div><div className="flex justify-end mt-4 gap-3"><button onClick={() => { modalContent.onConfirm(modalContent.content); setModalContent(null); }} className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">Registrar e Fechar</button></div></div>;
            case 'aiFeedbackOptions': { /* ... implementation ... */ }
            case 'qrCode': { /* ... implementation ... */ }
            case 'studentProfile': {
                const { student } = modalContent;
                const studentAttendance = props.attendance.filter(a => a.studentId === student.id);
                const studentCommunications = props.communicationLogs.filter(c => c.studentId === student.id);
                const studentChartData = Array.from(new Set(studentAttendance.map(a => a.classId))).map(classId => {
                    const classRecords = studentAttendance.filter(a => a.classId === classId);
                    const className = props.classes.find(c => c.id === classId)?.name || 'Desconhecida';
                    const presences = classRecords.filter(r => r.status === 'present' || r.status === 'justified_absent').length;
                    const total = classRecords.length;
                    return { name: className, "Presença (%)": total > 0 ? (presences / total) * 100 : 0 };
                });

                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl">{getInitials(student.name)}</div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
                                <p className="text-gray-500">{student.email} | Matrícula: {student.id}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h3 className="font-semibold text-gray-700 mb-2">Histórico de Presença por Turma</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={studentChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} unit="%" fontSize={12} />
                                    <YAxis type="category" dataKey="name" width={150} fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey="Presença (%)" fill="#3b82f6" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h3 className="font-semibold text-gray-700 mb-2">Comunicações com IA</h3>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {studentCommunications.length > 0 ? studentCommunications.map(log => (
                                    <div key={log.id} className="text-xs p-2 bg-white border rounded">
                                        <p><strong>{new Date(log.timestamp).toLocaleString('pt-BR')}:</strong> Feedback de "{log.type}" para a turma "{log.className}"</p>
                                    </div>
                                )) : <p className="text-sm text-gray-500 text-center py-4">Nenhuma comunicação registrada.</p>}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => handleGenerateRiskAnalysis(student.id)} className="flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"><SparklesIcon className="w-5 h-5"/> Análise de Risco IA</button>
                        </div>
                    </div>
                );
            }
             case 'viewJustification': {
                const { record } = modalContent;
                const studentName = props.students.find(s => s.id === record.studentId)?.name || 'Aluno';
                return (
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800"><FileTextIcon /> Justificativa de {studentName}</h2>
                        <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                            <p className="text-gray-700">{record.justification}</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { props.onUpdateJustificationStatus(record.id, 'rejected'); setModalContent(null); }} className="flex items-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"><XCircleIcon /> Rejeitar</button>
                            <button onClick={() => { props.onUpdateJustificationStatus(record.id, 'approved'); setModalContent(null); }} className="flex items-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"><CheckBadgeIcon /> Aprovar</button>
                        </div>
                    </div>
                );
            }
        }
    };
    return ( <div className="fixed inset-0 bg-gray-600/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"> <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative"> <button onClick={() => setModalContent(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button> {renderContent()} </div> </div> );
  };
  
  const renderCommonHeader = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap">
        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full sm:w-auto bg-white border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-blue-500">
            {props.classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
        </select>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full sm:w-auto bg-white border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />
    </div>
  );

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'attendance', label: 'Presenças', icon: UsersIcon },
    { id: 'classes', label: 'Turmas', icon: BookOpenIcon },
    { id: 'aiAnalysis', label: 'Análises IA', icon: ShieldExclamationIcon },
  ];
  
  const renderClassDetailsView = () => { /* ... implementation as before ... */ };
  const ProfileView = () => { /* ... implementation as before ... */ };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {renderModal()}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4"> {/* FIX: Add className to Logo component to satisfy required prop */}
<Logo className="h-10 w-auto"/> <div className="w-px h-6 bg-gray-200 hidden sm:block"></div> <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">Painel do Professor</h1> </div>
            <div className="relative" ref={profileDropdownRef}>
                <button onClick={() => setIsProfileDropdownOpen(prev => !prev)} className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold overflow-hidden"> {props.teacher.photoUrl ? <img src={props.teacher.photoUrl} alt="Foto de Perfil" className="w-full h-full object-cover" /> : <span>{getInitials(props.teacher.name)}</span>} </div>
                    <div className="hidden sm:flex flex-col items-start"> <span className="font-semibold text-sm">{props.teacher.name}</span> <span className="text-xs text-gray-500">{props.teacher.sector}</span> </div>
                </button>
                {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-fade-in-down">
                        <div className="p-4 border-b border-gray-200"> <p className="font-semibold text-sm">{props.teacher.name}</p> <p className="text-xs text-gray-500 truncate">{props.teacher.email}</p> </div>
                        <ul className="py-1">
                            <li><button onClick={() => { setActiveTab('profile'); setViewingClassDetails(null); setIsProfileDropdownOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"><UserCircleIcon className="w-5 h-5" /> Configurar Perfil</button></li>
                            <li><button onClick={props.onLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogoutIcon className="w-5 h-5" /> Sair</button></li>
                        </ul>
                    </div>
                )}
            </div>
            <style>{`@keyframes fade-in-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; } @keyframes slide-in-left { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } .animate-slide-in-left { animation: slide-in-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }`}</style>
        </div>
      </header>
      
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 mt-8 border-b border-gray-200 overflow-x-auto">
            {TABS.map(tab => ( <button key={tab.id} onClick={() => { setActiveTab(tab.id); setViewingClassDetails(null); }} className={`flex items-center gap-2 py-3 px-4 font-semibold transition-colors whitespace-nowrap text-sm ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}> <tab.icon className="w-5 h-5" /> {tab.label} </button> ))}
        </div>
      </div>

      <main className="p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {renderCommonHeader()}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-xl col-span-1 lg:col-span-3">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-blue-500"/> Resumo Inteligente da Turma</h3>
                  {isLoadingSummary ? <p className="text-gray-500">Analisando dados...</p> : <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={renderMarkdown(dashboardSummary)}></div>}
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-xl flex flex-col justify-center text-center"> <h3 className="text-gray-600">Taxa de Presença Hoje</h3> <p className="text-5xl font-bold text-blue-600 mt-2">{dailyStats.rate}%</p> </div>
            </div>
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Histórico de Presença da Turma</h3>
                {chartData.length > 1 ? ( <ResponsiveContainer width="100%" height={300}> <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="formattedDate" fontSize={12} /><YAxis unit="%" domain={[0, 100]} fontSize={12}/><Tooltip /><Legend /><Line type="monotone" dataKey="Taxa de Presença (%)" stroke="#2563eb" strokeWidth={2} /></LineChart> </ResponsiveContainer> ) : ( <div className="flex items-center justify-center h-[300px] text-gray-500"><p>Não há dados históricos suficientes para exibir o gráfico.</p></div> )}
            </div>
          </div>
        )}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap">
              {renderCommonHeader()}
              <div className="flex-grow"></div>
              <button onClick={handleExportDailyAttendance} className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-semibold transition-all"> <DownloadIcon/> Exportar CSV </button>
              <button onClick={() => { if (selectedClass) setModalContent({ type: 'qrCode', classId: selectedClass.id, className: selectedClass.name });}} disabled={!selectedClassId} className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed" > <QrCodeIcon/> Gerar Link </button>
              <button onClick={handleGenerateAIReport} disabled={isLoading || !selectedClassId} className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"> <SparklesIcon className="w-5 h-5" /> {isLoading ? 'Gerando...' : 'Relatório IA'} </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-gray-700">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider"> <tr> <th className="p-4 font-semibold">Aluno</th> <th className="p-4 font-semibold text-center">Status</th> <th className="p-4 font-semibold text-center">Ações</th> </tr> </thead>
                    <tbody className="divide-y divide-gray-200">
                        {studentsInClass.map(student => {
                            const record = attendanceForSelectedClassAndDate.find(a => a.studentId === student.id);
                            const status = record ? record.status : 'absent';
                            return (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium"><button onClick={() => setModalContent({type: 'studentProfile', student})} className="hover:underline hover:text-blue-600">{student.name}</button> <span className="text-gray-500">({student.id})</span></td>
                                    <td className="p-4 flex justify-center items-center gap-3">
                                        <button onClick={() => props.onSetAttendance(student.id, selectedClassId, selectedDate, 'present')} className={`py-1 px-4 rounded-full text-xs font-semibold ${status === 'present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-green-100'}`}>Presente</button>
                                        <button onClick={() => props.onSetAttendance(student.id, selectedClassId, selectedDate, 'absent')} className={`py-1 px-4 rounded-full text-xs font-semibold ${status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700 hover:bg-red-100'}`}>Ausente</button>
                                        {record?.justificationStatus === 'pending' && <button onClick={() => setModalContent({ type: 'viewJustification', record })} className="p-1 rounded-full bg-yellow-100 text-yellow-800 animate-pulse"><FileTextIcon className="w-4 h-4" /></button>}
                                    </td>
                                    <td className="p-4 text-center">
                                       {status === 'absent' && ( <button onClick={() => handleGenerateCommunicationDraft(student, 'absence')} disabled={isLoading} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:text-gray-300" title="Gerar e-mail para o aluno"> {/* FIX: Add className to EnvelopeIcon to prevent potential render issues. */}
<EnvelopeIcon className="w-5 h-5" /> </button> )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
          </div>
        )}
        {activeTab === 'aiAnalysis' && (
             <div className="space-y-6">
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveAnalysisTab('risk')} className={`py-2 px-4 font-semibold ${activeAnalysisTab === 'risk' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Risco Individual</button>
                    <button onClick={() => setActiveAnalysisTab('comparison')} className={`py-2 px-4 font-semibold ${activeAnalysisTab === 'comparison' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Análise Comparativa</button>
                </div>
                {activeAnalysisTab === 'risk' && (
                  <>
                    <div className="flex items-center gap-4">
                        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full sm:w-auto bg-white border border-gray-300 text-gray-900 rounded-lg p-3">
                            {props.classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                        </select>
                        <button onClick={() => handleGenerateRiskAnalysis()} disabled={isLoading || !selectedClassId} className="flex items-center gap-2 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"><SparklesIcon className="w-5 h-5" /> {isLoading ? 'Analisando...' : 'Gerar Análise de Risco'}</button>
                    </div>
                     <div className="bg-white border p-6 rounded-xl min-h-[400px]">
                        <h3 className="font-bold text-lg mb-4 text-blue-600">Relatório de Análise de Risco</h3>
                        {isLoading ? <p>Gerando relatório...</p> : aiReport ? <div className="prose prose-sm" dangerouslySetInnerHTML={renderMarkdown(aiReport)}></div> : <p>Clique em "Gerar Análise" para ver o relatório.</p>}
                    </div>
                  </>
                )}
                {activeAnalysisTab === 'comparison' && (
                  <div>WIP COMPARISON</div>
                )}
             </div>
        )}
        {activeTab === 'classes' && (
           <div className="flex flex-col lg:flex-row w-full gap-8 items-start">
                <div className="w-full lg:flex-1 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                         <input type="text" placeholder="Filtrar por nome..." value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full md:flex-grow bg-white border border-gray-300 text-gray-900 rounded-lg p-2" />
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <span className="text-gray-600 text-sm">Ordenar:</span>
                            <button onClick={() => setClassSort('newest')} className={`py-1 px-3 rounded-md text-sm font-semibold ${classSort === 'newest' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Recentes</button>
                            <button onClick={() => setClassSort('oldest')} className={`py-1 px-3 rounded-md text-sm font-semibold ${classSort === 'oldest' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Antigas</button>
                        </div>
                        <button onClick={() => { setNewClassName(''); setModalContent({ type: 'addClass' }); }} className="flex-shrink-0 w-full md:w-auto flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
                            <PlusIcon/> Nova Turma
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredAndSortedClasses.map(cls => (
                            <div key={cls.id} className="bg-white border p-6 rounded-xl flex flex-col justify-between hover:shadow-md">
                                <div>
                                    <h3 className="text-lg font-bold mb-2">{cls.name}</h3>
                                     <p className="text-sm text-gray-500 mb-4">{props.students.filter(s => s.classIds.includes(cls.id)).length} aluno(s)</p>
                                </div>
                                <div className="flex justify-end items-center gap-2 mt-4">
                                    <button onClick={() => setModalContent({ type: 'confirmDelete', class: cls })} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon /></button>
                                    <button onClick={() => setViewingClassDetails(cls)} className="flex-grow text-center py-2 px-4 bg-gray-100 rounded-lg text-sm font-semibold">Ver Detalhes</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                 {viewingClassDetails && ( <div className="w-full lg:w-5/12 xl:w-4/12 sticky top-24 animate-slide-in-left">{renderClassDetailsView()}</div> )}
            </div>
        )}
        {activeTab === 'profile' && <ProfileView />}
      </main>
    </div>
  );
};