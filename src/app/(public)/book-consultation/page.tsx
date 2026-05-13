import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeadForm } from '../free-neet-counselling/LeadForm';

export const metadata: Metadata = {
  title: 'Book Expert NEET Consultation 2026 — Premium Admission Guidance',
  description: 'Book a 1-on-1 consultation with our senior NEET counsellors. Get a personalized admission strategy, college recommendations, and choice filling guidance.',
};

export default function BookConsultationPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Book Consultation' },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 bg-amber-500/20 text-amber-300 rounded-full text-sm font-bold mb-4">
                ⭐ Premium Service
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                Book a 1-on-1 Expert Consultation
              </h1>
              <p className="text-lg text-slate-300 mb-8">
                Get a detailed, personalized admission strategy from our senior counsellors with 10+ years of experience.
              </p>

              <div className="space-y-4">
                {[
                  { icon: '🏥', text: 'College-by-college analysis based on your rank' },
                  { icon: '📊', text: 'State vs AIQ quota strategy optimization' },
                  { icon: '💰', text: 'Budget-based college shortlisting' },
                  { icon: '📋', text: 'Complete choice filling mock session' },
                  { icon: '📞', text: 'Dedicated counsellor for entire admission cycle' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-slate-200">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <LeadForm source="book-consultation" showBudget />
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
        <div className="space-y-8">
          {[
            { step: '01', title: 'Fill the Form', desc: 'Share your NEET score, rank, category, and preferences.' },
            { step: '02', title: 'Get Matched', desc: 'We assign a senior counsellor specializing in your state/category.' },
            { step: '03', title: 'Strategy Session', desc: '45-minute detailed call covering all your admission options.' },
            { step: '04', title: 'Ongoing Support', desc: 'Follow-up support through counselling rounds and document verification.' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-6">
              <span className="text-4xl font-black text-blue-100 flex-shrink-0">{item.step}</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="text-gray-500 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
