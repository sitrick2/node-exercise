const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const router = express.Router();
const { Movie } = require('../models/movie');
const { Customer } = require('../models/customer');
const { Rental, validateRental } = require('../models/rental');
const moment = require('moment');
const mongoose = require('mongoose');
const Fawn = require('fawn');

Fawn.init(mongoose);

router.post('/', [auth, validate(validateRental)], async (req, res) => {
    const movie = await Movie.findById(req.body.movieId);
    if (!movie) return res.status(400).send('Invalid movie.');

    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(400).send('Invalid customer.');

    if (movie.numberInStock === 0) return res.status(400).send('Movie not in stock');

    let rental = new Rental({
        movie: { _id : movie._id , title : movie.title, dailyRentalRate: movie.dailyRentalRate },
        customer: { _id : customer._id, name : customer.name, phone: customer.phone },
        rental_date: moment().format('YYYY-MM-DD H:m:s')
    });

    new Fawn.Task()
        .save('rentals', rental)
        .update('movies', { _id: movie._id }, {
            $inc: { numberInStock: -1 }
        })
        .run();

    res.send(rental);
});

router.get('/', async (req, res) => {
    res.send(await Rental.find().sort('-rental_date'));
});

module.exports = router;