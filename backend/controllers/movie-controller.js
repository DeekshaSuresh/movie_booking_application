const Movie = require('../models/Movie');
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const Admin = require("../models/Admin");


const addMovie = async (req, res, next) => {
    let adminId;

    const extractedToken = req.headers.authorization

    if (!extractedToken || !extractedToken.startsWith('Bearer ')) {
        return res.status(404).json({ message: "Token not found" });
    }
    
    const token = extractedToken.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        adminId = decoded.id
    } catch (error) {
        return res.status(401).json({ message: 'Invalid Token' });
    }

    // Create a new movie
    const { title, description, releaseDate, posterUrl, featured, actors } = req.body;

    if (!title || title.trim() === "" || !description || description.trim() === "" || !posterUrl || posterUrl.trim() === "") {
        return res.status(422).json({ message: "Invalid Inputs" });
    }

    let movie;

    try {
        movie = new Movie({
            title,
            description,
            releaseDate: new Date(releaseDate),
            posterUrl,
            featured,
            actors,
            admin: adminId
        });

        const session = await mongoose.startSession();
        session.startTransaction();

        await movie.save({ session });

        const adminUser = await Admin.findById( adminId );

        adminUser.addedMovies.push(movie);

        await adminUser.save({ session });

        await session.commitTransaction();
        session.endSession();
    } catch (err) {
        return res.status(500).json({ message: "Request Failed", error: err.message });
    }

    return res.status(201).json({ movie });
};

const getAllMovies = async (req, res, next) => {
    try {
        const movies = await Movie.find({});

        if (!movies || movies.length === 0) {
            return res.status(404).json({ message: "No movies found" });
        }

        return res.status(200).json({ movies });
    } catch (err) {
        return res.status(500).json({ message: "Unexpected Error Occurred", error: err.message });
    }
};

const getMovieById = async (req, res, next) => {
    const id = req.params.id;

    try {
        const movie = await Movie.findById(id);

        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }

        return res.status(200).json({ movie });
    } catch (err) {
        return res.status(500).json({ message: "Unexpected Error Occurred", error: err.message });
    }
};


module.exports = { addMovie, getAllMovies, getMovieById };