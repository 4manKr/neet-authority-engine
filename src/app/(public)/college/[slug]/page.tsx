import { JsonLd } from '@/components/seo/JsonLd';
import dbConnect from '@/lib/db/mongoose';
import { College } from '@/lib/db/models/College';
import { notFound } from 'next/navigation';

export const revalidate = 86400; // ISR: Revalidate every 24 hours

export async function generateStaticParams() {
  try {
    await dbConnect();
    const colleges = await College.find({}, { slug: 1 }).limit(100);
    return colleges.map((college) => ({
      slug: college.slug,
    }));
  } catch {
    return [];
  }
}

export default async function CollegePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  await dbConnect();
  const college = await College.findOne({ slug: resolvedParams.slug }).lean();

  if (!college) {
    notFound();
  }

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "name": college.name,
    "description": college.description || "Medical College",
    "url": `https://example.com/college/${college.slug}`,
  };

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={jsonLdData} />
      
      <div className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">{college.name}</h1>
          <p className="mt-4 text-xl text-blue-100">
            {college.location?.city}, {college.location?.state}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {college.isDataComplete ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed">{college.description || "Coming Soon."}</p>
            </div>
            <div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Facts</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li><strong>Ownership:</strong> {college.ownership}</li>
                  {college.fees?.tuition && <li><strong>Tuition Fee:</strong> ₹{college.fees.tuition.toLocaleString()}</li>}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-400">Detailed Information Coming Soon</h2>
          </div>
        )}
      </div>
    </main>
  );
}
