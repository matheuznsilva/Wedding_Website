// Importa o Express, que vamos usar para criar o nosso servidor
const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db/database'); // Importa a nossa conexão com o banco
const session = require('express-session'); // Para gerenciar a sessão do usuário
// Define a porta do servidor, 3000 é uma escolha comum
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'sua_chave_secreta_aqui',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


// Configura o EJS como o nosso template engine
app.set('view engine', 'ejs');

// Diz ao Express onde encontrar os arquivos de visualização (views)
app.set('views', path.join(__dirname, 'views'));

// Serve os arquivos estáticos (CSS, JS, imagens) da pasta 'public'
app.use(express.static('public'));

// Rota principal do nosso site
app.get('/', (req, res) => {
  // Renderiza a página 'index.ejs'
  res.render('index');
});
// Rota para a página de História
app.get('/history', (req, res) => {
  res.render('history');
});

// Rota para a página de Dicas
app.get('/dicas', (req, res) => {
  res.render('dicas');
});

// Permite que o Express leia dados de formulários
app.use(express.urlencoded({ extended: true }));

// Rota para exibir a página de login
app.get('/login', (req, res) => {
  res.render('login');
});

// Rota para processar o formulário de login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password_hash)) {
      // Login bem-sucedido
      req.session.isAuth = true;
      res.redirect('/dashboard');
    } else {
      // Login falhou
      res.send('Usuário ou senha incorretos.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor.');
  }
});

// Rota protegida para o Dashboard
const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// Inicia o servidor e o faz "escutar" a porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});