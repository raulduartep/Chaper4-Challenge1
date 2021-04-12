import { Statement } from "../entities/Statement";
import { StatementTransform } from "../transformers/StatementTransform";
import { TransferTransform } from "../transformers/TransferTransform";

type TypeTransfer = "transfer_received" | "transfer_sent" | undefined;
export class BalanceMap {
  static toDTO({
    statement,
    balance,
  }: {
    statement: Statement[];
    balance: number;
  }) {
    const parsedStatement = statement.map((statement) => {
      if (statement.transfer) {
        return TransferTransform(statement);
      }

      return StatementTransform(statement);
    });

    return {
      statement: parsedStatement,
      balance: Number(balance),
    };
  }
}
