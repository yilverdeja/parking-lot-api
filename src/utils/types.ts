export interface ParkingLotGeneralOccupancy {
	capacity: number;
	numDrivers: number;
	lotsOccupied: number;
}

export interface LotInformation {
	lotPosition: number;
	occupied: boolean;
	lotsOccupied: number;
}
