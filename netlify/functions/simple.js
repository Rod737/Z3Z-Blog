const serverless = require("serverless-http");
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fs = require('fs');
// const multer = require('multer');
// const cloudinary = require('cloudinary').v2;

const app = express();

// Configurações de upload removidas - agora usando URL direta

// Função para formatar texto com melhor estrutura
function formatarTexto(texto, tipo = 'paragrafo') {
  if (!texto || texto.trim() === '') return [];
  
  if (tipo === 'poema') {
    // Para poemas: preserva quebras de linha e estrutura de estrofes
    return texto.split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha !== '' || texto.includes('\n\n')); // Preserva linhas vazias se houver quebras duplas
  } else {
    // Para artigos: cria parágrafos bem estruturados
    let paragrafos;
    
    // Se tem quebras duplas, usa como separador de parágrafos
    if (texto.includes('\n\n')) {
      paragrafos = texto.split('\n\n')
        .map(p => p.trim())
        .filter(p => p !== '')
        .map(p => {
          // Remove quebras de linha extras dentro do parágrafo, mas mantém estrutura
          return p.replace(/\n+/g, ' ').trim();
        });
    } else {
      // Se não tem quebras duplas, tenta quebrar por frases ou por linha
      paragrafos = texto.split(/\n/)
        .map(p => p.trim())
        .filter(p => p !== '')
        .reduce((acc, linha) => {
          // Se a linha é muito curta, junta com a anterior
          if (acc.length > 0 && linha.length < 100 && !linha.match(/[.!?]$/)) {
            acc[acc.length - 1] += ' ' + linha;
          } else {
            acc.push(linha);
          }
          return acc;
        }, []);
    }
    
    return paragrafos.length > 0 ? paragrafos : [texto.trim()];
  }
}

// Função para capitalizar primeira letra das frases
function capitalizarFrases(texto) {
  return texto.replace(/(^|[.!?]\s+)([a-z])/g, function(match, p1, p2) {
    return p1 + p2.toUpperCase();
  });
}

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Favicon será servido como arquivo estático pelo Netlify

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
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/favicon.ico">
    <meta name="msapplication-TileImage" content="/favicon.ico">
    <link rel="stylesheet" href="/css/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;600;700&family=Roboto+Slab:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        /* Suporte para textos longos e quebra de palavras */
        .post-content, .poem-content, .article-content {
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            line-height: 1.9;
            white-space: pre-wrap;
            font-size: 1.1rem;
            text-align: justify;
            text-justify: inter-word;
        }
        
        /* Parágrafos bem estruturados */
        .post-content p, .poem-content p, .article-content p {
            margin-bottom: 2em;
            margin-top: 1em;
            max-width: 100%;
            overflow-wrap: break-word;
            text-indent: 1.5em;
            orphans: 2;
            widows: 2;
            display: block;
        }
        
        /* Primeiro parágrafo sem identação */
        .post-content p:first-child, 
        .article-content p:first-child {
            text-indent: 0;
            font-weight: 500;
            margin-top: 0;
        }
        
        /* Poemas com formatação especial */
        .poem-content {
            text-align: left;
            text-indent: 0;
            font-style: italic;
            padding: 2em 1em;
            background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
            border-left: 4px solid rgba(183, 28, 28, 0.3);
            border-radius: 0 8px 8px 0;
            margin: 1.5em 0;
        }
        
        .poem-content p {
            text-indent: 0;
            margin-bottom: 0.8em;
        }
        
        /* Estrofes de poemas */
        .poem-content br + br {
            margin-bottom: 1.5em;
            display: block;
        }
        
        /* Artigos com melhor estrutura */
        .article-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 2em 1.5em;
        }
        
        .article-content h1, 
        .article-content h2, 
        .article-content h3 {
            color: #B71C1C;
            margin: 2em 0 1em 0;
            font-family: 'Oswald', sans-serif;
            font-weight: 600;
            line-height: 1.3;
        }
        
        /* Citações */
        .article-content blockquote,
        .post-content blockquote {
            border-left: 4px solid #FFB300;
            padding-left: 1.5em;
            margin: 2em 0;
            font-style: italic;
            color: #666;
            background: rgba(255, 179, 0, 0.05);
            border-radius: 0 8px 8px 0;
            padding: 1em 1.5em;
        }
        
        /* Listas melhoradas */
        .post-content ul, 
        .article-content ul,
        .post-content ol, 
        .article-content ol {
            margin: 1.5em 0;
            padding-left: 2em;
        }
        
        .post-content li, 
        .article-content li {
            margin-bottom: 0.5em;
            line-height: 1.7;
        }
        
        /* Texto pré-formatado */
        .post-content pre, .poem-content pre, .article-content pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            font-family: inherit;
            background: rgba(0,0,0,0.05);
            padding: 1em;
            border-radius: 6px;
            margin: 1.5em 0;
            border-left: 3px solid #1A237E;
        }
        
        /* Cards de posts nas páginas de listagem */
        .post-excerpt {
            line-height: 1.6;
            color: #666;
            margin: 15px 0;
            font-size: 0.95rem;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            max-height: 4.8em; /* 3 linhas × 1.6 line-height */
        }
        
        .post-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #333;
            margin: 10px 0;
            line-height: 1.4;
        }
        
        .post-card {
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            border-radius: 12px;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            background: white;
            margin-bottom: 30px;
        }
        
        .post-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        /* Responsividade para móveis */
        @media (max-width: 768px) {
            .post-content, .poem-content, .article-content {
                font-size: 1rem;
                line-height: 1.8;
                padding: 1em 0.5em;
            }
            
            .post-content p, .article-content p {
                text-indent: 1em;
                margin-bottom: 1.8em;
                margin-top: 0.8em;
            }
            
            .article-content {
                padding: 1em;
                max-width: 100%;
            }
            
            .post-content p:first-child, 
            .article-content p:first-child {
                margin-top: 0;
            }
            
            .post-excerpt {
                font-size: 0.9rem;
                -webkit-line-clamp: 4;
                max-height: 5.6em; /* 4 linhas em mobile */
            }
            
            .post-title {
                font-size: 1.2rem;
            }
        }
    </style>
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
      author: "Admin",
      image: null,
      excerpt: "No silêncio profundo da noite escura..."
    }
  ],
  filosofia: [
    {
      id: 1,
      title: "A Natureza do Tempo",
      content: ["Reflexões sobre a percepção humana do tempo e sua influência na construção do sentido da vida. O tempo é uma das dimensões mais misteriosas da existência humana.", "Como medimos algo que não podemos tocar? Como compreendemos a passagem de momentos que já não existem mais? Estas questões nos levam ao cerne da filosofia temporal.", "O tempo subjetivo difere drasticamente do tempo objetivo. Enquanto o relógio marca minutos uniformes, nossa experiência temporal varia conforme nosso estado emocional e mental."],
      category: "existencial", 
      tags: ["tempo", "existência", "filosofia"],
      published: true,
      date: "2025-01-03",
      author: "Admin",
      image: "https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      excerpt: "Reflexões sobre a percepção humana do tempo e sua influência na construção do sentido da vida. O tempo é uma das dimensões mais misteriosas da existência humana."
    },
    {
      id: 2,
      title: "Anti-Cosmo",
      content: ["Caos Inclusivo: O Riso da Desordem e o Exílio do Logos Em uma era onde o Logos se traveste de luz, onde a ordem se impõe como axioma inquestionável, é preciso retornar ao ventre primordial de todas as coisas: o Caos. Não o caos como ruína ou desgoverno, mas o Caos como gênese absoluta, como potência de tudo o que é e do que jamais será. O Caos, neste sentido, não é o outro da ordem. Ele é", "sua matriz. É a sombra onde a forma se gesta. A filosofia Anti-Cosmo propõe uma ontologia reversa: não do Ser ao Nada, mas do Nada ao Tudo. E esse Tudo se chama Caos. O Caos não seleciona. Não hierarquiza. Ele inclui. Inclui os deuses e os demônios, os santos e os estupradores, os poetas e os assassinos, o orgasmo e o câncer. Tudo o que foi, é ou será, nasce do seio escuro e", "pulsante do Caos. É por isso que dizemos: o Caos é inclusivo. A Ordem é excludente. A Ordem precisa preservar sua forma, impor sua pureza, proteger sua identidade. Já o Caos ri de tudo isso. Ele sabe que a perfeição só se revela diante da imperfeição, que o prazer só tem sabor porque há a dor. A luz só brilha porque há noite. A forma só se destaca porque há fundo. Quando se erige um deus — qualquer deus — se constrói também um sistema."],
      category: "metafísica",
      tags: ["caos", "ordem", "ontologia"],
      published: true,
      date: "2023-08-07",
      author: "Admin", 
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      excerpt: "Caos Inclusivo: O Riso da Desordem e o Exílio do Logos. Em uma era onde o Logos se traveste de luz, é preciso retornar ao ventre primordial de todas as coisas: o Caos."
    }
  ],
  religiao: [
    {
      id: 1,
      title: "Fé e Razão: Um Diálogo",
      content: ["Explorando a harmonia entre a fé religiosa e o pensamento racional na busca pela verdade. Esta questão tem ocupado teólogos e filósofos ao longo dos séculos.", "A fé não se opõe necessariamente à razão, mas pode complementá-la. Santo Tomás de Aquino demonstrou que a razão pode nos levar até certos limites do conhecimento divino, onde a fé toma o relevo.", "Este diálogo contínuo entre fé e razão enriquece tanto a experiência religiosa quanto a investigação filosófica, criando pontes entre o transcendente e o imanente."],
      category: "teologia",
      tags: ["fé", "razão", "diálogo"],
      published: true,
      date: "2025-01-01",
      author: "Admin",
      image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      excerpt: "Explorando a harmonia entre a fé religiosa e o pensamento racional na busca pela verdade..."
    }
  ]
};

// Dados de admin (email: pizzollo13@gmail.com / senha: cubo444)
const adminData = {
  username: 'pizzollo13@gmail.com',
  password: '$2b$10$EkDgevUjVA3XdQ3c0bP5CO4L8fthKCNciKuI.jASDJsXl5bZgRHGu' // bcryptjs hash of 'cubo444'
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
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/favicon.ico">
    <meta name="msapplication-TileImage" content="/favicon.ico">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;600;700&family=Roboto+Slab:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
        --admin-primary: #1A237E;
        --admin-secondary: #B71C1C;
        --admin-accent: #FFB300;
        --admin-dark: #0D1421;
        --admin-light: #FEFEFE;
        --admin-gray-100: #F5F5F5;
        --admin-gray-800: #424242;
        --admin-gradient-secondary: linear-gradient(135deg, #B71C1C 0%, #D32F2F 100%);
        --font-primary: 'Oswald', sans-serif;
        --font-secondary: 'Roboto Slab', serif;
    }
    body {
        font-family: var(--font-secondary);
        background: linear-gradient(135deg, #0D1421 0%, #1A237E 100%);
        color: #333;
        min-height: 100vh;
    }
    .admin-container {
        display: flex;
        min-height: 100vh;
    }
    .admin-sidebar {
        width: 280px;
        background: rgba(26, 35, 126, 0.95);
        backdrop-filter: blur(20px);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        padding: 30px 20px;
        position: fixed;
        height: 100vh;
        overflow-y: auto;
    }
    .admin-logo {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 30px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .admin-logo-img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        margin-bottom: 15px;
        box-shadow: 0 0 20px rgba(255, 179, 0, 0.4);
    }
    .z3z-logo {
        font-family: var(--font-primary);
        font-size: 1.8rem;
        font-weight: 700;
        color: white;
        letter-spacing: 2px;
        margin-bottom: 5px;
    }
    .z3z-number {
        color: var(--admin-accent);
        text-shadow: 0 0 15px rgba(255, 179, 0, 0.6);
    }
    .admin-subtitle {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .admin-nav {
        list-style: none;
    }
    .admin-nav li {
        margin-bottom: 8px;
    }
    .admin-nav-link {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        border-radius: 12px;
        transition: all 0.3s ease;
        font-weight: 500;
        gap: 12px;
    }
    .admin-nav-link:hover,
    .admin-nav-link.active {
        background: rgba(255, 179, 0, 0.15);
        color: var(--admin-accent);
        transform: translateX(5px);
    }
    .admin-main {
        flex: 1;
        margin-left: 280px;
        padding: 0;
    }
    .admin-header {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        padding: 20px 40px;
    }
    .admin-page-title {
        font-family: var(--font-primary);
        font-size: 2rem;
        color: var(--admin-primary);
        font-weight: 600;
    }
    .admin-content {
        padding: 40px;
        background: var(--admin-gray-100);
        min-height: calc(100vh - 80px);
    }
    .admin-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 25px;
        margin-bottom: 40px;
    }
    .admin-stat-card {
        background: white;
        border-radius: 16px;
        padding: 30px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 20px;
        transition: transform 0.3s ease;
    }
    .admin-stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }
    .stat-icon {
        background: linear-gradient(135deg, var(--admin-accent) 0%, #FFC107 100%);
        border-radius: 12px;
        padding: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .stat-content h3 {
        font-size: 2rem;
        font-weight: 700;
        color: var(--admin-primary);
        margin-bottom: 5px;
    }
    .stat-content p {
        color: #666;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 0.9rem;
    }
    .admin-quick-actions {
        background: white;
        border-radius: 16px;
        padding: 30px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .admin-quick-actions h2 {
        font-family: var(--font-primary);
        color: var(--admin-primary);
        margin-bottom: 25px;
        font-size: 1.5rem;
    }
    .quick-actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    }
    .quick-action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 15px 20px;
        background: linear-gradient(135deg, var(--admin-primary) 0%, #3F51B5 100%);
        color: white;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
        text-align: center;
    }
    .quick-action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(26, 35, 126, 0.3);
    }
    .admin-header-actions {
        margin-bottom: 30px;
    }
    .admin-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
        border: none;
        cursor: pointer;
    }
    .admin-btn-primary {
        background: var(--admin-accent);
        color: var(--admin-dark);
    }
    .admin-btn-primary:hover {
        background: #FFC107;
        transform: translateY(-1px);
    }
    .admin-btn-small {
        padding: 8px 16px;
        font-size: 0.85rem;
    }
    .admin-table {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .admin-table table {
        width: 100%;
        border-collapse: collapse;
    }
    .admin-table th {
        background: var(--admin-primary);
        color: white;
        padding: 18px;
        text-align: left;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 0.85rem;
    }
    .admin-table td {
        padding: 18px;
        border-bottom: 1px solid #eee;
        vertical-align: middle;
    }
    .admin-table tr:hover {
        background: rgba(255, 179, 0, 0.05);
    }
    .admin-category {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .admin-category.existencial {
        background: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
    }
    .admin-category.teologia {
        background: rgba(156, 39, 176, 0.1);
        color: #9C27B0;
    }
    .admin-status {
        display: inline-block;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    .admin-status.published {
        background: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
    }
    .admin-status.draft {
        background: rgba(255, 152, 0, 0.1);
        color: #FF9800;
    }
    
    /* Estilos para formulários */
    .admin-form-group {
        margin-bottom: 25px;
    }
    .admin-form-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: var(--admin-primary);
        font-family: var(--font-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 0.9rem;
    }
    .admin-form-input,
    .admin-form-textarea,
    .admin-form-select {
        width: 100%;
        padding: 15px 20px;
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        color: #333;
        font-size: 1rem;
        font-family: var(--font-body);
        transition: all 0.3s ease;
    }
    .admin-form-input:focus,
    .admin-form-textarea:focus,
    .admin-form-select:focus {
        outline: none;
        border-color: var(--admin-accent);
        box-shadow: 0 0 0 3px rgba(255, 179, 0, 0.1);
        transform: translateY(-1px);
    }
    .admin-form-textarea {
        min-height: 300px;
        max-height: 600px;
        resize: vertical;
        line-height: 1.8;
        font-family: 'Roboto Slab', serif;
        font-size: 1.1rem;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: pre-wrap;
    }
    .admin-btn-secondary {
        background: rgba(108, 117, 125, 0.1);
        color: #6c757d;
        border: 1px solid #dee2e6;
    }
    .admin-btn-secondary:hover {
        background: #6c757d;
        color: white;
        transform: translateY(-1px);
    }
    </style>
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
        
        // Funções de exclusão com confirmação
        async function excluirPoema(id, title) {
            if (confirm(\`Tem certeza que deseja excluir o poema "\${title}"?\n\nEsta ação não pode ser desfeita.\`)) {
                try {
                    const response = await fetch(\`/admin/poemas/\${id}\`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Poema excluído com sucesso!');
                        location.reload();
                    } else {
                        alert('Erro ao excluir poema: ' + (result.message || 'Erro desconhecido'));
                    }
                } catch (error) {
                    console.error('Erro ao excluir poema:', error);
                    alert('Erro de conexão. Tente novamente.');
                }
            }
        }
        
        async function excluirFilosofia(id, title) {
            if (confirm(\`Tem certeza que deseja excluir o artigo "\${title}"?\n\nEsta ação não pode ser desfeita.\`)) {
                try {
                    const response = await fetch(\`/admin/filosofia/\${id}\`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Artigo excluído com sucesso!');
                        location.reload();
                    } else {
                        alert('Erro ao excluir artigo: ' + (result.message || 'Erro desconhecido'));
                    }
                } catch (error) {
                    console.error('Erro ao excluir artigo:', error);
                    alert('Erro de conexão. Tente novamente.');
                }
            }
        }
        
        async function excluirReligiao(id, title) {
            if (confirm(\`Tem certeza que deseja excluir o artigo "\${title}"?\n\nEsta ação não pode ser desfeita.\`)) {
                try {
                    const response = await fetch(\`/admin/religiao/\${id}\`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Artigo excluído com sucesso!');
                        location.reload();
                    } else {
                        alert('Erro ao excluir artigo: ' + (result.message || 'Erro desconhecido'));
                    }
                } catch (error) {
                    console.error('Erro ao excluir artigo:', error);
                    alert('Erro de conexão. Tente novamente.');
                }
            }
        }
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
                    ${poema.image ? `<div class="post-image">
                        <img src="${poema.image}" alt="${poema.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">
                    </div>` : ''}
                    <div class="post-content" style="padding: ${poema.image ? '20px' : '20px 20px 0'};">
                        <div class="post-category poemas">Poema</div>
                        <h4 class="post-title">${poema.title}</h4>
                        <p class="post-excerpt">${poema.content[0].substring(0, 100)}...</p>
                        <div class="post-meta">
                            <span class="post-date">${poema.date}</span>
                        </div>
                        <a href="/poemas/${poema.id}" class="read-more">Ler mais</a>
                    </div>
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
                    ${artigo.image ? `<div class="post-image">
                        <img src="${artigo.image}" alt="${artigo.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">
                    </div>` : ''}
                    <div class="post-content" style="padding: ${artigo.image ? '20px' : '20px 20px 0'};">
                        <div class="post-category filosofia">Filosofia</div>
                        <h4 class="post-title">${artigo.title}</h4>
                        <p class="post-excerpt">${artigo.excerpt}</p>
                        <div class="post-meta">
                            <span class="post-date">${artigo.date}</span>
                        </div>
                        <a href="/filosofia/${artigo.id}" class="read-more">Ler mais</a>
                    </div>
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
                    ${artigo.image ? `<div class="post-image">
                        <img src="${artigo.image}" alt="${artigo.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">
                    </div>` : ''}
                    <div class="post-content" style="padding: ${artigo.image ? '20px' : '20px 20px 0'};">
                        <div class="post-category religiao">Religião</div>
                        <h4 class="post-title">${artigo.title}</h4>
                        <p class="post-excerpt">${artigo.excerpt}</p>
                        <div class="post-meta">
                            <span class="post-date">${artigo.date}</span>
                        </div>
                        <a href="/religiao/${artigo.id}" class="read-more">Ler mais</a>
                    </div>
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
            ${poema.image ? `<div class="single-image" style="text-align: center; margin: 30px 0;">
                <img src="${poema.image}" alt="${poema.title}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            </div>` : ''}
            <div class="single-body poem-content">
                ${poema.content.map(line => line ? `<p>${line}</p>` : '<br>').join('')}
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
            ${artigo.image ? `<div class="single-image" style="text-align: center; margin: 30px 0;">
                <img src="${artigo.image}" alt="${artigo.title}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            </div>` : ''}
            <div class="single-body article-content">
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
            ${artigo.image ? `<div class="single-image" style="text-align: center; margin: 30px 0;">
                <img src="${artigo.image}" alt="${artigo.title}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            </div>` : ''}
            <div class="single-body article-content">
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
        
        <!-- Favicon -->
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="/favicon.ico">
        <meta name="msapplication-TileImage" content="/favicon.ico">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;600;700&family=Roboto+Slab:wght@400;600;700&display=swap" rel="stylesheet">
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
        <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-red: #B71C1C;
            --primary-gold: #FFB300;
            --navy-blue: #1A237E;
            --dark-navy: #0D1421;
            --white: #FFFFFF;
            --light-gray: #F8F9FA;
            --medium-gray: #6C757D;
            --dark-gray: #343A40;
            
            --gradient-primary: linear-gradient(135deg, #1A237E 0%, #3F51B5 50%, #5C6BC0 100%);
            --gradient-secondary: linear-gradient(135deg, #B71C1C 0%, #D32F2F 50%, #F44336 100%);
            --gradient-accent: linear-gradient(135deg, #FFB300 0%, #FFC107 50%, #FFD54F 100%);
            --gradient-dark: linear-gradient(135deg, #0D1421 0%, #1A237E 100%);
            
            --shadow-xl: 0 20px 60px rgba(13, 20, 33, 0.3);
            --shadow-glow: 0 0 40px rgba(255, 179, 0, 0.4);
            
            --font-primary: 'Oswald', sans-serif;
            --font-secondary: 'Roboto Slab', serif;
            --font-body: 'Libre Baskerville', serif;
        }

        body {
            font-family: var(--font-body);
            background: var(--gradient-dark);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }

        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 25% 25%, rgba(255, 179, 0, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(183, 28, 28, 0.10) 0%, transparent 50%),
                linear-gradient(135deg, rgba(26, 35, 126, 0.9) 0%, rgba(183, 28, 28, 0.6) 100%);
            animation: backgroundShift 15s ease-in-out infinite alternate;
        }

        @keyframes backgroundShift {
            0% {
                background: 
                    radial-gradient(circle at 25% 25%, rgba(255, 179, 0, 0.15) 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, rgba(183, 28, 28, 0.10) 0%, transparent 50%),
                    linear-gradient(135deg, rgba(26, 35, 126, 0.9) 0%, rgba(183, 28, 28, 0.6) 100%);
            }
            100% {
                background: 
                    radial-gradient(circle at 75% 25%, rgba(255, 179, 0, 0.20) 0%, transparent 50%),
                    radial-gradient(circle at 25% 75%, rgba(183, 28, 28, 0.15) 0%, transparent 50%),
                    linear-gradient(135deg, rgba(183, 28, 28, 0.7) 0%, rgba(26, 35, 126, 0.8) 100%);
            }
        }

        .login-container {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 480px;
            padding: 20px;
        }

        .login-card {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: var(--shadow-xl);
            padding: 60px 50px;
            position: relative;
            overflow: hidden;
            animation: cardFloat 6s ease-in-out infinite alternate;
        }

        @keyframes cardFloat {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-10px); }
        }

        .login-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient-accent);
            border-radius: 24px 24px 0 0;
        }

        .login-header {
            text-align: center;
            margin-bottom: 50px;
            position: relative;
        }

        .login-logo {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            margin: 0 auto 30px;
            box-shadow: var(--shadow-glow);
            transition: transform 0.3s ease;
            animation: logoGlow 4s ease-in-out infinite alternate;
        }

        @keyframes logoGlow {
            0% { box-shadow: 0 0 30px rgba(255, 179, 0, 0.3); }
            100% { box-shadow: 0 0 50px rgba(255, 179, 0, 0.6); }
        }

        .login-logo:hover {
            transform: scale(1.05) rotate(5deg);
        }

        .login-title {
            font-family: var(--font-primary);
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--white);
            margin-bottom: 10px;
            letter-spacing: 2px;
            text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .z3z-number {
            color: var(--primary-gold);
            text-shadow: 0 0 20px rgba(255, 179, 0, 0.6);
            display: inline-block;
            animation: numberPulse 3s ease-in-out infinite;
        }

        @keyframes numberPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .login-subtitle {
            color: rgba(255, 255, 255, 0.7);
            font-size: 1.1rem;
            font-weight: 300;
            margin-bottom: 10px;
        }

        .login-form {
            space-y: 30px;
        }

        .form-group {
            margin-bottom: 30px;
            position: relative;
        }

        .form-label {
            display: block;
            margin-bottom: 12px;
            font-weight: 600;
            color: var(--white);
            font-family: var(--font-secondary);
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-input {
            width: 100%;
            padding: 18px 24px;
            padding-left: 60px;
            background: rgba(255, 255, 255, 0.08);
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            color: var(--white);
            font-size: 1.1rem;
            font-family: var(--font-body);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
        }

        .form-input:focus {
            outline: none;
            border-color: var(--primary-gold);
            background: rgba(255, 255, 255, 0.12);
            box-shadow: 0 0 0 4px rgba(255, 179, 0, 0.2);
            transform: translateY(-2px);
        }

        .form-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        .form-icon {
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.6);
        }

        .login-button {
            width: 100%;
            padding: 18px 32px;
            background: var(--gradient-accent);
            color: var(--dark-navy);
            border: none;
            border-radius: 16px;
            font-size: 1.1rem;
            font-weight: 700;
            font-family: var(--font-secondary);
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 25px rgba(255, 179, 0, 0.3);
            position: relative;
            overflow: hidden;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 30px;
        }

        .login-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.5s ease;
        }

        .login-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(255, 179, 0, 0.4);
            background: var(--white);
            color: var(--navy-blue);
        }

        .login-button:hover::before {
            left: 100%;
        }

        .login-button:active {
            transform: translateY(-1px);
        }

        .login-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .back-link {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .back-link:hover {
            color: var(--primary-gold);
            transform: translateX(-3px);
        }

        @media (max-width: 768px) {
            .login-card {
                padding: 40px 30px;
            }
            
            .login-title {
                font-size: 2rem;
            }
            
            .form-input {
                padding-left: 50px;
            }
        }
        </style>
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
                            <i data-lucide="mail" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                            Email
                        </label>
                        <div style="position: relative;">
                            <i data-lucide="mail" class="form-icon" style="width: 20px; height: 20px;"></i>
                            <input type="email" id="username" name="username" class="form-input" 
                                   placeholder="Digite seu email" required autofocus>
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
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === adminData.username && bcrypt.compareSync(password, adminData.password)) {
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
                            <a href="/poemas/${poema.id}" class="admin-btn admin-btn-small" target="_blank" style="margin-right: 8px;">
                                <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                                Ver
                            </a>
                            <a href="/admin/poemas/editar/${poema.id}" class="admin-btn admin-btn-small" style="background: var(--admin-accent); color: white; margin-right: 8px;">
                                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                                Editar
                            </a>
                            <button onclick="excluirPoema(${poema.id}, '${poema.title}')" class="admin-btn admin-btn-small" style="background: var(--admin-gradient-secondary); color: white; border: none;">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                Excluir
                            </button>
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
                            <a href="/filosofia/${artigo.id}" class="admin-btn admin-btn-small" target="_blank" style="margin-right: 8px;">
                                <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                                Ver
                            </a>
                            <a href="/admin/filosofia/editar/${artigo.id}" class="admin-btn admin-btn-small" style="background: var(--admin-accent); color: white; margin-right: 8px;">
                                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                                Editar
                            </a>
                            <button onclick="excluirFilosofia(${artigo.id}, '${artigo.title}')" class="admin-btn admin-btn-small" style="background: var(--admin-gradient-secondary); color: white; border: none;">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                Excluir
                            </button>
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
                            <a href="/religiao/${artigo.id}" class="admin-btn admin-btn-small" target="_blank" style="margin-right: 8px;">
                                <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                                Ver
                            </a>
                            <a href="/admin/religiao/editar/${artigo.id}" class="admin-btn admin-btn-small" style="background: var(--admin-accent); color: white; margin-right: 8px;">
                                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                                Editar
                            </a>
                            <button onclick="excluirReligiao(${artigo.id}, '${artigo.title}')" class="admin-btn admin-btn-small" style="background: var(--admin-gradient-secondary); color: white; border: none;">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                Excluir
                            </button>
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

// Rotas para criar novos artigos
app.get('/admin/poemas/novo', isAuthenticated, (req, res) => {
  const content = `
    <div class="admin-header-actions">
        <a href="/admin/poemas" class="admin-btn admin-btn-secondary">
            <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
            Voltar
        </a>
    </div>
    
    <div class="admin-card">
        <div class="admin-card-header">
            <h2 class="admin-card-title">
                <i data-lucide="feather" style="width: 24px; height: 24px; margin-right: 12px; vertical-align: middle;"></i>
                Novo Poema
            </h2>
            <p class="admin-card-subtitle">Crie um novo poema para inspirar as almas</p>
        </div>
        
        <div class="admin-card-body">
            <form method="POST" action="/admin/poemas/novo" class="admin-form">
                <div class="admin-form-group">
                    <label for="title" class="admin-form-label">Título do Poema</label>
                    <input type="text" id="title" name="title" class="admin-form-input" 
                           placeholder="Digite o título do poema" required>
                </div>
                
                <div class="admin-form-group">
                    <label for="image" class="admin-form-label">
                        <i data-lucide="image" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                        Imagem do Poema (Opcional)
                    </label>
                    <input type="url" id="image" name="image" class="admin-form-input" 
                           placeholder="https://exemplo.com/imagem.jpg" style="padding: 15px;">
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        🔗 Cole a URL da imagem. Formatos suportados: JPG, PNG, GIF, WEBP
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="content" class="admin-form-label">Conteúdo</label>
                    <textarea id="content" name="content" class="admin-form-textarea" 
                              placeholder="Digite o poema (uma estrofe por linha, linha vazia para separar estrofes)" 
                              rows="20" spellcheck="true" lang="pt-BR" required></textarea>
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        💡 <strong>Dicas de formatação:</strong><br>
                        • Use uma linha para cada verso<br>
                        • Deixe linhas vazias para separar estrofes<br>
                        • O sistema corrige automaticamente maiúsculas e minúsculas<br>
                        • Verificação ortográfica está ativada
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="date" class="admin-form-label">Data de Publicação</label>
                    <input type="date" id="date" name="date" class="admin-form-input" 
                           value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <button type="submit" class="admin-btn admin-btn-primary" style="width: 100%; padding: 18px;">
                    <i data-lucide="save" style="width: 20px; height: 20px; margin-right: 10px;"></i>
                    Publicar Poema
                </button>
            </form>
        </div>
    </div>
  `;
  
  const html = getAdminHTML('Novo Poema - Z3Z Admin', content, 'poemas');
  res.send(html);
});

app.get('/admin/filosofia/novo', isAuthenticated, (req, res) => {
  const content = `
    <div class="admin-header-actions">
        <a href="/admin/filosofia" class="admin-btn admin-btn-secondary">
            <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
            Voltar
        </a>
    </div>
    
    <div class="admin-card">
        <div class="admin-card-header">
            <h2 class="admin-card-title">
                <i data-lucide="brain" style="width: 24px; height: 24px; margin-right: 12px; vertical-align: middle;"></i>
                Novo Artigo de Filosofia
            </h2>
            <p class="admin-card-subtitle">Compartilhe reflexões profundas sobre a existência</p>
        </div>
        
        <div class="admin-card-body">
            <form method="POST" action="/admin/filosofia/novo" class="admin-form">
                <div class="admin-form-group">
                    <label for="title" class="admin-form-label">Título do Artigo</label>
                    <input type="text" id="title" name="title" class="admin-form-input" 
                           placeholder="Digite o título do artigo" required>
                </div>
                
                <div class="admin-form-group">
                    <label for="image" class="admin-form-label">
                        <i data-lucide="image" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                        Imagem do Artigo (Opcional)
                    </label>
                    <input type="url" id="image" name="image" class="admin-form-input" 
                           placeholder="https://exemplo.com/imagem.jpg" style="padding: 15px;">
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        🔗 Cole a URL da imagem. Formatos suportados: JPG, PNG, GIF, WEBP
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="category" class="admin-form-label">Categoria</label>
                    <select id="category" name="category" class="admin-form-select" required>
                        <option value="">Selecione uma categoria</option>
                        <option value="existencial">Existencial</option>
                        <option value="epistemologia">Epistemologia</option>
                        <option value="etica">Ética</option>
                        <option value="metafisica">Metafísica</option>
                        <option value="logica">Lógica</option>
                    </select>
                </div>
                
                <div class="admin-form-group">
                    <label for="content" class="admin-form-label">Conteúdo</label>
                    <textarea id="content" name="content" class="admin-form-textarea" 
                              placeholder="Digite o conteúdo do artigo (um parágrafo por linha)" 
                              rows="25" spellcheck="true" lang="pt-BR" required></textarea>
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        Cada linha será um parágrafo separado
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="date" class="admin-form-label">Data de Publicação</label>
                    <input type="date" id="date" name="date" class="admin-form-input" 
                           value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <button type="submit" class="admin-btn admin-btn-primary" style="width: 100%; padding: 18px;">
                    <i data-lucide="save" style="width: 20px; height: 20px; margin-right: 10px;"></i>
                    Publicar Artigo
                </button>
            </form>
        </div>
    </div>
  `;
  
  const html = getAdminHTML('Novo Artigo de Filosofia - Z3Z Admin', content, 'filosofia');
  res.send(html);
});

app.get('/admin/religiao/novo', isAuthenticated, (req, res) => {
  const content = `
    <div class="admin-header-actions">
        <a href="/admin/religiao" class="admin-btn admin-btn-secondary">
            <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
            Voltar
        </a>
    </div>
    
    <div class="admin-card">
        <div class="admin-card-header">
            <h2 class="admin-card-title">
                <i data-lucide="cross" style="width: 24px; height: 24px; margin-right: 12px; vertical-align: middle;"></i>
                Novo Artigo de Religião
            </h2>
            <p class="admin-card-subtitle">Compartilhe ensinamentos espirituais e reflexões sagradas</p>
        </div>
        
        <div class="admin-card-body">
            <form method="POST" action="/admin/religiao/novo" class="admin-form">
                <div class="admin-form-group">
                    <label for="title" class="admin-form-label">Título do Artigo</label>
                    <input type="text" id="title" name="title" class="admin-form-input" 
                           placeholder="Digite o título do artigo" required>
                </div>
                
                <div class="admin-form-group">
                    <label for="image" class="admin-form-label">
                        <i data-lucide="image" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                        Imagem do Artigo (Opcional)
                    </label>
                    <input type="url" id="image" name="image" class="admin-form-input" 
                           placeholder="https://exemplo.com/imagem.jpg" style="padding: 15px;">
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        🔗 Cole a URL da imagem. Formatos suportados: JPG, PNG, GIF, WEBP
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="category" class="admin-form-label">Categoria</label>
                    <select id="category" name="category" class="admin-form-select" required>
                        <option value="">Selecione uma categoria</option>
                        <option value="teologia">Teologia</option>
                        <option value="espiritualidade">Espiritualidade</option>
                        <option value="oracao">Oração</option>
                        <option value="fe">Fé</option>
                        <option value="santos">Santos</option>
                    </select>
                </div>
                
                <div class="admin-form-group">
                    <label for="content" class="admin-form-label">Conteúdo</label>
                    <textarea id="content" name="content" class="admin-form-textarea" 
                              placeholder="Digite o conteúdo do artigo (um parágrafo por linha)" 
                              rows="25" spellcheck="true" lang="pt-BR" required></textarea>
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        Cada linha será um parágrafo separado
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="date" class="admin-form-label">Data de Publicação</label>
                    <input type="date" id="date" name="date" class="admin-form-input" 
                           value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <button type="submit" class="admin-btn admin-btn-primary" style="width: 100%; padding: 18px;">
                    <i data-lucide="save" style="width: 20px; height: 20px; margin-right: 10px;"></i>
                    Publicar Artigo
                </button>
            </form>
        </div>
    </div>
  `;
  
  const html = getAdminHTML('Novo Artigo de Religião - Z3Z Admin', content, 'religiao');
  res.send(html);
});

// Rotas POST para salvar novos artigos (com upload de imagens no Cloudinary)
app.post('/admin/poemas/novo', isAuthenticated, async (req, res) => {
  try {
    const { title, content, date, image } = req.body;
    
    // Criar novo ID
    const newId = Math.max(...sampleData.poemas.map(p => p.id)) + 1;
    
    // Processar conteúdo do poema com formatação melhorada
    const contentLines = formatarTexto(content, 'poema').map(linha => capitalizarFrases(linha));
    
    // Processar URL da imagem
    let imagePath = null;
    if (image && image.trim() !== '') {
      // Validar se é uma URL válida
      try {
        new URL(image.trim());
        imagePath = image.trim();
      } catch (urlError) {
        console.error('URL de imagem inválida:', urlError);
        // Continuar sem imagem se a URL for inválida
      }
    }
    
    // Criar novo poema
    const newPoema = {
      id: newId,
      title: title.trim(),
      content: contentLines,
      date: date,
      excerpt: contentLines[0] || '',
      image: imagePath,
      category: "existencial",
      tags: ["poesia"],
      published: true,
      author: "Admin"
    };
    
    // Adicionar aos dados
    sampleData.poemas.unshift(newPoema);
    
    res.redirect('/admin/poemas');
  } catch (error) {
    console.error('Erro ao criar poema:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.post('/admin/filosofia/novo', isAuthenticated, async (req, res) => {
  try {
    const { title, content, category, date, image } = req.body;
    
    // Criar novo ID
    const newId = Math.max(...sampleData.filosofia.map(a => a.id)) + 1;
    
    // Processar conteúdo do artigo com formatação melhorada
    const contentParagraphs = formatarTexto(content, 'artigo').map(paragrafo => capitalizarFrases(paragrafo));
    
    // Processar URL da imagem
    let imagePath = null;
    if (image && image.trim() !== '') {
      // Validar se é uma URL válida
      try {
        new URL(image.trim());
        imagePath = image.trim();
      } catch (urlError) {
        console.error('URL de imagem inválida:', urlError);
        // Continuar sem imagem se a URL for inválida
      }
    }
    
    // Criar novo artigo
    const newArtigo = {
      id: newId,
      title: title.trim(),
      content: contentParagraphs,
      category: category,
      date: date,
      excerpt: contentParagraphs[0] ? contentParagraphs[0].substring(0, 150) + '...' : '',
      image: imagePath,
      tags: ["filosofia"],
      published: true,
      author: "Admin"
    };
    
    // Adicionar aos dados
    sampleData.filosofia.unshift(newArtigo);
    
    res.redirect('/admin/filosofia');
  } catch (error) {
    console.error('Erro ao criar artigo de filosofia:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.post('/admin/religiao/novo', isAuthenticated, async (req, res) => {
  try {
    const { title, content, category, date, image } = req.body;
    
    // Criar novo ID
    const newId = Math.max(...sampleData.religiao.map(a => a.id)) + 1;
    
    // Processar conteúdo do artigo com formatação melhorada
    const contentParagraphs = formatarTexto(content, 'artigo').map(paragrafo => capitalizarFrases(paragrafo));
    
    // Processar URL da imagem
    let imagePath = null;
    if (image && image.trim() !== '') {
      // Validar se é uma URL válida
      try {
        new URL(image.trim());
        imagePath = image.trim();
      } catch (urlError) {
        console.error('URL de imagem inválida:', urlError);
        // Continuar sem imagem se a URL for inválida
      }
    }
    
    // Criar novo artigo
    const newArtigo = {
      id: newId,
      title: title.trim(),
      content: contentParagraphs,
      category: category,
      date: date,
      excerpt: contentParagraphs[0] ? contentParagraphs[0].substring(0, 150) + '...' : '',
      image: imagePath,
      tags: ["religião"],
      published: true,
      author: "Admin"
    };
    
    // Adicionar aos dados
    sampleData.religiao.unshift(newArtigo);
    
    res.redirect('/admin/religiao');
  } catch (error) {
    console.error('Erro ao criar artigo de religião:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Rotas GET para edição de artigos
app.get('/admin/poemas/editar/:id', isAuthenticated, (req, res) => {
  const id = parseInt(req.params.id);
  const poema = sampleData.poemas.find(p => p.id === id);
  
  if (!poema) {
    return res.status(404).send('Poema não encontrado');
  }
  
  const content = `
    <div class="admin-header-actions">
        <a href="/admin/poemas" class="admin-btn admin-btn-secondary">
            <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
            Voltar
        </a>
    </div>
    
    <div class="admin-card">
        <div class="admin-card-header">
            <h2 class="admin-card-title">
                <i data-lucide="edit-3" style="width: 24px; height: 24px; margin-right: 12px; vertical-align: middle;"></i>
                Editar Poema
            </h2>
            <p class="admin-card-subtitle">Edite o poema "${poema.title}"</p>
        </div>
        
        <div class="admin-card-body">
            <form method="POST" action="/admin/poemas/editar/${id}" class="admin-form">
                <div class="admin-form-group">
                    <label for="title" class="admin-form-label">Título do Poema</label>
                    <input type="text" id="title" name="title" class="admin-form-input" 
                           placeholder="Digite o título do poema" value="${poema.title}" required>
                </div>
                
                <div class="admin-form-group">
                    <label for="image" class="admin-form-label">
                        <i data-lucide="image" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                        Imagem do Poema (Opcional)
                    </label>
                    <input type="url" id="image" name="image" class="admin-form-input" 
                           placeholder="https://exemplo.com/imagem.jpg" value="${poema.image || ''}" style="padding: 15px;">
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        🔗 Cole a URL da imagem. Formatos suportados: JPG, PNG, GIF, WEBP
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="content" class="admin-form-label">Conteúdo</label>
                    <textarea id="content" name="content" class="admin-form-textarea" 
                              placeholder="Digite o poema (uma estrofe por linha, linha vazia para separar estrofes)" 
                              rows="25" spellcheck="true" lang="pt-BR" required>${poema.content.join('\\n')}</textarea>
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        💡 <strong>Dicas de formatação:</strong><br>
                        • Use uma linha para cada verso<br>
                        • Deixe linhas vazias para separar estrofes<br>
                        • O sistema corrige automaticamente maiúsculas e minúsculas<br>
                        • Verificação ortográfica está ativada
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="date" class="admin-form-label">Data de Publicação</label>
                    <input type="date" id="date" name="date" class="admin-form-input" 
                           value="${poema.date}" required>
                </div>
                
                <button type="submit" class="admin-btn admin-btn-primary" style="width: 100%; padding: 18px;">
                    <i data-lucide="save" style="width: 20px; height: 20px; margin-right: 10px;"></i>
                    Atualizar Poema
                </button>
            </form>
        </div>
    </div>
  `;
  
  const html = getAdminHTML('Editar Poema - Z3Z Admin', content, 'poemas');
  res.send(html);
});

app.get('/admin/filosofia/editar/:id', isAuthenticated, (req, res) => {
  const id = parseInt(req.params.id);
  const artigo = sampleData.filosofia.find(f => f.id === id);
  
  if (!artigo) {
    return res.status(404).send('Artigo não encontrado');
  }
  
  const content = `
    <div class="admin-header-actions">
        <a href="/admin/filosofia" class="admin-btn admin-btn-secondary">
            <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
            Voltar
        </a>
    </div>
    
    <div class="admin-card">
        <div class="admin-card-header">
            <h2 class="admin-card-title">
                <i data-lucide="edit-3" style="width: 24px; height: 24px; margin-right: 12px; vertical-align: middle;"></i>
                Editar Filosofia
            </h2>
            <p class="admin-card-subtitle">Edite o artigo "${artigo.title}"</p>
        </div>
        
        <div class="admin-card-body">
            <form method="POST" action="/admin/filosofia/editar/${id}" class="admin-form">
                <div class="admin-form-group">
                    <label for="title" class="admin-form-label">Título do Artigo</label>
                    <input type="text" id="title" name="title" class="admin-form-input" 
                           placeholder="Digite o título do artigo" value="${artigo.title}" required>
                </div>
                
                <div class="admin-form-group">
                    <label for="category" class="admin-form-label">Categoria</label>
                    <select id="category" name="category" class="admin-form-input" required>
                        <option value="existencial" ${artigo.category === 'existencial' ? 'selected' : ''}>Existencial</option>
                        <option value="epistemologia" ${artigo.category === 'epistemologia' ? 'selected' : ''}>Epistemologia</option>
                        <option value="ética" ${artigo.category === 'ética' ? 'selected' : ''}>Ética</option>
                        <option value="metafísica" ${artigo.category === 'metafísica' ? 'selected' : ''}>Metafísica</option>
                    </select>
                </div>
                
                <div class="admin-form-group">
                    <label for="image" class="admin-form-label">
                        <i data-lucide="image" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                        Imagem do Artigo (Opcional)
                    </label>
                    <input type="url" id="image" name="image" class="admin-form-input" 
                           placeholder="https://exemplo.com/imagem.jpg" value="${artigo.image || ''}" style="padding: 15px;">
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        🔗 Cole a URL da imagem. Formatos suportados: JPG, PNG, GIF, WEBP
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="content" class="admin-form-label">Conteúdo</label>
                    <textarea id="content" name="content" class="admin-form-textarea" 
                              placeholder="Digite o conteúdo do artigo (um parágrafo por linha)" 
                              rows="30" spellcheck="true" lang="pt-BR" required>${artigo.content.join('\\n\\n')}</textarea>
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        💡 <strong>Dicas de formatação:</strong><br>
                        • Use linhas duplas vazias para separar parágrafos<br>
                        • Cada parágrafo será bem estruturado automaticamente<br>
                        • Texto justificado e com identação adequada<br>
                        • Correção automática de maiúsculas e verificação ortográfica ativa
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="date" class="admin-form-label">Data de Publicação</label>
                    <input type="date" id="date" name="date" class="admin-form-input" 
                           value="${artigo.date}" required>
                </div>
                
                <button type="submit" class="admin-btn admin-btn-primary" style="width: 100%; padding: 18px;">
                    <i data-lucide="save" style="width: 20px; height: 20px; margin-right: 10px;"></i>
                    Atualizar Artigo
                </button>
            </form>
        </div>
    </div>
  `;
  
  const html = getAdminHTML('Editar Filosofia - Z3Z Admin', content, 'filosofia');
  res.send(html);
});

app.get('/admin/religiao/editar/:id', isAuthenticated, (req, res) => {
  const id = parseInt(req.params.id);
  const artigo = sampleData.religiao.find(r => r.id === id);
  
  if (!artigo) {
    return res.status(404).send('Artigo não encontrado');
  }
  
  const content = `
    <div class="admin-header-actions">
        <a href="/admin/religiao" class="admin-btn admin-btn-secondary">
            <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
            Voltar
        </a>
    </div>
    
    <div class="admin-card">
        <div class="admin-card-header">
            <h2 class="admin-card-title">
                <i data-lucide="edit-3" style="width: 24px; height: 24px; margin-right: 12px; vertical-align: middle;"></i>
                Editar Religião
            </h2>
            <p class="admin-card-subtitle">Edite o artigo "${artigo.title}"</p>
        </div>
        
        <div class="admin-card-body">
            <form method="POST" action="/admin/religiao/editar/${id}" class="admin-form">
                <div class="admin-form-group">
                    <label for="title" class="admin-form-label">Título do Artigo</label>
                    <input type="text" id="title" name="title" class="admin-form-input" 
                           placeholder="Digite o título do artigo" value="${artigo.title}" required>
                </div>
                
                <div class="admin-form-group">
                    <label for="category" class="admin-form-label">Categoria</label>
                    <select id="category" name="category" class="admin-form-input" required>
                        <option value="teologia" ${artigo.category === 'teologia' ? 'selected' : ''}>Teologia</option>
                        <option value="espiritualidade" ${artigo.category === 'espiritualidade' ? 'selected' : ''}>Espiritualidade</option>
                        <option value="oração" ${artigo.category === 'oração' ? 'selected' : ''}>Oração</option>
                        <option value="fé" ${artigo.category === 'fé' ? 'selected' : ''}>Fé</option>
                    </select>
                </div>
                
                <div class="admin-form-group">
                    <label for="image" class="admin-form-label">
                        <i data-lucide="image" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                        Imagem do Artigo (Opcional)
                    </label>
                    <input type="url" id="image" name="image" class="admin-form-input" 
                           placeholder="https://exemplo.com/imagem.jpg" value="${artigo.image || ''}" style="padding: 15px;">
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        🔗 Cole a URL da imagem. Formatos suportados: JPG, PNG, GIF, WEBP
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="content" class="admin-form-label">Conteúdo</label>
                    <textarea id="content" name="content" class="admin-form-textarea" 
                              placeholder="Digite o conteúdo do artigo (um parágrafo por linha)" 
                              rows="30" spellcheck="true" lang="pt-BR" required>${artigo.content.join('\\n\\n')}</textarea>
                    <small style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 8px; display: block;">
                        💡 <strong>Dicas de formatação:</strong><br>
                        • Use linhas duplas vazias para separar parágrafos<br>
                        • Cada parágrafo será bem estruturado automaticamente<br>
                        • Texto justificado e com identação adequada<br>
                        • Correção automática de maiúsculas e verificação ortográfica ativa
                    </small>
                </div>
                
                <div class="admin-form-group">
                    <label for="date" class="admin-form-label">Data de Publicação</label>
                    <input type="date" id="date" name="date" class="admin-form-input" 
                           value="${artigo.date}" required>
                </div>
                
                <button type="submit" class="admin-btn admin-btn-primary" style="width: 100%; padding: 18px;">
                    <i data-lucide="save" style="width: 20px; height: 20px; margin-right: 10px;"></i>
                    Atualizar Artigo
                </button>
            </form>
        </div>
    </div>
  `;
  
  const html = getAdminHTML('Editar Religião - Z3Z Admin', content, 'religiao');
  res.send(html);
});

// Rotas DELETE para excluir artigos
app.delete('/admin/poemas/:id', isAuthenticated, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = sampleData.poemas.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Poema não encontrado' });
    }
    
    sampleData.poemas.splice(index, 1);
    res.json({ success: true, message: 'Poema excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir poema:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

app.delete('/admin/filosofia/:id', isAuthenticated, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = sampleData.filosofia.findIndex(f => f.id === id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Artigo não encontrado' });
    }
    
    sampleData.filosofia.splice(index, 1);
    res.json({ success: true, message: 'Artigo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir artigo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

app.delete('/admin/religiao/:id', isAuthenticated, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = sampleData.religiao.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Artigo não encontrado' });
    }
    
    sampleData.religiao.splice(index, 1);
    res.json({ success: true, message: 'Artigo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir artigo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Rotas POST para atualizar artigos
app.post('/admin/poemas/editar/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, date, image } = req.body;
    
    const index = sampleData.poemas.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).send('Poema não encontrado');
    }
    
    // Processar conteúdo do poema com formatação melhorada
    const contentLines = formatarTexto(content, 'poema').map(linha => capitalizarFrases(linha));
    
    // Processar URL da imagem
    let imagePath = null;
    if (image && image.trim() !== '') {
      // Validar se é uma URL válida
      try {
        new URL(image.trim());
        imagePath = image.trim();
      } catch (urlError) {
        console.error('URL de imagem inválida:', urlError);
        // Continuar sem imagem se a URL for inválida
      }
    }
    
    // Atualizar poema existente
    sampleData.poemas[index] = {
      ...sampleData.poemas[index],
      title: title.trim(),
      content: contentLines,
      date: date,
      image: imagePath,
      excerpt: contentLines[0] || ''
    };
    
    res.redirect('/admin/poemas');
  } catch (error) {
    console.error('Erro ao atualizar poema:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.post('/admin/filosofia/editar/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, category, date, image } = req.body;
    
    const index = sampleData.filosofia.findIndex(f => f.id === id);
    
    if (index === -1) {
      return res.status(404).send('Artigo não encontrado');
    }
    
    // Processar conteúdo (quebrar em parágrafos)
    const contentParagraphs = content.split('\n\n').filter(line => line.trim() !== '');
    
    // Processar URL da imagem
    let imagePath = null;
    if (image && image.trim() !== '') {
      // Validar se é uma URL válida
      try {
        new URL(image.trim());
        imagePath = image.trim();
      } catch (urlError) {
        console.error('URL de imagem inválida:', urlError);
        // Continuar sem imagem se a URL for inválida
      }
    }
    
    // Atualizar artigo existente
    sampleData.filosofia[index] = {
      ...sampleData.filosofia[index],
      title: title.trim(),
      content: contentParagraphs,
      category: category,
      date: date,
      image: imagePath,
      excerpt: contentParagraphs[0] ? contentParagraphs[0].substring(0, 150) + '...' : ''
    };
    
    res.redirect('/admin/filosofia');
  } catch (error) {
    console.error('Erro ao atualizar artigo de filosofia:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.post('/admin/religiao/editar/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, category, date, image } = req.body;
    
    const index = sampleData.religiao.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).send('Artigo não encontrado');
    }
    
    // Processar conteúdo (quebrar em parágrafos)
    const contentParagraphs = content.split('\n\n').filter(line => line.trim() !== '');
    
    // Processar URL da imagem
    let imagePath = null;
    if (image && image.trim() !== '') {
      // Validar se é uma URL válida
      try {
        new URL(image.trim());
        imagePath = image.trim();
      } catch (urlError) {
        console.error('URL de imagem inválida:', urlError);
        // Continuar sem imagem se a URL for inválida
      }
    }
    
    // Atualizar artigo existente
    sampleData.religiao[index] = {
      ...sampleData.religiao[index],
      title: title.trim(),
      content: contentParagraphs,
      category: category,
      date: date,
      image: imagePath,
      excerpt: contentParagraphs[0] ? contentParagraphs[0].substring(0, 150) + '...' : ''
    };
    
    res.redirect('/admin/religiao');
  } catch (error) {
    console.error('Erro ao atualizar artigo de religião:', error);
    res.status(500).send('Erro interno do servidor');
  }
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