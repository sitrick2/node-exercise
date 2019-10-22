const mongoose = require('mongoose');
const Joi = require('joi');
const moment = require('moment');

const rentalMovieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 255,
        trim: true
    },
    dailyRentalRate: {
        type: Number,
        min: 0,
        max: 255,
        required: true,
        default: 0
    }
});

const rentalCustomerSchema = new mongoose.Schema({
    isGold: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 50,
    },
    phone: {
        type: String,
        validate: {
            validator: function(v) {
                return /^[0-9]{7,10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
        required: [true, 'User phone number required']
    }
});

const rentalSchema = new mongoose.Schema({
    movie: {
        type: rentalMovieSchema,
        required: true
    },
    customer: {
        type: rentalCustomerSchema,
        required: true
    },
    rental_date: {
        type: Date,
        required: true,
        default: moment().format('YYYY-MM-DD H:m:s')
    },
    return_date: {
        type: Date
    },
    rentalFee: {
        type: Number,
        min: 0
    }
});

rentalSchema.methods.return = function() {
    this.return_date = moment();

    const rentalDays = moment(this.return_date).diff(moment(this.rental_date), 'days');
    this.rentalFee = rentalDays * this.movie.dailyRentalRate;
};

rentalSchema.statics.lookup = function(customerId, movieId) {
    return this.findOne({
        'customer._id': customerId,
        'movie._id': movieId
    });
};

const Rental = mongoose.model('Rental', rentalSchema);

function validateRental(rental) {
    const schema = {
        movieId: Joi.objectId().required(),
        customerId: Joi.objectId().required(),
    };

    return Joi.validate(rental, schema);
}

exports.Rental = Rental;
exports.validateRental = validateRental;