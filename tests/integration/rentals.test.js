const { Customer } = require('../../models/customer');
const { User } = require('../../models/user');
const { Movie } = require('../../models/movie');
const { Genre } = require('../../models/genre');
const { Rental } = require('../../models/rental');
const mongoose = require('mongoose');
const moment = require('moment');
const request = require('supertest');

let server;
let token;

describe('/api/rentals', () => {
    let movie;
    let customer;

    beforeEach(async () => {
        server = require('../../index');
        token = new User().generateAuthToken();
        movie = await Movie.create({
            title: 'Movie1',
            numberInStock: 10,
            dailyRentalRate: 2,
            genre: await Genre.create({ name: 'genre1' })
        });
        customer = await Customer.create({
            name: 'David',
            isGold: true,
            phone: '6082900083'
        });
    });

    afterEach(async () => {
        await Customer.deleteMany({});
        await Movie.deleteMany({});
        await Genre.deleteMany({});
        await Rental.deleteMany({});
        await server.close();
    });

    describe('POST /', () => {
        const exec = () => {
            return request(server)
                .post('/api/rentals')
                .set('x-auth-token', token)
                .send({ movieId: movie._id, customerId: customer._id });
        };

        it('should return 400 on invalid movie', async () => {
            movie = { _id: mongoose.Types.ObjectId() };
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 on invalid customer', async () => {
            customer = { _id: mongoose.Types.ObjectId() };
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if movie not in stock.', async () => {
            movie.numberInStock = 0;
            await movie.save();
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return a rental on successful request', async() => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                '_id', 'movie', 'customer', 'rental_date'
            ]));
        });
    });

    describe('GET /', () => {
        beforeEach(async () => {
            await Rental.collection.insertMany([
                { customer, movie, rental_date: moment().subtract(1, 'days') },
                {
                    movie: {
                        title: 'Movie2',
                        numberInStock: 10,
                        dailyRentalRate: 3,
                        genre: await Genre.create({ name: 'genre2' })
                    },
                    customer: {
                        name: 'David',
                        isGold: true,
                        phone: '6082900083'
                    }
                }
            ])
        });

        it('should return all rentals', async () => {
            const res = await request(server).get('/api/rentals');
            expect(res.body.length).toBe(2);
        });

        it('should sort rentals by date', async () => {
           const res = await request(server).get('/api/rentals');
           expect(moment(res.body[1].rental_date).isSameOrAfter(moment(res.body[0].rental_date))).toBeTruthy();
        });
    });
});