'use client';

import { useState } from 'react';

const WHATSAPP_E164 = '905513546274';

const topics = ['İstek', 'Öneri', 'İş Birliği'] as const;

export function ContactWhatsAppForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<string>(topics[2]);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      `Konu: ${topic}`,
      `Ad Soyad: ${name.trim()}`,
      `E-posta: ${email.trim()}`,
      '',
      message.trim(),
    ];
    const text = lines.join('\n');
    const url = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 text-left space-y-5"
    >
      <div>
        <label htmlFor="contact-topic" className="block text-sm font-medium text-gray-700 mb-1">
          Konu
        </label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
          Ad Soyad
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
          E-posta
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
          Mesajınız
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px]"
        />
      </div>
      <button
        type="submit"
        className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
      >
        WhatsApp ile gönder
      </button>
      <p className="text-xs text-gray-500 text-center">
        Gönder dediğinizde WhatsApp açılır; mesajı inceleyip gönderebilirsiniz.
      </p>
    </form>
  );
}
