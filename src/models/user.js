const {Schema, model} = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const userSchema = new Schema({
    username:{
        type:String,
        unique:true,
        minLength:3,
        required:true
    },
    favoriteGenre:{
        type:String,
        required:true
    }

})

userSchema.plugin(uniqueValidator)

module.exports = model('User', userSchema)