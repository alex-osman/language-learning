import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('actors')
export class Actor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, nullable: true, unique: true })
  initial: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['male', 'female', 'fictional'],
    default: 'male',
  })
  type: 'male' | 'female' | 'fictional';
}
