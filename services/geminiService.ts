// This service has been deprecated for Gemini API calls.
// The functions below are stubs for a future backend integration with Vercel and Supabase.

import { Submission } from '../types';

// --- Placeholder for Telegram Bot notifications ---
// Замените на ваши реальные данные
const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'; // Например: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11'
const TELEGRAM_CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID'; // Например: '-1001234567890' или '123456789'


// Локальное хранилище для имитации базы данных
let submissionsDB: Submission[] = [];

/**
 * Отправляет уведомление в Telegram-бот.
 */
const notifyTelegramBot = async (userName: string) => {
  if (TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN' || TELEGRAM_CHAT_ID === 'YOUR_TELEGRAM_CHAT_ID') {
    console.warn('Telegram Bot Token or Chat ID is not configured. Skipping notification.');
    return;
  }
  const message = `✅ Нова заявка на верифікацію від: *${userName}*`;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    if (!response.ok) {
        console.error('Telegram API error:', await response.json());
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
};

/**
 * Имитирует отправку данных верификации на бэкенд.
 */
export const submitVerification = async (
  userName: string,
  imageData: string,
  videoBlob: Blob | null,
  passportImageData: string
): Promise<Submission> => {
  console.log('Отправка верификации на бэкенд...');
  console.log('Пользователь:', userName);
  console.log('Размер фото:', `${(imageData.length / 1024).toFixed(2)} KB`);
  console.log('Размер фото паспорта:', `${(passportImageData.length / 1024).toFixed(2)} KB`);
  if (videoBlob) {
    console.log('Размер видео:', `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);
  }

  const newSubmission: Submission = {
    id: Date.now().toString(),
    userName,
    imageData,
    passportImageData,
    timestamp: new Date().toISOString(),
  };

  // Имитация задержки сети
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Добавляем в нашу "базу данных" в памяти
  submissionsDB.push(newSubmission);

  // Отправляем уведомление
  await notifyTelegramBot(userName);

  return newSubmission;
};

/**
 * Имитирует получение всех заявок для админ-панели.
 */
export const getSubmissions = async (): Promise<Submission[]> => {
  console.log('Получение заявок с бэкенда...');
  // Имитация задержки сети
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [...submissionsDB].reverse(); // Возвращаем перевернутую копию
};

/**
 * Имитирует удаление всех заявок из базы данных.
 */
export const clearSubmissions = async (): Promise<void> => {
  console.log('Очистка всех заявок на бэкенде...');
  // Имитация задержки сети
  await new Promise(resolve => setTimeout(resolve, 500));
  submissionsDB = [];
};