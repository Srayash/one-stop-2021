const express = require("express");
const gcScoreboardRouter = express.Router();
const jwt = require("jsonwebtoken");
const accessjwtsecret = process.env.ACCESS_JWT_SECRET;
const refreshjwtsecret = process.env.REFRESH_JWT_SECRET;
const spardhaadmins = process.env.SPARDHA_ADMINS.split(',');
const kritiadmins = process.env.KRITI_ADMINS.split(',');
const manthanadmins = process.env.MANTHAN_ADMINS.split(',');

function checkAdmin(email){
    let authEvents=[];
    if(spardhaadmins.includes(email)) authEvents.push("spardha");
    if(kritiadmins.includes(email)) authEvents.push("kriti");
    if(manthanadmins.includes(email)) authEvents.push("spardha");
    return authEvents;
}

gcScoreboardRouter.use((req,res,next) => {
    let subPoints = req.originalUrl.split('/');
    if(subPoints.includes('login')===false && subPoints.includes('gen-accesstoken')===false){
        if(!req.headers.authorization){
            res.status(401).json({"success" : false,"message" : "No Token Found"});
            return;
        }
        let token = req.headers.authorization.split(' ').slice(-1)[0];
        let decoded = jwt.verify(token,accessjwtsecret);
        if(decoded["email"]===undefined){
            res.status(401).json({"success" : false,"message" : "Invalid Token"});
        }
        else{
            if(subPoints.includes('admin')){
                if(decoded["email"]!==undefined && checkAdmin(decoded["email"]).length!==0){
                    next();
                }
                else{
                    res.status(401).json({"message" : "You are not authorized admin"});
                }
            }
            else if(decoded["email"]!==undefined){
                req.body["email"] = decoded["email"];
                next();
            }
        }
    }
    else next();
});

gcScoreboardRouter.post("/gc/login",(req,res) => {
    try{
        let email = req.body.email;
        if(email===undefined){
            throw new Error("Not Valid parameters in body");
        }
        const accessToken = jwt.sign({"email" : email},accessjwtsecret,{expiresIn : "1 days"});
        console.log(jwt.verify(accessToken,accessjwtsecret));
        const refreshToken = jwt.sign({"email" : email},refreshjwtsecret,{expiresIn : "7 days"});
        const authEvents = checkAdmin(email);
        const isAdmin = authEvents.length===0 ? false : true;
        res.json({"success" : true, accessToken, refreshToken,isAdmin,authEvents});
    }
    catch(err){
        res.status(400).json({"success" : false, "message" : err.toString()});
    }
});

gcScoreboardRouter.post("/gc/gen-accesstoken",(req,res) => {
    let reftoken = req.headers.authorization.split(' ').slice(-1)[0];
    let decoded = jwt.verify(reftoken,refreshjwtsecret);
    if(decoded["email"]===undefined){
        res.status(401).json({"success" : false,"message" : "Invalid Token or Token Expired"});
    }
    else{
        const accessToken = jwt.sign({"email" : decoded["email"]},accessjwtsecret,{expiresIn : "1 days"});
        res.json({"success" : true,"token" : accessToken});
    }
});

module.exports = { gcScoreboardRouter };