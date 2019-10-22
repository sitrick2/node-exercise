const { Rental } = require('../../models/rental');
const { User } = require('../../models/user');
const { Movie } = require('../../models/movie');
const mongoose = require('mongoose');
const request = require('supertest');
const moment = require('moment');

let server;
let rental;
let token;
let data;
let movie;

describe('/api/returns', () => {
    const exec = () => {
        return request(server)
            .post('/api/returns')
            .set('x-auth-token', token)
            .send(data);
    };

    beforeEach(async () => {
        server = require('../../index');

        token = new User().generateAuthToken();
        data = {
            customerId: mongoose.Types.ObjectId(),
            movieId: mongoose.Types.ObjectId()
        };

        movie = new Movie({
            _id: data.movieId,
            title: '12345',
            dailyRentalRate: 2,
            genre: { name: '12345' },
            numberInStock: 10
        });

        await movie.save();

        rental = new Rental({
            customer: {
                _id: data.customerId,
                name: '12345',
                phone: '1111111111'
            },
            movie: {
                _id: data.movieId,
                title: '12345',
                dailyRentalRate: 2
            },
        });

        await rental.save();
    });
    afterEach(async () => {
        await Rental.deleteMany({});
        await Movie.deleteMany({});
        await server.close();
    });

    it('should return 401 error if client is not logged in', async () => {
        token = '';
        const res = await exec();

        expect(res.status).toBe(401)
    });

    it('should return 400 error if customerId is not provided', async () => {
        delete data.customerId;
        const res = await exec();

        expect(res.status).toBe(400)
    });

    it('should return 400 error if movieId is not provided', async () => {
        delete data.movieId;
        const res = await exec();

        expect(res.status).toBe(400)
    });

    it('should return 404 error if no rental found for this customer/movie', async () => {
        await Rental.deleteOne(rental);
        const res = await exec();

        expect(res.status).toBe(404)
    });

    it('should return 400 error if return already processed', async () => {
        rental.return_date = moment();
        await rental.save();
        const res = await exec();

        expect(res.status).toBe(400)
    });

    it('should return 200 if valid request', async () => {
        const res = await exec();
        expect(res.status).toBe(200)
    });

    it('should set the return date', async () => {
        await exec();
        const dbRental = await Rental.findById(rental._id);
        const diff = new Date() - dbRental.return_date;
        expect(diff).toBeLessThan(10 * 10000);
    });

    it('should calculate the rental fee', async () => {
        rental.rental_date = moment().subtract(5, 'days');
        await rental.save();
        await exec();
        const dbRental = await Rental.findById(rental._id);
        expect(dbRental.rentalFee).toBe(10);
    });

    it('should increase the movie stock', async () => {
        await exec();
        const dbMovie = await Movie.findById(data.movieId);
        expect(dbMovie.numberInStock).toBe(movie.numberInStock + 1);
    });

    it('should return the rental', async () => {
        const res = await exec();
        expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
            'rental_date', 'return_date', 'rentalFee', 'customer', 'movie'
        ]));
    });
});