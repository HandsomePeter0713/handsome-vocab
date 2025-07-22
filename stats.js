// stats.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素
    const totalWordsSpan = document.getElementById('total-words');
    const totalCorrectSpan = document.getElementById('total-correct');
    const totalAccuracySpan = document.getElementById('total-accuracy');
    const masteredWordsSpan = document.getElementById('mastered-words');
    const incorrectTableBody = document.querySelector('#incorrect-table tbody');
    const noIncorrectMsg = document.getElementById('no-incorrect-msg');
    const incorrectTable = document.getElementById('incorrect-table');
    const practiceIncorrectBtn = document.getElementById('practice-incorrect-btn');

    let allVocabMap = {};

    auth.onAuthStateChanged(user => {
        if (user) {
            loadAllVocabAndStats(user.uid);
        }
    });

    async function loadAllVocabAndStats(uid) {
        try {
            const response = await fetch('data/all_vocab_master.json');
            const allVocab = await response.json();
            allVocab.forEach(v => {
                allVocabMap[v.Word] = v.Definition_ZH;
            });
        } catch (error) {
            console.error("Failed to load vocab data:", error);
        }
        
        loadUserStats(uid);
    }

    async function loadUserStats(uid) {
        const userRef = db.ref(`users/${uid}`);

        userRef.once('value', (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const wordsData = userData.words || {};
                
                let totalAttempts = 0;
                let totalCorrect = 0;
                let masteredCount = 0;
                let incorrectWords = [];

                for (const word in wordsData) {
                    const data = wordsData[word];
                    const correct = data.correct || 0;
                    const incorrect = data.incorrect || 0;
                    
                    totalCorrect += correct;
                    totalAttempts += correct + incorrect;
                    
                    if ((data.mastery || 0) >= 3) {
                        masteredCount++;
                    }

                    if (incorrect > 0 && (data.mastery || 0) < 3) {
                        incorrectWords.push({ word, incorrect, definition: allVocabMap[word] || 'N/A' });
                    }
                }
                
                totalWordsSpan.textContent = totalAttempts;
                totalCorrectSpan.textContent = totalCorrect;
                totalAccuracySpan.textContent = totalAttempts > 0 ? `${Math.round((totalCorrect / totalAttempts) * 100)}%` : '0%';
                masteredWordsSpan.textContent = masteredCount;

                if (incorrectWords.length > 0) {
                    incorrectWords.sort((a, b) => b.incorrect - a.incorrect);
                    incorrectTableBody.innerHTML = incorrectWords.map(item => `
                        <tr>
                            <td>${item.word}</td>
                            <td>${item.incorrect}</td>
                            <td>${item.definition}</td>
                        </tr>
                    `).join('');
                    noIncorrectMsg.classList.add('hidden');
                    incorrectTable.classList.remove('hidden');
                    practiceIncorrectBtn.classList.remove('hidden');
                } else {
                    noIncorrectMsg.classList.remove('hidden');
                    incorrectTable.classList.add('hidden');
                    practiceIncorrectBtn.classList.add('hidden');
                }

                // [移除] 讀取和顯示歷史紀錄的邏輯已被刪除
            }
        });
    }

    practiceIncorrectBtn.addEventListener('click', () => {
        window.location.href = 'index.html?mode=incorrect';
    });
});