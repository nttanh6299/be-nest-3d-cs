export interface IGenericMessageBody<T = unknown> {
  message: string;
  data?: T;
}
