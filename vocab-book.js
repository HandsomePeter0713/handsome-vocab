// vocab-book.js
document.addEventListener('DOMContentLoaded', () => {
    const topicSelect = document.getElementById('topic-select-book');
    const vocabTableBody = document.querySelector('#vocab-table tbody');

    let allVocab = [];
    const synth = window.speechSynthesis;
    let googleVoice = null;

    // 優化後的語音播放函式
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
    
    // 瀏覽器載入語音需要一點時間
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    // 載入單字資料並初始化
    async function initialize() {
        try {
            const response = await fetch('data/all_vocab_master.json');
            allVocab = await response.json();
            populateTopics();
            displayWords('all'); // 預設顯示所有單字
        } catch (error) {
            console.error('Error loading vocabulary data:', error);
            vocabTableBody.innerHTML = '<tr><td colspan="4">無法載入單字庫。</td></tr>';
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

    function displayWords(selectedTopic) {
        vocabTableBody.innerHTML = ''; // 清空現有列表
        const wordsToShow = (selectedTopic === 'all')
            ? allVocab
            : allVocab.filter(v => v.Topic === selectedTopic);

        if (wordsToShow.length === 0) {
            vocabTableBody.innerHTML = '<tr><td colspan="4">此主題下沒有單字。</td></tr>';
            return;
        }

        wordsToShow.forEach(wordData => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${wordData.Word}</strong><br><small>${wordData.Pronunciation}</small></td>
                <td>${wordData.Definition_ZH}</td>
                <td>${wordData.Example_EN}<br><small>${wordData.Example_ZH}</small></td>
                <td>
                    <button class="review-pronounce-btn" data-word="${wordData.Word}">🔊</button>
                </td>
            `;
            vocabTableBody.appendChild(row);
        });

        // 為所有新的發音按鈕添加事件監聽
        document.querySelectorAll('.review-pronounce-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                speakWord(this.dataset.word);
            });
        });
    }

    // 事件監聽
    topicSelect.addEventListener('change', () => {
        displayWords(topicSelect.value);
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            initialize();
        }
    });
});