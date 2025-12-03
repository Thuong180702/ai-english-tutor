const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Applying fixes to App.jsx...\n');

// FIX 1: Change hintMode default from 'none' to 'one'
console.log('Fix 1: Changing hintMode default to "one"...');
content = content.replace(
    /const \[hintMode, setHintMode\] = useState\('none'\);/,
    "const [hintMode, setHintMode] = useState('one');"
);

// FIX 2: Add Vietnamese hint to feedback
console.log('Fix 2: Adding Vietnamese hint to correct feedback...');
content = content.replace(
    /setAiFeedbackMsg\("Chính xác!"\);/,
    'const vietnameseHint = currentSent.hint || "";\n                setAiFeedbackMsg(`Chính xác! ${vietnameseHint}`);'
);

// FIX 3: Add version display before closing div
console.log('Fix 3: Adding version display component...');
const versionDisplay = `
            
            {/* Version Display - Shows on all pages */}
            <div className="fixed bottom-4 right-4 text-xs opacity-50 hover:opacity-100 transition-opacity z-50">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>v{version}</span>
            </div>`;

content = content.replace(
    /(\s+)\}\s+<\/div\s+>\s+\);\s+\}$/m,
    `$1}${versionDisplay}\n        </div >\n    );\n}`
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ All fixes applied successfully!');
console.log('You can now run: npm run deploy');
