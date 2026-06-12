const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        // Regex to find src="/..." for images
        const regex = /src="\/([^"]+\.(?:png|jpeg|jpg|svg|webp|gif))"/g;
        
        if (regex.test(content)) {
            content = content.replace(regex, 'src={`$${import.meta.env.BASE_URL}$1`}');
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log(`Updated ${filePath}`);
        }
    }
});
