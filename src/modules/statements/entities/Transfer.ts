import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { User } from "../../users/entities/User";
import { Statement } from "./Statement";

@Entity("transfers")
export class Transfer {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  sender_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "sender_id" })
  sender: User;

  @Column("uuid")
  receiver_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "receiver_id" })
  receiver: User;

  @OneToMany(() => Statement, (statement) => statement.transfer)
  statement: Statement[];

  @CreateDateColumn()
  created_at: Date;

  @CreateDateColumn()
  updated_at: Date;
}
