import express from 'express';
import { authorizeRoles } from '../middleware/authRole';
import { authenticateToken } from '../middleware/authToken';
import { handleAsync } from '../middleware/handleAsync';
import parkingLotService from '../services/parkingLotService';

const router = express.Router();

// get all parking lots
router.get(
	'/',
	authenticateToken,
	authorizeRoles('admin', 'manager'),
	handleAsync(async (req, res, next) => {
		const parkingLots = await parkingLotService.getAllParkingLots();
		res.send(parkingLots);
	})
);

// get a specific parking lot
router.get(
	'/:id',
	authenticateToken,
	authorizeRoles('admin', 'manager'),
	handleAsync(async (req, res) => {
		const parkingLotId = req.params.id;

		const parkingLot = await parkingLotService.getParkingLotById(
			parkingLotId
		);
		res.send(parkingLot);
	})
);

// create a parking lot (admins)
router.post(
	'/',
	authenticateToken,
	authorizeRoles('admin'),
	handleAsync(async (req, res) => {
		const { name, location, hourlyCost, capacity } = req.body;
		const parkingLot = await parkingLotService.createParkingLot(
			name,
			location,
			hourlyCost,
			capacity
		);
		res.send(parkingLot);
	})
);

// edit a parking lot (admins & managers)
router.patch(
	'/:id',
	authenticateToken,
	authorizeRoles('admin', 'manager'),
	handleAsync(async (req, res) => {
		const parkingLotId = req.params.id;
		const { hourlyCost } = req.body;

		const parkingLot = await parkingLotService.updateParkingLotHourlyCost(
			parkingLotId,
			hourlyCost
		);
		res.send(parkingLot);
	})
);

// remove a parking lot (admins)
router.delete(
	'/:id',
	authenticateToken,
	authorizeRoles('admin'),
	handleAsync(async (req, res) => {
		const parkingLotId = req.params.id;

		const parkingLot = await parkingLotService.deleteParkingLot(
			parkingLotId
		);
		res.send(parkingLot);
	})
);

// occupy a lot (only sensors & admins)
router.post(
	'/:parkingLotId/lots/:lotPos/occupy',
	authenticateToken,
	authorizeRoles('admin', 'system'),
	handleAsync(async (req, res) => {
		const parkingLotId = req.params.parkingLotId;
		const lotPos = parseInt(req.params.lotPos);

		const lotInfo = await parkingLotService.occupyLot(parkingLotId, lotPos);
		return res.send(lotInfo);
	})
);

// unoccupy a lot (only sensors & admins)
router.post(
	'/:parkingLotId/lots/:lotPos/release',
	authenticateToken,
	authorizeRoles('admin', 'system'),
	handleAsync(async (req, res) => {
		const parkingLotId = req.params.parkingLotId;
		const lotPos = parseInt(req.params.lotPos);

		const lotInfo = await parkingLotService.releaseLot(
			parkingLotId,
			lotPos
		);
		return res.send(lotInfo);
	})
);

// list the general occupancy of the parking lot
router.get(
	'/:id/occupancy',
	handleAsync(async (req, res) => {
		const parkingLotId = req.params.id;

		const occupancy = await parkingLotService.getGeneralOccupancy(
			parkingLotId
		);
		res.send(occupancy);
	})
);

export default router;
