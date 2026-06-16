const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../scripts');
fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.js')) {
        let filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content.replace(/path\.resolve\(__dirname, '\.\.'\)/g, "path.resolve(__dirname, '../..')");
        fs.writeFileSync(filePath, newContent);
    }
});
console.log("Updated __dirname in all scripts");
