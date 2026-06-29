import os
import glob

replacements = {
    'â˜…': '★',
    'Â·': '·',
    'â€”': '—',
    'â€“': '–',
    'â€¦': '…',
    'â†’': '→',
    'Â£': '£',
    'â€¢': '•',
    'â”€': '─',
    'Ã—': '×'
}

files = glob.glob('src/components/cv/**/*.tsx', recursive=True) + glob.glob('src/pages/employee/**/*.tsx', recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    for k, v in replacements.items():
        if k in content:
            content = content.replace(k, v)
            modified = True
            
    if modified:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {file}')
