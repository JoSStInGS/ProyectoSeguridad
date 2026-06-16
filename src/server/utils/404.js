module.exports = function () {
    // RS-07: Se importa el logger para registrar errores internamente
    var logger = require('../logger');

    var service = {
        notFoundMiddleware: notFoundMiddleware,
        send404: send404
    };
    return service;

    function notFoundMiddleware(req, res, next) {
        send404(req, res, 'API endpoint not found');
    }

    function send404(req, res, description) {
        // RS-07: Se registra el detalle del error en el log interno
        // sin exponerlo al cliente
        logger.warn('Recurso no encontrado', {
            event: 'NOT_FOUND',
            url: req.url,
            description: description,
            ip: req.ip
        });

        // RS-07: Se devuelve mensaje genérico al cliente
        // sin revelar detalles internos del sistema
        res.status(404)
            .send({ status: 404, message: 'Recurso no encontrado.' })
            .end();
    }
};