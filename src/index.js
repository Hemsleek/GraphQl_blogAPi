const { ApolloServer, gql, UserInputError, AuthenticationError } = require('apollo-server')
const { v1: uid }= require("uuid")
const mongoose = require("mongoose")
const {DBUrl, tokenSecret} = require("./utils")
const Book = require("./models/book")
const Author = require('./models/author')
const User = require('./models/user')
const jwt = require("jsonwebtoken")
const user = require('./models/user')


mongoose.connect(DBUrl,{
  useUnifiedTopology:true,
  useCreateIndex:true,
  useFindAndModify:true,
  useUnifiedTopology:true
})

const db = mongoose.connection
db.on("error", () => {console.log("error connecting to db");})
db.once("open",() => { console.log("Db connceted successfully");})


const typeDefs = gql`
  type User{
    username:String!
    favoriteGenre:String!
    id:ID!
  }

  type Token{
    value:String!
  }

  type Book{
    title:String!
    published:Int!
    author:Author!
    id:ID!
    genres:[String]!
  }

  type Author{
    name:String!
    id:ID!
    born:String
    bookCount:Int!
  }

  type Query {
      bookCount: Int!
      authorCount: Int!
      allBooks(author:String,genre:String):[Book!]!
      allAuthors: [Author!]!
      findAuthor(name:String!):Author
      me:User
  }

  type Mutation{
      addBook(
        title:String!
        published:Int!
        author:String!
        genres:[String]!
      ):Book

      editAuthor(
        name:String!
        setBornTo:Int
      ):Author,

      createUser(
        username:String!
        favouriteGenre:String!
      ):User,

      login(
        username:String!
        password:String!
      ):Token
  }
`

const resolvers = {
  Query: {
      bookCount: () => Book.collection.countDocuments(),
      authorCount: () => Author.collection.countDocuments(),
      allBooks: (root, args) => {
         if(!args.author && !args.genre) return books

         if(args.author){
                return args.genre? books.filter(book => book.author === args.author)
                    .filter(book => book.genres.includes(args.genre)) 
                    : books.filter(book => book.author === args.author)
         }
         else return books.filter(book => book.genres.includes(args.genre))
         

        },
      allAuthors: () => Author.find({}),
      findAuthor : (root, args) => {
          return Author.findOne(args)  
      } ,
      me:  (root, args, {currentUser}) => {
          return currentUser
      }
      
  },
  Mutation:{
    addBook : async(root, args, context) => {
        const currentUser = context.currentUser
        if(!currentUser) {
          throw new AuthenticationError("not authenticated")
        }
        try {
          const authorExist = await Author.findOne({name:args.author})
        if(!authorExist){

            let freshAuthor= new Author({
              name:args.author,
            })

           await freshAuthor.save() 
        }
        const book = new Book({...args})
        return book.save()
        } catch (error) {
          
        }
        
    },
    editAuthor: async(root, args,context) => {
      if (!context.currentUser) {
        throw new AuthenticationError("not authenticated")
      }
        if(!args.setBornTo) return null
        const authorExist = await Author.find({name:args.name})
        // if(!authorExist) return null
        authorExist.born = args.setBornTo
        try {
         await authorExist.save()
          
        } catch (error) {
           throw new UserInputError(error.message,{
             invalidArgs:args,
           })
        }

        return authorExist
  },
  createUser:(root,args) => {
      const newUser = new User({...args})
      return newUser.save()
        .catch(err => {
          throw new UserInputError(err.message, {
            invalidArgs:args
          })
        })
  },
  login: async (root,args) => {
      const user = await User.findOne({username: args.username})

      if(!user || args.password!== "password") throw new UserInputError('wrong credentials')

      const userToken =  jwt.sign({
        username: user.username,
        id:user._id
      }, tokenSecret)
      return {value: userToken}
  }
},
  Author: {
      bookCount: async(root) => {
        let authorBooks = await Book.find({author:root.name})
        return authorBooks.length
      }
  }

  }

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context:async({req}) => {
    let auth = req? req.headers.authorization : null
    if(auth && auth.toLowerCase().startsWith('Bearer')){
      auth = auth.substring(7)
      const decodedToken = jwt.verify(auth, tokenSecret)
    }
    const currentUser = await User.findById(decodedToken.id)

    return {currentUser}
  }
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
