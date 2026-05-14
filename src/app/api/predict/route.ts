import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Cutoff } from '@/lib/db/models/Cutoff';
import { College } from '@/lib/db/models/College'; // Ensure College is registered

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { rank, category } = body;

    const VALID_CATEGORIES = ['UR', 'OBC', 'SC', 'ST', 'EWS'];

    if (!rank || !category) {
      return NextResponse.json({ error: 'Rank and category are required' }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const numericRank = Number(rank);

    if (!Number.isInteger(numericRank) || numericRank < 1 || numericRank > 2000000) {
      return NextResponse.json({ error: 'Rank must be a positive integer up to 2,000,000' }, { status: 400 });
    }

    // Find cutoffs where the closing rank is >= user's rank (meaning they have a chance)
    // We sort by closingRank ascending so the closest matches appear first.
    const probableCutoffs = await Cutoff.find({
      closingRank: { $gte: numericRank },
      category: category
    })
    .populate('collegeId') // Resolves the college details
    .sort({ closingRank: 1 })
    .lean();

    // Map and deduplicate by collegeId in case multiple years/rounds matched
    const collegeMap = new Map();
    probableCutoffs.forEach((cutoff: any) => {
      if (cutoff.collegeId && !collegeMap.has(cutoff.collegeId._id.toString())) {
        collegeMap.set(cutoff.collegeId._id.toString(), {
          college: cutoff.collegeId,
          cutoffDetails: {
            year: cutoff.year,
            round: cutoff.round,
            quota: cutoff.quota,
            closingRank: cutoff.closingRank,
            score: cutoff.score
          }
        });
      }
    });

    const results = Array.from(collegeMap.values());

    return NextResponse.json({ 
      success: true, 
      total: results.length,
      data: results 
    });
  } catch (error: any) {
    console.error('Predict API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
