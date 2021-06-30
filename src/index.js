const { ApolloServer, gql } = require('apollo-server')
const { v1: uid }= require("uuid")
const mongoose = require("mongoose")
const {DBUrl} = require("./utils")
const Book = require("./models/book")
const Author = require('./models/author')

// let authors = [
//   {
//     name: 'Robert Martin',
//     id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
//     born: 1952,
//   },
//   {
//     name: 'Martin Fowler',
//     id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
//     born: 1963
//   },
//   {
//     name: 'Fyodor Dostoevsky',
//     id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
//     born: 1821
//   },
//   { 
//     name: 'Joshua Kerievsky', // birthyear not known
//     id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
//   },
//   { 
//     name: 'Sandi Metz', // birthyear not known
//     id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
//   },
// ]

// let books = [
//   {
//     title: 'Clean Code',
//     published: 2008,
//     author: 'Robert Martin',
//     id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
//     genres: ['refactoring']
//   },
//   {
//     title: 'Agile software development',
//     published: 2002,
//     author: 'Robert Martin',
//     id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
//     genres: ['agile', 'patterns', 'design']
//   },
//   {
//     title: 'Refactoring, edition 2',
//     published: 2018,
//     author: 'Martin Fowler',
//     id: "afa5de00-344d-11e9-a414-719c6709cf3e",
//     genres: ['refactoring']
//   },
//   {
//     title: 'Refactoring to patterns',
//     published: 2008,
//     author: 'Joshua Kerievsky',
//     id: "afa5de01-344d-11e9-a414-719c6709cf3e",
//     genres: ['refactoring', 'patterns']
//   },  
//   {
//     title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
//     published: 2012,
//     author: 'Sandi Metz',
//     id: "afa5de02-344d-11e9-a414-719c6709cf3e",
//     genres: ['refactoring', 'design']
//   },
//   {
//     title: 'Crime and punishment',
//     published: 1866,
//     author: 'Fyodor Dostoevsky',
//     id: "afa5de03-344d-11e9-a414-719c6709cf3e",
//     genres: ['classic', 'crime']
//   },
//   {
//     title: 'The Demon ',
//     published: 1872,
//     author: 'Fyodor Dostoevsky',
//     id: "afa5de04-344d-11e9-a414-719c6709cf3e",
//     genres: ['classic', 'revolution']
//   },
// ]

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
  }
`

const resolvers = {
  Query: {
      bookCount: () => book.collection.countDocument(),
      authorCount: () => author.collection.countDocument(),
      allBooks: (root, args) => {
         if(!args.author && !args.genre) return books

         if(args.author){
                return args.genre? books.filter(book => book.author === args.author)
                    .filter(book => book.genres.includes(args.genre)) 
                    : books.filter(book => book.author === args.author)
         }
         else return books.filter(book => book.genres.includes(args.genre))
         

        },
      allAuthors: () => 
        Author.find({}),
      findAuthor : (root, args) => {
            
      } 
  },
  Mutation:{
    addBook : (root, args) => {
        const authorExist = authors.find(author => author.name === args.author)
        if(!authorExist){

            authors = authors.concat({
                    name: args.author,
                    id:uid()
                })  
        }
        const book = {...args,id:uid()}
        books = books.concat(book)
        return book
    },
    editAuthor: (root, args) => {

        if(!args.setBornTo) return null
        const authorExist = authors.find(author => author.name === args.name)
        if(!authorExist) return null
        let  authorData = {...args}
        authors = authors.map(author => {
            if(author.name === authorData.name){
                author.born = args.setBornTo
                authorData = author
            }
            return author
        })

        return authorData
    }
  },

  Author: {
      bookCount: (root) => books.filter(book => book.author === root.name).length,
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
