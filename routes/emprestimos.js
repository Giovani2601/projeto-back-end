const express = require("express");
const router = express.Router();
const auth = require("../auth/auth");
const mongoose = require("mongoose");
require("../models/Usuario");
const Usuario = mongoose.model("usuarios");
require("../models/Livro");
const Livro = mongoose.model("livros");
require("../models/Emprestimo");
const Emprestimo = mongoose.model("emprestimos");

//funcao para verificar se a quantidade de emprestimos de um usuario e valida
async function verificaEmprestimos(userId) {
    try {
        const emprestimos = await Emprestimo.find({ idUsuario: userId });
        return emprestimos.length < 3;
    } catch (erro) {
        throw new Error("Erro ao verificar empréstimos: " + erro.message);
    }
}

/**
 * @swagger
 * /emprestimos:
 *   post:
 *     summary: Cria um novo empréstimo
 *     description: Cria um novo empréstimo de livro para um usuário. Esta operação é restrita a administradores.
 *     tags:
 *       - Empréstimos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idUsuario:
 *                 type: string
 *                 description: ID do usuário que está pegando o empréstimo
 *                 example: "605c72ef153207001f4f4e5"
 *               idLivro:
 *                 type: string
 *                 description: ID do livro que está sendo emprestado
 *                 example: "605c72ef153207001f4f4e6"
 *     responses:
 *       201:
 *         description: Empréstimo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Emprestimo criado com sucesso!!!"
 *                 emprestimoCriado:
 *                   type: object
 *                   properties:
 *                     idUsuario:
 *                       type: string
 *                       example: "605c72ef153207001f4f4e5"
 *                     idLivro:
 *                       type: string
 *                       example: "605c72ef153207001f4f4e6"
 *       400:
 *         description: Erro no empréstimo (usuário já possui 3 empréstimos ou livro indisponível)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erro, um usuario pode ter ate no maximo 3 emprestimos"
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
//rota para criar emprestimos (apenas admins)
router.post("/", auth.verificaAdmin, async (req,res) => {
    try {
        const emprestimoValido = await verificaEmprestimos(req.body.idUsuario);

        if(!emprestimoValido) {
            return res.status(400).json({message: "Erro, um usuario pode ter ate no maximo 3 emprestimos"});
        }

        const livro = await Livro.findOne({_id: req.body.idLivro});

        if(livro.status !== 1) {
            return res.status(400).json({message: "Erro, este livro esta indisponivel"});
        }

        const novoEmprestimo = {
            idUsuario: req.body.idUsuario,
            idLivro: req.body.idLivro
        }

        livro.status = 0;
        await livro.save();

        const emprestimoCriado = await new Emprestimo(novoEmprestimo).save();
        return res.status(201).json({message: "Emprestimo criado com sucesso!!!", emprestimoCriado:emprestimoCriado});
    } catch(erro) {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro.message});
    }
})

/**
 * @swagger
 * /emprestimos:
 *   get:
 *     summary: Retorna todos os empréstimos
 *     description: Retorna uma lista de todos os empréstimos registrados. Esta operação é restrita a administradores.
 *     tags:
 *       - Empréstimos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         required: false
 *         schema:
 *           type: integer
 *           default: 5
 *           enum:
 *             - 5
 *             - 10
 *             - 30
 *         description: Número máximo de registros por página (5, 10 ou 30)
 *       - in: query
 *         name: pagina
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página a ser exibida (começando de 1)
 *     responses:
 *       200:
 *         description: Lista de empréstimos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idUsuario:
 *                     type: string
 *                     example: "605c72ef153207001f4f4e5"
 *                   idLivro:
 *                     type: string
 *                     example: "605c72ef153207001f4f4e6"
 *                   dataEmprestimo:
 *                     type: string
 *                     example: "2024-12-07T12:00:00Z"
 *       400:
 *         description: Erro nos parâmetros de consulta (limite ou página)
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
//rota para ver TODOS os emprestimos (apenas admins)
router.get("/", auth.verificaAdmin, async (req,res) => {
    const limite = parseInt(req.query.limite) || 5;
    const pagina = parseInt(req.query.pagina) || 1;
    const skip = limite * (pagina - 1);

    if (![5, 10, 30].includes(limite)) {
        return res.status(400).json({message: "Erro, o limite deve ser 5, 10 ou 30."});
    }
    if (pagina <= 0) {
        return res.status(400).json({message: "Erro, a página deve ser maior que 0."});
    }

    try {
        const emprestimos = await Emprestimo.find().skip(skip).limit(limite);
        return res.status(200).json(emprestimos);
    } catch(erro) {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro.message});
    }
})

/**
 * @swagger
 * /emprestimos/{id}:
 *   delete:
 *     summary: Exclui um empréstimo
 *     description: Exclui um empréstimo específico, alterando o status do livro de volta para disponível. Esta operação é restrita a administradores.
 *     tags:
 *       - Empréstimos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do empréstimo a ser excluído
 *     responses:
 *       200:
 *         description: Empréstimo excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Emprestimo deletado com sucesso!!!"
 *       400:
 *         description: Erro, empréstimo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erro, empréstimo não encontrado"
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
//rota para excluir qualquer emprestimo (apenas admins)
router.delete("/:id", auth.verificaAdmin, async (req,res) => {
    try {
        const emprestimo = await Emprestimo.findOne({_id: req.params.id});

        const livro = await Livro.findOne({_id: emprestimo.idLivro});

        livro.status = 1;
        await livro.save();

        await Emprestimo.deleteOne({_id: req.params.id});
        return res.status(200).json({message: "Emprestimo deletado com sucesso!!!"});
    } catch(erro) {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro.message});
    }
})

/**
 * @swagger
 * /emprestimos/meus:
 *   get:
 *     summary: Visualiza os empréstimos do usuário
 *     description: Retorna os empréstimos feitos pelo usuário autenticado. A operação está disponível apenas para usuários autenticados.
 *     tags:
 *       - Empréstimos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         required: false
 *         schema:
 *           type: integer
 *           example: 5
 *         description: Número de itens por página. Pode ser 5, 10 ou 30.
 *       - in: query
 *         name: pagina
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Número da página.
 *     responses:
 *       200:
 *         description: Lista de empréstimos do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idUsuario:
 *                     type: string
 *                   idLivro:
 *                     type: string
 *                   dataEmprestimo:
 *                     type: string
 *                     format: date
 *                   dataDevolucao:
 *                     type: string
 *                     format: date
 *       400:
 *         description: Parâmetros de query inválidos
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
//rota para usuarios comuns verem seus proprios emprestimos
router.get("/meus", auth.verificaUser, async (req,res) => {
    const limite = parseInt(req.query.limite) || 5;
    const pagina = parseInt(req.query.pagina) || 1;
    const skip = limite * (pagina - 1);

    if (![5, 10, 30].includes(limite)) {
        return res.status(400).json({message: "Erro, o limite deve ser 5, 10 ou 30."});
    }
    if (pagina <= 0) {
        return res.status(400).json({message: "Erro, a página deve ser maior que 0."});
    }

    const user = req.user;

    try {
        const emprestimos = await Emprestimo.find({idUsuario: user._id}).skip(skip).limit(limite);
        return res.status(200).json(emprestimos);
    } catch(erro) {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro.message});
    }
})

/**
 * @swagger
 * /emprestimos/meus/{id}:
 *   delete:
 *     summary: Exclui o empréstimo do usuário
 *     description: Permite que o usuário exclua um de seus próprios empréstimos. A operação está disponível apenas para usuários autenticados.
 *     tags:
 *       - Empréstimos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do empréstimo a ser excluído.
 *     responses:
 *       200:
 *         description: Empréstimo excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Empréstimo deletado com sucesso!!!"
 *       400:
 *         description: Erro ao tentar excluir o empréstimo, o usuário não tem permissão ou o empréstimo não pertence ao usuário.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erro, empréstimo não encontrado ou não pertence ao usuário."
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
//rota para usuarios comuns excluirem seus proprios emprestimos
router.delete("/meus/:id", auth.verificaUser, async (req,res) => {
    const user = req.user;

    try {
        const emprestimo = await Emprestimo.findOne({_id: req.params.id});

        const livro = await Livro.findOne({_id: emprestimo.idLivro});

        livro.status = 1;
        await livro.save();

        await Emprestimo.deleteOne({_id: req.params.id, idUsuario: user._id});
        return res.status(200).json({message: "Emprestimo deletado com sucesso!!!"});
    } catch(erro) {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro.message});
    }
})

module.exports = router;