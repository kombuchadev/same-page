export interface Pack {
  id: string;
  name: string;
  description: string;
  questions: string[];
}

export const PACKS: Pack[] = [
  {
    id: 'starter_pack',
    name: 'The Essentials',
    description: 'Perfect for your first game. Easy, everyday basics.',
    questions: [
      "What is the first thing that comes to mind when thinking of 'Red'?",
      'Name a fruit you have to peel before eating.',
      'What is the most popular topping on a pizza?',
      "Name a common pet that isn't a dog or a cat.",
      "Which finger is the 'Ring Finger'?",
      "Name a breakfast food that starts with 'P'.",
      'What color is a standard school bus?',
      'Name a sport played with a round ball.',
      'What is the most common sound a clock makes?',
      'Name something people do when they are happy.',
    ],
  },
  {
    id: 'foodie_frenzy',
    name: 'The Foodie Pack',
    description: 'Warning: May cause hunger. Best played at dinner.',
    questions: [
      'How many chicken nuggets can the average person eat in a minute?',
      'What is the best shape for a pasta noodle?',
      'Name a condiment you keep in the fridge.',
      "What is the 'default' flavor of ice cream?",
      'Name a vegetable that kids usually hate.',
      'What is the best way to cook an egg?',
      'Name a drink you would order at a fast-food drive-thru.',
      'What is the most important ingredient in a sandwich?',
      'Name a fruit that is also a color.',
      'What is the best snack to eat at a movie theater?',
    ],
  },
  {
    id: 'pop_culture',
    name: 'The Screen & Stage',
    description: 'Movies, music, and the internet. Do you know the trends?',
    questions: [
      'Who is the most famous superhero of all time?',
      'Name a song that everyone knows the lyrics to.',
      "What is the first movie you think of when you hear 'Sci-Fi'?",
      'Name a social media app that people use every single day.',
      "Who is the most famous 'Chris' in Hollywood?",
      'Name a Disney movie that makes people cry.',
      'What is the most iconic video game character?',
      'Name a streaming service other than Netflix.',
      "What instrument is the most 'rock and roll'?",
      'Name a celebrity who is famous for just being famous.',
    ],
  },
  {
    id: 'impossible_logic',
    name: 'The Deep End',
    description: 'Abstract and weird. No right answers, only popular ones.',
    questions: [
      'Is a hotdog a sandwich? (Yes/No)',
      'How many holes does a straw have?',
      'What is the loudest animal on Earth?',
      'If you could have one superpower, what would it be?',
      'What color is the number 7?',
      "How many minutes is a 'quick shower'?",
      'What is the best letter of the alphabet?',
      "If you were a ghost, who is the first person you'd haunt?",
      'What is the scariest month of the year?',
      'Name something you can never have too much of.',
    ],
  },
];

export const PACK_ICONS: Record<string, string> = {
  starter_pack: '⭐',
  foodie_frenzy: '🍕',
  pop_culture: '🎬',
  impossible_logic: '🧩',
};

export function getPackById(id: string): Pack | undefined {
  return PACKS.find((p) => p.id === id);
}

/**
 * Pick a random question from the combined pool of all selected packs,
 * avoiding already-used indices.
 */
export function pickQuestionFromPacks(
  packIds: string[],
  usedIndices: number[]
): { question: string; index: number } {
  const allQuestions: string[] = [];
  for (const packId of packIds) {
    const pack = getPackById(packId);
    if (pack) allQuestions.push(...pack.questions);
  }

  if (allQuestions.length === 0) {
    throw new Error('No questions found for selected packs');
  }

  const available = allQuestions
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => !usedIndices.includes(i));

  // If all questions exhausted, reset
  const pool = available.length > 0 ? available : allQuestions.map((q, i) => ({ q, i }));
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return { question: picked.q, index: picked.i };
}
