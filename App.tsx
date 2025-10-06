import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface GameState {
  currentStage: number;
  maxStage: number;
  timeLeft: number;
  gameOver: boolean;
  correctWord: string;
  wrongWords: string[];
  allWords: string[];
  timeUp: boolean;
  showStageSelection: boolean;
  unlockedStages: number[];
  showWrongAnswer: boolean;
  gameMode: 'easy' | 'hard';
  flickeringIndex: number;
  flickeringIndex2: number;
  failureReason: 'wrong' | 'timeout';
}

const WordQuizGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentStage: 1,
    maxStage: 10,
    timeLeft: 20,
    gameOver: false,
    correctWord: '',
    wrongWords: [],
    allWords: [],
    timeUp: false,
    showStageSelection: true,
    unlockedStages: [1],
    showWrongAnswer: false,
    gameMode: 'easy',
    flickeringIndex: -1,
    flickeringIndex2: -1,
    failureReason: 'wrong',
  });

  // 한 글자 차이나는 단어 세트들
  const wordSets = [
    { correct: '당군', baseWord: '당근' },
    { correct: '이식', baseWord: '이삭' },
    { correct: '마이스', baseWord: '마우스' },
    { correct: '닰', baseWord: '닭' },
    { correct: '옥톱방', baseWord: '옥탑방'},
    { correct: '아머리카노', baseWord: '아메리카노'},
    { correct: '프로펠러', baseWord: '프로펠라'},
    { correct: '미우스', baseWord: '마우스'},
  ];


  // 스테이지별 난이도 설정
  const getStageDifficulty = (stage: number, mode: 'easy' | 'hard') => {
    const baseCount = 30; // 모든 모드에서 동일한 단어 수
    const countMultiplier = 1 + (stage - 1) * 0.25; // 모든 모드에서 동일한 증가율 (15% → 25%)
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
      timeLimit: 20, // 모든 스테이지 20초로 통일
    };
  };

  // 게임 초기화
  const initializeGame = (stage: number = gameState.currentStage) => {
    // 랜덤으로 단어 세트 선택
    const randomSet = wordSets[Math.floor(Math.random() * wordSets.length)];
    const correctWord = randomSet.correct;
    const baseWord = randomSet.baseWord;
    
    // 스테이지별 난이도 적용
    const difficulty = getStageDifficulty(stage, gameState.gameMode);
    const wrongWords = Array(difficulty.wordCount).fill(baseWord);
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
      // 시간 초과 시 실패 화면 표시
      setGameState(prev => ({
        ...prev,
        showWrongAnswer: true,
        failureReason: 'timeout',
      }));
    }
  }, [gameState.timeLeft, gameState.gameOver]);

  // 하드모드 반짝임 효과
  useEffect(() => {
    if (gameState.gameMode === 'hard' && !gameState.gameOver && !gameState.showStageSelection && !gameState.showWrongAnswer) {
      const flickerTimer = setInterval(() => {
        setGameState(prev => {
          const newIndex1 = Math.floor(Math.random() * prev.allWords.length);
          let newIndex2 = -1;
          
          // 스테이지 5부터는 두 개의 불빛
          if (prev.currentStage >= 5) {
            do {
              newIndex2 = Math.floor(Math.random() * prev.allWords.length);
            } while (newIndex2 === newIndex1); // 두 불빛이 같은 위치에 오지 않도록
          }
          
          return {
            ...prev,
            flickeringIndex: newIndex1,
            flickeringIndex2: newIndex2,
          };
        });
      }, 300); // 300ms마다 반짝임

      return () => clearInterval(flickerTimer);
    }
  }, [gameState.gameMode, gameState.gameOver, gameState.showStageSelection, gameState.showWrongAnswer, gameState.allWords.length, gameState.currentStage]);

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
      // 정답! 바로 다음 스테이지로
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
      // 오답! 틀렸다는 알림 표시
      setGameState(prev => ({
        ...prev,
        showWrongAnswer: true,
        failureReason: 'wrong',
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


  // 메인화면으로 돌아가기
  const backToMain = () => {
    setGameState(prev => ({
      ...prev,
      currentStage: 1,
      gameOver: false,
      showStageSelection: true,
      showWrongAnswer: false,
      unlockedStages: [1],
      failureReason: 'wrong',
    }));
  };

  // 게임 모드 변경
  const toggleGameMode = () => {
    setGameState(prev => ({
      ...prev,
      gameMode: prev.gameMode === 'easy' ? 'hard' : 'easy',
    }));
  };


  // 틀렸을 때 화면
  if (gameState.showWrongAnswer) {
    return (
      <View style={styles.container}>
        <View style={styles.wrongAnswerContainer}>
          <Text style={styles.wrongAnswerTitle}>
            {gameState.failureReason === 'timeout' ? '⏰ 시간 초과!' : '❌ 실패!'}
          </Text>
          <TouchableOpacity style={styles.backToMainButton} onPress={backToMain}>
            <Text style={styles.backToMainButtonText}>메인화면으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 게임 오버 화면
  if (gameState.gameOver) {
    return (
      <View style={styles.container}>
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>
            {gameState.timeUp ? '⏰ 시간 초과!' : '❌ 게임 오버!'}
          </Text>
          <Text style={styles.stageReached}>스테이지: {gameState.currentStage}</Text>
          <TouchableOpacity style={styles.backToMainButton} onPress={backToMain}>
            <Text style={styles.backToMainButtonText}>메인화면으로 돌아가기</Text>
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
          <Text style={styles.challengeMessage}>한번에 스테이지 10까지 깨보세요!</Text>
          
          {/* 게임 모드 선택 */}
          <View style={styles.modeSelector}>
            <TouchableOpacity 
              style={[
                styles.modeButton, 
                gameState.gameMode === 'easy' && styles.activeEasyModeButton
              ]} 
              onPress={toggleGameMode}
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
              onPress={toggleGameMode}
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
        </View>
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, gameState.timeLeft <= 5 && styles.timerWarning]}>
            ⏰ {gameState.timeLeft}초
          </Text>
        </View>
      </View>

      {/* 게임 설명 */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>한 글자만 다른 단어를 찾으세요!</Text>
        <Text style={styles.instructionsSubtitle}>
          같은 단어들 중에서 다른 단어 하나를 찾아 클릭하세요!
        </Text>
      </View>

      {/* 단어 그리드 */}
      <View style={styles.wordsGrid}>
        {gameState.allWords.map((word, index) => {
          const difficulty = getStageDifficulty(gameState.currentStage, gameState.gameMode);
          const isFlickering1 = gameState.gameMode === 'hard' && gameState.flickeringIndex === index;
          const isFlickering2 = gameState.gameMode === 'hard' && gameState.flickeringIndex2 === index;
          const isFlickering = isFlickering1 || isFlickering2;
          
          const buttonStyle = {
            ...styles.wordButton,
            minWidth: difficulty.buttonSize,
            backgroundColor: isFlickering ? '#27ae60' : '#fff',
            borderColor: isFlickering ? '#27ae60' : '#bdc3c7',
          };
          const textStyle = {
            ...styles.wordText,
            fontSize: difficulty.fontSize,
            color: isFlickering ? '#fff' : '#2c3e50',
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
  stageReached: {
    fontSize: 20,
    color: '#7f8c8d',
    marginBottom: 30,
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