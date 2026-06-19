const express = require("express");
const app = express();
const pool = require("./db");
const e = require("express");

app.use(express.json())

//post job
app.post("/jobs", async(req,res)=>{
    try{
        const {
            title,
            company,
            job_location,
            salary,
            description
        } = req.body;

        const sql = `
            insert into jobs (
                title,
                company,
                job_location,
                salary,
                description    
            )
            values ($1, $2, $3, $4, $5)
            returning *
        `
        const result = await pool.query(sql, [title, company, job_location, salary, description])
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//search for job
app.get("/jobs/search", async (req,res)=>{
    try{
        const {title, company} = req.query
        let sql;
        let values;

        if(title){
            sql = `select * from jobs where title Ilike $1`
            values = [`%${title}%`]
        }
        else if(company){
            sql = `select * from jobs where company Ilike $1`
            values = [`%${company}%`]
        }
        else{
            return res.status(400).json({
                message : "Please provide title or company"
            })
        }
        const result = await pool.query(sql, values)
        res.json(result.rows)
    }
    catch(err){
        console.log(err)
        res.status(400).json({
            error : err.message
        })
    }
})


//get all jobs
app.get("/jobs", async (req,res)=>{
    try{

        const sql = `
            select * from jobs
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

//get a single jook
app.get("/jobs/:id", async (req,res)=>{
    try{
        const {id} = req.params
        const sql = `
            select * from jobs
            where job_id = $1
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

//update job
app.put("/jobs/:id", async (req,res)=>{
    try{
        const {id} = req.params
        const {
            title,
            company,
            job_location,
            salary,
            description
        } = req.body;

        const sql = `
            update jobs 
            set 
                title = $1,
                company = $2,
                job_location = $3,
                salary = $4,
                description = $5
            where
                job_id = $6
            returning *
        `
        const result = await pool.query(sql, [title, company, job_location, salary, description, id])
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//delete job
app.delete("/jobs/:id", async (req,res)=>{
    try{
        const {id} = req.params
        const sql = `
            delete from jobs
            where
                job_id = $1
            returning * 
        `

        const result = await pool.query(sql ,[id]) 
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//applicant post
app.post("/applicants", async (req,res)=>{
    try{
        const {
            applicant_name,
            email,
            phone,
            skills
        } = req.body;

        const sql = `
            insert into applicants (
                applicant_name,
                email,
                phone,
                skills    
            )
            values ( $1, $2, $3, $4)
            returning *
        `

        const result = await pool.query(sql, [applicant_name, email, phone, skills])
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//get all applicants
app.get("/applicants", async (req,res)=>{
    try{
        const sql = `
            select * from applicants
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

//apply for job through application
app.post("/applications", async (req,res)=>{
    try{
        const {
            job_id,
            applicant_id
        }= req.body

        const sql = `
            insert into applications(job_id, applicant_id)
            values(
                $1, $2   
            )
            returning *
        `

        const result = await pool.query(sql, [job_id, applicant_id])
        res.json(result.rows[0])
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
})

//view applications
app.get("/applications", async (req,res)=>{
    try{
        const sql = `select * from applications`
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

//join query api
app.get("/applications/details", async (req,res)=>{
    try{
        const sql = `
            select 
                applications.application_id,
                applicants.applicant_name,
                jobs.title,
                jobs.company,
                applications.status
            from applications

            inner join jobs
            on applications.job_id = jobs.job_id

            inner join applicants
            on applications.applicant_id = applicants.applicant_id
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

//delete a job application
app.delete("/applications/:id", async (req,res)=>{
    try{
        const {id} = req.params
        const sql =    `
            delete from applications
            where application_id = $1
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


app.listen(3000, ()=>{
    console.log("Server is running on port 3000")
})