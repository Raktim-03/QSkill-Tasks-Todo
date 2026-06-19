const express = require("express")
const app = express()
const pool = require("./db")

app.use(express.json())

//create a book 
app.post("/books", async (req,res)=>{
    try{
        const {
            title,
            author,
            genre,
            publication_year
        } = req.body

        const sql = `
        insert into books(title, 
        author,
        genre, 
        publication_year)

        values($1, $2, $3, $4)
        returning *
        `;

        const result = await pool.query(sql,[title, author, genre, publication_year])
        res.json(result.rows[0])

    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})


//get all books 
app.get("/books", async (req,res)=>{
    try{
        const sql = `select * from books`
        const result = await pool.query(sql)
        res.json(result.rows)
    }

    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})


//search by author
app.get("/books/search", async (req,res)=>{
    try{
        const {author, title} = req.query
        let sql;
        let values;

        if(author){
            sql = `
                select * from books
                where author Ilike $1        
            `;
            values = [`%${author}%`]
        }
        else if (title){
            sql = `
                select * from books
                where title Ilike $1
            `;
            values = [`%${title}%`]
        }
        const result = await pool.query(sql, values)
        res.json(result.rows)
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//get single book
app.get("/books/:id", async (req,res)=>{
    try{
        const {id} = req.params

        const sql = `
        select * from books
        where book_id = $1
        `
        const result = await pool.query(sql,[id])
        res.json(result.rows[0])
    }

    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//update a book
app.put("/books/:id", async (req,res)=>{
    try{
        const {id} = req.params                         //comes from the url
        const {                                         //comes from the req.body not defined in the url
            title,
            author,
            genre,
            publication_year,
            availability
        } = req.body;

        const sql = `
            update books
            set 
                title = $1,
                author = $2,
                genre = $3,
                publication_year = $4,
                availability = $5
            where
                book_id = $6
            returning *
        `

        const result = await pool.query(sql, [title, author, genre, publication_year, availability, id])
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//delete book
app.delete("/books/:id", async (req,res)=>{
    try{
        const {id} = req.params                         

        const sql = `
            delete from books 
            where book_id = $1
            returning *
        `
        const result = await pool.query(sql, [id])
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

app.listen(3000,()=>{
    console.log("Server is running")
})
