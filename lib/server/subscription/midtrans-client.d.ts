declare module "midtrans-client" {
  export class Snap {
    constructor(options: { isProduction?: boolean; serverKey?: string; clientKey?: string });
    createTransaction(parameter: {
      transaction_details: { order_id: string; gross_amount: number };
    }): Promise<{ token: string; redirect_url: string }>;
    transaction: {
      status(transactionId: string): Promise<{
        order_id          : string;
        status_code       : string;
        gross_amount      : string;
        signature_key     : string;
        transaction_status: string;
      }>;
    };
  }

  const midtransClient: { Snap: typeof Snap };
  export default midtransClient;
}
