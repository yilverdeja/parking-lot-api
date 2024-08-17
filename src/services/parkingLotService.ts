import { AppError } from '../utils/errors';
import ParkingLot from '../models/parkingLot';
import { LotInformation, ParkingLotGeneralOccupancy } from '../utils/types';

class ParkingLotService {
	async getAllParkingLots() {
		return await ParkingLot.find().sort('name');
	}

	async getParkingLotById(id: string) {
		const parkingLot = await ParkingLot.findById(id);
		if (!parkingLot) throw new AppError('Parking lot not found', 404);
		return parkingLot;
	}

	async createParkingLot(
		name: string,
		location: string,
		hourlyCost: number,
		capacity: number
	) {
		const lots: boolean[] = [];
		for (let i = 1; i <= capacity; i++) {
			lots.push(false);
		}
		return await ParkingLot.create({
			name,
			location,
			hourlyCost,
			capacity,
			lots,
		});
	}

	async updateParkingLotHourlyCost(id: string, hourlyCost: number) {
		const parkingLot = await ParkingLot.findByIdAndUpdate(
			id,
			{ hourlyCost },
			{ new: true }
		);
		if (!parkingLot) throw new AppError('Parking lot not found', 404);
		return parkingLot;
	}

	async deleteParkingLot(id: string) {
		const parkingLot = await ParkingLot.findByIdAndDelete(id);
		if (!parkingLot) throw new AppError('Parking lot not found', 404);
		return parkingLot;
	}

	async occupyLot(id: string, lotPosition: number): Promise<LotInformation> {
		const parkingLot = await this.getParkingLotById(id);

		if (lotPosition >= parkingLot.lots.length || lotPosition < 0) {
			throw new AppError('This lot number does not exist', 404);
		}

		if (parkingLot.lots[lotPosition]) {
			throw new AppError('Lot is already occupied', 400);
		}

		parkingLot.lots[lotPosition] = true;
		parkingLot.lotsOccupied++;
		await parkingLot.save();

		return {
			lotPosition: lotPosition,
			occupied: parkingLot.lots[lotPosition],
			lotsOccupied: parkingLot.lotsOccupied,
		};
	}

	async releaseLot(id: string, lotPosition: number): Promise<LotInformation> {
		const parkingLot = await this.getParkingLotById(id);

		if (lotPosition >= parkingLot.lots.length || lotPosition < 0) {
			throw new AppError('This lot number does not exist', 404);
		}

		if (!parkingLot.lots[lotPosition]) {
			throw new AppError('Lot is already unoccupied', 400);
		}

		parkingLot.lots[lotPosition] = false;
		parkingLot.lotsOccupied--;
		await parkingLot.save();

		return {
			lotPosition: lotPosition,
			occupied: parkingLot.lots[lotPosition],
			lotsOccupied: parkingLot.lotsOccupied,
		};
	}

	async getGeneralOccupancy(id: string): Promise<ParkingLotGeneralOccupancy> {
		const parkingLot = await this.getParkingLotById(id);
		return {
			capacity: parkingLot.capacity,
			numDrivers: parkingLot.numDrivers,
			lotsOccupied: parkingLot.lotsOccupied,
		};
	}
}

export default new ParkingLotService();
