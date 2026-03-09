import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from '@/src/context/GameContext';

export default function RootLayout() {
  return (
    <GameProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="create" />
        <Stack.Screen name="lobby/[roomCode]" />
        <Stack.Screen name="game/[roomCode]" />
        <Stack.Screen name="reveal/[roomCode]" />
        <Stack.Screen name="results/[roomCode]" />
      </Stack>
      <StatusBar style="light" />
    </GameProvider>
  );
}
