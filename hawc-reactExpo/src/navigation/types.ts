// src/navigation/types.ts
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { StackScreenProps } from "@react-navigation/stack";
import { Resource, ResourceType } from "../types/env";

export type RootStackParamList = {
  ResourceBrowse: undefined;
  BookingCalendar: { type: ResourceType };
  BookingList: { type: ResourceType; date: string; start: string; hours: number };
  BookingDetail: { data: Resource; date?: string; start?: string; end?: string };
  AdminInvoice: undefined;


  Payment: {
    data: Resource;
    date: string;
    start: string;
    end: string;
    total: number;       
  };

  PaymentWebView: {
    checkoutUrl: string;
    returnUrl: string;
    booking: {
      paymentId: string;
      resourceId: string;
      resourceName: string;
      type: ResourceType;
      location: string;
      startIso: string;
      endIso: string;
      total: number;
      userId: string;
      userEmail: string | null;
    };
  };

  BookingSuccess: {
    via?: "invoice" | "payment";
    data?: Resource;
    date?: string;
    start?: string;
    end?: string;
    total?: number;
  };

  About: undefined;
};

export type TabParamsList = {
  Home: undefined;
  MyBookings: undefined;
  Profile: undefined;
};

export type RootStackNavProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type TabNavProps<T extends keyof TabParamsList> =
  BottomTabScreenProps<TabParamsList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList, TabParamsList {}
  }
}
