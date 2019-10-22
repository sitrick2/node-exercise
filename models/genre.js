const mongoose = require('mongoose');
const Joi = require('joi');

const genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 50,
        lowercase: true,
        get: v => v.toLowerCase(),
        set: v => v.toLowerCase(),
    },
});

const Genre = mongoose.model('Genre', genreSchema);

async function validateGenre(genre) {
    const schema = {
        name: Joi.string().min(5).max(50).required(),
    };

    try {
        await Joi.validate(genre, schema);
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

exports.Genre = Genre;
exports.validateGenre = validateGenre;
exports.genreSchema = genreSchema;