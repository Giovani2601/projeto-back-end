const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
require("../models/Livro");
const Livro = mongoose.model("livros");
const auth = require("../auth/auth");
const funcoesArquivos = require("../funcoesArquivos/funcoesArquivos");

router.get('/sincronizar-arquivo', auth.verificaAdmin, (req, res) => {
    Livro.find().then((livros) => {
        funcoesArquivos.writeData('livros.json', livros)
            .then(() => {
                res.status(200).json({ 
                    message: "Arquivo sincronizado com sucesso!", 
                    quantidade: livros.length 
                });
            })
            .catch((erro) => {
                res.status(500).json({ 
                    message: "Erro ao sincronizar arquivo", 
                    error: erro.message 
                });
            });
    }).catch((erro) => {
        res.status(500).json({ 
            message: "Erro ao buscar livros no banco", 
            error: erro.message 
        });
    });
});

/**
 * @swagger
 * /livros:
 *   post:
 *     summary: Cria um novo livro (apenas administradores)
 *     description: Cria um livro no sistema com informações de título, autor e status. A operação é restrita a administradores.
 *     tags:
 *       - Livros
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - autor
 *               - status
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "O Senhor dos Anéis"
 *               autor:
 *                 type: string
 *                 example: "J.R.R. Tolkien"
 *               status:
 *                 type: number
 *                 example: 1
 *                 description: "1 para disponível, 0 para indisponível"
 *     responses:
 *       201:
 *         description: Livro criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Livro cadastrado com sucesso!!!"
 *                 livroCriado:
 *                   $ref: '#/components/schemas/Livro'
 *       400:
 *         description: Erro ao validar os dados de entrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erro, titulo invalido"
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor, erro: [mensagem do erro]"
 */
//rota para insersao de livros (apenas admins)
router.post("/", auth.verificaAdmin, (req,res) => {
    if(!req.body.titulo || typeof req.body.titulo === undefined || req.body.titulo === null) {
        return res.status(400).json({message: "Erro, titulo invalido"});
    }

    if(!req.body.autor || typeof req.body.autor === undefined || req.body.autor === null) {
        return res.status(400).json({message: "Erro, autor invalido"});
    }

    if(typeof req.body.status === undefined || req.body.status === null) {
        return res.status(400).json({message: "Erro, status invalido"});
    }

    const novoLivro = {
        titulo: req.body.titulo,
        autor: req.body.autor,
        status: req.body.status
    }

    new Livro(novoLivro).save().then((livroCriado) => {
        funcoesArquivos.readData("livros.json").then((data) => {
            const livros = data || [];
            livros.push(livroCriado.toObject());
            funcoesArquivos.writeData('livros.json', livros).then(() => {
                return res.status(201).json({message: "Livro cadastrado com sucesso!!!", livroCriado:livroCriado});
            });
        })
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
    })
})

/**
 * @swagger
 * /livros:
 *   get:
 *     summary: Lista todos os livros
 *     description: Retorna uma lista paginada de livros no sistema. A operação é acessível para todos os usuários autenticados.
 *     tags:
 *       - Livros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limite
 *         in: query
 *         description: Número de livros a serem retornados por página (5, 10 ou 30)
 *         required: false
 *         schema:
 *           type: integer
 *           example: 5
 *       - name: pagina
 *         in: query
 *         description: Número da página para a listagem dos livros
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Lista de livros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Livro'
 *       400:
 *         description: Erro ao validar os parâmetros de entrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erro, o limite deve ser 5, 10 ou 30."
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor, erro: [mensagem do erro]"
 */
//rota para ver todos os livros
router.get("/", auth.verificaUser, (req,res) => {
    const limite = parseInt(req.query.limite) || 5;
    const pagina = parseInt(req.query.pagina) || 1;
    const skip = limite * (pagina - 1);

    if (![5, 10, 30].includes(limite)) {
        return res.status(400).json({message: "Erro, o limite deve ser 5, 10 ou 30."});
    }
    if (pagina <= 0) {
        return res.status(400).json({message: "Erro, a página deve ser maior que 0."});
    }

    Livro.find().skip(skip).limit(limite).then((livros) => {
        return res.status(200).json(livros);
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
    })
})

/**
 * @swagger
 * /livros/disponiveis:
 *   get:
 *     summary: Lista todos os livros disponíveis
 *     description: Retorna uma lista paginada de livros com o status "disponível" (status = 1). A operação é acessível para todos os usuários autenticados.
 *     tags:
 *       - Livros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limite
 *         in: query
 *         description: Número de livros a serem retornados por página (5, 10 ou 30)
 *         required: false
 *         schema:
 *           type: integer
 *           example: 5
 *       - name: pagina
 *         in: query
 *         description: Número da página para a listagem dos livros
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Lista de livros disponíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Livro'
 *       400:
 *         description: Erro ao validar os parâmetros de entrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erro, o limite deve ser 5, 10 ou 30."
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor, erro: [mensagem do erro]"
 */
//rota para ver todos os livros DISPONIVEIS (status = 1)
router.get("/disponiveis", auth.verificaUser, (req,res) => {
    const limite = parseInt(req.query.limite) || 5;
    const pagina = parseInt(req.query.pagina) || 1;
    const skip = limite * (pagina - 1);

    if (![5, 10, 30].includes(limite)) {
        return res.status(400).json({message: "Erro, o limite deve ser 5, 10 ou 30."});
    }
    if (pagina <= 0) {
        return res.status(400).json({message: "Erro, a página deve ser maior que 0."});
    }

    Livro.find({status: 1}).skip(skip).limit(limite).then((livros) => {
        return res.status(200).json(livros);
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
    })
})

/**
 * @swagger
 * /livros/{id}:
 *   put:
 *     summary: Atualiza os dados de um livro
 *     description: Atualiza as informações de um livro específico, como título, autor e status. Esta operação é restrita a administradores.
 *     tags:
 *       - Livros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do livro a ser atualizado
 *         required: true
 *         schema:
 *           type: string
 *           example: "605c72ef153207001f4f4e5"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "O Senhor dos Anéis"
 *               autor:
 *                 type: string
 *                 example: "J.R.R. Tolkien"
 *               status:
 *                 type: integer
 *                 example: 1
 *                 description: Status do livro (1 para disponível, 0 para indisponível)
 *     responses:
 *       200:
 *         description: Livro atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Livro atualizado com sucesso!!!"
 *                 livroAtualizado:
 *                   $ref: '#/components/schemas/Livro'
 *       400:
 *         description: Erro de validação de dados fornecidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erro, titulo invalido"
 *       404:
 *         description: Livro não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erro, livro nao encontrado"
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor, erro: [mensagem do erro]"
 */
//rota para atualizar dados de um livro (apenas admins)
router.put("/:id", auth.verificaAdmin, (req,res) => {
    if(!req.body.titulo || typeof req.body.titulo === undefined || req.body.titulo === null) {
        return res.status(400).json({message: "Erro, titulo invalido"});
    }

    if(!req.body.autor || typeof req.body.autor === undefined || req.body.autor === null) {
        return res.status(400).json({message: "Erro, autor invalido"});
    }

    if(!req.body.status || typeof req.body.status === undefined || req.body.status === null) {
        return res.status(400).json({message: "Erro, status invalido"});
    }

    Livro.findOne({_id: req.params.id}).then((livro) => {
        if(!livro) {
            return res.status(404).json({message: "Erro, livro nao encontrado"});
        }

        livro.titulo = req.body.titulo;
        livro.autor = req.body.autor;
        livro.status = req.body.status;

        livro.save().then((livroAtualizado) => {
            return res.status(200).json({message: "Livro atualizado com sucesso!!!", livroAtualizado:livroAtualizado});
        }).catch((erro) => {
            return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
        })
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
    })
})

/**
 * @swagger
 * /livros/{id}:
 *   delete:
 *     summary: Deleta um livro
 *     description: Deleta um livro específico. Esta operação é restrita a administradores.
 *     tags:
 *       - Livros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do livro a ser deletado
 *         required: true
 *         schema:
 *           type: string
 *           example: "605c72ef153207001f4f4e5"
 *     responses:
 *       200:
 *         description: Livro deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Livro deletado com sucesso!!!"
 *       404:
 *         description: Livro não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erro, livro nao encontrado"
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor, erro: [mensagem do erro]"
 */
//rota para deletar um livro (apenas admins)
router.delete("/:id", auth.verificaAdmin, (req,res) => {
    Livro.deleteOne({_id: req.params.id}).then(() => {
        return res.status(200).json({message: "Livro deletado com sucesso!!!"});
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
    })
})

module.exports = router;