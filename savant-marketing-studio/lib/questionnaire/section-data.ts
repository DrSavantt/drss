export const SECTION_DATA = {
  1: {
    title: 'Avatar Definition',
    description: 'Define your ideal customer with surgical precision - who they are, what they want, and where to find them.',
    estimatedTime: '7 min',
    totalQuestions: 5,
    questions: ['q1', 'q2', 'q3', 'q4', 'q5'],
  },
  2: {
    title: 'Dream Outcome & Value',
    description: 'Articulate the transformation you provide and the value equation that makes your offer irresistible.',
    estimatedTime: '8 min',
    totalQuestions: 5,
    questions: ['q6', 'q7', 'q8', 'q9', 'q10'],
  },
  3: {
    title: 'Problems & Obstacles',
    description: 'Identify the external, internal, and philosophical barriers your clients face.',
    estimatedTime: '7 min',
    totalQuestions: 5,
    questions: ['q11', 'q12', 'q13', 'q14', 'q15'],
  },
  4: {
    title: 'Solution & Methodology',
    description: 'Define your unique approach, delivery mechanism, and what sets you apart.',
    estimatedTime: '6 min',
    totalQuestions: 4,
    questions: ['q16', 'q17', 'q18', 'q19'],
  },
  5: {
    title: 'Brand Voice & Communication',
    description: 'Establish how your brand sounds, feels, and communicates with your audience.',
    estimatedTime: '5 min',
    totalQuestions: 4,
    questions: ['q20', 'q21', 'q22', 'q23'],
  },
  6: {
    title: 'Proof & Transformation',
    description: 'Document your track record, results, credentials, and guarantees.',
    estimatedTime: '7 min',
    totalQuestions: 4,
    questions: ['q24', 'q25', 'q26', 'q27'],
  },
  7: {
    title: 'Faith Integration',
    description: 'Optional: Align your business messaging with your values and mission.',
    estimatedTime: '3 min',
    totalQuestions: 3,
    questions: ['q28', 'q29', 'q30'],
  },
  8: {
    title: 'Business Metrics',
    description: 'Current position, revenue, and growth goals to contextualize your strategy.',
    estimatedTime: '4 min',
    totalQuestions: 2,
    questions: ['q31', 'q32'],
  },
} as const;

export type SectionNumber = keyof typeof SECTION_DATA;
