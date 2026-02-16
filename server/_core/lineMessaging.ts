/**
 * LINE Messaging API Service
 * 用於發送 LINE 訊息通知
 */

import { ENV } from './env';

const LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message';

interface TextMessage {
  type: 'text';
  text: string;
}

interface FlexMessage {
  type: 'flex';
  altText: string;
  contents: any;
}

type LineMessage = TextMessage | FlexMessage;

/**
 * 發送 LINE 訊息給指定用戶
 */
export async function sendLineMessage(userId: string, messages: LineMessage[]) {
  const response = await fetch(`${LINE_MESSAGING_API_URL}/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ENV.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LINE Messaging API error: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * 發送預約確認通知
 */
export async function sendBookingConfirmation(params: {
  userId: string;
  bookingId: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  customerName: string;
}) {
  const { userId, bookingId, serviceName, appointmentDate, appointmentTime, customerName } = params;

  const flexMessage: FlexMessage = {
    type: 'flex',
    altText: '預約確認通知',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '✅ 預約確認',
            weight: 'bold',
            size: 'xl',
            color: '#FFD700',
          },
        ],
        backgroundColor: '#0A1929',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${customerName} 您好`,
            size: 'md',
            margin: 'md',
          },
          {
            type: 'text',
            text: '您的預約已成功建立！',
            size: 'sm',
            color: '#999999',
            margin: 'md',
          },
          {
            type: 'separator',
            margin: 'xl',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'xl',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '預約編號',
                    size: 'sm',
                    color: '#555555',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: bookingId,
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '服務項目',
                    size: 'sm',
                    color: '#555555',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: serviceName,
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '預約日期',
                    size: 'sm',
                    color: '#555555',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: appointmentDate,
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '預約時段',
                    size: 'sm',
                    color: '#555555',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: appointmentTime,
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '如需改期或取消，請聯繫客服',
            size: 'xs',
            color: '#999999',
            align: 'center',
          },
        ],
      },
    },
  };

  return sendLineMessage(userId, [flexMessage]);
}

/**
 * 發送訂單狀態更新通知
 */
export async function sendOrderStatusUpdate(params: {
  userId: string;
  orderId: string;
  status: string;
  totalAmount: number;
  customerName: string;
}) {
  const { userId, orderId, status, totalAmount, customerName } = params;

  const statusText = {
    pending: '待處理',
    confirmed: '已確認',
    processing: '處理中',
    shipped: '已出貨',
    completed: '已完成',
    cancelled: '已取消',
  }[status] || status;

  const flexMessage: FlexMessage = {
    type: 'flex',
    altText: '訂單狀態更新',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📦 訂單狀態更新',
            weight: 'bold',
            size: 'xl',
            color: '#FFD700',
          },
        ],
        backgroundColor: '#0A1929',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${customerName} 您好`,
            size: 'md',
            margin: 'md',
          },
          {
            type: 'text',
            text: `您的訂單狀態已更新為：${statusText}`,
            size: 'sm',
            color: '#999999',
            margin: 'md',
          },
          {
            type: 'separator',
            margin: 'xl',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'xl',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '訂單編號',
                    size: 'sm',
                    color: '#555555',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: orderId,
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '訂單狀態',
                    size: 'sm',
                    color: '#555555',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: statusText,
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                    weight: 'bold',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '訂單金額',
                    size: 'sm',
                    color: '#555555',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: `NT$ ${totalAmount.toLocaleString()}`,
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '如有任何問題，請聯繫客服',
            size: 'xs',
            color: '#999999',
            align: 'center',
          },
        ],
      },
    },
  };

  return sendLineMessage(userId, [flexMessage]);
}
