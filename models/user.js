const mongoose = require('mongoose');
const Joi = require('joi');
const { isEmail } = require('validator');
const config = require('config');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 50,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        minLength: 5,
        maxLength: 255,
        validate: [isEmail, 'invalid email']
    },
    password: {
        type: String,
        minLength: 5,
        maxLength: 1024,
        required: [true, 'Password required']
    },
    isAdmin: {
        type: Boolean
    }
});

userSchema.methods.generateAuthToken = function() {
    return jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get('jwtPrivateKey'));
};

const User = mongoose.model('User', userSchema);

async function validateUser(user) {
    const schema = {
        name: Joi.string().trim().min(5).max(50).required(),
        email: Joi.string().email().min(5).max(255).required(),
        password: Joi.string().min(5).max(255).trim().required()
    };

    try {
        await Joi.validate(user, schema);
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

async function validateAuth(user) {
    const schema = {
        email: Joi.string().email().min(5).max(255).required(),
        password: Joi.string().min(5).max(255).trim().required()
    };

    try {
        await Joi.validate(user, schema);
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

exports.User = User;
exports.userSchema = userSchema;
exports.validateUser = validateUser;
exports.validateAuth = validateAuth;