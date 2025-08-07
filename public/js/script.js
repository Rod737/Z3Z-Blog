// Navegação e controle de elementos
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos DOM
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const poemCards = document.querySelectorAll('.poem-card');

    // Menu hamburger para mobile
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Fechar menu ao clicar fora
    if (hamburger && navMenu) {
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    }

    // Sistema de filtros para poemas
    function filterPoems(category) {
        poemCards.forEach(card => {
            if (category === 'todos' || card.getAttribute('data-category') === category) {
                card.classList.remove('hidden');
                // Animação de entrada
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            } else {
                card.classList.add('hidden');
            }
        });
    }

    // Event listeners para filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover classe active de todos os botões
            filterBtns.forEach(button => button.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Filtrar poemas
            const filter = this.getAttribute('data-filter');
            filterPoems(filter);
        });
    });

    // Smooth scrolling para âncoras
    function smoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Animação de entrada para cards
    function animateCards() {
        const cards = document.querySelectorAll('.post-card, .poem-card, .philosophy-card, .religion-card');
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });
    }

    // Efeito parallax suave para o hero
    function parallaxEffect() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            if (scrolled < hero.offsetHeight) {
                hero.style.transform = `translateY(${rate}px)`;
            }
        });
    }

    // Sistema de navegação por teclado (desabilitado para navegação por páginas)
    function keyboardNavigation() {
        // Função desabilitada para permitir navegação normal entre páginas
        console.log('Navegação por teclado desabilitada para navegação por páginas');
    }

    // Busca em tempo real (para implementação futura)
    function setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const searchTerm = this.value.toLowerCase().trim();
            
            searchTimeout = setTimeout(() => {
                if (searchTerm === '') {
                    // Mostrar todos os cards
                    document.querySelectorAll('.post-card, .poem-card, .philosophy-card, .religion-card').forEach(card => {
                        card.style.display = 'block';
                    });
                    return;
                }
                
                // Buscar em títulos e conteúdo
                document.querySelectorAll('.post-card, .poem-card, .philosophy-card, .religion-card').forEach(card => {
                    const title = card.querySelector('.post-title, .poem-title, .article-title')?.textContent.toLowerCase() || '';
                    const content = card.querySelector('.post-excerpt, .poem-content, .article-content')?.textContent.toLowerCase() || '';
                    
                    if (title.includes(searchTerm) || content.includes(searchTerm)) {
                        card.style.display = 'block';
                        // Destacar termo encontrado
                        highlightSearchTerm(card, searchTerm);
                    } else {
                        card.style.display = 'none';
                    }
                });
            }, 300);
        });
    }

    // Destacar termo de busca
    function highlightSearchTerm(element, term) {
        // Implementação simples de highlight
        const textElements = element.querySelectorAll('h3, h4, p');
        textElements.forEach(el => {
            const text = el.textContent;
            const highlightedText = text.replace(new RegExp(term, 'gi'), `<mark>$&</mark>`);
            if (highlightedText !== text) {
                el.innerHTML = highlightedText;
            }
        });
    }

    // Modo escuro (para implementação futura)
    function setupDarkMode() {
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (!darkModeToggle) return;
        
        // Verificar preferência salva
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
        
        darkModeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', this.checked);
        });
    }

    // Sistema de comentários simples (localStorage)
    function setupComments() {
        const commentForms = document.querySelectorAll('.comment-form');
        
        commentForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const postId = this.getAttribute('data-post-id');
                const nameInput = this.querySelector('input[name="name"]');
                const commentInput = this.querySelector('textarea[name="comment"]');
                
                if (!nameInput.value.trim() || !commentInput.value.trim()) {
                    alert('Por favor, preencha todos os campos.');
                    return;
                }
                
                const comment = {
                    id: Date.now(),
                    name: nameInput.value.trim(),
                    text: commentInput.value.trim(),
                    date: new Date().toLocaleDateString('pt-BR')
                };
                
                // Salvar no localStorage
                let comments = JSON.parse(localStorage.getItem(`comments_${postId}`)) || [];
                comments.push(comment);
                localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));
                
                // Limpar formulário
                nameInput.value = '';
                commentInput.value = '';
                
                // Recarregar comentários
                loadComments(postId);
                
                alert('Comentário adicionado com sucesso!');
            });
        });
    }

    function loadComments(postId) {
        const commentsList = document.querySelector(`[data-comments="${postId}"]`);
        if (!commentsList) return;
        
        const comments = JSON.parse(localStorage.getItem(`comments_${postId}`)) || [];
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <strong>${comment.name}</strong>
                    <span class="comment-date">${comment.date}</span>
                </div>
                <p class="comment-text">${comment.text}</p>
            </div>
        `).join('');
    }

    // Compartilhamento social
    function setupSocialShare() {
        const shareButtons = document.querySelectorAll('.share-btn');
        
        shareButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const platform = this.getAttribute('data-platform');
                const url = encodeURIComponent(window.location.href);
                const title = encodeURIComponent(document.title);
                
                let shareUrl = '';
                
                switch(platform) {
                    case 'facebook':
                        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                        break;
                    case 'twitter':
                        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                        break;
                    case 'whatsapp':
                        shareUrl = `https://wa.me/?text=${title}%20${url}`;
                        break;
                    case 'email':
                        shareUrl = `mailto:?subject=${title}&body=${url}`;
                        break;
                }
                
                if (shareUrl) {
                    window.open(shareUrl, '_blank', 'width=600,height=400');
                }
            });
        });
    }

    // Inicializar todas as funcionalidades
    smoothScroll();
    animateCards();
    parallaxEffect();
    keyboardNavigation();
    setupSearch();
    setupDarkMode();
    setupComments();
    setupSocialShare();
    
    // Sistema de comentários premium
    setupCommentsSystem();

    // Preloader (se existir)
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        window.addEventListener('load', function() {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        });
    }

    // Performance: lazy loading de imagens
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Acessibilidade: navegação por tab
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });

    // Sistema YouTube Widget Premium
    setupYouTubeWidget();
    
    console.log('Blog Z3Z carregado com sucesso! ✨');
});

// Funções do Widget YouTube
function setupYouTubeWidget() {
    const youtubeFloating = document.getElementById('youtubeFloating');
    
    // Mostrar card flutuante após 30 segundos, apenas uma vez por sessão
    if (!localStorage.getItem('youtubeCardShown')) {
        setTimeout(() => {
            youtubeFloating.classList.add('active');
            
            // Marcar como mostrado
            localStorage.setItem('youtubeCardShown', 'true');
            
            // Auto-hide após 15 segundos
            setTimeout(() => {
                youtubeFloating.classList.remove('active');
            }, 15000);
        }, 30000);
    }
    
    // Analytics simples
    trackYouTubeClicks();
}

function closeYouTubeCard() {
    const youtubeFloating = document.getElementById('youtubeFloating');
    youtubeFloating.classList.remove('active');
    
    // Não mostrar novamente nesta sessão
    localStorage.setItem('youtubeCardClosed', 'true');
}

function trackYouTubeClicks() {
    const youtubeLinks = document.querySelectorAll('a[href*="youtube.com/@OsEscolhidosDivinos"]');
    
    youtubeLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Analytics simples no console
            console.log('🎥 Click no canal YouTube: Os Escolhidos Divinos');
            
            // Salvar estatística local
            let clicks = parseInt(localStorage.getItem('youtubeClicks') || '0');
            clicks++;
            localStorage.setItem('youtubeClicks', clicks.toString());
        });
    });
}

// ====== SISTEMA DE COMENTÁRIOS PREMIUM ======

function setupCommentsSystem() {
    const commentForm = document.getElementById('commentForm');
    if (!commentForm) return;
    
    const postId = commentForm.getAttribute('data-post-id');
    const category = commentForm.getAttribute('data-category');
    
    // Carregar comentários existentes
    loadComments(category, postId);
    
    // Configurar formulário
    commentForm.addEventListener('submit', handleCommentSubmit);
    
    console.log('💭 Sistema de comentários carregado com sucesso!');
}

async function loadComments(category, postId) {
    const commentsLoading = document.getElementById('commentsLoading');
    const commentsList = document.getElementById('commentsList');
    const commentsCount = document.getElementById('commentsCount');
    const commentsEmpty = document.getElementById('commentsEmpty');
    
    // Mostrar loading
    commentsLoading.style.display = 'block';
    commentsEmpty.style.display = 'none';
    
    try {
        const response = await fetch(`/comments/${category}/${postId}`);
        const data = await response.json();
        
        if (data.success) {
            const comments = data.comments;
            
            // Atualizar contador
            const countNumber = commentsCount.querySelector('.count-number');
            countNumber.textContent = comments.length;
            
            if (comments.length === 0) {
                commentsEmpty.style.display = 'block';
                commentsList.innerHTML = '';
            } else {
                commentsEmpty.style.display = 'none';
                renderComments(comments);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        commentsEmpty.style.display = 'block';
    } finally {
        commentsLoading.style.display = 'none';
    }
}

function renderComments(comments) {
    const commentsList = document.getElementById('commentsList');
    
    // Ordenar comentários por data (mais recente primeiro)
    const sortedComments = comments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    commentsList.innerHTML = sortedComments.map(comment => {
        const date = new Date(comment.date);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const avatar = comment.name.charAt(0).toUpperCase();
        
        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="comment-avatar">${avatar}</div>
                        <div class="comment-author-info">
                            <h4>${escapeHtml(comment.name)}</h4>
                        </div>
                    </div>
                    <div class="comment-date">${formattedDate}</div>
                </div>
                <div class="comment-content">
                    ${escapeHtml(comment.comment).replace(/\n/g, '<br>')}
                </div>
                <div class="comment-actions">
                    <button class="comment-action-btn" onclick="likeComment('${comment.id}')">
                        👍 Curtir
                    </button>
                    <button class="comment-action-btn" onclick="reportComment('${comment.id}')">
                        🚩 Reportar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function handleCommentSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('.comment-form-submit');
    const submitText = submitButton.querySelector('.comment-submit-text');
    const originalText = submitText.textContent;
    
    // Desabilitar botão durante envio
    submitButton.disabled = true;
    submitText.textContent = 'Enviando...';
    
    const formData = new FormData(form);
    const postId = form.getAttribute('data-post-id');
    const category = form.getAttribute('data-category');
    
    const commentData = {
        name: formData.get('name'),
        email: formData.get('email'),
        comment: formData.get('comment'),
        postId: postId,
        category: category
    };
    
    try {
        const response = await fetch('/comments/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commentData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Limpar formulário
            form.reset();
            
            // Recarregar comentários
            loadComments(category, postId);
            
            // Mostrar sucesso
            showNotification('Comentário adicionado com sucesso! 🎉', 'success');
            
            // Rolar para a seção de comentários
            document.getElementById('comments').scrollIntoView({ behavior: 'smooth' });
            
        } else {
            showNotification(result.message || 'Erro ao enviar comentário', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar comentário:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    } finally {
        // Restaurar botão
        submitButton.disabled = false;
        submitText.textContent = originalText;
    }
}

function likeComment(commentId) {
    // Implementação simples de curtir (localStorage)
    let likes = JSON.parse(localStorage.getItem('commentLikes') || '{}');
    
    if (likes[commentId]) {
        delete likes[commentId];
        showNotification('Curtida removida', 'info');
    } else {
        likes[commentId] = true;
        showNotification('Comentário curtido! 👍', 'success');
    }
    
    localStorage.setItem('commentLikes', JSON.stringify(likes));
}

function reportComment(commentId) {
    const reason = prompt('Por que você está reportando este comentário?\n\n1. Conteúdo inadequado\n2. Spam\n3. Discurso de ódio\n4. Outros\n\nDigite o número da opção:');
    
    if (reason && ['1', '2', '3', '4'].includes(reason)) {
        // Salvar report localmente (em um sistema real seria enviado ao servidor)
        let reports = JSON.parse(localStorage.getItem('commentReports') || '{}');
        reports[commentId] = {
            reason: reason,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('commentReports', JSON.stringify(reports));
        
        showNotification('Comentário reportado. Obrigado por ajudar a manter a comunidade segura.', 'success');
    }
}

function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `comment-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Adicionar estilos inline para a notificação
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        zIndex: '10000',
        minWidth: '300px',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease',
        backgroundColor: type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1',
        color: type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460',
        border: `1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'}`
    });
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 4 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}