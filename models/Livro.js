const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Livro = new Schema({
    titulo: {
        type: String,
        required: true
    },
    autor: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 1
    }
})

mongoose.model("livros", Livro);