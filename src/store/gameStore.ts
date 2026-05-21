'use client'
import { create } from 'zustand'
import { Character, GameScreen } from '@/types/player'

interface GameState {
  screen: GameScreen
  player1: Character | null
  player2: Character | null
  setScreen: (screen: GameScreen) => void
  setPlayer1: (char: Character) => void
  setPlayer2: (char: Character) => void
}

export const useGameStore = create<GameState>((set) => ({
  screen: 'main-menu',
  player1: null,
  player2: null,
  setScreen: (screen) => set({ screen }),
  setPlayer1: (char) => set({ player1: char }),
  setPlayer2: (char) => set({ player2: char }),
}))
