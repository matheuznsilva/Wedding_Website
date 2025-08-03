// Importa o Express, que vamos usar para criar o nosso servidor
const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db/database');
const session = require('express-session');
const multer = require('multer'); // Importa o multer
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Serve os arquivos estáticos (CSS, JS, imagens) da pasta 'public'
app.use(express.static('public'));

// Serve os arquivos da pasta 'uploads' sob a rota /uploads
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'sua_chave_secreta_aqui',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Configuração do Multer para o upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Rota principal do nosso site
app.get('/', (req, res) => {
    res.render('index');
});

// Rota para a página de História
app.get('/historia', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM historia LIMIT 1');
        const historia = result.rows[0] || {};
        res.render('historia', { historia });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar a história.');
    }
});

// Rota para a página de Dicas
app.get('/dicas', async (req, res) => {
    try {
        const dicasResult = await db.query('SELECT * FROM dicas');
        const dicas = {};
        dicasResult.rows.forEach(dica => {
            dicas[dica.categoria] = {
                conteudo: dica.conteudo,
                imagem_url: dica.imagem_url
            };
        });
        res.render('dicas', { dicas });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar as dicas.');
    }
});

// Rota para a pagina de Confirmação de Presenças
app.get('/rsvp', (req, res) => {
    res.render('rsvp');
});

app.post('/rsvp', async (req, res) => {
    const { nome_convidado, quantidade_adultos, quantidade_criancas } = req.body;
    
    try {
        await db.query(
            'INSERT INTO rsvp (nome_convidado, quantidade_adultos, quantidade_criancas) VALUES ($1, $2, $3)',
            [nome_convidado, quantidade_adultos, quantidade_criancas]
        );
        res.render('rsvp_sucesso'); // Criaremos essa página em seguida
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao confirmar sua presença.');
    }
});

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

app.get('/dashboard', isAuth, (req, res) => {
    res.render('dashboard');
});

app.get('/dashboard/historia', isAuth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM historia LIMIT 1');
        const historia = result.rows[0] || {};
        res.render('historia_admin', { historia });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar a história.');
    }
});

// Rota para processar o formulário de gerenciamento da história
app.post('/dashboard/historia', isAuth, upload.single('imagem'), async (req, res) => {
    const { titulo, texto } = req.body;
    const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        await db.query(`
            INSERT INTO historia (id, titulo, texto, imagem_url)
            VALUES (1, $1, $2, $3)
            ON CONFLICT (id) DO UPDATE
            SET titulo = $1, texto = $2, imagem_url = $3;
        `, [titulo, texto, imagem_url]);
        res.redirect('/dashboard/historia');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao salvar a história.');
    }
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

app.get('/dashboard/dicas', isAuth, async (req, res) => {
    try {
        const dicasResult = await db.query('SELECT * FROM dicas');
        const dicas = {};
        dicasResult.rows.forEach(dica => {
            dicas[dica.categoria] = dica.conteudo;
        });
        res.render('dicas_admin', { dicas });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar as dicas.');
    }
});

app.post('/dashboard/dicas/:categoria', isAuth, upload.single('imagem'), async (req, res) => {
    const { categoria } = req.params;
    const { conteudo } = req.body;
    const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    try {
        await db.query(`
            INSERT INTO dicas (categoria, conteudo, imagem_url)
            VALUES ($1, $2, $3)
            ON CONFLICT (categoria) DO UPDATE
            SET conteudo = EXCLUDED.conteudo,
                imagem_url = COALESCE($3, dicas.imagem_url);
        `, [categoria, conteudo, imagem_url]);
        res.redirect('/dashboard/dicas');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao salvar a dica.');
    }
});

// Inicia o servidor e o faz "escutar" a porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});