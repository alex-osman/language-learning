import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('props')
export class RadicalProp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 5, nullable: true, unique: true })
  radical: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  prop: string;
}
