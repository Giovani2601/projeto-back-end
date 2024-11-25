const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Emprestimo = new Schema({
    idUsuario: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
        required: true
    },
    idLivro: {
        type: Schema.Types.ObjectId,
        ref: "livros",
        required: true
    },
    dataEmprestimo: {
        type: Date,
        default: Date.now
    }
})

mongoose.model("emprestimos", Emprestimo);