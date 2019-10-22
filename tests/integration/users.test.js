const { User } = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const moment = require('moment');

let me;
let token;
let server;
let uploadData;

describe('/api/users', () => {
    beforeEach(async () => {
        server = require('../../index');
       me = await User.create({ name: 'David', email: "sitrick2@gmail.com", password : "TEST1234", isAdmin: true });
       token = await me.generateAuthToken();
        uploadData = {
            name: 'David',
            email: 'sitrick3@gmail.com',
            password: '123456'
        }
    });

    afterEach( async () => {
        await User.deleteMany({});
        await server.close();
    });

    describe('GET /me', () => {
        it('should return data for logged in user', async () => {
            const res = await request(server)
                .get('/api/users/me')
                .set('x-auth-token', token);
            expect(res.status).toBe(200);
            expect(res.body.email).toBe('sitrick2@gmail.com');
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                '_id', 'email', 'name'
            ]));
        });
    });

    describe('GET /', () => {
        beforeEach(async () => {
            await User.collection.insertMany([
                {name: 'David', email: 'sitrick23@gmail.com', password: '123456', isAdmin: true},
                {name: 'Dave', email: 'sitrick22@gmail.com', password: '1234567', isAdmin: false},
            ]);
        });

        it('should return data for all users', async () => {
            const res = await request(server)
                .get('/api/users')
                .set('x-auth-token', token);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3); //two users plus the "me" user
        });
    });

    describe('POST /', () => {
        const exec = () => {
            return request(server)
                .post('/api/users')
                .set('x-auth-token', token)
                .send(uploadData);
        };

        it('should return 400 if user already exists', async () => {
            uploadData.email = 'sitrick2@gmail.com';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if user data is invalid', async () => {
            uploadData.email = 'a';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return an array of user data on valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.headers).toHaveProperty('x-auth-token');
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'name', 'email', '_id'
            ]));
        });
    });

    describe('PUT /:id', () => {
        let user;
        beforeEach(async () => {
            user = await User.create(uploadData);
        });

        const exec = () => {
            return request(server)
                .put('/api/users/' + user._id)
                .set('x-auth-token', token)
                .send(uploadData);
        };

        it('should return 404 if use not found', async () => {
            user = { _id : mongoose.Types.ObjectId() };
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return updated user details on valid request', async () => {
            uploadData.email = 'sitrick4@gmail.com';
            const res = await exec();
            expect(res.status).toBe(200);
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'name', 'email', '_id'
            ]));
            expect(res.body.email).toMatch('sitrick4@gmail.com');
        });
    });

    describe('DELETE /:id', () => {
        let user;

        beforeEach(async () => {
            user = await User.create(uploadData);
        });

        const exec = () => {
            return request(server)
                .delete('/api/users/' + user._id)
                .set('x-auth-token', token);
        };

        it('should return 403 if logged in user is not an admin.', async () => {
            token = user.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if user does not exist.', async () => {
            user = { _id : mongoose.Types.ObjectId() };
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should delete the user on valid request', async () => {
            const res = await exec();
            const dbUser = await User.findById(user._id);
            expect(res.status).toBe(200);
            expect(dbUser).toBeFalsy();
        });

        it('should return the deleted user on valid request', async () => {
            const res = await exec();
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'name', 'email', '_id'
            ]));
        });
    });
});