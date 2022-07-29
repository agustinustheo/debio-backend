import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TransactionTypeList } from './transaction-type.list';

@Entity({ name: 'transaction_type' })
export class TransactionType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: TransactionTypeList;
}
