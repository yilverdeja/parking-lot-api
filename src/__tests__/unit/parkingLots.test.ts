import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import {
	clearDatabase,
	closeDatabase,
	connectDatabase,
} from '../../db/dbHandler';
import { handleErrors } from '../../middleware/handleErrors';
import parkingLots from '../../routes/parkingLots';
import { generateToken } from '../../utils/userToken';

// Setup the server
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api/parkingLots', parkingLots);
app.use(handleErrors);

// Create users
const adminToken = generateToken('admin');
const managerToken = generateToken('manager');

// Variables
let mongod: MongoMemoryServer;

// Before tests start, connect to the in-memory DB
beforeAll(async () => (mongod = await connectDatabase()));

// After each test, clear the DB
afterEach(async () => await clearDatabase());

// After all tests, close the DB
afterAll(async () => await closeDatabase(mongod));

/**
 * Tests the src/routes/parkingLot
 */
describe('Parking Lot Management', () => {
	it('should fail to get a parking lot with an invalid parking lot id', async () => {
		await request(app)
			.get('/api/parkingLots/123')
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(500);
	});
	it('should create a parking lot correctly', async () => {
		const response = await request(app)
			.post('/api/parkingLots')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				name: 'My Parking Lot',
				location: 'Hong Kong',
				hourlyCost: 10,
				capacity: 5,
			})
			.expect(200);

		expect(response.body).toHaveProperty('_id');
		expect(response.body).toMatchObject({
			name: 'My Parking Lot',
			location: 'Hong Kong',
			hourlyCost: 10,
			capacity: 5,
			lots: [false, false, false, false, false],
			lotsOccupied: 0,
			numDrivers: 0,
		});
	});

	it('should create then retrieve that parking lot by its id', async () => {
		const createResponse = await request(app)
			.post('/api/parkingLots')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				name: 'My Other Parking Lot',
				location: 'Hong Kong',
				hourlyCost: 10,
				capacity: 5,
			})
			.expect(200);

		const { _id: parkingLotId } = createResponse.body;
		const getResponse = await request(app)
			.get(`/api/parkingLots/${parkingLotId}`)
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(200);

		expect(getResponse.body).toMatchObject({
			name: 'My Other Parking Lot',
			location: 'Hong Kong',
			hourlyCost: 10,
			capacity: 5,
		});
	});

	it('should update the hourlyCost of the parking lot correctly', async () => {
		const createResponse = await request(app)
			.post('/api/parkingLots')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				name: 'Parking Lot Hourly',
				location: 'Hong Kong',
				hourlyCost: 10,
				capacity: 5,
			});

		const { _id: parkingLotId } = createResponse.body;
		const patchResponse = await request(app)
			.patch(`/api/parkingLots/${parkingLotId}`)
			.set('Authorization', `Bearer ${managerToken}`)
			.send({ hourlyCost: 15 })
			.expect(200);
		expect(patchResponse.body).toMatchObject({
			name: 'Parking Lot Hourly',
			location: 'Hong Kong',
			hourlyCost: 15,
			capacity: 5,
		});
	});

	it('should delete a parking lot correctly', async () => {
		const createResponse = await request(app)
			.post('/api/parkingLots')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				name: 'Parking Lot to Delete',
				location: 'Hong Kong',
				hourlyCost: 10,
				capacity: 5,
			});

		const { _id: parkingLotId } = createResponse.body;
		const deleteResponse = await request(app)
			.delete(`/api/parkingLots/${parkingLotId}`)
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(200);

		expect(deleteResponse.body).toMatchObject({
			name: 'Parking Lot to Delete',
			location: 'Hong Kong',
			hourlyCost: 10,
			capacity: 5,
		});

		// can no longer retrieve a non-existing parking lot
		await request(app)
			.get(`/api/parkingLots/${parkingLotId}`)
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(404);
	});

	it('should get all parking lots available', async () => {
		await request(app)
			.post('/api/parkingLots')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				name: 'My Other Parking Lot',
				location: 'Hong Kong',
				hourlyCost: 10,
				capacity: 5,
			});

		await request(app)
			.post('/api/parkingLots')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				name: 'My Other Parking Lot',
				location: 'Hong Kong',
				hourlyCost: 10,
				capacity: 5,
			});

		await request(app)
			.post('/api/parkingLots')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				name: 'My Other Parking Lot',
				location: 'Hong Kong',
				hourlyCost: 10,
				capacity: 5,
			});

		const getAllResponse = await request(app)
			.get(`/api/parkingLots`)
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(200);

		expect(getAllResponse.body).toHaveLength(3);
	});
});
