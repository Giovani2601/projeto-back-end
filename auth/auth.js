const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();
const SECRET = process.env.SECRET;
require("../models/Usuario");
const Usuario = mongoose.model("usuarios");

function verificaAdmin(req,res,next) {
    const token = req.headers.authorization;

    if(!token) {
        return res.status(404).json({message: "Erro, token nao encontrado"});
    }

    jwt.verify(token, SECRET, (err, decoded) => {
        if(err) {
            return res.status(400).json({message: "Erro ao verificar token"});
        }

        Usuario.findOne({_id: decoded.userId}).then((usuario) => {
            if(!usuario) {
                return res.status(404).json({message: "Erro, nenhum usuario encontrado com este token"});
            }

            if(usuario.isAdmin !== 1) {
                return res.status(401).json({message: "Erro, para utilizar esta rota, é necessário uma conta de admin"});
            }

            req.user = usuario;
            next();
        }).catch((erro) => {
            return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
        })
    })
}

function verificaUser(req,res,next) {
    const token = req.headers.authorization;

    if(!token) {
        return res.status(404).json({message: "Erro, token nao encontrado"});
    }

    jwt.verify(token, SECRET, (err, decoded) => {
        if(err) {
            return res.status(400).json({message: "Erro ao verificar token"});
        }

        Usuario.findOne({_id: decoded.userId}).then((usuario) => {
            if(!usuario) {
                return res.status(404).json({message: "Erro, nenhum usuario encontrado com este token"});
            }

            req.user = usuario;
            next();
        }).catch((erro) => {
            return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro});
        })
    })
}

module.exports = {
    verificaAdmin,
    verificaUser
}