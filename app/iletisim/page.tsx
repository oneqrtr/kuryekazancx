import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactWhatsAppForm } from '@/components/ContactWhatsAppForm';

export const metadata: Metadata = {
  title: 'İletişim | İstek, Öneri ve İş Birliği | KuryeKazanc',
  description:
    'İstek, öneri ve iş birliği talepleriniz için iletişim formu. WhatsApp üzerinden bize ulaşın.',
};

export default function IletisimPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-gray-800">
      <nav className="mb-8 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">
          Ana Sayfa
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">İletişim</span>
      </nav>

      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">İşbirliği yapalım</h1>
        <p className="mt-2 text-lg md:text-xl font-medium text-blue-600">İş Birliği</p>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          İstek, öneri ve iş birliği için formu doldurun; bilgileriniz WhatsApp üzerinden iletilecek. E-posta:{' '}
          <a href="mailto:kuryes.up@gmail.com" className="text-blue-600 hover:underline font-medium">
            kuryes.up@gmail.com
          </a>
        </p>
      </header>

      <ContactWhatsAppForm />

      <p className="mt-8 text-center text-sm text-gray-500">
        Doğrudan aramak için:{' '}
        <a href="tel:+905513546274" className="text-blue-600 hover:underline">
          +90 551 354 6274
        </a>
      </p>
    </div>
  );
}
