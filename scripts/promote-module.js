const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const MATURITY_PATH = path.join(ROOT_DIR, 'ais', 'memory', 'module-maturity.json');
const MEMORY_PATH = path.join(ROOT_DIR, 'ais', 'memory', 'architectural-memory.json');

const VALID_STATUSES = ['LEGACY', 'MIGRATION', 'STABLE', 'PROTECTED'];

function showUsage() {
  console.log('\n=============================================================');
  console.log('       AIS Module Maturity Promotion System');
  console.log('=============================================================');
  console.log('Uso:');
  console.log('  node scripts/promote-module.js [module-name] [NEW_STATUS] "[justification]"\n');
  console.log('Valores permitidos para NEW_STATUS:');
  console.log('  LEGACY, MIGRATION, STABLE, PROTECTED\n');
  console.log('Exemplo:');
  console.log('  node scripts/promote-module.js feature-media STABLE "Arquitetada com ViewModel e desacoplamento completo"');
  console.log('=============================================================\n');
}

function runPromotion() {
  const args = process.argv.slice(2);
  
  

  let maturityData = (require('./combinenet').getCombinedState().memory || {}).evolution || { modules: {}, history: [] };

  if (args.length < 3) {
    console.log('Módulos Cadastrados e Estados Atuais:');
    Object.entries(maturityData.modules).forEach(([mod, status]) => {
      console.log(`  - ${mod}: [${status}]`);
    });
    showUsage();
    process.exit(0);
  }

  const moduleName = args[0];
  const newStatus = args[1].toUpperCase();
  const justification = args[2];

  if (!maturityData.modules.hasOwnProperty(moduleName)) {
    console.error(`Erro: O modulo '${moduleName}' nao esta catalogado em module-maturity.json.`);
    console.log('Modulos validos atualmente:');
    Object.keys(maturityData.modules).forEach(m => console.log(`  - ${m}`));
    process.exit(1);
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    console.error(`Erro: Estado '${newStatus}' invalido. Deve ser um de: ${VALID_STATUSES.join(', ')}`);
    process.exit(1);
  }

  const oldStatus = maturityData.modules[moduleName];
  if (oldStatus === newStatus) {
    console.log(`Informacao: O modulo '${moduleName}' ja possui estado '${newStatus}'. Nenhuma mudanca realizada.`);
    process.exit(0);
  }

  // Registra no arquivo local de maturidade
  maturityData.modules[moduleName] = newStatus;
  maturityData.lastUpdated = new Date().toISOString();
  
  const historyEntry = {
    date: new Date().toISOString().split('T')[0],
    module: moduleName,
    from: oldStatus,
    to: newStatus,
    justification: justification
  };
  
  maturityData.history.push(historyEntry);
  require('./combinenet').updateSection('memory', { ...require('./combinenet').getCombinedState().memory, evolution: maturityData });

  console.log(`✓ Modulo '${moduleName}' promovido com sucesso: ${oldStatus} -> ${newStatus}`);

  // Sincroniza log na memoria arquitetural se existente
  if (fs.existsSync(MEMORY_PATH)) {
    let memory = (require('./combinenet').getCombinedState().memory || {}).adrState || { decisions: [] };
    if (!memory.architectural_events) {
      memory.architectural_events = [];
    }
    
    memory.architectural_events.push({
      timestamp: new Date().toISOString(),
      type: 'MODULE_MATURITY_PROMOTION',
      message: `Module '${moduleName}' promoted from '${oldStatus}' to '${newStatus}'`,
      justification: justification
    });
    
    require('./combinenet').updateSection('memory', { ...require('./combinenet').getCombinedState().memory, adrState: memory });
    console.log(`✓ Evento de promocao arquivado na Memoria Arquitetural local.`);
  }
}

runPromotion();
