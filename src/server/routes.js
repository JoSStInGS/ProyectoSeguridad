var router = require('express').Router();
var rateLimit = require('express-rate-limit');

var loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 3, // máximo 5 intentos
    message: { error: 'Demasiados intentos de login. Intente de nuevo en 5 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});
var four0four = require('./utils/404')();
var data = require('./data');
data.profile = {};

router.get('/people', getPeople);
router.get('/person/:id', getPerson);

// RS-01: Rate limiting en login para prevenir fuerza bruta (T-01)
router.post('/user/login', loginLimiter, login);
router.post('/user/logout', logout);

// RS-08: Rutas protegidas con middleware de autenticación
router.post('/user/profile/', requireAuth, updateProfile);
router.get('/user/profile/', requireAuth, getProfile);

router.get('/search', search);

router.get('/*', four0four.notFoundMiddleware);

module.exports = router;

//////////////

// Middleware de autenticación (RS-08 / T-11)
// Verifica que la cookie userAuthToken corresponde a una sesión activa en el servidor
function requireAuth(req, res, next) {
    var token = req.cookies.userAuthToken;
    if (!token || !data.profile[token]) {
        return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
    }
    next();
}
// correción: Implementar sanitización de entrada para prevenir XSS en la búsqueda
function search(req, res, next) {
    var he = require('he');
    console.log(req.query.searchTerm);
    var sanitized = he.encode(req.query.searchTerm || '');
    res.status(200).send(sanitized);
}

function getProfile(req, res, next) {
    console.log('User Requesting Read: ', req.cookies.userAuthToken);
    console.log('Profile found: ', data.profile[req.cookies.userAuthToken]);
    res.status(200).send(data.profile[req.cookies.userAuthToken]);
}

function updateProfile(req, res, next) {
    var user = req.cookies.userAuthToken;
    console.log('User Requesting Update: ', user);
    console.log('Updating user profile from: ', data.profile[user]);
    console.log('Updating user profile to: ', req.body);
    data.profile[user] = req.body;
    console.log('Updated profile for user: ', user);
    res.status(200).send(data.profile[user]);
}

function login(req, res, next) {
    var randomNumber = Math.random().toString();
    randomNumber = '35592211433686316';

    data.randomNumber = randomNumber;
    data.profile[randomNumber] = {
        firstName: 'Jim',
        lastName: 'Bob'
    };

    console.log('Logged in user: ', data.randomNumber);
    res.cookie('userAuthToken', randomNumber, {maxAge: 3600000, path: '/'});
    res.status(200).send(randomNumber);
}

function logout(req, res, next) {
    console.log('Logged out user: ', data.randomNumber);
    data.randomNumber = undefined;
    res.clearCookie('userAuthToken');
    res.status(200).send('logged out!');
}

function getPeople(req, res, next) {
    res.status(200).send(data.people);
}

function getPerson(req, res, next) {
    var id = +req.params.id;
    var person = data.people.filter(function(p) {
        return p.id === id;
    })[0];

    if (person) {
        res.status(200).send(person);
    } else {
        four0four.send404(req, res, 'person ' + id + ' not found');
    }
}