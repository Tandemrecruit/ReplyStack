export type Question = {
  id: number;
  text: string;
  allowMultiple: boolean;
  answers: Array<{
    id: number;
    text: string;
  }>;
};

export type QuizAnswer = {
  questionId: number;
  answerIds: number[];
};

export const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What is your preferred communication style?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Warm and empathetic" },
      { id: 2, text: "Direct and straightforward" },
      { id: 3, text: "Professional and polished" },
      { id: 4, text: "Friendly and conversational" },
      { id: 5, text: "Casual and relaxed" },
    ],
  },
  {
    id: 2,
    text: "How do you handle negative reviews?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Acknowledge concerns with empathy and offer solutions" },
      { id: 2, text: "Address issues directly and professionally" },
      {
        id: 3,
        text: "Thank them for the feedback and invite private discussion",
      },
      { id: 4, text: "Show understanding while maintaining brand voice" },
      { id: 5, text: "Keep it brief and move conversation offline" },
    ],
  },
  {
    id: 3,
    text: "What is your preferred response length?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Very brief (50-100 words)" },
      { id: 2, text: "Short (100-150 words)" },
      { id: 3, text: "Medium (150-250 words)" },
      { id: 4, text: "Detailed (250-350 words)" },
      { id: 5, text: "Comprehensive (350+ words)" },
    ],
  },
  {
    id: 4,
    text: "What type of customer relationship do you want to build?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Personal and caring" },
      { id: 2, text: "Professional and trustworthy" },
      { id: 3, text: "Friendly and approachable" },
      { id: 4, text: "Efficient and solution-focused" },
      { id: 5, text: "Relaxed and authentic" },
    ],
  },
  {
    id: 5,
    text: "How do you prioritize handling complaints?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Address immediately with personal attention" },
      { id: 2, text: "Acknowledge quickly and provide clear next steps" },
      { id: 3, text: "Respond professionally with structured approach" },
      { id: 4, text: "Show understanding and offer flexible solutions" },
      { id: 5, text: "Keep response brief and direct to resolution" },
    ],
  },
  {
    id: 6,
    text: "What formality level matches your brand?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Very formal" },
      { id: 2, text: "Formal" },
      { id: 3, text: "Moderately formal" },
      { id: 4, text: "Casual" },
      { id: 5, text: "Very casual" },
    ],
  },
  {
    id: 7,
    text: "How urgent should your responses feel?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Very urgent - immediate action" },
      { id: 2, text: "Urgent - prompt response" },
      { id: 3, text: "Moderate - timely but thoughtful" },
      { id: 4, text: "Relaxed - take time to respond" },
      { id: 5, text: "Very relaxed - no rush" },
    ],
  },
  {
    id: 8,
    text: "What communication tone best represents your brand?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Empathetic and understanding" },
      { id: 2, text: "Confident and authoritative" },
      { id: 3, text: "Professional and reliable" },
      { id: 4, text: "Warm and welcoming" },
      { id: 5, text: "Authentic and genuine" },
    ],
  },
  {
    id: 9,
    text: "What industry type(s) does your business operate in?",
    allowMultiple: true,
    answers: [
      { id: 1, text: "Restaurant & Food Service" },
      { id: 2, text: "Retail & E-commerce" },
      { id: 3, text: "Healthcare & Medical" },
      { id: 4, text: "Professional Services" },
      { id: 5, text: "Hospitality & Travel" },
      { id: 6, text: "Beauty & Wellness" },
      { id: 7, text: "Technology & Software" },
      { id: 8, text: "Education & Training" },
      { id: 9, text: "Real Estate" },
      { id: 10, text: "Other" },
    ],
  },
  {
    id: 10,
    text: "What brand personality traits describe your business?",
    allowMultiple: true,
    answers: [
      { id: 1, text: "Trustworthy" },
      { id: 2, text: "Innovative" },
      { id: 3, text: "Caring" },
      { id: 4, text: "Professional" },
      { id: 5, text: "Friendly" },
      { id: 6, text: "Authentic" },
      { id: 7, text: "Efficient" },
      { id: 8, text: "Creative" },
      { id: 9, text: "Reliable" },
      { id: 10, text: "Approachable" },
    ],
  },
];
