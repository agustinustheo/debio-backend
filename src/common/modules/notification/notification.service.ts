import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTimeProxy } from '../proxies/date-time/date-time.proxy';
import { Between, In, Repository } from 'typeorm';
import { NotificationDto } from './dto/notification.dto';
import { Notification } from './models/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly dateTimeProxy: DateTimeProxy,
  ) {}

  getAllByToId(
    to: string,
    startBlock: string,
    endBlock: string,
    role: string,
    from: string,
  ) {
    return this.notificationRepository.find({
      where: {
        to,
        deleted_at: null,
        block_number: Between(startBlock, endBlock),
        role,
        from,
      },
      order: {
        updated_at: 'DESC',
      },
    });
  }

  insert(data: NotificationDto) {
    const notification = new Notification();
    notification.role = data.role;
    notification.entity_type = data.entity_type;
    notification.entity = data.entity;
    notification.description = data.description;
    notification.read = data.read;
    notification.created_at = data.created_at;
    notification.updated_at = data.updated_at;
    notification.deleted_at = data.deleted_at;
    notification.from = data.from;
    notification.to = data.to;

    return this.notificationRepository.save(notification);
  }

  async setNotificationHasBeenReadById(id) {
    return await this.notificationRepository.update(
      { id },
      {
        updated_at: await this.dateTimeProxy.new(),
        read: true,
      },
    );
  }

  async setNotificationHasBeenReadByIds(ids: string[]) {
    return await this.notificationRepository.update(
      {
        id: In(ids),
        read: false,
      },
      {
        updated_at: await this.dateTimeProxy.new(),
        read: true,
      },
    );
  }

  async setBulkNotificationHasBeenRead(to) {
    return await this.notificationRepository.update(
      {
        to,
        read: false,
      },
      {
        updated_at: await this.dateTimeProxy.new(),
        read: true,
      },
    );
  }
}
