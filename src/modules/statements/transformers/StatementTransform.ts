import { Statement } from "../entities/Statement";

export type StatementTransform = Pick<
  Statement,
  | "amount"
  | "created_at"
  | "description"
  | "id"
  | "type"
  | "user_id"
  | "updated_at"
>;

export function StatementTransform({
  id,
  amount,
  created_at,
  description,
  type,
  updated_at,
  user_id,
}: Statement): StatementTransform {
  return {
    id,
    amount: Number(amount),
    description,
    created_at,
    updated_at,
    type,
    user_id,
  };
}
