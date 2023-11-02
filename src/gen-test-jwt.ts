import jwt from 'jsonwebtoken';
import 'dotenv/config';

const { jwt_key = 'key', jwt_iss = 'iss' } = process.env;

console.log('Test token', jwt.sign({ iss: jwt_iss }, jwt_key, { expiresIn: '3y' }));
