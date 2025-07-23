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
    let weeklyChartInstance = null; // 用來存放圖表實例

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
                const historyData = userData.history || {};
                
                // --- 總覽統計 & 錯題本 (邏輯不變) ---
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

                // [新增] 處理並渲染週成果圖表
                const weeklyData = processWeeklyData(historyData, wordsData);
                renderWeeklyChart(weeklyData);
            }
        });
    }

    // [新增] 處理近一週數據的函式
    function processWeeklyData(historyData, wordsData) {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // 設定為今天的最末尾
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0); // 設定為七天前的最開頭

        // 1. 初始化過去七天的資料結構
        const dailyStats = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(sevenDaysAgo);
            date.setDate(date.getDate() + i);
            const dateString = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
            dailyStats[dateString] = {
                total: 0,
                correct: 0,
                newlyMastered: 0
            };
        }

        // 2. 篩選並統計歷史紀錄
        const historyList = Object.values(historyData);
        const recentHistory = historyList.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= sevenDaysAgo && itemDate <= today;
        });

        recentHistory.forEach(item => {
            const dateString = new Date(item.timestamp).toISOString().split('T')[0];
            if (dailyStats[dateString]) {
                dailyStats[dateString].total++;
                if (item.correct) {
                    dailyStats[dateString].correct++;
                }
            }
        });

        // 3. 計算每日新增的熟練單字數 (這是一個估算)
        // 找出所有熟練的單字，並檢查它們的最後一次答題時間
        for (const word in wordsData) {
            const data = wordsData[word];
            if ((data.mastery || 0) >= 3 && data.lastAttempt) {
                const lastAttemptDate = new Date(data.lastAttempt);
                if (lastAttemptDate >= sevenDaysAgo && lastAttemptDate <= today) {
                    const dateString = lastAttemptDate.toISOString().split('T')[0];
                    if (dailyStats[dateString]) {
                        dailyStats[dateString].newlyMastered++;
                    }
                }
            }
        }
        
        return dailyStats;
    }

    // [新增] 渲染圖表的函式
    function renderWeeklyChart(dailyStats) {
        const ctx = document.getElementById('weekly-chart').getContext('2d');
        
        if (weeklyChartInstance) {
            weeklyChartInstance.destroy(); // 如果圖表已存在，先銷毀
        }

        const labels = Object.keys(dailyStats).map(date => date.substring(5)); // 'MM-DD'
        const totalData = Object.values(dailyStats).map(day => day.total);
        const accuracyData = Object.values(dailyStats).map(day => day.total > 0 ? Math.round((day.correct / day.total) * 100) : 0);
        const masteredData = Object.values(dailyStats).map(day => day.newlyMastered);

        weeklyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '每日測驗單字數',
                        data: totalData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        yAxisID: 'y-axis-count',
                        tension: 0.1
                    },
                    {
                        label: '每日新增熟練單字數',
                        data: masteredData,
                        borderColor: 'rgba(255, 206, 86, 1)',
                        backgroundColor: 'rgba(255, 206, 86, 0.2)',
                        yAxisID: 'y-axis-count',
                        tension: 0.1
                    },
                    {
                        label: '每日正確率 (%)',
                        data: accuracyData,
                        borderColor: 'rgba(75, 192, 75, 1)', // Green accent color
                        backgroundColor: 'rgba(75, 192, 75, 0.2)',
                        yAxisID: 'y-axis-percentage',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    'y-axis-count': {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '數量'
                        },
                        ticks: {
                           color: '#e0e0e0' // 刻度文字顏色
                        },
                        grid: {
                            color: '#555' // 網格線顏色
                        }
                    },
                    'y-axis-percentage': {
                        type: 'linear',
                        position: 'right',
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: '正確率 (%)'
                        },
                        ticks: {
                           color: '#e0e0e0'
                        },
                        grid: {
                            drawOnChartArea: false, // 只顯示主網格線
                        }
                    },
                    x: {
                         ticks: {
                           color: '#e0e0e0'
                        },
                        grid: {
                            color: '#555'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0' // 圖例文字顏色
                        }
                    }
                }
            }
        });
    }

    practiceIncorrectBtn.addEventListener('click', () => {
        window.location.href = 'index.html?mode=incorrect';
    });
});