const fs = require('fs');
const p = '.github/workflows/architecture-pipeline.yml';
if(fs.existsSync(p)){
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(/node scripts\//g, 'node ais/scripts/');
    fs.writeFileSync(p, c);
}
