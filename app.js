const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const PORT = 3000;
require("dotenv").config();
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const rotaUsuarios = require("./routes/usuarios");
const rotaLivros = require("./routes/livros");
const rotaEmprestimos = require("./routes/emprestimos");
require("./models/Usuario");
const Usuario = mongoose.model("usuarios");
const bcrypt = require("bcryptjs");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

//config
    //body-parser
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(bodyParser.json());

    //mongoDB
    mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.yyzx0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).then(() => {
        console.log("Conectado ao banco de dados com sucesso!!!");
    }).catch((erro) => {
        console.log("Erro ao se conectar ao banco de dados, erro: "+erro);
    })

    //swagger
    const swaggerDefinition = {
        openapi: "3.0.0",
        info: {
            title: "Sistema de Gerenciamento de Empréstimos de Livros",
            version: "1.0.0",
            description: "API para gerenciar empréstimos de livros, com autenticação e controle de acesso"
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Servidor local"
            }
        ],
        components: {
            schemas: {
                Usuario: {
                    type: "object",
                    properties: {
                        nome: { type: "string", description: "Nome do usuário", example: "João Silva" },
                        email: { type: "string", description: "E-mail do usuário", example: "joao@example.com" },
                        senha: { type: "string", description: "Senha do usuário", example: "123456" },
                        isAdmin: { type: "number", description: "Define se o usuário é administrador (1 para sim, 0 para não)", example: 1 }
                    },
                    required: ["nome", "email", "senha"]
                },
                Livro: {
                    type: "object",
                    properties: {
                        titulo: { type: "string", description: "Título do livro", example: "O Senhor dos Anéis" },
                        autor: { type: "string", description: "Autor do livro", example: "J.R.R. Tolkien" },
                        status: { type: "number", description: "Disponibilidade do livro (1 para disponível, 0 para indisponível)", example: 1 }
                    },
                    required: ["titulo", "autor"]
                },
                Emprestimo: {
                    type: "object",
                    properties: {
                        idUsuario: { type: "string", description: "ID do usuário que fez o empréstimo", example: "641e4a9c8a12bc7fa9e8d2a1" },
                        idLivro: { type: "string", description: "ID do livro emprestado", example: "641e4a9c8a12bc7fa9e8d2a2" },
                        dataEmprestimo: { type: "string", format: "date-time", description: "Data do empréstimo", example: "2024-12-01T12:34:56Z" }
                    },
                    required: ["idUsuario", "idLivro"]
                }
            }
        }
    };

    const options = {
        swaggerDefinition,
        apis: ["./routes/*.js"]
    };

    const swaggerSpec = swaggerJsDoc(options);
    app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

//rotas
app.use("/usuarios", rotaUsuarios);
app.use("/livros", rotaLivros);
app.use("/emprestimos", rotaEmprestimos);

app.get("/install", async (req,res) => {
    try {
        const adminExistente = await Usuario.findOne({isAdmin: 1});

        if(adminExistente) {
            return res.status(400).json({message: "Erro, ja existe um usuario admin no sistema"});
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync("admin", salt);

        const admin = new Usuario({
            nome: "admin",
            email: "admin@admin.com",
            senha: hash,
            isAdmin: 1
        })

        const adminCriado = await admin.save();

        return res.status(201).json({message: "Conta de admin criada com sucesso!!!", adminCriado:adminCriado});
    } catch (erro) {
        return res.status(500).json({message: "Erro interno no servidor, erro: "+erro.message});
    }
})

app.get("/", (req,res) => {
    res.send("Ola mundo");
})

//server
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
})