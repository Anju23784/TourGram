import jwt from "jsonwebtoken"
const isAuthenticated = async (req,res,next) => {
    try{
        // const token = req.cookies.token;
        const Bearer_token = req.headers["authorization"]
        const token = Bearer_token.split(" ")[1]
        if(!token) {
            return res.status(401).json({
                message : 'User not authenticated',
                success:false
            });
        }
        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        if(!decode) {
            return res.status(401).json({
                message:'Invalid',
                success:false
            });
        }
        req.id = decode.userId;
        next();
    } catch(error) {
        console.log(error);
    }
}

export default isAuthenticated;