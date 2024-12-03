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

//rota para ver TODOS os emprestimos (apenas admins)
router.get("/", auth.verificaAdmin, async (req,res) => {
    try {
        const emprestimos = await Emprestimo.find();
        return res.status(200).json(emprestimos);
    } catch(erro) {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro.message});
    }
})

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

//rota para usuarios comuns verem seus proprios emprestimos
router.get("/meus", auth.verificaUser, async (req,res) => {
    const user = req.user;

    try {
        const emprestimos = await Emprestimo.find({idUsuario: user._id});
        return res.status(200).json(emprestimos);
    } catch(erro) {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro.message});
    }
})

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