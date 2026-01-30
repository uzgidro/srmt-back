import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelVolumeEntity } from './level-volume.entity';
import { LevelVolumeService } from './level-volume.service';
import { LevelVolumeController } from './level-volume.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LevelVolumeEntity])],
  controllers: [LevelVolumeController],
  providers: [LevelVolumeService],
})
export class LevelVolumeModule {
}