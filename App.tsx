
import React, { useState, useEffect } from 'react';
import { StudentView } from './components/StudentView';
import { TeacherLogin } from './components/TeacherLogin';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentLogin, StudentRegisterData } from './components/StudentLogin';
import { MOCK_CLASSES, MOCK_TEACHER_ID } from './constants';
import type { Student, Class, AttendanceRecord, Teacher, CommunicationLog, CommunicationType } from './types';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>(MOCK_CLASSES);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loggedInTeacher, setLoggedInTeacher] = useState<Teacher | null>(null);
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
  const [initialFeedback, setInitialFeedback] = useState<{type: 'success'|'error', message: string} | null>(null);
  const [studentCredentials, setStudentCredentials] = useState<Record<string, string>>({});
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  
  const today = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    // Este efeito garante que, para o dia atual, todos os alunos tenham um
    // registro de presença (inicialmente como 'ausente'). Ele é executado para
    // preencher os dados do dia assim que o aplicativo carrega.

    // 1. Coleta os registros de presença que já existem para hoje para evitar duplicatas.
    const existingRecords = new Set(attendance.filter(a => a.date === today).map(a => `${a.studentId}-${a.classId}`));
    
    // 2. Itera sobre todas as turmas e seus respectivos alunos.
    const newRecords: AttendanceRecord[] = [];
    classes.forEach(cls => {
        const studentsInClass = students.filter(s => s.classIds.includes(cls.id));
        studentsInClass.forEach(student => {
             // 3. Se um aluno de uma turma não tem registro para hoje, cria um novo como 'ausente'.
             if (!existingRecords.has(`${student.id}-${cls.id}`)) {
                newRecords.push({
                    id: `att-${student.id}-${cls.id}-${today}`,
                    studentId: student.id,
                    classId: cls.id,
                    date: today,
                    status: 'absent',
                });
            }
        });
    });

    // 4. Se novos registros de ausência foram criados, atualiza o estado da aplicação.
    if (newRecords.length > 0) {
      setAttendance(prev => [...prev, ...newRecords]);
    }
  }, [students, classes, today, attendance]);


  const handleMarkAttendance = (studentId: string, classId: string) => {
    const recordId = `att-${studentId}-${classId}-${today}`;
    const existingRecord = attendance.find(r => r.id === recordId);
    
    if (existingRecord?.status === 'present' || existingRecord?.status === 'justified_absent') {
      throw new Error("Sua presença já foi registrada para esta turma hoje.");
    }
    
    handleSetAttendance(studentId, classId, today, 'present');
  };

  const handleSetAttendance = (studentId: string, classId: string, date: string, status: 'present' | 'absent') => {
    const recordId = `att-${studentId}-${classId}-${date}`;
    setAttendance(prevAttendance => {
      const recordIndex = prevAttendance.findIndex(record => record.id === recordId);

      if (recordIndex > -1) {
        // Update existing record
        const updatedAttendance = [...prevAttendance];
        updatedAttendance[recordIndex] = { ...updatedAttendance[recordIndex], status };
        return updatedAttendance;
      } else {
        // Create new record if it doesn't exist
        const newRecord: AttendanceRecord = {
          id: recordId,
          studentId,
          classId,
          date,
          status,
        };
        return [...prevAttendance, newRecord];
      }
    });
  };

  const handleJustifyAbsence = (recordId: string, justification: string) => {
    setAttendance(prev => prev.map(rec => 
        rec.id === recordId 
            ? { ...rec, justification, justificationStatus: 'pending' } 
            : rec
    ));
  };
  
  const handleUpdateJustificationStatus = (recordId: string, status: 'approved' | 'rejected') => {
      setAttendance(prev => prev.map(rec => {
          if (rec.id === recordId) {
              return {
                  ...rec,
                  justificationStatus: status,
                  status: status === 'approved' ? 'justified_absent' : 'absent'
              };
          }
          return rec;
      }));
  };

  const handleLogCommunication = (log: Omit<CommunicationLog, 'id' | 'timestamp'>) => {
    const newLog: CommunicationLog = {
      ...log,
      id: `comm-${Date.now()}`,
      timestamp: Date.now()
    };
    setCommunicationLogs(prev => [newLog, ...prev]);
  };

  const processAttendanceLink = (student: Student) => {
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('classId');
    const date = urlParams.get('date');

    if (classId && date === today) {
        if (student.classIds.includes(classId)) {
            try {
                handleMarkAttendance(student.id, classId);
                setInitialFeedback({type: 'success', message: 'Presença registrada com sucesso através do link!'});
            } catch (e) {
                if (e instanceof Error) {
                    setInitialFeedback({type: 'error', message: e.message});
                }
            }
        } else {
            setInitialFeedback({type: 'error', message: 'Você não está matriculado na turma especificada pelo link.'});
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  };
  
  const handleTeacherLogin = (teacher: Teacher) => {
    setLoggedInTeacher(teacher);
  };

  const handleTeacherLogout = () => {
    setLoggedInTeacher(null);
  };
  
  const handleStudentRegister = (data: StudentRegisterData) => {
      if (students.some(s => s.id === data.id)) {
          throw new Error('Já existe um aluno com esta matrícula.');
      }
      if (students.some(s => s.email === data.email)) {
          throw new Error('Já existe um aluno com este email.');
      }
       // Store password for mock login
      if (data.password) {
          setStudentCredentials(prev => ({ ...prev, [data.email]: data.password! }));
      }
      const newStudent: Student = {
          id: data.id,
          name: data.name,
          email: data.email,
          classIds: data.classIds,
      };
      setStudents(prev => [...prev, newStudent]);
      setLoggedInStudent(newStudent);
      processAttendanceLink(newStudent);
  };

  const handleStudentLogin = (email: string, password: string) => {
      const student = students.find(s => s.email === email);
      if (!student) {
          throw new Error('Email não encontrado.');
      }
      if (studentCredentials[email] !== password) {
          throw new Error('Senha incorreta.');
      }
      setLoggedInStudent(student);
      processAttendanceLink(student);
  };
  
  const handleStudentLogout = () => {
    setLoggedInStudent(null);
    setInitialFeedback(null);
    window.location.href = window.location.pathname; // Go to teacher login
  }

  const handleAddClass = (className: string) => {
    const newClass: Class = {
      id: `c${Date.now()}`,
      name: className,
      teacherId: loggedInTeacher?.id || MOCK_TEACHER_ID,
      createdAt: Date.now(),
    };
    setClasses(prev => [...prev, newClass]);
  };
  
  const handleEditClass = (classId: string, newName: string) => {
    setClasses(prev => prev.map(c => c.id === classId ? {...c, name: newName} : c));
  };
  
  const handleDeleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    setAttendance(prev => prev.filter(a => a.classId !== classId));
    // Also remove this class from students
    setStudents(prev => prev.map(s => ({
        ...s,
        classIds: s.classIds.filter(id => id !== classId)
    })))
  };

  const handleUpdateTeacherProfile = (updatedData: Partial<Teacher>) => {
    setLoggedInTeacher(prev => {
        if (!prev) return null;
        return { ...prev, ...updatedData };
    });
  };

  const renderContent = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasLinkParams = urlParams.has('classId') && urlParams.has('date');

    if (loggedInStudent) {
       return <StudentView 
            student={loggedInStudent} 
            allClasses={classes} 
            attendanceRecords={attendance.filter(a => a.studentId === loggedInStudent.id)}
            onMarkAttendance={handleMarkAttendance} 
            onLogout={handleStudentLogout}
            onJustifyAbsence={handleJustifyAbsence}
            initialFeedback={initialFeedback}
        />;
    }

    if (loggedInTeacher) {
        return <TeacherDashboard 
            teacher={loggedInTeacher}
            students={students}
            classes={classes}
            attendance={attendance}
            communicationLogs={communicationLogs}
            onLogout={handleTeacherLogout}
            onSetAttendance={handleSetAttendance}
            onAddClass={handleAddClass}
            onEditClass={handleEditClass}
            onDeleteClass={handleDeleteClass}
            onAddStudentToClass={() => {}}
            onUpdateTeacherProfile={handleUpdateTeacherProfile}
            onLogCommunication={handleLogCommunication}
            onUpdateJustificationStatus={handleUpdateJustificationStatus}
        />;
    }

    if (hasLinkParams) {
        return <StudentLogin classes={classes} onLogin={handleStudentLogin} onRegister={handleStudentRegister} />;
    }

    return <TeacherLogin onLogin={handleTeacherLogin} />;
  };

  return <div>{renderContent()}</div>;
};

export default App;
