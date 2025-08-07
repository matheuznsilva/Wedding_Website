// Importa as dependências e configura o .env
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db/database');
const session = require('express-session');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const { Client } = require("@googlemaps/google-maps-services-js");
const googleMapsClient = new Client({ key: process.env.Maps_API_KEY });
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
	secret: process.env.SESSION_SECRET || 'sua_chave_secreta_aqui',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false }
}));

const storage = multer.diskStorage({
	destination: (req, file, cb) => { cb(null, 'uploads/'); },
	filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

const isAuth = (req, res, next) => {
	if (req.session.isAuth) { next(); } else { res.redirect('/login'); }
};

// Rotas para as páginas públicas
app.get('/', async (req, res) => {
    try {
        const configuracoesResult = await db.query('SELECT * FROM configuracoes LIMIT 1');
        const configuracoes = configuracoesResult.rows[0] || {};
        
        res.render('index', { configuracoes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar a página inicial.');
    }
});

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

app.get('/dicas', async (req, res) => {
	try {
		const dicasResult = await db.query('SELECT * FROM dicas');
		const dicas = {};
		dicasResult.rows.forEach(dica => { dicas[dica.categoria] = { conteudo: dica.conteudo, imagem_url: dica.imagem_url }; });
		res.render('dicas', { dicas });
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao carregar as dicas.');
	}
});

app.get('/rsvp', async (req, res) => {
    try {
        res.render('rsvp');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar a página de RSVP.');
    }
});

app.post('/rsvp', async (req, res) => {
    try {
        const { nome_convidado, quantidade_adultos, quantidade_criancas } = req.body;

        await db.query(
            'INSERT INTO rsvp (nome_convidado, quantidade_adultos, quantidade_criancas) VALUES ($1, $2, $3)',
            [nome_convidado, quantidade_adultos, quantidade_criancas]
        );
        res.render('rsvp_sucesso');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao confirmar sua presença.');
    }
});

app.get('/presentes', async (req, res) => {
	try {
		const result = await db.query('SELECT * FROM presentes ORDER BY id ASC');
		const presentes = result.rows;
		res.render('presentes', { presentes });
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao carregar a lista de presentes.');
	}
});

app.post('/api/presentes/reservar/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await db.query('UPDATE presentes SET status = $1 WHERE id = $2', ['reservado', id]);
		res.status(200).send({ message: 'Presente reservado com sucesso!' });
	} catch (error) {
		console.error(error);
		res.status(500).send({ message: 'Erro ao reservar o presente.' });
	}
});

app.get('/mensagem', async (req, res) => {
    try {
        res.render('mensagem');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar a página de mensagens.');
    }
});

app.post('/mensagem', async (req, res) => {
    try {
        const { nome, mensagem } = req.body;

        await db.query(
            'INSERT INTO mensagens (nome, mensagem) VALUES ($1, $2)',
            [nome, mensagem]
        );
        res.render('mensagem_sucesso');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao enviar a mensagem.');
    }
});

app.get('/local', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM local LIMIT 1');
        const local = result.rows[0] || {};
        res.render('local', { local, googleMapsApiKey: process.env.Maps_API_KEY });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar o local.');
    }
});

app.get('/login', async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar a página de login.');
    }
});

app.post('/login', async (req, res) => {
	const { username, password } = req.body;

	try {
		const result = await db.query('SELECT * FROM usuarios WHERE username = $1', [username]);
		const user = result.rows[0];

		if (user && await bcrypt.compare(password, user.password_hash)) {
			req.session.isAuth = true;
			res.redirect('/dashboard');
		} else {
			res.send('Usuário ou senha incorretos.');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro interno do servidor.');
	}
});

app.get('/dashboard', isAuth, async (req, res) => {
    try {
        res.render('dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar o dashboard.');
    }
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

app.get('/dashboard/home', isAuth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM configuracoes LIMIT 1');
        const configuracoes = result.rows[0] || {};
        res.render('home_admin', { configuracoes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar as configurações da home.');
    }
});

app.post('/dashboard/home', isAuth, upload.single('foto_fundo'), async (req, res) => {
    const { data_casamento } = req.body;
    const foto_fundo_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    try {
        await db.query(`
            INSERT INTO configuracoes (id, data_casamento, foto_fundo_url)
            VALUES (1, $1, $2)
            ON CONFLICT (id) DO UPDATE
            SET data_casamento = $1, foto_fundo_url = COALESCE($2, configuracoes.foto_fundo_url);
        `, [data_casamento, foto_fundo_url]);
        res.redirect('/dashboard/home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao salvar as configurações da home.');
    }
});

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

app.get('/dashboard/dicas', isAuth, async (req, res) => {
	try {
		const dicasResult = await db.query('SELECT * FROM dicas');
		const dicas = {};
		dicasResult.rows.forEach(dica => {
			dicas[dica.categoria] = {
				conteudo: dica.conteudo,
				imagem_url: dica.imagem_url
			};
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

app.get('/dashboard/rsvp', isAuth, async (req, res) => {
	try {
		const result = await db.query('SELECT * FROM rsvp ORDER BY data_confirmacao DESC');
		const rsvps = result.rows;

		const totalAdultos = rsvps.reduce((sum, rsvp) => sum + rsvp.quantidade_adultos, 0);
		const totalCriancas = rsvps.reduce((sum, rsvp) => sum + rsvp.quantidade_criancas, 0);
		const totalPessoas = totalAdultos + totalCriancas;

		res.render('rsvp_admin', { rsvps, totalAdultos, totalCriancas, totalPessoas });
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao carregar a lista de convidados.');
	}
});

app.get('/dashboard/rsvp/download', isAuth, async (req, res) => {
	try {
		const result = await db.query('SELECT * FROM rsvp ORDER BY nome_convidado ASC');
		const rsvps = result.rows;

		const doc = new PDFDocument();
		const filename = 'lista_de_convidados.pdf';

		res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
		res.setHeader('Content-type', 'application/pdf');

		const totalAdultos = rsvps.reduce((sum, rsvp) => sum + rsvp.quantidade_adultos, 0);
		const totalCriancas = rsvps.reduce((sum, rsvp) => sum + rsvp.quantidade_criancas, 0);
		const totalPessoas = totalAdultos + totalCriancas;

		doc.fontSize(16).text(`Lista de Convidados - Casamento J&P`, { align: 'center' });
		doc.moveDown(1);
		doc.fontSize(12).text(`Total de Pessoas: ${totalPessoas}`, { align: 'left' });
		doc.text(`Total de Adultos: ${totalAdultos}`, { align: 'left' });
		doc.text(`Total de Crianças: ${totalCriancas}`, { align: 'left' });
		doc.moveDown();

		rsvps.forEach(rsvp => {
			doc.text(`- Convidado: ${rsvp.nome_convidado} | Adultos: ${rsvp.quantidade_adultos} | Crianças: ${rsvp.quantidade_criancas}`);
		});

		doc.pipe(res);
		doc.end();
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao gerar o PDF.');
	}
});

app.get('/dashboard/presentes', isAuth, async (req, res) => {
	try {
		const result = await db.query('SELECT * FROM presentes ORDER BY id DESC');
		const presentes = result.rows;
		res.render('presentes_admin', { presentes });
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao carregar a lista de presentes.');
	}
});

app.post('/dashboard/presentes', isAuth, upload.single('imagem'), async (req, res) => {
	const { nome, valor, descricao, pix_info, marketplace_url } = req.body;
	const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;

	try {
		await db.query(
			'INSERT INTO presentes (nome, valor, descricao, pix_info, imagem_url, marketplace_url) VALUES ($1, $2, $3, $4, $5, $6)',
			[nome, valor, descricao, pix_info, imagem_url, marketplace_url]
		);
		res.redirect('/dashboard/presentes');
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao adicionar presente.');
	}
});

app.post('/dashboard/presentes/comprado/:id', isAuth, async (req, res) => {
	const { id } = req.params;
	try {
		await db.query('UPDATE presentes SET status = $1 WHERE id = $2', ['comprado', id]);
		res.redirect('/dashboard/presentes');
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao marcar presente como comprado.');
	}
});

app.post('/dashboard/presentes/reativar/:id', isAuth, async (req, res) => {
	const { id } = req.params;
	try {
		await db.query('UPDATE presentes SET status = $1 WHERE id = $2', ['disponivel', id]);
		res.redirect('/dashboard/presentes');
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao reativar o presente.');
	}
});

app.post('/dashboard/presentes/remover/:id', isAuth, async (req, res) => {
	const { id } = req.params;
	try {
		await db.query('DELETE FROM presentes WHERE id = $1', [id]);
		res.redirect('/dashboard/presentes');
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao remover presente.');
	}
});

app.get('/dashboard/mensagens', isAuth, async (req, res) => {
	try {
		const result = await db.query('SELECT * FROM mensagens ORDER BY data_envio DESC');
		const mensagens = result.rows;
		res.render('mensagens_admin', { mensagens });
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao carregar as mensagens.');
	}
});

app.get('/dashboard/local', isAuth, async (req, res) => {
	try {
		const result = await db.query('SELECT * FROM local LIMIT 1');
		const local = result.rows[0] || {};
		res.render('local_admin', { local });
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao carregar o local.');
	}
});

app.post('/dashboard/local', isAuth, async (req, res) => {
	const { rua, numero, bairro, cidade, estado } = req.body;
	const enderecoCompleto = `${rua}, ${numero} - ${bairro}, ${cidade} - ${estado}`;

	try {
		const geoResult = await googleMapsClient.geocode({
			params: {
				address: enderecoCompleto,
				key: process.env.Maps_API_KEY,
			},
		});

		const { lat, lng } = geoResult.data.results[0].geometry.location;

		await db.query(`
            INSERT INTO local (id, rua, numero, bairro, cidade, estado, latitude, longitude)
            VALUES (1, $1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE
            SET rua = $1, numero = $2, bairro = $3, cidade = $4, estado = $5, latitude = $6, longitude = $7;
        `, [rua, numero, bairro, cidade, estado, lat, lng]);

		res.redirect('/dashboard/local');
	} catch (error) {
		console.error(error);
		res.status(500).send('Erro ao salvar o local.');
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

app.listen(PORT, () => {
	console.log(`Servidor rodando em http://localhost:${PORT}`);
});