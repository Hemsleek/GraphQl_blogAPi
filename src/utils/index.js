require("dotenv").config()

exports.DBUrl = process.env.MONGO_URL
exports.tokenSecret = process.env.TOKEN_SECRET