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

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Criação de uma nova conta de usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do usuário
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *                 example: joao.silva@email.com
 *               senha:
 *                 type: string
 *                 description: Senha do usuário (mínimo 4 caracteres)
 *                 example: senha123
 *               senha2:
 *                 type: string
 *                 description: Confirmação da senha
 *                 example: senha123
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario criado com sucesso!!!
 *                 usuarioCriado:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Dados inválidos enviados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro, as senhas devem coincidir
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor"
 */
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

/**
 * @swagger
 * /usuarios/login:
 *   post:
 *     summary: Realiza o login de um usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *                 example: joao.silva@email.com
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login realizado com sucesso!!!
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Dados inválidos enviados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro, senha invalida
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Nenhum usuario encontrado com este email
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro, senha incorreta
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor"
 */
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

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista todos os usuários cadastrados (Apenas admins)
 *     tags: [Usuários]
 *     security:
 *       - authorization: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           enum: [5, 10, 30]
 *           default: 5
 *         description: Número de usuários a serem retornados por página.
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página a ser retornada.
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID único do usuário
 *                     example: 64adf0e1f5b65a0012ef6e4f
 *                   nome:
 *                     type: string
 *                     description: Nome do usuário
 *                     example: João Silva
 *                   email:
 *                     type: string
 *                     description: Email do usuário
 *                     example: joao.silva@email.com
 *       400:
 *         description: Parâmetros de consulta inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro, o limite deve ser 5, 10 ou 30.
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor"
 */
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

/**
 * @swagger
 * /usuarios/admin:
 *   post:
 *     summary: Cria uma nova conta de administrador (Apenas admins)
 *     tags: [Usuários]
 *     security:
 *       - authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do administrador
 *                 example: Maria Admin
 *               email:
 *                 type: string
 *                 description: Email do administrador
 *                 example: maria.admin@email.com
 *               senha:
 *                 type: string
 *                 description: Senha do administrador
 *                 example: senha123
 *               senha2:
 *                 type: string
 *                 description: Confirmação da senha
 *                 example: senha123
 *     responses:
 *       201:
 *         description: Conta de administrador criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Novo admin criado com sucesso!!!
 *                 adminCriado:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID único do administrador
 *                       example: 64adf0e1f5b65a0012ef6e4f
 *                     nome:
 *                       type: string
 *                       description: Nome do administrador
 *                       example: Maria Admin
 *                     email:
 *                       type: string
 *                       description: Email do administrador
 *                       example: maria.admin@email.com
 *                     isAdmin:
 *                       type: integer
 *                       description: Indica se o usuário é administrador
 *                       example: 1
 *       400:
 *         description: Dados inválidos fornecidos na requisição
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro, as senhas devem coincidir
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor"
 */
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

/**
 * @swagger
 * /usuarios/admin/{id}:
 *   put:
 *     summary: Altera dados de um usuário (Apenas admins)
 *     tags: [Usuários]
 *     security:
 *       - authorization: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do usuário a ser alterado
 *         schema:
 *           type: string
 *           example: 64adf0e1f5b65a0012ef6e4f
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do usuário
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *                 example: joao.silva@email.com
 *               senha:
 *                 type: string
 *                 description: Nova senha do usuário
 *                 example: novaSenha123
 *               senha2:
 *                 type: string
 *                 description: Confirmação da nova senha
 *                 example: novaSenha123
 *     responses:
 *       200:
 *         description: Usuário alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário alterado com sucesso!!!
 *                 usuarioAlterado:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID do usuário alterado
 *                       example: 64adf0e1f5b65a0012ef6e4f
 *                     nome:
 *                       type: string
 *                       description: Nome do usuário alterado
 *                       example: João Silva
 *                     email:
 *                       type: string
 *                       description: Email do usuário alterado
 *                       example: joao.silva@email.com
 *       400:
 *         description: Dados inválidos fornecidos na requisição
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro, as senhas devem coincidir
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro, usuário a alterar não encontrado
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor"
 */
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

/**
 * @swagger
 * /usuarios/admin/{id}:
 *   delete:
 *     summary: Exclui um usuário (Apenas admins)
 *     tags: [Usuários]
 *     security:
 *       - authorization: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do usuário a ser excluído
 *         schema:
 *           type: string
 *           example: 64adf0e1f5b65a0012ef6e4f
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário excluído com sucesso!!!
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro, usuário não encontrado
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor"
 */
//rota para excluir usuarios (apenas admins)
router.delete("/admin/:id", auth.verificaAdmin, (req,res) => {
    Usuario.deleteOne({_id: req.params.id}).then(() => {
        return res.status(200).json({message: "Usuario excluido com sucesso!!!"});
    }).catch((erro) => {
        return res.status(500).json({errorMessage: "Erro interno no servidor, erro: "+erro})
    })
})

/**
 * @swagger
 * /usuarios:
 *   put:
 *     summary: Altera os dados do usuário autenticado
 *     tags: [Usuários]
 *     security:
 *       - authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 example: "joao.silva@email.com"
 *               senha:
 *                 type: string
 *                 example: "novaSenha123"
 *               senha2:
 *                 type: string
 *                 example: "novaSenha123"
 *     responses:
 *       200:
 *         description: Dados alterados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Dados alterados com sucesso!!!
 *                 usuarioAlterado:
 *                   type: object
 *                   properties:
 *                     nome:
 *                       type: string
 *                       example: "João Silva"
 *                     email:
 *                       type: string
 *                       example: "joao.silva@email.com"
 *       400:
 *         description: Erro, dados inválidos ou senhas não coincidem
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro, nome invalido
 *       404:
 *         description: Dados não encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro, dados não encontrados
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   example: "Erro interno no servidor"
 */
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