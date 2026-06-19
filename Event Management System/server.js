const express = require("express")
const app = express()
const pool = require("./db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const authMiddleware = require("./middlewares/authMiddleware")
const roleMiddleware = require("./middlewares/roleMiddleware")

app.use(express.json())

//user registration
app.post("/register", async (req,res)=>{
    try{
        const {
            username,
            email,
            user_password
        } = req.body;

        //validation
        if(!username || !email || !user_password){
            return res.status(400).json({
                message : "All fields are required"
            });
        }

        //email already exists
        const checkUserSql = `
            select * from users
            where email = $1
        `
        const existingUser = await pool.query(checkUserSql, [email])

        if(existingUser.rows.length > 0){
            return res.status(400).json({
                message : "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(user_password, 10);
        const sql = `
            insert into users(
                username,
                email,
                user_password
            )
            values ( $1, $2 , $3)
            returning *
        `
        const result = await pool.query(sql, [username, email, hashedPassword])
        const user = result.rows[0];
        delete user.user_password;

        res.json(user);
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error: err.message
        })
    }
})

//user login
app.post("/login", async (req,res)=>{
    try{
        const {
            email,
            user_password
        } = req.body

        if(!email || !user_password){
            return res.status(400).json({
                message : "All fields are required"
            })
        }

        const checkUserSql =  `
            select * from users
            where email = $1
        `
        const userResult = await pool.query(checkUserSql, [email])
        if(userResult.rows.length == 0){
            return res.status(401).json({
                message : "Invalid credentials"
            })
        }
        const user = userResult.rows[0]

        const isMatch = await bcrypt.compare(
            user_password,
            user.user_password
        )
        if(!isMatch){
            return res.status(401).json({
                message : "Invalid credentials"
            })
        }

        const token = jwt.sign(
            {
                user_id : user.user_id,
                role : user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn : "1d"
            }
        )

        res.json({
            message : "Login Successful",
            token
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//create event
app.post("/events", authMiddleware, async (req,res)=>{
    try{
        const {
            title,
            description,
            event_date,
            event_time,
            event_location,
            capacity
        }= req.body

        const created_by = req.user.user_id;
        if(
            !title || !event_date || !event_location || !capacity
        ){
            return res.status(400).json({
                message : "Required fields missing"
            });
        }

        const sql = `
            insert into events(
                title,
                description,
                event_date,
                event_time,
                event_location,
                capacity,
                created_by
            )
            values($1, $2, $3, $4, $5, $6, $7)
            returning *
        `
        const result = await pool.query(sql, [title, description, event_date, event_time, event_location, capacity, created_by])
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//search for an event
app.get("/events/search", async(req,res)=>{
    try{
        const {
            event_date,
            event_location
        } = req.query;

        let sql;
        let values;

        if(event_date){
            sql = `select * 
                from events
                where event_date = $1
                and status = 'approved'`
            values = [event_date]
        }
        else if(event_location){
            sql = `select * 
                    from events
                    where event_location Ilike $1
                    and status = 'approved'`
            values = [`%${event_location}%`]
        }
        else{
            return res.status(404).json({
                message : "Can't get the event"
            })
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

//get all events
app.get("/events", async (req,res)=>{
    try{
        const sql = `
            select * from events
            where status = 'approved'    
        `
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

//update an event
app.put("/events/:id", authMiddleware, async(req,res)=>{
    try{
        const {id} = req.params;
        const {
            title,
            description,
            event_date,
            event_time,
            event_location,
            capacity
        }=req.body;

        
        const sql = `
            update events
            set title = $1,
            description = $2,
            event_date = $3,
            event_time = $4,
            event_location = $5,
            capacity = $6

            where event_id = $7
            returning *
        `

        const result = await pool.query(sql, [title, description, event_date, event_time, event_location, capacity, id])

        if(result.rows.length === 0){
            return res.status(404).json({
                message : "Event not found"
            });
        }
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
            res.status(500).json({
                error : err.message
            })
        
    }
})

//delete an event
app.delete("/events/:id", authMiddleware, async(req,res)=>{
    try{
        const {id} = req.params

        const sql = `
            delete from events
            where event_id = $1
            returning *
        `
        const result = await pool.query(sql, [id])
        if(result.rows.length === 0){
            return res.status(404).json({
                message : "Event not found"
            })
        }

        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//get event by id
app.get("/events/:id", async (req,res)=>{
    try{
        const {id} = req.params
        const sql = `
            select * from events 
            where event_id = $1
            and status = 'approved'
        `
        const result = await pool.query(sql, [id])

        if(result.rows.length ===0){
            return res.status(404).json({
                message : "Event not found"
            })
        }
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})


//capcity validation with registration 
app.post("/registrations", authMiddleware, async (req,res)=>{
    try{
        const { event_id} = req.body

        const capacityResult = await pool.query(
            `
                select capacity from events
                where event_id = $1
            `, 
            [event_id]
        );

        const registrationCount = await pool.query(
            `
                select count(*) from registrations
                where event_id = $1
            `, 
            [event_id]
        )

        if(capacityResult.rows.length === 0){
            return res.status(404).json({
                message : "Event not found"
            })
        }
        const eventCapacity = capacityResult.rows[0].capacity
        const currentCount = parseInt(registrationCount.rows[0].count)

        if(currentCount >= eventCapacity){
            return res.status(400).json({
                message : "Event is full"
            })
        }

        const user_id = req.user.user_id;
        const sql = `
            insert into registrations(
            event_id,
            user_id
            )
            values($1, $2)
            returning *
        `

        const result = await pool.query(sql, [ event_id, user_id])
        res.json(result.rows[0])
        
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//cancel registration
app.delete("/registrations/:id", authMiddleware, async (req,res)=>{
    try{
        const {id} = req.params
        const sql = `
            delete from registrations
            where registration_id = $1
            returning *
        `
        const result = await pool.query(sql, [id]) 
        if(result.rows.length === 0){
            return res.status(404).json({
                message : "Registration not found"
            })
        }
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//approve the events
app.put("/events/:id/approve", authMiddleware, roleMiddleware, async(req,res)=>{
    try{
        const {id} = req.params
        const sql = `
            update events
            set status = 'approved'
            where event_id = $1
            returning *
        `
        const result = await pool.query(sql, [id])
        if(result.rows.length === 0){
            return res.status(404).json({
                message : "Event not found"
            })
        }
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

app.listen(3000, ()=>{
    console.log("Server is running")
})