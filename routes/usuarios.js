const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
require("../models/Usuario");
const Usuario = mongoose.model("usuarios");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET = process.env.SECRET;
const auth = require("../auth/auth");

//rota de criacao de conta
router.post("/", (req,res) => {
    if(!req.body.nome || typeof req.body.nome === undefined || req.body.nome === null) {
        return res.status(400).json({message: "Erro, nome invalido"});
    }

    if(!req.body.email || typeof req.body.email === undefined || req.body.email === null) {
        return res.status(400).json({message: "Erro, email invalido"});
    }

    if(!req.body.senha || typeof req.body.senha === undefined || req.body.senha === null) {
        return res.status(400).json({message: "Erro, senha invalida"});
    }

    //confirmacao de senha
    if(req.body.senha2 !== req.body.senha) {
        return res.status(400).json({message: "Erro, as senhas devem coincidir"});
    }

    if(req.body.senha.length < 4) {
        return res.status(400).json({message: "Erro, senha muito curta"})
    }

    const salt = bcryptjs.genSaltSync(10);
    const hash = bcryptjs.hashSync(req.body.senha, salt);

    const novoUsuario = {
        nome: req.body.nome,
        email: req.body.email,
        senha: hash
    }

    new Usuario(novoUsuario).save().then((usuarioCriado) => {
        return res.status(201).json({message: "Usuario criado com sucesso!!!", usuarioCriado:usuarioCriado});
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro})
    })
})

//rota de login
router.post("/login", (req,res) => {
    if(!req.body.email || typeof req.body.email === undefined || req.body.email === null) {
        return res.status(400).json({message: "Erro, email invalido"});
    }

    if(!req.body.senha || typeof req.body.senha === undefined || req.body.senha === null) {
        return res.status(400).json({message: "Erro, senha invalida"});
    }

    Usuario.findOne({email:req.body.email}).then((usuario) => {
        if(!usuario) {
            return res.status(404).json({message: "Nenhum usuario encontrado com este email"});
        }

        bcryptjs.compare(req.body.senha, usuario.senha, (err, batem) => {
            if(err) {
                return res.status(401).json({message: "Erro ao verificar senha"});
            }

            if(!batem) {
                return res.status(401).json({message: "Erro, senha incorreta"})
            } else {
                const token = jwt.sign({userId: usuario._id}, SECRET, {expiresIn: "1h"});
                return res.status(200).json({message: "Login realizado com sucesso!!!", token:token});
            }
        })
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro})
    })
})

//rota para ver todos os usuarios cadastrados (apenas admins)
router.get("/", auth.verificaAdmin, (req,res) => {
    const limite = parseInt(req.query.limite) || 5;
    const pagina = parseInt(req.query.pagina) || 1;
    const skip = limite * (pagina - 1);

    if (![5, 10, 30].includes(limite)) {
        return res.status(400).json({message: "Erro, o limite deve ser 5, 10 ou 30."});
    }
    if (pagina <= 0) {
        return res.status(400).json({message: "Erro, a página deve ser maior que 0."});
    }

    Usuario.find().skip(skip).limit(limite).then((usuarios) => {
        return res.status(200).json(usuarios);
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro})
    })
})

//rota para criar novas contas de admin (apenas admins)
router.post("/admin", auth.verificaAdmin, (req,res) => {
    if(!req.body.nome || typeof req.body.nome === undefined || req.body.nome === null) {
        return res.status(400).json({message: "Erro, nome invalido"});
    }

    if(!req.body.email || typeof req.body.email === undefined || req.body.email === null) {
        return res.status(400).json({message: "Erro, email invalido"});
    }

    if(!req.body.senha || typeof req.body.senha === undefined || req.body.senha === null) {
        return res.status(400).json({message: "Erro, senha invalida"});
    }

    //confirmacao de senha
    if(req.body.senha2 !== req.body.senha) {
        return res.status(400).json({message: "Erro, as senhas devem coincidir"});
    }

    if(req.body.senha.length < 4) {
        return res.status(400).json({message: "Erro, senha muito curta"})
    }

    const salt = bcryptjs.genSaltSync(10);
    const hash = bcryptjs.hashSync(req.body.senha, salt);

    const novoAdmin = {
        nome: req.body.nome,
        email: req.body.email,
        senha: hash,
        isAdmin: 1
    }

    new Usuario(novoAdmin).save().then((adminCriado) => {
        return res.status(201).json({message: "Novo admin criado com sucesso!!!", adminCriado:adminCriado});
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro})
    })
})

//rota para alterar dados de outros usuarios (apenas admins)
router.put("/admin/:id", auth.verificaAdmin, (req,res) => {
    if(!req.body.nome || typeof req.body.nome === undefined || req.body.nome === null) {
        return res.status(400).json({message: "Erro, nome invalido"});
    }

    if(!req.body.email || typeof req.body.email === undefined || req.body.email === null) {
        return res.status(400).json({message: "Erro, email invalido"});
    }

    if(!req.body.senha || typeof req.body.senha === undefined || req.body.senha === null) {
        return res.status(400).json({message: "Erro, senha invalida"});
    }

    //confirmacao de senha
    if(req.body.senha2 !== req.body.senha) {
        return res.status(400).json({message: "Erro, as senhas devem coincidir"});
    }

    if(req.body.senha.length < 4) {
        return res.status(400).json({message: "Erro, senha muito curta"})
    }

    Usuario.findOne({_id: req.params.id}).then((usuario) => {
        if(!usuario) {
            return res.status(404).json({message: "Erro, usuario a alterar nao encontrado"});
        }

        const salt = bcryptjs.genSaltSync(10);
        const hash = bcryptjs.hashSync(req.body.senha, salt);

        usuario.nome = req.body.nome;
        usuario.email = req.body.email;
        usuario.senha = hash;

        usuario.save().then((usuarioAlterado) => {
            return res.status(200).json({message: "Usuario alterado com sucesso!!!", usuarioAlterado: usuarioAlterado});
        }).catch((erro) => {
            return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro})
        })
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro})
    })
})

//rota para excluir usuarios (apenas admins)
router.delete("/admin/:id", auth.verificaAdmin, (req,res) => {
    Usuario.deleteOne({_id: req.params.id}).then(() => {
        return res.status(200).json({message: "Usuario excluido com sucesso!!!"});
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro})
    })
})

//rota para alterar os proprios dados
router.put("/", auth.verificaUser, (req,res) => {
    const user = req.user;

    if(!req.body.nome || typeof req.body.nome === undefined || req.body.nome === null) {
        return res.status(400).json({message: "Erro, nome invalido"});
    }

    if(!req.body.email || typeof req.body.email === undefined || req.body.email === null) {
        return res.status(400).json({message: "Erro, email invalido"});
    }

    if(!req.body.senha || typeof req.body.senha === undefined || req.body.senha === null) {
        return res.status(400).json({message: "Erro, senha invalida"});
    }

    //confirmacao de senha
    if(req.body.senha2 !== req.body.senha) {
        return res.status(400).json({message: "Erro, as senhas devem coincidir"});
    }

    if(req.body.senha.length < 4) {
        return res.status(400).json({message: "Erro, senha muito curta"})
    }

    Usuario.findOne({_id: user._id}).then((usuario) => {
        if(!usuario) {
            return res.status(404).json({message: "Erro, dados nao encontrados"});
        }

        const salt = bcryptjs.genSaltSync(10);
        const hash = bcryptjs.hashSync(req.body.senha, salt);

        usuario.nome = req.body.nome;
        usuario.email = req.body.email;
        usuario.senha = hash;

        usuario.save().then((usuarioAlterado) => {
            return res.status(200).json({message: "Dados alterados com sucesso!!!", usuarioAlterado:usuarioAlterado});
        }).catch((erro) => {
            return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro})
        })
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro})
    })
})

module.exports = router;