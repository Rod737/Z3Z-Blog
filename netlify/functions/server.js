const serverless = require("serverless-http");
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do EJS (sem express-ejs-layouts para simplicidade)
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../../views'));

// Arquivos estáticos 
app.use('/css', express.static(path.resolve(__dirname, '../../public/css')));
app.use('/js', express.static(path.resolve(__dirname, '../../public/js')));
app.use('/images', express.static(path.resolve(__dirname, '../../public/images')));

// Dados simulados (em produção, use banco de dados)
const sampleData = {
  poemas: [
    {
      id: 1,
      title: "O Silêncio da Alma",
      content: ["No silêncio profundo da noite escura,", "a alma sussurra verdades que o dia não ousa revelar..."],
      category: "existencial",
      tags: ["alma", "silêncio", "reflexão"],
      published: true,
      date: "5 de Janeiro, 2025",
      author: "Admin"
    }
  ],
  filosofia: [
    {
      id: 1,
      title: "A Natureza do Tempo",
      content: ["Reflexões sobre a percepção humana do tempo e sua influência na construção do sentido da vida..."],
      category: "existencial",
      tags: ["tempo", "existência", "filosofia"],
      published: true,
      date: "3 de Janeiro, 2025",
      author: "Admin"
    }
  ],
  religiao: [
    {
      id: 1,
      title: "Fé e Razão: Um Diálogo",
      content: ["Explorando a harmonia entre a fé religiosa e o pensamento racional na busca pela verdade..."],
      category: "teologia",
      tags: ["fé", "razão", "diálogo"],
      published: true,
      date: "1° de Janeiro, 2025",
      author: "Admin"
    }
  ]
};

// Rota principal
app.get('/', (req, res) => {
  const featuredPosts = [
    { 
      category: 'poemas', 
      title: sampleData.poemas[0].title, 
      excerpt: sampleData.poemas[0].content[0].substring(0, 100) + '...',
      date: sampleData.poemas[0].date,
      link: `/poemas/${sampleData.poemas[0].id}`
    },
    { 
      category: 'filosofia', 
      title: sampleData.filosofia[0].title, 
      excerpt: sampleData.filosofia[0].content[0].substring(0, 100) + '...',
      date: sampleData.filosofia[0].date,
      link: `/filosofia/${sampleData.filosofia[0].id}`
    },
    { 
      category: 'religiao', 
      title: sampleData.religiao[0].title, 
      excerpt: sampleData.religiao[0].content[0].substring(0, 100) + '...',
      date: sampleData.religiao[0].date,
      link: `/religiao/${sampleData.religiao[0].id}`
    }
  ];

  res.render('index', { 
    title: 'Z3Z Blog - Um espaço sagrado para a alma',
    currentPage: 'home',
    featuredPosts
  });
});

// Rotas de conteúdo
app.get('/poemas', (req, res) => {
  res.render('poemas', { 
    title: 'Poemas - Z3Z Blog',
    currentPage: 'poemas',
    poemas: sampleData.poemas
  });
});

app.get('/filosofia', (req, res) => {
  res.render('filosofia', { 
    title: 'Filosofia - Z3Z Blog',
    currentPage: 'filosofia',
    artigos: sampleData.filosofia
  });
});

app.get('/religiao', (req, res) => {
  res.render('religiao', { 
    title: 'Religião - Z3Z Blog',
    currentPage: 'religiao',
    artigos: sampleData.religiao
  });
});

app.get('/sobre', (req, res) => {
  res.render('about', { 
    title: 'Sobre - Z3Z Blog',
    currentPage: 'sobre'
  });
});

// Artigos individuais
app.get('/poemas/:id', (req, res) => {
  const poema = sampleData.poemas.find(p => p.id === parseInt(req.params.id));
  if (!poema) {
    return res.status(404).render('404', { 
      title: 'Poema não encontrado - Z3Z Blog',
      currentPage: '404'
    });
  }
  
  res.render('poema-single', { 
    title: `${poema.title} - Z3Z Blog`,
    currentPage: 'poemas',
    poema
  });
});

app.get('/filosofia/:id', (req, res) => {
  const artigo = sampleData.filosofia.find(a => a.id === parseInt(req.params.id));
  if (!artigo) {
    return res.status(404).render('404', { 
      title: 'Artigo não encontrado - Z3Z Blog',
      currentPage: '404'
    });
  }
  
  res.render('artigo-single', { 
    title: `${artigo.title} - Z3Z Blog`,
    currentPage: 'filosofia',
    artigo,
    type: 'filosofia'
  });
});

app.get('/religiao/:id', (req, res) => {
  const artigo = sampleData.religiao.find(a => a.id === parseInt(req.params.id));
  if (!artigo) {
    return res.status(404).render('404', { 
      title: 'Artigo não encontrado - Z3Z Blog',
      currentPage: '404'
    });
  }
  
  res.render('artigo-single', { 
    title: `${artigo.title} - Z3Z Blog`,
    currentPage: 'religiao',
    artigo,
    type: 'religiao'
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Página não encontrada - Z3Z Blog',
    currentPage: '404'
  });
});

// Middleware de erro
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