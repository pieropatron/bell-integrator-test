import { Entity, ObjectIdColumn, ObjectId, Column } from 'typeorm';

@Entity()
export class Order {
	@ObjectIdColumn()
	_id: ObjectId;

	@Column()
	productName: string;

	@Column()
	creationDate: Date;

	@Column()
	status: 'new' | 'packed' | 'processing' | 'delivered' | 'return';
}
