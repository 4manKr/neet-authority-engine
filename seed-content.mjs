// seed-content.mjs — Populates DB with sample blog posts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neet-engine';

const blogSchema = new mongoose.Schema({
  title: String, slug: String, content: String, excerpt: String,
  category: String, tags: [String], status: String, author: String,
  featuredImage: String, metaTitle: String, metaDescription: String,
  keywords: [String], faqs: [{ question: String, answer: String }],
  viewCount: Number, isFeatured: Boolean, isTrending: Boolean,
  publishedAt: Date,
}, { timestamps: true });

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

const blogs = [
  {
    title: "NEET UG 2026 Complete Counselling Guide — Step by Step Process",
    slug: "neet-ug-2026-counselling-guide",
    category: "Guides",
    tags: ["neet 2026", "counselling", "guide", "admission"],
    excerpt: "Everything you need to know about NEET UG 2026 counselling — from registration to seat allotment. Complete step-by-step guide for medical aspirants.",
    isFeatured: true, isTrending: true, viewCount: 4520,
    content: `## NEET UG 2026 Counselling: Complete Guide\n\nThe NEET UG 2026 counselling process is conducted by the Medical Counselling Committee (MCC) for All India Quota seats and by respective state authorities for state quota seats.\n\n### Key Dates to Remember\n\n| Event | Expected Date |\n|-------|---------------|\n| NEET Result | June 2026 |\n| MCC Registration | July 2026 |\n| Round 1 Allotment | August 2026 |\n| Round 2 Allotment | September 2026 |\n\n### Step-by-Step Process\n\n1. **Register on MCC Portal** — Create your account with NEET roll number\n2. **Pay Registration Fee** — ₹1,000 (General) / ₹500 (SC/ST/PwD)\n3. **Fill Choice Preferences** — Select colleges and courses in order\n4. **Seat Allotment** — Based on rank, category, and choices\n5. **Report to College** — Within the stipulated time\n\n### AIQ vs State Quota\n\nUnder AIQ counselling, 15% of seats in government colleges are filled. The remaining 85% are filled through state counselling.\n\n### Documents Required\n\n- NEET Admit Card & Scorecard\n- Class 10 & 12 Marksheets\n- Category Certificate (if applicable)\n- Domicile Certificate\n- ID Proof (Aadhaar)\n- Passport-size Photographs`,
    faqs: [
      { question: "When does NEET 2026 counselling start?", answer: "NEET 2026 counselling is expected to begin in July 2026 after the results are declared." },
      { question: "What is the counselling fee for NEET?", answer: "The registration fee is ₹1,000 for General/OBC and ₹500 for SC/ST/PwD candidates." },
      { question: "Can I participate in both AIQ and State counselling?", answer: "Yes, you can register for both AIQ and State counselling simultaneously." },
    ],
  },
  {
    title: "NEET 2026 Expected Cutoff — Category-wise Analysis",
    slug: "neet-2026-expected-cutoff-category-wise",
    category: "Cutoffs",
    tags: ["cutoff", "neet 2026", "category-wise", "analysis"],
    excerpt: "Detailed category-wise expected cutoff analysis for NEET UG 2026 based on previous year trends and exam difficulty level.",
    isFeatured: true, isTrending: true, viewCount: 8930,
    content: `## NEET 2026 Expected Cutoff Analysis\n\nBased on the analysis of previous years' trends, here are the expected cutoffs for NEET UG 2026.\n\n### Category-wise Expected Cutoffs\n\n| Category | Expected Cutoff Score | Expected Percentile |\n|----------|----------------------|---------------------|\n| General | 720-137 | 50th |\n| General-PwD | 136-121 | 45th |\n| OBC | 136-107 | 40th |\n| SC | 136-107 | 40th |\n| ST | 136-107 | 40th |\n\n### Factors Affecting Cutoffs\n\n1. **Exam Difficulty** — A harder exam typically lowers cutoffs\n2. **Number of Applicants** — 24+ lakh students registered in 2025\n3. **Seat Availability** — New medical colleges increase seats\n4. **Reservation Policy** — Category-wise seat distribution\n\n### Year-over-Year Comparison\n\n| Year | General Cutoff | Total Qualified |\n|------|---------------|------------------|\n| 2025 | 164 | 10,00,000+ |\n| 2024 | 137 | 11,44,600 |\n| 2023 | 137 | 10,80,000+ |\n\n### What Score Do You Need?\n\nFor top government medical colleges, you need **600+** marks. For private colleges, **400-500** is typically sufficient.`,
    faqs: [
      { question: "What is the expected NEET 2026 cutoff for General category?", answer: "The expected cutoff for General category is around 137 marks (50th percentile)." },
      { question: "Is 500 marks enough for NEET 2026?", answer: "500 marks can get you admission in many private medical colleges and some government colleges through state quota." },
    ],
  },
  {
    title: "Top 10 Government Medical Colleges in India — NEET AIQ Ranking",
    slug: "top-10-government-medical-colleges-india",
    category: "AIQ",
    tags: ["government colleges", "top colleges", "AIIMS", "ranking"],
    excerpt: "Comprehensive ranking of the top 10 government medical colleges in India based on NIRF rankings, faculty, infrastructure, and placement records.",
    isFeatured: true, viewCount: 6710,
    content: `## Top 10 Government Medical Colleges in India\n\n### 1. AIIMS New Delhi\n- **NIRF Rank**: #1\n- **Established**: 1956\n- **Annual Intake**: 107 MBBS seats\n- **Notable**: India's premier medical institution\n\n### 2. PGIMER Chandigarh\n- **NIRF Rank**: #2\n- **Established**: 1962\n- **Known for**: Excellent PG programs\n\n### 3. CMC Vellore\n- **NIRF Rank**: #3\n- **Established**: 1900\n- **Known for**: Research excellence\n\n### 4. NIMHANS Bangalore\n- **NIRF Rank**: #4\n- **Specialty**: Neurosciences & Mental Health\n\n### 5. JIPMER Puducherry\n- **NIRF Rank**: #5\n- **Established**: 1823\n- **Annual Intake**: 200 MBBS seats\n\n### 6-10. Other Notable Colleges\n\n| Rank | College | State |\n|------|---------|-------|\n| 6 | KMC Manipal | Karnataka |\n| 7 | Maulana Azad MC | Delhi |\n| 8 | BHU IMS | Uttar Pradesh |\n| 9 | Grant Medical College | Maharashtra |\n| 10 | Madras Medical College | Tamil Nadu |\n\n### How to Get Admission\n\nAdmission to these colleges requires a high NEET score (typically 650+) and participating in AIQ counselling.`,
    faqs: [
      { question: "What NEET score is needed for AIIMS Delhi?", answer: "You typically need 700+ marks and a rank under 100 for AIIMS New Delhi." },
      { question: "Are these colleges free?", answer: "Government colleges have very low fees, typically ₹10,000-₹50,000 per year for MBBS." },
    ],
  },
  {
    title: "State-wise NEET Counselling 2026 — Complete Calendar",
    slug: "state-wise-neet-counselling-2026-calendar",
    category: "State Counselling",
    tags: ["state counselling", "calendar", "schedule", "2026"],
    excerpt: "Complete state-wise NEET counselling schedule for 2026. Know the registration dates, choice filling, and allotment schedules for your state.",
    isTrending: true, viewCount: 3450,
    content: `## State-wise NEET Counselling 2026 Schedule\n\n### North India\n\n| State | Registration Opens | Round 1 Result |\n|-------|--------------------|----------------|\n| Delhi | July 15 | Aug 10 |\n| Uttar Pradesh | July 18 | Aug 15 |\n| Rajasthan | July 20 | Aug 12 |\n| Haryana | July 22 | Aug 18 |\n\n### South India\n\n| State | Registration Opens | Round 1 Result |\n|-------|--------------------|----------------|\n| Tamil Nadu | July 10 | Aug 5 |\n| Karnataka | July 12 | Aug 8 |\n| Kerala | July 15 | Aug 10 |\n| Andhra Pradesh | July 18 | Aug 12 |\n\n### Important Tips\n\n1. **Register early** — Don't wait for the last date\n2. **Keep documents ready** — Domicile certificate is mandatory\n3. **Fill maximum choices** — Increases your chances\n4. **Check state eligibility** — Some states have domicile requirements`,
    faqs: [
      { question: "Can I apply for counselling in multiple states?", answer: "You can only apply for state counselling in your domicile state, but you can also apply for AIQ counselling." },
    ],
  },
  {
    title: "Private Medical Colleges Under NEET 2026 — Fees, Seats & Cutoffs",
    slug: "private-medical-colleges-neet-2026-fees-cutoffs",
    category: "Private Colleges",
    tags: ["private colleges", "fees", "cutoffs", "deemed universities"],
    excerpt: "Complete guide to private medical colleges accepting NEET 2026 scores. Includes fee structure, seat matrix, and expected cutoffs.",
    viewCount: 5230,
    content: `## Private Medical Colleges — Complete Guide\n\n### Fee Structure Comparison\n\n| College Type | Annual Fees (Approx) |\n|-------------|---------------------|\n| Government | ₹10,000 - ₹50,000 |\n| Private | ₹5,00,000 - ₹25,00,000 |\n| Deemed | ₹10,00,000 - ₹30,00,000 |\n| Management Quota | ₹15,00,000 - ₹50,00,000 |\n\n### Top Private Colleges\n\n1. **KMC Manipal** — ₹9.8L/year\n2. **SRM Chennai** — ₹12L/year\n3. **Amrita Kochi** — ₹8L/year\n4. **JSS Mysore** — ₹7.5L/year\n5. **KIMSDU Karad** — ₹6L/year\n\n### Expected Cutoff Ranges\n\n- Top Private: 550-650 marks\n- Mid-range Private: 400-550 marks\n- Lower Private: 300-400 marks\n\n### Scholarship Opportunities\n\nMany private colleges offer merit scholarships for students scoring 600+ in NEET. Some offer up to 100% fee waiver.`,
    faqs: [
      { question: "What is the average fee of private medical colleges?", answer: "Average annual fees range from ₹5 lakh to ₹25 lakh depending on the college." },
      { question: "Is education loan available for private colleges?", answer: "Yes, most banks offer education loans for MBBS in recognized private colleges." },
    ],
  },
  {
    title: "NEET 2026 Latest News — NTA Updates & Important Notifications",
    slug: "neet-2026-latest-news-nta-updates",
    category: "News",
    tags: ["news", "NTA", "updates", "notifications"],
    excerpt: "Stay updated with the latest NEET 2026 news, NTA notifications, exam pattern changes, and important announcements.",
    isTrending: true, viewCount: 12400,
    content: `## NEET 2026 Latest Updates\n\n### Key Announcements\n\n- **Exam Date**: NEET UG 2026 confirmed for May 2026\n- **Pattern**: No changes in exam pattern — 200 MCQs, 720 marks\n- **Registration**: Online registration on nta.ac.in\n- **Languages**: Available in 13 languages\n\n### Recent Changes\n\n1. **ABDM Health ID** now mandatory for registration\n2. **Biometric verification** at exam centers\n3. **NTA Score** will be used for ranking\n\n### Important Links\n\n- NTA Official Website: nta.ac.in\n- NEET Portal: neet.nta.nic.in\n- MCC Counselling: mcc.nic.in`,
    faqs: [
      { question: "When is NEET 2026 exam date?", answer: "NEET UG 2026 is expected to be held in May 2026." },
      { question: "Has the NEET exam pattern changed for 2026?", answer: "No, the exam pattern remains the same — 200 MCQs with 720 total marks." },
    ],
  },
];

async function seed() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected!\n');

  for (const blog of blogs) {
    const exists = await Blog.findOne({ slug: blog.slug });
    if (exists) {
      console.log(`⏭️  Skipped (exists): ${blog.title}`);
      continue;
    }
    await Blog.create({
      ...blog,
      status: 'published',
      author: 'NEET Counselling Team',
      metaTitle: blog.title,
      metaDescription: blog.excerpt,
      keywords: blog.tags,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
    console.log(`✅ Created: ${blog.title}`);
  }

  console.log('\n🎉 Seeding complete!');
  await mongoose.disconnect();
}

seed().catch(console.error);
