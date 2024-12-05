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