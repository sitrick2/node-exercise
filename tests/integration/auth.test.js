const request = require('supertest');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');
const bcrypt = require("bcrypt");

let server;

describe('auth middleware', () => {
    beforeEach(() => { server  = require('../../index')});
    afterEach(async () => {
        await Genre.deleteMany({});
        await server.close();
    });

    let token;

    const exec = () => {
        return request(server)
            .post('/api/genres')
            .set('x-auth-token', token)
            .send({ name: 'genre1'} );
    };

    beforeEach(() => {
        token = new User().generateAuthToken();
    });

    it('should return 401 if no token is provided', async () => {
        token = '';
        const res = await exec();

        expect(res.status).toBe(401);
    });

    it('should return 400 if token is invalid', async () => {
        token = 'a';
        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 200 if token is valid', async () => {
        const res = await exec();

        expect(res.status).toBe(200);
    });
});

describe('/api/auth', () => {
    let token;
    let password;

    beforeEach(() => { server  = require('../../index')});
    afterEach(async () => {
        await User.deleteMany({});
        await server.close();
    });

    describe('POST /', () => {
        let email;

        const exec = () => {
            return request(server)
                .post('/api/auth')
                .set('x-auth-token', token)
                .send({ email, password } );
        };

        beforeEach(async () => {
            email = 'sitrick2@gmail.com';
            password = 'TEST1234';
            const salt = await bcrypt.genSalt(10);
            const hashedPass = await bcrypt.hash(password, salt);
            const user = new User({ email, password: hashedPass, name: 'David'});
            await user.save();
            token = user.generateAuthToken();
        });

        it('should return 400 if invalid email', async () => {
            email = '1';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if valid but incorrect email', async () => {
            email = 'abc@gmail.com';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid password', async () => {
            password = '1234567';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return an Auth token on valid request', async () => {
           const res = await exec();
           const dbUser = await User.findOne({ email: email });
           expect(res.status).toBe(200);
           expect(res.body.token).toEqual(dbUser.generateAuthToken());
        });
    });
});