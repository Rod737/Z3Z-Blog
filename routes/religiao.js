const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Função para ler dados dos artigos de religião
async function readReligiao() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/religiao.json'), 'utf8');
        const artigos = JSON.parse(data).filter(artigo => artigo.published);
        return artigos;
    } catch (error) {
        console.error('Erro ao ler religião:', error);
        return [];
    }
}

// Lista de artigos de religião
router.get('/', async (req, res) => {
    try {
        const artigos = await readReligiao();
        
        res.render('religiao', {
            title: 'Religião - Z3Z Blog',
            currentPage: 'religiao',
            artigos: artigos
        });
    } catch (error) {
        console.error('Erro ao carregar religião:', error);
        res.status(500).render('error', {
            title: 'Erro - Z3Z Blog',
            currentPage: 'religiao',
            message: 'Erro ao carregar artigos de religião'
        });
    }
});

// Artigo individual
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const artigos = await readReligiao();
        const artigo = artigos.find(a => a.id === id);
        
        if (!artigo) {
            return res.status(404).render('404', {
                title: '404 - Artigo não encontrado',
                currentPage: 'religiao',
                message: 'O artigo que você procura não foi encontrado.'
            });
        }

        res.render('artigo-single', {
            title: `${artigo.title} - Z3Z Blog`,
            currentPage: 'religiao',
            artigo: artigo,
            type: 'religiao'
        });
    } catch (error) {
        console.error('Erro ao carregar artigo:', error);
        res.status(500).render('error', {
            title: 'Erro - Z3Z Blog',
            currentPage: 'religiao',
            message: 'Erro ao carregar artigo'
        });
    }
});

module.exports = router;