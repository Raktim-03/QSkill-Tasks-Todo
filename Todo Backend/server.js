const express = require("express")
const app = express()
const pool = require("./db")


app.use(express.json())

//create a todo
app.post("/todos", async (req,res)=>{
    try{
        const title = req.body.title
        const deadline = req.body.deadline;

        const sql = `insert into todo(title, deadline)
        values($1, $2)
        returning *`

        const result =  await pool.query(sql,[title, deadline])
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//get todos
app.get("/todos", async(req,res)=>{
    try{
        const sql = `select * from todo`
        const result = await pool.query(sql)

        res.json(result.rows)
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
        }
    }
)

//update todos
app.put("/todos/:id", async (req,res)=>{
    try{
        const id = req.params.id
        const status = req.body.status
        const title = req.body.title
        const deadline = req.body.deadline

        const sql = `update todo 
            set 
                status = $1, 
                title = $2,
                deadline = $3
            where 
                id = $4 
            returning *`

        const result = await pool.query(sql, [status,  title, deadline, id])
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//delete todo
app.delete("/delete", async (req,res)=>{
    try{
        const id = req.body.id

        const sql = `delete from todo
                     where id = $1`
        const result = await pool.query(sql,[id])

        res.json({
            message : "Todo deleted successfully"
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

app.listen(3000, ()=>{
    console.log("Server is Running")
})


