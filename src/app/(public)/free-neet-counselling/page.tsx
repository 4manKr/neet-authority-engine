import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeadForm } from './LeadForm';

export const metadata: Metadata = {
  title: 'Free NEET Counselling 2026 — Expert Admission Guidance | NEET Counselling Info',
  description: 'Get free personalized NEET UG counselling from our experts. We help you choose the right medical college based on your rank, category, and budget.',
};

const benefits = [
  { icon: '🎯', title: 'Personalized College List', desc: 'Get a customized list of colleges where you can get admission based on your rank.' },
  { icon: '📊', title: 'Cutoff Analysis', desc: 'Detailed previous year cutoff analysis for your category and preferred state.' },
  { icon: '📋', title: 'Choice Filling Strategy', desc: 'Expert guidance on MCC and state counselling choice filling order.' },
  { icon: '💰', title: 'Fee Comparison', desc: 'Compare tuition fees, hostel charges, and hidden costs across colleges.' },
  { icon: '📞', title: '1-on-1 Expert Call', desc: 'Speak directly with our experienced counsellors for personalized advice.' },
  { icon: '📄', title: 'Document Checklist', desc: 'Complete checklist of all documents required for counselling.' },
];

export default function FreeCounsellingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Free NEET Counselling',
    description: 'Free personalized NEET UG counselling for medical aspirants in India.',
    provider: { '@type': 'Organization', name: 'NEET Counselling Info' },
  };

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-indigo-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Free NEET Counselling' },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Limited Slots Available
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                Get <span className="text-cyan-300">Free</span> NEET Counselling from Our Experts
              </h1>
              <p className="text-lg text-blue-100 mb-6">
                Don&apos;t navigate the complex NEET counselling process alone. Our experts have helped 10,000+ students secure seats in top medical colleges.
              </p>
              <div className="space-y-3">
                {['✅ Personalized college shortlist', '✅ State & AIQ strategy', '✅ Fee & scholarship guidance'].map((item) => (
                  <p key={item} className="text-blue-100 font-medium">{item}</p>
                ))}
              </div>
            </div>

            {/* Lead Form */}
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <LeadForm source="free-counselling" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What You&apos;ll Get</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div key={b.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <span className="text-3xl mb-3 block">{b.icon}</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="bg-green-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Prefer WhatsApp?</h2>
          <p className="text-gray-600 mb-6">Chat with our counsellors directly on WhatsApp for instant guidance.</p>
          <a
            href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20free%20NEET%20counselling%20help"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg text-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
