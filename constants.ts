
import type { Student, Class } from './types';

export const MOCK_STUDENTS: Student[] = [];

export const MOCK_CLASSES: Class[] = [
  { id: 'c1', name: 'Desenvolvimento Frontend com React', teacherId: 't1', createdAt: Date.now() - 200000 },
  { id: 'c2', name: 'Algoritmos e Estrutura de Dados', teacherId: 't1', createdAt: Date.now() - 100000 },
  { id: 'c3', name: 'Inteligência Artificial Aplicada', teacherId: 't1', createdAt: Date.now() },
];

export const MOCK_TEACHER_ID = 't1';