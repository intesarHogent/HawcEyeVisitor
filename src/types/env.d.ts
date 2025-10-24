export type ResourceType = "room" | "car" | "parking";

export type BookingWindow = { from: string; to: string };

export type Base = {
  id: string;
  name: string;
  type: ResourceType;
  location?: string;
  image?: string;
  description?: string;
  pricePerHour: number;      
};

export type RoomResource = Base & {
  type: "room";
  capacity?: number;
  equipment?: string[];
  bookings?: BookingWindow[];   
};

export type CarResource = Base & {
  type: "car";
  plate?: string;
  fuel?: string;
  rangeKm?: number;
  lastService?: string;
  bookings?: BookingWindow[];   
};

export type ParkingResource = Base & {
  type: "parking";
  covered?: boolean;
  evCharger?: boolean;
  bookings?: BookingWindow[];    
};

export type Resource = RoomResource | CarResource | ParkingResource;