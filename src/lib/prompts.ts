export const PROMPTS: string[] = [
  "Name a fruit",
  "Name a color",
  "Name a country in Europe",
  "Name something you take to the beach",
  "Name a superhero",
  "Name a breakfast food",
  "Name a board game",
  "Name something cold",
  "Name a planet",
  "Name a musical instrument",
  "Name a type of dog",
  "Name a pizza topping",
  "Name a cartoon character",
  "Name something you find in a kitchen",
  "Name a sport played with a ball",
  "Name a flavor of ice cream",
  "Name a holiday",
  "Name something that flies",
  "Name a body of water",
  "Name a vegetable",
  "Name a Disney movie",
  "Name something you wear on your feet",
  "Name a type of candy",
  "Name a zoo animal",
  "Name something round",
  "Name a famous landmark",
  "Name a school subject",
  "Name something you plug in",
  "Name a type of weather",
  "Name a fast food restaurant",
  "Name something in a bathroom",
  "Name a type of flower",
  "Name a summer activity",
  "Name something that has wheels",
  "Name a bedtime routine step",
  "Name a type of hat",
  "Name something you find at a park",
  "Name a video game",
  "Name a word that starts with Z",
  "Name something yellow",
  "Name a type of dance",
  "Name a fairy tale character",
  "Name something you find in a wallet",
  "Name a type of cheese",
  "Name something that makes noise",
  "Name a winter activity",
  "Name a famous person named John",
  "Name a type of bird",
  "Name something you do before bed",
  "Name a type of tree",
  "Name a movie genre",
  "Name something in a classroom",
  "Name a type of sandwich",
  "Name something that smells good",
  "Name a famous book",
];

export function pickRandomPrompt(usedIndices: number[]): {
  prompt: string;
  index: number;
} {
  const available = PROMPTS.map((_, i) => i).filter(
    (i) => !usedIndices.includes(i)
  );

  // If all prompts used, reset
  const pool = available.length > 0 ? available : PROMPTS.map((_, i) => i);
  const index = pool[Math.floor(Math.random() * pool.length)];

  return { prompt: PROMPTS[index], index };
}
