// vocab-book.js (完整版本)
document.addEventListener('DOMContentLoaded', () => {
    const topicSelect = document.getElementById('topic-select-book');
    const vocabTableBody = document.querySelector('#vocab-table tbody');

    let allVocab = [];
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

    async function initialize() {
        try {
            const response = await fetch('data/all_vocab_master.json');
            allVocab = await response.json();
            populateTopics();
            displayWords('all');
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
        vocabTableBody.innerHTML = '';
        const wordsToShow = (selectedTopic === 'all')
            ? allVocab
            : allVocab.filter(v => v.Topic === selectedTopic);

        if (wordsToShow.length === 0) {
            vocabTableBody.innerHTML = '<tr><td colspan="4">此主題下沒有單字。</td></tr>';
            return;
        }

        wordsToShow.forEach(wordData => {
            const row = document.createElement('tr');
            // [修改] 在單字旁加入詞性
            row.innerHTML = `
                <td>
                    <strong>${wordData.Word}</strong> <span class="part-of-speech">(${wordData.PartOfSpeech})</span>
                    <br><small>${wordData.Pronunciation}</small>
                </td>
                <td>${wordData.Definition_ZH}</td>
                <td>${wordData.Example_EN}<br><small>${wordData.Example_ZH}</small></td>
                <td>
                    <button class="review-pronounce-btn" data-word="${wordData.Word}">🔊</button>
                </td>
            `;
            vocabTableBody.appendChild(row);
        });

        document.querySelectorAll('.review-pronounce-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                speakWord(this.dataset.word);
            });
        });
    }

    topicSelect.addEventListener('change', () => {
        displayWords(topicSelect.value);
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            initialize();
        }
    });
});