
import { Buffer } from 'node:buffer';
import * as fs from 'node:fs';
import * as path from 'node:path';

const LINE_API_URL = 'https://api.line.me/v2/bot';
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

if (!CHANNEL_ACCESS_TOKEN) {
  console.error('錯誤：環境變數 LINE_CHANNEL_ACCESS_TOKEN 未設定。');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
};

interface RichMenu {
  size: { width: number; height: number };
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: RichMenuArea[];
}

interface RichMenuArea {
  bounds: { x: number; y: number; width: number; height: number };
  action: { type: string; text?: string; uri?: string };
}

const richMenuConfig: RichMenu = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: 'YoCHiLL Default Rich Menu',
  chatBarText: '查看更多資訊',
  areas: [
    // 立即預約
    { bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: 'message', text: '立即預約' } },
    // 醫美配送
    { bounds: { x: 833, y: 0, width: 834, height: 843 }, action: { type: 'message', text: '醫美配送' } },
    // 術後護理
    { bounds: { x: 1667, y: 0, width: 833, height: 843 }, action: { type: 'message', text: '術後護理' } },
    // 案例見證
    { bounds: { x: 0, y: 843, width: 833, height: 843 }, action: { type: 'message', text: '案例見證' } },
    // 會員中心
    { bounds: { x: 833, y: 843, width: 834, height: 843 }, action: { type: 'message', text: '會員中心' } },
    // 聯絡我們
    { bounds: { x: 1667, y: 843, width: 833, height: 843 }, action: { type: 'message', text: '聯絡我們' } },
  ],
};

async function createRichMenu(menuConfig: RichMenu): Promise<string> {
  const response = await fetch(`${LINE_API_URL}/richmenu`, {
    method: 'POST',
    headers,
    body: JSON.stringify(menuConfig),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`建立圖文選單失敗: ${JSON.stringify(data)}`);
  }
  console.log('圖文選單建立成功:', data);
  return data.richMenuId;
}

async function uploadRichMenuImage(richMenuId: string, imagePath: string): Promise<void> {
  const imageBuffer = fs.readFileSync(imagePath);
  const imageContentType = path.extname(imagePath) === '.png' ? 'image/png' : 'image/jpeg';

  const response = await fetch(`${LINE_API_URL}/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      'Content-Type': imageContentType,
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`上傳圖片失敗: ${errorText}`);
  }
  console.log('圖文選單圖片上傳成功。');
}

async function setDefaultRichMenu(richMenuId: string): Promise<void> {
  const response = await fetch(`${LINE_API_URL}/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`設定預設圖文選單失敗: ${errorText}`);
  }
  console.log('已將圖文選單設為預設。');
}

async function listRichMenus(): Promise<void> {
  const response = await fetch(`${LINE_API_URL}/richmenu/list`, { headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`列出圖文選單失敗: ${JSON.stringify(data)}`);
  }
  console.log('現有的圖文選單:', JSON.stringify(data, null, 2));
}

async function deleteRichMenu(richMenuId: string): Promise<void> {
  const response = await fetch(`${LINE_API_URL}/richmenu/${richMenuId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`刪除圖文選單失敗: ${errorText}`);
  }
  console.log(`圖文選單 ${richMenuId} 刪除成功。`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'setup':
        const imagePath = args[1];
        if (!imagePath) {
          console.error('錯誤：請提供圖文選單圖片的路徑。');
          console.error('用法: tsx scripts/setup-rich-menu.ts setup <imagePath>');
          process.exit(1);
        }
        if (!fs.existsSync(imagePath)) {
            console.error(`錯誤：找不到圖片檔案於 ${imagePath}`);
            process.exit(1);
        }
        console.log('開始設定圖文選單...');
        const richMenuId = await createRichMenu(richMenuConfig);
        await uploadRichMenuImage(richMenuId, imagePath);
        await setDefaultRichMenu(richMenuId);
        console.log(`圖文選單設定完成！ Rich Menu ID: ${richMenuId}`);
        break;

      case 'list':
        console.log('正在列出現有的圖文選單...');
        await listRichMenus();
        break;

      case 'delete':
        const menuIdToDelete = args[1];
        if (!menuIdToDelete) {
          console.error('錯誤：請提供要刪除的圖文選單 ID。');
          console.error('用法: tsx scripts/setup-rich-menu.ts delete <richMenuId>');
          process.exit(1);
        }
        console.log(`正在刪除圖文選單 ${menuIdToDelete}...`);
        await deleteRichMenu(menuIdToDelete);
        break;

      default:
        console.log('無效的命令。');
        console.log('可用命令: setup, list, delete');
        console.log('  - setup <imagePath>: 建立、上傳圖片並設定為預設圖文選單');
        console.log('  - list: 列出現有的圖文選單');
        console.log('  - delete <richMenuId>: 刪除指定的圖文選單');
        break;
    }
  } catch (error) {
    if (error instanceof Error) {
        console.error('執行過程中發生錯誤:', error.message);
    } else {
        console.error('發生未知錯誤:', error);
    }
    process.exit(1);
  }
}

main();
