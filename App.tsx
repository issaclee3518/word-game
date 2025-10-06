import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface GameState {
  currentStage: number;
  maxStage: number;
  score: number;
  timeLeft: number;
  gameOver: boolean;
  correctWord: string;
  wrongWords: string[];
  allWords: string[];
  timeUp: boolean;
  showStageSelection: boolean;
  unlockedStages: number[];
}

const WordQuizGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentStage: 1,
    maxStage: 10,
    score: 0,
    timeLeft: 30,
    gameOver: false,
    correctWord: '',
    wrongWords: [],
    allWords: [],
    timeUp: false,
    showStageSelection: true,
    unlockedStages: [1],
  });

  // 한 글자 차이나는 단어 세트들
  const wordSets = [
    { correct: '당근', wrong: ['등군', '당군', '등근', '당근'] },
    { correct: '사과', wrong: ['사과', '사과', '사과', '사과'] },
    { correct: '바나나', wrong: ['바나나', '바나나', '바나나', '바나나'] },
    { correct: '딸기', wrong: ['딸기', '딸기', '딸기', '딸기'] },
    { correct: '포도', wrong: ['포도', '포도', '포도', '포도'] },
    { correct: '수박', wrong: ['수박', '수박', '수박', '수박'] },
    { correct: '오렌지', wrong: ['오렌지', '오렌지', '오렌지', '오렌지'] },
    { correct: '체리', wrong: ['체리', '체리', '체리', '체리'] },
    { correct: '키위', wrong: ['키위', '키위', '키위', '키위'] },
    { correct: '멜론', wrong: ['멜론', '멜론', '멜론', '멜론'] },
  ];

  // 한 글자만 다른 단어 생성 함수 (당근 -> 당군)
  const generateDifferentWord = (original: string): string => {
    return '당군';
  };

  // 스테이지별 난이도 설정
  const getStageDifficulty = (stage: number) => {
    const baseCount = 80; // 기본 단어 개수 감소
    const countMultiplier = 1 + (stage - 1) * 0.3; // 스테이지마다 30%씩 증가 (50% → 30%)
    const wordCount = Math.floor(baseCount * countMultiplier);
    
    // 마지막 스테이지(10)의 크기를 기준으로 역순으로 계산
    const maxStage = 10;
    const lastStageFontSize = 16; // 마지막 스테이지 글자 크기 조금 더 증가
    const lastStageButtonSize = width * 0.10; // 마지막 스테이지 버튼 크기 조금 더 증가
    
    // 스테이지가 낮을수록 크기가 커지도록 역순 계산
    const fontSize = lastStageFontSize + (maxStage - stage) * 0.8; // 스테이지가 낮을수록 크기 증가
    const buttonSize = lastStageButtonSize + (maxStage - stage) * 0.004; // 스테이지가 낮을수록 크기 증가
    
    return {
      wordCount,
      fontSize,
      buttonSize,
      timeLimit: Math.max(20, 35 - (stage - 1) * 1.5), // 시간 제한 완화
    };
  };

  // 게임 초기화
  const initializeGame = (stage: number = gameState.currentStage) => {
    // 모든 단어를 당근으로 하고 하나만 당군으로 만들기
    const correctWord = '당군';
    
    // 스테이지별 난이도 적용
    const difficulty = getStageDifficulty(stage);
    const wrongWords = Array(difficulty.wordCount).fill('당근');
    const allWords = [...wrongWords, correctWord];
    
    // 배열 섞기
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }

    setGameState(prev => ({
      ...prev,
      correctWord,
      wrongWords,
      allWords,
      timeLeft: difficulty.timeLimit,
      gameOver: false,
      timeUp: false,
    }));
  };

  // 타이머 효과
  useEffect(() => {
    if (!gameState.gameOver && gameState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.timeLeft === 0 && !gameState.gameOver) {
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        timeUp: true,
      }));
    }
  }, [gameState.timeLeft, gameState.gameOver]);

  // 게임 시작 시 초기화
  useEffect(() => {
    if (!gameState.showStageSelection) {
      initializeGame();
    }
  }, [gameState.currentStage, gameState.showStageSelection]);

  // 단어 클릭 처리
  const handleWordClick = (word: string) => {
    if (gameState.gameOver) return;

    if (word === gameState.correctWord) {
      // 정답!
      const newScore = gameState.score + 100 + gameState.timeLeft * 5;
      const nextStage = gameState.currentStage + 1;
      
      setGameState(prev => ({
        ...prev,
        score: newScore,
        currentStage: nextStage,
        unlockedStages: nextStage <= prev.maxStage ? 
          [...prev.unlockedStages.filter(s => s !== nextStage), nextStage] : 
          prev.unlockedStages,
        showStageSelection: true,
      }));
    } else {
      // 오답!
      setGameState(prev => ({
        ...prev,
        gameOver: true,
      }));
    }
  };

  // 스테이지 선택
  const selectStage = (stage: number) => {
    setGameState(prev => ({
      ...prev,
      currentStage: stage,
      showStageSelection: false,
      gameOver: false,
    }));
  };

  // 스테이지 선택 화면으로 돌아가기
  const backToStageSelection = () => {
    setGameState(prev => ({
      ...prev,
      showStageSelection: true,
      gameOver: false,
    }));
  };

  // 게임 재시작
  const restartGame = () => {
    setGameState({
      currentStage: 1,
      maxStage: 10,
      score: 0,
      timeLeft: 30,
      gameOver: false,
      correctWord: '',
      wrongWords: [],
      allWords: [],
      timeUp: false,
      showStageSelection: true,
      unlockedStages: [1],
    });
  };

  // 게임 오버 화면
  if (gameState.gameOver) {
    return (
      <View style={styles.container}>
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>
            {gameState.timeUp ? '⏰ 시간 초과!' : '❌ 게임 오버!'}
          </Text>
          <Text style={styles.finalScore}>최종 점수: {gameState.score}</Text>
          <Text style={styles.stageReached}>스테이지: {gameState.currentStage}</Text>
          <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
            <Text style={styles.restartButtonText}>다시 시작</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 스테이지 선택 화면
  if (gameState.showStageSelection) {
    return (
      <View style={styles.container}>
        <View style={styles.stageSelectionContainer}>
          <Text style={styles.stageSelectionTitle}>스테이지 선택</Text>
          <Text style={styles.currentScore}>현재 점수: {gameState.score}</Text>
          
          <View style={styles.stagesGrid}>
            {Array.from({ length: gameState.maxStage }, (_, i) => i + 1).map(stage => (
              <TouchableOpacity
                key={stage}
                style={[
                  styles.stageButton,
                  gameState.unlockedStages.includes(stage) ? styles.unlockedStage : styles.lockedStage
                ]}
                onPress={() => gameState.unlockedStages.includes(stage) && selectStage(stage)}
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
          
          <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
            <Text style={styles.restartButtonText}>전체 재시작</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 상단 정보 */}
      <View style={styles.header}>
        <View style={styles.infoRow}>
          <Text style={styles.stageText}>스테이지: {gameState.currentStage}</Text>
          <Text style={styles.scoreText}>점수: {gameState.score}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, gameState.timeLeft <= 5 && styles.timerWarning]}>
            ⏰ {gameState.timeLeft}초
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={backToStageSelection}>
            <Text style={styles.backButtonText}>← 스테이지 선택</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 게임 설명 */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>한 글자만 다른 단어를 찾으세요!</Text>
        <Text style={styles.instructionsSubtitle}>
          "당근"들 중에서 "당군" 하나를 찾아 클릭하세요!
        </Text>
      </View>

      {/* 단어 그리드 */}
      <View style={styles.wordsGrid}>
        {gameState.allWords.map((word, index) => {
          const difficulty = getStageDifficulty(gameState.currentStage);
          const buttonStyle = {
            ...styles.wordButton,
            minWidth: difficulty.buttonSize,
          };
          const textStyle = {
            ...styles.wordText,
            fontSize: difficulty.fontSize,
          };
          
          return (
            <TouchableOpacity
              key={index}
              style={buttonStyle}
              onPress={() => handleWordClick(word)}
            >
              <Text style={textStyle}>{word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

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
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
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
  correctWordButton: {
    borderColor: '#27ae60',
    backgroundColor: '#d5f4e6',
  },
  wordText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  finalScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  stageReached: {
    fontSize: 20,
    color: '#7f8c8d',
    marginBottom: 30,
  },
  restartButton: {
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
  restartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  currentScore: {
    fontSize: 20,
    color: '#27ae60',
    marginBottom: 30,
    fontWeight: 'bold',
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
  backButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default WordQuizGame;