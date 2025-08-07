const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

// Middleware de autenticação
const requireAuth = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    } else {
        return res.redirect('/admin/login');
    }
};

// Funções auxiliares para ler/escrever dados
async function readDataFile(filename) {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data', filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Erro ao ler ${filename}:`, error);
        return [];
    }
}

async function writeDataFile(filename, data) {
    try {
        await fs.writeFile(
            path.join(__dirname, '../data', filename),
            JSON.stringify(data, null, 2),
            'utf8'
        );
        return true;
    } catch (error) {
        console.error(`Erro ao escrever ${filename}:`, error);
        return false;
    }
}

// Página de login
router.get('/login', (req, res) => {
    if (req.session && req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    
    res.render('admin/login', {
        title: 'Login - Z3Z Admin',
        layout: 'admin/layout',
        currentPage: 'login',
        error: null
    });
});

// Processar login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const adminData = await readDataFile('admin.json');
        
        if (username === adminData.username) {
            const isValidPassword = await bcrypt.compare(password, adminData.password);
            
            if (isValidPassword) {
                req.session.admin = {
                    username: adminData.username,
                    name: adminData.name,
                    email: adminData.email
                };
                return res.redirect('/admin/dashboard');
            }
        }
        
        res.render('admin/login', {
            title: 'Login - Z3Z Admin',
            layout: 'admin/layout',
            currentPage: 'login',
            error: 'Usuário ou senha inválidos'
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.render('admin/login', {
            title: 'Login - Z3Z Admin',
            layout: 'admin/layout',
            currentPage: 'login',
            error: 'Erro interno do servidor'
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
        }
        res.redirect('/admin/login');
    });
});

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const poemas = await readDataFile('poemas.json');
        const filosofia = await readDataFile('filosofia.json');
        const religiao = await readDataFile('religiao.json');
        
        res.render('admin/dashboard', {
            title: 'Dashboard - Z3Z Admin',
            layout: 'admin/layout',
            currentPage: 'dashboard',
            admin: req.session.admin,
            stats: {
                poemas: poemas.length,
                filosofia: filosofia.length,
                religiao: religiao.length,
                total: poemas.length + filosofia.length + religiao.length
            }
        });
    } catch (error) {
        console.error('Erro no dashboard:', error);
        res.status(500).render('error', {
            title: 'Erro - Z3Z Admin',
            message: 'Erro ao carregar dashboard'
        });
    }
});

// Listar poemas
router.get('/poemas', requireAuth, async (req, res) => {
    try {
        const poemas = await readDataFile('poemas.json');
        
        res.render('admin/poemas/list', {
            title: 'Gerenciar Poemas - Z3Z Admin',
            layout: 'admin/layout',
            currentPage: 'poemas',
            admin: req.session.admin,
            poemas: poemas
        });
    } catch (error) {
        console.error('Erro ao listar poemas:', error);
        res.status(500).render('error', {
            title: 'Erro - Z3Z Admin',
            message: 'Erro ao carregar poemas'
        });
    }
});

// Novo poema
router.get('/poemas/novo', requireAuth, (req, res) => {
    res.render('admin/poemas/form', {
        title: 'Novo Poema - Z3Z Admin',
        layout: 'admin/layout',
        currentPage: 'poemas',
        admin: req.session.admin,
        poema: null,
        action: 'criar'
    });
});

// Salvar novo poema
router.post('/poemas/novo', requireAuth, async (req, res) => {
    try {
        const { title, content, category, tags, published } = req.body;
        const poemas = await readDataFile('poemas.json');
        
        // Gerar novo ID
        const newId = poemas.length > 0 ? Math.max(...poemas.map(p => p.id)) + 1 : 1;
        
        const novoPoema = {
            id: newId,
            title: title.trim(),
            content: content.split('\n').map(line => line.trim()),
            category: category || 'geral',
            date: new Date().toISOString().split('T')[0],
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            published: published === 'on',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        poemas.push(novoPoema);
        
        if (await writeDataFile('poemas.json', poemas)) {
            res.redirect('/admin/poemas?success=created');
        } else {
            throw new Error('Erro ao salvar arquivo');
        }
    } catch (error) {
        console.error('Erro ao criar poema:', error);
        res.redirect('/admin/poemas?error=create');
    }
});

// Editar poema
router.get('/poemas/:id/editar', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const poemas = await readDataFile('poemas.json');
        const poema = poemas.find(p => p.id === id);
        
        if (!poema) {
            return res.redirect('/admin/poemas?error=notfound');
        }
        
        res.render('admin/poemas/form', {
            title: 'Editar Poema - Z3Z Admin',
            layout: 'admin/layout',
            currentPage: 'poemas',
            admin: req.session.admin,
            poema: poema,
            action: 'editar'
        });
    } catch (error) {
        console.error('Erro ao carregar poema:', error);
        res.redirect('/admin/poemas?error=load');
    }
});

// Atualizar poema
router.post('/poemas/:id/editar', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, content, category, tags, published } = req.body;
        const poemas = await readDataFile('poemas.json');
        
        const index = poemas.findIndex(p => p.id === id);
        if (index === -1) {
            return res.redirect('/admin/poemas?error=notfound');
        }
        
        poemas[index] = {
            ...poemas[index],
            title: title.trim(),
            content: content.split('\n').map(line => line.trim()),
            category: category || 'geral',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            published: published === 'on',
            updated_at: new Date().toISOString()
        };
        
        if (await writeDataFile('poemas.json', poemas)) {
            res.redirect('/admin/poemas?success=updated');
        } else {
            throw new Error('Erro ao salvar arquivo');
        }
    } catch (error) {
        console.error('Erro ao atualizar poema:', error);
        res.redirect('/admin/poemas?error=update');
    }
});

// Excluir poema
router.post('/poemas/:id/excluir', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const poemas = await readDataFile('poemas.json');
        
        const filteredPoemas = poemas.filter(p => p.id !== id);
        
        if (await writeDataFile('poemas.json', filteredPoemas)) {
            res.redirect('/admin/poemas?success=deleted');
        } else {
            throw new Error('Erro ao salvar arquivo');
        }
    } catch (error) {
        console.error('Erro ao excluir poema:', error);
        res.redirect('/admin/poemas?error=delete');
    }
});

// Rotas similares para filosofia e religião
router.get('/filosofia', requireAuth, async (req, res) => {
    try {
        const filosofia = await readDataFile('filosofia.json');
        
        res.render('admin/filosofia/list', {
            title: 'Gerenciar Filosofia - Z3Z Admin',
            layout: 'admin/layout',
            currentPage: 'filosofia',
            admin: req.session.admin,
            artigos: filosofia
        });
    } catch (error) {
        console.error('Erro ao listar filosofia:', error);
        res.status(500).render('error', {
            title: 'Erro - Z3Z Admin',
            message: 'Erro ao carregar artigos de filosofia'
        });
    }
});

router.get('/religiao', requireAuth, async (req, res) => {
    try {
        const religiao = await readDataFile('religiao.json');
        
        res.render('admin/religiao/list', {
            title: 'Gerenciar Religião - Z3Z Admin',
            layout: 'admin/layout',
            currentPage: 'religiao',
            admin: req.session.admin,
            artigos: religiao
        });
    } catch (error) {
        console.error('Erro ao listar religião:', error);
        res.status(500).render('error', {
            title: 'Erro - Z3Z Admin',
            message: 'Erro ao carregar artigos de religião'
        });
    }
});

// ========== ROTAS CRUD PARA FILOSOFIA ==========

// Novo artigo de filosofia
router.get('/filosofia/novo', requireAuth, (req, res) => {
    res.render('admin/filosofia/form', {
        title: 'Novo Artigo de Filosofia - Z3Z Admin',
        layout: 'admin/layout',
        currentPage: 'filosofia',
        admin: req.session.admin,
        artigo: null,
        action: 'criar'
    });
});

// Salvar novo artigo de filosofia
router.post('/filosofia/novo', requireAuth, async (req, res) => {
    try {
        const { title, content, tags, published } = req.body;
        const filosofia = await readDataFile('filosofia.json');
        
        const newArtigo = {
            id: filosofia.length > 0 ? Math.max(...filosofia.map(a => a.id)) + 1 : 1,
            title: title.trim(),
            content: content.split('\n').map(line => line.trim()).filter(line => line),
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            published: published === 'on',
            date: new Date().toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            created_at: new Date().toISOString(),
            author: 'Equipe Z3Z'
        };
        
        filosofia.push(newArtigo);
        
        if (await writeDataFile('filosofia.json', filosofia)) {
            res.redirect('/admin/filosofia?success=created');
        } else {
            throw new Error('Erro ao salvar arquivo');
        }
    } catch (error) {
        console.error('Erro ao criar artigo de filosofia:', error);
        res.redirect('/admin/filosofia?error=create');
    }
});

// Editar artigo de filosofia
router.get('/filosofia/:id/editar', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const filosofia = await readDataFile('filosofia.json');
        const artigo = filosofia.find(a => a.id === id);
        
        if (!artigo) {
            return res.redirect('/admin/filosofia?error=notfound');
        }
        
        res.render('admin/filosofia/form', {
            title: 'Editar Artigo de Filosofia - Z3Z Admin',
            layout: 'admin/layout',
            currentPage: 'filosofia',
            admin: req.session.admin,
            artigo: artigo,
            action: 'editar'
        });
    } catch (error) {
        console.error('Erro ao carregar artigo de filosofia:', error);
        res.redirect('/admin/filosofia?error=load');
    }
});

// Atualizar artigo de filosofia
router.post('/filosofia/:id/editar', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, content, tags, published } = req.body;
        const filosofia = await readDataFile('filosofia.json');
        
        const index = filosofia.findIndex(a => a.id === id);
        if (index === -1) {
            return res.redirect('/admin/filosofia?error=notfound');
        }
        
        filosofia[index] = {
            ...filosofia[index],
            title: title.trim(),
            content: content.split('\n').map(line => line.trim()).filter(line => line),
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            published: published === 'on',
            updated_at: new Date().toISOString()
        };
        
        if (await writeDataFile('filosofia.json', filosofia)) {
            res.redirect('/admin/filosofia?success=updated');
        } else {
            throw new Error('Erro ao salvar arquivo');
        }
    } catch (error) {
        console.error('Erro ao atualizar artigo de filosofia:', error);
        res.redirect('/admin/filosofia?error=update');
    }
});

// Excluir artigo de filosofia
router.post('/filosofia/:id/excluir', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const filosofia = await readDataFile('filosofia.json');
        
        const filteredFilosofia = filosofia.filter(a => a.id !== id);
        
        if (filteredFilosofia.length === filosofia.length) {
            return res.redirect('/admin/filosofia?error=notfound');
        }
        
        if (await writeDataFile('filosofia.json', filteredFilosofia)) {
            res.redirect('/admin/filosofia?success=deleted');
        } else {
            throw new Error('Erro ao salvar arquivo');
        }
    } catch (error) {
        console.error('Erro ao excluir artigo de filosofia:', error);
        res.redirect('/admin/filosofia?error=delete');
    }
});

// ========== ROTAS CRUD PARA RELIGIÃO ==========

// Novo artigo de religião
router.get('/religiao/novo', requireAuth, (req, res) => {
    res.render('admin/religiao/form', {
        title: 'Novo Artigo de Religião - Z3Z Admin',
        layout: 'admin/layout',
        currentPage: 'religiao',
        admin: req.session.admin,
        artigo: null,
        action: 'criar'
    });
});

// Salvar novo artigo de religião
router.post('/religiao/novo', requireAuth, async (req, res) => {
    try {
        const { title, content, tags, published } = req.body;
        const religiao = await readDataFile('religiao.json');
        
        const newArtigo = {
            id: religiao.length > 0 ? Math.max(...religiao.map(a => a.id)) + 1 : 1,
            title: title.trim(),
            content: content.split('\n').map(line => line.trim()).filter(line => line),
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            published: published === 'on',
            date: new Date().toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            created_at: new Date().toISOString(),
            author: 'Equipe Z3Z'
        };
        
        religiao.push(newArtigo);
        
        if (await writeDataFile('religiao.json', religiao)) {
            res.redirect('/admin/religiao?success=created');
        } else {
            throw new Error('Erro ao salvar arquivo');
        }
    } catch (error) {
        console.error('Erro ao criar artigo de religião:', error);
        res.redirect('/admin/religiao?error=create');
    }
});

// Editar artigo de religião
router.get('/religiao/:id/editar', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const religiao = await readDataFile('religiao.json');
        const artigo = religiao.find(a => a.id === id);
        
        if (!artigo) {
            return res.redirect('/admin/religiao?error=notfound');
        }
        
        res.render('admin/religiao/form', {
            title: 'Editar Artigo de Religião - Z3Z Admin',
            layout: 'admin/layout',
            currentPage: 'religiao',
            admin: req.session.admin,
            artigo: artigo,
            action: 'editar'
        });
    } catch (error) {
        console.error('Erro ao carregar artigo de religião:', error);
        res.redirect('/admin/religiao?error=load');
    }
});

// Atualizar artigo de religião
router.post('/religiao/:id/editar', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, content, tags, published } = req.body;
        const religiao = await readDataFile('religiao.json');
        
        const index = religiao.findIndex(a => a.id === id);
        if (index === -1) {
            return res.redirect('/admin/religiao?error=notfound');
        }
        
        religiao[index] = {
            ...religiao[index],
            title: title.trim(),
            content: content.split('\n').map(line => line.trim()).filter(line => line),
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            published: published === 'on',
            updated_at: new Date().toISOString()
        };
        
        if (await writeDataFile('religiao.json', religiao)) {
            res.redirect('/admin/religiao?success=updated');
        } else {
            throw new Error('Erro ao salvar arquivo');
        }
    } catch (error) {
        console.error('Erro ao atualizar artigo de religião:', error);
        res.redirect('/admin/religiao?error=update');
    }
});

// Excluir artigo de religião
router.post('/religiao/:id/excluir', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const religiao = await readDataFile('religiao.json');
        
        const filteredReligiao = religiao.filter(a => a.id !== id);
        
        if (filteredReligiao.length === religiao.length) {
            return res.redirect('/admin/religiao?error=notfound');
        }
        
        if (await writeDataFile('religiao.json', filteredReligiao)) {
            res.redirect('/admin/religiao?success=deleted');
        } else {
            throw new Error('Erro ao salvar arquivo');
        }
    } catch (error) {
        console.error('Erro ao excluir artigo de religião:', error);
        res.redirect('/admin/religiao?error=delete');
    }
});

// Redirecionar para dashboard se acessar /admin
router.get('/', requireAuth, (req, res) => {
    res.redirect('/admin/dashboard');
});

module.exports = router;