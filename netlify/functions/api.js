const express = require('express');
const path = require('path');
const fs = require('fs');

// Detectar o diretório base correto para Netlify
const findProjectRoot = () => {
    // No Netlify, primeiro tentamos paths absolutos
    const possibleRoots = [
        '/opt/build/repo',
        path.resolve(__dirname, '../..'),
        process.cwd()
    ];
    
    for (const root of possibleRoots) {
        if (fs.existsSync(path.join(root, 'package.json'))) {
            return root;
        }
    }
    
    return path.resolve(__dirname, '../..');
};

const projectRoot = findProjectRoot();
console.log('Project root:', projectRoot);
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

// Configuração do EJS - ajustado para Netlify
app.set('view engine', 'ejs');
app.set('views', path.join(projectRoot, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Arquivos estáticos - ajustado para Netlify
app.use(express.static(path.join(projectRoot, 'public')));
app.use('/images', express.static(path.join(projectRoot, 'public/images')));
app.use('/css', express.static(path.join(projectRoot, 'public/css')));
app.use('/js', express.static(path.join(projectRoot, 'public/js')));

// Importar rotas - ajustado para Netlify
const indexRoutes = require(path.join(projectRoot, 'routes/index'));
const poemasRoutes = require(path.join(projectRoot, 'routes/poemas'));
const filosofiaRoutes = require(path.join(projectRoot, 'routes/filosofia'));
const religiaoRoutes = require(path.join(projectRoot, 'routes/religiao'));
const adminRoutes = require(path.join(projectRoot, 'routes/admin'));
const commentsRoutes = require(path.join(projectRoot, 'routes/comments'));

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

// Exportar como função serverless para Netlify
const serverless = require("serverless-http");
module.exports.handler = serverless(app);