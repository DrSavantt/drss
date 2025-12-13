import { QuestionnaireData } from './types';

export function shouldShowQuestion(
  questionId: string,
  formData: QuestionnaireData
): boolean {
  // Q31 and Q32 only show if Q30 != "separate"
  if (questionId === 'q31' || questionId === 'q32') {
    const faithPreference = formData.faith_integration?.q30_faith_preference;
    return faithPreference !== 'separate' && faithPreference !== '';
  }

  // All other questions always show
  return true;
}

export function getVisibleQuestions(formData: QuestionnaireData): string[] {
  const allQuestions = [
    'q1', 'q2', 'q3', 'q4', 'q5',
    'q6', 'q7', 'q8', 'q9', 'q10',
    'q11', 'q12', 'q13', 'q14', 'q15',
    'q16', 'q17', 'q18', 'q19',
    'q20', 'q21', 'q22', 'q23', 'q24',
    'q25', 'q26', 'q27', 'q28', 'q29',
    'q30', 'q31', 'q32',
    'q33', 'q34'
  ];

  return allQuestions.filter(q => shouldShowQuestion(q, formData));
}
