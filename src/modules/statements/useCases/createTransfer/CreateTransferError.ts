import { AppError } from "../../../../shared/errors/AppError";

export namespace CreateTransferError {
  export class SenderUserEqualtoReceiverUser extends AppError {
    constructor() {
      super("Sender user equals to receiver user", 400);
    }
  }

  export class SenderUserNotFound extends AppError {
    constructor() {
      super("Sender user not found", 400);
    }
  }

  export class ReceiverUserNotFound extends AppError {
    constructor() {
      super("Receiver user not found", 400);
    }
  }

  export class InsuffientFunds extends AppError {
    constructor() {
      super("Sender user has insufficient funds", 400);
    }
  }
}
