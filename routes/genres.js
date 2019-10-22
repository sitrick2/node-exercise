const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');
const validate = require('../middleware/validate');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Genre, validateGenre } = require('../models/genre');

router.get('/', async (req, res) => {
    res.send(await Genre.find().sort('name'));
});

router.get('/:id', validateObjectId, async (req, res) => {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).send('Cannot find genre with that id.');
    res.send(genre);
});

router.post('/', [auth, validate(validateGenre)], async (req, res) => {
    res.send(await Genre.create({ name: req.body.name }));
});

router.put('/:id', [auth, validateObjectId, validate(validateGenre)], async (req, res) => {
    const genre = await Genre.findByIdAndUpdate(req.params.id, {
        $set: {
            name: req.body.name
        }
    }, { new: true });
    if (!genre) return res.status(404).send('Cannot find genre.');

    res.send(genre);
});

router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
    const genre = await Genre.findByIdAndRemove(req.params.id);
    if (!genre) return res.status(404).send('Cannot delete genre: does not exist.');
    res.send(genre);
});

module.exports = router;