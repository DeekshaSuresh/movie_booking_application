const mongoose = require('mongoose');
const Movie = require("../models/Movie");
const User = require('../models/User');
const Bookings = require("../models/Booking");

const booking = async (req, res, next) => {
    const { movie, date, seatNumber, user } = req.body;
    let existingMovie;
    let existingUser;

    try {
        existingMovie = await Movie.findById(movie);
        existingUser = await User.findById(user);
        //console.log(existingUser);

        if (!existingMovie) {
            return res.status(404).json({ message: "Movie not found by given id" });
        }

        if (!existingUser) {
            return res.status(404).json({ message: "User not found by given id" });
        }

        const newBooking = new Bookings({
            movie,
            date: new Date(date),
            seatNumber,
            user
        });

        const session = await mongoose.startSession();
        session.startTransaction();

        console.log(newBooking);

        //existingUser.bookings.push(newBooking);
        //existingMovie.bookings.push(newBooking);

        await existingUser.save({ session });
        await existingMovie.save({ session });
        await newBooking.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({ newBooking });
    } catch (err) {
        return res.status(500).json({ message: "Something Went Wrong", error: err.message });
    }
}

const deleteBooking = async (req, res, next) => {
    const id = req.params.id;
    let booking;
    try {
        booking = await Bookings.findOneAndDelete({ _id: id }).populate("user movie");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found by the given id" });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        /* await booking.user.bookings.pull(booking);
        await booking.movie.bookings.pull(booking); */

        await booking.movie.save({ session });
        await booking.user.save({ session });

        await session.commitTransaction();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error deleting the booking" });
    }

    return res.status(200).json({ message: "Booking deleted successfully" });
};


module.exports = {booking, deleteBooking};