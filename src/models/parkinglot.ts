import mongoose from 'mongoose';

export interface IParkingLot {
	_id: string;
	name: string;
	location: string;
	hourlyCost: number;
	lots: boolean[];
	capacity: number;
	lotsOccupied: number;
	numDrivers: number;
	createdAt: Date;
	updatedAt: Date;
}

const parkingLotSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		location: {
			type: String,
			required: true,
		},
		hourlyCost: {
			type: Number,
			required: true,
		},
		capacity: {
			type: Number,
			required: true,
		},
		lots: [
			{
				type: Boolean,
				required: true,
				default: false,
			},
		],
		numDrivers: {
			type: Number,
			default: 0,
		},
		lotsOccupied: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

const ParkingLot = mongoose.model<IParkingLot & mongoose.Document>(
	'ParkingLot',
	parkingLotSchema
);
export default ParkingLot;
