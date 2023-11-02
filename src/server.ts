import express, { Response } from 'express';
import bodyParser from 'body-parser';
import { DataSource } from 'typeorm';
import Joi from '@hapi/joi';
import fsp from 'fs/promises';
import { ObjectId } from 'mongodb';

import { Order } from './order.js';
import { DeliverySettings } from './delivery-settings.js';

const DS = new DataSource({
	type: 'mongodb',
	host: '127.0.0.1',
	// host: 'localhost',
	port: 27017,
	database: 'test',
	synchronize: false,
	entities: [Order],
});

const orderRepository = DS.getMongoRepository(Order);

// Define the validation schema using Joi
const schemaAlterCommon: Record<string, Joi.SchemaFunction> = {
	post: schema => schema.required(),
	patch: schema => schema.optional(),
	get: schema => schema.optional(),
};

const orderSchemaBase = Joi.object({
	_id: Joi.string().alter({
		post: schema => schema.forbidden(),
		patch: schema => schema.forbidden(),
		get: schema => schema.optional(),
	}),
	productName: Joi.string().alter(schemaAlterCommon),
	creationDate: Joi.date().alter(schemaAlterCommon),
	status: Joi.string().valid('new', 'packed', 'processing', 'delivered', 'return').alter(schemaAlterCommon),
});

const orderSchemas = {
	GET: orderSchemaBase.tailor('get'),
	POST: orderSchemaBase.tailor('post'),
	PATCH: (orderSchemaBase.tailor('patch') as Joi.ObjectSchema).min(1),
};

const validateOptions: Joi.ValidationOptions = { stripUnknown: true };

type OrderResp = Response<any, any> & {
	validate: (data: any) => any;
};

const start_app = async () => {
	// Create Express app
	const app = express();
	app.use(bodyParser.json());
	await DS.initialize();

	// Route
	const routeOrder = express.Router();

	routeOrder.all('*', async (req, res: OrderResp, next) => {
		const schema = orderSchemas[req.method];
		if (!schema) {
			return res.status(405).json({ error: 'Not allowed' });
		}

		res.validate = data => {
			const { error, value } = schema.validate(data, validateOptions);
			if (error) {
				res.status(400).json({ error: 'Validation error' });
				return;
			}
			return value;
		};

		next();
	});

	routeOrder.post('', async (req, res: OrderResp, next) => {
		try {
			const data = res.validate(req.body);
			if (!data) return;

			const order = new Order();
			order.productName = data.productName;
			order.creationDate = data.creationDate;
			order.status = data.status;

			await orderRepository.save(order);
			res.status(201).json({ message: 'Order created' });
		} catch (e) {
			next(e);
		}
	});

	routeOrder.get('/:id', async (req, res, next) => {
		try {
			const order = await orderRepository.findOneBy({
				_id: new ObjectId(req.params.id),
			});
			res.json(order);
		} catch (e) {
			next(e);
		}
	});

	routeOrder.get('', async (req, res: OrderResp, next) => {
		try {
			const query = res.validate(req.query);
			if (!query) return;
			const orders = await orderRepository.find(query);
			res.json(orders);
		} catch (e) {
			next(e);
		}
	});

	routeOrder.patch('/:id', async (req, res: OrderResp, next) => {
		try {
			const $set = res.validate(req.body);
			if (!$set) return;

			const { matchedCount } = await orderRepository.updateOne({ _id: new ObjectId(req.params.id) }, { $set });
			if (!matchedCount) {
				return res.status(404).json({ error: 'Order not found' });
			}

			return res.json({ message: 'Order updated successfully' });
		} catch (e) {
			next(e);
		}
	});

	app.use('/order', routeOrder);

	app.get('/delivery', async (req, res) => {
		const delivery_data = await fsp.readFile('delivery.csv', 'utf8');
		const delivery: DeliverySettings[] = [];
		delivery_data.split('\n').forEach(line => {
			line = line.trim();
			if (!line) return;
			const [id, settingName, settingValue] = line.split('\t');
			const item = new DeliverySettings();
			item.id = id;
			item.settingName = settingName;
			item.settingValue = settingValue;
			delivery.push(item);
		});

		res.json(delivery);
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	app.use((error: Error, req, res, next) => {
		if (error) {
			try {
				console.error(error);
				res.status(500).json({ error: 'Internal server error' });
			} catch (e) {
				console.error(`final express error`, e);
			}
		}
	});

	app.listen(3000, () => {
		console.log('Server is running on port 3000');
	});
};

start_app().catch(e => {
	console.error(e);
	process.exit(1);
});
