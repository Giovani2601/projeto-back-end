const express = require("express");
const router = express();
const mongoose = require("mongoose");
require("../models/Livro");
const Livro = mongoose.model("livros");
const auth = require("../auth/auth");

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
        return res.status(201).json({message: "Livro cadastrado com sucesso!!!", livroCriado:livroCriado});
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
    })
})

//rota para ver todos os livros
router.get("/", auth.verificaUser, (req,res) => {
    Livro.find().then((livros) => {
        return res.status(200).json(livros);
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
    })
})

//rota para ver todos os livros DISPONIVEIS (status = 1)
router.get("/disponiveis", auth.verificaUser, (req,res) => {
    Livro.find({status: 1}).then((livros) => {
        return res.status(200).json(livros);
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
    })
})

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

//rota para deletar um livro (apenas admins)
router.delete("/:id", auth.verificaAdmin, (req,res) => {
    Livro.deleteOne({_id: req.params.id}).then(() => {
        return res.status(200).json({message: "Livro deletado com sucesso!!!"});
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
    })
})

module.exports = router;