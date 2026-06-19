const roleMiddleware = (req,res, next)=>{
    try{
        if(req.user.role !== "admin"){
            return res.status(403).json({
                message : "Access denied"
            })
        }
        next();
    }   
    catch(err){
        console.log(err)
        res.status(500).json({
            error : err.message
        })
    }
}

module.exports = roleMiddleware