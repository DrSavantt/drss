export interface Section {
  number: number;
  title: string;
  description: string;
  questions: number;
  time: string;
}

export const sections: Section[] = [
  {
    number: 1,
    title: "Avatar Definition",
    description: "Define your ideal customer with precision and clarity",
    questions: 5,
    time: "7 min"
  },
  {
    number: 2,
    title: "Dream Outcome & Value Equation",
    description: "Articulate the transformation and value you provide",
    questions: 5,
    time: "8 min"
  },
  {
    number: 3,
    title: "Problems & Obstacles",
    description: "Identify the challenges your customers face",
    questions: 5,
    time: "7 min"
  },
  {
    number: 4,
    title: "Solution & Methodology",
    description: "Explain your unique approach and methodology",
    questions: 4,
    time: "6 min"
  },
  {
    number: 5,
    title: "Brand Voice & Communication",
    description: "Define how your brand speaks and connects",
    questions: 4,
    time: "5 min"
  },
  {
    number: 6,
    title: "Proof & Transformation",
    description: "Showcase results and social proof",
    questions: 4,
    time: "7 min"
  },
  {
    number: 7,
    title: "Faith Integration (Optional)",
    description: "Integrate faith-based messaging if applicable",
    questions: 3,
    time: "3 min"
  },
  {
    number: 8,
    title: "Business Metrics",
    description: "Define your business goals and metrics",
    questions: 2,
    time: "4 min"
  }
];
