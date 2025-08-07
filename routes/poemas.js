const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Função para ler dados dos poemas
async function readPoemas() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/poemas.json'), 'utf8');
        return JSON.parse(data).filter(poema => poema.published);
    } catch (error) {
        console.error('Erro ao ler poemas:', error);
        return [];
    }
}

// Lista de poemas
router.get('/', async (req, res) => {
    try {
        const poemas = await readPoemas();
        
        res.render('poemas', {
            title: 'Poemas - Z3Z Blog',
            currentPage: 'poemas',
            poemas: poemas,
            categories: ['todos', 'amor', 'natureza', 'existencial']
        });
    } catch (error) {
        console.error('Erro ao carregar poemas:', error);
        res.status(500).render('error', {
            title: 'Erro - Z3Z Blog',
            message: 'Erro ao carregar poemas',
            currentPage: 'poemas'
        });
    }
});

// Poema individual
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const poemas = await readPoemas();
        const poema = poemas.find(p => p.id === id);
        
        if (!poema) {
            return res.status(404).render('404', {
                title: '404 - Poema não encontrado',
                message: 'O poema que você procura não foi encontrado.',
                currentPage: 'poemas'
            });
        }

        res.render('poema-single', {
            title: `${poema.title} - Z3Z Blog`,
            currentPage: 'poemas',
            poema: poema
        });
    } catch (error) {
        console.error('Erro ao carregar poema:', error);
        res.status(500).render('error', {
            title: 'Erro - Z3Z Blog',
            message: 'Erro ao carregar poema',
            currentPage: 'poemas'
        });
    }
});

module.exports = router;