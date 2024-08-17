import { AppError } from '../utils/errors';
import ParkingSession from '../models/parkingSession';
import parkingLotService from '../services/parkingLotService';

// Helper function to calculate charges
function calculateCharges(entryTime: Date, exitTime: Date, hourlyCost: number) {
	const elapsedTime = exitTime.getTime() - entryTime.getTime();
	const elapsedTimeHours = elapsedTime / (1000 * 60 * 60);
	return Math.max(1, elapsedTimeHours) * hourlyCost;
}

class ParkingSessionService {
	async getAllParkingSessions() {
		return await ParkingSession.find();
	}

	async getActiveDriverSession(driverId: string) {
		return ParkingSession.findOne({
			driverId,
			paid: false,
		});
	}

	async getActiveSession(driverId: string, parkingLotId: string) {
		return ParkingSession.findOne({
			driverId,
			parkingLotId,
			paid: false,
		});
	}

	async startSession(driverId: string, parkingLotId: string) {
		const parkingLot = await parkingLotService.getParkingLotById(
			parkingLotId
		);
		const existingSession = await this.getActiveSession(
			driverId,
			parkingLotId
		);
		if (existingSession) {
			throw new AppError('Driver is already within parking lot', 409);
		}

		const anotherExistingSession = await this.getActiveDriverSession(
			driverId
		);
		if (anotherExistingSession) {
			throw new AppError(
				'Driver is already within another parking lot',
				406
			);
		}

		const session = await ParkingSession.create({ driverId, parkingLotId });
		if (!session)
			throw new AppError('Error creating a parking session', 400);

		parkingLot.numDrivers++;
		await parkingLot.save();
		return session;
	}

	async endSession(driverId: string, parkingLotId: string) {
		const parkingLot = await parkingLotService.getParkingLotById(
			parkingLotId
		);
		const existingSession = await this.getActiveSession(
			driverId,
			parkingLotId
		);
		if (!existingSession) {
			throw new AppError('Invalid parking session', 400);
		}
		const exitTime = new Date();
		const amount = calculateCharges(
			existingSession.entryTime,
			exitTime,
			parkingLot.hourlyCost
		);
		const updatedSession = await ParkingSession.findByIdAndUpdate(
			existingSession._id,
			{ exitTime, amount, paid: true },
			{ new: true }
		);

		if (!updatedSession)
			throw new AppError('Error updating a parking session', 400);

		parkingLot.numDrivers--;
		await parkingLot.save();
		return updatedSession;
	}
}

export default new ParkingSessionService();
