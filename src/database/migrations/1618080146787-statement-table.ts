import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class statementTable1618080146787 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "statements",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "user_id",
            type: "uuid",
          },
          {
            name: "transfer_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "description",
            type: "varchar",
          },
          {
            name: "amount",
            type: "decimal",
            precision: 5,
            scale: 2,
          },
          {
            name: "type",
            type: "enum",
            enum: ["deposit", "withdraw"],
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
        foreignKeys: [
          {
            name: "FKStatement",
            columnNames: ["user_id"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          {
            name: "FKTransfers",
            columnNames: ["transfer_id"],
            referencedTableName: "transfers",
            referencedColumnNames: ["id"],
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("statements");
  }
}
