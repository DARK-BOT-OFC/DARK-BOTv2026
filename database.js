const fs = require('fs');
const DB_FILE = './database.json';

// Inicializar o cargar la base de datos
function getDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            users: {},
            chats: {},
            stats: {},
            settings: {}
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
    
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error('[DARK-BOTv2026] Error al leer la base de datos:', e);
        return { users: {}, chats: {}, stats: {}, settings: {} };
    }
}

// Guardar la base de datos en el archivo JSON
function saveDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('[DARK-BOTv2026] Error al guardar la base de datos:', e);
    }
}

// Cargamos los datos globalmente al requerir el archivo
global.db = getDatabase();

// Guardar cambios automáticamente cada 10 segundos
setInterval(() => {
    if (global.db) {
        saveDatabase(global.db);
    }
}, 10 * 1000);

module.exports = { getDatabase, saveDatabase };
