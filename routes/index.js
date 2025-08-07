const express = require('express');
const router = express.Router();

// Página inicial
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Z3Z - Blog de Poemas, Filosofia e Religião',
        currentPage: 'home',
        featuredPosts: [
            {
                id: 1,
                category: 'poemas',
                title: 'O Silêncio da Alma',
                excerpt: 'No silêncio profundo da noite escura, a alma sussurra verdades que o dia não ousa revelar...',
                date: '5 de Janeiro, 2025',
                link: '/poemas/1'
            },
            {
                id: 2,
                category: 'filosofia',
                title: 'A Natureza do Tempo',
                excerpt: 'Reflexões sobre a percepção humana do tempo e sua influência na construção do sentido da vida...',
                date: '3 de Janeiro, 2025',
                link: '/filosofia/1'
            },
            {
                id: 3,
                category: 'religiao',
                title: 'Fé e Razão: Um Diálogo',
                excerpt: 'Explorando a harmonia entre a fé religiosa e o pensamento racional na busca pela verdade...',
                date: '1º de Janeiro, 2025',
                link: '/religiao/1'
            }
        ]
    });
});

// Página sobre
router.get('/sobre', (req, res) => {
    res.render('about', {
        title: 'Sobre - Z3Z Blog',
        currentPage: 'sobre'
    });
});

module.exports = router;