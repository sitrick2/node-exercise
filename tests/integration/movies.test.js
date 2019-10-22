const { Movie } = require('../../models/movie');
const { User } = require('../../models/user');
const { Genre } = require('../../models/genre');
const mongoose = require('mongoose');
const request = require('supertest');

let server;
let movie;
let token;
let postData;
let movieGenre;

describe('/api/movies', () => {
    beforeEach(async () => { server = require('../../index'); });
    afterEach(async () => {
        await Movie.deleteMany({});
        await Genre.deleteMany({});
        await server.close();
    });

    describe('GET /', () => {
        beforeEach(async () => {
            await Movie.collection.insertMany([
                {title: 'Movie1', numberInStock: 10, genre: new Genre({ name: 'genre1'})},
                {title: 'Movie2', numberInStock: 10, genre: new Genre({ name: 'genre2'})},
            ]);
        });

        it('should return all movies', async () => {
            const res = await request(server).get('/api/movies');
            expect(res.body.length).toBe(2);
        });
    });

    describe('POST /', () => {
        let title;
        let numberInStock;
        let genre;
        let dailyRentalRate;

        beforeEach(async () => {
            title = 'Movie1';
            numberInStock = 10;
            dailyRentalRate = 2;
            genre = new Genre({ name: 'genre1' });
            await genre.save();
            token = new User().generateAuthToken();
        });
        const exec = async () => {
            return request(server)
                .post('/api/movies')
                .set('x-auth-token', token)
                .send({
                    title,
                    numberInStock,
                    dailyRentalRate,
                    genreId: genre._id
                });
        };

        it('should return 400 on invalid title', async () => {
            title = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 on invalid numberInStock', async () => {
            numberInStock = -1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 on invalid genre', async () => {
            genre = { _id: mongoose.Types.ObjectId() };
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 on invalid dailyRentalRate', async () => {
            dailyRentalRate = -1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return a Movie on valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('title', title);
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'title', 'genre', 'numberInStock', 'dailyRentalRate'
            ]));
        });
    });

    describe('PUT /:id', () => {
        let genre;
        let updateData = {};

        beforeEach(async () => {
            await setUpExistingMovie();

            genre = new Genre({ name: 'genre2' });
            await genre.save();

            updateData = {
                title: 'Movie2',
                numberInStock: 12,
                dailyRentalRate: 3,
                genreId : genre._id
            };
        });

        const exec = async () => {
            return request(server)
                .put('/api/movies/' + movie._id )
                .set('x-auth-token', token)
                .send(updateData);
        };

        it('should return 404 on invalid movieId', async () => {
            movie = { _id : mongoose.Types.ObjectId() };
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 400 on invalid title', async () => {
            updateData.title = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 on invalid numberInStock', async () => {
            updateData.numberInStock = -1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 on invalid genre', async () => {
            updateData.genreId = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 on invalid dailyRentalRate', async () => {
            updateData.dailyRentalRate = -1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return a Movie on valid request', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('title', updateData.title);
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'title', 'genre', 'numberInStock', 'dailyRentalRate'
            ]));
        });
    });

    describe('DELETE /:id', () => {
        let id;

        beforeEach(async () => {
            await setUpExistingMovie();
            id = movie._id;
        });

        const exec = () => {
            return request(server)
                .delete('/api/movies/' + id)
                .set('x-auth-token', token);
        };

        it('should return 403 if user is not admin', async () => {
            token = new User().generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if unable to find movie', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should delete the movie on valid request', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('_id');
        });

        it('should return the deleted movie', async () => {
            const res = await exec();
            expect(res.body.title).toBe('Movie1');
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'title', 'genre', 'numberInStock', 'dailyRentalRate'
            ]));
        });
    });

    describe('GET /:id', () => {
        let id;

        beforeEach(async () => {
            await setUpExistingMovie();
            id = movie._id;
        });

        const exec = () => {
            return request(server)
                .get('/api/movies/' + id);
        };

        it('should return 404 if unable to find movie', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should show the movie on valid request', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('_id');
        });

        it('should return the selected movie', async () => {
            const res = await exec();
            expect(res.body.title).toBe('Movie1');
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'title', 'genre', 'numberInStock', 'dailyRentalRate'
            ]));
        });
    });
});

const setUpExistingMovie = async () => {
    movieGenre = await Genre.create({ name: 'genre1'});
    postData = {
        title: 'Movie1',
        numberInStock: 10,
        dailyRentalRate: 2,
        genre: movieGenre
    };

    let user = new User({ isAdmin: true, name: 'David', email: 'sitrick2@gmail.com', password: '1234456' });
    token = user.generateAuthToken();
    movie = await Movie.create(postData);
    return movie;
};