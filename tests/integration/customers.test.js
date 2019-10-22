const { Customer } = require('../../models/customer');
const { User } = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');

let server;
let token;
let customer;

describe('/api/customers', () => {
    beforeEach(async () => { server = require('../../index'); });
    afterEach(async () => {
        await Customer.deleteMany({});
        await server.close();
    });

    describe('GET /', () => {
        beforeEach(async () => {
            await Customer.collection.insertMany([
                {name: 'customer1', isGold: true, phone: '1234567890'},
                {name: 'customer2', isGold: false, phone: '1234667890'}
            ]);
        });

        it('should return all customers', async () => {
            const res = await request(server).get('/api/customers');
            expect(res.body.length).toBe(2);
        });
    });

    describe('POST /', () => {
        let name;
        let isGold;
        let phone;

        beforeEach(async () => {
            name = 'David';
            isGold = true;
            phone = '6082900083';
            token = new User().generateAuthToken();
        });

       const exec = async () => {
           return request(server)
               .post('/api/customers')
               .set('x-auth-token', token)
               .send({ name, isGold, phone });
       };

       it('should return 400 on invalid name', async () => {
           name = "1";
           const res = await exec();
           expect(res.status).toBe(400);
       });

       it('should return 400 on invalid isGold', async () => {
           isGold = null;
           const res = await exec();
           expect(res.status).toBe(400);
       });

       it('should return 400 on invalid phone', async () => {
           phone = '4';
           const res = await exec();
           expect(res.status).toBe(400);
       });

       it('should return a Customer on valid request', async () => {
          const res = await exec();
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty('name', name);
           expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
               'name', 'isGold', 'phone'
           ]));
       });
    });

    describe('PUT /:id', () => {
        let updateData;
        let id;

        beforeEach(async () => {
            await setUpExistingCustomer();
            updateData = { name: "Steve", isGold: false, phone: "1234567890"};
            id = customer._id;
        });

        const exec = () => {
            return request(server)
                .put('/api/customers/' + id)
                .set('x-auth-token', token)
                .send(updateData)
        };

        it('should return 404 if cannot find customer', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return the customer with updated data on valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.name).toBe(updateData.name);
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'name', 'isGold', 'phone'
            ]));
        });
    });

    describe('DELETE /:id', () => {
        let id;

        beforeEach(async () => {
            await setUpExistingCustomer();
            id = customer._id;
        });

        const exec = () => {
            return request(server)
                .delete('/api/customers/' + id)
                .set('x-auth-token', token);
        };

        it('should return 403 if logged in user not admin', async () => {
            token = new User().generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if unable to find customer', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should delete the customer on valid request', async () => {
            const req = await exec();
            expect(req.body).toHaveProperty('_id');
        });

        it('should return the deleted customer', async () => {
            const res = await exec();
            expect(res.body.name).toBe('David');
        });
    });

    describe('GET /:id', () => {
        let id;

        beforeEach(async () => {
            await setUpExistingCustomer();
            id = customer._id;
        });

        const exec = () => {
            return request(server)
                .get('/api/customers/' + id);
        };

        it('should return 404 if unable to find customer', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should show the customer on valid request', async () => {
            const req = await exec();
            expect(req.body).toHaveProperty('_id');
        });

        it('should return the selected customer', async () => {
            const res = await exec();
            expect(res.body.name).toBe('David');
        });
    });
});

const setUpExistingCustomer = async () => {
    token = new User({ isAdmin: true }).generateAuthToken();

    customer = await Customer.create({ name: 'David', isGold: true, phone: '6082900083' });

    return customer;
};