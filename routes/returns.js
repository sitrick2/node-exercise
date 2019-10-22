const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const router = express.Router();
const { Rental } = require('../models/rental');
const { Movie } = require('../models/movie');
const Joi = require('joi');

router.post('/', [auth, validate(validateReturn)], async (req, res) => {
        const rental = await Rental.lookup(req.body.customerId, req.body.movieId);
        if (!rental) { return res.status(404).send('Cannot find rental for this customer/movie combination')};

        if (rental.return_date) { return res.status(400).send('Return already processed.'); }

        rental.return();
        await rental.save();

        await Movie.updateOne({ _id: rental.movie._id }, {
                $inc: { numberInStock: 1}
        });

        return res.send(rental);
});

async function validateReturn(req) {
        const schema = {
                customerId: Joi.objectId().required(),
                movieId: Joi.objectId().required(),
        };

        try {
                await Joi.validate(req, schema);
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

module.exports = router;