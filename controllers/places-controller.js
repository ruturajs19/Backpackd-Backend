const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const fs = require("fs");

const HttpError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");
const place = require("../models/place");

const getPlacesById = async (req, res, next)=>{
    const placeId = req.params.pid;
    let place;
    try{
        place = await Place.findById(placeId)
    }catch(err){
        const error = new HttpError("Could not find place", 500);
        return next(error)
    }
    if(!place){
        const error = new HttpError("Could not find place", 404);
        return next(error)
    }
    res.json({place: place.toObject({ getters: true})});
}

const getPlacesByUserId = async (req, res, next)=>{
    const userId = req.params.uid;
    let places;
    try{
        places = await Place.find({creator: userId})
    }catch(err){
        const error = new HttpError("Could not find place", 500);
        return next(error)
    }
    if(!places.length){
        const error = new HttpError("Could not find place", 404);
        return next(error)
    }
    res.json({places: places.map(place => place.toObject({ getters: true}))});
}

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        throw new HttpError("Invalid inputs passed, please check your data", 422)
    }
    const {title, description, address} = req.body;
    let user;
    try{
        user = await User.findById(req.userData.userId);
    }catch(e){
        const error = new HttpError("Something Went Wrong.", 500);
        return next(error);
    }
    if(!user){
        const error = new HttpError("Ivalid Creator.", 500);
        return next(error);
    }
    const newPlace = new Place({
        title,
        description,
        location: {
            lat: 0,
            lng: 0
        },
        address,
        image: req.file.path,
        creator: req.userData.userId
    });
    try{
        const session = await mongoose.startSession();
        session.startTransaction();
        await newPlace.save({session});
        user.places.push(newPlace)
        await user.save({session});
        await session.commitTransaction();
    }catch(e)  {
        const error = new HttpError("Creating Place failed.", 500);
        return next(error);
    }
    res.status(201).json({place: newPlace.toObject({ getters: true})});
}

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        throw new HttpError("Invalid inputs passed, please check your data", 422)
    }
    const {title, description} = req.body;
    const placeId = req.params.pid;
    let updatedPlace;
    try{
        updatedPlace = await Place.findById(placeId)
    }catch(e){
        const error = new HttpError("Something went Wrong", 500);
        return next(error)
    }
    if(updatedPlace.creator.toString() !== req.userData.userId){
        const error = new HttpError("You are not allowed to update this place", 401);
        return next(error)
    }
    updatedPlace.title = title;
    updatedPlace.description = description;
    try{
        await updatedPlace.save();
    }catch(e){
        const error = new HttpError("Something went Wrong", 500);
        return next(error)
    }
    res.status(201).json({place: updatedPlace.toObject({ getters: true})});
}

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try{
        place = await Place.findById(placeId).populate("creator");
        //Through populate method, mongoose gets access to data of another document stored in a different collection
    }catch(e){
        const error = new HttpError("Something went wrong", 500);
        return next(error);
    }
    if(!place){
        const error = new HttpError("Could not find place", 404);
        return next(error)
    }
    if(place.creator.id !== req.userData.userId){
        const error = new HttpError("You are not allowed to delete this place", 401);
        return next(error)
    }
    const imagePath = place.image; 
    try{
        const session = await mongoose.startSession();
        session.startTransaction();
        await place.remove({session});
        place.creator.places.pull(place)
        await place.creator.save({session});
        await session.commitTransaction();
    }catch(e){
        const error = new HttpError("Deleting Place failed", 500);
        return next(error);
    }
    fs.unlink(imagePath, err => {
        console.log(err)
      })
    res.status(200).json({message: "Deleted!!"})
}

exports.getPlacesById = getPlacesById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;