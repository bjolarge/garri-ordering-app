import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderRequest } from './dto/create-order.request';
import { OrdersRepository } from './orders.repository';
import { BILLING_SERVICE } from './constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository:OrdersRepository, @Inject(BILLING_SERVICE)private billingClient:ClientProxy,){}

  async createOrder(request: CreateOrderRequest,authentication: string){
  //return this.ordersRepository.create(request);
  //we call this only if our database call exists
  const session = await this.ordersRepository.startTransaction();
  try {
    const order = await this.ordersRepository.create(request, {session});
    await lastValueFrom(
      this.billingClient.emit('order_created', {
        request,
        Authentication: authentication,
      }),
    );
    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  }
  }

 async getOrders(){
  return this.ordersRepository.find({});
 }
}
