import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class DeliverySettings {
	@PrimaryGeneratedColumn()
	id: string;

	@Column()
	settingName: string;

	@Column()
	settingValue: string;
}
