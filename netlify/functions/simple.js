const serverless = require("serverless-http");
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de sessão para admin
app.use(session({
    secret: 'z3z-blog-secret-key-netlify-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Arquivos estáticos serão servidos diretamente pelo Netlify via publish directory

// Template HTML base
const getBaseHTML = (title, content, currentPage = '') => {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="Explore a profundidade da alma humana através de poemas, reflexões filosóficas e insights religiosos no Blog Z3Z.">
    <link rel="stylesheet" href="/css/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;600;700&family=Roboto+Slab:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="nav-container">
                <div class="logo">
                    <img src="/images/image.png" alt="Z3Z Blog Logo" class="logo-img">
                    <h1 class="logo-text z3z-logo z3z-text">Z<span class="z3z-number">3</span>Z</h1>
                </div>
                <ul class="nav-menu">
                    <li class="nav-item">
                        <a href="/" class="nav-link ${currentPage === 'home' ? 'active' : ''}">Início</a>
                    </li>
                    <li class="nav-item">
                        <a href="/poemas" class="nav-link ${currentPage === 'poemas' ? 'active' : ''}">Poemas</a>
                    </li>
                    <li class="nav-item">
                        <a href="/filosofia" class="nav-link ${currentPage === 'filosofia' ? 'active' : ''}">Filosofia</a>
                    </li>
                    <li class="nav-item">
                        <a href="/religiao" class="nav-link ${currentPage === 'religiao' ? 'active' : ''}">Religião</a>
                    </li>
                    <li class="nav-item">
                        <a href="/sobre" class="nav-link ${currentPage === 'sobre' ? 'active' : ''}">Sobre</a>
                    </li>
                </ul>
                <div class="hamburger">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    </header>

    <main class="main">
        ${content}
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Z3Z Blog</h4>
                    <p>Um espaço sagrado para a alma</p>
                </div>
                
                <div class="footer-section">
                    <h4>Categorias</h4>
                    <ul>
                        <li><a href="/poemas">Poemas</a></li>
                        <li><a href="/filosofia">Filosofia</a></li>
                        <li><a href="/religiao">Religião</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>Contato</h4>
                    <p>Compartilhe suas reflexões conosco</p>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2025 Z3Z Blog. Todos os direitos reservados.</p>
            </div>
        </div>
    </footer>

    <!-- Widget YouTube Premium -->
    <div class="youtube-widget">
        <a href="https://www.youtube.com/@OsEscolhidosDivinos" target="_blank" class="youtube-button">
            <i data-lucide="youtube" class="youtube-icon" style="width: 20px; height: 20px;"></i>
            <span class="youtube-text">YouTube</span>
        </a>
        <div class="youtube-tooltip">
            <h4>Os Escolhidos Divinos</h4>
            <p>Descubra conteúdos espirituais profundos em nosso canal do YouTube. Inscreva-se para receber as últimas reflexões!</p>
        </div>
    </div>

    <script src="/js/script.js"></script>
    <script>
        // Inicializar ícones Lucide
        lucide.createIcons();
    </script>
</body>
</html>`;
};

// Dados de exemplo
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

// Dados de admin (senha: admin123)
const adminData = {
  username: 'admin',
  password: '$2a$10$8K1p/a0dClOVRnH6n0B3/.Cq8RqzUQf8nUV4D1OEZhV6j8B3/.Co.' // bcrypt hash of 'admin123'
};

// Middleware de autenticação
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  } else {
    return res.redirect('/admin/login');
  }
};

// Template HTML para admin
const getAdminHTML = (title, content, currentPage = '') => {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/css/admin-premium.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;600;700&family=Roboto+Slab:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
</head>
<body>
    <div class="admin-container">
        <nav class="admin-sidebar">
            <div class="admin-logo">
                <img src="/images/image.png" alt="Z3Z Logo" class="admin-logo-img">
                <h2 class="z3z-logo z3z-text">Z<span class="z3z-number">3</span>Z</h2>
                <span class="admin-subtitle">Painel Admin</span>
            </div>
            
            <ul class="admin-nav">
                <li><a href="/admin" class="admin-nav-link ${currentPage === 'dashboard' ? 'active' : ''}">
                    <i data-lucide="layout-dashboard" style="width: 20px; height: 20px;"></i>
                    Dashboard
                </a></li>
                <li><a href="/admin/poemas" class="admin-nav-link ${currentPage === 'poemas' ? 'active' : ''}">
                    <i data-lucide="feather" style="width: 20px; height: 20px;"></i>
                    Poemas
                </a></li>
                <li><a href="/admin/filosofia" class="admin-nav-link ${currentPage === 'filosofia' ? 'active' : ''}">
                    <i data-lucide="brain" style="width: 20px; height: 20px;"></i>
                    Filosofia
                </a></li>
                <li><a href="/admin/religiao" class="admin-nav-link ${currentPage === 'religiao' ? 'active' : ''}">
                    <i data-lucide="cross" style="width: 20px; height: 20px;"></i>
                    Religião
                </a></li>
                <li><a href="/admin/logout" class="admin-nav-link">
                    <i data-lucide="log-out" style="width: 20px; height: 20px;"></i>
                    Sair
                </a></li>
            </ul>
        </nav>
        
        <main class="admin-main">
            <header class="admin-header">
                <h1 class="admin-page-title">${title}</h1>
            </header>
            
            <div class="admin-content">
                ${content}
            </div>
        </main>
    </div>
    
    <script src="/js/admin.js"></script>
    <script>
        // Inicializar ícones Lucide
        lucide.createIcons();
    </script>
</body>
</html>`;
};

// Rota principal
app.get('/', (req, res) => {
  const content = `
    <!-- Banner de Boas-vindas -->
    <div class="welcome-banner">
        <div class="container">
            <h2 class="welcome-text z3z-text">Bem-vindos ao Z<span class="z3z-number">3</span>Z</h2>
            <p class="welcome-subtitle">Um espaço sagrado para a alma, onde poesia, filosofia e espiritualidade se encontram</p>
        </div>
    </div>

    <!-- Seção Hero -->
    <div class="hero">
        <div class="hero-content">
            <div class="hero-quote">
                <blockquote>"A verdadeira sabedoria está em reconhecer a própria ignorância."</blockquote>
                <cite>— Sócrates</cite>
            </div>
        </div>
    </div>

    <!-- Posts em Destaque -->
    <div class="featured-posts">
        <div class="container">
            <h3 class="section-title">Destaques Recentes</h3>
            <div class="posts-grid">
                <article class="post-card">
                    <div class="post-category poemas">Poemas</div>
                    <h4 class="post-title">${sampleData.poemas[0].title}</h4>
                    <p class="post-excerpt">${sampleData.poemas[0].content[0].substring(0, 100)}...</p>
                    <div class="post-meta">
                        <span class="post-date">${sampleData.poemas[0].date}</span>
                    </div>
                    <a href="/poemas/${sampleData.poemas[0].id}" class="read-more">Ler mais</a>
                </article>
                
                <article class="post-card">
                    <div class="post-category filosofia">Filosofia</div>
                    <h4 class="post-title">${sampleData.filosofia[0].title}</h4>
                    <p class="post-excerpt">${sampleData.filosofia[0].content[0].substring(0, 100)}...</p>
                    <div class="post-meta">
                        <span class="post-date">${sampleData.filosofia[0].date}</span>
                    </div>
                    <a href="/filosofia/${sampleData.filosofia[0].id}" class="read-more">Ler mais</a>
                </article>
                
                <article class="post-card">
                    <div class="post-category religiao">Religião</div>
                    <h4 class="post-title">${sampleData.religiao[0].title}</h4>
                    <p class="post-excerpt">${sampleData.religiao[0].content[0].substring(0, 100)}...</p>
                    <div class="post-meta">
                        <span class="post-date">${sampleData.religiao[0].date}</span>
                    </div>
                    <a href="/religiao/${sampleData.religiao[0].id}" class="read-more">Ler mais</a>
                </article>
            </div>
        </div>
    </div>

    <!-- Seção YouTube Premium -->
    <div class="youtube-section">
        <div class="container">
            <div class="youtube-content">
                <div class="youtube-info">
                    <h3 class="youtube-section-title">
                        <i data-lucide="video" style="width: 28px; height: 28px; margin-right: 12px; color: var(--primary-gold); vertical-align: middle;"></i>
                        Os Escolhidos Divinos
                    </h3>
                    <p class="youtube-description">
                        Mergulhe em reflexões profundas sobre espiritualidade, filosofia e religião em nosso canal do YouTube. 
                        Conteúdo exclusivo que complementa as leituras deste blog.
                    </p>
                    <div class="youtube-features">
                        <div class="feature-item">
                            <i data-lucide="book-open" class="feature-icon" style="width: 24px; height: 24px; color: var(--primary-gold);"></i>
                            <span>Análises profundas de textos sagrados</span>
                        </div>
                        <div class="feature-item">
                            <i data-lucide="heart" class="feature-icon" style="width: 24px; height: 24px; color: var(--primary-gold);"></i>
                            <span>Meditações e práticas espirituais</span>
                        </div>
                        <div class="feature-item">
                            <i data-lucide="lightbulb" class="feature-icon" style="width: 24px; height: 24px; color: var(--primary-gold);"></i>
                            <span>Reflexões filosóficas contemporâneas</span>
                        </div>
                    </div>
                    <a href="https://www.youtube.com/@OsEscolhidosDivinos" target="_blank" class="youtube-main-btn">
                        <i data-lucide="play-circle" class="youtube-btn-icon" style="width: 20px; height: 20px; margin-right: 8px;"></i>
                        <span>Visitar Canal</span>
                    </a>
                </div>
                <div class="youtube-visual">
                    <div class="youtube-placeholder">
                        <div class="play-button">
                            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                                <circle cx="30" cy="30" r="30" fill="#FF0000"/>
                                <polygon points="23,18 23,42 40,30" fill="white"/>
                            </svg>
                        </div>
                        <div class="video-title">Os Escolhidos Divinos</div>
                        <div class="video-subtitle">Canal Oficial no YouTube</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `;

  const html = getBaseHTML('Z3Z Blog - Um espaço sagrado para a alma', content, 'home');
  res.send(html);
});

// Páginas simples
app.get('/poemas', (req, res) => {
  const content = `
    <div class="container">
        <h1>Poemas</h1>
        <div class="posts-grid">
            ${sampleData.poemas.map(poema => `
                <article class="post-card">
                    <div class="post-category poemas">Poema</div>
                    <h4 class="post-title">${poema.title}</h4>
                    <p class="post-excerpt">${poema.content[0].substring(0, 100)}...</p>
                    <div class="post-meta">
                        <span class="post-date">${poema.date}</span>
                    </div>
                    <a href="/poemas/${poema.id}" class="read-more">Ler mais</a>
                </article>
            `).join('')}
        </div>
    </div>
  `;
  
  const html = getBaseHTML('Poemas - Z3Z Blog', content, 'poemas');
  res.send(html);
});

app.get('/filosofia', (req, res) => {
  const content = `
    <div class="container">
        <h1>Filosofia</h1>
        <div class="posts-grid">
            ${sampleData.filosofia.map(artigo => `
                <article class="post-card">
                    <div class="post-category filosofia">Filosofia</div>
                    <h4 class="post-title">${artigo.title}</h4>
                    <p class="post-excerpt">${artigo.content[0].substring(0, 100)}...</p>
                    <div class="post-meta">
                        <span class="post-date">${artigo.date}</span>
                    </div>
                    <a href="/filosofia/${artigo.id}" class="read-more">Ler mais</a>
                </article>
            `).join('')}
        </div>
    </div>
  `;
  
  const html = getBaseHTML('Filosofia - Z3Z Blog', content, 'filosofia');
  res.send(html);
});

app.get('/religiao', (req, res) => {
  const content = `
    <div class="container">
        <h1>Religião</h1>
        <div class="posts-grid">
            ${sampleData.religiao.map(artigo => `
                <article class="post-card">
                    <div class="post-category religiao">Religião</div>
                    <h4 class="post-title">${artigo.title}</h4>
                    <p class="post-excerpt">${artigo.content[0].substring(0, 100)}...</p>
                    <div class="post-meta">
                        <span class="post-date">${artigo.date}</span>
                    </div>
                    <a href="/religiao/${artigo.id}" class="read-more">Ler mais</a>
                </article>
            `).join('')}
        </div>
    </div>
  `;
  
  const html = getBaseHTML('Religião - Z3Z Blog', content, 'religiao');
  res.send(html);
});

app.get('/sobre', (req, res) => {
  const content = `
    <div class="container">
        <h1>Sobre o Z3Z Blog</h1>
        <div class="about-content">
            <p>O Z3Z Blog é um espaço sagrado dedicado à exploração da alma humana através da poesia, filosofia e espiritualidade.</p>
            <p>Aqui você encontrará reflexões profundas que nutrem a alma e expandem a consciência.</p>
        </div>
    </div>
  `;
  
  const html = getBaseHTML('Sobre - Z3Z Blog', content, 'sobre');
  res.send(html);
});

// Artigo individual
app.get('/poemas/:id', (req, res) => {
  const poema = sampleData.poemas.find(p => p.id === parseInt(req.params.id));
  if (!poema) {
    return res.status(404).send('Poema não encontrado');
  }

  const content = `
    <div class="container">
        <article class="single-content">
            <header class="single-header">
                <h1 class="single-title">${poema.title}</h1>
                <div class="single-meta">
                    <span class="single-category poemas">Poema</span>
                    <span class="single-date">${poema.date}</span>
                </div>
            </header>
            <div class="single-body poem-content-full">
                ${poema.content.map(line => line ? `${line}<br>` : '<br><br>').join('')}
            </div>
            <div class="single-navigation">
                <a href="/poemas" class="back-link">← Voltar aos Poemas</a>
            </div>
        </article>
    </div>
  `;

  const html = getBaseHTML(`${poema.title} - Z3Z Blog`, content, 'poemas');
  res.send(html);
});

// Outros artigos individuais similares...
app.get('/filosofia/:id', (req, res) => {
  const artigo = sampleData.filosofia.find(a => a.id === parseInt(req.params.id));
  if (!artigo) {
    return res.status(404).send('Artigo não encontrado');
  }

  const content = `
    <div class="container">
        <article class="single-content">
            <header class="single-header">
                <h1 class="single-title">${artigo.title}</h1>
                <div class="single-meta">
                    <span class="single-category filosofia">Filosofia</span>
                    <span class="single-date">${artigo.date}</span>
                </div>
            </header>
            <div class="single-body">
                ${artigo.content.map(p => `<p>${p}</p>`).join('')}
            </div>
            <div class="single-navigation">
                <a href="/filosofia" class="back-link">← Voltar à Filosofia</a>
            </div>
        </article>
    </div>
  `;

  const html = getBaseHTML(`${artigo.title} - Z3Z Blog`, content, 'filosofia');
  res.send(html);
});

app.get('/religiao/:id', (req, res) => {
  const artigo = sampleData.religiao.find(a => a.id === parseInt(req.params.id));
  if (!artigo) {
    return res.status(404).send('Artigo não encontrado');
  }

  const content = `
    <div class="container">
        <article class="single-content">
            <header class="single-header">
                <h1 class="single-title">${artigo.title}</h1>
                <div class="single-meta">
                    <span class="single-category religiao">Religião</span>
                    <span class="single-date">${artigo.date}</span>
                </div>
            </header>
            <div class="single-body">
                ${artigo.content.map(p => `<p>${p}</p>`).join('')}
            </div>
            <div class="single-navigation">
                <a href="/religiao" class="back-link">← Voltar à Religião</a>
            </div>
        </article>
    </div>
  `;

  const html = getBaseHTML(`${artigo.title} - Z3Z Blog`, content, 'religiao');
  res.send(html);
});

// ===== ROTAS ADMINISTRATIVAS =====

// Login admin
app.get('/admin/login', (req, res) => {
  const content = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - Z3Z Admin</title>
        <link rel="stylesheet" href="/css/admin-premium.css">
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    </head>
    <body>
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                    <img src="/images/image.png" alt="Z3Z Logo" class="login-logo">
                    <h1 class="login-title">Z<span class="z3z-number">3</span>Z Admin</h1>
                    <p class="login-subtitle">Sistema de Gestão</p>
                </div>
                
                <form method="POST" action="/admin/login" class="login-form">
                    <div class="form-group">
                        <label for="username" class="form-label">
                            <i data-lucide="user" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                            Usuário
                        </label>
                        <div style="position: relative;">
                            <i data-lucide="user" class="form-icon" style="width: 20px; height: 20px;"></i>
                            <input type="text" id="username" name="username" class="form-input" 
                                   placeholder="Digite seu usuário" required autofocus>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password" class="form-label">
                            <i data-lucide="lock" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                            Senha
                        </label>
                        <div style="position: relative;">
                            <i data-lucide="lock" class="form-icon" style="width: 20px; height: 20px;"></i>
                            <input type="password" id="password" name="password" class="form-input" 
                                   placeholder="Digite sua senha" required>
                        </div>
                    </div>

                    <button type="submit" class="login-button">
                        <i data-lucide="log-in" style="width: 20px; height: 20px; margin-right: 10px;"></i>
                        Entrar no Sistema
                    </button>
                </form>

                <div class="login-footer">
                    <a href="/" class="back-link">
                        <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
                        Voltar ao Site
                    </a>
                </div>
            </div>
        </div>
        
        <script>
            lucide.createIcons();
        </script>
    </body>
    </html>
  `;
  
  res.send(content);
});

// POST login admin
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === adminData.username && await bcrypt.compare(password, adminData.password)) {
    req.session.admin = true;
    res.redirect('/admin');
  } else {
    res.redirect('/admin/login?error=1');
  }
});

// Dashboard admin
app.get('/admin', isAuthenticated, (req, res) => {
  const content = `
    <div class="admin-stats-grid">
        <div class="admin-stat-card">
            <div class="stat-icon">
                <i data-lucide="feather" style="width: 40px; height: 40px; color: var(--admin-accent);"></i>
            </div>
            <div class="stat-content">
                <h3>${sampleData.poemas.length}</h3>
                <p>Poemas</p>
            </div>
        </div>
        
        <div class="admin-stat-card">
            <div class="stat-icon">
                <i data-lucide="brain" style="width: 40px; height: 40px; color: var(--admin-accent);"></i>
            </div>
            <div class="stat-content">
                <h3>${sampleData.filosofia.length}</h3>
                <p>Filosofia</p>
            </div>
        </div>
        
        <div class="admin-stat-card">
            <div class="stat-icon">
                <i data-lucide="cross" style="width: 40px; height: 40px; color: var(--admin-accent);"></i>
            </div>
            <div class="stat-content">
                <h3>${sampleData.religiao.length}</h3>
                <p>Religião</p>
            </div>
        </div>
        
        <div class="admin-stat-card">
            <div class="stat-icon">
                <i data-lucide="eye" style="width: 40px; height: 40px; color: var(--admin-accent);"></i>
            </div>
            <div class="stat-content">
                <h3>∞</h3>
                <p>Visualizações</p>
            </div>
        </div>
    </div>

    <div class="admin-quick-actions">
        <h2>Ações Rápidas</h2>
        <div class="quick-actions-grid">
            <a href="/admin/poemas/novo" class="quick-action-btn">
                <i data-lucide="plus" style="width: 24px; height: 24px;"></i>
                Novo Poema
            </a>
            <a href="/admin/filosofia/novo" class="quick-action-btn">
                <i data-lucide="plus" style="width: 24px; height: 24px;"></i>
                Nova Filosofia
            </a>
            <a href="/admin/religiao/novo" class="quick-action-btn">
                <i data-lucide="plus" style="width: 24px; height: 24px;"></i>
                Nova Religião
            </a>
            <a href="/" target="_blank" class="quick-action-btn">
                <i data-lucide="external-link" style="width: 24px; height: 24px;"></i>
                Ver Site
            </a>
        </div>
    </div>
  `;
  
  const html = getAdminHTML('Dashboard - Z3Z Admin', content, 'dashboard');
  res.send(html);
});

// Listas admin
app.get('/admin/poemas', isAuthenticated, (req, res) => {
  const content = `
    <div class="admin-header-actions">
        <a href="/admin/poemas/novo" class="admin-btn admin-btn-primary">
            <i data-lucide="plus" style="width: 16px; height: 16px; margin-right: 8px;"></i>
            Novo Poema
        </a>
    </div>
    
    <div class="admin-table">
        <table>
            <thead>
                <tr>
                    <th>Título</th>
                    <th>Categoria</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${sampleData.poemas.map(poema => `
                    <tr>
                        <td><strong>${poema.title}</strong></td>
                        <td><span class="admin-category ${poema.category}">${poema.category}</span></td>
                        <td>${poema.date}</td>
                        <td><span class="admin-status ${poema.published ? 'published' : 'draft'}">${poema.published ? 'Publicado' : 'Rascunho'}</span></td>
                        <td>
                            <a href="/poemas/${poema.id}" class="admin-btn admin-btn-small" target="_blank">
                                <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                                Ver
                            </a>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
  
  const html = getAdminHTML('Poemas - Z3Z Admin', content, 'poemas');
  res.send(html);
});

app.get('/admin/filosofia', isAuthenticated, (req, res) => {
  const content = `
    <div class="admin-header-actions">
        <a href="/admin/filosofia/novo" class="admin-btn admin-btn-primary">
            <i data-lucide="plus" style="width: 16px; height: 16px; margin-right: 8px;"></i>
            Nova Reflexão
        </a>
    </div>
    
    <div class="admin-table">
        <table>
            <thead>
                <tr>
                    <th>Título</th>
                    <th>Categoria</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${sampleData.filosofia.map(artigo => `
                    <tr>
                        <td><strong>${artigo.title}</strong></td>
                        <td><span class="admin-category ${artigo.category}">${artigo.category}</span></td>
                        <td>${artigo.date}</td>
                        <td><span class="admin-status ${artigo.published ? 'published' : 'draft'}">${artigo.published ? 'Publicado' : 'Rascunho'}</span></td>
                        <td>
                            <a href="/filosofia/${artigo.id}" class="admin-btn admin-btn-small" target="_blank">
                                <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                                Ver
                            </a>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
  
  const html = getAdminHTML('Filosofia - Z3Z Admin', content, 'filosofia');
  res.send(html);
});

app.get('/admin/religiao', isAuthenticated, (req, res) => {
  const content = `
    <div class="admin-header-actions">
        <a href="/admin/religiao/novo" class="admin-btn admin-btn-primary">
            <i data-lucide="plus" style="width: 16px; height: 16px; margin-right: 8px;"></i>
            Novo Artigo
        </a>
    </div>
    
    <div class="admin-table">
        <table>
            <thead>
                <tr>
                    <th>Título</th>
                    <th>Categoria</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${sampleData.religiao.map(artigo => `
                    <tr>
                        <td><strong>${artigo.title}</strong></td>
                        <td><span class="admin-category ${artigo.category}">${artigo.category}</span></td>
                        <td>${artigo.date}</td>
                        <td><span class="admin-status ${artigo.published ? 'published' : 'draft'}">${artigo.published ? 'Publicado' : 'Rascunho'}</span></td>
                        <td>
                            <a href="/religiao/${artigo.id}" class="admin-btn admin-btn-small" target="_blank">
                                <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                                Ver
                            </a>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
  
  const html = getAdminHTML('Religião - Z3Z Admin', content, 'religiao');
  res.send(html);
});

// Logout admin
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// 404
app.use((req, res) => {
  const content = `
    <div class="container">
        <div style="text-align: center; padding: 60px 0;">
            <h1>404 - Página não encontrada</h1>
            <p>A página que você procura não existe.</p>
            <a href="/" style="color: var(--primary-red);">Voltar ao início</a>
        </div>
    </div>
  `;
  
  const html = getBaseHTML('Página não encontrada - Z3Z Blog', content);
  res.status(404).send(html);
});

// Exportar como função serverless
module.exports.handler = serverless(app);