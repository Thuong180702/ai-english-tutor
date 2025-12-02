// PATCH FILE - Manual Changes Needed for Listen Mode
// Copy these code snippets vào đúng vị trí trong App.jsx

// ============================================
// 1. INPUT ONCHANGE HANDLER - Add after line ~1560
// Tìm: value={userInput} onChange={(e) => setUserInput(e.target.value)}
// Thay bằng:
// ============================================
value = { userInput }
onChange = {(e) => {
    const newInput = e.target.value;
    setUserInput(newInput);

    // Progressive reveal for Listen mode
    if (currentCourse?.learningMode === "listen" && currentCourse.sentences[currentSentIndex]) {
        const { revealed, wrong } = getProgressiveReveal(newInput, currentCourse.sentences[currentSentIndex].english);
        setRevealedWords(revealed);
        setWrongWords(wrong);

        // Auto-hide hint when typing
        if (hintMode !== 'none' && newInput.length > 0) {
            setHintMode('none');
        }
    }
}}

// ============================================
// 2. SKIP BUTTON UI - Add in learning screen buttons section
// Tìm: feedbackState !== 'correct' && (
// Thêm button này vào group buttons:
// ============================================
{
    currentCourse?.learningMode === "listen" && (
        <button
            onClick={handleSkipSentence}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
        >
            <SkipForward className="w-5 h-5 inline mr-2" />
            Bỏ qua
        </button>
    )
}

// ============================================
// 3. HINT TOGGLE BUTTON - Add next to XEM GỢI Ý button
// Thay thế button "XEM GỢI Ý" bằng3:
// ============================================
{
    currentCourse?.learningMode === "listen" ? (
        <button
            onClick={() => setHintMode(hintMode === 'none' ? 'one' : hintMode === 'one' ? 'all' : 'none')}
            className={`w-full flex items-center justify-center gap-2 py-4 ${hintMode !== 'none'
                    ? isDarkMode ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-200 text-amber-800'
                    : isDarkMode ? 'text-amber-500 hover:bg-amber-500/10' : 'bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-700 border-2 border-amber-200'
                } font-bold text-sm transition-colors`}
        >
            <Lightbulb className="w-5 h-5" />
            {hintMode === 'none' ? 'Gợi ý' : hintMode === 'one' ? 'Gợi ý: 1 từ' : 'Gợi ý: Cả câu'}
        </button>
    ) : (
    // Original XEM GỢI Ý button for Write mode
    <button onClick={handleShowHint} className={`w-full flex items-center justify-center gap-2 py-4...`}>
        <Lightbulb className="w-5 h-5" /> XEM GỢI Ý
    </button>
)
}

// ============================================
// 4. PROGRESSIVE TEXT RENDERING - Replace audio player hint section
// Tìm: Listen mode audio panel hiện "Gợi ý" section
// Thêm progressive text display:
// ============================================
{/* Progressive revealed text */ }
{
    revealedWords.length > 0 || wrongWords.length > 0 ? (
        <div className={`${theme.cardBg} p-4 rounded-xl border-2 ${theme.cardBorder} mt-4`}>
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Đã gõ:</p>
            <div className="text-lg font-mono space-x-2">
                {renderProgressiveText(
                    currentCourse.sentences[currentSentIndex].english,
                    revealedWords,
                    wrongWords,
                    hintMode,
                    isDarkMode
                ).map((w, i) => (
                    <span key={w.key} className={w.className} style={w.style}>
                        {w.word}
                    </span>
                ))}
            </div>
        </div>
    ) : null
}

// ============================================
// 5. VOCABULARY FIX (if PowerShell failed) - Line 1579
// Tìm: <div><p className={...}>Từ vựng cần dùng</p>
// Thay bằng:
// ============================================
{
    currentCourse.sentences[currentSentIndex].vocabulary && (
    <div><p className={...}>Từ vựng cần dùng</p>
        <div className="flex flex-wrap gap-2">
            {currentCourse.sentences[currentSentIndex].vocabulary.map((v, i) => (
                <span key={i} className={...}>{v.word}: {v.meaning}</span>
    ))
}
        </div >
    </div >
)}
