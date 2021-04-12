import { Statement } from "../entities/Statement";

export type TransferTransform = Pick<
  Statement,
  "amount" | "created_at" | "updated_at" | "description" | "user_id" | "id"
> &
  (
    | { type: "transfer_sent"; received_id: string }
    | { type: "transfer_received"; sender_id: string }
  );

export function TransferTransform({
  id,
  amount,
  created_at,
  description,
  type,
  transfer,
  updated_at,
  user_id,
}: Statement): TransferTransform {
  const statement = {
    id,
    amount: Number(amount),
    description,
    created_at,
    updated_at,
    user_id,
  };

  if (type === "withdraw") {
    return {
      ...statement,
      type: "transfer_sent",
      received_id: transfer.receiver_id,
    };
  } else {
    return {
      ...statement,
      type: "transfer_received",
      sender_id: transfer.sender_id,
    };
  }
}
