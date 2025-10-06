import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// Types
interface GameState {
  currentStage: number;
  maxStage: number;
  timeLeft: number;
  gameOver: boolean;
  correctWord: string;
  allWords: string[];
  showStageSelection: boolean;
  unlockedStages: number[];
  showWrongAnswer: boolean;
  gameMode: GameMode;
  flickeringIndices: number[];
  failureReason: FailureReason;
}

type GameMode = 'easy' | 'hard';
type FailureReason = 'wrong' | 'timeout';
type GameScreen = 'stageSelection' | 'game' | 'wrongAnswer' | 'gameOver';

interface WordSet {
  correct: string;
  baseWord: string;
}

interface StageDifficulty {
  wordCount: number;
  fontSize: number;
  buttonSize: number;
  timeLimit: number;
}

// Constants
const WORD_SETS: WordSet[] = [
  { correct: '당군', baseWord: '당근' },
  { correct: '이식', baseWord: '이삭' },
  { correct: '마이스', baseWord: '마우스' },
  { correct: '닰', baseWord: '닭' },
  { correct: '옥톱방', baseWord: '옥탑방' },
  { correct: '아머리카노', baseWord: '아메리카노' },
  { correct: '프로펠러', baseWord: '프로펠라' },
  { correct: '미우스', baseWord: '마우스' },
];

const MAX_STAGE = 10;
const BASE_TIME_LIMIT = 20;

// Game Logic Services
class DifficultyCalculator {
  static calculateStageDifficulty(stage: number, mode: GameMode): StageDifficulty {
    const baseCount = mode === 'easy' ? 20 : 30;
    const countMultiplier = 1 + (stage - 1) * 0.25;
    const wordCount = Math.floor(baseCount * countMultiplier);
    
    const lastStageFontSize = 16;
    const lastStageButtonSize = width * 0.10;
    
    const fontSize = lastStageFontSize + (MAX_STAGE - stage) * 0.8;
    const buttonSize = lastStageButtonSize + (MAX_STAGE - stage) * 0.004;
    
    return {
      wordCount,
      fontSize,
      buttonSize,
      timeLimit: BASE_TIME_LIMIT,
    };
  }
}

class WordGenerator {
  static generateWords(stage: number, mode: GameMode): { correctWord: string; allWords: string[] } {
    const randomSet = WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)];
    const difficulty = DifficultyCalculator.calculateStageDifficulty(stage, mode);
    
    const wrongWords = Array(difficulty.wordCount).fill(randomSet.baseWord);
    const allWords = [...wrongWords, randomSet.correct];
    
    // Fisher-Yates shuffle
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }
    
    return { correctWord: randomSet.correct, allWords };
  }
}

class GameStateManager {
  static getInitialState(): GameState {
    return {
      currentStage: 1,
      maxStage: MAX_STAGE,
      timeLeft: BASE_TIME_LIMIT,
      gameOver: false,
      correctWord: '',
      allWords: [],
      showStageSelection: true,
      unlockedStages: [1],
      showWrongAnswer: false,
      gameMode: 'easy',
      flickeringIndices: [],
      failureReason: 'wrong',
    };
  }
}

// Custom Hooks

function useFlickeringEffect(
  gameMode: GameMode,
  isGameActive: boolean,
  wordCount: number,
  stage: number
): number[] {
  const [flickeringIndices, setFlickeringIndices] = useState<number[]>([]);

  useEffect(() => {
    if (gameMode === 'hard' && isGameActive) {
      const interval = setInterval(() => {
        const newIndices: number[] = [];
        
        // Always one flickering light
        newIndices.push(Math.floor(Math.random() * wordCount));
        
        // Two lights from stage 5 onwards
        if (stage >= 5) {
          let secondIndex;
          do {
            secondIndex = Math.floor(Math.random() * wordCount);
          } while (secondIndex === newIndices[0]);
          newIndices.push(secondIndex);
        }
        
        setFlickeringIndices(newIndices);
      }, 300);

      return () => clearInterval(interval);
    } else {
      setFlickeringIndices([]);
    }
  }, [gameMode, isGameActive, wordCount, stage]);

  return flickeringIndices;
}

// UI Components
const StageSelectionScreen: React.FC<{
  gameState: GameState;
  onStageSelect: (stage: number) => void;
  onModeToggle: () => void;
}> = ({ gameState, onStageSelect, onModeToggle }) => (
  <View style={styles.container}>
    <View style={styles.stageSelectionContainer}>
      <Text style={styles.stageSelectionTitle}>스테이지 선택</Text>
      <Text style={styles.challengeMessage}>한번에 스테이지 10까지 깨보세요!</Text>
      
      <View style={styles.modeSelector}>
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            gameState.gameMode === 'easy' && styles.activeEasyModeButton
          ]} 
          onPress={onModeToggle}
        >
          <Text style={[
            styles.modeButtonText,
            gameState.gameMode === 'easy' && styles.activeModeButtonText
          ]}>
            이지 모드
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            gameState.gameMode === 'hard' && styles.activeHardModeButton
          ]} 
          onPress={onModeToggle}
        >
          <Text style={[
            styles.modeButtonText,
            gameState.gameMode === 'hard' && styles.activeModeButtonText
          ]}>
            하드 모드
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.stagesGrid}>
        {Array.from({ length: gameState.maxStage }, (_, i) => i + 1).map(stage => (
          <TouchableOpacity
            key={stage}
            style={[
              styles.stageButton,
              gameState.unlockedStages.includes(stage) ? styles.unlockedStage : styles.lockedStage
            ]}
            onPress={() => gameState.unlockedStages.includes(stage) && onStageSelect(stage)}
            disabled={!gameState.unlockedStages.includes(stage)}
          >
            <Text style={[
              styles.stageButtonText,
              !gameState.unlockedStages.includes(stage) && styles.lockedStageText
            ]}>
              {stage}
            </Text>
            {stage > 1 && !gameState.unlockedStages.includes(stage) && (
              <Text style={styles.lockIcon}>🔒</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </View>
);

const GameScreen: React.FC<{
  gameState: GameState;
  onWordClick: (word: string) => void;
}> = ({ gameState, onWordClick }) => {
  const difficulty = DifficultyCalculator.calculateStageDifficulty(
    gameState.currentStage, 
    gameState.gameMode
  );
  
  const isGameActive = !gameState.gameOver && !gameState.showWrongAnswer;
  const flickeringIndices = useFlickeringEffect(
    gameState.gameMode,
    isGameActive,
    gameState.allWords.length,
    gameState.currentStage
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.infoRow}>
          <Text style={styles.stageText}>스테이지: {gameState.currentStage}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={[
            styles.timerText, 
            gameState.timeLeft <= 5 && styles.timerWarning
          ]}>
            ⏰ {gameState.timeLeft}초
          </Text>
        </View>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>한 글자만 다른 단어를 찾으세요!</Text>
        <Text style={styles.instructionsSubtitle}>
          같은 단어들 중에서 다른 단어 하나를 찾아 클릭하세요!
        </Text>
      </View>

      <View style={styles.wordsGrid}>
        {gameState.allWords.map((word, index) => {
          const isFlickering = flickeringIndices.includes(index);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.wordButton,
                {
                  minWidth: difficulty.buttonSize,
                  backgroundColor: isFlickering ? '#27ae60' : '#fff',
                  borderColor: isFlickering ? '#27ae60' : '#bdc3c7',
                }
              ]}
              onPress={() => onWordClick(word)}
            >
              <Text style={[
                styles.wordText,
                {
                  fontSize: difficulty.fontSize,
                  color: isFlickering ? '#fff' : '#2c3e50',
                }
              ]}>
                {word}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const WrongAnswerScreen: React.FC<{
  failureReason: FailureReason;
  onBackToMain: () => void;
}> = ({ failureReason, onBackToMain }) => (
  <View style={styles.container}>
    <View style={styles.wrongAnswerContainer}>
      <Text style={styles.wrongAnswerTitle}>
        {failureReason === 'timeout' ? '⏰ 시간 초과!' : '❌ 실패!'}
      </Text>
      <TouchableOpacity style={styles.backToMainButton} onPress={onBackToMain}>
        <Text style={styles.backToMainButtonText}>메인화면으로 돌아가기</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Main Game Component
const WordQuizGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameStateManager.getInitialState());

  // Timer effect will be handled in the timer countdown useEffect

  // Game initialization
  const initializeGame = useCallback((stage: number = gameState.currentStage) => {
    const { correctWord, allWords } = WordGenerator.generateWords(stage, gameState.gameMode);
    
    setGameState(prev => ({
      ...prev,
      correctWord,
      allWords,
      timeLeft: BASE_TIME_LIMIT,
      gameOver: false,
      timeUp: false,
    }));
  }, [gameState.gameMode]);

  // Timer countdown (only during active gameplay)
  useEffect(() => {
    if (!gameState.gameOver && 
        gameState.timeLeft > 0 && 
        !gameState.showWrongAnswer && 
        !gameState.showStageSelection) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.timeLeft === 0 && 
               !gameState.gameOver && 
               !gameState.showWrongAnswer && 
               !gameState.showStageSelection) {
      // Time's up!
      setGameState(prev => ({
        ...prev,
        showWrongAnswer: true,
        failureReason: 'timeout',
      }));
    }
  }, [gameState.timeLeft, gameState.gameOver, gameState.showWrongAnswer, gameState.showStageSelection]);

  // Initialize game when starting
  useEffect(() => {
    if (!gameState.showStageSelection) {
      initializeGame();
    }
  }, [gameState.currentStage, gameState.showStageSelection, initializeGame]);

  // Event handlers
  const handleStageSelect = useCallback((stage: number) => {
    setGameState(prev => ({
      ...prev,
      currentStage: stage,
      showStageSelection: false,
      gameOver: false,
    }));
  }, []);

  const handleWordClick = useCallback((word: string) => {
    if (gameState.gameOver || gameState.showWrongAnswer) return;

    if (word === gameState.correctWord) {
      const nextStage = gameState.currentStage + 1;
      
      setGameState(prev => ({
        ...prev,
        currentStage: nextStage,
        unlockedStages: nextStage <= prev.maxStage ? 
          [...prev.unlockedStages.filter(s => s !== nextStage), nextStage] : 
          prev.unlockedStages,
        showStageSelection: false,
        gameOver: false,
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        showWrongAnswer: true,
        failureReason: 'wrong',
      }));
    }
  }, [gameState.correctWord, gameState.gameOver, gameState.showWrongAnswer, gameState.currentStage]);

  const handleModeToggle = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameMode: prev.gameMode === 'easy' ? 'hard' : 'easy',
    }));
  }, []);

  const handleBackToMain = useCallback(() => {
    setGameState(GameStateManager.getInitialState());
  }, []);

  // Determine current screen
  const getCurrentScreen = (): GameScreen => {
    if (gameState.showWrongAnswer) return 'wrongAnswer';
    if (gameState.gameOver) return 'gameOver';
    if (gameState.showStageSelection) return 'stageSelection';
    return 'game';
  };

  // Render appropriate screen
  switch (getCurrentScreen()) {
    case 'stageSelection':
      return (
        <StageSelectionScreen
          gameState={gameState}
          onStageSelect={handleStageSelect}
          onModeToggle={handleModeToggle}
        />
      );
    
    case 'game':
      return (
        <GameScreen
          gameState={gameState}
          onWordClick={handleWordClick}
        />
      );
    
    case 'wrongAnswer':
      return (
        <WrongAnswerScreen
          failureReason={gameState.failureReason}
          onBackToMain={handleBackToMain}
        />
      );
    
    default:
      return <StageSelectionScreen gameState={gameState} onStageSelect={handleStageSelect} onModeToggle={handleModeToggle} />;
  }
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  timerWarning: {
    color: '#e74c3c',
  },
  instructionsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5,
  },
  instructionsSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 5,
    flex: 1,
  },
  wordButton: {
    backgroundColor: '#fff',
    margin: 0.5,
    padding: 4,
    borderRadius: 3,
    minWidth: width * 0.07,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  wordText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  stageSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  stageSelectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  challengeMessage: {
    fontSize: 18,
    color: '#3498db',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeEasyModeButton: {
    backgroundColor: '#3498db',
  },
  activeHardModeButton: {
    backgroundColor: '#e74c3c',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  activeModeButtonText: {
    color: '#fff',
  },
  stagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stageButton: {
    width: 60,
    height: 60,
    margin: 10,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  unlockedStage: {
    backgroundColor: '#3498db',
  },
  lockedStage: {
    backgroundColor: '#bdc3c7',
  },
  stageButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  lockedStageText: {
    color: '#7f8c8d',
  },
  lockIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 12,
  },
  wrongAnswerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  wrongAnswerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  backToMainButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backToMainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WordQuizGame;