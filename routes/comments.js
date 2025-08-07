const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Função para carregar comentários
function loadComments() {
    const commentsPath = path.join(__dirname, '../data/comments.json');
    try {
        if (fs.existsSync(commentsPath)) {
            const data = fs.readFileSync(commentsPath, 'utf8');
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        return {};
    }
}

// Função para salvar comentários
function saveComments(comments) {
    const commentsPath = path.join(__dirname, '../data/comments.json');
    try {
        fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2));
        return true;
    } catch (error) {
        console.error('Erro ao salvar comentários:', error);
        return false;
    }
}

// Função para validar dados do comentário
function validateComment(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Email deve ser válido');
    }
    
    if (!data.comment || data.comment.trim().length < 5) {
        errors.push('Comentário deve ter pelo menos 5 caracteres');
    }
    
    if (!data.postId || !data.category) {
        errors.push('Informações do post são obrigatórias');
    }
    
    return errors;
}

// Rota para buscar comentários de um post
router.get('/:category/:postId', (req, res) => {
    const { category, postId } = req.params;
    const comments = loadComments();
    const postComments = comments[`${category}_${postId}`] || [];
    
    res.json({
        success: true,
        comments: postComments
    });
});

// Rota para adicionar comentário
router.post('/add', (req, res) => {
    const { name, email, comment, postId, category } = req.body;
    
    // Validar dados
    const errors = validateComment(req.body);
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors
        });
    }
    
    // Carregar comentários existentes
    const comments = loadComments();
    const postKey = `${category}_${postId}`;
    
    if (!comments[postKey]) {
        comments[postKey] = [];
    }
    
    // Criar novo comentário
    const newComment = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        email: email.trim(),
        comment: comment.trim(),
        date: new Date().toISOString(),
        approved: true, // Por enquanto aprovamos automaticamente
        ip: req.ip || req.connection.remoteAddress
    };
    
    // Adicionar comentário
    comments[postKey].push(newComment);
    
    // Salvar
    if (saveComments(comments)) {
        res.json({
            success: true,
            message: 'Comentário adicionado com sucesso!',
            comment: {
                id: newComment.id,
                name: newComment.name,
                comment: newComment.comment,
                date: newComment.date
            }
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Erro ao salvar comentário'
        });
    }
});

// Rota para deletar comentário (admin)
router.delete('/:commentId', (req, res) => {
    // Verificar se é admin (simplificado)
    if (!req.session.adminLoggedIn) {
        return res.status(401).json({
            success: false,
            message: 'Não autorizado'
        });
    }
    
    const { commentId } = req.params;
    const comments = loadComments();
    let commentFound = false;
    
    // Procurar e remover o comentário
    Object.keys(comments).forEach(postKey => {
        comments[postKey] = comments[postKey].filter(comment => {
            if (comment.id === commentId) {
                commentFound = true;
                return false;
            }
            return true;
        });
    });
    
    if (commentFound && saveComments(comments)) {
        res.json({
            success: true,
            message: 'Comentário removido com sucesso!'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Comentário não encontrado'
        });
    }
});

// Rota para obter estatísticas de comentários (admin)
router.get('/admin/stats', (req, res) => {
    if (!req.session.adminLoggedIn) {
        return res.status(401).json({
            success: false,
            message: 'Não autorizado'
        });
    }
    
    const comments = loadComments();
    let totalComments = 0;
    let commentsByPost = {};
    
    Object.keys(comments).forEach(postKey => {
        const postComments = comments[postKey].length;
        totalComments += postComments;
        commentsByPost[postKey] = postComments;
    });
    
    res.json({
        success: true,
        stats: {
            total: totalComments,
            byPost: commentsByPost,
            recent: Object.values(comments)
                .flat()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10)
        }
    });
});

module.exports = router;