
const { validationResult } = require("express-validator");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user")

const getUsers = async (req, res, next)=>{
    const userId = req.params.pid;
    let users;
    try{
        users = await User.find({}, "-password") 
    }catch(e){
        const error = new HttpError("Something Went Wrong", 500);
        return next(error)
    }
    res.json({users: users.map(user =>user.toObject({getters: true}))});
}


const signUp = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return next(new HttpError("Invalid inputs passed, please check your data", 422))
    }
    const {name, email, password, places} = req.body;
    let existingUser;
    try{
        existingUser = await User.findOne({email: email})
    }catch(err){
        const error = new HttpError("Something Went Wrong", 500);
        return next(error)
    }
    if(existingUser){
        return next(new HttpError("User already present", 401));
    }
    let hashedPassword;
    try{
        hashedPassword = await bycrypt.hash(password, 12)
    } catch(err){
        const error = new HttpError("Could not create user, please try again", 500);
        return next(error); 
    }
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        image: req.file.path,
        places
    })
    try{
        await newUser.save();
    }catch(e)  {
        const error = new HttpError("Signing Up failed.", 500);
        return next(error);
    }
    let token;
    try{
        token = jwt.sign({userId: newUser.id, email: newUser.email}, process.env.JWT_KEY, {expiresIn: "1h"});
    }catch(e){
        const error = new HttpError("Signing Up failed.", 500);
        return next(error);
    }
    res.status(201).json({userId: newUser.id, email: newUser.email, token: token});
}

const login = async (req, res, next) => {
    const {email, password} = req.body;
    let identifiedUser;
    try{
        identifiedUser = await User.findOne({email: email})
    }catch(err){
        const error = new HttpError("Something Went Wrong", 500);
        return next(error)
    }
    if(!identifiedUser){
        return next(new HttpError("Invalid user credentials", 401));
    }
    let isValidPassword = false;
    try{
        isValidPassword = await bycrypt.compare(password, identifiedUser.password);
    } catch(e){
        const error = new HttpError("Could't log u in, Please try again", 500);
        next(error);
    }
    if(!isValidPassword){
        const error = new HttpError("Invalid user credentials", 401);
        return next(error);
    }
    let token;
    try{
        token = jwt.sign({userId: identifiedUser.id, email: identifiedUser.email}, process.env.JWT_KEY, {expiresIn: "1h"});
    }catch(e){
        const error = new HttpError("logging Up failed.", 500);
        return next(error);
    }
    res.status(200).json({message: `logged in successfully`, userId: identifiedUser.id, email: identifiedUser.email, token: token});
}

exports.getUsers = getUsers;
exports.login = login;
exports.signup = signUp;