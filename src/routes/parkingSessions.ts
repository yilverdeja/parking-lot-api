import express from 'express';
import { authorizeRoles } from '../middleware/authRole';
import { authenticateToken } from '../middleware/authToken';
import { handleAsync } from '../middleware/handleAsync';
import parkingSessionService from '../services/parkingSessionService';

const router = express.Router();

// get all parking sessions
router.get(
	'/',
	authenticateToken,
	authorizeRoles('admin', 'manager'),
	handleAsync(async (req, res) => {
		const parkingSessions =
			await parkingSessionService.getAllParkingSessions();
		res.send(parkingSessions);
	})
);

// create a parking session
router.post(
	'/start',
	authenticateToken,
	authorizeRoles('system'),
	handleAsync(async (req, res) => {
		const { driverId, parkingLotId } = req.body;
		const newParkingSession = await parkingSessionService.startSession(
			driverId,
			parkingLotId
		);
		res.status(201).send(newParkingSession);
	})
);

// end a parking session
router.post(
	'/end',
	authenticateToken,
	authorizeRoles('system'),
	handleAsync(async (req, res) => {
		const { driverId, parkingLotId } = req.body;
		const newParkingSession = await parkingSessionService.endSession(
			driverId,
			parkingLotId
		);
		return res.send(newParkingSession);
	})
);

export default router;
