import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import {
  aiTask,
  apikey,
  chat,
  chatMessage,
  credit,
  order,
  subscription,
  ticket,
  ticketMessage,
  userInvite,
} from '@/config/db/schema';

/**
 * Move every business row of a guest (anonymous) account over to the real
 * user that just claimed it. Runs inside the anonymous plugin's
 * onLinkAccount hook, before the plugin deletes the guest user row — all
 * business tables reference user.id with ON DELETE CASCADE, so anything
 * left behind would be silently destroyed along with the guest account.
 */
export async function migrateGuestUserData(params: {
  fromUserId: string;
  toUserId: string;
  toUserEmail: string;
}): Promise<void> {
  const { fromUserId, toUserId, toUserEmail } = params;
  const database = db();

  for (const table of [order, subscription, credit]) {
    await database
      .update(table)
      .set({ userId: toUserId, userEmail: toUserEmail })
      .where(eq(table.userId, fromUserId));
  }

  for (const table of [
    aiTask,
    apikey,
    chat,
    chatMessage,
    ticket,
    ticketMessage,
    userInvite,
  ]) {
    await database
      .update(table)
      .set({ userId: toUserId })
      .where(eq(table.userId, fromUserId));
  }
}
