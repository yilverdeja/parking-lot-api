import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import {
	clearDatabase,
	closeDatabase,
	connectDatabase,
} from '../../db/dbHandler';
import { handleErrors } from '../../middleware/handleErrors';
import ParkingLotsRoute from '../../routes/parkingLots';
import ParkingSessionsRoute from '../../routes/parkingSessions';
import { generateToken } from '../../utils/userToken';

// Setup the server
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api/parkingLots', ParkingLotsRoute);
app.use('/api/parkingSessions', ParkingSessionsRoute);
app.use(handleErrors);

// Create users
const adminToken = generateToken('admin');
const managerToken = generateToken('manager');
const systemToken = generateToken('system');

// Variables
let mongod: MongoMemoryServer;
let parkingLotId: string;

// Before tests start, connect to the in-memory DB, create a parking lot and save it
beforeAll(async () => {
	mongod = await connectDatabase();
	const response = await request(app)
		.post('/api/parkingLots')
		.set('Authorization', `Bearer ${adminToken}`)
		.send({
			name: 'My Parking Lot',
			location: 'Hong Kong',
			hourlyCost: 10,
			capacity: 5,
		});

	parkingLotId = response.body._id;
});

// After all tests are done, clear the database and close the in-memory DB
afterAll(async () => {
	await clearDatabase();
	await closeDatabase(mongod);
});

/**
 * Tests the src/routes/parkingSessions
 */
describe('Parking Lot Sessions', () => {
	it('should already include a parking lot in the database', async () => {
		const response = await request(app)
			.get(`/api/parkingLots/${parkingLotId}`)
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(200);

		expect(response.body).toMatchObject({
			name: 'My Parking Lot',
			location: 'Hong Kong',
			hourlyCost: 10,
			capacity: 5,
		});
	});

	it('should only allow the system to check-in a driver and start a session', async () => {
		// tests that starting a session needs authorization
		await request(app)
			.post('/api/parkingSessions/start')
			.send({ driverId: '1', parkingLotId })
			.expect(401);

		// test that starting a session needs an authenticated role
		await request(app)
			.post('/api/parkingSessions/start')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({ driverId: '1', parkingLotId })
			.expect(403);

		// tests the the system
		const response = await request(app)
			.post('/api/parkingSessions/start')
			.set('Authorization', `Bearer ${systemToken}`)
			.send({ driverId: '1', parkingLotId })
			.expect(201);

		expect(response.body).toHaveProperty('_id');
		expect(response.body).toHaveProperty('entryTime');
		expect(response.body).toMatchObject({
			driverId: '1',
			parkingLotId,
			paid: false,
		});
	});

	it('should not allow a checked-in driver to check in again', async () => {
		await request(app)
			.post('/api/parkingSessions/start')
			.set('Authorization', `Bearer ${systemToken}`)
			.send({ driverId: '1', parkingLotId })
			.expect(409);
	});

	it('should get all parking sessions', async () => {
		const response = await request(app)
			.get('/api/parkingSessions')
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(200);
		expect(response.body).toHaveLength(1);
	});

	it('should check out a driver & end a parking session', async () => {
		const response = await request(app)
			.post('/api/parkingSessions/end')
			.set('Authorization', `Bearer ${systemToken}`)
			.send({ driverId: '1', parkingLotId })
			.expect(200);
		expect(response.body).toHaveProperty('_id');
		expect(response.body).toHaveProperty('entryTime');
		expect(response.body).toHaveProperty('exitTime');
		expect(response.body).toHaveProperty('amount');
		expect(response.body).toMatchObject({
			driverId: '1',
			parkingLotId,
			paid: true,
		});
	});

	it('should not allow a checked-out driver to check out again', async () => {
		await request(app)
			.post('/api/parkingSessions/end')
			.set('Authorization', `Bearer ${systemToken}`)
			.send({ driverId: '1', parkingLotId })
			.expect(400);
	});
});
