const serverless = require("serverless-http");
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Configuração do Express
const app = express();

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());

// Middleware para parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração de sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'z3z-blog-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Arquivos estáticos
app.use(express.static(path.join(__dirname, '../../public')));
app.use('/images', express.static(path.join(__dirname, '../../public/images')));
app.use('/css', express.static(path.join(__dirname, '../../public/css')));
app.use('/js', express.static(path.join(__dirname, '../../public/js')));

// Importar rotas
const indexRoutes = require('../../routes/index');
const poemasRoutes = require('../../routes/poemas');
const filosofiaRoutes = require('../../routes/filosofia');
const religiaoRoutes = require('../../routes/religiao');
const adminRoutes = require('../../routes/admin');
const commentsRoutes = require('../../routes/comments');

// Usar rotas
app.use('/', indexRoutes);
app.use('/poemas', poemasRoutes);
app.use('/filosofia', filosofiaRoutes);
app.use('/religiao', religiaoRoutes);
app.use('/admin', adminRoutes);
app.use('/api/comments', commentsRoutes);

// Middleware para páginas não encontradas
app.use((req, res) => {
    res.status(404).render('404', { 
        title: 'Página não encontrada - Z3Z Blog',
        currentPage: '404'
    });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro na aplicação:', err.stack);
    res.status(500).render('error', { 
        title: 'Erro interno - Z3Z Blog',
        error: process.env.NODE_ENV === 'production' ? 'Algo deu errado!' : err,
        currentPage: 'error'
    });
});

// Exportar como função serverless
module.exports.handler = serverless(app);