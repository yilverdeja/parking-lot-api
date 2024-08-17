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
const systemToken = generateToken('system');

let mongod: MongoMemoryServer;
let parkingLotId: string;
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

afterAll(async () => {
	await clearDatabase();
	await closeDatabase(mongod);
});

/**
 * Tests the src/routes/parkingLot for lot occupation
 */
describe('Parking Lot Occupancy', () => {
	it('should already include a parking lot in the database', async () => {
		const getResponse = await request(app)
			.get(`/api/parkingLots/${parkingLotId}`)
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(200);
		expect(getResponse.body).toMatchObject({
			name: 'My Parking Lot',
			location: 'Hong Kong',
			hourlyCost: 10,
			capacity: 5,
		});
	});

	it('should occupy an unoccupied lot', async () => {
		const response = await request(app)
			.post(`/api/parkingLots/${parkingLotId}/lots/0/occupy`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(200);
		expect(response.body).toEqual({
			lotPosition: 0,
			occupied: true,
			lotsOccupied: 1,
		});
	});

	it('should not be able to occupy an occupied lot', async () => {
		const response = await request(app)
			.post(`/api/parkingLots/${parkingLotId}/lots/0/occupy`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(400);
		expect(response.body).toHaveProperty('message');
		expect(response.body.message).toContain('occupied');
	});

	it('should fail to occupy an incorrect lot', async () => {
		const response = await request(app)
			.post(`/api/parkingLots/${parkingLotId}/lots/10/occupy`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(404);
		expect(response.body).toHaveProperty('message');
		expect(response.body.message).toContain('not exist');
	});

	it('should provide the general occupancy of a parking lot', async () => {
		const response = await request(app)
			.get(`/api/parkingLots/${parkingLotId}/occupancy`)
			.expect(200);
		expect(response.body).toEqual({
			capacity: 5,
			numDrivers: 0,
			lotsOccupied: 1,
		});
	});

	it('should release an occupied lot', async () => {
		const response = await request(app)
			.post(`/api/parkingLots/${parkingLotId}/lots/0/release`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(200);
		expect(response.body).toEqual({
			lotPosition: 0,
			occupied: false,
			lotsOccupied: 0,
		});
	});

	it('should not be able to release an already released lot', async () => {
		const response = await request(app)
			.post(`/api/parkingLots/${parkingLotId}/lots/0/release`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(400);
		expect(response.body).toHaveProperty('message');
		expect(response.body.message).toContain('unoccupied');
	});

	it('should fail to release an incorrect lot', async () => {
		const response = await request(app)
			.post(`/api/parkingLots/${parkingLotId}/lots/10/release`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(404);
		expect(response.body).toHaveProperty('message');
		expect(response.body.message).toContain('not exist');
	});
});
