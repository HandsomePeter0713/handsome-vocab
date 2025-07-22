# Vocab Quiz - 單字測驗通

這是一個功能豐富的線上英語單字學習與測驗平台，旨在幫助使用者透過多樣化的互動功能來提升詞彙量。

## 功能列表

### 核心測驗功能
- **主題式學習**: 可從多個主題中選擇單字庫進行測驗。
- **拼字練習**: 根據中文解釋拼寫出對應的英文單字。
- **即時回饋**: 系統會立即判斷答案是否正確。
- **真人發音**: 透過 Web Speech API 提供單字發音。
- **題庫不重複**: 在同一次測驗中，題目不會重複出現。

### 個人化與進度追蹤
- **使用者登入**: 支援匿名或 Google 帳號登入 (Firebase Auth)。
- **雲端同步**: 使用者的學習進度會即時同步至雲端 Firestore。
- **多種測驗模式**:
  - **一般模式**: 正常測驗流程。
  - **錯題模式**: 專門練習過去答錯的單字。
  - **挑戰模式**: 在限定時間內進行測驗。
- **測驗統計**: 記錄分數、正確率及歷史答題紀錄。
- **錯題本**: 自動整理答錯的單字，方便使用者重複練習。
- **熟練度追蹤**: 連續答對 3 次的單字會被標記為「熟練」。

## 專案設定教學

1.  **複製專案**: 將所有檔案複製到您的本地開發環境中。
2.  **建立 Firebase 專案**:
    - 前往 [Firebase 控制台](https://console.firebase.google.com/) 並建立一個新專案。
    - 在「Authentication」中，啟用 **Google** 和 **匿名** 登入方式。
    - 在「Firestore Database」中，建立一個新的資料庫。
3.  **設定 Firebase Config**:
    - 在 Firebase 專案設定中，找到您的 Web 應用程式設定物件。
    - 將 `firebase-config.js` 檔案中的佔位符 `YOUR_API_KEY`, `YOUR_AUTH_DOMAIN` 等替換成您自己的金鑰。
4.  **放置單字庫**:
    - 確保您提供的 `all_vocab_master.json` 檔案位於 `data/` 資料夾中。
5.  **啟動專案**:
    - 您可以使用任何 live server 工具（例如 VS Code 的 Live Server 擴充功能）來啟動 `login.html` 或 `index.html`。

## 檔案結構
```
vocab-quiz/
├── index.html
├── stats.html
├── login.html
├── style.css
├── script.js
├── stats.js
├── auth.js
├── firebase-config.js
├── data/
│ └── all_vocab_master.json
└── README.md
```