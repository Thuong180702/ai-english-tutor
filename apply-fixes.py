import re

# Read the file
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

print('Applying fixes to App.jsx...\n')

# FIX 1: Change hintMode default from 'none' to 'one'
print('Fix 1: Changing hintMode default to "one"...')
content = re.sub(
    r"const \[hintMode, setHintMode\] = useState\('none'\);",
    "const [hintMode, setHintMode] = useState('one');",
    content
)

# FIX 2: Add Vietnamese hint to feedback
print('Fix 2: Adding Vietnamese hint to correct feedback...')
content = re.sub(
    r'setAiFeedbackMsg\("Chính xác!"\);',
    'const vietnameseHint = currentSent.hint || "";\n                setAiFeedbackMsg(`Chính xác! ${vietnameseHint}`);',
    content
)

# FIX 3: Add version display before closing div
print('Fix 3: Adding version display component...')
version_display = '''
            
            {/* Version Display - Shows on all pages */}
            <div className="fixed bottom-4 right-4 text-xs opacity-50 hover:opacity-100 transition-opacity z-50">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>v{version}</span>
            </div>'''

# Find the pattern at the end of the file
content = re.sub(
    r'(\s+)\}\s*</div\s*>\s*\);\s*}\s*$',
    r'\1}' + version_display + '\n        </div >\n    );\n}',
    content,
    flags=re.MULTILINE
)

# Write back
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('\n✅ All fixes applied successfully!')
print('You can now run: npm run deploy')
