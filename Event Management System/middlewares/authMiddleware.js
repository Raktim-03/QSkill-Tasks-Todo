const jwt = require("jsonwebtoken")

const authMiddleware = (req,res,next)=>{
    try{
        const authHeader = req.header("Authorization");
        if(!authHeader){
            return res.status(401).json({
                message : "Access denied"
            })
        }

        const token = authHeader.split(" ")[1]

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded;

        next();
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
}

module.exports = authMiddleware