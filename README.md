# Blog Z3Z ✨

Um espaço sagrado para a alma, onde poesia, filosofia e espiritualidade se encontram.

## 🌟 Visão Geral

O Blog Z3Z é uma plataforma elegante e premium dedicada ao compartilhamento de:
- **📝 Poemas**: Versos que tocam a alma e despertam sentimentos profundos
- **🤔 Filosofia**: Reflexões sobre existência, conhecimento e valores humanos  
- **🙏 Religião**: Exploração da dimensão sagrada e diálogo entre tradições

## 🚀 Tecnologias

### Frontend
- **CSS Premium**: Design elegante com gradientes, blur effects e animações suaves
- **Fontes Google**: Oswald, Libre Baskerville e Roboto Slab
- **JavaScript Vanilla**: Interações fluidas e animações
- **Design Responsivo**: Mobile-first com breakpoints otimizados

### Backend
- **Node.js + Express**: Servidor robusto e escalável
- **EJS + Express Layouts**: Sistema de templates eficiente
- **Express Session**: Autenticação de administrador
- **Bcrypt.js**: Hash seguro de senhas
- **Helmet.js**: Headers de segurança

### Dados
- **JSON Files**: Sistema de persistência simples e eficaz
- **CRUD Completo**: Create, Read, Update, Delete para todo conteúdo

## 🎨 Paleta Premium

Inspirada no logo Z3Z com coroa de louros:
- **🔴 Vermelho**: `#B71C1C` com gradiente `#D32F2F → #F44336`
- **🟡 Dourado**: `#FFB300` com gradiente `#FFC107 → #FFD54F`
- **🔵 Azul Marinho**: `#1A237E` com gradiente `#3F51B5 → #5C6BC0`
- **⚪ Neutros**: `#FEFEFE`, `#F8F9FA`, `#343A40`

## 📦 Instalação

```bash
# Clonar o repositório
git clone [url-do-repo]
cd Blog-Z3Z

# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

## 🏗️ Estrutura do Projeto

```
Blog-Z3Z/
├── 📄 app.js                    # Servidor principal
├── 📄 package.json              # Dependências
├── 📄 generate-password.js      # Utilitário para senhas
├── 📁 data/                     # Dados JSON
│   ├── poemas.json
│   ├── filosofia.json
│   ├── religiao.json
│   └── admin.json
├── 📁 public/                   # Assets estáticos
│   ├── 🎨 css/
│   │   ├── styles.css          # Estilos principais
│   │   └── admin.css           # Estilos do admin
│   ├── ⚡ js/
│   │   ├── script.js           # JavaScript principal
│   │   └── admin.js            # JavaScript do admin
│   └── 🖼️ images/
├── 📁 routes/                   # Rotas da API
│   ├── index.js               # Página inicial
│   ├── poemas.js              # Gestão de poemas
│   ├── filosofia.js           # Gestão de filosofia
│   ├── religiao.js            # Gestão de religião
│   └── admin.js               # Painel administrativo
└── 📁 views/                    # Templates EJS
    ├── layout.ejs              # Layout principal
    ├── index.ejs               # Página inicial
    ├── poemas.ejs              # Lista de poemas
    ├── filosofia.ejs           # Lista de filosofia
    ├── religiao.ejs            # Lista de religião
    ├── 404.ejs                 # Página de erro
    └── 📁 admin/               # Painel admin
        ├── layout.ejs          # Layout do admin
        ├── login.ejs           # Login
        ├── dashboard.ejs       # Dashboard
        └── 📁 [poemas|filosofia|religiao]/
            ├── list.ejs        # Lista de conteúdo
            └── form.ejs        # Formulário de edição
```

## 🎯 Funcionalidades Premium

### 🌐 Frontend
- **Navegação Fluida**: Transições suaves com CSS transforms
- **Filtros Dinâmicos**: Sistema avançado de categorização
- **Animações**: Hover effects, parallax e micro-interações
- **Tipografia Sofisticada**: Hierarquia visual clara
- **Glass Morphism**: Efeitos de blur e transparência

### 🛡️ Painel Administrativo
- **Login Seguro**: Autenticação com bcrypt
- **Dashboard Intuitivo**: Estatísticas em tempo real  
- **CRUD Completo**: Criar, editar e excluir conteúdo
- **Salvamento Automático**: Rascunhos no localStorage
- **Interface Premium**: Design consistente com o frontend

### 📱 Responsividade
- **Mobile-First**: Otimizado para dispositivos móveis
- **Breakpoints Inteligentes**: Adaptação fluida
- **Touch Friendly**: Interações otimizadas para touch
- **Performance**: Loading otimizado e lazy loading

## 🔐 Acesso Administrativo

### Credenciais Padrão
```
Usuário: admin
Senha: admin123
URL: http://localhost:3000/admin
```

### Gerando Nova Senha
```bash
node generate-password.js
# Copie o hash gerado para data/admin.json
```

## 🚦 Scripts Disponíveis

```bash
npm start      # 🚀 Produção (porta 3000)
npm run dev    # 🔧 Desenvolvimento com nodemon
npm test       # 🧪 Testes (placeholder)
```

## 🌈 Recursos Visuais

### Gradientes Exclusivos
- **Primary**: Vermelho degradê para impacto visual
- **Gold**: Dourado elegante para destaques
- **Navy**: Azul profundo para contraste
- **Subtle**: Neutro suave para backgrounds

### Sombras Sofisticadas
- **Light**: Sutil para elementos flutuantes
- **Regular**: Padrão para cards
- **Dark**: Intensa para hover states
- **XL**: Dramática para modais

### Animações Fluidas
- **Cubic-bezier**: Curvas de animação naturais
- **Transform**: Hardware acceleration
- **Backdrop-filter**: Blur effects modernos
- **Keyframes**: Animações customizadas

## 🎨 Customização

### Paleta de Cores
Edite as variáveis CSS em `public/css/styles.css`:
```css
:root {
    --primary-red: #B71C1C;
    --primary-gold: #FFB300;
    --navy-blue: #1A237E;
    /* ... */
}
```

### Fontes
Altere as importações no layout:
```html
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
```

## 🔧 Desenvolvimento

### Adicionando Novo Conteúdo
1. Edite os arquivos JSON em `data/`
2. O sistema recarrega automaticamente
3. Use o painel admin para interface visual

### Estrutura dos Dados
```json
{
    "id": 1,
    "title": "Título",
    "content": ["Parágrafo 1", "Parágrafo 2"],
    "category": "categoria",
    "tags": ["tag1", "tag2"],
    "published": true,
    "date": "2025-01-07",
    "created_at": "ISO_DATE",
    "updated_at": "ISO_DATE"
}
```

## 🚀 Deploy

### Variáveis de Ambiente
```bash
PORT=3000
NODE_ENV=production
SESSION_SECRET=sua-chave-secreta-aqui
```

### Produção
```bash
npm install --production
npm start
```

## 📈 Roadmap

- [ ] 🗄️ Integração com MongoDB
- [ ] 🔍 Sistema de busca avançado
- [ ] 📧 Newsletter
- [ ] 💬 Sistema de comentários
- [ ] 🌐 Múltiplos idiomas
- [ ] 📊 Analytics integrado
- [ ] 🎨 Editor WYSIWYG
- [ ] 📱 PWA (Progressive Web App)

## 💝 Contribuição

Este projeto é open-source e aceita contribuições:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

ISC License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- Google Fonts pela tipografia elegante
- Comunidade Node.js pelas ferramentas
- Inspiração filosófica dos grandes pensadores

---

### 💭 Filosofia do Projeto

> *"A verdadeira sabedoria está em reconhecer a própria ignorância."* — Sócrates

O Blog Z3Z nasceu da necessidade de criar um espaço digital que honre a profundidade do pensamento humano, onde cada pixel foi pensado para elevar a alma e cada linha de código foi escrita com reverência ao sagrado da palavra.

**Desenvolvido com 💛 para nutrir almas e expandir consciências.**