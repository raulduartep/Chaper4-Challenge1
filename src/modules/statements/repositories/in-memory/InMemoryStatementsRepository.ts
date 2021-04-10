import { Statement } from "../../entities/Statement";
import { ICreateStatementDTO } from "../../useCases/createStatement/ICreateStatementDTO";
import { IGetBalanceDTO } from "../../useCases/getBalance/IGetBalanceDTO";
import { IGetStatementOperationDTO } from "../../useCases/getStatementOperation/IGetStatementOperationDTO";
import { IStatementsRepository } from "../IStatementsRepository";
import { InMemoryTransfersRepository } from "./InMemoryTransfersRepository";

export class InMemoryStatementsRepository implements IStatementsRepository {
  private statements: Statement[] = [];

  async create(data: ICreateStatementDTO): Promise<Statement> {
    const statement = new Statement();

    Object.assign(statement, data);

    this.statements.push(statement);

    return statement;
  }

  async findStatementOperation({
    statement_id,
    user_id,
  }: IGetStatementOperationDTO): Promise<Statement | undefined> {
    return this.statements.find(
      (operation) =>
        operation.id === statement_id && operation.user_id === user_id
    );
  }

  async getUserBalance({
    user_id,
    with_statement = false,
  }: IGetBalanceDTO): Promise<
    { balance: number } | { balance: number; statement: Statement[] }
  > {
    const inMemoryTransfersRepository = new InMemoryTransfersRepository();

    const statement = this.statements.filter(
      (operation) => operation.user_id === user_id
    );

    const statementWithTransfer = await Promise.all(
      statement.map(async (operation) => {
        if (operation.transfer_id) {
          const transfer = await inMemoryTransfersRepository.findById(
            operation.transfer_id
          );

          if (transfer) {
            return {
              ...operation,
              transfer,
            };
          }

          return;
        }

        return;
      })
    );

    const balance = statement.reduce((acc, operation) => {
      if (operation.type === "deposit") {
        return acc + operation.amount;
      } else {
        return acc - operation.amount;
      }
    }, 0);

    if (with_statement) {
      return {
        statement,
        balance,
      };
    }

    return { balance };
  }
}
