export interface StripeMeterEvent {
  customerId: string;
  meterName: string;
  value: number;
  idempotencyKey: string;
}