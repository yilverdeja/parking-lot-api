import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import {
	clearDatabase,
	closeDatabase,
	connectDatabase,
} from '../../db/dbHandler';
import { handleErrors } from '../../middleware/handleErrors';
import { IParkingLot } from '../../models/parkingLot';
import { IParkingLotSession } from '../../models/parkingSession';
import ParkingLotsRoute from '../../routes/parkingLots';
import ParkingSessionsRoute from '../../routes/parkingSessions';
import { generateToken } from '../../utils/userToken';

// Setup the server
const app = express();
app.use(express.json());
app.use('/api/parkingLots', ParkingLotsRoute);
app.use('/api/parkingSessions', ParkingSessionsRoute);
app.use(handleErrors);

// Create users
const adminToken = generateToken('admin');
const managerToken = generateToken('manager');
const systemToken = generateToken('system');

// Configuring Mongodb In Memory
let mongod: MongoMemoryServer;
beforeAll(async () => {
	mongod = await connectDatabase();
});

afterAll(async () => {
	await clearDatabase();
	await closeDatabase(mongod);
});

// saved variables
const DRIVER1_ID = '1';
const DRIVER2_ID = '2';
let PL1_ID: string, PL2_ID: string;

/**
 * Tests the management of parking lots
 */
describe('Parking Lot Management Scenario', () => {
	it('should allow an admin to create 2 parking lots', async () => {
		const r1 = await request(app)
			.post('/api/parkingLots')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				name: 'Parking Lot 1',
				location: 'Left',
				hourlyCost: 10,
				capacity: 5,
			});

		PL1_ID = r1.body._id;

		const r2 = await request(app)
			.post('/api/parkingLots')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				name: 'Parking Lot 2',
				location: 'Right',
				hourlyCost: 12,
				capacity: 7,
			});

		PL2_ID = r2.body._id;

		expect(r1.status).toBe(200);
		expect(r2.status).toBe(200);
	});

	it('should allow an admin to force set some lots as occupied', async () => {
		const lotOperations = [
			{ parkingLotId: PL1_ID, lotIndex: 0 },
			{ parkingLotId: PL1_ID, lotIndex: 2 },
			{ parkingLotId: PL1_ID, lotIndex: 3 },
			{ parkingLotId: PL1_ID, lotIndex: 4 },
			{ parkingLotId: PL2_ID, lotIndex: 1 },
			{ parkingLotId: PL2_ID, lotIndex: 3 },
			{ parkingLotId: PL2_ID, lotIndex: 5 },
		];

		for (const lot of lotOperations) {
			await request(app)
				.post(
					`/api/parkingLots/${lot.parkingLotId}/lots/${lot.lotIndex}/occupy`
				)
				.set('Authorization', `Bearer ${adminToken}`)
				.expect(200);
		}
	});

	it('should let a manager check parking lot occupancy', async () => {
		// Manager checks parking lot occupancy
		const response = await request(app)
			.get('/api/parkingLots')
			.set('Authorization', `Bearer ${managerToken}`);

		// Check if the response is an array with exactly 2 elements
		expect(Array.isArray(response.body)).toBeTruthy();
		expect(response.body.length).toBe(2);

		// Check for PL1 details
		const PL1 = response.body.find(
			(pl: IParkingLot) => pl._id === PL1_ID
		) as IParkingLot;
		expect(PL1).toBeDefined();
		expect(PL1.lotsOccupied).toBe(4);
		expect(PL1.lots).toEqual([true, false, true, true, true]);

		// Check for PL2 details
		const PL2 = response.body.find(
			(pl: IParkingLot) => pl._id === PL2_ID
		) as IParkingLot;
		expect(PL2).toBeDefined();
		expect(PL2.lotsOccupied).toBe(3);
		expect(PL2.lots).toEqual([
			false,
			true,
			false,
			true,
			false,
			true,
			false,
		]);
	});

	it('should only allow managers to edit a parking lot', async () => {
		// attempts to create a parking lot
		await request(app)
			.post('/api/parkingLots')
			.set('Authorization', `Bearer ${managerToken}`)
			.send({
				name: 'Parking Lot X',
				location: 'Middle',
				hourlyCost: 10,
				capacity: 5,
			})
			.expect(403);

		// attempts to delete a parking lot
		await request(app)
			.delete(`/api/parkingLots/${PL1_ID}`)
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(403);

		// attempts to edit a parking lot
		await request(app)
			.patch(`/api/parkingLots/${PL1_ID}`)
			.set('Authorization', `Bearer ${managerToken}`)
			.send({ hourlyCost: 5 })
			.expect(200);
	});

	it('should let manager get parking sessions and see no parking sessions available', async () => {
		// Manager checks parking sessions
		const response = await request(app)
			.get('/api/parkingSessions')
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(200);

		// Check if the response is an array with exactly 0 elements
		expect(Array.isArray(response.body)).toBeTruthy();
		expect(response.body.length).toBe(0);
	});
});

/**
 * Test the usage of the parking lot
 * DR: Driver, PL: Parking Lot
 */
describe('Parking Lot Usage Scenario', () => {
	it('should let DR1 into PL1', async () => {
		await request(app)
			.post('/api/parkingSessions/start')
			.set('Authorization', `Bearer ${systemToken}`)
			.send({ driverId: DRIVER1_ID, parkingLotId: PL1_ID })
			.expect(201);

		await request(app)
			.post(`/api/parkingLots/${PL1_ID}/lots/1/occupy`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(200);

		const response = await request(app)
			.get(`/api/parkingLots/${PL1_ID}/occupancy`)
			.expect(200);
		expect(response.body).toEqual({
			capacity: 5,
			numDrivers: 1,
			lotsOccupied: 5,
		});
	});
	it('should let DR2 into PL2', async () => {
		await request(app)
			.post('/api/parkingSessions/start')
			.set('Authorization', `Bearer ${systemToken}`)
			.send({ driverId: DRIVER2_ID, parkingLotId: PL2_ID })
			.expect(201);

		await request(app)
			.post(`/api/parkingLots/${PL2_ID}/lots/0/occupy`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(200);

		const response = await request(app)
			.get(`/api/parkingLots/${PL2_ID}/occupancy`)
			.expect(200);
		expect(response.body).toEqual({
			capacity: 7,
			numDrivers: 1,
			lotsOccupied: 4,
		});
	});
	it('should let DR2 change lot positions', async () => {
		await request(app)
			.post(`/api/parkingLots/${PL2_ID}/lots/0/release`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(200);

		await request(app)
			.post(`/api/parkingLots/${PL2_ID}/lots/2/occupy`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(200);

		const response = await request(app)
			.get(`/api/parkingLots/${PL2_ID}/occupancy`)
			.expect(200);
		expect(response.body).toEqual({
			capacity: 7,
			numDrivers: 1,
			lotsOccupied: 4,
		});
	});

	it('should let the manager see the current parking lot status', async () => {
		await request(app).get(`/api/parkingLots/${PL1_ID}`).expect(401);

		const r1 = await request(app)
			.get(`/api/parkingLots/${PL1_ID}`)
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(200);

		expect(r1.body).toMatchObject({
			hourlyCost: 5,
			lots: [true, true, true, true, true],
			capacity: 5,
			lotsOccupied: 5,
			numDrivers: 1,
		});

		const r2 = await request(app)
			.get(`/api/parkingLots/${PL2_ID}`)
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(200);

		expect(r2.body).toMatchObject({
			hourlyCost: 12,
			lots: [false, true, true, true, false, true, false],
			capacity: 7,
			lotsOccupied: 4,
			numDrivers: 1,
		});
	});

	it('should not allow DR1 to enter PL2 while it is in PL1', async () => {
		await request(app)
			.post('/api/parkingSessions/start')
			.set('Authorization', `Bearer ${systemToken}`)
			.send({ driverId: DRIVER1_ID, parkingLotId: PL2_ID })
			.expect(406);
	});

	it('should allow DR1 to enter PL2 after it has left PL1', async () => {
		// driver 1 leaves pos 1
		await request(app)
			.post(`/api/parkingLots/${PL1_ID}/lots/1/release`)
			.set('Authorization', `Bearer ${systemToken}`)
			.expect(200);

		// driver 1 checks out of PL1
		await request(app)
			.post('/api/parkingSessions/end')
			.set('Authorization', `Bearer ${systemToken}`)
			.send({ driverId: DRIVER1_ID, parkingLotId: PL1_ID })
			.expect(200);

		// driver 1 checks in to PL2
		await request(app)
			.post('/api/parkingSessions/start')
			.set('Authorization', `Bearer ${systemToken}`)
			.send({ driverId: DRIVER1_ID, parkingLotId: PL2_ID })
			.expect(201);

		// driver 1 checks out of PL2
		await request(app)
			.post('/api/parkingSessions/end')
			.set('Authorization', `Bearer ${systemToken}`)
			.send({ driverId: DRIVER1_ID, parkingLotId: PL2_ID })
			.expect(200);
	});

	it('should report 3 sessions with 2 paid by DR1 and 1 ongoing by DR2', async () => {
		// Manager checks parking sessions
		const response = await request(app)
			.get('/api/parkingSessions')
			.set('Authorization', `Bearer ${managerToken}`)
			.expect(200);

		// Assert response format and count
		expect(response.body).toBeInstanceOf(Array);
		expect(response.body).toHaveLength(3);

		// Filtering and mapping sessions
		const sessions = response.body as IParkingLotSession[];
		const driver1Sessions = sessions.filter(
			(session) => session.driverId === DRIVER1_ID
		);
		const driver2Sessions = sessions.filter(
			(session) => session.driverId === DRIVER2_ID
		);

		// Assertions on sessions
		expect(driver1Sessions).toHaveLength(2);
		expect(driver2Sessions).toHaveLength(1);

		// Check if paid sessions match driver 1's and 2's sessions
		expect(driver1Sessions.every((session) => session.paid)).toBeTruthy();
		expect(driver2Sessions.every((session) => !session.paid)).toBeTruthy();
	});
});
