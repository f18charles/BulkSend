/**
 * Shared Type Definitions for BulkSend
 */

export interface Recipient {
  id: string;
  name: string;
  phone: string;
  sent: boolean;
  notes?: string;
}

export type Page = 'home' | 'add-recipients' | 'compose' | 'confirmation';
export type DeviceOS = 'android' | 'ios';
