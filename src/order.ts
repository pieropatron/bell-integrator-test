import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  productName: string;

  @Column()
  creationDate: Date;

  @Column()
  status: string;
}