'use strict';

var winston = require('winston');

// Logger formal con winston
// Registra eventos en archivo persistente append-only con timestamp y nivel de severidad
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        // Agrega timestamp a cada entrada del log
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // Formato JSON estructurado para facilitar auditorías
        winston.format.json()
    ),
    transports: [
        // Archivo append-only para todos los eventos de seguridad
        new winston.transports.File({
            filename: 'src/server/logs/security.log',
            options: { flags: 'a' } // 'a' = append, nunca sobreescribe
        }),
        // También muestra en consola para desarrollo
        new winston.transports.Console()
    ]
});

module.exports = logger;