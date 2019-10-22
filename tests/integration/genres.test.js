const request = require('supertest');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');
const mongoose = require('mongoose');

let server;

describe('/api/genres', () => {
    let token;
    let name;

    beforeEach(() => {
        server  = require('../../index')
        token = new User().generateAuthToken();
        name = 'genre1';
    });
    afterEach(async () => {
        await Genre.deleteMany({});
        await server.close();
    });

   describe('GET /', () => {
      it('should return all genres', async () => {
          await Genre.collection.insertMany([
            {name: 'genre1'},
            {name: 'genre2'}
          ]);
          const res = await(request(server).get('/api/genres'));

          expect(res.status).toBe(200);
          expect(res.body.length).toBe(2);
          expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
          expect(res.body.some(g => g.name === 'genre2')).toBeTruthy();
      });
   });

    describe('GET /:id', () => {
        it('should return a genre if valid id is passed', async () => {
            const genre = await Genre.create({ name: 'genre1' });
            await genre.save();

            const res = await (request(server).get('/api/genres/' + genre._id ));

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', genre.name);
        });

        it( 'should return a 404 error with an invalid id.', async () => {
            const res = await(request(server).get('/api/genres/1'));

            expect(res.status).toBe(404);
        });

        it( 'should receive a 404 error if no genre with the given id exists.', async () => {
            const id = mongoose.Types.ObjectId().toHexString();
            const res = await(request(server).get('/api/genres/' + id));

            expect(res.status).toBe(404);
        });
    });

    describe('POST /', () => {
        const exec = async () => {
            return request(server)
                .post('/api/genres')
                .set('x-auth-token', token)
                .send({ name: name });
        };

        it('should return 401 if client is not logged in', async () => {
            token = '';
            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if genre is less than 5 characters', async () => {
            name = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genre is more than 50 characters', async () => {
            name = new Array(52).join('a');
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should save the genre if it is valid', async () => {
            await exec();

            const genre = await Genre.find({ name: 'genre1' });

            expect(genre).not.toBe(null);
        });

        it('should return the genre if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('name', 'genre1');
            expect(res.body).toHaveProperty('_id');
        });

    });

    describe('PUT /:id', () => {
        let genre;
        let id;
        let payload;

        const exec = () => {
            return request(server)
                .put('/api/genres/' + id)
                .set('x-auth-token', token)
                .send(payload);
        };

        beforeEach(async () => {
            genre = await Genre.create({ name: 'genre1' });
            id = genre._id;
            payload = { name: "genre2" };
        });

        it('should update a genre if valid data is passed', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'genre2');
        });

        it( 'should return a 400 error with a bad request.', async () => {
            payload = { name: "123" };
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it( 'should receive a 404 error if no genre with the given id exists.', async () => {
            id = mongoose.Types.ObjectId().toHexString();
            const res = await exec();

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /:id', () => {
        let id;
        let genre;

        const exec = () => {
            return request(server)
                .delete('/api/genres/' + id)
                .set('x-auth-token', token);
        };

        beforeEach(async () => {
            id = mongoose.Types.ObjectId().toHexString();
            token = new User({ isAdmin: true }).generateAuthToken();
            genre = await Genre.create({ _id: id, name: 'genre1' });
            await genre.save();
        });

        it('should delete a genre if valid id is passed', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('genre1');
        });

        it( 'should return a 404 error with an invalid id.', async () => {
            id = 1;
            const res = await exec();

            expect(res.status).toBe(404);
        });

        it( 'should return a 403 error with an invalid id.', async () => {
            token = new User().generateAuthToken();
            const res = await exec();

            expect(res.status).toBe(403);
        });

        it( 'should return a 404 error if no genre with the given id exists.', async () => {
            id = mongoose.Types.ObjectId().toHexString();
            const res = await exec();

            expect(res.status).toBe(404);
        });
    });
});