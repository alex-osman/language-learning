import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sets')
export class Set {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  final: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  toneLocationName1: string;

  @Column({ type: 'text', nullable: true })
  toneLocationDescription1: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  toneLocationName2: string;

  @Column({ type: 'text', nullable: true })
  toneLocationDescription2: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  toneLocationName3: string;

  @Column({ type: 'text', nullable: true })
  toneLocationDescription3: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  toneLocationName4: string;

  @Column({ type: 'text', nullable: true })
  toneLocationDescription4: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  toneLocationName5: string;

  @Column({ type: 'text', nullable: true })
  toneLocationDescription5: string;
}

// Create Table Code:
// CREATE TABLE `sets` (
//   `id` int unsigned NOT NULL AUTO_INCREMENT,
//   `final` varchar(5) DEFAULT NULL,
//   `name` varchar(200) DEFAULT NULL,
//   `description` text,
//   `toneLocationName1` varchar(200) DEFAULT NULL,
//   `toneLocationDescription1` text,
//   `toneLocationName2` varchar(200) DEFAULT NULL,
//   `toneLocationDescription2` text,
//   `toneLocationName3` varchar(200) DEFAULT NULL,
//   `toneLocationDescription3` text,
//   `toneLocationName4` varchar(200) DEFAULT NULL,
//   `toneLocationDescription4` text,
//   `toneLocationName5` varchar(200) DEFAULT NULL,
//   `toneLocationDescription5` text,
//   PRIMARY KEY (`id`)
// ) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
