// script.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素
    const setupScreen = document.getElementById('setup-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    
    const topicSelect = document.getElementById('topic-select');
    const modeSelect = document.getElementById('mode-select');
    const questionCountInput = document.getElementById('question-count-input');
    const startBtn = document.getElementById('start-btn');
    
    const definitionDisplay = document.getElementById('definition-display');
    const posDisplay = document.getElementById('pos-display');
    const answerInput = document.getElementById('answer-input');
    const feedback = document.getElementById('feedback');
    const nextBtn = document.getElementById('next-btn');
    
    const scoreDisplay = document.getElementById('score');
    const accuracyDisplay = document.getElementById('accuracy');
    const restartBtn = document.getElementById('restart-btn');

    const progressText = document.getElementById('progress-text');
    const progressBarFill = document.getElementById('progress-bar-fill');

    const timerDiv = document.getElementById('timer');
    const timeLeftSpan = document.getElementById('time-left');
    
    const quizReviewContainer = document.getElementById('quiz-review-container');

    // 狀態變數
    let allVocab = [];
    let currentQuizVocab = [];
    let quizHistory = [];
    let currentWordIndex = 0;
    let correctCount = 0;
    let currentUser = null;
    let timerInterval;

    // Web Speech API
    const synth = window.speechSynthesis;
    let googleVoice = null;

    function loadVoices() {
        const voices = synth.getVoices();
        googleVoice = voices.find(voice => voice.name === 'Google US English') || voices.find(voice => voice.lang === 'en-US');
    }

    function speakWord(wordToSpeak) {
        if (synth.speaking) {
            synth.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(wordToSpeak);
        if (googleVoice) {
            utterance.voice = googleVoice;
        }
        utterance.lang = 'en-US';
        synth.speak(utterance);
    }
    
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    auth.onAuthStateChanged(async user => {
        if (user) {
            currentUser = user;
            await loadVocabData();
            checkUrlForQuizMode();
        }
    });
    
    async function loadVocabData() {
        try {
            const response = await fetch('data/all_vocab_master.json');
            allVocab = await response.json();
            populateTopics();
            updateTopicMastery();
        } catch (error) {
            console.error('Error loading vocabulary data:', error);
            definitionDisplay.textContent = '無法載入單字庫，請稍後再試。';
        }
    }

    function populateTopics() {
        const topics = [...new Set(allVocab.map(item => item.Topic))];
        topics.sort();
        topics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            topicSelect.appendChild(option);
        });
    }

    async function updateTopicMastery() {
        const userRef = db.ref(`users/${currentUser.uid}/words`);
        userRef.once('value', (snapshot) => {
            const wordsData = snapshot.val() || {};
            
            const allMasteredCount = Object.values(wordsData).filter(d => d.mastery >= 3).length;
            const allOption = topicSelect.querySelector('option[value="all"]');
            allOption.textContent = `所有單字 (${allMasteredCount} / ${allVocab.length})`;

            Array.from(topicSelect.options).forEach(option => {
                if (option.value !== 'all') {
                    const topic = option.value;
                    const topicVocab = allVocab.filter(v => v.Topic === topic);
                    const totalInTopic = topicVocab.length;
                    let masteredInTopic = 0;
                    topicVocab.forEach(v => {
                        if (wordsData[v.Word] && wordsData[v.Word].mastery >= 3) {
                            masteredInTopic++;
                        }
                    });
                    option.textContent = `${topic} (${masteredInTopic} / ${totalInTopic})`;
                }
            });
        });
    }

    function checkUrlForQuizMode() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'incorrect') {
            modeSelect.value = 'incorrect';
            startQuiz();
        }
    }

    async function startQuiz() {
        const selectedTopic = topicSelect.value;
        const selectedMode = modeSelect.value;
        let questionCount = parseInt(questionCountInput.value, 10);
        
        let vocabToTest = [];
        quizHistory = [];

        if (selectedMode === 'incorrect') {
            const userSnapshot = await db.ref(`users/${currentUser.uid}`).once('value');
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                const wordsData = userData.words || {};
                const incorrectWords = Object.keys(wordsData).filter(word => {
                    const wordData = wordsData[word];
                    return (wordData.mastery || 0) < 3 && wordData.incorrect > 0;
                });
                
                if (incorrectWords.length === 0) {
                    alert('恭喜！您目前沒有任何需要練習的錯題。');
                    return;
                }
                vocabToTest = allVocab.filter(v => incorrectWords.includes(v.Word));
            } else {
                 alert('找不到您的錯題紀錄。');
                 return;
            }
        } else {
             vocabToTest = (selectedTopic === 'all')
                ? allVocab
                : allVocab.filter(v => v.Topic === selectedTopic);
        }

        if (vocabToTest.length === 0) {
            alert('此主題或模式下沒有單字可供測驗。');
            return;
        }

        currentQuizVocab = shuffleArray(vocabToTest);

        if (!isNaN(questionCount) && questionCount > 0 && questionCount < currentQuizVocab.length) {
            currentQuizVocab = currentQuizVocab.slice(0, questionCount);
        }

        currentWordIndex = 0;
        correctCount = 0;

        setupScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        resultScreen.classList.add('hidden');
        quizReviewContainer.classList.add('hidden');
        
        loadQuestion();

        if (selectedMode === 'challenge') {
            startTimer(30);
        } else {
            timerDiv.classList.add('hidden');
        }
    }

    function startTimer(duration) {
        let timeLeft = duration;
        timeLeftSpan.textContent = timeLeft;
        timerDiv.classList.remove('hidden');

        timerInterval = setInterval(() => {
            timeLeft--;
            timeLeftSpan.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endQuiz();
            }
        }, 1000);
    }

    function loadQuestion() {
        if (currentWordIndex >= currentQuizVocab.length) {
            endQuiz();
            return;
        }

        const wordData = currentQuizVocab[currentWordIndex];
        definitionDisplay.textContent = wordData.Definition_ZH;
        posDisplay.textContent = `(${wordData.PartOfSpeech})`; 
        
        answerInput.value = '';
        answerInput.disabled = false;
        answerInput.focus();
        feedback.textContent = '';
        feedback.className = 'feedback';
        nextBtn.classList.add('hidden');
        updateProgress();
    }

    function updateProgress() {
        const progress = ((currentWordIndex) / currentQuizVocab.length) * 100;
        progressBarFill.style.width = `${progress}%`;
        progressText.textContent = `第 ${currentWordIndex + 1} / ${currentQuizVocab.length} 題`;
    }

    function checkAnswer() {
        const userAnswer = answerInput.value.trim();
        const currentWordData = currentQuizVocab[currentWordIndex];
        const correctAnswer = currentWordData.Word;

        if (userAnswer === '') return;

        answerInput.disabled = true;
        const isCorrect = (userAnswer.toLowerCase() === correctAnswer.toLowerCase());
        
        if (isCorrect) {
            feedback.textContent = '正確！';
            feedback.classList.add('correct');
            correctCount++;
        } else {
            feedback.innerHTML = `錯誤！正確答案是: <span class="correct">${correctAnswer}</span>`;
            feedback.classList.add('incorrect');
        }
        
        quizHistory.push({
            wordData: currentWordData,
            userAnswer: userAnswer,
            isCorrect: isCorrect
        });

        updateUserStats(correctAnswer, isCorrect, userAnswer);
        nextBtn.classList.remove('hidden');
        nextBtn.focus();
    }

    async function updateUserStats(word, isCorrect, userAnswer) {
        const userRef = db.ref(`users/${currentUser.uid}`);
        const now = new Date().toISOString();

        const wordStatsRef = userRef.child('words').child(word);
        wordStatsRef.transaction(currentData => {
            if (currentData === null) {
                return {
                    lastAttempt: now,
                    correct: isCorrect ? 1 : 0,
                    incorrect: isCorrect ? 0 : 1,
                    mastery: isCorrect ? 1 : 0
                };
            } else {
                currentData.lastAttempt = now;
                currentData.correct = (currentData.correct || 0) + (isCorrect ? 1 : 0);
                currentData.incorrect = (currentData.incorrect || 0) + (isCorrect ? 0 : 1);
                let mastery = currentData.mastery || 0;
                mastery += isCorrect ? 1 : -1;
                currentData.mastery = Math.max(0, mastery);
                return currentData;
            }
        });

        const historyRef = userRef.child('history');
        historyRef.push({
            word: word,
            userAnswer: userAnswer,
            correct: isCorrect,
            timestamp: now
        });
    }

    function endQuiz() {
        if (timerInterval) clearInterval(timerInterval);
        
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');

        const totalQuestions = currentQuizVocab.length;
        const finalScore = correctCount;
        const finalAccuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        scoreDisplay.textContent = `${finalScore} / ${totalQuestions}`;
        accuracyDisplay.textContent = finalAccuracy;

        displayQuizReview();
    }

    function displayQuizReview() {
        const reviewTableBody = document.querySelector('#review-table tbody');
        reviewTableBody.innerHTML = '';

        quizHistory.forEach(item => {
            const row = document.createElement('tr');
            const correctnessClass = item.isCorrect ? 'correct' : 'incorrect';
            const correctnessIcon = item.isCorrect ? '✔' : '✘';
            
            row.innerHTML = `
                <td>
                    ${item.wordData.Word} <span class="part-of-speech">(${item.wordData.PartOfSpeech})</span>
                    <br><small>${item.wordData.Definition_ZH}</small>
                </td>
                <td class="${correctnessClass}">${item.userAnswer || '（未作答）'}</td>
                <td class="${correctnessClass}">${correctnessIcon}</td>
                <td>
                    <button class="review-pronounce-btn" data-word="${item.wordData.Word}">🔊</button>
                </td>
            `;
            reviewTableBody.appendChild(row);
        });

        document.querySelectorAll('.review-pronounce-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                speakWord(this.dataset.word);
            });
        });

        quizReviewContainer.classList.remove('hidden');
    }

    function resetQuiz() {
        setupScreen.classList.remove('hidden');
        quizScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        updateTopicMastery();
        window.history.pushState({}, document.title, window.location.pathname);
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 事件監聽
    startBtn.addEventListener('click', startQuiz);
    restartBtn.addEventListener('click', resetQuiz);
    
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !answerInput.disabled) {
            checkAnswer();
        }
    });

    nextBtn.addEventListener('click', () => {
        currentWordIndex++;
        loadQuestion();
    });

    // [新增] 監聽題數輸入框的 Enter 鍵
    questionCountInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 防止預設行為 (如表單提交)
            startBtn.click(); // 模擬點擊開始按鈕
        }
    });
});