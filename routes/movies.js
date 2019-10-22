const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const router = express.Router();
const { Movie, validateMovie } = require('../models/movie');
const { Genre } = require ('../models/genre');

router.get('/', async (req, res) => {
    res.send(await Movie.find().sort('title'));
});

router.post('/', [auth, validate(validateMovie)], async (req, res) => {
    const genre = await Genre.findById(req.body.genreId);
    if (!genre) return res.status(400).send('Invalid genre.');

    res.send(await Movie.create({
        title: req.body.title,
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate,
        genre: {
            _id: genre._id,
            name: genre.name
        }
    }));
});

router.put('/:id', [auth, validate(validateMovie)], async (req, res) => {
    const genre = await Genre.findById(req.body.genreId);
    if (!genre) return res.status(400).send('Cannot find genre.');
        const movie = await Movie.findByIdAndUpdate(req.params.id, {
        $set: {
            title: req.body.title,
            numberInStock: req.body.numberInStock,
            dailyRentalRate: req.body.dailyRentalRate,
            genre: {
                _id: genre._id,
                name: genre.name
            }
        }
    }, { new: true });
    if (!movie) return res.status(404).send('Cannot find movie.');
    res.send(movie);
});

router.delete('/:id', [auth, admin], async (req, res) => {
    const movie = await Movie.findByIdAndRemove(req.params.id);
    if (!movie) return res.status(404).send('Cannot delete movie: does not exist.');
    res.send(movie);
});

router.get('/:id', async (req, res) => {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).send('Cannot find movie with that id.');
    res.send(movie);
});

module.exports = router;