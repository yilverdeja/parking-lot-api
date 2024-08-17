import mongoose from 'mongoose';

export interface IParkingLotSession {
	_id: string;
	driverId: string;
	parkingLotId: string;
	entryTime: Date;
	exitTime?: Date;
	amount?: number;
	paid: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const parkingSessionSchema = new mongoose.Schema(
	{
		driverId: {
			type: String,
			required: true,
		},
		parkingLotId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ParkingLot',
			required: true,
		},
		entryTime: {
			type: Date,
			default: Date.now,
			required: true,
		},
		exitTime: {
			type: Date,
		},
		amount: {
			type: Number,
		},
		paid: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

export default mongoose.model<IParkingLotSession & mongoose.Document>(
	'ParkingSession',
	parkingSessionSchema
);
