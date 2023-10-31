import express from 'express';
import bodyParser from 'body-parser';
import { createConnection, getConnection, Connection } from 'typeorm';
import * as Joi from '@hapi/joi';
import * as fs from 'fs';

import { Order } from './order';
import { DeliverySettings } from './delivery-settings';

// Define the validation schema using Joi
const orderSchema = Joi.object({
  id: Joi.string().required(),
  productName: Joi.string().required(),
  creationDate: Joi.date().required(),
  status: Joi.string().valid('new', 'packed', 'processing', 'delivered', 'return').required(),
});

// Create Express app
const app = express();
app.use(bodyParser.json());

// TypeORM connection setup
let connection: Connection;

createConnection()
  .then((connection) => {
    const orderRepository = connection.getRepository(Order);
    const deliverySettingRepository = connection.getRepository(DeliverySettings);
  })
  .catch((error) => console.log('TypeORM connection error: ', error));

// Routes
app.post('/order', async (req, res) => {
  try {
    const { id, productName, creationDate, status } = req.body;
    const { error } = orderSchema.validate({ id, productName, creationDate, status });

    if (error) {
      return res.status(400).json({ error: 'Validation error' });
    }

    const order = new Order();
    order.id = id;
    order.productName = productName;
    order.creationDate = creationDate;
    order.status = status;

    await orderRepository.save(order);
    res.json({ message: 'Order created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/order', async (req, res) => {
  try {
    const orders = await orderRepository.find();

    const order = orders.find(o => o.id == req.params.id);

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/order', async (req, res) => {
  try {
    const orders = await orderRepository.find();
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/order', async (req, res) => {
  try {
    const order = await orderRepository.findOne(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    order.productName = req.body.productName;
    order.status = req.body.status;
    order.creationDate = req.body.creationDate;

    await orderRepository.save(order);

    return res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/delivery', async (req, res) => {
  res.json(fs.readFile('delivery.csv'));
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
