/**
 * Listen Mode Helper Functions
 * Progressive reveal, hint system, and word-by-word comparison
 */

/**
 * Compare user input with correct text word-by-word
 * Returns indices of revealed (correct) and wrong words
 */
export const getProgressiveReveal = (userInput, correctText) => {
    if (!userInput || !correctText) {
        return { revealed: [], wrong: [] };
    }

    const userWords = userInput.trim().split(/\s+/);
    const correctWords = correctText.trim().split(/\s+/);

    const revealed = [];
    const wrong = [];

    for (let i = 0; i < userWords.length; i++) {
        // Clean words for comparison (remove punctuation)
        const userWord = userWords[i].toLowerCase().replace(/[.,!?;:"']/g, '');
        const correctWord = correctWords[i]?.toLowerCase().replace(/[.,!?;:"']/g, '');

        if (userWord === correctWord) {
            revealed.push(i);
        } else if (correctWords[i]) {
            // Wrong word - show it in red
            wrong.push({ index: i, word: userWords[i] });
            break; // Stop checking after first wrong word
        }
    }

    return { revealed, wrong };
};

/**
 * Render progressive text with color-coded words
 * - Green: correct revealed words
 * - Red: wrong words
 * - Blur: hinted words (based on hintMode)
 */
export const renderProgressiveText = (correctText, revealed, wrong, hintMode, isDarkMode) => {
    const correctWords = correctText.trim().split(/\s+/);
    const elements = [];

    correctWords.forEach((word, i) => {
        if (revealed.includes(i)) {
            // Revealed (correct) word - green
            elements.push({
                key: `word-${i}`,
                word,
                className: isDarkMode ? 'text-green-400' : 'text-green-600',
                style: { fontWeight: 'bold' }
            });
        } else if (wrong.some(w => w.index === i)) {
            // Wrong word - red with strikethrough
            const wrongWord = wrong.find(w => w.index === i);
            elements.push({
                key: `word-${i}`,
                word: wrongWord.word,
                className: isDarkMode ? 'text-red-400 line-through' : 'text-red-600 line-through',
                style: { fontWeight: 'bold' }
            });
        } else {
            // Unrevealed words - show based on hint mode
            const nextIndex = revealed.length;
            const isNextWord = i === nextIndex;
            const shouldShowHint = (hintMode === 'one' && isNextWord) || hintMode === 'all';

            if (shouldShowHint) {
                // Show hint (first 1-2 letters + underscores)
                const hintText = word.length > 2
                    ? word.substring(0, 2) + '_'.repeat(word.length - 2)
                    : '_'.repeat(word.length);

                elements.push({
                    key: `word-${i}`,
                    word: hintText,
                    className: isDarkMode ? 'text-amber-400' : 'text-amber-600',
                    style: { fontStyle: 'italic' }
                });
            } else {
                // Hidden word - just underscores
                elements.push({
                    key: `word-${i}`,
                    word: '_'.repeat(word.length),
                    className: isDarkMode ? 'text-slate-600' : 'text-slate-400',
                    style: {}
                });
            }
        }
    });

    return elements;
};

/**
 * Check if sentence is complete and correct
 */
export const isListenSentenceCorrect = (userInput, correctText) => {
    if (!userInput || !correctText) return false;

    // Normalize and compare
    const normalize = (text) => text.trim().toLowerCase().replace(/[.,!?;:"']/g, '');
    return normalize(userInput) === normalize(correctText);
};

/**
 * Calculate score for Listen mode
 * Based on correct words and penalties for wrong attempts
 */
export const calculateListenScore = (revealed, totalWords, wrongAttempts) => {
    const correctRatio = revealed.length / totalWords;
    const penalty = Math.min(wrongAttempts * 0.05, 0.3); // Max 30% penalty
    return Math.max(0, (correctRatio - penalty) * 100);
};
