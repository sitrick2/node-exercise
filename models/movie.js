const mongoose = require('mongoose');
const Joi = require('joi');
const { genreSchema } = require('./genre');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 255,
        trim: true
    },
    genre: {
        type: genreSchema
    },
    numberInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 255,
        default: 0
    },
    dailyRentalRate: {
        type: Number,
        min: 0,
        max: 255,
        required: true,
        default: 0
    }
})

const Movie = mongoose.model('Movie', movieSchema);

async function validateMovie(movie) {
    const schema = {
        title: Joi.string().trim().min(5).max(255).required(),
        numberInStock: Joi.number().min(0).max(255).required(),
        dailyRentalRate: Joi.number().min(0).max(255).required(),
        genreId: Joi.objectId().required()
    };

    try {
        await Joi.validate(movie, schema);
    } catch (ex) {
        return {
            error: {
                details: [
                    { message : ex.message }
                ]
            }
        }
    }

    return true;
}

exports.Movie = Movie;
exports.movieSchema = movieSchema;
exports.validateMovie = validateMovie;