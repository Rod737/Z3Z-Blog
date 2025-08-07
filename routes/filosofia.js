const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Função para ler dados dos artigos de filosofia
async function readFilosofia() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/filosofia.json'), 'utf8');
        const artigos = JSON.parse(data).filter(artigo => artigo.published);
        return artigos;
    } catch (error) {
        console.error('Erro ao ler filosofia:', error);
        return [];
    }
}

// Lista de artigos de filosofia
router.get('/', async (req, res) => {
    try {
        const artigos = await readFilosofia();
        
        res.render('filosofia', {
            title: 'Filosofia - Z3Z Blog',
            currentPage: 'filosofia',
            artigos: artigos
        });
    } catch (error) {
        console.error('Erro ao carregar filosofia:', error);
        res.status(500).render('error', {
            title: 'Erro - Z3Z Blog',
            currentPage: 'filosofia',
            message: 'Erro ao carregar artigos de filosofia'
        });
    }
});

// Artigo individual
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const artigos = await readFilosofia();
        const artigo = artigos.find(a => a.id === id);
        
        if (!artigo) {
            return res.status(404).render('404', {
                title: '404 - Artigo não encontrado',
                currentPage: 'filosofia',
                message: 'O artigo que você procura não foi encontrado.'
            });
        }

        res.render('artigo-single', {
            title: `${artigo.title} - Z3Z Blog`,
            currentPage: 'filosofia',
            artigo: artigo,
            type: 'filosofia'
        });
    } catch (error) {
        console.error('Erro ao carregar artigo:', error);
        res.status(500).render('error', {
            title: 'Erro - Z3Z Blog',
            currentPage: 'filosofia',
            message: 'Erro ao carregar artigo'
        });
    }
});

module.exports = router;