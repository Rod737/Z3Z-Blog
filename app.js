const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança e otimização
app.use(helmet({
    contentSecurityPolicy: false // Desabilitado para permitir fontes do Google
}));
app.use(compression());
app.use(cors());
app.use(morgan('combined'));

// Parser de requisições
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração de sessão
app.use(session({
    secret: 'z3z-blog-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true em produção com HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração do layout
app.use(expressLayouts);
app.set('layout', 'layout');

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Importar rotas
const indexRoutes = require('./routes/index');
const poemasRoutes = require('./routes/poemas');
const filosofiaRoutes = require('./routes/filosofia');
const religiaoRoutes = require('./routes/religiao');
const adminRoutes = require('./routes/admin');
const commentsRoutes = require('./routes/comments');

// Usar rotas
app.use('/', indexRoutes);
app.use('/poemas', poemasRoutes);
app.use('/filosofia', filosofiaRoutes);
app.use('/religiao', religiaoRoutes);
app.use('/admin', adminRoutes);
app.use('/comments', commentsRoutes);

// Middleware para páginas não encontradas
app.use((req, res) => {
    res.status(404).render('404', {
        title: '404 - Página não encontrada',
        currentPage: '404',
        message: 'A página que você procura não foi encontrada.'
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: '500 - Erro interno',
        currentPage: 'error',
        message: 'Algo deu errado no servidor.'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Blog Z3Z rodando em http://localhost:${PORT}`);
    console.log('✨ Um espaço sagrado para a alma está agora disponível');
});