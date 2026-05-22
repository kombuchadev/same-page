import { useState, useEffect, useRef } from 'react';

export function useLoadingMessages(messages: string[], intervalMs = 1500): string {
  const [index, setIndex] = useState(0);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messagesRef.current.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, messages.length]);

  return messages[index] ?? messages[0];
}

export const LOADING_MESSAGES = {
  createRoom: [
    '🃏 Shuffling the cards…',
    '🏠 Building the room…',
    '✨ Setting the stage…',
    '🎲 Almost ready…',
  ],
  joinRoom: [
    '🔑 Knocking on the door…',
    '🪑 Finding your seat…',
    '🎮 Getting you in…',
    '🤞 Almost there…',
  ],
  startGame: [
    '🧠 Warming up brains…',
    '🚀 Launching the game…',
    '🎯 Preparing prompts…',
    "⚡ Let's go!…",
  ],
  saveSettings: ['⚙️ Locking it in…', '📝 Saving your rules…', '✅ Almost done…'],
  calculating: [
    '🧮 Crunching the numbers…',
    '🔍 Comparing answers…',
    '🏆 Finding consensus…',
    '✨ Almost done…',
  ],
  generic: ['⏳ Hang tight…', '🎲 Rolling the dice…', '🧠 Thinking hard…', '✨ Almost there…'],
};
