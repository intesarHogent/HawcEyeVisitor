import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export type BookingType = "room" | "car" | "parking";
type DraftFields = { date: string; start: string | null; hours: number };


type DraftState = {
  type: BookingType | null;
  byType: Record<BookingType, DraftFields>;
  date?: string;
  start?: string | null;
  hours?: number;
};


const EMPTY: DraftFields = { date: "", start: null, hours: 1 };


const freshByType = (): Record<BookingType, DraftFields> => ({
  room: { ...EMPTY },
  car: { ...EMPTY },
  parking: { ...EMPTY },
});


const heal = (s: DraftState) => {
  if (!s.byType) s.byType = freshByType();


  if (s.date !== undefined || s.start !== undefined || s.hours !== undefined) {
    const t: BookingType = s.type ?? "room";
    if (!s.byType[t]) s.byType[t] = { ...EMPTY };
    s.byType[t].date = s.date ?? s.byType[t].date ?? "";
    s.byType[t].start = s.start ?? s.byType[t].start ?? null;
    s.byType[t].hours = s.hours ?? s.byType[t].hours ?? 1;
    delete s.date;
    delete s.start;
    delete s.hours;
  }


  (["room", "car", "parking"] as BookingType[]).forEach((t) => {
    if (!s.byType[t]) s.byType[t] = { ...EMPTY };
  });
};

const initialState: DraftState = {
  type: null,
  byType: freshByType(),
};


const bookingDraftSlice = createSlice({
  name: "bookingDraft",
  initialState,
  reducers: {

    setType(s, a: PayloadAction<BookingType>) {
      heal(s);
      s.type = a.payload;
    },

    setDate(s, a: PayloadAction<{ type: BookingType; date: string }>) {
      heal(s);
      s.byType[a.payload.type].date = a.payload.date;
    },

    setStart(s, a: PayloadAction<{ type: BookingType; start: string | null }>) {
      heal(s);
      s.byType[a.payload.type].start = a.payload.start;
    },

    setHours(s, a: PayloadAction<{ type: BookingType; hours: number }>) {
      heal(s);
      s.byType[a.payload.type].hours = a.payload.hours;
    },
  
    resetCurrent(s) {
      heal(s);
      if (s.type) s.byType[s.type] = { ...EMPTY };
    },

    resetAll: () => initialState,
  },
});

export const { setType, setDate, setStart, setHours, resetCurrent, resetAll } = bookingDraftSlice.actions;
export default bookingDraftSlice.reducer;
